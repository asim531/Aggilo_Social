-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  AGGILO PHASE 0 — MEMBER FEEDBACK TABLE                           ║
-- ║  Run this AFTER all prior migrations.                           ║
-- ║                                                                   ║
-- ║  Anonymous feedback from cluster members. No user_id — the        ║
-- ║  cluster membership gate is sufficient identity for Phase 0.      ║
-- ╚══════════════════════════════════════════════════════════════════╝

begin;

create table if not exists public.member_feedback (
  id uuid default gen_random_uuid() primary key,
  cluster_id text not null,
  category text not null check (category in ('bug', 'feature_request', 'general', 'content_issue')),
  message text not null,
  created_at timestamptz default now() not null
);

create index if not exists idx_member_feedback_cluster
  on public.member_feedback (cluster_id, created_at desc);

alter table public.member_feedback enable row level security;

-- Admins can read all feedback for their cluster.
drop policy if exists "Admins read member feedback" on public.member_feedback;
create policy "Admins read member feedback"
  on public.member_feedback for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'manager', 'founder')
    )
  );

-- Service-role inserts only (the API route uses service role).
-- No INSERT policy for authenticated users — feedback is anonymous.

commit;

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  MIGRATION COMPLETE                                              ║
-- ╚══════════════════════════════════════════════════════════════════╝
