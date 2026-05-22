
"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PostWithAuthor } from "@/lib/types";
import DuaReference from "./DuaReference";
import DuaProgressiveReveal, { parseDuaPost } from "./DuaProgressiveReveal";
import LinkPreviewCard, { extractUrls, renderTextWithLinks } from "./LinkPreviewCard";
import SageFeedback from "./SageFeedback";
import { SAGE_THINKING, currentPhrase } from "@/lib/thinking-messages";
import { createClient } from "@/lib/supabase-browser";
import { usePresence } from "@/lib/presence-context";

interface PostCardProps {
  post: PostWithAuthor;
  replies?: PostWithAuthor[];
  onReply?: (postId: string) => void;
  /** Called after a post is successfully deleted — removes it from the feed */
  onDelete?: (postId: string) => void;
  pinned?: boolean;
  /** Pass the full posts list so we can detect if Sage has already replied */
  allPosts?: PostWithAuthor[];
  /** Current viewer's user id — drives "own post" actions in the long-press menu */
  currentUserId?: string;
}

// Arabic Unicode blocks: U+0600–U+06FF (Arabic), U+0750–U+077F (Arabic Sup),
// U+08A0–U+08FF (Arabic Ext A), U+FB50–U+FDFF (Pres Forms A),
// U+FE70–U+FEFF (Pres Forms B). Using \u escapes for build-tool safety.
const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

function formatTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  // Beyond 24h: Hyderabad-only MVP — render in IST.
  return then.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function RoleBadge({ role }: { role: string }) {
  if (role === "founder") {
    return (
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
        Admin
      </span>
    );
  }
  if (role === "manager") {
    return (
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
        Manager
      </span>
    );
  }
  return null;
}

interface ParsedDuaRef {
  arabic: string;
  transliteration: string;
  translation: string;
  source: string;
  witnessLine?: string;
}

/**
 * Parse a Sage post that contains an inline dua reference (no DUA_VAULT_ID
 * marker). Sage is instructed to emit four lines in order:
 *
 *   <Arabic>
 *   <Transliteration>
 *   <English translation>
 *   Source: <citation>
 *   [optional witness line, <80 chars]
 *
 * We tolerate blank lines between any of these and gracefully degrade
 * if the model omits the translation (older posts, trained behaviors).
 */
function parseDuaReferences(content: string): { segments: (string | ParsedDuaRef)[] } {
  const sourcePattern = /^Source:\s*.+/m;
  if (!sourcePattern.test(content)) {
    return { segments: [content] };
  }

  const lines = content.split("\n");
  const segments: (string | ParsedDuaRef)[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    const arabicMatch = ARABIC_RE.test(line);
    const hasSource = lines.slice(i, i + 6).some((l) => /^Source:\s*.+/.test(l));

    if (arabicMatch && hasSource) {
      const arabic = line.trim();
      let transliteration = "";
      let translation = "";
      let source = "";
      let witnessLine: string | undefined;
      let j = i + 1;

      // Skip blank lines after Arabic
      while (j < lines.length && lines[j].trim() === "") j++;

      // Transliteration line — non-empty, non-Arabic, not Source:
      if (j < lines.length && !/^Source:/i.test(lines[j]) && !ARABIC_RE.test(lines[j])) {
        transliteration = lines[j].trim();
        j++;
      }

      while (j < lines.length && lines[j].trim() === "") j++;

      // Optional translation line
      if (j < lines.length && !/^Source:/i.test(lines[j]) && !ARABIC_RE.test(lines[j])) {
        translation = lines[j].trim();
        j++;
      }

      while (j < lines.length && lines[j].trim() === "") j++;

      // Source line
      if (j < lines.length && /^Source:\s*.+/i.test(lines[j])) {
        source = lines[j].replace(/^Source:\s*/i, "").trim();
        j++;
      }

      while (j < lines.length && lines[j].trim() === "") j++;

      // Optional short witness line
      if (
        j < lines.length &&
        lines[j].trim() &&
        !ARABIC_RE.test(lines[j]) &&
        !lines[j].startsWith("Source:")
      ) {
        const candidate = lines[j].trim();
        if (candidate.length < 80) {
          witnessLine = candidate;
          j++;
        }
      }

      segments.push({ arabic, transliteration, translation, source, witnessLine });
      i = j;
    } else {
      const textLines: string[] = [];
      while (i < lines.length) {
        const upcoming = ARABIC_RE.test(lines[i]);
        const upcomingSource = lines.slice(i, i + 6).some((l) => /^Source:\s*.+/.test(l));
        if (upcoming && upcomingSource) break;
        textLines.push(lines[i]);
        i++;
      }
      const text = textLines.join("\n").trim();
      if (text) segments.push(text);
    }
  }

  return { segments };
}

function MemberPostContent({ content }: { content: string }) {
  const urls = extractUrls(content);

  return (
    <div className="text-gray-700 text-sm leading-relaxed">
      <p className="whitespace-pre-wrap break-words">
        {renderTextWithLinks(content)}
      </p>
      {urls.map((u) => (
        <LinkPreviewCard key={u} url={u} />
      ))}
    </div>
  );
}

function SagePostContent({ content, postId }: { content: string; postId: string }) {
  // Pointer post: Sage already shared this dua and is pointing back to it.
  const pointerMatch = content.match(/\[POINTER_TO_POST:([0-9a-f-]+)\]/i);
  if (pointerMatch) {
    const targetId = pointerMatch[1];
    const lines = content.split("\n");
    const markerIdx = lines.findIndex((l) => l.includes("[POINTER_TO_POST:"));
    const contextLine = lines.slice(0, markerIdx).join("\n").trim();
    const tail = lines.slice(markerIdx + 1).join(" ").trim();

    function handleScroll() {
      if (typeof document === "undefined") return;
      const el = document.getElementById(`post-${targetId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-emerald-400");
        setTimeout(() => el.classList.remove("ring-2", "ring-emerald-400"), 2000);
      }
    }

    return (
      <div className="text-sm text-gray-700 leading-relaxed">
        {contextLine && <p className="mb-2 italic text-gray-600">{contextLine}</p>}
        <button
          type="button"
          onClick={handleScroll}
          className="w-full text-left px-3 py-2 rounded-lg bg-emerald-50/80 border border-emerald-200/70 hover:bg-emerald-100/80 hover:border-emerald-300 transition-colors flex items-center gap-2"
        >
          <svg
            className="w-4 h-4 shrink-0 text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
          <span className="text-xs text-emerald-800">
            {tail || "Tap to scroll up to it."}
          </span>
        </button>
      </div>
    );
  }

  // Vault-marker dua post: full progressive reveal driven by dua_vault row.
  // Memoize parsedDua so deps stay stable across renders — otherwise the
  // translation-fetch useEffect would re-fire infinitely (parsedDua is a
  // fresh object each render).
  const parsedDua = useMemo(() => parseDuaPost(content), [content]);
  const [translation, setTranslation] = useState<string>("");
  const [translationLoaded, setTranslationLoaded] = useState(false);

  useEffect(() => {
    if (!parsedDua?.vaultId) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("dua_vault")
        .select("translation")
        .eq("id", parsedDua.vaultId)
        .single();
      if (!cancelled) {
        setTranslation(data?.translation || "");
        setTranslationLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [parsedDua?.vaultId]);

  // Mark this dua animated so subsequent rerenders don't replay
  useEffect(() => {
    if (!parsedDua) return;
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(`dua_animated_${postId}`, "1");
    } catch {
      /* quota / private mode — animation just plays each mount */
    }
  }, [parsedDua, postId]);

  if (parsedDua) {
    const animateKey = `dua_animated_${postId}`;
    // sessionStorage read is OK during render; the WRITE happens in
    // useEffect to avoid side effects during render (strict mode + quota).
    const alreadyAnimated =
      typeof window !== "undefined"
        ? (() => {
            try {
              return sessionStorage.getItem(animateKey) === "1";
            } catch {
              return false;
            }
          })()
        : false;
    const animate = !alreadyAnimated;

    if (!translationLoaded) {
      return (
        <div className="text-sm text-gray-500 italic py-3">Loading reference…</div>
      );
    }

    return (
      <DuaProgressiveReveal
        contextLine={parsedDua.contextLine}
        arabic={parsedDua.arabic}
        transliteration={parsedDua.transliteration}
        translation={translation}
        source={parsedDua.source}
        witnessLine={parsedDua.witnessLine}
        animate={animate}
      />
    );
  }

  // Fallback: inline-Arabic Sage replies (no marker, four-line format)
  const { segments } = parseDuaReferences(content);

  return (
    <div className="text-gray-700 text-sm leading-relaxed">
      {segments.map((seg, idx) => {
        if (typeof seg === "string") {
          return (
            <p key={idx} className="whitespace-pre-wrap">
              {seg}
            </p>
          );
        }
        return (
          <DuaReference
            key={idx}
            arabic={seg.arabic}
            transliteration={seg.transliteration}
            translation={seg.translation}
            source={seg.source}
            witnessLine={seg.witnessLine}
            postId={`${postId}-${idx}`}
          />
        );
      })}
    </div>
  );
}

export default function PostCard({
  post,
  replies = [],
  onReply,
  onDelete,
  pinned,
  allPosts = [],
  currentUserId,
}: PostCardProps) {
  const isSage = post.is_sage;
  const role = post.profiles?.role;
  const { onlineUserIds } = usePresence();
  const isOnline = !isSage && post.author_id ? onlineUserIds.has(post.author_id) : false;

  const mentionsSage = !isSage && post.content.toLowerCase().includes("@sage");
  const hasSageReply =
    replies.some((r) => r.is_sage) ||
    allPosts.some((p) => p.parent_id === post.id && p.is_sage);
  const isOptimistic = post.id.startsWith("optimistic-");

  // ── In-flight Sage indicator (B3 fix) ─────────────────────────────
  // Previously: indicator only fired for optimistic posts, so members
  // who waited for a real-time @Sage reply saw nothing during the
  // 5–15s background processing window.
  //
  // Now: fires whenever a non-optimistic member post mentions @Sage,
  // Sage hasn't replied yet, AND the post is recent (<60s old).
  // Genuine silence after 60s is valid — the indicator times out
  // naturally so we never show "thinking" forever.
  //
  // The `tick` state is bumped every 5s while the indicator is showing
  // to force a re-render of the age check.
  const [tick, setTick] = useState(0);
  const postAgeMs = Date.now() - new Date(post.created_at).getTime();
  const isRecentEnoughToWaitForSage = postAgeMs < 60_000;

  // Glow/typing indicator before a Sage post lands.
  // Fires on:
  //   1. Member post that mentions @Sage and has no Sage reply yet,
  //      either still optimistic OR <60s old (real-time waiting state)
  //   2. Any optimistic Sage post that's still in flight (gives members
  //      a beat to anticipate Sage's contribution before it lands)
  const showSageConsidering =
    (mentionsSage &&
      !hasSageReply &&
      (isOptimistic || isRecentEnoughToWaitForSage)) ||
    (isSage && isOptimistic);

  // Re-render every 5s while the considering indicator is showing so
  // the age check naturally times out at the 60s mark. The `tick`
  // dependency on the interval body forces React to re-evaluate
  // showSageConsidering each tick.
  useEffect(() => {
    if (!showSageConsidering) return;
    if (isOptimistic) return; // optimistic state already updates fast
    const id = setInterval(() => setTick((t) => t + 1), 5_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSageConsidering, isOptimistic]);

  // Reference `tick` so eslint sees the value is read; the actual
  // re-render trigger is the state update itself.
  void tick;

  const isOwnPost = !!currentUserId && post.author_id === currentUserId;
  const isMemberPost = !isSage && !!post.author_id;

  const containerClasses = [
    "px-4 py-3 transition-colors",
    isSage ? "sage-post" : "hover:bg-gray-50",
  ]
    .filter(Boolean)
    .join(" ");

  // Long-press context menu — touch + right-click parity.
  // Disabled for optimistic / pinned posts (no actions apply yet).
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const canShowMenu = !isOptimistic && !pinned && (isOwnPost || isMemberPost || isSage);

  function openMenu(x: number, y: number) {
    setMenuPos({ x, y });
    setMenuOpen(true);
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (!canShowMenu) return;
    longPressFired.current = false;
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      openMenu(touch.clientX, touch.clientY);
      // Light haptic feedback on supported devices
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate?.(8);
        } catch {
          /* ignore */
        }
      }
    }, 500);
  }

  function handleTouchEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleContextMenu(e: React.MouseEvent) {
    if (!canShowMenu) return;
    e.preventDefault();
    openMenu(e.clientX, e.clientY);
  }

  return (
    <div
      id={`post-${post.id}`}
      className="border-b border-gray-100 last:border-b-0 transition-shadow rounded-md"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      onContextMenu={handleContextMenu}
    >
      {pinned && (
        <div className="px-4 pt-2 flex items-center gap-1 text-xs text-gray-400">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.789l1.599.799L9 4.323V3a1 1 0 011-1z" />
          </svg>
          Pinned
        </div>
      )}

      <div className={containerClasses}>
        <div className="flex items-center gap-2 mb-1">
          {isSage ? (
            <span className="inline-flex items-center gap-1.5">
              <Image
                src="/characters/sage.png"
                alt="Sage"
                width={20}
                height={20}
                className="rounded-full object-cover opacity-90"
              />
              <span className="font-medium text-aggilo-sage text-sm">Sage</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                Anchor
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span className="relative">
                <span className="w-6 h-6 rounded-full bg-aggilo-light text-aggilo-deep text-xs flex items-center justify-center font-bold">
                  {(post.profiles?.nickname || "S")[0].toUpperCase()}
                </span>
                {isOnline && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"
                    aria-label="Online now"
                    title="Online now"
                  />
                )}
              </span>
              <span className="font-semibold text-gray-800 text-sm">
                {post.profiles?.nickname || "A sister"}
              </span>
              {role && <RoleBadge role={role} />}
            </span>
          )}

          <span className="text-xs text-gray-400">{formatTime(post.created_at)}</span>
        </div>

        {isSage ? (
          <SagePostContent content={post.content} postId={post.id} />
        ) : (
          <MemberPostContent content={post.content} />
        )}

        {/* Feedback signal — only for Sage-authored posts. Closed-loops principle. */}
        {isSage && !post.id.startsWith("optimistic-") && (
          <SageFeedback postId={post.id} agent="sage" />
        )}

        {!post.parent_id && onReply && (
          <div className="mt-2 flex items-center gap-4">
            <button
              onClick={() => onReply(post.id)}
              className="text-xs text-gray-400 hover:text-aggilo-deep transition-colors"
            >
              Reply{replies.length > 0 ? ` (${replies.length})` : ""}
            </button>
          </div>
        )}

        {/* Sage → Clio soft handoff: cluster-visible inline note. */}
        {post.sage_handoff_to_clio_at && (
          <div className="mt-2 flex items-start gap-1.5 text-[11px] text-gray-400 italic">
            <span aria-hidden="true">·</span>
            <span>Clio is following up privately.</span>
          </div>
        )}

        {showSageConsidering && <SageConsideringIndicator isSagePost={isSage} />}
      </div>

      {replies.length > 0 && (
        <div className="ml-6 border-l-2 border-gray-100">
          {replies.map((reply) => (
            <PostCard key={reply.id} post={reply} currentUserId={currentUserId} onDelete={onDelete} />
          ))}
        </div>
      )}

      {menuOpen && menuPos && (
        <PostContextMenu
          x={menuPos.x}
          y={menuPos.y}
          isOwnPost={isOwnPost}
          isSagePost={isSage}
          postId={post.id}
          postContent={post.content}
          onClose={() => setMenuOpen(false)}
          onDeleted={() => onDelete?.(post.id)}
        />
      )}
    </div>
  );
}

function PostContextMenu({
  x,
  y,
  isOwnPost,
  isSagePost,
  postId,
  postContent,
  onClose,
  onDeleted,
}: {
  x: number;
  y: number;
  isOwnPost: boolean;
  isSagePost: boolean;
  postId: string;
  postContent: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  // Clamp the menu inside the viewport
  const [pos, setPos] = useState<{ left: number; top: number }>({
    left: x,
    top: y,
  });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const menuW = 200;
    const menuH = 200;
    const left = Math.min(x, window.innerWidth - menuW - 8);
    const top = Math.min(y, window.innerHeight - menuH - 8);
    setPos({ left, top });
  }, [x, y]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(postContent);
    } catch {
      /* clipboard blocked — fail quietly */
    }
    onClose();
  }

  async function handleShare() {
    const shareUrl = `${window.location.origin}${window.location.pathname}#post-${postId}`;
    if (typeof navigator !== "undefined" && (navigator as { share?: (data: ShareData) => Promise<void> }).share) {
      try {
        await (navigator as { share: (data: ShareData) => Promise<void> }).share({
          text: postContent.slice(0, 200),
          url: shareUrl,
        });
        onClose();
        return;
      } catch {
        /* user cancelled — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      /* ignore */
    }
    onClose();
  }

  async function handleDelete() {
    if (!confirm("Delete this post? This cannot be undone.")) {
      onClose();
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      alert("Could not delete this post. Try again?");
      onClose();
      return;
    }
    // Notify parent to remove the card from state immediately.
    // Realtime DELETE events are not guaranteed (require REPLICA IDENTITY FULL
    // + DELETE in the publication), so we remove optimistically here.
    onDeleted();
    onClose();
  }

  function handleReport() {
    // No reports table yet in Phase 0 — record as a behavioural event so
    // admin can see in the Events feed and act manually.
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "post_reported",
        properties: { post_id: postId, sage_post: isSagePost },
      }),
    }).catch(() => {
      /* fire-and-forget */
    });
    alert("Reported. The admin will review this post.");
    onClose();
  }

  // Portal target. We render INTO document.body so no ancestor with
  // a CSS transform / contain / filter / will-change can create a new
  // containing block and clip our fixed-position menu.
  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => {
    setPortalReady(true);
  }, []);

  const menuNode = (
    <div
      ref={menuRef}
      role="menu"
      style={{ left: pos.left, top: pos.top }}
      className="fixed z-[100] min-w-[200px] bg-white rounded-lg shadow-2xl border border-gray-200 py-1 text-sm"
    >
      {isOwnPost ? (
        /*
         * Own post: only Delete.
         * Copy and Share are not useful for your own post — you already
         * have the content. The only meaningful action is removal.
         */
        <button
          type="button"
          role="menuitem"
          onClick={handleDelete}
          className="w-full px-4 py-2.5 text-left text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      ) : (
        /*
         * Others' posts (including Sage): Copy, Share, Report.
         */
        <>
          <button
            type="button"
            role="menuitem"
            onClick={handleCopy}
            className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy text
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleShare}
            className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share link
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            type="button"
            role="menuitem"
            onClick={handleReport}
            className="w-full px-4 py-2.5 text-left text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            Report to admin
          </button>
        </>
      )}
    </div>
  );

  if (!portalReady || typeof document === "undefined") return null;
  return createPortal(menuNode, document.body);
}

function SageConsideringIndicator({ isSagePost = false }: { isSagePost?: boolean }) {
  const [phrase, setPhrase] = useState(SAGE_THINKING[0]);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const { text } = currentPhrase(SAGE_THINKING, elapsed, 1800);
      setPhrase(text);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Subtle glow when this indicator is rendered on a Sage post that's still
  // in flight — gives members a visual beat to anticipate Sage's contribution.
  const glowClass = isSagePost ? "sage-glow" : "";

  return (
    <div className={`mt-2 flex items-center gap-2 text-xs text-emerald-600 ${glowClass}`}>
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </span>
      <span className="italic">{phrase}</span>
    </div>
  );
}
