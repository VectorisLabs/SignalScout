import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OperationsViz, StrategyFitViz } from "@corpwatch/backend/contracts";
import { OperationsCharts } from "./OperationsCharts";
import { StrategyFit } from "./StrategyFit";

afterEach(() => cleanup());

it("renders operations charts with humanized provider routes", () => {
  const block: OperationsViz = { kind: "operations", summary: { totalRuns: 2, validationPassRate: 0.75, averageLatencyMs: 1200, candidates: 3, approved: 1 }, providerDistribution: [{ provider: "TINYFISH_SEARCH", count: 1 }], validationTrend: [{ at: new Date().toISOString(), passRate: 0.75, latencyMs: 1200 }] };
  render(<OperationsCharts block={block} />);
  expect(screen.getByRole("heading", { name: /Observable by design/ })).toBeInTheDocument();
  expect(screen.getByText("TINYFISH SEARCH")).toBeInTheDocument();
});

it("renders strategy fit scores with accessible fit labels", () => {
  const block: StrategyFitViz = { kind: "strategyFit", recommended: "ADAPT", scenarios: [
    { posture: "MAINTAIN", headline: "Preserve optionality", score: 80, cost: "Low", benefit: "Continuity", risk: "Late", impact: "Monitor" },
    { posture: "ADAPT", headline: "Rebalance selectively", score: 100, cost: "Medium", benefit: "Optionality", risk: "Reversible", impact: "Adjust" },
    { posture: "ACCELERATE", headline: "Capture demand", score: 80, cost: "High", benefit: "Share", risk: "Overextend", impact: "Fund" },
  ] };
  render(<StrategyFit block={block} />);
  expect(screen.getByRole("heading", { name: /Compare response posture/ })).toBeInTheDocument();
  expect(screen.getByText("MAINTAIN")).toBeInTheDocument();
  expect(screen.getByText("ACCELERATE")).toBeInTheDocument();
  expect(screen.getByLabelText(/ADAPT strategy fit/i)).toBeInTheDocument();
});
