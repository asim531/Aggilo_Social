# Aggilo Admin Dashboard — Implementation Spec

> **Scope:** The dashboard for the **Aggilo team** (`platform_admin`
> role in the database). Cross-cluster authority. Reads every cluster's
> data; approves Observer findings; manages Scout intelligence; oversees
> the agent runtime; tunes platform-level configuration.
>
> **Naming note:** The user-facing name of this dashboard is "Aggilo
> Admin". The DB role remains `platform_admin` (DB enums are not
> renamed cosmetically). Internal architecture text uses "Aggilo
> admin"; the role identifier in code stays `platform_admin`.
>
> **Predecessor specs:** `observer/AGGILO_OBSERVER_AGENTS.md` (the 10
> domains), `scout/AGENTS.md` (intelligence reports),
> `architecture/AGENT_RUNTIME.md` (runtime events),
> `architecture/premium_cluster_requirements.md` §10 (slider matrix).
>
> **Companion spec:** `docs/CLUSTER_ADMIN_CONSOLE_SPEC.md`
> covers the cluster-scoped Founder/Manager console (one cluster at a
> time). Both surfaces co-exist. Aggilo admins see both; cluster
> Founders/Managers see only their cluster's console.
>
> **Status:** Spec — implementation-ready. Built in a future session.

---

## Who this is for

| Role | Sees this dashboard? |
|------|----------------------|
| `platform_admin` (Aggilo team) | Yes — full access |
| `founder` (cluster admin) | No — sees the per-cluster dashboard only |
| `manager` (cluster manager) | No — sees their cluster's queues only |
| Member | No |

Access is enforced at the route layer (RLS + `profiles.role` check)
and at the page layer (route guards reject non-Aggilo-admin users).

---

## Top-level navigation

```
Aggilo Admin
├── Findings              (Observer's 10 domains; Phase 0 wave-status banner at top)
├── Demand                (Scout intelligence reports — gated to Wave 2)
├── Waitlist              (Scored waitlist submissions; invite-link generator)
├── Tool proposals        (Cross-agent capability proposals)
├── Runtime               (Agent Runtime job state, queues, errors)
├── LLM observability     (per-call logs, cost, latency, budget, prompt flows)
├── Agent reliability     (RDC / GDS / MOP metrics per agent per operation — §Reliability)
├── Clusters              (cross-cluster index)
├── Members               (cross-cluster member directory)
├── Skills registry       (platform-wide skill catalog)
├── Platform settings     (slider defaults, budget caps, source list, wave advance)
└── Audit                 (cluster_admin_actions across all clusters)
```

Default landing page is **Findings**. Most Aggilo admin work routes
through findings → approval → action.

---

## Phase 0 wave status (top of Findings tab; visible on landing)

A small banner-strip rendered at the top of the Findings tab that
reflects which waves of the agent rollout are live, per
`docs/PHASE_0_AGENT_SEQUENCING.md`. This is the dashboard's surface
for the wave-rollout state — it tells the Aggilo team at a glance
which capabilities are active and how close the next wave is.

```
Wave 1 — Observer:  ✅ Live (since 2026-XX-XX)
Wave 2 — Scout:     🚧 In progress  (Wave 1 observed 8 of 14 days)
Wave 3 — Atlas:     ⏳ Not started
```

Per-wave row carries:

- **Status icon:** ✅ live / 🚧 in progress / ⏳ not started.
- **Wave name and component.**
- **Activation date** (live waves) OR **observation progress** (the
  in-progress wave) OR **next-eligible-date** (not-started waves).
- **Tap-to-detail:** opens a panel showing the wave's done-criteria
  checklist and behavioural-validation telemetry.

When a wave is `not started`, the dashboard tabs gated to that wave
render as "Coming in Wave N" with a brief explanation. Specifically:

- **Demand** tab is gated to Wave 2 (Scout).
- **Pulse** review section in cluster pages is gated to Wave 3 (Atlas).
- **Domain 9** and **Domain 10** of Findings are gated to their
  respective waves (Domain 9 = Wave 2; Domain 10 = Wave 3 + Wave 1).

Wave-status state is read from a new platform setting:

| Setting | Type | Values |
|---------|------|--------|
| `phase_0_wave_status` | JSON | `{ wave_1: {status, since}, wave_2: {status, since|observation_started_at}, wave_3: {status, since} }` |

The Aggilo admin dashboard's Settings tab (§Platform settings) lets
the team advance a wave once its done-criteria checklist passes and
the observation gate clears.

---

## Findings (Observer's 10 domains)

The single most-used surface. Reads from `observer_findings`. Default
filter: `status = 'pending'`, sorted by severity DESC then
`created_at` DESC.

### Top strip

```
🔴 Critical (3)   🟠 High (12)   🟡 Medium (47)   ⚪ Low (118)
```

Tap any tier to filter. Counts are live (Realtime subscription on
`observer_findings` INSERTs filtered to `status = 'pending'`).

### Domain filter

A horizontal pill row below the severity strip:

```
All  | Cluster Health  | Growth & Retention  | Monetisation  |
Crowdfund  | Agent Performance  | Content Gaps  |
Underserved Demographics  | Safety & Abuse  | Scout Pipeline  |
Tool Analysis Triggers
```

Each pill carries the count for that domain at the current severity
filter.

### Finding card

Each finding renders as a card with:

- **Severity dot** (🔴 critical / 🟠 high / 🟡 medium / ⚪ low)
- **Domain label**
- **Title** (one line, the finding's `title` field)
- **Observation text** (collapsible — first 3 lines visible, "Read
  more" expands to full)
- **Suggested action** — rendered as a primary button when
  `action_requires_approval = true`
- **Confidence** (e.g. "0.87" — small, secondary)
- **Related cluster** (link to the cluster's per-cluster admin
  dashboard, when applicable)
- **Actions:**
  - `Approve & trigger` — primary; runs the suggested action job
  - `Approve without action` — secondary; marks the finding
    `actioned` without triggering a job (informational findings)
  - `Reject` — destructive-secondary; marks `rejected`, finding
    archives
  - `Postpone 24h` — soft option for deferring; finding moves to
    bottom of queue without changing status

Approval writes to `observer_findings.admin_decision_at`,
`admin_decision_by`, and (when applicable) `job_triggered_at`.

### Action triggers

Per the Observer spec's action table — these are the jobs that fire
when admin approves:

| Suggested action | Job triggered |
|---|---|
| `trigger_sage_intervention_brief` | `SageInterventionJob` (medium lane) |
| `enable_crowdfund_prompt_for_cluster` | `SageCrowdfundPromptJob` (medium) |
| `temporary_account_flag_pending_review` | `AccountSafetyFlagJob` (high) |
| `propose_clio_tool` | `CliToolProposalJob` (medium) |
| `trigger_sage_tool_analysis_for_atlas` | `SageToolAnalysisJob` (low) |
| `trigger_clio_tool_analysis_for_sage` | `ClioToolAnalysisJob` (low) |
| `trigger_clio_tool_analysis_for_scout` | `ClioToolAnalysisJob` (low) |
| `expand_atlas_source_list` | Admin config change (no job) |
| `add_telugu_sources_to_atlas` | Admin config change (no job) |
| `recommend_cluster_creation_to_admin` | Notification only |
| `create_cluster_prompt_to_admin` | Notification only |
| `review_scout_finding_for_action` | Notification only |
| `flag_for_product_roadmap` | Notification only |

Every approval also writes a row to `cluster_admin_actions` with
`actor_role = 'platform_admin'`.

### Daily digest

The dashboard also has a **Daily Digest** view (button, top right)
that renders the output of `ObserverDailyDigest` — the 07:00 summary
job. Same content, summarised. Useful for catching up after time
away.

---

## Demand (Scout intelligence reports)

Reads from `scout_intelligence_reports`. Three tabs:

### Active reports

`status = 'active'`, default sort by `confidence` DESC.

Each report card:

- **Signal type pill** (`people_discovery` / `community_discovery` /
  `gap_intelligence`)
- **Mode pill** (`observation` / `inference` / `hybrid`)
- **Title**
- **Evidence summary** (PII-free paraphrased pattern)
- **Geographic + interest tags**
- **Confidence** (and ceiling indicator if Mode B inference)
- **Matching clusters** (links if non-empty)
- **Unmet need** (if specified)
- **Recommended action** dropdown
- **Actions:**
  - `Action this report` (per the recommended_action)
  - `Mark stale` (overrides the 30-day stale window)
  - `Dismiss`

### Calibration history

Reads from `scout_calibration_history`. Shows monthly job results:
accuracy by platform, confidence adjustments, communities that
converted.

### Directed discovery

Form to submit a `ScoutDirectedJob` manually:

- Search interest (text)
- Search geography (text)
- Urgency (low / medium)
- Context (text)

Submitting writes the job to the `low` lane.

---

## Tool proposals

Reads from `tool_proposals`. Three tabs:

- **Pending review** (`status = 'pending'`)
- **Active** (`status = 'active'`)
- **Retired** (`status = 'retired'`)

Each proposal card:

- **Proposed by** (which agent)
- **Target agent** (which agent gains the tool)
- **Cluster scope** (specific cluster or platform-wide)
- **Tool name**
- **Proposal doc link** (opens the markdown file from
  `maintenance/[YYYY-MM]/`)
- **Actions:**
  - `Approve & activate` — sets `status = 'active'`, `activated_at`
  - `Reject` — sets `status = 'rejected'`
  - `Retire` (active proposals only) — sets `status = 'retired'`,
    `retired_at`

When a proposal is approved, the platform's tool-loader
(`context/tool_loader.py` or its production equivalent) picks it up at
the next agent dispatch for the target agent.

---

## Runtime

Reads from `runtime_events`. Four sub-tabs:

### Live (default)

Real-time feed of dispatched and completed jobs across all lanes.
Subscribed to `runtime_events` INSERT.

Filters:

- Lane (critical / high / medium / low / all)
- Agent (sage / clio / atlas / scout / observer / all)
- Status (dispatched / completed / failed / timed_out / rejected /
  all)
- Cluster (dropdown of registered clusters / all)

### Queues

Current queue depth per lane. Backlog warnings if any lane exceeds
its SLA.

### Errors

`status IN ('failed', 'timed_out', 'rejected')` filtered to last 24h.
Each row links to the related `llm_response_logs` row (when LLM was
involved) and to the related cluster.

### Historical

Aggregate stats over a selectable time window (24h / 7d / 30d):

- Jobs dispatched
- Median + p95 + p99 duration per lane
- Failure rate per agent
- Idempotency collision count
- Budget-exceeded count per agent

These are the metrics Observer Domain 5 reads for findings; this view
is the human-facing one.

---

## LLM observability

Reads from `llm_response_logs`. The most detailed surface for
Aggilo-admin debugging.

### Top-level KPIs

- **Today's spend** (USD, against `LLM_DAILY_BUDGET_USD`)
- **Today's call count**
- **p95 latency** (across all calls)
- **Error rate** (last 24h)

### Detail table

Filterable by agent, operation_key, status, cluster. Each row:

- timestamp, agent, operation_key, cluster_id, related_post_id (link
  if applicable)
- status, cost_estimate_usd, latency_ms, retry_count
- request preview (first 200 chars of `request` JSON)
- response preview (first 200 chars of `response_content`)
- "View full" — opens the row's detail modal

### Detail modal

Full request + response JSON. The full system message stack (showing
the three-layer inheritance — super-prompt + agent character +
cluster fragment — confirms layer-3 cosmology delivery). Detail-modal
view is read-only.

> **See also §LLM Observability — Prompt Flows (expanded)** below for the full detail modal spec: 4-layer token attribution panel, reasoning traces, compaction event display, timeline stamps, and meltdown detection alerts. The expanded section supersedes the detail-modal description above.

---

## Clusters

Cross-cluster index. Each cluster:

- `cluster_id`, display name, type (premium / generic), status
  (active / paused / archived)
- Active member count, growth this week
- Current `agent_involvement` setting
- Open Observer findings count
- Open welfare alerts count
- Last cadence exchange timestamp
- Link to per-cluster admin dashboard

Sortable by any column; filterable by type / status.

---

## Members

Platform-wide member directory. Used sparingly — most member work
happens at cluster scope. Aggilo-admin scope exists for:

- Welfare cross-cluster correlation (a member with welfare flags in
  multiple clusters)
- Account safety review (a member flagged by Domain 8)
- Cross-cluster `cluster_admin_actions` audit

Each row: `user_id`, nickname, registered_at, cluster memberships,
role(s), welfare flag count (last 90d), character concern count (last
90d).

PII handling: nickname only. Real-name lookups require a separate
data-access flow per platform privacy policy.

---

## Skills registry

Reads from `skill_registry`. Each row:

- skill_id, display_name, description, target_agent
- default_enabled, premium_only
- cost_per_invocation_estimate
- Active in N clusters

Actions:

- Add new skill
- Edit existing skill
- Retire skill (sets `default_enabled = FALSE`; existing clusters
  using it are notified)

---

## Platform settings

The Aggilo-admin-only configuration surface:

- `LLM_DAILY_BUDGET_USD`
- Default `agent_involvement` per cluster type
- Default `domain_sensitivity` per cluster type
- Atlas source list (curated by domain)
- Scout community list (subreddits etc.)
- Observer cadence overrides per domain
- `ATLAS_CRON_SECRET` rotation
- Realtime channel topology (Phase 1 multi-tenant prep)

Every change writes to `cluster_admin_actions` with
`actor_role = 'platform_admin'` and `cluster_id = NULL` (platform-
wide change).

---

## Audit

Reads from `cluster_admin_actions`. Filterable by:

- Actor role
- Action type
- Cluster
- Date range

Read-only. The audit log is append-only across the platform; nothing
in this view edits a row.

---

## Database state

All tables already exist in schema (per V3.5–V3.7 migrations):

- `observer_findings` (V3.7-equivalent — currently in code; verify
  schema applied)
- `tool_proposals` (V3.7-equivalent)
- `runtime_events` (new — V3.14 schema; per
  `architecture/AGENT_RUNTIME.md`)
- `scout_intelligence_reports` (new — Wave 2 schema)
- `scout_calibration_history` (new — Wave 2 schema)
- `cluster_config` (V3.5)
- `cluster_admin_actions` (V3.5)
- `skill_registry` (V3.5)
- `llm_response_logs` (V3.0)
- `behavioural_events` (V3.0)

Schema migrations land alongside each Wave (Observer = Wave 1, Scout =
Wave 2, Atlas = Wave 3).

---

## RLS

Aggilo-admin RLS is straightforward: every read on every table is
allowed for `profiles.role = 'platform_admin'`. Writes are constrained
to the actions described in this spec (approvals, settings updates,
manual job triggers). All writes pass through API routes that
validate role + log to `cluster_admin_actions`.

---

## Waitlist

> **Source spec:** `docs/WAITLIST_INTELLIGENCE_SPEC.md` (full scoring pipeline, form data, DeepSeek API integration). This section covers the admin dashboard surface only.

Reads from `waitlist_submissions`. Two sub-tabs:

### Find My People (mypeople@aggilo.in submissions)

Each submission card:

- **Name, email** (visible to platform_admin only — PII gate)
- **Demographic tags:** birth year, life cohort, gender, languages, interest domain, location
- **Score panel (4 dimensions):** Intent Signal, Cluster Fit, Urgency, Authenticity — each 0–10, sourced from DeepSeek scoring at submit time
- **LLM reasoning summary** (collapsible — the score justification from DeepSeek, max 3 sentences)
- **Status pill:** `new` / `reviewed` / `invited` / `joined` / `declined`
- **Actions:**
  - `Generate invite link` — constructs the pre-fill URL (`?email=X&gender=Y&birth_year=Z&country=W`) with the matching cluster slug. Admin copies and sends manually.
  - `Mark as reviewed` — changes status to `reviewed` without inviting
  - `Decline` — marks `declined`; removes from active view

### Make Your Crowd (mycrowd@aggilo.in submissions)

Same card format with BYC-specific fields (niche description, target demographic, involvement level, feasibility score instead of intent signal).

### Conversion tracking

Below both tabs: a summary strip:

```
Submitted: 143    Invited: 67    Joined: 41    Conversion: 61%
```

This is the single most important growth metric for Phase 0. It tells the admin how many invited waitlist users actually completed onboarding. Low conversion → investigate the invite link flow or the pre-fill path.

---

## LLM Observability — Prompt Flows (expanded)

The existing LLM observability surface (per-call logs, cost, latency) is augmented with a **Prompt Flow** view per call.

### Prompt Flow detail modal (per call)

Each `llm_response_logs` row detail modal now shows:

**Layer attribution panel** (collapsible, labelled sections):

```
┌─ Layer 1: Platform Super-Prompt ──────────────────── 523 tokens ─┐
│  [view] [copy]                                                     │
└────────────────────────────────────────────────────────────────────┘
┌─ Layer 2: Agent Character (Clio) ─────────────────── 791 tokens ─┐
│  [view] [copy]                                                     │
└────────────────────────────────────────────────────────────────────┘
┌─ Layer 3: Cluster Identity (long-conversation) ────── 388 tokens ─┐
│  [view] [copy]                                                     │
└────────────────────────────────────────────────────────────────────┘
┌─ Layer 4: Per-call Signals ────────────────────────── 1,204 tokens ┐
│  History: 8 turns (892t) · Welfare flags: 0 · @mentions: 0        │
│  User message: 62 tokens                                          │
│  [view] [copy]                                                     │
└────────────────────────────────────────────────────────────────────┘
Total context: 2,906 tokens / 4,096 target ceiling
```

The total bar turns amber above 80% of the context ceiling, red above 95%. This is the admin-visible signal for context rot risk (see `clio/AGENTS.md §Context Engineering Rules`).

**Compaction events:** When a call's `request_type = 'clio_compaction'`, the detail modal shows the pre-compaction history length and post-compaction summary length side by side. This lets admin verify compaction is working as intended.

**Extended thinking (reasoning trace):** When a call uses extended thinking mode (Observer introspection, agent goal parsing, Atlas source validation), the reasoning trace is stored in `llm_response_logs.reasoning_trace` (JSON) and shown in the detail modal as a collapsible "Reasoning" section. The admin can read the model's step-by-step reasoning before the output — this is the primary debugging surface for unexpected agent decisions.

**Timeline stamps:** The detail modal shows a micro-timeline:

```
Request assembled  09:42:00.124
LLM call sent      09:42:00.281  (+157ms assembly)
First token        09:42:01.644  (+1,363ms TTFT)
Response complete  09:42:04.912  (+3,268ms generation)
Validator pass     09:42:04.988  (+76ms validation)
Total              09:42:04.988  (4,864ms end-to-end)
```

### Meltdown detection

When an `operation_key` fails the server-side validator twice in a row (retry 1 + retry 2 both fail), this is logged as a `micro_meltdown` event in `llm_response_logs.meta`. The LLM observability tab surfaces these prominently:

```
⚠ 3 meltdown events in the last 1h  (operation: clio_cluster_chat · cluster: sisters-in-dua)
```

Three meltdowns per operation key per hour auto-creates an Observer Domain 5 finding. The admin sees the finding in the Findings tab and can drill to the raw LLM logs.

---

## Agent Reliability

> **Source:** "Beyond pass@1: A Reliability Science Framework for Long-Horizon LLM Agents" (Khanal, Tao, Zhou — arXiv:2603.29231). Applied to Aggilo's per-agent, per-operation monitoring.

Reads from `llm_response_logs` (aggregated by operation_key + agent + time window). Four metrics displayed per operation:

| Metric | What it measures | How it's calculated |
|--------|-----------------|---------------------|
| **RDC — Reliability Decay Curve** | How quickly reliability drops as session length (turn count) grows | Pass rate by turn bucket: 1-5 turns, 6-10, 11-15, 16-20, 20+ |
| **VAF — Variance Amplification Factor** | How much output variance increases under longer sessions | Std deviation of validator score by turn bucket |
| **GDS — Graceful Degradation Score** | When the agent fails, does it fail gracefully or catastrophically? | Ratio of (soft failures + fallbacks) to (hard failures + meltdowns) |
| **MOP — Meltdown Onset Point** | At what turn count does meltdown rate spike? | First turn bucket where meltdown rate exceeds 5% |

### View

Filterable by:
- Agent (Clio / Sage / Atlas / Scout / Observer)
- Operation key (e.g. `clio_cluster_chat`, `sage_post_generation`, `atlas_scoring`)
- Time window (7d / 30d / 90d)

Each operation row shows:

```
clio_cluster_chat    GDS: 0.89 ✅    MOP: turn 18 🟡    VAF: low ✅    RDC: stable ✅
sage_post_generation GDS: 0.94 ✅    MOP: n/a ✅        VAF: low ✅    RDC: stable ✅
atlas_scoring        GDS: 0.71 🟡    MOP: turn 6 🔴     VAF: high 🟡   RDC: decay 🟠
```

**Alert thresholds:**
- GDS < 0.70 → 🔴 Observer Domain 5 finding auto-created
- MOP < turn 10 → 🔴 Observer Domain 5 finding auto-created (agent is spiralling too early)
- GDS 0.70-0.80 → 🟡 dashboard warning, no auto-finding
- RDC decay > 15% drop between buckets → 🟠 amber indicator

The admin can click any operation row to see the full breakdown chart and drill to the failing individual calls in the LLM observability tab.

### Model reliability vs. capability

The table includes a **Model** column showing which LLM was used for each operation key. This creates a cross-reference: if changing a model (via `llm_routing_config`) causes GDS to drop, the admin sees it here. The correct model choice is the most reliable for this specific operation, not the most capable on benchmarks.

---

## Out of scope for this spec

- **Visual design system.** The dashboard inherits the platform's
  existing accent-colour budget (six accents, see
  `mobile_screen_prompts_phase1.md` §G). Specific layout, typography,
  and motion belong in a UI-design pass after the spec is approved.
- **Mobile-specific dashboard.** Aggilo admin is desktop-first.
  Mobile is read-only viewing of the daily digest; full management
  workflow stays desktop.
- **Real-time member-content moderation.** This dashboard observes;
  per-post moderation actions live in the per-cluster dashboard.

---

## Done criteria

The Aggilo admin dashboard ships as a single Next.js app section
under `/admin/aggilo/*`. Done when:

- [ ] All 12 navigation sections render correctly
- [ ] Findings tab supports filter, approval, and rejection end-to-end
- [ ] Demand tab supports active/calibration/directed flows
- [ ] Waitlist tab: scoring panel, invite-link generator, conversion tracking strip
- [ ] Tool proposals tab supports approve/activate/retire
- [ ] Runtime tab live-feeds dispatch + completion events
- [ ] LLM observability shows full 4-layer system-message stack with token counts per layer
- [ ] LLM observability detail modal shows timeline stamps (assembly → TTFT → generation → validation)
- [ ] LLM observability shows reasoning traces for extended-thinking calls
- [ ] LLM observability shows compaction event summaries
- [ ] Meltdown detection alerts surface on LLM observability tab (3/hour threshold)
- [ ] Agent reliability tab shows RDC / VAF / GDS / MOP per operation key with correct alert thresholds
- [ ] Clusters index links to per-cluster dashboards
- [ ] Audit log is append-only and queryable
- [ ] Settings changes write to `cluster_admin_actions`
- [ ] RLS verified — non-Aggilo-admin users get 403 on every route

---

*Spec ready for implementation in a future session. ~3 weeks of
focused dev work for the full surface; the Findings + Runtime + LLM
observability subset is the minimum viable for Wave 1 ship.*
