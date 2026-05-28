# Observer Stewardship — Autonomous Agency Mechanics

> **Status:** Phase 1 architecture. Not yet implemented.
>
> **Authority:** Subordinate to `AGGILO_SOUL.md`,
> `AGGILO_PLATFORM_RULES.md`, and `observer/AGGILO_OBSERVER_AGENTS.md`.
> This document extends Observer's capabilities beyond the original
> finding-and-approve model. Nothing here overrides the 10-domain
> observation spec or the welfare routing rules.
>
> **Concept layer:** `architecture/PLATFORM_AGENCY.md`
> **Communication patterns:** `architecture/AGENT_COMMUNICATION_CONTRACT.md`
> **Runtime layer:** `architecture/AGENT_RUNTIME.md`

---

## What This Document Covers

Observer's original design (Channel 2) is finding-and-approve:
Observer detects, admin decides, jobs trigger. That model is unchanged
and documented in `AGGILO_OBSERVER_AGENTS.md`.

This document specifies Channel 1: **autonomous stewardship** —
Observer's ability to act directly on prompt layers within defined
boundaries, with admin notification and a veto window.

---

## The Three-Tier Autonomy Model

Not all Observer actions carry the same risk. The right design is
three tiers based on blast radius and reversibility:

| Tier | Model | Veto window | Used for |
|------|-------|-------------|----------|
| **1** | Immediate + veto window | 30 minutes | Low blast radius, fully reversible |
| **2** | Staged (next agent cycle) + veto window | Until next cycle | Platform-wide effect, needs more time |
| **3** | Approval-gated (Channel 2, unchanged) | N/A — admin must approve | High blast radius, structural, welfare |

### Tier 1 — Immediate with veto window

Observer applies the change immediately. Admin is notified via
realtime push to the Observer Stewardship dashboard. Admin has 30
minutes to veto. If no veto: change commits. If vetoed: change rolls
back and escalates to Tier 3.

**Used for:**
- Update Sage's cluster persona register or formality (Layer 3)
- Refine Clio's cluster context fragment (Layer 3)
- Update per-call signals — vault context, post window (Layer 4)
- Inject a `clio_observer_signal` (Layer 4, TTL-bounded)

### Tier 2 — Staged with veto window

Observer queues the change for the next scheduled agent cycle. Admin
is notified. Veto window = time until next cycle. Gives admin more
time without blocking the action indefinitely.

**Used for:**
- Update agent character prompt (Layer 2) — affects all clusters
- Add a cluster to Observer's monitoring scope

### Tier 3 — Approval-gated (Channel 2, unchanged)

Observer surfaces a finding. Admin approves or rejects. No autonomous
action.

**Always Tier 3 (non-negotiable):**
- Welfare signals — always to admin, no autonomy
- Account safety flags
- Cluster creation or destruction
- Capability extensions (tool proposals)
- Any action vetoed 3+ times for the same cluster/action-type
- Observer's own introspection prompt — cannot self-modify

---

## Tier Assignment by Action Type

| Action | Tier | Rationale |
|--------|------|-----------|
| Update Sage cluster persona register/formality | 1 | Reversible, one cluster |
| Refine Clio cluster context fragment | 1 | Reversible, one cluster |
| Update per-call signal window (vault, posts) | 1 | Ephemeral by nature |
| Inject `clio_observer_signal` | 1 | TTL-bounded, auto-expires |
| Update agent character prompt (Layer 2) | 2 | All clusters affected |
| Propose new tool for any agent | 3 | Capability extension |
| Trigger Sage intervention in a cluster | 3 | Live member experience |
| Account safety flag | 3 | Affects a real person |
| Welfare signal | 3 | Always admin, always |
| Cluster creation / destruction | 3 | Structural |

---

## Database Schema

### `observer_prompt_updates`

Every Observer-initiated prompt update creates a row here. Append-only.

```sql
CREATE TABLE observer_prompt_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What was updated
  target_agent VARCHAR(32) NOT NULL,
  -- 'sage' | 'clio' | 'atlas' | 'scout'
  target_layer SMALLINT NOT NULL,
  -- 2 | 3 | 4
  cluster_id TEXT REFERENCES clusters(cluster_id),
  -- NULL for Layer 2 (platform-wide); required for Layer 3 and 4

  -- The update
  update_type VARCHAR(64) NOT NULL,
  -- 'persona_register' | 'persona_formality' | 'cluster_context_fragment'
  -- | 'per_call_signal_window' | 'agent_character_refinement'
  previous_value JSONB NOT NULL,
  proposed_value JSONB NOT NULL,
  rationale TEXT NOT NULL,           -- Observer's reasoning (≤500 tokens)

  -- Context that informed this update
  cluster_context_snapshot JSONB,
  -- { arc_phase, member_count, post_themes[], welfare_flag_count_30d,
  --   atlas_acceptance_rate, sage_silence_rate, engagement_delta_pct }
  observer_finding_id UUID REFERENCES observer_findings(id),

  -- Autonomy tier and veto window
  autonomy_tier SMALLINT NOT NULL,   -- 1 | 2 | 3
  veto_window_minutes INT NOT NULL,
  veto_deadline_at TIMESTAMPTZ,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  -- 'pending' | 'committed' | 'vetoed' | 'rolled_back'

  -- Admin interaction
  admin_notified_at TIMESTAMPTZ,
  admin_action_at TIMESTAMPTZ,
  admin_action_by UUID REFERENCES profiles(id),
  admin_veto_reason TEXT,

  -- Outcome tracking (populated 7 days post-commit)
  committed_at TIMESTAMPTZ,
  rolled_back_at TIMESTAMPTZ,
  outcome_signal JSONB,
  -- { metric, before_value, after_value, delta, assessment }

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_observer_prompt_updates_pending
  ON observer_prompt_updates(status, veto_deadline_at)
  WHERE status = 'pending';

CREATE INDEX idx_observer_prompt_updates_cluster
  ON observer_prompt_updates(cluster_id, created_at DESC);
```

### `clio_observer_signals`

Observer injects ephemeral signals into Clio's Layer 4 context.
The Clio builder reads active signals for the current cluster and
injects them as a structured block. Signals auto-expire via TTL.

```sql
CREATE TABLE clio_observer_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id TEXT REFERENCES clusters(cluster_id),
  -- NULL = platform-wide; set = cluster-scoped

  signal_type VARCHAR(64) NOT NULL,
  -- 'engagement_context' | 'arc_phase_note' | 'member_pattern_note'
  -- | 'content_gap_note' | 'cluster_health_note'

  signal_content JSONB NOT NULL,
  -- { "note": "plain-language observation for Clio's context" }

  -- Provenance
  observer_prompt_update_id UUID REFERENCES observer_prompt_updates(id),
  observer_finding_id UUID REFERENCES observer_findings(id),

  -- Lifecycle
  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ,
  deactivated_reason VARCHAR(64)
  -- 'expired' | 'vetoed' | 'superseded' | 'admin_removed'
);

CREATE INDEX idx_clio_observer_signals_active
  ON clio_observer_signals(cluster_id, active, expires_at)
  WHERE active = TRUE;
```

### `observer_cluster_context`

Observer's rolling memory of what it has found and done per cluster.
Prevents re-detecting the same pattern without context of prior actions.

```sql
CREATE TABLE observer_cluster_context (
  cluster_id TEXT PRIMARY KEY REFERENCES clusters(cluster_id),
  last_finding_per_domain JSONB DEFAULT '{}'::jsonb,
  -- { "cluster_health": { finding_id, actioned_at, outcome }, ... }
  pattern_flags JSONB DEFAULT '[]'::jsonb,
  -- [{ domain, pattern, first_detected_at, occurrence_count }]
  last_introspection_at TIMESTAMPTZ,
  last_introspection_priority_score NUMERIC,
  last_updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `cluster_prompt_versions`

Every prompt state is versioned. Rollback restores to a specific
version, not just the previous value.

```sql
CREATE TABLE cluster_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id TEXT NOT NULL REFERENCES clusters(cluster_id),
  target_agent VARCHAR(32) NOT NULL,
  target_layer SMALLINT NOT NULL,
  version INT NOT NULL,
  content JSONB NOT NULL,
  changed_by VARCHAR(32) NOT NULL,  -- 'observer' | 'admin' | 'system'
  change_source_id UUID,
  -- observer_prompt_updates.id or cluster_admin_actions.id
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cluster_id, target_agent, target_layer, version)
);
```

### `observer_rejected_proposals`

Every proposed update that failed Platform Rules validation or the
minimality test is logged here. Admin can see what Observer considered
but did not act on.

```sql
CREATE TABLE observer_rejected_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id TEXT REFERENCES clusters(cluster_id),
  target_agent VARCHAR(32) NOT NULL,
  update_type VARCHAR(64) NOT NULL,
  proposed_value JSONB NOT NULL,
  rejection_reason TEXT NOT NULL,
  violated_rule VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `observer_learnings`

Cross-cluster learning: Observer accumulates evidence about what
prompt patterns work for which cluster types and arc phases.

```sql
CREATE TABLE observer_learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_type VARCHAR(32),
  arc_phase VARCHAR(2),
  action_type VARCHAR(64),
  action_pattern JSONB,
  outcome_delta NUMERIC,
  sample_size INT DEFAULT 1,
  confidence NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## The Veto Window Mechanism

```typescript
// apps/api/src/workers/observer-prompt-steward.ts

async function executePromptUpdate(update: ObserverPromptUpdate): Promise<void> {
  if (update.autonomy_tier === 1) {
    await applyPromptUpdate(update);
    await notifyAdmin(update, 'applied_pending_veto');
    await scheduleVetoWindowClose(update.id, update.veto_window_minutes);
  } else if (update.autonomy_tier === 2) {
    await queueForNextCycle(update);
    await notifyAdmin(update, 'queued_pending_veto');
  }
}

async function handleAdminVeto(
  updateId: string, adminId: string, reason: string
): Promise<void> {
  const update = await getPromptUpdate(updateId);
  if (update.status !== 'pending') throw new Error('Veto window closed');

  // Roll back to previous version
  await applyPromptUpdate({ ...update, proposed_value: update.previous_value });
  await updatePromptUpdateStatus(updateId, 'vetoed', { admin_action_by: adminId, admin_veto_reason: reason });

  // Escalate to Tier 3
  await createObserverFinding({
    domain: 'tool_analysis', severity: 'medium',
    title: 'Admin vetoed Observer prompt update — escalated for review',
    suggested_action: 'review_observer_prompt_update',
    action_requires_approval: true,
  });
}

async function closeVetoWindow(updateId: string): Promise<void> {
  const update = await getPromptUpdate(updateId);
  if (update.status === 'pending') {
    await updatePromptUpdateStatus(updateId, 'committed', { committed_at: new Date() });
    await scheduleOutcomeTracking(updateId, 7); // 7-day outcome check
  }
}
```

### Early warning rollback (48-hour check)

A 48-hour check runs after every committed update. If two or more
negative signals appear, the update auto-rolls back and escalates.

```typescript
async function runEarlyWarningCheck(updateId: string): Promise<void> {
  const update = await getPromptUpdate(updateId);
  const snapshot = await assembleClusterContextSnapshot(update.cluster_id);

  const negativeSignals = [
    snapshot.engagement_delta_pct < -0.30,  // >30% engagement drop
    snapshot.welfare_flag_count_48h > 2,     // Welfare spike
    snapshot.member_departures_48h > 3,      // Member departures
  ];

  if (negativeSignals.filter(Boolean).length >= 2) {
    await rollbackPromptUpdate(updateId, 'early_warning_triggered');
    await createObserverFinding({
      severity: 'high',
      title: 'Observer update auto-rolled back — negative signals within 48h',
    });
  }
}
```

---

## Platform Rules Validation Layer

Every proposed update passes through this before execution.
Structural safety net — enforces Platform Rules without relying on
Observer's LLM judgment.

```typescript
function validateAgainstPlatformRules(
  proposedUpdate: ProposedPromptUpdate
): ValidationResult {

  // Rule 1: Cannot touch Layer 1
  if (proposedUpdate.target_layer === 1)
    return { passes: false, violated_rule: 'LAYER_1_IMMUTABLE' };

  // Rule 2: Cannot modify welfare detection logic
  if (containsWelfareModification(proposedUpdate.proposed_value))
    return { passes: false, violated_rule: 'WELFARE_IMMUTABLE' };

  // Rule 3: Cannot modify character detection logic
  if (containsCharacterModification(proposedUpdate.proposed_value))
    return { passes: false, violated_rule: 'CHARACTER_IMMUTABLE' };

  // Rule 4: Cannot introduce protocol disclosure
  if (containsProtocolDisclosure(proposedUpdate.proposed_value))
    return { passes: false, violated_rule: 'NO_PROTOCOL_DISCLOSURE' };

  // Rule 5: Cannot modify cosmological substrate
  if (containsCosmologyModification(proposedUpdate.proposed_value))
    return { passes: false, violated_rule: 'COSMOLOGY_IMMUTABLE' };

  // Rule 6: Cannot exceed cluster's agent involvement slider ceiling
  if (proposedUpdate.cluster_id) {
    const config = getClusterConfig(proposedUpdate.cluster_id);
    if (exceedsInvolvementCeiling(proposedUpdate.proposed_value, config.agent_involvement))
      return { passes: false, violated_rule: 'INVOLVEMENT_CEILING' };
  }

  // Rule 7: Cannot violate dignity invariants
  if (violatesDignityInvariants(proposedUpdate.proposed_value))
    return { passes: false, violated_rule: 'DIGNITY_INVARIANTS' };

  // Rule 8: Cannot increase involvement beyond slider ceiling
  if (proposedUpdate.cluster_id) {
    const config = getClusterConfig(proposedUpdate.cluster_id);
    if (wouldIncreaseInvolvement(proposedUpdate.proposed_value, config.agent_involvement))
      return { passes: false, violated_rule: 'INVOLVEMENT_CEILING' };
  }

  // Rule 9: Check suppressed actions list
  const suppressed = getClusterConfig(proposedUpdate.cluster_id)
    ?.observer_suppressed_actions ?? [];
  if (suppressed.some(s => s.action_type === proposedUpdate.update_type))
    return { passes: false, violated_rule: 'ACTION_SUPPRESSED_BY_ADMIN' };

  return { passes: true };
}
```

**Suppressed actions** — when an admin vetoes the same action type
three times for the same cluster, Observer stops proposing it
autonomously. Stored in `cluster_config.observer_suppressed_actions`.

---

## Conflict Resolution (Optimistic Locking)

When Observer and an admin edit the same prompt layer simultaneously,
the last write must not silently win.

```sql
-- Add to cluster_config
ALTER TABLE cluster_config
  ADD COLUMN IF NOT EXISTS prompt_version INT DEFAULT 0;
  -- Incremented on every prompt update (Observer or admin)
```

Observer reads `prompt_version` before proposing an update. If it has
changed since Observer read it, the update is rejected with
`conflict_detected` and Observer re-reads before retrying.

---

## New Admin Onboarding Grace Period

For the first 30 days after a cluster is created or a new admin is
assigned, all Tier 1 actions are automatically promoted to Tier 2
(staged). This gives new admins time to understand Observer's
behaviour before it acts at full speed.

Stored in `cluster_config.observer_grace_period_until TIMESTAMPTZ`.

---

## Quiet Hours

Admin can set hours during which Tier 1 actions are automatically
promoted to Tier 2. Prevents actions committing while admin is away.

```sql
-- Add to platform_settings or cluster_config
observer_quiet_hours_start  TIME,
observer_quiet_hours_end    TIME,
observer_quiet_hours_tz     TEXT  -- IANA timezone
```

---

## Clio Builder Integration

The Clio builder reads active Observer signals for the current cluster
and injects them into Layer 4:

```typescript
// In clio-builder.ts
const observerSignals = await getActiveObserverSignals(clusterId);

// Injected as a structured block in Layer 4:
// [OBSERVER CONTEXT — Platform intelligence for this cluster]
// • {signal.signal_content.note}
// [Use these signals to inform responses. Do not reference them
//  explicitly to members.]
```

---

## Queue Jobs

| Job | Trigger | Lane |
|-----|---------|------|
| `ObserverIntrospectionCycle` | Every 6h (urgent/elevated clusters), 24h (normal), 72h (low) | low |
| `ObserverVetoWindowClose` | Scheduled per update (30 min after Tier 1 commit) | medium |
| `ObserverEarlyWarningCheck` | Scheduled per update (48h after commit) | low |
| `ObserverOutcomeTracking` | Scheduled per update (7 days after commit) | low |

---

## Admin Dashboard: Observer Stewardship Section

New section in the Aggilo Admin Dashboard (platform_admin) and in
the per-cluster admin dashboard (founder-scoped view).

**Platform admin view:**
```
Observer Stewardship
├── Pending (veto window open)
│   Each row: agent · cluster · update type · rationale · veto deadline
│   Actions: [Veto] [View detail]
├── Committed (veto window closed, action live)
│   Each row: agent · cluster · update type · committed at · outcome
│   Actions: [Roll back manually] [View detail]
├── Vetoed (admin intervened)
│   Each row: agent · cluster · update type · veto reason
│   Actions: [View finding] [Re-approve with modifications]
└── Outcome tracking (7-day post-update signals)
    Each row: update · metric · before · after · delta · assessment
```

**Founder-scoped view (per-cluster admin dashboard):**
Shows Observer actions for this cluster only. Founder can veto
pending actions and roll back committed actions on their own cluster.
Does not show platform-level intelligence or other clusters.

**Priority Controls panel (per cluster):**
```sql
-- Extension to cluster_config
ALTER TABLE cluster_config
  ADD COLUMN IF NOT EXISTS observer_priority_override JSONB DEFAULT NULL;
  -- {
  --   level: 'urgent' | 'elevated' | 'paused',
  --   reason: string,
  --   set_by: uuid,
  --   set_at: timestamptz,
  --   expires_at: timestamptz,  -- NULL = no expiry
  --   auto_clear_on_improvement: boolean
  -- }
```

---

*Observer Stewardship · Phase 1 · 2026-05-24*
*Authoritative for Observer's autonomous stewardship mechanics.*
*Subordinate to AGGILO_SOUL.md, AGGILO_PLATFORM_RULES.md,*
*and observer/AGGILO_OBSERVER_AGENTS.md.*
