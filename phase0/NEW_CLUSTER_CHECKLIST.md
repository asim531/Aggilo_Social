# Phase 0 — New pilot cluster checklist

> Everything you need to do (and not forget) to spin up a new pilot
> cluster, derived from the Long Conversation and Sisters in Dua
> implementations. Follow this in order — each step depends on what
> came before.
>
> The two existing pilot apps are the references:
>   - `phase0/lc/` — Long Conversation (the most recent, cleanest reference)
>   - `phase0/mvp/` — Sisters in Dua (older but feature-richer)
>
> When this checklist is followed end-to-end, a new cluster ships with:
> auth, profile scoping, Timeline + threading, Sage evaluation,
> Clio FAB (cluster + ephemeral mode), private tip mechanic, Room
> Workshop (Sage⇄Clio cadence + features), founding-member feedback,
> founder badge, admin welfare queue, help menu, contextual tour,
> orientation modal, magic-link email, Vercel rewrite.

---

## Pre-flight — pick the cluster identity

Before you create any files, lock these answers:

| Field | Example (LC) | What it constrains |
|---|---|---|
| **Slug (kebab-case)** | `long-conversation` | URL: `aggilo.in/c/<slug>`, Vercel rewrite source |
| **Cluster ID (snake_case)** | `long_conversation` | DB column value, every Supabase query filter |
| **App folder name** | `lc` | `phase0/lc/`, Vercel root directory |
| **Display name** | "Long Conversation" | Cluster header, Navbar, email subject |
| **Tagline** | "Where you're known by what you say…" | Cluster header, landing page |
| **Founding member email** | `tas@example.com` | `FOUNDING_MEMBER_EMAILS` env var |
| **Sage register** | Warm intellectual witness, formality 2 | `phase0/clusters/<id>/SAGE_PERSONA.md` |
| **Clio persona key** | Momentum + intimacy-cohort | `phase0/clusters/<id>/CLIO_ONBOARDING.md` |
| **AGGIL config** | Ages 22–32, India, English, mixed | `phase0/clusters/<id>/CLUSTER_DESCRIPTION.md` |

If any of these are still unclear, do not start the build. Run them
through the cluster intake pipeline (Pattern 7 in
`architecture/AGENT_COMMUNICATION_CONTRACT.md`) first.

---

## Step 1 — Cluster specs (no code yet)

Create `phase0/clusters/<cluster_id>/` with four files. Use the LC
versions as the structural template:

```
phase0/clusters/<cluster_id>/
├── CLUSTER_DESCRIPTION.md   ← thesis, AGGIL rationale, name rationale, seed questions
├── CLIO_ONBOARDING.md       ← persona, hook messages, Sage introduction
├── CLUSTER_TOOLS.md         ← active tools (private_tip_mechanic, etc.) + calibration
└── SAGE_PERSONA.md          ← register, four named interventions, what Sage does NOT do
```

Reference templates:
- `phase0/clusters/long_conversation/` — fullest example
- `clusters/CLUSTER_TOOLS_TEMPLATE.md` — empty tools template

**Required content:**

- `CLUSTER_DESCRIPTION.md` must include the **5 seed questions** that
  Sage and Clio will reference. The founding-feedback prompt mirrors
  these into its reference panel.
- `SAGE_PERSONA.md` must specify whether the cluster is welfare-elevated
  (intimacy-cohort clusters are, faith clusters can be, casual topic
  clusters typically are not).
- `CLIO_ONBOARDING.md` must specify which AGGIL signals Scout uses to
  surface this cluster to other members.

---

## Step 2 — Database scoping

The shared Supabase project already runs the cluster-scope migration
(`phase0/lc/supabase/01_cluster_scope_migration.sql`). For a new
cluster, you do NOT re-run it. New clusters slot in by inserting rows
with the new `cluster_id`.

**What you DO need to verify before launching the new cluster:**

- The five core tables all carry `cluster_id`:
  `profiles`, `posts`, `welfare_notifications`, `clio_ephemeral_sessions`,
  `clio_tip_log`, `agent_chatbox_exchanges`, `cluster_features`
- The composite-FK migration `04_posts_profiles_fk_migration.sql` is
  applied (so PostgREST embed `posts → profiles` works)
- The founder-feedback migrations (`02`, `03`) are applied if this
  cluster has a Source-A founding member

If the new cluster needs cluster-specific tables (e.g. dua_vault for
Sisters in Dua), create them with `cluster_id` from day one — don't
add it later.

---

## Step 3 — App scaffold

Easiest path: copy `phase0/lc/` to `phase0/<app_folder>/` and replace
cluster-specific values. The full list of cluster-specific changes:

### Constants (mechanical)

| File | Change |
|---|---|
| `package.json` | `name`, `description`, `scripts.dev` port, `scripts.start` port |
| `src/lib/cluster.ts` | `CLUSTER_ID` constant, `CLUSTER` object (id, displayName, tagline, AGGIL) |
| `next.config.mjs` | `basePath` env var name (still uses `NEXT_PUBLIC_BASE_PATH`) |
| `tailwind.config.ts` | Optional: per-cluster accent colors. LC uses amber/teal/rose/stone — only override if the brand register demands it. |
| `src/app/layout.tsx` | `metadata.title`, `metadata.description` |
| `src/app/page.tsx` | Landing copy in the cluster's voice |

### Cluster-specific prompt files

Layered on top of the platform prompts. Replace the LC versions in:

```
src/lib/prompts/
├── platform/
│   ├── super-prompt.ts         ← KEEP — platform-wide, never edit
│   ├── sage-character.ts       ← KEEP — generic Sage character
│   ├── clio-character.ts       ← KEEP — generic Clio character
│   └── clio-founding-feedback.ts ← KEEP — generic founding-feedback frame
└── cluster/
    ├── sage.ts                 ← REPLACE — cluster register + four interventions
    └── clio.ts                 ← REPLACE — cluster context + tip-mechanic calibration
```

### Static assets

- `public/characters/clio.png` — keep (platform asset)
- `public/characters/sage.png` — keep (platform asset)
- Add cluster-specific brand assets if any

### Environment variables

Copy `phase0/lc/.env.example` to `phase0/<app_folder>/.env.example`,
replacing:

- `NEXT_PUBLIC_CLUSTER_ID`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_BASE_PATH` (set per Vercel env, kept empty for dev)
- `FOUNDING_MEMBER_EMAILS` (cluster-specific founder)

Keep shared:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` — same Supabase project across pilot
- `LLM_*` — same provider keys
- `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_CLARITY_ID` — unified analytics
- `ADMIN_EMAILS` — platform admin allowlist

---

## Step 4 — Forum communication structure

What's already built and works the same way for every cluster (don't
re-architect these):

| Surface | Component | What it does |
|---|---|---|
| Sticky compose bar | `PostComposer.tsx` | Post writes a row, fires Sage evaluate. |
| Timeline | `ClusterFeed.tsx` + `PostCard.tsx` | Top-level posts with one level of inline replies. Welfare-flagged threads get a rose accent. |
| Threading | `parent_id` column | Replies attach to a parent. Sage's responses thread under the originating post. The cluster intentionally keeps threads shallow (one level deep). |
| Realtime | `useRealtimePosts.ts` | INSERT / UPDATE / DELETE handlers, hydrates author profile. |
| Sage evaluation | `/api/sage/evaluate` | Welfare pre-filter → @Sage detection → context assembly → LLM with the Sage 7-step framework → threaded reply. |
| @Sage mentions | regex in `/api/sage/evaluate` | When detected, [SAGE_SILENT] is no longer valid; Sage must respond. |
| Clio FAB | `ClioFab.tsx` | Cluster mode + ephemeral mode tabs. Private tip mechanic active. |
| Room Workshop | `AgentChatbox.tsx` | Sage⇄Clio cadence dialogue, two-track capability proposals. |
| Welfare queue | `/admin/welfare` | Admin sees flagged posts and resolves them. |
| Founding feedback | navbar badge + modal | Per `docs/AMA_CLUSTER_CREATION_AND_FOUNDING_FEEDBACK.md` Part 1 |
| Founder badge | opt-in chip on PostCard | Offered after founding-feedback closes. |
| Help menu + tour | `HelpMenu.tsx`, `ClioTour.tsx` | User-invoked orientation. Never auto-firing. |

**Cluster-specific calibration of these surfaces** lives in
`src/lib/prompts/cluster/` and the cluster spec docs at
`phase0/clusters/<cluster_id>/`. The component code does not change
between clusters.

---

## Step 5 — Vercel deployment

Per `phase0/docs/DEPLOYMENT_AGGILO_IN_REWRITE.md`:

1. Create a new Vercel project. Root Directory = `phase0/<app_folder>`.
   **Production Branch** must be set to `chore/phase0-folder-reshape`.
2. Set production env vars (Supabase, LLM, basePath = `/c/<slug>`,
   APP_URL = `https://mvp.aggilo.in`, FOUNDING_MEMBER_EMAILS).
3. Deploy. Note the Vercel-assigned `*.vercel.app` URL.
4. Add the rewrite to **ROOT `vercel.json` on `main` branch`**:
   ```jsonc
   {
     "source": "/c/<slug>",
     "destination": "https://<deployment>.vercel.app/c/<slug>"
   },
   {
     "source": "/c/<slug>/:path*",
     "destination": "https://<deployment>.vercel.app/c/<slug>/:path*"
   }
   ```
   ⚠️ **CRITICAL:** The rewrite lives in the ROOT `vercel.json` on `main`
   (the `aggilo-social` project that serves `mvp.aggilo.in`), NOT in
   `phase0/mvp/vercel.json` or `launch/landing/vercel.json`. The
   `phase0/mvp/vercel.json` is for reference only — the deployed file is
   the root one.
5. Commit and push the root `vercel.json` change to `main` branch.
   Vercel auto-rebuilds the `aggilo-social` project on push.
6. Add **BOTH** of these to the Supabase Auth Redirect URL allow-list:
   ```
   https://mvp.aggilo.in/c/<slug>/auth/confirm
   https://<deployment>.vercel.app/c/<slug>/auth/confirm
   ```
   The direct `.vercel.app` URL is required because Supabase uses the
   request's `Origin` header to validate redirects. If only the clean URL
   is in the allow-list, Supabase falls back to the Site URL (which may
   be `localhost` from dev testing) and magic links break.
7. Smoke test per the deployment guide.

The magic-link email template
(`phase0/lc/supabase/email_templates/magic_link.html`) is
cluster-agnostic — install it once, every cluster shares it.

---

## Step 6 — Smoke checklist

Before declaring the cluster live, verify in production:

- [ ] Sign in works end-to-end. Magic link bounces through aggilo.in.
- [ ] First-time member sees the FirstVisitHint banner; tapping it
      opens ClioWelcome with character images visible
- [ ] Help menu (`?` pill) opens, both actions work
- [ ] Cluster Timeline renders with the empty state
- [ ] Compose a post → it appears immediately. Sage evaluates within
      ~10s and responds (if she has something to add) or stays silent
- [ ] Reply to a post → reply appears under the parent
- [ ] @Sage in a post → Sage always responds
- [ ] Welfare regex hit → Sage's care-witness reply appears in the
      thread, parent gets the rose accent, admin queue shows the row
- [ ] Clio FAB opens, both Cluster and Private tabs work
- [ ] Room Workshop strip appears below the compose bar; click expands
- [ ] Founding member sees the badge in the navbar; opens modal,
      accepts → founder chip appears in their posts
- [ ] Admin (in `ADMIN_EMAILS`) sees the Admin link in navbar; clicks
      → `/admin/welfare` queue is reachable
- [ ] Resolve a welfare item → moves to Resolved tab
- [ ] Sign out → lands at `aggilo.in/c/<slug>` (not `.vercel.app`)

---

## What to avoid

Patterns that have already been corrected once in LC. Do not
re-introduce:

- **Auto-firing modals on entry.** The room is the experience. All
  orientation is user-invoked from the help menu. The founding-feedback
  prompt is a navbar badge, not a 30-second timer.
- **Implying autonomous changes Clio cannot yet make.** In Phase 0,
  Tier-1 stewardship is captured for admin (48h SLA). The
  prompt-frame language must say so.
- **Rendering top-level posts only and dropping replies.** The early
  LC version did this and Sage's welfare reply disappeared into the
  void. Always render replies under their parent.
- **Selecting `posts(*, profiles(*))` without the composite FK.**
  PostgREST needs the composite FK from migration `04` to satisfy the
  embed. If you create new tables that join to profiles, add the
  composite FK in their own migration.
- **Hardcoding cluster_id at component level.** Every component reads
  it from `@/lib/cluster`. Don't string-literal "long_conversation"
  anywhere.
- **Putting the cluster card at `app/c/<slug>/page.tsx`.** When
  `basePath` is set in production, Next.js strips the prefix before
  routing. So `/c/<slug>` internally maps to `/`, which means
  `app/page.tsx` serves the cluster card — NOT
  `app/c/<slug>/page.tsx`. The latter is only reachable in dev (when
  basePath is empty). The fix used in RC_MJ:
  - `app/page.tsx` → contains the full cluster card (async server
    component with `loadActivity()`, metadata, etc.)
  - `app/c/<slug>/page.tsx` → dev-only redirect to `/`
  - `redirect("/c/<slug>")` anywhere in `app/page.tsx` creates an
    **infinite redirect loop** in production because the page IS already
    at `/c/<slug>` after basePath stripping.
- **Forgetting to update the rewrite destination after each deploy.**
  Vercel assigns a new `*.vercel.app` URL on every production deploy
  (the old one still works but may serve stale cache). Always update
  the root `vercel.json` rewrite `destination` to the **latest**
  production deployment URL, commit to `main`, and push.
- **Leaving Supabase Site URL as `localhost`.** If the Site URL in
  Supabase Dashboard → Auth → URL Configuration is still set to
  `http://localhost:3000/cluster` (from dev testing), magic-link emails
  will send users to localhost. Change the Site URL to
  `https://mvp.aggilo.in` (safe for all clusters) and rely on the
  per-cluster `emailRedirectTo` + Redirect URLs allow-list for routing.

---

*Phase 0 new-cluster checklist · 2026-05-26*
*Update this when the next cluster ships and reveals new gaps.*
