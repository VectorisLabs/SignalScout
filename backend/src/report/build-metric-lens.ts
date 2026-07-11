import { metricKeys, requiredMetricKeys, type MetricObservation } from "../contracts";

const sections = ["RESTRUCTURING_SCENARIOS", "COST_BENEFIT_RISK", "REVENUE_CASH_FLOW_OPERATING_IMPACT", "EXECUTIVE_DASHBOARD", "DECISION_REPORT"] as const;

export function buildMetricLens(observations: MetricObservation[]) {
  const available = new Set(observations.map((item) => item.metricKey));
  const missing = requiredMetricKeys.filter((key) => !available.has(key));
  return {
    coverage: metricKeys.map((metricKey) => ({ metricKey, status: available.has(metricKey) ? "AVAILABLE" as const : "MISSING" as const, required: metricKey !== "employee_count" })),
    readiness: sections.map((section) => ({ section, status: missing.length ? "BLOCKED_BY_MISSING_METRICS" as const : "READY" as const, missingMetrics: missing })),
  };
}
