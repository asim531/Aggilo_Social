"use client";

/**
 * Agent Collaboration Chatbox
 *
 * Live exchanges between Clio and Sage about this cluster. Members can
 * read the agents' working dialogue as it happens. Minimizable; minimized
 * state persists per device via localStorage.
 *
 * V3.1: Replaced hardcoded seed exchanges with live database-backed
 * exchanges. Sage writes a row whenever an action she takes involves
 * collaborating with Clio (e.g. an autonomous dua proposal that Clio
 * reviews, or a handoff where Sage delegates a private follow-up).
 * The chatbox subscribes to Supabase realtime — new exchanges appear
 * without a refresh.
 *
 * Spec: docs/AGENT_COLLABORATION_CHATBOX.md
 *       architecture/system_implementation_prompt_part4.md §24
 */

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import {
  AgentChatboxExchange,
  SEED_CHATBOX_EXCHANGES,
  formatRelativeTime,
} from "@/lib/agent-chatbox-seed";

interface AgentChatboxProps {
  clusterName?: string;
  clusterId?: string;
}

const MINIMIZED_KEY = "aggilo:agent_chatbox_minimized";
const LAST_VIEWED_KEY = "aggilo:agent_chatbox_last_viewed";

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

export default function AgentChatbox({
  clusterName = "Sisters in Dua",
  clusterId = "the_single_source",
}: AgentChatboxProps) {
  const [minimized, setMinimized] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [lastViewed, setLastViewed] = useState(0);
  const [exchanges, setExchanges] = useState<AgentChatboxExchange[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Restore minimized state
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedMin = localStorage.getItem(`${MINIMIZED_KEY}:${clusterId}`);
    setMinimized(storedMin === "true");
    const storedView = localStorage.getItem(`${LAST_VIEWED_KEY}:${clusterId}`);
    setLastViewed(storedView ? parseInt(storedView, 10) : 0);
  }, [clusterId]);

  // Initial fetch from the live table
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
          // Fallback to seed exchanges so the chatbox is never empty
          // before the first real exchange fires. The seed file ships
          // with timestamps relative to "now" so they don't read as stale.
          setExchanges(SEED_CHATBOX_EXCHANGES);
        }
      } catch {
        // Table may not exist yet — fall back to seed
        if (!cancelled) setExchanges(SEED_CHATBOX_EXCHANGES);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clusterId]);

  // Realtime: new exchanges flow in without a refresh
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
            // First real exchange replaces the seed fallback
            const realOnly = prev.filter(
              (e) => !e.id.startsWith("exc-00")
            );
            if (realOnly.some((e) => e.id === payload.new.id)) return prev;
            return [...realOnly, dbToExchange(payload.new)];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clusterId]);

  function handleToggleMinimize() {
    const next = !minimized;
    setMinimized(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(`${MINIMIZED_KEY}:${clusterId}`, String(next));
    }
    void import("@/lib/track").then(({ track }) =>
      track(next ? "agent_thoughts_minimized" : "agent_thoughts_opened", { cluster_id: clusterId })
    );
  }

  // Mark exchanges as viewed when the panel opens
  useEffect(() => {
    if (!minimized && exchanges.length > 0) {
      const latest = exchanges[exchanges.length - 1].exchange_number;
      if (latest > lastViewed) {
        setLastViewed(latest);
        if (typeof window !== "undefined") {
          localStorage.setItem(`${LAST_VIEWED_KEY}:${clusterId}`, String(latest));
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

  // Show the most recent N exchanges in the inline preview (scrollable
  // when count exceeds 2). Full history available via "See full discussion".
  const PREVIEW_COUNT = 3;
  const previewExchanges = exchanges.slice(-PREVIEW_COUNT);

  // ── Minimized state ──────────────────────────────────────────────
  if (minimized) {
    return (
      <button
        onClick={handleToggleMinimize}
        className="w-full max-w-4xl mx-auto px-4 py-2.5 bg-slate-50 border-b border-slate-200
                   flex items-center gap-2 text-xs hover:bg-slate-100 transition-colors"
      >
        <span className="text-cyan-600 text-base shrink-0">🔵</span>
        <span className="text-slate-700 font-medium">Agent Thoughts</span>
        {newExchangeCount > 0 && (
          <span className="ml-auto px-1.5 py-0.5 rounded-full bg-cyan-600 text-white text-[10px] font-semibold">
            {newExchangeCount} new
          </span>
        )}
        <svg className="w-3.5 h-3.5 ml-auto text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }

  // ── Expanded state ───────────────────────────────────────────────
  return (
    <>
      <div
        className="w-full max-w-4xl mx-auto bg-slate-50 border-b border-slate-200 px-4 py-3"
        role="region"
        aria-label="Clio and Sage collaboration"
      >
        {/* Header — cool slate/cyan palette, clearly different from emerald anchor */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-cyan-600 text-base shrink-0">🔵</span>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-slate-800">
              Agent Thoughts — Clio &amp; Sage
            </span>
            <span className="ml-2 px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 text-[9px] font-semibold uppercase tracking-wide">
              Live
            </span>
          </div>
          <button
            onClick={handleToggleMinimize}
            className="text-slate-400 hover:text-slate-600 text-base leading-none shrink-0"
            aria-label="Minimize chatbox"
            title="Minimize"
          >
            —
          </button>
        </div>

        <p className="text-[10px] uppercase tracking-wide text-cyan-700/60 font-medium mb-2.5">
          Agent Thoughts · visible to all members
        </p>

        {/* Recent exchanges — vertical scroll once we have multiple */}
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
                  !isLatest ? "opacity-70 pb-2 border-b border-sky-200/50" : ""
                }`}
              >
                <div className="flex gap-2 text-xs">
                  <span className="font-semibold text-aggilo-sage shrink-0">Sage:</span>
                  <p className="text-gray-700 line-clamp-3 leading-relaxed">
                    {exc.sage_message}
                  </p>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="font-semibold text-amber-600 shrink-0">Clio:</span>
                  <p className="text-gray-700 line-clamp-3 leading-relaxed">
                    {exc.clio_message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
          <span>{formatRelativeTime(latestExchange.created_at)}</span>
          <button
            onClick={() => setShowFullHistory(true)}
            className="text-cyan-700 hover:text-cyan-900 font-medium"
          >
            See all thoughts →
          </button>
        </div>

        {latestExchange.observe_mode && (
          <div className="mt-2 px-2 py-1 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-700">
            Both agents are observing for now — no immediate action.
          </div>
        )}
      </div>

      {showFullHistory && (
        <FullHistorySheet
          exchanges={exchanges}
          clusterName={clusterName}
          onClose={() => setShowFullHistory(false)}
        />
      )}
    </>
  );
}

function FullHistorySheet({
  exchanges,
  clusterName,
  onClose,
}: {
  exchanges: AgentChatboxExchange[];
  clusterName: string;
  onClose: () => void;
}) {
  const reverseOrdered = [...exchanges].reverse();
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl flex flex-col
                   max-h-[85vh] sm:max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-sky-50 border-b border-sky-100 px-4 py-3 flex items-center gap-2">
          <span className="text-sky-700">🔵</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">
              Agent Thoughts — {clusterName}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-cyan-700/70 font-medium">
              Clio &amp; Sage · most recent first
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {reverseOrdered.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">
              🌱 Nothing here yet. Sage and Clio are getting to know this community.
            </p>
          )}
          {reverseOrdered.map((exc) => (
            <div key={exc.id} className="border-l-2 border-cyan-600 pl-3">
              <div className="flex items-center gap-2 mb-2 text-[11px] text-gray-500">
                <span className="font-semibold text-gray-700">
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
                <p className="text-[11px] italic text-gray-500 mb-2">
                  Trigger: {exc.triggering_observation}
                </p>
              )}

              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-aggilo-sage mb-0.5">Sage</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {exc.sage_message}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-600 mb-0.5">Clio</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
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
