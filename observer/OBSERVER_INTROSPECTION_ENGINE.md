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
   holistically across nine dimensions.

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
    prompt_quality_decline: number;   // 0–25 (prompt calibration mismatch)
    manifestation_drift: number;      // 0–20 (NEW — soul manifestation misalignment)
    ecosystem_health_decline: number; // 0–20 (NEW — ecosystem success model underperformance or purpose drift)
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

**Prompt quality decline (0–25 points)** *(NEW)*

Prompt calibration issues are user-facing and must be treated as first-class priority signals. A cluster where Sage's register no longer matches member tone degrades member experience immediately.

```typescript
function scorePromptQualityDecline(cluster: Cluster): number {
  let score = 0;
  if (cluster.genesis_reports?.some(r => r.findings?.prompt_mismatch)) score += 20;
  if (cluster.cim_reports?.some(r => r.findings?.register_mismatch)) score += 15;
  if (cluster.cim_reports?.some(r => r.findings?.prompt_gap)) score += 12;
  if (cluster.feature_signals?.some(s => s.signal_type === 'persona_feedback')) score += 18;
  if (cluster.config?.prompt_review_requested) score += 25;
  if (cluster.observer_context?.last_introspection?.prompt_mismatch_flag) score += 10;
  return Math.min(score, 25);
}
```

| Trigger | Points | Source |
|---------|--------|--------|
| Genesis Engine detects Sage calibration mismatch | 20 | `cluster_genesis_reports.findings` |
| CIM Behavioural Module flags register mismatch | 15 | `cluster_intelligence_reports` |
| CIM Functional Module flags prompt gap | 12 | `cluster_intelligence_reports` |
| Member explicitly reports "Sage feels off" | 18 | `feature_signals` with `signal_type = 'persona_feedback'` |
| Admin manually flags prompt review needed | 25 | `cluster_config.prompt_review_requested = true` |
| Observer detected register mismatch in prior introspection | 10 | `observer_cluster_context` |

**Result:** A cluster with prompt quality issues can score 65+ (urgent band) even with normal engagement, guaranteeing deep introspection within 6 hours.

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
- **Deep**: Full context snapshot + all 6 dimensions + extended thinking. Up to 3 LLM calls. Urgent/elevated clusters.
- **Standard**: Abbreviated snapshot + 4 dimensions (drop 1 least relevant). 1–2 LLM calls. Normal clusters.
- **Light**: Engagement signals only + quick drift check. 1 LLM call. Low-priority clusters.

### Daily budget — two pools

Prompt refinement is user-facing and receives a **dedicated budget pool** separate from general platform health introspection.

```typescript
const INTROSPECTION_DAILY_BUDGET = {
  // Pool A: General platform health (existing)
  general: {
    deep:     5,
    standard: 15,
    light:    30,
  },
  // Pool B: Prompt refinement only (NEW)
  prompt_refinement: {
    deep:     8,   // More than general — prompt quality is primary user-facing AI experience
    standard: 20,
    light:    40,
  },
};
```

**Pool B rules:**
- Pool B is ONLY for introspections where `prompt_quality_decline > 0`.
- Pool B quotas are **per-cluster-monthly**, not platform-daily:
  - Generic clusters: 2 deep + 4 standard per month
  - Premium clusters: 4 deep + 8 standard per month
  - Elevated/Maximum token budget clusters: +2 deep bonus
- Unused allowance rolls over 1 month, then expires.
- If Pool B is exhausted for a cluster, prompt refinement requests queue with 24h max delay.
- Prompt refinement is computationally cheaper than welfare review (no member-content analysis).

Clusters exceeding the budget are deferred. Their
`time_since_last_introspection` score increases, so they naturally
rise in priority next cycle.

### Signal Classification (Urgency Tiers)

Observer continuously monitors cluster signals and classifies each into one of four urgency tiers. This classification determines response speed, not just priority score.

```typescript
interface SignalEvaluation {
  signal_type: string;           // e.g., "feature_request", "frustration_spike"
  frequency: number;             // occurrences in window
  uniqueness: number;              // % of active members expressing this
  urgency_language: number;        // NLP score (0.0–1.0)
  sentiment_trend: string;         // "negative" | "mixed" | "neutral"
  existing_workaround: boolean;    // are members solving this another way?
  confidence: number;              // overall confidence this matters
  tier: 'tier_1_crisis' | 'tier_2_strong_demand' | 'tier_3_emerging' | 'tier_4_background';
}
```

**Tier 1 — Crisis (Act within 24h, bypass all rate limits):**
- Mass frustration spike (5+ negative posts in 24h)
- Child safety concern
- Feature critical failure
- Content harm detected

**Tier 2 — Strong Demand (Act within 3–7 days, 2× budget):**
- Repeated feature requests (8+ in 7 days, ≥40% unique members)
- Engagement pattern shift (80% of interactions change modality)
- Skill stagnation detected (60% stuck on same level for 14 days)
- Tone mismatch complaints

**Tier 3 — Emerging Trend (Act within 2–4 weeks, 1× budget):**
- Gradual composition shift (weight rising 5% per week for 3+ weeks)
- New topic emergence
- Feature adoption curve rising
- Subtle tone calibration need

**Tier 4 — Background Drift (Quarterly review, 0.3× budget):**
- Slow demographic shift
- Seasonal patterns
- Long-term composition evolution

**Decision loop:**
```
DETECT → CLASSIFY (tier) → EVALUATE (evidence) → ASSESS (impact/jarring-ness)
  → DECIDE (act now / queue / escalate) → COMMUNICATE (explain change to members)
  → MONITOR (did it help?) → LEARN (adjust future inference)
```

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
AGGIL: {cluster.aggil_summary}  // coarse, aggregate only; no real names or direct identifiers
Interest profile: {cluster.interest_profile_summary}  // primary, secondary, and "not_for" interests from genesis spec
Declared vibe: {cluster.vibe_summary}  // content mix + host tone from genesis spec
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

### Decision priorities (topic-first, demography-optional)

When you introspect a cluster, your reasoning priorities are:

1. **Topic and behaviour first**
   - Primary signals: what members actually talk about (themes, questions, @Sage mentions), how often they participate, and how the space feels (tone, response quality).
   - Use `engagement_snapshot`, `user_feedback_digest`, and content themes as your main evidence.

2. **Interest profile and vibe second**
   - Compare lived behaviour against the **declared** `interest_profile_summary` and `vibe_summary` from the Genesis spec.
   - Ask: "Does the space we see match what this cluster said it wanted to be?" (content, tone, format).

3. **Coarse AGGIL demography as an optional prior**
   - Use AGGIL only when:
     - The genesis spec or platform rules explicitly make it salient (for example, teen-only clusters, locality-based clusters, or language-specific clusters), **and**
     - The topic or safety context actually depends on age/language/geography.
   - Many clusters are effectively demography-agnostic (for example, "Functional programming study" or "Beginner drawing"). In those clusters, you typically treat demography as noise and do **not** propose any demography-related changes.

You are always evaluating the **space**, not judging whether specific individuals "belong". All reasoning is aggregate and PII-free.

### The eight evaluation dimensions

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

**Dimension 2 — Demographic & Interest Fit**

Are the people who are actually here reasonably aligned with the **intended interest profile and coarse AGGIL frame**, and is the cluster serving them well?

- Start from topic and behaviour: recurring themes, questions, and engagement patterns.
- Use coarse AGGIL only if it is explicitly part of the cluster's spec or safety posture (for example, teen-only support, city-specific mutual aid, language-specific learning).
- Infer from aggregate signals only (post language distribution, topic
  patterns, @Sage content, member feedback). Never reference individual
  member profiles. Never suggest excluding or reshaping specific
  individuals. You are evaluating whether the **space** matches the
  declared intent, not whether members "belong".

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

**Dimension 3 — Prompt Quality (including Format & Vibe Coherence)**

Are the current Layer 3 prompts (for Sage, Clio, and Observer signals) still appropriate for this cluster's **declared vibe and interest profile**?

Look for: register mismatch, missing context, stale context,
vocabulary gap. You are evaluating Layer 3 only. You cannot modify
Layer 1 or Layer 2. You cannot modify welfare or character detection.

**Format & vibe coherence sub-dimension (NEW):**
Does member content format and tone match the cluster's declared vibe and interest profile?
- Heavy image use in a text-discussion cluster → format drift
- Text-only posts in a mixed-media cluster → format underutilization
- Polls in a cluster with no decision-making vibe → format mismatch
- Composer feature flags should align with what members actually produce

Format coherence is a prompt quality signal because it indicates whether the composer controls (derived from `cluster_vibe`) are correctly calibrated. If members consistently bypass or ignore vibe-aligned controls, the vibe may need refinement.

```json
{
  "dimension": "prompt_quality",
  "quality_score": 0.0,
  "register_appropriate": true,
  "missing_context": null,
  "stale_context": null,
  "vocabulary_gap": null,
  "format_coherence": {
    "drift_detected": false,
    "drift_description": null,
    "feature_underutilized": [],
    "feature_overutilized": []
  },
  "proposed_action": "none | update_sage_fragment | update_clio_fragment | add_observer_signal | adjust_composer_flags",
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

**Dimension 6 — Manifestation Alignment**

Does the cluster's lived agent behaviour match its configured `soul_manifestation_profile`?

Evaluate whether Clio, Sage, and Atlas are manifesting the Soul in the way the profile declares. This is distinct from prompt quality (Dimension 3) — a prompt can be technically correct while the agent's output contradicts the manifestation configuration.

**Drift signals to monitor:**
- `silence_expectation` vs actual agent post frequency (high silence + 5 posts/day = drift)
- `primary_register` vs agent statement types (inquiry register but agent uses declarative lectures)
- `scripture_usage` vs actual citations (none but agent cites Quran = drift)
- `celebration_mode` vs praise patterns (earned but agent celebrates participation only)
- Member feedback: "Sage feels too preachy", "Clio is too quiet", "This doesn't feel like a learning space"

**This dimension never modifies Soul prohibitions (Layer 1).** It only adjusts how the Soul manifests (Layer 3) — register, scripture frequency, silence expectation, celebration style.

```json
{
  "dimension": "manifestation_alignment",
  "alignment_score": 0.0,
  "drift_detected": false,
  "drift_dimensions": [],
  "proposed_action": "none | soul_manifestation_shift | persona_override_activation | flag_for_admin_review",
  "proposed_change": null,
  "autonomy_tier": 1,
  "confidence": 0.0,
  "rationale": "one sentence"
}
```

**Dimension 7 — Composition Inference**

Does the cluster's actual behavior match its inferred composition? Are members' needs being met by the current configuration?

Evaluate whether:
- `inferred_composition` weights still reflect actual post themes, @Sage mentions, and tool usage
- `stakeholders` accurately describe who is participating and what they need
- `feature_spawn_candidates` that were not auto-spawned should now be proposed (new evidence)
- Members are expressing needs that the current configuration does not address
- The cluster is evolving toward a state that warrants a linked cluster spawn

**Drift signals to monitor:**
- Tag weight divergence: `education` weight 0.85 but actual posts are 60% parenting venting
- Stakeholder mismatch: inferred `parent_as_facilitator` but actual members are `teacher_as_expert`
- Unmet need detection: members repeatedly ask for something the cluster doesn't have
- Spawn signals: sub-topic recurring with distinct stakeholder needs

**Proposed actions:**
- `composition_recalculation` — re-run inference on recent behavior, update weights
- `feature_proposal` — propose a tool/feature that addresses detected unmet need
- `stakeholder_reinference` — update stakeholder map based on new behavior patterns
- `cluster_spawn_proposal` — propose linked cluster when sub-community is distinct
- `manifestation_per_recipient_adjustment` — shift tone for specific stakeholder

```json
{
  "dimension": "composition_inference",
  "alignment_score": 0.0,
  "drift_detected": false,
  "drift_signals": {
    "tag_weight_divergence": false,
    "stakeholder_mismatch": false,
    "unmet_need_detected": false,
    "spawn_signal_detected": false
  },
  "proposed_action": "none | composition_recalculation | feature_proposal | stakeholder_reinference | cluster_spawn_proposal | manifestation_per_recipient_adjustment",
  "proposed_change": null,
  "evidence": "specific member behavior supporting this inference",
  "autonomy_tier": 1,
  "confidence": 0.0,
  "rationale": "one sentence"
}
```

**Dimension 8 — Ecosystem Health (NEW)**

Does the cluster's ecosystem produce its declared purpose? Are success dimensions achieving their intended outcomes?

- Compare each `active` dimension's `performance` score against its `alert_threshold`.
- Flag dimensions that have been underperforming for longer than the threshold duration.
- Detect latent needs: are members showing needs not captured in current dimensions?
- Detect founder-intent drift: has a founder-intent dimension dropped below its `floor_weight`?
- Detect dimension conflict: are two dimensions inversely correlated (pulling cluster in different directions)?
- Phase-gated behavior: Seed = flag only; Sprout = propose changes; Canopy = question whether model is still right.

**Key output:**

```json
{
  "dimension": "ecosystem_health",
  "health_score": 0.0,
  "dimensions_evaluated": [
    {
      "dimension_id": "conceptual_understanding",
      "performance": 0.25,
      "threshold": 0.40,
      "status": "underperforming",
      "duration_days": 14
    }
  ],
  "anomalies": [
    {
      "type": "dimension_underperformance | founder_intent_drift | dimension_conflict | latent_need_signal",
      "severity": "low | medium | high | urgent",
      "description": "one sentence",
      "affected_dimensions": ["dimension_id"],
      "recommended_action": "none | admin_review | ecosystem_edit | spawn_proposal"
    }
  ],
  "latent_needs": [
    {
      "need": "what members seem to need but is not in the model",
      "confidence": 0.0,
      "evidence": "specific behavior supporting this inference"
    }
  ],
  "proposed_action": "none | ecosystem_adaptation | admin_review | spawn_proposal",
  "proposed_change": null,
  "autonomy_tier": 1,  // Seed=1 (flag only), Sprout=2 (propose), Canopy=3 (self-question)
  "confidence": 0.0,
  "rationale": "one sentence"
}
```

**Important:** Observer does not have authority to change the ecosystem. It flags, proposes, and questions. Only admin (Seed/Sprout) or member deliberation (Canopy) can change the model.

**Dimension 9 — Ecosystem Spec Mismatch Detection (NEW)** *(Formerly proposed as Domain 11; renumbered to maintain sequential order)*

Does the cluster's actual behavior match its declared ecosystem type? Is the framework itself misfit, or are only the parameters within the framework failing?

This dimension is distinct from Dimension 8 (Ecosystem Health). Dimension 8 asks: "Are the success dimensions achieving their targets?" Dimension 9 asks: "Are we measuring the right things at all?"

**Signals to monitor:**

1. **Persistent operational failure despite parameter tuning.**
   - ≥3 consecutive Evolution changes reversed within 30 days
   - ≥3 ecosystem dimensions simultaneously off-track (Dimension 8) despite parameter adjustments
   - This suggests the model is wrong, not just the settings

2. **Member language shift.**
   - Members explicitly describe the cluster as something other than its `ecosystem_type`
   - ≥5 members (or ≥10% of active members) signal "this feels more like X than Y"
   - Clio's `session_themes` drift away from `ecosystem_type` vocabulary

3. **Purpose drift persistence.**
   - `founder_intent` dimension below `floor_weight` for ≥2 consecutive cycles
   - Not a single-cycle anomaly — a sustained departure from founding purpose

4. **Stakeholder role inversion.**
   - Inferred `primary_beneficiary` has shifted (e.g., from `beneficiary_learner` to `supporter_peer`)
   - `support_role` members are now the primary engagers; intended beneficiaries are passive

5. **Progression model abandonment.**
   - Stage advancement rate near zero despite high engagement
   - Members engage but not with the progression content
   - Suggests the progression model is irrelevant to actual member needs

**Escalation rule:** When Dimension 9 detects a spec mismatch with confidence ≥ 0.70, Observer does NOT propose an ecosystem change directly. It escalates to **Genesis Re-Eval** (`CLUSTER_GENESIS_ENGINE.md` §10). Genesis evaluates whether the ecosystem type itself should change, not just the parameters within it.

**Key output:**

```json
{
  "dimension": "ecosystem_spec_mismatch",
  "mismatch_detected": true,
  "confidence": 0.0,
  "current_ecosystem_type": "learning_management",
  "suggested_ecosystem_type": "emotional_support",
  "signals": [
    {
      "type": "operational_failure | member_language_shift | purpose_drift | stakeholder_inversion | progression_abandonment",
      "severity": "low | medium | high | urgent",
      "description": "one sentence",
      "cycles_persisted": 0,
      "evidence": "specific observed behavior"
    }
  ],
  "recommended_action": "none | genesis_re_eval_escalation | admin_review",
  "escalation_to": "genesis_re_eval",
  "confidence": 0.0,
  "rationale": "one sentence"
}
```

**Autonomy:** Dimension 9 findings are always Tier 3 (finding-and-approve). Observer never auto-triggers Genesis Re-Eval. The finding is surfaced to admin with a "Request Genesis Re-Eval" button. Admin can approve the escalation, request more evidence, or dismiss.

**Why this matters for neurodivergent members:** A cluster that silently shifts from `learning_management` to `emotional_support` while keeping the same success metrics creates a broken social contract. Autistic members optimize for the explicit rules while the implicit reality changes. Dimension 9 makes the framework itself visible and accountable.

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

### `sage_post_feedback` table *(Phase0 graduation)*

Members rate Sage posts with thumbs up/down or report. This table is
the **primary data source** for `getAgentFeedback()` in the User
Feedback Digest.

```sql
CREATE TABLE sage_post_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  cluster_id UUID NOT NULL REFERENCES clusters(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  feedback_type VARCHAR(16) NOT NULL
    CHECK (feedback_type IN ('thumbs_up','thumbs_down','report')),
  report_reason VARCHAR(64),   -- "off-topic","incorrect","insensitive","other"
  report_detail TEXT,
  consumed_by_observer BOOLEAN DEFAULT FALSE,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`getAgentFeedback` implementation:**

```typescript
async function getAgentFeedback(clusterId: string, opts: { days: number }): Promise<AgentFeedback> {
  const rows = await db
    .from('sage_post_feedback')
    .select('feedback_type')
    .eq('cluster_id', clusterId)
    .gte('created_at', daysAgo(opts.days))
    .order('created_at', { ascending: false });

  const total = rows.length;
  const positive = rows.filter(r => r.feedback_type === 'thumbs_up').length;
  const negative = rows.filter(r => r.feedback_type === 'thumbs_down').length;
  const reports = rows.filter(r => r.feedback_type === 'report').length;

  // Mark consumed so they are not re-counted in the next cycle
  await db
    .from('sage_post_feedback')
    .update({ consumed_by_observer: true, consumed_at: new Date().toISOString() })
    .eq('cluster_id', clusterId)
    .eq('consumed_by_observer', false)
    .gte('created_at', daysAgo(opts.days));

  return {
    sage_positive_pct: total > 0 ? positive / total : null,
    sage_negative_pct: total > 0 ? negative / total : null,
    sage_report_count: reports,
    total_feedback_count: total,
    trend: computeTrend(rows),  // 7-day vs 30-day comparison
  };
}
```

**Impact on Priority Queue Engine:**
- `sage_positive_pct < 0.4` → +15 priority score (CIM Behavioural Module flag)
- `reports >= 3` in 7 days → +25 priority score (immediate admin review)
- `trend = 'declining'` → +10 priority score

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
seven-dimension evaluation — there is no engagement data. A separate
cold-start mode runs instead, focused on configuration quality:

- **Configuration validation**: Is the AGGIL configuration internally
  consistent? Does the purpose statement clearly describe who the
  cluster is for?
- **Composition inference validation**: Are the inferred tag weights,
  stakeholders, and feature_spawn_candidates plausible given the founder
  description? Are confidence scores appropriately calibrated (not
  inflated)?
- **Prompt readiness**: Are the Sage and Clio cluster fragments
  appropriate for the stated purpose, inferred stakeholders, and
  per-recipient manifestation map?
- **Seed quality**: Are seed posts appropriate and likely to generate
  genuine discussion?
- **Feature pre-spawn review**: Were high-probability features correctly
  auto-spawned? Is the UI pre-configuration appropriate?

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
