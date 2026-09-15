import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { executeCollector } from "../../src/agent/collectors";
import type { CollectionRequest } from "../../src/agent/contracts";

const request: CollectionRequest = {
  request_id: "REQ-COLLECTOR-001",
  company_identifier: { legal_name: "Example Domain", cik: null, ticker: null },
  evidence_question: "Extract bounded public content from the known URL",
  source_types: ["NEWS_DISCOVERY_ONLY"],
  known_urls: ["https://example.com/"],
  date_from: "2026-01-01",
  date_to: "2026-07-12",
  replay_as_of: "2026-07-12T23:59:59.999Z",
  mode: "fetch_known_urls",
  preferred_domains: ["example.com"],
  max_candidates: 3,
  reason: "Collector regression test",
};

describe("collector execution", () => {
  beforeEach(() => { process.env.TINYFISH_API_KEY = "test-key"; });
  afterEach(() => { vi.unstubAllGlobals(); delete process.env.TINYFISH_API_KEY; delete process.env.COLLECTOR_EXECUTION_MODE; });

  it("does not call a provider in validate mode", async () => {
    process.env.COLLECTOR_EXECUTION_MODE = "validate";
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    const result = await executeCollector("TINYFISH_FETCH", request);
    expect(result.message).toContain("live collection is disabled");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("normalizes a successful live TinyFish Fetch response", async () => {
    process.env.COLLECTOR_EXECUTION_MODE = "live";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [{ url: "https://example.com/", title: "Example Domain", markdown: "A bounded public excerpt with enough content for validation." }], errors: [] }), { status: 200 })));
    const result = await executeCollector("TINYFISH_FETCH", request);
    expect(result.message).toBe("TinyFish Fetch returned 1 candidates and 0 per-URL errors");
    expect(result.candidates[0]).toMatchObject({ sourceUrl: "https://example.com/", title: "Example Domain", provider: "TINYFISH_FETCH" });
  });

  it("retries a transient provider response before succeeding", async () => {
    process.env.COLLECTOR_EXECUTION_MODE = "live";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("busy", { status: 503, headers: { "retry-after": "0" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [{ url: "https://example.com/", title: "Recovered", markdown: "Recovered public page content after a transient failure." }], errors: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await executeCollector("TINYFISH_FETCH", request);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.candidates[0]?.title).toBe("Recovered");
  });
});
