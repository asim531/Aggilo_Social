"use client";

/**
 * PaperTagThreads — tag-threaded discussion per attachment.
 * Each tag has its own comment thread. Members can add comments.
 */

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { CLUSTER_ID } from "@/lib/cluster";

interface PaperTag {
  id: string;
  name: string;
  color: string;
}

interface PaperComment {
  id: string;
  tag_id: string;
  author_id: string;
  body: string;
  created_at: string;
  profiles?: { nickname: string } | null;
}

interface PaperTagThreadsProps {
  attachmentId: string;
  userId: string;
}

export default function PaperTagThreads({ attachmentId, userId }: PaperTagThreadsProps) {
  const [tags, setTags] = useState<PaperTag[]>([]);
  const [comments, setComments] = useState<Record<string, PaperComment[]>>({});
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [threadQuery, setThreadQuery] = useState("");

  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Load tags
      const { data: tagRows } = await supabase
        .from("paper_tags")
        .select("id, name, color")
        .eq("attachment_id", attachmentId)
        .eq("cluster_id", CLUSTER_ID);

      const fetchedTags = (tagRows ?? []) as PaperTag[];
      if (!cancelled) {
        setTags(fetchedTags);
        if (fetchedTags.length > 0 && !activeTag) {
          setActiveTag(fetchedTags[0].id);
        }
      }

      // Load comments for all tags
      const tagIds = fetchedTags.map((t) => t.id);
      if (tagIds.length === 0) {
        setLoading(false);
        return;
      }

      // Load comments (no profiles join — FK goes through auth.users)
      const { data: commentRows } = await supabase
        .from("paper_comments")
        .select("id, tag_id, author_id, body, created_at")
        .in("tag_id", tagIds)
        .order("created_at", { ascending: true });

      // Fetch author nicknames separately
      const uniqueAuthors = [...new Set((commentRows ?? []).map((c) => c.author_id))];
      let nickMap: Record<string, string> = {};
      if (uniqueAuthors.length > 0) {
        const { data: profRows } = await supabase
          .from("profiles")
          .select("id, nickname")
          .in("id", uniqueAuthors);
        for (const p of profRows ?? []) {
          nickMap[p.id] = p.nickname;
        }
      }

      const byTag: Record<string, PaperComment[]> = {};
      for (const c of (commentRows ?? []) as any[]) {
        byTag[c.tag_id] = byTag[c.tag_id] || [];
        byTag[c.tag_id].push({
          id: c.id,
          tag_id: c.tag_id,
          author_id: c.author_id,
          body: c.body,
          created_at: c.created_at,
          profiles: { nickname: nickMap[c.author_id] ?? "Member" },
        });
      }

      if (!cancelled) {
        setComments(byTag);
        setLoading(false);
      }
    }

    load();

    // Realtime subscriptions
    const channel = supabase
      .channel(`paper-discuss-${attachmentId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "paper_comments" },
        (payload) => {
          const newComment = payload.new as PaperComment;
          setTags((currentTags) => {
            if (currentTags.some((t) => t.id === newComment.tag_id)) {
              setComments((prev) => ({
                ...prev,
                [newComment.tag_id]: [...(prev[newComment.tag_id] || []), newComment],
              }));
            }
            return currentTags;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "paper_tags", filter: `attachment_id=eq.${attachmentId}` },
        (payload) => {
          const newTag = payload.new as PaperTag;
          setTags((prev) => {
            if (prev.some((t) => t.id === newTag.id)) return prev;
            return [...prev, newTag];
          });
          setActiveTag(newTag.id);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [attachmentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTag || !newComment.trim() || submitting) return;

    setSubmitting(true);
    const { error } = await supabase.from("paper_comments").insert({
      tag_id: activeTag,
      author_id: userId,
      body: newComment.trim(),
    });

    if (!error) {
      setNewComment("");
    }
    setSubmitting(false);
  }

  async function handleCreateTag(e: React.FormEvent) {
    e.preventDefault();
    const name = newTagName.trim();
    if (!name || creatingTag) return;

    setCreatingTag(true);
    const { data, error } = await supabase
      .from("paper_tags")
      .insert({
        attachment_id: attachmentId,
        cluster_id: CLUSTER_ID,
        name: name.startsWith("#") ? name : `#${name}`,
        color: "#4d96f5",
        created_by: userId,
      })
      .select("id, name, color")
      .single();

    if (!error && data) {
      setTags((prev) => {
        if (prev.some((t) => t.id === data.id)) return prev;
        return [...prev, data as PaperTag];
      });
      setActiveTag(data.id);
      setComments((prev) => ({ ...prev, [data.id]: [] }));
      setNewTagName("");
      setShowNewTagForm(false);
    }
    setCreatingTag(false);
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-2 py-2">
        <div className="h-4 w-24 bg-stone-200 rounded" />
        <div className="h-8 w-full bg-stone-200 rounded" />
      </div>
    );
  }

  if (tags.length === 0) {
    return <p className="text-xs text-husl-muted py-2">No discussion threads yet.</p>;
  }

  const activeTagObj = tags.find((t) => t.id === activeTag);
  const activeComments = comments[activeTag || ""] || [];

  return (
    <div>
      {/* Thread search + selector */}
      <div className="mb-2">
        <input
          type="text"
          value={threadQuery}
          onChange={(e) => setThreadQuery(e.target.value)}
          placeholder="Search threads…"
          className="w-full text-xs px-2.5 py-1.5 rounded border border-stone-200 bg-white text-husl-ink placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-husl-clio mb-1.5"
        />
      </div>
      <div className="flex items-center gap-1.5 mb-2 overflow-x-auto scrollbar-hide">
        {tags
          .filter((t) => !threadQuery || t.name.toLowerCase().includes(threadQuery.toLowerCase()))
          .map((tag) => (
          <button
            key={tag.id}
            data-thread-id={tag.id}
            type="button"
            onClick={() => setActiveTag(tag.id)}
            className={`shrink-0 text-[10px] font-medium px-2 py-1 rounded transition-colors ${
              tag.id === activeTag
                ? "text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
            style={
              tag.id === activeTag ? { backgroundColor: tag.color } : undefined
            }
          >
            {tag.name}
            {comments[tag.id]?.length ? (
              <span className="ml-1 opacity-80">{comments[tag.id].length}</span>
            ) : null}
          </button>
        ))}
        {!showNewTagForm ? (
          <button
            type="button"
            onClick={() => setShowNewTagForm(true)}
            className="shrink-0 text-[10px] font-medium px-2 py-1 rounded border border-dashed border-stone-300 text-stone-500 hover:border-husl-clio hover:text-husl-clio transition-colors"
          >
            + New thread
          </button>
        ) : (
          <form onSubmit={handleCreateTag} className="flex items-center gap-1 shrink-0">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="thread name"
              autoFocus
              className="w-28 text-[10px] px-2 py-1 rounded border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-husl-clio"
            />
            <button
              type="submit"
              disabled={!newTagName.trim() || creatingTag}
              className="text-[10px] font-medium px-2 py-1 rounded bg-husl-clio text-white disabled:opacity-40"
            >
              {creatingTag ? "…" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewTagForm(false);
                setNewTagName("");
              }}
              className="text-[10px] text-stone-400 hover:text-stone-600 px-1"
            >
              ×
            </button>
          </form>
        )}
      </div>

      {/* Comment list */}
      <div className="space-y-2 max-h-64 overflow-y-auto mb-2">
        {activeComments.length === 0 ? (
          <p className="text-xs text-husl-muted py-2">
            No comments in {activeTagObj?.name} yet. Start the thread.
          </p>
        ) : (
          activeComments.map((c) => (
            <div key={c.id} className="px-2 py-1.5 rounded bg-stone-50">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-medium text-husl-ink">
                  {c.profiles?.nickname || "member"}
                </span>
                <span className="text-[10px] text-husl-muted">
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-husl-ink leading-relaxed">{c.body}</p>
            </div>
          ))
        )}
      </div>

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={`Comment on ${activeTagObj?.name}...`}
          className="flex-1 min-w-0 text-xs px-2.5 py-1.5 rounded border border-stone-200 bg-white text-husl-ink placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-husl-clio focus:border-husl-clio"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || submitting}
          className="shrink-0 text-[10px] font-medium px-2.5 py-1.5 rounded bg-husl-clio text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-600 transition-colors"
        >
          {submitting ? "..." : "Post"}
        </button>
      </form>
    </div>
  );
}
