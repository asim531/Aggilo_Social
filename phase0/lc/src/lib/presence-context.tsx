"use client";

/**
 * Cluster presence + typing context.
 *
 * One Supabase Realtime channel per cluster, subscribed once in
 * ClusterShell. Two surfaces:
 *
 *   1. Presence (who's online) — used by ClusterPresence (header)
 *      and PostCard (online dot).
 *   2. Typing broadcast — used by PostComposer (sends "typing")
 *      and ClusterFeed (renders "a sister is writing…").
 *
 * Centralising prevents duplicate channel subscriptions (which would
 * double-count the local user) and keeps the source of truth in one place.
 *
 * Privacy: typing broadcasts contain only user_id (and only in-memory).
 * No nicknames are exposed in the UI for typing — readers see only an
 * anonymised "a sister is writing…" message. This matches the platform's
 * privacy posture for tender disclosures.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "./supabase-browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface PresenceContextValue {
  onlineUserIds: Set<string>;
  liveCount: number;
  /** How many members are currently typing (excluding the local user). */
  typingCount: number;
  /** Local user broadcasts that they are typing. Auto-clears after 4s. */
  emitTyping: () => void;
}

const PresenceContext = createContext<PresenceContextValue>({
  onlineUserIds: new Set(),
  liveCount: 0,
  typingCount: 0,
  emitTyping: () => {},
});

const PRESENCE_CHANNEL = "cluster:the_single_source:presence";
const TYPING_TTL_MS = 4000;

interface PresenceProviderProps {
  userId: string;
  nickname: string;
  children: ReactNode;
}

export function PresenceProvider({
  userId,
  nickname,
  children,
}: PresenceProviderProps) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(
    () => new Set([userId])
  );
  // Map of userId → expiry timestamp. We re-evaluate the set each render
  // and prune expired entries so the typing indicator clears on its own.
  const [typingMap, setTypingMap] = useState<Map<string, number>>(
    () => new Map()
  );
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastEmitRef = useRef<number>(0);

  // Presence + typing channel
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: userId } },
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineUserIds(new Set(Object.keys(state)));
      })
      .on(
        "broadcast",
        { event: "typing" },
        (msg: { payload: { user_id: string } }) => {
          const otherId = msg.payload?.user_id;
          if (!otherId || otherId === userId) return;
          setTypingMap((prev) => {
            const next = new Map(prev);
            next.set(otherId, Date.now() + TYPING_TTL_MS);
            return next;
          });
        }
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: userId,
            nickname,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId, nickname]);

  // Prune expired typing entries every 1s
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingMap((prev) => {
        const now = Date.now();
        let changed = false;
        const next = new Map(prev);
        for (const [id, expiry] of next) {
          if (expiry <= now) {
            next.delete(id);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Throttle emitTyping to once per 2s — avoid spamming the channel
  const emitTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastEmitRef.current < 2000) return;
    lastEmitRef.current = now;
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: userId },
    });
  }, [userId]);

  const value = useMemo<PresenceContextValue>(
    () => ({
      onlineUserIds,
      liveCount: onlineUserIds.size || 1,
      typingCount: typingMap.size,
      emitTyping,
    }),
    [onlineUserIds, typingMap, emitTyping]
  );

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence(): PresenceContextValue {
  return useContext(PresenceContext);
}
