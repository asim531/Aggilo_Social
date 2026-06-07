# Aggilo MVP — Session Context

> **Purpose:** If you're a new AI session picking up this work, read this file FIRST. It tells you what exists, what works, what doesn't, and what to build next.
>
> **Scope:** This document covers the `phase0/mvp/` Sisters in Dua pilot app only. For the main product architecture, read `ARCHITECTURE.md`.

---

## Current State

### Cluster: Sisters in Dua
The MVP runs the **Sisters in Dua** cluster — a women-only community for Muslim women navigating faith in real life. Grounded in Quran and authentic Sunnah.

### What's Built (Phase 5 Complete)
- [x] Project structure (Next.js 14 App Router + TypeScript + Tailwind)
- [x] Supabase schema (profiles + posts + dua_vault + welfare_notifications + clio_ephemeral_sessions)
- [x] Auth flow (email magic link via Supabase)
- [x] Clio-style onboarding (email → nickname → gender → country → beta disclosure)
- [x] Country selection at join (mandatory, non-gating)
- [x] Beta disclosure for non-South/Southeast Asia members
- [x] Landing page branded for Sisters in Dua with privacy-first messaging
- [x] Cluster page with feed, post composer, and async Sage integration
- [x] **Optimistic posting** — post appears immediately, Sage evaluates asynchronously
- [x] **No "Sage is thinking" indicator** — Sage's response arrives via Realtime as separate post
- [x] Sage system prompt with message_review decision framework (6-step routing)
- [x] Sage API route: /api/sage/review (fire-and-forget from PostComposer)
- [x] Sage silence support ([SAGE_SILENT])
- [x] Dua vault table with 10 seed entries (verified duas/ayat)
- [x] **Progressive disclosure** for vault references (Arabic → transliteration visible, translation collapsed)
- [x] **Arabic font support** (KFGQPC Uthmanic Script HAFS with Amiri/Scheherazade fallback)
- [x] **Tajweed CSS variables** (7 rules defined)
- [x] **DuaReference component** with RTL rendering and source citation
- [x] Realtime post updates via Supabase channels
- [x] **Clio FAB** — floating action button inside cluster with chat panel
- [x] **Clio chat API** (/api/clio/chat) with LLM integration
- [x] **Clio private ephemeral chat** — lock icon → private session, browser sessionStorage, 12h TTL
- [x] **Clio ephemeral API** (/api/clio/ephemeral) with welfare detection
- [x] **Welfare signal detection** — pattern matching in both Sage review and ephemeral chat
- [x] **Welfare notifications table** — founder/manager alerts for welfare-flagged content
- [x] **Notifications API** (/api/notifications) for founder/manager to view and resolve
- [x] Middleware auth guard
- [x] Nickname-based profiles (no real names shown)
- [x] Women-only gate (self-declared gender at onboarding)
- [x] Thread state model (unattended/attended/welfare_flagged)
- [x] Post subtype support (host_content, arc_milestone, skill_dialogue, etc.)

### What's NOT Built Yet (ordered by priority)
1. **Manager panel UI** — welfare notifications are in DB but no frontend dashboard yet
2. **Vault curation UI** — Founder needs a way to add/verify vault entries (currently SQL only)
3. **Atlas Tier 1/2 API integration** — vault-only for now, no Sunnah.com/Quran.com API fallback
4. **Ramadan mode** — Hijri calendar integration + seasonal reference priority
5. **Salah window detection** — Sage should not post during prayer times
6. **Arabic font file** — KFGQPC declared in CSS but font file not bundled; falls back to Amiri
7. **Tajweed markup rendering** — CSS vars defined but vault entries lack pre-stored tajweed markup
8. **Evaluation skill** — complete dua correction with progressive disclosure
9. **Madhab balance tracking** — vault_gap counter for Atlas
10. **Push notifications** — retention
11. **Post reactions** — engagement signal

### Known Issues / TODOs
- Vault has 10 seed entries; spec targets 60 at launch
- Sage context limited to last 20 posts
- No rate limiting on API routes
- No image/file uploads
- The vault lookup fetches all verified entries — needs thematic matching
- `increment_ephemeral_message_count` RPC function needs to be created in Supabase

---

## Database Setup

```bash
# In Supabase SQL Editor, run in order:
# 1. supabase/schema.sql (creates base tables)
# 2. supabase/schema-phase5.sql (adds welfare_notifications, clio_ephemeral_sessions, post_subtype, country)
# 3. supabase/seed-vault.sql (seeds 10 verified duas)
```

## How to Run

```bash
cd mvp
cp .env.example .env.local
# Fill in: Supabase URL/key, LLM API key/model
npm install
npm run dev
```

---

## Key Files

| File | What it does |
|------|-------------|
| `src/lib/sage-prompt.ts` | Sage's persona and message_review framework |
| `src/lib/types.ts` | All TypeScript types including PostSubtype |
| `src/app/api/sage/review/route.ts` | Async Sage evaluation with welfare detection |
| `src/app/api/clio/chat/route.ts` | Clio FAB chat API |
| `src/app/api/clio/ephemeral/route.ts` | Clio private ephemeral chat API |
| `src/app/api/notifications/route.ts` | Welfare notification API for founder/manager |
| `src/components/ClusterFeed.tsx` | Main feed — no Sage thinking indicators |
| `src/components/PostCard.tsx` | Post rendering with DuaReference detection |
| `src/components/DuaReference.tsx` | Progressive disclosure vault reference component |
| `src/components/PostComposer.tsx` | Optimistic posting, fire-and-forget Sage review |
| `src/components/ClioFab.tsx` | Floating Clio chat button |
| `src/components/ClioEphemeral.tsx` | Private ephemeral chat (lock icon) |
| `src/components/AuthForm.tsx` | Onboarding: email → nickname → gender → country → beta |
| `src/components/ClioWelcome.tsx` | 3-step onboarding modal (Clio intro → Sage intro → rules) |
| `supabase/schema-phase5.sql` | Phase 5 database additions |

---

## Architecture Notes

- **Sage is async** — PostComposer saves the post, fires fetch to /api/sage/review, does not wait. Sage's response arrives via Supabase Realtime.
- **No "Sage is thinking"** — Users never see a loading state for Sage. Her response appears naturally in the feed.
- **Clio FAB** — Always present inside cluster. Chat panel opens on tap.
- **Clio ephemeral** — Lock icon on left side. Conversation stored in browser sessionStorage (not server). Metadata in Supabase. 12h TTL.
- **Welfare is non-negotiable** — Both Sage review and ephemeral chat detect welfare signals and create notifications. The welfare_flagged state requires explicit resolution by founder/manager.
- **Progressive disclosure** — DuaReference component shows Arabic + transliteration by default, translation collapsed behind tap.

---

## Specs Reference

- Cluster spec: `Sisters In Dua/sisters_in_dua_cluster_spec_v3.1.md`
- Sage persona: `../sage/SOUL.md` and `../sage/SAGE_SKILLS.md`
- Governing docs: `../clio/CLIO_CLUSTER_HOST_CONTEXT.md`, `../clio/CLIO_UNIFIED_CLUSTER_PRESENCE.md`, `../docs/CLUSTER_SKILL_DISCOVERY_PROTOCOL.md`, `../sage/SAGE_ANCHOR_PROTOCOL.md`, `../sage/SAGE_FEATURE_INTELLIGENCE.md`, `../docs/AGGILO_ONBOARDING_PLAYBOOK_V2.md`, `../docs/AGENT_COLLABORATION_CHATBOX.md`, `../docs/CLUSTER_FEATURES_TAB.md`
- Vault HTML prototypes: `Sisters In Dua/vault/*.html`
