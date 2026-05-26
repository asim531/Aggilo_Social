"use client";

/**
 * FoundingFeedbackPrompt — Long Conversation.
 *
 * One-shot UI that surfaces only for the founding member of this
 * cluster (Tas, for LC). Specification:
 *   docs/AMA_CLUSTER_CREATION_AND_FOUNDING_FEEDBACK.md Part 1
 *
 * Behaviour:
 *   1. On mount, query /api/clio/founding-feedback (GET) to see if
 *      the prompt should fire. If not eligible or already closed,
 *      render nothing.
 *   2. If eligible-and-not-closed, surface as a centered modal with
 *      a soft backdrop. Fires after the welcome modal is dismissed
 *      (gated by parent passing this component when ready).
 *   3. The modal greets the founder by nickname, shows Clio's
 *      verbatim opening per spec, surfaces a collapsible reference
 *      panel ("What's set up here?" with the cluster description and
 *      seed questions inline), and offers three preset chips plus a
 *      free-text response.
 *   4. Three preset chips:
 *        - "It feels right" → sends the chip text and accepts.
 *        - "Mostly right but…" → opens the textarea so the founder
 *          can describe what's off.
 *        - "Let me sit with it" → defers without stamping
 *          close_reason. Re-surfaces on next visit until explicit
 *          response.
 *   5. After Clio's reply lands, an "I'm done" close button appears.
 *      Auto-close after a brief delay if the close was accepted.
 *
 * Privacy: tagged data-clarity-mask="true".
 */

import { useState, useEffect, useRef, type FormEvent } from "react";
import { withBasePath } from "@/lib/path";
import { track } from "@/lib/track";

interface Props {
  founderNickname: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

type PromptState =
  | { phase: "loading" }
  | { phase: "ineligible" }
  | { phase: "ready"; messages: Message[]; sending: boolean; closed: boolean }
  | { phase: "closed" };

/**
 * Mirrors the cluster description / tagline / seed questions so the
 * founding member can read what was actually built before judging it.
 * Pulled from phase0/clusters/long_conversation/CLUSTER_DESCRIPTION.md
 * and §6 (seed questions). When this content changes, update both.
 */
const CLUSTER_REFERENCE = {
  tagline: "Where you're known by what you say — nothing else.",
  description:
    "A text-only space for intellectually serious young Indians (22–32) who are done with apps and looking for the kind of intimate connection that actually goes somewhere. India-wide, mixed gender, English-primary. No photos, no DMs, no mutual matches — every interaction is a public Timeline post.",
  seedQuestions: [
    "What would it mean to find someone who was actually interested in you — not your profile, not your credentials, but you?",
    "There's a specific kind of loneliness that comes from being surrounded by people who know what you do but not who you are. Has anyone else been living in that gap?",
    "What's the conversation you keep almost having — the one that would require the other person to actually be present for it?",
    "Apps match on the surface. What's the thing about you that only shows up when someone takes the time to actually know you?",
    "What does intimacy mean to you — not the word, the actual thing?",
  ],
} as const;

export default function FoundingFeedbackPrompt({ founderNickname }: Props) {
  const [state, setState] = useState<PromptState>({ phase: "loading" });
  const [showReference, setShowReference] = useState(false);
  const [input, setInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
        // Eligible. Open the prompt right away — the welcome modal
        // already gave the member time to settle. No further timer.
        await openPrompt();
      } catch {
        if (!cancelled) setState({ phase: "ineligible" });
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state]);

  useEffect(() => {
    if (showInput) setTimeout(() => inputRef.current?.focus(), 100);
  }, [showInput]);

  async function openPrompt() {
    track("founding_feedback_shown");
    try {
      const res = await fetch(withBasePath("/api/clio/founding-feedback"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "open" }),
      });
      if (res.status === 410) {
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
        closed: false,
      });
    } catch {
      setState({ phase: "ineligible" });
    }
  }

  async function sendReply(message: string) {
    if (state.phase !== "ready" || state.sending) return;
    const trimmed = message.trim();
    if (!trimmed) return;

    const newMessages: Message[] = [
      ...state.messages,
      { role: "user", content: trimmed },
    ];
    setState({ ...state, messages: newMessages, sending: true });
    setInput("");
    setShowInput(false);
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
          content: data.reply ?? "Then it's yours. I'll step back.",
        },
      ];
      setState({
        phase: "ready",
        messages: final,
        sending: false,
        closed: true,
      });
      if (data.close_reason) {
        track("founding_feedback_closed", { close_reason: data.close_reason });
      }
    } catch {
      setState({ ...state, sending: false });
    }
  }

  function handleChip(chip: "right" | "mostly" | "later") {
    if (chip === "later") {
      track("founding_feedback_deferred");
      // Defer without stamping close_reason. The server's GET will
      // still report closed=false on next mount, so the prompt
      // re-surfaces. localStorage flag prevents same-session re-show.
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("lc:founding_feedback_deferred", "1");
      }
      setState({ phase: "closed" });
      return;
    }
    if (chip === "right") {
      void sendReply("It feels right.");
      return;
    }
    // "Mostly right but…" — open the textarea so the founder can
    // describe what's off. Don't send anything yet.
    setShowInput(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void sendReply(input);
  }

  // ── Render ─────────────────────────────────────────────────────

  if (state.phase !== "ready") return null;

  // Suppress within-session re-show when deferred.
  if (
    typeof window !== "undefined" &&
    window.sessionStorage.getItem("lc:founding_feedback_deferred") === "1"
  ) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      data-clarity-mask="true"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lc-founding-title"
    >
      <div className="bg-lc-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-50 to-stone-50 px-5 sm:px-6 pt-5 pb-3 border-b border-amber-200">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2 h-2 rounded-full bg-lc-clio animate-pulse"
              aria-hidden="true"
            />
            <span className="text-[11px] uppercase tracking-wider text-lc-clio font-semibold">
              Clio · just for you
            </span>
          </div>
          <h2
            id="lc-founding-title"
            className="text-lg font-semibold text-lc-ink"
          >
            A note before you settle in, {founderNickname}.
          </h2>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 min-h-0">
          {/* Conversation messages */}
          <div className="space-y-3">
            {state.messages.map((msg, i) => (
              <div
                key={i}
                className={`text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "text-lc-ink text-right pl-8"
                    : "text-lc-ink pr-8"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {state.sending && <div className="text-xs text-lc-muted">…</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Reference panel — collapsible */}
          {!state.closed && (
            <div className="mt-4 border-t border-stone-200 pt-3">
              <button
                type="button"
                onClick={() => setShowReference((v) => !v)}
                className="w-full flex items-center justify-between text-xs text-lc-muted hover:text-lc-ink transition-colors py-1"
              >
                <span className="font-medium">
                  {showReference ? "Hide" : "See"} what&apos;s set up here
                </span>
                <span aria-hidden="true">
                  {showReference ? "▲" : "▼"}
                </span>
              </button>
              {showReference && (
                <div className="mt-2 p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs text-lc-ink space-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-lc-muted font-semibold mb-1">
                      Tagline
                    </p>
                    <p className="italic">{CLUSTER_REFERENCE.tagline}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-lc-muted font-semibold mb-1">
                      Description
                    </p>
                    <p className="leading-relaxed">
                      {CLUSTER_REFERENCE.description}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-lc-muted font-semibold mb-1">
                      Seed questions in the room
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      {CLUSTER_REFERENCE.seedQuestions.map((q) => (
                        <li key={q} className="leading-relaxed">
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — chips, textarea (when expanded), or close button */}
        <div className="border-t border-stone-200 px-5 sm:px-6 py-3 bg-stone-50/40">
          {state.closed ? (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setState({ phase: "closed" })}
                className="px-4 py-2 bg-lc-clio text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
              >
                I&apos;m done — close
              </button>
            </div>
          ) : showInput ? (
            <form onSubmit={handleSubmit} className="space-y-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell Clio what's off — the description, the seed questions, the way Sage holds the space, anything."
                rows={3}
                className="w-full resize-none text-sm px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-lc-clio focus:border-transparent text-lc-ink placeholder:text-stone-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void sendReply(input);
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowInput(false)}
                  className="text-xs text-lc-muted hover:text-lc-ink transition-colors"
                >
                  ← Back to options
                </button>
                <button
                  type="submit"
                  disabled={!input.trim() || state.sending}
                  className="px-4 py-2 bg-lc-clio text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => handleChip("later")}
                className="text-xs px-3 py-1.5 rounded-full border border-stone-300 text-lc-muted hover:text-lc-ink hover:border-stone-400 transition-colors"
              >
                Let me sit with it
              </button>
              <button
                type="button"
                onClick={() => handleChip("mostly")}
                className="text-xs px-3 py-1.5 rounded-full border border-amber-300 text-lc-clio hover:bg-amber-50 transition-colors"
              >
                Mostly right but…
              </button>
              <button
                type="button"
                onClick={() => handleChip("right")}
                className="text-xs px-3 py-1.5 rounded-full bg-lc-clio text-white hover:bg-amber-700 transition-colors"
              >
                It feels right
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
