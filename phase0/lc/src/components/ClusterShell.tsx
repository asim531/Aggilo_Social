"use client";

/**
 * ClusterShell — Long Conversation.
 *
 * Renders the cluster page with:
 *   - Navbar (sticky top, has HelpMenu + founder badge + admin + signout)
 *   - ClusterHeader (cluster identity + chips)
 *   - ClusterFeed (Timeline + sticky compose bar)
 *   - AgentChatbox (Room Workshop, below the compose bar)
 *   - ClioFab (top-right floating button)
 *
 * Modal/overlay layer (user-invoked, never auto-firing):
 *   - ClioWelcome — opened from HelpMenu "Show me around"
 *   - ClioTour — opened from HelpMenu "Take the tour"
 *   - FoundingFeedbackPrompt — opened from FoundingFeedbackBadge
 *
 * What still auto-fires (not user-visible):
 *   - cadence-exchange — Sage⇄Clio dialogue cycle, 30s after first
 *     non-first session (invisible UX; result lands in Workshop strip)
 *
 * Design rationale:
 *   - The room is the experience. Modals are not the gate.
 *   - First-session orientation moved out of the way: a tiny
 *     dismissible banner above the Timeline points the new member
 *     to the HelpMenu. Power-users ignore it; new members find it.
 */

import { useEffect, useState } from "react";
import { withBasePath } from "@/lib/path";
import { track } from "@/lib/track";
import Navbar from "./Navbar";
import ClusterHeader from "./ClusterHeader";
import ClusterFeed from "./ClusterFeed";
import ClioFab from "./ClioFab";
import ClioWelcome from "./ClioWelcome";
import ClioTour from "./ClioTour";
import AgentChatbox from "./AgentChatbox";
import FoundingFeedbackPrompt from "./FoundingFeedbackPrompt";
import FirstVisitHint from "./FirstVisitHint";
import type { PostWithAuthor, Profile } from "@/lib/types";

interface ClusterShellProps {
  userId: string;
  profile: Profile;
  initialPosts: PostWithAuthor[];
}

const CADENCE_NEXT_ELIGIBLE_KEY = "lc:cadence_exchange_next_eligible";
const FIRST_SESSION_DONE_KEY = "lc:first_session_done";

export default function ClusterShell({
  userId,
  profile,
  initialPosts,
}: ClusterShellProps) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showFoundingFeedback, setShowFoundingFeedback] = useState(false);
  // Server-side onboarded flag is used only for the first-visit hint
  // (which is non-blocking). The welcome modal itself is always
  // user-invoked from the HelpMenu.
  const [hintVisible, setHintVisible] = useState(!profile.onboarded);

  useEffect(() => {
    track("session_started");
    track("cluster_landed");
  }, []);

  function handleDismissHint() {
    setHintVisible(false);
    void fetch(withBasePath("/api/auth/mark-onboarded"), {
      method: "POST",
    }).catch(() => {});
  }

  function handleShowWelcomeFromHint() {
    setShowWelcome(true);
    handleDismissHint();
    track("welcome_modal_shown_from_hint");
  }

  function handleShowWelcomeFromHelp() {
    setShowWelcome(true);
    track("welcome_modal_shown_from_help");
  }

  function handleStartTour() {
    setShowTour(true);
    track("tour_started");
  }

  function handleOpenFoundingFeedback() {
    setShowFoundingFeedback(true);
    track("founding_feedback_modal_opened");
  }

  // Cadence-exchange auto-trigger (invisible to the user). Keeps the
  // Workshop strip alive across visits without asking anyone.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const firstDone = window.localStorage.getItem(FIRST_SESSION_DONE_KEY);
    if (!firstDone) {
      window.localStorage.setItem(FIRST_SESSION_DONE_KEY, String(Date.now()));
      return;
    }
    const stored = window.localStorage.getItem(CADENCE_NEXT_ELIGIBLE_KEY);
    if (stored && Date.now() < parseInt(stored, 10)) return;

    const trigger = setTimeout(async () => {
      try {
        const res = await fetch(withBasePath("/api/agents/cadence-exchange"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = (await res.json()) as {
          outcome?: string;
          next_eligible_at?: string;
        };
        if (data.outcome === "cadence_blocked" && data.next_eligible_at) {
          window.localStorage.setItem(
            CADENCE_NEXT_ELIGIBLE_KEY,
            String(new Date(data.next_eligible_at).getTime())
          );
        } else if (data.outcome === "posted") {
          window.localStorage.setItem(
            CADENCE_NEXT_ELIGIBLE_KEY,
            String(Date.now() + 60 * 60 * 1000)
          );
        } else {
          window.localStorage.setItem(
            CADENCE_NEXT_ELIGIBLE_KEY,
            String(Date.now() + 5 * 60 * 1000)
          );
        }
      } catch {
        /* silent */
      }
    }, 30_000);

    return () => clearTimeout(trigger);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-lc-surface">
      <a
        href="#lc-cluster-timeline"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[80] focus:px-3 focus:py-2 focus:bg-lc-ink focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-lc-clio"
      >
        Skip to feed
      </a>

      <Navbar
        displayName={profile.nickname}
        isAdmin={profile.role === "admin"}
        onShowWelcome={handleShowWelcomeFromHelp}
        onStartTour={handleStartTour}
        onOpenFoundingFeedback={handleOpenFoundingFeedback}
      />

      <main className="flex-1">
        <ClusterHeader />
        {hintVisible && (
          <FirstVisitHint
            nickname={profile.nickname}
            onShowWelcome={handleShowWelcomeFromHint}
            onDismiss={handleDismissHint}
          />
        )}
        <ClusterFeed
          initialPosts={initialPosts}
          userId={userId}
          profile={profile}
        />
        <AgentChatbox />
      </main>

      <ClioFab userId={userId} />

      {/* User-invoked overlays */}
      {showWelcome && (
        <ClioWelcome
          nickname={profile.nickname}
          onDismiss={() => setShowWelcome(false)}
        />
      )}

      {showTour && (
        <ClioTour
          onDone={() => {
            setShowTour(false);
            track("tour_completed");
          }}
        />
      )}

      <FoundingFeedbackPrompt
        open={showFoundingFeedback}
        founderNickname={profile.nickname}
        onClose={(didRespond) => {
          setShowFoundingFeedback(false);
          if (didRespond) {
            // The badge unmount on next mount will hide itself based
            // on the server-side closed flag. No-op here.
          }
        }}
      />
    </div>
  );
}
