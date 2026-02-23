import { useState, useEffect, useCallback } from "react";
import { getStorage, setStorage } from "../utils/storage";
import type { Theme } from "../types";

interface UseThemeReturn {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>("g100");

  useEffect(() => {
    getStorage(["theme"]).then((data) => {
      if (data.theme) {
        const saved = data.theme as Theme;
        setThemeState(saved);
        document.documentElement.setAttribute("data-theme", saved);
      }
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "g100" ? "g10" : "g100";
      setStorage({ theme: next });
      return next;
    });
  }, []);

  return { theme, isDark: theme === "g100", toggleTheme };
}