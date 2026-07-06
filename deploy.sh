#!/usr/bin/env bash
# =============================================================================
# TraPac Terminal Appointment System — AWS Deployment Script
# =============================================================================
# Usage:
#   ./deploy.sh [OPTIONS]
#
# Options:
#   -e, --env         Environment name: dev | qa | uat | perf | prod | dr
#                     (default: dev)
#   -r, --region      AWS region  (default: us-west-2)
#   -s, --stack       CloudFormation stack name prefix
#                     (default: trapac-tas-<env>)
#   -p, --profile     AWS CLI named profile  (default: default)
#   -i, --image-tag   Docker image tag to deploy  (default: latest)
#   --skip-build      Skip building and pushing Docker images
#   --skip-infra      Skip CloudFormation stack update/create
#   --skip-deploy     Skip ECS service update
#   --skip-smoke      Skip post-deployment smoke tests
#   -h, --help        Show this help message and exit
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
ENV="dev"
REGION="us-west-2"
STACK_PREFIX=""
PROFILE="default"
IMAGE_TAG="latest"
SKIP_BUILD=false
SKIP_INFRA=false
SKIP_DEPLOY=false
SKIP_SMOKE=false

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="${SCRIPT_DIR}/infrastructure"
CFN_TEMPLATE="${INFRA_DIR}/cloudformation.yml"
TASK_DEFS_DIR="${INFRA_DIR}/ecs-task-definitions"
HELPERS_DIR="${INFRA_DIR}/scripts"

# ---------------------------------------------------------------------------
# Colors
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()     { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()   { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()  { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
usage() {
  head -32 "${BASH_SOURCE[0]}" | tail -27
  exit 0
}

while [[ $# -gt 0 ]]; do
  case $1 in
    -e|--env)         ENV="$2";        shift 2 ;;
    -r|--region)      REGION="$2";     shift 2 ;;
    -s|--stack)       STACK_PREFIX="$2"; shift 2 ;;
    -p|--profile)     PROFILE="$2";    shift 2 ;;
    -i|--image-tag)   IMAGE_TAG="$2";  shift 2 ;;
    --skip-build)     SKIP_BUILD=true; shift ;;
    --skip-infra)     SKIP_INFRA=true; shift ;;
    --skip-deploy)    SKIP_DEPLOY=true; shift ;;
    --skip-smoke)     SKIP_SMOKE=true; shift ;;
    -h|--help)        usage ;;
    *) error "Unknown option: $1. Run with -h for help." ;;
  esac
done

VALID_ENVS=("dev" "qa" "uat" "perf" "prod" "dr")
if [[ ! " ${VALID_ENVS[*]} " =~ " ${ENV} " ]]; then
  error "Invalid environment '${ENV}'. Must be one of: ${VALID_ENVS[*]}"
fi

[[ -z "${STACK_PREFIX}" ]] && STACK_PREFIX="trapac-tas-${ENV}"

STACK_NAME="${STACK_PREFIX}"
ECR_BASE_URL=""  # Resolved after prerequisite check

# ---------------------------------------------------------------------------
# Microservice names (must match ECS task definitions and ECR repo names)
# ---------------------------------------------------------------------------
SERVICES=(
  "api-gateway"
  "identity-service"
  "appointment-service"
  "slot-service"
  "validation-service"
  "waitlist-service"
  "payment-service"
  "notification-service"
  "reporting-service"
  "tos-integration-service"
  "audit-service"
)

FRONTEND_SERVICE="web-frontend"

# ---------------------------------------------------------------------------
# Prerequisites check
# ---------------------------------------------------------------------------
check_prerequisites() {
  log "Checking prerequisites..."

  local required_tools=("aws" "docker" "jq" "curl")
  for tool in "${required_tools[@]}"; do
    if ! command -v "${tool}" &>/dev/null; then
      error "Required tool not found: ${tool}"
    fi
  done

  # Validate AWS credentials
  if ! aws sts get-caller-identity --profile "${PROFILE}" --region "${REGION}" &>/dev/null; then
    error "AWS credentials are invalid or expired for profile '${PROFILE}'."
  fi

  ACCOUNT_ID=$(aws sts get-caller-identity \
    --profile "${PROFILE}" --region "${REGION}" \
    --query Account --output text)

  ECR_BASE_URL="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

  ok "AWS Account: ${ACCOUNT_ID} | Region: ${REGION} | Env: ${ENV}"
}

# ---------------------------------------------------------------------------
# Build and push Docker images to ECR
# ---------------------------------------------------------------------------
build_and_push_images() {
  if [[ "${SKIP_BUILD}" == true ]]; then
    warn "Skipping image build (--skip-build)."
    return
  fi

  log "Logging in to ECR..."
  aws ecr get-login-password \
    --profile "${PROFILE}" --region "${REGION}" \
    | docker login --username AWS --password-stdin "${ECR_BASE_URL}"

  log "Building and pushing images (tag: ${IMAGE_TAG})..."
  bash "${HELPERS_DIR}/build-and-push.sh" \
    --ecr-base-url "${ECR_BASE_URL}" \
    --image-tag    "${IMAGE_TAG}" \
    --services     "${SERVICES[*]} ${FRONTEND_SERVICE}" \
    --env          "${ENV}"
}

# ---------------------------------------------------------------------------
# Deploy CloudFormation stack
# ---------------------------------------------------------------------------
deploy_infrastructure() {
  if [[ "${SKIP_INFRA}" == true ]]; then
    warn "Skipping infrastructure deployment (--skip-infra)."
    return
  fi

  log "Deploying CloudFormation stack: ${STACK_NAME}..."

  local db_password_param
  db_password_param=$(retrieve_secret "/${ENV}/trapac-tas/db-password")

  aws cloudformation deploy \
    --profile           "${PROFILE}" \
    --region            "${REGION}" \
    --template-file     "${CFN_TEMPLATE}" \
    --stack-name        "${STACK_NAME}" \
    --capabilities      CAPABILITY_NAMED_IAM \
    --no-fail-on-empty-changeset \
    --parameter-overrides \
        Environment="${ENV}" \
        ImageTag="${IMAGE_TAG}" \
        ECRBaseUrl="${ECR_BASE_URL}" \
        DBPassword="${db_password_param}" \
    --tags \
        Project=trapac-tas \
        Environment="${ENV}" \
        ManagedBy=deploy-script

  ok "CloudFormation stack deployed successfully."
}

# ---------------------------------------------------------------------------
# Resolve Secret ARNs from Secrets Manager and inject into task definitions
# ---------------------------------------------------------------------------
resolve_secret_arns() {
  log "Resolving Secrets Manager ARNs for environment '${ENV}'..."

  DB_SECRET_ARN=$(aws secretsmanager describe-secret \
    --profile    "${PROFILE}" \
    --region     "${REGION}" \
    --secret-id  "/${ENV}/trapac-tas/db-connection" \
    --query      "ARN" \
    --output     text 2>/dev/null || echo "")

  REDIS_SECRET_ARN=$(aws secretsmanager describe-secret \
    --profile    "${PROFILE}" \
    --region     "${REGION}" \
    --secret-id  "/${ENV}/trapac-tas/redis-connection" \
    --query      "ARN" \
    --output     text 2>/dev/null || echo "")

  COGNITO_SECRET_ARN=$(aws secretsmanager describe-secret \
    --profile    "${PROFILE}" \
    --region     "${REGION}" \
    --secret-id  "/${ENV}/trapac-tas/cognito" \
    --query      "ARN" \
    --output     text 2>/dev/null || echo "")

  if [[ -z "${DB_SECRET_ARN}" || -z "${REDIS_SECRET_ARN}" || -z "${COGNITO_SECRET_ARN}" ]]; then
    warn "One or more Secrets Manager ARNs could not be resolved. " \
         "Deploy the CloudFormation stack first (deploy.sh --skip-deploy)."
  else
    ok "Secrets resolved: DB=${DB_SECRET_ARN}"
    ok "               Redis=${REDIS_SECRET_ARN}"
    ok "             Cognito=${COGNITO_SECRET_ARN}"
  fi
}


# ---------------------------------------------------------------------------
deploy_services() {
  if [[ "${SKIP_DEPLOY}" == true ]]; then
    warn "Skipping ECS service deployment (--skip-deploy)."
    return
  fi

  log "Forcing new ECS task deployments..."

  local cluster_name="${STACK_PREFIX}-cluster"

  for svc in "${SERVICES[@]}"; do
    local ecs_svc_name="${STACK_PREFIX}-${svc}"
    log "  Updating service: ${ecs_svc_name}"

    # Register a new task definition revision with the latest image
    register_task_definition "${svc}"

    aws ecs update-service \
      --profile           "${PROFILE}" \
      --region            "${REGION}" \
      --cluster           "${cluster_name}" \
      --service           "${ecs_svc_name}" \
      --task-definition   "${STACK_PREFIX}-${svc}" \
      --force-new-deployment \
      --output text \
      --query "service.serviceName" \
    | xargs -I{} log "    Triggered deployment for: {}"
  done

  log "Waiting for all services to reach steady state (timeout: 10 min)..."
  for svc in "${SERVICES[@]}"; do
    local ecs_svc_name="${STACK_PREFIX}-${svc}"
    aws ecs wait services-stable \
      --profile  "${PROFILE}" \
      --region   "${REGION}" \
      --cluster  "${cluster_name}" \
      --services "${ecs_svc_name}" &
  done
  wait

  ok "All ECS services are stable."
}

# ---------------------------------------------------------------------------
# Register ECS task definition with the current image tag
# ---------------------------------------------------------------------------
register_task_definition() {
  local svc="$1"
  local task_def_file="${TASK_DEFS_DIR}/${svc}.json"

  if [[ ! -f "${task_def_file}" ]]; then
    warn "Task definition file not found: ${task_def_file}. Skipping registration."
    return
  fi

  local image="${ECR_BASE_URL}/${STACK_PREFIX}-${svc}:${IMAGE_TAG}"

  # Replace placeholders in the template and register
  local rendered
  rendered=$(jq \
    --arg family     "${STACK_PREFIX}-${svc}" \
    --arg image      "${image}" \
    --arg env        "${ENV}" \
    --arg region     "${REGION}" \
    --arg stack      "${STACK_PREFIX}" \
    --arg db_arn     "${DB_SECRET_ARN:-PLACEHOLDER_DB_SECRET_ARN}" \
    --arg redis_arn  "${REDIS_SECRET_ARN:-PLACEHOLDER_REDIS_SECRET_ARN}" \
    --arg cognito_arn "${COGNITO_SECRET_ARN:-PLACEHOLDER_COGNITO_SECRET_ARN}" \
    '.family = $family
     | .containerDefinitions[0].image = $image
     | .containerDefinitions[0].environment += [{"name":"APP_ENV","value":$env}]
     | .executionRoleArn = "arn:aws:iam::'"${ACCOUNT_ID}"':role/'"${STACK_PREFIX}"'-ecs-execution-role"
     | .taskRoleArn      = "arn:aws:iam::'"${ACCOUNT_ID}"':role/'"${STACK_PREFIX}"'-'"${svc}"'-task-role"
     | (.containerDefinitions[0].secrets[] | select(.name == "DB_CONNECTION")).valueFrom    = $db_arn
     | (.containerDefinitions[0].secrets[] | select(.name == "REDIS_CONNECTION")).valueFrom = $redis_arn
     | (.containerDefinitions[0].secrets[] | select(.name == "COGNITO_CONFIG")).valueFrom   = $cognito_arn
     | (.containerDefinitions[0].logConfiguration.options."awslogs-group") = "/ecs/\($stack)/'"${svc}"'"
     | (.containerDefinitions[0].logConfiguration.options."awslogs-region") = $region' \
    "${task_def_file}")

  echo "${rendered}" \
    | aws ecs register-task-definition \
        --profile "${PROFILE}" \
        --region  "${REGION}" \
        --cli-input-json file:///dev/stdin \
        --query  "taskDefinition.taskDefinitionArn" \
        --output text \
    | xargs -I{} log "    Registered task definition: {}"
}

# ---------------------------------------------------------------------------
# Deploy frontend to S3 and invalidate CloudFront
# ---------------------------------------------------------------------------
deploy_frontend() {
  if [[ "${SKIP_DEPLOY}" == true ]]; then
    return
  fi

  local frontend_dir="${SCRIPT_DIR}/frontend/out"
  if [[ ! -d "${frontend_dir}" ]]; then
    warn "Frontend build directory not found (${frontend_dir}). Skipping frontend deploy."
    warn "Run 'cd frontend && npm run build' first, or pass --skip-build to skip this step."
    return
  fi

  local bucket_name
  bucket_name=$(aws cloudformation describe-stacks \
    --profile   "${PROFILE}" \
    --region    "${REGION}" \
    --stack-name "${STACK_NAME}" \
    --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
    --output text)

  local distribution_id
  distribution_id=$(aws cloudformation describe-stacks \
    --profile   "${PROFILE}" \
    --region    "${REGION}" \
    --stack-name "${STACK_NAME}" \
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
    --output text)

  log "Syncing frontend build to s3://${bucket_name}..."
  aws s3 sync "${frontend_dir}" "s3://${bucket_name}" \
    --profile "${PROFILE}" \
    --region  "${REGION}" \
    --delete \
    --cache-control "public,max-age=31536000" \
    --exclude "*.html" \
    --exclude "service-worker.js"

  # HTML and service worker should not be cached aggressively
  aws s3 sync "${frontend_dir}" "s3://${bucket_name}" \
    --profile "${PROFILE}" \
    --region  "${REGION}" \
    --delete \
    --cache-control "no-cache" \
    --include "*.html" \
    --include "service-worker.js"

  log "Invalidating CloudFront distribution ${distribution_id}..."
  aws cloudfront create-invalidation \
    --profile        "${PROFILE}" \
    --distribution-id "${distribution_id}" \
    --paths "/*" \
    --output text \
    --query "Invalidation.Id" \
  | xargs -I{} ok "  CloudFront invalidation created: {}"
}

# ---------------------------------------------------------------------------
# Post-deployment smoke tests
# ---------------------------------------------------------------------------
run_smoke_tests() {
  if [[ "${SKIP_SMOKE}" == true ]]; then
    warn "Skipping smoke tests (--skip-smoke)."
    return
  fi

  log "Running post-deployment smoke tests..."
  bash "${HELPERS_DIR}/smoke-tests.sh" \
    --env    "${ENV}" \
    --stack  "${STACK_NAME}" \
    --profile "${PROFILE}" \
    --region "${REGION}"
}

# ---------------------------------------------------------------------------
# Retrieve a secret value from AWS Secrets Manager
# ---------------------------------------------------------------------------
retrieve_secret() {
  local secret_name="$1"
  aws secretsmanager get-secret-value \
    --profile    "${PROFILE}" \
    --region     "${REGION}" \
    --secret-id  "${secret_name}" \
    --query      "SecretString" \
    --output     text 2>/dev/null || echo ""
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
  echo ""
  echo "=============================================="
  echo " TraPac TAS — AWS Deployment"
  echo " Environment : ${ENV}"
  echo " Region      : ${REGION}"
  echo " Stack       : ${STACK_NAME}"
  echo " Image tag   : ${IMAGE_TAG}"
  echo " AWS Profile : ${PROFILE}"
  echo "=============================================="
  echo ""

  check_prerequisites
  build_and_push_images
  deploy_infrastructure
  resolve_secret_arns
  deploy_services
  deploy_frontend
  run_smoke_tests

  echo ""
  ok "=============================================="
  ok " Deployment complete!"
  ok " Environment : ${ENV}"
  ok " Stack       : ${STACK_NAME}"
  ok "=============================================="
  echo ""
}

main
