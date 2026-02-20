import { useState, useCallback, useRef } from "react";
import { getStorage, setStorage, getSyncStorage } from "../utils/storage";

const DEFAULT_PROXY_URL = "http://localhost:8000";

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const loadState = useCallback(async () => {
    const local = await getStorage(["messages", "threadId"]);
    if (local.messages) setMessages(local.messages);
    if (local.threadId) setThreadId(local.threadId);
  }, []);

  const saveState = useCallback(async (msgs, tid) => {
    await setStorage({ messages: msgs, threadId: tid });
  }, []);

  const getProxyUrl = useCallback(async () => {
    const sync = await getSyncStorage(["proxyUrl"]);
    return sync.proxyUrl || DEFAULT_PROXY_URL;
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || isStreaming) return;

      setError(null);

      const userMessage = {
        id: Date.now().toString(),
        role: "user",
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        isStreaming: true,
      };

      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);
      setIsStreaming(true);

      const proxyUrl = await getProxyUrl();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(`${proxyUrl}/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            thread_id: threadId,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Proxy error: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let newThreadId = threadId;
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE lines
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const dataStr = trimmed.slice(5).trim();
            if (!dataStr) continue;

            try {
              const event = JSON.parse(dataStr);

              if (event.event === "delta" && event.text) {
                fullText += event.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === "assistant") {
                    updated[updated.length - 1] = {
                      ...last,
                      content: fullText,
                    };
                  }
                  return updated;
                });
              } else if (event.event === "new_message") {
                // Multi-step flow: finalize current bubble, start a new one
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === "assistant") {
                    updated[updated.length - 1] = {
                      ...last,
                      isStreaming: false,
                    };
                  }
                  updated.push({
                    id: Date.now().toString(),
                    role: "assistant",
                    content: "",
                    timestamp: new Date().toISOString(),
                    isStreaming: true,
                  });
                  return updated;
                });
                fullText = "";
              } else if (
                event.event === "status" ||
                event.event === "flow_status"
              ) {
                // Show agent processing status in the current bubble
                const statusText = event.message || "";
                if (statusText) {
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.role === "assistant") {
                      updated[updated.length - 1] = {
                        ...last,
                        statusText,
                      };
                    }
                    return updated;
                  });
                }
              } else if (event.event === "start" && event.thread_id) {
                newThreadId = event.thread_id;
              } else if (event.event === "done") {
                if (event.thread_id) newThreadId = event.thread_id;
              } else if (event.event === "error") {
                throw new Error(event.message || "Stream error");
              }
            } catch (parseErr) {
              if (parseErr.message !== "Stream error" && !parseErr.message?.startsWith("Proxy")) {
                // JSON parse error, skip this line
                continue;
              }
              throw parseErr;
            }
          }
        }

        // Finalize
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              isStreaming: false,
            };
          }
          saveState(updated, newThreadId);
          return updated;
        });

        if (newThreadId) setThreadId(newThreadId);
      } catch (err) {
        if (err.name === "AbortError") return;

        setError(err.message);
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              content: last.content || "Sorry, something went wrong.",
              isStreaming: false,
              isError: true,
            };
          }
          return updated;
        });
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, threadId, isStreaming, getProxyUrl, saveState]
  );

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  const clearChat = useCallback(async () => {
    setMessages([]);
    setThreadId(null);
    setError(null);
    await setStorage({ messages: [], threadId: null });
  }, []);

  return {
    messages,
    isStreaming,
    threadId,
    error,
    sendMessage,
    stopStreaming,
    clearChat,
    loadState,
  };
}