"use client";

/**
 * ClusterFeed — Long Conversation.
 *
 * The Timeline. Renders top-level posts chronologically (oldest first)
 * with their replies grouped underneath. The realtime hook keeps new
 * arrivals in sync — both top-level posts and replies flow in via the
 * same posts channel filtered by cluster_id.
 *
 * Empty state is intentionally quiet — the room belongs to whoever
 * speaks first.
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRealtimePosts } from "@/hooks/useRealtimePosts";
import PostCard from "./PostCard";
import PostComposer from "./PostComposer";
import type { PostWithAuthor, Profile } from "@/lib/types";
import { withBasePath } from "@/lib/path";

interface ClusterFeedProps {
  initialPosts: PostWithAuthor[];
  userId: string;
  profile: Profile;
}

export default function ClusterFeed({
  initialPosts,
  userId,
  profile,
}: ClusterFeedProps) {
  const { posts, addOptimisticPost, replaceOptimisticPost, updatePost, pollForSageReply } =
    useRealtimePosts({ initialPosts });

  // Track which top-level post IDs are awaiting a Sage response.
  const [sageThinkingPosts, setSageThinkingPosts] = useState<Set<string>>(
    new Set()
  );

  const handleSageInvoked = useCallback(
    (threadRootId: string) => {
      setSageThinkingPosts((prev) => new Set(prev).add(threadRootId));
      // Start polling fallback — clear indicator when done regardless.
      void pollForSageReply(threadRootId).finally(() => {
        setSageThinkingPosts((prev) => {
          const next = new Set(prev);
          next.delete(threadRootId);
          return next;
        });
      });
    },
    [pollForSageReply]
  );

  // Auto-clear thinking indicator when a Sage reply arrives via
  // Realtime (before the polling fallback catches it).
  useEffect(() => {
    if (sageThinkingPosts.size === 0) return;
    const sageReplies = posts.filter(
      (p) => p.is_sage && p.parent_id && sageThinkingPosts.has(p.parent_id)
    );
    if (sageReplies.length > 0) {
      setSageThinkingPosts((prev) => {
        const next = new Set(prev);
        for (const r of sageReplies) {
          if (r.parent_id) next.delete(r.parent_id);
        }
        return next;
      });
    }
  }, [posts, sageThinkingPosts]);

  // Group posts into top-level threads with their replies. A reply's
  // parent is found by matching parent_id; orphan replies (parent
  // missing because of late-arriving realtime) are rendered as
  // top-level so nothing disappears from the feed.
  const { topLevel, repliesByParent } = useMemo(() => {
    const repliesByParent = new Map<string, PostWithAuthor[]>();
    const topLevel: PostWithAuthor[] = [];

    for (const post of posts) {
      if (post.parent_id === null) {
        topLevel.push(post);
      } else {
        const list = repliesByParent.get(post.parent_id) ?? [];
        list.push(post);
        repliesByParent.set(post.parent_id, list);
      }
    }

    // Replies arrive via realtime in the order they were written.
    // Sort each replies list by created_at so the optimistic insert
    // and the server confirmation always render in the right order.
    for (const list of repliesByParent.values()) {
      list.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }

    // Also handle orphans — replies whose parent isn't in the current
    // post set. Render them as top-level so nothing is lost.
    const topLevelIds = new Set(topLevel.map((p) => p.id));
    for (const [parentId, list] of repliesByParent.entries()) {
      if (!topLevelIds.has(parentId)) {
        for (const reply of list) topLevel.push(reply);
      }
    }
    topLevel.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return { topLevel, repliesByParent };
  }, [posts]);

  return (
    <>
      <div
        id="lc-cluster-timeline"
        className="max-w-3xl mx-auto px-4 py-6 space-y-3"
      >
        {topLevel.length === 0 ? (
          <div className="bg-lc-card border border-stone-200 rounded-lg p-8 flex flex-col items-center justify-center text-center">
            <div className="relative w-16 h-16 mb-4">
              <img src={withBasePath("/characters/clio.png")} alt="Clio" className="object-contain w-full h-full drop-shadow-md" />
            </div>
            <p className="text-sm font-medium text-lc-ink mb-1">
              I am working on finding the crowd for this room.
            </p>
            <p className="text-xs text-lc-muted/80 max-w-sm">
              The room belongs to whoever speaks first. Feel free to use the share button above to invite others.
            </p>
          </div>
        ) : (
          topLevel.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              replies={repliesByParent.get(post.id) ?? []}
              userId={userId}
              currentProfile={profile}
              onOptimisticReply={addOptimisticPost}
              onConfirmReply={replaceOptimisticPost}
              onPostEdited={updatePost}
              sageThinking={sageThinkingPosts.has(post.id)}
              onSageInvoked={handleSageInvoked}
            />
          ))
        )}
      </div>

      <PostComposer
        userId={userId}
        profile={profile}
        onOptimisticPost={addOptimisticPost}
        onConfirmPost={replaceOptimisticPost}
        onSageInvoked={handleSageInvoked}
      />
    </>
  );
}
