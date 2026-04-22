import { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function useChatStream() {
  const [streaming, setStreaming] = useState(false);

  const sendMessage = async (query, onToken, onDone, onSources, onMetrics) => {
    setStreaming(true);
    console.log("Starting stream for query:", query);

    try {
      const response = await fetch(`${API_BASE_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log("Stream completed");
          setStreaming(false);
          onDone && onDone();
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Split on double-newline (SSE event boundary)
        const eventBlocks = buffer.split(/\n\n/);
        // Keep the last (possibly incomplete) block in the buffer
        buffer = eventBlocks.pop() || "";

        for (const block of eventBlocks) {
          if (!block.trim()) continue;

          let eventName = null;
          let dataStr = null;

          for (const line of block.split("\n")) {
            if (line.startsWith("event: ")) {
              eventName = line.substring(7).trim();
            } else if (line.startsWith("data: ")) {
              dataStr = line.substring(6).trim();
            }
          }

          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);

            if (eventName === "sources" && Array.isArray(data)) {
              onSources && onSources(data);
            } else if (eventName === "stream" && data.token !== undefined) {
              onToken(data.token);
            } else if (eventName === "metrics") {
              onMetrics && onMetrics(data);
            } else if (eventName === "end") {
              // stream finished normally — handled by reader.done
            } else if (eventName === "error") {
              console.error("Stream error:", data);
              setStreaming(false);
              onDone && onDone(data.error || "Unknown server error");
              return;
            }
          } catch (e) {
            console.warn("Failed to parse SSE data:", dataStr, e);
          }
        }
      }
    } catch (error) {
      console.error("Stream error:", error);
      setStreaming(false);
      onDone && onDone(error.message || "Connection failed");
    }
  };

  return { sendMessage, streaming };
}