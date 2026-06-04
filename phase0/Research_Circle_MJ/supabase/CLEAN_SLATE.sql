-- CLEAN SLATE — Research Circle MJ
-- Run this in Supabase Dashboard → SQL Editor
-- WARNING: This deletes ALL user data AND all topics. Keeps only cluster structure.

-- 1. Delete all posts (this cascades to post_topics, post_attachments, paper_reading_status via FK constraints)
TRUNCATE TABLE posts CASCADE;

-- 2. Delete all profiles (user metadata)
TRUNCATE TABLE profiles CASCADE;

-- 3. Delete all auth users (this is in the auth schema)
-- Note: Run this carefully. It removes all registered accounts.
DELETE FROM auth.users WHERE raw_user_meta_data->>'cluster_id' = 'research-circle-mj';

-- 4. Delete all topics (discussion toolbar) — removes test residue
DELETE FROM topics WHERE cluster_id = 'research-circle-mj';

-- 5. Optional: Clear agent chat logs if they exist
-- DELETE FROM agent_chat_logs WHERE cluster_id = 'research-circle-mj';

-- 6. Optional: Clear feedback submissions
-- DELETE FROM feedback WHERE cluster_id = 'research-circle-mj';
