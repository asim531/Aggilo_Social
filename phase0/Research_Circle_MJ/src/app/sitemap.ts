import type { MetadataRoute } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `https://mvp.aggilo.in${basePath}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
