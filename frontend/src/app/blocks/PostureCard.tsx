import type { PostureViz } from "@corpwatch/backend/contracts";

export function PostureCard({ block }: { block: PostureViz }) {
  return <div className="rounded-2xl bg-lime text-ink p-6">
    <span className="eyebrow">Recommended posture</span>
    <strong className="block font-display text-[2.7rem] leading-none tracking-tight my-3">{block.posture}</strong>
    <p className="text-sm leading-relaxed">{block.rationale}</p>
    <div className="flex justify-between pt-3 mt-4 border-t border-ink/20 text-sm font-bold"><small>{block.stage}</small><small>Index {block.index}/100</small></div>
  </div>;
}
