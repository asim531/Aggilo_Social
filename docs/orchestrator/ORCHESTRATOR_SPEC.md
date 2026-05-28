# Aggilo Orchestrator Board — Implementation Spec
## Phase 0 MVP · Cluster Provisioning, Premium Customisation & Combined Admin Dashboard

> **Status:** Implementation-ready spec. Written 2026-05-23.
> **Authority:** Subordinate to `AGGILO_SOUL.md`, `AGGILO_PLATFORM_RULES.md`,
> `architecture/system_implementation_prompt_part6.md`.
> **Scope:** Phase 0 only. Phase 1 items are marked explicitly.
> **Location:** Spec files live in `docs/orchestrator/`. Code lives in
> `mvp/src/app/admin/orchestrator/` and `mvp/src/app/api/orchestrator/`.

---

## 0. Extended Thinking — What This Spec Resolves

Before writing a line of code, the following decisions were made explicitly:

### Decision 1 — One unified `/admin/*` surface, role-aware split

**Alternatives considered:**
- A) Separate `/admin/aggilo/*` and `/admin/cluster/<slug>/*` route trees (spec-described ideal)
- B) Unified `/admin/*` with role-aware tab visibility (chosen for Phase 0)
- C) Unified now, migrate to A in Phase 1

**Chosen: B.** The existing codebase has one `/admin/*` surface. The
`platform_admin` role sees cross-cluster tabs (Orchestrator, Findings,
Runtime, Skills, Platform Settings, Audit). The `founder`/`manager` role
sees cluster-scoped tabs (Overview, Care, Workshop, Vault, Members,
Configuration, Findings, Activity). Both roles share: LLM, Events, Demand.
Migration to separate route trees is Phase 1 work.

### Decision 2 — Platform admin spawns clusters (Phase 0)

Generic and premium clusters are created by the platform admin only.
Self-serve (founder-initiated `premium_applications` flow) is Phase 1.
The creation form is at `/admin/orchestrator/clusters/new`.

### Decision 3 — Premium = generic + admin/manager roles + controls

A premium cluster is a generic cluster with:
- Admin and Manager role assignments
- Agent involvement slider (Min/Medium/High)
- Free-text goal-setting (admin states goals → agents confirm understanding)
- Atlas internet access controls (specific URLs or full internet)
- Skills catalogue toggle
- Identity editor (name, tagline, description, chips, accent)
- Vault curator

Generic clusters run everything defined in the PRD and architecture docs
with agentic runtime, AGGIL, Observer, Scout, Atlas — all at platform
defaults. No slider, no free-text guidance, no vault curator.

### Decision 4 — Full `clusters` table (Part 2 schema)

The `clusters` table is created with the full schema from
`system_implementation_prompt_part2.md` §5.1, including AGGIL fields,
arc_phase, member_count, lifecycle status, and health signals.
`cluster_config` remains the settings table; `clusters` is the
provisioning/identity table. They join on `cluster_id`.

### Decision 5 — 7 Principles surfaced in the dashboard

The dashboard surfaces all 7 principles as live metrics AND follows them
in implementation. Each principle maps to a visible dashboard section:

| Principle | Dashboard surface |
|-----------|------------------|
| 1 — AI as OS | Every action routes through an agent; agent decisions are visible |
| 2 — Closed loops | Every table is read by a downstream process; feedback loops shown |
| 3 — Legible organization | Every action is a queryable row; audit trail always visible |
| 4 — Software factories | Agent prompt proposals, feature pipeline, skill proposals |
| 5 — No human middleware | Realtime push for welfare/character; no polling queues |
| 6 — Three archetypes | Role-aware UI; DRI accountability per cluster |
| 7 — Token-max | LLM spend always visible; budget cap always shown |

### Decision 6 — Adaptive extended thinking for agent decisions

Agent decisions (free-text goal parsing, slider recommendation, Atlas
source validation) use extended thinking mode where the LLM reasons
through the decision before committing. The reasoning is logged to
`llm_response_logs` and surfaced in the admin LLM tab.

---

## 1. What This Spec Covers

Three separate spec files live in `docs/orchestrator/`:

| File | Covers |
|------|--------|
| `ORCHESTRATOR_SPEC.md` (this file) | Master spec — decisions, principles, navigation, data model |
| `CLUSTER_CREATION_WORKFLOW.md` | Step-by-step create-cluster flow for generic and premium |
| `CLUSTER_ADMIN_CONSOLE_SPEC.md` | Premium cluster customisation dashboard (combined with existing admin) |
| `TEST_CLUSTER_SPEC.md` | Test cluster unit + feature gate system — admin-oriented market testing |

---

## 2. The 7 Principles — Architectural Manifestation in the Orchestrator

Every section of the orchestrator board is designed against one or more
of the 7 AI-native principles. This is not decoration — it is the
structural test for whether a feature belongs in Phase 0.

### Principle 1 — AI as OS (Orchestrating Tasks)

Every cluster operation flows through an intelligent layer:
- Cluster creation: Clio validates the AGGIL configuration and scores it
- Free-text goal setting: an agent parses goals into structured directives
- Slider recommendation: an agent computes the recommendation from cluster signals
- Atlas source validation: an agent checks URL safety and relevance
- Health checks: Observer Domain 1–10 feeds the cluster health signal

The orchestrator board is the human's window into what the AI is doing,
not a replacement for it.

### Principle 2 — Closed Loops

Every cluster action writes a row that a downstream process reads:
- `cluster_admin_actions` — every config change, every lifecycle transition
- `runtime_events` — every agent job dispatched and completed
- `llm_response_logs` — every LLM call with cost, latency, decision
- `observer_findings` — Observer reads cluster data and writes findings
- `behavioural_events` — every member action feeds back to Scout/Observer

The orchestrator board surfaces these loops visibly. Nothing is a black box.

### Principle 3 — Legible Organization

Every cluster has a single queryable record. The board shows:
- Lifecycle status (creating → active → draining → destroyed)
- Health signal (last check, is_healthy)
- Open queue counts (welfare, character, Observer findings)
- Agent activity (last Sage post, last cadence exchange, last Atlas pulse)

### Principle 4 — Software Factories

Humans define what success looks like; agents generate and iterate:
- Admin sets goals in free-text → agent parses into structured directives
- Agent proposes slider recommendation → admin confirms or overrides
- Agent proposes prompt refinements → admin approves → activates
- Workshop pipeline: agent proposes features → members vote → admin approves

### Principle 5 — No Human Middleware

No polling. No batching. No queues that require human routing:
- Welfare flags push realtime to admin (no polling)
- Observer findings push realtime to the Findings tab
- Cluster health degrades automatically when signals fire
- Agent locks prevent duplicate jobs without human intervention

### Principle 6 — Three Archetypes

The orchestrator enforces clear accountability:
- `platform_admin` — cross-cluster authority; creates clusters; manages skills
- `founder` — DRI for their cluster; owns welfare resolution; approves features
- `manager` — care authority; welfare/character queue access; no config changes

Every cluster has exactly one `founder`. Every welfare flag has one human owner.

### Principle 7 — Token-Max

LLM spend is always visible:
- Daily budget cap shown in the top bar of every admin page
- Per-cluster LLM spend shown in the cluster overview
- Per-operation cost shown in the LLM tab
- Budget-exceeded events surface as Observer Domain 5 findings

---

## 3. Navigation Architecture

### 3.1 Combined Admin Navigation

The existing `/admin/*` surface gains new tabs. Role-aware visibility:

```
Admin Navigation (all roles see their permitted tabs)
│
├── [platform_admin only]
│   ├── Orchestrator          /admin/orchestrator
│   │   ├── Clusters          /admin/orchestrator/clusters
│   │   ├── New Cluster       /admin/orchestrator/clusters/new
│   │   └── [cluster detail]  /admin/orchestrator/clusters/[id]
│   ├── Findings              /admin/orchestrator/findings
│   ├── Runtime               /admin/orchestrator/runtime
│   ├── Skills                /admin/orchestrator/skills
│   ├── Platform Settings     /admin/orchestrator/settings
│   └── Audit                 /admin/orchestrator/audit
│
├── [founder + manager + platform_admin]
│   ├── Overview              /admin  (existing)
│   ├── Care queue            /admin/welfare + /admin/character (existing)
│   ├── Workshop              /admin/thoughts + /admin/features (existing)
│   ├── Vault                 /admin/vault (existing)
│   ├── Members               /admin/members (new)
│   ├── Demand                /admin/demand (existing)
│   ├── Events                /admin/events (existing)
│   └── LLM                   /admin/llm (existing)
│
└── [founder only]
    ├── Configuration
    │   ├── Identity          /admin/config/identity
    │   ├── Agent Involvement /admin/config/involvement
    │   ├── Goals             /admin/config/goals
    │   ├── Skills            /admin/config/skills
    │   └── Atlas Sources     /admin/config/atlas
    ├── Findings              /admin/findings
    └── Activity Log          /admin/activity
```

### 3.2 AdminNavbar Extension

The existing `AdminNavbar.tsx` gains:
- A role check: if `platform_admin`, show the Orchestrator section
- A cluster selector: if `founder` admins multiple clusters (Phase 1),
  a dropdown appears. Phase 0: single cluster, no selector needed.
- The LLM daily spend badge always visible in the top bar (Principle 7)

---

## 4. Data Model

### 4.1 The `clusters` Table (new — full schema)

```sql
CREATE TABLE IF NOT EXISTS public.clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Stable string key — matches cluster_id in posts, cluster_config, etc.
  cluster_id TEXT NOT NULL UNIQUE,

  -- Identity
  display_name VARCHAR(128) NOT NULL,
  cluster_type VARCHAR(16) NOT NULL DEFAULT 'generic',
    -- 'generic' | 'premium'
  description TEXT,
  purpose TEXT,
  icon VARCHAR(8) DEFAULT '🌐',
  primary_language VARCHAR(8) DEFAULT 'en',

  -- AGGIL configuration (full schema per Part 2)
  age_min INT,
  age_max INT,
  gender_filter VARCHAR(32) DEFAULT 'anyone',
    -- 'anyone' | 'male' | 'female' | 'nb' | 'male_nb' | 'female_nb'
  geography JSONB DEFAULT '{}'::jsonb,
    -- { mode: 'named' | 'regional' | 'gps', locations: [], radius_km: null }
  languages TEXT[] DEFAULT '{}',
  interest_tags TEXT[] DEFAULT '{}',

  -- Cluster score (U-shaped intentionality model)
  cluster_score NUMERIC(5,2) DEFAULT 0,

  -- Arc phase (managed by ClusterArcEvaluate worker)
  arc_phase VARCHAR(2) DEFAULT 'A',
    -- 'A' | 'B' | 'C' | 'D' | 'E'
  arc_phase_updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Lifecycle status (orchestrator-managed)
  status VARCHAR(16) NOT NULL DEFAULT 'creating',
    -- 'creating' | 'active' | 'draining' | 'destroyed'
  activated_at TIMESTAMPTZ,
  drain_started_at TIMESTAMPTZ,
  destroyed_at TIMESTAMPTZ,

  -- Health signal
  is_healthy BOOLEAN,
  last_health_check_at TIMESTAMPTZ,

  -- Denormalized counters (updated by triggers)
  member_count INT DEFAULT 0,
  post_count INT DEFAULT 0,
  sage_posts_today INT DEFAULT 0,
  sage_posts_reset_at TIMESTAMPTZ,
  clio_posts_today INT DEFAULT 0,

  -- Activity timestamps
  last_post_at TIMESTAMPTZ,
  atlas_last_briefed_at TIMESTAMPTZ,
  atlas_last_crawled_at TIMESTAMPTZ,
  skill_dialogue_last_exchange_at TIMESTAMPTZ,
  chatbox_last_exchange_at TIMESTAMPTZ,

  -- Audit
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Test cluster flag (see TEST_CLUSTER_SPEC.md)
  is_test_cluster BOOLEAN DEFAULT FALSE,
  test_purpose TEXT,
  test_started_at TIMESTAMPTZ,
  test_ended_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_clusters_cluster_id ON public.clusters(cluster_id);
CREATE INDEX idx_clusters_status ON public.clusters(status, created_at DESC);
CREATE INDEX idx_clusters_type ON public.clusters(cluster_type, status);
```

### 4.2 `cluster_config` Extensions (additions to existing table)

```sql
-- Atlas internet access controls (new for Phase 0)
ALTER TABLE public.cluster_config
  ADD COLUMN IF NOT EXISTS atlas_access_mode VARCHAR(16) DEFAULT 'none',
    -- 'none' | 'specific_urls' | 'full_internet'
  ADD COLUMN IF NOT EXISTS atlas_allowed_urls JSONB DEFAULT '[]'::jsonb,
    -- array of { url, label, added_at, added_by }
  ADD COLUMN IF NOT EXISTS domain_sensitivity VARCHAR(8) DEFAULT 'medium',
    -- 'low' | 'medium' | 'high' — used by slider recommendation engine

  -- Feature gate system (new for Phase 0 — see TEST_CLUSTER_SPEC.md)
  ADD COLUMN IF NOT EXISTS feature_gates JSONB NOT NULL DEFAULT '{
    "clio_fab": true,
    "sage_posting": true,
    "sage_at_mention": true,
    "room_workshop": true,
    "features_tab": true,
    "atlas_pulse": true,
    "vault_references": true
  }'::jsonb;
    -- Per-cluster feature gate state. All true = all features enabled.
    -- Immutable safety floor (welfare, character, handoff) is NOT in this object.
    -- Full spec: docs/orchestrator/TEST_CLUSTER_SPEC.md §3
```

### 4.3 `cluster_goals` Table (new — free-text goal parsing)

```sql
CREATE TABLE IF NOT EXISTS public.cluster_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id TEXT NOT NULL REFERENCES public.clusters(cluster_id) ON DELETE CASCADE,

  -- Raw admin input
  raw_goal_text TEXT NOT NULL,

  -- Agent-parsed structured form (extended thinking output)
  parsed_directives JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- {
    --   accepted: [{ directive, rationale }],
    --   rejected: [{ directive, reason, ceiling_violated }],
    --   agent_confirmation: "string — what the agent understood"
    -- }

  -- Admin confirmation
  admin_confirmed BOOLEAN DEFAULT FALSE,
  admin_confirmed_at TIMESTAMPTZ,
  admin_confirmed_by UUID REFERENCES public.profiles(id),

  -- Activation
  is_active BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMPTZ,
  superseded_by UUID REFERENCES public.cluster_goals(id),

  -- Observability
  llm_log_id UUID REFERENCES public.llm_response_logs(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cluster_goals_active
  ON public.cluster_goals(cluster_id, is_active)
  WHERE is_active = TRUE;
```

---

## 5. Orchestrator Board — Platform Admin Surface

### 5.1 Clusters Index (`/admin/orchestrator/clusters`)

The cross-cluster board. Every registered cluster in one view.

**Top strip — platform health at a glance:**
```
[Total clusters: 3]  [Active: 1]  [Creating: 1]  [Draining: 0]
[LLM spend today: $1.23 / $5.00]  [Open welfare: 2]  [Observer findings: 14]
```

**Cluster table columns:**
- Status badge (creating / active / draining / destroyed) — colour-coded
- `cluster_id` + display name + type badge (Generic / Premium)
- Member count + joined this week
- Arc phase (A–E)
- Agent involvement (Min / Medium / High — premium only)
- Open welfare count
- Open Observer findings count
- Last activity (last_post_at)
- Health indicator (green / amber / red / unchecked)
- Actions: View · Transition · Edit

**Lifecycle transition buttons** (per row, contextual):
- `creating` → `[Activate]` `[Destroy]`
- `active` → `[Drain]` `[Destroy (emergency)]`
- `draining` → `[Restore]` `[Destroy]`
- `destroyed` → (read-only)

Every transition opens a confirmation dialog that shows:
- What will change
- What the transition is irreversible (destroy) or reversible (drain → restore)
- An optional reason field (written to `cluster_admin_actions`)

### 5.2 Create Cluster (`/admin/orchestrator/clusters/new`)

See `CLUSTER_CREATION_WORKFLOW.md` for the full step-by-step flow.
Summary:

**Step 1 — Type selection**
- Generic cluster (platform defaults, no admin/manager roles)
- Premium cluster (admin/manager roles, slider, goals, Atlas controls)

**Step 2 — Identity**
- `cluster_id` (snake_case, validated, unique-checked)
- Display name
- Description + purpose
- Icon (emoji picker)
- Primary language (ISO 639-1)

**Step 3 — AGGIL configuration**
- Age range (optional — defaults to open)
- Gender filter (anyone / male / female / nb / combinations)
- Geography mode (named locations / regional / GPS landmark)
- Interest tags (multi-select + custom)
- Languages (multi-select)
- Live cluster score (U-shaped, animated, Clio coaching copy)

**Step 4 — Premium configuration (premium only)**
- Agent involvement slider (Min / Medium / High)
  - Recommendation label shown next to the recommended level
  - Behaviour preview (3 bullets) re-renders on slider move
  - Safety-floor footnote always visible
- Domain sensitivity (Low / Medium / High — feeds recommendation engine)
- Atlas access mode (None / Specific URLs / Full internet)
  - If Specific URLs: URL list editor with validation
  - If Full internet: confirmation dialog with safety acknowledgement

**Step 5 — Review + create**
- Summary of all settings
- Cluster score shown prominently
- `[Create cluster]` button → inserts `clusters` row (status: `creating`)
  + inserts `cluster_config` row with defaults
  + writes `cluster_admin_actions` row
  + redirects to cluster detail page

**After creation:**
The cluster is in `creating` status. The platform admin must explicitly
activate it (`[Activate]` button on the detail page) once:
- The prompt module is registered in `registry.ts`
- The vault is seeded (premium clusters)
- The founder is assigned (premium clusters)

TODO(product): Should activation be automatic once the prompt module
is registered? Or always require explicit admin confirmation? Decide
before Phase 1 self-serve ships.

### 5.3 Cluster Detail (`/admin/orchestrator/clusters/[id]`)

The platform admin's view of a single cluster. Combines:
- Lifecycle controls (status, health, transitions)
- Configuration summary (links to edit pages)
- Live agent activity (last Sage post, last cadence exchange, last Atlas pulse)
- Open queue counts (welfare, character, Observer findings)
- LLM spend for this cluster (today + 7d)
- `cluster_admin_actions` log for this cluster
- **Feature Gates** section — per-cluster feature toggle panel
  (see `TEST_CLUSTER_SPEC.md` §6.2 for the full UI spec)
- **Test cluster controls** — if `is_test_cluster = true`:
  - `[TEST]` badge in the page header
  - Test purpose shown
  - `[Promote to production]` button
  - `[Destroy immediately]` button (skips draining)

---

## 6. Cluster Creation Workflow — Detail

See `CLUSTER_CREATION_WORKFLOW.md` for the full spec.

Key invariants:
1. `cluster_id` is immutable once created. Display name can change.
2. AGGIL post-spawn protections apply immediately after the first member joins.
3. Generic clusters cannot be upgraded to premium in Phase 0.
   (Phase 1: migration path TBD — requires product decision on data migration.)
4. Premium clusters require at least one `founder` assignment before activation.
5. The cluster score is computed at creation time and updated on AGGIL changes.

---

## 7. Premium Cluster Customisation — Configuration Surface

### 7.1 Agent Involvement Slider

Per `docs/AGENT_INVOLVEMENT_SLIDER_SPEC.md`. Phase 0 implementation:

**Recommendation engine** (runs on page load):
```
Input signals:
  - cluster.member_count (weight 0.4)
  - days since cluster.created_at (weight 0.3)
  - cluster_config.domain_sensitivity (weight 0.3)

Output: 'min' | 'medium' | 'high' with a one-line rationale
```

**Behaviour preview strings** (exact strings, not paraphrased):
- Stored in `mvp/src/lib/orchestrator/slider-preview-strings.ts`
- Rendered directly — no LLM generation for these strings
- Safety-floor footnote always rendered below the preview

**Save flow:**
1. Admin moves slider → preview re-renders
2. Admin taps Save → confirmation dialog with preview re-shown
3. Confirm → writes `cluster_config.agent_involvement` + `cluster_admin_actions` row
4. New level takes effect on next agent operation

### 7.2 Free-Text Goals (replaces "free-text guidance" in the spec)

The admin states what they want the cluster to achieve. The agent
(Clio, using extended thinking) parses the goals into structured
directives and confirms its understanding back to the admin.

**Flow:**
1. Admin writes goals in a multi-line text editor
   Example: *"I want Sage to focus on verified hadith references only.
   I want Clio to be warmer with new members. I want the room to feel
   like a study circle, not a social feed."*

2. Admin taps `[Parse goals]` → POST to `/api/orchestrator/clusters/[id]/goals/parse`
   - LLM call with extended thinking enabled
   - Agent reads the goals, the cluster's current config, and the
     immutable invariants
   - Returns structured directives + confirmation text + any rejections

3. Admin sees:
   ```
   ✅ Accepted directives:
   • Sage will prioritise verified hadith references (Sahih/Hasan only)
     when surfacing vault entries.
   • Clio will use warmer, more personal language with members who
     have joined in the last 7 days.
   • Cadence dialogue will use a study-circle register rather than
     a social-feed register.

   ❌ Rejected directives:
   • "Sage should not respond to welfare signals" — this violates the
     immutable welfare protocol. The safety floor cannot be modified.

   Agent's understanding:
   "This cluster wants to feel like a focused study circle. Sage's
   role is reference-first, not conversational. Clio's warmth is
   directed especially at new members. The room's tone is scholarly
   but not cold."
   ```

4. Admin taps `[Confirm]` → writes `cluster_goals` row with
   `admin_confirmed = true` + `cluster_admin_actions` row
   → goals become active on next agent call

**Rejection rules (enforced by the parser agent):**
- Any directive that violates an immutable invariant → rejected with reason
- Any directive that requests behaviour above the slider ceiling → rejected
  with explicit message naming the ceiling
- Any directive that requests protocol disclosure → rejected
- Accepted directives are stored in `parsed_directives` JSONB

**Extended thinking:** The parser uses extended thinking mode so the
agent reasons through each directive before accepting or rejecting.
The reasoning chain is logged to `llm_response_logs` and visible in
the LLM tab for the platform admin.

### 7.3 Atlas Internet Access Controls

Three modes, set per cluster:

**None (default for generic clusters):**
Atlas does not fetch external content for this cluster. Sage operates
from the vault only.

**Specific URLs (premium clusters — curated):**
Admin provides a list of URLs (RSS feeds, specific pages, domains).
Atlas fetches only from these sources. Each URL is validated:
- HEAD request to confirm reachability
- Agent checks URL safety and relevance to cluster purpose
- Validation result shown inline (✅ reachable / ❌ unreachable / ⚠️ off-topic)

URL list stored in `cluster_config.atlas_allowed_urls`.

**Full internet (premium clusters — open):**
Atlas may fetch from any public source. Admin must confirm:
- A dialog explains the implications (content quality, safety)
- Admin types "I understand" to confirm
- Stored as `cluster_config.atlas_access_mode = 'full_internet'`

TODO(product): Should full internet access require platform_admin
approval in addition to founder confirmation? Decide before Wave 3
Atlas ships.

### 7.4 Skills Catalogue

Reads from `skill_registry`. Each skill shows:
- Name + description
- Default-enabled state
- This-cluster-enabled toggle
- Cost-per-invocation estimate
- Immutable skills (welfare, character, handoff) shown as locked — cannot be disabled

Toggle saves to `cluster_config.enabled_skills` + `cluster_admin_actions` row.

Custom skill request form at the bottom:
- Free-text description of the desired skill
- Submits to `cluster_config.custom_skill_requests`
- Routes into the Workshop pipeline

### 7.5 Identity Editor

Edits `cluster_config.public_meta` and `clusters` display fields:
- Display name (also updates `clusters.display_name`)
- Tagline
- Description
- Demographic chips (add/remove rows of icon + label + colour)
- Accent gradient (two colour pickers — limited to 6-accent budget)
- Capabilities copy (one line per item)

Save triggers `revalidatePath('/c/<slug>')` for public preview.

---

## 8. Combined Admin Dashboard — Existing + New Surfaces

### 8.1 What Stays Exactly As-Is

All existing admin pages are preserved unchanged:
- `/admin` — Overview (welfare, care, LLM spend, Sage activity)
- `/admin/welfare` — Welfare queue
- `/admin/character` — Care queue
- `/admin/thoughts` — Workshop (cadence exchanges)
- `/admin/vault` — Vault curator
- `/admin/llm` — LLM observability
- `/admin/features` — Features pipeline
- `/admin/events` — Behavioural events
- `/admin/demand` — Demand signals
- `/admin/clusters/sisters-in-dua` — Per-cluster admin (existing)

### 8.2 New Pages Added

| Route | Who sees it | What it does |
|-------|-------------|-------------|
| `/admin/orchestrator` | platform_admin | Cluster index board |
| `/admin/orchestrator/clusters/new` | platform_admin | Create cluster wizard |
| `/admin/orchestrator/clusters/[id]` | platform_admin | Cluster detail + lifecycle |
| `/admin/orchestrator/findings` | platform_admin | Observer findings (all clusters) |
| `/admin/orchestrator/runtime` | platform_admin | Agent Runtime job state |
| `/admin/orchestrator/skills` | platform_admin | Skills registry management |
| `/admin/orchestrator/settings` | platform_admin | Platform settings |
| `/admin/orchestrator/audit` | platform_admin | Cross-cluster audit log |
| `/admin/config/identity` | founder | Identity editor |
| `/admin/config/involvement` | founder | Agent involvement slider |
| `/admin/config/goals` | founder | Free-text goals + confirmation |
| `/admin/config/skills` | founder | Skills toggle |
| `/admin/config/atlas` | founder | Atlas source controls |
| `/admin/members` | founder + manager | Member directory |
| `/admin/findings` | founder + manager | Cluster-scoped Observer findings |
| `/admin/activity` | founder | Activity log (cluster_admin_actions) |

### 8.3 AdminNavbar Changes

The existing `AdminNavbar.tsx` is extended:

**New tab groups (role-aware):**

For `platform_admin`:
```
Orchestrator | Findings | Runtime | Skills | Settings | Audit
```
(These appear as a second row or a collapsible section above the existing tabs)

For `founder`:
```
[existing tabs] | Configuration ▾ | Findings | Activity
```
Configuration is a dropdown: Identity · Involvement · Goals · Skills · Atlas

**LLM spend badge in top bar (always visible, all roles):**
```
$1.23 / $5.00 today
```
Clicking it navigates to `/admin/llm`.

---

## 9. API Routes

All new routes follow the existing pattern: Next.js App Router, server
components for pages, API routes for mutations, `adminClient()` for
service-role DB access, `createClient()` for user-scoped reads.

### 9.1 Orchestrator API Routes

```
GET    /api/orchestrator/clusters
       → list all clusters (platform_admin only)
       → filters: status, cluster_type

POST   /api/orchestrator/clusters
       → create cluster (platform_admin only)
       → body: ClusterCreateInput
       → inserts clusters row + cluster_config row + audit row

GET    /api/orchestrator/clusters/[id]
       → single cluster detail (platform_admin only)

PATCH  /api/orchestrator/clusters/[id]
       → lifecycle transition (platform_admin only)
       → body: { to_status, reason? }
       → validates transition, updates timestamps, writes audit row

PATCH  /api/orchestrator/clusters/[id]/health
       → update health signal (platform_admin only)
       → body: { is_healthy }

POST   /api/orchestrator/clusters/[id]/goals/parse
       → parse free-text goals (founder only)
       → body: { raw_goal_text }
       → LLM call with extended thinking
       → returns { accepted_directives, rejected_directives, agent_confirmation }

POST   /api/orchestrator/clusters/[id]/goals/confirm
       → confirm parsed goals (founder only)
       → body: { goal_id }
       → sets admin_confirmed = true, is_active = true

PATCH  /api/orchestrator/clusters/[id]/config
       → update cluster_config fields (founder only)
       → body: partial cluster_config fields
       → writes audit row

POST   /api/orchestrator/clusters/[id]/config/atlas/validate-url
       → validate an Atlas source URL (founder only)
       → body: { url, label }
       → HEAD request + agent relevance check
       → returns { reachable, relevant, reason }

PATCH  /api/orchestrator/clusters/[id]/feature-gates
       → update feature gates (platform_admin only)
       → body: { gates: Partial<ClusterFeatureGates>, reason?: string }
       → validates dependency rules + immutable floor
       → writes cluster_feature_gate_log rows + cluster_admin_actions row
       → returns { updated_gates: ClusterFeatureGates }

GET    /api/orchestrator/clusters/[id]/feature-gates/log
       → feature gate change history (platform_admin only)
       → returns cluster_feature_gate_log rows for this cluster

PATCH  /api/orchestrator/clusters/[id]
       → existing lifecycle transitions + new action:
       → body: { action: 'promote_to_production', reason: string }
       → clears is_test_cluster, sets test_ended_at, writes audit row
```

### 9.2 Route Guards

All orchestrator routes check:
1. User is authenticated (existing middleware)
2. User has the required role (`platform_admin` for cross-cluster routes,
   `founder`/`manager` for cluster-scoped routes)
3. For cluster-scoped routes: user is a member of that cluster with the
   required role

Role check uses `adminClient()` to bypass RLS for the role lookup,
then applies the appropriate RLS for the data query.

---

## 10. Database Migration

The migration is appended to `mvp/supabase/APPLY_NOW.sql` as a new
versioned block (v2.0). It is idempotent — safe to re-run.

Key additions:
- `clusters` table (full schema per §4.1)
- `cluster_goals` table (per §4.3)
- `cluster_config` extensions (per §4.2)
- `runtime_events` table (per `architecture/AGENT_RUNTIME.md`)
- Backfill: insert `clusters` row for `the_single_source` (status: active)
- Backfill: insert `cluster_goals` row for Sisters in Dua with current
  implied goals (derived from existing `cluster_config.free_text_guidance`)

---

## 11. Tests

Every function that touches cluster state is covered by a unit test.
Test file: `mvp/src/lib/__tests__/cluster-orchestrator.test.ts`

Test coverage required:
- `validateTransition` — all valid and invalid transitions
- `validateClusterId` — valid ids, invalid ids (too short, too long, bad chars)
- `validateCreateInput` — valid input, each validation failure case
- `buildCreateRow` — correct field values, correct defaults
- `transitionTimestamps` — correct timestamp fields per transition
- `describeStatus` — all four statuses
- `statusBadgeClasses` — all four statuses
- `parseGoals` (when implemented) — accepted directives, rejected directives,
  invariant violations, slider-ceiling violations

---

## 12. Phase 0 Scope Boundary

### In scope for Phase 0

- `clusters` table + full lifecycle (create → active → drain → destroy)
- Orchestrator board UI (cluster index, create wizard, detail page)
- Premium cluster configuration (slider, goals, Atlas controls, skills, identity)
- Combined admin navigation (role-aware tabs)
- `cluster_goals` table + goal parsing flow
- `runtime_events` table (schema only — populated by agents in Wave 1)
- Backfill for `the_single_source`
- Unit tests for all state-touching functions
- **Test cluster unit** — `is_test_cluster` flag, test purpose, test cluster badge,
  immediate destroy, promotion to production (see `TEST_CLUSTER_SPEC.md`)
- **Feature gate system** — `feature_gates` JSONB on `cluster_config`,
  `cluster_feature_gate_log` table, Feature Gates UI on cluster detail page,
  frontend + backend enforcement (see `TEST_CLUSTER_SPEC.md`)

### Stubbed for Phase 0 (schema exists, UI deferred)

- Observer Findings tab (schema exists; UI shows "Coming in Wave 1")
- Runtime tab (schema exists; UI shows "Coming in Wave 1")
- Scout Demand tab (schema exists; UI shows "Coming in Wave 2")
- Atlas Pulse review (schema exists; UI shows "Coming in Wave 3")
- Atlas feeds CRUD (schema exists; URL list editor is Phase 0; feed management UI is Wave 3)

### Phase 1 prerequisites (not in Phase 0)

- Self-serve cluster creation (founder-initiated `premium_applications` flow)
- Generic → premium upgrade path
- Multi-cluster founder selector in AdminNavbar
- Free-text guidance validator (Clio parses directives with full rejection messaging)
- Manager appointment enforcement (machine-enforced threshold at 25 members)
- Cluster vocabulary parameterisation (member noun, authority noun in prompt fragments)
- Founder-controlled feature gates (Phase 0: platform_admin only)

---

## 13. Done Criteria

Phase 0 orchestrator is complete when:

- [ ] `clusters` table live with full schema (including `is_test_cluster` columns)
- [ ] `cluster_goals` table live
- [ ] `cluster_config` extensions applied (including `feature_gates` column)
- [ ] `cluster_feature_gate_log` table live
- [ ] `runtime_events` table live (schema only)
- [ ] Backfill for `the_single_source` applied (with `is_test_cluster = true`)
- [ ] Orchestrator cluster index renders all clusters with lifecycle controls
- [ ] Test clusters show `[TEST]` badge; filter toggle works
- [ ] Create cluster wizard completes end-to-end for generic and premium
- [ ] Test cluster checkbox + feature configuration section in Step 5
- [ ] Lifecycle transitions work (create → active → drain → destroy)
- [ ] Test cluster immediate destroy works (no draining step)
- [ ] Promotion to production flow works end-to-end
- [ ] Audit row written for every transition and every gate change
- [ ] Feature Gates section on cluster detail page renders all 7 gates
- [ ] Dependency rules enforced (features_tab requires room_workshop; atlas_pulse requires sage_posting)
- [ ] Immutable floor gates shown as locked
- [ ] Frontend: all 7 components/queries respect their gate
- [ ] Backend: all 8 BullMQ jobs check their gate before executing
- [ ] Welfare jobs never gated (run regardless of feature gates)
- [ ] Premium slider renders with recommendation + preview + confirmation
- [ ] Goals flow: parse → confirm → activate end-to-end
- [ ] Atlas URL validation works (HEAD + agent check)
- [ ] Skills toggle saves to `cluster_config.enabled_skills`
- [ ] Identity editor saves to `cluster_config.public_meta`
- [ ] AdminNavbar shows Orchestrator tabs for `platform_admin`
- [ ] AdminNavbar shows Configuration tabs for `founder`
- [ ] LLM spend badge visible in top bar for all roles
- [ ] All unit tests pass (`npm test`)
- [ ] RLS verified: non-platform-admin cannot access orchestrator routes
- [ ] TypeScript compiles without errors (`npm run build`)

---

## 14. File Map

```
docs/orchestrator/
├── ORCHESTRATOR_SPEC.md              ← this file
├── CLUSTER_CREATION_WORKFLOW.md      ← step-by-step creation flow
├── CLUSTER_ADMIN_CONSOLE_SPEC.md     ← premium customisation detail
└── TEST_CLUSTER_SPEC.md              ← test cluster unit + feature gate system

mvp/src/
├── app/
│   ├── admin/
│   │   ├── orchestrator/
│   │   │   ├── page.tsx              ← cluster index board
│   │   │   ├── clusters/
│   │   │   │   ├── new/page.tsx      ← create wizard
│   │   │   │   └── [id]/page.tsx     ← cluster detail + feature gates
│   │   │   ├── findings/page.tsx     ← Observer findings (stub)
│   │   │   ├── runtime/page.tsx      ← Runtime (stub)
│   │   │   ├── skills/page.tsx       ← Skills registry
│   │   │   ├── settings/page.tsx     ← Platform settings
│   │   │   └── audit/page.tsx        ← Audit log
│   │   └── config/
│   │       ├── identity/page.tsx
│   │       ├── involvement/page.tsx
│   │       ├── goals/page.tsx
│   │       ├── skills/page.tsx
│   │       └── atlas/page.tsx
│   └── api/
│       └── orchestrator/
│           ├── clusters/
│           │   ├── route.ts          ← GET list, POST create
│           │   └── [id]/
│           │       ├── route.ts      ← GET detail, PATCH transition + promote
│           │       ├── health/route.ts
│           │       ├── feature-gates/
│           │       │   ├── route.ts  ← PATCH gates, GET log
│           │       │   └── log/route.ts
│           │       ├── goals/
│           │       │   ├── parse/route.ts
│           │       │   └── confirm/route.ts
│           │       └── config/
│           │           ├── route.ts
│           │           └── atlas/validate-url/route.ts
│           └── [future: findings, runtime, skills, settings, audit]
├── lib/
│   ├── cluster-orchestrator.ts       ← pure state machine functions
│   ├── cluster-goals-parser.ts       ← goal parsing with extended thinking
│   ├── feature-gates.ts              ← gate helpers, dependency rules, validation
│   ├── orchestrator/
│   │   └── slider-preview-strings.ts ← exact behaviour preview strings
│   └── __tests__/
│       └── cluster-orchestrator.test.ts
├── components/
│   └── admin/
│       ├── AdminNavbar.tsx           ← extended with new tabs
│       ├── orchestrator/
│       │   ├── ClusterBoard.tsx      ← cluster index table (with TEST badge)
│       │   ├── ClusterCreateWizard.tsx
│       │   ├── ClusterDetail.tsx     ← includes FeatureGatesPanel
│       │   ├── FeatureGatesPanel.tsx ← feature gate toggles
│       │   ├── LifecycleTransitionDialog.tsx
│       │   └── ClusterHealthBadge.tsx
│       └── config/
│           ├── AgentInvolvementSlider.tsx
│           ├── GoalsEditor.tsx
│           ├── AtlasSourceEditor.tsx
│           └── SkillsToggleList.tsx
└── supabase/
    └── APPLY_NOW.sql                 ← v2.0 block appended
```

---

*Orchestrator Spec · Phase 0 · 2026-05-24 (updated with test cluster unit + feature gate system)*
*Authority: subordinate to AGGILO_SOUL.md, AGGILO_PLATFORM_RULES.md, Part 6.*
*Companion specs: CLUSTER_CREATION_WORKFLOW.md, CLUSTER_ADMIN_CONSOLE_SPEC.md, TEST_CLUSTER_SPEC.md*

### Stubbed for Phase 0 (schema exists, UI deferred)

- Observer Findings tab (schema exists; UI shows "Coming in Wave 1")
- Runtime tab (schema exists; UI shows "Coming in Wave 1")
- Scout Demand tab (schema exists; UI shows "Coming in Wave 2")
- Atlas Pulse review (schema exists; UI shows "Coming in Wave 3")
- Atlas feeds CRUD (schema exists; URL list editor is Phase 0; feed management UI is Wave 3)

### Phase 1 prerequisites (not in Phase 0)

- Self-serve cluster creation (founder-initiated `premium_applications` flow)
- Generic → premium upgrade path
- Multi-cluster founder selector in AdminNavbar
- Free-text guidance validator (Clio parses directives with full rejection messaging)
- Manager appointment enforcement (machine-enforced threshold at 25 members)
- Cluster vocabulary parameterisation (member noun, authority noun in prompt fragments)

---

## 13. Done Criteria

Phase 0 orchestrator is complete when:

- [ ] `clusters` table live with full schema
- [ ] `cluster_goals` table live
- [ ] `cluster_config` extensions applied
- [ ] `runtime_events` table live (schema only)
- [ ] Backfill for `the_single_source` applied
- [ ] Orchestrator cluster index renders all clusters with lifecycle controls
- [ ] Create cluster wizard completes end-to-end for generic and premium
- [ ] Lifecycle transitions work (create → active → drain → destroy)
- [ ] Audit row written for every transition
- [ ] Premium slider renders with recommendation + preview + confirmation
- [ ] Goals flow: parse → confirm → activate end-to-end
- [ ] Atlas URL validation works (HEAD + agent check)
- [ ] Skills toggle saves to `cluster_config.enabled_skills`
- [ ] Identity editor saves to `cluster_config.public_meta`
- [ ] AdminNavbar shows Orchestrator tabs for `platform_admin`
- [ ] AdminNavbar shows Configuration tabs for `founder`
- [ ] LLM spend badge visible in top bar for all roles
- [ ] All unit tests pass (`npm test`)
- [ ] RLS verified: non-platform-admin cannot access orchestrator routes
- [ ] TypeScript compiles without errors (`npm run build`)

---

## 14. File Map

```
docs/orchestrator/
├── ORCHESTRATOR_SPEC.md              ← this file
├── CLUSTER_CREATION_WORKFLOW.md      ← step-by-step creation flow
└── CLUSTER_ADMIN_CONSOLE_SPEC.md     ← premium customisation detail

mvp/src/
├── app/
│   ├── admin/
│   │   ├── orchestrator/
│   │   │   ├── page.tsx              ← cluster index board
│   │   │   ├── clusters/
│   │   │   │   ├── new/page.tsx      ← create wizard
│   │   │   │   └── [id]/page.tsx     ← cluster detail
│   │   │   ├── findings/page.tsx     ← Observer findings (stub)
│   │   │   ├── runtime/page.tsx      ← Runtime (stub)
│   │   │   ├── skills/page.tsx       ← Skills registry
│   │   │   ├── settings/page.tsx     ← Platform settings
│   │   │   └── audit/page.tsx        ← Audit log
│   │   └── config/
│   │       ├── identity/page.tsx
│   │       ├── involvement/page.tsx
│   │       ├── goals/page.tsx
│   │       ├── skills/page.tsx
│   │       └── atlas/page.tsx
│   └── api/
│       └── orchestrator/
│           ├── clusters/
│           │   ├── route.ts          ← GET list, POST create
│           │   └── [id]/
│           │       ├── route.ts      ← GET detail, PATCH transition
│           │       ├── health/route.ts
│           │       ├── goals/
│           │       │   ├── parse/route.ts
│           │       │   └── confirm/route.ts
│           │       └── config/
│           │           ├── route.ts
│           │           └── atlas/validate-url/route.ts
│           └── [future: findings, runtime, skills, settings, audit]
├── lib/
│   ├── cluster-orchestrator.ts       ← pure state machine functions
│   ├── cluster-goals-parser.ts       ← goal parsing with extended thinking
│   ├── orchestrator/
│   │   └── slider-preview-strings.ts ← exact behaviour preview strings
│   └── __tests__/
│       └── cluster-orchestrator.test.ts
├── components/
│   └── admin/
│       ├── AdminNavbar.tsx           ← extended with new tabs
│       ├── orchestrator/
│       │   ├── ClusterBoard.tsx      ← cluster index table
│       │   ├── ClusterCreateWizard.tsx
│       │   ├── ClusterDetail.tsx
│       │   ├── LifecycleTransitionDialog.tsx
│       │   └── ClusterHealthBadge.tsx
│       └── config/
│           ├── AgentInvolvementSlider.tsx
│           ├── GoalsEditor.tsx
│           ├── AtlasSourceEditor.tsx
│           └── SkillsToggleList.tsx
└── supabase/
    └── APPLY_NOW.sql                 ← v2.0 block appended
```

---

*Orchestrator Spec · Phase 0 · 2026-05-23*
*Authority: subordinate to AGGILO_SOUL.md, AGGILO_PLATFORM_RULES.md, Part 6.*
*Next: CLUSTER_CREATION_WORKFLOW.md and CLUSTER_ADMIN_CONSOLE_SPEC.md*
