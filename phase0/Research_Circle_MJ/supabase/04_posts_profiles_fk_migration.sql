-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  AGGILO PHASE 0 — posts ↔ profiles FK relationship migration     ║
-- ║  Run this AFTER 03_founder_badge_migration.sql                   ║
-- ║                                                                  ║
-- ║  Problem:                                                        ║
-- ║    The cluster-scope migration (01) repointed posts.author_id    ║
-- ║    to auth.users(id) so a single auth user can post in multiple  ║
-- ║    clusters under different profiles. That works for referential ║
-- ║    integrity, but PostgREST can no longer satisfy the embedded   ║
-- ║    join used everywhere in the app:                              ║
-- ║                                                                  ║
-- ║        supabase.from("posts").select("*, profiles(*)")           ║
-- ║                                                                  ║
-- ║    PostgREST embeds joins by following declared foreign-key      ║
-- ║    relationships. With no FK from posts to profiles, the embed   ║
-- ║    fails — the symptom is "Couldn't post that. Try again." in    ║
-- ║    PostComposer because the .single() returns an error.          ║
-- ║                                                                  ║
-- ║  Fix:                                                            ║
-- ║    Add a composite FK from posts(author_id, cluster_id) →        ║
-- ║    profiles(id, cluster_id). This restores the embed without     ║
-- ║    breaking the auth.users FK on posts.author_id (a column can   ║
-- ║    participate in multiple FKs).                                 ║
-- ║                                                                  ║
-- ║  The same fix applies to every table that uses                   ║
-- ║    select("*, profiles(*)") in app code:                         ║
-- ║      - posts                                                     ║
-- ║      - welfare_notifications                                     ║
-- ║                                                                  ║
-- ║  Idempotent. Safe to re-run.                                     ║
-- ╚══════════════════════════════════════════════════════════════════╝

begin;

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  posts → profiles                                                │
-- └──────────────────────────────────────────────────────────────────┘

-- Drop any old version of the same FK so the migration is re-runnable.
alter table public.posts
  drop constraint if exists posts_author_profile_fkey;

-- Composite FK. The auth.users FK (added in 01) stays in place — a
-- column can participate in multiple FKs, and both invariants are
-- meaningful: author_id must be a real auth user, AND if cluster_id
-- is non-null the (author_id, cluster_id) pair must reference a real
-- profile in that cluster.
--
-- ON DELETE CASCADE: when a profile is removed (e.g. cluster delete),
-- the posts that reference it cascade. The auth.users CASCADE on
-- author_id is already there from 01.
alter table public.posts
  add constraint posts_author_profile_fkey
  foreign key (author_id, cluster_id)
  references public.profiles(id, cluster_id)
  on delete cascade
  deferrable initially deferred;

-- The deferrable clause is important: when a new post is inserted in
-- the same transaction as a profile creation (e.g. the auth-callback
-- flow), the FK check happens at commit time, not statement time.


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  welfare_notifications → profiles                                │
-- │                                                                  │
-- │  The admin queue page in /admin/welfare embeds the profile via   │
-- │  the same select("*, profiles(*)") pattern. Same fix applies.    │
-- └──────────────────────────────────────────────────────────────────┘

alter table public.welfare_notifications
  drop constraint if exists welfare_notifications_user_profile_fkey;

-- This table writes the cluster_id at insert time, so the composite
-- FK is also valid here. The existing welfare_notifications_user_id_fkey
-- → auth.users stays.
alter table public.welfare_notifications
  add constraint welfare_notifications_user_profile_fkey
  foreign key (user_id, cluster_id)
  references public.profiles(id, cluster_id)
  on delete cascade
  deferrable initially deferred;


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  Force PostgREST schema cache reload                             │
-- │                                                                  │
-- │  Without this, Supabase's PostgREST instance may not pick up the │
-- │  new FK relationships until restart or until it next refreshes.  │
-- │  NOTIFY pgrst forces a fresh read of pg_constraint.              │
-- └──────────────────────────────────────────────────────────────────┘

notify pgrst, 'reload schema';

commit;


-- ┌──────────────────────────────────────────────────────────────────┐
-- │  Verification queries                                            │
-- └──────────────────────────────────────────────────────────────────┘

-- Confirm both composite FKs are present:
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid = 'public.posts'::regclass
--   and conname = 'posts_author_profile_fkey';
--
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid = 'public.welfare_notifications'::regclass
--   and conname = 'welfare_notifications_user_profile_fkey';

-- Confirm an embed query still works (run in PostgREST or via the
-- supabase client):
--   GET /rest/v1/posts?select=*,profiles(*)&limit=1
-- Expected: 200 OK with a profiles object on each row.

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  MIGRATION COMPLETE                                              ║
-- ║  PostComposer should now succeed end-to-end.                     ║
-- ╚══════════════════════════════════════════════════════════════════╝
