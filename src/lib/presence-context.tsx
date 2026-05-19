"use client";

/**
 * Cluster presence context.
 *
 * One Supabase Realtime presence channel per cluster, subscribed once
 * in ClusterShell. Two consumers:
 *   - ClusterPresence (header) — shows live count
 *   - PostCard — shows online dot next to each nickname
 *
 * Centralising prevents duplicate channel subscriptions (which would
 * double-count the local user) and keeps the source of truth in one place.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "./supabase-browser";

interface PresenceContextValue {
  onlineUserIds: Set<string>;
  liveCount: number;
}

const PresenceContext = createContext<PresenceContextValue>({
  onlineUserIds: new Set(),
  liveCount: 0,
});

const PRESENCE_CHANNEL = "cluster:the_single_source:presence";

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

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        // presenceState() returns { [userId]: [{...}] }
        setOnlineUserIds(new Set(Object.keys(state)));
      })
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
    };
  }, [userId, nickname]);

  const value = useMemo<PresenceContextValue>(
    () => ({
      onlineUserIds,
      liveCount: onlineUserIds.size || 1,
    }),
    [onlineUserIds]
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
