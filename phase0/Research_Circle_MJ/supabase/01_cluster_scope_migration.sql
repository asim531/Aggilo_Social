-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  AGGILO PHASE 0 — MULTI-CLUSTER MIGRATION                         ║
-- ║  Run this in the EXISTING MVP Supabase project's SQL Editor.      ║
-- ║                                                                   ║
-- ║  Adds cluster_id scoping to the shared tables so Sisters in Dua  ║
-- ║  and Research Circle MJ can coexist in the same Supabase project. ║
-- ║  Existing rows default to 'the_single_source' (Sisters in Dua).  ║
-- ║                                                                   ║
-- ║  This migration is IDEMPOTENT — safe to run twice or to re-run    ║
-- ║  after a partial failure. Each statement guards against the       ║
-- ║  state already existing.                                          ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- Wrap in a transaction so a mid-migration failure rolls back cleanly.
begin;

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 1: profiles — add cluster_id + birth_year columns          │
-- │                                                                  │
-- │  Existing rows default to 'the_single_source' so the MVP keeps   │
-- │  working unchanged. cluster_id is NOT NULL — every profile must  │
-- │  belong to exactly one cluster.                                  │
-- └──────────────────────────────────────────────────────────────────┘

alter table public.profiles
  add column if not exists cluster_id text not null default 'the_single_source';

-- Research Circle MJ introduces a birth_year field for AGGIL fit.
-- Adding as nullable — Sisters in Dua doesn't use it, no backfill needed.
alter table public.profiles
  add column if not exists birth_year smallint;


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 2: Drop dependent foreign keys                             │
-- │                                                                  │
-- │  21 tables FK to profiles_pkey, which was just (id). We need to  │
-- │  change profiles_pkey to (id, cluster_id). PostgreSQL won't drop │
-- │  a unique index that has dependents, so we drop the FKs first.   │
-- │                                                                  │
-- │  After the new composite PK is in place, we re-add these FKs at  │
-- │  Step 5 — but pointing at `auth.users(id)` rather than           │
-- │  `profiles(id)`. The semantic is "this row belongs to this auth  │
-- │  user", which is true regardless of which cluster's profile they │
-- │  hold. auth.users.id is the right home for user identity.        │
-- │                                                                  │
-- │  All drops are guarded with IF EXISTS so the migration is        │
-- │  idempotent across partial failures.                             │
-- └──────────────────────────────────────────────────────────────────┘

alter table public.posts                  drop constraint if exists posts_author_id_fkey;
alter table public.welfare_notifications  drop constraint if exists welfare_notifications_user_id_fkey;
alter table public.welfare_notifications  drop constraint if exists welfare_notifications_resolved_by_fkey;
alter table public.clio_ephemeral_sessions drop constraint if exists clio_ephemeral_sessions_user_id_fkey;
alter table public.clio_handoff_greetings drop constraint if exists clio_handoff_greetings_user_id_fkey;
alter table public.llm_response_logs      drop constraint if exists llm_response_logs_user_id_fkey;
alter table public.agent_feedback         drop constraint if exists agent_feedback_user_id_fkey;
alter table public.behavioural_events     drop constraint if exists behavioural_events_user_id_fkey;
alter table public.character_concerns     drop constraint if exists character_concerns_user_id_fkey;
alter table public.character_concerns     drop constraint if exists character_concerns_admin_responded_by_fkey;
alter table public.vault_gap_requests     drop constraint if exists vault_gap_requests_resolved_by_fkey;
alter table public.vault_sources          drop constraint if exists vault_sources_added_by_fkey;
alter table public.cluster_features       drop constraint if exists cluster_features_admin_decision_by_fkey;
alter table public.cluster_feature_upvotes drop constraint if exists cluster_feature_upvotes_user_id_fkey;
alter table public.cluster_feature_comments drop constraint if exists cluster_feature_comments_user_id_fkey;
alter table public.agent_prompt_proposals drop constraint if exists agent_prompt_proposals_admin_decision_by_fkey;
alter table public.agent_chatbox_views    drop constraint if exists agent_chatbox_views_user_id_fkey;
alter table public.cluster_tool_invocations drop constraint if exists cluster_tool_invocations_user_id_fkey;
alter table public.cluster_config         drop constraint if exists cluster_config_updated_by_fkey;
alter table public.cluster_admin_actions  drop constraint if exists cluster_admin_actions_actor_id_fkey;
alter table public.waitlist_submissions   drop constraint if exists waitlist_submissions_admin_actioned_by_fkey;


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 3: Replace profiles primary key                            │
-- │                                                                  │
-- │  Old PK: (id) — one profile per user                             │
-- │  New PK: (id, cluster_id) — one profile per (user, cluster)      │
-- │                                                                  │
-- │  This lets one auth user hold separate profiles in Sisters in    │
-- │  Dua and Research Circle MJ — different nicknames, different      │
-- │  roles, different cluster identities for the same person.        │
-- └──────────────────────────────────────────────────────────────────┘

alter table public.profiles drop constraint if exists profiles_pkey;
alter table public.profiles drop constraint if exists profiles_id_fkey;

alter table public.profiles add constraint profiles_pkey primary key (id, cluster_id);

-- The auth.users FK on profiles.id is independent of the PK; re-add it.
alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users(id) on delete cascade;

-- Nickname uniqueness — within a cluster only. SiD and LC each get
-- their own "tas" namespace.
create unique index if not exists profiles_cluster_nickname_unique
  on public.profiles (cluster_id, lower(nickname));


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 4: Re-add the 21 FKs, re-pointed at auth.users             │
-- │                                                                  │
-- │  ON DELETE behaviour:                                            │
-- │    - User-owned data (posts, feedback, notifications, etc.):     │
-- │      ON DELETE CASCADE — when a user is fully removed, their     │
-- │      data goes with them.                                        │
-- │    - Admin/actor audit columns (resolved_by, admin_decision_by,  │
-- │      etc.): ON DELETE SET NULL — preserves the audit row even    │
-- │      if the admin's account is later deleted.                    │
-- └──────────────────────────────────────────────────────────────────┘

-- ── User-owned data (CASCADE) ──────────────────────────────────────
alter table public.posts
  add constraint posts_author_id_fkey
  foreign key (author_id) references auth.users(id) on delete cascade;

alter table public.welfare_notifications
  add constraint welfare_notifications_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.clio_ephemeral_sessions
  add constraint clio_ephemeral_sessions_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.clio_handoff_greetings
  add constraint clio_handoff_greetings_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.llm_response_logs
  add constraint llm_response_logs_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

alter table public.agent_feedback
  add constraint agent_feedback_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.behavioural_events
  add constraint behavioural_events_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.character_concerns
  add constraint character_concerns_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.cluster_feature_upvotes
  add constraint cluster_feature_upvotes_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.cluster_feature_comments
  add constraint cluster_feature_comments_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.agent_chatbox_views
  add constraint agent_chatbox_views_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.cluster_tool_invocations
  add constraint cluster_tool_invocations_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;


-- ── Admin/actor audit (SET NULL) ───────────────────────────────────
alter table public.welfare_notifications
  add constraint welfare_notifications_resolved_by_fkey
  foreign key (resolved_by) references auth.users(id) on delete set null;

alter table public.character_concerns
  add constraint character_concerns_admin_responded_by_fkey
  foreign key (admin_responded_by) references auth.users(id) on delete set null;

alter table public.vault_gap_requests
  add constraint vault_gap_requests_resolved_by_fkey
  foreign key (resolved_by) references auth.users(id) on delete set null;

alter table public.vault_sources
  add constraint vault_sources_added_by_fkey
  foreign key (added_by) references auth.users(id) on delete set null;

alter table public.cluster_features
  add constraint cluster_features_admin_decision_by_fkey
  foreign key (admin_decision_by) references auth.users(id) on delete set null;

alter table public.agent_prompt_proposals
  add constraint agent_prompt_proposals_admin_decision_by_fkey
  foreign key (admin_decision_by) references auth.users(id) on delete set null;

alter table public.cluster_config
  add constraint cluster_config_updated_by_fkey
  foreign key (updated_by) references auth.users(id) on delete set null;

alter table public.cluster_admin_actions
  add constraint cluster_admin_actions_actor_id_fkey
  foreign key (actor_id) references auth.users(id) on delete set null;

alter table public.waitlist_submissions
  add constraint waitlist_submissions_admin_actioned_by_fkey
  foreign key (admin_actioned_by) references auth.users(id) on delete set null;


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 5: posts — cluster_id scoping                              │
-- └──────────────────────────────────────────────────────────────────┘

alter table public.posts
  add column if not exists cluster_id text not null default 'the_single_source';

create index if not exists idx_posts_cluster_feed
  on public.posts(cluster_id, created_at asc)
  where parent_id is null;

create index if not exists idx_posts_cluster_state
  on public.posts(cluster_id, thread_state);


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 6: welfare_notifications — cluster_id scoping              │
-- │                                                                  │
-- │  The MVP schema may or may not have welfare_notifications        │
-- │  already. Add the table if missing, otherwise just ensure the    │
-- │  cluster_id column exists.                                       │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.welfare_notifications (
  id uuid default gen_random_uuid() primary key,
  cluster_id text not null default 'the_single_source',
  user_id uuid references auth.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  trigger_content text,
  source text not null default 'sage_post',
  sage_response text,
  resolved boolean default false not null,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz default now() not null
);

-- If the table already existed, ensure cluster_id column is there.
alter table public.welfare_notifications
  add column if not exists cluster_id text not null default 'the_single_source';

alter table public.welfare_notifications enable row level security;

drop policy if exists "Admins read welfare notifications" on public.welfare_notifications;
create policy "Admins read welfare notifications"
  on public.welfare_notifications for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'founder', 'manager')
    )
  );

create index if not exists idx_welfare_notifications_cluster_unresolved
  on public.welfare_notifications(cluster_id, resolved, created_at desc)
  where resolved = false;


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 7: clio_ephemeral_sessions — cluster_id scoping            │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.clio_ephemeral_sessions (
  session_id uuid default gen_random_uuid() primary key,
  cluster_id text not null default 'the_single_source',
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz default now() not null,
  expires_at timestamptz not null,
  message_count int default 0 not null,
  welfare_flagged boolean default false not null,
  welfare_escalated_at timestamptz,
  deleted_at timestamptz
);

alter table public.clio_ephemeral_sessions
  add column if not exists cluster_id text not null default 'the_single_source';

alter table public.clio_ephemeral_sessions enable row level security;

drop policy if exists "Users read own ephemeral sessions" on public.clio_ephemeral_sessions;
create policy "Users read own ephemeral sessions"
  on public.clio_ephemeral_sessions for select
  using (auth.uid() = user_id);

create or replace function public.increment_ephemeral_message_count(
  p_session_id uuid
) returns void as $$
begin
  update public.clio_ephemeral_sessions
  set message_count = message_count + 1
  where session_id = p_session_id;
end;
$$ language plpgsql security definer;


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 8: clio_tip_log — NEW table for Research Circle MJ          │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.clio_tip_log (
  id uuid default gen_random_uuid() primary key,
  cluster_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  trigger_type text not null,
  source_post_id uuid references public.posts(id) on delete set null,
  tip_content text not null,
  tip_delivered_at timestamptz default now() not null,
  member_acted boolean,
  suppression_reason text,
  created_at timestamptz default now() not null
);

create index if not exists idx_clio_tip_log_user_recent
  on public.clio_tip_log(cluster_id, user_id, tip_delivered_at desc);

create index if not exists idx_clio_tip_log_cluster_trigger_recent
  on public.clio_tip_log(cluster_id, trigger_type, tip_delivered_at desc);

create index if not exists idx_clio_tip_log_action_check
  on public.clio_tip_log(member_acted, tip_delivered_at)
  where member_acted is null;

alter table public.clio_tip_log enable row level security;

drop policy if exists "Platform admin reads tip log" on public.clio_tip_log;
create policy "Platform admin reads tip log"
  on public.clio_tip_log for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 9: profiles role constraint extension                      │
-- │                                                                  │
-- │  MVP defined role check as ('member', 'manager', 'founder'). LC  │
-- │  uses 'admin' as the simpler vocabulary. Allow both.             │
-- └──────────────────────────────────────────────────────────────────┘

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('member', 'manager', 'founder', 'admin'));


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 10: handle_new_user trigger — composite PK aware           │
-- │                                                                  │
-- │  The MVP trigger created a profile keyed by (id) only. With the  │
-- │  new composite PK, we INSERT (id, cluster_id, ...) and use ON    │
-- │  CONFLICT (id, cluster_id) DO NOTHING for idempotency.           │
-- │                                                                  │
-- │  The trigger only creates the Sisters in Dua profile. Research   │
-- │  Circle MJ profiles are created by the LC app's auth             │
-- │  callback — see phase0/Research_Circle_MJ/src/app/auth/callback/route.ts.        │
-- └──────────────────────────────────────────────────────────────────┘

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, cluster_id, nickname)
  values (
    new.id,
    'the_single_source',
    coalesce(split_part(new.email, '@', 1), 'Sister')
  )
  on conflict (id, cluster_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 11: Realtime publication                                   │
-- │                                                                  │
-- │  posts is already in supabase_realtime in the MVP. Confirm and   │
-- │  add if missing — no-op when already present.                    │
-- └──────────────────────────────────────────────────────────────────┘

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end $$;


commit;


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  Verification queries (run after migration)                      │
-- └──────────────────────────────────────────────────────────────────┘

-- Confirm composite PK exists:
-- select pg_get_constraintdef(oid) from pg_constraint where conname = 'profiles_pkey';
-- Expected: PRIMARY KEY (id, cluster_id)

-- Confirm the 21 FKs all reference auth.users now:
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where confrelid = 'auth.users'::regclass
-- order by conname;

-- Confirm cluster_id is populated on every profile and post:
-- select cluster_id, count(*) from public.profiles group by cluster_id;
-- select cluster_id, count(*) from public.posts group by cluster_id;

-- Confirm the new tables exist:
-- select count(*) from public.clio_tip_log;
-- select count(*) from public.welfare_notifications;
-- select count(*) from public.clio_ephemeral_sessions;

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  MIGRATION COMPLETE                                              ║
-- ║                                                                  ║
-- ║  - Sisters in Dua data is unchanged (cluster_id defaults to      ║
-- ║    'the_single_source').                                         ║
-- ║  - All 21 FKs now reference auth.users(id) instead of            ║
-- ║    profiles(id), so a user can hold multiple profiles (one per   ║
-- ║    cluster) without breaking referential integrity.              ║
-- ║  - Research Circle MJ can now write rows with                     ║
-- ║    cluster_id = 'long_conversation' without colliding with SiD.  ║
-- ║                                                                  ║
-- ║  Next step: run 02_founding_feedback_migration.sql.              ║
-- ╚══════════════════════════════════════════════════════════════════╝
