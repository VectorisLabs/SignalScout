---
baseline_schema: "2.0"
pack: "terraform-prod"
document: "introduction"
status: "active"
updated: "2026-09-14"
code_ref: "6b4d647"
---

# SignalScout Production Terraform Infrastructure - Introduction

## Scope

This documentation pack governs the Infrastructure as Code (IaC) implementation for the production deployment of SignalScout on AWS. It defines the module architecture, state management strategy, security boundaries, resource provisioning standards, and automated verification procedures required to build the target multi-agent platform.

The target environment is deployed to AWS region `ap-southeast-1` under the target profile `duykhiem`, adhering strictly to HashiCorp Terraform Style Guide, `terraform-skill`, `terraform-style-guide`, and the local `terraform-conventions.md` rules.

## Current Truth

SignalScout currently operates as a proven hackathon POC (Agentic AI Build Week runner-up). The running application is an OpenAI Responses API chat agent backed by an offline, deterministic `CasePackage` replay for Bed Bath & Beyond.

The production architecture has been comprehensively specified in `docs/production/` (supervisor-worker on Amazon Bedrock AgentCore, DynamoDB On-Demand, S3 Intelligent-Tiering, Langfuse Reflexion retry loop, and HTTP API Gateway). However, zero Terraform configurations currently exist in the repository.

The local development host runs Terraform v1.15.8 on Windows x64. The current AWS profile `duykhiem` is associated with IAM identity `arn:aws:iam::195969197570:user/pricing-mcp`, which is restricted to reading pricing catalogs and lacks administrative or S3 permissions. Consequently, initial verification and test-driven validation must execute offline using Terraform's native mock provider capabilities (`mock_provider "aws"`).

## Target

1. Modular Architecture: Deliver a clean, decoupled IaC layout separating reusable modules (`terraform/modules/`) from environment orchestration (`terraform/environments/prod/`).
2. Production Storage & Database: Provision an S3 bucket with Intelligent-Tiering and server-side encryption for immutable, multi-attempt raw news data (`C8`), alongside two On-Demand DynamoDB tables (`MarketThemes` and `PipelineState`) with PITR and encryption (`C9`, `C10`).
3. Security & Least Privilege: Provision AWS Secrets Manager for external provider keys and webhook signing secrets (`C17`), and configure separate, least-privilege IAM execution roles for Crawler, Management, Analysis, and Lambda handlers without wildcards (`C16`).
4. Compute & Ingestion API: Provision a dedicated Amazon API Gateway HTTP API for the Langfuse webhook (`C13`, `C19`, `C20`), the Lambda Webhook-Handler skeleton for atomic retry tracking (`C10`, `C11`), and Bedrock Guardrails attached to Analysis (`C12`) and Management (`O1-B`).
5. Observability: Configure CloudWatch Log Groups with retention policies, metric alarms for error and retry ceilings, and CloudTrail audit trails (`C18`).
6. Zero-Cost Test Coverage: Establish 100% automated test coverage across all modules and root prod configuration using `terraform test` (`*_unit_test.tftest.hcl`) with mock providers, validating schema, tags, encryption, and validation rules offline.

## Constraints

- Runtime Floor: Terraform v1.15.8 and AWS Provider v6.x.
- State Backend: S3 remote backend with S3 native lockfile (`use_lockfile = true`), eliminating DynamoDB state lock table overhead.
- Style Conventions: Absolutely zero `#` comments in `.tf` files per `terraform-conventions.md`. All technical explanations must reside in self-contained `description` fields.
- Resource Naming: Every AWS resource must declare an explicit human-readable name in the AWS Console via native `name`/`name_prefix` or `tags = { Name = ... }`.
- Execution Safety: Never run `terraform apply` autonomously. Changes must be planned, reviewed, and approved per request.

