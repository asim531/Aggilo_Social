/**
 * Cluster registry.
 *
 * Maps cluster_id → cluster module. Routes ask the registry; they do
 * not import cluster files directly. This keeps Phase 0's multi-cluster
 * future a one-line addition: a new cluster registers here and every
 * agent route picks it up automatically.
 *
 * Phase 0 ships one entry. The structure is built for many.
 */

import type { ClusterModule } from "./cluster-types/types";
import { SISTERS_IN_DUA_MODULE } from "./clusters/sisters_in_dua";

const CLUSTER_REGISTRY: Record<string, ClusterModule> = {
  [SISTERS_IN_DUA_MODULE.identity.id]: SISTERS_IN_DUA_MODULE,
};

/**
 * Resolve a cluster_id to its module. Returns undefined for unknown
 * clusters; the caller decides whether to throw, fall back, or 404.
 */
export function getClusterModule(clusterId: string): ClusterModule | undefined {
  return CLUSTER_REGISTRY[clusterId];
}

/**
 * Resolve a cluster_id to its module, throwing if unknown. Use this in
 * routes where an unknown cluster is a bug, not a recoverable state.
 */
export function requireClusterModule(clusterId: string): ClusterModule {
  const mod = CLUSTER_REGISTRY[clusterId];
  if (!mod) {
    throw new Error(`Unknown cluster_id: ${clusterId}. Register it in prompts/registry.ts.`);
  }
  return mod;
}

/**
 * List every registered cluster. Useful for admin tooling and the
 * cluster fit evaluator (Phase 1).
 */
export function listClusters(): ClusterModule[] {
  return Object.values(CLUSTER_REGISTRY);
}

/** Default cluster for Phase 0 routes that don't yet read cluster_id from the request. */
export const DEFAULT_CLUSTER_ID = SISTERS_IN_DUA_MODULE.identity.id;
