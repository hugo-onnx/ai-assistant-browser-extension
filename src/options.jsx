import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { getStorage, getSyncStorage, setSyncStorage } from "./utils/storage";
import "./index.css";

function Options() {
  const [proxyUrl, setProxyUrl] = useState("http://localhost:8000");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load theme preference
    getStorage(["theme"]).then((data) => {
      if (data.theme) {
        document.documentElement.setAttribute("data-theme", data.theme);
      }
    });
    getSyncStorage(["proxyUrl"]).then((data) => {
      if (data.proxyUrl) setProxyUrl(data.proxyUrl);
    });
  }, []);

  const handleSave = async () => {
    const url = proxyUrl.replace(/\/+$/, "");
    await setSyncStorage({ proxyUrl: url });
    setProxyUrl(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "var(--color-button-primary)" }}
          >
            <span className="text-sm font-bold text-white tracking-tight">wx</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">
              Settings
            </h1>
            <p className="text-sm text-text-secondary">
              Configure your proxy server connection
            </p>
          </div>
        </div>

        {/* Carbon form group */}
        <div className="bg-layer-01 p-8">
          {/* Carbon text-input */}
          <div className="mb-8">
            <label className="block text-sm font-normal text-text-secondary mb-2">
              Proxy Server URL
            </label>
            <input
              type="url"
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="w-full bg-layer-01 text-text-primary placeholder-text-placeholder text-base outline-none px-4 h-12 border-b-2 border-border-strong-01 focus:border-interactive transition-colors"
            />
            <p className="text-sm text-text-helper mt-3 leading-relaxed">
              The URL of your FastAPI proxy server that connects to watsonx
              Orchestrate.
            </p>
          </div>

          {/* Carbon primary button */}
          <button
            onClick={handleSave}
            className="w-full h-14 flex items-center justify-between px-5 text-base font-normal text-text-on-color transition-colors"
            style={{
              background: saved
                ? "var(--color-support-success)"
                : "var(--color-button-primary)",
            }}
            onMouseEnter={(e) =>
              !saved &&
              (e.currentTarget.style.background =
                "var(--color-button-primary-hover)")
            }
            onMouseLeave={(e) =>
              !saved &&
              (e.currentTarget.style.background =
                "var(--color-button-primary)")
            }
          >
            <span>{saved ? "Settings saved" : "Save"}</span>
            {!saved && (
              <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
                <path d="M18 6l-1.43 1.39L24.15 15H4v2h20.15l-7.58 7.57L18 26l10-10z" />
              </svg>
            )}
          </button>
        </div>

        <p className="text-xs text-text-helper mt-4">
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