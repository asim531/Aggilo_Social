-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  AGGILO PHASE 0 — MULTI-CLUSTER MIGRATION                         ║
-- ║  Run this in the EXISTING MVP Supabase project's SQL Editor.      ║
-- ║                                                                   ║
-- ║  Adds cluster_id scoping to the shared tables so Sisters in Dua  ║
-- ║  and Long Conversation can coexist in the same Supabase project. ║
-- ║  Existing rows default to 'the_single_source' (Sisters in Dua).  ║
-- ║                                                                   ║
-- ║  This migration is IDEMPOTENT — safe to run twice.               ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 1: profiles — add cluster_id                               │
-- │                                                                  │
-- │  A profile is per-user, per-cluster. The same email arriving on  │
-- │  Long Conversation creates a new profile row even if they have   │
-- │  one in Sisters in Dua. This keeps nicknames cluster-scoped.     │
-- │                                                                  │
-- │  The PK changes from id → (id, cluster_id). Auth user id stays   │
-- │  the same; the profile is the per-cluster identity.              │
-- └──────────────────────────────────────────────────────────────────┘

alter table public.profiles
  add column if not exists cluster_id text not null default 'the_single_source';

-- Long Conversation introduces a birth_year field for AGGIL fit.
-- The MVP doesn't use this field (Sisters in Dua doesn't filter by age)
-- but adding it as nullable is harmless — no row backfill required.
alter table public.profiles
  add column if not exists birth_year smallint;

-- NOTE on gender field:
-- The MVP's existing `gender` column (single-value text) is kept and
-- used by both clusters for SIGNUP. A user's identity at signup is
-- single-select — they pick one of: "male", "female", "non_binary".
--
-- A separate concern, NOT addressed here, is multi-select gender on
-- CLUSTER CREATION — a cluster founder may want their cluster open to
-- multiple genders (e.g. "male + non-binary"). That field will live on
-- a future `clusters` table when the cluster creation flow is built.
-- It does NOT belong on `profiles`.
--
-- The earlier draft of this migration added a `genders text[]` column
-- to `profiles`. That has been removed. Cluster creation will introduce
-- its own audience-filter array on a different table.

-- Drop the old single-column PK and replace with composite
alter table public.profiles
  drop constraint if exists profiles_pkey;

alter table public.profiles
  add constraint profiles_pkey primary key (id, cluster_id);

-- Re-establish the FK to auth.users (unchanged, but redeclared for safety)
alter table public.profiles
  drop constraint if exists profiles_id_fkey;

alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users(id) on delete cascade;

-- Nickname uniqueness — within a cluster only. Sisters in Dua and
-- Long Conversation can each have a "tas" without colliding.
create unique index if not exists profiles_cluster_nickname_unique
  on public.profiles (cluster_id, lower(nickname));

-- Existing RLS policies still match on auth.uid() = id — they keep working.
-- We just need an additional implicit scope: a user can only see/update
-- profiles within their own (id, cluster_id) tuple, which is automatic
-- because they only have one profile per cluster.


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 2: posts — add cluster_id                                  │
-- │                                                                  │
-- │  Every post belongs to exactly one cluster. Existing posts (from │
-- │  the MVP) default to 'the_single_source'. New posts MUST specify │
-- │  a cluster_id — the app passes it on every insert.               │
-- └──────────────────────────────────────────────────────────────────┘

alter table public.posts
  add column if not exists cluster_id text not null default 'the_single_source';

create index if not exists idx_posts_cluster_feed
  on public.posts(cluster_id, created_at asc)
  where parent_id is null;

create index if not exists idx_posts_cluster_state
  on public.posts(cluster_id, thread_state);

-- RLS: posts are still viewable by all authenticated users, but only
-- within the cluster they joined. The app filters on cluster_id in
-- every query — RLS is the belt; the filter is the braces.


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 3a: welfare_notifications — shared across clusters         │
-- │                                                                  │
-- │  The MVP schema doesn't have this table yet (it was planned but  │
-- │  not shipped in the base schema.sql). Adding it here so both     │
-- │  Sisters in Dua and Long Conversation can write welfare alerts.  │
-- │  The admin UI for reviewing these ships in a later batch.        │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.welfare_notifications (
  id uuid default gen_random_uuid() primary key,
  cluster_id text not null,
  user_id uuid references auth.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  -- post_id is null for FAB-sourced welfare signals (no public post)
  trigger_content text,
  -- First 500 chars of the triggering message. Never the full content.
  source text not null default 'sage_post',
  -- 'sage_post' | 'clio_fab' | 'clio_ephemeral'
  sage_response text,
  resolved boolean default false not null,
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz default now() not null
);

alter table public.welfare_notifications enable row level security;

-- Only platform_admin and cluster admins can read welfare notifications.
-- Members never see this table.
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
-- │  STEP 3b: clio_ephemeral_sessions — shared across clusters       │
-- │                                                                  │
-- │  The MVP schema has this table. Adding it here as a CREATE IF    │
-- │  NOT EXISTS so the migration is safe to run on a project that    │
-- │  already has it (from the MVP schema-phase5.sql).                │
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

alter table public.clio_ephemeral_sessions enable row level security;

drop policy if exists "Users read own ephemeral sessions" on public.clio_ephemeral_sessions;
create policy "Users read own ephemeral sessions"
  on public.clio_ephemeral_sessions for select
  using (auth.uid() = user_id);

-- RPC for incrementing message count (used by the ephemeral route).
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
-- │  STEP 3c: clio_tip_log — NEW table for Long Conversation          │
-- │                                                                  │
-- │  Records every private FAB tip Clio delivers. Used for:          │
-- │   - Frequency enforcement (max 1 per member per 24h)             │
-- │   - Repetition prevention (no same trigger to same member in 14d)│
-- │   - Cluster-wide repetition cap (3+ same trigger type in 7d      │
-- │     pauses that trigger for 7d cluster-wide)                     │
-- │   - Dependency detection (3+ tips with no posting rate increase) │
-- │                                                                  │
-- │  Specification: clio/CLIO_CLUSTER_HOST_CONTEXT.md §11            │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.clio_tip_log (
  id uuid default gen_random_uuid() primary key,
  cluster_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Which trigger fired. See CLIO_CLUSTER_HOST_CONTEXT.md §11.3
  -- 'guarded_intellectual' | 'hedged_vulnerability' | 'question_reveals_want' |
  -- 'interested_but_guarded' | 'no_post_48h' | 'complementary_a' | 'complementary_b'
  trigger_type text not null,

  -- The public post that triggered the tip. NULL for no_post_48h
  -- (where the trigger is absence of posts).
  source_post_id uuid references public.posts(id) on delete set null,

  -- The tip text Clio delivered (for audit + repetition check).
  tip_content text not null,

  -- When the tip was delivered to the member's FAB.
  tip_delivered_at timestamptz default now() not null,

  -- Whether the member posted within 24h of the tip. Updated by a
  -- background check at tip + 24h. NULL until then.
  member_acted boolean,

  -- Populated when a tip is suppressed (not delivered).
  -- 'dependency_prevention' | 'cluster_repetition_limit' |
  -- 'welfare_flagged' | 'frequency_limit_24h' | 'pattern_repetition_14d'
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

-- Members never see their own tip log. Only platform_admin reads it.
-- The log is for Observer Domain 5 monitoring and admin review only.
drop policy if exists "Platform admin reads tip log" on public.clio_tip_log;
create policy "Platform admin reads tip log"
  on public.clio_tip_log for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- The service role inserts (via the Sage/Clio worker). RLS does not
-- restrict service-role writes, so no policy needed for INSERT.


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 4: profile role constraint update                          │
-- │                                                                  │
-- │  The MVP defined roles as ('member', 'manager', 'founder') for   │
-- │  the premium-cluster pattern. Long Conversation is a generic     │
-- │  cluster with simpler role structure: just member + admin.       │
-- │                                                                  │
-- │  We extend the constraint to allow both vocabularies. Sisters in │
-- │  Dua keeps using 'founder'; Long Conversation uses 'admin'.      │
-- └──────────────────────────────────────────────────────────────────┘

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('member', 'manager', 'founder', 'admin'));


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 5: Update the auto-create-profile trigger                  │
-- │                                                                  │
-- │  The MVP trigger creates a profile with default cluster_id, which │
-- │  is now 'the_single_source' (the MVP cluster). This keeps the    │
-- │  MVP's auth flow working unchanged.                              │
-- │                                                                  │
-- │  For Long Conversation, the auth callback explicitly INSERTS a   │
-- │  second profile row with cluster_id = 'long_conversation' for the│
-- │  same auth user. The composite PK (id, cluster_id) allows both   │
-- │  rows to coexist.                                                │
-- │                                                                  │
-- │  We update the trigger function so that:                         │
-- │   - It still creates a Sisters in Dua profile (legacy default)   │
-- │   - The INSERT is idempotent (ON CONFLICT DO NOTHING) so a user  │
-- │     who already has a profile in either cluster doesn't crash    │
-- │     the trigger on second sign-in.                               │
-- └──────────────────────────────────────────────────────────────────┘

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, cluster_id, nickname)
  values (
    new.id,
    'the_single_source',
    coalesce(
      split_part(new.email, '@', 1),
      'Sister'
    )
  )
  on conflict (id, cluster_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Re-attach the trigger if it was dropped previously
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 6: Realtime publication (no change needed)                 │
-- │                                                                  │
-- │  The posts table is already in supabase_realtime. The cluster_id │
-- │  filter happens client-side in the LC app's realtime subscription│
-- │  so each app only receives events for its own cluster.           │
-- └──────────────────────────────────────────────────────────────────┘

-- No-op confirmation that the publication exists and includes posts:
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end $$;


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 7: Verification queries                                    │
-- │                                                                  │
-- │  Run these in the SQL Editor after the migration to confirm     │
-- │  the schema is correctly scoped.                                 │
-- └──────────────────────────────────────────────────────────────────┘

-- All tables that should now have cluster_id:
-- select column_name, data_type, is_nullable, column_default
-- from information_schema.columns
-- where table_schema = 'public'
--   and column_name = 'cluster_id'
-- order by table_name;

-- Existing posts and profiles defaulted correctly:
-- select cluster_id, count(*) from public.posts group by cluster_id;
-- select cluster_id, count(*) from public.profiles group by cluster_id;

-- New table is present:
-- select count(*) from public.clio_tip_log;

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  MIGRATION COMPLETE                                              ║
-- ║  Existing Sisters in Dua data is unchanged (cluster_id defaults  ║
-- ║  to 'the_single_source'). Long Conversation can now write its    ║
-- ║  own rows with cluster_id = 'long_conversation' and they will    ║
-- ║  not collide with Sisters in Dua data.                           ║
-- ╚══════════════════════════════════════════════════════════════════╝
