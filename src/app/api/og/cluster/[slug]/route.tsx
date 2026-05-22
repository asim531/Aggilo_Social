/**
 * Dynamic OpenGraph image for /c/<slug>.
 *
 * Renders a 1200×630 card on the fly using Next.js `ImageResponse`.
 * Only reads from public_cluster_view, so it can never accidentally
 * include member content.
 *
 * Visual brief (Session B):
 *   • Background: cluster's accent gradient (from public_meta)
 *   • Cluster display name (large, white)
 *   • Tagline (smaller)
 *   • Demographic chips with emojis
 *   • Member-count bracket (rounded — no exact number)
 *   • "From: Sage · Anchor" attribution when an anchor seed exists
 *   • Aggilo wordmark bottom-right
 *
 * Caching: 1-hour edge cache. Aligns with the page's revalidate window.
 */

import { ImageResponse } from "next/og";
import { getPublicClusterBySlug, formatMemberBracket } from "@/lib/public-cluster";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  const { slug } = await params;
  const cluster = await getPublicClusterBySlug(slug);

  // Render a fallback card even on miss so social previews never 404.
  const meta = cluster?.meta;
  const displayName = meta?.display_name ?? "Aggilo";
  const tagline = meta?.tagline ?? "Cluster not found";
  const accentFrom = meta?.accent_from ?? "#0b3a2c";
  const accentTo = meta?.accent_to ?? "#1a6f4a";
  const chips = meta?.demographic_chips ?? [];
  const memberLine = cluster
    ? formatMemberBracket(cluster.member_count_bracket)
    : "";
  const showAnchorAttribution = Boolean(cluster?.anchor_seed_text);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          padding: "72px",
          color: "#ffffff",
          backgroundImage: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Top label */}
        <div
          style={{
            fontSize: "20px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          A cluster on Aggilo
        </div>

        {/* Title */}
        <div
          style={{
            marginTop: "32px",
            fontSize: "84px",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          {displayName}
        </div>

        {/* Tagline */}
        <div
          style={{
            marginTop: "20px",
            fontSize: "32px",
            color: "rgba(255,255,255,0.85)",
            maxWidth: "1000px",
            lineHeight: 1.3,
          }}
        >
          {tagline}
        </div>

        {/* Chips */}
        {chips.length > 0 && (
          <div
            style={{
              marginTop: "40px",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {chips.slice(0, 5).map((chip, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 18px",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontSize: "22px",
                  color: "rgba(255,255,255,0.95)",
                }}
              >
                <span style={{ marginRight: "10px" }}>{chip.icon}</span>
                {chip.label}
              </div>
            ))}
          </div>
        )}

        {/* Spacer to push footer to bottom */}
        <div style={{ flex: 1, display: "flex" }} />

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            color: "rgba(255,255,255,0.7)",
            fontSize: "20px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {memberLine && <div>{memberLine}</div>}
            {showAnchorAttribution && (
              <div style={{ fontSize: "16px", color: "rgba(255,255,255,0.55)" }}>
                From: Sage · Anchor
              </div>
            )}
          </div>
          <div
            style={{
              fontWeight: 600,
              letterSpacing: "0.04em",
              color: "rgba(255,255,255,0.95)",
            }}
          >
            aggilo
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "cache-control": "public, max-age=3600, s-maxage=3600, immutable",
      },
    }
  );
}
