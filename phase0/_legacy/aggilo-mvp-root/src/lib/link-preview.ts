/**
 * Server-side link metadata fetcher.
 *
 * Extracts title, description, thumbnail, and site name from a URL.
 * Runs server-side only — never in the browser (SSRF/CORS safety).
 *
 * Strategy:
 *   1. YouTube / YouTube Shorts → oEmbed API (no key, reliable)
 *   2. Any other URL → fetch HTML, parse <title> and <meta> tags
 *
 * Timeout: 5 seconds. Failures return null gracefully.
 * We never follow redirects more than once to avoid SSRF chains.
 */

export interface LinkMeta {
  title?: string;
  description?: string;
  thumbnail?: string;
  site_name?: string;
}

const YOUTUBE_RE =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

export async function fetchLinkMeta(url: string): Promise<LinkMeta | null> {
  try {
    const parsed = new URL(url);

    // Block private/internal addresses
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.startsWith("127.") ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      host.endsWith(".local")
    ) {
      return null;
    }

    // ── YouTube oEmbed ────────────────────────────────────────────
    const ytMatch = url.match(YOUTUBE_RE);
    if (ytMatch) {
      const videoId = ytMatch[1];
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const res = await fetch(oembedUrl, {
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": "Aggilo/1.0 (+https://aggilo.in)" },
        redirect: "follow",
      });
      if (res.ok) {
        const data = await res.json();
        return {
          title: data.title || undefined,
          thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          site_name: "YouTube",
          description: data.author_name ? `by ${data.author_name}` : undefined,
        };
      }
    }

    // ── Generic HTML meta scrape ──────────────────────────────────
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent": "Aggilo/1.0 (+https://aggilo.in)",
        Accept: "text/html",
      },
      redirect: "follow",
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;

    // Read only the first 32KB — enough for <head>
    const reader = res.body?.getReader();
    if (!reader) return null;
    let html = "";
    let bytes = 0;
    while (bytes < 32768) {
      const { done, value } = await reader.read();
      if (done) break;
      html += new TextDecoder().decode(value);
      bytes += value.length;
    }
    reader.cancel();

    const meta: LinkMeta = {};

    // og:title > twitter:title > <title>
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const twTitle = html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i);
    const htmlTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    meta.title = (ogTitle?.[1] || twTitle?.[1] || htmlTitle?.[1] || "").trim() || undefined;

    // og:description > twitter:description > meta description
    const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    const twDesc = html.match(/<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']+)["']/i);
    const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    meta.description = (ogDesc?.[1] || twDesc?.[1] || metaDesc?.[1] || "").trim() || undefined;

    // og:image > twitter:image
    const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    const twImg = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    meta.thumbnail = (ogImg?.[1] || twImg?.[1] || "").trim() || undefined;

    // og:site_name
    const ogSite = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);
    meta.site_name = (ogSite?.[1] || parsed.hostname.replace(/^www\./, "")).trim() || undefined;

    return Object.keys(meta).length > 0 ? meta : null;
  } catch {
    return null;
  }
}

/**
 * Extract the first URL from a post's text content.
 * Returns null if no URL is found.
 */
export function extractFirstUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s<>"']+/);
  return match ? match[0] : null;
}
