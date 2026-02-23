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
    <div className="border-t border-border-subtle-00 bg-background p-4">
      <div className="flex items-end gap-0">
        <div className="flex-1 bg-layer-01 border-b-2 border-border-strong-01 has-[:focus]:border-interactive has-[:focus]:outline has-[:focus]:outline-2 has-[:focus]:outline-focus has-[:focus]:-outline-offset-2 transition-colors h-[42px] flex items-center">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent text-text-primary placeholder-text-placeholder text-[15px] leading-relaxed resize-none outline-none px-4 max-h-[120px] focus:outline-none"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={disabled || (!isStreaming && !hasText)}
          className={`shrink-0 w-[42px] h-[42px] flex items-center justify-center transition-colors ${
            isStreaming
              ? "bg-button-danger text-text-on-color hover:opacity-90"
              : hasText
              ? "bg-button-primary text-text-on-color hover:bg-button-primary-hover active:bg-button-primary-active"
              : "bg-layer-01 text-text-disabled cursor-not-allowed"
          }`}
          title={isStreaming ? "Stop" : "Send"}
        >
          {isStreaming ? <IconStop /> : <IconSend />}
        </button>
      </div>
    </div>
  );
}