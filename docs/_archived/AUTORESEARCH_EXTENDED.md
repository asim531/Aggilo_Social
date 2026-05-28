# AutoResearch — Extended Specification

> **Patch Document · v1.0**
> *Extends ATLAS_AGENTS_v1.1.md, SCOUT_AGENTS_v1.0.md, SAGE_AGENTS_v1.0.md, and MASTER_INSTRUCTIONS.md.*
> *AutoResearch covers two functions: content verification (Phase 1) and parameter self-improvement (Phase 2). Both are called AutoResearch because both serve the same purpose — making Atlas more accurate over time.*

---

## What AutoResearch Is

AutoResearch is Atlas's self-improvement system. It has two phases that run on different timescales:

**Phase 1 — Verification (runs on every card, every cycle)**
Real-time content authenticity check. Ensures every card Atlas returns to Sage is sourced, corroborated, and accurate before scoring. Hallucination guard.

**Phase 2 — Calibration Cycle (runs monthly, per cluster)**
Karpathy-inspired iterative parameter improvement. Atlas measures what actually worked — which content categories, formats, sources, and hooks produced genuine cluster engagement — and adjusts its scoring weights accordingly. The engagement signal is the metric. The weight adjustment is the experiment. The 14-day sample window is the training run.

These two phases are unified under AutoResearch because they serve the same goal: Atlas becoming more accurate, more targeted, and more useful to Sage over time. Verification ensures the inputs are clean. Calibration ensures the scoring logic improves from real outcomes.

---

## Phase 1 — Verification Protocol (unchanged, clarified)

Runs on every candidate content item before scoring. Six steps:

```
Step 1 — Primary fetch
  Atlas retrieves the candidate content item from its source list.

Step 2 — Cross-reference
  Atlas searches for at least one additional independent source
  corroborating the core claim, statistic, or event.
  If no corroboration found within 2 searches: item is flagged.

Step 3 — Recency check
  Verify published_at is within freshness_threshold_hours.
  If timestamp is ambiguous or missing: item is flagged.

Step 4 — Source authority check
  Is the source on the curated source list, or a known-credible
  domain for this content category?
  If neither: item is flagged.

Step 5 — Score
  Only unflagged items proceed to relevance scoring.
  Flagged items are either:
    (a) discarded silently if an alternative exists
    (b) passed with flag metadata if no alternative exists and
        relevance is high — Sage makes the final call.

Step 6 — Return
  Card batch returned to Sage with autoResearch metadata per card:
    autoResearch_passed: true/false
    corroborated: true/false
    corroboration_sources: []
    recency_verified: true/false
    source_authority: "curated_list" | "known_credible" | "unverified"
```

No card is ever returned to Sage without completing all six steps. No exceptions.

---

## Phase 2 — Calibration Cycle

### Overview

The Calibration Cycle is Atlas's improvement loop. It runs monthly per cluster. It reads real engagement outcomes — which cards Sage selected, which formats generated member-to-member discussion, which sources produced the highest interaction counts — and proposes weight adjustments to improve future scoring.

The structure is deliberately Karpathy-inspired:
- **Baseline** = current scoring weights (the "current train.py")
- **Candidate** = proposed weight adjustments (the "modified train.py")  
- **Experiment** = apply candidate weights to a 10% traffic sample for 14 days
- **Metric** = cluster engagement rate (member-to-member responses, not reactions)
- **Decision** = promote if candidate outperforms baseline; discard if not

This is not model fine-tuning. Atlas runs on API-accessed LLMs whose weights it cannot modify. What improves is the **scoring parameter layer**: source priorities, category weights, format preferences, demographic confidence adjustments, and hook quality thresholds. These are Atlas's "train.py."

### What Atlas Cannot Improve

- The underlying LLM model weights (Kimi K2.5, Llama 3.8b) — not accessible
- The AGGIL demographic segmentation logic — owned by Clio, not Atlas
- Sage's editorial judgment — Sage decides what to post, Atlas scores candidates

### What Atlas Does Improve

| Parameter | Description |
|-----------|-------------|
| `category_weights` | Which content categories score higher for this cluster's demographic |
| `format_weights` | Which content formats generate genuine engagement vs surface reactions |
| `source_weights` | Which sources in the priority list consistently produce verified, high-engagement cards |
| `hook_quality_threshold` | Minimum hook specificity score before a card passes to Sage |
| `demographic_confidence_floor` | Per-cluster threshold adjustment based on observed match accuracy |

### Calibration Cycle — Step by Step

```
AtlasCalibrationJob — Monthly, per active cluster

Step 1 — Snapshot baseline
  Read current scoring weights for this cluster from
  clusters.atlas_engagement_weights. Store as "baseline."
  If no prior calibration exists, use platform defaults.

Step 2 — Read outcome data (last 30 days)
  From cluster_pulse_cards for this cluster:
  - interaction_count per card
  - format per card
  - category per card
  - source_name per card
  - arc phase at time of posting
  - Whether card was Sage-selected (accepted) vs discarded
  - Whether card generated member-to-member responses
    (higher signal than reactions)

Step 3 — Generate candidate weight adjustments
  Atlas's scoring LLM (Llama 3.8b, temperature 0.1) reads the
  outcome data and produces candidate weight deltas:
  
  Example output:
  {
    "category_boost": {"startup": +0.15, "career": -0.08},
    "format_boost": {"video": +0.20, "long_form": -0.10},
    "source_boost": {"YourStory": +0.12, "LinkedIn": -0.05},
    "rationale": "Video format cards produced 3.2x member-to-member
                  responses vs article cards in this arc phase.
                  Career content generated reactions but no discussion."
  }

Step 4 — Apply to 10% sample
  For 14 days, 10% of this cluster's Atlas briefs use the
  candidate weights. 90% continue using baseline.
  Sample flag: atlas_calibration_sample: true on affected cards.

Step 5 — Measure
  After 14 days, compare:
  - Sample engagement rate (member-to-member responses / cards shown)
  - Baseline engagement rate (same metric, same period)

Step 6 — Decision
  IF sample_rate > baseline_rate by ≥ 5%:
    → Promote candidate weights to clusters.atlas_engagement_weights
    → Log to atlas_calibration_history: promoted = true
  ELSE:
    → Discard candidate weights, retain baseline
    → Log to atlas_calibration_history: promoted = false,
      discard_reason = observed delta
    → Next cycle tries a different adjustment vector

Step 7 — Welfare gate (non-negotiable)
  If this cluster has had a welfare escalation in the past 90 days:
    → Skip calibration entirely for this cycle
    → Log: skipped_welfare_gate = true
  Rationale: clusters with welfare signals are in a sensitive state.
  Scoring optimisation is inappropriate.
```

### Calibration History Schema

```sql
CREATE TABLE atlas_calibration_history (
  id UUID PRIMARY KEY,
  cluster_id UUID REFERENCES clusters(id),
  calibration_date DATE,
  baseline_weights JSONB,
  candidate_weights JSONB,
  sample_size_pct DECIMAL(3,1),   -- always 10.0 in v1.0
  sample_period_days INT,          -- always 14 in v1.0
  baseline_engagement_rate DECIMAL(5,4),
  sample_engagement_rate DECIMAL(5,4),
  promoted BOOLEAN,
  promotion_date TIMESTAMP,
  discard_reason TEXT,
  skipped_welfare_gate BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);
```

---

## Scout Zero-Signal Protocol (Inference Mode)

*Adds to SCOUT_AGENTS_v1.0.md as Section: Zero-Signal Protocol*

When Scout reads 20+ posts from a community and finds insufficient signal (`signal_strength < 0.50`), or when no relevant communities are found for a given demographic/interest combination, Scout does not return an empty report.

```
Step 1 — Inference
  Scout constructs a probability-weighted inference using:
  - Existing Aggilo user demographic data: age range, geography,
    interests of registered users in that city
  - Interest co-occurrence patterns from existing cluster activity
    ("users interested in ML in Hyderabad also frequently list
    startup culture — probability 0.74")
  - Geographic density signals from existing cluster membership

  The inference produces a suggested community or cluster gap.
  It is not a fabricated finding. It is a reasoned estimate
  grounded in Aggilo's own data.

Step 2 — Flag
  inference_mode: true
  inference_basis: "aggilo_demographic_data"
  internet_signal_found: false
  probability_estimate: 0.0–1.0

Step 3 — Threshold gate
  probability_estimate ≥ 0.70 → passed to Clio
  probability_estimate < 0.70 → logged, suppressed
  Scout never presents weak inferences as signal.

Step 4 — Clio receives
  Clio receives the inference with full transparency about its
  basis. She constructs a suggestion in her own voice.
  She does not relay Scout's inference as external evidence.

Step 5 — Routing
  NEW cluster gap → admin approval queue
  EXISTING cluster recommendation → surfaced to relevant users
  via Clio's next in-conversation interaction only
  (never a push notification)

Step 6 — Feedback capture
  Admin approves → logged to scout_inference_feedback
  Admin rejects → logged to scout_inference_feedback
  User engages with Clio's suggestion → logged
  User ignores → logged
  If cluster created → conversion tracked over 90 days
  All outcomes feed into ScoutAccuracyCalibrationJob
```

### Scout Calibration Cycle (extends ScoutAccuracyCalibrationJob)

```
Monthly, pulls all Scout findings from past 90 days with outcomes:

1. Segment outcomes by:
   - signal_type (unmet_connection_need, density_gap, etc.)
   - inference_mode true/false
   - demographic profile (age range + geography + interests)
   - probability_estimate band (0.70–0.79, 0.80–0.89, 0.90+)

2. Calculate accuracy per segment:
   - Which demographic profiles did Scout most accurately predict?
   - Which interest combinations produced highest-converting clusters?
   - Which probability_estimate bands reliably predicted genuine need?
   - Did inference_mode findings convert at meaningful rates?

3. Adjust thresholds:
   - inference_mode probability floor: starts 0.70
     → raise if inference quality is low
     → lower if real-world internet signal is consistently thin
       for a specific geography
   - signal_strength floor: starts 0.50 for inference trigger
     → adjust based on which strength bands produced accurate findings

4. Log delta to scout_calibration_history with rationale

5. If inference_mode accuracy < 40% over 90 days for a specific
   geography: flag to Aggilo Observer as content gap finding
```

### Scout Inference Feedback Schema

```sql
CREATE TABLE scout_inference_feedback (
  id UUID PRIMARY KEY,
  scout_report_id UUID REFERENCES scout_intelligence_reports(id),
  finding_id VARCHAR(64),          -- finding_id from the report JSONB
  inference_mode BOOLEAN,
  probability_estimate DECIMAL(3,2),
  clio_surfaced BOOLEAN,           -- Did Clio use this in a conversation?
  admin_decision ENUM('approved','rejected','pending'),
  admin_decision_at TIMESTAMP,
  cluster_created BOOLEAN,
  cluster_id UUID REFERENCES clusters(id) NULLABLE,
  conversion_tracked_until TIMESTAMP,  -- 90 days from cluster creation
  members_at_30_days INT,
  members_at_90_days INT,
  outcome_signal ENUM('converted','dormant','pending'),
  created_at TIMESTAMP
);
```

---

## Sage Calibration Cycle

*Adds to SAGE_AGENTS_v1.0.md as new job: SageCalibrationJob*

```
SageCalibrationJob — Monthly, per active cluster

Step 1 — Read all Sage posts (last 30 days) with engagement data:
  - Post type: question / content / reengagement / conflict /
    crowdfund / synthesis
  - Arc phase at time of post
  - Demographic profile of cluster
  - Responses received (count)
  - Member-to-member responses triggered (count — higher signal)
  - Reactions only (count — lower signal, noted separately)
  - Time to first response
  - Whether the post led to a new post by a previously silent member

Step 2 — Categorise by post type × arc phase × demographic

Step 3 — Calculate what worked:
  - Which question frames generated member-to-member discussion
    (not just replies to Sage)?
  - Which Atlas content formats triggered real debate vs passive reads?
  - What posting cadence matches this cluster's natural rhythm?
  - Which intervention types activated quiet members?

Step 4 — Adjust Sage's post construction parameters for this cluster:
  - Preferred question frame styles (direct / reflective / provocative)
  - Optimal posting time window (learned from response timing data)
  - Atlas format preference update → fed into next Atlas brief
  - Reengagement prompt style (gentle / reference-based / historic)

Step 5 — Cluster-specific storage
  Adjustments are stored per cluster, not platform-wide.
  A 22–26 ML cluster in Hyderabad has different learned parameters
  than a 35–45 professionals cluster in Bangalore.
  Cross-cluster parameter sharing never occurs.

Step 6 — Log to sage_calibration_history
```

### Sage Calibration History Schema

```sql
CREATE TABLE sage_calibration_history (
  id UUID PRIMARY KEY,
  cluster_id UUID REFERENCES clusters(id),
  calibration_date DATE,
  arc_phase ENUM('A','B','C','D','E'),
  posts_evaluated INT,
  top_performing_post_type VARCHAR(64),
  top_performing_format VARCHAR(64),
  optimal_cadence_hours DECIMAL(4,1),
  question_frame_adjustment TEXT,
  silent_member_activation_rate DECIMAL(4,3),
  member_to_member_rate DECIMAL(4,3),    -- responses that didn't involve Sage
  parameter_delta JSONB,                  -- what changed
  created_at TIMESTAMP
);
```

---

## Naming Convention — Final

| Name | What It Is | Where |
|------|-----------|-------|
| **AutoResearch** | Both phases together — verification + calibration | Atlas |
| **AutoResearch Phase 1** | 6-step content verification | Runs per card, every cycle |
| **AutoResearch Phase 2 / Calibration Cycle** | Parameter improvement loop | Runs monthly |
| **Scout Calibration Cycle** | ScoutAccuracyCalibrationJob extended | Scout |
| **Sage Calibration Cycle** | SageCalibrationJob | Sage |

The `autoResearch_passed` field in `cluster_pulse_cards` refers to Phase 1 only. No schema change needed.

---

## Master Instructions Additions

### New Queue Jobs

| Job | Agent | Cadence | Lane |
|-----|-------|---------|------|
| `AtlasCalibrationJob` | Atlas | Monthly | low |
| `ScoutAccuracyCalibrationJob` | Scout | Monthly | low |
| `SageCalibrationJob` | Sage | Monthly | low |

### New Database Tables

| Table | Agent | Source |
|-------|-------|--------|
| `atlas_calibration_history` | Atlas | This document |
| `scout_inference_feedback` | Scout | This document |
| `scout_calibration_history` | Scout | SCOUT_AGENTS_v1.0 |
| `sage_calibration_history` | Sage | This document |

### New Tunable Parameters

| Parameter | Default | Review Trigger |
|-----------|---------|----------------|
| Atlas calibration sample size | 10% | After 3 cycles |
| Atlas calibration window | 14 days | After 3 cycles |
| Atlas promotion threshold | +5% engagement | After 3 cycles |
| Scout inference probability floor | 0.70 | After first Scout cycle |
| Scout signal_strength inference trigger | 0.50 | After first Scout cycle |
| Sage calibration window | 30 days | After 3 cycles |
| Welfare gate cooldown | 90 days | After first welfare escalation |

---

**AutoResearch Extended Specification · v1.0 · Patch Document**
