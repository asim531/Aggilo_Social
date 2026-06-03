"use client";

/**
 * HelpMenu — a conspicuous, user-invoked entry point for orientation
 * and cluster surfaces beyond the Timeline.
 *
 * Replaces the auto-firing welcome modal + tour. The member arrives
 * in the cluster directly and can choose, at their own pace, to:
 *   - Read the welcome (cluster intro, agent dynamics, etc.)
 *   - Take the contextual tour
 *   - Visit the Room Workshop (full features page)
 *
 * Position:
 *   - Top-right of the navbar, next to (but distinct from) the
 *     Clio FAB. Clio FAB is amber-pulse; Help is a quiet "?" pill.
 *
 * State:
 *   - Renders a small chip with a "?" icon. On click, opens a popover
 *     with the actions. For first-time members, the chip carries a
 *     small dot indicator that fades after the chip has been opened
 *     once.
 */

import { useEffect, useState } from "react";
import Link from "next/link";

const HELP_OPENED_KEY = "lc:help_menu_opened";

interface Props {
  onShowWelcome: () => void;
  onStartTour: () => void;
  onOpenFeedback?: () => void;
}

export default function HelpMenu({ onShowWelcome, onStartTour, onOpenFeedback }: Props) {
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

  function handleAction(action: "welcome" | "tour" | "workshop" | "feedback") {
    setOpen(false);
    if (action === "welcome") onShowWelcome();
    else if (action === "tour") onStartTour();
    else if (action === "feedback") onOpenFeedback?.();
    // "workshop" navigates via Link; the popover just closes.
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label={open ? "Close help" : "Open help"}
        aria-expanded={open}
        className="relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-stone-300 dark:border-stone-600 text-husl-muted dark:text-stone-400 hover:text-husl-ink dark:hover:text-stone-200 hover:border-husl-clio/60 dark:hover:border-amber-500/60 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
      >
        <span aria-hidden="true">?</span>
        <span>Help</span>
        {hasNewIndicator && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-husl-clio"
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
            className="absolute right-0 top-full mt-2 w-64 z-[56] bg-husl-card dark:bg-[#14161a] rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden"
            role="menu"
          >
            <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-700 bg-stone-50/40 dark:bg-stone-900/40">
              <p className="text-xs uppercase tracking-wider text-husl-muted dark:text-stone-400 font-semibold">
                Find your way around
              </p>
              <p className="text-[11px] text-husl-muted dark:text-stone-400 mt-0.5">
                Whenever you want — your pace.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAction("welcome")}
              className="w-full text-left px-4 py-3 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-start gap-3"
              role="menuitem"
            >
              <svg className="w-4 h-4 text-husl-clio shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-husl-ink dark:text-stone-200">Show me around</p>
                <p className="text-[11px] text-husl-muted dark:text-stone-400 leading-snug">
                  How the room works, who Sage and Clio are, the dynamics.
                </p>
              </div>
            </button>
            <div className="h-px bg-stone-100 dark:bg-stone-700" />
            <button
              type="button"
              onClick={() => handleAction("tour")}
              className="w-full text-left px-4 py-3 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-start gap-3"
              role="menuitem"
            >
              <svg className="w-4 h-4 text-husl-clio shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-husl-ink dark:text-stone-200">Take the tour</p>
                <p className="text-[11px] text-husl-muted dark:text-stone-400 leading-snug">
                  A quick spotlight tour of the surfaces in this room.
                </p>
              </div>
            </button>
            <div className="h-px bg-stone-100 dark:bg-stone-700" />
            <Link
              href="/cluster/features"
              onClick={() => handleAction("workshop")}
              className="block w-full text-left px-4 py-3 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-start gap-3"
              role="menuitem"
            >
              <svg className="w-4 h-4 text-husl-sage shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-husl-ink dark:text-stone-200">Room Workshop</p>
                <p className="text-[11px] text-husl-muted dark:text-stone-400 leading-snug">
                  Tools we run for the room and features for you to vote on.
                </p>
              </div>
            </Link>
            <div className="h-px bg-stone-100 dark:bg-stone-700" />
            <button
              type="button"
              onClick={() => handleAction("feedback")}
              className="w-full text-left px-4 py-3 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-start gap-3"
              role="menuitem"
            >
              <svg className="w-4 h-4 text-husl-clio shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-husl-ink dark:text-stone-200">Send feedback</p>
                <p className="text-[11px] text-husl-muted dark:text-stone-400 leading-snug">
                  Bug, idea, or confusion — tell us anonymously.
                </p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
