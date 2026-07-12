import { useEffect, useRef, useState } from "react";
import type { ChatVisualization } from "@corpwatch/backend/contracts";
import { useInvestigation } from "./investigation";

interface Citation { id: string; title: string; url: string; status: string }
interface ToolEvent { at: string; phase: string; status: string; message: string }
interface ChatMessage { id: string; role: "user" | "assistant"; content: string; citations?: Citation[]; toolEvents?: ToolEvent[]; visualizations?: ChatVisualization[] }

const suggestions = [
  "Recommended posture for Bed Bath & Beyond?",
  "Show the restructuring evidence timeline",
  "Financial metrics and coverage",
  "Collector routes and validation trend",
];

let dockSeq = 0;
const nextId = () => `d${++dockSeq}-${globalThis.crypto?.randomUUID?.().slice(0, 8) ?? dockSeq}`;

/** Compact chat docked beside the dashboard. Each answer updates the shared investigation,
 *  so the dashboard on the right re-renders live — no separate artifact panel. */
export function ChatDock() {
  const [sessionId] = useState(() => globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const transcriptRef = useRef<HTMLDivElement>(null);
  const { setInvestigation } = useInvestigation();
  useEffect(() => { const node = transcriptRef.current; node?.scrollTo?.({ top: node.scrollHeight, behavior: "smooth" }); }, [messages, busy]);

  async function send(text: string) {
    const message = text.trim(); if (!message || busy) return;
    setMessages((current) => [...current, { id: nextId(), role: "user", content: message }]); setPrompt(""); setBusy(true); setError("");
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, message }) });
      const body = await response.json() as { answer?: string; citations?: Citation[]; toolEvents?: ToolEvent[]; visualizations?: ChatVisualization[]; message?: string; mode?: string };
      if (!response.ok) throw new Error(body.message ?? "Chat request failed");
      const assistant: ChatMessage = { id: nextId(), role: "assistant", content: body.answer ?? "No answer returned.", citations: body.citations, toolEvents: body.toolEvents, visualizations: body.visualizations };
      setMessages((current) => [...current, assistant]);
      setInvestigation({ question: message, answer: assistant.content, visualizations: assistant.visualizations ?? [], mode: body.mode ?? "live", at: new Date().toISOString() });
    } catch (chatError) { setError(chatError instanceof Error ? chatError.message : "Chat request failed safely."); }
    finally { setBusy(false); }
  }

  return <div className="flex flex-col h-full min-h-0 bg-canvas dark:bg-dcanvas">
    <div className="shrink-0 flex items-center gap-2 px-4 h-12 border-b border-line dark:border-dline">
      <span className="w-2 h-2 rounded-full bg-lime pulse" /><span className="text-xs font-semibold uppercase tracking-[.12em] text-muted dark:text-white/55">signalScout agent</span>
      {messages.length > 0 && <button onClick={() => { setMessages([]); setError(""); }} className="ml-auto text-xs font-semibold text-muted dark:text-white/50 hover:text-ink dark:hover:text-white cursor-pointer transition-colors">Clear</button>}
    </div>

    <div ref={transcriptRef} className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
      {messages.length === 0
        ? <div className="text-sm">
            <p className="text-muted dark:text-white/60 leading-relaxed">Ask about a company, filing or signal. Answers update the dashboard on the right with cited artifacts.</p>
            <div className="mt-4 grid gap-2">{suggestions.map((item) => <button key={item} onClick={() => send(item)} className="text-left px-3 py-2 rounded-xl border border-line dark:border-dline hover:border-green2 hover:bg-soft dark:hover:bg-dsurface2 cursor-pointer transition-colors">{item}</button>)}</div>
          </div>
        : <div className="space-y-4">
            {messages.map((message) => <MessageRow key={message.id} message={message} />)}
            {busy && <p role="status" className="text-xs text-muted dark:text-white/50 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-lime pulse" />Planning → routing → validating…</p>}
            {error && <div role="alert" className="p-3 rounded-xl border border-danger/40 bg-danger/5 text-xs"><strong className="text-danger">Agent unavailable</strong><p className="mt-1 text-muted dark:text-white/60">{error}</p></div>}
          </div>}
    </div>

    <div className="shrink-0 border-t border-line dark:border-dline p-3">
      <form onSubmit={(event) => { event.preventDefault(); void send(prompt); }}>
        <div className="flex items-end gap-2 rounded-2xl border border-line dark:border-dline bg-paper dark:bg-dsurface p-2 focus-within:border-green2 transition-colors">
          <label htmlFor="dock-prompt" className="sr-only">Investigation prompt</label>
          <textarea id="dock-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(prompt); } }} maxLength={4000} rows={1} placeholder="Ask signalScout…" className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none max-h-32" />
          <button disabled={busy || !prompt.trim()} aria-label="Send" className="shrink-0 grid place-items-center w-8 h-8 rounded-lg bg-lime text-ink cursor-pointer hover:bg-lime/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m22 2-7 20-4-9-9-4Z" /></svg>
          </button>
        </div>
      </form>
    </div>
  </div>;
}

function MessageRow({ message }: { message: ChatMessage }) {
  if (message.role === "user") return <div className="flex justify-end"><div className="max-w-[90%] rounded-2xl rounded-br-sm bg-lime text-ink px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div></div>;
  return <div className="flex gap-2.5">
    <span className="shrink-0 grid place-items-center w-7 h-7 rounded-lg bg-forest text-lime font-display font-extrabold text-[.62rem]">SC</span>
    <div className="min-w-0 flex-1">
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      {message.citations && message.citations.length > 0 && <div className="mt-2 space-y-1.5">{message.citations.slice(0, 4).map((citation) => <SourceCard key={citation.id} citation={citation} />)}</div>}
      {message.toolEvents && message.toolEvents.length > 0 && <details className="mt-2 text-xs"><summary className="cursor-pointer font-semibold text-muted dark:text-white/55 select-none">Agent steps · {message.toolEvents.length}</summary><div className="mt-1.5 space-y-1">{message.toolEvents.map((event, index) => <p key={`${event.at}-${index}`} className="text-muted dark:text-white/55"><span className="font-semibold text-green2 uppercase">{event.phase}·{event.status}</span> {event.message}</p>)}</div></details>}
      {message.visualizations && message.visualizations.length > 0 && <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-green2"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M8 15l3-4 3 2 4-6" /></svg>Dashboard updated · {message.visualizations.length} artifacts</p>}
    </div>
  </div>;
}

function SourceCard({ citation }: { citation: Citation }) {
  let domain = ""; try { domain = citation.url ? new URL(citation.url).hostname.replace(/^www\./, "") : ""; } catch { domain = ""; }
  return <a href={citation.url || undefined} target="_blank" rel="noreferrer" className="block rounded-lg border border-line dark:border-dline bg-paper dark:bg-dsurface p-2 hover:border-green2 transition-colors">
    <div className="flex items-center gap-1.5 text-[.62rem] text-muted dark:text-white/45"><span className="w-1.5 h-1.5 rounded-full bg-green2" />{domain || "source"}</div>
    <p className="mt-0.5 text-xs font-medium line-clamp-2">{citation.title}</p>
  </a>;
}
