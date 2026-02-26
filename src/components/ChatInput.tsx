import { useState, useRef, useEffect, type KeyboardEvent } from "react";

const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
    <path d="M27.45 15.11l-22-11a1 1 0 00-1.08.12 1 1 0 00-.33 1L7 16 4 26.74A1 1 0 005 28a1 1 0 00.45-.11l22-11a1 1 0 000-1.78zM6.82 25.36L9 17h8v-2H9L6.82 6.64 24.32 16z" />
  </svg>
);
const IconStop = () => (
  <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
    <path d="M16 2a14 14 0 1014 14A14 14 0 0016 2zm0 26a12 12 0 1112-12 12 12 0 01-12 12z" />
    <path d="M11 11h10v10H11z" />
  </svg>
);

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export default function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [text]);

  const handleSubmit = () => {
    if (isStreaming) {
      onStop();
      return;
    }
    if (!text.trim()) return;
    onSend(text);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasText = text.trim().length > 0;

  return (
    <div
      className="bg-background px-3 py-3"
      style={{ borderTop: "1px solid rgba(74, 143, 255, 0.12)" }}
    >
      <div className="baai-input-wrapper flex items-end gap-0 bg-layer-01">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-text-primary placeholder-text-placeholder text-[16px] leading-relaxed resize-none outline-none px-4 py-2.5 max-h-[120px] focus:outline-none"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || (!isStreaming && !hasText)}
          className={`shrink-0 w-10 h-10 m-1 flex items-center justify-center rounded-xl transition-all ${
            isStreaming
              ? "text-text-on-color hover:opacity-90"
              : hasText
              ? "text-text-on-color hover:opacity-90 active:opacity-75"
              : "cursor-not-allowed"
          }`}
          style={
            isStreaming
              ? { background: "var(--color-button-danger)" }
              : hasText
              ? { background: "var(--baai-gradient-logo)", boxShadow: "var(--baai-glow-sm)" }
              : { background: "transparent", color: "var(--color-border-strong-01)", opacity: 0.6 }
          }
          title={isStreaming ? "Stop" : "Send"}
        >
          {isStreaming ? <IconStop /> : <IconSend />}
        </button>
      </div>
    </div>
  );
}