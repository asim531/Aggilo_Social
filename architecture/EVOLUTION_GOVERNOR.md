# Evolution Governor

> **Summary:** The Evolution Governor replaces fixed rate limits with a dynamic capacity budget. Clusters evolve fast when evidence is strong and gently when evidence is weak. The system evaluates, decides, communicates, and learns — never delaying without reason.
>
> **Authority:** Subordinate to `AGGILO_SOUL.md` and `AGGILO_PLATFORM_RULES.md`. All evolution proposals must pass the Platform Rules validation layer.
>
> **Companion documents:** `architecture/CLUSTER_GENESIS_ENGINE.md`, `observer/OBSERVER_INTROSPECTION_ENGINE.md`

---

## 1. Core Principle

> **Gentle evolution means non-jarring to users, not slow to decide.**

When parents are frustrated, the agent should catch up in hours, not months. When a slow seasonal shift occurs, quarterly review is sufficient. The governor adapts speed to signal strength.

---

## 2. Dynamic Capacity Budget

### 2.1 Base Capacity

Every cluster has a weekly capacity budget measured in arbitrary units:

```typescript
interface EvolutionCapacityBudget {
  cluster_id: string;
  week_start: Date;
  base_capacity: 100;
  actual_capacity: number;  // base × multiplier
  consumed: number;
  remaining: number;
}
```

### 2.2 Tier Multipliers

| Tier | Condition | Multiplier | Max Changes per Week |
|------|-----------|------------|----------------------|
| **Crisis** (Tier 1) | Mass frustration, safety, failure | 3.0 (300 units) | Unlimited bypass |
| **Strong Demand** (Tier 2) | Repeated requests, stagnation, shift | 2.0 (200 units) | Up to 2 major changes |
| **Emerging** (Tier 3) | Gradual shift, new topic | 1.0 (100 units) | 1 major change |
| **Background** (Tier 4) | Seasonal, slow demographic | 0.3 (30 units) | 1 minor change |

### 2.3 Change Costs

| Change Type | Cost | Example |
|-------------|------|---------|
| Tag weight recalculation | 5 | Recompute `[domain_1]` weight from 0.72 to 0.65 |
| Stakeholder reinference | 10 | Detect new `[expert_role]` emerging |
| Feature spawn | 25 | Instantiate adaptive quiz engine |
| Tone adjustment (1 dimension) | 15 | Shift Clio register from `inquiry` to `warmth` for supporters |
| UI layout change | 40 | Switch beneficiary surface from timeline to card grid |
| Cluster spawn proposal | 60 | Propose "Topic Extension Bridge" linked cluster |
| Curriculum extension | 20 | Add Level 5 (next topic) to learning path |
| Content strategy shift | 15 | Atlas shifts from external links to custom visuals |
| **Ecosystem dimension weight change (≤10%)** | **5** | **Shift `[core_dimension_id]` from 0.35 to 0.40** |
| **Ecosystem dimension weight change (>10%)** | **15** | **Shift `[supporter_confidence_dimension]` from 0.35 to 0.55** |
| **Ecosystem new dimension** | **20** | **Add `[new_dimension_id]` as new success dimension** |
| **Ecosystem stage split/merge** | **25** | **Split "[stage_id]" into two stages** |
| **Ecosystem purpose drift → spawn** | **60** | **Cluster has drifted from learning to support; propose spawn** |

### 2.4 Budget Rules

1. **Budget resets weekly.** Unused capacity does NOT roll over.
2. **Crisis tier bypasses budget entirely.** Act first, account later.
3. **If a change exceeds remaining budget:** Queue for next week OR escalate to admin with urgency justification.
4. **Reversal costs the same as the original change.** The system must be willing to undo wrong decisions.

---

## 3. The Decision Loop

Every proposed change follows this loop:

```
1. DETECT      → Observer or agent notices a signal
2. CLASSIFY    → Assign urgency tier (1–4)
3. EVALUATE    → Score evidence strength, confidence, sentiment
4. ASSESS      → Estimate jarring-ness (how disruptive to members?)
5. DECIDE      → Act now / queue / escalate to admin
6. COMMUNICATE → Agent tells members what changed and why
7. MONITOR     → Track whether the change helped
8. LEARN       → Feed outcome back into future inference
```

### 3.1 Step 5: DECIDE

```typescript
function decideAction(
  proposal: EvolutionProposal,
  budget: EvolutionCapacityBudget
): Decision {
  // Genesis Re-Eval gate: paradigm-shift proposals take precedence
  if (proposal.genesis_re_eval_flag === true) {
    // Hard pivot from Genesis Re-Eval — route per disruption level
    if (proposal.disruption_level === 'high') {
      return { action: 'escalate_to_admin', reason: 'genesis_hard_pivot_high_disruption' };
    }
    if (proposal.disruption_level === 'medium') {
      return { action: 'escalate_to_admin', reason: 'genesis_hard_pivot_medium_disruption' };
    }
    // Low disruption hard pivots: auto-approve unless admin veto window active
    if (proposal.admin_veto_window_active) {
      return { action: 'queue_next_week', reason: 'genesis_hard_pivot_veto_window' };
    }
    return { action: 'act_now', consume_budget: proposal.cost };
  }

  if (proposal.tier === 'tier_1_crisis') {
    return { action: 'act_immediately', bypass_budget: true };
  }

  if (proposal.cost <= budget.remaining) {
    return { action: 'act_now', consume_budget: proposal.cost };
  }

  if (proposal.tier === 'tier_2_strong_demand') {
    return { action: 'escalate_to_admin', reason: 'budget_exceeded_but_urgent' };
  }

  return { action: 'queue_next_week', reason: 'budget_exceeded' };
}
```

### 3.1a Ecosystem Proposal Routing (NEW)

Ecosystem proposals follow **phase-gated routing** based on `ecosystem_phase`:

| Ecosystem Phase | Proposal Type | Route | Auto-Action |
|---------------|--------------|-------|-------------|
| **Seed** | Any ecosystem change | **Blocked** — no auto-proposals | Admin must edit manually via dashboard |
| **Sprout** | Weight change ≤ 10% | Auto-approve if budget allows | Update `success_model.dimension.weight` |
| **Sprout** | Weight change > 10% | Admin notification + 48h window | Admin approves/rejects/vetoes |
| **Sprout** | New dimension | Admin notification + batch digest | Admin approves with rationale |
| **Sprout** | Dimension deprecation | Admin notification | Admin approves; preserves history |
| **Canopy** | Any change | Member poll + admin veto | Clio polls members; admin has final veto |
| **Canopy** | Purpose drift → spawn | Urgent admin review | Never auto-approve; human decides spawn vs sub-surface |
| **Any** | Genesis Re-Eval hard pivot (ecosystem_type change) | Admin approval + 48h veto window | Medium/high disruption: manual approval required. Low disruption: auto-approve unless vetoed. |
| **Any (minor cluster)** | Minor-facing content, success model, or progression change | Guardian consent required | Guardian veto overrides admin in minor-safety contexts. Admin cannot deploy without guardian acknowledgment. |

**Guardian-intent drift rule:** If any `guardian_intent` dimension drops below its `floor_weight`, the proposal is **always** routed to urgent admin review, regardless of phase or confidence. This is a hard guardrail.

**Genesis Re-Eval gate rule:** Proposals flagged with `genesis_re_eval_flag = true` bypass standard phase-gated routing. They are evaluated by disruption level first, ecosystem phase second. See `CLUSTER_GENESIS_ENGINE.md` §10 for the full Re-Eval specification.

**Guardian consent gate (NEW):** For clusters where `has_minor_members = true`, any proposal that changes:
- Minor-facing content (Sage prompts, Clio responses, learning cards)
- Success model dimensions that measure minor outcomes
- Progression model stages or mastery criteria
- Social layer enablement/disablement

...requires **explicit guardian consent** before deployment. The guardian (cluster Admin) receives a notification with:
- What is changing
- Why it is changing
- Estimated impact on the minor's experience
- Approve / Request modifications / Veto options

A guardian veto overrides even admin approval in minor-safety contexts. The veto is logged in `evolution_proposals.guardian_veto_reason`.

**Reverse transition rule:** If cluster shrinks from Canopy → Sprout or Sprout → Seed, all pending ecosystem proposals are cancelled. Admin is notified. New proposals follow the simpler phase rules.

### 3.2 Step 6: COMMUNICATE

The agent **never** changes things silently. It tells members:

> "I heard that the pizza model wasn't working for several of you. I've added a number line version and a step-by-step walkthrough. Try it this week and let me know if it's better."

**Communication rules:**
- Always reference the specific signal that triggered the change
- Always invite feedback
- Never claim full knowledge — "I'm trying this because…" not "This is the solution"
- Tone matches the recipient's `soul_manifestation_profile`

### 3.3 Step 7: MONITOR

Every change is tracked for 7 days:

```typescript
interface ChangeOutcome {
  proposal_id: string;
  change_type: string;
  target_cluster_id: string;
  applied_at: Date;
  monitoring_window_days: 7;
  metrics: {
    engagement_delta: number;      // +0.15 = 15% increase
    satisfaction_delta: number;      // from member feedback
    completion_delta: number;        // for learning clusters
    reversal_rate: number;           // % of members reverting behavior
  };
  outcome_verdict: 'helped' | 'no_effect' | 'worsened' | 'inconclusive';
}
```

### 3.4 Step 8: LEARN

Outcomes feed into `observer_learnings`:

```typescript
interface ObserverLearning {
  id: string;
  cluster_type: string;
  inferred_composition_snapshot: JSON;
  change_type: string;
  outcome_verdict: string;
  confidence_adjustment: number;   // e.g., +0.05 for this change type in similar clusters
}
```

If outcome is `worsened`:
- Add change type to cluster's `suppressed_actions` list (14-day cooldown)
- Trigger reversal proposal with same priority as original

---

## 4. Reversal Mechanism

The system must be able to reverse course openly.

**Trigger:**
- Outcome monitoring shows `worsened` or strong `reversal_rate`
- Member feedback explicitly requests undo: "Go back to the old way"
- Admin override

**Process:**
1. Observer proposes reversal with same cost as original change
2. Admin approves (or auto-approves if confidence > 0.80 and tier >= 2)
3. Agent communicates reversal:
   > "I added audio walkthroughs last week, but I've noticed fewer beneficiaries completing lessons now. Maybe audio isn't the right fix. I'm trying a simpler visual model instead."
4. Original change is archived in `evolution_history` with `outcome: reversed`

---

## 5. Admin Dashboard: Evolution Panel

```
Cluster: [Supporter + Beneficiary Learning Service]
┌─────────────────────────────────────────────┐
│ Evolution Status                            │
│ Week: 2026-W23                              │
│ Capacity: 100 / 100 (Tier 3 — Normal)     │
│ Consumed: 35                                │
│ Remaining: 65                               │
│                                             │
│ Active Proposals                            │
│ [Approve] Audio walkthroughs (cost: 15)     │
│   Evidence: 8 supporter mentions, confidence 0.78│
│ [Approve] Shift `supporter_confidence` to 0.45│
│   Cost: 5 | Phase: Sprout | Auto-approved   │
│ [Review] Add `peer_support` dimension         │
│   Cost: 20 | Phase: Sprout | Needs admin    │
│                                             │
│ Recent Changes                              │
│ ✅ Interactive visualizer spawned (Day 1)  │
│ ✅ Clio tone shifted to warmth (Day 14)    │
│   Outcome: engagement +12%, satisfaction +0.3│
│ ✅ `[core_dimension_id]` weight 0.35→0.40│
│   Outcome: health_score +0.08                │
│                                             │
│ Reversal Queue                              │
│ [Review] Revert audio walkthrough?          │
│   Reason: completion rate dropped 18%       │
│                                             │
│ Ecosystem Health (this cluster)             │
│ Phase: Sprout | Health Score: 0.72 ▲       │
│ [core_dimension_id]: 0.42 ▲                 │
│ [supporter_confidence_dimension]: 0.28 ▼    │
│ [beneficiary_engagement_dimension]: 0.65 ▲    │
│                                             │
│ Composition Trend (30 days)                   │
│ [domain_1]: 0.85 → 0.72 ▼                   │
│ emotional_support: 0.48 → 0.61 ▲           │
└─────────────────────────────────────────────┘
```

---

## 6. Integration with Other Systems

| System | Integration |
|--------|------------|
| **Genesis Engine** | Sets initial `inferred_composition`, `stakeholders`, `agent_maturity`, **`cluster_ecosystem_spec`**. Governor takes over post-creation. |
| **Observer Introspection** | Signal classification feeds into Governor. Dimension 7 (Composition Inference) and **Dimension 8 (Ecosystem Health)** trigger Governor proposals. |
| **Prompt Builder** | Per-recipient `soul_manifestation_profile` is injected into Layer 3 based on current composition. |
| **Admin Dashboard** | Proposal inbox, evolution log, composition trends, reversal queue. |
| **Platform Rules** | All proposals pass validation layer before execution. Soul invariants are never overridden. |

---

## 7. Schema

### `evolution_proposals`

```sql
CREATE TABLE evolution_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
  proposal_type VARCHAR(64) NOT NULL,
    CHECK (proposal_type IN ('tag_recalculation', 'stakeholder_reinference', 'feature_spawn',
                             'tone_adjustment', 'ui_layout_change', 'cluster_spawn_proposal',
                             'curriculum_extension', 'content_strategy_shift', 'reversal',
                             'ecosystem_weight_change', 'ecosystem_new_dimension', 'ecosystem_stage_change',
                             'ecosystem_deprecation', 'ecosystem_spawn_recommendation')),
  tier VARCHAR(32) NOT NULL CHECK (tier IN ('tier_1_crisis', 'tier_2_strong_demand', 'tier_3_emerging', 'tier_4_background')),
  cost INT NOT NULL,
  evidence JSONB NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  jarringness_score DECIMAL(3,2) NOT NULL,  -- 0.0 = invisible, 1.0 = disruptive
  status VARCHAR(32) NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'approved', 'rejected', 'implemented', 'reversed')),
  admin_approved_at TIMESTAMPTZ,
  admin_approved_by UUID REFERENCES profiles(id),
  implemented_at TIMESTAMPTZ,
  outcome_verdict VARCHAR(32),
    CHECK (outcome_verdict IN ('helped', 'no_effect', 'worsened', 'inconclusive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `evolution_budget_log`

```sql
CREATE TABLE evolution_budget_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  base_capacity INT NOT NULL DEFAULT 100,
  tier_multiplier DECIMAL(3,1) NOT NULL,
  actual_capacity INT NOT NULL,
  consumed INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

*Evolution Governor · Phase 1 · 2026-06-06*
*Authoritative for cluster post-creation adaptation and change governance.*
