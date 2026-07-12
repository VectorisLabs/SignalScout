import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { ChatVisualization } from "@corpwatch/backend/contracts";
import { ChatPage } from "./ChatPage";

const visualizations: ChatVisualization[] = [
  { kind: "posture", posture: "ADAPT", index: 90, stage: "OUTCOME", rationale: "Bounded inventory and channel moves.", evidenceIds: ["ev-financials-b"] },
  { kind: "strategyFit", recommended: "ADAPT", scenarios: [
    { posture: "MAINTAIN", headline: "Preserve optionality", score: 80, cost: "Low", benefit: "Continuity", risk: "Late", impact: "Monitor" },
    { posture: "ADAPT", headline: "Rebalance selectively", score: 100, cost: "Medium", benefit: "Optionality", risk: "Reversible", impact: "Adjust" },
    { posture: "ACCELERATE", headline: "Capture demand", score: 80, cost: "High", benefit: "Share", risk: "Overextend", impact: "Fund" },
  ] },
  { kind: "metricLens", coverage: 100, metrics: [{ label: "Revenue / net sales", value: 7100, unit: "USD_MILLIONS", period: "FY2020", quality: "REPORTED", evidenceId: "ev-financials-a" }] },
  { kind: "evidenceTimeline", asOf: "2023-04-24T12:00:00.000Z", items: [{ id: "ev-outcome", title: "Public restructuring outcome", excerpt: "A court-supervised restructuring process was disclosed.", date: "2023-04-24T12:00:00.000Z", sourceUrl: "https://example.com/a", status: "Approved" }] },
];

const chatResponse = { answer: "Recommended posture: ADAPT. Bounded moves while leadership validates demand.", citations: [{ id: "ev-outcome", title: "Public restructuring outcome", url: "https://example.com/a", status: "VALID_CANDIDATE" }], toolEvents: [{ at: new Date().toISOString(), phase: "validating", status: "completed", message: "Evidence Gate approved 1 disclosure." }], visualizations, mode: "offline" };

const renderChat = () => render(<MemoryRouter><ChatPage /></MemoryRouter>);

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("renders a Claude-style empty state with a composer", () => {
  vi.stubGlobal("fetch", vi.fn());
  renderChat();
  expect(screen.getByRole("heading", { name: /Ask signalScout/ })).toBeInTheDocument();
  expect(screen.getByLabelText("Investigation prompt")).toBeInTheDocument();
});

it("opens the artifact panel with visualizations after an answer", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => chatResponse }));
  renderChat();
  fireEvent.click(screen.getByRole("button", { name: /Show the restructuring evidence timeline/ }));
  await waitFor(() => expect(screen.getByRole("heading", { name: /Compare response posture/ })).toBeInTheDocument());
  expect(screen.getByRole("heading", { name: /Coverage before conviction/ })).toBeInTheDocument();
  expect(screen.getByLabelText(/ADAPT strategy fit/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Close visualization panel/i })).toBeInTheDocument();
  expect(screen.getAllByText("ADAPT").length).toBeGreaterThan(0);
});

it("surfaces an actionable error when the chat request fails", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ message: "Set OPENAI_API_KEY" }) }));
  renderChat();
  fireEvent.click(screen.getByRole("button", { name: /What is the recommended posture and why\?/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/Set OPENAI_API_KEY/);
});
