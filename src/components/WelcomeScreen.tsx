const SUGGESTIONS = [
  "What can you help me with?",
  "Summarize the latest updates",
  "Search for open tasks",
];

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

export default function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{ background: "var(--color-button-primary)" }}
      >
        <span className="text-xl font-bold text-white tracking-tight">wx</span>
      </div>

      <h2 className="text-base font-semibold text-text-primary mb-1">
        watsonx Orchestrate
      </h2>
      <p className="text-sm text-text-secondary text-center mb-8 max-w-[240px] leading-relaxed">
        How can I help you today?
      </p>

      <div className="flex flex-col gap-1 w-full max-w-[280px]">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            className="text-left text-sm text-text-secondary px-4 py-3 bg-layer-01 border-b border-border-subtle-00 hover:bg-layer-hover-01 active:bg-layer-active-01 hover:text-text-primary transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}