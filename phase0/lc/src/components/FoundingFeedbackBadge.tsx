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
 *   - reappears next visit if the user dismissed without responding
 */

import { useEffect, useState } from "react";
import { withBasePath } from "@/lib/path";
import { track } from "@/lib/track";

interface Props {
  onOpen: () => void;
}

export default function FoundingFeedbackBadge({ onOpen }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
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

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-amber-300 bg-amber-50 text-lc-clio hover:bg-amber-100 transition-colors group"
      aria-label="Clio has a note for you about this room"
    >
      <span
        className="w-1.5 h-1.5 rounded-full bg-lc-clio animate-pulse"
        aria-hidden="true"
      />
      <span>Clio has a note for you</span>
    </button>
  );
}
