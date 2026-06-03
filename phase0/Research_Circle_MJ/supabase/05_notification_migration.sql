-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  AGGILO PHASE 0 — NOTIFICATION SYSTEM MIGRATION                   ║
-- ║  Run in the Supabase project SQL Editor.                          ║
-- ║                                                                   ║
-- ║  Adds:                                                            ║
-- ║    1. last_seen_at on profiles — stamped on every session start   ║
-- ║       so the cron knows who has drifted away.                     ║
-- ║    2. notif_email_enabled on profiles — opt-out flag.             ║
-- ║       Defaults true. Users who click "turn these off" flip it     ║
-- ║       to false via the notification-preferences API route.        ║
-- ║    3. notification_log — audit trail for every sent notification  ║
-- ║       and the rate-limit gate that prevents daily spam.           ║
-- ║                                                                   ║
-- ║  IDEMPOTENT — safe to re-run. All DDL guards with IF NOT EXISTS   ║
-- ║  or IF EXISTS so partial failures can be re-run cleanly.          ║
-- ╚══════════════════════════════════════════════════════════════════╝

begin;

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 1: profiles — notification tracking columns                │
-- │                                                                  │
-- │  last_seen_at: NULL on existing rows. The record-visit API       │
-- │  route stamps it on every authenticated cluster page-load.       │
-- │  The cron skips users where last_seen_at IS NULL (never visited) │
-- │  since they haven't been in the room yet.                        │
-- │                                                                  │
-- │  notif_email_enabled: true by default for everyone. Users        │
-- │  opt out by clicking "turn these off" in any email footer.       │
-- └──────────────────────────────────────────────────────────────────┘

alter table public.profiles
  add column if not exists last_seen_at timestamptz;

alter table public.profiles
  add column if not exists notif_email_enabled boolean not null default true;


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 2: notification_log — rate-limit gate + audit trail        │
-- │                                                                  │
-- │  One row per sent notification. The cron queries this table to   │
-- │  gate frequency: a user who already received a notification      │
-- │  within the last 3 days is skipped regardless of their           │
-- │  activity state.                                                 │
-- │                                                                  │
-- │  notification_type values:                                       │
-- │    'reengagement' — "you were away and things happened"          │
-- │    'reply'        — "someone replied to your post" (future)      │
-- │    'sage_post'    — standalone Sage activity alert (future)      │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.notification_log (
  id             uuid        primary key default gen_random_uuid(),
  cluster_id     text        not null,
  user_id        uuid        not null references auth.users(id) on delete cascade,
  notification_type text     not null
                               check (notification_type in ('reengagement', 'reply', 'sage_post')),
  sent_at        timestamptz not null default now(),
  post_snapshot  text,
  created_at     timestamptz not null default now()
);

-- Index the cron's most common query: "give me the latest notification
-- for each user in this cluster so I can enforce the cooldown."
create index if not exists notification_log_cluster_user_sent_idx
  on public.notification_log (cluster_id, user_id, sent_at desc);


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 3: RLS for notification_log                                │
-- │                                                                  │
-- │  Users can only SELECT their own rows. INSERTs come exclusively  │
-- │  from the server-side cron (service role) which bypasses RLS.    │
-- │  No UPDATE or DELETE paths are exposed at all.                   │
-- └──────────────────────────────────────────────────────────────────┘

alter table public.notification_log enable row level security;

drop policy if exists "notif_log_self_read" on public.notification_log;
create policy "notif_log_self_read"
  on public.notification_log
  for select
  using (auth.uid() = user_id);

commit;
