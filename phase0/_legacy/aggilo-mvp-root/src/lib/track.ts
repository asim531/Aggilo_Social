/**
 * Lightweight client-side helper to log a behavioural event.
 *
 * Fire-and-forget. Failures are swallowed — we never want event tracking
 * to break a user flow. The server enforces event_type whitelist and
 * stamps user_id / country / gender / cluster_id from the profile.
 *
 * Usage:
 *   import { track } from "@/lib/track";
 *   track("dua_translation_revealed", { vault_id });
 */

export type TrackedEventType =
  | "session_started"
  | "cluster_landed"
  | "post_created"
  | "post_replied"
  | "post_liked"
  | "reply_opened"
  | "clio_message_sent"
  | "clio_tab_switched"
  | "clio_panel_opened"
  | "clio_panel_closed"
  | "dua_translation_revealed"
  | "dua_pointer_followed"
  | "agent_thoughts_opened"
  | "agent_thoughts_minimized"
  | "handoff_greeting_seen"
  | "handoff_greeting_responded"
  | "handoff_greeting_dismissed"
  | "link_card_opened"
  | "feature_upvoted"
  | "feature_commented"
  | "feature_viewed"
  | "sage_feedback_given"
  | "clio_feedback_given";

export function track(
  eventType: TrackedEventType,
  eventData?: Record<string, unknown>,
  clusterId?: string
): void {
  if (typeof window === "undefined") return;

  // Fire-and-forget. We don't await; we don't surface errors to the user.
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: eventType,
      cluster_id: clusterId ?? "the_single_source",
      event_data: eventData ?? {},
    }),
    keepalive: true,
  }).catch(() => {
    /* silent */
  });
}
