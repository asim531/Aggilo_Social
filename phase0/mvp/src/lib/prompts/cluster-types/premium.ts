/**
 * Premium cluster type defaults.
 *
 * Premium clusters carry additional configurability hooks (the slider,
 * free-text guidance, enabled skills) and may override more of the
 * platform's defaults than a generic cluster. The defaults here apply
 * when a premium cluster's `identity.ts` does not specify the field.
 *
 * Concrete clusters of type "premium" can override any default by
 * declaring the same key in their own `identity.ts`.
 */

import type { ClusterIdentity } from "./types";

export const PREMIUM_CLUSTER_DEFAULTS: Partial<ClusterIdentity> = {
  memberNoun: "member",
  memberNounPlural: "members",
  primaryLanguage: "en",
  collectiveNoun: "this room",
  authorityNoun: "Admin",
  hasDemographicRestrictions: false,
};
