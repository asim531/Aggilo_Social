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

import { CLUSTER } from "@/lib/cluster";
import AuthForm from "@/components/AuthForm";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-16 bg-lc-surface">
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
          <p className="text-sm text-lc-ink leading-relaxed mb-4">
            A space for people who are tired of conversations that don&apos;t
            go anywhere. No photos. No swiping. No mutual matches. The only
            thing you know about anyone here is what they choose to say.
          </p>
          <p className="text-sm text-lc-ink leading-relaxed mb-4">
            Apps optimise for surface signals. They are efficient at producing
            matches and poor at producing the thing that actually matters —
            the moment when two people realise they are genuinely interested
            in each other as people, not as profiles.
          </p>
          <p className="text-sm text-lc-ink leading-relaxed mb-4">
            Here, words are the only currency. People who are genuinely
            interesting reveal themselves through language faster than they
            reveal themselves through photos.
          </p>
          <p className="text-sm text-lc-ink leading-relaxed">
            This public room exists to set the vibe. When a real connection
            sparks, our resident agent, Clio, will step in to open a private
            line for direct messages. But it all starts here, in the open.
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