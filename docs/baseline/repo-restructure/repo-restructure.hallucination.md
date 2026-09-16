---
baseline_schema: "2.0"
pack: "repo-restructure"
document: "hallucination"
status: "complete"
updated: "2026-09-16"
code_ref: "b83f131"
---

# SignalScout Repository Restructure - Decision Register

## Register

### RR-D01: Monorepo Architecture with Dedicated Prefixes
- Decision: Retain a single unified monorepo and partition environments into dedicated prefixed root folders (`signalscout-poc/` and `signalscout-prod/`).
- Why: Keeps shared business requirements in `docs/business/` and collector policies in `docs/collector-routing-rules.md` synchronized without multi-repo drift, while explicitly distinguishing exploratory hackathon POC assets from production enterprise assets.
- What breaks if ignored: Unprefixed directories cause ongoing confusion about whether code at root is production-ready, or multi-repo fragmentation forces duplicate maintenance of core domain invariants.
- Rejected alternative: Multi-repo split - rejected because the business requirements and target architecture are in active co-evolution and multi-repo introduces synchronization overhead; unprefixed `poc/` and `prod/` - rejected per explicit user preference for brand-prefixed identity.

### RR-D02: Root Vercel Services Routing with Subdirectory Roots
- Decision: Maintain `vercel.json` at repository root and point `services.frontend.root` to `signalscout-poc/frontend` and `services.backend.root` to `signalscout-poc/backend`.
- Why: Leverages native Vercel multi-service monorepo configuration to manage deployment entirely as code via Git, avoiding manual UI changes in Vercel Dashboard.
- What breaks if ignored: Vercel automated Git deployments fail with missing folder errors on push, resulting in live demo downtime.
- Rejected alternative: Relocating `vercel.json` into `signalscout-poc/` and manually changing Vercel Dashboard Root Directory - rejected because it introduces manual workstation dependencies and risks configuration drift across team clones.

### RR-D03: Production Code Topology Separation
- Decision: Isolate production application code (`signalscout-prod/agents/` and `signalscout-prod/lambdas/`) from infrastructure code (`signalscout-prod/terraform/`).
- Why: Enforces clear separation of concerns between Bedrock Strands Agent logic (managed via Python `uv`) and Terraform IaC lifecycles, enabling isolated unit testing and clean deployment boundaries.
- What breaks if ignored: Application dependencies leak into Terraform module directories, complicating CI/CD packaging and inflating infrastructure blast radius.
- Rejected alternative: Placing agent and lambda code directly inside Terraform module directories - rejected because it couples application runtime testing to Terraform provider execution.

## Lessons

### RR-L01: PowerShell Commit-Tree Syntax Escaping
- Mistake: Passing `HEAD^{tree}` directly to `git commit-tree` in PowerShell.
- Why it looked reasonable: Standard Git revision syntax in documentation and Unix shells.
- What disproved it: PowerShell parses `^` as an escape character and drops or mangles the tree specifier, causing git commit-tree to fail.
- Fix applied: Extract raw 40-character tree hash beforehand using `git log -1 --format=%T <hash>` and pass the bare tree hash into `git commit-tree`.

