/**
 * Path helper for basePath-aware URLs.
 *
 * Long Conversation is mounted at `/c/long-conversation` in production
 * via a Vercel rewrite from `aggilo.in`. Next.js's `basePath` config
 * handles internal `<Link>` and `next/router.push()` automatically, but
 * three things do NOT auto-prefix:
 *
 *   1. `fetch("/api/...")` from the browser — generic browser API
 *   2. `window.location.href = "/cluster"` — generic browser API
 *   3. `NextResponse.redirect(new URL("/cluster", request.url))` from
 *       middleware and route handlers — Next does NOT auto-prefix
 *       absolute paths in redirects
 *
 * Use `withBasePath("/api/clio/chat")` everywhere those three
 * patterns appear. In dev (BASE_PATH="") the helper is a no-op.
 *
 * The constant is read from NEXT_PUBLIC_BASE_PATH so it's available
 * on both server and client. Keep it in sync with `next.config.mjs`.
 */

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/**
 * Prefix a path with the deployment basePath. Idempotent — passing a
 * path that already starts with the basePath is fine.
 *
 * @example
 *   withBasePath("/cluster")          // "/c/long-conversation/cluster"
 *   withBasePath("/api/clio/chat")    // "/c/long-conversation/api/clio/chat"
 *   withBasePath("/")                 // "/c/long-conversation"
 */
export function withBasePath(path: string): string {
  if (!BASE_PATH) return path;
  if (path === "/" || path === "") return BASE_PATH;
  if (path.startsWith(BASE_PATH + "/") || path === BASE_PATH) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${normalized}`;
}

/**
 * Build an absolute URL that respects the basePath. Used for
 * `emailRedirectTo` in Supabase magic links — Supabase requires the
 * full origin + path, and the path must be the rewritten public URL
 * so the magic link bounces through aggilo.in correctly.
 */
export function absoluteUrl(path: string, origin: string): string {
  return `${origin.replace(/\/+$/, "")}${withBasePath(path)}`;
}
