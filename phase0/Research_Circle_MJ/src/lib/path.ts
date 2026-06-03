/**
 * Path helper for basePath-aware URLs.
 *
 * Research Circle MJ is mounted at `/c/research-circle-mj` in production
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
 * ⚠️ NEVER use withBasePath() with router.push() or <Link> — they
 * auto-prepend basePath and will create a double basePath (404).
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
 *   withBasePath("/cluster")          // "/c/research-circle-mj/cluster"
 *   withBasePath("/api/clio/chat")    // "/c/research-circle-mj/api/clio/chat"
 *   withBasePath("/")                 // "/c/research-circle-mj"
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

/**
 * Build an absolute URL from a Request object that respects the proxy host.
 * Vercel rewrites requests from mvp.aggilo.in -> vercel.app. Inside Next.js,
 * request.url uses the vercel.app domain, which causes redirects to jump domains.
 * This helper respects x-forwarded-host so redirects stay on the public domain.
 */
export function resolvePublicUrl(request: Request, targetPath: string): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    const [newHost, newPort] = forwardedHost.includes(":")
      ? forwardedHost.split(":")
      : [forwardedHost, null];

    if (newHost !== url.hostname) {
      // Different hostname — use forwarded host and strip port (prod proxy)
      url.hostname = newHost;
      url.port = newPort ?? "";
    } else if (newPort) {
      // Same hostname but forwarded host explicitly set a port
      url.port = newPort;
    }
    // If same hostname and no explicit port, keep original port (dev)
  }
  if (forwardedProto) {
    url.protocol = `${forwardedProto}:`;
  }

  url.pathname = withBasePath(targetPath);
  // Keep the original search parameters intact for redirects
  return url.toString();
}
