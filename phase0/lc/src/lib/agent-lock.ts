/**
 * Agent locks — concurrent-request dedupe for autonomous routes.
 *
 * Backed by the shared Supabase project's `agent_locks` table and
 * `try_acquire_agent_lock` / `release_agent_lock` RPCs (created by
 * the MVP's APPLY_NOW.sql §15). Both clusters share the lock space
 * — the lock_key includes cluster_id so LC and SiD never collide.
 *
 * Pattern:
 *
 *   const acquired = await tryAcquireAgentLock(supabase, key, ttlSec);
 *   if (!acquired) return NextResponse.json({ outcome: "in_flight" });
 *   try {
 *     // ... protected work ...
 *   } finally {
 *     await releaseAgentLock(supabase, key); // optional — lock self-expires
 *   }
 *
 * Lock TTL should comfortably exceed the maximum protected-work duration.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Try to acquire `key` for `ttlSeconds`. Returns true if this caller
 * now holds the lock, false if another caller already does.
 *
 * On RPC error we conservatively return `false` — better to skip the
 * autonomous action than risk a duplicate.
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
    console.warn("[agent-lock] try_acquire failed:", key, error.message);
    return false;
  }

  return data === true;
}

/**
 * Release `key` ahead of its TTL. Safe to call even if this caller
 * does not hold the lock.
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
