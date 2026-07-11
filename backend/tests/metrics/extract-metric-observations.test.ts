import { describe, expect, it } from "vitest";
import { extractMetricObservations } from "../../src/metrics/extract-metric-observations";
import { approvedEvidence, approvedSources, metricInputs } from "../fixtures/metric-text";

describe("extractMetricObservations", () => {
  it("extracts every supported alias with provenance and normalization", () => {
    const values = metricInputs.flatMap((input) => extractMetricObservations(input, approvedSources, approvedEvidence));
    expect(values).toHaveLength(14);
    expect(values).toContainEqual(expect.objectContaining({ metricKey: "revenue", value: 7100, unit: "USD_MILLIONS", sourceId: "src-bbb-2021-10k" }));
    expect(values).toContainEqual(expect.objectContaining({ metricKey: "store_count", value: 953, unit: "COUNT", evidenceId: "ev-operations" }));
  });
  it("rejects unknown provenance and periods", () => {
    expect(() => extractMetricObservations({ ...metricInputs[0], sourceId: "missing" }, approvedSources, approvedEvidence)).toThrow("UNKNOWN_SOURCE_ID");
    expect(() => extractMetricObservations({ ...metricInputs[0], period: "unknown" }, approvedSources, approvedEvidence)).toThrow("UNKNOWN_REPORTING_PERIOD");
  });
  it("does not infer a financial value without explicit currency and scale", () => {
    const values = extractMetricObservations({ ...metricInputs[0], text: "Net sales were 7.1." }, approvedSources, approvedEvidence);
    expect(values).toEqual([]);
    expect(values).not.toHaveProperty("text");
  });
});
