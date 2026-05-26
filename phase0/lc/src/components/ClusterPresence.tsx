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

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { usePresence } from "@/lib/presence-context";
import { CLUSTER_ID } from "@/lib/cluster";

export default function ClusterPresence() {
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [joinedThisWeek, setJoinedThisWeek] = useState<number | null>(null);
  const { liveCount } = usePresence();

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
      {/* Live count — the brightest, warmest element on the header */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lc-sageSoft/30 border border-lc-sage/30">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lc-sage opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-lc-sage" />
        </span>
        <span className="text-sm font-semibold text-lc-sage">
          {liveCount} {liveCount === 1 ? "member" : "members"} live now
        </span>
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
        <span className="text-xs text-lc-sage">
          <span className="font-semibold">{joinedThisWeek}</span>{" "}
          joined this week
        </span>
      )}
    </div>
  );
}
