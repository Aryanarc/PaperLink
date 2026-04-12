import { useState, useRef } from "react";
import useChatStream from "../features/chat/hooks/useChatStream";

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);

  return (
    <div className="flex-1 flex flex-col relative">
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-muted">
            Ask a question about your papers...
          </p>
        )}

        {messages.map((m, i) => (
          <Message key={i} role={m.role} text={m.text} />
        ))}
      </div>

      {/* Input */}
      <ChatInput setMessages={setMessages} />
    </div>
  );
}

function Message({ role, text }) {
  return (
    <div
      className={`max-w-xl p-3 rounded-xl ${
        role === "user"
          ? "bg-primary ml-auto text-white"
          : "bg-panel text-text"
      }`}
    >
      {text}

      {role === "ai" && text && (
        <button className="block text-xs mt-2 text-muted hover:text-white">
          View Sources
        </button>
      )}
    </div>
  );
}

function ChatInput({ setMessages }) {
  const [input, setInput] = useState("");
  const streamingRef = useRef(false);
  const currentStreamRef = useRef(null); // Track accumulated stream text

  const { sendMessage } = useChatStream();

  const send = () => {
    // Prevent duplicate streams
    if (streamingRef.current) return;
    streamingRef.current = true;

    console.log("Sending:", input);

    if (!input.trim()) {
      streamingRef.current = false;
      return;
    }

    // Add user message and empty AI message
    setMessages((prev) => [
      ...prev,
      { role: "user", text: input },
      { role: "ai", text: "" }
    ]);

    // Initialize stream accumulator
    currentStreamRef.current = "";

    // Start streaming
    sendMessage(
      input,
      (token) => {
        // Accumulate tokens in ref (doesn't cause re-render)
        currentStreamRef.current += token;
        
        // Update state with accumulated text
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
    
          if (last?.role === "ai") {
            // Use the accumulated text from ref
            last.text = currentStreamRef.current;
          }
    
          return updated; // Return new array to trigger re-render
        });
      },
      () => {
        streamingRef.current = false;
        currentStreamRef.current = null; // Clear accumulator
      }
    );

    setInput("");
  };

  return (
    <div className="p-4 border-t border-border flex gap-2">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            send();
          }
        }}
        className="flex-1 bg-panel p-2 rounded text-text"
        placeholder="Ask something..."
      />

      <button
        onClick={send}
        className="bg-primary px-4 rounded text-white hover:opacity-90"
      >
        Send
      </button>
    </div>
  );
}