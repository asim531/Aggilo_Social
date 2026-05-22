"use client";

/**
 * Clio FAB — dual-tab surface (V3.1)
 *
 * One Clio. Two lenses.
 *
 *   Tab "Just Clio · forgets"  (default inside a cluster)
 *     - Private to the user. Clio knows nothing but what is said here.
 *     - Storage class: NON-PII. Content lives in browser sessionStorage,
 *       clears at 12h. The platform retains only session metadata
 *       (count, welfare flag, duration) — never content.
 *     - Endpoint: /api/clio/ephemeral  (no cluster context)
 *     - This is where Sage→Clio soft handoff greetings land.
 *
 *   Tab "Just Clio · remembers"  (AMA — opt-in via tab switch)
 *     - Private to the cluster, but Clio is reading the room AND
 *       remembers what you tell her so she can serve you better next
 *       time. Cluster-aware suggestions grounded in what is actually
 *       happening in the room.
 *     - Storage class: PII. Persistent — Clio uses these conversations
 *       to learn your preferences, recurring questions, and what helps.
 *     - Endpoint: /api/clio/chat       (cluster-aware)
 *
 * Both tabs are private to the user. Neither posts to Timeline. Neither
 * shares with Sage or other members. The user's tab choice is visible
 * only to them. The privacy difference is in storage class, made
 * explicit in the tab banner.
 *
 * Spec: clio/CLIO_UNIFIED_CLUSTER_PRESENCE.md (v1.1 Two-Lens addendum)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  CLIO_THINKING_CLUSTER,
  CLIO_THINKING_EPHEMERAL,
  currentPhrase,
} from "@/lib/thinking-messages";
import { createClient } from "@/lib/supabase-browser";
import {
  toneColorForReason,
  type HandoffReason,
} from "@/lib/handoff-greetings";
import ClioTour, { type TourStep } from "./ClioTour";

type ClioTab = "private" | "cluster";
type ToneColor = "rose" | "amber" | "indigo";

interface ClioFabProps {
  userId: string;
  clusterName?: string;
  /** When inside a cluster, the FAB is 40px top-right and shows both tabs. */
  inCluster?: boolean;
}

interface ClioMessage {
  role: "user" | "clio";
  content: string;
  timestamp: number;
  /** True for the auto-greeting from a Sage→Clio handoff */
  isHandoffGreeting?: boolean;
  /** DB id of the handoff greeting record — used to mark seen / dismissed */
  handoffGreetingId?: string;
  /** Drives bubble tone (rose / amber / indigo). Reason itself is never shown. */
  handoffTone?: ToneColor;
  /** True once the user has replied or explicitly closed the greeting */
  handoffClosed?: boolean;
}

const TYPING_DOTS_DELAY_MS = 300;

// ── Storage classes ──────────────────────────────────────────────────────
//
// Privacy is the load-bearing distinction between the two tabs. We name
// it explicitly in storage so the boundary is impossible to forget.
//
 //   "Just Clio · forgets"   → NON-PII   → sessionStorage, 12h TTL, never on server
//   "Just Clio · remembers" → PII       → localStorage,   persistent, syncs to server
//                                          (server persistence is post-MVP)
//
// MVP behavior: the AMA tab persists across browser sessions on this device
// via localStorage. When the server-side `clio_conversations` worker ships
// (architecture Part 4 §13.3), localStorage becomes a write-through cache
// and the conversations sync to the user's profile.

const PRIVATE_MSG_KEY = "clio_private_messages";          // sessionStorage
const PRIVATE_EXPIRY_KEY = "clio_private_expiry";          // sessionStorage
const PRIVATE_TTL_MS = 12 * 60 * 60 * 1000;
const CLUSTER_MSG_KEY = "aggilo:clio_ama_messages";        // localStorage (PII)

function loadPrivateMessages(): ClioMessage[] {
  if (typeof window === "undefined") return [];
  const expiry = sessionStorage.getItem(PRIVATE_EXPIRY_KEY);
  if (expiry && Date.now() > parseInt(expiry, 10)) {
    sessionStorage.removeItem(PRIVATE_MSG_KEY);
    sessionStorage.removeItem(PRIVATE_EXPIRY_KEY);
    return [];
  }
  const raw = sessionStorage.getItem(PRIVATE_MSG_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function savePrivateMessages(msgs: ClioMessage[]) {
  if (typeof window === "undefined") return;
  if (!sessionStorage.getItem(PRIVATE_EXPIRY_KEY)) {
    sessionStorage.setItem(PRIVATE_EXPIRY_KEY, String(Date.now() + PRIVATE_TTL_MS));
  }
  sessionStorage.setItem(PRIVATE_MSG_KEY, JSON.stringify(msgs));
}

function loadClusterMessages(): ClioMessage[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CLUSTER_MSG_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function saveClusterMessages(msgs: ClioMessage[]) {
  if (typeof window === "undefined") return;
  // Cap the AMA history at the most recent 100 messages so localStorage
  // doesn't grow unbounded on heavy users.
  const capped = msgs.length > 100 ? msgs.slice(-100) : msgs;
  localStorage.setItem(CLUSTER_MSG_KEY, JSON.stringify(capped));
}

export default function ClioFab({
  userId,
  clusterName = "Sisters in Dua",
  inCluster = false,
}: ClioFabProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ClioTab>("private"); // default = Just Clio · forgets
  const [thinking, setThinking] = useState(false);
  const [showDots, setShowDots] = useState(false);
  const [thinkingPhrase, setThinkingPhrase] = useState("");
  const [showTakingMoment, setShowTakingMoment] = useState(false);
  const [hasUnreadHandoff, setHasUnreadHandoff] = useState(false);
  // Anchored tour state. null = closed; numeric index = active step.
  // Owned at the FAB level (not inside the help section) so that tour
  // navigation persists across panel close/reopen, and so the same list
  // of surfaces feeds both the help section and the tour — single
  // source of truth, no duplicate copy.
  const [tourIndex, setTourIndex] = useState<number | null>(null);

  // Separate message threads per tab — they are different relationships.
  const [privateMessages, setPrivateMessages] = useState<ClioMessage[]>([
    {
      role: "clio",
      content:
        "Private to you. This conversation auto-deletes after 12 hours and nothing reaches the platform. What's on your mind?",
      timestamp: Date.now(),
    },
  ]);
  const [clusterMessages, setClusterMessages] = useState<ClioMessage[]>([
    {
      role: "clio",
      content: `Assalamu Alaikum. Private to you, and I remember our conversations so I can serve you better next time. Ask me anything about ${clusterName} — what Sage meant, how this space works, whether something has been discussed before.`,
      timestamp: Date.now(),
    },
  ]);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dotsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load persisted threads
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedPrivate = loadPrivateMessages();
    if (storedPrivate.length > 0) setPrivateMessages(storedPrivate);

    const storedCluster = loadClusterMessages();
    if (storedCluster.length > 0) setClusterMessages(storedCluster);
  }, [inCluster]);

  // Persist threads
  useEffect(() => { savePrivateMessages(privateMessages); }, [privateMessages]);
  useEffect(() => { saveClusterMessages(clusterMessages); }, [clusterMessages]);

  // Pull any pending Sage→Clio handoff greeting into the private tab.
  // The greeting is private — it lands in "Just between us" as the most
  // recent Clio message and the FAB shows a soft red dot.
  //
  // Two channels feed the greeting into the UI:
  //   1. Initial pull on mount (covers handoffs queued before the user
  //      opened this tab)
  //   2. Realtime subscription on clio_handoff_greetings INSERT events
  //      filtered to this user (covers handoffs that fire while the
  //      user is sitting in the cluster)
  const ingestGreeting = useCallback(
    (greeting: {
      id: string;
      greeting_text: string;
      handoff_reason: HandoffReason | string;
      created_at: string;
    }) => {
      setPrivateMessages((prev) => {
        const alreadyHave = prev.some(
          (m) => m.handoffGreetingId === greeting.id
        );
        if (alreadyHave) return prev;
        return [
          ...prev,
          {
            role: "clio",
            content: greeting.greeting_text,
            timestamp: new Date(greeting.created_at).getTime(),
            isHandoffGreeting: true,
            handoffGreetingId: greeting.id,
            handoffTone: toneColorForReason(greeting.handoff_reason),
          },
        ];
      });
      setHasUnreadHandoff(true);
    },
    []
  );

  // Initial pull on mount
  const fetchHandoff = useCallback(async () => {
    if (typeof window === "undefined") return;
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("clio_handoff_greetings")
        .select("id, greeting_text, handoff_reason, created_at")
        .eq("user_id", userId)
        .is("greeting_dismissed_at", null)
        .order("created_at", { ascending: true })
        .limit(5);

      (data || []).forEach(ingestGreeting);
    } catch {
      // Table may not exist yet — silent
    }
  }, [userId, ingestGreeting]);

  useEffect(() => {
    fetchHandoff();
  }, [fetchHandoff]);

  // Realtime subscription for handoffs queued while the user is here
  useEffect(() => {
    if (typeof window === "undefined") return;
    const supabase = createClient();

    const channel = supabase
      .channel(`clio-handoffs-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "clio_handoff_greetings",
          filter: `user_id=eq.${userId}`,
        },
        (payload: {
          new: {
            id: string;
            greeting_text: string;
            handoff_reason: HandoffReason | string;
            created_at: string;
          };
        }) => {
          ingestGreeting(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, ingestGreeting]);

  const messages = tab === "private" ? privateMessages : clusterMessages;
  const setMessages = tab === "private" ? setPrivateMessages : setClusterMessages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, showDots, tab]);

  // Thinking phrase rotation
  useEffect(() => {
    if (thinking) {
      const startTime = Date.now();
      dotsTimerRef.current = setTimeout(() => setShowDots(true), TYPING_DOTS_DELAY_MS);
      const phrases = tab === "private" ? CLIO_THINKING_EPHEMERAL : CLIO_THINKING_CLUSTER;
      const phraseInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const { text, takingMoment } = currentPhrase(phrases, elapsed, 1800);
        setThinkingPhrase(text);
        setShowTakingMoment(takingMoment);
      }, 200);
      const initial = currentPhrase(phrases, 0, 1800);
      setThinkingPhrase(initial.text);

      return () => {
        if (dotsTimerRef.current) clearTimeout(dotsTimerRef.current);
        clearInterval(phraseInterval);
      };
    } else {
      if (dotsTimerRef.current) clearTimeout(dotsTimerRef.current);
      setShowDots(false);
      setShowTakingMoment(false);
      setThinkingPhrase("");
    }
  }, [thinking, tab]);

  // Mark handoff seen when user opens the private tab. Seeing is not
  // engagement — the greeting stays open until the user replies or
  // explicitly closes it. We just stop the rose dot from glowing.
  useEffect(() => {
    if (open && tab === "private" && hasUnreadHandoff) {
      setHasUnreadHandoff(false);
      const supabase = createClient();
      supabase
        .from("clio_handoff_greetings")
        .update({ greeting_seen_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("greeting_seen_at", null)
        .then(() => {});
    }
  }, [open, tab, hasUnreadHandoff, userId]);

  async function handleSend() {
    if (!input.trim() || thinking) return;

    void import("@/lib/track").then(({ track }) =>
      track("clio_message_sent", { tab, len: input.trim().length })
    );

    const userMsg: ClioMessage = {
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);

    // ── Auto-mark handoff greetings as responded ─────────────────────
    // If the user replies in the private tab, every still-open handoff
    // greeting closes naturally — engagement is the most graceful
    // dismissal. We mark all of them, not just the most recent, so a
    // user who waited through several signals before replying isn't
    // left with stale "Close this for now" buttons.
    if (isPrivate) {
      const openHandoffs = privateMessages.filter(
        (m) => m.isHandoffGreeting && !m.handoffClosed && m.handoffGreetingId
      );
      if (openHandoffs.length > 0) {
        const ids = openHandoffs
          .map((m) => m.handoffGreetingId)
          .filter((id): id is string => Boolean(id));
        setPrivateMessages((prev) =>
          prev.map((m) =>
            m.isHandoffGreeting && !m.handoffClosed
              ? { ...m, handoffClosed: true }
              : m
          )
        );
        try {
          const supabase = createClient();
          await supabase
            .from("clio_handoff_greetings")
            .update({ greeting_responded_at: new Date().toISOString() })
            .in("id", ids);
        } catch {
          // Silent
        }
      }
    }

    try {
      const endpoint = tab === "private" ? "/api/clio/ephemeral" : "/api/clio/chat";
      const conversationContext = [...messages, userMsg].slice(-10).map((m) => ({
        role: m.role === "clio" ? "assistant" : "user",
        content: m.content,
      }));

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          userId,
          conversationContext,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "clio",
          content: data.content || "I'm having trouble responding. Try again in a moment.",
          timestamp: Date.now(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "clio",
          content: "I couldn't connect just now. Try again in a moment.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  // ── Position & theme by mode ────────────────────────────────────────
  // FAB position:
  //   - Inside cluster: top-right, 44px (WCAG min target), anchored just
  //     below Navbar. .clio-fab-cluster sets top:64px + 8px margin = 72px,
  //     right:16px, size 44×44. FAB bottom edge sits at ~116px.
  //   - Outside cluster: bottom-right, 56px (.clio-fab — bottom:80px right:16px)
  // Panel position:
  //   - Inside cluster: anchored at top-32 (128px) so it sits cleanly BELOW
  //     the FAB with a small visual gap. Mobile = full width minus 8px
  //     gutter, sm+ = 22rem cap right-anchored.
  //   - Outside cluster: bottom-36 (144px), same horizontal sizing rules.
  const fabPositionClass = inCluster ? "clio-fab-cluster" : "clio-fab";
  const panelPosition = inCluster
    ? "fixed top-32 left-2 right-2 sm:left-auto sm:right-4 sm:w-[22rem] z-50 max-h-[65vh]"
    : "fixed bottom-36 left-2 right-2 sm:left-auto sm:right-4 sm:w-[22rem] z-50 max-h-[80vh]";

  const isPrivate = tab === "private";
  const headerBg = isPrivate ? "bg-aggilo-deep" : "bg-amber-500";
  const sendBg = isPrivate
    ? "bg-aggilo-deep hover:bg-aggilo-mid"
    : "bg-amber-500 hover:bg-amber-600";
  const inputRing = isPrivate ? "focus:ring-aggilo-deep" : "focus:ring-amber-400";

  // Tone-aware classes for handoff bubbles. Reason itself never appears
  // in the UI — only the visual register adapts.
  function handoffBubbleClasses(tone: ToneColor | undefined): string {
    switch (tone) {
      case "amber":
        return "bg-amber-50 text-gray-700 border border-amber-200 rounded-bl-sm";
      case "indigo":
        return "bg-indigo-50 text-gray-700 border border-indigo-200 rounded-bl-sm";
      case "rose":
      default:
        return "bg-rose-50 text-gray-700 border border-rose-200 rounded-bl-sm";
    }
  }

  function handoffLabelClasses(tone: ToneColor | undefined): string {
    switch (tone) {
      case "amber":
        return "text-amber-700";
      case "indigo":
        return "text-indigo-700";
      case "rose":
      default:
        return "text-rose-600";
    }
  }

  /**
   * Neutral close affordance.
   *
   * The greeting can fire on welfare, on a tender personal disclosure that
   * the user simply doesn't want public, or on a fiqh question with weight.
   * "I'm okay" presumes welfare. "Got it" feels dismissive. The label here
   * is reason-blind and respects the user's autonomy: closing means closing
   * — nothing is concluded about the underlying situation.
   */
  async function handleCloseHandoff(greetingId: string | undefined) {
    if (!greetingId) return;
    setPrivateMessages((prev) =>
      prev.map((m) =>
        m.handoffGreetingId === greetingId ? { ...m, handoffClosed: true } : m
      )
    );
    try {
      const supabase = createClient();
      await supabase
        .from("clio_handoff_greetings")
        .update({ greeting_dismissed_at: new Date().toISOString() })
        .eq("id", greetingId);
    } catch {
      // Silent — UI state already reflects closed.
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={`${fabPositionClass} ${thinking ? "clio-fab-thinking" : !open ? "clio-fab-idle" : ""} relative`}
        aria-label="Talk to Clio"
      >
        <Image
          src="/characters/clio.png"
          alt="Clio"
          width={inCluster ? 32 : 36}
          height={inCluster ? 32 : 36}
          className="rounded-full object-cover"
        />
        {hasUnreadHandoff && !open && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div
          className={`${panelPosition} bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden`}
          style={{ transformOrigin: inCluster ? "top right" : "bottom right" }}
        >
          {/* Panel header */}
          <div className={`${headerBg} px-3 py-2.5 flex items-center gap-2`}>
            <Image
              src="/characters/clio.png"
              alt="Clio"
              width={24}
              height={24}
              className="rounded-full object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm leading-tight">Clio</div>
              <div className="text-white/70 text-[11px] leading-tight truncate">
                {isPrivate ? "Forgets after 12 hours" : "Remembers our conversations"}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white text-xl leading-none px-1 shrink-0"
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          {/* Tabs — visually distinct so the privacy state is unmistakable */}
          {inCluster && (
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setTab("private")}
                className={`flex-1 flex items-center justify-center gap-1 px-1 py-2 text-xs font-medium transition-colors ${
                  isPrivate
                    ? "bg-white text-aggilo-deep border-b-2 border-aggilo-deep"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="truncate">Just Clio · forgets</span>
                {hasUnreadHandoff && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                )}
              </button>
              <button
                onClick={() => setTab("cluster")}
                className={`flex-1 flex items-center justify-center gap-1 px-1 py-2 text-xs font-medium transition-colors ${
                  !isPrivate
                    ? "bg-white text-amber-600 border-b-2 border-amber-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="truncate">Just Clio · remembers</span>
              </button>
            </div>
          )}

          {/* Privacy banner — different per tab. Storage class is the
              key UX distinction between the two tabs, named explicitly.
              Both tabs are private to the user; the difference is what
              the platform remembers, not who else can see. */}
          <div
            className={`px-3 py-1.5 border-b text-[11px] flex items-center gap-1.5 ${
              isPrivate
                ? "bg-amber-50 border-amber-100 text-amber-700"
                : "bg-sky-50 border-sky-100 text-sky-700"
            }`}
          >
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isPrivate ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              )}
            </svg>
            <span className="leading-tight">
              {isPrivate
                ? "Private to you. Auto-deletes after 12 hours. Nothing reaches the platform."
                : "Private to you. Clio remembers what helps so she can serve you better next time."}
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[160px]">
            {/* Help section — Private Chat tab only, inside a cluster.
                Collapsible "What's on this page?" with buttons that
                start an anchored tour: page scrolls, Clio pops out a
                brief popover beside the surface, member can step
                Prev/Next or close and reopen any time from this list.
                Single source of truth for the items lives at the
                bottom of this file (PLATFORM_HELP_ITEMS) and feeds
                both the help section and the popover. */}
            {!isPrivate && inCluster && (
              <ClusterHelpSection
                activeIndex={tourIndex}
                onJump={(idx) => {
                  // Close the panel so the popover can land on the
                  // target without being obscured. Tour state survives
                  // panel close — opening the panel again shows which
                  // step is currently active.
                  setOpen(false);
                  setTourIndex(idx);
                }}
              />
            )}

            {messages.map((msg, i) => {
              const handoffOpen =
                msg.isHandoffGreeting && !msg.handoffClosed;
              return (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-aggilo-deep text-white rounded-br-sm"
                        : msg.isHandoffGreeting
                          ? handoffBubbleClasses(msg.handoffTone)
                          : isPrivate
                            ? "bg-gray-100 text-gray-700 rounded-bl-sm"
                            : "bg-amber-50 text-gray-700 border border-amber-100 rounded-bl-sm"
                    }`}
                  >
                    {msg.isHandoffGreeting && (
                      <div
                        className={`text-[10px] font-semibold mb-1 uppercase tracking-wide ${handoffLabelClasses(msg.handoffTone)}`}
                      >
                        From Sage · private
                      </div>
                    )}
                    {msg.content}
                    {handoffOpen && (
                      <div className="mt-2 pt-2 border-t border-current/10 flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-gray-500">
                          Reply, or close this for now.
                        </span>
                        <button
                          onClick={() => handleCloseHandoff(msg.handoffGreetingId)}
                          className={`px-2 py-1 rounded text-gray-600 hover:text-gray-900 hover:bg-white/60 transition-colors`}
                          aria-label="Close this greeting"
                        >
                          Close this for now
                        </button>
                      </div>
                    )}
                    {msg.handoffClosed && (
                      <div className="mt-2 pt-2 border-t border-current/10 text-[11px] text-gray-400 italic">
                        Closed. Open again from your conversation history if you need.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {showDots && (
              <div className="flex justify-start">
                <div className={`px-3 py-2 rounded-xl rounded-bl-sm ${isPrivate ? "bg-gray-100" : "bg-amber-50 border border-amber-100"}`}>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="typing-dots flex gap-1">
                        <span /><span /><span />
                      </div>
                      {thinkingPhrase && (
                        <span className="text-[12px] text-gray-600 italic">{thinkingPhrase}</span>
                      )}
                    </div>
                    {showTakingMoment && (
                      <span className="text-[11px] text-gray-400">Taking a moment…</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-2 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isPrivate ? "This stays between us..." : "Ask me anything — I'll remember..."}
              className={`flex-1 min-w-0 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 ${inputRing}`}
              disabled={thinking}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || thinking}
              className={`px-3 py-2 text-white text-sm rounded-lg disabled:opacity-30 transition-colors shrink-0 ${sendBg}`}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Anchored tour — portal-rendered. Survives panel close so the
          member can step through surfaces without the chat panel
          obscuring the popover. Driven by tourIndex; help section
          opens / advances it; popover Close (× / Esc / click-outside)
          resets it. */}
      {inCluster && (
        <ClioTour
          steps={PLATFORM_HELP_ITEMS}
          activeIndex={tourIndex}
          onChange={setTourIndex}
        />
      )}
    </>
  );
}

// ── ClusterHelpSection ──────────────────────────────────────────────
//
// Collapsible "What's on this page?" guide. Lives at the top of the
// Private Chat tab when the panel is open inside a cluster. Each
// button starts (or re-opens) the anchored Clio tour at the chosen
// step. The tour itself is rendered by <ClioTour /> at the FAB root,
// portal-mounted so it survives panel close.
//
// Platform-baseline list — every cluster gets these. Workshop-driven
// items are NOT added here; this is the floor that ships with every
// room. (See SESSION_A_CONFIGURABILITY.md §3 step 5.)
//
// Single source of truth: PLATFORM_HELP_ITEMS (below) is the only
// place the surface list, selectors, and explanations live. Both the
// help section and the popover read from it. To add a surface, edit
// the list — both views update.

const PLATFORM_HELP_ITEMS: TourStep[] = [
  {
    label: "Live presence",
    selector: "#aggilo-cluster-presence",
    description:
      "Who's online now and how many sisters have joined this week.",
  },
  {
    label: "Cluster restrictions",
    selector: "#aggilo-cluster-chips",
    description:
      "Who this room is for — age, gender, location, language.",
  },
  {
    label: "Pinned anchor",
    selector: "#aggilo-pinned-anchor",
    description: "The room's founding statement at the top.",
  },
  {
    label: "Posts & timeline",
    selector: "#aggilo-cluster-timeline",
    description:
      "The conversation. Long-press any post to react, share, or report.",
  },
  {
    label: "Compose bar",
    selector: "#aggilo-compose-bar",
    description: "Where you share what's on your heart.",
  },
  {
    label: "@Sage feature",
    selector: "#aggilo-compose-bar",
    description:
      "Type @Sage in the compose bar and ask a question — she replies when she has something verified.",
  },
  {
    label: "Sage's posts",
    selector: ".sage-post",
    description:
      "Sage anchors the room and shares verified references from Quran and authentic Sunnah.",
  },
  {
    label: "Room Workshop",
    selector: "#aggilo-room-workshop",
    description: "What Clio and I are building for this room.",
  },
  {
    label: "Myself (Clio)",
    selector: ".clio-fab, .clio-fab-cluster",
    description: "I'm always here. Tap the avatar to chat anytime.",
  },
];

interface ClusterHelpSectionProps {
  /** Which step (if any) is currently being narrated by the tour. */
  activeIndex: number | null;
  /** Open the tour at this step. The FAB owns tour state. */
  onJump: (index: number) => void;
}

function ClusterHelpSection({ activeIndex, onJump }: ClusterHelpSectionProps) {
  return (
    <details
      className="rounded-lg border border-amber-200 bg-amber-50/60 group"
      open={activeIndex !== null}
    >
      <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-amber-800 flex items-center gap-2 list-none">
        <svg
          className="w-3.5 h-3.5 shrink-0 transition-transform group-open:rotate-90"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span>What&apos;s on this page?</span>
        <span className="ml-auto text-[10px] font-normal text-amber-700/70">
          {activeIndex !== null ? "Tour open" : "Tap a topic"}
        </span>
      </summary>
      <div className="px-2 pb-2 pt-1 space-y-1">
        {PLATFORM_HELP_ITEMS.map((item, idx) => {
          const isActive = activeIndex === idx;
          return (
            <button
              key={item.label + item.selector}
              type="button"
              onClick={() => onJump(idx)}
              className={`w-full text-left px-2 py-1.5 rounded-md transition-colors flex flex-col gap-0.5 ${
                isActive
                  ? "bg-emerald-100/80 ring-1 ring-emerald-300"
                  : "hover:bg-amber-100/80"
              }`}
              title={item.description}
              aria-current={isActive ? "true" : undefined}
            >
              <span
                className={`text-xs font-medium ${
                  isActive ? "text-emerald-900" : "text-amber-900"
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="ml-1.5 text-[10px] font-normal text-emerald-700">
                    showing now
                  </span>
                )}
              </span>
              <span
                className={`text-[11px] leading-snug ${
                  isActive ? "text-emerald-800/80" : "text-amber-700/80"
                }`}
              >
                {item.description}
              </span>
            </button>
          );
        })}
      </div>
    </details>
  );
}
