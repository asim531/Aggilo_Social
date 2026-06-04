/**
 * Agent locks — concurrent-request dedupe for autonomous routes.
 *
 * Backed by the `agent_locks` table and the `try_acquire_agent_lock`
 * RPC. See `supabase/migrations/2026-05-23_agent_locks.sql` for the
 * full rationale.
 *
 * Use this anywhere two simultaneous requests could both pass an
 * application-level idempotency check (e.g. "no Sage post in the last
 * 6h") because neither has inserted yet. The classic example:
 *
 *   Member opens cluster → ClusterShell fires /api/sage/suggest-dua
 *   Same member opens cluster in another tab seconds later → fires again
 *   Both requests see "no recent dua" → both insert → duplicate post
 *
 * Pattern:
 *
 *   const acquired = await tryAcquireAgentLock(supabase, key, ttlSec);
 *   if (!acquired) return NextResponse.json({ outcome: "in_flight" });
 *   try {
 *     // ... the protected work ...
 *   } finally {
 *     await releaseAgentLock(supabase, key); // optional but clean
 *   }
 *
 * Lock TTL should comfortably exceed the maximum protected-work
 * duration so a crashed request doesn't permanently block. The lock
 * self-expires — release is just an optimisation that lets the next
 * eligible window open immediately on success.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Attempt to acquire `key` for `ttlSeconds`. Returns true if this
 * caller now holds the lock, false if another caller already does.
 *
 * On RPC error we conservatively return `false` — better to skip the
 * autonomous action than risk a duplicate. Errors are logged so they
 * surface in observability without blowing up the request.
 */
export async function tryAcquireAgentLock(
  supabase: SupabaseClient,
  key: string,
  ttlSeconds: number
): Promise<boolean> {
  const { data, error } = await supabase.rpc("try_acquire_agent_lock", {
    p_key: key,
    p_ttl_seconds: ttlSeconds,
  });

  if (error) {
    // RPC not deployed yet, schema mismatch, transient error. Fail
    // closed (don't proceed) so we never trade duplicate-prevention
    // for a clean error path.
    console.warn("[agent-lock] try_acquire failed:", key, error.message);
    return false;
  }

  return data === true;
}

/**
 * Release `key` ahead of its TTL. Safe to call even if this caller
 * does not hold the lock; the underlying DELETE is idempotent.
 *
 * Errors here are logged but do not propagate — the lock will
 * self-expire either way, so a release failure is observability noise
 * rather than a correctness issue.
 */
export async function releaseAgentLock(
  supabase: SupabaseClient,
  key: string
): Promise<void> {
  const { error } = await supabase.rpc("release_agent_lock", {
    p_key: key,
  });
  if (error) {
    console.warn("[agent-lock] release failed:", key, error.message);
  }
}
