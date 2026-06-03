-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  AGGILO PHASE 0 — TOPICS SYSTEM MIGRATION                       ║
-- ║  Research Circle MJ                                              ║
-- ║                                                                   ║
-- ║  Adds the topics system: persistent topic tags, post→topic        ║
-- ║  linking, topic-scoped feeds, and Sage topic inference.          ║
-- ║  Safe to re-run (idempotent).                                     ║
-- ╚══════════════════════════════════════════════════════════════════╝

begin;

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 1: topics table                                            │
-- │                                                                  │
-- │  Topics are cluster-scoped persistent tags. Each has a URL-    │
-- │  friendly slug, display name, optional description, and a        │
-- │  colour for chip rendering. post_count is denormalised and       │
-- │  maintained by triggers for fast listing.                       │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.topics (
  id          uuid default gen_random_uuid() primary key,
  cluster_id  text not null,
  slug        text not null,
  name        text not null,
  description text,
  color       text not null default 'stone', -- tailwind colour name
  post_count  int not null default 0,
  created_at  timestamptz default now() not null,
  created_by  uuid references auth.users(id) on delete set null,

  -- cluster + slug must be unique
  unique (cluster_id, slug)
);

-- Index: fast cluster topic listing
 create index if not exists idx_topics_cluster_post_count
   on public.topics(cluster_id, post_count desc);

-- Index: slug lookup
 create index if not exists idx_topics_cluster_slug
   on public.topics(cluster_id, slug);

 alter table public.topics enable row level security;

 -- Anyone in the cluster can read topics
 drop policy if exists "Cluster members read topics" on public.topics;
 create policy "Cluster members read topics"
   on public.topics for select
   using (
     exists (
       select 1 from public.profiles
       where id = auth.uid() and cluster_id = public.topics.cluster_id
     )
   );

 -- Members can create topics
 drop policy if exists "Cluster members create topics" on public.topics;
 create policy "Cluster members create topics"
   on public.topics for insert
   with check (
     exists (
       select 1 from public.profiles
       where id = auth.uid() and cluster_id = public.topics.cluster_id
     )
   );

 -- Admins can update/delete topics
 drop policy if exists "Admins manage topics" on public.topics;
 create policy "Admins manage topics"
   on public.topics for all
   using (
     exists (
       select 1 from public.profiles
       where id = auth.uid()
         and cluster_id = public.topics.cluster_id
         and role = 'admin'
     )
   );


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 2: post_topics junction table                              │
-- │                                                                  │
-- │  Many-to-many between posts and topics. added_by distinguishes │
-- │  Sage-inferred tags from member-assigned ones.                 │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.post_topics (
  post_id    uuid not null references public.posts(id) on delete cascade,
  topic_id   uuid not null references public.topics(id) on delete cascade,
  added_by   text not null default 'member' check (added_by in ('member','sage')),
  added_at   timestamptz default now() not null,

  primary key (post_id, topic_id)
);

 create index if not exists idx_post_topics_post
   on public.post_topics(post_id);

 create index if not exists idx_post_topics_topic
   on public.post_topics(topic_id);

 -- Composite index for topic-scoped feed lookups
 create index if not exists idx_post_topics_topic_post_desc
   on public.post_topics(topic_id, post_id desc);

 alter table public.post_topics enable row level security;

 drop policy if exists "Cluster members read post_topics" on public.post_topics;
 create policy "Cluster members read post_topics"
   on public.post_topics for select
   using (
     exists (
       select 1 from public.posts p
       join public.profiles pr on pr.id = auth.uid() and pr.cluster_id = p.cluster_id
       where p.id = public.post_topics.post_id
     )
   );

 drop policy if exists "Cluster members insert post_topics" on public.post_topics;
 create policy "Cluster members insert post_topics"
   on public.post_topics for insert
   with check (
     exists (
       select 1 from public.posts p
       join public.profiles pr on pr.id = auth.uid() and pr.cluster_id = p.cluster_id
       where p.id = public.post_topics.post_id
     )
   );

 drop policy if exists "Post authors delete their post_topics" on public.post_topics;
 create policy "Post authors delete their post_topics"
   on public.post_topics for delete
   using (
     exists (
       select 1 from public.posts p
       where p.id = public.post_topics.post_id and p.author_id = auth.uid()
     )
   );


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 3: post_attachments table (media upload support)           │
-- │                                                                  │
-- │  One post can have 0-N attachments. Storage path points into     │
-- │  the Supabase storage bucket.                                    │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.post_attachments (
  id          uuid default gen_random_uuid() primary key,
  post_id     uuid not null references public.posts(id) on delete cascade,
  cluster_id  text not null,
  file_name   text not null,
  file_type   text not null, -- mime type, e.g. application/pdf
  file_size   int not null,  -- bytes
  storage_path text not null, -- bucket/folder/filename
  thumbnail_path text,       -- for images/videos
  created_at  timestamptz default now() not null,
  created_by  uuid references auth.users(id) on delete set null
);

 create index if not exists idx_post_attachments_post
   on public.post_attachments(post_id);

 create index if not exists idx_post_attachments_cluster
   on public.post_attachments(cluster_id);

 alter table public.post_attachments enable row level security;

 drop policy if exists "Cluster members read attachments" on public.post_attachments;
 create policy "Cluster members read attachments"
   on public.post_attachments for select
   using (
     exists (
       select 1 from public.profiles
       where id = auth.uid() and cluster_id = public.post_attachments.cluster_id
     )
   );

 drop policy if exists "Post authors insert attachments" on public.post_attachments;
 create policy "Post authors insert attachments"
   on public.post_attachments for insert
   with check (
     exists (
       select 1 from public.posts p
       where p.id = public.post_attachments.post_id and p.author_id = auth.uid()
     )
   );

 drop policy if exists "Post authors delete attachments" on public.post_attachments;
 create policy "Post authors delete attachments"
   on public.post_attachments for delete
   using (
     exists (
       select 1 from public.posts p
       where p.id = public.post_attachments.post_id and p.author_id = auth.uid()
     )
   );


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 4: post_count trigger on topics                            │
-- │                                                                  │
-- │  Keeps topics.post_count denormalised and accurate.             │
-- └──────────────────────────────────────────────────────────────────┘

create or replace function public.update_topic_post_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.topics set post_count = post_count + 1 where id = new.topic_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.topics set post_count = post_count - 1 where id = old.topic_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_topic_post_count on public.post_topics;
create trigger trg_topic_post_count
  after insert or delete on public.post_topics
  for each row execute function public.update_topic_post_count();


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 5: Realtime publication                                    │
-- └──────────────────────────────────────────────────────────────────┘

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'topics'
  ) then
    alter publication supabase_realtime add table public.topics;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'post_topics'
  ) then
    alter publication supabase_realtime add table public.post_topics;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'post_attachments'
  ) then
    alter publication supabase_realtime add table public.post_attachments;
  end if;
end $$;


commit;

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  MIGRATION COMPLETE                                              ║
-- ║                                                                  ║
-- ║  New tables:                                                     ║
-- ║    - public.topics                                               ║
-- ║    - public.post_topics                                          ║
-- ║    - public.post_attachments                                     ║
-- ║                                                                  ║
-- ║  Next: run the app, create topics via /api/topics, test          ║
-- ║  topic assignment via /api/posts/:id/topics.                     ║
-- ╚══════════════════════════════════════════════════════════════════╝
