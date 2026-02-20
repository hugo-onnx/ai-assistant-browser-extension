import { useMemo } from "react";
import { renderMarkdown } from "../utils/markdown";

function UserMessage({ content }) {
  return (
    <div className="flex justify-end mb-3">
      <div className="max-w-[85%] bg-ibm-blue text-white rounded-2xl rounded-br-md px-4 py-2.5 text-[13.5px] leading-relaxed">
        {content}
      </div>
    </div>
  );
}

function AssistantMessage({ content, isStreaming, isError, statusText }) {
  const html = useMemo(() => renderMarkdown(content), [content]);

  return (
    <div className="flex justify-start mb-3">
      <div className="flex gap-2.5 max-w-[92%]">
        {/* Avatar */}
        <div className="shrink-0 w-6 h-6 rounded-full bg-ibm-blue-dark flex items-center justify-center mt-0.5">
          <span className="text-[10px] font-semibold text-white tracking-tight">wx</span>
        </div>
        {/* Bubble */}
        <div
          className={`bg-surface-raised rounded-2xl rounded-tl-md px-4 py-2.5 border border-white/[0.06] ${
            isError ? "border-red-500/30" : ""
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
            <div className="flex gap-1 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : null}
          {/* Status text for flow processing */}
          {statusText && isStreaming && (
            <div className="mt-2 pt-2 border-t border-white/[0.06] text-[11.5px] text-text-secondary flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              {statusText}
            </div>
          )}
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