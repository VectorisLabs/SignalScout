import { ApifyRunRequestSchema, LangfuseQuerySchema, TinyFishFetchRequestSchema, TinyFishSearchRequestSchema } from "../src/partners/safety";

export function validatePartnerConfiguration() {
  const mode = process.env.PARTNER_EXECUTION_MODE ?? "validate";
  if (mode !== "validate") throw new Error("LIVE_MODE_REQUIRES_SEPARATE_EXPLICIT_APPROVAL");
  TinyFishSearchRequestSchema.parse({ query: "Bed Bath & Beyond restructuring", purpose: "Discover a bounded public evidence candidate", domainType: "news", maxResults: 3 });
  TinyFishFetchRequestSchema.parse({ urls: ["https://www.sec.gov/"], format: "markdown", perUrlTimeoutMs: 45000 });
  ApifyRunRequestSchema.parse({ actorId: "apify/web-scraper", input: { startUrls: [{ url: "https://example.com" }], maxCrawlPages: 3 }, maxItems: 10, timeoutSeconds: 120, memoryMb: 512, mode: "async" });
  LangfuseQuerySchema.parse({ fromStartTime: "2026-07-10T00:00:00.000Z", toStartTime: "2026-07-11T00:00:00.000Z", fields: ["core", "basic", "usage", "metrics"], limit: 100 });
  return { mode, networkCalls: 0, status: "LOCAL_CONTRACTS_VALIDATED", partners: ["Apify", "Langfuse", "TinyFish"], liveReceipt: false } as const;
}
console.log(JSON.stringify(validatePartnerConfiguration()));
