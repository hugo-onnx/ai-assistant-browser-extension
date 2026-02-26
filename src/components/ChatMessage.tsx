import { useMemo, useState, useCallback } from "react";
import { renderMarkdown } from "../utils/markdown";
import type { ChatMessage as ChatMessageType } from "../types";

const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 32 32" fill="currentColor">
    <path d="M28 10v18H10V10h18m0-2H10a2 2 0 00-2 2v18a2 2 0 002 2h18a2 2 0 002-2V10a2 2 0 00-2-2z" />
    <path d="M4 18H2V4a2 2 0 012-2h14v2H4z" />
  </svg>
);
const IconCheckmark = () => (
  <svg width="14" height="14" viewBox="0 0 32 32" fill="currentColor">
    <path d="M13 24l-9-9 1.41-1.41L13 21.17 26.59 7.58 28 9z" />
  </svg>
);
const IconRetry = () => (
  <svg width="14" height="14" viewBox="0 0 32 32" fill="currentColor">
    <path d="M18 28A12 12 0 106 16H2l6 6 6-6h-4a8 8 0 118 8z" />
  </svg>
);

function formatTime(isoString: string): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const sameYear = date.getFullYear() === now.getFullYear();
    if (sameYear) {
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

const AiAvatar = () => (
  <div
    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
    style={{ background: "var(--color-button-primary)" }}
  >
    <span className="text-[10px] font-bold text-white tracking-tight">AI</span>
  </div>
);

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1 px-2 py-1 text-xs transition-colors rounded ${
        copied
          ? "text-support-success"
          : "text-text-helper hover:text-text-primary hover:bg-background-hover"
      }`}
      title={copied ? "Copied!" : "Copy message"}
    >
      {copied ? <IconCheckmark /> : <IconCopy />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1 text-xs text-text-helper hover:text-text-primary hover:bg-background-hover transition-colors rounded"
      title="Regenerate response"
    >
      <IconRetry />
      <span>Retry</span>
    </button>
  );
}

function Timestamp({ iso }: { iso: string }) {
  const text = formatTime(iso);
  if (!text) return null;
  return (
    <span className="text-[11px] text-text-placeholder" title={iso}>
      {text}
    </span>
  );
}

function UserMessage({ content, timestamp }: { content: string; timestamp: string }) {
  return (
    <div className="flex flex-col items-end mb-4">
      <div
        className="max-w-[85%] px-4 py-3 text-sm leading-relaxed text-text-on-color rounded-tl-lg rounded-tr-lg rounded-bl-lg"
        style={{ background: "var(--color-button-primary)" }}
      >
        {content}
      </div>
      <div className="mt-1 pr-1">
        <Timestamp iso={timestamp} />
      </div>
    </div>
  );
}

interface AssistantMessageProps {
  content: string;
  isStreaming?: boolean;
  isError?: boolean;
  statusText?: string;
  timestamp: string;
  isLast: boolean;
  onRetry?: () => void;
}

function AssistantMessage({
  content,
  isStreaming,
  isError,
  statusText,
  timestamp,
  isLast,
  onRetry,
}: AssistantMessageProps) {
  const html = useMemo(() => renderMarkdown(content), [content]);

  return (
    <div className="group flex justify-start mb-4">
      <div className="flex gap-3 max-w-[95%]">
        <AiAvatar />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-text-helper font-medium">AI</span>
            {!isStreaming && <Timestamp iso={timestamp} />}
          </div>
          <div
            className={`bg-layer-01 rounded-lg px-4 py-3 ${
              isError ? "border border-support-error" : ""
            }`}
          >
            {content ? (
              <div
                className={`markdown-content text-text-primary ${
                  isStreaming ? "typing-cursor" : ""
                }`}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : isStreaming ? (
              <div className="flex gap-1.5 py-1">
                <span className="w-2 h-2 rounded-full bg-interactive animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-interactive animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-interactive animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            ) : null}

            {statusText && isStreaming && (
              <div className="mt-3 pt-3 border-t border-border-subtle-00 text-xs text-text-helper flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-interactive animate-pulse" />
                {statusText}
              </div>
            )}
          </div>

          {content && !isStreaming && (
            <div className="mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={content} />
              {isLast && onRetry && <RetryButton onClick={onRetry} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ChatMessageProps {
  message: ChatMessageType;
  isLast: boolean;
  onRetry: () => void;
}

export default function ChatMessage({ message, isLast, onRetry }: ChatMessageProps) {
  if (message.role === "user") {
    return <UserMessage content={message.content} timestamp={message.timestamp} />;
  }
  return (
    <AssistantMessage
      content={message.content}
      isStreaming={message.isStreaming}
      isError={message.isError}
      statusText={message.statusText}
      timestamp={message.timestamp}
      isLast={isLast}
      onRetry={onRetry}
    />
  );
}