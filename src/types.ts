export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  isError?: boolean;
  statusText?: string;
}

export interface SSEEvent {
  event: "start" | "delta" | "status" | "flow_status" | "new_message" | "done" | "error";
  text?: string;
  message?: string;
  thread_id?: string;
  run_id?: string;
  full_text?: string;
}

export type ConnectionStatus = "connected" | "disconnected" | "checking";

export type Theme = "g100" | "g10";

export interface StorageData {
  messages?: ChatMessage[];
  threadId?: string | null;
  theme?: Theme;
  [key: string]: unknown;
}