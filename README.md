# TraPac TAS Spec-Driven Development Package

This package is structured for use with spec-driven development tools such as Amazon Kiro.

Files:
- `requirements.md` - product requirements, epics, user stories, and acceptance criteria
- `design.md` - architecture, services, domain model, APIs, workflows, security, observability
- `tasks.md` - implementation task backlog grouped by phase and capability

Recommended use:
1. Import or paste `requirements.md` into the spec tool as the primary requirements document.
2. Use `design.md` to guide architecture and code generation.
3. Use `tasks.md` to generate implementation stories, sprint backlog, and engineering tasks.

Note:
This is based on the TraPac TAS RFP requirements and includes optional AI-assisted operational intelligence as an enhancement layer. Core TAS functionality should remain the MVP priority.

---

## Local Development

### Prerequisites

| Tool       | Minimum version |
|------------|-----------------|
| Node.js    | 20.x            |
| npm        | 10.x            |

### Project structure

```
backend/    # Express + Prisma API (SQLite for local dev), runs on port 3001
frontend/   # Next.js 14 application, runs on port 3000
```

### 1. Install dependencies

```bash
# Install root, backend, and frontend dependencies
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configure the backend

The backend uses a local SQLite database by default. The `.env` file at `backend/.env` is pre-configured:

```
DATABASE_URL="file:./dev.db"
```

No additional environment configuration is needed to run locally.

### 3. Initialise the database

```bash
# Apply the Prisma schema and generate the client
cd backend
npx prisma migrate dev --name init

# (Optional) seed the database with test terminals, a trucking company, and a test user
npm run seed
```

### 4. Start the backend

```bash
# From the repo root
npm run dev:backend
# or directly
cd backend && npm run dev
```

The API will be available at `http://localhost:3001`.

Health check: `GET http://localhost:3001/api/health`

### 5. Start the frontend

Open a second terminal:

```bash
# From the repo root
npm run dev:frontend
# or directly
cd frontend && npm run dev
```

The UI will be available at `http://localhost:3000`.

### 6. Run tests

```bash
# Backend tests
npm run test:backend

# Frontend tests
npm run test:frontend
```

### Authentication (local)

The backend uses a simple auth middleware that reads a `x-user-id` header. Pass any user ID in requests during local development:

```bash
curl -H "x-user-id: testdispatcher" http://localhost:3001/api/appointments
```

---

## AWS Deployment

### Prerequisites

| Tool    | Minimum version |
|---------|-----------------|
| AWS CLI | 2.x             |
| Docker  | 24.x            |
| jq      | 1.6             |
| curl    | any             |

Your AWS principal needs permissions for: CloudFormation, ECS, ECR, RDS, ElastiCache, SQS, SNS, Cognito, S3, CloudFront, WAF, IAM, Secrets Manager, CloudWatch.

### Automated deployment via GitHub Actions

The repository includes a CI/CD workflow at `.github/workflows/main.yml` that triggers automatically on every push to the `main` branch.

**What it does:**

1. **Authenticates to AWS** using OpenID Connect (OIDC) — no long-lived credentials are stored in GitHub.  
   Role assumed: `arn:aws:iam::866176997550:role/GitHubActionsDeployRole`  
   Region: `ap-southeast-2`

2. **Deploys the CloudFormation stack** (`my-app-stack`) with the following parameters:

   | Parameter      | Value                                                      |
   |----------------|------------------------------------------------------------|
   | `Environment`  | `prod`                                                     |
   | `ECRBaseUrl`   | `866176997550.dkr.ecr.ap-southeast-2.amazonaws.com`        |
   | `DesiredCount` | `0` (scale up manually after confirming stack is healthy)  |

3. **Builds and pushes** a Docker image to ECR, then forces a new ECS deployment.

**GitHub Actions setup (one-time):**

1. Create an IAM role named `GitHubActionsDeployRole` in account `866176997550` with a trust policy that allows the GitHub OIDC provider (`token.actions.githubusercontent.com`) to assume it for this repository.
2. Attach the permissions listed under [Prerequisites](#prerequisites) above.
3. No GitHub secrets need to be stored — OIDC handles authentication automatically.

### Manual deployment via deploy.sh

```bash
# Deploy to the dev environment (ap-southeast-2 by default)
./deploy.sh --env dev --region ap-southeast-2

# Deploy to production with a specific image tag
./deploy.sh --env prod --image-tag v1.2.3 --region ap-southeast-2

# Deploy only the CloudFormation infrastructure (skip image build and ECS updates)
./deploy.sh --env qa --skip-build --skip-deploy --skip-smoke

# Use a named AWS CLI profile
./deploy.sh --env uat --profile my-aws-profile
```

### All deploy.sh options

```
-e, --env         dev | qa | uat | perf | prod | dr  (default: dev)
-r, --region      AWS region                          (default: us-west-2)
-s, --stack       CloudFormation stack name prefix    (default: trapac-tas-<env>)
-p, --profile     AWS CLI named profile               (default: default)
-i, --image-tag   Docker image tag to deploy          (default: latest)
--skip-build      Skip Docker image build and ECR push
--skip-infra      Skip CloudFormation stack create/update
--skip-deploy     Skip ECS service update and frontend S3 sync
--skip-smoke      Skip post-deployment smoke tests
```

### AWS infrastructure overview

The CloudFormation template (`infrastructure/cloudformation.yml`) provisions:

| Resource | Details |
|---|---|
| **VPC** | 2 public + 2 private subnets across 2 AZs, NAT Gateways |
| **ALB** | Internet-facing Application Load Balancer (+ optional WAF) |
| **WAF** | AWS Managed Rules (Common, SQLi, KnownBadInputs) + IP rate limit — enabled via `EnableWAF` |
| **ECS Fargate** | Cluster + service per microservice; optional circuit-breaker rollback via `EnableCircuitBreaker` |
| **ECR** | One repository per microservice; optional scan-on-push via `EnableECRScanOnPush` |
| **RDS PostgreSQL 16** | Multi-AZ in prod/dr, encrypted, Performance Insights |
| **ElastiCache Redis 7** | Multi-AZ in prod/dr, in-transit + at-rest encryption |
| **SQS** | Appointment events, TOS integration, notifications, audit queues; optional DLQ via `EnableDLQ` |
| **SNS** | Appointment events topic; optional fan-out to SQS via `EnableSNSFanout` |
| **Cognito** | User Pool with MFA, RBAC custom attributes |
| **S3 + CloudFront** | Frontend static assets with OAC, HTTPS redirect |
| **Secrets Manager** | DB connection, Redis connection, Cognito config |
| **CloudWatch** | Per-service log groups, CPU / DB / DLQ alarms |

### CloudFormation parameters

| Parameter             | Default         | Description |
|-----------------------|-----------------|-------------|
| `Environment`         | `dev`           | Deployment environment (`dev` / `qa` / `uat` / `perf` / `prod` / `dr`) |
| `ImageTag`            | `latest`        | Docker image tag for all microservice containers |
| `ECRBaseUrl`          | *(required)*    | ECR base URL, e.g. `123456789012.dkr.ecr.ap-southeast-2.amazonaws.com` |
| `DBPassword`          | *(required)*    | RDS master password (passed from Secrets Manager by `deploy.sh`) |
| `DBInstanceClass`     | `db.t3.medium`  | RDS instance class |
| `CacheNodeType`       | `cache.t3.medium` | ElastiCache Redis node type |
| `FargateTaskCPU`      | `512`           | CPU units per Fargate task |
| `FargateTaskMemory`   | `1024`          | Memory (MiB) per Fargate task |
| `DesiredCount`        | `2`             | Desired ECS task count per service (`0` to keep services stopped after initial stack creation) |
| `CertificateArn`      | *(empty)*       | ACM certificate ARN for HTTPS; leave blank for HTTP-only (non-production) |
| `AllowedCidr`         | `0.0.0.0/0`     | CIDR allowed to reach the ALB; restrict in production |
| `EnableWAF`           | `false`         | Deploy WAF WebACL with managed rule sets (recommended for prod) |
| `EnableCircuitBreaker`| `false`         | ECS deployment circuit-breaker with automatic rollback (recommended for prod) |
| `EnableECRScanOnPush` | `false`         | ECR image vulnerability scanning on push (recommended for prod) |
| `EnableSNSFanout`     | `false`         | Create SNS topic and SQS subscription for event fan-out (recommended for prod) |
| `EnableDLQ`           | `false`         | Attach Dead-Letter Queues to all SQS queues (recommended for prod) |

### Environments

| Name   | Purpose              | Multi-AZ | DB deletion protection |
|--------|----------------------|----------|------------------------|
| `dev`  | Development          | No       | No                     |
| `qa`   | QA / SIT             | No       | No                     |
| `uat`  | User Acceptance Test | No       | No                     |
| `perf` | Performance testing  | No       | No                     |
| `prod` | Production           | **Yes**  | **Yes**                |
| `dr`   | Disaster Recovery    | **Yes**  | **Yes**                |

### Secrets required before first deployment

Store the following secrets in AWS Secrets Manager before running `./deploy.sh` (or before triggering the GitHub Actions workflow for the first time):

```
/<env>/trapac-tas/db-password          # RDS master password
/<env>/trapac-tas/payment-gateway-key  # Payment gateway API key
/<env>/trapac-tas/tos-api-key          # TOS integration API key
```

Example (using AWS CLI):

```bash
aws secretsmanager create-secret \
  --name "/prod/trapac-tas/db-password" \
  --secret-string "$(openssl rand -base64 24)" \
  --region ap-southeast-2
```

### Recommended production parameters

When deploying to `prod`, pass these additional parameter overrides to enable all production-grade features:

```bash
./deploy.sh --env prod --region ap-southeast-2 --image-tag v1.0.0 \
  # EnableWAF, EnableCircuitBreaker, etc. are set via CloudFormation parameter overrides
```

Or via `aws cloudformation deploy` directly:

```bash
aws cloudformation deploy \
  --template-file infrastructure/cloudformation.yml \
  --stack-name trapac-tas-prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-southeast-2 \
  --parameter-overrides \
    Environment=prod \
    ECRBaseUrl=866176997550.dkr.ecr.ap-southeast-2.amazonaws.com \
    ImageTag=v1.0.0 \
    DBPassword=<from-secrets-manager> \
    DesiredCount=2 \
    EnableWAF=true \
    EnableCircuitBreaker=true \
    EnableECRScanOnPush=true \
    EnableSNSFanout=true \
    EnableDLQ=true \
    CertificateArn=<your-acm-cert-arn> \
    AllowedCidr=<your-allowed-cidr>
```

### File layout

```
deploy.sh                                   # Main deployment entry point
infrastructure/
  cloudformation.yml                        # Full AWS CloudFormation template
  ecs-task-definitions/                     # ECS task definition templates
    api-gateway.json
    identity-service.json
    appointment-service.json
    slot-service.json
    validation-service.json
    waitlist-service.json
    payment-service.json
    notification-service.json
    reporting-service.json
    tos-integration-service.json
    audit-service.json
  scripts/
    build-and-push.sh                       # Docker build + ECR push helper
    smoke-tests.sh                          # Post-deployment smoke tests
.github/
  workflows/
    main.yml                                # CI/CD: deploy to AWS on push to main
```
