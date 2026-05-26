/** @type {import('next').NextConfig} */

/**
 * Long Conversation runs as its own Vercel project. The public URL it
 * lives at is `https://aggilo.in/c/long-conversation` — served via a
 * Vercel rewrite from the marketing site at `aggilo.in` that proxies
 * `/c/long-conversation/*` to this deployment.
 *
 * For the rewrite to work, Next has to render every internal link,
 * static asset URL, and API route under that prefix. We do this with
 * `basePath` (and `assetPrefix`, which Next derives from basePath
 * automatically when the latter is set).
 *
 * In development, `NEXT_PUBLIC_BASE_PATH` is empty so the app keeps
 * running at http://localhost:3001/cluster like before. In production
 * we set NEXT_PUBLIC_BASE_PATH=/c/long-conversation and Next prefixes
 * everything for us. Server-side redirects and `fetch()` calls do
 * NOT auto-prefix, so they go through the `lib/path.ts` helper.
 */

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  basePath,
  // Trailing slash off so /cluster and /cluster/ both work consistently
  // under the rewrite.
  trailingSlash: false,
};

export default nextConfig;
