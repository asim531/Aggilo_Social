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

import { useMemo } from "react";
import { useRealtimePosts } from "@/hooks/useRealtimePosts";
import PostCard from "./PostCard";
import PostComposer from "./PostComposer";
import type { PostWithAuthor, Profile } from "@/lib/types";

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
  const { posts, addOptimisticPost, replaceOptimisticPost } = useRealtimePosts({
    initialPosts,
  });

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
          <div className="bg-lc-card border border-dashed border-stone-300 rounded-lg p-8 text-center">
            <p className="text-sm text-lc-muted">
              Nobody&apos;s set the tone yet.
            </p>
            <p className="text-xs text-lc-muted/80 mt-2">
              Sage will be here. The room belongs to whoever speaks first.
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
            />
          ))
        )}
      </div>

      <PostComposer
        userId={userId}
        profile={profile}
        onOptimisticPost={addOptimisticPost}
        onConfirmPost={replaceOptimisticPost}
      />
    </>
  );
}
