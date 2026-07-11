import { z } from "zod";
import { assertPublicHttpUrl } from "../partners/safety";
import type { CandidateEnvelope } from "./contracts";

export const CleanCrawlItemSchema = z.object({
  title: z.string().trim().min(1).max(240),
  date: z.string().trim().min(1).max(100).nullable(),
  content: z.string().trim().min(20).max(600),
  url: z.string().url().max(2048).superRefine((value, ctx) => {
    try { assertPublicHttpUrl(value); }
    catch { ctx.addIssue({ code: "custom", message: "Only public HTTP(S) URLs are allowed." }); }
  }),
});

export type CleanCrawlItem = z.infer<typeof CleanCrawlItemSchema>;
export interface CrawlOutputValidation { passed: boolean; data: CleanCrawlItem[]; rejectedRecords: number; recordCount: number; rubric: "CRAWL-OUTPUT-v1" }

export function cleanAndValidateCrawlOutput(candidates: CandidateEnvelope[]): CrawlOutputValidation {
  const data: CleanCrawlItem[] = [];
  let rejectedRecords = 0;
  for (const candidate of candidates) {
    const parsed = CleanCrawlItemSchema.safeParse({
      title: candidate.title,
      date: candidate.availableAtClaimed,
      content: candidate.excerptCandidate,
      url: candidate.sourceUrl,
    });
    if (parsed.success) data.push(parsed.data);
    else rejectedRecords++;
  }
  return { passed: data.length > 0, data, rejectedRecords, recordCount: candidates.length, rubric: "CRAWL-OUTPUT-v1" };
}
