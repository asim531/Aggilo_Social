"use client";

/**
 * ThemeProvider — light / dark / system mode for Research Circle MJ.
 * Persists choice in localStorage and syncs across tabs.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolved: "light",
  setTheme: () => {},
  toggle: () => {},
});

const STORAGE_KEY = "rcmj-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");
  // Apply class to <html> and resolve effective theme
  const apply = useCallback((next: Theme) => {
    const root = document.documentElement;
    const effective = next === "system" ? getSystemTheme() : next;
    root.classList.remove("dark");
    if (effective === "dark") root.classList.add("dark");
    setResolved(effective);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = saved ?? "system";
    setThemeState(initial);
    apply(initial);

    const onChange = (e: MediaQueryListEvent) => {
      if ((localStorage.getItem(STORAGE_KEY) as Theme | null) === "system") {
        apply("system");
      }
    };
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [apply]);

  const setTheme = useCallback(
    (next: Theme) => {
      localStorage.setItem(STORAGE_KEY, next);
      setThemeState(next);
      apply(next);
    },
    [apply]
  );

  const toggle = useCallback(() => {
    const next = resolved === "light" ? "dark" : "light";
    setTheme(next);
  }, [resolved, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
