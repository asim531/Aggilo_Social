"use client";

/**
 * PostCard — Research Circle MJ.
 *
 * Renders a single post in the Timeline plus its replies (if any).
 *
 * Three visual modes:
 *   - Member post (top level): white card, nickname, timestamp, content
 *   - Sage post: subtle teal-tinted card, "Sage · Anchor" label
 *   - Reply: indented under its parent, smaller, with the same agent /
 *     member visual distinction
 *
 * Welfare-flagged posts get a quiet rose left-border accent. The
 * thread is technically held by Sage's deterministic care-witness
 * reply attached as a child.
 *
 * The component is reply-aware: it accepts an optional `replies`
 * array (already filtered to children of this post by ClusterFeed)
 * and renders them inline under the parent. Replies do not nest
 * further — the platform UX deliberately keeps threading shallow
 * (one level deep) so the conversation stays linear.
 */

import { useState, useRef, useEffect } from "react";
import type { PostWithAuthor, Profile, Topic, PostAttachment } from "@/lib/types";
import { withBasePath } from "@/lib/path";
import LinkPreviewCard, { extractUrls, renderTextWithLinks } from "@/components/LinkPreviewCard";
import TopicChip from "@/components/TopicChip";
import ResearchPaperCard from "@/components/ResearchPaperCard";
import ThinkingIndicator from "@/components/ThinkingIndicator";
import { track } from "@/lib/track";
import { createClient } from "@/lib/supabase-browser";
import { CLUSTER_ID } from "@/lib/cluster";

interface PostCardProps {
  post: PostWithAuthor;
  replies?: PostWithAuthor[];
  /** Currently signed-in user id, needed to enable the reply form and paper tools. */
  userId?: string;
  /** Currently signed-in user profile, needed for optimistic insertion. */
  currentProfile?: Profile;
  /** Callback for the realtime hook to inject an optimistic reply. */
  onOptimisticReply?: (post: PostWithAuthor) => void;
  onConfirmReply?: (tempId: string, confirmed: PostWithAuthor) => void;
  /** Called when a post is edited so the parent feed can update its state. */
  onPostEdited?: (update: Partial<PostWithAuthor> & { id: string }) => void;
  /** True when Sage is processing a response for this thread. */
  sageThinking?: boolean;
  /** Signal that @Sage was invoked for a given thread root id. */
  onSageInvoked?: (threadRootId: string) => void;
  /** Called when a topic chip on this post is clicked — should filter feed. */
  onSelectTopic?: (topic: Topic) => void;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function PostCard({
  post,
  replies = [],
  userId,
  currentProfile,
  onOptimisticReply,
  onConfirmReply,
  onPostEdited,
  sageThinking,
  onSageInvoked,
  onSelectTopic,
}: PostCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ── Reactions ─────────────────────────────────────────────────────
  const [reactionCount, setReactionCount] = useState(0);
  const [hasReacted, setHasReacted] = useState(false);
  const [reacting, setReacting] = useState(false);

  useEffect(() => {
    if (!post.id) return;
    const supabase = createClient();
    supabase
      .from("post_reactions")
      .select("id, author_id", { count: "exact" })
      .eq("post_id", post.id)
      .then(({ count, data }) => {
        setReactionCount(count ?? 0);
        setHasReacted(data?.some((r) => r.author_id === userId) ?? false);
      });

    const channel = supabase
      .channel(`reactions-${post.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_reactions", filter: `post_id=eq.${post.id}` },
        () => {
          supabase
            .from("post_reactions")
            .select("id, author_id", { count: "exact" })
            .eq("post_id", post.id)
            .then(({ count, data }) => {
              setReactionCount(count ?? 0);
              setHasReacted(data?.some((r) => r.author_id === userId) ?? false);
            });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [post.id, userId]);

  async function toggleReaction() {
    if (!userId || reacting) return;
    setReacting(true);

    // Optimistic: flip UI immediately
    const wasReacted = hasReacted;
    setHasReacted(!wasReacted);
    setReactionCount((c) => (wasReacted ? Math.max(0, c - 1) : c + 1));

    const supabase = createClient();
    if (wasReacted) {
      const { error } = await supabase.from("post_reactions").delete().eq("post_id", post.id).eq("author_id", userId);
      if (error) {
        // Rollback on error
        setHasReacted(true);
        setReactionCount((c) => c + 1);
      }
    } else {
      const { error } = await supabase.from("post_reactions").insert({ post_id: post.id, author_id: userId, type: "thumbs_up" });
      if (error) {
        // Rollback on error
        setHasReacted(false);
        setReactionCount((c) => Math.max(0, c - 1));
      }
    }
    setReacting(false);
  }

  // ── Unread reply tracking ────────────────────────────────────────
  // We stamp the last-seen reply count per post in localStorage. The
  // dot shows when current replies.length > stored count. Cleared on
  // first render after the user has had a chance to see it (we mark
  // as seen 3s after mount if the dot is showing).
  const isOwnPost = post.author_id === userId;
  const storageKey = `lc:seen-replies:${post.id}`;
  const [seenReplyCount, setSeenReplyCount] = useState<number>(() => {
    if (typeof window === "undefined") return replies.length;
    if (!isOwnPost) return replies.length;
    const stored = window.localStorage.getItem(storageKey);
    if (stored === null) {
      // First time seeing this post — treat current count as baseline
      // unless replies arrived after post creation (i.e. there's news).
      // To be safe, we DO mark new replies as unread on first load if any exist.
      window.localStorage.setItem(storageKey, "0");
      return 0;
    }
    const parsed = parseInt(stored, 10);
    return Number.isNaN(parsed) ? replies.length : parsed;
  });
  const hasUnreadReplies =
    isOwnPost && replies.length > seenReplyCount;

  // Mark replies as seen when the user has had a moment to notice
  // the indicator (3s after the count changes). This prevents the
  // dot from disappearing instantly on render.
  useEffect(() => {
    if (!isOwnPost) return;
    if (typeof window === "undefined") return;
    if (replies.length === seenReplyCount) return;
    const t = setTimeout(() => {
      window.localStorage.setItem(storageKey, String(replies.length));
      setSeenReplyCount(replies.length);
    }, 3000);
    return () => clearTimeout(t);
  }, [isOwnPost, replies.length, seenReplyCount, storageKey]);

  // Welfare-flagged posts get a rose accent (lowest-saturation; the
  // platform safety floor is calibrated to be present without alarming).
  const isWelfare = post.thread_state === "welfare_flagged";

  const canReply = Boolean(
    userId && currentProfile && onOptimisticReply && onConfirmReply
  );

  async function handleEditSubmit() {
    if (!userId || post.author_id !== userId) return;
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === post.content) {
      setIsEditing(false);
      return;
    }
    setEditSubmitting(true);
    setEditError(null);
    try {
      const res = await fetch(withBasePath(`/api/posts/${post.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      const data = (await res.json()) as { post?: PostWithAuthor; error?: string };
      if (!res.ok || !data.post) {
        setEditError(data.error ?? "Couldn't save changes.");
        setEditSubmitting(false);
        return;
      }
      setIsEditing(false);
      onPostEdited?.(data.post);
    } catch {
      setEditError("Network error. Try again.");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleReplySubmit() {
    if (!canReply) return;
    const trimmed = replyContent.trim();
    if (!trimmed || replying) return;

    setReplying(true);
    setReplyError(null);

    const tempId = `optimistic-reply-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString();
    const optimistic: PostWithAuthor = {
      id: tempId,
      cluster_id: CLUSTER_ID,
      author_id: userId!,
      parent_id: post.id,
      content: trimmed,
      is_sage: false,
      is_sage_question: false,
      thread_state: "unattended",
      created_at: now,
      profiles: currentProfile!,
    };
    onOptimisticReply!(optimistic);
    track("reply_composed", { length: trimmed.length, parent_id: post.id });
    setReplyContent("");
    setShowReplyForm(false);

    const supabase = createClient();
    const { data: inserted, error: insertError } = await supabase
      .from("posts")
      .insert({
        cluster_id: CLUSTER_ID,
        author_id: userId!,
        parent_id: post.id,
        content: trimmed,
        is_sage: false,
        is_sage_question: false,
        thread_state: "unattended",
      })
      .select("*")
      .single();

    if (insertError || !inserted) {
      const detail = insertError?.message ?? "unknown error";
      console.warn("[PostCard] reply insert failed:", detail, insertError);
      setReplyError(`Couldn't post that. ${detail}`);
      setReplyContent(trimmed);
      setShowReplyForm(true);
      track("reply_compose_failed", { reason: detail });
      setReplying(false);
      return;
    }

    // Attach the current user's profile locally; realtime hydrates
    // for other clients.
    const confirmed: PostWithAuthor = {
      ...(inserted as PostWithAuthor),
      profiles: currentProfile!,
    };
    onConfirmReply!(tempId, confirmed);
    track("reply_compose_confirmed");

    // Fire-and-forget Sage evaluation on the reply too.
    const replyMentionsSage = /@sage\b/i.test(trimmed);
    if (replyMentionsSage && onSageInvoked) {
      // Reply's Sage response threads under the top-level post.
      onSageInvoked(post.id);
    }
    void fetch(withBasePath("/api/sage/evaluate"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: inserted.id }),
    }).catch(() => {});

    setReplying(false);
  }

  return (
    <article
      id={`post-${post.id}`}
      className={
        isWelfare
          ? "rounded-lg border border-husl-welfare/20 bg-husl-welfareSoft/30 border-l-2 border-l-husl-welfare/50"
          : "rounded-lg border border-stone-200 dark:border-stone-800 bg-husl-card dark:bg-[#14161a] transition-colors"
      }
      aria-label={isWelfare ? "Welfare-flagged thread" : undefined}
    >
      {/* Top-level post body — editable when user owns it */}
      {isEditing ? (
        <div className="p-4 bg-husl-card dark:bg-[#14161a]">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            maxLength={2000}
            className="w-full resize-none px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-husl-card dark:bg-[#1a1d22] focus:outline-none focus:ring-2 focus:ring-husl-clio focus:border-transparent text-sm text-husl-ink dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-600"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-husl-muted dark:text-stone-400">
              {editContent.length}/2000
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(post.content);
                  setEditError(null);
                }}
                className="text-xs text-husl-muted dark:text-stone-400 hover:text-husl-ink dark:hover:text-white px-2 py-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleEditSubmit()}
                disabled={!editContent.trim() || editSubmitting || editContent.trim() === post.content}
                className="px-3 py-1.5 rounded bg-husl-clio text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-700 transition-colors"
              >
                {editSubmitting ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
          {editError && (
            <p className="mt-2 text-xs text-rose-600">{editError}</p>
          )}
        </div>
      ) : (
        <PostBody post={post} userId={userId} onSelectTopic={onSelectTopic} />
      )}

      {/* Reply controls + count + reactions */}
      {!isEditing && canReply && (
        <div className="flex items-center gap-3 px-4 pb-3 -mt-1 text-xs">
          <button
            type="button"
            onClick={() => setShowReplyForm((v) => !v)}
            className="text-husl-muted dark:text-stone-400 hover:text-husl-clio dark:hover:text-husl-clio transition-colors"
            aria-expanded={showReplyForm}
          >
            {showReplyForm ? "Cancel reply" : "Reply"}
          </button>
          {post.author_id === userId && !post.is_sage && post.parent_id === null && (
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
                setEditContent(post.content);
                setShowReplyForm(false);
              }}
              className="text-husl-muted dark:text-stone-400 hover:text-husl-clio dark:hover:text-husl-clio transition-colors"
            >
              Edit
            </button>
          )}
          {replies.length > 0 && (
            <span className="text-husl-muted dark:text-stone-400 flex items-center gap-1.5">
              · {replies.length} {replies.length === 1 ? "reply" : "replies"}
              {hasUnreadReplies && (
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full bg-husl-clio animate-pulse"
                  title="New reply since you last looked"
                  aria-label="New reply"
                />
              )}
            </span>
          )}
          <button
            type="button"
            onClick={() => void toggleReaction()}
            disabled={!userId || reacting}
            className={`flex items-center gap-1.5 transition-all rounded-full px-2.5 py-1 text-xs font-semibold border ${
              hasReacted
                ? "text-white bg-husl-clio border-husl-clio shadow-sm"
                : "text-stone-500 dark:text-stone-300 bg-white dark:bg-[#1a1d22] border-stone-200 dark:border-stone-700 hover:border-husl-clio hover:text-husl-clio dark:hover:text-husl-clio shadow-sm"
            }`}
            title={hasReacted ? "Remove thumbs up" : "Thumbs up"}
          >
            <svg className="w-4 h-4" fill={hasReacted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.524 7.04a2 2 0 01-1.789 1.066H9.5a2 2 0 01-2-2v-5.5a2 2 0 012-2h.5m-1-4l1.5 1.5M8 6h.01" />
            </svg>
            {reactionCount === 0 ? (
              <span>Thumbs up</span>
            ) : (
              <span>{reactionCount}</span>
            )}
          </button>
        </div>
      )}

      {/* Reply form (inline) */}
      {showReplyForm && canReply && (
        <div className="border-t border-stone-200 dark:border-stone-800 px-4 py-3 bg-stone-50/40 dark:bg-stone-900/30 transition-colors">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={`Reply to ${post.is_sage ? "Sage" : post.profiles?.nickname ?? "this post"}…`}
            rows={2}
            maxLength={2000}
            autoFocus
            className="w-full resize-none px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-husl-card dark:bg-[#1a1d22] focus:outline-none focus:ring-2 focus:ring-husl-clio focus:border-transparent text-sm text-husl-ink dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-600 min-h-[60px] max-h-32"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void handleReplySubmit();
              }
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-husl-muted dark:text-stone-400">
              Cmd/Ctrl + Enter to send
            </span>
            <button
              type="button"
              onClick={() => void handleReplySubmit()}
              disabled={!replyContent.trim() || replying}
              className="px-3 py-1.5 rounded bg-husl-clio text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-700 transition-colors"
            >
              {replying ? "…" : "Reply"}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-husl-muted dark:text-stone-400">
            Tip: mention{" "}
            <span className="text-husl-sage dark:text-emerald-400 font-medium">@sage</span> to ask
            for analysis, summary, or help with your requirements.
          </p>
          {replyError && (
            <p className="mt-2 text-xs text-rose-600">{replyError}</p>
          )}
        </div>
      )}

      {/* Replies — indented and visually subordinate */}
      {replies.length > 0 && (
        <div className="border-t border-stone-200 dark:border-stone-800 bg-stone-50/30 dark:bg-stone-900/20 divide-y divide-stone-100 dark:divide-stone-800">
          {replies.map((reply) => (
            <ReplyCard key={reply.id} post={reply} userId={userId} onSelectTopic={onSelectTopic} />
          ))}
        </div>
      )}

      {/* Sage thinking indicator */}
      {sageThinking && <ThinkingIndicator agent="sage" />}
    </article>
  );
}

/**
 * The post body — extracted so it can render at top level and inside
 * a reply card without duplication.
 */
function PostBody({ post, userId, onSelectTopic }: { post: PostWithAuthor; userId?: string; onSelectTopic?: (topic: Topic) => void }) {
  if (post.is_sage) {
    return (
      <div className="sage-post p-4 bg-husl-sageSoft/30 dark:bg-[#1a2c2b]/30">
        <header className="flex items-baseline justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="relative w-5 h-5 rounded-full overflow-hidden bg-husl-sageSoft shrink-0">
              <img src={withBasePath("/characters/sage.png")} alt="Sage" className="object-contain w-full h-full" />
            </div>
            <span className="text-xs font-medium text-husl-sage uppercase tracking-wider">
              Sage · Anchor
            </span>
          </div>
          <time
            className="text-xs text-husl-muted dark:text-stone-400"
            dateTime={post.created_at}
            title={new Date(post.created_at).toLocaleString()}
            suppressHydrationWarning
          >
            {formatTimestamp(post.created_at)}
          </time>
        </header>
        <p className="text-sm text-husl-ink dark:text-stone-200 leading-relaxed whitespace-pre-line break-words">
          {renderTextWithLinks(post.content)}
        </p>
        {extractUrls(post.content).map(url => (
          <LinkPreviewCard key={url} url={url} />
        ))}
        <PostMetaRow postId={post.id} userId={userId} onSelectTopic={onSelectTopic} />
      </div>
    );
  }

  return (
    <div className="p-4 bg-husl-card dark:bg-[#14161a]">
      <header className="flex items-baseline justify-between mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <MemberIdentity profile={post.profiles} />
          {(post.profiles as { is_founding_member?: boolean; founding_badge_shown?: boolean } | null)
            ?.is_founding_member &&
            (post.profiles as { founding_badge_shown?: boolean } | null)
              ?.founding_badge_shown && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-husl-clio dark:text-amber-400 text-[10px] font-semibold leading-none">
                ✦ Founder
              </span>
            )}
        </div>
        <time
          className="text-xs text-husl-muted dark:text-stone-400"
          dateTime={post.created_at}
          title={new Date(post.created_at).toLocaleString()}
          suppressHydrationWarning
        >
          {formatTimestamp(post.created_at)}
          {post.edited_at && (
            <span className="text-husl-clio dark:text-amber-400"> · edited</span>
          )}
        </time>
      </header>
      <p className="text-sm text-husl-ink dark:text-stone-200 leading-relaxed whitespace-pre-line break-words">
        {renderTextWithLinks(post.content)}
      </p>
      {extractUrls(post.content).map(url => (
        <LinkPreviewCard key={url} url={url} />
      ))}
      <PostMetaRow postId={post.id} userId={userId} onSelectTopic={onSelectTopic} />
    </div>
  );
}

/**
 * Reply variant — indented, smaller chrome. Sage's care-witness
 * replies in welfare threads render here too.
 */
function ReplyCard({ post, userId, onSelectTopic }: { post: PostWithAuthor; userId?: string; onSelectTopic?: (topic: Topic) => void }) {
  if (post.is_sage) {
    return (
      <div className="px-4 py-3 pl-8 bg-husl-sageSoft/20 border-l-2 border-husl-sage/50">
        <header className="flex items-baseline justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className="relative w-4 h-4 rounded-full overflow-hidden bg-husl-sageSoft shrink-0">
              <img src={withBasePath("/characters/sage.png")} alt="Sage" className="object-contain w-full h-full" />
            </div>
            <span className="text-[10px] font-medium text-husl-sage uppercase tracking-wider">
              Sage · Anchor
            </span>
          </div>
          <time
            className="text-[10px] text-husl-muted dark:text-stone-400"
            dateTime={post.created_at}
            suppressHydrationWarning
          >
            {formatTimestamp(post.created_at)}
          </time>
        </header>
        <p className="text-sm text-husl-ink dark:text-stone-200 leading-relaxed whitespace-pre-line break-words">
          {renderTextWithLinks(post.content)}
        </p>
        {extractUrls(post.content).map(url => (
          <LinkPreviewCard key={url} url={url} />
        ))}
        <PostMetaRow postId={post.id} userId={userId} onSelectTopic={onSelectTopic} />
      </div>
    );
  }

  return (
    <div className="px-4 py-3 pl-8">
      <header className="flex items-baseline justify-between mb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <MemberIdentity profile={post.profiles} />
          {(post.profiles as { is_founding_member?: boolean; founding_badge_shown?: boolean } | null)
            ?.is_founding_member &&
            (post.profiles as { founding_badge_shown?: boolean } | null)
              ?.founding_badge_shown && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-husl-clio dark:text-amber-400 text-[10px] font-semibold leading-none">
                ✦ Founder
              </span>
            )}
        </div>
        <time
          className="text-[10px] text-husl-muted dark:text-stone-400"
          dateTime={post.created_at}
          suppressHydrationWarning
        >
          {formatTimestamp(post.created_at)}
        </time>
      </header>
      <p className="text-sm text-husl-ink dark:text-stone-200 leading-relaxed whitespace-pre-line break-words">
        {renderTextWithLinks(post.content)}
      </p>
      {extractUrls(post.content).map(url => (
        <LinkPreviewCard key={url} url={url} />
      ))}
      <PostMetaRow postId={post.id} onSelectTopic={onSelectTopic} />
    </div>
  );
}

/**
 * PostMetaRow — topics and attachments for a single post.
 * Fetches on mount and subscribes to realtime changes.
 */
function PostMetaRow({ postId, userId, onSelectTopic }: { postId: string; userId?: string; onSelectTopic?: (topic: Topic) => void }) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);
  const [analysisTimedOut, setAnalysisTimedOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      // Fetch topics
      const { data: ptRows } = await supabase
        .from("post_topics")
        .select("topic_id, topics(id, name, slug, color, post_count)")
        .eq("post_id", postId);
      const fetchedTopics = (ptRows ?? [])
        .map((r: any) => r.topics)
        .filter(Boolean) as Topic[];

      // Fetch attachments
      const { data: attRows } = await supabase
        .from("post_attachments")
        .select("*")
        .eq("post_id", postId);

      if (!cancelled) {
        setTopics(fetchedTopics);
        setAttachments((attRows ?? []) as PostAttachment[]);
      }
    }
    load();

    // Polling fallback: re-fetch attachments for 2 min after mount
    // to catch uploads + analysis (~60-90s) that complete after mount
    let pollCount = 0;
    const pollInterval = setInterval(() => {
      pollCount++;
      if (pollCount > 40) {
        clearInterval(pollInterval);
        return;
      }
      load();
    }, 3000);

    // Realtime subscriptions
    const channel = supabase
      .channel(`post-meta-${postId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_topics", filter: `post_id=eq.${postId}` },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_attachments", filter: `post_id=eq.${postId}` },
        () => load()
      )
      .subscribe();

    // Stop spinning indicator after 90s if analysis is still pending
    const timeoutId = setTimeout(() => {
      setAnalysisTimedOut(true);
    }, 90000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [postId]);

  if (topics.length === 0 && attachments.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {topics.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {topics.map((t) => (
            <TopicChip
              key={t.id}
              topic={t}
              onClick={() => {
                if (onSelectTopic) {
                  onSelectTopic(t);
                } else {
                  window.location.href = withBasePath(`/cluster/topics/${t.slug}`);
                }
              }}
            />
          ))}
        </div>
      )}
      {attachments.length > 0 && (
        <div className="flex flex-col gap-2">
          {attachments.map((att) => (
            <AttachmentPreview key={att.id} attachment={att} />
          ))}
        </div>
      )}
      {/* Research paper analysis cards */}
      {userId && attachments
        .filter((att) => att.white_paper_tools_enabled)
        .map((att) => (
          <div key={`analysis-wrap-${att.id}`} className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20 text-xs text-emerald-700 dark:text-emerald-400">
              <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Research paper detected.
            </div>
            <ResearchPaperCard attachment={att} userId={userId} />
          </div>
        ))}
      {/* PDFs still being analyzed */}
      {attachments
        .filter((att) => att.file_type === "application/pdf" && !att.white_paper_tools_enabled)
        .map((att) => (
          <div key={`analyzing-${att.id}`} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-amber-50/50 dark:bg-amber-900/20 text-xs text-stone-600 dark:text-stone-300">
            {!analysisTimedOut ? (
              <>
                <svg className="w-3 h-3 text-amber-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Analyzing <b>{att.file_name}</b> — about a minute.
              </>
            ) : (
              <>
                <svg className="w-3 h-3 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Analysis for <b>{att.file_name}</b> is taking longer.
                <button
                  onClick={() => window.location.reload()}
                  className="text-amber-600 font-medium hover:underline ml-1"
                >
                  Refresh
                </button>
              </>
            )}
          </div>
        ))}
    </div>
  );
}

function AttachmentPreview({ attachment }: { attachment: PostAttachment }) {
  const isImage = attachment.file_type.startsWith("image/");
  const isVideo = attachment.file_type.startsWith("video/");
  const isPdf = attachment.file_type === "application/pdf";
  // storage_path is stored as "bucketName/path/to/file"
  // The public URL base is injected by Next.js at build time.
  const supabaseUrl = (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_URL) || "";
  const publicUrl = supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/${attachment.storage_path}`
    : "";

  if (isImage) {
    return (
      <a
        href={publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-lg border border-stone-200 overflow-hidden hover:border-stone-300 transition-colors"
      >
        <img
          src={publicUrl}
          alt={attachment.file_name}
          className="max-h-64 w-auto object-contain bg-stone-50"
          loading="lazy"
        />
      </a>
    );
  }

  if (isVideo) {
    return (
      <video
        controls
        className="max-h-64 w-full rounded-lg border border-stone-200 bg-stone-900"
        preload="metadata"
      >
        <source src={publicUrl} type={attachment.file_type} />
      </video>
    );
  }

  if (isPdf) {
    return (
      <div className="rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden bg-stone-50 dark:bg-[#1a1d22]">
        <div className="flex items-center justify-between px-3 py-2 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-[#14161a]">
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 text-husl-clio shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="truncate text-sm text-husl-ink dark:text-stone-200">{attachment.file_name}</span>
            <span className="text-[10px] text-husl-muted dark:text-stone-400 shrink-0">{(attachment.file_size / 1024).toFixed(0)} KB</span>
          </div>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-medium text-husl-clio dark:text-amber-400 hover:underline shrink-0 ml-2"
          >
            Open
          </a>
        </div>
        <iframe
          src={publicUrl}
          title={attachment.file_name}
          className="w-full h-80 border-0"
        />
      </div>
    );
  }

  return (
    <a
      href={publicUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#1a1d22] hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-sm text-husl-ink dark:text-stone-200"
    >
      <svg className="w-4 h-4 text-husl-clio shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="truncate flex-1">{attachment.file_name}</span>
      <span className="text-[10px] text-husl-muted dark:text-stone-400">{(attachment.file_size / 1024).toFixed(0)} KB</span>
    </a>
  );
}

function MemberIdentity({ profile }: { profile: Profile | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!profile) return <span className="text-sm font-medium text-husl-ink dark:text-stone-200">member</span>;

  let genderIndicator = null;
  if (profile.gender === "female") {
    genderIndicator = <span className="w-1.5 h-1.5 rounded-full bg-rose-400" title="Female" aria-label="Female"></span>;
  } else if (profile.gender === "male") {
    genderIndicator = <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Male" aria-label="Male"></span>;
  } else if (profile.gender === "non_binary") {
    genderIndicator = <span className="w-1.5 h-1.5 rounded-full bg-purple-400" title="Non-binary" aria-label="Non-binary"></span>;
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button 
        type="button" 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 hover:opacity-70 focus:outline-none transition-opacity"
      >
        <span className="text-sm font-medium text-husl-ink dark:text-stone-200">{profile.nickname}</span>
      </button>
      
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-[60] w-48 p-2.5 rounded-lg shadow-xl bg-husl-card dark:bg-[#1a1d22] border border-stone-200 dark:border-stone-700">
          <div className="flex flex-col gap-1.5 text-xs text-husl-ink dark:text-stone-200 whitespace-nowrap">
            {profile.gender && (
              <div className="flex justify-between border-b border-stone-100 dark:border-stone-700 pb-1">
                <span className="text-husl-muted dark:text-stone-400">Gender</span>
                <span className="font-medium flex items-center gap-1.5 capitalize">
                  {profile.gender.replace("_", "-")}
                  {genderIndicator}
                </span>
              </div>
            )}
            <div className="flex justify-between border-b border-stone-100 dark:border-stone-700 pb-1">
              <span className="text-husl-muted dark:text-stone-400">Born</span>
              <span className="font-medium">{profile.birth_year || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-husl-muted dark:text-stone-400">Location</span>
              <span className="font-medium">{profile.country || "—"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
