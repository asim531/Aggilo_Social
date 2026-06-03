"use client";

/**
 * TopicBar — horizontal scrollable filter bar above the Timeline.
 *
 * Shows the top topics for the cluster (by post_count) as clickable chips.
 * Clicking a chip filters the feed to posts with that topic.
 * Includes a "Topics" button that opens the full Topics tab.
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { CLUSTER_ID } from "@/lib/cluster";
import { withBasePath } from "@/lib/path";
import type { Topic } from "@/lib/types";
import TopicChip from "./TopicChip";

interface TopicBarProps {
  activeTopicSlug?: string | null;
  onSelectTopic?: (topic: Topic | null) => void;
  onOpenTopicsTab?: () => void;
}

export default function TopicBar({ activeTopicSlug, onSelectTopic, onOpenTopicsTab }: TopicBarProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(withBasePath("/api/topics"));
        if (!res.ok) throw new Error("topics_fetch_failed");
        const data = await res.json();
        if (!cancelled) {
          setTopics((data.topics ?? []) as Topic[]);
        }
      } catch {
        // silent — bar stays empty if topics don't load
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Realtime: new topics arrive live
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("topic-bar-" + Math.random().toString(36).slice(2, 9))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "topics", filter: `cluster_id=eq.${CLUSTER_ID}` },
        () => {
          // Refresh the list
          fetch(withBasePath("/api/topics"))
            .then((r) => r.json())
            .then((d) => setTopics((d.topics ?? []) as Topic[]))
            .catch(() => {});
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return (
      <div className="flex gap-2 py-2 px-4 animate-pulse">
        <div className="h-5 w-16 bg-stone-200 rounded" />
        <div className="h-5 w-20 bg-stone-200 rounded" />
        <div className="h-5 w-14 bg-stone-200 rounded" />
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-[11px] text-husl-muted">
        <span>No topics yet — Sage will suggest some as posts arrive.</span>
      </div>
    );
  }

  const activeTopic = topics.find((t) => t.slug === activeTopicSlug) ?? null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-stone-100 overflow-x-auto scrollbar-hide">
      <button
        type="button"
        onClick={onOpenTopicsTab}
        className="shrink-0 text-[10px] font-medium px-2 py-1 rounded bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
      >
        Topics
      </button>

      {activeTopic && (
        <button
          type="button"
          onClick={() => onSelectTopic?.(null)}
          className="shrink-0 text-[10px] font-medium px-2 py-1 rounded bg-husl-clio/10 text-husl-clio hover:bg-husl-clio/20 transition-colors"
        >
          Clear filter
        </button>
      )}

      <div className="flex items-center gap-1.5">
        {topics.slice(0, 12).map((topic) => (
          <TopicChip
            key={topic.id}
            topic={topic}
            active={topic.slug === activeTopicSlug}
            onClick={() => onSelectTopic?.(topic)}
          />
        ))}
      </div>
    </div>
  );
}
