import { describe, expect, it } from "vitest";
import { CasePackageSchema } from "../../src/contracts";
import { buildCase, stableSerialize } from "../../scripts/build-case";

describe("buildCase", () => {
  it("is deterministic, canonical and temporally honest", () => {
    const first = buildCase(); const second = buildCase();
    expect(second).toEqual(first); expect(stableSerialize(second)).toBe(stableSerialize(first)); expect(CasePackageSchema.safeParse(first).success).toBe(true);
    const evidence = new Map(first.evidence.map((item) => [item.id, item]));
    for (const frame of first.replay) for (const id of frame.evidenceIds) expect(evidence.get(id)!.publiclyAvailableAt <= frame.asOf).toBe(true);
    expect(JSON.stringify(first)).not.toMatch(/authorization|sk-[a-z0-9]/i);
  });
});
