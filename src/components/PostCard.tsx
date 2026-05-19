"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { PostWithAuthor } from "@/lib/types";
import DuaReference from "./DuaReference";
import DuaProgressiveReveal, { parseDuaPost } from "./DuaProgressiveReveal";
import LinkPreviewCard, { extractUrls, renderTextWithLinks } from "./LinkPreviewCard";
import { SAGE_THINKING, currentPhrase } from "@/lib/thinking-messages";
import { createClient } from "@/lib/supabase-browser";
import { usePresence } from "@/lib/presence-context";

interface PostCardProps {
  post: PostWithAuthor;
  replies?: PostWithAuthor[];
  onReply?: (postId: string) => void;
  pinned?: boolean;
  /** Pass the full posts list so we can detect if Sage has already replied */
  allPosts?: PostWithAuthor[];
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

  // Beyond 24h: India Standard Time (cluster is India-only for MVP).
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
        Founder
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
  pinned,
  allPosts = [],
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
  const showSageConsidering = mentionsSage && !hasSageReply && isOptimistic;

  const containerClasses = [
    "px-4 py-3 transition-colors",
    isSage ? "sage-post" : "hover:bg-gray-50",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      id={`post-${post.id}`}
      className="border-b border-gray-100 last:border-b-0 transition-shadow rounded-md"
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
                width={24}
                height={24}
                className="rounded-full object-cover"
              />
              <span className="font-semibold text-aggilo-sage text-sm">Sage</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
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

        {showSageConsidering && <SageConsideringIndicator />}
      </div>

      {replies.length > 0 && (
        <div className="ml-6 border-l-2 border-gray-100">
          {replies.map((reply) => (
            <PostCard key={reply.id} post={reply} />
          ))}
        </div>
      )}
    </div>
  );
}

function SageConsideringIndicator() {
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

  return (
    <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600">
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
