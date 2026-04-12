import { useState } from "react";

export default function useChatStream() {
  const [streaming, setStreaming] = useState(false);

  const sendMessage = (query, onToken, onDone) => {
    setStreaming(true);

    const evtSource = new EventSource(
      `http://127.0.0.1:8000/api/stream?q=${encodeURIComponent(query)}`
    );

    console.log("EventSource created");

    evtSource.onmessage = (event) => {
      if (event.data === "[DONE]") {
        evtSource.close();
        setStreaming(false);
        onDone && onDone();
      } else {
        onToken(event.data);
      }
    };

    evtSource.onerror = (err) => {
      console.error("SSE ERROR:", err);
      evtSource.close();
      setStreaming(false);
    };
  };

  return { sendMessage, streaming };
}