-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  CATCH-UP MIGRATION — Research Circle MJ                          ║
-- ║  Applies everything from migration 07 + 08 that may be missing    ║
-- ║  Safe to re-run (idempotent)                                      ║
-- ╚══════════════════════════════════════════════════════════════════╝

begin;

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  1. Enable pgvector extension                                     │
-- └──────────────────────────────────────────────────────────────────┘

create extension if not exists vector with schema public;

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  2. Add missing metadata columns to post_attachments               │
-- └──────────────────────────────────────────────────────────────────┘

alter table public.post_attachments add column if not exists authors jsonb;
alter table public.post_attachments add column if not exists venue text;
alter table public.post_attachments add column if not exists year text;
alter table public.post_attachments add column if not exists doi text;
alter table public.post_attachments add column if not exists abstract text;
alter table public.post_attachments add column if not exists keywords jsonb;
alter table public.post_attachments add column if not exists paper_status text default 'uploaded';

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  3. Add missing caption column to paper_diagrams                  │
-- └──────────────────────────────────────────────────────────────────┘

alter table public.paper_diagrams add column if not exists caption text;

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  4. paper_citations — bidirectional links between papers         │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.paper_citations (
  id                uuid default gen_random_uuid() primary key,
  citing_attachment_id uuid not null references public.post_attachments(id) on delete cascade,
  cited_attachment_id  uuid not null references public.post_attachments(id) on delete cascade,
  mention_context   text,
  created_at        timestamptz default now() not null,
  unique (citing_attachment_id, cited_attachment_id)
);

create index if not exists idx_paper_citations_citing
  on public.paper_citations(citing_attachment_id);
create index if not exists idx_paper_citations_cited
  on public.paper_citations(cited_attachment_id);

alter table public.paper_citations enable row level security;

drop policy if exists "Cluster members read paper_citations" on public.paper_citations;
create policy "Cluster members read paper_citations"
  on public.paper_citations for select
  using (
    exists (
      select 1 from public.post_attachments pa
      where pa.id = public.paper_citations.citing_attachment_id
        and pa.cluster_id in (
          select cluster_id from public.profiles where id = auth.uid()
        )
    )
  );

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  5. paper_versions — document revision history                   │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.paper_versions (
  id                uuid default gen_random_uuid() primary key,
  attachment_id     uuid not null references public.post_attachments(id) on delete cascade,
  parent_version_id uuid references public.paper_versions(id) on delete set null,
  version_number    int not null default 1,
  notes             text,
  created_at        timestamptz default now() not null,
  unique (attachment_id, version_number)
);

create index if not exists idx_paper_versions_attachment
  on public.paper_versions(attachment_id);

alter table public.paper_versions enable row level security;

drop policy if exists "Cluster members read paper_versions" on public.paper_versions;
create policy "Cluster members read paper_versions"
  on public.paper_versions for select
  using (
    exists (
      select 1 from public.post_attachments pa
      where pa.id = public.paper_versions.attachment_id
        and pa.cluster_id in (
          select cluster_id from public.profiles where id = auth.uid()
        )
    )
  );

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  6. paper_embeddings — pgvector for semantic search               │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.paper_embeddings (
  id                uuid default gen_random_uuid() primary key,
  attachment_id     uuid not null references public.post_attachments(id) on delete cascade,
  embedding         vector(1536) not null,
  created_at        timestamptz default now() not null,
  unique (attachment_id)
);

create index if not exists idx_paper_embeddings_attachment
  on public.paper_embeddings(attachment_id);

alter table public.paper_embeddings enable row level security;

drop policy if exists "Cluster members read paper_embeddings" on public.paper_embeddings;
create policy "Cluster members read paper_embeddings"
  on public.paper_embeddings for select
  using (
    exists (
      select 1 from public.post_attachments pa
      where pa.id = public.paper_embeddings.attachment_id
        and pa.cluster_id in (
          select cluster_id from public.profiles where id = auth.uid()
        )
    )
  );

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  7. paper_annotations — public/private notes per paper             │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.paper_annotations (
  id                uuid default gen_random_uuid() primary key,
  attachment_id     uuid not null references public.post_attachments(id) on delete cascade,
  author_id         uuid not null references auth.users(id) on delete cascade,
  body              text not null,
  visibility        text not null default 'private' check (visibility in ('public', 'private')),
  pass_type         text,
  created_at        timestamptz default now() not null
);

create index if not exists idx_paper_annotations_attachment
  on public.paper_annotations(attachment_id);
create index if not exists idx_paper_annotations_author
  on public.paper_annotations(author_id);

alter table public.paper_annotations enable row level security;

drop policy if exists "Cluster members read public annotations" on public.paper_annotations;
create policy "Cluster members read public annotations"
  on public.paper_annotations for select
  using (
    visibility = 'public' and
    exists (
      select 1 from public.post_attachments pa
      where pa.id = public.paper_annotations.attachment_id
        and pa.cluster_id in (
          select cluster_id from public.profiles where id = auth.uid()
        )
    )
  );

drop policy if exists "Authors read own private annotations" on public.paper_annotations;
create policy "Authors read own private annotations"
  on public.paper_annotations for select
  using (author_id = auth.uid());

drop policy if exists "Authors create annotations" on public.paper_annotations;
create policy "Authors create annotations"
  on public.paper_annotations for insert
  with check (author_id = auth.uid());

drop policy if exists "Authors delete own annotations" on public.paper_annotations;
create policy "Authors delete own annotations"
  on public.paper_annotations for delete
  using (author_id = auth.uid());

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  8. paper_reading_status — per-user tracking                     │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.paper_reading_status (
  id                uuid default gen_random_uuid() primary key,
  attachment_id     uuid not null references public.post_attachments(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  status            text not null default 'unread' check (status in ('unread', 'reading', 'read')),
  created_at        timestamptz default now() not null,
  updated_at        timestamptz default now() not null,
  unique (attachment_id, user_id)
);

create index if not exists idx_paper_reading_status_user
  on public.paper_reading_status(user_id);

alter table public.paper_reading_status enable row level security;

drop policy if exists "Users read own reading status" on public.paper_reading_status;
create policy "Users read own reading status"
  on public.paper_reading_status for select
  using (user_id = auth.uid());

drop policy if exists "Users upsert reading status" on public.paper_reading_status;
create policy "Users upsert reading status"
  on public.paper_reading_status for insert
  with check (user_id = auth.uid());

drop policy if exists "Users update own reading status" on public.paper_reading_status;
create policy "Users update own reading status"
  on public.paper_reading_status for update
  using (user_id = auth.uid());

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  9. paper_status_log — status transition history                │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.paper_status_log (
  id                uuid default gen_random_uuid() primary key,
  attachment_id     uuid not null references public.post_attachments(id) on delete cascade,
  old_status        text,
  new_status        text not null,
  changed_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz default now() not null
);

create index if not exists idx_paper_status_log_attachment
  on public.paper_status_log(attachment_id);

alter table public.paper_status_log enable row level security;

drop policy if exists "Cluster members read paper_status_log" on public.paper_status_log;
create policy "Cluster members read paper_status_log"
  on public.paper_status_log for select
  using (
    exists (
      select 1 from public.post_attachments pa
      where pa.id = public.paper_status_log.attachment_id
        and pa.cluster_id in (
          select cluster_id from public.profiles where id = auth.uid()
        )
    )
  );

drop policy if exists "Members create status log" on public.paper_status_log;
create policy "Members create status log"
  on public.paper_status_log for insert
  with check (
    changed_by = auth.uid() and
    exists (
      select 1 from public.post_attachments pa
      where pa.id = public.paper_status_log.attachment_id
        and pa.cluster_id in (
          select cluster_id from public.profiles where id = auth.uid()
        )
    )
  );

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  10. Enhanced text search function (decomposition content too)   │
-- └──────────────────────────────────────────────────────────────────┘

create or replace function public.search_papers(
  p_cluster_id text,
  p_query text,
  p_limit int default 10
)
returns table (
  id uuid,
  file_name text,
  doc_title text,
  doc_summary text,
  similarity float
)
language sql
stable
as $$
  select
    pa.id,
    pa.file_name,
    pa.doc_title,
    pa.doc_summary,
    max(
      case
        when pa.doc_title ilike '%' || p_query || '%' then 1.0
        when pa.doc_summary ilike '%' || p_query || '%' then 0.8
        when pa.keywords @> to_jsonb(array[p_query]) then 0.7
        when pa.authors @> to_jsonb(array[p_query]) then 0.6
        when pa.extracted_text ilike '%' || p_query || '%' then 0.5
        when pd.result_json::text ilike '%' || p_query || '%' then 0.4
        else 0.0
      end
    ) as similarity
  from public.post_attachments pa
  left join public.paper_decompositions pd on pd.attachment_id = pa.id
  where pa.cluster_id = p_cluster_id
    and pa.doc_type = 'research_paper'
    and (
      pa.doc_title ilike '%' || p_query || '%'
      or pa.doc_summary ilike '%' || p_query || '%'
      or pa.keywords @> to_jsonb(array[p_query])
      or pa.authors @> to_jsonb(array[p_query])
      or pa.extracted_text ilike '%' || p_query || '%'
      or pd.result_json::text ilike '%' || p_query || '%'
    )
  group by pa.id, pa.file_name, pa.doc_title, pa.doc_summary
  order by similarity desc
  limit p_limit;
$$;

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  11. Semantic vector search function (pgvector)                 │
-- └──────────────────────────────────────────────────────────────────┘

create or replace function public.search_papers_semantic(
  p_cluster_id text,
  p_query_embedding vector(1536),
  p_limit int default 10,
  p_min_similarity float default 0.5
)
returns table (
  id uuid,
  file_name text,
  doc_title text,
  doc_summary text,
  similarity float
)
language sql
stable
as $$
  select
    pa.id,
    pa.file_name,
    pa.doc_title,
    pa.doc_summary,
    1 - (pe.embedding <=> p_query_embedding) as similarity
  from public.paper_embeddings pe
  join public.post_attachments pa on pa.id = pe.attachment_id
  where pa.cluster_id = p_cluster_id
    and pa.doc_type = 'research_paper'
    and 1 - (pe.embedding <=> p_query_embedding) >= p_min_similarity
  order by similarity desc
  limit p_limit;
$$;

commit;
