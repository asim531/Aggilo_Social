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

  // Tracks IDs of posts the viewer has deleted. The merged posts list
  // filters these out so the card vanishes immediately on delete without
  // waiting for a Realtime DELETE event (which requires REPLICA IDENTITY
  // FULL + DELETE in the publication — not guaranteed in Phase 0).
  // Declared early so the `posts` computation below can read deletedIds.
  const deletedIdsRef = useRef<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const posts = [
    ...realtimePosts,
    ...optimisticPosts.filter(
      (op) => !realtimePosts.some((rp) => rp.id === op.id)
    ),
  ].filter((p) => !deletedIds.has(p.id) && !deletedIds.has(p.parent_id ?? ""));

  const feedTopRef = useRef<HTMLDivElement>(null);

  /**
   * "↑ New posts" pill state.
   *
   * Tracks new posts that arrived via realtime while the viewer was
   * scrolled down, so the pill nudges them back to the top instead of
   * silently inserting content above the fold. The pill is dismissed when
   * the viewer scrolls back near the top, or taps the pill.
   *
   * Threshold: dynamic, computed from the actual position of `feedTopRef`.
   * If the feed-top is below the viewport, the viewer is genuinely
   * scrolled down and pill-arrival is useful. If the feed-top is in the
   * viewport, new posts are visible already and the pill would be noise.
   * (This replaces a constant 320px threshold that fired falsely on
   * tall headers.)
   *
   * `seenPostsRef` carries the IDs the viewer has already "seen" — i.e.
   * those visible at the top of the feed when the user is near the top.
   * Anything new beyond that count when the user is scrolled down counts
   * as "new posts arrived".
   */
  const seenPostIdsRef = useRef<Set<string>>(
    new Set(initialPosts.map((p) => p.id))
  );
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [scrolledDown, setScrolledDown] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const topEl = feedTopRef.current;
      // The feedTopRef anchor sits at the top of the timeline. When its
      // top edge has scrolled above the viewport (with a 32px tolerance
      // to avoid flicker at the boundary), the viewer is genuinely past
      // the feed and a new-posts pill is useful. While the anchor is
      // still in view, new posts are visible already.
      const isDown = topEl
        ? topEl.getBoundingClientRect().top < -32
        : false;
      setScrolledDown(isDown);
      if (!isDown) {
        // Back near the top — clear the pill and absorb the new IDs.
        setNewPostsCount(0);
        for (const p of posts) seenPostIdsRef.current.add(p.id);
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run once on mount so initial scroll position is reflected.
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [posts]);

  useEffect(() => {
    if (!scrolledDown) {
      // Always keep seen-set in sync when user is near the top.
      for (const p of posts) seenPostIdsRef.current.add(p.id);
      return;
    }
    // Count new top-level posts only — replies under existing threads
    // shouldn't trigger the "scroll up to see new content" pill.
    let unseen = 0;
    for (const p of posts) {
      if (p.parent_id) continue;
      if (!seenPostIdsRef.current.has(p.id)) unseen++;
    }
    setNewPostsCount(unseen);
  }, [posts, scrolledDown]);

  const handleNewPostsPill = useCallback(() => {
    feedTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setNewPostsCount(0);
    for (const p of posts) seenPostIdsRef.current.add(p.id);
  }, [posts]);

  const handleOptimisticPost = useCallback((post: PostWithAuthor) => {
    setOptimisticPosts((prev) => [...prev, post]);
    seenPostIdsRef.current.add(post.id);
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

  // Called by PostCard after a successful DB delete.
  // Removes the post and any of its replies from the visible feed.
  const handleDeletePost = useCallback((postId: string) => {
    deletedIdsRef.current.add(postId);
    setDeletedIds(new Set(deletedIdsRef.current));
    setOptimisticPosts((prev) => prev.filter((p) => p.id !== postId && p.parent_id !== postId));
  }, []);

  const [replyTo, setReplyTo] = useState<string | null>(null);

  /**
   * Layout hierarchy (V3.2 — hierarchy-first correction)
   *
   * The correct hierarchy for this product:
   *   1. The members and their conversation  ← the reason the room exists
   *   2. The room's verified knowledge base  ← what grounds the conversation
   *   3. The agents                          ← what serves the conversation
   *
   * Previous layout had Agent Thoughts ABOVE the timeline, which put the
   * agents between the room's identity and the room's conversation. That
   * communicates the wrong priority order and risks members adapting their
   * behaviour to provoke agent dialogue rather than connecting with each other.
   *
   * New layout:
   *   - Pinned anchor (Sage's seed) — room's founding statement, near the top
   *   - Timeline — the conversation, immediately visible
   *   - Agent Thoughts — below the timeline, accessible by scrolling
   *
   * Agent Thoughts is still always present and reachable. It's just no longer
   * in the path between the member and the conversation.
   */
  const allTopLevel = posts.filter((p) => !p.parent_id);
  const allReplies = posts.filter((p) => p.parent_id);

  const pinnedAnchor =
    allTopLevel
      .filter((p) => p.is_sage)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )[0] || null;

  const topLevelFeed = allTopLevel
    .filter((p) => !pinnedAnchor || p.id !== pinnedAnchor.id)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

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

  const [anchorCollapsed, setAnchorCollapsed] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(PINNED_COLLAPSED_KEY);
    // Default collapsed unless user has explicitly expanded (saved === "0")
    setAnchorCollapsed(saved !== "0");
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

  const handleReply = useCallback((postId: string) => {
    setReplyTo(postId);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  return (
    <>
      {/*
       * Pinned anchor — the room's founding statement.
       * Collapsed by default. Minimal strip when collapsed.
       * Sits at the top because it's the room's identity, not an agent artefact.
       */}
      {pinnedAnchor && (
        <div id="aggilo-pinned-anchor">
          <PinnedAnchor
            post={pinnedAnchor}
            collapsed={anchorCollapsed}
            onToggle={toggleAnchor}
          />
        </div>
      )}

      {/* feedTopRef: scroll target after user posts */}
      <div ref={feedTopRef} className="scroll-mt-24" />

      {/*
       * "↑ New posts" pill — appears when the viewer is scrolled down and
       * new top-level posts have arrived via realtime. Tapping returns
       * the viewer to the top of the feed and clears the pill. Sits below
       * the navbar and above the timeline so it never overlaps content.
       *
       * aria-live="polite": screen readers announce the count change
       * without interrupting the current reading flow. role="status"
       * marks it as a non-urgent live region. The button itself stays
       * the interactive affordance for sighted users.
       */}
      {scrolledDown && newPostsCount > 0 && (
        <div
          className="sticky top-14 z-30 flex justify-center pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <button
            type="button"
            onClick={handleNewPostsPill}
            className="pointer-events-auto mt-2 px-4 py-1.5 rounded-full bg-aggilo-deep text-white text-xs font-medium shadow-lg hover:bg-aggilo-deep/90 transition-colors flex items-center gap-1.5"
            aria-label={`${newPostsCount === 1 ? "1 new post — tap to view" : `${newPostsCount} new posts — tap to view`}`}
          >
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
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
            <span>
              {newPostsCount === 1
                ? "1 new post"
                : `${newPostsCount} new posts`}
            </span>
          </button>
        </div>
      )}

      {/*
       * Timeline — the conversation. This is the room.
       * Immediately visible after the pinned anchor.
       * No agent surfaces between here and the compose bar.
       */}
      <div className="bg-white" id="aggilo-cluster-timeline" tabIndex={-1}>
        <div className="max-w-4xl mx-auto">
          {threads.length === 0 ? (
            <div className="text-center py-16 px-4">
              <p className="text-4xl mb-4">🤲</p>
              <p className="text-gray-600 text-lg mb-2 font-medium">
                Assalamu Alaikum, sister.
              </p>
              <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
                This room is yours. Share what&apos;s on your heart — a question,
                a reflection, something you&apos;ve been sitting with.
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
                  onDelete={handleDeletePost}
                  pinned={false}
                  allPosts={posts}
                  currentUserId={userId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/*
       * Agent Thoughts — below the timeline.
       *
       * The agents are working on this room, but they are not the room.
       * Placing them here communicates the correct hierarchy: members first,
       * agents in service. Members who want to see what the agents are
       * thinking can scroll down. Members who just want to talk don't have
       * to pass through the agent layer to get to the conversation.
       *
       * The strip label makes the nature explicit: "working on this room"
       * — not "the conversation" — so members understand what they're
       * looking at if they do scroll down.
       */}
      <div className="bg-slate-50 border-t border-slate-200 border-b border-b-slate-200" id="aggilo-room-workshop">
        <AgentChatbox clusterName="Sisters in Dua" clusterId="the_single_source" />
      </div>

      {/*
       * Compose bar — sticky at the bottom, always reachable.
       * The most important interactive surface in the room.
       */}
      <div className="sticky bottom-0 z-40" id="aggilo-compose-bar">
        <TypingIndicator />
        <PostComposer
          userId={userId}
          replyTo={replyTo}
          onCancelReply={handleCancelReply}
          // Placeholder intentionally short — falls through to the
          // daily-rotating nudge selected per user inside PostComposer.
          // Long, comma-strung placeholders truncate on small inputs.
          placeholder="Share what's on your heart…"
          onOptimisticPost={handleOptimisticPost}
          onReplaceOptimistic={handleReplaceOptimistic}
          onRemoveOptimistic={handleRemoveOptimistic}
        />
      </div>
    </>
  );
}
