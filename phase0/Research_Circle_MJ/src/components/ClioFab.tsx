"use client";

/**
 * ClioFab — Research Circle MJ.
 *
 * The floating Clio button, top-right inside the cluster (44px,
 * 16px from edge, 8px below the Navbar at top:72px). Two tabs:
 *
 *   Tab 1 — "Just Clio" (cluster mode)
 *     Clio reads the public Timeline and responds in the Academic
 *     Momentum + research-cohort register. The private tip mechanic
 *     fires here. Content is NOT persisted server-side (ephemeral by
 *     design for the cluster surface — the cluster is already the
 *     persistent record). Stored in component state only.
 *
 *   Tab 2 — "Private" (ephemeral mode)
 *     12h TTL. Content lives in browser sessionStorage. Server stores
 *     only session metadata. Welfare detection runs on every message.
 *     The lock icon signals the privacy guarantee.
 *
 * The panel expands downward-leftward from the FAB position.
 * On mobile it takes most of the viewport width.
 *
 * Clarity masking: the panel content is tagged data-clarity-mask="true"
 * so session recordings never capture private Clio conversations.
 */

import { useState, useRef, useEffect, type FormEvent } from "react";
import { withBasePath } from "@/lib/path";
import { track } from "@/lib/track";

interface Message {
  role: "user" | "assistant";
  content: string;
  isTip?: boolean; // tip messages are visually distinct
}

type ActiveTab = "cluster" | "ephemeral";

const EPHEMERAL_SESSION_KEY = "lc:clio_ephemeral_session_id";
const EPHEMERAL_HISTORY_KEY = "lc:clio_ephemeral_history";

export default function ClioFab({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("cluster");

  // Cluster-mode state (component memory only — not persisted)
  const [clusterMessages, setClusterMessages] = useState<Message[]>([]);
  const [clusterInput, setClusterInput] = useState("");
  const [clusterLoading, setClusterLoading] = useState(false);

  // Ephemeral-mode state (sessionStorage)
  const [ephemeralMessages, setEphemeralMessages] = useState<Message[]>([]);
  const [ephemeralInput, setEphemeralInput] = useState("");
  const [ephemeralLoading, setEphemeralLoading] = useState(false);
  const [ephemeralSessionId, setEphemeralSessionId] = useState<string | null>(null);

  // Pending tips from ClioTipLayer
  const [pendingTip, setPendingTip] = useState<string | null>(null);

  const clusterEndRef = useRef<HTMLDivElement>(null);
  const ephemeralEndRef = useRef<HTMLDivElement>(null);
  const clusterInputRef = useRef<HTMLTextAreaElement>(null);
  const ephemeralInputRef = useRef<HTMLTextAreaElement>(null);

  // Listen for tips from ClioTipLayer
  useEffect(() => {
    function handleTipEvent(e: Event) {
      const detail = (e as CustomEvent).detail as { tip: string };
      if (detail?.tip) {
        setPendingTip(detail.tip);
      }
    }
    window.addEventListener("clio-tip-available", handleTipEvent);
    return () => window.removeEventListener("clio-tip-available", handleTipEvent);
  }, []);

  // Mark tip as consumed when panel opens
  useEffect(() => {
    if (open && pendingTip) {
      setClusterMessages((prev) => [
        { role: "assistant", content: pendingTip, isTip: true },
        ...prev,
      ]);
      setPendingTip(null);
    }
  }, [open, pendingTip]);

  // Restore ephemeral history from sessionStorage on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedId = window.sessionStorage.getItem(EPHEMERAL_SESSION_KEY);
    const storedHistory = window.sessionStorage.getItem(EPHEMERAL_HISTORY_KEY);
    if (storedId) setEphemeralSessionId(storedId);
    if (storedHistory) {
      try {
        setEphemeralMessages(JSON.parse(storedHistory) as Message[]);
      } catch {
        // Corrupted storage — start fresh.
      }
    }
  }, []);

  // Persist ephemeral history to sessionStorage whenever it changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(
      EPHEMERAL_HISTORY_KEY,
      JSON.stringify(ephemeralMessages)
    );
  }, [ephemeralMessages]);

  // Scroll to bottom when messages arrive.
  useEffect(() => {
    clusterEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [clusterMessages]);
  useEffect(() => {
    ephemeralEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ephemeralMessages]);

  // Focus the input when the panel opens.
  useEffect(() => {
    if (!open) return;
    const ref = activeTab === "cluster" ? clusterInputRef : ephemeralInputRef;
    setTimeout(() => ref.current?.focus(), 100);
  }, [open, activeTab]);

  function handleToggle() {
    setOpen((prev) => {
      if (!prev) track("clio_fab_opened", { tab: activeTab });
      return !prev;
    });
  }

  // ── Cluster-mode send ──────────────────────────────────────────
  async function handleClusterSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = clusterInput.trim();
    if (!trimmed || clusterLoading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    setClusterMessages((prev) => [...prev, userMsg]);
    setClusterInput("");
    setClusterLoading(true);
    track("clio_fab_message_sent", { tab: "cluster" });

    try {
      const history = clusterMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await fetch(withBasePath("/api/clio/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });
      const data = (await res.json()) as { reply: string; tip?: string };

      setClusterMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
        ...(data.tip
          ? [{ role: "assistant" as const, content: data.tip, isTip: true }]
          : []),
      ]);

      if (data.tip) track("clio_tip_received");
    } catch {
      setClusterMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble right now. Try again in a moment.",
        },
      ]);
    } finally {
      setClusterLoading(false);
    }
  }

  // ── Ephemeral-mode send ────────────────────────────────────────
  async function handleEphemeralSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = ephemeralInput.trim();
    if (!trimmed || ephemeralLoading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    setEphemeralMessages((prev) => [...prev, userMsg]);
    setEphemeralInput("");
    setEphemeralLoading(true);
    track("clio_fab_message_sent", { tab: "ephemeral" });

    try {
      const history = ephemeralMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await fetch(withBasePath("/api/clio/ephemeral"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history,
          session_id: ephemeralSessionId,
        }),
      });
      const data = (await res.json()) as {
        reply: string;
        session_id: string;
      };

      if (data.session_id && !ephemeralSessionId) {
        setEphemeralSessionId(data.session_id);
        window.sessionStorage.setItem(EPHEMERAL_SESSION_KEY, data.session_id);
      }

      setEphemeralMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch {
      setEphemeralMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble right now. Try again in a moment.",
        },
      ]);
    } finally {
      setEphemeralLoading(false);
    }
  }

  return (
    <>
      {/* ── FAB button ─────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={open ? "Close Clio" : "Open Clio"}
        aria-expanded={open}
        className={`clio-fab-cluster ${open ? "" : "clio-fab-idle"}`}
      >
        <span className="text-lg select-none" aria-hidden="true">
          {open ? "×" : "C"}
        </span>
        {pendingTip && !open && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* ── Panel ──────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-[80px] right-4 z-50 w-[calc(100vw-32px)] sm:w-80 bg-husl-card dark:bg-[#14161a] rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 flex flex-col"
          style={{ maxHeight: "calc(100vh - 120px)" }}
          data-clarity-mask="true"
        >
          {/* Header + tabs */}
          <div className="flex items-center border-b border-stone-200 dark:border-stone-700 px-3 pt-3 pb-0 gap-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-2 right-3 text-stone-400 hover:text-husl-ink dark:text-stone-500 dark:hover:text-white transition-colors"
              aria-label="Close"
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("cluster")}
              className={`flex-1 pb-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === "cluster"
                  ? "border-husl-clio text-husl-clio"
                  : "border-transparent text-husl-muted dark:text-stone-400 hover:text-husl-ink dark:hover:text-white"
              }`}
            >
              Clio
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("ephemeral");
                track("clio_ephemeral_tab_opened");
              }}
              className={`flex-1 pb-2 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1 ${
                activeTab === "ephemeral"
                  ? "border-amber-500 text-amber-700 dark:text-amber-400"
                  : "border-transparent text-husl-muted dark:text-stone-400 hover:text-husl-ink dark:hover:text-white"
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Private</span>
            </button>
          </div>

          {/* ── Cluster tab ──────────────────────────────────── */}
          {activeTab === "cluster" && (
            <>
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
                {clusterMessages.length === 0 && (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-xs text-husl-ink dark:text-stone-200">
                      I read the room. I can tell you what&apos;s actually happening, or help you say what you&apos;re trying to say.
                    </p>
                    <p className="text-[10px] text-husl-muted dark:text-stone-400">
                      Clio has read the last 8 posts.
                    </p>
                  </div>
                )}
                {clusterMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "text-husl-ink dark:text-stone-200 text-right"
                        : msg.isTip
                          ? "text-husl-clio dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 text-xs border border-amber-200 dark:border-amber-800"
                          : "text-husl-ink dark:text-stone-200"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
                {clusterLoading && (
                  <div className="text-xs text-husl-muted dark:text-stone-400">Clio is reading the room…</div>
                )}
                <div ref={clusterEndRef} />
              </div>
              <form
                onSubmit={handleClusterSend}
                className="border-t border-stone-200 dark:border-stone-700 px-3 py-2 flex gap-2"
              >
                <textarea
                  ref={clusterInputRef}
                  value={clusterInput}
                  onChange={(e) => setClusterInput(e.target.value)}
                  placeholder="Ask Clio…"
                  rows={1}
                  className="flex-1 resize-none text-sm px-2 py-1.5 rounded border border-stone-300 dark:border-stone-700 dark:bg-[#1a1d22] focus:outline-none focus:ring-1 focus:ring-husl-clio text-husl-ink dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-600 min-h-[36px] max-h-24"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleClusterSend(e as unknown as FormEvent);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!clusterInput.trim() || clusterLoading}
                  className="px-3 py-1.5 rounded bg-husl-clio text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-700 transition-colors"
                >
                  Send
                </button>
              </form>
            </>
          )}

          {/* ── Ephemeral tab ─────────────────────────────────── */}
          {activeTab === "ephemeral" && (
            <>
              <div className="px-3 pt-2 pb-1">
                <p className="text-[11px] text-husl-muted dark:text-stone-400 leading-relaxed">
                  This conversation isn&apos;t stored anywhere. It clears when
                  you close the browser or after 12 hours.
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
                {ephemeralMessages.length === 0 && (
                  <p className="text-xs text-husl-muted dark:text-stone-400 text-center py-4">
                    Just between us. Nothing here is saved.
                  </p>
                )}
                {ephemeralMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "text-husl-ink dark:text-stone-200 text-right"
                        : "text-husl-ink dark:text-stone-200"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
                {ephemeralLoading && (
                  <div className="text-xs text-husl-muted dark:text-stone-400">Clio is thinking…</div>
                )}
                <div ref={ephemeralEndRef} />
              </div>
              <form
                onSubmit={handleEphemeralSend}
                className="border-t border-stone-200 dark:border-stone-700 px-3 py-2 flex gap-2"
              >
                <textarea
                  ref={ephemeralInputRef}
                  value={ephemeralInput}
                  onChange={(e) => setEphemeralInput(e.target.value)}
                  placeholder="Just between us…"
                  rows={1}
                  className="flex-1 resize-none text-sm px-2 py-1.5 rounded border border-amber-200 dark:border-amber-800 dark:bg-[#1a1d22] focus:outline-none focus:ring-1 focus:ring-amber-400 text-husl-ink dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-600 min-h-[36px] max-h-24"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleEphemeralSend(e as unknown as FormEvent);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!ephemeralInput.trim() || ephemeralLoading}
                  className="px-3 py-1.5 rounded bg-amber-600 text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-700 transition-colors"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
