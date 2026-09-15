---
baseline_schema: "2.0"
pack: "repo-restructure"
document: "introduction"
status: "active"
updated: "2026-09-15"
code_ref: "uncommitted"
---

# SignalScout Repository Restructure - Introduction

## Scope
This documentation pack governs the repository layout reorganization for SignalScout. It establishes a clean architectural separation between the hackathon proof-of-concept environment (`signalscout-poc`) and the target enterprise production environment (`signalscout-prod`) within a single unified monorepo.

It defines the target directory layout, npm workspace configuration, Vercel multi-service routing compatibility, production application code placement, and the stepwise migration plan required to execute the transition without breaking live Vercel deployments.

## Current Truth
SignalScout currently operates with an exploratory, flat root layout where the hackathon POC components (`backend/` and `frontend/`) reside at repository root alongside production infrastructure (`terraform/`) and project documentation (`docs/`).

Live production deployment for the POC demo is hosted on Vercel via a multi-service configuration defined in root `vercel.json` and `backend/vercel.json`, executed via root `package.json` with npm workspaces (`["backend", "frontend"]`). Moving `backend` and `frontend` without updating these configuration files will break active Vercel deployments.

The production architecture specified in `docs/production/` (Amazon Bedrock AgentCore supervisor-worker, DynamoDB On-Demand, S3 Intelligent-Tiering) is currently implemented only at the IaC level in `terraform/`. No dedicated application code directory exists yet for the future production agents or Lambda handlers.

## Target
1. Monorepo Structural Isolation: Group all POC implementation components into `signalscout-poc/` (`signalscout-poc/backend` and `signalscout-poc/frontend`), isolating legacy hackathon demo code from production engineering.
2. Vercel Zero-Downtime Compatibility: Update root `vercel.json` service roots to `signalscout-poc/frontend` and `signalscout-poc/backend`, and update root `package.json` workspaces to `["signalscout-poc/backend", "signalscout-poc/frontend"]` to guarantee uninterrupted Vercel builds and deployments.
3. Production Code & Infrastructure Co-location: Group all production assets into `signalscout-prod/`, containing `signalscout-prod/terraform/` (reusable modules and environments), `signalscout-prod/agents/` (Bedrock Strands Agents in Python managed with uv), and `signalscout-prod/lambdas/` (Webhook-Handler and resolvers in TypeScript).
4. Documentation Integrity: Retain `docs/` at repository root as the single source of truth for version-independent business requirements (`docs/business/`), shared collector policies (`docs/collector-routing-rules.md`), and adaptive baseline packs (`docs/baseline/`).

## Constraints
- Zero Vercel Disruption: All modifications to directory paths must be coupled with atomic updates to `vercel.json` and `package.json` so that automated Git deployments on Vercel succeed without manual intervention on the Vercel Dashboard.
- Workspace Scripts Preservation: Root lifecycle scripts (`npm run dev`, `npm run build`, `npm test`, `npm run typecheck`) must continue to function identically by delegating to updated workspace paths.
- Git History Preservation: All file moves must be executed via `git mv` to preserve commit history and provenance across both environments.
- Style Conventions: Enforce the ASCII hyphen `-` and prohibited hard-wrapping across all documentation and configuration changes.

