# Cluster Spawn Engine

> **Summary:** When a cluster's sub-topic or sub-community grows distinct enough to need its own space, the Spawn Engine proposes a linked cluster. Members choose to stay, join, or do both. The original cluster remains untouched.
>
> **Authority:** Subordinate to `AGGILO_SOUL.md` and `AGGILO_PLATFORM_RULES.md`. Demographic guardrails apply to spawned clusters exactly as they do to original clusters.
>
> **Companion documents:** `architecture/CLUSTER_GENESIS_ENGINE.md`, `architecture/EVOLUTION_GOVERNOR.md`

---

## 1. When to Spawn vs. When to Add a Feature

| Situation | Action | Example |
|-----------|--------|---------|
| Related topic, same stakeholders | **Add feature** | Members ask about "next sub-topic" → Add Level 5 to existing learning path |
| Related topic, different stakeholders | **Spawn cluster** | "My beneficiary has unique learning needs" → Needs different supporters, different tone, different tools → "Specialized Needs Circle" |
| Natural extension, same needs | **Add feature** | "Next topic" after current topic → New tool + learning path |
| Distinct community, different culture | **Spawn cluster** | "Specialized needs supporters" form a distinct support culture → Separate space |

**Rule:** Spawn when the sub-group's needs, tone, or stakeholder mix is meaningfully different from the parent cluster.

---

## 1.5 Spawn vs Sub-Surface (Conceptual Distinction)

> ⚠️ **Concept — not yet fully implemented.** Sub-surfaces are a planned architecture primitive. Only cluster spawn is currently wired in the implementation spec. See `architecture/CONCEPTS/SUB_CLUSTER.md` for the placeholder concept document.

Some clusters serve two stakeholder groups that are bound in a tight service loop (e.g., supporter + beneficiary). In these cases, spawning a separate cluster would break the relationship. Instead, the cluster may define **sub-surfaces** — firewalled content feeds and UI surfaces within the same cluster identity.

| Criterion | Spawn New Cluster | Create Sub-Surface |
|-----------|-------------------|-------------------|
| **Member relationship** | Independent | Bound in a service loop (supporter ↔ beneficiary) |
| **Identity** | New purpose, new tags, new AGGIL | Same purpose, shared AGGIL, same cluster identity |
| **Admin lifecycle** | Separate dashboard, separate evolution budget | Shared admin, shared budget, shared Observer |
| **Member choice** | Member must actively choose to join | No choice — both surfaces are part of the same membership |
| **Auth model** | Standard Aggilo auth (phone/OTP) | May require dual auth (supporter auth + beneficiary auth) |
| **UI surface** | Standard Timeline (single feed) | Dual feed (supporter Timeline + beneficiary card grid) |
| **Agent register** | Single register per cluster | Multiple registers per sub-surface |

**Decision signal:** If the sub-group's needs are meaningfully different → **spawn**. If the two groups are inextricably linked in a single learning journey → **sub-surface**.

**Current examples:**
- ✅ **Spawn** → "Topic Extension Cluster" (natural extension, same stakeholder type, member chooses to migrate)
- 📝 **Sub-surface (concept)** → "Supporter + Beneficiary Learning Space" supporter sub-space + beneficiary sub-space (same service loop, dual auth, shared admin)

---

## 2. Spawn Detection Signals

The Spawn Engine monitors for these signals (via Observer Dimension 7):

| Signal | Threshold | Confidence |
|--------|-----------|------------|
| Recurring sub-topic | 8+ distinct posts in 14 days | ≥ 0.70 |
| Stakeholder divergence | ≥ 30% of active members have different needs than inferred | ≥ 0.75 |
| Tone friction | Members of sub-group say "this doesn't fit here" | ≥ 0.80 |
| Feature requests that conflict | Sub-group wants X, parent cluster needs not-X | ≥ 0.65 |
| Organic sub-community formation | Members consistently reply to each other, not main threads | ≥ 0.75 |

---

## 3. Spawn Proposal Format

When signals sustain, Observer generates a spawn proposal:

```json
{
  "proposal_type": "cluster_spawn",
  "parent_cluster_id": "uuid",
  "link_type": "sequel",  // sequel | spinoff | sibling
  "proposed_cluster": {
    "name": "[Topic A to Topic B Bridge]",
    "purpose_statement": "[For supporters whose beneficiaries have mastered Topic A and are ready for Topic B]",
    "inferred_composition": {
      "domain_1": { "weight": 0.90, "confidence": 0.88 },
      "domain_2": { "weight": 0.85, "confidence": 0.91 },
      "domain_3": { "weight": 0.40, "confidence": 0.65 }
    },
    "stakeholders": {
      "supporter_1": {
        "weight": 0.90,
        "needs": ["curriculum_extension", "progress_visibility"],
        "pain_points": ["beneficiary_ready_for_next_topic"]
      }
    },
    "soul_manifestation_profile": {
      "default": { "primary_register": "inquiry", ... },
      "supporter_1": { "primary_register": "inquiry", "celebration_mode": "milestone" }
    },
    "feature_spawn_candidates": [
      {
        "feature_id": "[next_topic_visualizer]",
        "probability": 0.85,
        "auto_spawn": true,
        "ui_placement": "primary_timeline_embed"
      }
    ],
    "demographic_guardrails": {
      "min_age": 18,
      "interests": ["[domain_interest_1]", "[domain_interest_2]"],
      "language": "[inferred_language]"
    }
  },
  "migration_path": {
    "auto_invite_source_cluster": true,
    "auto_invite_filter": "members_who_engaged_with_sub_topic",
    "member_choice": "stay_in_parent_or_join_new_or_both",
    "default_action": "stay_in_parent"
  },
  "evidence": {
    "trigger_signals": 12,
    "sample_posts": ["...", "..."],
    "confidence": 0.82,
    "rationale": "[Members repeatedly ask about next topic; existing cluster purpose is focused on current topic only]"
  }
}
```

---

## 4. Link Types

| Type | Relationship | Member Flow | Use Case |
|------|-----------|-------------|----------|
| **Sequel** | Child succeeds parent | Members graduate from parent to child | Topic A → Topic B |
| **Spinoff** | Child branches from parent | Members can be in both | General support → Specialized support |
| **Sibling** | Parallel cluster, same origin | Members choose one or both | Two language variants of same topic |

---

## 5. Migration Path

### 5.1 Member Choice

Members always choose. Never auto-migrate.

```
Spawn proposal approved by admin
    │
    ├── New cluster created (same founder/admin)
    │
    ├── Relevant members notified via Clio DM:
    │   "A new cluster '[Name]' was created for [purpose].
    │    You're invited because [reason]. Join?"
    │
    ├── Member response:
    │   [ ] Join new cluster
    │   [ ] Stay in current cluster only
    │   [ ] Join both
    │
    └── Member choice recorded, no default assumption
```

### 5.2 Content Flow

| Direction | Allowed | Example |
|-----------|---------|---------|
| Parent → Child | One-way curated | Parent cluster tips → Child cluster resource library |
| Child → Parent | No | Child cluster content stays in child |
| Bidirectional member mentions | Yes | @mention across linked clusters |

---

## 6. Admin Dashboard: Spawn Panel

```
Cluster: [Supporter + Beneficiary Learning Service]
┌─────────────────────────────────────────────┐
│ Spawn Proposals                             │
│                                             │
│ [Review] Topic Extension Bridge              │
│   Confidence: 0.82                          │
│   Trigger signals: 12                       │
│   Estimated members: 18 (of 45 total)       │
│   [Approve] [Reject] [Modify]               │
│                                             │
│ Linked Clusters                             │
│ None                                        │
│                                             │
│ Spawn History                               │
│ None                                        │
└─────────────────────────────────────────────┘
```

---

## 7. Constraints

1. **Demographic guardrails apply.** Spawned clusters must pass Genesis Engine introspection.
2. **Original cluster unchanged.** Never modify parent cluster demographics or purpose.
3. **Member choice is absolute.** Never auto-enroll members into spawned clusters.
4. **Soul invariants apply.** Spawned clusters are subject to the same Soul prohibitions.
5. **No infinite spawning.** A cluster can have at most 3 active spawn proposals at once.
6. **Cooldown:** Minimum 30 days between spawn approvals for the same parent cluster.

---

## 8. Schema

### `cluster_spawn_proposals`

```sql
CREATE TABLE cluster_spawn_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_cluster_id UUID NOT NULL REFERENCES clusters(id),
  proposed_cluster_name VARCHAR(256) NOT NULL,
  purpose_statement TEXT NOT NULL,
  link_type VARCHAR(32) NOT NULL CHECK (link_type IN ('sequel', 'spinoff', 'sibling')),
  inferred_composition JSONB NOT NULL,
  stakeholders JSONB NOT NULL,
  soul_manifestation_profile JSONB NOT NULL,
  feature_spawn_candidates JSONB DEFAULT '[]',
  demographic_guardrails JSONB NOT NULL,
  migration_path JSONB NOT NULL,
  evidence JSONB NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'admin_approved', 'admin_rejected', 'implemented', 'archived')),
  admin_decision_at TIMESTAMPTZ,
  admin_decision_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `cluster_links`

```sql
CREATE TABLE cluster_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_cluster_id UUID NOT NULL REFERENCES clusters(id),
  child_cluster_id UUID NOT NULL REFERENCES clusters(id),
  link_type VARCHAR(32) NOT NULL CHECK (link_type IN ('sequel', 'spinoff', 'sibling')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (parent_cluster_id, child_cluster_id)
);
```

---

*Cluster Spawn Engine · Phase 1 · 2026-06-06*
*Authoritative for sub-community detection and linked cluster creation.*
