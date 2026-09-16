---
baseline_schema: "2.0"
pack: "repo-restructure"
document: "useguide"
status: "complete"
updated: "2026-09-16"
code_ref: "b83f131"
---

# SignalScout Repository Restructure - Operator Guide

## Purpose
This document provides practical procedures for developers and operators working in the restructured SignalScout monorepo, covering local development, build validation, Vercel verification, and Terraform execution under the new directory layout.

---

## 1. Local POC Development Workflow

### Start Full-Stack Dev Environment
From the repository root, start both the backend API and frontend Vite dev server concurrently:
```powershell
npm run dev
```
This command invokes `concurrently` targeting `@corpwatch/backend` on port 3001 and `@corpwatch/frontend` on `http://127.0.0.1:5173`.

### Run Typechecks and Unit Tests
Run typechecking and tests across all npm workspaces:
```powershell
# Typecheck backend and frontend TypeScript
npm run typecheck

# Run Vitest test suites across workspaces
npm test
```

### Build and Validate Public Bundle
Build the Bed Bath & Beyond case package, validate schema integrity fail-closed, and produce the frontend production build:
```powershell
npm run build
```

---

## 2. Vercel Deployment Verification Workflow

The root `vercel.json` coordinates multi-service deployment for the POC. To verify that Vercel builds cleanly without deploying:

### Verify Monorepo Build Structure
Ensure that all workspace paths referenced in `vercel.json` exist:
```powershell
# Verify frontend root exists and contains package.json
Test-Path "signalscout-poc/frontend/package.json"

# Verify backend root exists and contains entrypoint
Test-Path "signalscout-poc/backend/src/server.ts"
```

### Dry-Run Vercel Build (via Vercel CLI if installed)
```powershell
npx vercel build
```

---

## 3. Production Terraform Operations Workflow

Production IaC resides under `signalscout-prod/terraform/`.

### Run Terraform Offline Unit Tests
```powershell
# Test storage module
terraform -chdir=signalscout-prod/terraform/modules/storage test

# Test database module
terraform -chdir=signalscout-prod/terraform/modules/database test

# Test security IAM module
terraform -chdir=signalscout-prod/terraform/modules/security_iam test

# Test API Gateway & compute module
terraform -chdir=signalscout-prod/terraform/modules/api_gateway_compute test

# Test observability module
terraform -chdir=signalscout-prod/terraform/modules/observability test

# Test end-to-end production environment orchestration
terraform -chdir=signalscout-prod/terraform/environments/prod test
```

### Validate Formatting and Syntax
```powershell
# Check canonical formatting
terraform fmt -recursive -check signalscout-prod/terraform/

# Validate environment syntax
terraform -chdir=signalscout-prod/terraform/environments/prod validate
```

---

## 4. Migration Execution Checklist

The migration has been fully executed and committed on branch `main` in commit `15401f9`:
1. Staged all path renames via `git mv`:
   - Moved POC components into `signalscout-poc/backend` and `signalscout-poc/frontend`.
   - Moved Production IaC into `signalscout-prod/terraform/`.
   - Created scaffolding directories `signalscout-prod/agents/` and `signalscout-prod/lambdas/`.
2. Committed `vercel.json`, `package.json`, and the moved files in an atomic Git commit (`15401f9`).
3. Verified `npm run build`, `npm run typecheck`, `npm test`, and `terraform test` before locking status.

