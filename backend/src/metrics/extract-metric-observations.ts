import { MetricObservationSchema, type Evidence, type MetricObservation, type Source } from "../contracts";

export interface MetricTextInput { text: string; sourceId: string; evidenceId: string; period: string }

const aliases = [
  ["revenue", ["net sales", "revenue"], "USD_MILLIONS"],
  ["gross_profit", ["gross profit"], "USD_MILLIONS"],
  ["operating_income", ["operating income"], "USD_MILLIONS"],
  ["sga", ["selling, general and administrative expenses", "sg&a"], "USD_MILLIONS"],
  ["restructuring_cost", ["restructuring charges", "restructuring cost"], "USD_MILLIONS"],
  ["cash_and_equivalents", ["cash and cash equivalents"], "USD_MILLIONS"],
  ["operating_cash_flow", ["operating cash flow", "cash flow from operations"], "USD_MILLIONS"],
  ["capital_expenditure", ["capital expenditures", "capital expenditure", "capex"], "USD_MILLIONS"],
  ["inventory", ["inventory"], "USD_MILLIONS"],
  ["accounts_payable", ["accounts payable"], "USD_MILLIONS"],
  ["short_term_debt", ["short-term debt", "current debt"], "USD_MILLIONS"],
  ["long_term_debt", ["long-term debt"], "USD_MILLIONS"],
  ["store_count", ["operated", "stores"], "COUNT"],
  ["employee_count", ["employed", "employees"], "COUNT"],
] as const;

function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export function extractMetricObservations(input: MetricTextInput, sources: Source[], evidence: Evidence[]): MetricObservation[] {
  if (!sources.some((source) => source.id === input.sourceId)) throw new Error("UNKNOWN_SOURCE_ID");
  if (!evidence.some((item) => item.id === input.evidenceId && item.sourceId === input.sourceId)) throw new Error("UNKNOWN_EVIDENCE_ID");
  if (!/^FY\d{4}$/.test(input.period)) throw new Error("UNKNOWN_REPORTING_PERIOD");
  const sentences = input.text.split(/(?<=[.!?])\s+/);
  const output: MetricObservation[] = [];
  for (const [metricKey, labels, unit] of aliases) {
    for (const sentence of sentences) {
      const label = labels.find((candidate) => sentence.toLowerCase().includes(candidate));
      if (!label) continue;
      const financial = unit === "USD_MILLIONS";
      const pattern = financial
        ? new RegExp(`${escapeRegex(label)}[^.$]{0,80}?\\$([0-9][0-9,]*(?:\\.[0-9]+)?)\\s*(billion|million)`, "i")
        : metricKey === "store_count"
          ? /(?:operated\s+)?([0-9][0-9,]*)\s+stores?/i
          : /(?:employed\s+)?([0-9][0-9,]*)\s+employees?/i;
      const match = sentence.match(pattern);
      if (!match) continue;
      const number = Number(match[1].replaceAll(",", ""));
      const value = financial && match[2]?.toLowerCase() === "billion" ? number * 1000 : number;
      output.push(MetricObservationSchema.parse({ metricKey, value, unit, period: input.period, quality: "REPORTED", sourceId: input.sourceId, evidenceId: input.evidenceId }));
      break;
    }
  }
  return output;
}
