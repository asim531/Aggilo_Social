-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Agent locks — concurrent-request dedupe for autonomous routes   ║
-- ╠══════════════════════════════════════════════════════════════════╣
--
-- Symptom this fixes:
--   On 2026-05-23 a member triggered two simultaneous requests to
--   /api/sage/suggest-dua during cluster mount (dual mount, refresh,
--   tab restore — root cause not material). Both requests passed the
--   6-hour cadence check because neither had inserted yet, and both
--   posted the same dua to the Timeline seconds apart.
--
-- Same race exists in:
--   - /api/sage/suggest-dua  (cluster-scoped, every 6h)
--   - /api/agents/welcome-new-member  (per-user, once)
--   - /api/agents/cadence-exchange  (cluster-scoped, every 15m or 60m)
--
-- Why a lock table instead of pg_try_advisory_xact_lock():
--   Supabase routes traffic through pgbouncer in transaction-pooling
--   mode, where session-scoped locks have surprising semantics. A row
--   in `agent_locks` with INSERT ... ON CONFLICT DO NOTHING gives us
--   the same guarantee with no pooling assumptions, plus an explicit
--   TTL we can reason about.
--
-- Behaviour:
--   1. try_acquire_agent_lock(key, ttl) is the only path to a lock.
--   2. If no row exists for `key`, INSERT succeeds → lock acquired.
--   3. If a row exists but expires_at < now(), it's stale — DELETE
--      and retry the INSERT once.
--   4. If a fresh row exists, INSERT does nothing → lock denied.
--   5. The function returns boolean: true = acquired, false = denied.
--   6. Locks self-expire — no explicit release needed. (You CAN
--      release with release_agent_lock(key) after success, which is
--      cheap, but not required.)
-- ╚══════════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.agent_locks (
  lock_key text PRIMARY KEY,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- RLS: only the service role uses this table. Members never read or
-- write directly. We still enable RLS as a defence in depth — RPCs
-- run with SECURITY DEFINER so they bypass RLS by design.
ALTER TABLE public.agent_locks ENABLE ROW LEVEL SECURITY;

-- No member-facing policies — table is service-only.

-- ── try_acquire_agent_lock(key, ttl_seconds) → boolean ────────────
--
-- Atomic acquire-or-deny. Returns true if this caller now holds the
-- lock; false otherwise. Stale locks (expires_at <= now()) are
-- transparently reclaimed.
CREATE OR REPLACE FUNCTION public.try_acquire_agent_lock(
  p_key text,
  p_ttl_seconds int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted int;
BEGIN
  -- Reclaim a stale lock if one exists. Cheap when no stale row.
  DELETE FROM public.agent_locks
   WHERE lock_key = p_key
     AND expires_at <= now();

  -- Try to insert. ON CONFLICT DO NOTHING means: if a fresh row
  -- already exists for this key, this caller does NOT hold the lock.
  INSERT INTO public.agent_locks (lock_key, acquired_at, expires_at)
  VALUES (
    p_key,
    now(),
    now() + make_interval(secs => p_ttl_seconds)
  )
  ON CONFLICT (lock_key) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted > 0;
END;
$$;

-- ── release_agent_lock(key) → void ────────────────────────────────
--
-- Optional explicit release. Use after the protected work succeeds
-- so the next eligible window opens cleanly. Safe to call even if the
-- caller does not hold the lock (DELETE is idempotent here).
CREATE OR REPLACE FUNCTION public.release_agent_lock(p_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.agent_locks WHERE lock_key = p_key;
END;
$$;

-- Allow the application's auth roles to call the RPCs. The functions
-- run as definer so RLS does not block them.
GRANT EXECUTE ON FUNCTION public.try_acquire_agent_lock(text, int)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.release_agent_lock(text)
  TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
