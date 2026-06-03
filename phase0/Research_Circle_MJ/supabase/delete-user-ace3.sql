-- ═══════════════════════════════════════════════════════════════════════════
--  AGGILO — Delete User: nickname = "Ace3" (Research Circle MJ)
--  Run this in the Supabase SQL Editor (https://supabase.com/dashboard)
--
--  STEP 1: Run the PREVIEW block to confirm the user.
--  STEP 2: If the preview looks correct, uncomment and run the DELETE block.
--  WARNING: Deleting an auth.user cascades to ALL their data across ALL clusters.
-- ═══════════════════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  STEP 1 — PREVIEW (safe, read-only)                                    │
-- └─────────────────────────────────────────────────────────────────────────┘

-- 1a. Find the auth user by LC profile nickname
SELECT
  u.id,
  u.email,
  p.nickname,
  p.cluster_id,
  p.role,
  p.created_at
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE p.cluster_id = 'long_conversation'
  AND lower(p.nickname) = 'ace3';

-- 1b. Count linked data that will be CASCADE-deleted across ALL clusters
SELECT 'posts'                    AS table_name, COUNT(*) AS row_count FROM public.posts                  WHERE author_id = (SELECT u.id FROM auth.users u JOIN public.profiles p ON u.id = p.id WHERE p.cluster_id = 'long_conversation' AND lower(p.nickname) = 'ace3') UNION ALL
SELECT 'welfare_notifications'    AS table_name, COUNT(*) AS row_count FROM public.welfare_notifications  WHERE user_id   = (SELECT u.id FROM auth.users u JOIN public.profiles p ON u.id = p.id WHERE p.cluster_id = 'long_conversation' AND lower(p.nickname) = 'ace3') UNION ALL
SELECT 'clio_ephemeral_sessions'  AS table_name, COUNT(*) AS row_count FROM public.clio_ephemeral_sessions WHERE user_id   = (SELECT u.id FROM auth.users u JOIN public.profiles p ON u.id = p.id WHERE p.cluster_id = 'long_conversation' AND lower(p.nickname) = 'ace3') UNION ALL
SELECT 'clio_handoff_greetings'   AS table_name, COUNT(*) AS row_count FROM public.clio_handoff_greetings  WHERE user_id   = (SELECT u.id FROM auth.users u JOIN public.profiles p ON u.id = p.id WHERE p.cluster_id = 'long_conversation' AND lower(p.nickname) = 'ace3') UNION ALL
SELECT 'llm_response_logs'        AS table_name, COUNT(*) AS row_count FROM public.llm_response_logs       WHERE user_id   = (SELECT u.id FROM auth.users u JOIN public.profiles p ON u.id = p.id WHERE p.cluster_id = 'long_conversation' AND lower(p.nickname) = 'ace3') UNION ALL
SELECT 'agent_feedback'           AS table_name, COUNT(*) AS row_count FROM public.agent_feedback          WHERE user_id   = (SELECT u.id FROM auth.users u JOIN public.profiles p ON u.id = p.id WHERE p.cluster_id = 'long_conversation' AND lower(p.nickname) = 'ace3') UNION ALL
SELECT 'behavioural_events'       AS table_name, COUNT(*) AS row_count FROM public.behavioural_events      WHERE user_id   = (SELECT u.id FROM auth.users u JOIN public.profiles p ON u.id = p.id WHERE p.cluster_id = 'long_conversation' AND lower(p.nickname) = 'ace3') UNION ALL
SELECT 'character_concerns'       AS table_name, COUNT(*) AS row_count FROM public.character_concerns      WHERE user_id   = (SELECT u.id FROM auth.users u JOIN public.profiles p ON u.id = p.id WHERE p.cluster_id = 'long_conversation' AND lower(p.nickname) = 'ace3') UNION ALL
SELECT 'cluster_feature_upvotes'  AS table_name, COUNT(*) AS row_count FROM public.cluster_feature_upvotes WHERE user_id   = (SELECT u.id FROM auth.users u JOIN public.profiles p ON u.id = p.id WHERE p.cluster_id = 'long_conversation' AND lower(p.nickname) = 'ace3') UNION ALL
SELECT 'cluster_feature_comments' AS table_name, COUNT(*) AS row_count FROM public.cluster_feature_comments WHERE user_id   = (SELECT u.id FROM auth.users u JOIN public.profiles p ON u.id = p.id WHERE p.cluster_id = 'long_conversation' AND lower(p.nickname) = 'ace3') UNION ALL
SELECT 'agent_chatbox_views'      AS table_name, COUNT(*) AS row_count FROM public.agent_chatbox_views     WHERE user_id   = (SELECT u.id FROM auth.users u JOIN public.profiles p ON u.id = p.id WHERE p.cluster_id = 'long_conversation' AND lower(p.nickname) = 'ace3') UNION ALL
SELECT 'cluster_tool_invocations' AS table_name, COUNT(*) AS row_count FROM public.cluster_tool_invocations WHERE user_id   = (SELECT u.id FROM auth.users u JOIN public.profiles p ON u.id = p.id WHERE p.cluster_id = 'long_conversation' AND lower(p.nickname) = 'ace3');


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
  SELECT u.id INTO target_user_id
  FROM auth.users u
  JOIN public.profiles p ON u.id = p.id
  WHERE p.cluster_id = 'long_conversation'
    AND lower(p.nickname) = 'ace3';

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User "Ace3" not found. Nothing deleted.';
    RETURN;
  END IF;

  RAISE NOTICE 'Deleting auth user % (Ace3)...', target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
  RAISE NOTICE 'Done. Ace3 deleted and all linked data cascaded.';
END $$;
*/
