/**
 * PostCard — Long Conversation.
 *
 * Renders a single post in the Timeline. Two distinct visual modes:
 *   - Member post: white card, nickname, timestamp, content
 *   - Sage post: subtle teal-tinted card, "Sage · Anchor" label, content
 *
 * Sage posts are visually present without being loud. The MVP went
 * through a few iterations on this — the right answer is a left
 * border accent + soft tint, not a full coloured card. Sage holds
 * the room; she doesn't dominate it.
 */

import type { PostWithAuthor } from "@/lib/types";

interface PostCardProps {
  post: PostWithAuthor;
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

export default function PostCard({ post }: PostCardProps) {
  if (post.is_sage) {
    return (
      <article
        className="sage-post rounded-lg p-4 border border-lc-sage/20 bg-lc-sageSoft/30"
        aria-label="Sage post"
      >
        <header className="flex items-baseline justify-between mb-2">
          <span className="text-xs font-medium text-lc-sage uppercase tracking-wider">
            Sage · Anchor
          </span>
          <time
            className="text-xs text-lc-muted"
            dateTime={post.created_at}
            title={new Date(post.created_at).toLocaleString()}
          >
            {formatTimestamp(post.created_at)}
          </time>
        </header>
        <p className="text-sm text-lc-ink leading-relaxed whitespace-pre-line">
          {post.content}
        </p>
      </article>
    );
  }

  return (
    <article className="bg-lc-card rounded-lg p-4 border border-stone-200">
      <header className="flex items-baseline justify-between mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-lc-ink">
            {post.profiles?.nickname ?? "member"}
          </span>
          {/* Founder badge — shown when the founding member has opted in */}
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
        </time>
      </header>
      <p className="text-sm text-lc-ink leading-relaxed whitespace-pre-line">
        {post.content}
      </p>
    </article>
  );
}
