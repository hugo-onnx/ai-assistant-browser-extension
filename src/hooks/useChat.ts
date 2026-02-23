import { useState, useCallback, useRef } from "react";
import { getStorage, setStorage, getSyncStorage } from "../utils/storage";
import type { ChatMessage, SSEEvent } from "../types";

const DEFAULT_PROXY_URL = "http://localhost:8000";

interface UseChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  threadId: string | null;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  stopStreaming: () => void;
  clearChat: () => Promise<void>;
  retryLast: () => Promise<void>;
  loadState: () => Promise<void>;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadState = useCallback(async () => {
    const local = await getStorage(["messages", "threadId"]);
    if (local.messages) setMessages(local.messages as ChatMessage[]);
    if (local.threadId) setThreadId(local.threadId as string);
  }, []);

  const saveState = useCallback(async (msgs: ChatMessage[], tid: string | null) => {
    await setStorage({ messages: msgs, threadId: tid });
  }, []);

  const getProxyUrl = useCallback(async (): Promise<string> => {
    const sync = await getSyncStorage(["proxyUrl"]);
    return (sync.proxyUrl as string) || DEFAULT_PROXY_URL;
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      setError(null);

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };

      const assistantMessage: ChatMessage = {
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

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let newThreadId = threadId;
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const dataStr = trimmed.slice(5).trim();
            if (!dataStr) continue;

            try {
              const event: SSEEvent = JSON.parse(dataStr);

              if (event.event === "delta" && event.text) {
                fullText += event.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === "assistant") {
                    updated[updated.length - 1] = { ...last, content: fullText };
                  }
                  return updated;
                });
              } else if (event.event === "new_message") {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === "assistant") {
                    updated[updated.length - 1] = { ...last, isStreaming: false };
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
              } else if (event.event === "status" || event.event === "flow_status") {
                const statusText = event.message || "";
                if (statusText) {
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.role === "assistant") {
                      updated[updated.length - 1] = { ...last, statusText };
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
              const msg = (parseErr as Error).message;
              if (msg !== "Stream error" && !msg?.startsWith("Proxy")) {
                continue;
              }
              throw parseErr;
            }
          }
        }

        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === "assistant") {
            updated[updated.length - 1] = { ...last, isStreaming: false };
          }
          saveState(updated, newThreadId);
          return updated;
        });

        if (newThreadId) setThreadId(newThreadId);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;

        setError((err as Error).message);
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
      abortRef.current = null;
      setIsStreaming(false);

      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant") {
          if (last.content) {
            updated[updated.length - 1] = { ...last, isStreaming: false, statusText: undefined };
          } else {
            updated.pop();
          }
        }
        saveState(updated, threadId);
        return updated;
      });
    }
  }, [saveState, threadId]);

  const clearChat = useCallback(async () => {
    setMessages([]);
    setThreadId(null);
    setError(null);
    await setStorage({ messages: [], threadId: null });
  }, []);

  const retryLast = useCallback(async () => {
    if (isStreaming) return;

    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserIndex = i;
        break;
      }
    }
    if (lastUserIndex === -1) return;

    const lastUserText = messages[lastUserIndex].content;
    const trimmed = messages.slice(0, lastUserIndex);
    setMessages(trimmed);
    setError(null);
    await saveState(trimmed, threadId);

    setTimeout(() => sendMessage(lastUserText), 50);
  }, [messages, threadId, isStreaming, saveState, sendMessage]);

  return {
    messages,
    isStreaming,
    threadId,
    error,
    sendMessage,
    stopStreaming,
    clearChat,
    retryLast,
    loadState,
  };
}