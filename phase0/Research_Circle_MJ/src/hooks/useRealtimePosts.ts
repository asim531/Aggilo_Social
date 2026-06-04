"use client";

/**
 * useRealtimePosts — Research Circle MJ.
 *
 * Subscribes to Supabase Realtime INSERT and UPDATE events on the
 * `posts` table, filtered by cluster_id. Maintains a list of posts in
 * client state and applies optimistic updates from the composer.
 *
 * Two channels are needed because Supabase realtime filters apply per
 * channel: one for INSERT (new posts arriving), one for UPDATE (post
 * mutations like Sage handoff annotations, which Research Circle MJ
 * doesn't use yet but the hook is built ready).
 */

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import { CLUSTER_ID } from "@/lib/cluster";
import type { PostWithAuthor } from "@/lib/types";

interface UseRealtimePostsArgs {
  initialPosts: PostWithAuthor[];
}

export function useRealtimePosts({ initialPosts }: UseRealtimePostsArgs) {
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);

  // Replace local state if the server-provided initial list changes
  // (e.g. on hot reload). In normal use this fires once.
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const insertPost = useCallback((post: PostWithAuthor) => {
    setPosts((prev) => {
      // Dedupe — realtime + optimistic insert can race
      if (prev.some((p) => p.id === post.id)) return prev;
      return [...prev, post].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  }, []);

  const updatePost = useCallback((post: Partial<PostWithAuthor> & { id: string }) => {
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, ...post } : p)));
  }, []);

  const removePost = useCallback((id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Optimistic-update helper used by the composer.
  const addOptimisticPost = useCallback(
    (post: PostWithAuthor) => {
      insertPost(post);
    },
    [insertPost]
  );

  // Replace an optimistic post (temporary id) with the server-confirmed one.
  const replaceOptimisticPost = useCallback(
    (tempId: string, confirmed: PostWithAuthor) => {
      setPosts((prev) => {
        const withoutTemp = prev.filter((p) => p.id !== tempId);
        if (withoutTemp.some((p) => p.id === confirmed.id)) return withoutTemp;
        return [...withoutTemp, confirmed].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
    },
    []
  );

  // Realtime subscriptions.
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`posts:${CLUSTER_ID}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: `cluster_id=eq.${CLUSTER_ID}`,
        },
        async (payload) => {
          const newRow = payload.new as PostWithAuthor;
          // Notify the tab badge (no extra channel — single dispatch here).
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("lc:new-post", {
                detail: { authorId: newRow.author_id ?? null },
              })
            );
          }
          // Hydrate the author profile — INSERT events don't include joined rows.
          if (newRow.author_id && !newRow.profiles) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", newRow.author_id)
              .eq("cluster_id", CLUSTER_ID)
              .maybeSingle();
            insertPost({ ...newRow, profiles: profile ?? null });
          } else {
            insertPost(newRow);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "posts",
          filter: `cluster_id=eq.${CLUSTER_ID}`,
        },
        (payload) => {
          updatePost(payload.new as PostWithAuthor);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "posts",
          filter: `cluster_id=eq.${CLUSTER_ID}`,
        },
        (payload) => {
          const oldRow = payload.old as { id?: string };
          if (oldRow.id) removePost(oldRow.id);
        }
      )
      .subscribe((status) => {
        console.log("[realtime] channel status:", status);
        if (status === "SUBSCRIBED") {
          console.log("[realtime] channel subscribed — live updates active");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [insertPost, updatePost, removePost]);

  // Polling fallback for all posts. Realtime may silently fail when
  // the table isn't published for replication or RLS blocks events.
  // Poll every 5s for posts newer than the latest we have.
  useEffect(() => {
    const supabase = createClient();
    const interval = setInterval(async () => {
      const latest = posts.reduce(
        (max, p) => (p.created_at > max ? p.created_at : max),
        "1970-01-01T00:00:00Z"
      );
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("cluster_id", CLUSTER_ID)
        .gt("created_at", latest)
        .order("created_at", { ascending: true })
        .limit(20);
      if (data && data.length > 0) {
        for (const row of data) {
          const post = row as PostWithAuthor;
          if (post.author_id && !post.profiles) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", post.author_id)
              .eq("cluster_id", CLUSTER_ID)
              .maybeSingle();
            insertPost({ ...post, profiles: profile ?? null });
          } else {
            insertPost(post);
          }
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [posts, insertPost]);

  // Polling fallback for Sage replies. Realtime may silently fail for
  // admin-inserted rows (service role bypasses RLS; Realtime RLS may
  // filter them out). Poll every 3s for up to 30s after @Sage is invoked.
  const pollForSageReply = useCallback(
    async (parentId: string): Promise<boolean> => {
      const supabase = createClient();
      const start = Date.now();
      const POLL_INTERVAL = 3000;
      const POLL_TIMEOUT = 30000;

      while (Date.now() - start < POLL_TIMEOUT) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL));
        const { data } = await supabase
          .from("posts")
          .select("*")
          .eq("cluster_id", CLUSTER_ID)
          .eq("parent_id", parentId)
          .eq("is_sage", true)
          .order("created_at", { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          const sagePost = data[0] as PostWithAuthor;
          // Only insert if we don't already have it (Realtime may have
          // delivered it first).
          insertPost(sagePost);
          return true;
        }
      }
      return false;
    },
    [insertPost]
  );

  return {
    posts,
    addOptimisticPost,
    replaceOptimisticPost,
    updatePost,
    pollForSageReply,
  };
}
