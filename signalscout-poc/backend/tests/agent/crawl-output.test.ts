import { describe, expect, it } from "vitest";
import { cleanAndValidateCrawlOutput } from "../../src/agent/crawl-output";
import type { CandidateEnvelope } from "../../src/agent/contracts";

function candidate(overrides: Partial<CandidateEnvelope> = {}): CandidateEnvelope {
  return {
    candidateId: "CAND-1", requestId: "REQ-1", provider: "TINYFISH_FETCH", providerRunId: null,
    sourceUrl: "https://example.com/source", sourceTypeClaimed: "NEWS_DISCOVERY_ONLY", title: "Public source",
    availableAtClaimed: "2026-07-01T00:00:00.000Z", retrievedAt: "2026-07-12T00:00:00.000Z",
    contentSha256: "hash", excerptCandidate: "A bounded public excerpt with enough content for the core agent.",
    collectorStatus: "UNTRUSTED_SOURCE_CANDIDATE", evidenceGateStatus: "PENDING", warnings: [], ...overrides,
  };
}

describe("clean crawl output", () => {
  it("keeps only title, date, content and url", () => {
    const result = cleanAndValidateCrawlOutput([candidate()]);
    expect(result).toMatchObject({ passed: true, rejectedRecords: 0, recordCount: 1, rubric: "CRAWL-OUTPUT-v1" });
    expect(result.data[0]).toEqual({ title: "Public source", date: "2026-07-01T00:00:00.000Z", content: "A bounded public excerpt with enough content for the core agent.", url: "https://example.com/source" });
    expect(Object.keys(result.data[0]!)).toEqual(["title", "date", "content", "url"]);
  });

  it("fails closed when no clean public record remains", () => {
    const result = cleanAndValidateCrawlOutput([candidate({ sourceUrl: "http://127.0.0.1/private", excerptCandidate: "short" })]);
    expect(result).toMatchObject({ passed: false, data: [], rejectedRecords: 1, recordCount: 1 });
  });
});
