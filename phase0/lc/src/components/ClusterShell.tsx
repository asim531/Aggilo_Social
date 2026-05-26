"use client";

/**
 * ClusterShell — Long Conversation.
 *
 * Single-scroll layout. Sticky Navbar at top, sticky compose bar at
 * bottom (rendered by ClusterFeed → PostComposer), everything between
 * scrolls together. Mobile-first.
 *
 * The Clio FAB (top-right, intimacy-cohort register, with the private
 * tip mechanic active) is wired in at the bottom of the shell.
 */

import { useEffect } from "react";
import { track } from "@/lib/track";
import Navbar from "./Navbar";
import ClusterHeader from "./ClusterHeader";
import ClusterFeed from "./ClusterFeed";
import ClioFab from "./ClioFab";
import type { PostWithAuthor, Profile } from "@/lib/types";

interface ClusterShellProps {
  userId: string;
  profile: Profile;
  initialPosts: PostWithAuthor[];
}

export default function ClusterShell({
  userId,
  profile,
  initialPosts,
}: ClusterShellProps) {
  // Session-level analytics on mount.
  useEffect(() => {
    track("session_started");
    track("cluster_landed");
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-lc-surface">
      {/* Skip-to-content for keyboard users. WCAG 2.4.1 (Bypass Blocks). */}
      <a
        href="#lc-cluster-timeline"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[80] focus:px-3 focus:py-2 focus:bg-lc-ink focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-lc-clio"
      >
        Skip to feed
      </a>

      <Navbar displayName={profile.nickname} />

      <main className="flex-1">
        <ClusterHeader />
        <ClusterFeed
          initialPosts={initialPosts}
          userId={userId}
          profile={profile}
        />
      </main>

      {/* Clio FAB — top-right, 44px, 16px from edge, 8px below Navbar */}
      <ClioFab userId={userId} />
    </div>
  );
}
