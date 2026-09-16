---
baseline_schema: "2.0"
pack: "terraform-prod"
document: "introduction"
status: "complete"
updated: "2026-09-16"
code_ref: "b83f131"
---

# SignalScout Production Terraform Infrastructure - Introduction

## Scope
This documentation pack governs the Infrastructure as Code (IaC) implementation for the production deployment of SignalScout on AWS and local emulation on Floci. It defines the module architecture, state management strategy, security boundaries, resource provisioning standards, and automated verification procedures required to operate the target multi-agent platform.

The target environment deploys to AWS region `ap-southeast-1` under the target profile `duykhiem`, with full support for local testing via Floci (`http://localhost:4566`), adhering strictly to HashiCorp Terraform Style Guide, `terraform-skill`, `terraform-style-guide`, and the local `terraform-conventions.md` rules.

## Current Truth
SignalScout operates as a proven hackathon POC (Agentic AI Build Week runner-up). The production architecture is comprehensively specified in `docs/production/` (supervisor-worker on Amazon Bedrock AgentCore, DynamoDB On-Demand, S3 Intelligent-Tiering, Langfuse Reflexion retry loop, and HTTP API Gateway).

The production Terraform infrastructure has been fully built across five reusable modules (`signalscout-prod/terraform/modules/storage`, `database`, `security_iam`, `api_gateway_compute`, `observability`) and the root production orchestration environment (`signalscout-prod/terraform/environments/prod`).

All configurations have been validated (`terraform validate`), canonically formatted (`terraform fmt -check`), and verified offline with 100% passing tests via native `terraform test` and mock providers (`mock_provider "aws"`). A dual-mode configuration enables zero-cloud-cost testing via the Floci emulator on Docker alongside production AWS deployment, with 26 core resources successfully applied and verified on local Floci.

## Target
1. Modular Architecture: Deliver a clean, decoupled IaC layout separating reusable modules (`signalscout-prod/terraform/modules/`) from environment orchestration (`signalscout-prod/terraform/environments/prod/`).
2. Production Storage & Database: Provision an S3 bucket with Intelligent-Tiering and server-side encryption for immutable, multi-attempt raw news data (`C8`), alongside two On-Demand DynamoDB tables (`MarketThemes` and `PipelineState`) with PITR and encryption (`C9`, `C10`).
3. Security & Least Privilege: Provision AWS Secrets Manager for external provider keys and webhook signing secrets (`C17`), and configure separate, least-privilege IAM execution roles for Crawler, Management, Analysis, and Lambda handlers without wildcards (`C16`).
4. Compute & Ingestion API: Provision a dedicated Amazon API Gateway HTTP API for the Langfuse webhook (`C13`, `C19`, `C20`), the Lambda Webhook-Handler skeleton for atomic retry tracking (`C10`, `C11`), and Bedrock Guardrails attached to Analysis (`C12`) and Management (`O1-B`).
5. Observability: Configure CloudWatch Log Groups with retention policies, metric alarms for error and retry ceilings, and CloudTrail audit trails (`C18`).
6. Zero-Cost Test Coverage: Establish 100% automated test coverage across all modules and root prod configuration using `terraform test` (`*_unit_test.tftest.hcl`) with mock providers, validating schema, tags, encryption, and validation rules offline.
7. Local Emulation Dual-Mode: Provide complete capability to plan and apply on the local Floci emulator container (`http://localhost:4566`) without modifying module code or requiring live AWS credentials.

## Constraints
- Runtime Floor: Terraform v1.15.8 and AWS Provider v6.x.
- State Backend: Partial backend configuration with S3 remote backend supporting S3 native lockfile (`use_lockfile = true`) for AWS and local path-style S3 for Floci (`backend-floci.hcl`).
- Style Conventions: Absolutely zero `#` comments in `.tf` files per `terraform-conventions.md`. All technical explanations must reside in self-contained `description` fields.
- Resource Naming: Every AWS resource must declare an explicit human-readable name in the AWS Console via native `name`/`name_prefix` or `tags = { Name = ... }`.
- Execution Safety: Never run `terraform apply` autonomously. Changes must be planned, reviewed, and approved per request.
