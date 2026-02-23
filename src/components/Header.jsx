/* Carbon icon: 16px SVGs matching @carbon/icons */
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

export default function Header({ onClear, hasMessages }) {
  return (
    <header
      className="flex items-center justify-between h-12 px-4 bg-background border-b border-border-subtle-00"
      style={{ minHeight: "48px" }} /* Carbon header height */
    >
      {/* Product name (Carbon UI Shell pattern) */}
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "#0f62fe" }}>
          <span className="text-[9px] font-bold text-white leading-none">wx</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold text-text-primary leading-none">
            watsonx Orchestrate
          </span>
        </div>
      </div>

      {/* Header actions — Carbon icon buttons (ghost variant) */}
      <div className="flex items-center">
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