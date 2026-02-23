import { useEffect, useRef } from "react";
import { useChat } from "../hooks/useChat";
import Header from "./Header";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import WelcomeScreen from "./WelcomeScreen";

export default function App() {
  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearChat,
    loadState,
  } = useChat();

  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-background">
      <Header onClear={clearChat} hasMessages={messages.length > 0} />

      {messages.length === 0 ? (
        <WelcomeScreen onSuggestionClick={sendMessage} />
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {/* Error notification — Carbon inline notification (error) */}
          {error && (
            <div className="mb-4 px-4 py-3 text-sm bg-layer-01 border-l-[3px] border-support-error text-text-error flex items-start gap-2">
              <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor" className="shrink-0 mt-0.5">
                <path d="M16 2a14 14 0 1014 14A14 14 0 0016 2zm0 26a12 12 0 1112-12 12 12 0 01-12 12z" />
                <path d="M15 8h2v11h-2zM16 22a1.5 1.5 0 101.5 1.5A1.5 1.5 0 0016 22z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      <ChatInput
        onSend={sendMessage}
        onStop={stopStreaming}
        isStreaming={isStreaming}
      />
    </div>
  );
}