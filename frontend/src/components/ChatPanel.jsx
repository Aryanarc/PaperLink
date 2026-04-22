import { useState, useRef, useEffect } from "react";
import useChatStream from "../features/chat/hooks/useChatStream";

export default function ChatPanel({ onMetrics }) {
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col relative bg-gradient-to-b from-bg to-bg/95">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {messages.length === 0 ? (
            <EmptyState setMessages={setMessages} onMetrics={onMetrics} />
          ) : (
            <div className="space-y-6">
              {messages.map((m, i) => (
                <Message key={i} role={m.role} text={m.text} sources={m.sources} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border/50 bg-bg/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <ChatInput setMessages={setMessages} onMetrics={onMetrics} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CRITICAL HELPER: always returns a brand-new array AND a brand-new last object.
// Direct mutation (last.text = x) on a shallow-copied array does NOT trigger
// React re-renders because the object reference is unchanged.
// ─────────────────────────────────────────────────────────────────────────────
function updateLastMessage(prev, patch) {
  if (prev.length === 0) return prev;
  const updated = prev.slice();
  updated[updated.length - 1] = { ...updated[updated.length - 1], ...patch };
  return updated;
}

/** Builds the four SSE callbacks, sharing an accumulated-text ref. */
function buildStreamCallbacks(setMessages, onMetrics) {
  let accumulated = "";

  const onToken = (token) => {
    accumulated += token;
    setMessages((prev) => updateLastMessage(prev, { text: accumulated }));
  };

  const onDone = (errorMsg) => {
    if (errorMsg) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "ai" && !last.text) {
          return updateLastMessage(prev, {
            text: `⚠️ Error: ${errorMsg}. Check your backend is running.`,
            isError: true,
          });
        }
        return prev;
      });
    }
    accumulated = "";
  };

  const onSources = (sources) => {
    setMessages((prev) => updateLastMessage(prev, { sources }));
  };

  const onMetricsCb = (metrics) => {
    onMetrics && onMetrics(metrics);
  };

  return { onToken, onDone, onSources, onMetrics: onMetricsCb };
}

// ── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState({ setMessages, onMetrics }) {
  const { sendMessage, streaming } = useChatStream();

  const suggestions = [
    { icon: "📊", text: "Summarize the key findings from the latest paper" },
    { icon: "🔍", text: "Compare methodologies across uploaded papers" },
    { icon: "💡", text: "What are the main contributions of this research?" },
    { icon: "📝", text: "Explain the experimental setup in simple terms" },
  ];

  const handleSuggestion = (text) => {
    if (streaming) return;
    setMessages([
      { role: "user", text },
      { role: "ai", text: "", sources: [] },
    ]);
    const cbs = buildStreamCallbacks(setMessages, onMetrics);
    sendMessage(text, cbs.onToken, cbs.onDone, cbs.onSources, cbs.onMetrics);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-text mb-2">Start a conversation</h2>
      <p className="text-muted text-center mb-8 max-w-md">
        Upload a PDF or paste an arXiv URL in the sidebar, then ask questions about your papers
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => handleSuggestion(suggestion.text)}
            disabled={streaming}
            className="p-4 text-left bg-panel/50 hover:bg-panel border border-border/50 hover:border-primary/50 rounded-xl transition-all duration-200 hover:scale-[1.02] group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{suggestion.icon}</span>
              <p className="text-sm text-muted group-hover:text-text transition-colors">{suggestion.text}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── SourcesModal ──────────────────────────────────────────────────────────────

function SourcesModal({ sources, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-panel border border-border/50 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text">Sources ({sources.length})</h3>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-3">
          {sources.map((src, i) => (
            <div key={i} className="p-4 bg-bg/50 border border-border/30 rounded-xl">
              {src.metadata && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-primary">
                    {src.metadata.source || src.metadata.filename || "Source " + (i + 1)}
                  </span>
                  {src.metadata.page && (
                    <span className="text-xs text-muted">• Page {src.metadata.page}</span>
                  )}
                </div>
              )}
              <p className="text-xs text-muted leading-relaxed line-clamp-6">{src.page_content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Message ───────────────────────────────────────────────────────────────────

function Message({ role, text, sources }) {
  const [showSources, setShowSources] = useState(false);
  const isUser = role === "user";
  const isStreaming = role === "ai" && text === "";

  return (
    <>
      <div className={`flex gap-4 animate-slide-up ${isUser ? "justify-end" : "justify-start"}`}>
        {!isUser && (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 mt-1">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        )}

        <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 ${
          isUser
            ? "bg-gradient-to-br from-primary to-accent text-white"
            : "bg-panel/50 border border-border/50 text-text"
        }`}>
          {isStreaming ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 150, 300].map((delay) => (
                  <div key={delay} className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
              <span className="text-sm text-muted">Thinking...</span>
            </div>
          ) : (
            <>
              <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{text}</div>
              {!isUser && text && sources && sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/30">
                  <button
                    onClick={() => setShowSources(true)}
                    className="flex items-center gap-2 text-xs text-muted hover:text-primary transition-colors group"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="group-hover:underline">
                      View {sources.length} source{sources.length > 1 ? "s" : ""}
                    </span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {isUser && (
          <div className="w-8 h-8 rounded-xl bg-panel border border-border/50 flex items-center justify-center flex-shrink-0 mt-1">
            <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </div>

      {showSources && sources && (
        <SourcesModal sources={sources} onClose={() => setShowSources(false)} />
      )}
    </>
  );
}

// ── ChatInput ─────────────────────────────────────────────────────────────────

function ChatInput({ setMessages, onMetrics }) {
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);
  const { sendMessage, streaming } = useChatStream();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  const send = () => {
    if (streaming || !input.trim()) return;

    const question = input.trim();
    setInput("");

    setMessages((prev) => [
      ...prev,
      { role: "user", text: question },
      { role: "ai", text: "", sources: [] },
    ]);

    const cbs = buildStreamCallbacks(setMessages, onMetrics);
    sendMessage(question, cbs.onToken, cbs.onDone, cbs.onSources, cbs.onMetrics);
  };

  return (
    <div className="relative">
      <div className="flex items-end gap-3 p-4 bg-panel/50 border border-border/50 rounded-2xl focus-within:border-primary/50 transition-colors">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask anything about your papers..."
          rows={1}
          disabled={streaming}
          className="flex-1 bg-transparent resize-none outline-none text-[15px] text-text placeholder-muted max-h-32 disabled:opacity-60"
        />
        <button
          onClick={send}
          disabled={!input.trim() || streaming}
          className={`p-2.5 rounded-xl transition-all duration-200 ${
            input.trim() && !streaming
              ? "bg-gradient-to-br from-primary to-accent text-white hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
              : "bg-panel text-muted cursor-not-allowed"
          }`}
        >
          {streaming ? (
            <div className="w-5 h-5 border-2 border-muted border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
      <p className="text-xs text-muted mt-2 text-center">
        {streaming ? "Generating response..." : "Press Enter to send, Shift + Enter for new line"}
      </p>
    </div>
  );
}