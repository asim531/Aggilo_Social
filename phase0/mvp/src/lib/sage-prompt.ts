/**
 * @deprecated since V3.12 — moved to `lib/prompts/`.
 *
 * The Sage prompt has been split into three layers:
 *   - lib/prompts/platform/super-prompt.ts        (every agent, every cluster)
 *   - lib/prompts/platform/sage-character.ts      (Sage, every cluster)
 *   - lib/prompts/clusters/<cluster_id>/sage.ts   (this cluster only)
 *
 * Builders + helpers live in lib/prompts/sage-builder.ts.
 *
 * This file is a re-export shim so existing import sites keep working
 * during V3.12 → V3.13 migration. New code should import from
 * `@/lib/prompts/sage-builder` and `@/lib/prompts/clusters/<cluster_id>`
 * directly. The shim will be removed once every route is migrated.
 *
 * See `lib/prompts/README.md` for the full layout.
 */

import { SAGE_CHARACTER_PROMPT } from "./prompts/platform/sage-character";
import { SAGE_SISTERS_IN_DUA_PROMPT } from "./prompts/clusters/sisters_in_dua";
import { SISTERS_IN_DUA_IDENTITY } from "./prompts/clusters/sisters_in_dua/identity";

// Builder + helpers
export {
  buildSageMessages,
  extractSageDecision,
  detectCharacterConcern,
  shallowSimilarity,
  isSagePostRepetitive,
  CHARACTER_CONCERN_PATTERNS,
} from "./prompts/sage-builder";
export type {
  SageEvaluationSignals,
  SageDecision,
  CharacterConcernMatch,
} from "./prompts/sage-builder";

// Legacy combined system prompt — concatenated character + cluster
// fragment to preserve the V3.x semantics for any code that imports the
// constant directly. Prefer the layered builder going forward.
export const SAGE_SYSTEM_PROMPT = `${SAGE_CHARACTER_PROMPT}\n\n${SAGE_SISTERS_IN_DUA_PROMPT}`;

// Legacy identity exports — kept for ClusterHeader and the cluster page.
export const SISTERS_IN_DUA = {
  name: SISTERS_IN_DUA_IDENTITY.displayName,
  description: SISTERS_IN_DUA_IDENTITY.description,
  tagline: SISTERS_IN_DUA_IDENTITY.tagline,
  icon: SISTERS_IN_DUA_IDENTITY.icon,
};

export const SAGE_SEED_POSTS: string[] = SISTERS_IN_DUA_IDENTITY.seedPosts;
