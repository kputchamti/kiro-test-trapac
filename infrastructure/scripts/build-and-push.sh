#!/usr/bin/env bash
# =============================================================================
# build-and-push.sh
# Builds Docker images for all TraPac TAS microservices and pushes to ECR.
# Called by deploy.sh — do not invoke directly unless you know what you're doing.
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

ECR_BASE_URL=""
IMAGE_TAG="latest"
SERVICES_STRING=""
ENV="dev"

while [[ $# -gt 0 ]]; do
  case $1 in
    --ecr-base-url) ECR_BASE_URL="$2"; shift 2 ;;
    --image-tag)    IMAGE_TAG="$2";    shift 2 ;;
    --services)     SERVICES_STRING="$2"; shift 2 ;;
    --env)          ENV="$2";          shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

read -ra SERVICES <<< "${SERVICES_STRING}"

build_and_push() {
  local svc="$1"
  local dockerfile="${REPO_ROOT}/services/${svc}/Dockerfile"
  local context_dir="${REPO_ROOT}/services/${svc}"

  # For the web-frontend, use the frontend directory
  if [[ "${svc}" == "web-frontend" ]]; then
    dockerfile="${REPO_ROOT}/frontend/Dockerfile"
    context_dir="${REPO_ROOT}/frontend"
  fi

  # For the api-gateway (monolith phase), use the backend directory
  if [[ "${svc}" == "api-gateway" ]]; then
    dockerfile="${REPO_ROOT}/backend/Dockerfile"
    context_dir="${REPO_ROOT}/backend"
  fi

  if [[ ! -f "${dockerfile}" ]]; then
    echo "[WARN] Dockerfile not found for ${svc} (${dockerfile}). Skipping." >&2
    return
  fi

  local ecr_repo="${ECR_BASE_URL}/trapac-tas-${ENV}-${svc}"
  local full_image="${ecr_repo}:${IMAGE_TAG}"
  local sha_tag
  sha_tag=$(git -C "${REPO_ROOT}" rev-parse --short HEAD 2>/dev/null || echo "unknown")

  echo "[INFO] Building ${svc} → ${full_image}"
  docker build \
    --file    "${dockerfile}" \
    --tag     "${full_image}" \
    --tag     "${ecr_repo}:${sha_tag}" \
    --label   "git-sha=${sha_tag}" \
    --label   "environment=${ENV}" \
    --build-arg APP_ENV="${ENV}" \
    "${context_dir}"

  echo "[INFO] Pushing ${full_image}"
  docker push "${full_image}"
  docker push "${ecr_repo}:${sha_tag}"

  echo "[OK]  ${svc} pushed successfully."
}

for svc in "${SERVICES[@]}"; do
  build_and_push "${svc}"
done
