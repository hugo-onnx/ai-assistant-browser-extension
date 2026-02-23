import { useState, useEffect, useCallback } from "react";
import { getStorage, setStorage } from "../utils/storage";

/**
 * Manages theme switching between Carbon g100 (dark) and g10 (light).
 * Persists preference to chrome.storage.local.
 */
export function useTheme() {
  const [theme, setThemeState] = useState("g100"); // default dark

  // Load saved preference on mount
  useEffect(() => {
    getStorage(["theme"]).then((data) => {
      if (data.theme) {
        setThemeState(data.theme);
        document.documentElement.setAttribute("data-theme", data.theme);
      }
    });
  }, []);

  // Apply theme to DOM whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "g100" ? "g10" : "g100";
      setStorage({ theme: next });
      return next;
    });
  }, []);

  const isDark = theme === "g100";

  return { theme, isDark, toggleTheme };
}