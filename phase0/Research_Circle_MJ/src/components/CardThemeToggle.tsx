"use client";

/**
 * CardThemeToggle — light / dark toggle for server-rendered pages
 * (cluster card, landing page). Uses the same localStorage key as
 * ThemeProvider so the choice carries into the authenticated cluster
 * shell and vice-versa.
 */

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "rcmj-theme";

type Theme = "light" | "dark" | "system";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolve(theme: Theme): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

export default function CardThemeToggle() {
  const [resolved, setResolved] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = saved ?? "system";
    const effective = resolve(initial);
    setResolved(effective);
    document.documentElement.classList.toggle("dark", effective === "dark");

    const onChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem(STORAGE_KEY) === "system") {
        const next = e.matches ? "dark" : "light";
        setResolved(next);
        document.documentElement.classList.toggle("dark", next === "dark");
      }
    };
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    const next = resolved === "light" ? "dark" : "light";
    localStorage.setItem(STORAGE_KEY, next);
    setResolved(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }, [resolved]);

  if (!mounted) {
    return (
      <button
        type="button"
        className="p-1.5 rounded-md text-stone-300 hover:text-stone-500 transition-colors"
        aria-hidden="true"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="p-1.5 rounded-md text-stone-500 hover:text-husl-ink hover:bg-stone-100 dark:text-stone-200 dark:hover:text-white dark:hover:bg-stone-700 transition-colors"
      title={resolved === "light" ? "Switch to dark mode" : "Switch to light mode"}
      aria-label={resolved === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {resolved === "light" ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
    </button>
  );
}
