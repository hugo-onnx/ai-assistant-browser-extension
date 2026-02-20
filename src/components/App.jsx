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

  // Load saved state on mount
  useEffect(() => {
    loadState();
  }, [loadState]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-surface">
      <Header onClear={clearChat} hasMessages={messages.length > 0} />

      {messages.length === 0 ? (
        <WelcomeScreen onSuggestionClick={sendMessage} />
      ) : (
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {error && (
            <div className="mx-2 mb-3 text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
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