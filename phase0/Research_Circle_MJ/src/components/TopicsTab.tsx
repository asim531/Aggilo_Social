"use client";

/**
 * TopicsTab — full-screen overlay showing all cluster topics.
 *
 * Triggered from the TopicBar "Topics" button or HelpMenu.
 * Shows topics as a grid of cards with post counts.
 * Clicking a topic navigates to its detail page.
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { CLUSTER_ID } from "@/lib/cluster";
import { withBasePath } from "@/lib/path";
import type { Topic } from "@/lib/types";
import TopicChip from "./TopicChip";

interface TopicsTabProps {
  open: boolean;
  onClose: () => void;
  onSelectTopic?: (topic: Topic) => void;
}

export default function TopicsTab({ open, onClose, onSelectTopic }: TopicsTabProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(withBasePath("/api/topics"), { cache: "no-store" });
        if (!res.ok) throw new Error("fetch_failed");
        const data = await res.json();
        if (!cancelled) setTopics((data.topics ?? []) as Topic[]);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [open]);

  const filtered = topics.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-husl-surface/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-husl-card">
        <h2 className="text-lg font-semibold text-husl-ink">Topics</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-husl-muted hover:text-husl-ink px-2 py-1 rounded hover:bg-stone-100 transition-colors"
        >
          Close
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-stone-100">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search topics…"
          className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-husl-card text-sm text-husl-ink placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-husl-clio focus:border-transparent"
        />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-stone-100 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-husl-muted text-center py-12">
            {search ? "No topics match your search." : "No topics yet. Sage will suggest some as the room grows."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => {
                  onSelectTopic?.(topic);
                  onClose();
                }}
                className="text-left p-4 rounded-lg border border-stone-200 bg-husl-card hover:border-stone-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <TopicChip topic={topic} size="md" />
                </div>
                {topic.description && (
                  <p className="text-xs text-husl-muted line-clamp-2">{topic.description}</p>
                )}
                <p className="text-[10px] text-husl-muted mt-2">
                  {topic.post_count} {topic.post_count === 1 ? "post" : "posts"}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
