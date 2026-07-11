import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { CasePackageSchema, type CasePackage } from "../src/contracts";
import { buildMetricLens } from "../src/report/build-metric-lens";
import { extractMetricObservations } from "../src/metrics/extract-metric-observations";
import { approvedEvidence, approvedSources, metricInputs } from "../tests/fixtures/metric-text";

export function buildCase(): CasePackage {
  const metrics = metricInputs.flatMap((input) => extractMetricObservations(input, approvedSources, approvedEvidence));
  const lens = buildMetricLens(metrics);
  const earlyIds = approvedEvidence.filter((item) => item.publiclyAvailableAt <= "2022-08-31T23:59:59.000Z").map((item) => item.id);
  return CasePackageSchema.parse({
    schemaVersion: "1.0", caseId: "bbb-retrospective-v1", offline: true,
    company: { name: "Bed Bath & Beyond", ticker: "BBBY", comparisonContext: "Northstar Home Retail is a fictional comparison company used only for strategic scenario framing." },
    watchQuestion: "How should a home-retail competitor respond as restructuring signals cluster?",
    sources: approvedSources, evidence: approvedEvidence, metrics, readiness: lens.readiness,
    replay: [
      { asOf: "2021-04-21T12:00:00.000Z", stage: "MONITOR", score: 0.28, evidenceIds: earlyIds, summary: "Baseline filings establish the operating and financial lens." },
      { asOf: "2022-08-31T23:59:59.000Z", stage: "REVIEW", score: 0.68, evidenceIds: earlyIds, summary: "The evidence cluster warrants executive review; this score is a deterministic story index, not a probability." },
      { asOf: "2023-04-24T12:00:00.000Z", stage: "OUTCOME", score: 0.9, evidenceIds: approvedEvidence.map((item) => item.id), summary: "The known outcome is visible only after its public disclosure date." },
    ],
    claims: [
      { id: "claim-scale", text: "The approved filing reports a 953-store operating footprint.", evidenceIds: ["ev-operations"] },
      { id: "claim-liquidity", text: "Reported cash and cash equivalents were $153.5 million for FY2020.", evidenceIds: ["ev-financials-b"] },
      { id: "claim-outcome", text: "A court-supervised restructuring process was publicly disclosed in April 2023.", evidenceIds: ["ev-outcome"] },
    ],
    scenarios: [
      { posture: "MAINTAIN", headline: "Preserve optionality", cost: "Low", benefit: "Avoids premature commitments", risk: "May miss share shifts", impact: "Monitor revenue exposure and supplier terms", evidenceIds: ["ev-financials-a"] },
      { posture: "ADAPT", headline: "Rebalance selectively", cost: "Medium", benefit: "Targets inventory and channel gaps", risk: "Execution complexity", impact: "Adjust working capital, assortment and store actions", evidenceIds: ["ev-financials-b", "ev-operations"] },
      { posture: "ACCELERATE", headline: "Capture dislocated demand", cost: "High", benefit: "Potential share and supplier access", risk: "Overextension", impact: "Fund growth only behind measured demand signals", evidenceIds: ["ev-operations"] },
    ],
    recommendation: { posture: "ADAPT", rationale: "Use bounded inventory and channel moves while leadership validates demand, liquidity and supplier exposure.", evidenceIds: ["ev-financials-b", "ev-operations"] },
    challengerQuestions: ["Could the observed changes reflect a planned transformation rather than structural distress?", "Which customer and supplier signals would reverse the ADAPT posture?"],
    limitations: ["This retrospective uses a small approved evidence set.", "Scenario language is decision support, not a forecast or bankruptcy prediction."],
  });
}

export function stableSerialize(value: unknown) { return `${JSON.stringify(value, null, 2)}\n`; }

async function main() {
  const output = resolve(dirname(fileURLToPath(import.meta.url)), "../../frontend/public/demo/case-package.json");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, stableSerialize(buildCase()), "utf8");
  console.log(`Built ${output}`);
}

const isCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) await main();
