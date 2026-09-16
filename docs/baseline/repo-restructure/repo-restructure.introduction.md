---
baseline_schema: "2.0"
pack: "repo-restructure"
document: "introduction"
status: "complete"
updated: "2026-09-16"
code_ref: "b83f131"
---

# SignalScout Repository Restructure - Introduction

## Scope
This documentation pack governs the repository layout reorganization for SignalScout. It establishes a clean architectural separation between the hackathon proof-of-concept environment (`signalscout-poc`) and the target enterprise production environment (`signalscout-prod`) within a single unified monorepo.

It defines the target directory layout, npm workspace configuration, Vercel multi-service routing compatibility, production application code placement, and the stepwise migration plan required to execute the transition without breaking live Vercel deployments.

## Current Truth
SignalScout has completed its monorepo reorganization. The hackathon POC components reside under `signalscout-poc/` (`backend/` and `frontend/`), while production infrastructure and code scaffolding reside under `signalscout-prod/` (`terraform/`, `agents/`, `lambdas/`).

Live production deployment for the POC demo is hosted on Vercel via multi-service configuration in root `vercel.json` (`services.frontend.root = "signalscout-poc/frontend"`, `services.backend.root = "signalscout-poc/backend"`) and root `package.json` workspaces (`["signalscout-poc/backend", "signalscout-poc/frontend"]`).

All local lifecycle scripts (`npm run build`, `npm run typecheck`, `npm test`) and Terraform offline tests pass 100%. The migration is committed in git history under commits `15401f9` and `b83f131` on branch `main`.

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

