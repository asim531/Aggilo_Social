/**
 * Sitemap — only publicly listed clusters.
 *
 * Sitemap inclusion is admin-listed only (DB7 default): a cluster
 * appears here only after the founder/platform admin flips
 * is_public_listed to TRUE. Until then the cluster is invisible to
 * search engines.
 */

import type { MetadataRoute } from "next";
import { listPublicClusters, siteUrl } from "@/lib/public-cluster";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const clusters = await listPublicClusters();
  const base = siteUrl();

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  for (const cluster of clusters) {
    if (!cluster.public_slug) continue;
    entries.push({
      url: `${base}/c/${cluster.public_slug}`,
      lastModified: new Date(cluster.updated_at),
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  return entries;
}
