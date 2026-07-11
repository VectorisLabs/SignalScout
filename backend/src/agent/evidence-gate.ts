import { createHash } from "node:crypto";
import { assertPublicHttpUrl } from "../partners/safety";
import type { CandidateEnvelope, CollectionRequest, GateCheck, GateResult } from "./contracts";

export function hashContent(value: string) { return createHash("sha256").update(value).digest("hex"); }

export function validateCandidate(candidate: CandidateEnvelope, request: CollectionRequest): GateResult {
  const checks: GateCheck[] = [
    check("schema_valid", Boolean(candidate.candidateId && candidate.requestId === request.request_id), true, "Candidate envelope and request identity must be stable"),
    check("public_url_valid", isPublicUrl(candidate.sourceUrl), true, "Source must be a public HTTP(S) URL"),
    check("source_type_allowed", request.source_types.includes(candidate.sourceTypeClaimed as never), true, "Source type must be requested"),
    check("replay_time_valid", !candidate.availableAtClaimed || candidate.availableAtClaimed <= request.replay_as_of, true, "Source cannot post-date replay_as_of"),
    check("content_present", candidate.excerptCandidate.trim().length >= 20 && candidate.excerptCandidate.length <= 600, true, "Candidate excerpt must be bounded and non-empty"),
    check("content_hash_valid", candidate.contentSha256 === hashContent(candidate.excerptCandidate), true, "Frozen content hash must match excerpt"),
    check("rights_eligible", !candidate.warnings.includes("RIGHTS_UNKNOWN"), true, "Rights status must be eligible before approval"),
    check("curator_approved", candidate.evidenceGateStatus === "APPROVED", true, "Human curator approval is required for factual evidence"),
  ];
  const requiredPassed = checks.filter((item) => item.required && item.name !== "curator_approved").every((item) => item.passed);
  const curatorApproved = checks.find((item) => item.name === "curator_approved")!.passed;
  const status = !requiredPassed ? "REJECTED" : curatorApproved ? "VALID_CANDIDATE" : "PENDING_CURATOR";
  candidate.evidenceGateStatus = status === "REJECTED" ? "REJECTED" : status === "PENDING_CURATOR" ? "PENDING_CURATOR" : "APPROVED";
  return { candidate, status, checks, passRate: checks.filter((item) => item.passed).length / checks.length };
}

function check(name: string, passed: boolean, required: boolean, message: string): GateCheck { return { name, passed, required, message }; }
function isPublicUrl(value: string) { try { assertPublicHttpUrl(value); return true; } catch { return false; } }
