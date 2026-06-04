-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  AGGILO MVP — Clio Tip Layer                                      ║
-- ║                                                                   ║
-- ║  The clio_tip_log table was created in 01_cluster_scope_migration ║
-- ║  with admin-only SELECT. This migration adds user-facing RLS so   ║
-- ║  the ClioTipLayer component can read and dismiss its own tips,    ║
-- ║  and adds the table to the realtime publication so the INSERT     ║
-- ║  subscription in the component works.                            ║
-- ║                                                                   ║
-- ║  Idempotent — safe to re-run.                                     ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- Ensure the table exists (in case this runs before the cluster-scope migration).
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

create index if not exists idx_clio_tip_log_action_check
  on public.clio_tip_log(member_acted, tip_delivered_at)
  where member_acted is null;

alter table public.clio_tip_log enable row level security;

-- Allow users to read their own tips.
drop policy if exists "Users read own tips" on public.clio_tip_log;
create policy "Users read own tips"
  on public.clio_tip_log for select
  using (auth.uid() = user_id);

-- Allow users to dismiss (update member_acted on) their own tips.
drop policy if exists "Users update own tips" on public.clio_tip_log;
create policy "Users update own tips"
  on public.clio_tip_log for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow the service role (used by API routes) to insert tips.
drop policy if exists "Service role inserts tips" on public.clio_tip_log;
create policy "Service role inserts tips"
  on public.clio_tip_log for insert
  with check (true);

-- Add to realtime publication so the INSERT subscription in ClioTipLayer fires.
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'clio_tip_log'
  ) then
    alter publication supabase_realtime add table public.clio_tip_log;
  end if;
end $$;
