export default function Header({ onClear, hasMessages }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-surface">
      {/* Logo + Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-ibm-blue flex items-center justify-center">
          <span className="text-[10px] font-bold text-white tracking-tighter">wx</span>
        </div>
        <div>
          <h1 className="text-[13px] font-semibold text-text-primary leading-tight">
            watsonx Orchestrate
          </h1>
          <p className="text-[10.5px] text-text-secondary leading-tight">
            AI Assistant
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {hasMessages && (
          <button
            onClick={onClear}
            className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-white/[0.06] transition-colors"
            title="New conversation"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 2h12M5.5 5.5l5 5M10.5 5.5l-5 5" />
            </svg>
          </button>
        )}
        <a
          href="options.html"
          target="_blank"
          className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-white/[0.06] transition-colors"
          title="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="8" cy="8" r="2.5" />
            <path d="M13 8a5 5 0 01-.5 2.1l1.2 1.2-1.4 1.4-1.2-1.2A5 5 0 018 13a5 5 0 01-2.1-.5l-1.2 1.2-1.4-1.4 1.2-1.2A5 5 0 013 8a5 5 0 01.5-2.1L2.3 4.7l1.4-1.4 1.2 1.2A5 5 0 018 3a5 5 0 012.1.5l1.2-1.2 1.4 1.4-1.2 1.2A5 5 0 0113 8z" />
          </svg>
        </a>
      </div>
    </div>
  );
}