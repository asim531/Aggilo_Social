/**
 * Cluster identity types — shared by every concrete cluster.
 *
 * `ClusterIdentity` is the canonical shape of a cluster's per-prompt
 * data. The cluster's `identity.ts` populates it; the registry resolves
 * cluster_id → cluster module → ClusterIdentity at call time.
 */

export interface DemographicChip {
  label: string;
  icon: string;
  /** Tailwind colour classes for bg + text in the cluster header */
  color: string;
}

export interface ClusterIdentity {
  /** Stable identifier (snake_case). Matches `cluster_id` in the database. */
  id: string;
  /** Cluster type — drives type-level defaults. */
  type: "generic" | "premium";
  /** Display name shown in headers, share lines, and prompts. */
  displayName: string;
  /** One-line description, used for share lines and the cluster preview. */
  tagline: string;
  /** Two-to-four-sentence description used in prompts and on the public preview. */
  description: string;
  /** Single-glyph icon (emoji or simple unicode). */
  icon: string;
  /** Primary surface language ISO 639-1 (e.g. "en", "ur", "te"). */
  primaryLanguage: string;
  /** Singular noun used for one member ("sister", "brother", "friend"). */
  memberNoun: string;
  /** Plural noun ("sisters", "brothers", "friends"). */
  memberNounPlural: string;
  /** What Sage calls the cluster collectively ("this room", "this group"). */
  collectiveNoun: string;
  /** Member-facing name for the cluster's care authority ("Admin", "Founder"). */
  authorityNoun: string;
  /** Whether the cluster has demographic restrictions to surface as chips. */
  hasDemographicRestrictions: boolean;
  /** Demographic chips, if any. Empty when hasDemographicRestrictions is false. */
  demographicChips: DemographicChip[];
  /**
   * Sage's seed posts — written once at cluster creation and used as the
   * room's founding statement in the pinned anchor. Plain strings; the
   * rendering layer formats them as Sage posts.
   */
  seedPosts: string[];
}

/**
 * A complete cluster module — what `clusters/<cluster_id>/index.ts`
 * exports. Combines the data (identity) with the cluster-specific
 * prompt fragments that stitch into Sage and Clio's system messages.
 */
export interface ClusterModule {
  identity: ClusterIdentity;
  /** Sage system prompt fragment specific to this cluster. */
  sagePrompt: string;
  /** Clio cluster-mode context fragment specific to this cluster. */
  clioClusterContext: string;
}
