-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  AGGILO PHASE 0 — CLEAR LONG CONVERSATION CLUSTER                    ║
-- ║  DANGER: DESTRUCTIVE — RUN MANUALLY IN SUPABASE SQL EDITOR          ║
-- ║                                                                   ║
-- ║  Clears ALL data for the long_conversation cluster:                ║
-- ║    - Posts, profiles, tip logs, welfare notifications,             ║
-- ║      ephemeral sessions, founding feedback logs                     ║
-- ║    - Deletes auth.users for LC accounts (including admins)          ║
-- ║    - PRESERVES cluster_config and cluster_features                  ║
-- ║                                                                   ║
-- ║  Does NOT touch the_single_source (Sisters in Dua) cluster.        ║
-- ╚══════════════════════════════════════════════════════════════════╝

begin;

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 1: Delete child data (respect FK cascade order)            │
-- └──────────────────────────────────────────────────────────────────┘

-- Posts (cascade will handle replies via parent_id FK if any)
delete from public.posts
where cluster_id = 'long_conversation';

-- Clio tip logs
delete from public.clio_tip_log
where cluster_id = 'long_conversation';

-- Welfare notifications
delete from public.welfare_notifications
where cluster_id = 'long_conversation';

-- Clio ephemeral sessions
delete from public.clio_ephemeral_sessions
where cluster_id = 'long_conversation';

-- Founding feedback logs
delete from public.founding_feedback_log
where cluster_id = 'long_conversation';

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 2: Delete LC profiles                                      │
-- └──────────────────────────────────────────────────────────────────┘

-- Capture the auth.user IDs before deleting profiles
-- (we need these to delete from auth.users)
with lc_profile_ids as (
  select id
  from public.profiles
  where cluster_id = 'long_conversation'
)
delete from public.profiles
where cluster_id = 'long_conversation';

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 3: Delete auth.users for LC accounts                        │
-- └──────────────────────────────────────────────────────────────────┘

-- This deletes the actual auth accounts. 
-- Note: auth.users is in the auth schema, not public.
delete from auth.users
where id in (
  select id
  from public.profiles
  where cluster_id = 'long_conversation'
);

-- The above will return 0 rows because we already deleted profiles.
-- We need to capture the IDs BEFORE profile deletion.
-- Let me rewrite with proper ordering:

rollback; -- Rollback the incomplete transaction

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  CORRECTED VERSION — captures auth IDs before deletion           ║
-- ╚══════════════════════════════════════════════════════════════════╝

begin;

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 1: Capture LC auth.user IDs before any deletion            │
-- └──────────────────────────────────────────────────────────────────┘

-- Create a temp table to hold the IDs we need to delete from auth.users
create temp table lc_auth_ids (id uuid primary key);

insert into lc_auth_ids (id)
select id
from public.profiles
where cluster_id = 'long_conversation';

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 2: Delete child data (respect FK cascade order)            │
-- └──────────────────────────────────────────────────────────────────┘

-- Posts
delete from public.posts
where cluster_id = 'long_conversation';

-- Clio tip logs
delete from public.clio_tip_log
where cluster_id = 'long_conversation';

-- Welfare notifications
delete from public.welfare_notifications
where cluster_id = 'long_conversation';

-- Clio ephemeral sessions
delete from public.clio_ephemeral_sessions
where cluster_id = 'long_conversation';

-- Founding feedback logs
delete from public.founding_feedback_log
where cluster_id = 'long_conversation';

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 3: Delete LC profiles                                      │
-- └──────────────────────────────────────────────────────────────────┘

delete from public.profiles
where cluster_id = 'long_conversation';

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 4: Delete auth.users for LC accounts                        │
-- └──────────────────────────────────────────────────────────────────┘

delete from auth.users
where id in (select id from lc_auth_ids);

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 5: Cleanup temp table                                      │
-- └──────────────────────────────────────────────────────────────────┘

drop table lc_auth_ids;

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 6: Verification (run after commit)                          │
-- └──────────────────────────────────────────────────────────────────┘

-- Confirm no LC data remains:
-- select 'posts' as table_name, count(*) from public.posts where cluster_id = 'long_conversation'
-- union all
-- select 'profiles', count(*) from public.profiles where cluster_id = 'long_conversation'
-- union all
-- select 'clio_tip_log', count(*) from public.clio_tip_log where cluster_id = 'long_conversation'
-- union all
-- select 'welfare_notifications', count(*) from public.welfare_notifications where cluster_id = 'long_conversation'
-- union all
-- select 'clio_ephemeral_sessions', count(*) from public.clio_ephemeral_sessions where cluster_id = 'long_conversation'
-- union all
-- select 'founding_feedback_log', count(*) from public.founding_feedback_log where cluster_id = 'long_conversation';
-- Expected: all 0

-- Confirm cluster_config and cluster_features are preserved:
-- select count(*) from public.cluster_config where cluster_id = 'long_conversation';
-- select count(*) from public.cluster_features where cluster_id = 'long_conversation';

commit;

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  CLEAR COMPLETE                                                  ║
-- ║  - All LC cluster data deleted                                   ║
-- ║  - All LC auth accounts deleted                                   ║
-- ║  - cluster_config and cluster_features preserved                 ║
-- ║  - the_single_source (Sisters in Dua) untouched                 ║
-- ╚══════════════════════════════════════════════════════════════════╝
