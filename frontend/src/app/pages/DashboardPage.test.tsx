import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { CasePackageSchema } from "@corpwatch/backend/contracts";
import casePackage from "../../../public/demo/case-package.json";
import { InvestigationProvider } from "../investigation";
import { DashboardPage } from "./DashboardPage";

const buildCase = () => CasePackageSchema.parse(structuredClone(casePackage));
const metrics = { summary: { totalRuns: 2, successfulRuns: 1, failedRuns: 1, toolCalls: 1, candidates: 3, approved: 0, validationPassRate: 0.75, averageLatencyMs: 1200, inputTokens: 100, outputTokens: 40 }, providerDistribution: [{ provider: "TINYFISH_SEARCH", count: 1 }], validationTrend: [{ at: new Date().toISOString(), passRate: 0.75, latencyMs: 1200 }], recentRuns: [] };

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("falls back to the validated case dashboard when there is no live investigation", async () => {
  vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => Promise.resolve({ ok: true, json: async () => url === "/api/metrics" ? metrics : buildCase() })));
  render(<MemoryRouter><InvestigationProvider><DashboardPage /></InvestigationProvider></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole("heading", { name: "Bed Bath & Beyond" })).toBeInTheDocument());
  expect(screen.getByRole("heading", { name: /Compare response posture/ })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /Coverage before conviction/ })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /Challenger questions/ })).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText("TINYFISH SEARCH")).toBeInTheDocument());
});
