# Test Cluster Unit & Feature Gate System — Spec
## Phase 0 · Admin-Oriented Market Testing

> **Status:** Implementation-ready spec. Phase 0.
>
> **Authority:** Subordinate to `ORCHESTRATOR_SPEC.md`,
> `AGGILO_SOUL.md`, `AGGILO_PLATFORM_RULES.md`.
>
> **Scope:** Two capabilities that work together:
> 1. **Test cluster unit** — a flag on any cluster that marks it as
>    internal/admin-only. Uses the existing create-cluster workflow
>    unchanged. Members never know a cluster is a test cluster.
> 2. **Feature gate system** — per-cluster admin control over which
>    platform features are active. Applies to both test and production
>    clusters.
>
> **Key clarification:** The MVP cluster ("The Single Source" /
> Sisters in Dua) is itself a Phase 0 test cluster. Test clusters
> are not a separate product — they are the same clusters the admin
> creates via the existing workflow, with an internal flag that
> controls visibility and metrics isolation.
>
> **Location:** Spec in `docs/orchestrator/`. Code in
> `mvp/src/app/admin/orchestrator/` and `mvp/src/app/api/orchestrator/`.

---

## 0. Design Decisions

### Decision 1 — Test cluster = `is_test_cluster` flag, not a separate workflow

The existing create-cluster workflow (AGGIL parameters, type selection,
identity, premium configuration) is used unchanged. The admin simply
checks "This is a test cluster" during creation. No separate wizard.
No separate route. The flag controls downstream behaviour only.

**What the flag does:**
- Hides the cluster from member-facing discovery (AGGIL search, Scout
  suggestions, public listing)
- Excludes the cluster from platform-level Observer metrics
- Marks the cluster in the orchestrator board with a `[TEST]` badge
- Allows immediate destroy (no draining step required)

**What the flag does NOT do:**
- Change the member experience inside the cluster (members who are
  added by the admin see a normal cluster — no "test" label)
- Disable any agent or feature (that's the feature gate system)
- Prevent real LLM calls or real costs

### Decision 2 — Feature gates are per-cluster, admin-controlled, JSONB

Feature gates live in `cluster_config.feature_gates` as a JSONB
object. Platform admin sets them. Founders cannot change them in
Phase 0. Every change is logged to `cluster_feature_gate_log`.

Phase 1 migration path: the JSONB schema becomes a proper
`cluster_feature_gates` table with one row per feature per cluster,
enabling per-feature history and richer audit.

### Decision 3 — Immutable safety floor cannot be gated

Welfare detection, character protocol, and Sage→Clio soft handoff
are structurally protected. The validation layer rejects any gate
targeting them. Same constraint as the involvement slider.

### Decision 4 — Feature gates apply to both test and production clusters

The feature gate system is not test-only. A production cluster admin
may want to withhold Workshop until the cluster reaches a certain
size, or disable Clio chat for a specific cluster type. Test clusters
simply make heavy use of feature gates during validation.

---

## 1. What This Spec Covers

| Section | Covers |
|---------|--------|
| §2 | Test cluster concept — the flag, what it controls |
| §3 | Feature gate system — gatable features, interactions, defaults |
| §4 | Data model — schema additions |
| §5 | Test cluster creation (extension to existing workflow) |
| §6 | Feature gate admin UI |
| §7 | Test cluster promotion to production |
| §8 | API routes |
| §9 | Frontend enforcement |
| §10 | Backend enforcement |
| §11 | Done criteria |

---

## 2. Test Cluster Concept

### 2.1 The `is_test_cluster` flag

A test cluster is any cluster with `clusters.is_test_cluster = TRUE`.
It is created via the standard create-cluster workflow. The admin
checks a checkbox on the Review + Create step (Step 5):

```
☑ This is a test cluster
  Internal only. Not visible in member discovery.
  Excluded from platform-level metrics.
  Can be destroyed immediately without draining.
```

Everything else — AGGIL configuration, cluster type (generic or
premium), agent involvement, feature gates — is set exactly as it
would be for a production cluster.

### 2.2 What the flag controls

**Visibility:**
- Test clusters do not appear in AGGIL discovery, search, or Scout
  suggestions for members.
- Test clusters are not eligible for public listing (`is_public_listed`
  is forced to `false` while `is_test_cluster = true`).
- Test clusters appear in the orchestrator board with a `[TEST]` badge.
  All admin surfaces work normally.

**Metrics isolation:**
- Test cluster activity is excluded from Observer's platform-level
  findings (Domains 2, 3, 6, 7, 9 — growth, monetisation, overlap,
  underserved demographics, Scout pipeline).
- Test cluster activity feeds Domain 5 (Agent Performance) and
  Domain 8 (Safety) — agent quality and safety signals are valid
  even in test.
- LLM spend from test clusters is tracked separately in the LLM tab
  with a `[TEST]` label. It counts against the daily budget.

**Lifecycle:**
- Test clusters can be destroyed immediately (no draining step).
- All data is retained for audit after destruction.
- Test clusters can be promoted to production (flag cleared) — see §7.

### 2.3 The MVP cluster is a test cluster

"The Single Source" (Sisters in Dua) is the first Phase 0 test
cluster. It has `is_test_cluster = TRUE`. It is used to validate
agent behaviour, welfare protocol, feature pipeline, and the
closed-loop telemetry before scaling to generic multi-cluster Phase 1.

When Phase 1 ships and Sisters in Dua is ready for production, the
admin promotes it (clears the flag) and it becomes a live production
cluster. Until then, it is internal.

### 2.4 Test cluster naming convention

Test cluster IDs should use the `_test_` prefix by convention:
- `_test_generic_v1`
- `_test_premium_faith_v2`
- `_test_professional_network_v1`

The prefix is advisory, not enforced. The `is_test_cluster` flag is
the authoritative signal.

---

## 3. Feature Gate System

### 3.1 The gatable features

These features can be approved or withheld per cluster by the
platform admin. Each has a `gate_key` in the JSONB schema.

| Gate key | Feature | Default | What `false` means |
|----------|---------|---------|-------------------|
| `clio_fab` | Clio FAB (floating chat button) | `true` | FAB is hidden. Members cannot chat with Clio. Clio still runs welfare detection silently. |
| `sage_posting` | Sage posts to Timeline | `true` | Sage never posts to the Timeline. Sage still evaluates member posts for welfare/character. |
| `sage_at_mention` | @Sage mentions | `true` | @Sage mentions are not processed. No response is generated. |
| `room_workshop` | Room Workshop panel | `true` | Workshop panel is hidden. No cadence exchanges run. |
| `features_tab` | Features tab | `true` | Features tab is hidden. Member feature proposals are disabled. |
| `atlas_pulse` | Atlas Pulse cards in Timeline | `true` | Atlas does not brief Sage. No Pulse cards appear. |
| `vault_references` | Sage vault reference surfacing | `true` | Sage never surfaces vault entries. Sage still evaluates posts. |

### 3.2 What cannot be gated (immutable safety floor)

The validation layer rejects any attempt to gate these:

| Feature | Why it cannot be gated |
|---------|----------------------|
| Welfare detection (regex + LLM) | Platform safety floor — immutable |
| Character/good-character protocol | Platform safety floor — immutable |
| Sage→Clio soft handoff | Platform safety floor — immutable |
| Admin welfare notifications | Platform safety floor — immutable |

### 3.3 Gate dependency rules

Some gates have hard dependencies. These are enforced at the API layer:

| If this gate is `false`... | Then this gate is also forced `false` |
|---------------------------|--------------------------------------|
| `room_workshop` | `features_tab` (features tab is part of Workshop) |
| `sage_posting` | `atlas_pulse` (Pulse cards are posted by Sage) |

The admin cannot enable a dependent gate while its parent is off.
The UI shows the dependency clearly: the dependent toggle is greyed
out with a note ("Requires Room Workshop to be enabled").

### 3.4 Gate defaults

All gates default to `true` (features enabled) for both generic and
premium clusters. The admin explicitly withholds features by setting
gates to `false`.

The only exception: `public_listing` is controlled by the existing
`cluster_config.is_public_listed` field (not a feature gate). For
test clusters, `is_public_listed` is forced `false`.

### 3.5 Useful gate combinations for testing

| Combination | What it tests |
|-------------|--------------|
| All gates `true` | Full platform experience — baseline |
| `clio_fab = false` | Cluster without Clio chat — does the room sustain itself? |
| `sage_posting = false` | Cluster without any Sage presence — pure member-driven |
| `room_workshop = false` | Cluster without Workshop — simpler member experience |
| `clio_fab = false`, `room_workshop = false` | Minimal agent footprint — only welfare/character running silently |
| `sage_at_mention = false`, `sage_posting = true` | Sage posts proactively but ignores @mentions |
| `atlas_pulse = false` | Cluster without external content — vault-only references |

---

## 4. Data Model

### 4.1 `clusters` table additions

```sql
ALTER TABLE public.clusters
  ADD COLUMN IF NOT EXISTS is_test_cluster BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS test_purpose TEXT,
    -- Admin's stated purpose: "Testing generic cluster for professional
    -- network audience with Workshop disabled"
  ADD COLUMN IF NOT EXISTS test_started_at TIMESTAMPTZ,
    -- Set when cluster is created with is_test_cluster = true
  ADD COLUMN IF NOT EXISTS test_ended_at TIMESTAMPTZ;
    -- Set when promoted to production or destroyed
```

### 4.2 `cluster_config` additions

```sql
ALTER TABLE public.cluster_config
  ADD COLUMN IF NOT EXISTS feature_gates JSONB NOT NULL DEFAULT '{
    "clio_fab": true,
    "sage_posting": true,
    "sage_at_mention": true,
    "room_workshop": true,
    "features_tab": true,
    "atlas_pulse": true,
    "vault_references": true
  }'::jsonb;
```

**TypeScript type (shared package):**

```typescript
// packages/shared/src/types/feature-gates.ts

export interface ClusterFeatureGates {
  clio_fab: boolean;
  sage_posting: boolean;
  sage_at_mention: boolean;
  room_workshop: boolean;
  features_tab: boolean;
  atlas_pulse: boolean;
  vault_references: boolean;
}

export const DEFAULT_FEATURE_GATES: ClusterFeatureGates = {
  clio_fab: true,
  sage_posting: true,
  sage_at_mention: true,
  room_workshop: true,
  features_tab: true,
  atlas_pulse: true,
  vault_references: true,
};

// Gate dependency rules — enforced at API and UI layers
export const GATE_DEPENDENCIES: Partial<Record<keyof ClusterFeatureGates, keyof ClusterFeatureGates>> = {
  features_tab: 'room_workshop',  // features_tab requires room_workshop
  atlas_pulse: 'sage_posting',    // atlas_pulse requires sage_posting
};

// Gates that cannot be set to false — validation layer rejects these
export const IMMUTABLE_GATES = [
  // welfare_detection, character_protocol, sage_clio_handoff
  // are NOT in ClusterFeatureGates — they are structurally enforced
  // and never appear in the feature_gates JSONB
] as const;
```

### 4.3 `cluster_feature_gate_log` table

Audit trail for every feature gate change.

```sql
CREATE TABLE IF NOT EXISTS public.cluster_feature_gate_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id TEXT NOT NULL REFERENCES public.clusters(cluster_id),
  gate_key VARCHAR(32) NOT NULL,
  previous_value BOOLEAN NOT NULL,
  new_value BOOLEAN NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feature_gate_log_cluster
  ON public.cluster_feature_gate_log(cluster_id, created_at DESC);
CREATE INDEX idx_feature_gate_log_gate_key
  ON public.cluster_feature_gate_log(cluster_id, gate_key, created_at DESC);
```

**RLS:** `platform_admin` reads all. Founders read their own cluster.
No member access.

---

## 5. Test Cluster Creation (Extension to Existing Workflow)

The existing five-step create-cluster workflow is unchanged. One
addition is made to **Step 5 — Review + Create**:

```
Step 5 — Review + Create

[... existing summary card ...]

─────────────────────────────────────────────────────
Internal settings

☐ This is a test cluster
  When checked:
  • Not visible in member discovery or public listing
  • Excluded from platform-level metrics
  • Can be destroyed immediately (no draining required)
  • Appears with [TEST] badge in the orchestrator board

  Test purpose (optional):
  [textarea — describe what you're testing]
─────────────────────────────────────────────────────

[Create cluster]
```

**On create with `is_test_cluster = true`:**
1. INSERT into `clusters` with `is_test_cluster = true`,
   `test_started_at = NOW()`
2. INSERT into `cluster_config` with default `feature_gates`
3. INSERT into `cluster_admin_actions` (action_type: `cluster_created`,
   includes `is_test_cluster: true` in the after-state JSON)

**Feature gates at creation:**
The admin can optionally configure feature gates during creation.
A collapsible "Feature configuration" section appears after the
test cluster checkbox:

```
Feature configuration (optional — all features enabled by default)

[toggle] Clio chat (FAB)          ✅ Enabled
[toggle] Sage Timeline posts      ✅ Enabled
[toggle] @Sage mentions           ✅ Enabled
[toggle] Room Workshop            ✅ Enabled
[toggle] Features tab             ✅ Enabled  (requires Workshop)
[toggle] Atlas Pulse cards        ✅ Enabled  (requires Sage posts)
[toggle] Vault references         ✅ Enabled
```

This section is also available for production clusters (not just test
clusters). The admin can configure feature gates at creation time for
any cluster.

---

## 6. Feature Gate Admin UI

### 6.1 Location

Feature gates are managed in two places:

1. **At creation** — Step 5 of the create-cluster workflow (§5 above)
2. **Post-creation** — `/admin/orchestrator/clusters/[id]` detail page,
   "Feature Gates" section

### 6.2 Feature Gates section on cluster detail page

```
Feature Gates
─────────────────────────────────────────────────────
These settings control which platform features are active in this
cluster. Changes take effect on the next member page load.

[toggle] Clio chat (FAB)
         Members can chat with Clio via the floating button.
         ✅ Enabled

[toggle] Sage Timeline posts
         Sage posts content and references to the cluster Timeline.
         ✅ Enabled

[toggle] @Sage mentions
         Members can @mention Sage to get a direct response.
         ✅ Enabled

[toggle] Room Workshop
         The agent collaboration panel is visible to members.
         ✅ Enabled

[toggle] Features tab
         Members can see and vote on proposed features.
         ✅ Enabled  ← greyed out if Workshop is off

[toggle] Atlas Pulse cards
         Atlas-sourced content cards appear in the Timeline.
         ✅ Enabled  ← greyed out if Sage posts are off

[toggle] Vault references
         Sage surfaces verified references from the vault.
         ✅ Enabled

─────────────────────────────────────────────────────
Always active (cannot be changed):
🔒 Welfare detection
🔒 Good-character protocol
🔒 Sage → Clio soft handoff
─────────────────────────────────────────────────────

[Save changes]
```

**Save behaviour:**
1. Validate dependency rules (server-side)
2. Validate immutable floor (server-side — rejects any attempt to
   gate welfare/character/handoff even if sent directly to the API)
3. For each changed gate: INSERT into `cluster_feature_gate_log`
4. UPDATE `cluster_config.feature_gates`
5. INSERT into `cluster_admin_actions` (action_type: `feature_gates_updated`)
6. Return updated gates to client

**Reason field:**
When any gate is toggled off, a reason field appears:
```
Reason for disabling [feature name] (optional):
[text input]
```
The reason is stored in `cluster_feature_gate_log.reason`.

### 6.3 Orchestrator board — test cluster indicators

The cluster index table gains:
- `[TEST]` badge next to the cluster name for test clusters
- A "Test clusters" filter toggle (show all / production only / test only)
- The test purpose shown as a tooltip on the `[TEST]` badge

---

## 7. Test Cluster Promotion to Production

When a test cluster is ready to go live, the admin promotes it:

**Route:** PATCH `/api/orchestrator/clusters/[id]` with
`{ action: 'promote_to_production', reason: string }`

**What promotion does:**
1. Sets `clusters.is_test_cluster = FALSE`
2. Sets `clusters.test_ended_at = NOW()`
3. Clears the `_test_` prefix convention (display name unchanged;
   `cluster_id` is immutable — the prefix stays in the ID)
4. Makes the cluster eligible for AGGIL discovery and public listing
5. Includes the cluster in platform-level Observer metrics from this
   point forward (historical test data is excluded)
6. Writes `cluster_admin_actions` row (action_type: `cluster_promoted_to_production`)

**Confirmation dialog:**
```
Promote to production?

This cluster will become visible in member discovery and eligible
for public listing. Its activity will be included in platform metrics.

This cannot be undone — the cluster cannot be returned to test status.

[Cancel]  [Promote to production]
```

The irreversibility is intentional: once members discover a cluster
organically, marking it as "test" again would be misleading.

---

## 8. API Routes

```
GET    /api/orchestrator/clusters
       → existing route; add filter: ?is_test=true|false|all

POST   /api/orchestrator/clusters
       → existing route; body gains:
         is_test_cluster?: boolean
         test_purpose?: string
         feature_gates?: Partial<ClusterFeatureGates>

PATCH  /api/orchestrator/clusters/[id]/feature-gates
       → update feature gates (platform_admin only)
       → body: { gates: Partial<ClusterFeatureGates>, reason?: string }
       → validates dependencies + immutable floor
       → writes cluster_feature_gate_log rows
       → writes cluster_admin_actions row
       → returns { updated_gates: ClusterFeatureGates }

PATCH  /api/orchestrator/clusters/[id]
       → existing route; gains action: 'promote_to_production'
       → body: { action: 'promote_to_production', reason: string }
       → clears is_test_cluster, sets test_ended_at

GET    /api/orchestrator/clusters/[id]/feature-gates/log
       → feature gate change history for this cluster
       → platform_admin only
       → returns cluster_feature_gate_log rows
```

---

## 9. Frontend Enforcement

The frontend reads `cluster_config.feature_gates` and conditionally
renders components. The gates are loaded as part of the cluster
context (already fetched on cluster page mount).

```typescript
// src/lib/cluster-context.ts

interface ClusterContext {
  cluster: Cluster;
  config: ClusterConfig;
  featureGates: ClusterFeatureGates;
  // ... other context
}

// Usage in components:
// const { featureGates } = useClusterContext();
// if (!featureGates.clio_fab) return null;
```

**Per-component gate checks:**

| Component | Gate key | Behaviour when gate is `false` |
|-----------|----------|-------------------------------|
| `ClioFab.tsx` | `clio_fab` | Component returns `null` |
| `SagePost` (in feed) | `sage_posting` | Sage posts are filtered from the feed query |
| `@Sage autocomplete` | `sage_at_mention` | Autocomplete does not trigger |
| `AgentChatbox.tsx` | `room_workshop` | Component returns `null` |
| `FeaturesTab.tsx` | `features_tab` | Tab is hidden from tab bar |
| `AtlasPulseCard` (in feed) | `atlas_pulse` | Pulse cards filtered from feed query |
| Vault reference rendering | `vault_references` | `DuaReference` component returns `null` |

---

## 10. Backend Enforcement

The backend reads `feature_gates` before dispatching agent jobs.

```typescript
// apps/api/src/lib/feature-gates.ts

async function getFeatureGates(clusterId: string): Promise<ClusterFeatureGates> {
  const config = await getClusterConfig(clusterId);
  return { ...DEFAULT_FEATURE_GATES, ...config.feature_gates };
}

async function isGateEnabled(
  clusterId: string,
  gate: keyof ClusterFeatureGates
): Promise<boolean> {
  const gates = await getFeatureGates(clusterId);
  return gates[gate];
}
```

**Per-job gate checks:**

| BullMQ job | Gate check | Behaviour when gate is `false` |
|------------|-----------|-------------------------------|
| `SagePostFromAtlas` | `sage_posting` | Job exits early, no post created |
| `SageFirstPostAck` | `sage_posting` | Job exits early |
| `SageMilestoneMessage` | `sage_posting` | Job exits early |
| `SageAtMentionResponse` | `sage_at_mention` | Job exits early |
| `AtlasBriefFromSage` | `atlas_pulse` | Job exits early, no brief sent |
| `AgentChatboxExchange` | `room_workshop` | Job exits early |
| `SageSkillDialoguePost` | `room_workshop` | Job exits early |
| `ClioChatJob` (cluster-scoped) | `clio_fab` | Job still runs (welfare detection) but response is not surfaced |

**Important:** Welfare-related jobs (`ClioEphemeralWelfareEscalate`,
welfare detection in `SageEvaluatePost`) are never gated. They run
regardless of any feature gate setting.

---

## 11. Done Criteria

**Test cluster unit:**
- [ ] `is_test_cluster` column added to `clusters` table
- [ ] `test_purpose`, `test_started_at`, `test_ended_at` columns added
- [ ] Step 5 of create-cluster workflow shows test cluster checkbox
- [ ] Test clusters show `[TEST]` badge in orchestrator board
- [ ] Test clusters excluded from AGGIL discovery and Scout suggestions
- [ ] Test clusters excluded from Observer platform-level metrics (Domains 2, 3, 6, 7, 9)
- [ ] Test clusters included in Observer agent metrics (Domains 5, 8)
- [ ] Test cluster LLM spend shown separately in LLM tab
- [ ] Test clusters can be destroyed immediately (no draining required)
- [ ] Promotion to production flow works end-to-end
- [ ] Promotion is irreversible (cannot re-flag as test)
- [ ] `cluster_admin_actions` row written on create, promote, destroy

**Feature gate system:**
- [ ] `feature_gates` JSONB column added to `cluster_config`
- [ ] `cluster_feature_gate_log` table created with RLS
- [ ] Default gates (all `true`) applied on cluster creation
- [ ] Feature gates configurable at creation time (Step 5)
- [ ] Feature Gates section on cluster detail page renders all gates
- [ ] Dependency rules enforced (features_tab requires room_workshop; atlas_pulse requires sage_posting)
- [ ] Immutable floor gates shown as locked (cannot be toggled)
- [ ] Reason field appears when any gate is toggled off
- [ ] Every gate change writes to `cluster_feature_gate_log`
- [ ] Every gate change writes to `cluster_admin_actions`
- [ ] Frontend: all 7 components/queries respect their gate
- [ ] Backend: all 8 BullMQ jobs check their gate before executing
- [ ] Welfare jobs never gated (run regardless)
- [ ] `PATCH /api/orchestrator/clusters/[id]/feature-gates` validates dependencies + immutable floor
- [ ] TypeScript compiles without errors

---

*Test Cluster Unit & Feature Gate System · Phase 0 · 2026-05-24*
*Part of the orchestrator spec set. See ORCHESTRATOR_SPEC.md for the master spec.*
