"use client";

/**
 * Navbar — Long Conversation.
 *
 * Sticky top bar. Shows the cluster name, the member's nickname, and:
 *   - HelpMenu (always visible, opens welcome / launches tour)
 *   - FoundingFeedbackBadge (only for founders with open feedback)
 *   - Admin link (only for cluster admins)
 *   - Sign-out control
 *
 * Intentionally minimal — this is a text-only space, the chrome
 * should stay out of the way.
 */

import Link from "next/link";
import { CLUSTER } from "@/lib/cluster";
import { createClient } from "@/lib/supabase-browser";
import { withBasePath } from "@/lib/path";
import { track } from "@/lib/track";
import HelpMenu from "./HelpMenu";
import FoundingFeedbackBadge from "./FoundingFeedbackBadge";

interface NavbarProps {
  displayName: string;
  isAdmin?: boolean;
  onShowWelcome: () => void;
  onStartTour: () => void;
  onOpenFoundingFeedback: () => void;
}

export default function Navbar({
  displayName,
  isAdmin = false,
  onShowWelcome,
  onStartTour,
  onOpenFoundingFeedback,
}: NavbarProps) {
  async function handleSignOut() {
    track("session_signed_out");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = withBasePath("/");
  }

  return (
    <nav className="sticky top-0 z-40 bg-lc-card/95 backdrop-blur border-b border-stone-200">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3 min-w-0">
          <a
            href="https://aggilo.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline text-xs uppercase tracking-[0.18em] text-lc-muted hover:text-lc-ink transition-colors"
          >
            Aggilo
          </a>
          <span className="text-base font-semibold text-lc-ink truncate">
            {CLUSTER.displayName}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <FoundingFeedbackBadge onOpen={onOpenFoundingFeedback} />
          <HelpMenu onShowWelcome={onShowWelcome} onStartTour={onStartTour} />
          {isAdmin && (
            <Link
              href="/admin/welfare"
              className="text-xs text-lc-clio hover:text-amber-700 transition-colors px-2 py-1 rounded hover:bg-amber-50 hidden sm:inline-block"
            >
              Admin
            </Link>
          )}
          <span className="hidden md:inline text-sm text-lc-muted">
            {displayName}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs text-lc-muted hover:text-lc-ink transition-colors px-2 py-1 rounded hover:bg-stone-100"
            aria-label="Sign out"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
