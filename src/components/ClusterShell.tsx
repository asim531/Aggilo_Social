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
  const CACHE_VERSION_KEY = "aggilo:cache_version";
  const CURRENT_CACHE_VERSION = "3"; // bump to clear stale cadence caches

  // One-time cache bust: if the stored version doesn't match, clear all
  // cadence keys so the new thresholds take effect immediately.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(CACHE_VERSION_KEY);
    if (stored !== CURRENT_CACHE_VERSION) {
      localStorage.removeItem(SAGE_DUA_NEXT_ELIGIBLE_KEY);
      localStorage.removeItem(CADENCE_NEXT_ELIGIBLE_KEY);
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
  useEffect(() => {
    if (showWelcome) return;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(CADENCE_NEXT_ELIGIBLE_KEY);
      if (stored && Date.now() < parseInt(stored, 10)) return;
    }
    // Cadence fires at 12s — well after the dua trigger to avoid rate-limit
    // collisions on the shared NVIDIA NIM quota.
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
    }, 12000);

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
