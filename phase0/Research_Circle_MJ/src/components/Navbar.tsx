"use client";

/**
 * Navbar — Research Circle MJ.
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
import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  displayName: string;
  isAdmin?: boolean;
  onShowWelcome: () => void;
  onStartTour: () => void;
  onOpenFoundingFeedback: () => void;
  onOpenFeedback?: () => void;
}

export default function Navbar({
  displayName,
  isAdmin = false,
  onShowWelcome,
  onStartTour,
  onOpenFoundingFeedback,
  onOpenFeedback,
}: NavbarProps) {
  async function handleSignOut() {
    track("session_signed_out");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = withBasePath("/");
  }

  return (
    <nav className="sticky top-0 z-40 bg-husl-card/95 dark:bg-[#14161a]/95 backdrop-blur border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3 min-w-0">
          <a
            href="https://aggilo.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline text-xs uppercase tracking-[0.18em] text-husl-muted dark:text-stone-400 hover:text-husl-ink dark:hover:text-stone-200 transition-colors"
          >
            Aggilo
          </a>
          <span className="text-base font-semibold text-husl-ink dark:text-stone-200 truncate">
            {CLUSTER.displayName}
          </span>
          {CLUSTER.isPremium && (
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full border border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Premium
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <FoundingFeedbackBadge onOpen={onOpenFoundingFeedback} />
          <ThemeToggle />
          <HelpMenu onShowWelcome={onShowWelcome} onStartTour={onStartTour} onOpenFeedback={onOpenFeedback} />
          {isAdmin && (
            <Link
              href="/admin/welfare"
              className="text-xs text-husl-clio dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors px-2 py-1 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20 hidden sm:inline-block"
            >
              Admin
            </Link>
          )}
          <span className="hidden md:inline text-sm text-husl-muted dark:text-stone-400">
            {displayName}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs text-husl-muted dark:text-stone-400 hover:text-husl-ink dark:hover:text-stone-200 transition-colors px-2 py-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800"
            aria-label="Sign out"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
