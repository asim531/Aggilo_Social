/**
 * Generic cluster type defaults.
 *
 * Stock cluster — defaults shipped with any new cluster that doesn't
 * override them. Used by Phase 0 test clusters and by self-serve
 * clusters in Phase 1 before an Admin customises.
 *
 * Concrete clusters of type "generic" can override any default by
 * declaring the same key in their own `identity.ts`.
 */

import type { ClusterIdentity } from "./types";

export const GENERIC_CLUSTER_DEFAULTS: Partial<ClusterIdentity> = {
  /** Used in messages addressed to a member's peer group. e.g. "the room". */
  memberNoun: "member",
  /** Plural form of the above. e.g. "members". */
  memberNounPlural: "members",
  /** Cluster's primary surface language. */
  primaryLanguage: "en",
  /** Display strings — "this group" / "the room" — that Sage uses to refer to the cluster collectively. */
  collectiveNoun: "this group",
  /**
   * Authority terminology — what the cluster's care authority is called
   * in member-facing copy. Default platform terminology is Admin /
   * Manager. Override per cluster only when the cluster has a different
   * naming convention (e.g. "Founder" / "Steward").
   */
  authorityNoun: "Admin",
  /** Whether the cluster has demographic restrictions surfaced as chips. */
  hasDemographicRestrictions: false,
};
