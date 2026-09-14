---
baseline_schema: "2.0"
pack: "terraform-prod"
document: "hallucination"
status: "active"
updated: "2026-09-14"
code_ref: "uncommitted"
---

# SignalScout Production Terraform Infrastructure - Decision Register

## Register

### TP-D01: S3 State Backend with Native Lockfile
- Decision: Configure remote S3 state backend with S3 native lockfile (`use_lockfile = true`) for production state storage.
- Why: Native S3 locking is built into Terraform 1.15.8, providing strong consistency and encryption without requiring the creation or cost of a dedicated DynamoDB state locking table.
- What breaks if ignored: Concurrent Terraform operations risk corrupting the remote state file, or redundant cloud costs are incurred by maintaining an unnecessary DynamoDB lock table.
- Rejected alternative: Local state - rejected because it violates production safety and prevents multi-engineer collaboration; DynamoDB lock table - rejected because native S3 locking supersedes it with zero extra infrastructure.

### TP-D02: Modular Directory Structure
- Decision: Organize Terraform code into reusable modules under `terraform/modules/` consumed by an environment configuration under `terraform/environments/prod/`.
- Why: Decouples component lifecycles, restricts blast radius during changes, allows isolated unit testing via `terraform test`, and enables future multi-environment expansion without copy-pasting resource definitions.
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

### TP-D08: Floci Local Emulation Dual-Mode Architecture
- Decision: Implement dual-mode AWS provider configuration in `environments/prod/` using `var.use_floci` and dynamic `endpoints` blocks pointing to `http://localhost:4566`, keeping all modules 100% standard AWS without localhost coupling.
- Why: Allows developers to run full plan and apply lifecycles locally on the Quarkus Native Floci emulator without cloud costs, while deploying to AWS `ap-southeast-1` by merely setting `use_floci = false`.
- What breaks if ignored: Local development requires live AWS credentials and incurs billing, or modules become polluted with emulator-specific hacks that prevent clean production promotion.
- Rejected alternative: Hardcoding Floci endpoints inside module definitions - rejected because it breaks reuse for live AWS deployment; LocalStack Pro - rejected because Floci is already present on host with zero licensing overhead.

### TP-D09: Native jsonencode for IAM Policies
- Decision: Define IAM assume role policies and inline execution policies using native HCL `jsonencode()` instead of `data "aws_iam_policy_document"`.
- Why: In Terraform test plan mode with mock providers, data sources return unparsed mock strings that fail `assume_role_policy` JSON schema validation, whereas `jsonencode()` evaluates at static plan time, generates deterministic JSON, and works identically across live AWS, Floci, and mock tests.
- What breaks if ignored: Offline unit tests fail with invalid JSON errors, breaking CI/CD pre-commit verification.
- Rejected alternative: Mocking IAM policy data source JSON outputs in each test file - rejected because it clutters test suites with repetitive boilerplate.

### TP-D10: Partial Backend Configuration with Dual HCL Profiles
- Decision: Declare an empty `backend "s3" {}` block in `terraform/environments/prod/terraform.tf` and supply target backend settings via `-backend-config=backend-prod.hcl` and `-backend-config=backend-floci.hcl`.
- Why: Enables switching between Floci's local S3 bucket (`endpoint = "http://localhost:4566"`, `force_path_style = true`) and AWS's remote S3 bucket (`use_lockfile = true`) without modifying checked-in Terraform configuration files.
- What breaks if ignored: Changing deployment targets requires mutating source `.tf` files, risking accidental commit of local emulator endpoints to version control.
- Rejected alternative: Local backend in prod - rejected because production requires durable remote state; separate environments/floci/ directory - rejected because it duplicates root configuration.

## Lessons Learned

### LL-01: Set Indexing in S3 Server-Side Encryption Tests
- Mistake: Indexing `aws_s3_bucket_server_side_encryption_configuration.raw_market_news.rule[0]` in test assertions.
- Why it looked reasonable: The HCL configuration declares a single nested `rule` block.
- What disproved it: The AWS provider schema represents `rule` as a Set of objects without addressable keys, producing `Error: Cannot index a set value`.
- Fix applied: Use `one(aws_s3_bucket_server_side_encryption_configuration.raw_market_news.rule)` to address the single set item.

### LL-02: Computed Attributes Across Module Boundaries in Plan Tests
- Mistake: Asserting `module.storage.bucket_id == "signalscout-prod-raw-market-news"` when `bucket_id` exported `aws_s3_bucket.raw_market_news.id`.
- Why it looked reasonable: In live AWS apply, `id` matches bucket name.
- What disproved it: In plan mode, `id` is computed and unknown before apply, causing `Error: Unknown condition value` during module boundary evaluation.
- Fix applied: Export `aws_s3_bucket.raw_market_news.bucket` for the `bucket_id` output, which is known statically at plan time.

### LL-03: Bedrock Guardrail Exported Attribute Naming
- Mistake: Referencing `aws_bedrock_guardrail.analysis.arn` in module outputs.
- Why it looked reasonable: Most AWS provider resources export `.arn`.
- What disproved it: `aws_bedrock_guardrail` exports `guardrail_arn` rather than `arn`, producing `Error: Unsupported attribute`.
- Fix applied: Updated output value to `aws_bedrock_guardrail.analysis.guardrail_arn`.
