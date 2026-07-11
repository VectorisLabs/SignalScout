import { z } from "zod";

export const SourceTypeSchema = z.enum([
  "SEC_8_K", "SEC_10_Q", "SEC_10_K", "SEC_EXHIBIT", "CORPORATE_RELEASE",
  "REGULATOR", "COURT", "NEWS_DISCOVERY_ONLY",
]);

export const CollectionRequestSchema = z.object({
  request_id: z.string().min(3).max(100),
  company_identifier: z.object({
    legal_name: z.string().min(2).max(160),
    cik: z.string().max(20).nullable(),
    ticker: z.string().max(12).nullable(),
  }),
  evidence_question: z.string().min(10).max(500),
  source_types: z.array(SourceTypeSchema).min(1).max(8),
  known_urls: z.array(z.string().url().max(2048)).max(1000),
  date_from: z.string().date(),
  date_to: z.string().date(),
  replay_as_of: z.string().datetime(),
  mode: z.enum(["discovery", "fetch_known_urls", "interactive_navigation", "batch", "recurring"]),
  preferred_domains: z.array(z.string().min(3).max(253)).max(20),
  max_candidates: z.number().int().min(1).max(20),
  reason: z.string().max(300).nullable(),
}).superRefine((value, ctx) => {
  if (value.date_from > value.date_to) ctx.addIssue({ code: "custom", path: ["date_to"], message: "date_to must not precede date_from" });
  if (`${value.date_to}T23:59:59.999Z` > value.replay_as_of) ctx.addIssue({ code: "custom", path: ["replay_as_of"], message: "collection range exceeds replay boundary" });
});

export type CollectionRequest = z.infer<typeof CollectionRequestSchema>;
export type CollectorRoute = "OFFICIAL_API" | "TINYFISH_SEARCH" | "TINYFISH_FETCH" | "TINYFISH_AGENT" | "APIFY_ASYNC" | "HUMAN_REQUEST";

export interface CollectionBudget {
  maxOfficialApiCalls: number;
  maxTinyFishSearchCalls: number;
  maxFetchUrls: number;
  maxTinyFishAgentRuns: number;
  maxApifyRuns: number;
  maxTotalCandidates: number;
  maxCollectionRounds: number;
}

export const DEFAULT_COLLECTION_BUDGET: CollectionBudget = {
  maxOfficialApiCalls: 10,
  maxTinyFishSearchCalls: 2,
  maxFetchUrls: 10,
  maxTinyFishAgentRuns: 1,
  maxApifyRuns: 1,
  maxTotalCandidates: 20,
  maxCollectionRounds: 2,
};

export interface CandidateEnvelope {
  candidateId: string;
  requestId: string;
  provider: CollectorRoute;
  providerRunId: string | null;
  sourceUrl: string;
  sourceTypeClaimed: string;
  title: string;
  availableAtClaimed: string | null;
  retrievedAt: string;
  contentSha256: string;
  excerptCandidate: string;
  collectorStatus: "UNTRUSTED_SOURCE_CANDIDATE";
  evidenceGateStatus: "PENDING" | "PENDING_CURATOR" | "REJECTED" | "APPROVED";
  warnings: string[];
}

export interface GateCheck { name: string; passed: boolean; required: boolean; message: string }
export interface GateResult { candidate: CandidateEnvelope; status: "VALID_CANDIDATE" | "PENDING_CURATOR" | "REJECTED"; checks: GateCheck[]; passRate: number }

export const ChatRequestSchema = z.object({
  sessionId: z.string().min(3).max(100),
  message: z.string().min(2).max(4000),
  replayAsOf: z.string().datetime().optional(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
