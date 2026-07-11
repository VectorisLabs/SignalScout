import { randomUUID } from "node:crypto";
import { sanitizeError } from "../partners/safety";
import { hashContent } from "./evidence-gate";
import type { CandidateEnvelope, CollectionRequest, CollectorRoute } from "./contracts";

export interface CollectorResult { route: CollectorRoute; providerRunId: string | null; candidates: CandidateEnvelope[]; pending: boolean; message: string }

export async function executeCollector(route: CollectorRoute, request: CollectionRequest): Promise<CollectorResult> {
  const mode = process.env.COLLECTOR_EXECUTION_MODE ?? "validate";
  if (mode !== "live") return { route, providerRunId: null, candidates: [], pending: false, message: `Route ${route} validated locally; live collection is disabled` };
  if (route === "TINYFISH_SEARCH") return tinyFishSearch(request);
  if (route === "TINYFISH_FETCH") return tinyFishFetch(request);
  if (route === "APIFY_ASYNC") return apifyStart(request);
  if (route === "TINYFISH_AGENT") return { route, providerRunId: null, candidates: [], pending: true, message: "TinyFish Agent requires an asynchronous approval workflow" };
  if (route === "OFFICIAL_API") return { route, providerRunId: null, candidates: [], pending: true, message: "Official API collection is delegated to the authoritative-source workflow" };
  return { route: "HUMAN_REQUEST", providerRunId: null, candidates: [], pending: true, message: "Automatic collection is not permitted" };
}

async function tinyFishSearch(request: CollectionRequest): Promise<CollectorResult> {
  const key = requiredEnv("TINYFISH_API_KEY");
  const query = new URLSearchParams({ query: `${request.company_identifier.legal_name} ${request.evidence_question}`, purpose: "Discover bounded public evidence candidates for CorpWatch", domain_type: "news", after_date: request.date_from, before_date: request.date_to });
  const response = await boundedFetch(`https://api.search.tinyfish.ai?${query}`, { headers: { "X-API-Key": key, Accept: "application/json" } }, 45_000);
  if (!response.ok) throw new Error(`TINYFISH_SEARCH_${response.status}`);
  const body = await response.json() as { results?: Array<Record<string, unknown>> };
  const items = (body.results ?? []).slice(0, request.max_candidates);
  return { route: "TINYFISH_SEARCH", providerRunId: null, pending: false, message: `TinyFish Search returned ${items.length} discovery candidates`, candidates: items.flatMap((item, index) => normalizeItem(item, request, "TINYFISH_SEARCH", index, true)) };
}

async function tinyFishFetch(request: CollectionRequest): Promise<CollectorResult> {
  const key = requiredEnv("TINYFISH_API_KEY");
  const response = await boundedFetch("https://api.fetch.tinyfish.ai", { method: "POST", headers: { "X-API-Key": key, "Content-Type": "application/json" }, body: JSON.stringify({ urls: request.known_urls.slice(0, 10), format: "markdown", links: true, per_url_timeout_ms: 45_000 }) }, 150_000);
  if (!response.ok) throw new Error(`TINYFISH_FETCH_${response.status}`);
  const body = await response.json() as { results?: Array<Record<string, unknown>>; errors?: unknown[] };
  const candidates = (body.results ?? []).slice(0, request.max_candidates).flatMap((item, index) => normalizeItem(item, request, "TINYFISH_FETCH", index, false));
  return { route: "TINYFISH_FETCH", providerRunId: null, pending: false, message: `TinyFish Fetch returned ${candidates.length} candidates and ${(body.errors ?? []).length} per-URL errors`, candidates };
}

async function apifyStart(request: CollectionRequest): Promise<CollectorResult> {
  const token = requiredEnv("APIFY_TOKEN");
  const actor = requiredEnv("APIFY_ACTOR_ID").replace("/", "~");
  const url = `https://api.apify.com/v2/actors/${encodeURIComponent(actor)}/runs?maxItems=${request.max_candidates}&timeout=300&memory=512`;
  const response = await boundedFetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ startUrls: request.known_urls.map((item) => ({ url: item })), query: request.evidence_question, maxItems: request.max_candidates }) }, 30_000);
  if (!response.ok) throw new Error(`APIFY_START_${response.status}`);
  const body = await response.json() as { data?: { id?: string } };
  return { route: "APIFY_ASYNC", providerRunId: body.data?.id ?? null, candidates: [], pending: true, message: "Apify Actor started asynchronously; dataset results require callback validation" };
}

function normalizeItem(item: Record<string, unknown>, request: CollectionRequest, provider: CollectorRoute, index: number, discoveryOnly: boolean): CandidateEnvelope[] {
  const sourceUrl = stringField(item, ["url", "source_url", "link"]); if (!sourceUrl || !isHttpUrl(sourceUrl)) return [];
  const excerpt = stringField(item, ["text", "markdown", "content", "snippet", "description"]).slice(0, 600);
  const title = stringField(item, ["title", "name", "headline"]) || new URL(sourceUrl).hostname;
  const retrievedAt = new Date().toISOString();
  const rawAvailableAt = stringField(item, ["published_at", "publishedAt", "date", "available_at"]);
  const availableAt = normalizeDate(rawAvailableAt, retrievedAt);
  return [{
    candidateId: `CAND-${randomUUID()}`, requestId: request.request_id, provider, providerRunId: stringField(item, ["run_id", "runId"]) || null,
    sourceUrl, sourceTypeClaimed: request.source_types[0], title: title.slice(0, 240), availableAtClaimed: availableAt,
    retrievedAt, contentSha256: hashContent(excerpt), excerptCandidate: excerpt,
    collectorStatus: "UNTRUSTED_SOURCE_CANDIDATE", evidenceGateStatus: "PENDING",
    warnings: [...(discoveryOnly ? ["DISCOVERY_ONLY", "RIGHTS_UNKNOWN"] : ["RIGHTS_UNKNOWN"]), ...(rawAvailableAt && !availableAt ? ["DATE_UNPARSEABLE"] : [])],
  }];
}

function stringField(item: Record<string, unknown>, keys: string[]) { for (const key of keys) if (typeof item[key] === "string") return item[key] as string; return ""; }
function requiredEnv(name: string) { const value = process.env[name]; if (!value) throw new Error(`${name}_REQUIRED`); return value; }
function isHttpUrl(value: string) { try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; } }
function normalizeDate(value: string, retrievedAt: string) {
  if (!value) return null;
  const relative = value.trim().match(/^(\d+)\s+(minute|hour|day|week|month|year)s?\s+ago$/i);
  if (relative) {
    const amount = Number(relative[1]);
    const unitMs: Record<string, number> = { minute: 60_000, hour: 3_600_000, day: 86_400_000, week: 604_800_000, month: 2_629_746_000, year: 31_556_952_000 };
    return new Date(new Date(retrievedAt).getTime() - amount * unitMs[relative[2].toLowerCase()]).toISOString();
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
async function boundedFetch(url: string, init: RequestInit, timeoutMs: number) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (!RETRYABLE_STATUS.has(response.status) || attempt === 3) return response;
      await delay(retryDelayMs(response, attempt));
    } catch (error) {
      if (attempt === 3) throw new Error(sanitizeError(error).code);
      await delay(Math.min(500 * 2 ** (attempt - 1), 2_000));
    }
  }
  throw new Error("COLLECTOR_RETRY_EXHAUSTED");
}

function retryDelayMs(response: Response, attempt: number) {
  const retryAfter = Number(response.headers.get("retry-after"));
  return Number.isFinite(retryAfter) && retryAfter >= 0 ? Math.min(retryAfter * 1000, 10_000) : Math.min(500 * 2 ** (attempt - 1), 2_000);
}
function delay(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }
