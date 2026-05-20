"use client";

import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { createClient } from "@/lib/supabase-browser";
import { PostWithAuthor } from "@/lib/types";
import { pickClusterNudge, type ClusterNudge } from "@/lib/clio-nudges";
import { track } from "@/lib/track";

interface PostComposerProps {
  userId: string;
  replyTo?: string | null;
  onCancelReply?: () => void;
  placeholder?: string;
  onOptimisticPost?: (post: PostWithAuthor) => void;
  onReplaceOptimistic?: (tempId: string, real: PostWithAuthor) => void;
  onRemoveOptimistic?: (tempId: string) => void;
}

export default function PostComposer({
  userId,
  replyTo,
  onCancelReply,
  placeholder = "Share what's on your heart, ask a question, or just talk...",
  onOptimisticPost,
  onReplaceOptimistic,
  onRemoveOptimistic,
}: PostComposerProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [nudge, setNudge] = useState<ClusterNudge | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Pick today's nudge for this user — deterministic, rotates per-day.
  // Only render after mount so the daily index is computed client-side
  // (avoids SSR/CSR hydration mismatch around UTC day boundaries).
  useEffect(() => {
    setNudge(pickClusterNudge(userId));
  }, [userId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setError(null);
    const supabase = createClient();
    const questionText = content.trim();

    // ── Priority 1: Optimistic post — appears immediately ────────────────
    const tempId = `optimistic-${crypto.randomUUID()}`;
    const optimisticPost: PostWithAuthor = {
      id: tempId,
      author_id: userId,
      parent_id: replyTo || null,
      content: questionText,
      is_sage: false,
      is_sage_question: false,
      thread_state: "unattended",
      post_subtype: null,
      sage_handoff_to_clio_at: null,
      sage_handoff_reason: null,
      link_url: null,
      link_alignment: null,
      link_meta: null,
      created_at: new Date().toISOString(),
      profiles: null,
    };
    onOptimisticPost?.(optimisticPost);
    setContent("");
    if (onCancelReply) onCancelReply();
    textareaRef.current?.focus();

    // ── Save to Supabase async ────────────────────────────────────────────
    const { data: newPost, error: postError } = await supabase
      .from("posts")
      .insert({
        author_id: userId,
        content: questionText,
        parent_id: replyTo || null,
        is_sage: false,
        is_sage_question: false,
      })
      .select("*, profiles(*)")
      .single();

    if (postError || !newPost) {
      console.error("Failed to create post:", postError);
      onRemoveOptimistic?.(tempId);
      setError("Could not post. Try again.");
      return;
    }

    // Replace optimistic entry with the confirmed post
    onReplaceOptimistic?.(tempId, newPost as PostWithAuthor);

    // Closed-loop telemetry — fire-and-forget
    track(replyTo ? "post_replied" : "post_created", {
      post_id: newPost.id,
      length: questionText.length,
      mentions_sage: /@sage\b/i.test(questionText),
    });

    // ── Priority 2: Sage evaluation — fires AFTER save, never blocks ─────
    fetch("/api/sage/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: newPost.id, cluster_id: null }),
    }).catch(() => {
      // Sage evaluation failure is silent — never surfaces to user
    });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  }

  function handleInput() {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px";
    }
  }

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-3">
      <div className="max-w-4xl mx-auto">
        {/* Daily nudge — passive motivation, not a script. Hidden when
            the user is replying or is mid-compose so it doesn't crowd. */}
        {nudge && !replyTo && !content && (
          <div className="mb-2 px-3 py-1.5 rounded-lg bg-amber-50/60 border-l-2 border-amber-400/70">
            <p className="text-[12px] text-gray-600 leading-snug italic">
              <span className="text-amber-700/80 font-semibold not-italic mr-1.5">
                Today
              </span>
              {nudge.text}
            </p>
          </div>
        )}

        {replyTo && (
          <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
            <span>Replying to a post</span>
            <button
              onClick={onCancelReply}
              className="text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 mb-2">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                handleInput();
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200
                         focus:outline-none focus:ring-2 focus:ring-aggilo-deep/30 focus:border-aggilo-deep/50
                         resize-none
                         text-sm text-gray-800 placeholder:text-gray-400
                         transition-all duration-200"
            />
          </div>

          <div className="flex items-center gap-2 pb-0.5">
            <button
              type="submit"
              disabled={!content.trim()}
              className="p-2 rounded-lg bg-aggilo-deep text-white
                         hover:bg-aggilo-mid disabled:opacity-30
                         disabled:cursor-not-allowed transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14m-7-7l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-400 mt-1.5 ml-1">
          Verified sources only. Quran and authentic Sunnah. Ctrl+Enter to send.
        </p>
      </div>
    </div>
  );
}
