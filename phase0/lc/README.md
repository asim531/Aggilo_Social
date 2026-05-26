# Aggilo — Long Conversation

> **Phase 0 generic cluster.** A text-only space for intellectually
> serious young Indians who are done with apps and looking for the kind
> of connection that actually goes somewhere.
>
> Created in response to a waitlist form submission via aggilo.in. The
> founding member is a 26-year-old CS researcher in Bhopal who had been
> searching for weeks on apps without success.

## What this is

A separate Next.js app from the MVP (Sisters in Dua), sharing the same
Supabase project. Cluster scoping is enforced at the application layer
via a `cluster_id` column on every relevant table. The two clusters
never see each other's data.

## Stack

- **Next.js 14** App Router · TypeScript · Tailwind CSS
- **Supabase** for auth (email magic link), Postgres, RLS, Realtime
- **OpenAI-compatible LLM** for Sage and Clio (NVIDIA NIM, DeepSeek, OpenRouter, etc.)
- **Vercel** for hosting (deployed at `aggilo.in/c/long-conversation` via rewrite)

## What's in the canonical specs

The full human-readable cluster spec lives at
`d:\Aggilo_Social\clusters\long_conversation\` in the workspace root:

- `CLUSTER_DESCRIPTION.md` — thesis, AGGIL rationale, no-photo advantage, name rationale
- `SAGE_PERSONA.md` — Sage's role, register, four named interventions
- `CLIO_ONBOARDING.md` — Clio's role, the founding member, private tip mechanic
- `CLUSTER_TOOLS.md` — active tools and their calibration

The MVP also has a sibling cluster module at
`d:\Aggilo_Social\mvp\src\lib\prompts\clusters\long_conversation\`.
This LC project's prompt files are kept in sync with that module — when
one changes, the other is updated.

## Setup

```bash
cd lc
cp .env.example .env.local
# Fill in: Supabase URL/key, LLM API key/model, GA + Clarity IDs
npm install
npm run dev
```

The app runs on port 3001 by default (the MVP uses 3000).

## Database setup

Run **once** in the shared Supabase SQL Editor (the same project the
MVP uses):

```
supabase/01_cluster_scope_migration.sql
```

This migration is idempotent and adds:

1. `cluster_id` column on `profiles` and `posts` (existing rows default
   to `the_single_source` — Sisters in Dua data is unchanged)
2. `birth_year` column on `profiles` (nullable — MVP doesn't use it)
3. New `clio_tip_log` table for the private tip mechanic
4. Composite primary key `(id, cluster_id)` on profiles so one auth
   user can have separate profiles in each cluster
5. Updated trigger so MVP's auth flow keeps working unchanged

See the migration file's own header for full details.

## Architecture

```
Browser
├── Landing (/)        → AuthForm (5 steps: email, nickname, gender, birth_year, city)
├── Cluster (/cluster) → Timeline + Sage + Clio FAB (placeholder for now)
└── Auth (/auth/callback) → exchange code, upsert profile with cluster_id

Next.js routes
├── /api/auth/check-email     → existence check (signInWithOtp shouldCreateUser:false)
├── /api/auth/check-nickname  → cluster-scoped uniqueness
├── /api/sage/evaluate        → (next batch) async Sage worker
├── /api/clio/chat            → (next batch) cluster-mode FAB chat
└── /api/clio/ephemeral       → (next batch) private FAB chat

Supabase
├── profiles (cluster_id)    → upsert on auth, RLS by user
├── posts (cluster_id)       → realtime, RLS by cluster
├── clio_tip_log             → admin-readable, service-role inserts
└── auth.users               → shared across all clusters
```

## Cluster prompts

The prompt inheritance contract is preserved (see
`architecture/system_implementation_prompt_part6.md` §33):

```
Layer 1: Aggilo super-prompt           (lib/prompts/platform/super-prompt.ts)
Layer 2: Sage / Clio character          (lib/prompts/platform/*.ts)
Layer 3: Long Conversation flavour      (lib/prompts/cluster/*.ts)
Layer 4: Per-call signals               (recent posts, timeline state, etc.)
```

## Analytics

Two trackers wired in `src/components/Analytics.tsx`:

- **GA4** — initial pageview + SPA route changes via `usePathname` listener
- **Microsoft Clarity** — session recordings + heatmaps (handles SPA changes natively)

Custom events fire via `src/lib/track.ts`:

```ts
import { track } from "@/lib/track";
track("post_composed", { length: content.length });
track("clio_fab_opened");
track("clio_tip_received");
```

Every event includes `cluster_id` automatically so unified analytics
can split per cluster.

## Privacy boundaries (non-negotiable)

- Clio reads public Timeline posts and gives private FAB nudges.
- Clio NEVER cross-references two members' private FAB conversations.
- Clarity must NEVER record FAB panel content. The panel is tagged with
  `data-clarity-mask="true"` (TODO: confirm when the FAB ships).
- The `clio_tip_log` table is admin-readable only — members never see
  their own tip history.

## Status

Phase 0 build in progress. Currently shipped:

- [x] Project scaffold (package.json, tsconfig, tailwind, postcss)
- [x] Cluster identity + types
- [x] Supabase clients (browser, server, admin)
- [x] Prompt inheritance (super-prompt, Sage character, Clio character, Long Conversation cluster)
- [x] Welfare regex pre-filter
- [x] LLM client (primary + fallback)
- [x] Analytics (GA4 + Clarity, SPA-aware)
- [x] Auth flow (landing, AuthForm 5-step, magic link, callback, middleware)
- [x] Schema migration (cluster_id scoping, clio_tip_log)
- [x] Cluster shell (Navbar, ClusterHeader, ClusterFeed, sticky compose bar)
- [x] Optimistic post composer with fire-and-forget Sage evaluation
- [x] Realtime posts hook (cluster_id-scoped INSERT + UPDATE)
- [x] PostCard (member + Sage variants)
- [x] Sage evaluate API route (welfare pre-filter, layered prompt, deterministic care-witness)
- [x] Clio FAB (cluster + ephemeral modes, two-tab panel, Clarity-masked)
- [x] Private tip mechanic (frequency, repetition, dependency prevention, cluster-wide cap)
- [x] Welfare notifications table + flag on FAB + ephemeral welfare detection
- [x] Sage welfare path now writes welfare_notifications rows
- [x] basePath wiring for Vercel deployment under aggilo.in/c/long-conversation
- [x] vercel.json rewrite on the marketing site + LC project vercel.json
- [x] Deployment guide (`phase0/docs/DEPLOYMENT_AGGILO_IN_REWRITE.md`)
- [x] Founding member feedback prompt (per Part 1 of the AMA spec):
      schema migration `02_founding_feedback_migration.sql`,
      `clio-founding-feedback.ts` prompt frame + classifier,
      `/api/clio/founding-feedback` GET + POST,
      `<FoundingFeedbackPrompt>` UI component
- [x] Admin welfare queue UI:
      `/admin` index page with unresolved count,
      `/admin/welfare` queue page with open/resolved tabs,
      `/api/admin/welfare/[id]/resolve` route,
      Navbar admin link for admins
- [ ] AMA cluster creation workflow (per Part 2 of the AMA spec)
- [ ] Founding member invite flow
- [ ] Production deployment to Vercel + DNS cutover
- [ ] Scheduled task to silent_close founding feedback at 24h

## Founding member

Tas (tasneem.bano@gmail.com) — CS researcher, Bhopal, MP. Born 1999.
Receives a unique invite link when the cluster goes live.
