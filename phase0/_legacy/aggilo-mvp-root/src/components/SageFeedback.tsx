"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/track";

/**
 * SageFeedback — small thumbs-up / thumbs-down affordance under a Sage
 * Timeline card. One signal per user per post. Toggling by re-tapping.
 *
 * Closed-loop on agent quality: feedback rows feed Clio's prompt
 * improvisation loop, so Sage refines based on what landed and what
 * didn't. Members never see counts — this is private signal, not a
 * popularity metric.
 *
 * Visual register: muted, monochrome, low-pressure. The signal exists
 * for those who want to give it; it never colonizes the post.
 */

interface Props {
  postId: string;
  agent?: "sage" | "clio";
}

type Signal = "helpful" | "unhelpful" | "inaccurate" | null;

export default function SageFeedback({ postId, agent = "sage" }: Props) {
  const [active, setActive] = useState<Signal>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/feedback?post_id=${postId}`);
        if (!res.ok) return;
        const data: { signals?: Array<{ signal: Signal }> } = await res.json();
        if (!cancelled && data.signals && data.signals.length > 0) {
          setActive(data.signals[0].signal);
        }
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  async function send(signal: Exclude<Signal, null>) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent,
          related_post_id: postId,
          signal,
        }),
      });
      const data: { toggled?: "added" | "removed" } = await res.json();
      if (data.toggled === "added") {
        setActive(signal);
        track("sage_feedback_given", { post_id: postId, signal });
      } else if (data.toggled === "removed") {
        setActive(null);
      }
    } catch {
      /* silent */
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  const baseBtn =
    "px-2 py-0.5 rounded text-[11px] transition-colors flex items-center gap-1 disabled:opacity-50";

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        type="button"
        disabled={submitting}
        onClick={() => send("helpful")}
        title="This helped"
        aria-label="This helped"
        className={`${baseBtn} ${
          active === "helpful"
            ? "bg-emerald-100 text-emerald-700"
            : "text-gray-400 hover:text-emerald-700 hover:bg-emerald-50"
        }`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
        <span>Helpful</span>
      </button>
      <button
        type="button"
        disabled={submitting}
        onClick={() => send("unhelpful")}
        title="This missed"
        aria-label="This missed"
        className={`${baseBtn} ${
          active === "unhelpful"
            ? "bg-amber-100 text-amber-700"
            : "text-gray-400 hover:text-amber-700 hover:bg-amber-50"
        }`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
        </svg>
        <span>Missed</span>
      </button>
      <button
        type="button"
        disabled={submitting}
        onClick={() => send("inaccurate")}
        title="The reference looks off"
        aria-label="Inaccurate"
        className={`${baseBtn} ${
          active === "inaccurate"
            ? "bg-rose-100 text-rose-700"
            : "text-gray-400 hover:text-rose-700 hover:bg-rose-50"
        }`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Off</span>
      </button>
    </div>
  );
}
