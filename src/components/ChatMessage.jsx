import { useMemo } from "react";
import { renderMarkdown } from "../utils/markdown";

/* Carbon icon: Watson/AI avatar */
const AiAvatar = () => (
  <div
    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
    style={{ background: "var(--color-button-primary)" }}
  >
    <span className="text-[10px] font-bold text-white tracking-tight">wx</span>
  </div>
);

function UserMessage({ content }) {
  return (
    <div className="flex justify-end mb-4">
      <div
        className="max-w-[85%] px-4 py-3 text-sm leading-relaxed text-text-on-color rounded-tl-lg rounded-tr-lg rounded-bl-lg"
        style={{ background: "var(--color-button-primary)" }}
      >
        {content}
      </div>
    </div>
  );
}

function AssistantMessage({ content, isStreaming, isError, statusText }) {
  const html = useMemo(() => renderMarkdown(content), [content]);

  return (
    <div className="flex justify-start mb-4">
      <div className="flex gap-3 max-w-[95%]">
        <AiAvatar />
        <div className="flex-1 min-w-0">
          {/* Carbon AI label */}
          <span className="text-xs text-text-helper mb-1 block font-medium">
            AI
          </span>
          {/* Content tile */}
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

            {/* Flow processing status — Carbon inline notification style */}
            {statusText && isStreaming && (
              <div className="mt-3 pt-3 border-t border-border-subtle-00 text-xs text-text-helper flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-interactive animate-pulse" />
                {statusText}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatMessage({ message }) {
  if (message.role === "user") {
    return <UserMessage content={message.content} />;
  }
  return (
    <AssistantMessage
      content={message.content}
      isStreaming={message.isStreaming}
      isError={message.isError}
      statusText={message.statusText}
    />
  );
}