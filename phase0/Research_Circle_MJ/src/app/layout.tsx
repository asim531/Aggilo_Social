import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import Analytics from "@/components/Analytics";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const siteUrl = basePath
  ? `https://mvp.aggilo.in${basePath}`
  : "http://localhost:3002";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Research Circle MJ — Aggilo",
    template: "%s — Research Circle MJ",
  },
  description:
    "A persistent space for faculty and researchers at MJ College to share work, trace ideas across conversations, and keep documents connected to the threads that shape them.",
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
    siteName: "Research Circle MJ",
    title: "Research Circle MJ — Aggilo",
    description:
      "A persistent space for faculty and researchers at MJ College to share work, trace ideas across conversations, and keep documents connected to the threads that shape them.",
    url: "./",
  },
  twitter: {
    card: "summary_large_image",
    title: "Research Circle MJ — Aggilo",
    description:
      "A persistent space for faculty and researchers at MJ College to share work, trace ideas across conversations, and keep documents connected to the threads that shape them.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0d0f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('rcmj-theme') || 'light';
                  var resolved = theme === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : theme;
                  if (resolved === 'dark') document.documentElement.classList.add('dark');
                } catch (e) {}
              })();
            `,
          }}
        />
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
      <body className="bg-husl-surface dark:bg-[#0b0d0f] text-husl-ink dark:text-white antialiased min-h-screen font-sans transition-colors">
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
