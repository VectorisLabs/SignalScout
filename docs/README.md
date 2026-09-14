# SignalScout Documentation

SignalScout exists in **two versions**, over **one** set of business requirements. Every document here belongs to exactly one of the three layers, and the folder decides which - you should never need to read a document to find out. The one exception is the shared collector policy at the root, noted under Conventions.

| Layer | What it is | Where |
|---|---|---|
| **Business** | Requirements, invariants and vocabulary that hold regardless of stack, provider or deployment target. Neither POC nor production; both implement it. | [`business/`](./business/) |
| **POC** | The minimal build that was actually implemented and demoed at the hackathon: OpenAI Responses API chat agent, TinyFish/Apify collection, a frozen `CasePackage` replayed offline. This is what runs today. | [`poc/`](./poc/) |
| **Production** | The target architecture from the proposal, to be built when there is time: multi-agent supervisor-worker on Bedrock AgentCore (Management / Crawler / Analysis), DynamoDB + S3, Langfuse-driven retry. Designed, not built. | [`production/`](./production/) |

Two authority rules resolve every conflict between them:

- **For a domain statement, invariant or gate, [`business/`](./business/) wins** over both implementation folders, and over code.
- **For a technical choice, [`production/decision-ledger.md`](./production/decision-ledger.md) wins.** Nothing in `business/` opens or closes a technical decision.

The repository no longer has a root-level `MEMORY.md`; its content was extracted into [`production/`](./production/) and [`reference/`](./reference/) and the file was deleted.

---

## Start here

- **Understanding what must always be true** → [`business/domain-invariants.md`](./business/domain-invariants.md)
- **Understanding the product** → [`business/product-definition.md`](./business/product-definition.md)
- **Understanding what was built** → [`poc/openai-chat-implementation-plan.md`](./poc/openai-chat-implementation-plan.md)
- **Understanding where it is going** → [`production/decision-ledger.md`](./production/decision-ledger.md)

## Contents

### [`business/`](./business/) - requirements, version-independent

| File | Purpose |
|---|---|
| [`README.md`](./business/README.md) | Index, the authority rules, extraction provenance, decisions BD-01 to BD-03 and unresolved items. |
| [`product-definition.md`](./business/product-definition.md) | Problem, user, job-to-be-done, the three postures, outputs, differentiator, explicit non-claims NOCLAIM-01 to NOCLAIM-06. |
| [`domain-invariants.md`](./business/domain-invariants.md) | INV-01 to INV-13, authority boundaries AUTH-01 to AUTH-07, canonical state. |
| [`evidence-policy.md`](./business/evidence-policy.md) | Collection policy EV-01 to EV-12, Evidence Gate checks GATE-01 to GATE-12, stop conditions, prompt-injection boundary. |
| [`signal-taxonomy.md`](./business/signal-taxonomy.md) | Patterns PAT-01/PAT-02, signal types, maturity policies, metrics MET-01 to MET-14, readiness sections RDY-01 to RDY-05. |
| [`scope-and-nongoals.md`](./business/scope-and-nongoals.md) | NOGO-01 to NOGO-09 and the non-negotiable core a scope cut may never touch. |

### [`production/`](./production/) - target architecture, not yet built

| File | Purpose |
|---|---|
| [`README.md`](./production/README.md) | Index and reading order. |
| [`architecture.md`](./production/architecture.md) | Project context, the three agents, the three flows, every service, diagram conventions. |
| [`decision-ledger.md`](./production/decision-ledger.md) | 20 closed decisions (C1-C20) and 5 open ones (O1-O5) with options, trade-offs and recommendations. The single place a production decision is opened or closed. |
| [`design-rationale.md`](./production/design-rationale.md) | Why the pipeline works this way: orchestration, tool invocation, storage, retry, Langfuse, guardrails. |
| [`operations.md`](./production/operations.md) | IAM, observability, cost, Well-Architected alignment. |
| [`superseded-and-rejected.md`](./production/superseded-and-rejected.md) | Rejected options with their reasons, statements overtaken by later decisions, and unresolved gaps. Read before re-proposing anything. |

### [`collector-routing-rules.md`](./collector-routing-rules.md) - shared, applies to both versions

`COLLECTOR-ROUTER-v2` - when a model may request collection, which provider the application picks, the budgets, the candidate envelope and the audit fields. It superseded `COLLECTOR-ROUTER-POC-v1` and `COLLECTOR-ROUTER-PROD-v1` on 2026-09-14, which had been the same policy kept as two copies that drifted. Everything that genuinely differs between the two versions is in its Version bindings table.

### [`reference/`](./reference/) - platform background, not project decisions

| File | Purpose |
|---|---|
| [`aws-agent-platform.md`](./reference/aws-agent-platform.md) | Bedrock AgentCore Runtime, the Strands Agents SDK and the A2A protocol: isolation, limits, pricing behaviour, session rules. |

It carries a `last_verified` date because it describes third-party platforms that drift.

### [`poc/`](./poc/) - what was built and demoed

| File | Purpose |
|---|---|
| [`openai-chat-implementation-plan.md`](./poc/openai-chat-implementation-plan.md) | The authoritative POC plan (v2). Supersedes the orchestration sections of the build guide. |
| [`build-guide.md`](./poc/build-guide.md) | Task-by-task build guide for the frozen-`CasePackage` MVP. |
| [`showcase-dataset-research.md`](./poc/showcase-dataset-research.md) | Why the Bed Bath & Beyond retrospective case was chosen as the demo dataset. |
| [`demo-runbook.md`](./poc/demo-runbook.md) | The 3-minute demo script, minute by minute. |
| [`submission-claims.md`](./poc/submission-claims.md) | Claims ledger: what was DEMONSTRATED vs TESTED, with the proof for each. |
| [`task-receipts.md`](./poc/task-receipts.md) | Per-task completion receipts: files touched, tests run, risks left open. |

### [`proposal/`](./proposal/) - external-facing material

| File | Purpose |
|---|---|
| [`master-proposal.md`](./proposal/master-proposal.md) | The judge-facing product summary. |
| [`devpost.md`](./proposal/devpost.md) | The submitted Devpost form content. |

### [`design/`](./design/) - UI

| File | Purpose |
|---|---|
| [`figma-redesign-prompt.md`](./design/figma-redesign-prompt.md) | Prompt for regenerating the dashboard design in a design-to-code tool. |
| [`redesign-mockup.html`](./design/redesign-mockup.html) | Static Tailwind mockup of the redesigned dashboard. |

### [`archive/`](./archive/) - superseded, reference only

| File | Purpose |
|---|---|
| [`hackathon-plan-v1.md`](./archive/hackathon-plan-v1.md) | The original 4-day plan (ClickHouse, n8n, Strands graph). Superseded; kept for historical reasoning. Body is in Vietnamese as originally written. |

### [`assets/`](./assets/) - images

`architect-v1.png` (production architecture), `architect-v2.jpeg` (revised architecture), `winner.webp` (AWS track runner-up, Agentic AI Build Week 2026).

---

## Conventions

- Folder names are lowercase, file names are kebab-case, no spaces in any path.
- The folder decides the layer. [`collector-routing-rules.md`](./collector-routing-rules.md) is the single deliberate exception: it sits at the root of `docs/` because it is implementation-level but shared by both versions, and a copy in each folder is exactly what it was created to stop.
- Documents are in English. The one exception is the archived v1 plan, kept in its original Vietnamese.
- A document states its layer (business, POC, production, or shared) in a one-line scope note under the title; the folder is the authority if the two ever disagree.
- Third-party API playbooks (Apify, Langfuse, TinyFish) are agent tooling, not project documentation - they live in [`../.kiro/skills/`](../.kiro/skills/).
- **A business requirement is stated in [`business/`](./business/) and nowhere else.** An implementation document cites it by ID and may add how it is met; it never restates the requirement in its own words, because a second copy is a future contradiction.
- **A decision is settled in [`production/decision-ledger.md`](./production/decision-ledger.md) and nowhere else.** Rationale documents explain a decision; they never change its status.
- **A rejected option is recorded with its reason** in [`production/superseded-and-rejected.md`](./production/superseded-and-rejected.md). Decisions changed fast during hackathon research and options dropped without a recorded reason kept coming back.
- Facts about third-party platforms carry a `last_verified` date. Treat an undated one as unverified.
