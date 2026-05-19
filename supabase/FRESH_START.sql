-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  FRESH START — Wipes all user data for a clean test slate       ║
-- ║                                                                  ║
-- ║  ⚠  DESTRUCTIVE. Cannot be undone.                              ║
-- ║                                                                  ║
-- ║  What this deletes:                                              ║
-- ║    - All posts (including Sage seed posts)                       ║
-- ║    - All profiles                                                ║
-- ║    - All auth users (Supabase auth.users)                        ║
-- ║    - All agent chatbox exchanges                                 ║
-- ║    - All clio handoff greetings                                  ║
-- ║    - All clio ephemeral sessions                                 ║
-- ║    - All welfare notifications                                   ║
-- ║    - All link previews                                           ║
-- ║                                                                  ║
-- ║  What this KEEPS:                                                ║
-- ║    - dua_vault (verified duas — not user data)                   ║
-- ║    - All schema, tables, indexes, RLS policies                   ║
-- ║    - All migrations already applied                              ║
-- ║                                                                  ║
-- ║  Run in Supabase SQL Editor:                                     ║
-- ║  Dashboard → SQL Editor → New Query → Paste → Run               ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1. Clear dependent tables first (FK order)
TRUNCATE TABLE public.clio_handoff_greetings    CASCADE;
TRUNCATE TABLE public.welfare_notifications     CASCADE;
TRUNCATE TABLE public.clio_ephemeral_sessions   CASCADE;
TRUNCATE TABLE public.agent_chatbox_exchanges   CASCADE;
TRUNCATE TABLE public.link_previews             CASCADE;

-- 2. Clear posts (all member posts, Sage posts, seed posts)
TRUNCATE TABLE public.posts CASCADE;

-- 3. Clear profiles (member data)
TRUNCATE TABLE public.profiles CASCADE;

-- 4. Delete all auth users — this is the Supabase auth layer
--    TRUNCATE on auth.users is not allowed; we use DELETE instead.
--    This also fires the on_auth_user_created trigger cleanup.
DELETE FROM auth.users;

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- ── Verification ──────────────────────────────────────────────────────
-- After running, these should all return 0:
SELECT 'auth.users'              AS tbl, COUNT(*) FROM auth.users
UNION ALL
SELECT 'profiles'                AS tbl, COUNT(*) FROM public.profiles
UNION ALL
SELECT 'posts'                   AS tbl, COUNT(*) FROM public.posts
UNION ALL
SELECT 'agent_chatbox_exchanges' AS tbl, COUNT(*) FROM public.agent_chatbox_exchanges
UNION ALL
SELECT 'dua_vault (kept)'        AS tbl, COUNT(*) FROM public.dua_vault;
