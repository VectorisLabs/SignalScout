---
baseline_schema: "2.0"
pack: "terraform-prod"
document: "useguide"
status: "complete"
updated: "2026-09-16"
code_ref: "b83f131"
---

# SignalScout Production Terraform Infrastructure - Operator Guide

## Purpose
This document provides operational procedures for developers and operators managing the SignalScout Terraform infrastructure across offline testing, local Floci emulation, and live AWS production deployment.

---

## 1. Offline Verification Workflow

All modules and the root production environment include offline plan-mode unit tests using native mock providers (`mock_provider "aws"`). Tests run without live AWS credentials, network access, or cloud costs.

### Run All Unit Tests
```powershell
# Run unit tests across all individual modules
terraform -chdir=signalscout-prod/terraform/modules/storage test
terraform -chdir=signalscout-prod/terraform/modules/database test
terraform -chdir=signalscout-prod/terraform/modules/security_iam test
terraform -chdir=signalscout-prod/terraform/modules/api_gateway_compute test
terraform -chdir=signalscout-prod/terraform/modules/observability test

# Run end-to-end orchestration unit test
terraform -chdir=signalscout-prod/terraform/environments/prod test
```

### Validate Formatting and Syntax
```powershell
# Verify canonical formatting (exits with code 0 on compliance)
terraform fmt -recursive -check signalscout-prod/terraform/

# Validate HCL syntax across configurations
terraform -chdir=signalscout-prod/terraform/environments/prod validate
```

---

## 2. Local Floci Emulation Workflow

Floci is an ultra-fast AWS emulator running as a Quarkus Native container on port 4566. Use this workflow to test real plan and apply lifecycles locally before touching AWS.

### Step 2.1: Start Floci Container
```powershell
docker run --rm -it -p 4566:4566 -p 4510-4559:4510-4559 floci/floci:latest
```

### Step 2.2: Create S3 State Bucket on Floci
In a new terminal, create the state bucket on Floci using AWS CLI pointed to the local endpoint:
```powershell
aws --endpoint-url=http://localhost:4566 s3 mb s3://signalscout-floci-terraform-state --region ap-southeast-1
```

### Step 2.3: Initialize Terraform with Floci Backend
```powershell
cd signalscout-prod/terraform/environments/prod
terraform init -backend-config=backend-floci.hcl -reconfigure
```

### Step 2.4: Execute Terraform Plan on Floci
```powershell
Copy-Item floci.tfvars.example floci.tfvars
terraform plan -var-file=floci.tfvars -out=tfplan
```

### Step 2.5: Apply Infrastructure to Floci
```powershell
terraform apply tfplan
```

### Step 2.6: Verify Resources on Floci
```powershell
# List created S3 buckets on Floci
aws --endpoint-url=http://localhost:4566 s3 ls

# List created DynamoDB tables on Floci
aws --endpoint-url=http://localhost:4566 dynamodb list-tables --region ap-southeast-1
```

---

## 3. AWS Production Deployment Workflow

Live production deployment targets AWS region `ap-southeast-1` using profile `duykhiem` with remote S3 state storage and native S3 lockfile (`use_lockfile = true`).

### Step 3.1: Verify AWS Credentials
```powershell
aws sts get-caller-identity --profile duykhiem
```

### Step 3.2: Initialize Production S3 Backend
```powershell
cd signalscout-prod/terraform/environments/prod
terraform init -backend-config=backend-prod.hcl -reconfigure
```

### Step 3.3: Generate Production Execution Plan
```powershell
AWS_PROFILE=duykhiem terraform plan -var-file=terraform.tfvars -out=tfplan
```

### Step 3.4: Apply Changes (Approval Gate Required)
Per safety rules, never execute `terraform apply` autonomously. Present the plan summary (created, changed, destroyed) to the user and await explicit approval before running:
```powershell
AWS_PROFILE=duykhiem terraform apply tfplan
```

---

## 4. Maintenance and Conventions

When creating or modifying Terraform code in this repository:
1. Zero Comments: Never write `#` comments in `.tf` files. Provide all technical rationale inside the resource or variable `description` attribute.
2. Naming Tags: Every resource must expose a human-readable name in the AWS Console via `name`, `name_prefix`, or `tags = { Name = ... }`.
3. Canonical Style: Run `terraform fmt -recursive terraform/` before committing.
4. Test Driven: Add or update corresponding assertions in `tests/*_unit_test.tftest.hcl` for any newly added resource or attribute.

