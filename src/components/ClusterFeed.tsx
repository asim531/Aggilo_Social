"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { PostWithAuthor, PostWithReplies } from "@/lib/types";
import { useRealtimePosts } from "@/hooks/useRealtimePosts";
import PostCard from "./PostCard";
import PostComposer from "./PostComposer";
import AgentChatbox from "./AgentChatbox";
import PinnedAnchor from "./PinnedAnchor";
import TypingIndicator from "./TypingIndicator";

interface ClusterFeedProps {
  initialPosts: PostWithAuthor[];
  userId: string;
}

const PINNED_COLLAPSED_KEY = "aggilo:pinned_anchor_collapsed";

export default function ClusterFeed({ initialPosts, userId }: ClusterFeedProps) {
  const realtimePosts = useRealtimePosts(initialPosts);
  const [optimisticPosts, setOptimisticPosts] = useState<PostWithAuthor[]>([]);

  const posts = [
    ...realtimePosts,
    ...optimisticPosts.filter(
      (op) => !realtimePosts.some((rp) => rp.id === op.id)
    ),
  ];

  // ── Scroll to top of feed after the user posts ─────────────────
  // With reverse-chrono layout, the user's new post appears at the TOP
  // of the feed (just below the agent chatbox). After submitting, we
  // scroll the page to the top so they see their post land.
  // We only do this on the user's own post (optimistic), not on every
  // realtime arrival — a sudden jump while reading older content is jarring.
  const feedTopRef = useRef<HTMLDivElement>(null);

  const handleOptimisticPost = useCallback((post: PostWithAuthor) => {
    setOptimisticPosts((prev) => [...prev, post]);
    // Scroll to top of feed after a short tick so the DOM has updated
    setTimeout(() => {
      feedTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, []);

  const handleReplaceOptimistic = useCallback((tempId: string) => {
    setOptimisticPosts((prev) => prev.filter((p) => p.id !== tempId));
  }, []);

  const handleRemoveOptimistic = useCallback((tempId: string) => {
    setOptimisticPosts((prev) => prev.filter((p) => p.id !== tempId));
  }, []);

  const [replyTo, setReplyTo] = useState<string | null>(null);

  /**
   * Layout & ordering (V3.1 senior-UX correction)
   *
   * The cluster reads as a feed, not a synchronous chat. Members visit
   * periodically and want to see what's NEW first, scroll for context.
   *
   * Top-level ordering rule:
   *   - Pinned anchor (Sage's seed message): extracted from the feed,
   *     shown collapsed above the agent chatbox. Default expanded on
   *     first visit, collapsed thereafter (preference saved per device).
   *   - Latest top-level post first (reverse-chronological)
   *   - Older top-level posts on scroll
   *
   * Replies inside a thread: oldest-first (a conversation reads
   * top-to-bottom inside its container).
   */
  const allTopLevel = posts.filter((p) => !p.parent_id);
  const allReplies = posts.filter((p) => p.parent_id);

  // The pinned anchor is the FIRST sage post by created_at (the seed)
  const pinnedAnchor =
    allTopLevel
      .filter((p) => p.is_sage)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )[0] || null;

  // Top-level feed: NEWEST first, exclude the pinned anchor
  const topLevelFeed = allTopLevel
    .filter((p) => !pinnedAnchor || p.id !== pinnedAnchor.id)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  // Replies grouped by parent, oldest first within each thread
  const replyMap = new Map<string, PostWithAuthor[]>();
  allReplies
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    .forEach((reply) => {
      const existing = replyMap.get(reply.parent_id!) || [];
      existing.push(reply);
      replyMap.set(reply.parent_id!, existing);
    });

  const threads: PostWithReplies[] = topLevelFeed.map((post) => ({
    ...post,
    replies: replyMap.get(post.id) || [],
  }));

  // ── Pinned anchor collapsed state ───────────────────────────────
  const [anchorCollapsed, setAnchorCollapsed] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(PINNED_COLLAPSED_KEY);
    setAnchorCollapsed(saved === "1");
  }, []);

  function toggleAnchor() {
    setAnchorCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem(PINNED_COLLAPSED_KEY, next ? "1" : "0");
      }
      return next;
    });
  }

  // ── Scroll anchor for newest post arrivals ──────────────────────
  // With reverse-chrono, the newest top-level post appears at the TOP
  // of the feed (just below the agent chatbox). We don't auto-scroll —
  // a sudden viewport jump while the user is reading older content is
  // jarring. Instead we rely on the realtime arrival being visually
  // visible at the top after the chatbox.
  const newPostAnchorRef = useRef<HTMLDivElement>(null);

  const handleReply = useCallback((postId: string) => {
    setReplyTo(postId);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  return (
    <>
      {/*
       * Pinned anchor (Sage's seed) — sits above the agent chatbox.
       * Collapsed by default after first visit (preference per device).
       * Tap to expand/collapse.
       */}
      {pinnedAnchor && (
        <PinnedAnchor
          post={pinnedAnchor}
          collapsed={anchorCollapsed}
          onToggle={toggleAnchor}
        />
      )}

      {/*
       * Agent Collaboration Chatbox — cool slate/cyan palette.
       * Visually distinct from the warm emerald pinned anchor above it.
       * Live exchanges from Supabase realtime; seed is fallback only.
       */}
      <div className="bg-slate-50 border-b border-slate-200">
        <AgentChatbox clusterName="Sisters in Dua" clusterId="the_single_source" />
      </div>

      <div ref={newPostAnchorRef} />

      {/* feedTopRef: scroll target after user posts — lands just above the newest post */}
      <div ref={feedTopRef} />

      <div className="bg-white">
        <div className="max-w-4xl mx-auto">
          {threads.length === 0 ? (
            <div className="text-center py-16 px-4">
              <p className="text-4xl mb-4">🤲</p>
              <p className="text-gray-500 text-lg mb-2">
                Assalamu Alaikum, sister.
              </p>
              <p className="text-gray-400 text-sm">
                Share what&apos;s on your heart. This room is yours.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {threads.map((thread) => (
                <PostCard
                  key={thread.id}
                  post={thread}
                  replies={thread.replies}
                  onReply={handleReply}
                  pinned={false}
                  allPosts={posts}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/*
       * Composer — sticky at the bottom of the viewport, always reachable.
       * Reverse-chrono feed places new posts at the top; the composer
       * stays at the bottom for thumb-zone reachability and natural
       * "type → send" flow.
       */}
      <div className="sticky bottom-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.05)]">
        <TypingIndicator />
        <PostComposer
          userId={userId}
          replyTo={replyTo}
          onCancelReply={handleCancelReply}
          placeholder="Share what's on your heart, ask a question, or just talk..."
          onOptimisticPost={handleOptimisticPost}
          onReplaceOptimistic={handleReplaceOptimistic}
          onRemoveOptimistic={handleRemoveOptimistic}
        />
      </div>
    </>
  );
}
