"use client";

import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { createClient } from "@/lib/supabase-browser";
import { PostWithAuthor } from "@/lib/types";
import { pickClusterNudge } from "@/lib/clio-nudges";
import { track } from "@/lib/track";
import { usePresence } from "@/lib/presence-context";

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
  placeholder,
  onOptimisticPost,
  onReplaceOptimistic,
  onRemoveOptimistic,
}: PostComposerProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [nudgePlaceholder, setNudgePlaceholder] = useState(
    "Share what's on your heart, ask a question, or just talk..."
  );
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { emitTyping } = usePresence();

  // Derive the placeholder from today's nudge — same nudge all day,
  // different per user. Only computed client-side to avoid hydration mismatch.
  useEffect(() => {
    const nudge = pickClusterNudge(userId);
    setNudgePlaceholder(nudge.text);
  }, [userId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setError(null);
    const supabase = createClient();
    const questionText = content.trim();

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

    onReplaceOptimistic?.(tempId, newPost as PostWithAuthor);

    track(replyTo ? "post_replied" : "post_created", {
      post_id: newPost.id,
      length: questionText.length,
      mentions_sage: /@sage\b/i.test(questionText),
    });

    fetch("/api/sage/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: newPost.id, cluster_id: null }),
    }).catch(() => {});
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

  const activePlaceholder = placeholder ?? nudgePlaceholder;

  return (
    /**
     * Compose bar — the room's welcome surface.
     *
     * Visual intent: this should feel like the most inviting element in
     * the room. Warmer background than the feed, slightly more padding,
     * a nudge that names a real reason to speak rather than a generic
     * "write something" prompt.
     *
     * The nudge IS the placeholder — it rotates daily per user so it
     * doesn't feel scripted. When the user starts typing, it disappears
     * naturally (placeholder behaviour). No separate nudge strip above
     * the textarea — that was a second cognitive element competing with
     * the input itself.
     */
    <div className="bg-[#faf9f6] border-t border-amber-100/80 px-4 py-4 shadow-[0_-2px_12px_-4px_rgba(0,0,0,0.06)]">
      <div className="max-w-4xl mx-auto">
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
                if (e.target.value.length > 0) emitTyping();
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={activePlaceholder}
              rows={focused || content.length > 0 ? 2 : 1}
              className={`w-full px-4 py-3 rounded-2xl border
                         focus:outline-none focus:ring-2 focus:ring-aggilo-deep/20 focus:border-aggilo-deep/40
                         resize-none text-sm text-gray-800 placeholder:text-gray-400/80
                         transition-all duration-200 leading-relaxed
                         ${focused || content.length > 0
                           ? "border-aggilo-deep/30 bg-white shadow-sm"
                           : "border-amber-200/60 bg-white/70"
                         }`}
            />
          </div>

          <div className="flex items-center gap-2 pb-0.5">
            <button
              type="submit"
              disabled={!content.trim()}
              aria-label="Send"
              className="w-10 h-10 rounded-full bg-aggilo-deep text-white
                         flex items-center justify-center
                         hover:bg-aggilo-mid disabled:opacity-30
                         disabled:cursor-not-allowed transition-all duration-200
                         hover:scale-105 active:scale-95"
            >
              <svg
                className="w-4 h-4"
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

        {/* Minimal footer — only visible when not composing */}
        {!focused && !content && (
          <p className="text-[11px] text-gray-400/70 mt-2 ml-1">
            Verified sources only · Ctrl+Enter to send
          </p>
        )}
      </div>
    </div>
  );
}
