import { expect, it } from "vitest";
import { type CandidateEnvelope, CollectionRequestSchema } from "../../src/agent/contracts";
import { hashContent, validateCandidate } from "../../src/agent/evidence-gate";

const request = CollectionRequestSchema.parse({ request_id: "REQ-001", company_identifier: { legal_name: "Example Retail Inc.", cik: null, ticker: "EXM" }, evidence_question: "Validate public company restructuring evidence", source_types: ["NEWS_DISCOVERY_ONLY"], known_urls: [], date_from: "2026-01-01", date_to: "2026-07-01", replay_as_of: "2026-07-12T00:00:00.000Z", mode: "discovery", preferred_domains: [], max_candidates: 5, reason: null });
function candidate(overrides: Partial<CandidateEnvelope> = {}): CandidateEnvelope { const excerpt = "A bounded public excerpt describing a reported corporate event."; return { candidateId: "CAND-1", requestId: "REQ-001", provider: "TINYFISH_FETCH", providerRunId: null, sourceUrl: "https://example.com/source", sourceTypeClaimed: "NEWS_DISCOVERY_ONLY", title: "Public source", availableAtClaimed: "2026-06-01T00:00:00.000Z", retrievedAt: "2026-07-12T00:00:00.000Z", contentSha256: hashContent(excerpt), excerptCandidate: excerpt, collectorStatus: "UNTRUSTED_SOURCE_CANDIDATE", evidenceGateStatus: "PENDING", warnings: [], ...overrides }; }

it("keeps technically valid candidates pending until curator approval", () => { const result = validateCandidate(candidate(), request); expect(result.status).toBe("PENDING_CURATOR"); expect(result.candidate.evidenceGateStatus).toBe("PENDING_CURATOR"); });
it("rejects future, private, rights-unknown or hash-mismatched candidates", () => {
  expect(validateCandidate(candidate({ availableAtClaimed: "2027-01-01T00:00:00.000Z" }), request).status).toBe("REJECTED");
  expect(validateCandidate(candidate({ sourceUrl: "http://127.0.0.1/private" }), request).status).toBe("REJECTED");
  expect(validateCandidate(candidate({ warnings: ["RIGHTS_UNKNOWN"] }), request).status).toBe("REJECTED");
  expect(validateCandidate(candidate({ contentSha256: "bad" }), request).status).toBe("REJECTED");
});
