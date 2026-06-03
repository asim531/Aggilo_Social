"use client";

/**
 * FoundingFeedbackPrompt — Research Circle MJ.
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
  tagline: "Where your research stays findable — nothing gets lost.",
  description:
    "A persistent workspace for faculty and researchers at Muffakham Jah College to share drafts, trace ideas across conversations, and keep documents connected to the threads that shape them. Every post and document is topic-tagged and retrievable.",
  seedQuestions: [
    "What's the research question you're currently chasing — the one that keeps showing up in different forms across your work?",
    "If someone in this college had already solved the problem you're stuck on, what would you want to ask them?",
    "What's the document or paper you keep coming back to — the one that shaped how you think about your field?",
    "Research often happens in isolation here. What's the conversation about your work that you wish you were having more often?",
    "If every document and discussion in this group stayed findable forever, what would you share first?",
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
        <div className="bg-husl-card rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
          <div className="bg-gradient-to-br from-amber-50 to-stone-50 px-5 pt-5 pb-3 border-b border-amber-200">
            <span className="text-[10px] uppercase tracking-wider text-husl-clio font-semibold">
              Clio · one more thing
            </span>
            <h2 className="text-base font-semibold text-husl-ink mt-1">
              You&apos;re the founding member.
            </h2>
          </div>
          <div className="px-5 py-4 text-sm text-husl-ink leading-relaxed">
            <p className="mb-2">
              Want a small{" "}
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-husl-clio text-[10px] font-semibold">
                ✦ Founder
              </span>{" "}
              chip next to your name in the Timeline?
            </p>
            <p className="text-husl-muted text-xs">
              You can ask me to remove it later.
            </p>
          </div>
          <div className="border-t border-stone-200 px-5 py-3 flex items-center justify-end gap-2 bg-stone-50/40">
            <button
              type="button"
              onClick={() => handleBadge(false)}
              className="text-xs px-3 py-1.5 rounded-full border border-stone-300 text-husl-muted hover:text-husl-ink transition-colors"
            >
              No thanks
            </button>
            <button
              type="button"
              onClick={() => handleBadge(true)}
              className="text-xs px-3 py-1.5 rounded-full bg-husl-clio text-white hover:bg-amber-700 transition-colors"
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
      aria-labelledby="husl-founding-title"
    >
      <div className="bg-husl-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-50 to-stone-50 px-5 sm:px-6 pt-4 pb-3 border-b border-amber-200">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full bg-husl-clio animate-pulse"
                aria-hidden="true"
              />
              <span className="text-[11px] uppercase tracking-wider text-husl-clio font-semibold">
                Clio · just for you
              </span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-xs text-husl-muted hover:text-husl-ink transition-colors px-1"
              aria-label="Close"
              title="Close — you can come back to this anytime"
            >
              ✕
            </button>
          </div>
          <h2
            id="husl-founding-title"
            className="text-base sm:text-lg font-semibold text-husl-ink"
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
                  className="absolute inset-0 rounded-full border-2 border-husl-clio border-t-transparent"
                  style={{ animation: "spin 0.8s linear infinite" }}
                />
              </div>
              <p className="text-xs text-husl-muted mt-3">Clio is opening this with you…</p>
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
                        ? "text-husl-ink text-right pl-8"
                        : "text-husl-ink pr-8"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
                {phase === "sending" && (
                  <div className="flex items-center gap-2 text-xs text-husl-muted pr-8">
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-husl-clio"
                        style={{
                          animation: "pulse-dot 1.4s ease-in-out infinite",
                        }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-husl-clio"
                        style={{
                          animation: "pulse-dot 1.4s ease-in-out 0.2s infinite",
                        }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-husl-clio"
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
                    className="w-full flex items-center justify-between text-xs text-husl-muted hover:text-husl-ink transition-colors py-1"
                  >
                    <span className="font-medium">
                      {showReference ? "Hide" : "See"} what&apos;s set up here
                    </span>
                    <span aria-hidden="true">{showReference ? "▲" : "▼"}</span>
                  </button>
                  {showReference && (
                    <div className="mt-2 p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs text-husl-ink space-y-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-husl-muted font-semibold mb-1">
                          Tagline
                        </p>
                        <p className="italic">{CLUSTER_REFERENCE.tagline}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-husl-muted font-semibold mb-1">
                          Description
                        </p>
                        <p className="leading-relaxed">
                          {CLUSTER_REFERENCE.description}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-husl-muted font-semibold mb-1">
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
              <span className="text-[11px] text-husl-muted">
                The room is yours. Come back anytime.
              </span>
              <button
                type="button"
                onClick={() => onClose(true)}
                className="px-4 py-1.5 bg-husl-clio text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
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
                className="w-full resize-none text-sm px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-husl-clio focus:border-transparent text-husl-ink placeholder:text-stone-400"
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
                  className="text-xs text-husl-muted hover:text-husl-ink transition-colors"
                >
                  ← Back to options
                </button>
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="px-4 py-1.5 bg-husl-clio text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                className="text-xs text-husl-muted hover:text-husl-ink transition-colors px-2 py-1.5 mr-auto"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={() => handleChip("mostly")}
                className="text-xs px-3 py-1.5 rounded-full border border-amber-300 text-husl-clio hover:bg-amber-50 transition-colors"
              >
                Mostly right but…
              </button>
              <button
                type="button"
                onClick={() => handleChip("right")}
                className="text-xs px-3 py-1.5 rounded-full bg-husl-clio text-white hover:bg-amber-700 transition-colors"
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
