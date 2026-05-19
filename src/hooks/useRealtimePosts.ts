"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { PostWithAuthor } from "@/lib/types";
import type {
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
} from "@supabase/supabase-js";
import type { Post } from "@/lib/types";

/**
 * Subscribes to live changes on the posts table.
 *
 * Events:
 *   - INSERT  → new post lands at the bottom
 *   - UPDATE  → handoff stamps and thread_state changes flow into the
 *               existing card without a refresh (powers the
 *               "Clio is following up privately" inline note)
 *
 * Belt-and-braces: a 4-second polling loop also refreshes the post list
 * for the first 30 seconds after mount AND whenever a new post lands.
 * This catches any post that was inserted server-side (Sage replies,
 * autonomous dua posts) when realtime is slow to deliver — common on
 * cold connections or networks with WebSocket flakiness.
 *
 * Realtime publication and REPLICA IDENTITY FULL on `posts` are configured
 * by mvp/supabase/APPLY_NOW.sql §8.
 */
export function useRealtimePosts(initialPosts: PostWithAuthor[]) {
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const lastPollRef = useRef<number>(Date.now());
  const lastSeenIdsRef = useRef<Set<string>>(
    new Set(initialPosts.map((p) => p.id))
  );

  const handleNewPost = useCallback(
    async (payload: RealtimePostgresInsertPayload<Post>) => {
      const newRow = payload.new;
      if (!newRow?.id) return;

      lastSeenIdsRef.current.add(newRow.id);

      setPosts((current) => {
        if (current.some((p) => p.id === newRow.id)) return current;
        return [
          ...current,
          {
            ...newRow,
            sage_handoff_to_clio_at: newRow.sage_handoff_to_clio_at ?? null,
            sage_handoff_reason: newRow.sage_handoff_reason ?? null,
            profiles: null,
          } as PostWithAuthor,
        ];
      });

      // Best-effort enrich with the joined profile
      try {
        const supabase = createClient();
        const { data: fullPost } = await supabase
          .from("posts")
          .select("*, profiles(*)")
          .eq("id", newRow.id)
          .single();

        if (fullPost) {
          setPosts((current) =>
            current.map((p) =>
              p.id === fullPost.id ? (fullPost as PostWithAuthor) : p
            )
          );
        }
      } catch {
        /* keep the bare row */
      }
    },
    []
  );

  const handleUpdatedPost = useCallback(
    (payload: RealtimePostgresUpdatePayload<Post>) => {
      const updated = payload.new;
      if (!updated?.id) return;
      setPosts((current) =>
        current.map((p) =>
          p.id === updated.id
            ? {
                ...p,
                ...updated,
              }
            : p
        )
      );
    },
    []
  );

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`posts-realtime-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        handleNewPost
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        handleUpdatedPost
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("[realtime] posts channel:", status);
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleNewPost, handleUpdatedPost]);

  // Polling fallback — fetches posts created since lastPollRef.
  // Runs every 4 seconds. Catches Sage replies / autonomous posts when
  // realtime delivery is delayed or the WebSocket is throttled.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      const since = new Date(lastPollRef.current - 1000).toISOString();
      lastPollRef.current = Date.now();
      try {
        const { data } = await supabase
          .from("posts")
          .select("*, profiles(*)")
          .gte("created_at", since)
          .order("created_at", { ascending: true });

        if (data && data.length > 0) {
          setPosts((current) => {
            const map = new Map(current.map((p) => [p.id, p]));
            for (const row of data as PostWithAuthor[]) {
              if (!map.has(row.id)) {
                lastSeenIdsRef.current.add(row.id);
                map.set(row.id, row);
              } else {
                // Merge updates (sage_handoff_to_clio_at etc.)
                map.set(row.id, { ...map.get(row.id)!, ...row });
              }
            }
            return Array.from(map.values()).sort(
              (a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
        }
      } catch {
        /* silent — realtime channel is the primary path */
      }
    }

    const interval = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return posts;
}
