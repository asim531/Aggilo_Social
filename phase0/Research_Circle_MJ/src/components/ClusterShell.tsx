"use client";

/**
 * ClusterShell — Research Circle MJ.
 *
 * Renders the cluster page with:
 *   - Navbar (sticky top, has HelpMenu + founder badge + admin + signout)
 *   - ClusterHeader (cluster identity + chips)
 *   - ClusterFeed (Timeline + sticky compose bar)
 *   - AgentChatbox (Room Workshop, below the compose bar)
 *   - ClioFab (top-right floating button)
 *
 * Modal/overlay layer (user-invoked, never auto-firing):
 *   - ClioWelcome — opened from HelpMenu "Show me around"
 *   - ClioTour — opened from HelpMenu "Take the tour"
 *   - FoundingFeedbackPrompt — opened from FoundingFeedbackBadge
 *
 * What still auto-fires (not user-visible):
 *   - cadence-exchange — Sage⇄Clio dialogue cycle, 30s after first
 *     non-first session (invisible UX; result lands in Workshop strip)
 *
 * Design rationale:
 *   - The room is the experience. Modals are not the gate.
 *   - First-session orientation moved out of the way: a tiny
 *     dismissible banner above the Timeline points the new member
 *     to the HelpMenu. Power-users ignore it; new members find it.
 */

import { useEffect, useRef, useState } from "react";
import { withBasePath } from "@/lib/path";
import { track } from "@/lib/track";
import Navbar from "./Navbar";
import ClusterHeader from "./ClusterHeader";
import ClusterFeed from "./ClusterFeed";
import ClioFab from "./ClioFab";
import ClioWelcome from "./ClioWelcome";
import ClioTour from "./ClioTour";
import AgentChatbox from "./AgentChatbox";
import FoundingFeedbackPrompt from "./FoundingFeedbackPrompt";
import FeedbackModal from "./FeedbackModal";
import FirstVisitHint from "./FirstVisitHint";
import ClioTipLayer from "./ClioTipLayer";
import ThreadSearchBar from "./ThreadSearchBar";
import PaperReadingFilter from "./PaperReadingFilter";
import PaperIndex from "./PaperIndex";
import TopicBar from "./TopicBar";
import TopicsTab from "./TopicsTab";
import { ThemeProvider } from "./ThemeProvider";
import type { PostWithAuthor, Profile, Topic } from "@/lib/types";
import { PresenceProvider } from "@/lib/presence-context";
import { useTabNotification } from "@/hooks/useTabNotification";

interface ClusterShellProps {
  userId: string;
  profile: Profile;
  initialPosts: PostWithAuthor[];
  activeTopic?: Topic | null;
}

const CADENCE_NEXT_ELIGIBLE_KEY = "lc:cadence_exchange_next_eligible";
const FIRST_SESSION_DONE_KEY = "lc:first_session_done";

export default function ClusterShell({
  userId,
  profile,
  initialPosts,
  activeTopic: initialActiveTopic = null,
}: ClusterShellProps) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showFoundingFeedback, setShowFoundingFeedback] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showTopicsTab, setShowTopicsTab] = useState(false);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(initialActiveTopic);
  const [readingFilter, setReadingFilter] = useState<"unread" | "reading" | "read" | null>(null);
  const [sortOrder, setSortOrder] = useState<"oldest" | "newest">("oldest");
  // Server-side onboarded flag is used only for the first-visit hint
  // (which is non-blocking). The welcome modal itself is always
  // user-invoked from the HelpMenu.
  const [hintVisible, setHintVisible] = useState(!profile.onboarded);
  const [unsubscribeAck, setUnsubscribeAck] = useState(false);
  const unsubHandledRef = useRef(false);

  // Tab title badge — zero intrusion, clears on focus.
  useTabNotification(userId);

  useEffect(() => {
    track("session_started");
    track("cluster_landed");
    // Stamp last_seen_at so the notification cron knows when you were here.
    void fetch(withBasePath("/api/auth/record-visit"), { method: "POST" }).catch(() => {});
  }, []);

  // One-click email unsubscribe: the return email footer links here with
  // ?unsubscribe=1. Handle it once, acknowledge briefly, then clean the URL.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (unsubHandledRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("unsubscribe") !== "1") return;
    unsubHandledRef.current = true;
    void fetch(withBasePath("/api/auth/notification-preferences"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: false }),
    }).catch(() => {});
    setUnsubscribeAck(true);
    // Remove the param from the URL so a refresh doesn't re-trigger.
    const clean = new URL(window.location.href);
    clean.searchParams.delete("unsubscribe");
    window.history.replaceState({}, "", clean.toString());
    // Dismiss the ack after a few seconds.
    setTimeout(() => setUnsubscribeAck(false), 6000);
  }, []);

  function handleDismissHint() {
    setHintVisible(false);
    void fetch(withBasePath("/api/auth/mark-onboarded"), {
      method: "POST",
    }).catch(() => {});
  }

  function handleShowWelcomeFromHint() {
    setShowWelcome(true);
    handleDismissHint();
    track("welcome_modal_shown_from_hint");
  }

  function handleShowWelcomeFromHelp() {
    setShowWelcome(true);
    track("welcome_modal_shown_from_help");
  }

  function handleStartTour() {
    setShowTour(true);
    track("tour_started");
  }

  function handleOpenFoundingFeedback() {
    setShowFoundingFeedback(true);
    track("founding_feedback_modal_opened");
  }

  function handleOpenFeedback() {
    setShowFeedback(true);
    track("feedback_modal_opened");
  }

  function handleSelectTopic(topic: Topic | null) {
    setActiveTopic(topic);
    if (topic) {
      track("topic_selected", { slug: topic.slug, name: topic.name });
    } else {
      track("topic_cleared");
    }
  }

  // Cadence-exchange auto-trigger (invisible to the user). Keeps the
  // Workshop strip alive across visits without asking anyone.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const firstDone = window.localStorage.getItem(FIRST_SESSION_DONE_KEY);
    if (!firstDone) {
      window.localStorage.setItem(FIRST_SESSION_DONE_KEY, String(Date.now()));
      return;
    }
    const stored = window.localStorage.getItem(CADENCE_NEXT_ELIGIBLE_KEY);
    if (stored && Date.now() < parseInt(stored, 10)) return;

    const trigger = setTimeout(async () => {
      try {
        const res = await fetch(withBasePath("/api/agents/cadence-exchange"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = (await res.json()) as {
          outcome?: string;
          next_eligible_at?: string;
        };
        if (data.outcome === "cadence_blocked" && data.next_eligible_at) {
          window.localStorage.setItem(
            CADENCE_NEXT_ELIGIBLE_KEY,
            String(new Date(data.next_eligible_at).getTime())
          );
        } else if (data.outcome === "posted") {
          window.localStorage.setItem(
            CADENCE_NEXT_ELIGIBLE_KEY,
            String(Date.now() + 60 * 60 * 1000)
          );
        } else {
          window.localStorage.setItem(
            CADENCE_NEXT_ELIGIBLE_KEY,
            String(Date.now() + 5 * 60 * 1000)
          );
        }
      } catch {
        /* silent */
      }
    }, 30_000);

    return () => clearTimeout(trigger);
  }, []);

  // Welcome tip auto-trigger on first session
  useEffect(() => {
    if (typeof window === "undefined") return;
    const WELCOME_TIP_KEY = `lc:welcome_tip_checked_${userId}`;
    if (window.localStorage.getItem(WELCOME_TIP_KEY)) return;

    window.localStorage.setItem(WELCOME_TIP_KEY, "true");
    
    // Slight delay so it feels natural and doesn't block immediate render
    setTimeout(() => {
      fetch(withBasePath("/api/agents/clio-tips/welcome"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId, 
          nickname: profile.nickname,
          gender: profile.gender,
          country: profile.country
        }),
      }).then(() => {
        window.dispatchEvent(new Event("clio-tip-inserted"));
      }).catch(() => {});
    }, 3000);
  }, [userId, profile]);

  return (
    <ThemeProvider>
      <PresenceProvider userId={userId} nickname={profile.nickname}>
        <div className="min-h-screen flex flex-col bg-husl-surface dark:bg-[#0b0d0f] transition-colors">
        <a
          href="#husl-cluster-timeline"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[80] focus:px-3 focus:py-2 focus:bg-husl-ink focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-husl-clio"
        >
          Skip to feed
        </a>

      <Navbar
        displayName={profile.nickname}
        isAdmin={profile.role === "admin"}
        onShowWelcome={handleShowWelcomeFromHelp}
        onStartTour={handleStartTour}
        onOpenFoundingFeedback={handleOpenFoundingFeedback}
        onOpenFeedback={handleOpenFeedback}
      />

      {unsubscribeAck && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-husl-ink text-white text-sm font-serif px-5 py-3 rounded-lg shadow-xl transition-all"
        >
          You won't receive email nudges anymore. Come back whenever you like.
        </div>
      )}

      <main className="flex-1">
        <ClusterHeader />

        {activeTopic && (
          <div className="bg-husl-clio/10 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-husl-clio dark:text-amber-400">Viewing topic:</span>
              <span className="text-sm font-semibold text-husl-ink dark:text-stone-200">{activeTopic.name}</span>
              <span className="text-[10px] text-husl-muted dark:text-stone-400">{activeTopic.post_count} posts</span>
            </div>
            <button
              type="button"
              onClick={() => handleSelectTopic(null)}
              className="text-xs text-husl-clio dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium"
            >
              Back to all posts
            </button>
          </div>
        )}

        <div className="max-w-3xl mx-auto px-4 flex items-center gap-2">
          <div className="flex-1">
            <ThreadSearchBar />
          </div>
          <PaperIndex />
        </div>
        <div className="max-w-3xl mx-auto px-4">
          <TopicBar
            activeTopicSlug={activeTopic?.slug ?? null}
            onSelectTopic={handleSelectTopic}
            onOpenTopicsTab={() => setShowTopicsTab(true)}
          />
        </div>
        <PaperReadingFilter userId={userId} activeFilter={readingFilter} onChange={setReadingFilter} sortOrder={sortOrder} onSortChange={setSortOrder} />

        {hintVisible && (
          <FirstVisitHint
            nickname={profile.nickname}
            onShowWelcome={handleShowWelcomeFromHint}
            onDismiss={handleDismissHint}
          />
        )}
        <ClusterFeed
          initialPosts={initialPosts}
          userId={userId}
          profile={profile}
          activeTopic={activeTopic}
          readingFilter={readingFilter}
          sortOrder={sortOrder}
          onSelectTopic={handleSelectTopic}
        />
        <AgentChatbox />
      </main>

      <ClioTipLayer userId={userId} />
      <ClioFab userId={userId} />

      {/* User-invoked overlays */}
      {showWelcome && (
        <ClioWelcome
          nickname={profile.nickname}
          onDismiss={() => setShowWelcome(false)}
        />
      )}

      {showTour && (
        <ClioTour
          onDone={() => {
            setShowTour(false);
            track("tour_completed");
          }}
        />
      )}

      <FoundingFeedbackPrompt
        open={showFoundingFeedback}
        founderNickname={profile.nickname}
        onClose={(didRespond) => {
          setShowFoundingFeedback(false);
          if (didRespond) {
            setTimeout(() => window.location.reload(), 600);
          }
        }}
      />

      <FeedbackModal
        open={showFeedback}
        onClose={() => setShowFeedback(false)}
      />

      <TopicsTab
        open={showTopicsTab}
        onClose={() => setShowTopicsTab(false)}
        onSelectTopic={(topic) => handleSelectTopic(topic)}
      />
      </div>
    </PresenceProvider>
    </ThemeProvider>
  );
}
