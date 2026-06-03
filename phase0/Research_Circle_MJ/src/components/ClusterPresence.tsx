"use client";

/**
 * Cluster header presence indicator.
 *
 * Reads from the PresenceProvider context — does NOT subscribe directly.
 * One presence channel per cluster, owned by ClusterShell.
 *
 * Total members: a one-time count of rows in `profiles` (cluster is
 * single-tenant in MVP — every signed-up profile counts as a member).
 * For multi-cluster post-MVP, this becomes a join against cluster_members.
 *
 * Live count: comes from the shared presence context.
 *
 * UX note: this is the room's heartbeat. It's the first social-proof
 * signal a new member sees — "the room is alive, sisters are here." We
 * intentionally style it warmer and a little larger than the surrounding
 * meta line so it draws the eye without screaming.
 */

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { usePresence } from "@/lib/presence-context";
import { CLUSTER_ID } from "@/lib/cluster";

export default function ClusterPresence() {
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [joinedThisWeek, setJoinedThisWeek] = useState<number | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { liveCount, onlineUsers } = usePresence();

  // Close on outside click
  useEffect(() => {
    if (!showTooltip) return;
    function handleClickOutside(e: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTooltip]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const sevenDaysAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const [{ count: total }, { count: weekly }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("cluster_id", CLUSTER_ID),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("cluster_id", CLUSTER_ID)
          .gte("created_at", sevenDaysAgo),
      ]);
      if (cancelled) return;
      setMemberCount(total ?? 0);
      setJoinedThisWeek(weekly ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Live count — clickable pill showing who's online */}
      <div className="relative" ref={tooltipRef}>
        <button
          type="button"
          onClick={() => setShowTooltip((v) => !v)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-husl-sageSoft/30 border border-husl-sage/30 hover:bg-husl-sageSoft/50 transition-colors cursor-pointer"
          aria-label="See who's in the room"
          aria-expanded={showTooltip}
        >
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-husl-sage opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-husl-sage" />
          </span>
          <span className="text-sm font-semibold text-husl-sage">
            {liveCount} {liveCount === 1 ? "member" : "members"} live now
          </span>
        </button>

        {showTooltip && (
          <div className="absolute top-full left-0 mt-2 z-30 bg-white border border-stone-200 rounded-lg shadow-lg py-2 min-w-[160px]">
            <p className="text-[10px] uppercase tracking-widest text-husl-muted px-3 pb-1.5">
              In the room now
            </p>
            {onlineUsers.length === 0 ? (
              <p className="text-xs text-husl-muted px-3 py-1">Just you</p>
            ) : (
              onlineUsers.map((u) => (
                <div
                  key={u.id}
                  className="px-3 py-1 text-sm text-husl-ink"
                >
                  {u.nickname}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Total members — quieter, supportive */}
      <div className="inline-flex items-center gap-1.5 text-xs text-gray-600">
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <span>
          <span className="font-semibold text-gray-800">
            {memberCount === null ? "…" : memberCount.toLocaleString("en-IN")}
          </span>{" "}
          {memberCount === 1 ? "member total" : "members total"}
        </span>
      </div>

      {/* "X joined this week" — only show when there's growth */}
      {joinedThisWeek !== null && joinedThisWeek > 0 && (
        <span className="text-xs text-husl-sage">
          <span className="font-semibold">{joinedThisWeek}</span>{" "}
          joined this week
        </span>
      )}
    </div>
  );
}
