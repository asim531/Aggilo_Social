-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  AGGILO MVP — DATABASE SCHEMA (Sisters in Dua)                  ║
-- ║  Run this entire file in the Supabase SQL Editor                ║
-- ║  Dashboard → SQL Editor → New Query → Paste → Run               ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  TABLE: profiles                                                 │
-- │  Extends Supabase auth.users with display info.                  │
-- │  Uses nickname (not real name) for privacy in a women-only       │
-- │  faith community.                                                │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,

  -- Nickname chosen during onboarding (privacy-first, no real names)
  nickname text not null default '',

  -- Self-declared gender — 'female' required for Sisters in Dua
  gender text not null default '',

  -- Country collected at cluster join (not a gate, informs traction)
  country text,

  avatar_url text,

  -- Has this user completed the Clio onboarding flow?
  onboarded boolean default false not null,

  -- Role in the cluster: member (default), manager, or founder
  role text default 'member' not null check (role in ('member', 'manager', 'founder')),

  created_at timestamp with time zone default now() not null
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  TRIGGER: Auto-create profile on signup                          │
-- │  Sets nickname from email prefix. User updates it during         │
-- │  onboarding via Clio.                                            │
-- └──────────────────────────────────────────────────────────────────┘

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    coalesce(
      split_part(new.email, '@', 1),
      'Sister'
    )
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  TABLE: posts                                                    │
-- │  All content in the feed: human posts, Sage responses, replies.  │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete set null,
  parent_id uuid references public.posts(id) on delete cascade,
  content text not null,
  is_sage boolean default false not null,
  is_sage_question boolean default false not null,

  -- Thread state for Sage's message_review routing
  -- unattended | attended | welfare_flagged
  thread_state text default 'unattended' not null,

  created_at timestamp with time zone default now() not null
);

alter table public.posts enable row level security;

drop policy if exists "Posts are viewable by authenticated users" on public.posts;
create policy "Posts are viewable by authenticated users"
  on public.posts for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can create posts" on public.posts;
create policy "Authenticated users can create posts"
  on public.posts for insert
  to authenticated
  with check (true);

drop policy if exists "Users can delete their own posts" on public.posts;
create policy "Users can delete their own posts"
  on public.posts for delete
  to authenticated
  using (auth.uid() = author_id);


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  TABLE: dua_vault                                                │
-- │  Founder-curated database of verified duas, ayat, and            │
-- │  references. Atlas queries it. Sage renders from it.             │
-- │  Neither agent generates, modifies, or annotates vault content.  │
-- └──────────────────────────────────────────────────────────────────┘

create table if not exists public.dua_vault (
  id uuid default gen_random_uuid() primary key,

  -- Arabic text in Unicode, Uthmanic script
  arabic_text text not null,

  -- Tajweed-annotated Arabic (Quranic only, null for hadith)
  arabic_with_tajweed text,

  -- Latin script transliteration
  transliteration text not null,

  -- Plain English translation
  translation text not null,

  -- 'quran' or 'hadith'
  source_type text not null check (source_type in ('quran', 'hadith')),

  -- Source reference details
  source_collection text not null,         -- e.g. 'Jami at-Tirmidhi', 'Surah Al-Baqarah'
  source_book_number integer,
  source_hadith_number integer,
  source_chapter_verse text,               -- e.g. '2:286'
  source_page_hisnul integer,

  -- Hadith grade (null for Quranic). Only sahih/hasan/hasan_sahih accepted.
  hadith_grade text check (
    hadith_grade is null
    or hadith_grade in ('sahih', 'hasan', 'hasan_sahih')
  ),

  -- Occasion tags
  occasion text[] default '{}',

  -- Thematic tags for Atlas matching
  thematic_tags text[] default '{}',

  is_quranic boolean default false not null,

  -- short | medium | long
  length_classification text default 'short' not null,

  -- Must be true before Sage can surface this entry
  verified_by_founder boolean default false not null,

  -- Optional scholarly notes from Founder
  notes text,

  -- Title for display
  title text,

  date_added timestamp with time zone default now() not null
);

alter table public.dua_vault enable row level security;

-- Vault is readable by all authenticated users
drop policy if exists "Vault is viewable by authenticated users" on public.dua_vault;
create policy "Vault is viewable by authenticated users"
  on public.dua_vault for select
  to authenticated
  using (true);

-- Only the service role (Founder via admin) can insert/update vault
-- For MVP, vault is seeded via SQL or admin panel


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  ENABLE REALTIME                                                 │
-- └──────────────────────────────────────────────────────────────────┘

alter publication supabase_realtime add table public.posts;


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  INDEXES                                                         │
-- └──────────────────────────────────────────────────────────────────┘

create index if not exists idx_posts_parent_id on public.posts(parent_id);

create index if not exists idx_posts_feed
  on public.posts(created_at asc)
  where parent_id is null;

create index if not exists idx_posts_author_id on public.posts(author_id);

-- Vault: fast thematic search
create index if not exists idx_vault_thematic_tags on public.dua_vault using gin(thematic_tags);
create index if not exists idx_vault_verified on public.dua_vault(verified_by_founder) where verified_by_founder = true;
