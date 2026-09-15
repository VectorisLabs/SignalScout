---
baseline_schema: "2.0"
pack: "repo-restructure"
document: "useguide"
status: "active"
updated: "2026-09-15"
code_ref: "uncommitted"
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

When executing the file moves:
1. Stage all path renames via `git mv`:
   ```powershell
   # Move POC components
   mkdir signalscout-poc
   git mv backend signalscout-poc/backend
   git mv frontend signalscout-poc/frontend

   # Move Production components
   mkdir signalscout-prod
   git mv terraform signalscout-prod/terraform
   ```
2. Commit `vercel.json`, `package.json`, and the moved files in a single atomic Git commit so CI/CD does not encounter an intermediate state.
3. Test `npm run build` and `terraform -chdir=signalscout-prod/terraform/environments/prod validate` before pushing to remote.

