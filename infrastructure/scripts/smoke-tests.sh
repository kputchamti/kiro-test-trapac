#!/usr/bin/env bash
# =============================================================================
# smoke-tests.sh
# Post-deployment smoke tests for TraPac TAS.
# Called by deploy.sh after a successful deployment.
# =============================================================================

set -euo pipefail

ENV="dev"
STACK_NAME=""
PROFILE="default"
REGION="us-west-2"

while [[ $# -gt 0 ]]; do
  case $1 in
    --env)     ENV="$2";        shift 2 ;;
    --stack)   STACK_NAME="$2"; shift 2 ;;
    --profile) PROFILE="$2";    shift 2 ;;
    --region)  REGION="$2";     shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

PASS=0
FAIL=0

ok()   { echo -e "\033[0;32m[PASS]\033[0m $*"; ((PASS++)); }
fail() { echo -e "\033[0;31m[FAIL]\033[0m $*"; ((FAIL++)); }

# Retrieve the ALB DNS name from CloudFormation outputs
ALB_DNS=$(aws cloudformation describe-stacks \
  --profile    "${PROFILE}" \
  --region     "${REGION}" \
  --stack-name "${STACK_NAME}" \
  --query "Stacks[0].Outputs[?OutputKey=='ALBDNSName'].OutputValue" \
  --output text)

BASE_URL="http://${ALB_DNS}"

echo ""
echo "Running smoke tests against: ${BASE_URL}"
echo "Environment: ${ENV}"
echo "-------------------------------------------"

# Helper: perform an HTTP GET and check the response code
check_endpoint() {
  local description="$1"
  local path="$2"
  local expected_code="${3:-200}"

  local actual_code
  actual_code=$(curl --silent --output /dev/null \
    --write-out "%{http_code}" \
    --max-time 10 \
    "${BASE_URL}${path}" || echo "000")

  if [[ "${actual_code}" == "${expected_code}" ]]; then
    ok "${description} → HTTP ${actual_code}"
  else
    fail "${description} → expected HTTP ${expected_code}, got ${actual_code}"
  fi
}

# --- API Gateway health check ---
check_endpoint "API Gateway health"             "/health"

# --- Service-level health checks via API Gateway routes ---
check_endpoint "Identity service health"        "/api/identity/health"
check_endpoint "Appointment service health"     "/api/appointments/health"
check_endpoint "Slot service health"            "/api/slots/health"
check_endpoint "Validation service health"      "/api/validation/health"
check_endpoint "Waitlist service health"        "/api/waitlist/health"
check_endpoint "Payment service health"         "/api/payments/health"
check_endpoint "Notification service health"    "/api/notifications/health"
check_endpoint "Reporting service health"       "/api/reports/health"
check_endpoint "TOS integration service health" "/api/tos/health"
check_endpoint "Audit service health"           "/api/audit/health"

# --- Unauthenticated endpoints should return 401, not 500 ---
check_endpoint "Appointments requires auth"     "/api/appointments"  "401"
check_endpoint "Slots requires auth"            "/api/slots/availability" "401"

# --- Frontend ---
CF_DOMAIN=$(aws cloudformation describe-stacks \
  --profile    "${PROFILE}" \
  --region     "${REGION}" \
  --stack-name "${STACK_NAME}" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomain'].OutputValue" \
  --output text)

if [[ -n "${CF_DOMAIN}" ]]; then
  actual_code=$(curl --silent --output /dev/null \
    --write-out "%{http_code}" \
    --max-time 15 \
    "https://${CF_DOMAIN}/" || echo "000")
  if [[ "${actual_code}" == "200" ]]; then
    ok "Frontend (CloudFront) → HTTP ${actual_code}"
  else
    fail "Frontend (CloudFront) → expected HTTP 200, got ${actual_code}"
  fi
else
  fail "CloudFront domain not found in stack outputs"
fi

# --- Summary ---
echo ""
echo "-------------------------------------------"
echo "Smoke test results: ${PASS} passed, ${FAIL} failed"
echo "-------------------------------------------"

if [[ "${FAIL}" -gt 0 ]]; then
  echo -e "\033[0;31m[ERROR] Smoke tests failed. Review deployment.\033[0m" >&2
  exit 1
fi

echo -e "\033[0;32m[OK] All smoke tests passed.\033[0m"
