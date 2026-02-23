import { useState, useEffect, useCallback } from "react";
import { getSyncStorage } from "../utils/storage";

const DEFAULT_PROXY_URL = "http://localhost:8000";
const CHECK_INTERVAL = 30_000; // 30 seconds

/**
 * Polls the proxy /health endpoint periodically.
 * Returns: { status: "connected" | "disconnected" | "checking", lastChecked }
 */
export function useConnectionStatus() {
  const [status, setStatus] = useState("checking"); // "checking" | "connected" | "disconnected"
  const [lastChecked, setLastChecked] = useState(null);

  const check = useCallback(async () => {
    try {
      const sync = await getSyncStorage(["proxyUrl"]);
      const proxyUrl = sync.proxyUrl || DEFAULT_PROXY_URL;
      const res = await fetch(`${proxyUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        setStatus("connected");
      } else {
        setStatus("disconnected");
      }
    } catch {
      setStatus("disconnected");
    }
    setLastChecked(new Date());
  }, []);

  useEffect(() => {
    check(); // initial check
    const interval = setInterval(check, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [check]);

  return { status, lastChecked, recheck: check };
}