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
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { usePresence } from "@/lib/presence-context";

export default function ClusterPresence() {
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const { liveCount } = usePresence();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (!cancelled) setMemberCount(count || 0);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex items-center gap-3 text-xs text-gray-500">
      <div className="flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span>
          <span className="font-semibold text-gray-700">
            {memberCount === null ? "…" : memberCount.toLocaleString("en-IN")}
          </span>{" "}
          {memberCount === 1 ? "sister" : "sisters"}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span>
          <span className="font-semibold text-emerald-700">{liveCount}</span>{" "}
          live now
        </span>
      </div>
    </div>
  );
}
