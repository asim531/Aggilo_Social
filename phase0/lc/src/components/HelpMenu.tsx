"use client";

/**
 * HelpMenu — a conspicuous, user-invoked entry point for orientation.
 *
 * Replaces the auto-firing welcome modal + tour. The member arrives
 * in the cluster directly and can choose, at their own pace, to:
 *   - Read the welcome (cluster intro, agent dynamics, etc.)
 *   - Take the contextual tour
 *
 * Position:
 *   - Top-right of the navbar, next to (but distinct from) the
 *     Clio FAB. Clio FAB is amber-pulse; Help is a quiet "?" pill.
 *
 * State:
 *   - Renders a small chip with a "?" icon. On click, opens a popover
 *     with two actions: "Show me around" (welcome) and "Take the tour"
 *     (contextual spotlight).
 *   - For first-time members, the chip carries a small dot indicator
 *     that fades after the chip has been opened once.
 */

import { useEffect, useState } from "react";

const HELP_OPENED_KEY = "lc:help_menu_opened";

interface Props {
  onShowWelcome: () => void;
  onStartTour: () => void;
}

export default function HelpMenu({ onShowWelcome, onStartTour }: Props) {
  const [open, setOpen] = useState(false);
  const [hasNewIndicator, setHasNewIndicator] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const opened = window.localStorage.getItem(HELP_OPENED_KEY);
    if (!opened) setHasNewIndicator(true);
  }, []);

  function handleToggle() {
    setOpen((v) => !v);
    if (hasNewIndicator) {
      setHasNewIndicator(false);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(HELP_OPENED_KEY, "1");
      }
    }
  }

  function handleAction(action: "welcome" | "tour") {
    setOpen(false);
    if (action === "welcome") onShowWelcome();
    else onStartTour();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label={open ? "Close help" : "Open help"}
        aria-expanded={open}
        className="relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-stone-300 text-lc-muted hover:text-lc-ink hover:border-lc-clio/60 hover:bg-amber-50 transition-colors"
      >
        <span aria-hidden="true">?</span>
        <span>Help</span>
        {hasNewIndicator && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-lc-clio"
            aria-label="New"
          />
        )}
      </button>

      {open && (
        <>
          {/* Click-outside catcher */}
          <div
            className="fixed inset-0 z-[55]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Popover */}
          <div
            className="absolute right-0 top-full mt-2 w-64 z-[56] bg-lc-card rounded-xl shadow-2xl border border-stone-200 overflow-hidden"
            role="menu"
          >
            <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/40">
              <p className="text-xs uppercase tracking-wider text-lc-muted font-semibold">
                Find your way around
              </p>
              <p className="text-[11px] text-lc-muted mt-0.5">
                Whenever you want — your pace.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAction("welcome")}
              className="w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors flex items-start gap-3"
              role="menuitem"
            >
              <span className="text-lc-clio text-base shrink-0" aria-hidden="true">
                ✦
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-lc-ink">Show me around</p>
                <p className="text-[11px] text-lc-muted leading-snug">
                  How the room works, who Sage and Clio are, the dynamics.
                </p>
              </div>
            </button>
            <div className="h-px bg-stone-100" />
            <button
              type="button"
              onClick={() => handleAction("tour")}
              className="w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors flex items-start gap-3"
              role="menuitem"
            >
              <span className="text-lc-clio text-base shrink-0" aria-hidden="true">
                ◎
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-lc-ink">Take the tour</p>
                <p className="text-[11px] text-lc-muted leading-snug">
                  A quick spotlight tour of the surfaces in this room.
                </p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
