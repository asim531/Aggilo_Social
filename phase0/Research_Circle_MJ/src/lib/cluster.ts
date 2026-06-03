/**
 * Cluster identity — Research Circle MJ.
 *
 * This file is the single source of truth for cluster-level constants
 * within this app. Mirrored from `phase0/clusters/research_circle_mj/CLUSTER_DESCRIPTION.md`
 * but with the app-specific runtime fields the platform code needs at
 * call sites (e.g. the cluster_id used in every Supabase query).
 *
 * If the canonical identity in the prompts directory changes, this file
 * must be updated too. The two files together serve different consumers:
 *   - `prompts/.../identity.ts` is the data the LLM sees
 *   - `lib/cluster.ts` is the data the runtime sees
 */

export const CLUSTER_ID = "research_circle_mj";

export const CLUSTER = {
  id: CLUSTER_ID,
  type: "generic" as const,
  displayName: "Research Circle MJ",
  tagline: "Papers, threads, and ideas that don't get lost.",
  shortDescription:
    "A quiet room for faculty and researchers at MJ College to share drafts, track ideas across conversations, and keep documents connected to the threads that shape them.",
  icon: "�",
  primaryLanguage: "en",
  collectiveNoun: "this room",
  authorityNoun: "Admin",
  isPremium: true as const,
  institution: "Muffakham Jah College" as const,
  /**
   * The cluster's AGGIL profile — used in the AuthForm gate and in
   * Scout's discovery brief. The waitlist gate enforces these soft
   * boundaries during onboarding (informational, not blocking — anyone
   * can self-declare and join in Phase 0).
   */
  aggil: {
    /** All ages welcome — this cluster is scoped to the college, not a demographic. */
    birthYearRange: null as null,
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
