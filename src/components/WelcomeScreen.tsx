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
      {/* Glowing avatar */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-6 avatar-pulse"
        style={{ background: "var(--gradient-accent)" }}
      >
        <span className="text-xl font-bold text-white tracking-tight">AI</span>
      </div>

      {/* Section title with decorative lines */}
      <div className="section-title mb-1 w-full max-w-[280px]">
        <h2 className="text-base font-semibold text-text-primary whitespace-nowrap">
          AI Assistant
        </h2>
      </div>

      <p className="text-sm text-text-secondary text-center mb-8 max-w-[240px] leading-relaxed">
        How can I help you today?
      </p>

      {/* Suggestion cards */}
      <div className="flex flex-col gap-2 w-full max-w-[280px]">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            className="text-left text-sm text-text-secondary px-4 py-3 bg-layer-01 rounded-xl border border-border-subtle-01 card-hover hover:text-text-primary active:bg-layer-active-01 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
