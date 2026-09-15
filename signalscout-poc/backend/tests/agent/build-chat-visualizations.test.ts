import { describe, expect, it } from "vitest";
import { ChatVisualizationSchema } from "../../src/contracts";
import { buildChatVisualizations, buildOfflineChatTurn } from "../../src/agent/build-chat-visualizations";

describe("buildChatVisualizations", () => {
  it("returns schema-valid blocks for every turn", () => {
    const blocks = buildChatVisualizations("What is the recommended posture and the metric coverage?");
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) expect(() => ChatVisualizationSchema.parse(block)).not.toThrow();
  });

  it("selects strategy + metric blocks by intent keywords", () => {
    const kinds = buildChatVisualizations("Compare the response posture and revenue coverage").map((block) => block.kind);
    expect(kinds).toContain("posture");
    expect(kinds).toContain("strategyFit");
    expect(kinds).toContain("metricLens");
  });

  it("selects evidence + radar blocks for evidence questions", () => {
    const kinds = buildChatVisualizations("Show the restructuring evidence timeline").map((block) => block.kind);
    expect(kinds).toContain("evidenceTimeline");
    expect(kinds).toContain("patternRadar");
  });

  it("never returns an empty panel (default posture + evidence)", () => {
    const kinds = buildChatVisualizations("hello there").map((block) => block.kind);
    expect(kinds).toEqual(["posture", "evidenceTimeline"]);
  });

  it("posture block reflects the validated ADAPT recommendation", () => {
    const posture = buildChatVisualizations("recommended posture").find((block) => block.kind === "posture");
    expect(posture).toMatchObject({ kind: "posture", posture: "ADAPT" });
  });

  it("does not graft offline case analytics onto an unrelated live company", () => {
    const blocks = buildChatVisualizations("What is Acme Corp's recommended posture and revenue?", { live: true });
    expect(blocks).toEqual([]);
  });

  it("renders live approved citations as a real evidence timeline", () => {
    const blocks = buildChatVisualizations("Find Acme Corp restructuring evidence", { live: true, citations: [{ id: "CAND-1", title: "Acme 8-K", url: "https://example.com/acme", status: "VALID_CANDIDATE" }] });
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ kind: "evidenceTimeline" });
    const timeline = blocks[0];
    if (timeline.kind !== "evidenceTimeline") throw new Error("expected timeline");
    expect(timeline.items[0]).toMatchObject({ title: "Acme 8-K", status: "Approved" });
  });

  it("still surfaces case analytics for the demo company on the live path", () => {
    const kinds = buildChatVisualizations("What is the recommended posture for Bed Bath & Beyond?", { live: true }).map((block) => block.kind);
    expect(kinds).toContain("posture");
    expect(kinds).toContain("strategyFit");
  });
});

describe("buildOfflineChatTurn", () => {
  it("produces a deterministic answer, approved citations and valid visualizations", () => {
    const turn = buildOfflineChatTurn("What restructuring evidence is available?");
    expect(turn.answer).toContain("Bed Bath & Beyond");
    expect(turn.answer).toContain("ADAPT");
    expect(turn.citations.length).toBeGreaterThan(0);
    for (const citation of turn.citations) expect(citation.status).toBe("VALID_CANDIDATE");
    expect(turn.toolEvents.some((event) => event.phase === "validating" && event.status === "completed")).toBe(true);
    for (const block of turn.visualizations) expect(() => ChatVisualizationSchema.parse(block)).not.toThrow();
  });
});
