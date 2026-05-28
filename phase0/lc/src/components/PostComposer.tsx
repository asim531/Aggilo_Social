"use client";

/**
 * PostComposer — Long Conversation.
 *
 * Sticky bottom compose bar. Two operations on submit:
 *   1. Insert the post into Supabase (writes the row, RLS authorises by
 *      auth.uid() = author_id; Realtime fires INSERT to the cluster channel).
 *   2. Fire-and-forget POST to /api/sage/evaluate so Sage can decide
 *      whether to respond. The user never waits for Sage.
 *
 * Optimistic UX: the post appears in the feed immediately on submit,
 * before the Supabase write returns. If the server rejects, we roll
 * back. The realtime channel's later INSERT for the same row is
 * deduplicated by id in useRealtimePosts.
 *
 * The placeholder rotates through cluster-specific prompts. None of
 * them are scripts — they are invitations. They follow the rule from
 * the cluster spec: "Nobody's set the tone yet" / "What's the version
 * of this you've actually lived?" — present tense, specific,
 * non-prescriptive.
 */

import { useState, useCallback, type FormEvent } from "react";
import { createClient } from "@/lib/supabase-browser";
import { CLUSTER_ID } from "@/lib/cluster";
import { withBasePath } from "@/lib/path";
import { track } from "@/lib/track";
import type { PostWithAuthor, Profile } from "@/lib/types";

interface PostComposerProps {
  userId: string;
  profile: Profile;
  onOptimisticPost: (post: PostWithAuthor) => void;
  onConfirmPost: (tempId: string, confirmed: PostWithAuthor) => void;
  onSageInvoked?: (threadRootId: string) => void;
}

const PLACEHOLDERS = [
  "What's the conversation you keep almost having?",
  "Say the thing that's actually true.",
  "Nobody's set the tone yet.",
  "What's the version of this you've actually lived?",
  "Worth saying it the way you'd say it to a friend.",
];

function pickPlaceholder(): string {
  // Deterministic per session to avoid jumpiness mid-typing
  if (typeof window === "undefined") return PLACEHOLDERS[0];
  const sessionKey = "lc:composer_placeholder_v1";
  const cached = window.sessionStorage.getItem(sessionKey);
  if (cached !== null) {
    const idx = parseInt(cached, 10);
    if (!Number.isNaN(idx) && idx >= 0 && idx < PLACEHOLDERS.length) {
      return PLACEHOLDERS[idx];
    }
  }
  const idx = Math.floor(Math.random() * PLACEHOLDERS.length);
  window.sessionStorage.setItem(sessionKey, String(idx));
  return PLACEHOLDERS[idx];
}

export default function PostComposer({
  userId,
  profile,
  onOptimisticPost,
  onConfirmPost,
  onSageInvoked,
}: PostComposerProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestingTip, setRequestingTip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const placeholder = pickPlaceholder();

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const trimmed = content.trim();
      if (!trimmed || submitting) return;

      setSubmitting(true);
      setError(null);

      // ── Optimistic insert ──────────────────────────────────────
      const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const now = new Date().toISOString();
      const optimisticPost: PostWithAuthor = {
        id: tempId,
        cluster_id: CLUSTER_ID,
        author_id: userId,
        parent_id: null,
        content: trimmed,
        is_sage: false,
        is_sage_question: false,
        thread_state: "unattended",
        created_at: now,
        profiles: profile,
      };
      onOptimisticPost(optimisticPost);
      track("post_composed", { length: trimmed.length });
      setContent("");

      // ── Server insert ──────────────────────────────────────────
      // Two-step approach (resilient to embed ambiguity):
      //   1. INSERT and return the basic row (no embed)
      //   2. attach the current user's profile in memory
      // This avoids depending on the FK-disambiguation hint at insert
      // time and gives a clean error path when only the insert fails.
      const supabase = createClient();
      const { data: inserted, error: insertError } = await supabase
        .from("posts")
        .insert({
          cluster_id: CLUSTER_ID,
          author_id: userId,
          content: trimmed,
          is_sage: false,
          is_sage_question: false,
          thread_state: "unattended",
        })
        .select("*")
        .single();

      if (insertError || !inserted) {
        // Roll back the optimistic insert by surfacing an error and
        // re-populating the textarea so the user can retry.
        const detail = insertError?.message ?? "unknown error";
        // Console-log the actual error so devs can debug — the inline
        // message stays generic for the user.
        console.warn("[PostComposer] insert failed:", detail, insertError);
        setError(`Couldn't post that. ${detail}`);
        setContent(trimmed);
        track("post_compose_failed", { reason: detail });
        setSubmitting(false);
        return;
      }

      // Attach the current user's profile. The realtime UPDATE/INSERT
      // events that other clients receive use a separate hydration
      // path (see useRealtimePosts), so this attachment is local to
      // the optimistic→confirmed swap on this client only.
      const confirmed: PostWithAuthor = {
        ...(inserted as PostWithAuthor),
        profiles: profile,
      };

      onConfirmPost(tempId, confirmed);
      track("post_compose_confirmed");

      // ── Fire-and-forget Sage evaluation ─────────────────────────
      // Don't await — Sage runs async, her response (if any) lands via
      // Realtime as a separate post.
      const mentionsSage = /@sage\b/i.test(trimmed);
      if (mentionsSage && onSageInvoked) {
        onSageInvoked(inserted.id);
      }
      void fetch(withBasePath("/api/sage/evaluate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: inserted.id }),
      }).catch(() => {
        // Silent failure — Sage staying silent is a valid outcome anyway.
      });

      setSubmitting(false);
    },
    [content, submitting, userId, profile, onOptimisticPost, onConfirmPost, onSageInvoked]
  );

  const handleTipMe = useCallback(async () => {
    if (requestingTip) return;
    setRequestingTip(true);
    setError(null);
    try {
      const res = await fetch(withBasePath("/api/agents/clio-tips/manual"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, nickname: profile.nickname }),
      });
      if (res.ok) {
        window.dispatchEvent(new Event("clio-tip-inserted"));
      } else {
        const body = await res.json().catch(() => ({}));
        console.error("Tip request failed:", body);
        setError("Clio couldn't generate a tip right now. Try again later.");
      }
    } catch (err) {
      console.error("Failed to request tip:", err);
      setError("Couldn't reach Clio. Check your connection.");
    } finally {
      setRequestingTip(false);
    }
  }, [userId, profile.nickname, requestingTip]);

  return (
    <div className="sticky bottom-0 z-30 bg-lc-card/95 backdrop-blur border-t border-stone-200">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex gap-2 items-end">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={1}
            maxLength={2000}
            className="flex-1 resize-none px-3 py-2.5 rounded-lg border border-stone-300 bg-lc-card focus:outline-none focus:ring-2 focus:ring-lc-clio focus:border-transparent text-sm text-lc-ink placeholder:text-stone-400 min-h-[44px] max-h-32"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void handleSubmit(e as unknown as FormEvent);
              }
            }}
          />
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="px-4 py-2.5 rounded-lg font-medium text-white bg-lc-clio hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {submitting ? "…" : "Post"}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-xs text-rose-600">{error}</p>
        )}
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <p className="text-[11px] text-lc-muted">
              Words are your entire presence here. Cmd/Ctrl + Enter to send.
            </p>
            <p className="text-[10px] text-lc-clio/80">
              Mention @Sage if you want a thoughtful response.
            </p>
          </div>
          <button
            type="button"
            onClick={handleTipMe}
            disabled={requestingTip}
            className="text-[11px] text-lc-clio hover:text-amber-700 transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {requestingTip ? "Asking Clio..." : "Tip me, Clio"}
          </button>
        </div>
      </form>
    </div>
  );
}
