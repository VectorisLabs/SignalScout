import { expect, it } from "vitest";
import { buildMetricLens } from "../../src/report/build-metric-lens";
import { extractMetricObservations } from "../../src/metrics/extract-metric-observations";
import { approvedEvidence, approvedSources, metricInputs } from "../fixtures/metric-text";

it("marks required sections ready while employee count remains optional", () => {
  const metrics = metricInputs.flatMap((input) => extractMetricObservations(input, approvedSources, approvedEvidence)).filter((item) => item.metricKey !== "employee_count");
  const lens = buildMetricLens(metrics);
  expect(lens.readiness.every((item) => item.status === "READY")).toBe(true);
  expect(lens.coverage.find((item) => item.metricKey === "employee_count")).toMatchObject({ status: "MISSING", required: false });
});
