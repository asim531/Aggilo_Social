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
import { track } from "@/lib/track";
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug: log mount
  useEffect(() => {
    console.log('[TopicBar] mounted');
  }, []);

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
      } catch (err) {
        console.error('[TopicBar] fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load topics');
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

  if (error) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-xs bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-800/30">
        <span className="text-red-800 dark:text-red-200 font-medium">⚠️ Topics Error:</span>
        <span className="text-red-700 dark:text-red-300">{error}</span>
      </div>
    );
  }

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
      <div className="flex items-center gap-2 px-4 py-3 text-xs bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-800/30">
        <span className="text-amber-800 dark:text-amber-200 font-medium">📝 Topics:</span>
        <span className="text-amber-700 dark:text-amber-300">Organize posts by theme. Create one when you post, or Sage will suggest them.</span>
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="px-2 py-1 rounded bg-amber-600 text-white text-[11px] font-medium hover:bg-amber-700 transition-colors"
        >
          + Create topic
        </button>
        {showCreateForm && (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              placeholder="Topic name"
              className="px-2 py-0.5 text-[10px] rounded border border-stone-200 dark:border-stone-700 bg-husl-card dark:bg-[#1a1d22] focus:outline-none focus:ring-1 focus:ring-husl-clio w-24"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleCreate();
                }
              }}
            />
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={!newTopicName.trim() || creating}
              className="text-[10px] px-1.5 py-0.5 rounded bg-husl-clio text-white disabled:opacity-40"
            >
              {creating ? "…" : "+"}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreateForm(false); setNewTopicName(""); }}
              className="text-stone-400 hover:text-stone-600"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }

  const activeTopic = topics.find((t) => t.slug === activeTopicSlug) ?? null;

  async function handleCreate() {
    const name = newTopicName.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const res = await fetch(withBasePath("/api/topics"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as { topic?: Topic; error?: string };
      if (data.topic) {
        setTopics((prev) => [...prev, data.topic!]);
        setNewTopicName("");
        setShowCreateForm(false);
        track("topic_created_from_bar", { name: data.topic!.name });
      }
    } catch {
      // silent
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-700 overflow-x-auto scrollbar-hide">
      <button
        type="button"
        onClick={onOpenTopicsTab}
        className="shrink-0 text-xs font-medium px-3 py-1.5 rounded bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
      >
        📁 All topics
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

      {/* Quick-create */}
      {!showCreateForm ? (
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="shrink-0 text-[10px] font-medium px-2 py-1 rounded border border-dashed border-stone-300 text-stone-500 hover:border-husl-clio hover:text-husl-clio transition-colors"
          title="Create new topic"
        >
          +
        </button>
      ) : (
        <div className="shrink-0 flex items-center gap-1.5">
          <input
            type="text"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            placeholder="New topic"
            className="text-[10px] px-2 py-1 rounded border border-stone-200 dark:border-stone-700 bg-husl-card dark:bg-[#1a1d22] focus:outline-none focus:ring-1 focus:ring-husl-clio w-24"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleCreate();
              }
            }}
          />
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={!newTopicName.trim() || creating}
            className="text-[10px] px-1.5 py-1 rounded bg-husl-clio text-white disabled:opacity-40"
          >
            {creating ? "…" : "+"}
          </button>
          <button
            type="button"
            onClick={() => { setShowCreateForm(false); setNewTopicName(""); }}
            className="text-stone-400 hover:text-stone-600 text-[10px]"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
