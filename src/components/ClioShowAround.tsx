"use client";

/**
 * Clio "Show me around" — first-visit discovery affordance.
 *
 * On a member's very first visit to the cluster (per device), a small
 * dismissable bubble appears next to the Clio FAB:
 *
 *   "First time here? I can show you around."   [Show me around]  [×]
 *
 * Behaviour:
 * - Appears once per device (localStorage flag).
 * - "Show me around" → starts the anchored ClioTour at step 0 and
 *   marks the bubble as dismissed (it doesn't return after the tour).
 * - "×" → dismissed without starting the tour.
 * - Soft pulse animation for the first ~3 seconds, then quiet.
 * - Mounts above the cluster but below the FAB on the z-stack, so it
 *   never obscures the FAB itself.
 *
 * Why this shape (and not a persistent "Guide me" pill):
 * Returning members don't need ongoing help — they need it gone. A
 * persistent affordance is permanent UI cost for a one-time problem.
 * This component solves discovery for newcomers without adding
 * cognitive load for everyone else.
 *
 * The ClioTour itself is portal-rendered and outlives both the bubble
 * and the FAB chat panel — once the tour is open, the member can
 * step through surfaces without anything else getting in the way.
 */

import { useEffect, useState } from "react";
import ClioTour from "./ClioTour";
import { PLATFORM_HELP_ITEMS } from "@/lib/cluster-help-items";

const SEEN_KEY = "aggilo:show_around_seen";

export default function ClioShowAround() {
  const [tourIndex, setTourIndex] = useState<number | null>(null);
  // Bubble visibility: starts as null (unknown until we read storage)
  // so we don't flash the bubble on every page load before the dismiss
  // flag has been resolved.
  const [showBubble, setShowBubble] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const seen = localStorage.getItem(SEEN_KEY);
      setShowBubble(!seen);
    } catch {
      // localStorage unavailable — show by default. Erring toward
      // discoverability is right for the first-visit affordance.
      setShowBubble(true);
    }
  }, []);

  function dismiss() {
    setShowBubble(false);
    try {
      localStorage.setItem(SEEN_KEY, String(Date.now()));
    } catch {
      // ignore — in-memory dismiss is enough for this session
    }
  }

  function startTour() {
    setTourIndex(0);
    dismiss();
  }

  return (
    <>
      {showBubble === true && (
        <div
          className="clio-show-around-bubble fixed z-40 max-w-[260px] sm:max-w-xs animate-in fade-in slide-in-from-top-2 duration-500"
          role="dialog"
          aria-label="First-visit help"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-200 overflow-hidden">
            <div className="px-3 py-2.5 flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wide font-semibold text-emerald-700 leading-tight mb-0.5">
                  Clio
                </div>
                <p className="text-[13px] text-gray-700 leading-snug">
                  First time here? I can show you around.
                </p>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="text-gray-400 hover:text-gray-600 text-base leading-none px-1 -mt-0.5 shrink-0"
                aria-label="Dismiss"
              >
                &times;
              </button>
            </div>
            <div className="px-3 pb-2.5 flex items-center justify-end">
              <button
                type="button"
                onClick={startTour}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                Show me around
              </button>
            </div>
          </div>
          {/* Subtle attention pulse — fires once, fades. The keyframes
              live in globals.css under .clio-show-around-bubble. */}
        </div>
      )}

      <ClioTour
        steps={PLATFORM_HELP_ITEMS}
        activeIndex={tourIndex}
        onChange={setTourIndex}
      />
    </>
  );
}
