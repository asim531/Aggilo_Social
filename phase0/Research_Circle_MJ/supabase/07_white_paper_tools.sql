-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  AGGILO PHASE 0 — WHITE PAPER TOOLS MIGRATION                   ║
-- ║  Research Circle MJ                                              ║
-- ║                                                                   ║
-- ║  Adds content intelligence (CIM) columns to post_attachments,   ║
-- ║  and tables for discussion tracker, diagram engine, and           ║
-- ║  document decomposition protocol.                                 ║
-- ║  Safe to re-run (idempotent).                                     ║
-- ╚══════════════════════════════════════════════════════════════════╝

begin;

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 1: Extend post_attachments with CIM fields                │
-- └──────────────────────────────────────────────────────────────────┘

alter table public.post_attachments add column if not exists
  extracted_text text;
alter table public.post_attachments add column if not exists
  doc_type text check (doc_type in ('research_paper','document','image','video','unknown'));
alter table public.post_attachments add column if not exists
  doc_title text;
alter table public.post_attachments add column if not exists
  doc_summary text;
alter table public.post_attachments add column if not exists
  white_paper_tools_enabled boolean not null default false;
alter table public.post_attachments add column if not exists
  extracted_at timestamptz;

-- Index: fast lookup of research-paper attachments
 create index if not exists idx_post_attachments_doc_type
   on public.post_attachments(doc_type);

-- Index: fast lookup of attachments with tools enabled
 create index if not exists idx_post_attachments_tools_enabled
   on public.post_attachments(white_paper_tools_enabled)
   where white_paper_tools_enabled = true;


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 2: paper_tags — tag-threaded discussion per attachment      │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.paper_tags (
  id          uuid default gen_random_uuid() primary key,
  attachment_id uuid not null references public.post_attachments(id) on delete cascade,
  cluster_id  text not null,
  name        text not null,            -- e.g. "#methodology"
  color       text not null default '#4d96f5',
  created_at  timestamptz default now() not null,
  created_by  uuid references auth.users(id) on delete set null,
  unique (attachment_id, name)
);

 create index if not exists idx_paper_tags_attachment
   on public.paper_tags(attachment_id);

 alter table public.paper_tags enable row level security;

 drop policy if exists "Cluster members read paper_tags" on public.paper_tags;
 create policy "Cluster members read paper_tags"
   on public.paper_tags for select
   using (
     exists (
       select 1 from public.profiles
       where id = auth.uid() and cluster_id = public.paper_tags.cluster_id
     )
   );

 drop policy if exists "Cluster members create paper_tags" on public.paper_tags;
 create policy "Cluster members create paper_tags"
   on public.paper_tags for insert
   with check (
     exists (
       select 1 from public.profiles
       where id = auth.uid() and cluster_id = public.paper_tags.cluster_id
     )
   );


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 3: paper_comments — threaded comments per tag               │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.paper_comments (
  id          uuid default gen_random_uuid() primary key,
  tag_id      uuid not null references public.paper_tags(id) on delete cascade,
  author_id   uuid not null references auth.users(id) on delete cascade,
  body        text not null,
  created_at  timestamptz default now() not null
);

 create index if not exists idx_paper_comments_tag
   on public.paper_comments(tag_id);

 alter table public.paper_comments enable row level security;

 drop policy if exists "Cluster members read paper_comments" on public.paper_comments;
 create policy "Cluster members read paper_comments"
   on public.paper_comments for select
   using (
     exists (
       select 1 from public.paper_tags pt
       join public.profiles pr on pr.id = auth.uid() and pr.cluster_id = pt.cluster_id
       where pt.id = public.paper_comments.tag_id
     )
   );

 drop policy if exists "Cluster members insert paper_comments" on public.paper_comments;
 create policy "Cluster members insert paper_comments"
   on public.paper_comments for insert
   with check (
     exists (
       select 1 from public.profiles
       where id = auth.uid()
     )
   );

 drop policy if exists "Authors delete own paper_comments" on public.paper_comments;
 create policy "Authors delete own paper_comments"
   on public.paper_comments for delete
   using (auth.uid() = author_id);


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 4: paper_diagrams — AI-generated SVG diagrams               │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.paper_diagrams (
  id          uuid default gen_random_uuid() primary key,
  attachment_id uuid not null references public.post_attachments(id) on delete cascade,
  cluster_id  text not null,
  type        text not null,            -- concept_map | process_flow | architecture | argument_tree
  title       text not null,
  svg_data    text not null,            -- full SVG string
  caption     text,                     -- human-readable caption (1-2 sentences)
  created_at  timestamptz default now() not null
);

 create index if not exists idx_paper_diagrams_attachment
   on public.paper_diagrams(attachment_id);

 alter table public.paper_diagrams enable row level security;

 drop policy if exists "Cluster members read paper_diagrams" on public.paper_diagrams;
 create policy "Cluster members read paper_diagrams"
   on public.paper_diagrams for select
   using (
     exists (
       select 1 from public.profiles
       where id = auth.uid() and cluster_id = public.paper_diagrams.cluster_id
     )
   );


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 5: paper_decompositions — 7-pass analysis results           │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.paper_decompositions (
  id          uuid default gen_random_uuid() primary key,
  attachment_id uuid not null references public.post_attachments(id) on delete cascade,
  cluster_id  text not null,
  pass_type   text not null,            -- structure | argument | terminology | gaps | compression
  result_json jsonb not null,
  created_at  timestamptz default now() not null,
  unique (attachment_id, pass_type)
);

 create index if not exists idx_paper_decompositions_attachment
   on public.paper_decompositions(attachment_id);

 alter table public.paper_decompositions enable row level security;

 drop policy if exists "Cluster members read paper_decompositions" on public.paper_decompositions;
 create policy "Cluster members read paper_decompositions"
   on public.paper_decompositions for select
   using (
     exists (
       select 1 from public.profiles
       where id = auth.uid() and cluster_id = public.paper_decompositions.cluster_id
     )
   );


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 6: post_attachments.notes — optional upload description     │
-- └──────────────────────────────────────────────────────────────────┘

alter table public.post_attachments add column if not exists
  notes text;

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 7: post_reactions — thumbs up on posts and comments       │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.post_reactions (
  id          uuid default gen_random_uuid() primary key,
  post_id     uuid not null references public.posts(id) on delete cascade,
  author_id   uuid not null references auth.users(id) on delete cascade,
  type        text not null default 'thumbs_up',
  created_at  timestamptz default now() not null,
  unique (post_id, author_id, type)
);

 create index if not exists idx_post_reactions_post
   on public.post_reactions(post_id);

 alter table public.post_reactions enable row level security;

 drop policy if exists "Cluster members read post_reactions" on public.post_reactions;
 create policy "Cluster members read post_reactions"
   on public.post_reactions for select
   using (
     exists (
       select 1 from public.posts
       where id = public.post_reactions.post_id
         and cluster_id in (
           select cluster_id from public.profiles where id = auth.uid()
         )
     )
   );

 drop policy if exists "Members create post_reactions" on public.post_reactions;
 create policy "Members create post_reactions"
   on public.post_reactions for insert
   with check (
     author_id = auth.uid() and
     exists (
       select 1 from public.posts
       where id = public.post_reactions.post_id
         and cluster_id in (
           select cluster_id from public.profiles where id = auth.uid()
         )
     )
   );

 drop policy if exists "Members delete own post_reactions" on public.post_reactions;
 create policy "Members delete own post_reactions"
   on public.post_reactions for delete
   using (author_id = auth.uid());

commit;
