"use client";

/**
 * Agent Collaboration Chatbox — Long Conversation.
 *
 * Live exchanges between Clio and Sage about this cluster. Members can
 * read the agents' working dialogue as it happens. Minimisable; minimised
 * state persists per device via localStorage.
 *
 * The exchanges live in the shared `agent_chatbox_exchanges` table,
 * filtered by cluster_id. Realtime subscription delivers new rows
 * without a refresh. Until the cadence-exchange worker has produced
 * a real row, a single seed exchange (in LC's intimacy register)
 * holds the surface so it's never empty.
 *
 * Spec: docs/AGENT_COLLABORATION_CHATBOX.md
 *
 * LC color tokens used:
 *   lc-clio (amber)  — Clio's voice
 *   lc-sage (teal)   — Sage's voice
 *   stone neutrals   — chrome
 */

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { CLUSTER_ID } from "@/lib/cluster";
import {
  AgentChatboxExchange,
  SEED_CHATBOX_EXCHANGES,
  formatRelativeTime,
} from "@/lib/agent-chatbox-seed";

const MINIMIZED_KEY = "lc:agent_chatbox_minimized";
const LAST_VIEWED_KEY = "lc:agent_chatbox_last_viewed";

interface DbExchange {
  id: string;
  exchange_number: number;
  trigger_type: string;
  triggering_observation: string | null;
  sage_message: string;
  clio_message: string;
  observe_mode: boolean;
  features_proposed: string[];
  features_activated: string[];
  sage_message_at: string;
  clio_message_at: string;
  created_at: string;
}

function dbToExchange(row: DbExchange): AgentChatboxExchange {
  return {
    id: row.id,
    exchange_number: row.exchange_number,
    trigger_type: row.trigger_type as AgentChatboxExchange["trigger_type"],
    triggering_observation: row.triggering_observation || "",
    sage_message: row.sage_message,
    clio_message: row.clio_message,
    sage_message_at: row.sage_message_at,
    clio_message_at: row.clio_message_at,
    observe_mode: row.observe_mode,
    features_proposed: row.features_proposed || [],
    features_activated: row.features_activated || [],
    created_at: row.created_at,
  };
}

export default function AgentChatbox() {
  const clusterId = CLUSTER_ID;
  const [minimized, setMinimized] = useState(true);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [lastViewed, setLastViewed] = useState(0);
  const [exchanges, setExchanges] = useState<AgentChatboxExchange[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Restore minimized state — DEFAULT IS COLLAPSED for a calmer first
  // impression. Members who want the dialogue can expand once and the
  // choice persists for that device.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedMin = localStorage.getItem(`${MINIMIZED_KEY}:${clusterId}`);
    setMinimized(storedMin === null ? true : storedMin === "true");
    const storedView = localStorage.getItem(`${LAST_VIEWED_KEY}:${clusterId}`);
    setLastViewed(storedView ? parseInt(storedView, 10) : 0);
  }, [clusterId]);

  // Initial fetch. RLS allows authenticated SELECT; the app filters
  // by cluster_id explicitly.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("agent_chatbox_exchanges")
          .select("*")
          .eq("cluster_id", clusterId)
          .order("created_at", { ascending: true });

        if (cancelled) return;

        if (data && data.length > 0) {
          setExchanges(data.map(dbToExchange));
        } else {
          setExchanges(SEED_CHATBOX_EXCHANGES);
        }
      } catch {
        if (!cancelled) setExchanges(SEED_CHATBOX_EXCHANGES);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clusterId]);

  // Realtime: new exchanges flow in without a refresh. Filter applies
  // server-side via the channel filter.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const supabase = createClient();
    const channel = supabase
      .channel(`agent-chatbox-${clusterId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agent_chatbox_exchanges",
          filter: `cluster_id=eq.${clusterId}`,
        },
        (payload: { new: DbExchange }) => {
          setExchanges((prev) => {
            // First real exchange replaces the seed fallback.
            const realOnly = prev.filter((e) => !e.id.startsWith("exc-00"));
            if (realOnly.some((e) => e.id === payload.new.id)) return prev;
            return [...realOnly, dbToExchange(payload.new)];
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [clusterId]);

  function handleToggleMinimize() {
    const next = !minimized;
    setMinimized(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(`${MINIMIZED_KEY}:${clusterId}`, String(next));
    }
    void import("@/lib/track").then(({ track }) =>
      track(next ? "workshop_minimized" : "workshop_opened")
    );
  }

  // Mark exchanges as viewed when the panel opens.
  useEffect(() => {
    if (!minimized && exchanges.length > 0) {
      const latest = exchanges[exchanges.length - 1].exchange_number;
      if (latest > lastViewed) {
        setLastViewed(latest);
        if (typeof window !== "undefined") {
          localStorage.setItem(
            `${LAST_VIEWED_KEY}:${clusterId}`,
            String(latest)
          );
        }
      }
    }
  }, [minimized, exchanges, lastViewed, clusterId]);

  const latestExchange = exchanges[exchanges.length - 1];
  const newExchangeCount = useMemo(() => {
    if (!exchanges.length) return 0;
    return exchanges.filter((e) => e.exchange_number > lastViewed).length;
  }, [exchanges, lastViewed]);

  if (!loaded || !latestExchange) return null;

  const PREVIEW_COUNT = 3;
  const previewExchanges = exchanges.slice(-PREVIEW_COUNT);

  // ── Minimized state ────────────────────────────────────────────
  if (minimized) {
    return (
      <button
        onClick={handleToggleMinimize}
        className="w-full max-w-3xl mx-auto px-4 py-2 bg-stone-50 border-y border-stone-200 flex items-center gap-2 text-xs hover:bg-stone-100 transition-colors"
        aria-expanded={false}
        aria-controls="lc-room-workshop-panel"
        title="What Clio and Sage are working on for this room."
      >
        <span className="text-lc-clio text-base shrink-0" aria-hidden="true">
          🛠️
        </span>
        <span className="text-lc-muted text-[11px] text-left flex-1 truncate">
          Room Workshop — what Clio &amp; Sage are working on
        </span>
        {newExchangeCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-lc-clio text-white text-[10px] font-semibold shrink-0">
            {newExchangeCount} new
          </span>
        )}
        <svg
          className="w-3.5 h-3.5 text-stone-400 shrink-0 rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    );
  }

  // ── Expanded state ─────────────────────────────────────────────
  return (
    <>
      <div
        id="lc-room-workshop-panel"
        className="w-full max-w-3xl mx-auto bg-stone-50 border-y border-stone-200 px-4 py-3"
        role="region"
        aria-label="Room Workshop — Clio and Sage working on the room"
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lc-clio text-base shrink-0" aria-hidden="true">
            🛠️
          </span>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-lc-ink">
              Room Workshop
            </span>
            <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-50 text-lc-clio text-[9px] font-semibold uppercase tracking-wide border border-amber-200">
              Live
            </span>
          </div>
          <button
            onClick={handleToggleMinimize}
            className="text-stone-400 hover:text-lc-ink text-base leading-none shrink-0"
            aria-label="Minimise Room Workshop"
            title="Minimise"
          >
            —
          </button>
        </div>

        <p className="text-[11px] text-lc-muted leading-snug mb-2.5">
          Clio &amp; Sage working on what this room could gain — tools they
          run, features for the room.
        </p>

        {/* Recent exchanges */}
        <div
          className={`space-y-3 ${
            previewExchanges.length > 1
              ? "max-h-48 overflow-y-auto pr-1 -mr-1"
              : ""
          }`}
        >
          {previewExchanges.map((exc, idx) => {
            const isLatest = idx === previewExchanges.length - 1;
            return (
              <div
                key={exc.id}
                className={`space-y-1.5 ${
                  !isLatest ? "opacity-70 pb-2 border-b border-stone-200/60" : ""
                }`}
              >
                <div className="flex gap-2 text-xs">
                  <span className="font-semibold text-lc-sage shrink-0">
                    Sage:
                  </span>
                  <p className="text-lc-ink line-clamp-3 leading-relaxed">
                    {exc.sage_message}
                  </p>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="font-semibold text-lc-clio shrink-0">
                    Clio:
                  </span>
                  <p className="text-lc-ink line-clamp-3 leading-relaxed">
                    {exc.clio_message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-lc-muted">
          <span>{formatRelativeTime(latestExchange.created_at)}</span>
          <button
            onClick={() => setShowFullHistory(true)}
            className="text-lc-clio hover:text-amber-700 font-medium"
          >
            See full workshop →
          </button>
        </div>

        {latestExchange.observe_mode && (
          <div className="mt-2 px-2 py-1 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-700">
            Our current tools are doing their job — nothing new to ship right
            now.
          </div>
        )}
      </div>

      {showFullHistory && (
        <FullHistorySheet
          exchanges={exchanges}
          onClose={() => setShowFullHistory(false)}
        />
      )}
    </>
  );
}

function FullHistorySheet({
  exchanges,
  onClose,
}: {
  exchanges: AgentChatboxExchange[];
  onClose: () => void;
}) {
  const reverseOrdered = [...exchanges].reverse();
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-lc-card w-full sm:max-w-lg sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-stone-50 border-b border-stone-200 px-4 py-3 flex items-center gap-2">
          <span className="text-lc-clio">🛠️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-lc-ink">Room Workshop</p>
            <p className="text-[10px] uppercase tracking-wide text-lc-muted font-medium">
              What we&apos;re working on · most recent first
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-lc-ink text-xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {reverseOrdered.length === 0 && (
            <p className="text-sm text-lc-muted text-center py-8">
              Nothing here yet. Clio and Sage will surface tools and features
              as they figure out what this room could gain.
            </p>
          )}
          {reverseOrdered.map((exc) => (
            <div key={exc.id} className="border-l-2 border-lc-clio pl-3">
              <div className="flex items-center gap-2 mb-2 text-[11px] text-lc-muted">
                <span className="font-semibold text-lc-ink">
                  Exchange #{exc.exchange_number}
                </span>
                <span>·</span>
                <span>{formatRelativeTime(exc.created_at)}</span>
                {exc.observe_mode && (
                  <span className="ml-auto px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                    observing
                  </span>
                )}
              </div>

              {exc.triggering_observation && (
                <p className="text-[11px] italic text-lc-muted mb-2">
                  Trigger: {exc.triggering_observation}
                </p>
              )}

              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-lc-sage mb-0.5">
                    Sage
                  </p>
                  <p className="text-sm text-lc-ink leading-relaxed">
                    {exc.sage_message}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-lc-clio mb-0.5">
                    Clio
                  </p>
                  <p className="text-sm text-lc-ink leading-relaxed">
                    {exc.clio_message}
                  </p>
                </div>
              </div>

              {exc.features_activated.length > 0 && (
                <div className="mt-2 px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700">
                  Features activated: {exc.features_activated.join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
