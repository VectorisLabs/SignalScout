import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { CasePackageSchema, requiredMetricKeys, type CasePackage } from "../src/contracts";
import { assertPublicHttpUrl } from "../src/partners/safety";

export interface ValidationIssue { code: string; path: string; message: string }
export class BundleValidationError extends Error {
  constructor(public issues: ValidationIssue[]) { super(`Public bundle rejected (${issues.length} issue${issues.length === 1 ? "" : "s"})`); }
}
const issue = (code: string, path: string, message: string): ValidationIssue => ({ code, path, message });

export function validatePublicBundle(input: unknown): CasePackage {
  const rawSerialized = JSON.stringify(input);
  const hasSecretLikeContent = /(authorization\s*[:=]|bearer\s+[a-z0-9._~+\/-]+|sk-[a-z0-9_-]{8,}|["']?(?:x-)?api[_-]?key["']?\s*[:=]|["']?(?:access|auth|refresh)[_-]?token["']?\s*[:=])/i.test(rawSerialized);
  const parsed = CasePackageSchema.safeParse(input);
  if (!parsed.success) throw new BundleValidationError(parsed.error.issues.map((item) => issue("SCHEMA_INVALID", item.path.join("."), "Value does not satisfy the canonical public schema.")));
  const bundle = parsed.data; const issues: ValidationIssue[] = [];
  const sources = new Map(bundle.sources.map((item) => [item.id, item]));
  const evidence = new Map(bundle.evidence.map((item) => [item.id, item]));
  if (sources.size !== bundle.sources.length) issues.push(issue("DUPLICATE_SOURCE", "sources", "Source identifiers must be unique."));
  if (evidence.size !== bundle.evidence.length) issues.push(issue("DUPLICATE_EVIDENCE", "evidence", "Evidence identifiers must be unique."));
  bundle.sources.forEach((source, index) => { try { assertPublicHttpUrl(source.url); } catch { issues.push(issue("UNSAFE_SOURCE_URL", `sources.${index}.url`, "Source URL must resolve to a public HTTP(S) host.")); } });
  bundle.evidence.forEach((item, index) => { if (!sources.has(item.sourceId)) issues.push(issue("UNKNOWN_SOURCE", `evidence.${index}.sourceId`, "Evidence references an unknown source.")); });
  bundle.evidence.forEach((item, index) => { if (sources.get(item.sourceId)?.rightsStatus === "PUBLIC_METADATA_ONLY" && item.excerpt.trim()) issues.push(issue("RIGHTS_VIOLATION", `evidence.${index}.excerpt`, "Metadata-only sources cannot supply quoted evidence.")); });
  bundle.metrics.forEach((item, index) => {
    if (!sources.has(item.sourceId)) issues.push(issue("UNKNOWN_SOURCE", `metrics.${index}.sourceId`, "Metric references an unknown source."));
    if (!evidence.has(item.evidenceId)) issues.push(issue("UNKNOWN_EVIDENCE", `metrics.${index}.evidenceId`, "Metric references unknown evidence."));
    if (evidence.get(item.evidenceId)?.sourceId !== item.sourceId) issues.push(issue("PROVENANCE_MISMATCH", `metrics.${index}`, "Metric source and evidence provenance do not match."));
  });
  bundle.replay.forEach((frame, frameIndex) => frame.evidenceIds.forEach((id) => {
    const item = evidence.get(id);
    if (!item) issues.push(issue("UNKNOWN_EVIDENCE", `replay.${frameIndex}.evidenceIds`, "Replay references unknown evidence."));
    else if (item.publiclyAvailableAt > frame.asOf) issues.push(issue("FUTURE_EVIDENCE", `replay.${frameIndex}.evidenceIds`, "Replay contains evidence not yet publicly available."));
  }));
  [...bundle.claims, bundle.recommendation, ...bundle.scenarios].forEach((claim, index) => claim.evidenceIds.forEach((id) => {
    if (!evidence.has(id)) issues.push(issue("UNSUPPORTED_CLAIM", `claims.${index}.evidenceIds`, "Factual content lacks approved evidence."));
  }));
  const available = new Set(bundle.metrics.map((item) => item.metricKey));
  const missing = requiredMetricKeys.filter((key) => !available.has(key));
  bundle.readiness.forEach((item, index) => {
    if (item.status === "READY" && missing.length) issues.push(issue("FALSE_READY", `readiness.${index}`, "A decision section is ready while required metrics are missing."));
    if (item.status === "READY" && item.missingMetrics.length) issues.push(issue("READINESS_MISMATCH", `readiness.${index}`, "A ready section cannot declare missing metrics."));
    if (item.status === "BLOCKED_BY_MISSING_METRICS" && !item.missingMetrics.length) issues.push(issue("READINESS_MISMATCH", `readiness.${index}`, "A blocked section must identify missing metrics."));
    if (item.missingMetrics.join("|") !== missing.join("|")) issues.push(issue("READINESS_MISMATCH", `readiness.${index}`, "Declared missing metrics do not match computed coverage."));
  });
  if (new Set(bundle.readiness.map((item) => item.section)).size !== 5 || bundle.readiness.length !== 5) issues.push(issue("READINESS_SECTIONS_INVALID", "readiness", "Every canonical readiness section must appear exactly once."));
  if (hasSecretLikeContent) issues.push(issue("SECRET_LIKE_CONTENT", "$", "Potential credential-like content is not allowed."));
  if (bundle.evidence.some((item) => item.excerpt.length > 600)) issues.push(issue("RAW_TEXT_LEAK", "evidence", "Evidence excerpt exceeds the public-safe limit."));
  if (bundle.evidence.reduce((total, item) => total + item.excerpt.length, 0) > 2400) issues.push(issue("RAW_TEXT_LEAK", "evidence", "Aggregate evidence excerpts exceed the public-safe limit."));
  if (issues.length) throw new BundleValidationError(issues);
  return bundle;
}

async function main() {
  try {
    const path = process.argv[2]
      ? resolve(process.argv[2])
      : resolve(dirname(fileURLToPath(import.meta.url)), "../../frontend/public/demo/case-package.json");
    const bundle = JSON.parse(await readFile(path, "utf8"));
    const valid = validatePublicBundle(bundle);
    console.log(JSON.stringify({ status: "VALID", caseId: valid.caseId, sources: valid.sources.length, evidence: valid.evidence.length }));
  } catch (error) {
    if (error instanceof BundleValidationError) console.error(JSON.stringify({ status: "INVALID", issues: error.issues }));
    else console.error(JSON.stringify({ status: "INVALID", issues: [issue("PARSE_OR_IO", "$", "Bundle could not be safely read or parsed.")] }));
    process.exitCode = 1;
  }
}
const isCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) await main();
