/**
 * Landing page — Long Conversation.
 *
 * The entry surface. Strangers arrive here from word-of-mouth, from
 * the founding member's invite link, or via the public preview at
 * aggilo.in/c/long-conversation (rewrite from the main domain).
 *
 * The page should make the right person feel found and let the wrong
 * person scroll past. The filter is in the specificity, not in a gate.
 */

import type { Metadata } from "next";
import { CLUSTER } from "@/lib/cluster";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Long Conversation",
  description:
    "A space where words are the only currency. Join a text-only room designed to help you truly understand people on a deeper level.",
  openGraph: {
    title: "Long Conversation — Where you're known by what you say",
    description:
      "A space where words are the only currency. Join a text-only room designed to help you truly understand people on a deeper level.",
  },
  twitter: {
    title: "Long Conversation — Where you're known by what you say",
    description:
      "A space where words are the only currency. Join a text-only room designed to help you truly understand people on a deeper level.",
  },
};

export default function LandingPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Long Conversation — Aggilo",
    description:
      "A text-only space for intellectually serious young Indians who are done with apps. Where you're known by what you say — nothing else.",
    url: "https://mvp.aggilo.in/c/long-conversation",
    inLanguage: "en",
    isPartOf: {
      "@type": "WebSite",
      name: "Aggilo",
      url: "https://aggilo.in",
    },
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-16 bg-lc-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      {/* ── Hero ───────────────────────────────────────────────── */}
      <div className="max-w-md w-full text-center mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-lc-muted mb-6">
          A cluster on Aggilo
        </p>
        <h1 className="text-4xl font-semibold text-lc-ink mb-3">
          {CLUSTER.displayName}
        </h1>
        <p className="text-lg text-lc-muted">{CLUSTER.tagline}</p>
      </div>

      {/* ── Description ─────────────────────────────────────────── */}
      <div className="max-w-md w-full mb-10 text-left">
        <div className="bg-lc-card border border-stone-200 rounded-xl p-6">
          <p className="text-sm text-lc-ink leading-relaxed">
            A space where words are the only currency. The public room is designed to help you truly understand people on a deeper level. When a real connection sparks and you're ready to take matters to the next level, Clio opens a private line.
          </p>
        </div>
      </div>

      {/* ── Auth form ──────────────────────────────────────────── */}
      <div className="max-w-md w-full mb-10">
        <AuthForm />
      </div>

      {/* ── Privacy note ───────────────────────────────────────── */}
      <div className="max-w-md w-full mb-12">
        <div className="bg-lc-card/50 border border-stone-200/60 rounded-lg p-4">
          <p className="text-xs text-lc-muted leading-relaxed">
            You will choose a nickname — no real names are shown. No photos,
            no swiping, no mutual matches. The timeline is public, and direct
            messages only open when Clio facilitates them.
          </p>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="text-xs text-lc-muted">
        <p>
          A cluster on{" "}
          <a
            href="https://aggilo.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lc-clio hover:underline"
          >
            Aggilo
          </a>
          .
        </p>
      </footer>
    </main>
  );
}