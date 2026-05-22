/**
 * @deprecated since V3.12 — moved to `lib/prompts/`.
 *
 * The Clio prompt has been split into three layers:
 *   - lib/prompts/platform/super-prompt.ts          (every agent, every cluster)
 *   - lib/prompts/platform/clio-character.ts        (Clio, every cluster)
 *   - lib/prompts/clusters/<cluster_id>/clio.ts     (this cluster only)
 *
 * Builders + helpers live in lib/prompts/clio-builder.ts.
 *
 * This file is a re-export shim so existing import sites keep working.
 * New code should import from `@/lib/prompts/clio-builder` directly.
 *
 * See `lib/prompts/README.md` for the full layout.
 */

export {
  buildClioClusterMessages,
  buildClioEphemeralMessages,
  detectWelfareSignal,
  WELFARE_PATTERNS,
} from "./prompts/clio-builder";
export type { BuildClioContext } from "./prompts/clio-builder";

// CLIO_DUA_REVIEW_PROMPT is platform-level — used by the dua-suggestion
// pipeline regardless of cluster. Re-exported here for the legacy import
// in suggest-dua/route.ts.
export { CLIO_DUA_REVIEW_PROMPT } from "./prompts/platform/clio-character";
