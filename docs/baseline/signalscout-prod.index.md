---
baseline_schema: "2.0"
pack: "signalscout-prod"
document: "index"
status: "active"
updated: "2026-09-16"
code_ref: "b83f131"
---

# SignalScout Production Initiative - Index

## Scope
This initiative governs the production AWS Cloud-Native implementation for the SignalScout platform. It defines cross-pack dependencies, operational checkpoints, and execution coupling across infrastructure provisioning, serverless webhook ingestion, and Bedrock AgentCore multi-agent intelligence.

## Packs

| Pack | Scope | Depends on | Status | Next checkpoint |
|---|---|---|---|---|
| `repo-restructure` | Monorepo isolation | - | complete | Completed in commits 15401f9 and b83f131 |
| `terraform-prod` | AWS IaC & Floci emulation | `repo-restructure` | complete | Production deployment on AWS |
| `lambda-prod` | Webhook ingestion & routing | `terraform-prod` | draft | Implement Langfuse webhook handler |
| `agentcore-prod` | Bedrock Strands multi-agent | `terraform-prod`, `lambda-prod` | draft | Implement Strands supervisor-worker runtime |

## Cross-Pack Dependencies and Checkpoints

- `terraform-prod` to `lambda-prod`: The Terraform module `signalscout-prod/terraform/modules/api_gateway_compute` provisions HTTP API Gateway endpoints and IAM execution roles required by Lambda handlers. The next checkpoint is finalizing Lambda packaging and environment variable bindings.
- `terraform-prod` to `agentcore-prod`: Terraform provisions Bedrock Guardrails, S3 buckets, DynamoDB tables, and IAM execution roles for AgentCore Runtimes. The next checkpoint is attaching execution roles to AgentCore Runtimes.
- `lambda-prod` to `agentcore-prod`: The Lambda Webhook-Handler invokes the `agentcore-prod` Management runtime via `bedrock-agentcore:InvokeAgentRuntime` during initial triggers and Reflexion retries, passing `runtimeSessionId` and evaluation `critique`. The next checkpoint is validating the contract between Langfuse webhook events and agent session payloads.
- `repo-restructure` prerequisite: Establishes structural separation between `signalscout-poc/` and `signalscout-prod/`, providing clean isolated target locations in `signalscout-prod/terraform/`, `signalscout-prod/lambdas/`, and `signalscout-prod/agents/`.

