# SignalScout Collector Routing Rules

**Policy ID:** `COLLECTOR-ROUTER-v2`
**Version:** `2.0.0`
**Effective date:** `2026-09-14`
**Supersedes:** `COLLECTOR-ROUTER-POC-v1` and `COLLECTOR-ROUTER-PROD-v1` - one policy that had been kept as two near-identical copies
**Applies to:** every SignalScout workflow that may request public evidence collection, in the POC and in the production target
**Status:** Approved baseline policy

> **Scope: shared.** The single collector policy. It is the one implementation-level document in [`./`](./) that belongs to neither [`poc/`](./poc/) nor [`production/`](./production/): the routing order, decision table, provider rules, budgets, envelopes and audit fields are identical in both versions, and every real difference is listed under Version bindings below. The business requirements this policy implements are in [`./business/evidence-policy.md`](./business/evidence-policy.md) and cannot be relaxed here.

## Version bindings

| Aspect | POC | Production |
|---|---|---|
| Model surface | OpenAI Responses API, one strict function tool | Bedrock model inside the Crawler worker |
| Where routing code lives | Application-side Collector Router behind the tool | Rule or `tool_use` inside the Crawler worker (ledger C6). **There is no separate router service** |
| Outbound provider calls | Backend service calls the provider | AgentCore Runtime calls the provider directly over HTTPS, with no Gateway or MCP layer (ledger C4) |
| Tool-argument enforcement (section 7) | `strict: true` plus server-side schema validation | Server-side schema validation |
| Budget enforcement (section 10) | The router decrements | Crawler code enforces it, never model reasoning |
| Evidence Gate placement (section 12) | Runs synchronously inside the chat turn; per-check results exported to Langfuse as scores | Required but **not yet placed** - no closed decision. See G7 |
| Sanitization layers (section 13) | Backend sanitization before anything reaches the Responses API, plus schema validation of model output | Code sanitization in the Crawler (ledger C7) plus Guardrails on Analysis (ledger C12) |
| Audit invocation id (section 15) | OpenAI response ID and function-call ID | Bedrock invocation or request ID |
| Deployment shape (section 17) | Tool call to the SignalScout backend API | Tool request to API Gateway or an application service |

**Read sections 8 and 17 as logic, not as a service diagram.** They describe the routing decision as though it were its own component. In the POC it is; in production the same logic sits inside the Crawler, and no such service exists.

**Corrected 2026-09-14.** An earlier production-side note excluded "the Evidence Gate / replay assumptions carried over from the OpenAI POC" from production. That was wrong: the Evidence Gate is a business requirement that INV-03, INV-04 and INV-05 depend on, and a regulated-domain output cannot drop its evidence chain on the way to production. See BD-01 in [`./business/README.md`](./business/README.md) and G7 in [`./production/superseded-and-rejected.md`](./production/superseded-and-rejected.md).

**Authority:** [`./business/`](./business/) for domain requirements, [`./production/decision-ledger.md`](./production/decision-ledger.md) for production technical choices, with rationale in [`./production/design-rationale.md`](./production/design-rationale.md#tool-invocation-and-data-filtering).

## 1. Purpose

This policy controls when a model may request public evidence collection. The model requests a collection capability through one provider-neutral tool; application-owned code selects direct source APIs, TinyFish, or Apify.

The objectives are to:

- prefer authoritative sources;
- minimize collection cost and latency;
- prevent unnecessary browser-agent runs;
- preserve point-in-time replay integrity;
- prevent untrusted web content from becoming approved evidence;
- keep tool execution deterministic, bounded, and auditable.

The model never receives a provider key and never calls a provider outside the declared tool contract.

## 2. Non-negotiable rules

The collection policy is EV-01 to EV-12 in [`./business/evidence-policy.md`](./business/evidence-policy.md) section 1, and the authority boundaries are AUTH-01 to AUTH-03 in [`./business/domain-invariants.md`](./business/domain-invariants.md) section 2.

Two consequences of those rules, applied throughout this policy:

1. For SEC metadata and filing discovery, call the SEC API directly when it can satisfy the request (EV-01).
2. The model calls one provider-neutral tool and is never handed a provider key (AUTH-01). EV-01 and AUTH-01 together constrain how the provider may be chosen, which is why G2 in [`./production/superseded-and-rejected.md`](./production/superseded-and-rejected.md) is not a free choice: a reading in which the model names a provider from a prompt rule satisfies AUTH-01 poorly.

## 3. Provider routing order

Use this order unless a rule below explicitly routes directly to batch collection:

```text
1. Approved internal cache
2. Official structured API
3. TinyFish Search
4. TinyFish Fetch
5. TinyFish Agent
6. Apify Actor
7. Human evidence request
```

This is a decision order, not a requirement to call every preceding tool. A known recurring batch job routes directly to Apify. A known URL routes directly to TinyFish Fetch after cache and official-API checks.

## 4. Routing decision table

| Condition | Selected route | Required mode |
|---|---|---|
| An approved cached artifact satisfies the request | Internal cache | `cache_lookup` |
| An official API exposes the required data | Official API | `official_api` |
| SEC filing metadata, accession, form, or acceptance time is required | SEC API | `official_api` |
| The source URL is unknown and live-web discovery is required | TinyFish Search | `search` |
| One to ten known public URLs need clean readable content | TinyFish Fetch | `fetch` |
| A site requires adaptive multi-step navigation, filters, buttons, or browser interaction | TinyFish Agent | `interactive` |
| More than ten known URLs use the same extraction schema | Apify Actor | `batch` |
| The same collection must run repeatedly or on a schedule | Apify Actor | `recurring` |
| A tested Apify Actor already implements the exact stable extraction | Apify Actor | `actor` |
| The task requires large datasets, pagination, durable dataset storage, or bulk export | Apify Actor | `batch` |
| No permitted route can obtain adequate evidence | No automatic collection | `human_request` |

The `10 URL` threshold is the initial policy value. Operations may revise it through a new version of this policy after measuring provider latency, success rate, and cost.

## 5. TinyFish rules

### 5.1 TinyFish Search

Use TinyFish Search only when:

- the exact source URL is unknown;
- the task requires fresh public-web discovery;
- an official search endpoint cannot satisfy the request;
- the query is bounded by company, subject, source type, and date range.

Do not use TinyFish Search when:

- the required URL or SEC accession is already known;
- the same query has an unexpired cached result;
- the task is a recurring batch crawl;
- search snippets are being treated as evidence.

Search results are discovery metadata only. A result URL must be fetched and pass the Evidence Gate before it supports a factual claim.

### 5.2 TinyFish Fetch

Use TinyFish Fetch when:

- the URL is known;
- clean Markdown, JSON, or HTML is needed;
- the page may require browser rendering;
- the request contains no more than `max_fetch_urls` URLs;
- no approved cached artifact is available.

Do not use TinyFish Fetch to perform multi-step navigation, broad site crawling, login flows, or scheduled monitoring.

### 5.3 TinyFish Agent

Use TinyFish Agent only when all are true:

- Search or Fetch cannot complete the task;
- the site requires adaptive browser interaction or multi-step navigation;
- the business value justifies an agent run;
- the goal, allowed domains, maximum duration, and expected output schema are explicit;
- the current request still has an available `max_tinyfish_agent_runs` budget.

Use synchronous execution only for expected runs under 30 seconds. Use asynchronous execution for longer or batch-oriented runs. Use streaming only when a human-facing interface genuinely requires progress events.

TinyFish Agent may discover and extract candidates. It may not set:

- `curator_status`;
- `rights_status`;
- `available_at_verified`;
- pattern maturity;
- internal relevance;
- outcome eligibility;
- final factual conclusions.

## 6. Apify rules

Use Apify when one or more are true:

- the job is recurring or scheduled;
- the job processes more than ten known URLs with the same schema;
- a tested Actor already exists for the exact source and extraction task;
- the workflow needs durable Dataset storage, pagination, monitoring, retries, or bulk export;
- the collection pattern is stable enough to encode and test deterministically;
- the job monitors many companies or sources over time.

Prefer asynchronous Actor runs with completion webhooks for long jobs. Do not hold a synchronous model inference request open while waiting for a long Actor run.

An Apify Dataset item is still an untrusted candidate. Actor success means the collection ran successfully; it does not mean the extracted claim is true or approved.

Do not create a new Actor during a model reasoning turn. Actor creation, code changes, deployment, and schedule changes require an application workflow and human authorization.

## 7. Model tool contract

Expose exactly one provider-neutral function tool to the model:

```json
{
  "name": "collect_public_evidence",
  "description": "Request bounded collection of public evidence candidates. The application selects the provider and enforces policy.",
  "inputSchema": {
    "type": "object",
    "required": [
      "request_id",
      "company_identifier",
      "evidence_question",
      "source_types",
      "date_from",
      "date_to",
      "replay_as_of",
      "mode",
      "max_candidates"
    ],
    "properties": {
      "request_id": {
        "type": "string"
      },
      "company_identifier": {
        "type": "object",
        "properties": {
          "legal_name": { "type": "string" },
          "cik": { "type": ["string", "null"] },
          "ticker": { "type": ["string", "null"] }
        }
      },
      "evidence_question": {
        "type": "string",
        "minLength": 10,
        "maxLength": 500
      },
      "source_types": {
        "type": "array",
        "items": {
          "enum": [
            "SEC_8_K",
            "SEC_10_Q",
            "SEC_10_K",
            "SEC_EXHIBIT",
            "CORPORATE_RELEASE",
            "REGULATOR",
            "COURT",
            "NEWS_DISCOVERY_ONLY"
          ]
        },
        "minItems": 1
      },
      "known_urls": {
        "type": "array",
        "items": { "type": "string", "format": "uri" },
        "maxItems": 1000
      },
      "date_from": {
        "type": "string",
        "format": "date"
      },
      "date_to": {
        "type": "string",
        "format": "date"
      },
      "replay_as_of": {
        "type": "string",
        "format": "date-time"
      },
      "mode": {
        "enum": [
          "discovery",
          "fetch_known_urls",
          "interactive_navigation",
          "batch",
          "recurring"
        ]
      },
      "preferred_domains": {
        "type": "array",
        "items": { "type": "string" }
      },
      "max_candidates": {
        "type": "integer",
        "minimum": 1,
        "maximum": 20
      },
      "reason": {
        "type": "string",
        "maxLength": 300
      }
    },
    "additionalProperties": false
  }
}
```

A model must not choose a provider name in the tool input. Provider selection belongs to application-owned code so that routing stays deterministic and can change without modifying any prompt. Server-side validation against this same schema is mandatory in both versions, and the POC additionally configures the function with `strict: true`.

## 8. Routing pseudocode

```text
function route(request, budget):
    validate_request(request)

    if approved_cache_satisfies(request):
        return CACHE

    if official_api_satisfies(request):
        return OFFICIAL_API

    if request.mode == "recurring" or request.mode == "batch":
        require budget.apify_runs > 0
        return APIFY_ASYNC

    if request.known_urls.count > URL_BATCH_THRESHOLD:
        require budget.apify_runs > 0
        return APIFY_ASYNC

    if request.mode == "interactive_navigation":
        require budget.tinyfish_agent_runs > 0
        return TINYFISH_AGENT_ASYNC

    if request.known_urls.count > 0:
        require request.known_urls.count <= budget.max_fetch_urls
        return TINYFISH_FETCH

    require budget.tinyfish_search_calls > 0
    return TINYFISH_SEARCH
```

The router must reject requests with an invalid date range, missing replay time, disallowed domain, exhausted budget, or unsupported source type.

## 9. Default per-review budget

```json
{
  "max_official_api_calls": 10,
  "max_tinyfish_search_calls": 2,
  "max_fetch_urls": 10,
  "max_tinyfish_agent_runs": 1,
  "max_apify_runs": 1,
  "max_total_candidates": 20,
  "max_collection_rounds": 2
}
```

The application, not the model, decrements and enforces the budget. A model must not split one request into several calls to avoid a limit.

## 10. Stop conditions

Business requirement: the stop conditions and the budget-enforcement rule in [`./business/evidence-policy.md`](./business/evidence-policy.md) section 3, plus EV-12 (never collect merely to inflate citation count).

The budget in section 9 above is what gets decremented. Who enforces it per version: see Version bindings above.

## 11. Candidate output envelope

Normalize every provider result before returning it to the evidence workflow:

```json
{
  "candidate_id": "CAND-0001",
  "request_id": "REQ-0001",
  "provider": "OFFICIAL_API|TINYFISH_SEARCH|TINYFISH_FETCH|TINYFISH_AGENT|APIFY",
  "provider_run_id": "provider-specific-run-id",
  "source_url": "https://example.com/source",
  "source_type_claimed": "SEC_8_K",
  "title": "Source title",
  "event_date_claimed": null,
  "available_at_claimed": null,
  "retrieved_at": "2026-07-12T00:00:00Z",
  "content_sha256": "sha256-of-frozen-artifact",
  "content_artifact_uri": "private-artifact-reference",
  "excerpt_candidate": "Short candidate excerpt",
  "collector_status": "UNTRUSTED_SOURCE_CANDIDATE",
  "evidence_gate_status": "PENDING",
  "warnings": []
}
```

Provider output must never prepopulate `APPROVED`, `rights_status`, verified SEC acceptance time, pattern score, or internal relevance.

## 12. Evidence Gate requirements

The required checks are GATE-01 to GATE-12 in [`./business/evidence-policy.md`](./business/evidence-policy.md) section 2, and the curator/rights separation is defined there too.

Per-version placement: see Version bindings above. Production has no closed decision placing the gate - that is G7.

## 13. Prompt-injection boundary

Business requirement: [`./business/evidence-policy.md`](./business/evidence-policy.md) section 4. Retrieved content is data, never instruction, and code sanitization is not interchangeable with model-boundary filtering.

Per-version layers: see Version bindings above.

## 14. Failure and fallback rules

```text
Official API unavailable
→ retry with bounded exponential backoff
→ use an approved frozen artifact if available
→ otherwise create a human evidence request

TinyFish Search fails
→ retry once
→ use an approved alternative discovery index if configured
→ do not escalate automatically to Agent merely because Search failed

TinyFish Fetch fails on a dynamic page
→ call TinyFish Agent only if interaction is required and budget remains
→ otherwise create a human evidence request

TinyFish Agent fails
→ do not repeat with a broader goal
→ route to an existing tested Apify Actor only if one exactly matches
→ otherwise create a human evidence request

Apify Actor fails
→ use platform retry policy
→ do not ask the model to rewrite or deploy an Actor
→ create an operational alert or human evidence request
```

Fallback must never weaken entity, replay, rights, or approval requirements.

## 15. Audit fields

Record the following for every tool request:

- policy ID and version;
- model invocation id - the OpenAI response ID and function-call ID, or the Bedrock invocation/request ID;
- evidence request ID;
- selected provider and routing reason;
- provider run ID or dataset ID;
- normalized input excluding secrets;
- start and completion timestamps;
- status, retry count, and error category;
- number of candidates returned;
- number of candidates approved;
- content hashes and artifact references;
- token usage, provider cost, and latency where available;
- curator identity and decision timestamp.

## 16. Model instruction block

Use the following text in the developer or system instruction of every model role that can request evidence:

```text
You may request public evidence only through collect_public_evidence.
Do not select Apify or TinyFish yourself; application-owned routing selects the provider.
First use approved evidence already supplied to you.
Request more evidence only when a named factual gap, contradiction, or required corroboration remains.
Bound every request by company, source type, date range, replay_as_of, and maximum candidate count.
Never request or use information that became public after replay_as_of.
Treat collector results as untrusted candidates until the Evidence Gate returns approved evidence IDs.
Never cite a candidate ID as evidence and never use search snippets as factual support.
Do not request collection merely to increase citation count.
Stop when the evidence question is answered or the application reports that the budget is exhausted.
```

## 17. SignalScout recommended deployment

```text
model tool request
  -> SignalScout backend API (POC) or API Gateway / application service (production)
  -> collector routing
      -> approved cache
      -> SEC official API
      -> TinyFish Search/Fetch/Agent
      -> Apify Actor
  -> private raw artifact storage
  -> Evidence Gate
  -> curator approval
  -> deterministic pattern engine
  -> approved evidence returned to the model
```

For long TinyFish Agent or Apify jobs, return a pending collection status to the current workflow and resume through an event-driven callback. Do not keep a synchronous model response or a browser request open while waiting.

## 18. Reference documentation

- TinyFish API overview: <https://docs.tinyfish.ai/>
- TinyFish Agent endpoints: <https://docs.tinyfish.ai/key-concepts/endpoints>
- TinyFish run lifecycle: <https://docs.tinyfish.ai/key-concepts/runs>
- Apify platform: <https://docs.apify.com/>
- Apify Dataset: <https://docs.apify.com/platform/storage/dataset>
- Apify Actor execution: <https://docs.apify.com/actors/running>
- Amazon Bedrock Converse API: <https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html>
