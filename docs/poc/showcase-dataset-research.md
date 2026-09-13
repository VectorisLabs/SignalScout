# SignalScout MVP Showcase Dataset Research

> **Scope: POC.** Dataset selection for the frozen demo case.

**Date:** 2026-07-11  
**Status:** Recommended dataset plan; ready for demo-pack construction  
**Related design:** the POC build guide, [`build-guide.md`](./build-guide.md)

## 1. Recommendation

Use a deliberately small, curated case library rather than a generic financial dataset:

1. **Hero case - Bed Bath & Beyond (BBBY), 2022-08-31 through 2023-02-07.** This is the judged MVP dataset. It contains real, timestamped evidence for both `liquidity_defense` and `operating_footprint_reduction`.
2. **Control case - Macy's, starting 2024-02-27.** Macy's also announced roughly 150 store closures, but paired them with investment in roughly 350 go-forward stores and expansion of smaller and luxury formats. This shows that footprint reduction is a strategic-change pattern, not a bankruptcy label.
3. **Post-MVP validation case - Dollar Tree / Family Dollar, starting 2024-03.** Approximately 970 Family Dollar closures were followed by a review of strategic alternatives. This is a useful untouched case after the two-pattern configuration is frozen.

The one-day build should ship only the BBBY pack in the UI. The Macy's pack should be used in the pitch, Challenger rationale, and one deterministic control test. Dollar Tree should remain outside the hackathon vertical slice.

## 2. Why this is the strongest MVP dataset

The BBBY case is unusually compact and demonstrable:

- one legal entity and stable CIK (`0000886158`);
- authoritative SEC filing timestamps for point-in-time replay;
- financing, debt-exchange, covenant/default, capex, workforce, store, inventory, and vendor signals within six months;
- multiple evidence types supporting two intentionally bounded patterns;
- a known outcome that can be held out of scoring and revealed only after the replay;
- enough ambiguity for a credible Challenger: management consistently described the actions as a turnaround and customer-focused transformation.

The dataset should therefore be described as a **curated strategic-change case pack**, not as a bankruptcy-training dataset.

## 3. Source datasets to use

| Dataset | MVP role | Strength | Limitation / treatment |
|---|---|---|---|
| [SEC Submissions API](https://www.sec.gov/search-filings/edgar-application-programming-interfaces) | Filing history, accession number, form, filing date, acceptance timestamp, primary document | Authoritative availability metadata; no API key | Respect SEC fair-access requirements; freeze the returned metadata for offline replay |
| [SEC filing HTML and exhibits](https://www.sec.gov/edgar/search/) | Primary evidence text and citations | Best source for factual claims and short rights-reviewed excerpts | Filing exhibits are issuer-authored; use short excerpts, deep links, hashes, and an explicit rights review |
| [SEC Company Facts API](https://www.sec.gov/search-filings/edgar-application-programming-interfaces) | Numeric context such as cash, operating cash flow, debt, sales, and inventory | Structured and reproducible | Numeric facts do not express closures, workforce actions, waivers, or strategy; never use alone |
| [SEC Financial Statement Data Sets](https://www.sec.gov/data-research/sec-markets-data/financial-statement-data-sets) | Later cross-company screening and control selection | Bulk, flattened, quarterly, as-filed financial data | Too broad for the one-day MVP; SEC says it is not a substitute for full filings |
| [GDELT event files](https://data.gdeltproject.org/events/) | Optional candidate discovery and partner collector artifact | Large public news-event stream with timestamps | Not authoritative evidence and not a content-rights grant; candidates must pass the SEC/corporate-source gate |

Do not spend MVP time on Kaggle bankruptcy, stock-price, sentiment, or generic news-classification datasets. They optimize the obsolete distress-prediction story and cannot demonstrate cited strategic review, replay integrity, or internal relevance.

## 4. BBBY hero case: frozen evidence shortlist

Use the SEC acceptance timestamp as `available_at`. Use the business occurrence date separately as `event_date`. A signal is replay-eligible only when `available_at <= replay_as_of`.

| ID | `available_at` (UTC) | Primary source | Curated observation | Pattern contribution |
|---|---:|---|---|---|
| `E-BBBY-001` | 2022-08-31 07:40:12 | [8-K Exhibit 99.1, accession 0001193125-22-234603](https://www.sec.gov/Archives/edgar/data/886158/000119312522234603/d279013dex991.htm) | Announced more than $500M of new financing commitments | `liquidity_defense.financing_action` |
| `E-BBBY-002` | 2022-08-31 07:40:12 | Same exhibit | Announced an approximately 20% reduction across corporate and supply chain | `operating_footprint_reduction.workforce_reduction` |
| `E-BBBY-003` | 2022-08-31 07:40:12 | Same exhibit | Reduced planned FY2022 capex from $400M to $250M | Both patterns; count once per pattern, not as independent sources |
| `E-BBBY-004` | 2022-08-31 07:40:12 | Same exhibit | Identified and commenced closure of approximately 150 lower-producing stores | `operating_footprint_reduction.store_closure` |
| `E-BBBY-005` | 2022-09-30 06:18:27 | [10-Q, accession 0000886158-22-000150](https://www.sec.gov/Archives/edgar/data/886158/000088615822000150/bbby-20220827.htm) | Formal quarterly filing repeated the 150-store plan, 20% force reduction, and capex cut | Confirmation of E-002 through E-004; do not inflate independence |
| `E-BBBY-006` | 2023-01-05 08:27:02 | [8-K Exhibit 99.1, accession 0001193125-23-002004](https://www.sec.gov/Archives/edgar/data/886158/000119312523002004/d427733dex991.htm) | Debt exchange conditions were not satisfied and the exchange was terminated | `liquidity_defense.failed_financing` |
| `E-BBBY-007` | 2023-01-05 08:27:02 | Same exhibit | Management disclosed substantial doubt about continuing as a going concern and listed restructuring, new capital, delayed activity, asset sales, and Bankruptcy Code relief as alternatives | `liquidity_defense.going_concern` |
| `E-BBBY-008` | 2023-01-10 07:48:34 | [8-K Exhibit 99.1, accession 0000886158-23-000002](https://www.sec.gov/Archives/edgar/data/886158/000088615823000002/exhibit991-pressreleaseq32.htm) | Reported 150 closures on track, further headcount savings, negative operating cash flow, and reduced liquidity | Both patterns; corroborating operating results |
| `E-BBBY-009` | 2023-01-26 14:29:54 | [10-Q, accession 0000886158-23-000026](https://www.sec.gov/Archives/edgar/data/886158/000088615823000026/bbby-20221126.htm) | Disclosed January defaults, acceleration notice, vendor credit constraints, insufficient repayment resources, and additional footprint/capex actions | Strong `liquidity_defense` cluster plus cross-pattern link |
| `E-BBBY-010` | 2023-02-06 17:17:04 | [8-K Exhibit 99.2, accession 0001193125-23-025748](https://www.sec.gov/Archives/edgar/data/886158/000119312523025748/d441746dex992.htm) | Expanded fleet optimization beyond 400 locations, including about 150 additional BBBY closures, and described up to $1B of annualized SG&A reduction | `operating_footprint_reduction` reaches material intensity |
| `E-BBBY-011` | 2023-02-07 17:26:04 | [8-K, accession 0001193125-23-027117](https://www.sec.gov/Archives/edgar/data/886158/000119312523027117/d455173d8k.htm) | Lenders waived defaults; revolver commitment fell from $1.13B to $565M; initial offering raised about $225M with later proceeds conditional | `liquidity_defense.waiver_or_amendment` and conditional financing |
| `O-BBBY-001` | 2023-04-24 07:34:00 | [8-K, accession 0001193125-23-111754](https://www.sec.gov/Archives/edgar/data/886158/000119312523111754/d465247d8k.htm) | Chapter 11 filing | **Outcome only. Never eligible for pattern score or pre-outcome AI input.** |

### Critical replay correction

`E-BBBY-009` demonstrates why two dates are mandatory. The disclosed defaults occurred around 2023-01-13 and the acceleration notice was dated 2023-01-25, but the filing became publicly available on 2023-01-26 at 14:29:54 UTC. A replay at 2023-01-20 must not contain either fact.

## 5. Signature demo sequence

Use four stops instead of animating every filing:

| Replay stop | What the judge sees | Expected state |
|---|---|---|
| 2022-08-31 07:39 UTC | No approved change evidence | Both patterns `OBSERVING` |
| 2022-08-31 07:41 UTC | Financing, workforce, capex, and 150-store actions appear together | Analyst review; strong intensity but only one source bundle |
| 2023-01-26 14:30 UTC | Failed exchange, going-concern disclosure, vendor pressure, covenant default, and acceleration join the earlier actions | `liquidity_defense = MATERIAL_CHANGE`; footprint remains at least `STRATEGIC_REVIEW` |
| 2023-02-06 17:18 UTC | Additional closures expand the footprint program beyond 400 locations | `operating_footprint_reduction = MATERIAL_CHANGE`; open Impact Map |

The screen should then offer a separate **Reveal later outcome** control. Revealing Chapter 11 must not change any pre-outcome contribution, maturity, hypothesis, or relevance value.

## 6. Minimal seed schema

```json
{
  "evidence_id": "E-BBBY-009",
  "subject_cik": "0000886158",
  "accession_number": "0000886158-23-000026",
  "source_type": "SEC_10_Q",
  "source_url": "https://www.sec.gov/Archives/edgar/data/886158/000088615823000026/bbby-20221126.htm",
  "event_date": "2023-01-25",
  "available_at": "2023-01-26T14:29:54Z",
  "retrieved_at": "<freeze timestamp>",
  "content_sha256": "<hash of frozen source artifact>",
  "excerpt": "<short rights-approved excerpt>",
  "excerpt_locator": "Liquidity and Going Concern; filing section/paragraph",
  "curator_status": "APPROVED",
  "rights_status": "REVIEWED_FOR_PUBLIC_DEMO",
  "signals": [
    {
      "signal_type": "debt_acceleration_or_default",
      "pattern_id": "liquidity_defense",
      "magnitude": "high",
      "confidence": "direct_company_disclosure"
    }
  ]
}
```

Each source document is stored once. Several observations from the same document may create several signals, but they must share the same `source_id`; they cannot falsely increase independent-source corroboration.

## 7. Pattern content for the pack

### `liquidity_defense`

Eligible signal types:

- `failed_financing_or_exchange`;
- `going_concern_disclosure`;
- `debt_acceleration_or_default`;
- `waiver_or_amendment`;
- `conditional_emergency_financing`;
- `capex_or_budget_restriction`;
- `vendor_term_or_credit_constraint`.

Suggested deterministic maturity policy for the demo:

```text
OBSERVING
  fewer than 2 approved signal types

STRATEGIC_REVIEW
  at least 2 approved signal types across at least 2 public releases

MATERIAL_CHANGE
  at least 4 approved signal types,
  including one of going_concern_disclosure or debt_acceleration_or_default,
  across at least 3 public releases within 120 days
```

### `operating_footprint_reduction`

Eligible signal types:

- `store_or_facility_closure`;
- `workforce_reduction`;
- `capex_reduction`;
- `supply_chain_consolidation`;
- `portfolio_or_channel_contraction`.

Suggested deterministic maturity policy for the demo:

```text
OBSERVING
  one weak or unconfirmed action

STRATEGIC_REVIEW
  at least 2 approved signal types,
  or an announced closure program affecting at least 10% of the disclosed fleet

MATERIAL_CHANGE
  at least 3 approved signal types and a later filing confirming execution/expansion,
  or an announced closure program affecting at least 30% of the disclosed fleet
```

Thresholds are demo policy, not statistical probabilities. Freeze them before showing the Macy's control or Dollar Tree validation case.

## 8. Relevance and CompanyContext content

Use the fictional `Northstar Home Retail` context from the approved design with stable field IDs:

| Context field ID | Value |
|---|---|
| `CTX-CHANNEL-01` | `physical_retail_primary` |
| `CTX-CONSTRAINT-01` | `material_store_lease_commitments` |
| `CTX-OBJECTIVE-01` | `working_capital_efficiency` |
| `CTX-CONSTRAINT-02` | `transformation_budget_constrained` |
| `CTX-INITIATIVE-01` | `regional_store_format_pilot` |
| `CTX-INITIATIVE-02` | `evaluating_omnichannel_investment` |

Versioned mapping rules:

| Rule | Trigger | Review area | Why it is relevant |
|---|---|---|---|
| `REL-FOOTPRINT-001-v1` | footprint pattern at `STRATEGIC_REVIEW+` and `CTX-CHANNEL-01` | `store_footprint_assumptions` | A peer's contraction merits checking whether Northstar's store economics and format assumptions still hold |
| `REL-LEASE-001-v1` | closure signal and `CTX-CONSTRAINT-01` | `lease_commitment_flexibility` | Fixed commitments may limit response options; this is a question, not an inferred weakness |
| `REL-LIQUIDITY-001-v1` | liquidity pattern at `STRATEGIC_REVIEW+` and `CTX-OBJECTIVE-01` | `working_capital_resilience` | Review vendor terms, inventory funding, and liquidity buffers using internal data |
| `REL-CAPEX-001-v1` | capex-reduction signal and `CTX-CONSTRAINT-02` | `investment_sequencing` | Determine which transformation commitments are reversible and which are capability-critical |
| `REL-PILOT-001-v1` | footprint pattern and `CTX-INITIATIVE-01` | `pilot_evidence_quality` | Test whether the regional pilot contains enough evidence before broader rollout or cancellation |

None of these rules says Northstar should close stores, cut jobs, or raise capital.

## 9. AI and curator content

### Correlator prompt contract

```text
You are the SignalScout Correlator.
Use only APPROVED evidence whose available_at is not later than replay_as_of.
Do not use outcome records, external knowledge, or unstated CompanyContext.

Return JSON with:
- primary_hypothesis: one bounded explanation of how the approved changes may relate;
- evidence_ids: every factual support;
- relationships: links among signal types;
- uncertainty: what intent or outcome cannot be established;
- strategic_review_questions: questions only, not actions.

Reject any factual sentence that has no evidence_id.
Never predict bankruptcy or recommend layoffs, closures, financing, or restructuring.
```

### Challenger prompt contract

```text
You are the SignalScout Challenger.
Given the same replay-valid evidence and the Correlator output:
- produce the strongest plausible alternative explanation;
- identify evidence that weakens or does not distinguish the primary hypothesis;
- request at least one additional public source;
- request at least one internal CompanyContext fact needed before a decision;
- state what observation would change the review priority.

Do not invent facts and do not use the later known outcome.
```

### Curator checklist

An evidence row can become `APPROVED` only if all checks pass:

- entity and CIK match;
- accession and source URL resolve;
- `available_at` comes from SEC submission metadata;
- event date is not substituted for public availability;
- excerpt supports the normalized observation without interpretation;
- source artifact hash and retrieval time are recorded;
- rights status permits the displayed excerpt;
- duplicate statements from the same filing bundle share one source identity;
- signal type is in the frozen taxonomy;
- later outcome information is absent from pre-outcome evidence and prompts.

## 10. Demo-ready UI copy

### Radar headline

> Two public change patterns now merit review. This is a retrospective reconstruction, not a prediction of outcome.

### Replay empty state

> Move the public-information clock to see only what an analyst could have known at that time.

### Single-event view

> Viewed alone, this is a store-footprint action. SignalScout has not inferred intent from one announcement.

### Pattern view

> Combined with earlier approved financing, workforce, capex, vendor, and covenant evidence, the action becomes part of a broader strategic-change pattern.

### Impact Map boundary

> Relevance comes from Northstar's entered context, not from assumptions about its confidential operations.

### Scenario Board boundary

> These cards organize review options. They do not authorize closures, job actions, financing, or restructuring.

### Outcome reveal

> Later outcome: Chapter 11 was publicly disclosed on April 24, 2023. This record was excluded from every pre-outcome score and AI prompt.

## 11. Control dataset: Macy's

Use [Macy's February 27, 2024 8-K exhibit](https://www.sec.gov/Archives/edgar/data/794367/000162828024007023/macysaboldnewchapterreleas.htm) as the smallest possible control. It announced:

- approximately 150 underproductive location closures through 2026;
- priority investment in approximately 350 go-forward locations;
- continued small-format expansion;
- Bloomingdale's and Bluemercury expansion;
- asset monetization and operational modernization.

Expected behavior:

- `operating_footprint_reduction` may reach `STRATEGIC_REVIEW` or `MATERIAL_CHANGE`, depending on the frozen scale threshold;
- `liquidity_defense` must not activate merely because stores are closing;
- the Challenger should explain portfolio optimization and reinvestment as a strong alternative to distress;
- no bankruptcy outcome should be suggested.

This control is more valuable than a random healthy retailer because it shares the visually dramatic closure signal while differing in the surrounding evidence.

## 12. Partner credentials and receipts

Datasets do not satisfy partner-credit requirements by themselves. For every partner named in the pitch, preserve both a credential receipt and a material-use receipt:

| Claimed partner | Credential receipt | Material artifact required in judged flow |
|---|---|---|
| AWS Bedrock | Console screenshot or redacted model-access record; invocation request ID and timestamp | Validated Correlator/Challenger JSON used to build the frozen demo output |
| Apify or TinyFish | Redacted account/workspace screenshot and run ID | Raw candidate artifact that led to at least one displayed, curator-approved source; otherwise remove the logo/claim |
| Netlify | Site/team screenshot and deploy ID | Public deployed demo URL and deploy log |
| Optional Langfuse | Project screenshot and trace ID | Trace for a real AI generation used by the demo; otherwise cut it |

Store receipts in a non-public `receipts/` package or secret-safe submission folder. Never commit tokens, cookies, full credentials, or private URLs.

The SEC API requires no API key, so it is a source receipt rather than a partner credential. Freeze the API response fragment containing accession, filing date, acceptance timestamp, form, and primary document for every BBBY source.

## 13. Proposal language after the pivot

### One-line product proposal

> SignalScout reconstructs how competitors are changing, proves every pattern with point-in-time public evidence, and turns it into a cited strategic-review agenda for your own company.

### MVP proof statement

> In the BBBY retrospective, SignalScout connects financing, workforce, capex, store, vendor, and covenant disclosures that were fragmented across public filings; separates those observations from a fictional peer's entered context; challenges the leading explanation; and produces review scenarios without using the later bankruptcy outcome.

### What the MVP is not claiming

> The demo does not train on BBBY to predict bankruptcy. It proves evidence integrity, bounded pattern detection, transparent relevance, and human decision workflow.

## 14. Build order for the remaining work

1. Freeze SEC submission metadata and the 11 BBBY evidence records above.
2. Curate short excerpts, locators, hashes, and rights decisions.
3. Implement the two deterministic pattern policies and the Macy's control test.
4. Load the five Northstar context fields and five relevance rules.
5. Run Bedrock once for Correlator and Challenger; validate and freeze the output.
6. Build the four-stop replay and the five approved views.
7. Capture partner receipts only for partners materially used.
8. Replace every distress-prediction sentence in the pitch and submission with the proposal language above.

## 15. Dataset acceptance checklist

- BBBY CIK is `0000886158` everywhere.
- Every row has accession number, `available_at`, source URL, retrieval timestamp, and hash.
- Replay uses `available_at`, never event date or fiscal period end.
- Multiple signals from one source bundle do not inflate corroboration.
- Curator state and rights state are explicit and separate.
- Bankruptcy outcome is display-only and unavailable to pre-outcome scoring and AI.
- CompanyContext is fictional, labeled, and provenance-tracked.
- Macy's control does not trigger `liquidity_defense` without qualifying evidence.
- AI claims cite approved evidence IDs; scenarios cite context field IDs.
- Partner claims have credential and material-use receipts.

## 16. Additional comparable datasets

These cases are suitable for TinyFish candidate collection after the BBBY vertical slice works:

| Priority | Company / CIK | Suggested window | Why it is useful | Intended role |
|---|---|---|---|---|
| 1 | Big Lots / `0000768835` | 2023-01-01 to 2024-09-09 | Credit amendments, permitted store closures increasing from 150 to 315, lender budgets/reporting, and a later Chapter 11 outcome | Closest second retrospective retail case |
| 2 | Rite Aid / `0000084129` | 2022-01-01 to 2023-10-15 | Store-footprint optimization, debt burden, transformation language, litigation/liquidity pressure, and later Chapter 11 restructuring | Strong challenger-rich positive case |
| 3 | LL Flooring / `0001396033` | 2023-01-01 to 2024-08-11 | Strategic sale process, liquidity pressure, 94 closing locations, more than 300 continuing locations, and later DIP financing | Compact specialty-retail case |
| 4 | Express / `0001483510` | 2023-01-01 to 2024-04-22 | Omnichannel portfolio, leases/store rationalization, strategic alternatives, and later Chapter 11 sale process | Apparel-sector transfer test |
| 5 | Macy's / `0000794367` | 2024-02-27 onward | Approximately 150 closures paired with investment in approximately 350 go-forward stores and format expansion | Primary non-distress control |
| 6 | Walgreens Boots Alliance / `0001618921` | 2024-01-01 onward | Large footprint optimization program with stated expected operating and cash-flow benefits | Scale/control case |
| 7 | Dollar Tree / `0000935703` | 2023-01-01 onward | Approximately 970 Family Dollar closures followed by strategic-alternatives review and continued investment | Post-MVP untouched validation case |

Useful starting evidence includes [Big Lots' August 2024 10-Q](https://www.sec.gov/Archives/edgar/data/768835/000076883524000067/big-20240803.htm), [Rite Aid's October 2023 restructuring release](https://www.sec.gov/Archives/edgar/data/84129/000110465923109236/tm2328505d1_ex99-1.htm), [LL Flooring's August 2024 release](https://www.sec.gov/Archives/edgar/data/1396033/000119312524198385/d794510dex991.htm), and [Walgreens' October 2024 footprint filing](https://www.sec.gov/Archives/edgar/data/1618921/000119312524237203/d870298d8k.htm).

Do not label every company above a positive `liquidity_defense` case in advance. TinyFish is expected to return candidates; the frozen rules and curator decide whether a pattern activates.

## 17. TinyFish operating model

Use TinyFish in three steps:

1. **Search:** discover official SEC, investor-relations, court, regulator, and corporate sources.
2. **Agent or Fetch:** open the source, render dynamic content, follow filing/exhibit links, and return structured candidates.
3. **SignalScout curator:** verify SEC submission metadata, freeze the artifact, hash it, decide rights, normalize the observation, and approve or reject it.

TinyFish output is always `UNTRUSTED_SOURCE_CANDIDATE`. It cannot set `curator_status`, `rights_status`, pattern maturity, internal relevance, or outcome eligibility.

Run one company per TinyFish job. Preserve the TinyFish `run_id`, timestamps, result JSON, starting URL, exact goal, and a screenshot or streaming-record reference as the partner receipt.

## 18. TinyFish prompts

### Prompt A - case screening

```text
You are collecting candidate public evidence for SignalScout, a strategic-change intelligence MVP.

Goal:
Find publicly accessible evidence for the company below within the specified date window that may indicate either:
1. liquidity defense; or
2. operating footprint reduction.

Company:
- legal name: {{COMPANY_NAME}}
- CIK: {{CIK_10_DIGITS}}
- historical ticker: {{TICKER}}
- date window: {{START_DATE}} through {{END_DATE}}

Source priority:
1. SEC filings and their exhibits;
2. official investor-relations or corporate releases;
3. bankruptcy-court, regulator, or government sources;
4. reputable news only to discover a primary source.

Search for these candidate signal types:
- failed or terminated financing or debt exchange;
- going-concern disclosure;
- covenant breach, default, acceleration, waiver, amendment, or forbearance;
- emergency, conditional, asset-backed, FILO, or DIP financing;
- capex, budget, or working-capital restriction;
- vendor terms, supplier constraints, or inventory-funding pressure;
- store, office, facility, or distribution-center closures;
- workforce reductions;
- supply-chain consolidation;
- channel, banner, format, or portfolio contraction;
- strategic-alternatives, asset-sale, or restructuring review.

Important rules:
- Match the legal entity and CIK. Reject similarly named entities.
- Do not treat article publication dates as SEC filing acceptance timestamps.
- Record both event_date and visible publication/filing date when available.
- Do not infer intent, bankruptcy, distress, success, or causation.
- Do not use a later bankruptcy outcome to characterize earlier evidence.
- Do not approve evidence or assign pattern maturity.
- Prefer primary-source URLs. If a news item is used for discovery, return the news URL and the primary URL it led to.
- Deduplicate repeated copies of the same announcement or filing bundle.
- If a value or date is not visible, return null. Never guess.

Return JSON only:
{
  "company": {
    "legal_name": "string",
    "cik": "string",
    "ticker": "string|null"
  },
  "search_window": {
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD"
  },
  "candidates": [
    {
      "candidate_id": "CAND-001",
      "source_title": "string",
      "source_url": "string",
      "source_domain": "string",
      "source_type": "SEC_8_K|SEC_10_Q|SEC_10_K|SEC_EXHIBIT|CORPORATE_RELEASE|COURT|REGULATOR|NEWS_DISCOVERY_ONLY|OTHER",
      "accession_number": "string|null",
      "form_type": "string|null",
      "event_date": "YYYY-MM-DD|null",
      "visible_publication_date": "YYYY-MM-DD|null",
      "sec_acceptance_at": null,
      "observation_paraphrase": "one neutral factual sentence",
      "supporting_excerpt": "short exact excerpt, maximum 35 words",
      "excerpt_locator": "section, heading, page, paragraph, or nearby label",
      "candidate_signal_types": ["string"],
      "possible_pattern_ids": ["liquidity_defense|operating_footprint_reduction"],
      "later_outcome": false,
      "duplicate_group": "string|null",
      "primary_source_found": true,
      "collection_notes": "string|null"
    }
  ],
  "rejected_results": [
    {
      "url": "string",
      "reason": "wrong entity|outside window|duplicate|no primary source|unsupported claim|inaccessible|other"
    }
  ],
  "coverage_gaps": ["string"],
  "run_summary": {
    "candidate_count": 0,
    "primary_source_count": 0,
    "news_only_count": 0
  }
}
```

### Prompt B - exact source extraction

```text
You are extracting one untrusted SourceCandidate for SignalScout from the page at the starting URL.

Target entity:
- legal name: {{COMPANY_NAME}}
- CIK: {{CIK_10_DIGITS}}

Tasks:
1. Confirm the page identifies the target entity or is an official filing/exhibit for it.
2. Extract the page title, document/form type, accession number if visible, event date, visible filing/publication date, and canonical source URL.
3. Find only passages relevant to the allowed signal types below.
4. Return a neutral paraphrase plus a short exact excerpt and a precise locator for each passage.
5. Follow an exhibit link only when it is part of the same official filing and directly relevant.

Allowed signal types:
- failed_financing_or_exchange
- going_concern_disclosure
- debt_acceleration_or_default
- waiver_or_amendment
- conditional_emergency_financing
- capex_or_budget_restriction
- vendor_term_or_credit_constraint
- store_or_facility_closure
- workforce_reduction
- supply_chain_consolidation
- portfolio_or_channel_contraction
- strategic_alternatives_or_asset_sale

Rules:
- This is candidate extraction, not evidence approval.
- Do not calculate a score or assign maturity.
- Do not infer motivation or outcome.
- Keep each exact excerpt at 35 words or fewer.
- Do not merge facts from different documents into one observation.
- Use null for unavailable values; never guess.
- If the page is a later bankruptcy filing, mark outcome_only=true.
- If the page is not about the target entity, return entity_match=false and no observations.

Return JSON only:
{
  "entity_match": true,
  "source": {
    "title": "string",
    "canonical_url": "string",
    "source_type": "string",
    "accession_number": "string|null",
    "form_type": "string|null",
    "event_date": "YYYY-MM-DD|null",
    "visible_publication_date": "YYYY-MM-DD|null"
  },
  "observations": [
    {
      "observation_paraphrase": "string",
      "supporting_excerpt": "string",
      "excerpt_locator": "string",
      "candidate_signal_type": "string",
      "possible_pattern_id": "liquidity_defense|operating_footprint_reduction",
      "outcome_only": false
    }
  ],
  "warnings": ["string"]
}
```

### Recommended first TinyFish jobs

Run Prompt A separately with:

```text
Big Lots, CIK 0000768835, ticker BIG, 2023-01-01 through 2024-09-08
Rite Aid, CIK 0000084129, ticker RAD, 2022-01-01 through 2023-10-14
LL Flooring Holdings, CIK 0001396033, ticker LL, 2023-01-01 through 2024-08-10
Macy's, CIK 0000794367, ticker M, 2024-02-27 through 2025-12-31
```

The retrospective windows stop one day before the known filing outcome so the discovery result can be audited for leakage. Run a separate outcome-only job afterward if the demo needs the reveal record.
