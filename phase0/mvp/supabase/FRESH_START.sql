-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  FRESH START — Wipes all user/agent data for a clean test slate ║
-- ║                                                                  ║
-- ║  ⚠  DESTRUCTIVE. Cannot be undone.                              ║
-- ║                                                                  ║
-- ║  What this deletes:                                              ║
-- ║    - All posts (member posts, Sage posts, seed posts)            ║
-- ║    - All profiles                                                ║
-- ║    - All auth users (Supabase auth.users)                        ║
-- ║    - All agent chatbox exchanges (Room Workshop history)         ║
-- ║    - All cluster features (Workshop proposals)                   ║
-- ║    - All clio handoff greetings                                  ║
-- ║    - All clio ephemeral sessions                                 ║
-- ║    - All welfare notifications                                   ║
-- ║    - All link previews                                           ║
-- ║    - All LLM response logs                                       ║
-- ║    - All Sage decision logs                                      ║
-- ║    - All agent feedback                                          ║
-- ║    - All behavioural events                                      ║
-- ║    - All character concern logs                                  ║
-- ║    - All vault gap requests                                      ║
-- ║    - All agent prompt proposals                                  ║
-- ║    - All atlas pulses                                            ║
-- ║                                                                  ║
-- ║  What this KEEPS:                                                ║
-- ║    - dua_vault (verified duas — curated content, not user data)  ║
-- ║    - cluster_config (RSS feeds, public meta)                     ║
-- ║    - platform_settings                                           ║
-- ║    - All schema, tables, indexes, RLS policies                   ║
-- ║    - All migrations already applied                              ║
-- ║                                                                  ║
-- ║  Run in Supabase SQL Editor:                                     ║
-- ║  Dashboard → SQL Editor → New Query → Paste → Run               ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ── Step 1: Log tables (no FK deps on user tables) ─────────────────
-- These are safe to truncate first because nothing else references them.

TRUNCATE TABLE public.llm_response_logs        CASCADE;
TRUNCATE TABLE public.sage_decision_logs       CASCADE;
TRUNCATE TABLE public.behavioural_events       CASCADE;
TRUNCATE TABLE public.agent_feedback           CASCADE;

-- character_concerns — only if the table exists (added in V3 audit)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'character_concerns'
  ) THEN
    EXECUTE 'TRUNCATE TABLE public.character_concerns CASCADE';
  END IF;
END $$;

-- ── Step 2: Agent collaboration data ───────────────────────────────
-- Room Workshop history: exchanges + proposed features

TRUNCATE TABLE public.agent_chatbox_exchanges  CASCADE;

-- cluster_features — Workshop proposals (reset per clean slate)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cluster_features'
  ) THEN
    EXECUTE 'TRUNCATE TABLE public.cluster_features CASCADE';
  END IF;
END $$;

-- atlas_pulses — content discovery pipeline state
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'atlas_pulses'
  ) THEN
    EXECUTE 'TRUNCATE TABLE public.atlas_pulses CASCADE';
  END IF;
END $$;

-- vault_gap_requests — member-surfaced vault gaps
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'vault_gap_requests'
  ) THEN
    EXECUTE 'TRUNCATE TABLE public.vault_gap_requests CASCADE';
  END IF;
END $$;

-- agent_prompt_proposals — prompts proposed through the system
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'agent_prompt_proposals'
  ) THEN
    EXECUTE 'TRUNCATE TABLE public.agent_prompt_proposals CASCADE';
  END IF;
END $$;

-- ── Step 3: Clio/Sage interaction tables ───────────────────────────

TRUNCATE TABLE public.clio_handoff_greetings   CASCADE;
TRUNCATE TABLE public.welfare_notifications    CASCADE;
TRUNCATE TABLE public.clio_ephemeral_sessions  CASCADE;
TRUNCATE TABLE public.link_previews            CASCADE;

-- ── Step 4: Posts ──────────────────────────────────────────────────

TRUNCATE TABLE public.posts CASCADE;

-- ── Step 5: Profiles ───────────────────────────────────────────────

TRUNCATE TABLE public.profiles CASCADE;

-- ── Step 6: Auth users ─────────────────────────────────────────────
-- TRUNCATE on auth.users is not permitted; we use DELETE.
-- This also fires the on_auth_user_created trigger cleanup.

DELETE FROM auth.users;

-- ── Step 7: Reload PostgREST schema cache ──────────────────────────

NOTIFY pgrst, 'reload schema';

-- ── Verification ───────────────────────────────────────────────────
-- After running, these should all return 0:

SELECT 'auth.users'              AS tbl, COUNT(*) FROM auth.users
UNION ALL
SELECT 'profiles'                AS tbl, COUNT(*) FROM public.profiles
UNION ALL
SELECT 'posts'                   AS tbl, COUNT(*) FROM public.posts
UNION ALL
SELECT 'agent_chatbox_exchanges' AS tbl, COUNT(*) FROM public.agent_chatbox_exchanges
UNION ALL
SELECT 'welfare_notifications'   AS tbl, COUNT(*) FROM public.welfare_notifications
UNION ALL
SELECT 'llm_response_logs'       AS tbl, COUNT(*) FROM public.llm_response_logs
UNION ALL
SELECT 'sage_decision_logs'      AS tbl, COUNT(*) FROM public.sage_decision_logs
UNION ALL
SELECT 'behavioural_events'      AS tbl, COUNT(*) FROM public.behavioural_events
UNION ALL
SELECT 'agent_feedback'          AS tbl, COUNT(*) FROM public.agent_feedback
UNION ALL
SELECT 'dua_vault (kept)'        AS tbl, COUNT(*) FROM public.dua_vault;
