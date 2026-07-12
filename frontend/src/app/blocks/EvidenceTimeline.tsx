import type { EvidenceTimelineViz } from "@corpwatch/backend/contracts";

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(date);
};

export function EvidenceTimeline({ block }: { block: EvidenceTimelineViz }) {
  return <section aria-label="Evidence timeline">
    <div className="mb-5"><p className="eyebrow text-green2">Evidence timeline</p><h3 className="font-display text-2xl font-bold mt-1">What was knowable, when</h3></div>
    {block.items.length === 0
      ? <p className="p-4 rounded-lg bg-[#fff1dc] text-ink border-l-4 border-amber">No approved evidence is available for this frame.</p>
      : <ol className="space-y-5">{block.items.map((item, index) =>
          <li key={item.id} className="grid grid-cols-[48px_1fr] gap-4">
            <div><span className="grid place-items-center w-10 h-10 rounded-full bg-forest text-white border-4 border-canvas dark:border-dcanvas text-xs font-extrabold">{String(index + 1).padStart(2, "0")}</span></div>
            <article className="rounded-2xl bg-paper dark:bg-dsurface border border-line dark:border-dline p-5">
              <div className="flex justify-between items-center">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#DAF0E5] text-[#146044] text-[.6rem] font-extrabold uppercase tracking-wide"><svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m20 6-11 11-5-5" /></svg>{item.status}</span>
                {item.date && <time className="text-muted dark:text-white/45 text-xs">{formatDate(item.date)}</time>}
              </div>
              <h4 className="font-display mt-2.5 mb-1.5">{item.title}</h4>
              {item.excerpt && <p className="text-[#4e5a55] dark:text-white/60 text-sm leading-relaxed">{item.excerpt}</p>}
              {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-green2 hover:underline">Open source <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7m0 0H8m9 0v9" /></svg></a>}
            </article>
          </li>)}</ol>}
  </section>;
}
