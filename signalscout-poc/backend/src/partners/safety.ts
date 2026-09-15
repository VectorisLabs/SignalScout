import { z } from "zod";
import { isIP } from "node:net";

export function assertPublicHttpUrl(raw: string): URL {
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("UNSAFE_URL_SCHEME");
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.+$/, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) throw new Error("PRIVATE_NETWORK_URL");
  if (isIP(host) === 4 && (host === "0.0.0.0" || host === "169.254.169.254" || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host))) throw new Error("PRIVATE_NETWORK_URL");
  if (isIP(host) === 6 && (host === "::" || host === "::1" || /^f[cd]/.test(host) || /^fe[89ab]/.test(host) || /^::ffff:/.test(host))) throw new Error("PRIVATE_NETWORK_URL");
  return url;
}

export const TinyFishSearchRequestSchema = z.object({ query: z.string().min(2).max(240), purpose: z.string().min(2).max(400), domainType: z.enum(["web", "news", "research_paper"]).default("news"), maxResults: z.number().int().min(1).max(5) });
export const TinyFishFetchRequestSchema = z.object({ urls: z.array(z.string().max(2048)).min(1).max(3), format: z.enum(["markdown", "json"]).default("markdown"), perUrlTimeoutMs: z.number().int().min(1000).max(110000) }).superRefine((value, ctx) => value.urls.forEach((url, index) => { try { assertPublicHttpUrl(url); } catch { ctx.addIssue({ code: "custom", path: ["urls", index], message: "Only public HTTP(S) URLs are allowed." }); } }));
function publicUrlsOnly(value: unknown): boolean { if (typeof value === "string" && /^https?:/i.test(value)) { try { assertPublicHttpUrl(value); return true; } catch { return false; } } if (Array.isArray(value)) return value.every(publicUrlsOnly); if (value && typeof value === "object") return Object.values(value).every(publicUrlsOnly); return true; }
export const ApifyRunRequestSchema = z.object({ actorId: z.string().min(3).max(120).regex(/^[\w-]+\/[\w-]+$/), input: z.record(z.string(), z.unknown()), maxItems: z.number().int().min(1).max(25), timeoutSeconds: z.number().int().min(1).max(300), memoryMb: z.number().int().min(128).max(2048), mode: z.enum(["sync", "async"]) }).superRefine((value, ctx) => { if (JSON.stringify(value.input).length > 50_000) ctx.addIssue({ code: "custom", path: ["input"], message: "Actor input exceeds the validate-only bound." }); if (!publicUrlsOnly(value.input)) ctx.addIssue({ code: "custom", path: ["input"], message: "Actor input contains a non-public URL." }); });
export const LangfuseQuerySchema = z.object({ fromStartTime: z.string().datetime(), toStartTime: z.string().datetime(), fields: z.array(z.enum(["core", "basic", "time", "metadata", "model", "usage", "prompt", "metrics", "trace_context"])).max(9), limit: z.number().int().min(1).max(250) }).refine((v) => Date.parse(v.fromStartTime) <= Date.parse(v.toStartTime), "Invalid time window");

export function sanitizeError(_error: unknown) { return { code: "PARTNER_REQUEST_FAILED", message: "Partner request failed; credentials and response body were redacted." }; }
