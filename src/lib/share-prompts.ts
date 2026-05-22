/**
 * @deprecated since V3.12 — moved to `lib/prompts/share-builder.ts`.
 *
 * The share-line builders are platform-level (the share rules apply to
 * every cluster). Cluster identity is read from PublicCluster (DB), not
 * from the cluster registry, because share lines may run for clusters
 * that haven't been added to the code registry yet.
 *
 * This file is a re-export shim so existing import sites keep working.
 *
 * See `lib/prompts/README.md` for the full layout.
 */

export {
  buildClusterCardSharePrompt,
  buildClusterInvitePrompt,
  tidyShareLine,
} from "./prompts/share-builder";
export type { ShareContext } from "./prompts/share-builder";
