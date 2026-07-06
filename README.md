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

## AWS Deployment

### Prerequisites

| Tool    | Minimum version |
|---------|-----------------|
| AWS CLI | 2.x             |
| Docker  | 24.x            |
| jq      | 1.6             |
| curl    | any             |

Your AWS principal needs permissions for: CloudFormation, ECS, ECR, RDS, ElastiCache, SQS, SNS, Cognito, S3, CloudFront, WAF, IAM, Secrets Manager, CloudWatch.

### Quick start

```bash
# Deploy to the dev environment (us-west-2 by default)
./deploy.sh --env dev

# Deploy to production with a specific image tag
./deploy.sh --env prod --image-tag v1.2.3 --region us-west-2

# Deploy only the CloudFormation infrastructure (skip image build and ECS updates)
./deploy.sh --env qa --skip-build --skip-deploy --skip-smoke

# Use a named AWS CLI profile
./deploy.sh --env uat --profile my-aws-profile
```

### All options

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
| **ALB** | Internet-facing Application Load Balancer with WAF |
| **WAF** | AWS Managed Rules (Common, SQLi, KnownBadInputs) + IP rate limit |
| **ECS Fargate** | Cluster + service per microservice with circuit-breaker rollback |
| **ECR** | One repository per microservice, scan-on-push enabled |
| **RDS PostgreSQL 16** | Multi-AZ in prod/dr, encrypted, Performance Insights |
| **ElastiCache Redis 7** | Multi-AZ in prod/dr, in-transit + at-rest encryption |
| **SQS** | Appointment events, TOS integration, notifications, audit queues + DLQ |
| **SNS** | Appointment events topic (fan-out to SQS) |
| **Cognito** | User Pool with MFA, RBAC custom attributes |
| **S3 + CloudFront** | Frontend static assets with OAC, HTTPS redirect |
| **Secrets Manager** | DB connection, Redis connection, Cognito config |
| **CloudWatch** | Per-service log groups, CPU / DB / DLQ alarms |

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

Store the following secrets in AWS Secrets Manager before running `./deploy.sh`:

```
/<env>/trapac-tas/db-password          # RDS master password
/<env>/trapac-tas/payment-gateway-key  # Payment gateway API key
/<env>/trapac-tas/tos-api-key          # TOS integration API key
```

Example (using AWS CLI):

```bash
aws secretsmanager create-secret \
  --name "/dev/trapac-tas/db-password" \
  --secret-string "$(openssl rand -base64 24)"
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
```
