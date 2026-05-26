-- Allow users to read their own tips
drop policy if exists "Users read own tips" on public.clio_tip_log;
create policy "Users read own tips"
  on public.clio_tip_log for select
  using (auth.uid() = user_id);

-- Allow users to update their own tips (for dismissal via member_acted)
drop policy if exists "Users update own tips" on public.clio_tip_log;
create policy "Users update own tips"
  on public.clio_tip_log for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Add clio_tip_log to realtime publication so the INSERT subscription works
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'clio_tip_log'
  ) then
    alter publication supabase_realtime add table public.clio_tip_log;
  end if;
end $$;
