import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Research Circle MJ — Papers, threads, and ideas that don't get lost";
export const size = {
  width: 1200,
  height: 630,
};

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafaf9",
          padding: 60,
        }}
      >
        <div
          style={{
            fontSize: 28,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "#78716c",
            marginBottom: 24,
          }}
        >
          A cluster on Aggilo
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 600,
            color: "#1c1917",
            textAlign: "center",
            lineHeight: 1.1,
            marginBottom: 24,
          }}
        >
          Research Circle MJ
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#78716c",
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Papers, threads, and ideas that don&apos;t get lost.
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
