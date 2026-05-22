# Platform Admin Dashboard — Implementation Spec

> **Scope:** The dashboard for **platform administrators** (the Aggilo
> team). Cross-cluster authority. Reads every cluster's data; approves
> Observer findings; manages Scout intelligence; oversees the agent
> runtime; tunes platform-level configuration.
>
> **Predecessor specs:** `observer/AGGILO_OBSERVER_AGENTS.md` (the 10
> domains), `scout/AGENTS.md` (intelligence reports),
> `architecture/AGENT_RUNTIME.md` (runtime events),
> `architecture/premium_cluster_requirements.md` §10 (slider matrix).
>
> **Companion spec:** `docs/PREMIUM_CLUSTER_ADMIN_DASHBOARD_SPEC.md`
> covers the cluster-scoped admin dashboard (one cluster at a time).
> Both dashboards co-exist. Platform-admins see both; cluster-admins
> see only the premium-cluster dashboard.
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
and at the page layer (route guards reject non-platform-admin users).

---

## Top-level navigation

```
Platform Admin
├── Findings              (Observer's 10 domains)
├── Demand                (Scout intelligence reports)
├── Tool proposals        (Cross-agent capability proposals)
├── Runtime               (Agent Runtime job state, queues, errors)
├── LLM observability     (per-call logs, cost, latency, budget)
├── Clusters              (cross-cluster index)
├── Members               (cross-cluster member directory)
├── Skills registry       (platform-wide skill catalog)
├── Platform settings     (slider defaults, budget caps, source list)
└── Audit                 (cluster_admin_actions across all clusters)
```

Default landing page is **Findings**. Most platform-admin work routes
through findings → approval → action.

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
platform-admin debugging.

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
happens at cluster scope. Platform-admin scope exists for:

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

The platform-admin-only configuration surface:

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

Platform-admin RLS is straightforward: every read on every table is
allowed for `profiles.role = 'platform_admin'`. Writes are constrained
to the actions described in this spec (approvals, settings updates,
manual job triggers). All writes pass through API routes that
validate role + log to `cluster_admin_actions`.

---

## Out of scope for this spec

- **Visual design system.** The dashboard inherits the platform's
  existing accent-colour budget (six accents, see
  `mobile_screen_prompts_phase1.md` §G). Specific layout, typography,
  and motion belong in a UI-design pass after the spec is approved.
- **Mobile-specific dashboard.** Platform admin is desktop-first.
  Mobile is read-only viewing of the daily digest; full management
  workflow stays desktop.
- **Real-time member-content moderation.** This dashboard observes;
  per-post moderation actions live in the per-cluster dashboard.

---

## Done criteria

The platform admin dashboard ships as a single Next.js app section
under `/admin/platform/*`. Done when:

- [ ] All 10 navigation sections render correctly
- [ ] Findings tab supports filter, approval, and rejection end-to-end
- [ ] Demand tab supports active/calibration/directed flows
- [ ] Tool proposals tab supports approve/activate/retire
- [ ] Runtime tab live-feeds dispatch + completion events
- [ ] LLM observability shows full system-message stack in detail
      modal (verifies V3.12 inheritance contract)
- [ ] Clusters index links to per-cluster dashboards
- [ ] Audit log is append-only and queryable
- [ ] Settings changes write to `cluster_admin_actions`
- [ ] RLS verified — non-platform-admin users get 403 on every route

---

*Spec ready for implementation in a future session. ~3 weeks of
focused dev work for the full surface; the Findings + Runtime + LLM
observability subset is the minimum viable for Wave 1 ship.*
