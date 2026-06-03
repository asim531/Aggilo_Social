"use client";

/**
 * FoundingFeedbackBadge — small entry point for the founding-member
 * feedback flow.
 *
 * Replaces the auto-firing modal. The founding member sees a small
 * pill in the navbar area: "Clio has a note for you · ◔" — clicking
 * it opens the FoundingFeedbackPrompt. They can take it whenever
 * they want, or close it and come back later.
 *
 * Renders nothing for non-founders or after the feedback has closed.
 *
 * Visibility:
 *   - eligibility check on mount via /api/clio/founding-feedback GET
 *   - hides itself when the prompt closes successfully
 *   - user can permanently dismiss via the X button
 */

import { useEffect, useState } from "react";
import { withBasePath } from "@/lib/path";
import { track } from "@/lib/track";

const DISMISS_KEY = "rcmj:founding_feedback_dismissed";

interface Props {
  onOpen: () => void;
}

export default function FoundingFeedbackBadge({ onOpen }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage.getItem(DISMISS_KEY)) {
      return;
    }
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch(withBasePath("/api/clio/founding-feedback"), {
          method: "GET",
          cache: "no-store",
        });
        const data = (await res.json()) as {
          eligible: boolean;
          opened: boolean;
          closed: boolean;
        };
        if (cancelled) return;
        if (data.eligible && !data.closed) {
          setVisible(true);
          track("founding_feedback_badge_shown");
        }
      } catch {
        /* silent */
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleClick() {
    track("founding_feedback_badge_clicked");
    onOpen();
  }

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation();
    setVisible(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "1");
    }
    track("founding_feedback_badge_dismissed");
  }

  if (!visible) return null;

  return (
    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-amber-300 bg-amber-50 text-husl-clio hover:bg-amber-100 transition-colors group">
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5"
        aria-label="Clio has a note for you about this room"
      >
        <span
          className="w-1.5 h-1.5 rounded-full bg-husl-clio animate-pulse"
          aria-hidden="true"
        />
        <span>Clio has a note for you</span>
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        className="ml-0.5 text-amber-400 hover:text-amber-700 transition-colors"
        aria-label="Dismiss"
        title="Dismiss"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
