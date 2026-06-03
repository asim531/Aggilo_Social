"use client";

/**
 * PaperReadingFilter — shows counts of Unread / Reading / Read papers
 * for the current user and lets them filter the cluster feed.
 */

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { CLUSTER_ID } from "@/lib/cluster";

type StatusFilter = "unread" | "reading" | "read";

interface PaperReadingFilterProps {
  userId: string;
  activeFilter: StatusFilter | null;
  onChange: (filter: StatusFilter | null) => void;
  sortOrder: "oldest" | "newest";
  onSortChange: (order: "oldest" | "newest") => void;
}

export default function PaperReadingFilter({ userId, activeFilter, onChange, sortOrder, onSortChange }: PaperReadingFilterProps) {
  const [counts, setCounts] = useState<Record<StatusFilter, number>>({ unread: 0, reading: 0, read: 0 });
  const supabase = createClient();

  async function loadCounts() {
    const { data } = await supabase
      .from("paper_reading_status")
      .select("status")
      .eq("user_id", userId)
      .in("status", ["unread", "reading", "read"]);

    const next = { unread: 0, reading: 0, read: 0 };
    for (const row of data ?? []) {
      const s = row.status as StatusFilter;
      if (s in next) next[s]++;
    }
    setCounts(next);
  }

  useEffect(() => {
    loadCounts();

    // Realtime: keep counts in sync when reading status changes
    const channel = supabase
      .channel("paper_reading_status_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "paper_reading_status", filter: `user_id=eq.${userId}` },
        () => loadCounts()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const buttons: { key: StatusFilter; label: string }[] = [
    { key: "unread", label: "Unread" },
    { key: "reading", label: "Reading" },
    { key: "read", label: "Read" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 pt-2 pb-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-wider font-medium">My library</span>
        {buttons.map((b) => {
          const isActive = activeFilter === b.key;
          return (
            <button
              key={b.key}
              type="button"
              onClick={() => onChange(isActive ? null : b.key)}
              className={`text-[10px] font-medium px-2 py-0.5 rounded transition-colors ${
                isActive
                  ? "bg-husl-clio text-white"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              {b.label} {counts[b.key] > 0 && `(${counts[b.key]})`}
            </button>
          );
        })}
        {activeFilter && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[10px] text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 underline ml-1"
          >
            Clear
          </button>
        )}
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => onSortChange(sortOrder === "oldest" ? "newest" : "oldest")}
            className="text-[10px] text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 flex items-center gap-1"
            title={sortOrder === "oldest" ? "Oldest first" : "Newest first"}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sortOrder === "oldest" ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              )}
            </svg>
            {sortOrder === "oldest" ? "Oldest first" : "Newest first"}
          </button>
        </div>
      </div>
    </div>
  );
}
