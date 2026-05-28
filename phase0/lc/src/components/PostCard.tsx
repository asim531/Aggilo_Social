"use client";

/**
 * PostCard — Long Conversation.
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
import type { PostWithAuthor, Profile } from "@/lib/types";
import { withBasePath } from "@/lib/path";
import LinkPreviewCard, { extractUrls, renderTextWithLinks } from "@/components/LinkPreviewCard";
import { track } from "@/lib/track";
import { createClient } from "@/lib/supabase-browser";
import { CLUSTER_ID } from "@/lib/cluster";

interface PostCardProps {
  post: PostWithAuthor;
  replies?: PostWithAuthor[];
  /** Currently signed-in user id, needed to enable the reply form. */
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
}: PostCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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
      className={
        isWelfare
          ? "rounded-lg border border-lc-welfare/20 bg-lc-welfareSoft/30 border-l-2 border-l-lc-welfare/50"
          : "rounded-lg border border-stone-200"
      }
      aria-label={isWelfare ? "Welfare-flagged thread" : undefined}
    >
      {/* Top-level post body — editable when user owns it */}
      {isEditing ? (
        <div className="p-4 bg-lc-card">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            maxLength={2000}
            className="w-full resize-none px-3 py-2 rounded-lg border border-stone-300 bg-lc-card focus:outline-none focus:ring-2 focus:ring-lc-clio focus:border-transparent text-sm text-lc-ink placeholder:text-stone-400"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-lc-muted">
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
                className="text-xs text-lc-muted hover:text-lc-ink px-2 py-1 rounded hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleEditSubmit()}
                disabled={!editContent.trim() || editSubmitting || editContent.trim() === post.content}
                className="px-3 py-1.5 rounded bg-lc-clio text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-700 transition-colors"
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
        <PostBody post={post} />
      )}

      {/* Reply controls + count */}
      {!isEditing && canReply && (
        <div className="flex items-center gap-3 px-4 pb-3 -mt-1 text-xs">
          <button
            type="button"
            onClick={() => setShowReplyForm((v) => !v)}
            className="text-lc-muted hover:text-lc-clio transition-colors"
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
              className="text-lc-muted hover:text-lc-clio transition-colors"
            >
              Edit
            </button>
          )}
          {replies.length > 0 && (
            <span className="text-lc-muted flex items-center gap-1.5">
              · {replies.length} {replies.length === 1 ? "reply" : "replies"}
              {post.author_id === userId && (
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full bg-lc-clio"
                  title="Someone replied to your post"
                  aria-label="New reply"
                />
              )}
            </span>
          )}
        </div>
      )}

      {/* Reply form (inline) */}
      {showReplyForm && canReply && (
        <div className="border-t border-stone-200 px-4 py-3 bg-stone-50/40">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={`Reply to ${post.is_sage ? "Sage" : post.profiles?.nickname ?? "this post"}…`}
            rows={2}
            maxLength={2000}
            autoFocus
            className="w-full resize-none px-3 py-2 rounded-lg border border-stone-300 bg-lc-card focus:outline-none focus:ring-2 focus:ring-lc-clio focus:border-transparent text-sm text-lc-ink placeholder:text-stone-400 min-h-[60px] max-h-32"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void handleReplySubmit();
              }
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-lc-muted">
              Cmd/Ctrl + Enter to send
            </span>
            <button
              type="button"
              onClick={() => void handleReplySubmit()}
              disabled={!replyContent.trim() || replying}
              className="px-3 py-1.5 rounded bg-lc-clio text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-700 transition-colors"
            >
              {replying ? "…" : "Reply"}
            </button>
          </div>
          {replyError && (
            <p className="mt-2 text-xs text-rose-600">{replyError}</p>
          )}
        </div>
      )}

      {/* Replies — indented and visually subordinate */}
      {replies.length > 0 && (
        <div className="border-t border-stone-200 bg-stone-50/30 divide-y divide-stone-100">
          {replies.map((reply) => (
            <ReplyCard key={reply.id} post={reply} />
          ))}
        </div>
      )}

      {/* Sage thinking indicator */}
      {sageThinking && (
        <div className="border-t border-stone-200 px-4 py-3 pl-8 bg-lc-sageSoft/20 flex items-center gap-2">
          <div className="relative w-4 h-4 rounded-full overflow-hidden bg-lc-sageSoft shrink-0">
            <img src={withBasePath("/characters/sage.png")} alt="Sage" className="object-contain w-full h-full" />
          </div>
          <span className="text-xs text-lc-sage font-medium">Sage is thinking</span>
          <span className="flex gap-0.5 items-center" aria-label="Loading">
            <span className="w-1 h-1 rounded-full bg-lc-sage/60 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1 h-1 rounded-full bg-lc-sage/60 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1 h-1 rounded-full bg-lc-sage/60 animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        </div>
      )}
    </article>
  );
}

/**
 * The post body — extracted so it can render at top level and inside
 * a reply card without duplication.
 */
function PostBody({ post }: { post: PostWithAuthor }) {
  if (post.is_sage) {
    return (
      <div className="sage-post p-4 bg-lc-sageSoft/30">
        <header className="flex items-baseline justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="relative w-5 h-5 rounded-full overflow-hidden bg-lc-sageSoft shrink-0">
              <img src={withBasePath("/characters/sage.png")} alt="Sage" className="object-contain w-full h-full" />
            </div>
            <span className="text-xs font-medium text-lc-sage uppercase tracking-wider">
              Sage · Anchor
            </span>
          </div>
          <time
            className="text-xs text-lc-muted"
            dateTime={post.created_at}
            title={new Date(post.created_at).toLocaleString()}
          >
            {formatTimestamp(post.created_at)}
          </time>
        </header>
        <p className="text-sm text-lc-ink leading-relaxed whitespace-pre-line break-words">
          {renderTextWithLinks(post.content)}
        </p>
        {extractUrls(post.content).map(url => (
          <LinkPreviewCard key={url} url={url} />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 bg-lc-card">
      <header className="flex items-baseline justify-between mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <MemberIdentity profile={post.profiles} />
          {(post.profiles as { is_founding_member?: boolean; founding_badge_shown?: boolean } | null)
            ?.is_founding_member &&
            (post.profiles as { founding_badge_shown?: boolean } | null)
              ?.founding_badge_shown && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-lc-clio text-[10px] font-semibold leading-none">
                ✦ Founder
              </span>
            )}
        </div>
        <time
          className="text-xs text-lc-muted"
          dateTime={post.created_at}
          title={new Date(post.created_at).toLocaleString()}
        >
          {formatTimestamp(post.created_at)}
          {post.edited_at && (
            <span className="text-lc-clio"> · edited</span>
          )}
        </time>
      </header>
      <p className="text-sm text-lc-ink leading-relaxed whitespace-pre-line break-words">
        {renderTextWithLinks(post.content)}
      </p>
      {extractUrls(post.content).map(url => (
        <LinkPreviewCard key={url} url={url} />
      ))}
    </div>
  );
}

/**
 * Reply variant — indented, smaller chrome. Sage's care-witness
 * replies in welfare threads render here too.
 */
function ReplyCard({ post }: { post: PostWithAuthor }) {
  if (post.is_sage) {
    return (
      <div className="px-4 py-3 pl-8 bg-lc-sageSoft/20 border-l-2 border-lc-sage/50">
        <header className="flex items-baseline justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className="relative w-4 h-4 rounded-full overflow-hidden bg-lc-sageSoft shrink-0">
              <img src={withBasePath("/characters/sage.png")} alt="Sage" className="object-contain w-full h-full" />
            </div>
            <span className="text-[10px] font-medium text-lc-sage uppercase tracking-wider">
              Sage · Anchor
            </span>
          </div>
          <time
            className="text-[10px] text-lc-muted"
            dateTime={post.created_at}
          >
            {formatTimestamp(post.created_at)}
          </time>
        </header>
        <p className="text-sm text-lc-ink leading-relaxed whitespace-pre-line break-words">
          {renderTextWithLinks(post.content)}
        </p>
        {extractUrls(post.content).map(url => (
          <LinkPreviewCard key={url} url={url} />
        ))}
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
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-lc-clio text-[10px] font-semibold leading-none">
                ✦ Founder
              </span>
            )}
        </div>
        <time
          className="text-[10px] text-lc-muted"
          dateTime={post.created_at}
        >
          {formatTimestamp(post.created_at)}
        </time>
      </header>
      <p className="text-sm text-lc-ink leading-relaxed whitespace-pre-line break-words">
        {renderTextWithLinks(post.content)}
      </p>
      {extractUrls(post.content).map(url => (
        <LinkPreviewCard key={url} url={url} />
      ))}
    </div>
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

  if (!profile) return <span className="text-sm font-medium text-lc-ink">member</span>;

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
        <span className="text-sm font-medium text-lc-ink">{profile.nickname}</span>
      </button>
      
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-[60] w-48 p-2.5 rounded-lg shadow-xl bg-lc-card border border-stone-200">
          <div className="flex flex-col gap-1.5 text-xs text-lc-ink whitespace-nowrap">
            {profile.gender && (
              <div className="flex justify-between border-b border-stone-100 pb-1">
                <span className="text-lc-muted">Gender</span>
                <span className="font-medium flex items-center gap-1.5 capitalize">
                  {profile.gender.replace("_", "-")}
                  {genderIndicator}
                </span>
              </div>
            )}
            <div className="flex justify-between border-b border-stone-100 pb-1">
              <span className="text-lc-muted">Born</span>
              <span className="font-medium">{profile.birth_year || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-lc-muted">Location</span>
              <span className="font-medium">{profile.country || "—"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
