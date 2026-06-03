/**
 * Dynamic OpenGraph image for Research Circle MJ cluster card.
 * 1200×630 PNG rendered on the fly.
 */

import { ImageResponse } from "next/og";
import { CLUSTER } from "@/lib/cluster";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
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
          backgroundImage: "linear-gradient(135deg, #1a1408, #2d2410)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Top label */}
        <div
          style={{
            fontSize: "14px",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.6)",
            marginBottom: "32px",
          }}
        >
          A cluster on Aggilo
        </div>

        {/* Cluster name */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: 600,
            lineHeight: 1.15,
            marginBottom: "16px",
            maxWidth: "900px",
          }}
        >
          {CLUSTER.displayName}
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "28px",
            color: "rgba(255,255,255,0.75)",
            maxWidth: "800px",
            lineHeight: 1.4,
          }}
        >
          {CLUSTER.tagline}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize: "16px",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Research Circle MJ · Aggilo
          </div>

          {/* Aggilo mark */}
          <div
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            aggilo.in
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
