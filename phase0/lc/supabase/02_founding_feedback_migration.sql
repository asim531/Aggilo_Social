-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  AGGILO PHASE 0 — FOUNDING MEMBER FEEDBACK MIGRATION              ║
-- ║  Run this AFTER 01_cluster_scope_migration.sql                    ║
-- ║                                                                   ║
-- ║  Adds the database surface for the founding-member feedback       ║
-- ║  prompt described in:                                             ║
-- ║    phase0/docs/AMA_CLUSTER_CREATION_AND_FOUNDING_FEEDBACK.md      ║
-- ║    Part 1 — "Founding Member Feedback"                            ║
-- ║                                                                   ║
-- ║  Mechanism:                                                       ║
-- ║    1. profiles.is_founding_member flags the founder of a cluster  ║
-- ║       (set manually for Phase 0; future intake pipeline sets this ║
-- ║       automatically when the invite link is consumed).            ║
-- ║    2. profiles.founding_feedback_at stamps when the prompt was    ║
-- ║       shown / closed. NULL = not yet shown.                       ║
-- ║    3. founding_feedback_log records each interaction (one row per ║
-- ║       founding member per cluster).                               ║
-- ║                                                                   ║
-- ║  This migration is IDEMPOTENT — safe to run twice.                ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 1: profiles — add founding-member columns                  │
-- └──────────────────────────────────────────────────────────────────┘

alter table public.profiles
  add column if not exists is_founding_member boolean default false not null;

alter table public.profiles
  add column if not exists founding_feedback_at timestamptz;

-- 'accepted' | 'changes_applied' | 'changes_queued' | 'silent_close'
alter table public.profiles
  add column if not exists founding_feedback_close_reason text;

comment on column public.profiles.is_founding_member is
  'True for the member whose request produced this cluster (Source A '
  'in the intake taxonomy). For Source B/C/D clusters, no member '
  'carries this flag. Set during invite-link redemption (Phase 1) or '
  'manually by admin (Phase 0).';

comment on column public.profiles.founding_feedback_at is
  'When the founding-member feedback prompt was closed (either by '
  'response or by silent_close after 24h). NULL = not yet shown. '
  'Once stamped, the prompt never fires again for this member.';


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 2: founding_feedback_log — interaction record              │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.founding_feedback_log (
  id uuid primary key default gen_random_uuid(),

  cluster_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,

  -- The verbatim text the founding member said when the prompt fired.
  -- May be NULL on silent_close (member never engaged).
  feedback_text text,

  -- Structured record of changes Clio applied autonomously (Tier 1
  -- stewardship). Shape: { fields: ["description", "seed_questions"],
  --                        old: {...}, new: {...} }
  applied_changes jsonb,

  -- Structured record of changes that need admin review (anything
  -- structural — AGGIL changes, cluster type, etc.). Shape:
  --   { fields: [...], member_quote: "..." }
  queued_for_admin jsonb,

  -- 'accepted' | 'changes_applied' | 'changes_queued' | 'silent_close'
  close_reason text not null,

  created_at timestamptz default now() not null
);

create index if not exists idx_founding_feedback_log_cluster
  on public.founding_feedback_log(cluster_id, created_at desc);

create index if not exists idx_founding_feedback_log_user
  on public.founding_feedback_log(user_id);

alter table public.founding_feedback_log enable row level security;

-- Founders can read their own log entry. Admins can read everything.
drop policy if exists "Founding members read own feedback log"
  on public.founding_feedback_log;
create policy "Founding members read own feedback log"
  on public.founding_feedback_log for select
  using (auth.uid() = user_id);

drop policy if exists "Admins read all feedback log"
  on public.founding_feedback_log;
create policy "Admins read all feedback log"
  on public.founding_feedback_log for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'founder', 'manager')
    )
  );

-- Service role inserts (the API route writes on close). No INSERT
-- policy needed — RLS doesn't restrict service-role writes.


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 3: Long Conversation founding-member designation           │
-- │                                                                  │
-- │  Tas (tasneem.bano@gmail.com) is the founding member of Long     │
-- │  Conversation. She submitted the waitlist request that produced  │
-- │  this cluster. When she signs in, her LC profile gets the flag.  │
-- │                                                                  │
-- │  This UPDATE is conditional — if her profile doesn't exist yet   │
-- │  (she hasn't signed in), the UPDATE affects 0 rows and we rely   │
-- │  on the auth callback to flag her on first sign-in (see          │
-- │  phase0/lc/src/app/auth/callback/route.ts FOUNDING_EMAIL check). │
-- └──────────────────────────────────────────────────────────────────┘

update public.profiles p
set is_founding_member = true
from auth.users u
where p.id = u.id
  and p.cluster_id = 'long_conversation'
  and lower(u.email) = 'tasneem.bano@gmail.com'
  and p.is_founding_member = false;


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 4: Verification queries (run after migration)              │
-- └──────────────────────────────────────────────────────────────────┘

-- Check the new columns exist:
-- select column_name, data_type
-- from information_schema.columns
-- where table_schema = 'public' and table_name = 'profiles'
--   and column_name in ('is_founding_member', 'founding_feedback_at',
--                      'founding_feedback_close_reason');

-- Check the log table exists:
-- select count(*) from public.founding_feedback_log;

-- Check Tas is flagged (if she has signed in):
-- select p.cluster_id, p.nickname, p.is_founding_member
-- from public.profiles p
-- join auth.users u on u.id = p.id
-- where lower(u.email) = 'tasneem.bano@gmail.com';

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  MIGRATION COMPLETE                                              ║
-- ║  Founding feedback infrastructure is in place. The API route at  ║
-- ║  /api/clio/founding-feedback uses these tables.                  ║
-- ╚══════════════════════════════════════════════════════════════════╝
