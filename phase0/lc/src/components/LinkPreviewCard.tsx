"use client";

/**
 * Link preview card with optional Sage on-topic badge.
 *
 * Render rules:
 *   - Verdict "on_topic"   → small green ✓ "On topic" pill
 *   - Verdict "off_topic"  → amber pill with one-line "Sage notes: <reason>"
 *   - Verdict "unsure"|null → no badge (Sage stays silent when uncertain)
 *
 * Loading state: a thin shimmering bar — minimal chrome, no spinners.
 *
 * The card itself is always a real anchor — clicking opens the URL in a
 * new tab regardless of Sage's verdict. Sage flags topic relevance; she
 * never blocks a link.
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { withBasePath } from "@/lib/path";

interface LinkPreview {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  site_name: string | null;
  sage_verdict: "on_topic" | "off_topic" | "unsure" | null;
  sage_reason: string | null;
  evaluated_at: string | null;
  fetch_status: number | null;
  fetch_error: string | null;
}

interface LinkPreviewCardProps {
  url: string;
}

export default function LinkPreviewCard({ url }: LinkPreviewCardProps) {
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      // Try cached first
      try {
        const { data } = await supabase
          .from("link_previews")
          .select("*")
          .eq("url", url)
          .maybeSingle();
        if (cancelled) return;
        if (data && data.expires_at && new Date(data.expires_at) > new Date()) {
          setPreview(data as LinkPreview);
          setLoading(false);
          return;
        }
      } catch {
        /* fall through */
      }

      // Trigger unfurl + Sage review
      try {
        const res = await fetch(withBasePath("/api/links/unfurl"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (cancelled) return;
        setPreview(data?.preview ?? null);
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [url]);

  // Realtime: when the unfurl + Sage evaluation completes server-side,
  // the link_previews row is upserted. Subscribe so the badge appears
  // without a refresh — the verdict typically arrives 5–15s after the post.
  useEffect(() => {
    const supabase = createClient();
    const channelName = `link-preview-${encodeURIComponent(url).slice(0, 40)}-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "link_previews",
          filter: `url=eq.${url}`,
        },
        (payload: any) => {
          if (payload.new) {
            setPreview(payload.new);
            setLoading(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [url]);

  if (loading) {
    return (
      <div className="my-2 px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 animate-pulse">
        <div className="h-3 w-1/3 bg-stone-200 rounded mb-2" />
        <div className="h-2 w-2/3 bg-stone-200 rounded" />
      </div>
    );
  }

  if (!preview) return null;

  // Failed fetch — render a minimal card with just the URL
  if (preview.fetch_error || !preview.title) {
    return (
      <a
        href={preview.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="my-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                   border border-stone-200 bg-stone-50 text-xs text-lc-muted
                   hover:bg-stone-100 transition-colors"
      >
        <svg className="w-3.5 h-3.5 shrink-0 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <span className="truncate max-w-xs">{preview.site_name || preview.url}</span>
      </a>
    );
  }

  return (
    <div className="my-2">
      <a
        href={preview.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="block rounded-lg border border-stone-200 bg-lc-card hover:border-stone-300 hover:shadow-sm transition-all overflow-hidden"
      >
        <div className="flex">
          {preview.image_url && (
            <div className="hidden sm:block w-24 h-24 shrink-0 bg-stone-100 overflow-hidden border-r border-stone-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.image_url}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-[10px] text-lc-muted uppercase tracking-wide mb-1">
              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="truncate">{preview.site_name || new URL(preview.url).hostname}</span>
            </div>
            <p className="text-sm font-medium text-lc-ink line-clamp-2 mb-1 leading-snug">
              {preview.title}
            </p>
            {preview.description && (
              <p className="text-xs text-lc-muted/80 line-clamp-2">
                {preview.description}
              </p>
            )}
          </div>
        </div>
      </a>
    </div>
  );
}

// ── URL extraction helper for post bodies ──────────────────────────────
//
// Replaces inline URLs in a post body with placeholders, returns the
// list of URLs extracted in order, and a render function that walks the
// body and yields React nodes (text fragments + clickable anchors).
//
// We render the link preview card OUTSIDE the body — once per unique URL
// — so a post like "I've been listening to this https://x/y" keeps the
// inline link AND gets the preview card below the text.

const URL_RE =
  /(https?:\/\/[^\s<>"']+[^\s<>"',.;:!?)\]])/g;

export function extractUrls(text: string): string[] {
  const out = new Set<string>();
  const matches = text.match(URL_RE);
  if (matches) matches.forEach((u) => out.add(u));
  return Array.from(out);
}

export function renderTextWithLinks(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  URL_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = URL_RE.exec(text))) {
    if (m.index > lastIndex) {
      nodes.push(text.slice(lastIndex, m.index));
    }
    nodes.push(
      <a
        key={`link-${key++}`}
        href={m[1]}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="text-lc-clio hover:underline break-all"
      >
        {m[1]}
      </a>
    );
    lastIndex = m.index + m[1].length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}
