import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Analytics from "@/components/Analytics";

export const metadata: Metadata = {
  title: "Long Conversation — Aggilo",
  description:
    "A text-only space for intellectually serious young Indians who are done with apps. Where you're known by what you say — nothing else.",
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
