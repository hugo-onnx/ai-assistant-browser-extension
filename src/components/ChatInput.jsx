import { useState, useRef, useEffect } from "react";

export default function ChatInput({ onSend, onStop, isStreaming, disabled }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-white/[0.06] bg-surface p-3">
      <div className="flex items-end gap-2 bg-surface-raised rounded-xl border border-white/[0.08] px-3 py-2 focus-within:border-accent/40 transition-colors">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a message…"
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-text-primary placeholder-text-secondary text-[13.5px] leading-relaxed resize-none outline-none max-h-[120px] py-0.5"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || (!isStreaming && !text.trim())}
          className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            isStreaming
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              : text.trim()
              ? "bg-accent text-white hover:bg-accent-hover"
              : "bg-white/[0.06] text-text-secondary"
          } disabled:opacity-30 disabled:cursor-not-allowed`}
          title={isStreaming ? "Stop generating" : "Send message"}
        >
          {isStreaming ? (
            // Stop icon
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="2" y="2" width="10" height="10" rx="1.5" />
            </svg>
          ) : (
            // Send arrow icon
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 12V4M8 4L4 8M8 4l4 4" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}