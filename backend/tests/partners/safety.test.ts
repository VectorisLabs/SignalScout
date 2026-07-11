import { expect, it } from "vitest";
import { ApifyRunRequestSchema, LangfuseQuerySchema, TinyFishFetchRequestSchema, assertPublicHttpUrl, sanitizeError } from "../../src/partners/safety";

it("blocks private URLs and over-broad provider operations", () => {
  expect(() => assertPublicHttpUrl("http://169.254.169.254/latest/meta-data")).toThrow("PRIVATE_NETWORK_URL");
  for (const url of ["http://[::1]/", "http://[fc00::1]/", "http://[fe80::1]/", "http://[::ffff:127.0.0.1]/", "http://localhost./"]) expect(() => assertPublicHttpUrl(url)).toThrow("PRIVATE_NETWORK_URL");
  expect(TinyFishFetchRequestSchema.safeParse({ urls: ["https://example.com", "https://example.org", "https://example.net", "https://example.edu"], format: "markdown", perUrlTimeoutMs: 45000 }).success).toBe(false);
  expect(ApifyRunRequestSchema.safeParse({ actorId: "apify/web-scraper", input: {}, maxItems: 1000, timeoutSeconds: 120, memoryMb: 512, mode: "async" }).success).toBe(false);
  expect(ApifyRunRequestSchema.safeParse({ actorId: "apify/web-scraper", input: { startUrls: [{ url: "http://169.254.169.254/latest/meta-data" }] }, maxItems: 3, timeoutSeconds: 120, memoryMb: 512, mode: "async" }).success).toBe(false);
  expect(LangfuseQuerySchema.safeParse({ fromStartTime: "2026-07-11T00:00:00.000Z", toStartTime: "2026-07-10T00:00:00.000Z", fields: ["core"], limit: 10 }).success).toBe(false);
  expect(sanitizeError(new Error("Authorization: Bearer secret"))).toEqual({ code: "PARTNER_REQUEST_FAILED", message: expect.not.stringContaining("secret") });
});
