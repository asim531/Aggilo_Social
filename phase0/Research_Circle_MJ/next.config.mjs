/** @type {import('next').NextConfig} */

/**
 * Research Circle MJ runs as its own Vercel project. The public URL it
 * lives at is `https://aggilo.in/c/research-circle-mj` — served via a
 * Vercel rewrite from the marketing site at `aggilo.in` that proxies
 * `/c/research-circle-mj/*` to this deployment.
 *
 * For the rewrite to work, Next has to render every internal link,
 * static asset URL, and API route under that prefix. We do this with
 * `basePath` (and `assetPrefix`, which Next derives from basePath
 * automatically when the latter is set).
 *
 * In development, `NEXT_PUBLIC_BASE_PATH` is empty so the app keeps
 * running at http://localhost:3002/cluster like before. In production
 * we set NEXT_PUBLIC_BASE_PATH=/c/research-circle-mj and Next prefixes
 * everything for us. Server-side redirects and `fetch()` calls do
 * NOT auto-prefix, so they go through the `lib/path.ts` helper.
 */

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  basePath,
  // Trailing slash off so /cluster and /cluster/ both work consistently
  // under the rewrite.
  trailingSlash: false,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // PDF libraries use Node.js / browser globals that break when webpack
      // bundles them for the server. Load at runtime instead.
      config.externals.push("pdf-parse", "pdfjs-dist");
    }
    return config;
  },
};

export default nextConfig;
