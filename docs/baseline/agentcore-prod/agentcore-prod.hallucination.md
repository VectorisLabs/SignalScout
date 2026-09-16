---
baseline_schema: "2.0"
pack: "agentcore-prod"
document: "hallucination"
status: "draft"
updated: "2026-09-16"
code_ref: "b83f131"
---

# SignalScout Production Bedrock AgentCore Runtimes - Decisions and Rationale

## Closed Decisions

### C1: Multi-Agent Supervisor-Worker Architecture on Bedrock AgentCore
- Decision: Deploy three discrete Strands Agents on Bedrock AgentCore Runtime structured as Management (supervisor) and Crawler + Analysis (workers).
- Why: Provides microVM session isolation for untrusted web processing while maintaining clean separation of concerns.
- What breaks if ignored: Single monolithic agent lacks boundary isolation, allowing untrusted web scraping failures to crash the entire analysis session.
- Rejected alternative: Monolithic single-agent runtime - rejected due to lack of fault domain isolation and elevated blast radius for prompt injection.

### C2: Star Topology Orchestration
- Decision: Management coordinates workers in a strict star topology; workers never communicate directly with each other.
- Why: Centralizes orchestration state and prevents unobservable peer-to-peer execution loops.
- What breaks if ignored: Peer-to-peer agent graphs become non-deterministic, creating circular invocation deadlocks and unmanageable debug traces.
- Rejected alternative: Fully connected peer mesh - rejected because decentralized agent graphs obscure state provenance and complicate retry reasoning.

### C4: Direct Outbound HTTPS Tool Invocations
- Decision: AgentCore Runtime invokes TinyFish and Apify directly over HTTPS without AgentCore Gateway or intermediate Lambda relays.
- Why: Minimizes architectural complexity and network hops for straightforward third-party API consumption.
- What breaks if ignored: Adding API Gateway or Lambda forwarders introduces unnecessary compute billing and latency overhead for basic HTTPS requests.
- Rejected alternative: AgentCore Gateway with MCP servers - rejected as over-engineered complexity for single-agent tool consumption (R3).

### C5: Time-Bounded Model-Invoked Tool Execution
- Decision: External scrapers are invoked as model tools (`tool_use`) constrained by strict `max_duration_seconds` timeouts.
- Why: Prevents third-party SaaS hang-ups from stalling microVM runtimes indefinitely.
- What breaks if ignored: Slow or hanging external web scraping actors lock up the agent runtime until max platform execution ceilings.
- Rejected alternative: Unbounded synchronous tool invocation - rejected due to severe latency tail-risk and cost waste.

### C6: Internal Routing Logic Inside Crawler Worker
- Decision: Selection between TinyFish and Apify is performed via internal rules and model tool selection within Crawler rather than an external router service.
- Why: Keeps data source selection logic co-located with collection execution.
- What breaks if ignored: Separate routing services add deployment surface area and operational complexity for a binary provider choice.
- Rejected alternative: Standalone Collector Router microservice - rejected as unnecessary infrastructure sprawl for two data providers.

### C7: Pure Python Code Sanitization Before Model Inference
- Decision: Strip HTML, validate schema, detect injection patterns, and filter content in pure Python code within Crawler before passing data to any model.
- Why: Saves Bedrock token consumption and creates a deterministic security boundary against prompt injection.
- What breaks if ignored: Injecting raw web scraping output directly into LLM prompts leads to prompt injection exploitation and massive token waste.
- Rejected alternative: LLM-based raw data filtering - rejected due to high token cost, non-deterministic filtering, and direct vulnerability to prompt injection.

### C12: Mandatory Bedrock Guardrails on Analysis Agent
- Decision: Attach Amazon Bedrock Guardrails directly to the `BedrockModel` utilized by the Analysis worker agent.
- Why: Analysis is the critical boundary where untrusted web content enters LLM reasoning.
- What breaks if ignored: Untrusted text that bypasses code filtering could manipulate model outputs or leak system prompts.
- Rejected alternative: Relying solely on prompt instructions for safety - rejected because prompt-only guardrails are easily subverted by sophisticated jailbreaks.

### C16: Least-Privilege IAM Execution Roles per Runtime
- Decision: Configure separate, least-privilege IAM execution roles for Management, Crawler, and Analysis with explicit ARNs and zero wildcards.
- Why: Enforces strict blast radius confinement across distinct compute components.
- What breaks if ignored: Shared or wildcarded IAM roles allow a compromised worker runtime to access administrative or persistence resources.
- Rejected alternative: Single unified AgentCore IAM execution role - rejected because it violates enterprise security invariants (INV-11).

### C17: AWS Secrets Manager for External Provider Credentials
- Decision: Retrieve TinyFish, Apify, and Langfuse credentials from AWS Secrets Manager at runtime.
- Why: Centralizes secret rotation, access auditing, and eliminates plaintext API keys from code and configuration.
- What breaks if ignored: Hardcoding keys or passing them via unencrypted environment variables exposes credentials in build artifacts.
- Rejected alternative: AgentCore Token Vault - rejected to maintain consistent credential management aligned with company AWS practices.

## Open Decisions

### O1: Bedrock Guardrails Attachment on Management Supervisor
- Question: Should Bedrock Guardrails be attached to the Management supervisor agent?
- Context: Depends on whether Management uses an LLM for reasoning and synthesis or operates as pure deterministic orchestration code.
- Options: Option A (drop Guardrails if pure code routing) vs Option B (keep Guardrails for defense-in-depth if Management reasons over text).
- Trade-offs: Option A minimizes latency and Bedrock invocation cost; Option B provides defense-in-depth against residual prompt injection at the cost of additional latency.

### O2: Bedrock Guardrails Attachment on Crawler Worker
- Question: Is Bedrock Guardrails required on the Crawler worker agent?
- Context: Crawler's primary function is data retrieval and code-based sanitization.
- Options: Option A (drop Guardrails, Crawler has no model call; recommended) vs Option B (enable Guardrails if Crawler summarizes sources via LLM).
- Trade-offs: Option A preserves clear separation of concerns where Crawler cleans in code and Analysis reasons with Guardrails; Option B adds unnecessary token overhead.

