---
baseline_schema: "2.0"
pack: "terraform-prod"
document: "hallucination"
status: "active"
updated: "2026-09-14"
code_ref: "6b4d647"
---

# SignalScout Production Terraform Infrastructure - Decision Register

## Register

### TP-D01: S3 State Backend with Native Lockfile
- Decision: Configure remote S3 state backend with S3 native lockfile (`use_lockfile = true`) for production state storage.
- Why: Native S3 locking is built into Terraform 1.15.8 (supported since 1.10+), providing strong consistency and encryption without requiring the creation, management, or cost of a dedicated DynamoDB state locking table.
- What breaks if ignored: Concurrent Terraform operations risk corrupting the remote state file, or redundant cloud costs are incurred by maintaining an unnecessary DynamoDB lock table.
- Rejected alternative: Local state - rejected because it violates production safety and prevents multi-engineer collaboration; DynamoDB lock table - rejected because native S3 locking supersedes it with zero extra infrastructure.

### TP-D02: Modular Directory Structure
- Decision: Organize Terraform code into reusable modules under `terraform/modules/` consumed by an environment configuration under `terraform/environments/prod/`.
- Why: Decouples component lifecycles, restricts blast radius during changes, allows isolated unit testing via `terraform test`, and enables future multi-environment expansion (staging/dev) without copy-pasting resource definitions.
- What breaks if ignored: Monolithic flat configurations couple disparate lifecycles, increase blast radius, cause identity churn on refactoring, and prevent isolated module-level testing.
- Rejected alternative: Single flat `terraform/` directory containing all resources - rejected because it fails modular testing and creates excessive blast radius.

### TP-D03: Offline Verification via Mock Providers
- Decision: Validate all module and root configurations offline using native `terraform test` in `command = plan` mode with `mock_provider "aws"`.
- Why: The local AWS profile `duykhiem` is currently mapped to an IAM user (`pricing-mcp`) restricted to pricing API queries, and mock testing allows 100% verification of schemas, attributes, tags, encryption, and validation rules without needing live AWS credentials or incurring infrastructure charges.
- What breaks if ignored: Local test commands fail with AWS `AccessDenied` errors, blocking development velocity and pre-commit validation.
- Rejected alternative: Terratest - rejected because it requires Go dependencies and live infrastructure provisioning; plan validation without mocks - rejected because it fails immediately on missing AWS credentials.

### TP-D04: Zero Comments in HCL Files
- Decision: Prohibit all `#` comments in `.tf` files and embed all technical rationale into variable, output, and resource `description` attributes.
- Why: Enforces the project's strict `terraform-conventions.md` rules, preventing unexpected resource recreation caused by byte changes in templated heredoc strings, and ensuring technical documentation is exported to external consumers cleanly.
- What breaks if ignored: Modifying comments inside template strings or resource blocks triggers unintended resource replacement during Terraform plans.
- Rejected alternative: Standard inline `#` comments - rejected because of demonstrated incident history causing resource replacement drift.

### TP-D05: Dual DynamoDB Table Separation with On-Demand Billing
- Decision: Split DynamoDB storage into two separate tables (`MarketThemes` and `PipelineState`) using `PAY_PER_REQUEST` billing mode.
- Why: Follows production ledger decisions C9 and C10 to strictly isolate user-facing display data (exposed via AppSync) from sensitive operational pipeline state (`retry_count`, `session_id`, `critique`), while On-Demand capacity eliminates costs during idle periods.
- What breaks if ignored: Operational state leaks to the public-facing GraphQL API, or continuous idle provisioning fees are incurred for an event-driven system.
- Rejected alternative: Single consolidated DynamoDB table - rejected because it violates frontend data isolation; Provisioned capacity - rejected because it violates the 100% serverless cost optimization baseline.

### TP-D06: Role-Per-Runtime IAM Least Privilege
- Decision: Provision distinct, dedicated IAM execution roles for Crawler, Management, Analysis, and Lambda Webhook-Handler with explicit resource ARNs and zero wildcards.
- Why: Enforces production ledger C16 and Well-Architected FSI guidance, ensuring that the agent collecting data cannot read back, the agent replaying data cannot overwrite, and prompt injection cannot escalate capabilities across the platform.
- What breaks if ignored: A security breach or successful prompt injection in the web-crawling agent grants access to analysis reasoning, DynamoDB records, and model configurations.
- Rejected alternative: Single shared IAM execution role across all agents and functions - rejected because it broadens blast radius and violates least privilege.

### TP-D07: Guardrail Defense-in-Depth Configuration
- Decision: Attach Amazon Bedrock Guardrail to the Analysis worker (`C12`) and Management supervisor (`O1-B`), while omitting Guardrail on the Crawler worker (`O2-A`).
- Why: Analysis processes untrusted external web text entering model reasoning (highest injection risk), Management synthesizes worker outputs (defense-in-depth), while Crawler performs pure Python code sanitization (`C7`) without model inference.
- What breaks if ignored: Prompt injection hidden in untrusted web pages reaches model reasoning unmitigated, or unnecessary token costs and latency are added to a non-reasoning Crawler.
- Rejected alternative: Guardrail on Crawler - rejected because Crawler runs no LLM calls; omitting Guardrail on Management - rejected because merged multi-worker content can carry residual injection.

