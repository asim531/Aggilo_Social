"use client";

/**
 * ClusterShell — Long Conversation.
 *
 * Single-scroll layout. Sticky Navbar at top, sticky compose bar at
 * bottom (rendered by ClusterFeed → PostComposer), everything between
 * scrolls together. Mobile-first.
 *
 * The Clio FAB (top-right, intimacy-cohort register, with the private
 * tip mechanic active) is wired in at the bottom of the shell.
 *
 * Room Workshop strip (AgentChatbox) renders between the cluster
 * header and the feed. Default-collapsed; members open it once and
 * the choice persists. Auto-fires the cadence-exchange ~30s after
 * mount when the cadence floor allows.
 *
 * First-session welcome:
 *   - On first visit (profile.onboarded === false), the ClioWelcome
 *     modal renders. The cadence-trigger and the founding-feedback
 *     prompt both wait until welcome is dismissed.
 *   - On dismiss, profile.onboarded is stamped via
 *     /api/auth/mark-onboarded so the modal never fires again.
 */

import { useEffect, useState } from "react";
import { withBasePath } from "@/lib/path";
import { track } from "@/lib/track";
import Navbar from "./Navbar";
import ClusterHeader from "./ClusterHeader";
import ClusterFeed from "./ClusterFeed";
import ClioFab from "./ClioFab";
import ClioWelcome from "./ClioWelcome";
import AgentChatbox from "./AgentChatbox";
import FoundingFeedbackPrompt from "./FoundingFeedbackPrompt";
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
  // Welcome modal state. Initial value comes from the server-side
  // profile.onboarded; the client may also flip it via dismiss.
  const [showWelcome, setShowWelcome] = useState<boolean>(!profile.onboarded);

  // Session-level analytics on mount.
  useEffect(() => {
    track("session_started");
    track("cluster_landed");
    if (showWelcome) track("welcome_modal_shown");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDismissWelcome() {
    setShowWelcome(false);
    track("welcome_modal_dismissed");
    try {
      await fetch(withBasePath("/api/auth/mark-onboarded"), { method: "POST" });
    } catch {
      // Non-blocking. The localStorage first-session-done flag and
      // the server-side stamp protect against re-show; if the stamp
      // didn't land, the next mount will retry.
    }
  }

  // Cadence-exchange trigger. Mirrors MVP's pattern with LC keys.
  // Waits until the welcome modal is dismissed so it doesn't compete
  // with the member's first impression.
  useEffect(() => {
    if (showWelcome) return;
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
  }, [showWelcome]);

  return (
    <div className="min-h-screen flex flex-col bg-lc-surface">
      {/* Skip-to-content for keyboard users. WCAG 2.4.1 (Bypass Blocks). */}
      <a
        href="#lc-cluster-timeline"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[80] focus:px-3 focus:py-2 focus:bg-lc-ink focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-lc-clio"
      >
        Skip to feed
      </a>

      <Navbar
        displayName={profile.nickname}
        isAdmin={profile.role === "admin"}
      />

      <main className="flex-1">
        <ClusterHeader />
        <AgentChatbox />
        <ClusterFeed
          initialPosts={initialPosts}
          userId={userId}
          profile={profile}
        />
      </main>

      {/* Clio FAB — top-right, 44px, 16px from edge, 8px below Navbar */}
      <ClioFab userId={userId} />

      {/* First-session welcome — three-step modal, gates founding-feedback. */}
      {showWelcome && (
        <ClioWelcome
          nickname={profile.nickname}
          onDismiss={handleDismissWelcome}
        />
      )}

      {/*
        Founding-member feedback prompt. Renders nothing for non-
        founding members (the component checks eligibility on mount).
        For the founding member, it surfaces after the welcome modal is
        dismissed. One-shot.
      */}
      {!showWelcome && (
        <FoundingFeedbackPrompt founderNickname={profile.nickname} />
      )}
    </div>
  );
}
