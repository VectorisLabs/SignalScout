# Signal Taxonomy, Metrics and Decision Gates

> **Scope: business.** The frozen vocabulary of the product: which patterns exist, which signal types feed them, which metrics must be present, and which decision sections are blocked when they are not. Changing anything here changes the product, not an implementation detail.

Every numeric threshold in this file is **policy, not a calibrated probability**. Current calibration is the POC, frozen 2026-07-12; see section 5.

---

## 1. Patterns

Two patterns, deliberately bounded. Do not add a third without a recorded decision.

| # | Pattern | Meaning |
|---|---|---|
| PAT-01 | `liquidity_defense` | The subject is acting to defend liquidity or has disclosed pressure on it |
| PAT-02 | `operating_footprint_reduction` | The subject is contracting its operating footprint, workforce or capital commitment |

### PAT-01 eligible signal types

`failed_financing_or_exchange`, `going_concern_disclosure`, `debt_acceleration_or_default`, `waiver_or_amendment`, `conditional_emergency_financing`, `capex_or_budget_restriction`, `vendor_term_or_credit_constraint`.

### PAT-02 eligible signal types

`store_or_facility_closure`, `workforce_reduction`, `capex_reduction`, `supply_chain_consolidation`, `portfolio_or_channel_contraction`.

A signal type outside these lists cannot contribute to a pattern. `strategic_alternatives_or_asset_sale` is collectible as a candidate signal type but is not currently wired to either pattern.

## 2. Maturity states

Three states, in order. A pattern is always in exactly one.

| State | Meaning |
|---|---|
| `OBSERVING` | Not enough approved evidence to treat as a pattern |
| `STRATEGIC_REVIEW` | Enough to merit human review |
| `MATERIAL_CHANGE` | Enough to treat as a material, executing change |

### PAT-01 maturity policy

```text
OBSERVING          fewer than 2 approved signal types
STRATEGIC_REVIEW   at least 2 approved signal types across at least 2 public releases
MATERIAL_CHANGE    at least 4 approved signal types,
                   including going_concern_disclosure or debt_acceleration_or_default,
                   across at least 3 public releases within 120 days
```

### PAT-02 maturity policy

```text
OBSERVING          one weak or unconfirmed action
STRATEGIC_REVIEW   at least 2 approved signal types,
                   or an announced closure program affecting at least 10% of the disclosed fleet
MATERIAL_CHANGE    at least 3 approved signal types and a later filing confirming execution or expansion,
                   or an announced closure program affecting at least 30% of the disclosed fleet
```

Maturity is computed by deterministic code (INV-06 in [`domain-invariants.md`](./domain-invariants.md)), only from approved evidence visible at the replay point (INV-01), and never from an outcome record (INV-02).

**A footprint reduction is not distress.** PAT-02 reaching `STRATEGIC_REVIEW` or `MATERIAL_CHANGE` must not activate PAT-01. Closures paired with reinvestment are portfolio optimization, and the product must be able to say so.

## 3. Metric dictionary

Required unless marked optional. Normalized units are fixed; billions convert to millions deterministically. Currency and reporting period are never inferred when the source text does not state them explicitly.

| # | Group | Metric | Unit | Required |
|---|---|---|---|---|
| MET-01 | Revenue | Revenue / Net Sales | `USD_MILLIONS` | Yes |
| MET-02 | Profit | Gross Profit | `USD_MILLIONS` | Yes |
| MET-03 | Profit | Operating Income | `USD_MILLIONS` | Yes |
| MET-04 | Cost | SG&A | `USD_MILLIONS` | Yes |
| MET-05 | Cost | Restructuring Cost | `USD_MILLIONS` | Yes |
| MET-06 | Liquidity | Cash and Cash Equivalents | `USD_MILLIONS` | Yes |
| MET-07 | Cash flow | Operating Cash Flow | `USD_MILLIONS` | Yes |
| MET-08 | Investment | Capital Expenditure | `USD_MILLIONS` | Yes |
| MET-09 | Working capital | Inventory | `USD_MILLIONS` | Yes |
| MET-10 | Working capital | Accounts Payable | `USD_MILLIONS` | Yes |
| MET-11 | Debt | Short-term Debt | `USD_MILLIONS` | Yes |
| MET-12 | Debt | Long-term Debt | `USD_MILLIONS` | Yes |
| MET-13 | Operations | Store Count | `COUNT` | Yes |
| MET-14 | Workforce | Employee Count | `COUNT` | No |

`REPORTED` quality means the value is directly stated in approved text. A calculated value requires a distinct, declared derivation basis. An ambiguous label, a missing scale, or a mixed reporting period is rejected rather than resolved by guessing.

## 4. Readiness sections and the blocking rule

| # | Section |
|---|---|
| RDY-01 | `RESTRUCTURING_SCENARIOS` |
| RDY-02 | `COST_BENEFIT_RISK` |
| RDY-03 | `REVENUE_CASH_FLOW_OPERATING_IMPACT` |
| RDY-04 | `EXECUTIVE_DASHBOARD` |
| RDY-05 | `DECISION_REPORT` |

Missing required metric coverage yields `BLOCKED_BY_MISSING_METRICS` for the affected section. The blocker and the specific missing metrics are displayed to the user. This is INV-07 made concrete: a section is never rendered as ready on data it does not have, and a blocked section is never quietly downgraded to a partial answer.

## 5. Calibration

| Item | Status |
|---|---|
| Pattern set, signal types, maturity state names | Stable product vocabulary |
| Numeric thresholds in section 2 | **Tunable.** Current calibration: POC, frozen 2026-07-12 |
| Metric dictionary and required flags | Stable |

Thresholds were frozen before running the non-distress control case, and must stay frozen while a control or validation case is being evaluated - otherwise the control proves nothing. Retuning is a recorded change to this file, not a per-case adjustment.

Dataset selection, the specific evidence records, and the fictional entity-context values used to demonstrate all of the above are POC concerns and live in [`../poc/showcase-dataset-research.md`](../poc/showcase-dataset-research.md).
