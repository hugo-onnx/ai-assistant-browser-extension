import { useState, useEffect, useCallback } from "react";
import { getSyncStorage } from "../utils/storage";
import type { ConnectionStatus } from "../types";

const DEFAULT_PROXY_URL = "http://localhost:8000";
const CHECK_INTERVAL = 30_000;

interface UseConnectionStatusReturn {
  status: ConnectionStatus;
  lastChecked: Date | null;
  recheck: () => Promise<void>;
}

export function useConnectionStatus(): UseConnectionStatusReturn {
  const [status, setStatus] = useState<ConnectionStatus>("checking");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const check = useCallback(async () => {
    try {
      const sync = await getSyncStorage(["proxyUrl"]);
      const proxyUrl = (sync.proxyUrl as string) || DEFAULT_PROXY_URL;
      const res = await fetch(`${proxyUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      setStatus(res.ok ? "connected" : "disconnected");
    } catch {
      setStatus("disconnected");
    }
    setLastChecked(new Date());
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [check]);

  return { status, lastChecked, recheck: check };
}