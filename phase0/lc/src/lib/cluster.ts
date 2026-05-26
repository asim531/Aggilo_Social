/**
 * Cluster identity — Long Conversation.
 *
 * This file is the single source of truth for cluster-level constants
 * within this app. Mirrored from `mvp/src/lib/prompts/clusters/long_conversation/identity.ts`
 * but with the app-specific runtime fields the platform code needs at
 * call sites (e.g. the cluster_id used in every Supabase query).
 *
 * If the canonical identity in the prompts directory changes, this file
 * must be updated too. The two files together serve different consumers:
 *   - `prompts/.../identity.ts` is the data the LLM sees
 *   - `lib/cluster.ts` is the data the runtime sees
 */

export const CLUSTER_ID = "long_conversation";

export const CLUSTER = {
  id: CLUSTER_ID,
  type: "generic" as const,
  displayName: "Long Conversation",
  tagline: "Where you're known by what you say — nothing else.",
  shortDescription:
    "A text-only space for intellectually serious young Indians who are done with apps.",
  icon: "💬",
  primaryLanguage: "en",
  collectiveNoun: "this room",
  authorityNoun: "Admin",
  /**
   * The cluster's AGGIL profile — used in the AuthForm gate and in
   * Scout's discovery brief. The waitlist gate enforces these soft
   * boundaries during onboarding (informational, not blocking — anyone
   * can self-declare and join in Phase 0).
   */
  aggil: {
    birthYearRange: [1993, 2003] as [number, number],
    /** All genders welcome — mixed cluster. */
    genders: ["male", "female", "non_binary"] as const,
    /** Country preference — India-primary. Non-India members see a beta note but can still join. */
    primaryCountry: "India",
    languages: ["en"] as const,
  },
} as const;

/**
 * Helper for any Supabase query that needs to scope to this cluster.
 * Every query in this codebase that touches posts, profiles, or
 * clio_tip_log MUST chain `.eq("cluster_id", CLUSTER_ID)`. This is
 * the application-level scope; RLS in the database is the safety net.
 */
export function clusterScope() {
  return CLUSTER_ID;
}
