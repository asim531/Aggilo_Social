# Agentic Feature Signals

> **Authority:** How Clio organically captures member needs, how Observer reviews them, and how they feed into Cluster Intelligence — without forced pipeline feeding or protocol disclosure.
> **Expert profile:** Human Behavioral & UX Expert · Agentic Systems Architect

---

## 1. Core Principle

Feature signals are **organic needs captured from natural conversation**. Clio never solicits features. She records them when members mention them in context.

**Key rules:**
- Never solicit: "What features do you want?" is banned.
- Distinguish individual vs. current-cluster vs. cross-cluster needs.
- Raw signals (with user_id) are **never surfaced** to any human or agent.
- Only aggregated signals reach CIM Functional Module.

---

## 2. Capture Rules (Clio)

### 2.1 When Clio Records a Signal

Clio records a signal when ALL of these are true:
1. Member mentions a need in natural conversation (not in response to Clio asking).
2. The need is specific enough to act on (not "make it better").
3. It is not a feature the cluster already has.
4. It does not violate platform rules (no protocol disclosure, no welfare automation, etc.).

### 2.2 Signal Classification

Clio classifies each signal into one of three scopes:

| Scope | Definition | Example |
|-------|-----------|---------|
| **Individual** | Personal need, not representative | "I wish I could change my font size" |
| **Current-cluster** | Relevant to this cluster's purpose | "We need a way to track paper references" |
| **Cross-cluster** | Would benefit multiple clusters | "It would be nice if all research circles had citation tools" |

Only **current-cluster** and **cross-cluster** signals are stored. Individual needs route to member support or profile settings, not feature signals.

### 2.3 Schema

```sql
CREATE TABLE feature_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  signal_text TEXT NOT NULL,
  signal_scope VARCHAR(32) NOT NULL CHECK (signal_scope IN ('current_cluster','cross_cluster')),
  signal_type VARCHAR(32) NOT NULL CHECK (signal_type IN ('tool_request','feature_idea','workflow_gap','integration_need')),
  status VARCHAR(32) NOT NULL DEFAULT 'captured' CHECK (status IN ('captured','observer_reviewed','cim_queued','implemented','rejected')),
  
  -- Deduplication
  feature_hash VARCHAR(64) NOT NULL,  -- Normalized hash of signal text for dedup
  frequency_count INT DEFAULT 1,       -- Incremented when same feature mentioned again
  first_mentioned_at TIMESTAMPTZ DEFAULT NOW(),
  last_mentioned_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Source
  source VARCHAR(32) NOT NULL CHECK (source IN ('clio_cli','sage_polling','member_vote')),
  source_post_id UUID REFERENCES posts(id),  -- Optional: which post contained the signal
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for deduplication queries
CREATE INDEX idx_feature_signals_hash ON feature_signals(cluster_id, feature_hash);
```

### 2.4 Deduplication Logic

```
New signal arrives
    │
    ├── Compute feature_hash (normalized lowercase, stemmed, stopwords removed)
    │
    ├── Query: SELECT * FROM feature_signals WHERE cluster_id = ? AND feature_hash = ?
    │
    ├── Match found → frequency_count++, update last_mentioned_at
    │   (user_id stored for debugging but NEVER surfaced)
    │
    └── No match → INSERT new row
```

---

## 3. Observer Review (Domain 11)

### 3.1 Monthly Review Cycle

Observer reviews feature signals monthly. **It does not judge merit** — that is CIM Functional Module's job. Observer only checks:

1. **Platform rule compliance** — Does this signal violate any immutable rule?
2. **Safety** — Does it create welfare, safety, or privacy risks?
3. **Protocol disclosure risk** — Would implementing it require explaining internal mechanics to members?
4. **K-anonymity compliance** — Can this signal be aggregated without identifying individuals?

### 3.2 Observer Actions

| Check | Pass | Fail |
|-------|------|------|
| Rule compliance | Status → `observer_reviewed` | Status stays `captured`, flagged to platform admin with note |
| Safety | Proceed to CIM queue | Escalate to welfare protocol (human review) |
| Protocol disclosure | Proceed | Reject with rationale |
| K-anonymity | Aggregate for CIM | Hold until cluster reaches 8 members |

### 3.3 No Forced Pipeline Feeding

Observer reviews signals **on its own schedule**. It does not:
- Rush review because a cluster admin requested it.
- Skip review for "urgent" signals.
- Forward signals directly to the tool proposal chain.

Reviewed signals are made available to CIM Functional Module. CIM decides whether to act on them.

---

## 4. Privacy Boundaries

### 4.1 Raw Signal Protection

**Raw `feature_signals` rows (with `user_id`) are NEVER surfaced to:**
- Any human (admin, founder, member)
- Any agent (Clio, Sage, Atlas, Observer)
- Any API response
- Any dashboard view

They exist only for:
- Deduplication (internal query)
- Platform admin debugging (queryable with full audit logging)
- Legal compliance (if required)

### 4.2 Aggregated Signal Exposure

Signals are exposed to CIM Functional Module ONLY when:
- `frequency_count >= 3` (same feature, same cluster), OR
- Cluster has `>= 8 members` (k-anonymity)

**Exposed fields:** `signal_text`, `signal_scope`, `signal_type`, `frequency_count`, `source`.
**NEVER exposed:** `user_id`, `source_post_id`.

### 4.3 Small Cluster Protection

Clusters with < 8 members:
- Signals are captured and stored for deduplication.
- They are NOT shown in any aggregation.
- Observer still reviews them for rule compliance.
- Once cluster reaches 8 members, historical signals become eligible for aggregation.

---

## 5. CIM Functional Module Integration

### 5.1 Input

CIM Functional Module receives aggregated feature signals as one of its data sources:

```json
{
  "feature_signals": [
    {
      "signal_text": "Need citation tracking for papers",
      "signal_scope": "current_cluster",
      "signal_type": "tool_request",
      "frequency_count": 5,
      "source": "clio_cli"
    }
  ],
  "cluster_size": 12,
  "k_anonymity_met": true
}
```

### 5.2 Processing

CIM Functional Module:
1. Checks `platform_tools` — does a matching global tool already exist?
   - Yes → Recommend enabling (one-click for admin/Genesis).
   - No → Evaluate for tool proposal.
2. Cross-references with other CIM data (behavioural patterns, member activity).
3. Outputs a priority-ranked list of capability gaps.

### 5.3 No Direct Implementation

CIM Functional Module **recommends**. It does not:
- Build tools.
- Enable tools.
- Modify cluster configuration.

Its output feeds into the standard tool proposal chain (Observer → Clio → Sage → Atlas → admin approval).

---

## 6. Global Tool Check Before Proposing

Before any agent proposes a new tool, it MUST check `platform_tools`:

```
Member says: "We need a way to track references"
    │
    ├── Clio checks platform_tools for "citation_manager", "reference_tracker", "bibliography"
    │   Match found → "Great! There's a citation tool available. I can enable it."
    │   No match → Record signal, proceed to proposal chain
    │
    └── Sage (in polling) detects citation gap
        Checks platform_tools → Match found → Recommend enable in CIM report
        No match → Include in Functional Module output
```

This prevents reinventing wheels.

---

## 7. Admin Dashboard Integration

```
Feature Signals Panel
┌─────────────────────────────────────────────────────────┐
│ Feature Signals (aggregated only)                       │
│                                                         │
│ "Citation tracking" — mentioned 5 times                 │
│   [Send to CIM →]  [Dismiss]                          │
│                                                         │
│ "Event scheduling" — mentioned 3 times                  │
│   [Send to CIM →]  [Dismiss]                          │
│                                                         │
│ 🔒 K-Anonymity Shield: 3 signals held privately         │
│    (cluster has 5 members; signals appear at 8)        │
└─────────────────────────────────────────────────────────┘
```

**Admin actions:**
- **Send to CIM:** Add signal to CIM Functional Module queue for evaluation.
- **Dismiss:** Mark as rejected. Signal removed from aggregation. Logged for audit.

---

## 8. Constraints

1. **Clio never solicits features** — only records organic mentions.
2. **Raw signals never surfaced** — only aggregated, k-anonymity-compliant data.
3. **Observer reviews for compliance, not merit** — CIM evaluates merit.
4. **No forced pipeline feeding** — Observer reviews on its schedule.
5. **Global tool check first** — before any proposal, check if tool already exists.
6. **Phase 0 does not implement** — signal capture is main-product only.
7. **No protocol disclosure** — members never know why a feature is or isn't available.
