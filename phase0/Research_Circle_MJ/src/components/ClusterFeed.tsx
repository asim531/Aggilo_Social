"use client";

/**
 * ClusterFeed — Research Circle MJ.
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
import type { PostWithAuthor, Profile, Topic } from "@/lib/types";
import { withBasePath } from "@/lib/path";
import { createClient } from "@/lib/supabase-browser";

interface ClusterFeedProps {
  initialPosts: PostWithAuthor[];
  userId: string;
  profile: Profile;
  activeTopic?: Topic | null;
  readingFilter?: "unread" | "reading" | "read" | null;
  sortOrder?: "oldest" | "newest";
  onSelectTopic?: (topic: Topic | null) => void;
}

export default function ClusterFeed({
  initialPosts,
  userId,
  profile,
  activeTopic,
  readingFilter,
  sortOrder = "oldest",
  onSelectTopic,
}: ClusterFeedProps) {
  const { posts, addOptimisticPost, replaceOptimisticPost, updatePost, pollForSageReply } =
    useRealtimePosts({ initialPosts });
  const [matchingPostIds, setMatchingPostIds] = useState<Set<string> | null>(null);
  const [topicPostIds, setTopicPostIds] = useState<Set<string> | null>(null);
  const supabase = createClient();

  // Track which top-level post IDs are awaiting a Sage response.
  const [sageThinkingPosts, setSageThinkingPosts] = useState<Set<string>>(
    new Set()
  );

  // Fetch matching post IDs when readingFilter changes
  useEffect(() => {
    if (!readingFilter) {
      setMatchingPostIds(null);
      return;
    }

    async function fetchMatching() {
      const { data: rows } = await supabase
        .from("paper_reading_status")
        .select("attachment_id")
        .eq("user_id", userId)
        .eq("status", readingFilter);

      const attachmentIds = (rows ?? []).map((r: { attachment_id: string }) => r.attachment_id);
      if (attachmentIds.length === 0) {
        setMatchingPostIds(new Set());
        return;
      }

      // Batch into chunks of 100 to stay within PostgREST limits
      const postIds = new Set<string>();
      for (let i = 0; i < attachmentIds.length; i += 100) {
        const chunk = attachmentIds.slice(i, i + 100);
        const { data: attRows } = await supabase
          .from("post_attachments")
          .select("post_id")
          .in("id", chunk);
        for (const r of attRows ?? []) {
          if (r.post_id) postIds.add(r.post_id);
        }
      }
      setMatchingPostIds(postIds);
    }

    fetchMatching();
  }, [readingFilter, userId]);

  // Fetch posts that belong to the active topic
  useEffect(() => {
    if (!activeTopic) {
      setTopicPostIds(null);
      return;
    }

    const topicId = activeTopic.id;
    async function fetchTopicPosts() {
      const { data: rows } = await supabase
        .from("post_topics")
        .select("post_id")
        .eq("topic_id", topicId);

      const ids = new Set((rows ?? []).map((r: { post_id: string }) => r.post_id));
      setTopicPostIds(ids);
    }

    fetchTopicPosts();
  }, [activeTopic]);

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

    // Apply reading status filter: only posts whose attachments match
    if (readingFilter && matchingPostIds) {
      const filtered = topLevel.filter((p) => matchingPostIds.has(p.id));
      if (sortOrder === "newest") filtered.reverse();
      return { topLevel: filtered, repliesByParent };
    }

    // Apply topic filter: only posts linked to the active topic
    if (activeTopic && topicPostIds) {
      const filtered = topLevel.filter((p) => topicPostIds.has(p.id));
      if (sortOrder === "newest") filtered.reverse();
      return { topLevel: filtered, repliesByParent };
    }

    if (sortOrder === "newest") topLevel.reverse();

    return { topLevel, repliesByParent };
  }, [posts, readingFilter, matchingPostIds, sortOrder, activeTopic, topicPostIds]);

  return (
    <>
      <div
        id="husl-cluster-timeline"
        className="max-w-3xl mx-auto px-4 py-6 space-y-3"
      >
        {topLevel.length === 0 ? (
          activeTopic ? (
            <div className="bg-husl-card dark:bg-[#14161a] border border-stone-200 dark:border-stone-800 rounded-lg p-6 text-center transition-colors">
              <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
                No posts tagged with <span className="font-semibold text-husl-ink dark:text-white">{activeTopic.name}</span> yet.
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                Be the first to post about this topic, or pick another from the bar above.
              </p>
            </div>
          ) : readingFilter ? (
            <div className="bg-husl-card dark:bg-[#14161a] border border-stone-200 dark:border-stone-800 rounded-lg p-6 text-center transition-colors">
              <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
                No papers marked as <span className="capitalize font-semibold text-husl-ink dark:text-white">{readingFilter}</span>
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                Try a different filter, or mark papers using the dropdown on any paper card.
              </p>
            </div>
          ) : (
            <div className="bg-husl-card dark:bg-[#14161a] border border-stone-200 dark:border-stone-800 rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors">
              <div className="relative w-16 h-16 mb-4">
                <img src={withBasePath("/characters/clio.png")} alt="Clio" className="object-contain w-full h-full drop-shadow-md" />
              </div>
              <p className="text-sm font-medium text-husl-ink dark:text-white mb-1">
                I am working on finding the crowd for this room.
              </p>
              <p className="text-xs text-husl-muted/80 dark:text-stone-500 max-w-sm">
                The room belongs to whoever speaks first. Feel free to use the share button above to invite others.
              </p>
            </div>
          )
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
              onSelectTopic={onSelectTopic}
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
        activeTopic={activeTopic}
      />
    </>
  );
}
