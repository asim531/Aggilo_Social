"use client";

import { useEffect, useState } from "react";
import { PostWithAuthor } from "@/lib/types";
import { createClient } from "@/lib/supabase-browser";
import { PresenceProvider } from "@/lib/presence-context";
import Navbar from "./Navbar";
import ClusterHeader from "./ClusterHeader";
import ClusterFeed from "./ClusterFeed";
import ClioWelcome from "./ClioWelcome";
import ClioFab from "./ClioFab";

interface ClusterShellProps {
  displayName: string;
  isFirstVisit: boolean;
  userId: string;
  initialPosts: PostWithAuthor[];
}

export default function ClusterShell({
  displayName,
  isFirstVisit,
  userId,
  initialPosts,
}: ClusterShellProps) {
  const [showWelcome, setShowWelcome] = useState(isFirstVisit);

  async function handleDismissWelcome() {
    setShowWelcome(false);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ onboarded: true })
      .eq("id", userId);
  }

  // ── Autonomous Sage dua suggestion trigger ──────────────────────────
  const SAGE_DUA_NEXT_ELIGIBLE_KEY = "aggilo:sage_dua_next_eligible";
  const CADENCE_NEXT_ELIGIBLE_KEY = "aggilo:cadence_exchange_next_eligible";
  const INTROSPECTION_NEXT_ELIGIBLE_KEY = "aggilo:introspection_next_eligible";
  const CACHE_VERSION_KEY = "aggilo:cache_version";
  const CURRENT_CACHE_VERSION = "4"; // bumped for introspection cycle
  // Cadence is gated on the member's first session — the dialogue is
  // useful but watching agents debate before knowing who they are can
  // feel performative on first contact. After first visit completes,
  // cadence runs on its normal cold-floor rhythm.
  const FIRST_SESSION_DONE_KEY = "aggilo:first_session_done";

  // One-time cache bust: if the stored version doesn't match, clear all
  // cadence keys so the new thresholds take effect immediately.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(CACHE_VERSION_KEY);
    if (stored !== CURRENT_CACHE_VERSION) {
      localStorage.removeItem(SAGE_DUA_NEXT_ELIGIBLE_KEY);
      localStorage.removeItem(CADENCE_NEXT_ELIGIBLE_KEY);
      localStorage.removeItem(INTROSPECTION_NEXT_ELIGIBLE_KEY);
      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION);
    }
  }, []);

  useEffect(() => {
    if (showWelcome) return;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(SAGE_DUA_NEXT_ELIGIBLE_KEY);
      if (stored && Date.now() < parseInt(stored, 10)) return;
    }
    // Dua fires at 5s — gives the page time to settle
    const trigger = setTimeout(async () => {
      try {
        const res = await fetch("/api/sage/suggest-dua", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (typeof window !== "undefined") {
          if (data?.outcome === "cadence_blocked" && data.last_dua_at) {
            const nextEligible =
              new Date(data.last_dua_at).getTime() + 6 * 60 * 60 * 1000;
            localStorage.setItem(SAGE_DUA_NEXT_ELIGIBLE_KEY, String(nextEligible));
          } else if (data?.outcome === "daily_cap" || data?.outcome === "posted" || data?.outcome === "pointer") {
            const nextEligible = Date.now() + 6 * 60 * 60 * 1000;
            localStorage.setItem(SAGE_DUA_NEXT_ELIGIBLE_KEY, String(nextEligible));
          } else {
            const nextEligible = Date.now() + 30 * 60 * 1000;
            localStorage.setItem(SAGE_DUA_NEXT_ELIGIBLE_KEY, String(nextEligible));
          }
        }
      } catch {
        /* silent */
      }
    }, 5000);

    return () => clearTimeout(trigger);
  }, [showWelcome]);

  // ── Welcome new member acknowledgment ───────────────────────────────
  // Fires once on cluster mount. Server-side endpoint is idempotent and
  // checks whether the user is genuinely new (no posts yet), whether
  // they've already been welcomed, and whether a recent welcome covers
  // them. Restrained, non-performative, single short line.
  useEffect(() => {
    if (showWelcome) return; // wait until onboarding is done
    const trigger = setTimeout(() => {
      fetch("/api/agents/welcome-new-member", { method: "POST" }).catch(
        () => {}
      );
    }, 8000);
    return () => clearTimeout(trigger);
  }, [showWelcome]);

  // ── Cadence agent exchange trigger ──────────────────────────────────
  // Fires the live Sage↔Clio dialogue on a 15-min floor (cold cluster).
  // Server enforces the floor; client-side cache prevents wasted LLM calls.
  // First-visit gate: skipped on a member's very first session so they
  // can take in the room before agents surface dialogue. The flag is
  // set when the user dismisses the welcome banner; a second visit (or
  // any subsequent page-mount) lets cadence run normally.
  useEffect(() => {
    if (showWelcome) return;
    if (typeof window !== "undefined") {
      const firstDone = localStorage.getItem(FIRST_SESSION_DONE_KEY);
      if (!firstDone) {
        // Stamp it now so subsequent mounts (e.g. after a reload) can run.
        localStorage.setItem(FIRST_SESSION_DONE_KEY, String(Date.now()));
        return;
      }
      const stored = localStorage.getItem(CADENCE_NEXT_ELIGIBLE_KEY);
      if (stored && Date.now() < parseInt(stored, 10)) return;
    }
    // Cadence fires at 30s — gives a returning visitor time to settle into
    // the room before the dialogue surfaces. Far enough after dua + welcome
    // to avoid rate-limit collisions on the shared NVIDIA NIM quota.
    const trigger = setTimeout(async () => {
      try {
        const res = await fetch("/api/agents/cadence-exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (typeof window !== "undefined") {
          if (data?.outcome === "cadence_blocked" && data.next_eligible_at) {
            localStorage.setItem(
              CADENCE_NEXT_ELIGIBLE_KEY,
              String(new Date(data.next_eligible_at).getTime())
            );
          } else if (data?.outcome === "posted") {
            // Cache 15 min forward (matches server cold floor)
            const next = Date.now() + 15 * 60 * 1000;
            localStorage.setItem(CADENCE_NEXT_ELIGIBLE_KEY, String(next));
          } else {
            // Errors: 5m soft floor so testers can retry quickly
            const next = Date.now() + 5 * 60 * 1000;
            localStorage.setItem(CADENCE_NEXT_ELIGIBLE_KEY, String(next));
          }
        }
      } catch {
        /* silent */
      }
    }, 30000);

    return () => clearTimeout(trigger);
  }, [showWelcome]);

  // ── Introspection cycle trigger ─────────────────────────────────────
  // Clio reads telemetry and produces a self-critique + ONE concrete
  // proposal (feature / prompt tweak / behavioural). Server enforces
  // a 6h floor between runs. Fires later in the page lifecycle so it
  // doesn't compete with cadence + dua on the LLM rate limit.
  useEffect(() => {
    if (showWelcome) return;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(INTROSPECTION_NEXT_ELIGIBLE_KEY);
      if (stored && Date.now() < parseInt(stored, 10)) return;
    }
    const trigger = setTimeout(async () => {
      try {
        const res = await fetch("/api/agents/introspect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (typeof window !== "undefined") {
          if (data?.outcome === "cadence_blocked" && data.next_eligible_at) {
            localStorage.setItem(
              INTROSPECTION_NEXT_ELIGIBLE_KEY,
              String(new Date(data.next_eligible_at).getTime())
            );
          } else if (data?.outcome === "introspected") {
            // Cache 6h forward (matches server floor)
            const next = Date.now() + 6 * 60 * 60 * 1000;
            localStorage.setItem(INTROSPECTION_NEXT_ELIGIBLE_KEY, String(next));
          } else {
            const next = Date.now() + 30 * 60 * 1000;
            localStorage.setItem(INTROSPECTION_NEXT_ELIGIBLE_KEY, String(next));
          }
        }
      } catch {
        /* silent */
      }
    }, 25000); // 25s after mount — well after dua + cadence

    return () => clearTimeout(trigger);
  }, [showWelcome]);

  /**
   * Single-scroll layout (V3.1 UX correction)
   *
   * Previous layout split the screen into a fixed agent chatbox + a
   * scrollable feed inside it. Mobile users found this jarring — two
   * scroll surfaces on one page is cumbersome.
   *
   * New layout: the entire page is one continuous scroll. The compose
   * bar is sticky at the bottom (so it's always reachable) and the
   * Navbar is sticky at the top. Everything between them — cluster
   * header, agent chatbox, timeline — scrolls together as one column.
   */
  return (
    <PresenceProvider userId={userId} nickname={displayName}>
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Skip-to-content link — keyboard users tab here first and can
            jump straight to the timeline, bypassing the navbar / header.
            Visually hidden until focused; absolutely positioned so it
            doesn't shift layout when revealed. WCAG 2.4.1 (Bypass Blocks). */}
        <a
          href="#aggilo-cluster-timeline"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[80] focus:px-3 focus:py-2 focus:bg-aggilo-deep focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-aggilo-accent"
        >
          Skip to feed
        </a>

        {showWelcome && (
          <ClioWelcome nickname={displayName} onDismiss={handleDismissWelcome} />
        )}

        <Navbar displayName={displayName} />

        <main className="flex-1">
          <ClusterHeader />
          <ClusterFeed initialPosts={initialPosts} userId={userId} />
        </main>

        <div className="cluster-clio-anchor">
          <ClioFab userId={userId} inCluster={true} />
        </div>
      </div>
    </PresenceProvider>
  );
}
