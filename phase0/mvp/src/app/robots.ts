/**
 * robots.txt — allow only the public-preview path; deny everything that
 * could leak member content.
 *
 *   /c/*       → public preview pages (server-rendered identity surface)
 *   /api/og/*  → OG image generator for previews (helpful for crawlers)
 *   /cluster   → authenticated room (member content) — DENY
 *   /admin/*   → admin tools — DENY
 *   /api/*     → server endpoints — DENY (except /api/og/cluster handled above)
 */

import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/public-cluster";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/c/", "/api/og/cluster/"],
        disallow: ["/cluster", "/cluster/", "/admin", "/admin/", "/api/", "/auth/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
