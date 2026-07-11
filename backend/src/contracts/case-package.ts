import { z } from "zod";

export const metricKeys = [
  "revenue", "gross_profit", "operating_income", "sga", "restructuring_cost",
  "cash_and_equivalents", "operating_cash_flow", "capital_expenditure", "inventory",
  "accounts_payable", "short_term_debt", "long_term_debt", "store_count", "employee_count",
] as const;
export const requiredMetricKeys = metricKeys.filter((key) => key !== "employee_count");

export const SourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url().refine((url) => ["http:", "https:"].includes(new URL(url).protocol)),
  domain: z.string().min(1),
  rightsStatus: z.enum(["PUBLIC_QUOTE_APPROVED", "PUBLIC_METADATA_ONLY"]),
  publishedAt: z.string().datetime(),
});

export const EvidenceSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  publiclyAvailableAt: z.string().datetime(),
  title: z.string().min(1),
  excerpt: z.string().min(1).max(600),
  knownOutcome: z.boolean().default(false),
});

export const MetricObservationSchema = z.object({
  metricKey: z.enum(metricKeys),
  value: z.number().finite(),
  unit: z.enum(["USD_MILLIONS", "COUNT"]),
  period: z.string().min(1),
  quality: z.literal("REPORTED"),
  sourceId: z.string().min(1),
  evidenceId: z.string().min(1),
});

export const ReadinessSchema = z.object({
  section: z.enum(["RESTRUCTURING_SCENARIOS", "COST_BENEFIT_RISK", "REVENUE_CASH_FLOW_OPERATING_IMPACT", "EXECUTIVE_DASHBOARD", "DECISION_REPORT"]),
  status: z.enum(["READY", "BLOCKED_BY_MISSING_METRICS"]),
  missingMetrics: z.array(z.enum(metricKeys)),
});

export const ClaimSchema = z.object({ id: z.string(), text: z.string().min(1), evidenceIds: z.array(z.string()).min(1) });
export const ReplayFrameSchema = z.object({
  asOf: z.string().datetime(),
  stage: z.enum(["MONITOR", "WATCH", "REVIEW", "OUTCOME"]),
  score: z.number().min(0).max(1),
  evidenceIds: z.array(z.string()),
  summary: z.string().min(1),
});
export const ScenarioSchema = z.object({
  posture: z.enum(["MAINTAIN", "ADAPT", "ACCELERATE"]),
  headline: z.string(),
  cost: z.string(), benefit: z.string(), risk: z.string(), impact: z.string(),
  evidenceIds: z.array(z.string()).min(1),
});

export const CasePackageSchema = z.object({
  schemaVersion: z.literal("1.0"),
  caseId: z.string(),
  company: z.object({ name: z.string(), ticker: z.string(), comparisonContext: z.string() }),
  watchQuestion: z.string(),
  offline: z.literal(true),
  sources: z.array(SourceSchema),
  evidence: z.array(EvidenceSchema),
  metrics: z.array(MetricObservationSchema),
  readiness: z.array(ReadinessSchema),
  replay: z.array(ReplayFrameSchema).min(1),
  claims: z.array(ClaimSchema),
  scenarios: z.array(ScenarioSchema).length(3),
  recommendation: z.object({ posture: z.enum(["MAINTAIN", "ADAPT", "ACCELERATE"]), rationale: z.string(), evidenceIds: z.array(z.string()).min(1) }),
  challengerQuestions: z.array(z.string()).min(1),
  limitations: z.array(z.string()).min(1),
});

export type Source = z.infer<typeof SourceSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type MetricObservation = z.infer<typeof MetricObservationSchema>;
export type CasePackage = z.infer<typeof CasePackageSchema>;
