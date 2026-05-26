"use client";

/**
 * FoundingFeedbackPrompt — Long Conversation.
 *
 * Modal opened by the FoundingFeedbackBadge button. The founding
 * member explicitly chooses when to engage; the prompt never fires
 * itself. Close anytime, come back anytime, until an explicit
 * accept/changes_applied/changes_queued response is sent.
 *
 * Specification:
 *   docs/AMA_CLUSTER_CREATION_AND_FOUNDING_FEEDBACK.md Part 1
 *
 * Three preset chips:
 *   - "It feels right"      → sends and accepts
 *   - "Mostly right but…"   → opens textarea
 *   - "Not now"             → closes the modal without stamping;
 *                              badge stays visible to come back to
 *
 * Loading states:
 *   - Opening: spinner while the server records open + returns the
 *     verbatim opening (typically <500ms)
 *   - Sending: spinner inline with "Clio is reading…" so the wait
 *     for the LLM doesn't feel like the UI is broken
 *
 * Privacy: data-clarity-mask="true".
 */

import { useState, useEffect, useRef, type FormEvent } from "react";
import { withBasePath } from "@/lib/path";
import { track } from "@/lib/track";

interface Props {
  open: boolean;
  founderNickname: string;
  onClose: (didRespond: boolean) => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

type PromptPhase =
  | "opening"
  | "ready"
  | "sending"
  | "ack" // Clio's reply has landed; waiting for "I'm done"
  | "badge_offer";

const CLUSTER_REFERENCE = {
  tagline: "Where you're known by what you say — nothing else.",
  description:
    "A text-only space for intellectually serious young Indians (22–32) who are done with apps and looking for the kind of intimate connection that actually goes somewhere.",
  seedQuestions: [
    "What would it mean to find someone who was actually interested in you — not your profile, not your credentials, but you?",
    "There's a specific kind of loneliness that comes from being surrounded by people who know what you do but not who you are. Has anyone else been living in that gap?",
    "What's the conversation you keep almost having — the one that would require the other person to actually be present for it?",
    "Apps match on the surface. What's the thing about you that only shows up when someone takes the time to actually know you?",
    "What does intimacy mean to you — not the word, the actual thing?",
  ],
} as const;

export default function FoundingFeedbackPrompt({
  open,
  founderNickname,
  onClose,
}: Props) {
  const [phase, setPhase] = useState<PromptPhase>("opening");
  const [messages, setMessages] = useState<Message[]>([]);
  const [showReference, setShowReference] = useState(false);
  const [input, setInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [respondedThisSession, setRespondedThisSession] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Open the prompt server-side when the modal opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPhase("opening");
    setMessages([]);
    setShowReference(false);
    setShowInput(false);
    setInput("");
    (async () => {
      try {
        const res = await fetch(withBasePath("/api/clio/founding-feedback"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "open" }),
        });
        if (cancelled) return;
        if (res.status === 410) {
          // Already closed — close without surfacing anything.
          onClose(true);
          return;
        }
        const data = (await res.json()) as { reply?: string };
        if (!data.reply) {
          onClose(false);
          return;
        }
        setMessages([{ role: "assistant", content: data.reply }]);
        setPhase("ready");
        track("founding_feedback_opened");
      } catch {
        if (!cancelled) onClose(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, phase]);

  useEffect(() => {
    if (showInput) setTimeout(() => inputRef.current?.focus(), 100);
  }, [showInput]);

  async function sendReply(message: string) {
    const trimmed = message.trim();
    if (!trimmed) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(newMessages);
    setInput("");
    setShowInput(false);
    setPhase("sending");
    track("founding_feedback_responded");

    try {
      const res = await fetch(withBasePath("/api/clio/founding-feedback"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reply",
          message: trimmed,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = (await res.json()) as {
        reply?: string;
        close_reason?: string;
        badge_offer?: boolean;
      };

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.reply ?? "Then it's yours. I'll step back.",
        },
      ]);
      setRespondedThisSession(true);
      if (data.close_reason) {
        track("founding_feedback_closed", { close_reason: data.close_reason });
      }
      if (data.badge_offer) {
        // Brief pause so the founder reads Clio's reply before the
        // badge offer transition.
        setTimeout(() => setPhase("badge_offer"), 1800);
      } else {
        setPhase("ack");
      }
    } catch {
      // Surface a friendly retry message inline.
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "Something went wrong on my side. Try again or close this and come back later — your room isn't going anywhere.",
        },
      ]);
      setPhase("ack");
    }
  }

  function handleChip(chip: "right" | "mostly") {
    if (chip === "right") {
      void sendReply("It feels right.");
      return;
    }
    setShowInput(true);
  }

  async function handleBadge(accept: boolean) {
    track("founding_badge_offered_response", { accepted: accept });
    try {
      await fetch(withBasePath("/api/clio/founding-feedback"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "badge", accept }),
      });
    } catch {
      /* non-blocking */
    }
    onClose(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void sendReply(input);
  }

  function handleClose() {
    track("founding_feedback_closed_by_user", {
      responded: respondedThisSession,
    });
    onClose(respondedThisSession);
  }

  if (!open) return null;

  // ── Badge offer modal (fourth state) ──────────────────────────
  if (phase === "badge_offer") {
    return (
      <div
        className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300"
        data-clarity-mask="true"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-lc-card rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
          <div className="bg-gradient-to-br from-amber-50 to-stone-50 px-5 pt-5 pb-3 border-b border-amber-200">
            <span className="text-[10px] uppercase tracking-wider text-lc-clio font-semibold">
              Clio · one more thing
            </span>
            <h2 className="text-base font-semibold text-lc-ink mt-1">
              You&apos;re the founding member.
            </h2>
          </div>
          <div className="px-5 py-4 text-sm text-lc-ink leading-relaxed">
            <p className="mb-2">
              Want a small{" "}
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-lc-clio text-[10px] font-semibold">
                ✦ Founder
              </span>{" "}
              chip next to your name in the Timeline?
            </p>
            <p className="text-lc-muted text-xs">
              You can ask me to remove it later.
            </p>
          </div>
          <div className="border-t border-stone-200 px-5 py-3 flex items-center justify-end gap-2 bg-stone-50/40">
            <button
              type="button"
              onClick={() => handleBadge(false)}
              className="text-xs px-3 py-1.5 rounded-full border border-stone-300 text-lc-muted hover:text-lc-ink transition-colors"
            >
              No thanks
            </button>
            <button
              type="button"
              onClick={() => handleBadge(true)}
              className="text-xs px-3 py-1.5 rounded-full bg-lc-clio text-white hover:bg-amber-700 transition-colors"
            >
              Yes, show it
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main feedback modal ───────────────────────────────────────
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
        <div className="bg-gradient-to-br from-amber-50 to-stone-50 px-5 sm:px-6 pt-4 pb-3 border-b border-amber-200">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full bg-lc-clio animate-pulse"
                aria-hidden="true"
              />
              <span className="text-[11px] uppercase tracking-wider text-lc-clio font-semibold">
                Clio · just for you
              </span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-xs text-lc-muted hover:text-lc-ink transition-colors px-1"
              aria-label="Close"
              title="Close — you can come back to this anytime"
            >
              ✕
            </button>
          </div>
          <h2
            id="lc-founding-title"
            className="text-base sm:text-lg font-semibold text-lc-ink"
          >
            A note for you, {founderNickname}.
          </h2>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 min-h-0">
          {phase === "opening" ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative w-6 h-6">
                <div className="absolute inset-0 rounded-full border-2 border-amber-200" />
                <div
                  className="absolute inset-0 rounded-full border-2 border-lc-clio border-t-transparent"
                  style={{ animation: "spin 0.8s linear infinite" }}
                />
              </div>
              <p className="text-xs text-lc-muted mt-3">Clio is opening this with you…</p>
              <style jsx>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {messages.map((msg, i) => (
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
                {phase === "sending" && (
                  <div className="flex items-center gap-2 text-xs text-lc-muted pr-8">
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-lc-clio"
                        style={{
                          animation: "pulse-dot 1.4s ease-in-out infinite",
                        }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-lc-clio"
                        style={{
                          animation: "pulse-dot 1.4s ease-in-out 0.2s infinite",
                        }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-lc-clio"
                        style={{
                          animation: "pulse-dot 1.4s ease-in-out 0.4s infinite",
                        }}
                      />
                    </span>
                    Clio is reading…
                    <style jsx>{`
                      @keyframes pulse-dot {
                        0%, 60%, 100% { opacity: 0.3; }
                        30% { opacity: 1; }
                      }
                    `}</style>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reference panel — only before response */}
              {phase === "ready" && (
                <div className="mt-4 border-t border-stone-200 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowReference((v) => !v)}
                    className="w-full flex items-center justify-between text-xs text-lc-muted hover:text-lc-ink transition-colors py-1"
                  >
                    <span className="font-medium">
                      {showReference ? "Hide" : "See"} what&apos;s set up here
                    </span>
                    <span aria-hidden="true">{showReference ? "▲" : "▼"}</span>
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
                          Seed questions
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
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 px-5 sm:px-6 py-3 bg-stone-50/40">
          {phase === "ack" ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-lc-muted">
                The room is yours. Come back anytime.
              </span>
              <button
                type="button"
                onClick={() => onClose(true)}
                className="px-4 py-1.5 bg-lc-clio text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : phase === "ready" && showInput ? (
            <form onSubmit={handleSubmit} className="space-y-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell Clio what's off — the description, seed questions, Sage's tone, anything."
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
                  disabled={!input.trim()}
                  className="px-4 py-1.5 bg-lc-clio text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </form>
          ) : phase === "ready" ? (
            <div className="flex flex-wrap gap-2 justify-end items-center">
              <button
                type="button"
                onClick={handleClose}
                className="text-xs text-lc-muted hover:text-lc-ink transition-colors px-2 py-1.5 mr-auto"
              >
                Not now
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
