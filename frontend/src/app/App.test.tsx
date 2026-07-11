import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CasePackageSchema } from "@corpwatch/backend/contracts";
import casePackage from "../../public/demo/case-package.json";
import { App } from "./App";

const buildCase = () => CasePackageSchema.parse(structuredClone(casePackage));

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it("renders the complete offline judge journey", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => buildCase() })); render(<App />);
  await waitFor(() => expect(screen.getByRole("heading", { name: "Bed Bath & Beyond" })).toBeInTheDocument());
  expect(screen.getByText(/validated replay/i)).toBeInTheDocument(); expect(screen.getByRole("heading", { name: /What was knowable/ })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /Why this cluster matters/ })).toBeInTheDocument(); expect(screen.getByRole("heading", { name: /Coverage before conviction/ })).toBeInTheDocument();
  expect(screen.getByText("MAINTAIN")).toBeInTheDocument(); expect(screen.getAllByText("ADAPT").length).toBeGreaterThan(0); expect(screen.getByText("ACCELERATE")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /Compare response posture/ })).toBeInTheDocument(); expect(screen.getByRole("heading", { name: /Challenger questions/ })).toBeInTheDocument();
  expect(screen.getByLabelText(/ADAPT strategy fit/i)).toBeInTheDocument();
  expect(screen.getByText(/Northstar Home Retail is fictional/i)).toBeInTheDocument();
});
it("shows an actionable bundle error", async () => { vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline"))); render(<App />); expect(await screen.findByRole("alert")).toHaveTextContent(/build:case/); });
it("renders chat controls and agent operations dashboard", async () => {
  vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => Promise.resolve({ ok: true, json: async () => url === "/api/metrics" ? { summary: { totalRuns: 2, successfulRuns: 1, failedRuns: 1, toolCalls: 1, candidates: 3, approved: 1, validationPassRate: .75, averageLatencyMs: 1200, inputTokens: 100, outputTokens: 40 }, providerDistribution: [{ provider: "TINYFISH_SEARCH", count: 1 }], validationTrend: [{ at: new Date().toISOString(), passRate: .75, latencyMs: 1200 }], recentRuns: [] } : buildCase() })));
  render(<App />); await screen.findByRole("heading", { name: "Bed Bath & Beyond" });
  expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Open Agent/i }));
  expect(screen.getByRole("heading", { name: /Ask CorpWatch/ })).toBeInTheDocument();
  expect(screen.getByLabelText("Investigation prompt")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /Observable by design/ })).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText("TINYFISH SEARCH")).toBeInTheDocument());
});
it("does not reveal future outcome evidence in an earlier replay frame", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => buildCase() })); render(<App />);
  await screen.findByRole("heading", { name: "Bed Bath & Beyond" });
  fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "0" } });
  expect(screen.queryByText("Public restructuring outcome")).not.toBeInTheDocument();
  expect(screen.queryByText(/court-supervised restructuring process was publicly disclosed/i)).not.toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Aug 31, 2022" })).toBeInTheDocument();
});
it("blocks decision sections when required metrics are missing", async () => {
  const bundle = buildCase(); bundle.metrics = bundle.metrics.filter((item) => item.metricKey !== "revenue"); bundle.readiness = bundle.readiness.map((item) => ({ ...item, status: "BLOCKED_BY_MISSING_METRICS", missingMetrics: ["revenue"] }));
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => bundle })); render(<App />);
  expect(await screen.findByText("Fit index blocked")).toBeInTheDocument();
  expect(screen.getByText("Executive recommendation blocked")).toBeInTheDocument();
  expect(screen.getByLabelText(/ADAPT strategy fit/i)).toBeInTheDocument();
});
