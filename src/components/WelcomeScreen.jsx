const SUGGESTIONS = [
  "What can you help me with?",
  "Summarize the latest updates",
  "Search for open tasks",
];

export default function WelcomeScreen({ onSuggestionClick }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      {/* Logo */}
      <div className="w-14 h-14 rounded-2xl bg-ibm-blue/20 flex items-center justify-center mb-5">
        <div className="w-10 h-10 rounded-xl bg-ibm-blue flex items-center justify-center">
          <span className="text-lg font-bold text-white tracking-tighter">wx</span>
        </div>
      </div>

      <h2 className="text-[15px] font-semibold text-text-primary mb-1.5">
        watsonx Orchestrate
      </h2>
      <p className="text-[12.5px] text-text-secondary text-center mb-6 max-w-[220px] leading-relaxed">
        Ask me anything. I can help you with tasks, searches, and more.
      </p>

      {/* Suggestion chips */}
      <div className="flex flex-col gap-2 w-full max-w-[260px]">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            className="text-left text-[12.5px] text-text-secondary px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-surface-raised hover:bg-surface-overlay hover:text-text-primary hover:border-white/[0.12] transition-all"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}