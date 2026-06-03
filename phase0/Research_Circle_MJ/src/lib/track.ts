/**
 * Custom analytics event helper.
 *
 * Use this anywhere in client code that wants to record a meaningful
 * member-facing event beyond the automatic pageview tracking. Examples:
 *
 *   import { track } from "@/lib/track";
 *
 *   // Page-level signals
 *   track("session_started");
 *   track("cluster_landed");
 *
 *   // Behaviour signals
 *   track("post_composed", { length: content.length });
 *   track("clio_fab_opened");
 *   track("clio_fab_message_sent");
 *
 *   // Tip mechanic signals (member-facing — what the member did with it)
 *   track("clio_tip_received");
 *   track("clio_tip_dismissed");
 *
 * What this DOES log:
 *   - Event name
 *   - Optional structured params (small, no PII)
 *   - Cluster id, so multi-cluster analytics can split per cluster
 *
 * What this does NOT log:
 *   - Message content
 *   - Tip text
 *   - Other members' nicknames
 *   - Any PII the member did not explicitly share for analytics
 *
 * Privacy boundary: tracking serves two purposes — telling us whether
 * the cluster's mechanics are working (is the tip mechanic landing?
 * does the FAB get used?) and detecting friction (are people getting
 * stuck on a screen?). It is never used to profile individuals or to
 * surface targeting cues back to the agents.
 */

import { CLUSTER_ID } from "./cluster";

export function track(
  eventName: string,
  params?: Record<string, string | number | boolean | null | undefined>
): void {
  if (typeof window === "undefined") return;

  const payload = {
    cluster_id: CLUSTER_ID,
    ...params,
  };

  // GA4 — fires when the GA library is loaded and gtag is on window.
  // Quiet no-op when GA is not configured.
  if (typeof window.gtag === "function") {
    try {
      window.gtag("event", eventName, payload);
    } catch {
      /* ignore — never break the UI for a tracking error */
    }
  }

  // Clarity — custom tags help filter session recordings by event.
  // Useful when reviewing what members did before / after a tip arrived.
  if (typeof window.clarity === "function") {
    try {
      window.clarity("event", eventName);
      // Add the cluster_id and any string params as tags so filtering
      // in the Clarity dashboard works.
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          window.clarity!("set", key, String(value));
        }
      });
    } catch {
      /* ignore */
    }
  }
}
