import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CandidateEnvelope, CollectionRequest } from "../../src/agent/contracts";

const mocks = vi.hoisted(() => ({ responseCreate: vi.fn(), executeCollector: vi.fn() }));

vi.mock("openai", () => ({ default: class MockOpenAI { responses = { create: mocks.responseCreate }; } }));
vi.mock("@langfuse/openai", () => ({ observeOpenAI: (client: unknown) => client }));
vi.mock("../../src/agent/collectors", () => ({ executeCollector: mocks.executeCollector }));
vi.mock("../../src/agent/langfuse-runtime", () => ({
  getAgentPrompt: vi.fn().mockResolvedValue({ content: "managed instructions", name: "corpwatch/chat-agent", version: 1, isFallback: false, label: "production" }),
  getTraceUrl: vi.fn().mockResolvedValue(null), recordCrawlOutputScores: vi.fn(), recordGateScores: vi.fn(), recordTraceScore: vi.fn(),
  startChatTrace: () => ({
    traceId: "trace-test", otelSpan: { spanContext: () => ({ traceId: "trace-test" }) }, update: vi.fn(), end: vi.fn(),
    startObservation: () => ({ id: "observation-test", update: vi.fn(), end: vi.fn() }),
  }),
}));

import { runChatAgent } from "../../src/agent/openai-agent";

const toolRequest: CollectionRequest = {
  request_id: "REQ-TOOL-001", company_identifier: { legal_name: "Example Domain", cik: null, ticker: null },
  evidence_question: "Extract bounded public content from the known URL", source_types: ["NEWS_DISCOVERY_ONLY"],
  known_urls: ["https://example.com/"], date_from: "2026-01-01", date_to: "2026-07-12",
  replay_as_of: "2026-07-12T23:59:59.999Z", mode: "fetch_known_urls", preferred_domains: ["example.com"],
  max_candidates: 3, reason: "Regression test",
};

function candidate(): CandidateEnvelope {
  return {
    candidateId: "CAND-TOOL-001", requestId: toolRequest.request_id, provider: "TINYFISH_FETCH", providerRunId: null,
    sourceUrl: "https://example.com/", sourceTypeClaimed: "NEWS_DISCOVERY_ONLY", title: "Example Domain",
    availableAtClaimed: "2026-07-01T00:00:00.000Z", retrievedAt: "2026-07-12T00:00:00.000Z", contentSha256: "",
    excerptCandidate: "A bounded public excerpt with enough clean content for the core agent.",
    collectorStatus: "UNTRUSTED_SOURCE_CANDIDATE", evidenceGateStatus: "PENDING", warnings: ["RIGHTS_UNKNOWN"],
  };
}

function response(id: string, output: unknown[], outputText: string) {
  return { id, output, output_text: outputText, usage: { input_tokens: 10, output_tokens: 5 } };
}

function toolCall() {
  return { type: "function_call", name: "collect_public_evidence", arguments: JSON.stringify(toolRequest), call_id: "call-001" };
}

describe("OpenAI agent tool loop", () => {
  beforeEach(() => {
    vi.clearAllMocks(); process.env.OPENAI_API_KEY = "test-key"; process.env.OPENAI_MODEL = "test-model"; process.env.COLLECTOR_EXECUTION_MODE = "live";
  });

  it("returns a normal answer without invoking a collector when no tool is requested", async () => {
    mocks.responseCreate.mockResolvedValueOnce(response("resp-no-tool", [], "Core agent ready."));
    const result = await runChatAgent({ sessionId: "no-tool-session", message: "Are you ready?" });
    expect(result).toMatchObject({ answer: "Core agent ready.", provider: "NONE", candidates: 0, promptSource: "production", promptVersion: 1 });
    expect(mocks.executeCollector).not.toHaveBeenCalled();
  });

  it("routes a known URL, validates it, and sends only clean crawl JSON back to the core agent", async () => {
    const item = candidate();
    const { hashContent } = await import("../../src/agent/evidence-gate"); item.contentSha256 = hashContent(item.excerptCandidate);
    mocks.responseCreate.mockResolvedValueOnce(response("resp-tool", [toolCall()], "")).mockResolvedValueOnce(response("resp-final", [], "Collection summarized safely."));
    mocks.executeCollector.mockResolvedValueOnce({ route: "TINYFISH_FETCH", providerRunId: null, candidates: [item], pending: false, message: "TinyFish Fetch returned 1 candidates and 0 per-URL errors" });
    const result = await runChatAgent({ sessionId: "fetch-tool-session", message: "Fetch the known URL" });
    expect(result).toMatchObject({ answer: "Collection summarized safely.", provider: "TINYFISH_FETCH", candidates: 1 });
    expect(mocks.executeCollector).toHaveBeenCalledTimes(1);
    const secondCall = mocks.responseCreate.mock.calls[1][0];
    const toolOutput = JSON.parse(secondCall.input[0].output);
    expect(toolOutput.outputValidation).toMatchObject({ passed: true, rubric: "CRAWL-OUTPUT-v1", rejectedRecords: 0 });
    expect(toolOutput.data).toEqual([{ title: "Example Domain", date: "2026-07-01T00:00:00.000Z", content: item.excerptCandidate, url: "https://example.com/" }]);
    expect(Object.keys(toolOutput.data[0])).toEqual(["title", "date", "content", "url"]);
  });

  it("retries once after crawl-output validation fails and still produces a final answer", async () => {
    mocks.responseCreate.mockResolvedValueOnce(response("resp-empty-tool", [toolCall()], "")).mockResolvedValueOnce(response("resp-empty-final", [], "No validated crawl data was found."));
    mocks.executeCollector.mockResolvedValue({ route: "TINYFISH_FETCH", providerRunId: null, candidates: [], pending: false, message: "TinyFish Fetch returned 0 candidates and 0 per-URL errors" });
    const result = await runChatAgent({ sessionId: "retry-tool-session", message: "Fetch the known URL" });
    expect(mocks.executeCollector).toHaveBeenCalledTimes(2);
    expect(result.answer).toBe("No validated crawl data was found.");
    expect(result.toolEvents.filter((event) => event.phase === "validating" && event.status === "failed")).toHaveLength(2);
    expect(result.toolEvents.some((event) => event.message.includes("Retrying TINYFISH_FETCH"))).toBe(true);
  });
});
