import { useState, useRef, useEffect } from "react";
import useChatStream from "../features/chat/hooks/useChatStream";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col relative bg-gradient-to-b from-bg to-bg/95">
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {messages.length === 0 ? (
            <EmptyState />
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

      {/* Input Area */}
      <div className="border-t border-border/50 bg-bg/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <ChatInput setMessages={setMessages} />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  const suggestions = [
    { icon: "📊", text: "Summarize the key findings from the latest paper" },
    { icon: "🔍", text: "Compare methodologies across uploaded papers" },
    { icon: "💡", text: "What are the main contributions of this research?" },
    { icon: "📝", text: "Explain the experimental setup in simple terms" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-semibold text-text mb-2">
        Start a conversation
      </h2>
      <p className="text-muted text-center mb-8 max-w-md">
        Ask questions about your research papers and get AI-powered insights with citations
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            className="p-4 text-left bg-panel/50 hover:bg-panel border border-border/50 hover:border-primary/50 rounded-xl transition-all duration-200 hover:scale-[1.02] group"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{suggestion.icon}</span>
              <p className="text-sm text-muted group-hover:text-text transition-colors">
                {suggestion.text}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Message({ role, text, sources }) {
  const isUser = role === "user";
  const isStreaming = role === "ai" && text === "";

  return (
    <div className={`flex gap-4 animate-slide-up ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 mt-1">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      )}

      {/* Message Content */}
      <div className={`
        max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4
        ${isUser 
          ? 'bg-gradient-to-br from-primary to-accent text-white' 
          : 'bg-panel/50 border border-border/50 text-text'
        }
      `}>
        {isStreaming ? (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-muted">Thinking...</span>
          </div>
        ) : (
          <>
            <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
              {text}
            </div>

            {/* Sources */}
            {!isUser && text && sources && sources.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/30">
                <button className="flex items-center gap-2 text-xs text-muted hover:text-primary transition-colors group">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="group-hover:underline">View {sources.length} source(s)</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-panel border border-border/50 flex items-center justify-center flex-shrink-0 mt-1">
          <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
    </div>
  );
}

function ChatInput({ setMessages }) {
  const [input, setInput] = useState("");
  const streamingRef = useRef(false);
  const currentStreamRef = useRef(null);
  const textareaRef = useRef(null);

  const { sendMessage } = useChatStream();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const send = () => {
    if (streamingRef.current || !input.trim()) return;
    
    streamingRef.current = true;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: input },
      { role: "ai", text: "", sources: [] }
    ]);

    currentStreamRef.current = "";

    sendMessage(
      input,
      (token) => {
        currentStreamRef.current += token;
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "ai") {
            last.text = currentStreamRef.current;
          }
          return updated;
        });
      },
      () => {
        streamingRef.current = false;
        currentStreamRef.current = null;
      },
      (sources) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "ai") {
            last.sources = sources;
          }
          return updated;
        });
      }
    );

    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="relative">
      <div className="flex items-end gap-3 p-4 bg-panel/50 border border-border/50 rounded-2xl focus-within:border-primary/50 transition-colors">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your papers..."
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-[15px] text-text placeholder-muted max-h-32"
        />
        
        <button
          onClick={send}
          disabled={!input.trim() || streamingRef.current}
          className={`
            p-2.5 rounded-xl transition-all duration-200
            ${input.trim() && !streamingRef.current
              ? 'bg-gradient-to-br from-primary to-accent text-white hover:scale-105 hover:shadow-lg hover:shadow-primary/25'
              : 'bg-panel text-muted cursor-not-allowed'
            }
          `}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      <p className="text-xs text-muted mt-2 text-center">
        Press Enter to send, Shift + Enter for new line
      </p>
    </div>
  );
}