import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { getSyncStorage, setSyncStorage } from "./utils/storage";
import "./index.css";

function Options() {
  const [proxyUrl, setProxyUrl] = useState("http://localhost:8000");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSyncStorage(["proxyUrl"]).then((data) => {
      if (data.proxyUrl) setProxyUrl(data.proxyUrl);
    });
  }, []);

  const handleSave = async () => {
    // Remove trailing slash
    const url = proxyUrl.replace(/\/+$/, "");
    await setSyncStorage({ proxyUrl: url });
    setProxyUrl(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-surface flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-ibm-blue flex items-center justify-center">
            <span className="text-sm font-bold text-white tracking-tighter">wx</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">
              watsonx Chat Settings
            </h1>
            <p className="text-xs text-text-secondary">
              Configure your proxy server connection
            </p>
          </div>
        </div>

        {/* Settings card */}
        <div className="bg-surface-raised border border-white/[0.08] rounded-xl p-5">
          <label className="block text-[13px] font-medium text-text-primary mb-2">
            Proxy Server URL
          </label>
          <input
            type="url"
            value={proxyUrl}
            onChange={(e) => setProxyUrl(e.target.value)}
            placeholder="http://localhost:8000"
            className="w-full bg-surface border border-white/[0.1] rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder-text-secondary outline-none focus:border-accent/50 transition-colors"
          />
          <p className="text-[11px] text-text-secondary mt-2 leading-relaxed">
            The URL of your FastAPI proxy server that connects to watsonx
            Orchestrate. Default: http://localhost:8000
          </p>

          <button
            onClick={handleSave}
            className="mt-4 w-full bg-accent hover:bg-accent-hover text-white text-[13px] font-medium py-2.5 rounded-lg transition-colors"
          >
            {saved ? "✓ Saved" : "Save Settings"}
          </button>
        </div>

        {/* Help */}
        <p className="text-[11px] text-text-secondary mt-4 text-center">
          Make sure your proxy server is running before using the chat.
        </p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);