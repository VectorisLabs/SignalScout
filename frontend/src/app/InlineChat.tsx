import { useEffect, useRef, useState } from "react";

interface ChatMessage { role: "user" | "assistant"; content: string; citations?: Array<{ id: string; title: string; url: string; status: string }> }
interface ToolEvent { at: string; phase: string; status: string; message: string }

export function InlineChat({ promptRef }: { promptRef?: React.RefObject<HTMLTextAreaElement | null> }) {
  const [sessionId] = useState(() => globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`);
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: "What would you like to investigate? I can request public evidence, while signalScout policy selects and validates the collection route." }]);
  const [prompt, setPrompt] = useState(""); const [events, setEvents] = useState<ToolEvent[]>([]); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const transcriptRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const node = transcriptRef.current; node?.scrollTo?.({ top: node.scrollHeight, behavior: "smooth" }); }, [messages, busy]);

  async function sendPrompt(event: React.FormEvent) {
    event.preventDefault(); const message = prompt.trim(); if (!message || busy) return;
    setMessages((current) => [...current, { role: "user", content: message }]); setPrompt(""); setBusy(true); setError("");
    setEvents([{ at: new Date().toISOString(), phase: "planning", status: "started", message: "OpenAI is deciding whether approved evidence is sufficient." }]);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, message }) });
      const body = await response.json() as { answer?: string; citations?: ChatMessage["citations"]; toolEvents?: ToolEvent[]; message?: string };
      if (!response.ok) throw new Error(body.message ?? "Chat request failed");
      setEvents(body.toolEvents ?? []); setMessages((current) => [...current, { role: "assistant", content: body.answer ?? "No answer returned.", citations: body.citations }]);
    } catch (chatError) { setError(chatError instanceof Error ? chatError.message : "Chat request failed safely."); }
    finally { setBusy(false); }
  }

  const suggestions = ["Find current restructuring evidence", "Validate a known public URL", "Explain the collector route for a recurring batch"];
  return <section aria-labelledby="agent-title" className="rounded-2xl bg-white/[.07] border border-white/15 backdrop-blur-md p-5 sm:p-6 grid gap-3">
    <header className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-lime pulse" /><small className="text-white/60 uppercase tracking-[.12em] text-xs font-semibold">signalScout evidence agent</small></header>
    <h2 id="agent-title" className="font-display text-2xl -mt-1">Ask signalScout</h2>

    <div ref={transcriptRef} aria-live="polite" className="grid gap-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
      {messages.map((message, index) =>
        <article key={`${message.role}-${index}`} className={message.role === "user" ? "w-[88%] max-w-[520px] ml-auto bg-lime text-ink rounded-2xl rounded-br-sm p-3.5" : "w-[92%] max-w-[560px] bg-white text-ink rounded-2xl rounded-bl-sm p-3.5"}>
          <span className="text-[.62rem] font-extrabold uppercase tracking-[.1em] text-muted">{message.role === "user" ? "You" : "signalScout"}</span>
          <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          {message.citations?.map((citation) => <a key={citation.id} href={citation.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-green2 hover:underline">{citation.title} · {citation.status}</a>)}
        </article>)}
      {busy && <p role="status" className="text-lime text-sm">Planning → routing → validating…</p>}
    </div>

    {events.length > 0 && <details className="rounded-xl bg-white/[.06] border border-white/10 px-4 py-2.5 text-sm max-h-[180px] overflow-y-auto">
      <summary className="cursor-pointer font-semibold text-white/80 select-none">Tool execution log · {events.length}</summary>
      <div className="mt-2 space-y-2 text-white/70">{events.map((item, index) => <p key={`${item.at}-${index}`}><span className="inline-block px-2 py-0.5 rounded-md bg-lime/20 text-lime text-[.62rem] font-bold uppercase tracking-wide">{item.phase} · {item.status}</span> {item.message}</p>)}</div>
    </details>}

    {error && <div role="alert" className="rounded-xl bg-white/90 text-ink p-3.5"><strong>Agent unavailable</strong><p className="mt-1 text-sm">{error}</p></div>}

    <div className="flex gap-2 overflow-x-auto no-scrollbar">{suggestions.map((item) => <button type="button" key={item} onClick={() => setPrompt(item)} className="shrink-0 px-3 py-1.5 rounded-full border border-white/25 text-white/80 text-xs hover:bg-white/10 cursor-pointer transition-colors">{item}</button>)}</div>

    <form className="grid gap-2 pt-3 border-t border-white/15" onSubmit={sendPrompt}>
      <label htmlFor="agent-prompt" className="eyebrow text-white/60">Investigation prompt</label>
      <textarea id="agent-prompt" ref={promptRef} value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={4000} rows={2} placeholder="Ask about a company, filing, signal, or known URL…" className="w-full rounded-xl border-0 bg-white text-ink p-3 text-sm resize-none" />
      <div className="flex items-center justify-between"><span className="text-xs text-white/50">{prompt.length}/4000</span><button disabled={busy || !prompt.trim()} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-lime text-ink font-extrabold cursor-pointer hover:bg-lime/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{busy ? "Working…" : "Send"}</button></div>
    </form>
  </section>;
}
