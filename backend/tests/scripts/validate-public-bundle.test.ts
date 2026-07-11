import { describe, expect, it } from "vitest";
import { buildCase } from "../../scripts/build-case";
import { BundleValidationError, validatePublicBundle } from "../../scripts/validate-public-bundle";

function mutate(fn: (bundle: ReturnType<typeof buildCase>) => void) { const bundle = structuredClone(buildCase()); fn(bundle); return bundle; }
function codes(value: unknown) { try { validatePublicBundle(value); return []; } catch (error) { return (error as BundleValidationError).issues.map((item) => item.code); } }

describe("validatePublicBundle", () => {
  it("accepts the deterministic bundle", () => expect(validatePublicBundle(buildCase()).caseId).toBe("bbb-retrospective-v1"));
  it.each([
    ["secret", mutate((b) => { b.limitations.push("Authorization: Bearer secret-token"); }), "SECRET_LIKE_CONTENT"],
    ["unknown evidence", mutate((b) => { b.metrics[0].evidenceId = "missing"; }), "UNKNOWN_EVIDENCE"],
    ["future evidence", mutate((b) => { b.replay[0].evidenceIds.push("ev-outcome"); }), "FUTURE_EVIDENCE"],
    ["unsupported claim", mutate((b) => { b.claims[0].evidenceIds = ["missing"]; }), "UNSUPPORTED_CLAIM"],
    ["false ready", mutate((b) => { b.metrics = b.metrics.filter((m) => m.metricKey !== "revenue"); }), "FALSE_READY"],
    ["unsafe URL", mutate((b) => { (b.sources[0] as { url: string }).url = "file:///secret"; }), "SCHEMA_INVALID"],
    ["unapproved rights", mutate((b) => { (b.sources[0] as { rightsStatus: string }).rightsStatus = "UNKNOWN"; }), "SCHEMA_INVALID"],
    ["nested API key", mutate((b) => { (b as unknown as { metadata: unknown }).metadata = { "X-API-Key": "abcdefgh12345678" }; }), "SECRET_LIKE_CONTENT"],
    ["private source", mutate((b) => { b.sources[0].url = "http://169.254.169.254/latest/meta-data"; }), "UNSAFE_SOURCE_URL"],
    ["metadata-only excerpt", mutate((b) => { b.sources[0].rightsStatus = "PUBLIC_METADATA_ONLY"; }), "RIGHTS_VIOLATION"],
    ["readiness mismatch", mutate((b) => { b.readiness[0].missingMetrics = ["revenue"]; }), "READINESS_MISMATCH"],
  ])("rejects %s", (_name, value, expected) => expect(codes(value)).toContain(expected));
});
