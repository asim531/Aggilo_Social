# Yantra Memory Architecture — Cross-Agent Audit

## Executive Summary

The memory architecture is **well-designed at the specification level** but has **6 gaps** that will cause production issues if not addressed before launch. The core design is sound — Supabase as the shared memory store, stateless workers, and clear read/write boundaries per agent. But several inter-agent memory handoff paths have undefined behavior under edge conditions.

---

## Memory Architecture Map

Every agent's memory interaction follows this pattern:

```
Job arrives → Worker reads state from Supabase → Assembles context
    → LLM call → Worker writes results back to Supabase
    → Worker is destroyed (stateless)
```

**There is no in-memory state between job executions.** This is correct and production-safe. The risk is in *what* gets read and written, and *when*.

### Per-Agent Memory Breakdown

| Agent | Reads | Writes | Memory Scope |
|---|---|---|---|
| **Clio** | USER.md, MEMORY.md (premium), conversation_history, cluster_activity | Updated USER.md, updated MEMORY.md, clio_sessions, personality_signals | Per-user |
| **Sage** | cluster_posts, cluster_members (aggregate), arc_phase, atlas_cards, poll_feedback | cluster_posts, arc_phase transitions, sage_description_proposals, clio_sage_signals | Per-cluster (hard boundary) |
| **Atlas** | cluster AGGIL segment, existing_pulse_topics, atlas_engagement_weights, poll_rl_context | cluster_pulse_cards, atlas_calibration_history | Per-cluster |
| **Scout** | card_visit_events, cluster_card metadata | scout_intelligence_reports, scout_outreach_reports | Per-cluster (read-only from external) |
| **Observer** | All tables (read-only scan) | observer_findings (with dedup signature) | Platform-wide |

---

## What Works Well ✅

### 1. Supabase as Single Source of Truth
All agent state lives in Supabase. No agent caches state between jobs. This eliminates stale-state bugs and makes horizontal scaling safe — any Yantra instance can process any job.

### 2. Sage Cluster-Scope Isolation
Hard boundary: Sage in Cluster A has zero knowledge of Cluster B. This is enforced at the `assembler.py` level — the context assembler only loads data for the cluster_id in the job payload. Architecturally sound.

### 3. Soul Injection Versioning
The `[SOUL v1.0 · TIER {n} · {agent_name}]` header + 14-day shadow comparison + 15-minute rollback SLA is production-grade.

### 4. Observer Deduplication
`finding_signature` hash + `occurrence_count` prevents notification storms. Auto-escalation at 3× pending is smart.

### 5. Handoff Packet Schema
Clio → Sage handoff is fully specified with required fields, timeout handling, and refinement rounds. Memory transfer at handoff is explicit and auditable.

---

## Gaps Found 🔴

### Gap 1: Free-Tier Conversation Continuity is Zero

**The problem:** Free-tier users have no conversation history persistence between sessions. Each Clio turn starts fresh from AGGIL profile + cluster activity only.

**Impact:** A user who shares something vulnerable in session 1, then returns in session 2, meets a Clio who has no memory of it. This is documented and intentional — but the **transition between sessions** is undefined.

**What's missing:** There is no spec for how Clio handles a session ending. Specifically:
- When does a session *end*? (Timeout? User navigates away? Explicit close?)
- Is there any "session summary" written before the context is discarded?
- Can Clio use the current session's context within a session (yes — conversation_history is sent per-turn), but what defines the boundary of "current session"?

**Fix needed:**
```yaml
# Add to CLIO_SAGE_HANDOFF or CLIO_AGENTS:
session_lifecycle:
  session_start: "First message from user after >30 minutes of inactivity"
  session_end: "30 minutes of user inactivity OR explicit app close"
  free_tier_on_end: "Discard conversation_history. No write-back to USER.md."
  premium_on_end: "Write session_summary to MEMORY.md curated_insights. Update USER.md interaction_log."
```

### Gap 2: USER.md Write-Back Contention

**The problem:** USER.md is read at job start and written at job end. But what happens if two Clio jobs fire for the same user simultaneously? (e.g., user sends two messages rapidly before the first response returns)

**The scenario:**
```
T0: Job A reads USER.md (version 1)
T1: Job B reads USER.md (version 1)  ← still version 1, Job A hasn't written back yet
T2: Job A writes USER.md (version 2) — adds "user prefers humor"
T3: Job B writes USER.md (version 2') — adds "user asked about clusters"
     → Job B's write OVERWRITES Job A's "prefers humor" signal
```

**Impact:** Lost personality signals, lost interaction log entries. Silent data loss.

**Fix needed:**
- Option A: **Serialize Clio jobs per user** — Redis lock on `clio:user:{user_id}` before processing. Simple, slight latency.
- Option B: **Append-only writes** — instead of writing the full USER.md back, append deltas to a `user_context_updates` table. A background job reconciles periodically.
- **Recommendation:** Option A. Clio turns are inherently sequential for a single user — a user can't meaningfully have two conversations simultaneously.

### Gap 3: Sage → Clio Welfare Escalation Memory Gap

**The problem:** When Sage detects a welfare signal and escalates to Clio, the spec says Clio handles it. But:
- Clio's context at that moment is assembled from USER.md — which contains **no cluster context** (cluster scope is Sage's domain)
- The welfare signal originated from specific posts in a specific cluster
- Clio needs to know *what happened* to respond appropriately, but her context assembly only loads user-level data

**What's specified:** Sage escalates → Clio checks if user is active → Clio engages.

**What's missing:** The escalation payload schema. What data does Sage pass to Clio in the `crisis_flag` signal?

**Fix needed:**
```json
// clio_sage_signals — crisis_flag payload
{
  "signal_type": "crisis_flag",
  "user_id": "uuid",
  "cluster_id": "uuid",
  "payload": {
    "triggering_post_content": "The specific post that triggered detection",
    "detection_reason": "crisis_language | self_harm_indicator | isolation_expression",
    "cluster_context_summary": "Brief Sage-authored summary of the conversational context (max 200 tokens)",
    "sage_recommendation": "Sage's suggested approach for Clio",
    "last_5_posts_in_cluster": [...]  // Gives Clio immediate conversational context
  }
}
```

Without this, Clio receives a `crisis_flag` signal but has no idea what was said or what context surrounds it. She'd have to respond blind.

### Gap 4: Atlas Calibration Memory Has No Rollback

**The problem:** When Atlas calibration adjusts `atlas_engagement_weights` for a cluster, the adjustment directly affects all future Atlas briefs. But if a calibration produces bad results (e.g., an inference-mode weight shift based on noisy data), there's no rollback mechanism.

**What's specified:** Calibration writes to `atlas_calibration_history` with mode and sample sufficiency.

**What's missing:** A way to revert weights to pre-calibration values.

**Fix needed:**
```sql
ALTER TABLE atlas_calibration_history ADD COLUMN previous_weights JSONB;
-- Stores the weights BEFORE this calibration cycle applied changes
-- Enables one-click rollback: UPDATE clusters SET atlas_engagement_weights = previous_weights
```

### Gap 5: Clio MEMORY.md Has No Size Cap

**The problem:** MEMORY.md is append-only. Premium users who stay active for months/years will accumulate unbounded memory. The doc says "curated periodically" but doesn't specify by whom, when, or how.

**What's specified:** "Append-only and should be curated periodically — surfacing the highest-signal insights and pruning low-value entries."

**What's missing:** Who curates? When? What's the token ceiling before compression triggers?

**Fix needed:**
```yaml
memory_lifecycle:
  max_tokens: 2000  # Hard ceiling on MEMORY.md content
  curation_trigger: "When MEMORY.md exceeds 1500 tokens"
  curation_method: "user_md_compression op routed through Yantra"
  curator: "Clio — same LLM call that generates session responses can also prune MEMORY.md"
  curation_cadence: "Checked at the end of every session. Pruned if over 1500 tokens."
  pruning_rule: "Oldest low-signal insights removed first. Community-level patterns preserved over individual observations."
```

### Gap 6: Observer → Agent Action Memory Chain

**The problem:** When Observer finds an issue and admin approves an action, the action triggers a job (e.g., Sage reengagement). But the triggered job has no memory that it was Observer-initiated.

**Why it matters:** If Sage sends a reengagement post because Observer flagged a stalling cluster, and the cluster remains stalled, Observer will create another finding. But Observer doesn't know Sage already acted — because the action's origin isn't recorded in the cluster's state.

**Fix needed:**
```sql
-- On jobs triggered by Observer-approved actions:
ALTER TABLE yantra_jobs ADD COLUMN triggered_by_observer_finding_id UUID NULLABLE;
-- Observer can check: has an action already been triggered for this finding?
```

---

## Memory Flow Diagram — All Agents

```
┌──────────────────────────────────────────────────────────────┐
│                     SUPABASE (Single Source of Truth)          │
│                                                                │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  users       │  │  clusters     │  │  cluster_posts       │  │
│  │  USER.md     │  │  arc_phase    │  │  (all member+sage)   │  │
│  │  MEMORY.md   │  │  eng_weights  │  │                      │  │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                │                      │               │
│    ┌────▼────┐     ┌─────▼────┐          ┌──────▼──────┐       │
│    │  Clio   │     │  Sage    │          │  Observer   │       │
│    │  R/W    │     │  R/W     │          │  R only     │       │
│    └────┬────┘     └────┬────┘          └──────┬──────┘       │
│         │               │                      │               │
│         │          ┌────▼────┐                  │               │
│         │          │  Atlas  │                  │               │
│         │          │  R/W    │                  │               │
│         │          └────┬────┘                  │               │
│         │               │                      │               │
│         │          ┌────▼────┐         ┌───────▼───────┐      │
│         │          │  Scout  │         │ observer_     │      │
│         │          │  R/W    │         │ findings      │      │
│         │          └─────────┘         └───────────────┘      │
│         │                                                      │
│    ┌────▼────────────────────────────────────────────┐         │
│    │  clio_sage_signals (bidirectional async channel) │         │
│    └─────────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────┘
```

---

## Verdict

| Area | Status |
|---|---|
| Core stateless architecture | ✅ Sound |
| Supabase as single truth | ✅ Sound |
| Soul injection tiers | ✅ Sound |
| Cluster-scope isolation | ✅ Sound |
| Observer dedup | ✅ Sound |
| Handoff packet schema | ✅ Sound |
| Session lifecycle definition | 🔴 **Missing** (Gap 1) |
| Concurrent USER.md writes | 🔴 **Race condition** (Gap 2) |
| Welfare escalation payload | 🔴 **Underspecified** (Gap 3) |
| Calibration rollback | 🟡 **Missing** (Gap 4) |
| MEMORY.md size control | 🟡 **Missing** (Gap 5) |
| Observer → action tracking | 🟡 **Missing** (Gap 6) |

**Overall:** The architecture will work, but Gaps 1–3 should be fixed before production. Gaps 4–6 are launch-safe but need attention within 60 days.
