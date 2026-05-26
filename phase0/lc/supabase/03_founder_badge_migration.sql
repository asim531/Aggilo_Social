-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  AGGILO PHASE 0 — FOUNDER BADGE MIGRATION                        ║
-- ║  Run this AFTER 02_founding_feedback_migration.sql               ║
-- ║                                                                  ║
-- ║  Adds the founding_badge_shown column to profiles. When true,    ║
-- ║  the founding member's posts show a small "✦ Founder" chip       ║
-- ║  next to their nickname in the Timeline.                         ║
-- ║                                                                  ║
-- ║  The badge is opt-in — Clio asks after the founding-feedback     ║
-- ║  interaction closes. The member can accept or decline.           ║
-- ║  This migration is IDEMPOTENT — safe to run twice.               ║
-- ╚══════════════════════════════════════════════════════════════════╝

alter table public.profiles
  add column if not exists founding_badge_shown boolean default false not null;

comment on column public.profiles.founding_badge_shown is
  'True when the founding member has opted in to showing the Founder '
  'badge next to their nickname in the Timeline. Offered by Clio after '
  'the founding-feedback interaction closes. Default false — opt-in only.';

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  MIGRATION COMPLETE                                              ║
-- ╚══════════════════════════════════════════════════════════════════╝
