# Architecture

> **Scope: production.** What the system is: where it came from, its shape, its services, and how it is drawn. The *why* behind each choice is in [`design-rationale.md`](./design-rationale.md); the decisions themselves are in [`decision-ledger.md`](./decision-ledger.md).

Diagram: [`../assets/architect-v1.png`](../assets/architect-v1.png), revised in [`../assets/architect-v2.jpeg`](../assets/architect-v2.jpeg).

---

## Project context

| | |
|---|---|
| **Theme detected** | "Major Corporate Restructuring: Job Cuts, Asset Sales, and Strategic Realignments" |
| **Origin** | The "Market Themes" table on the Advisor Dashboard of an existing Wealth Management Portal (React frontend, already built) |
| **Goal** | A professional AWS architecture: standards-compliant, fully serverless, Amplify-hosted, cost-optimized |
| **Mandatory third-party services** | TinyFish, Langfuse, Apify |
| **Industry** | Wealth management |

### What the industry implies

Wealth management is a regulated, sensitive domain, and the output feeds investment decisions. Three consequences run through the whole architecture and explain choices that would otherwise look over-built:

1. **Audit and compliance are first-class** - hence CloudTrail alongside CloudWatch ([`operations.md`](./operations.md#observability)), and the multi-attempt S3 store that never overwrites ([`design-rationale.md`](./design-rationale.md#data-and-storage)).
2. **Human oversight is the terminal state, not an exception** - the retry loop ends in `needs_human_review`, it does not loop forever ([`design-rationale.md`](./design-rationale.md#retry-and-self-correction)).
3. **Untrusted web content near a model is the main risk** - hence mandatory Guardrails on Analysis and code-level sanitization in the Crawler ([`design-rationale.md`](./design-rationale.md#guardrails-and-sanitization)).

The original research record called this "idea number 3" - one of several hackathon concepts under consideration. That numbering carries no meaning now.

---

## System shape

A multi-agent **supervisor-worker** system on Bedrock AgentCore Runtime:

| Agent | Role |
|---|---|
| **Management** (supervisor) | Orchestrates the flow. Calls each worker in turn; workers never call each other. |
| **Crawler** (worker) | Calls TinyFish/Apify to collect data, then sanitizes and filters it in code. |
| **Analysis** (worker) | Derives theme and sentiment through model reasoning. |

Why supervisor-worker rather than a peer graph, and why the star topology: [`design-rationale.md`](./design-rationale.md#agent-orchestration).

### Flow 1 - frontend request

```
Users -> Route53 -> Amplify (Gen2 Hosting) -> API Gateway -> Lambda -> AgentCore Runtime Management
```

Numbered steps on the diagram: (1) Cognito auth into API Gateway, (2) API Gateway to Lambda, (3) Lambda to Management.

### Flow 2 - processing (supervisor-worker)

```
Management  --InvokeAgentRuntime-->        Crawler
Crawler     --HTTPS-->                     TinyFish / Apify
Crawler     <--raw JSON--                  TinyFish / Apify
Crawler     [filter + sanitize in code]
Crawler     --A2A response-->              Management
Management  --InvokeAgentRuntime (filtered data)--> Analysis
Analysis    [model reasoning: theme + sentiment]
Analysis    --A2A response-->              Management
Management  --trace + score-->             Langfuse
```

**Management does not write the result.** The original research record ended this flow with "Management writes the result (S3 + DynamoDB)", contradicting the write flow four lines below it in the same section. The write is performed by the Lambda Webhook-Handler, triggered by Langfuse after scoring. See S2 in [`superseded-and-rejected.md`](./superseded-and-rejected.md), and [`design-rationale.md`](./design-rationale.md#retry-and-self-correction) for what happens once the score arrives.

### Flow 3 - write and read

```
Write:  Lambda Webhook-Handler -> S3 (PutObject) -> DynamoDB (UpdateItem)
Read:   Amplify -> AppSync -> Lambda resolver -> DynamoDB -> S3 presigned URL -> browser downloads directly
```

The two orders are deliberately opposite, and they are two separate lifecycles rather than one chain - the write happens when the pipeline finishes, the read when a user opens the dashboard. Reasoning in [`design-rationale.md`](./design-rationale.md#data-and-storage).

---

## Service inventory

### AWS services

| Service | Role |
|---|---|
| Route53 | DNS |
| Amplify Gen2 Hosting | CI/CD from Git, CDN, hosts the React dashboard |
| Cognito | Amplify Auth (user pool + identity pool) |
| WAF | Protects the frontend/API tier - **placement not specified**, see G4 in [`superseded-and-rejected.md`](./superseded-and-rejected.md) |
| API Gateway | HTTP API (~70% cheaper than REST); a separate endpoint for the Langfuse webhook |
| Lambda | Three distinct functions: AgentCore trigger (`InvokeAgentRuntime`), AppSync resolver, webhook handler |
| AppSync | Amplify Data - GraphQL API (`getMarketThemes`) |
| AgentCore Runtime | Hosts the three Strands Agents (Management / Crawler / Analysis) |
| AgentCore Memory | Short-term memory and session context, read and written by Management, never by Lambda - **appears in no flow**, see G3 in [`superseded-and-rejected.md`](./superseded-and-rejected.md) |
| Bedrock (model) + Guardrails | Model reasoning plus safety filtering |
| DynamoDB | Metadata and `retry_count`, On-Demand capacity |
| S3 (Intelligent-Tiering) | Raw data and results, stored per attempt |
| Secrets Manager | TinyFish/Apify/Langfuse API keys, webhook signing secret |
| CloudWatch | Application logs, metrics, alarms |
| CloudTrail | API call auditing for compliance |
| IAM | Least-privilege execution roles, one per Runtime |

### Third-party services (SaaS)

| Service | Role |
|---|---|
| **TinyFish** | AI web agent - reads investor-relations pages and press releases |
| **Apify** | Web scraping actors - news sites, SEC filings |
| **Langfuse** | LLM observability: tracing, scoring, prompt management, webhooks |

All three are mandatory for the project. They sit outside the AWS boundary and are called directly over HTTPS from AgentCore Runtime - see R3 and R4 in [`superseded-and-rejected.md`](./superseded-and-rejected.md) for why there is no Gateway or Lambda in between.

### Two entries with no owner

`AgentCore Memory` and `WAF` are each listed here but appear in no flow diagram and in no closed decision. They are either part of the design with the flows incomplete, or dropped with this table stale. Both are tracked as gaps (G3, G4) rather than silently removed.

---

## Diagram conventions

> **No editable source exists.** These conventions were written for a draw.io file, `market-restructuring-theme-architecture.drawio`, which is **not in this repository**. What survives is the PNG/JPEG export in [`../assets/`](../assets/). The conventions are kept for whoever redraws it. See S6 in [`superseded-and-rejected.md`](./superseded-and-rejected.md).

### Placement

| Element | Convention |
|---|---|
| Third-party services (TinyFish, Apify, Langfuse) | Real logos as image shapes, placed **outside** the AWS boundary |
| AgentCore Runtime + Strands Agent | **One block**, not two icons. Runtime is the infrastructure, Strands is the code running inside it - no arrow between them |
| Bedrock Guardrails | Nested inside the Strands Agent, no network arrow |
| IAM | Annotation or note box, never a node with arrows |
| CloudTrail | A note, no arrows from individual compute - it records account-wide by itself |

The pattern behind the last three: **if it is not a network hop, do not draw it as one.** Guardrails is a model property, IAM is static permission, CloudTrail is ambient. Drawing them as nodes invents traffic that does not exist.

### Arrows

| Interaction | Convention |
|---|---|
| Synchronous tool call | Two solid arrows - request out, response back to exactly the step that called. Not one double-headed arrow |
| A2A between Runtimes | Two separate arrows (invoke, response). Not a double-headed arrow |
| Langfuse trace export | Dashed, purple, labelled "async trace export" |
| CloudWatch | Dashed arrows from every compute element |
| Decision or rule | Rhombus (diamond) |

### Structure

- **Webhook endpoint is drawn separately** from the user-facing API Gateway endpoint - they are genuinely different endpoints with different auth ([`design-rationale.md`](./design-rationale.md#langfuse-integration)).
- **The seven steps of a single agent** go in their own container on a separate page or tab, zoomed in, with numbered circles. Only the steps that call something external get an arrow crossing the boundary.
