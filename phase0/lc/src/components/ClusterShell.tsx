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
 */

import { useEffect } from "react";
import { withBasePath } from "@/lib/path";
import { track } from "@/lib/track";
import Navbar from "./Navbar";
import ClusterHeader from "./ClusterHeader";
import ClusterFeed from "./ClusterFeed";
import ClioFab from "./ClioFab";
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
  // Session-level analytics on mount.
  useEffect(() => {
    track("session_started");
    track("cluster_landed");
  }, []);

  // Cadence-exchange trigger. Mirrors MVP's pattern with LC keys.
  // The first session ever is silent — we just stamp the flag, so the
  // member's first impression is the room itself, not a Workshop
  // exchange. From the second session onward, the dialogue surfaces
  // when the server-side cadence floor allows.
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
          // Match the active-cluster floor (60 minutes) so we don't
          // hammer the room mid-conversation.
          window.localStorage.setItem(
            CADENCE_NEXT_ELIGIBLE_KEY,
            String(Date.now() + 60 * 60 * 1000)
          );
        } else {
          // Errors / in_flight / budget_exceeded: short retry floor.
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
      {/* Skip-to-content for keyboard users. WCAG 2.4.1 (Bypass Blocks). */}
      <a
        href="#lc-cluster-timeline"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[80] focus:px-3 focus:py-2 focus:bg-lc-ink focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-lc-clio"
      >
        Skip to feed
      </a>

      <Navbar displayName={profile.nickname} isAdmin={profile.role === "admin"} />

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

      {/*
        Founding-member feedback prompt. Renders nothing for non-
        founding members (the component checks eligibility on mount).
        For the founding member, it surfaces ~30s after they enter the
        room with Clio's verbatim opening per spec. One-shot.
      */}
      <FoundingFeedbackPrompt />
    </div>
  );
}
