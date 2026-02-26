const SUGGESTIONS = [
  "What can you help me with?",
  "Help me write or improve code",
  "Explain a concept or summarize text",
];

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

export default function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      {/* BAAI-style glowing avatar */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-6 baai-avatar-pulse"
        style={{ background: "var(--baai-gradient-accent)" }}
      >
        <span className="text-xl font-bold text-white tracking-tight">AI</span>
      </div>

      {/* BAAI section-title style with decorative lines */}
      <div className="baai-section-title mb-1 w-full max-w-[280px]">
        <h2 className="text-base font-semibold text-text-primary whitespace-nowrap">
          AI Assistant
        </h2>
      </div>

      <p className="text-sm text-text-secondary text-center mb-8 max-w-[240px] leading-relaxed">
        How can I help you today?
      </p>

      {/* BAAI glassmorphism suggestion cards */}
      <div className="flex flex-col gap-2 w-full max-w-[280px]">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            className="text-left text-sm text-text-secondary px-4 py-3 bg-layer-01 rounded-xl border border-border-subtle-01 baai-card-hover hover:text-text-primary active:bg-layer-active-01 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
