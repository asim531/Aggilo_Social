-- ═══════════════════════════════════════════════════════════════════════════
--  AGGILO — Delete User: world.asim+test2@gmail.com (Ace2)
--  Run this in the Supabase SQL Editor (https://supabase.com/dashboard)
--
--  STEP 1: Run the PREVIEW block below to confirm the user exists.
--  STEP 2: If the preview looks correct, scroll down and run the DELETE block.
--  WARNING: Deleting an auth.user cascades to ALL their data across ALL clusters.
-- ═══════════════════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  STEP 1 — PREVIEW (safe, read-only)                                      │
-- │  Run this section first. Do NOT uncomment the DELETE section yet.        │
-- └─────────────────────────────────────────────────────────────────────────┘

-- 1a. Find the auth user by email
SELECT
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  u.email_confirmed_at
FROM auth.users u
WHERE lower(u.email) = 'world.asim+test2@gmail.com';

-- 1b. Find their Research Circle MJ profile
SELECT
  p.id,
  p.cluster_id,
  p.nickname,
  p.role,
  p.is_founding_member,
  p.birth_year,
  p.created_at
FROM public.profiles p
WHERE p.id = (
  SELECT id FROM auth.users WHERE lower(email) = 'world.asim+test2@gmail.com'
)
AND p.cluster_id = 'long_conversation';

-- 1c. Count linked data that will be CASCADE-deleted across ALL clusters
SELECT 'posts'                    AS table_name, COUNT(*) AS row_count FROM public.posts                  WHERE author_id = (SELECT id FROM auth.users WHERE lower(email) = 'world.asim+test2@gmail.com') UNION ALL
SELECT 'welfare_notifications'    AS table_name, COUNT(*) AS row_count FROM public.welfare_notifications  WHERE user_id   = (SELECT id FROM auth.users WHERE lower(email) = 'world.asim+test2@gmail.com') UNION ALL
SELECT 'clio_ephemeral_sessions'  AS table_name, COUNT(*) AS row_count FROM public.clio_ephemeral_sessions WHERE user_id   = (SELECT id FROM auth.users WHERE lower(email) = 'world.asim+test2@gmail.com') UNION ALL
SELECT 'clio_handoff_greetings'   AS table_name, COUNT(*) AS row_count FROM public.clio_handoff_greetings  WHERE user_id   = (SELECT id FROM auth.users WHERE lower(email) = 'world.asim+test2@gmail.com') UNION ALL
SELECT 'llm_response_logs'        AS table_name, COUNT(*) AS row_count FROM public.llm_response_logs       WHERE user_id   = (SELECT id FROM auth.users WHERE lower(email) = 'world.asim+test2@gmail.com') UNION ALL
SELECT 'agent_feedback'           AS table_name, COUNT(*) AS row_count FROM public.agent_feedback          WHERE user_id   = (SELECT id FROM auth.users WHERE lower(email) = 'world.asim+test2@gmail.com') UNION ALL
SELECT 'behavioural_events'       AS table_name, COUNT(*) AS row_count FROM public.behavioural_events      WHERE user_id   = (SELECT id FROM auth.users WHERE lower(email) = 'world.asim+test2@gmail.com') UNION ALL
SELECT 'character_concerns'       AS table_name, COUNT(*) AS row_count FROM public.character_concerns      WHERE user_id   = (SELECT id FROM auth.users WHERE lower(email) = 'world.asim+test2@gmail.com') UNION ALL
SELECT 'cluster_feature_upvotes'  AS table_name, COUNT(*) AS row_count FROM public.cluster_feature_upvotes WHERE user_id   = (SELECT id FROM auth.users WHERE lower(email) = 'world.asim+test2@gmail.com') UNION ALL
SELECT 'cluster_feature_comments' AS table_name, COUNT(*) AS row_count FROM public.cluster_feature_comments WHERE user_id   = (SELECT id FROM auth.users WHERE lower(email) = 'world.asim+test2@gmail.com') UNION ALL
SELECT 'agent_chatbox_views'      AS table_name, COUNT(*) AS row_count FROM public.agent_chatbox_views     WHERE user_id   = (SELECT id FROM auth.users WHERE lower(email) = 'world.asim+test2@gmail.com') UNION ALL
SELECT 'cluster_tool_invocations' AS table_name, COUNT(*) AS row_count FROM public.cluster_tool_invocations WHERE user_id   = (SELECT id FROM auth.users WHERE lower(email) = 'world.asim+test2@gmail.com');


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  STEP 2 — DELETE (only after confirming the preview above)               │
-- │  Uncomment the block below and run it.                                   │
-- │  This deletes the auth user; PostgreSQL CASCADE handles the rest.      │
-- └─────────────────────────────────────────────────────────────────────────┘

/*
DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Resolve user ID
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE lower(email) = 'world.asim+test2@gmail.com';

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User not found. Nothing deleted.';
    RETURN;
  END IF;

  RAISE NOTICE 'Deleting auth user % ...', target_user_id;

  -- Delete the auth user. All FKs with ON DELETE CASCADE / SET NULL fire automatically:
  --   auth.users      → CASCADE to public.profiles (all clusters)
  --   public.posts    → CASCADE on author_id
  --   public.welfare_notifications → CASCADE on user_id, SET NULL on resolved_by
  --   public.clio_ephemeral_sessions → CASCADE
  --   public.clio_handoff_greetings  → CASCADE
  --   public.llm_response_logs       → SET NULL
  --   public.agent_feedback          → CASCADE
  --   public.behavioural_events      → CASCADE
  --   public.character_concerns      → CASCADE
  --   public.cluster_feature_upvotes  → CASCADE
  --   public.cluster_feature_comments → CASCADE
  --   public.agent_chatbox_views      → CASCADE
  --   public.cluster_tool_invocations → CASCADE
  DELETE FROM auth.users WHERE id = target_user_id;

  RAISE NOTICE 'Done. User % and all linked data deleted.', target_user_id;
END $$;
*/
