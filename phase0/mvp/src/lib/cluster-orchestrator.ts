/**
 * Cluster orchestrator — Phase 0 core.
 *
 * This module owns the lifecycle state machine for generic and premium
 * clusters. Every function that touches cluster state lives here so the
 * test suite has a single import target.
 *
 * Design decisions:
 *
 * 1. Pure functions where possible. `validateTransition`, `buildCreateRow`,
 *    and `describeStatus` take plain data and return plain data. They have
 *    no side effects and are trivially testable.
 *
 * 2. DB-touching functions (`createCluster`, `transitionCluster`,
 *    `listClusters`, `getCluster`) accept a Supabase client as a parameter
 *    so tests can inject a mock. They are thin wrappers around the pure
 *    functions — the logic lives in the pure layer.
 *
 * 3. Separation from cluster_config. This module manages provisioning
 *    state (lifecycle, health, type). cluster_config manages agent
 *    settings (slider, guidance, skills). They join on cluster_id.
 *    Do not merge them.
 *
 * Lifecycle:
 *   creating → active → draining → destroyed
 *
 * Valid transitions:
 *   creating  → active    (cluster is ready to serve)
 *   creating  → destroyed (provisioning failed / cancelled)
 *   active    → draining  (graceful wind-down)
 *   active    → destroyed (emergency shutdown — skips drain)
 *   draining  → destroyed (drain complete)
 *   draining  → active    (drain cancelled — cluster restored)
 *
 * Invalid transitions (all others) return an error string.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Cluster,
  ClusterCreateInput,
  ClusterStatus,
  ClusterTransitionInput,
  ClusterType,
} from "./types";

// ── Lifecycle state machine ──────────────────────────────────────────────────

/**
 * All valid (from → to) transitions.
 * Anything not in this map is rejected.
 */
const VALID_TRANSITIONS: Record<ClusterStatus, ClusterStatus[]> = {
  creating: ["active", "destroyed"],
  active: ["draining", "destroyed"],
  draining: ["destroyed", "active"],
  destroyed: [], // terminal — no transitions out
};

/**
 * Validate a lifecycle transition.
 *
 * Returns null on success, or an error string describing why the
 * transition is invalid. Callers decide whether to throw or return 400.
 *
 * Pure function — no side effects.
 */
export function validateTransition(
  from: ClusterStatus,
  to: ClusterStatus
): string | null {
  if (from === to) {
    return `Cluster is already in status '${from}'.`;
  }
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    return (
      `Cannot transition from '${from}' to '${to}'. ` +
      `Valid transitions from '${from}': ${allowed.length ? allowed.join(", ") : "none (terminal state)"}.`
    );
  }
  return null;
}

/**
 * Compute the timestamp fields that change on a given transition.
 * Returns a partial Cluster update object.
 *
 * Pure function — no side effects.
 */
export function transitionTimestamps(
  to: ClusterStatus,
  now: string
): Partial<Cluster> {
  const fields: Partial<Cluster> = { status: to, updated_at: now };
  if (to === "active") fields.activated_at = now;
  if (to === "draining") fields.drain_started_at = now;
  if (to === "destroyed") fields.destroyed_at = now;
  return fields;
}

// ── Cluster type rules ───────────────────────────────────────────────────────

/**
 * Validate a cluster_id string.
 * Must be snake_case, 3–64 chars, no leading/trailing underscores.
 *
 * Pure function — no side effects.
 */
export function validateClusterId(id: string): string | null {
  if (!id || id.length < 3 || id.length > 64) {
    return "cluster_id must be between 3 and 64 characters.";
  }
  if (!/^[a-z][a-z0-9_]*[a-z0-9]$/.test(id)) {
    return (
      "cluster_id must be lowercase snake_case, start with a letter, " +
      "end with a letter or digit, and contain only a-z, 0-9, and underscores."
    );
  }
  return null;
}

/**
 * Validate a ClusterCreateInput before writing to the DB.
 * Returns null on success, or an error string.
 *
 * Pure function — no side effects.
 */
export function validateCreateInput(input: ClusterCreateInput): string | null {
  const idError = validateClusterId(input.cluster_id);
  if (idError) return idError;

  if (!input.display_name || input.display_name.trim().length < 2) {
    return "display_name must be at least 2 characters.";
  }
  if (input.display_name.trim().length > 128) {
    return "display_name must be 128 characters or fewer.";
  }

  const validTypes: ClusterType[] = ["generic", "premium"];
  if (!validTypes.includes(input.cluster_type)) {
    return `cluster_type must be one of: ${validTypes.join(", ")}.`;
  }

  if (input.primary_language !== undefined) {
    if (!/^[a-z]{2,3}$/.test(input.primary_language)) {
      return "primary_language must be a 2- or 3-letter ISO 639-1 code (e.g. 'en', 'ur').";
    }
  }

  return null;
}

/**
 * Build the DB row for a new cluster.
 * Status starts at 'creating' — the caller must explicitly transition
 * to 'active' once the cluster is ready to serve.
 *
 * Pure function — no side effects.
 */
export function buildCreateRow(
  input: ClusterCreateInput,
  createdBy: string | null,
  now: string
): Omit<Cluster, "id"> {
  return {
    cluster_id: input.cluster_id,
    display_name: input.display_name.trim(),
    cluster_type: input.cluster_type,
    status: "creating",
    primary_language: input.primary_language ?? "en",
    admin_notes: input.admin_notes ?? null,
    last_health_check_at: null,
    is_healthy: null,
    created_by: createdBy,
    created_at: now,
    updated_at: now,
    activated_at: null,
    drain_started_at: null,
    destroyed_at: null,
  };
}

// ── Human-readable status descriptions ──────────────────────────────────────

/**
 * Return a short human-readable description of a cluster status.
 * Used in the admin board UI and in API responses.
 *
 * Pure function — no side effects.
 */
export function describeStatus(status: ClusterStatus): string {
  const descriptions: Record<ClusterStatus, string> = {
    creating: "Provisioning — not yet serving traffic",
    active: "Live — serving members",
    draining: "Draining — no new members; existing members can still post",
    destroyed: "Destroyed — permanently shut down",
  };
  return descriptions[status];
}

/**
 * Return the Tailwind colour classes for a status badge.
 * Matches the tone conventions used elsewhere in the admin UI.
 *
 * Pure function — no side effects.
 */
export function statusBadgeClasses(status: ClusterStatus): string {
  const classes: Record<ClusterStatus, string> = {
    creating: "bg-amber-50 text-amber-700 border-amber-200",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    draining: "bg-orange-50 text-orange-700 border-orange-200",
    destroyed: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return classes[status];
}

// ── DB-touching functions ────────────────────────────────────────────────────
//
// These are thin wrappers. The logic lives in the pure functions above.
// Tests mock the Supabase client; the pure functions are tested directly.

export interface OrchestratorResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * List all clusters, ordered by created_at descending.
 * Optionally filter by status or type.
 */
export async function listClusters(
  supabase: SupabaseClient,
  filters?: { status?: ClusterStatus; cluster_type?: ClusterType }
): Promise<OrchestratorResult<Cluster[]>> {
  let query = supabase
    .from("clusters")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.cluster_type) {
    query = query.eq("cluster_type", filters.cluster_type);
  }

  const { data, error } = await query;
  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data as Cluster[], error: null };
}

/**
 * Fetch a single cluster by its UUID primary key.
 */
export async function getCluster(
  supabase: SupabaseClient,
  id: string
): Promise<OrchestratorResult<Cluster>> {
  const { data, error } = await supabase
    .from("clusters")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data as Cluster, error: null };
}

/**
 * Fetch a single cluster by its cluster_id (the stable string key).
 */
export async function getClusterByClusterId(
  supabase: SupabaseClient,
  clusterId: string
): Promise<OrchestratorResult<Cluster>> {
  const { data, error } = await supabase
    .from("clusters")
    .select("*")
    .eq("cluster_id", clusterId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data as Cluster, error: null };
}

/**
 * Create a new cluster.
 *
 * Validates the input, builds the row, inserts it, and returns the
 * created cluster. The cluster starts in 'creating' status.
 *
 * The caller is responsible for:
 *   1. Registering the cluster in the prompt registry (registry.ts)
 *   2. Inserting a cluster_config row (for agent settings)
 *   3. Transitioning to 'active' once the cluster is ready
 *
 * TODO(product): Should creating a cluster automatically insert a
 * cluster_config row with default settings? Or is that a separate
 * admin action? Decide before Phase 1 self-serve ships.
 */
export async function createCluster(
  supabase: SupabaseClient,
  input: ClusterCreateInput,
  createdBy: string | null
): Promise<OrchestratorResult<Cluster>> {
  const validationError = validateCreateInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }

  // Check for cluster_id uniqueness before inserting
  const { data: existing } = await supabase
    .from("clusters")
    .select("id")
    .eq("cluster_id", input.cluster_id)
    .maybeSingle();

  if (existing) {
    return {
      data: null,
      error: `A cluster with cluster_id '${input.cluster_id}' already exists.`,
    };
  }

  const now = new Date().toISOString();
  const row = buildCreateRow(input, createdBy, now);

  const { data, error } = await supabase
    .from("clusters")
    .insert(row)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data as Cluster, error: null };
}

/**
 * Transition a cluster's lifecycle status.
 *
 * Validates the transition, applies timestamp fields, updates the row,
 * and writes an audit entry to cluster_admin_actions.
 *
 * Returns the updated cluster on success.
 */
export async function transitionCluster(
  supabase: SupabaseClient,
  id: string,
  input: ClusterTransitionInput,
  actorId: string | null,
  actorRole: string
): Promise<OrchestratorResult<Cluster>> {
  // Fetch current state
  const { data: current, error: fetchError } = await supabase
    .from("clusters")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !current) {
    return { data: null, error: fetchError?.message ?? "Cluster not found." };
  }

  const cluster = current as Cluster;

  // Validate the transition
  const transitionError = validateTransition(cluster.status, input.to_status);
  if (transitionError) {
    return { data: null, error: transitionError };
  }

  const now = new Date().toISOString();
  const updates = transitionTimestamps(input.to_status, now);

  // Apply the update
  const { data: updated, error: updateError } = await supabase
    .from("clusters")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError || !updated) {
    return {
      data: null,
      error: updateError?.message ?? "Failed to update cluster.",
    };
  }

  // Write audit trail — non-fatal if it fails
  try {
    await supabase.from("cluster_admin_actions").insert({
      cluster_id: cluster.cluster_id,
      actor_id: actorId,
      actor_role: actorRole,
      action_type: "lifecycle_transition",
      before_state: { status: cluster.status },
      after_state: { status: input.to_status },
      rationale: input.reason ?? null,
    });
  } catch {
    // Non-fatal — the transition succeeded; the audit row is best-effort.
    console.warn(
      "[cluster-orchestrator] audit insert failed for cluster",
      id
    );
  }

  return { data: updated as Cluster, error: null };
}

/**
 * Update the health signal for a cluster.
 *
 * Called by the admin board's manual health-check button (Phase 0) or
 * by an automated health-check job (Phase 1).
 *
 * TODO(product): Define what constitutes a "healthy" cluster for each
 * type (generic vs premium). Suggested signals:
 *   - LLM error rate in the last hour < X%
 *   - Welfare queue unresolved count < Y
 *   - Last member post within Z hours (liveness signal)
 * These thresholds need a product decision before automation ships.
 */
export async function updateClusterHealth(
  supabase: SupabaseClient,
  id: string,
  isHealthy: boolean
): Promise<OrchestratorResult<Cluster>> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("clusters")
    .update({
      is_healthy: isHealthy,
      last_health_check_at: now,
      updated_at: now,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data as Cluster, error: null };
}
