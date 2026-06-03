"use client";

/**
 * FeedbackModal — anonymous member feedback.
 *
 * Opened from the HelpMenu. Members can send any number of feedbacks.
 * Each submission is anonymous (no user_id stored). Categories help
 * admins triage without exposing identity.
 */

import { useState, type FormEvent } from "react";
import { withBasePath } from "@/lib/path";
import { track } from "@/lib/track";

interface Props {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { value: "bug", label: "Bug" },
  { value: "feature_request", label: "Feature request" },
  { value: "general", label: "General" },
  { value: "content_issue", label: "Content issue" },
];

export default function FeedbackModal({ open, onClose }: Props) {
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    setState("sending");
    setErrorMsg("");
    track("feedback_submitted", { category });

    try {
      const res = await fetch(withBasePath("/api/feedback"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message: trimmed }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to send feedback");
      }

      setState("sent");
      setMessage("");
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  function handleClose() {
    onClose();
    // Reset after a short delay so the modal contents don't flash on next open
    setTimeout(() => {
      setCategory("general");
      setMessage("");
      setState("idle");
      setErrorMsg("");
    }, 200);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="husl-feedback-title"
    >
      <div className="bg-husl-card dark:bg-[#14161a] rounded-2xl shadow-2xl max-w-md w-full flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-5 sm:px-6 pt-4 pb-3 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between mb-1">
            <h2
              id="husl-feedback-title"
              className="text-base sm:text-lg font-semibold text-husl-ink dark:text-white"
            >
              Send feedback
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="text-xs text-husl-muted hover:text-husl-ink dark:hover:text-stone-200 transition-colors px-1"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-husl-muted dark:text-stone-400">
            Anonymous — no name attached. Send as many as you like.
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4">
          {state === "sent" ? (
            <div className="text-center py-6">
              <p className="text-sm text-husl-ink dark:text-stone-200 font-medium mb-1">
                Sent.
              </p>
              <p className="text-xs text-husl-muted dark:text-stone-400">
                Thanks for helping make this room better.
              </p>
            </div>
          ) : (
            <form id="feedback-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="feedback-category"
                  className="block text-sm font-medium text-husl-ink dark:text-stone-200 mb-1.5"
                >
                  Category
                </label>
                <select
                  id="feedback-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-husl-card dark:bg-[#1a1c20] focus:outline-none focus:ring-2 focus:ring-husl-clio focus:border-transparent text-sm text-husl-ink dark:text-stone-200 transition-colors"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="feedback-message"
                  className="block text-sm font-medium text-husl-ink dark:text-stone-200 mb-1.5"
                >
                  What&apos;s on your mind?
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Bug, idea, confusion — whatever it is."
                  rows={4}
                  required
                  className="w-full resize-none text-sm px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-husl-card dark:bg-[#1a1c20] focus:outline-none focus:ring-2 focus:ring-husl-clio focus:border-transparent text-husl-ink dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-colors"
                />
              </div>

              {errorMsg && (
                <p className="text-rose-600 text-xs bg-rose-50 p-2 rounded">
                  {errorMsg}
                </p>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        {state !== "sent" && (
          <div className="border-t border-stone-200 dark:border-stone-700 px-5 sm:px-6 py-3 flex items-center justify-end gap-2 bg-stone-50/40 dark:bg-stone-900/40">
            <button
              type="button"
              onClick={handleClose}
              className="text-xs px-3 py-1.5 rounded-full border border-stone-300 text-husl-muted hover:text-husl-ink dark:hover:text-stone-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="feedback-form"
              disabled={state === "sending" || !message.trim()}
              className="text-xs px-4 py-1.5 rounded-full bg-husl-clio text-white hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {state === "sending" ? "Sending…" : "Send feedback"}
            </button>
          </div>
        )}

        {state === "sent" && (
          <div className="border-t border-stone-200 dark:border-stone-700 px-5 sm:px-6 py-3 flex items-center justify-end bg-stone-50/40 dark:bg-stone-900/40">
            <button
              type="button"
              onClick={handleClose}
              className="text-xs px-4 py-1.5 rounded-full bg-husl-clio text-white hover:bg-amber-700 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
