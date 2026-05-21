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

  const feedTopRef = useRef<HTMLDivElement>(null);

  const handleOptimisticPost = useCallback((post: PostWithAuthor) => {
    setOptimisticPosts((prev) => [...prev, post]);
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
        <PinnedAnchor
          post={pinnedAnchor}
          collapsed={anchorCollapsed}
          onToggle={toggleAnchor}
        />
      )}

      {/* feedTopRef: scroll target after user posts */}
      <div ref={feedTopRef} />

      {/*
       * Timeline — the conversation. This is the room.
       * Immediately visible after the pinned anchor.
       * No agent surfaces between here and the compose bar.
       */}
      <div className="bg-white">
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
                  pinned={false}
                  allPosts={posts}
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
      <div className="bg-slate-50 border-t border-slate-200 border-b border-b-slate-200">
        <AgentChatbox clusterName="Sisters in Dua" clusterId="the_single_source" />
      </div>

      {/*
       * Compose bar — sticky at the bottom, always reachable.
       * The most important interactive surface in the room.
       */}
      <div className="sticky bottom-0 z-40">
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
