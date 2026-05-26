"use client";

/**
 * Navbar — Long Conversation.
 *
 * Sticky top bar. Shows the cluster name, the member's nickname, and a
 * sign-out control. For admins, also surfaces a link into the admin
 * surface (Welfare queue + future tools).
 *
 * Intentionally minimal — this is a text-only space, the chrome
 * should stay out of the way.
 */

import Link from "next/link";
import { CLUSTER } from "@/lib/cluster";
import { createClient } from "@/lib/supabase-browser";
import { withBasePath } from "@/lib/path";
import { track } from "@/lib/track";

interface NavbarProps {
  displayName: string;
  /**
   * True if the current user has admin privileges in this cluster.
   * When true, the nav surfaces a link to /admin (welfare queue +
   * future tools).
   */
  isAdmin?: boolean;
}

export default function Navbar({ displayName, isAdmin = false }: NavbarProps) {
  async function handleSignOut() {
    track("session_signed_out");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = withBasePath("/");
  }

  return (
    <nav className="sticky top-0 z-40 bg-lc-card/95 backdrop-blur border-b border-stone-200">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="text-xs uppercase tracking-[0.18em] text-lc-muted">
            Aggilo
          </span>
          <span className="text-base font-semibold text-lc-ink">
            {CLUSTER.displayName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin/welfare"
              className="text-xs text-lc-clio hover:text-amber-700 transition-colors px-2 py-1 rounded hover:bg-amber-50"
            >
              Admin
            </Link>
          )}
          <span className="hidden sm:inline text-sm text-lc-muted">
            {displayName}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs text-lc-muted hover:text-lc-ink transition-colors px-2 py-1 rounded hover:bg-stone-100"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
