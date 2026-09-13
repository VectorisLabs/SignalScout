# AWS Agent Platform - Background

> **Scope: reference.** Platform facts about Bedrock AgentCore, the Strands Agents SDK and the A2A protocol. These are vendor properties, not project decisions - project decisions are in [`../production/decision-ledger.md`](../production/decision-ledger.md).
>
> **last_verified: 2026-07-12.** Not re-checked since. Limits, endpoints and pricing behaviour drift; confirm against current AWS documentation before relying on a number here. Tracked as G6 in [`../production/superseded-and-rejected.md`](../production/superseded-and-rejected.md).

---

## AgentCore Runtime

A serverless, secure hosting environment purpose-built for AI agents. Framework-agnostic (Strands, LangGraph, CrewAI) and model-agnostic.

### Properties that shaped the architecture

| Property | Detail | Consequence for this project |
|---|---|---|
| **Session isolation** | Each session runs in its own microVM with separate CPU, memory and filesystem, sanitized on completion | Untrusted web content processing is contained per session |
| **Extended execution** | Up to 8 hours, against Lambda's 15 minutes | Long collector runs are viable without chunking |
| **Consumption-based pricing** | CPU billed only while active - **not** during I/O wait for an LLM or a tool | Synchronous TinyFish/Apify calls do not burn money while blocked ([`../production/operations.md`](../production/operations.md#cost-optimization)) |
| **Own network** | Reaches both public and private resources | No Lambda or Gateway needed for outbound HTTPS ([`../production/design-rationale.md`](../production/design-rationale.md#agent-orchestration)) |
| **Built-in auth** | AgentCore Identity (Token Vault) for outbound credentials | An alternative to Secrets Manager for provider keys - not the path chosen |
| **Async / long-running** | The agent can return "started" and continue in the background, with the user checking back later | Not used in the current flow, which is synchronous through Management |

### Limits

- 2 vCPU / 8GB RAM per session
- Docker image up to 2GB
- Code package up to 250MB compressed

### The AgentCore platform

| Component | Purpose | Used here |
|---|---|---|
| **Runtime** | Agent hosting | **Yes** - three of them |
| **Memory** | Long-term context | Listed in the service inventory but in no flow - see G3 |
| **Gateway** | Turns APIs into MCP tools | **No** - deliberately rejected (R3) |
| **Identity** | Credential and token vault | No - Secrets Manager used instead |
| **Observability** | Logging and monitoring | Via CloudWatch and Langfuse |
| **Built-in tools** | - | No |

---

## Strands Agents SDK

An open-source, model-driven AWS SDK for building agents in a few lines of code. Used in production inside AWS itself - Amazon Q Developer, AWS Glue, VPC Reachability Analyzer.

**v1.0 (July 2025)** added multi-agent orchestration and the A2A protocol. That release is what makes the supervisor-worker design in this project possible.

### Relationship to AgentCore Runtime

They are two halves of one thing, not two components in a chain:

- **AgentCore Runtime** is the infrastructure - the hosting environment.
- **Strands Agent** is the code running inside it.

On a diagram they are drawn as a single block with no arrow between them. See [`../production/architecture.md`](../production/architecture.md#diagram-conventions).

### Where it touches project decisions

| Strands feature | Used for |
|---|---|
| Function calling (`tool_use`) | TinyFish and Apify invocation ([`../production/design-rationale.md`](../production/design-rationale.md#tool-invocation-and-data-filtering)) |
| `BedrockModel` configuration | Guardrails attachment ([`../production/design-rationale.md`](../production/design-rationale.md#guardrails-and-sanitization)) |
| Multi-agent orchestration + A2A | Management calling Crawler and Analysis ([`../production/design-rationale.md`](../production/design-rationale.md#agent-orchestration)) |

---

## A2A protocol

The mechanism by which one AgentCore Runtime invokes another. This is what Management uses to reach Crawler and Analysis.

| Aspect | Detail |
|---|---|
| **API** | `InvokeAgentRuntime` |
| **IAM permission** | `bedrock-agentcore:InvokeAgentRuntime` |
| **Wire protocol** | JSON-RPC 2.0, `method: message/send`; the response carries `artifacts` |
| **Payload** | Binary up to 100MB, streaming responses supported |
| **Capability manifest** | The agent card: `can`, `needs`, `meta` |

### Sessions

`runtimeSessionId` controls context:

- **Reuse the id** to carry context forward - this is what makes a retry a continuation rather than a fresh attempt that has forgotten the critique ([`../production/design-rationale.md`](../production/design-rationale.md#retry-and-self-correction)).
- **Generate a new id** for stateless invocations.
- The id must be a UUID of **at least 33 characters**.

### The constraint that shaped the webhook design

**TinyFish and Apify cannot call `InvokeAgentRuntime` themselves** - they are third-party APIs with no AWS credentials and no knowledge of the runtime. Anything originating outside AWS must arrive through an agent relay, or through a webhook plus Lambda.

This is the structural reason the Langfuse retry loop goes through API Gateway and a Lambda handler rather than Langfuse re-invoking the agent directly. See [`../production/design-rationale.md`](../production/design-rationale.md#langfuse-integration).

### Cost note

Every `InvokeAgentRuntime` call opens a session, and sessions carry overhead. Three separate Runtimes cost more than one combined agent - a deliberate trade, discussed in [`../production/operations.md`](../production/operations.md#cost-optimization).
