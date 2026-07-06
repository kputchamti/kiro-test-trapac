#!/usr/bin/env bash
# =============================================================================
# setup-ecr.sh
# Creates ECR repositories for all TraPac TAS microservices.
# Run ONCE before the first deploy.sh execution.
#
# Usage:
#   ./infrastructure/scripts/setup-ecr.sh [OPTIONS]
#
# Options:
#   -e, --env       Environment name: dev | qa | uat | perf | prod | dr
#                   (default: dev)
#   -r, --region    AWS region  (default: us-west-2)
#   -p, --profile   AWS CLI named profile  (default: default)
#   -h, --help      Show this help message
# =============================================================================

set -euo pipefail

ENV="dev"
REGION="us-west-2"
PROFILE="default"

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()   { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

usage() {
  head -20 "${BASH_SOURCE[0]}" | tail -15
  exit 0
}

while [[ $# -gt 0 ]]; do
  case $1 in
    -e|--env)     ENV="$2";     shift 2 ;;
    -r|--region)  REGION="$2";  shift 2 ;;
    -p|--profile) PROFILE="$2"; shift 2 ;;
    -h|--help)    usage ;;
    *) error "Unknown option: $1" ;;
  esac
done

STACK_PREFIX="trapac-tas-${ENV}"

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
  "web-frontend"
)

# Validate credentials
if ! aws sts get-caller-identity --profile "${PROFILE}" --region "${REGION}" &>/dev/null; then
  error "AWS credentials invalid or expired for profile '${PROFILE}'."
fi

ACCOUNT_ID=$(aws sts get-caller-identity \
  --profile "${PROFILE}" --region "${REGION}" \
  --query Account --output text)

log "Creating ECR repositories for environment '${ENV}' in ${REGION} (account: ${ACCOUNT_ID})..."
echo ""

SCAN_ON_PUSH="false"
[[ "${ENV}" == "prod" || "${ENV}" == "dr" ]] && SCAN_ON_PUSH="true"

for svc in "${SERVICES[@]}"; do
  repo_name="${STACK_PREFIX}-${svc}"

  # Check if repo already exists
  if aws ecr describe-repositories \
       --profile "${PROFILE}" --region "${REGION}" \
       --repository-names "${repo_name}" &>/dev/null; then
    warn "Repository already exists: ${repo_name}"
    continue
  fi

  aws ecr create-repository \
    --profile           "${PROFILE}" \
    --region            "${REGION}" \
    --repository-name   "${repo_name}" \
    --image-tag-mutability MUTABLE \
    --image-scanning-configuration scanOnPush=${SCAN_ON_PUSH} \
    --encryption-configuration encryptionType=AES256 \
    --output text \
    --query "repository.repositoryUri" \
  | xargs -I{} ok "Created: {}"

  # Apply a lifecycle policy: keep the last 10 tagged images and remove untagged after 1 day
  aws ecr put-lifecycle-policy \
    --profile         "${PROFILE}" \
    --region          "${REGION}" \
    --repository-name "${repo_name}" \
    --lifecycle-policy-text '{
      "rules": [
        {
          "rulePriority": 1,
          "description": "Remove untagged images after 1 day",
          "selection": {
            "tagStatus": "untagged",
            "countType": "sinceImagePushed",
            "countUnit": "days",
            "countNumber": 1
          },
          "action": { "type": "expire" }
        },
        {
          "rulePriority": 2,
          "description": "Keep last 10 tagged images",
          "selection": {
            "tagStatus": "tagged",
            "tagPrefixList": [""],
            "countType": "imageCountMoreThan",
            "countNumber": 10
          },
          "action": { "type": "expire" }
        }
      ]
    }' &>/dev/null
done

echo ""
ok "ECR setup complete for environment '${ENV}'."
log "ECR base URL: ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
