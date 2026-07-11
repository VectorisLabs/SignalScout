import { assertPublicHttpUrl } from "../partners/safety";
import { CollectionRequestSchema, type CollectionBudget, type CollectionRequest, type CollectorRoute } from "./contracts";

const OFFICIAL_SOURCE_TYPES = new Set(["SEC_8_K", "SEC_10_Q", "SEC_10_K", "SEC_EXHIBIT", "REGULATOR", "COURT"]);

export interface RouteDecision { route: CollectorRoute; reason: string; policyId: "COLLECTOR-ROUTER-v1"; policyVersion: "1.0.0" }

export function routeCollection(raw: unknown, budget: CollectionBudget): { request: CollectionRequest; decision: RouteDecision } {
  const request = CollectionRequestSchema.parse(raw);
  request.known_urls.forEach(assertPublicHttpUrl);

  if (request.source_types.every((type) => OFFICIAL_SOURCE_TYPES.has(type)) && request.company_identifier.cik) {
    if (budget.maxOfficialApiCalls < 1) return human("Official API budget exhausted");
    return selected(request, "OFFICIAL_API", "Authoritative structured source is available for the requested source type");
  }
  if (request.mode === "recurring" || request.mode === "batch" || request.known_urls.length > 10) {
    if (budget.maxApifyRuns < 1) return human("Apify budget exhausted");
    return selected(request, "APIFY_ASYNC", "Recurring, batch, or more-than-10-URL collection requires durable asynchronous execution");
  }
  if (request.mode === "interactive_navigation") {
    if (budget.maxTinyFishAgentRuns < 1) return human("TinyFish Agent budget exhausted");
    return selected(request, "TINYFISH_AGENT", "The request explicitly requires bounded multi-step browser interaction");
  }
  if (request.known_urls.length > 0) {
    if (request.known_urls.length > budget.maxFetchUrls) return human("Known URL count exceeds TinyFish Fetch budget");
    return selected(request, "TINYFISH_FETCH", "Known public URLs require clean bounded content extraction");
  }
  if (budget.maxTinyFishSearchCalls < 1) return human("TinyFish Search budget exhausted");
  return selected(request, "TINYFISH_SEARCH", "Source URL is unknown and bounded live-web discovery is required");
}

function selected(request: CollectionRequest, route: CollectorRoute, reason: string) {
  return { request, decision: { route, reason, policyId: "COLLECTOR-ROUTER-v1", policyVersion: "1.0.0" } as RouteDecision };
}
function human(reason: string): never {
  throw new Error(`HUMAN_REQUEST:${reason}`);
}
