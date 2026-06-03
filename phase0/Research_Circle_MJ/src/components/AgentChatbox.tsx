"use client";

/**
 * Agent Collaboration Chatbox — Research Circle MJ.
 *
 * Live exchanges between Clio and Sage about this cluster. Members can
 * read the agents' working dialogue as it happens. Minimisable; minimised
 * state persists per device via localStorage.
 *
 * The exchanges live in the shared `agent_chatbox_exchanges` table,
 * filtered by cluster_id. Realtime subscription delivers new rows
 * without a refresh. Until the cadence-exchange worker has produced
 * a real row, a single seed exchange (in the research-cohort register)
 * holds the surface so it's never empty.
 *
 * Spec: docs/AGENT_COLLABORATION_CHATBOX.md
 *
 * LC color tokens used:
 *   husl-clio (amber)  — Clio's voice
 *   husl-sage (teal)   — Sage's voice
 *   stone neutrals   — chrome
 */

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase-browser";
import { CLUSTER_ID } from "@/lib/cluster";
import { withBasePath } from "@/lib/path";
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
      <div className="max-w-3xl mx-auto px-4 py-2 flex justify-center">
        <button
          onClick={handleToggleMinimize}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200 text-xs hover:bg-stone-100 transition-colors"
          aria-expanded={false}
          aria-controls="husl-room-workshop-panel"
          title="What Clio and Sage are working on for this room."
        >
          <svg className="w-3.5 h-3.5 text-husl-sage shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-husl-muted text-[11px]">
            Room Workshop
          </span>
          {newExchangeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-husl-clio text-white text-[10px] font-semibold shrink-0">
              {newExchangeCount}
            </span>
          )}
          <svg
            className="w-3 h-3 text-stone-400 shrink-0"
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
      </div>
    );
  }

  // ── Expanded state ─────────────────────────────────────────────
  return (
    <>
      <div
        id="husl-room-workshop-panel"
        className="w-full max-w-3xl mx-auto bg-stone-50 dark:bg-[#14161a] border-y border-stone-200 dark:border-stone-700 px-4 py-3 transition-colors"
        role="region"
        aria-label="Room Workshop — Clio and Sage working on the room"
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-4 h-4 text-husl-sage shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-husl-ink dark:text-stone-200">
              Room Workshop
            </span>
            <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-husl-clio dark:text-amber-400 text-[9px] font-semibold uppercase tracking-wide border border-amber-200 dark:border-amber-800">
              Live
            </span>
          </div>
          <button
            onClick={handleToggleMinimize}
            className="text-stone-400 dark:text-stone-500 hover:text-husl-ink dark:hover:text-white text-base leading-none shrink-0 transition-colors"
            aria-label="Minimise Room Workshop"
            title="Minimise"
          >
            —
          </button>
        </div>

        <p className="text-[11px] text-husl-muted dark:text-stone-400 leading-snug mb-2.5">
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
                  !isLatest ? "opacity-70 pb-2 border-b border-stone-200/60 dark:border-stone-700/60" : ""
                }`}
              >
                <div className="flex gap-2 text-xs items-start">
                  <div className="relative w-5 h-5 shrink-0 mt-0.5 rounded-full overflow-hidden bg-husl-sageSoft">
                    <img src={withBasePath("/characters/sage.png")} alt="Sage" className="object-contain w-full h-full" />
                  </div>
                  <p className="text-husl-ink dark:text-stone-200 line-clamp-3 leading-relaxed flex-1">
                    {exc.sage_message}
                  </p>
                </div>
                <div className="flex gap-2 text-xs items-start">
                  <div className="relative w-5 h-5 shrink-0 mt-0.5 rounded-full overflow-hidden bg-husl-clioSoft">
                    <img src={withBasePath("/characters/clio.png")} alt="Clio" className="object-contain w-full h-full" />
                  </div>
                  <p className="text-husl-ink dark:text-stone-200 line-clamp-3 leading-relaxed flex-1">
                    {exc.clio_message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-husl-muted dark:text-stone-400">
          <span>{formatRelativeTime(latestExchange.created_at)}</span>
          <button
            onClick={() => setShowFullHistory(true)}
            className="text-husl-clio dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium transition-colors"
          >
            See full workshop →
          </button>
        </div>

        {latestExchange.observe_mode && (
          <div className="mt-2 px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-700 dark:text-amber-400">
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
        className="bg-husl-card w-full sm:max-w-lg sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-stone-50 border-b border-stone-200 px-4 py-3 flex items-center gap-2">
          <span className="text-husl-clio">🛠️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-husl-ink">Room Workshop · Dialogue</p>
            <p className="text-[10px] uppercase tracking-wide text-husl-muted font-medium">
              What we&apos;re working on · most recent first
            </p>
          </div>
          <a
            href={withBasePath("/cluster/features")}
            className="text-xs text-husl-clio hover:text-amber-700 font-medium"
          >
            Tools &amp; features →
          </a>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-husl-ink text-xl ml-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {reverseOrdered.length === 0 && (
            <p className="text-sm text-husl-muted text-center py-8">
              Nothing here yet. Clio and Sage will surface tools and features
              as they figure out what this room could gain.
            </p>
          )}
          {reverseOrdered.map((exc) => (
            <div key={exc.id} className="border-l-2 border-husl-clio pl-3">
              <div className="flex items-center gap-2 mb-2 text-[11px] text-husl-muted">
                <span className="font-semibold text-husl-ink">
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
                <p className="text-[11px] italic text-husl-muted mb-2">
                  Trigger: {exc.triggering_observation}
                </p>
              )}

              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-husl-sage mb-0.5">
                    Sage
                  </p>
                  <p className="text-sm text-husl-ink leading-relaxed">
                    {exc.sage_message}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-husl-clio mb-0.5">
                    Clio
                  </p>
                  <p className="text-sm text-husl-ink leading-relaxed">
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
