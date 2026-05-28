# Observer Introspection Engine

> **Status:** Phase 1 architecture. Not yet implemented.
>
> **Authority:** Subordinate to `observer/OBSERVER_STEWARDSHIP.md`.
> This document specifies the intelligence layer of Observer's
> autonomous stewardship — the reasoning framework Observer uses to
> decide which clusters to evaluate, in what order, and whether to act.
>
> **Companion:** `observer/OBSERVER_STEWARDSHIP.md` — the mechanics
> (three-tier autonomy, veto windows, database schema, validation layer)

---

## Overview

The introspection engine has three components:

```
1. Priority Queue Engine
   Decides which clusters Observer introspects, in what order,
   and how deeply.

2. Cluster Introspection Prompt
   The reasoning framework Observer uses to evaluate a single cluster
   holistically across five dimensions.

3. Proposal Validation & Minimality Test
   Ensures Observer only proposes changes that are genuinely warranted,
   minimal, and explainable in plain language.
```

---

## Component 1 — Priority Queue Engine

### Priority score formula

Every cluster gets a priority score before each `ObserverIntrospectionCycle`.
Observer processes clusters in descending priority order.

```typescript
interface ClusterPriorityScore {
  cluster_id: string;
  score: number;           // 0–100, higher = more urgent
  score_components: {
    admin_override: number;              // 0 or 40
    performance_trajectory: number;     // 0–25 (rate of change)
    current_health: number;             // 0–20 (absolute state)
    creation_recency: number;           // 0–10 (new clusters)
    time_since_last_introspection: number; // 0–5 (fairness)
  };
  priority_band: 'urgent' | 'elevated' | 'normal' | 'low' | 'paused';
  introspection_depth: 'deep' | 'standard' | 'light';
  next_introspection_due_at: Date;
}
```

### Scoring each component

**Admin override (0 or 40 points)**

Admin-set priority overrides everything else. Stored in
`cluster_config.observer_priority_override`.

```typescript
function scoreAdminOverride(cluster: Cluster): number {
  const override = cluster.observer_priority_override;
  if (!override || override.expires_at < new Date()) return 0;
  switch (override.level) {
    case 'urgent':   return 40;   // Always first in queue
    case 'elevated': return 25;   // Ahead of organic clusters
    case 'paused':   return -100; // Skip entirely
    default:         return 0;
  }
}
```

**Performance trajectory (0–25 points)**

Rate of change matters more than absolute state. A cluster that was
thriving and is now declining is more urgent than one that has always
been quiet.

```typescript
function scorePerformanceTrajectory(cluster: Cluster, history: ClusterHistory): number {
  const delta = history.posts_prior_14d > 0
    ? (cluster.posts_last_7d - history.posts_7d_to_14d_ago) / history.posts_prior_14d
    : 0;
  if (delta < -0.40) return 25;  // >40% drop — most urgent
  if (delta < -0.25) return 20;
  if (delta < -0.10) return 12;
  if (Math.abs(delta) < 0.10) return 8;  // Stagnant
  if (delta > 0.25)  return 2;   // Growing — low urgency
  return 5;
}
```

**Current health (0–20 points)**

```typescript
function scoreCurrentHealth(cluster: Cluster): number {
  const arcScore = { A: 15, B: 10, C: 18, D: 3, E: 1 }[cluster.arc_phase] ?? 10;
  const dominanceScore = cluster.dominant_member_pct > 0.60 ? 5 : 0;
  const welfareScore   = cluster.welfare_flag_count_30d > 3 ? 3 : 0;
  return Math.min(20, arcScore + dominanceScore + welfareScore);
}
```

**Creation recency (0–10 points)**

New clusters need early attention to validate configuration before
patterns solidify.

```typescript
function scoreCreationRecency(cluster: Cluster): number {
  const days = daysBetween(cluster.created_at, new Date());
  if (days <= 3)  return 10;
  if (days <= 7)  return 8;
  if (days <= 14) return 5;
  if (days <= 30) return 2;
  return 0;
}
```

**Time since last introspection (0–5 points)**

Fairness — no cluster ignored indefinitely.

```typescript
function scoreTimeSinceLastIntrospection(cluster: Cluster): number {
  const days = cluster.last_observer_introspection_at
    ? daysBetween(cluster.last_observer_introspection_at, new Date())
    : 999;
  if (days > 30) return 5;
  if (days > 14) return 3;
  if (days > 7)  return 1;
  return 0;
}
```

### Priority bands and introspection depth

| Score | Band | Depth | Frequency |
|-------|------|-------|-----------|
| 65–100 | urgent | deep | Every 6h |
| 40–64 | elevated | deep | Every 12h |
| 20–39 | normal | standard | Every 24h |
| 5–19 | low | light | Every 72h |
| < 5 or paused | paused | none | Skipped |

**Introspection depth:**
- **Deep**: Full context snapshot + all 5 dimensions + extended thinking. Up to 3 LLM calls. Urgent/elevated clusters.
- **Standard**: Abbreviated snapshot + 3 dimensions. 1–2 LLM calls. Normal clusters.
- **Light**: Engagement signals only + quick drift check. 1 LLM call. Low-priority clusters.

### Daily budget

```typescript
const INTROSPECTION_DAILY_BUDGET = {
  deep:     5,   // Max 5 deep introspections per day
  standard: 15,
  light:    30,
};
```

Clusters exceeding the budget are deferred. Their
`time_since_last_introspection` score increases, so they naturally
rise in priority next cycle.

---

## Component 2 — Cluster Introspection Prompt

### Prompt architecture

```
[LAYER 1: Platform super-prompt — inherited, not restated]

[LAYER 2: Observer character]
You are Aggilo's platform steward. Your role is to evaluate clusters
and determine whether autonomous prompt improvements are warranted.
You are not a critic. You are not an optimizer. You are a careful
observer who acts only when there is genuine evidence that a change
will serve the members better.

Your standard for action is high: you propose a change only when you
can articulate, in one clear sentence, what specific member experience
will improve and why the current prompt is preventing that improvement.

If you cannot meet that standard, your verdict is "no action warranted."
That is a valid and often correct verdict.

[LAYER 3: Cluster identity]
Cluster: {cluster.display_name}
Purpose: {cluster.purpose}
AGGIL: {cluster.aggil_summary}
Arc phase: {cluster.arc_phase} (day {days_in_phase} of expected {expected_days})
Member count: {cluster.member_count}
Days since creation: {cluster.days_since_creation}

[LAYER 4: Evaluation inputs]
--- ENGAGEMENT SIGNALS (last 14 days) ---
{engagement_snapshot}

--- USER FEEDBACK ---
{user_feedback_digest}

--- CURRENT PROMPTS ---
Sage cluster fragment (Layer 3): {current_sage_cluster_fragment}
Clio cluster fragment (Layer 3): {current_clio_cluster_fragment}
Active Observer signals (Layer 4): {active_observer_signals}

--- ADMIN CONTEXT ---
Priority override: {admin_override_level} — "{admin_override_reason}"
Last introspection: {days_since_last} days ago
Previous Observer actions: {previous_actions_summary}
```

### The five evaluation dimensions

**Dimension 1 — Purpose Alignment**

Is the cluster doing what it said it would do?

Evaluate whether actual activity (post themes, @Sage mentions) aligns
with the stated purpose. Look for: topic drift, purpose gap (too
narrow/broad), purpose clarity for Sage's editorial judgment.

```json
{
  "dimension": "purpose_alignment",
  "alignment_score": 0.0,
  "drift_detected": false,
  "drift_description": null,
  "gap_detected": false,
  "gap_description": null,
  "proposed_action": "none | refine_purpose_in_sage_context | flag_for_admin_review",
  "proposed_change": null,
  "rationale": "one sentence"
}
```

**Dimension 2 — Demographic Fit**

Are the right people here, and is the cluster serving them well?

Infer from aggregate signals only (post language distribution, topic
patterns, @Sage content, member feedback). Never reference individual
member profiles.

```json
{
  "dimension": "demographic_fit",
  "fit_score": 0.0,
  "mismatch_signals": [],
  "underserved_signals": [],
  "language_gap": false,
  "proposed_action": "none | update_sage_register | update_clio_context | flag_for_admin_review",
  "proposed_change": null,
  "rationale": "one sentence"
}
```

**Dimension 3 — Prompt Quality**

Are the current Layer 3 prompts still appropriate for this cluster?

Look for: register mismatch, missing context, stale context,
vocabulary gap. You are evaluating Layer 3 only. You cannot modify
Layer 1 or Layer 2. You cannot modify welfare or character detection.

```json
{
  "dimension": "prompt_quality",
  "quality_score": 0.0,
  "register_appropriate": true,
  "missing_context": null,
  "stale_context": null,
  "vocabulary_gap": null,
  "proposed_action": "none | update_sage_fragment | update_clio_fragment | add_observer_signal",
  "proposed_change": null,
  "proposed_signal": null,
  "rationale": "one sentence"
}
```

**Dimension 4 — Engagement Quality**

Is the engagement genuine and the right kind?

Look for: participation distribution, response quality, Sage
calibration (too active / appropriate / too silent), Atlas landing
rate, explicit member feedback themes.

```json
{
  "dimension": "engagement_quality",
  "quality_score": 0.0,
  "participation_healthy": true,
  "dominant_member_risk": false,
  "sage_calibration": "appropriate",
  "atlas_landing": true,
  "explicit_feedback_themes": [],
  "proposed_action": "none | adjust_sage_cadence_signal | adjust_atlas_brief_context | flag_for_admin_review",
  "proposed_change": null,
  "rationale": "one sentence"
}
```

**Dimension 5 — Improvement Potential (synthesis)**

Is there a specific, evidenced, minimal change that would genuinely
improve this cluster?

The standard is strict:
1. Gap must be evidenced by actual member behaviour, not inference
2. Proposed change must be the minimal intervention
3. Must be statable in one sentence a non-technical admin would agree with
4. Must not introduce new risk

```json
{
  "dimension": "improvement_potential",
  "action_warranted": false,
  "evidence_strength": "none | weak | moderate | strong",
  "proposed_actions": [
    {
      "action_type": "string",
      "target_layer": 3,
      "target_agent": "sage",
      "change_description": "plain language, one sentence",
      "change_content": "the actual prompt text or signal",
      "autonomy_tier": 1,
      "confidence": 0.0,
      "evidence": "what specific member behaviour supports this"
    }
  ],
  "no_action_reason": null
}
```

### Overall recommendation

```json
{
  "overall": {
    "cluster_id": "uuid",
    "introspection_depth": "deep",
    "evaluation_summary": "one paragraph plain-language summary",
    "action_count": 0,
    "actions": [],
    "no_action_reason": null,
    "next_introspection_priority": "normal",
    "next_introspection_in_hours": 24,
    "admin_flag_warranted": false,
    "admin_flag_reason": null
  }
}
```

---

## Component 3 — Minimality Test

Before any proposed action executes, it passes through a minimality
test. Rule-based checks run first (fast, no LLM). LLM check runs only
for complex changes.

```typescript
async function applyMinimalityTest(
  proposedAction: ProposedAction
): Promise<MinimalityVerdict> {

  // Test 1: Evidence must be observed, not inferred
  if (proposedAction.evidence_strength === 'weak' ||
      proposedAction.evidence_strength === 'none')
    return { passes: false, reason: 'Insufficient evidence' };

  // Test 2: Confidence threshold per tier
  const thresholds = { 1: 0.75, 2: 0.65, 3: 0.55 };
  if (proposedAction.confidence < thresholds[proposedAction.autonomy_tier])
    return { passes: false, reason: 'Confidence below threshold for tier' };

  // Test 3: No existing active signal for this gap
  const existing = await findExistingSignal(
    proposedAction.cluster_id, proposedAction.action_type);
  if (existing)
    return { passes: false, reason: 'Active signal already addresses this gap' };

  // Test 4: Not recently vetoed
  const recentVeto = await findRecentVeto(
    proposedAction.cluster_id, proposedAction.action_type, { days: 14 });
  if (recentVeto)
    return { passes: false, reason: 'Admin vetoed similar change recently — escalate to Tier 3' };

  // LLM minimality check for complex changes
  if (proposedAction.target_layer === 2 || proposedAction.change_content.length > 200) {
    const verdict = await llmCall('observer_minimality_check', {
      proposed_change: proposedAction.change_content,
      gap_being_addressed: proposedAction.evidence,
      question: 'Is this the smallest change that addresses the stated gap?',
    });
    if (!verdict.is_minimal)
      return { passes: false, reason: verdict.smaller_alternative };
  }

  return { passes: true };
}
```

---

## User Feedback Digest

Observer assembles user feedback from multiple sources before each
introspection. All sources are PII-free.

```typescript
async function assembleUserFeedbackDigest(clusterId: string): Promise<UserFeedbackDigest> {
  const [agentFeedback, pollResults, atSageMentions,
         memberFeatureProposals, vaultGapRequests, clioClusterIntelligence] =
    await Promise.all([
      getAgentFeedback(clusterId, { days: 30 }),
      getClusterPolls(clusterId, { days: 60, status: 'closed' }),
      getSageAtMentionThemes(clusterId, { days: 30 }),
      getMemberFeatureProposals(clusterId, { status: 'proposed_in_thoughts' }),
      getVaultGapRequests(clusterId, { days: 30 }),
      getClioClusterIntelligence(clusterId, { days: 14 }),
      // Reads from clio_cluster_intelligence table (see below)
    ]);

  return {
    sage_positive_feedback_rate: agentFeedback.sage_positive_pct,
    atlas_positive_feedback_rate: agentFeedback.atlas_positive_pct,
    poll_winning_themes: pollResults.map(p => p.winning_option_topic),
    at_sage_recurring_themes: extractThemes(atSageMentions),
    member_feature_requests: memberFeatureProposals.map(p => p.description),
    vault_gap_themes: extractThemes(vaultGapRequests),
    clio_cluster_questions: clioClusterIntelligence.session_themes ?? [],
    feedback_trend: computeFeedbackTrend(agentFeedback),
  };
}
```

### `clio_cluster_intelligence` table

Clio writes a lightweight, PII-free summary after each cluster
session. Observer reads it as part of the user feedback digest.

```sql
CREATE TABLE clio_cluster_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id TEXT NOT NULL REFERENCES clusters(cluster_id),
  session_themes TEXT[],
  unmet_needs TEXT[],
  friction_signals TEXT[],
  positive_signals TEXT[],
  session_count INT DEFAULT 1,
  covers_period_start TIMESTAMPTZ,
  covers_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Prompt injection defence

Member content enters the introspection prompt as extracted themes.
The extraction is hardened against prompt injection:

```typescript
function looksLikeInstruction(theme: string): boolean {
  const patterns = [
    /ignore (previous|above|all)/i,
    /you are now/i,
    /system prompt/i,
    /forget (everything|all)/i,
  ];
  return patterns.some(p => p.test(theme));
}
// Themes matching these patterns are discarded before entering the prompt.
```

---

## Cold-Start Introspection Mode

New clusters (< 7 days old, < 5 posts) cannot run the standard
five-dimension evaluation — there is no engagement data. A separate
cold-start mode runs instead, focused on configuration quality:

- **Configuration validation**: Is the AGGIL configuration internally
  consistent? Does the purpose statement clearly describe who the
  cluster is for?
- **Prompt readiness**: Are the Sage and Clio cluster fragments
  appropriate for the stated purpose and demographic?
- **Seed quality**: Are seed posts appropriate and likely to generate
  genuine discussion?

This produces configuration recommendations, not engagement
improvements. It is a separate LLM call with a separate prompt.

---

## Component 4 — Agent Reliability Monitoring

> **Source:** "Beyond pass@1: A Reliability Science Framework for Long-Horizon LLM Agents"
> (Khanal, Tao, Zhou — arXiv:2603.29231). Applied to Observer's Domain 5 monitoring.

Observer's Domain 5 (`agent_performance`) is expanded to include four **reliability metrics** beyond simple failure rate. These are computed from `llm_response_logs` aggregations per `(agent, operation_key)` pair and evaluated every 6h alongside the cluster introspection cycle.

### Why reliability ≠ capability

Benchmark scores (capability) and production reliability diverge at long horizons. Frontier models can have the highest meltdown rates because they attempt ambitious multi-step strategies that spiral. Observer must monitor reliability independently of whether the model "works on benchmarks."

### The four metrics

```typescript
interface AgentReliabilityMetrics {
  agent: 'clio' | 'sage' | 'atlas' | 'scout' | 'observer';
  operation_key: string;           // e.g. 'clio_cluster_chat', 'sage_post_generation'
  time_window_days: 7 | 30 | 90;

  rdc: ReliabilityDecayCurve;      // Pass rate by session-length bucket
  vaf: number;                     // Variance Amplification Factor (std dev ratio)
  gds: number;                     // Graceful Degradation Score 0.0–1.0
  mop: number | null;              // Meltdown Onset Point (turn count, null if no meltdown)
}

interface ReliabilityDecayCurve {
  bucket_1_5:  number;  // Pass rate, turns 1–5
  bucket_6_10: number;  // Pass rate, turns 6–10
  bucket_11_15: number; // Pass rate, turns 11–15
  bucket_16_20: number; // Pass rate, turns 16–20
  bucket_20plus: number; // Pass rate, turns 20+
  decay_rate: number;   // Max drop between adjacent buckets (negative = decay)
}
```

**GDS (Graceful Degradation Score):** Ratio of soft failures (validator retry succeeded, or graceful fallback used) to total failures. GDS = 1.0 means every failure was graceful. GDS = 0.0 means every failure was hard (validator failed twice, degrade path triggered).

```
GDS = (soft_failures + successful_retries) / total_failures
     where total_failures = hard_failures + soft_failures
```

**MOP (Meltdown Onset Point):** The first turn bucket where the meltdown rate (consecutive double-validator-failures within a session) exceeds 5%. `null` if no bucket exceeds this threshold.

### Alert thresholds → Observer findings

| Condition | Severity | Auto-finding? |
|-----------|---------|--------------|
| GDS < 0.70 | `critical` | Yes — Domain 5 finding auto-created |
| MOP < turn 10 | `critical` | Yes — spiralling too early in session |
| GDS 0.70–0.80 | `warning` | Yes — domain 5 warning |
| RDC decay_rate < -0.15 (>15% drop between buckets) | `warning` | Yes |
| 3+ micro-meltdowns in 1h for same operation key | `warning` | Yes |
| GDS 0.80–0.89 | `info` | No — surfaced in admin reliability tab only |

### Meltdown event logging

When an LLM call fails the server-side validator on both retry 1 and retry 2 (the "degrade" path fires), this is a **micro-meltdown**:

```typescript
// In llm_response_logs.meta:
{
  micro_meltdown: true,
  meltdown_session_turn: number,  // Which turn in the session this occurred
  meltdown_prior_turns: number,   // How many turns before this in the session
}
```

Three micro-meltdowns for the same `operation_key` within 1 hour triggers the Observer finding. The finding's suggested action is `review_llm_routing_config` — prompting the admin to consider switching the model for that operation to a more reliable one.

### Reliability is not capability

Observer's finding text for reliability alerts explicitly frames the issue:

> "Reliability for `{operation_key}` has degraded (GDS: {score}). This does not mean the current model is less capable — it means its failure pattern under this workload is causing cascading degradation. Consider switching to a model with a higher GDS for this operation type, even if it scores lower on capability benchmarks."

---

## Introspection Cycle Flow

```
ObserverIntrospectionCycle (runs per priority band frequency)
│
├── 1. Compute priority scores for all active clusters
│       → Sort descending, apply admin overrides, determine depth
│
├── 2. For each cluster (priority order, within daily budget):
│   ├── a. Assemble inputs (engagement snapshot, user feedback digest,
│   │       current prompt state, admin context, previous actions)
│   ├── b. Run introspection prompt (extended thinking for deep/standard)
│   ├── c. For each proposed action:
│   │       → Platform Rules validation
│   │       → Minimality test
│   │       → If passes: execute (Tier 1/2) or surface (Tier 3)
│   │       → If fails: log to observer_rejected_proposals
│   ├── d. Update observer_cluster_context
│   └── e. If admin_flag_warranted: create observer_finding (Tier 3)
│
└── 3. Update priority scores for next cycle
```

---

## Outcome Feedback Loop

After the 7-day outcome signal is populated, Observer feeds the
result back into `observer_learnings` and, if negative, adds the
action type to the cluster's suppressed actions list.

```typescript
async function processOutcomeSignal(updateId: string): Promise<void> {
  const update = await getPromptUpdate(updateId);
  const outcome = update.outcome_signal;

  await upsertObserverLearning({
    cluster_type: getClusterType(update.cluster_id),
    arc_phase: update.cluster_context_snapshot.arc_phase,
    action_type: update.update_type,
    outcome_delta: outcome.delta,
  });

  if (outcome.delta < -0.15) {
    await addSuppressedAction(update.cluster_id, update.update_type, {
      reason: `Outcome tracking: ${Math.round(outcome.delta * 100)}% engagement decline`,
      auto_suppressed: true,
    });
  }
}
```

---

*Observer Introspection Engine · Phase 1 · 2026-05-24*
*Authoritative for Observer's introspection reasoning framework.*
*Subordinate to observer/OBSERVER_STEWARDSHIP.md.*
