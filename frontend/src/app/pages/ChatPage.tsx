import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { ChatVisualization } from "@corpwatch/backend/contracts";
import { ArtifactRenderer } from "../ArtifactRenderer";
import { ThemeToggle } from "../ThemeToggle";
import { useInvestigation } from "../investigation";

interface Citation { id: string; title: string; url: string; status: string }
interface ToolEvent { at: string; phase: string; status: string; message: string }
interface ChatMessage { id: string; role: "user" | "assistant"; content: string; citations?: Citation[]; toolEvents?: ToolEvent[]; visualizations?: ChatVisualization[] }

const suggestions = [
  "What is the recommended posture and why?",
  "Show the restructuring evidence timeline",
  "Break down the reported financial metrics and coverage",
  "Explain the collector routes and validation trend",
];

let messageSeq = 0;
const nextId = () => `m${++messageSeq}-${globalThis.crypto?.randomUUID?.().slice(0, 8) ?? messageSeq}`;

export function ChatPage() {
  const [sessionId] = useState(() => globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const { setInvestigation } = useInvestigation();
  const active = messages.find((message) => message.id === activeArtifactId && message.visualizations?.length);
  const hasInvestigation = messages.some((message) => message.role === "assistant");

  useEffect(() => { const node = transcriptRef.current; node?.scrollTo?.({ top: node.scrollHeight, behavior: "smooth" }); }, [messages, busy]);

  async function send(text: string) {
    const message = text.trim(); if (!message || busy) return;
    const userMessage: ChatMessage = { id: nextId(), role: "user", content: message };
    setMessages((current) => [...current, userMessage]); setPrompt(""); setBusy(true); setError("");
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, message }) });
      const body = await response.json() as { answer?: string; citations?: Citation[]; toolEvents?: ToolEvent[]; visualizations?: ChatVisualization[]; message?: string };
      if (!response.ok) throw new Error(body.message ?? "Chat request failed");
      const assistant: ChatMessage = { id: nextId(), role: "assistant", content: body.answer ?? "No answer returned.", citations: body.citations, toolEvents: body.toolEvents, visualizations: body.visualizations };
      setMessages((current) => [...current, assistant]);
      if (assistant.visualizations?.length) setActiveArtifactId(assistant.id);
      setInvestigation({ question: message, answer: assistant.content, visualizations: assistant.visualizations ?? [], mode: (body as { mode?: string }).mode ?? "live", at: new Date().toISOString() });
    } catch (chatError) { setError(chatError instanceof Error ? chatError.message : "Chat request failed safely."); }
    finally { setBusy(false); }
  }

  const isEmpty = messages.length === 0;

  return <div className="h-screen flex flex-col bg-canvas text-ink dark:bg-dcanvas dark:text-white/90">
    <header className="shrink-0 h-14 border-b border-line dark:border-dline flex items-center gap-3 px-4">
      <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="signalScout home"><span className="grid place-items-center w-8 h-8 rounded-lg bg-forest text-lime font-display font-extrabold text-[.7rem]">SC</span><strong className="font-display text-sm hidden sm:block">signalScout</strong></Link>
      <button onClick={() => { setMessages([]); setActiveArtifactId(null); setError(""); }} className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line dark:border-dline text-sm font-semibold hover:bg-soft dark:hover:bg-dsurface2 cursor-pointer transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" /></svg>New chat
      </button>
      <span className="ml-auto" />
      {hasInvestigation && <Link to="/dashboard" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest text-white text-sm font-bold hover:bg-green2 cursor-pointer transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M8 15l3-4 3 2 4-6" /></svg>Open dashboard
      </Link>}
      <ThemeToggle />
    </header>

    <div className="flex-1 min-h-0 flex">
      {/* Chat column — narrows to a left rail when an artifact panel is open */}
      <section className={`flex flex-col min-h-0 ${active ? "w-full lg:w-[400px] lg:shrink-0 lg:border-r border-line dark:border-dline" : "w-full"}`}>
        <div ref={transcriptRef} className="flex-1 overflow-y-auto">
          {isEmpty
            ? <div className="h-full grid place-content-center px-6"><div className="max-w-2xl mx-auto text-center">
                <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Ask signalScout</h1>
                <p className="mt-3 text-muted dark:text-white/55">Investigate public corporate-change signals. Answers arrive as cited evidence with visual decision artifacts.</p>
                <div className="mt-7 grid sm:grid-cols-2 gap-2.5 text-left">{suggestions.map((item) =>
                  <button key={item} onClick={() => send(item)} className="px-4 py-3 rounded-xl border border-line dark:border-dline text-sm hover:border-green2 hover:bg-soft dark:hover:bg-dsurface2 cursor-pointer transition-colors">{item}</button>)}</div>
              </div></div>
            : <div className={`px-4 py-6 space-y-6 ${active ? "" : "max-w-3xl mx-auto"}`}>
                {messages.map((message) => <MessageRow key={message.id} message={message} active={message.id === activeArtifactId} onView={() => setActiveArtifactId(message.id)} compact={Boolean(active)} />)}
                {busy && <p role="status" className="text-sm text-muted dark:text-white/50 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-lime pulse" />Planning → routing → validating…</p>}
                {error && <div role="alert" className="p-3.5 rounded-xl border border-danger/40 bg-danger/5 text-sm"><strong className="text-danger">Agent unavailable</strong><p className="mt-1 text-muted dark:text-white/60">{error}</p></div>}
              </div>}
        </div>

        <div className="shrink-0 border-t border-line dark:border-dline p-3 sm:p-4">
          <form onSubmit={(event) => { event.preventDefault(); void send(prompt); }} className={`${active ? "" : "max-w-3xl mx-auto"}`}>
            <div className="flex items-end gap-2 rounded-2xl border border-line dark:border-dline bg-paper dark:bg-dsurface p-2 focus-within:border-green2 transition-colors">
              <label htmlFor="chat-prompt" className="sr-only">Investigation prompt</label>
              <textarea id="chat-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(prompt); } }} maxLength={4000} rows={1} placeholder="Ask about a company, filing, signal, or known URL…" className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none max-h-40" />
              <button disabled={busy || !prompt.trim()} aria-label="Send" className="shrink-0 grid place-items-center w-9 h-9 rounded-xl bg-lime text-ink cursor-pointer hover:bg-lime/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m22 2-7 20-4-9-9-4Z" /></svg>
              </button>
            </div>
            <p className="mt-1.5 text-center text-[.68rem] text-muted dark:text-white/40">signalScout renders approved evidence only — decision support, not a forecast.</p>
          </form>
        </div>
      </section>

      {/* Artifact panel — static pane on desktop, full-screen overlay on mobile */}
      {active && <aside className="fixed inset-0 z-40 lg:static lg:z-auto lg:flex-1 min-h-0 flex flex-col bg-canvas dark:bg-dcanvas">
        <header className="shrink-0 h-14 border-b border-line dark:border-dline flex items-center gap-3 px-4">
          <span className="inline-flex items-center gap-2 text-sm font-semibold"><svg className="w-4 h-4 text-green2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M8 15l3-4 3 2 4-6" /></svg>Visualization</span>
          <Link to="/dashboard" className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest text-white text-sm font-bold hover:bg-green2 cursor-pointer transition-colors">Open dashboard</Link>
          <button onClick={() => setActiveArtifactId(null)} aria-label="Close visualization panel" className="grid place-items-center w-8 h-8 rounded-lg border border-line dark:border-dline hover:bg-soft dark:hover:bg-dsurface2 cursor-pointer transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5 sm:p-7"><div className="max-w-3xl mx-auto"><ArtifactRenderer blocks={active.visualizations!} /></div></div>
      </aside>}
    </div>
  </div>;
}

function MessageRow({ message, active, onView, compact }: { message: ChatMessage; active: boolean; onView: () => void; compact: boolean }) {
  if (message.role === "user") {
    return <div className="flex justify-end"><div className="max-w-[85%] rounded-2xl rounded-br-sm bg-lime text-ink px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div></div>;
  }
  return <div className="flex gap-3">
    <span className="shrink-0 grid place-items-center w-8 h-8 rounded-lg bg-forest text-lime font-display font-extrabold text-[.7rem]">SC</span>
    <div className="min-w-0 flex-1">
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      {message.citations && message.citations.length > 0 && <div className={`mt-3 grid gap-2 ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}>{message.citations.map((citation) => <SourceCard key={citation.id} citation={citation} />)}</div>}
      {message.toolEvents && message.toolEvents.length > 0 && <details className="mt-3 rounded-xl border border-line dark:border-dline px-3.5 py-2 text-sm"><summary className="cursor-pointer font-semibold text-muted dark:text-white/60 select-none">Agent steps · {message.toolEvents.length}</summary><div className="mt-2 space-y-1.5">{message.toolEvents.map((event, index) => <p key={`${event.at}-${index}`} className="text-xs text-muted dark:text-white/55"><span className="font-semibold text-green2 uppercase">{event.phase} · {event.status}</span> — {event.message}</p>)}</div></details>}
      {message.visualizations && message.visualizations.length > 0 && <button onClick={onView} className={`mt-3 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-colors ${active ? "bg-green2 text-white" : "border border-green2 text-green2 hover:bg-green2/10"}`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M8 15l3-4 3 2 4-6" /></svg>
        {active ? "Viewing visualization" : `View visualization · ${message.visualizations.length}`}
      </button>}
    </div>
  </div>;
}

function SourceCard({ citation }: { citation: Citation }) {
  let domain = ""; try { domain = citation.url ? new URL(citation.url).hostname.replace(/^www\./, "") : ""; } catch { domain = ""; }
  return <a href={citation.url || undefined} target="_blank" rel="noreferrer" className="block rounded-xl border border-line dark:border-dline bg-paper dark:bg-dsurface p-3 hover:border-green2 transition-colors">
    <div className="flex items-center gap-2 text-[.68rem] text-muted dark:text-white/45"><span className="w-1.5 h-1.5 rounded-full bg-green2" />{domain || "source"}</div>
    <p className="mt-1 text-sm font-medium line-clamp-2">{citation.title}</p>
  </a>;
}
