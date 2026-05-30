import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import Analytics from "@/components/Analytics";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const siteUrl = basePath
  ? `https://mvp.aggilo.in${basePath}`
  : "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Long Conversation — Aggilo",
    template: "%s — Long Conversation",
  },
  description:
    "A text-only space for intellectually serious young Indians who are done with apps. Where you're known by what you say — nothing else.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Long Conversation",
    title: "Long Conversation — Aggilo",
    description:
      "A text-only space for intellectually serious young Indians who are done with apps. Where you're known by what you say — nothing else.",
    url: "./",
  },
  twitter: {
    card: "summary_large_image",
    title: "Long Conversation — Aggilo",
    description:
      "A text-only space for intellectually serious young Indians who are done with apps. Where you're known by what you say — nothing else.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fafaf9",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-lc-surface text-lc-ink antialiased min-h-screen font-sans">
        {/*
          Analytics: GA4 + Microsoft Clarity. Wrapped in Suspense
          because GAPageViewTracker uses useSearchParams which Next.js
          requires to be inside a Suspense boundary for static export
          and partial-prerender compatibility. The fallback is null
          because analytics never produces visible UI.
        */}
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
