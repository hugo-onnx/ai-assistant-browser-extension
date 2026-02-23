import type { ConnectionStatus } from "../types";

const IconAdd = () => (
  <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
    <path d="M17 15V8h-2v7H8v2h7v7h2v-7h7v-2z" />
  </svg>
);
const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
    <path d="M27 16.76v-1.53l1.92-1.68A2 2 0 0029.3 11l-2.36-4a2 2 0 00-1.73-1 2 2 0 00-.64.1l-2.43.82a11.35 11.35 0 00-1.31-.75l-.51-2.52a2 2 0 00-2-1.61h-4.68a2 2 0 00-2 1.61l-.51 2.52a11.48 11.48 0 00-1.32.75L7.43 6.09A2 2 0 006.79 6a2 2 0 00-1.73 1L2.7 11a2 2 0 00.38 2.55l1.92 1.68v1.53l-1.92 1.68A2 2 0 002.7 21l2.36 4a2 2 0 001.73 1 2 2 0 00.64-.1l2.43-.82a11.35 11.35 0 001.31.75l.51 2.52a2 2 0 002 1.61h4.68a2 2 0 002-1.61l.51-2.52a11.48 11.48 0 001.32-.75l2.42.82a2 2 0 00.64.1 2 2 0 001.73-1l2.28-4a2 2 0 00-.38-2.55zM16 22a6 6 0 116-6 5.94 5.94 0 01-6 6z" />
  </svg>
);
const IconTheme = () => (
  <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
    <path d="M16 12.005a4 4 0 11-4 4 4.005 4.005 0 014-4m0-2a6 6 0 106 6 6 6 0 00-6-6zM5.394 6.813L6.81 5.399l3.505 3.506L8.9 10.319zM2 15.005h5v2H2zM5.394 25.197l3.504-3.505 1.414 1.414-3.504 3.506zM15 25.005h2v5h-2zM21.687 23.106l1.414-1.414 3.506 3.504-1.414 1.414zM25 15.005h5v2h-5zM21.693 8.904l3.506-3.504 1.414 1.414-3.506 3.505zM15 2.005h2v5h-2z" />
  </svg>
);

const STATUS_CONFIG: Record<ConnectionStatus, { color: string; label: string }> = {
  connected: { color: "var(--color-support-success)", label: "Connected to proxy" },
  disconnected: { color: "var(--color-support-error)", label: "Proxy unavailable" },
  checking: { color: "var(--color-text-placeholder)", label: "Checking connection…" },
};

interface HeaderProps {
  onClear: () => void;
  hasMessages: boolean;
  connectionStatus: ConnectionStatus;
  isDark: boolean;
  onToggleTheme: () => void;
}

export default function Header({ onClear, hasMessages, connectionStatus, isDark, onToggleTheme }: HeaderProps) {
  const cfg = STATUS_CONFIG[connectionStatus];

  return (
    <header
      className="flex items-center justify-between h-12 px-4 bg-background border-b border-border-subtle-00"
      style={{ minHeight: "48px" }}
    >
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "var(--color-button-primary)" }}>
          <span className="text-[9px] font-bold text-white leading-none">wx</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary leading-none">
            watsonx Orchestrate
          </span>
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: cfg.color }}
            title={cfg.label}
          />
        </div>
      </div>

      <div className="flex items-center">
        <button
          onClick={onToggleTheme}
          className="w-8 h-8 flex items-center justify-center text-text-secondary hover:bg-background-hover active:bg-background-active transition-colors"
          title={isDark ? "Switch to light theme" : "Switch to dark theme"}
        >
          <IconTheme />
        </button>
        {hasMessages && (
          <button
            onClick={onClear}
            className="w-8 h-8 flex items-center justify-center text-text-secondary hover:bg-background-hover active:bg-background-active transition-colors"
            title="New conversation"
          >
            <IconAdd />
          </button>
        )}
        <a
          href="options.html"
          target="_blank"
          className="w-8 h-8 flex items-center justify-center text-text-secondary hover:bg-background-hover active:bg-background-active transition-colors"
          title="Settings"
        >
          <IconSettings />
        </a>
      </div>
    </header>
  );
}