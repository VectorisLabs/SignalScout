# SignalScout Documentation

SignalScout exists in **two versions**, and every document here belongs to exactly one of them. The folder decides which - you should never need to read a document to find out.

| Version | What it is | Where |
|---|---|---|
| **POC** | The minimal build that was actually implemented and demoed at the hackathon: OpenAI Responses API chat agent, TinyFish/Apify collection, a frozen `CasePackage` replayed offline. This is what runs today. | [`poc/`](./poc/) |
| **Production** | The target architecture from the proposal, to be built when there is time: multi-agent supervisor-worker on Bedrock AgentCore (Management / Crawler / Analysis), DynamoDB + S3, Langfuse-driven retry. Designed, not built. | [`production/`](./production/) |

Production decisions are settled in [`production/decision-ledger.md`](./production/decision-ledger.md) and nowhere else. The repository no longer has a root-level `MEMORY.md`; its content was extracted into [`production/`](./production/) and [`reference/`](./reference/) and the file was deleted.

---

## Start here

- **Understanding the product** → [`proposal/master-proposal.md`](./proposal/master-proposal.md)
- **Understanding what was built** → [`poc/openai-chat-implementation-plan.md`](./poc/openai-chat-implementation-plan.md)
- **Understanding where it is going** → [`production/decision-ledger.md`](./production/decision-ledger.md)

## Contents

### [`production/`](./production/) - target architecture, not yet built

| File | Purpose |
|---|---|
| [`README.md`](./production/README.md) | Index and reading order. |
| [`architecture.md`](./production/architecture.md) | Project context, the three agents, the three flows, every service, diagram conventions. |
| [`decision-ledger.md`](./production/decision-ledger.md) | 20 closed decisions (C1-C20) and 5 open ones (O1-O5) with options, trade-offs and recommendations. The single place a production decision is opened or closed. |
| [`design-rationale.md`](./production/design-rationale.md) | Why the pipeline works this way: orchestration, tool invocation, storage, retry, Langfuse, guardrails. |
| [`operations.md`](./production/operations.md) | IAM, observability, cost, Well-Architected alignment. |
| [`collector-routing-rules.md`](./production/collector-routing-rules.md) | `COLLECTOR-ROUTER-PROD-v1` - when a Bedrock model may request direct source APIs, TinyFish or Apify. |
| [`superseded-and-rejected.md`](./production/superseded-and-rejected.md) | Rejected options with their reasons, statements overtaken by later decisions, and unresolved gaps. Read before re-proposing anything. |

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
| [`collector-routing-rules.md`](./poc/collector-routing-rules.md) | `COLLECTOR-ROUTER-POC-v1` - the POC counterpart of the production routing policy, with the application-side Collector Router. |
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
- Documents are in English. The one exception is the archived v1 plan, kept in its original Vietnamese.
- A document states its version (POC or production) in a one-line scope note under the title; the folder is the authority if the two ever disagree.
- Third-party API playbooks (Apify, Langfuse, TinyFish) are agent tooling, not project documentation - they live in [`../.kiro/skills/`](../.kiro/skills/).
- **A decision is settled in [`production/decision-ledger.md`](./production/decision-ledger.md) and nowhere else.** Rationale documents explain a decision; they never change its status.
- **A rejected option is recorded with its reason** in [`production/superseded-and-rejected.md`](./production/superseded-and-rejected.md). Decisions changed fast during hackathon research and options dropped without a recorded reason kept coming back.
- Facts about third-party platforms carry a `last_verified` date. Treat an undated one as unverified.
