/**
 * Sisters in Dua — cluster module entry point.
 *
 * Stitches the cluster's identity + Sage prompt + Clio context together
 * for the registry. The registry resolves cluster_id → this module.
 */

import type { ClusterModule } from "../../cluster-types/types";
import { SISTERS_IN_DUA_IDENTITY } from "./identity";
import { SAGE_SISTERS_IN_DUA_PROMPT } from "./sage";
import { CLIO_SISTERS_IN_DUA_CONTEXT } from "./clio";

export const SISTERS_IN_DUA_MODULE: ClusterModule = {
  identity: SISTERS_IN_DUA_IDENTITY,
  sagePrompt: SAGE_SISTERS_IN_DUA_PROMPT,
  clioClusterContext: CLIO_SISTERS_IN_DUA_CONTEXT,
};

// Re-export the underlying constants so callers that want the identity
// (e.g. ClusterHeader) can read it directly.
export { SISTERS_IN_DUA_IDENTITY } from "./identity";
export { SAGE_SISTERS_IN_DUA_PROMPT } from "./sage";
export { CLIO_SISTERS_IN_DUA_CONTEXT } from "./clio";
