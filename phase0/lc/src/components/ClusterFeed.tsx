"use client";

/**
 * ClusterFeed — Long Conversation.
 *
 * The Timeline. Renders posts chronologically (oldest first, like a
 * conversation thread), with the realtime hook keeping new arrivals
 * in sync. Empty state is intentionally quiet — Sage's seed question
 * is rendered as her first post, and the compose bar's placeholder
 * does the rest of the inviting.
 */

import { useRealtimePosts } from "@/hooks/useRealtimePosts";
import PostCard from "./PostCard";
import PostComposer from "./PostComposer";
import type { PostWithAuthor, Profile } from "@/lib/types";

interface ClusterFeedProps {
  initialPosts: PostWithAuthor[];
  userId: string;
  profile: Profile;
}

export default function ClusterFeed({ initialPosts, userId, profile }: ClusterFeedProps) {
  const { posts, addOptimisticPost, replaceOptimisticPost } = useRealtimePosts({
    initialPosts,
  });

  const topLevelPosts = posts.filter((p) => p.parent_id === null);

  return (
    <>
      <div
        id="lc-cluster-timeline"
        className="max-w-3xl mx-auto px-4 py-6 space-y-3"
      >
        {topLevelPosts.length === 0 ? (
          <div className="bg-lc-card border border-dashed border-stone-300 rounded-lg p-8 text-center">
            <p className="text-sm text-lc-muted">
              Nobody&apos;s set the tone yet.
            </p>
            <p className="text-xs text-lc-muted/80 mt-2">
              Sage will be here. The room belongs to whoever speaks first.
            </p>
          </div>
        ) : (
          topLevelPosts.map((post) => <PostCard key={post.id} post={post} />)
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
