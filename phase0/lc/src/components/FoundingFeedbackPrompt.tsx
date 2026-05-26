"use client";

/**
 * FoundingFeedbackPrompt — Long Conversation.
 *
 * One-shot UI that surfaces only for the founding member of this
 * cluster (Tas, for LC). Specification:
 *   phase0/docs/AMA_CLUSTER_CREATION_AND_FOUNDING_FEEDBACK.md Part 1
 *
 * Behaviour:
 *   1. On mount, query /api/clio/founding-feedback (GET) to see if
 *      the prompt should fire. If not eligible or already closed,
 *      render nothing.
 *   2. If eligible-and-not-closed, wait ~30 seconds (per spec — the
 *      member should be in the room briefly before Clio nudges).
 *   3. Pulse the existing Clio FAB and render a small panel anchored
 *      to it, containing Clio's verbatim opening message.
 *   4. Member responds → POST to /api/clio/founding-feedback with
 *      action=reply, render Clio's reply, then close the panel.
 *   5. Member dismisses without responding → silent_close path is
 *      handled server-side at 24h (separate scheduled task; not
 *      implemented in Phase 0). Closing the panel here just hides
 *      it for this session — the prompt re-surfaces on next visit
 *      until the server stamps close_reason.
 *
 * Privacy: this conversation is tagged data-clarity-mask="true" so
 * Clarity session recordings never capture the founding member's
 * candid feedback about the room.
 */

import { useState, useEffect, useRef, type FormEvent } from "react";
import { withBasePath } from "@/lib/path";
import { track } from "@/lib/track";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type PromptState =
  | { phase: "loading" }
  | { phase: "ineligible" }
  | { phase: "deferred" } // eligible, waiting before surfacing
  | { phase: "ready"; messages: Message[]; sending: boolean }
  | { phase: "closed" };

const SURFACE_DELAY_MS = 30_000; // 30 seconds in-room before nudging

export default function FoundingFeedbackPrompt() {
  const [state, setState] = useState<PromptState>({ phase: "loading" });
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const surfaceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Eligibility check on mount ─────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch(withBasePath("/api/clio/founding-feedback"), {
          method: "GET",
          cache: "no-store",
        });
        const data = (await res.json()) as {
          eligible: boolean;
          opened: boolean;
          closed: boolean;
        };
        if (cancelled) return;
        if (!data.eligible || data.closed) {
          setState({ phase: data.closed ? "closed" : "ineligible" });
          return;
        }
        // Eligible. Surface after a short delay so the member is
        // briefly in the room before Clio nudges.
        setState({ phase: "deferred" });
        surfaceTimerRef.current = setTimeout(() => {
          void openPrompt();
        }, SURFACE_DELAY_MS);
      } catch {
        if (!cancelled) setState({ phase: "ineligible" });
      }
    }
    void check();
    return () => {
      cancelled = true;
      if (surfaceTimerRef.current) clearTimeout(surfaceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-scroll & focus ────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state]);

  useEffect(() => {
    if (state.phase === "ready") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [state.phase]);

  async function openPrompt() {
    track("founding_feedback_shown");
    try {
      const res = await fetch(withBasePath("/api/clio/founding-feedback"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "open" }),
      });
      if (res.status === 410) {
        // Already closed (e.g. another tab handled it). Hide.
        setState({ phase: "closed" });
        return;
      }
      const data = (await res.json()) as { reply?: string };
      if (!data.reply) {
        setState({ phase: "ineligible" });
        return;
      }
      setState({
        phase: "ready",
        messages: [{ role: "assistant", content: data.reply }],
        sending: false,
      });
    } catch {
      // Network failure — stay deferred so it can retry on next mount.
      setState({ phase: "ineligible" });
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (state.phase !== "ready" || state.sending) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    const newMessages: Message[] = [
      ...state.messages,
      { role: "user", content: trimmed },
    ];
    setState({ ...state, messages: newMessages, sending: true });
    setInput("");
    track("founding_feedback_responded");

    try {
      const res = await fetch(withBasePath("/api/clio/founding-feedback"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reply",
          message: trimmed,
          history: state.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = (await res.json()) as {
        reply?: string;
        close_reason?: string;
      };

      const final: Message[] = [
        ...newMessages,
        {
          role: "assistant",
          content:
            data.reply ?? "Then it's yours. I'll step back.",
        },
      ];
      setState({ phase: "ready", messages: final, sending: false });
      if (data.close_reason) {
        track("founding_feedback_closed", { close_reason: data.close_reason });
      }

      // Auto-close the panel a few seconds after the close
      // acknowledgement so the member can read it and then return to
      // the room without an explicit dismiss.
      setTimeout(() => setState({ phase: "closed" }), 6000);
    } catch {
      setState({ ...state, sending: false });
    }
  }

  function handleSkip() {
    // The member chose not to engage. Hide the panel for this
    // session. Server-side, founding_feedback_at is already stamped
    // (set on open), so the silent_close path will close it after
    // 24h. For Phase 0 with no scheduled task, the member who skips
    // sees the prompt again on next visit until they respond once.
    setState({ phase: "closed" });
    track("founding_feedback_dismissed");
  }

  // ── Render ─────────────────────────────────────────────────────

  if (state.phase !== "ready") return null;

  return (
    <div
      className="fixed top-[120px] right-4 z-[60] w-[calc(100vw-32px)] sm:w-96 bg-lc-card rounded-xl shadow-2xl border-2 border-lc-clio flex flex-col"
      style={{ maxHeight: "calc(100vh - 140px)" }}
      data-clarity-mask="true"
      role="dialog"
      aria-label="A note from Clio"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full bg-lc-clio animate-pulse"
            aria-hidden="true"
          />
          <span className="text-xs uppercase tracking-wider text-lc-clio font-semibold">
            Clio
          </span>
        </div>
        <button
          type="button"
          onClick={handleSkip}
          className="text-xs text-lc-muted hover:text-lc-ink transition-colors"
          aria-label="Dismiss for now"
        >
          Later
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {state.messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm leading-relaxed ${
              msg.role === "user"
                ? "text-lc-ink text-right pl-6"
                : "text-lc-ink pr-6"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {state.sending && <div className="text-xs text-lc-muted">…</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Compose */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-stone-200 px-3 py-2 flex gap-2"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say it the way you'd say it…"
          rows={2}
          className="flex-1 resize-none text-sm px-2 py-1.5 rounded border border-stone-300 focus:outline-none focus:ring-1 focus:ring-lc-clio text-lc-ink placeholder:text-stone-400 min-h-[44px] max-h-32"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSubmit(e as unknown as FormEvent);
            }
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || state.sending}
          className="self-end px-3 py-1.5 rounded bg-lc-clio text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-700 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
