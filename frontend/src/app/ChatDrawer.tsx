import { useEffect, useRef, useState } from "react";

interface ChatMessage { role: "user" | "assistant"; content: string; citations?: Array<{ id: string; title: string; url: string; status: string }> }
interface ToolEvent { at: string; phase: string; status: string; message: string }

export function ChatDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const [sessionId] = useState(() => globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`);
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: "What would you like to investigate? I can request public evidence, while CorpWatch policy selects and validates the collection route." }]);
  const [prompt, setPrompt] = useState(""); const [events, setEvents] = useState<ToolEvent[]>([]); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { if (open) closeButton.current?.focus(); }, [open]);
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape" && open) onClose(); }; document.addEventListener("keydown", close); return () => document.removeEventListener("keydown", close); }, [open, onClose]);

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
  return <div className="agent-layer" hidden={!open}>
    <button className="agent-backdrop" aria-label="Close evidence agent" onClick={onClose} />
    <aside className="agent-drawer" role="dialog" aria-modal="true" aria-labelledby="agent-title">
      <header className="agent-header"><div><span className="status-dot" /> <small>OpenAI evidence agent</small><h2 id="agent-title">Ask CorpWatch</h2></div><button ref={closeButton} className="icon-button" onClick={onClose} aria-label="Close agent">×</button></header>
      <div className="transcript" aria-live="polite">{messages.map((message, index) => <article className={`message ${message.role}`} key={`${message.role}-${index}`}><span>{message.role === "user" ? "You" : "CorpWatch"}</span><p>{message.content}</p>{message.citations?.map((citation) => <a key={citation.id} href={citation.url} target="_blank" rel="noreferrer">{citation.title} · {citation.status}</a>)}</article>)}{busy && <p role="status" className="thinking">Planning → routing → validating…</p>}</div>
      {events.length > 0 && <details className="tool-receipt"><summary>Tool execution log · {events.length}</summary>{events.map((item, index) => <div key={`${item.at}-${index}`}><span className="tag">{item.phase} · {item.status}</span><p>{item.message}</p></div>)}</details>}
      {error && <div role="alert" className="notice compact"><strong>Agent unavailable</strong><p>{error}</p></div>}
      <div className="suggestions">{suggestions.map((item) => <button type="button" key={item} onClick={() => setPrompt(item)}>{item}</button>)}</div>
      <form className="composer" onSubmit={sendPrompt}><label htmlFor="agent-prompt">Investigation prompt</label><textarea id="agent-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={4000} placeholder="Ask about a company, filing, signal, or known URL…" /><div><span>{prompt.length}/4000</span><button disabled={busy || !prompt.trim()}>{busy ? "Working…" : "Send"}</button></div></form>
    </aside>
  </div>;
}
