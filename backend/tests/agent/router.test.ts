import { describe, expect, it } from "vitest";
import { DEFAULT_COLLECTION_BUDGET } from "../../src/agent/contracts";
import { routeCollection } from "../../src/agent/router";

function request(overrides: Record<string, unknown> = {}) {
  return { request_id: "REQ-001", company_identifier: { legal_name: "Example Retail Inc.", cik: null, ticker: "EXM" }, evidence_question: "Find public restructuring evidence for the company", source_types: ["NEWS_DISCOVERY_ONLY"], known_urls: [], date_from: "2026-01-01", date_to: "2026-07-01", replay_as_of: "2026-07-12T00:00:00.000Z", mode: "discovery", preferred_domains: [], max_candidates: 5, reason: null, ...overrides };
}

describe("collector router", () => {
  it("routes unknown URLs to TinyFish Search", () => expect(routeCollection(request(), DEFAULT_COLLECTION_BUDGET).decision.route).toBe("TINYFISH_SEARCH"));
  it("routes known URLs to TinyFish Fetch", () => expect(routeCollection(request({ known_urls: ["https://example.com/news"], mode: "fetch_known_urls" }), DEFAULT_COLLECTION_BUDGET).decision.route).toBe("TINYFISH_FETCH"));
  it("routes batch and recurring work to Apify", () => expect(routeCollection(request({ mode: "recurring" }), DEFAULT_COLLECTION_BUDGET).decision.route).toBe("APIFY_ASYNC"));
  it("prefers official APIs for SEC requests with CIK", () => expect(routeCollection(request({ company_identifier: { legal_name: "Example Inc.", cik: "123", ticker: "EXM" }, source_types: ["SEC_10_K"] }), DEFAULT_COLLECTION_BUDGET).decision.route).toBe("OFFICIAL_API"));
  it("rejects private URLs and replay boundary violations before routing", () => {
    expect(() => routeCollection(request({ known_urls: ["http://169.254.169.254/latest/meta-data"] }), DEFAULT_COLLECTION_BUDGET)).toThrow();
    expect(() => routeCollection(request({ replay_as_of: "2026-01-01T00:00:00.000Z" }), DEFAULT_COLLECTION_BUDGET)).toThrow();
  });
});
