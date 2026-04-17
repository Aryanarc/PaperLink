import { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function useChatStream() {
  const [streaming, setStreaming] = useState(false);

  const sendMessage = async (query, onToken, onDone, onSources) => {
    setStreaming(true);

    try {
      const response = await fetch(`${API_BASE_URL}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          setStreaming(false);
          onDone && onDone();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          
          if (line.startsWith("event: ")) {
            const event = line.substring(7).trim();
            
            // Handle the next line which should be the data
            continue;
          }
          
          if (line.startsWith("data: ")) {
            const dataStr = line.substring(6).trim();
            
            try {
              const data = JSON.parse(dataStr);
              
              // Check if this is sources data (array of objects with page_content)
              if (Array.isArray(data)) {
                onSources && onSources(data);
              } 
              // Check if this is a token stream
              else if (data.token !== undefined) {
                onToken(data.token);
              }
            } catch (e) {
              // If not JSON, it might be a simple string token
              console.log("Non-JSON data:", dataStr);
            }
          }
        }
      }
    } catch (error) {
      console.error("Stream error:", error);
      setStreaming(false);
      onDone && onDone();
    }
  };

  return { sendMessage, streaming };
}