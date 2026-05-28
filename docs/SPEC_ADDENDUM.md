# Aggilo — Specification Addendum v1.0

> **Resolves:** Scout Outreach Repurposing · Cluster Card Sharing Model · Clio Privacy Gate · Calibration Queue Architecture · Issues 1.2, 2.6, 3.7, 3.10
> *This document is authoritative over any conflicting logic in YANTRA_BRIDGE_SPEC, SCOUT_SOUL, SCOUT_AGENTS, SAGE_AGENTS, ATLAS_AGENTS, and OBSERVER_AGENTS where the sections below apply.*
> *Insert into MASTER_INSTRUCTIONS document inventory as AGGILO_SPEC_ADDENDUM_v1.0 · Authority level: Architecture (position 3 in hierarchy).*

---

## Section 1 — Scout Outreach: Repurposed as Inbound Traffic Intelligence

### What Changed and Why

The original `scout_outreach` job described Scout placing cluster cards on external platforms. This contradicts Scout's soul (v1.1): no outbound capability, architectural constraint not policy.

The repurposed model preserves the job name and queue slot but inverts the direction entirely. **Scout does not push. Scout reads what comes back.**

The cluster card is a web link. It can be shared by anyone — founding users, members, Clio onboarding recommendations, or organically — from the moment the cluster exists. Sharing is not gated by arc phase, member count, or any agent's judgment. It is a human action the platform supports unconditionally.

When a card link is shared and visited, Scout's job is to read the behavioral signal of that traffic: who came, what they did, whether they qualified, and what can be inferred from the pattern. This is observational intelligence, consistent with Scout's soul.

---

### Cluster Card Sharing — From Inception

Every cluster has a shareable card link from creation. There is no minimum arc phase, member count, or Sage approval required to share it. The card's public-facing content at any given time is whatever Sage has most recently refined (or the founding description if Sage has not yet refined it). Clio's privacy gate (Section 2) governs what that public content may and may not reveal.

**What the cluster card contains (public-facing):**
- Cluster name
- Refined description (Sage-authored, Clio-approved)
- Purpose tags
- Geography (city/area — always public, this is a core AGGIL dimension)
- A qualification check flow (does the visitor meet AGGIL parameters?)

**What the cluster card never contains:**
- Age range of members or AGGIL age parameters
- Gender composition or AGGIL gender parameters
- Member count, member names, or any individual member information
- Internal arc phase or cluster health signals

The qualification check is a conversational flow (Clio-authored prompts) that determines fit without revealing the underlying AGGIL parameters that define fit. A visitor learns whether they belong here — not what the cluster's targeting criteria are.

---

### Scout Outreach — New Job Specification

**Job type:** `scout_outreach` (retained — behavior repurposed)

**Issued by:** System (triggered by card visit events written to Supabase by the card web service)

**Cadence:** Event-driven. A batch of visit events triggers a Scout analysis job. Minimum batch size before triggering: 10 visit events OR 48 hours since last analysis for this cluster, whichever comes first.

**New Payload Schema:**

```json
{
  "job_type": "scout_outreach",
  "cluster_id": "uuid",
  "analysis_window": {
    "from": "ISO8601",
    "to": "ISO8601"
  },
  "visit_events": [
    {
      "event_id": "uuid",
      "visited_at": "ISO8601",
      "referrer_category": "direct | social | messaging | search | unknown",
      "referrer_domain": "reddit.com | null",
      "qualification_started": true,
      "qualification_completed": true,
      "qualification_passed": false,
      "time_on_card_seconds": 47,
      "drop_off_stage": null
    }
  ],
  "current_card_version": "uuid"
}
```

**What Scout analyzes:**

| Signal | What Scout Reads |
|--------|-----------------|
| Qualification pass rate | Of visitors who started the check, what proportion passed? High pass rate = card is reaching the right people. Low pass rate = card is reaching the wrong audience or the description is attracting misaligned visitors. |
| Drop-off stage | Where in the qualification flow do non-completers leave? Early drop = description mismatch. Late drop = a specific parameter (likely age or geography) is the barrier. |
| Referrer patterns | Which referrer categories produce the highest pass rates? A cluster card shared on LinkedIn tech communities may produce different quality traffic than one shared in a WhatsApp group. |
| Time-on-card | Visitors who spend longer before qualifying are more deliberate. Short time + qualification = either very aligned or not reading carefully. |
| Temporal patterns | What time of day/week does traffic arrive? Does this match the cluster's AGGIL demographic (e.g. student clusters may peak on evenings and weekends). |

**What Scout never stores from visit events:**
- IP addresses
- Device fingerprints
- Any personally identifying information about the visitor
- Exact referrer URLs (only domain and category)

**Scout's Output — Outreach Intelligence Report:**

```json
{
  "report_id": "uuid",
  "cluster_id": "uuid",
  "generated_at": "ISO8601",
  "analysis_window": { "from": "ISO8601", "to": "ISO8601" },
  "card_version_analyzed": "uuid",
  "traffic_summary": {
    "total_visits": 84,
    "qualification_started": 61,
    "qualification_completed": 48,
    "qualification_passed": 31,
    "pass_rate": 0.51,
    "completion_rate": 0.79
  },
  "referrer_breakdown": {
    "social": { "visits": 34, "pass_rate": 0.62 },
    "messaging": { "visits": 29, "pass_rate": 0.44 },
    "direct": { "visits": 21, "pass_rate": 0.48 }
  },
  "drop_off_analysis": {
    "stage_1_drop": 0.08,
    "stage_2_drop": 0.13,
    "stage_3_drop": 0.21,
    "primary_drop_stage": "stage_3",
    "inferred_barrier": "geography_parameter"
  },
  "behavioural_inferences": [
    {
      "inference": "Social referrers produce significantly higher pass rates, suggesting the card reads well in peer-sharing contexts but may be too narrow for discovery contexts.",
      "confidence": 0.74,
      "recommended_action": "cluster_card_copy_review"
    }
  ],
  "recommendations_for_clio": [
    "Cluster card description may be attracting visitors from adjacent interest areas who fail on geography. Sage refinement pass recommended with geography emphasis."
  ],
  "uncertainty_flags": [
    "Sample size borderline for strong inference on referrer breakdown — recommend 50+ additional visits before acting on referrer-specific findings."
  ]
}
```

**Report destination:** Written to `scout_outreach_reports` table in Supabase. Clio reads on request and on cluster briefing. Sage receives a digest when issuing the next Atlas brief. Admin dashboard surfaces aggregate pass rate trends.

---

### New Database Table: `scout_outreach_reports`

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID PK | |
| `cluster_id` | UUID FK → clusters | |
| `card_version_id` | UUID FK → cluster_description_history | Which version of the card was live during this window |
| `generated_at` | TIMESTAMP | |
| `analysis_window_from` | TIMESTAMP | |
| `analysis_window_to` | TIMESTAMP | |
| `traffic_summary` | JSONB | Aggregated visit metrics |
| `referrer_breakdown` | JSONB | Pass rates by referrer category |
| `drop_off_analysis` | JSONB | Stage-by-stage drop-off |
| `behavioural_inferences` | JSONB | Scout's inferences with confidence scores |
| `recommendations_for_clio` | JSONB | Plain-language recommendations |
| `uncertainty_flags` | JSONB | |

### New Database Table: `card_visit_events`

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID PK | |
| `cluster_id` | UUID FK → clusters | |
| `card_version_id` | UUID FK | |
| `visited_at` | TIMESTAMP | |
| `referrer_category` | VARCHAR | direct, social, messaging, search, unknown |
| `referrer_domain` | VARCHAR NULLABLE | Domain only, no full URL |
| `qualification_started` | BOOLEAN | |
| `qualification_completed` | BOOLEAN | |
| `qualification_passed` | BOOLEAN | |
| `time_on_card_seconds` | INTEGER | |
| `drop_off_stage` | INTEGER NULLABLE | Which qualification stage the visitor left at |
| `processed_by_scout` | BOOLEAN DEFAULT false | Whether this event has been included in a Scout report |

### Updated WORKER_MAP Entry

```python
"scout_outreach": "ScoutOutreachWorker",   # Inbound traffic intelligence — not external posting
"scout_discovery": "ScoutDiscoveryWorker", # Community intelligence reads
"scout_directed": "ScoutDirectedWorker",   # Clio-directed deep reads
```

---

## Section 2 — Clio Privacy Gate for Cluster Card Refinements

### The Problem This Solves

Sage refines a cluster's public-facing description and tags as the cluster matures. Some clusters are narrow-scoped — defined by specific age ranges, gender, or hyper-local geography. If Sage's refined language inadvertently signals these parameters in the public card, it creates two risks:

1. **Cluster health compromise:** Non-qualifying visitors discover the exact criteria and feel filtered out in a way that reads as exclusionary rather than purposeful.
2. **AGGIL parameter exposure:** The cluster's internal targeting parameters become public, which can attract adversarial behavior (gaming qualification) or simply feel surveillance-like to prospective members.

Clio's role in the description refinement flow (Stage 5 of CLUSTER_DESCRIPTION_REFINEMENT_v1.0) already includes a demographic privacy check. This section specifies exactly what that check requires and how it interacts with the cluster card's public presentation.

---

### Privacy Gate — What Clio Checks

Before approving any Sage description refinement, Clio evaluates the proposed description and tags against the following rules. This check is mandatory regardless of how clearly compliant the proposal appears.

**Never permitted in public description or tags:**

| Category | Prohibited | Permitted Alternative |
|----------|------------|----------------------|
| Age | "for 18–24 year olds", "young", "student", "seniors" | Purpose language: "early-career", "first-time founders", "building for the first time" — only if members have self-identified this way publicly |
| Gender | Any gender indicator not explicitly chosen by founding user to be public | None — gender parameters are internal only |
| Economic | "high-income", "working professional", "affordable" (implying economic filter) | None |
| Relationship status | Any indicator | None |
| Hyper-local precision | Street names, specific buildings, internal locality codes | City + area name is the floor and ceiling of geographic specificity |

**Always permitted:**
- City and area name (this is a core AGGIL dimension and part of the cluster's identity)
- Interest and purpose language: what the cluster is for, not who is in it
- Language that members have used publicly about themselves in the cluster (self-identified descriptors)
- Life context language that describes activity rather than demographic: "building ML products", "exploring Hyderabad's food scene" — not "18-24 year old ML builders"

**The test Clio applies:**

> *"Could a reader of this description infer a specific AGGIL parameter — age range, gender, or income level — that is not explicitly part of the cluster's public identity?"*

If yes: return to Sage with specific revision guidance. Not a rejection — a loop.

If no: approve and proceed.

**Worked examples for Clio's calibration:**

*Example A — Approve:*
Proposed: "A space for builders in Hyderabad who are serious about turning ML ideas into real products — from first prototype to first pitch"
Analysis: Geography (Hyderabad) is public. "Builders", "first prototype", "first pitch" are activity descriptors, not demographic indicators. No age/gender inference possible.
Decision: **Approve**

*Example B — Return with guidance:*
Proposed: "A community for young women in Banjara Hills figuring out their first jobs and first apartments"
Analysis: "Young" signals age. "Women" — founding user did not explicitly make gender public in this cluster's identity. "First jobs" implies early 20s range.
Decision: **Return.** Guidance to Sage: "Remove 'young' and 'women' — these expose AGGIL parameters. Rephrase around the activity: 'navigating career beginnings and independent living in Banjara Hills' preserves the intent without exposing the demographic."

*Example C — Approve with note:*
Proposed: "Early-career professionals in Gachibowli looking for genuine connections outside the office"
Analysis: "Early-career" was used by members to describe themselves in the cluster's Phase C thread — it is a self-identified descriptor, not an inferred age signal. Clio checks: was this language actually used by members? If yes in the member confirmation record: approve. If Sage introduced it independently: return.
Decision: **Approve with note** — record the member-origin justification in `cluster_description_history.rationale`

---

### Clio Privacy Gate — Implementation

**Where it runs:** Stage 5 of the description refinement flow. No changes to the flow structure — this is a specification of what the Stage 5 review must cover.

**New required field in the proposal JSON:**
```json
{
  "demographic_privacy_check": "PASSED | RETURNED",
  "privacy_check_notes": "Specific field-by-field notes from Clio's review"
}
```

**If Clio returns the proposal:** She writes specific revision guidance into the proposal record. Sage revises and resubmits. There is no limit on revision cycles — the loop continues until the privacy check passes. There is no escalation path above Clio for this check; it is Clio's authority.

**Card version tracking:** Each approved description creates a new record in `cluster_description_history`, which is referenced by `card_version_id` in `card_visit_events`. This means Scout's outreach intelligence is always tied to the exact card version that was live during that traffic window. If a description is refined and a new card version goes live, subsequent Scout reports reference the new version — allowing Sage and Clio to assess whether the refinement improved card performance.

---

## Section 3 — Sage + Atlas Calibration: Queue-Based, Server-Availability Model

### What Changes

The previous architecture described calibration as scheduler-triggered (monthly `AtlasCalibrationJob`, cron-based pulse refresh every 6h). This is replaced with a **queue-based model where calibration jobs run based on server availability**, not rigid schedule.

This resolves the tension in Issue 1.3 (Atlas bypassing Sage) and Issue 2.1 (calibration statistical floor) simultaneously, because queue-based dispatch naturally flows through Sage as the issuing principal and adapts to cluster data volume before firing.

---

### The Calibration Queue Model

**Queue assignment:** `yantra:low` — calibration is background work. It must never compete with Clio turns (`yantra:high`) or Sage cluster events (`yantra:medium`).

**Dispatch logic:** The scheduler does not issue calibration jobs directly. Instead, it issues a `SageCalibrationReadiness` check to each cluster on a rolling basis. Sage evaluates whether the cluster has sufficient data to run a meaningful calibration cycle. If yes, Sage issues the `AtlasCalibrationJob` to the low queue. If no, Sage logs the skip with reason and schedules the next readiness check.

```
Scheduler (rolling check) → SageCalibrationReadiness job (medium queue)
  → Sage evaluates data sufficiency
    → Sufficient: Sage issues AtlasCalibrationJob (low queue)
    → Insufficient: Sage logs skip, reschedules readiness check in 14 days
```

**Sage's data sufficiency evaluation (resolves Issue 2.1):**

| Cluster State | Calibration Mode | Minimum Before Running |
|---------------|-----------------|----------------------|
| < 10 members OR < 30 days old | **Skip** — use platform demographic defaults | N/A |
| 10–20 members OR 30–90 days old | **Inference mode** — observe patterns, no A/B | 15+ Atlas cards with engagement signal |
| 20+ members AND 90+ days old | **Full calibration** — A/B with statistical floor | 30+ data points in sample group |

These thresholds are tunable parameters — add to MASTER_INSTRUCTIONS tunable parameters table:

| Parameter | Current Value | Review Trigger |
|-----------|--------------|----------------|
| `calibration_min_members_inference` | 10 | 90 days post-launch |
| `calibration_min_members_full` | 20 | 90 days post-launch |
| `calibration_min_age_days_inference` | 30 | 90 days post-launch |
| `calibration_min_age_days_full` | 90 | 90 days post-launch |
| `calibration_min_datapoints_inference` | 15 | After first calibration cycle |
| `calibration_min_datapoints_full` | 30 | After first calibration cycle |

**Inference mode (small/young clusters):**
- Atlas adjusts weights based on direct observation of which formats and topics produced member engagement
- No A/B sample group, no promotion threshold
- Maximum weight shift per inference cycle: ±0.10 per category
- Logged as `calibration_mode: inference` in `atlas_calibration_history`
- Conservative by design — these clusters have thin data; the system should not overcorrect on noise

**Full calibration mode (mature clusters):**
- 10% of Atlas briefs go to sample group for 14 days
- Promotion threshold: ≥5% improvement AND sample group n ≥ 30
- If n < 30 at 14 days: extend window by 7 days, not promote on insufficient data
- Add `sample_sufficient: boolean` to `atlas_calibration_history` schema

**AutoResearch skill improvement** follows the same queue model. AutoResearch verification runs are queued to `yantra:low` and processed when server capacity is available. There is no fixed schedule — the queue drains as capacity permits. This means a busy server will defer AutoResearch without blocking user-facing jobs. A quiet period will clear the backlog. No cluster is penalized for AutoResearch running late — the last completed verification is always the current truth.

**New field on `atlas_calibration_history`:**
```sql
ALTER TABLE atlas_calibration_history ADD COLUMN sample_sufficient BOOLEAN;
ALTER TABLE atlas_calibration_history ADD COLUMN calibration_mode VARCHAR DEFAULT 'full'; -- 'full' | 'inference' | 'skipped'
ALTER TABLE atlas_calibration_history ADD COLUMN skip_reason VARCHAR; -- populated when mode = 'skipped'
```

---

## Section 4 — Resolved Issues

---

### Issue 1.2 — Welfare Escalation: Currently Active Users Only (v1.0 Scope)

**Resolution: Explicitly scoped to active sessions at v1.0.**

Welfare escalation can only reach a user who is in an active session at the time Clio attempts contact. This is a documented v1.0 limitation, not a gap — it reflects the absence of a push notification system at launch.

**The full escalation chain at v1.0:**

```
Sage detects welfare signal
  → Sage escalates to Clio (system-initiated, immediate)
    → Clio checks: is this user in an active session?
      → YES: Clio engages the user through the FAB/personal channel
      → NO: Clio cannot reach the user. Record written to welfare_escalations table.
        → WelfareEscalationTimeoutCheck runs (medium queue, every 15 min)
          → At 30 minutes unresolved: admin notification fires (high queue: WelfareHumanAlertJob)
            → Admin sees the alert in dashboard with cluster context
            → Admin acts via human judgment and platform moderation tools
```

**What this means in practice:** A welfare signal detected when a user is offline results in admin notification as the terminal automated action. The admin then has access to the cluster context and can take human moderation steps — contacting the founding user, temporarily moderating the cluster, or following the platform's external welfare protocols.

**This is explicitly logged in `welfare_escalations`:**
```sql
CREATE TABLE welfare_escalations (
  id UUID PRIMARY KEY,
  cluster_id UUID REFERENCES clusters(id),
  detected_by VARCHAR DEFAULT 'sage',
  detected_at TIMESTAMP,
  triggering_post_id UUID, -- reference to the post that triggered detection
  user_active_at_detection BOOLEAN,
  clio_contact_attempted BOOLEAN,
  clio_contact_succeeded BOOLEAN,
  admin_notified_at TIMESTAMP,
  admin_notified BOOLEAN DEFAULT false,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolution_notes TEXT
);
```

**v1.1 path:** Push notification or email delivery to offline users. Design after reviewing v1.0 welfare escalation data — specifically, how frequently signals are detected for offline users, and what the admin response time looks like in practice. Do not design the push system speculatively before this data exists.

**Add to MASTER_INSTRUCTIONS tunable parameters:**

| Parameter | Current Value | Notes |
|-----------|--------------|-------|
| `welfare_escalation_timeout_minutes` | 30 | Time before admin notification fires |
| `welfare_check_cadence_minutes` | 15 | How often the timeout check runs |

---

### Issue 2.6 — Poll RL Dampening: Decided Values

**Four-layer model — in order of operation:**

**Layer 1 — Validity gate (Sage judgment, runs first):**
Sage reads the poll result against the cluster's stated purpose and AGGIL parameters before any weight is applied. If the result contradicts the cluster's purpose in a way that cannot be reconciled with reasonable member intent, the result is flagged `poll_validity: low` and excluded from weight injection. Sage logs the exclusion with reasoning.

Example: A cluster scoped to ML product building votes 80% for "celebrity lifestyle content." This is almost certainly noise (members clicking without deliberate preference). Sage excludes and does not apply.

Example: Same cluster votes 70% for "research papers over case studies." This is a valid intra-purpose preference signal — apply with full weight.

**Layer 2 — Clarification query (optional, Sage's judgment):**
When validity is genuinely ambiguous, Sage may issue a brief in-cluster follow-up to understand member intent before applying the signal. This is not automatic. Sage uses it only when the poll result is significant enough to meaningfully shift Atlas's behavior and genuinely unclear.

Format: 2-option multi-select for binary ambiguity, short free-text for open ambiguity.

**Layer 3 — Weight shift cap (per poll cycle):**
No single poll cycle may shift any category weight by more than **±0.10**. This is the hard per-cycle limit regardless of signal clarity.

**Layer 4 — Cumulative monthly cap:**
No single category may move more than **±0.25** in total across all polls within a 30-day period. If a category hits its monthly ceiling, further poll signals for that category are logged but not applied until the next monthly reset.

**Add to MASTER_INSTRUCTIONS tunable parameters:**

| Parameter | Current Value | Review Trigger |
|-----------|--------------|----------------|
| `poll_rl_max_shift_per_cycle` | 0.10 | 60 days post-launch |
| `poll_rl_max_shift_monthly` | 0.25 | 60 days post-launch |

**New fields on `cluster_polls`:**
```sql
ALTER TABLE cluster_polls ADD COLUMN poll_validity VARCHAR DEFAULT 'valid'; -- 'valid' | 'low' | 'excluded'
ALTER TABLE cluster_polls ADD COLUMN validity_exclusion_reason TEXT;
ALTER TABLE cluster_polls ADD COLUMN weight_shift_applied DECIMAL(4,3);
ALTER TABLE cluster_polls ADD COLUMN cumulative_cap_hit BOOLEAN DEFAULT false;
```

---

### Issue 3.7 — Conflict LLM Context Specification

**Context: Why this matters**

When Sage detects a conflict in a cluster and routes to the Opus call, the quality of that intervention depends almost entirely on what context the model receives. An Opus call with thin context produces a generic de-escalation response. An Opus call with full cluster context produces an intervention that understands the specific dynamic, the arc phase, and the individuals' history in this space.

**The four-part context assembled for every conflict LLM call:**

**Part 1 — Tier 1 Soul Injection (~900 tokens)**
The community soul extract as defined in SOUL_INJECTION_MAP. This includes:
- Creed items 2, 3, 4, 5, 6, 7 (beliefs about human worth, loneliness, connection, servant role)
- Community sacred principles (vulnerability, right not to connect)
- The five community-relevant prohibitions
- The silence section in full
- Situation 02 (values conflict) from Section VII of AGGILO_SOUL — this is the only situation directly relevant
- The One Line (Section IX)

Sage's community soul, not Clio's full soul. Sage is the agent making the intervention. The context should be her own.

**Part 2 — Cluster Arc Phase + Phase History**
```json
{
  "current_arc_phase": "C",
  "phase_entered_at": "ISO8601",
  "phase_history": [
    { "phase": "A", "entered_at": "ISO8601", "exited_at": "ISO8601" },
    { "phase": "B", "entered_at": "ISO8601", "exited_at": "ISO8601" }
  ],
  "cluster_age_days": 47,
  "member_count": 18
}
```

Why arc phase matters for conflict: A conflict in Phase A (new cluster, low trust) requires a lighter touch than a conflict in Phase D (deep trust, high stakes relationship). The same words mean different things in different arc contexts.

**Part 3 — Last 20 cluster posts (immediate context window)**
The 20 most recent posts in the cluster, in chronological order, regardless of who wrote them. This gives the model the conversational texture immediately before the conflict — what was the register, what was the tone, who was engaging and how.

```json
{
  "recent_posts": [
    {
      "post_id": "uuid",
      "author_role": "member | sage | founding_user",
      "content": "post content",
      "posted_at": "ISO8601",
      "reaction_count": 3
    }
  ]
}
```

Note: `author_role` not `author_id` — Sage does not need to know which specific user wrote which post to handle the conflict. She needs to know the relational dynamic (member vs founding user vs Sage herself).

**Part 4 — The Triggering Exchange**
The specific posts that triggered conflict detection, flagged explicitly as the intervention target.

```json
{
  "triggering_exchange": {
    "detection_reason": "values_conflict | hostile_register | exclusionary_language | personal_attack",
    "posts": [
      {
        "post_id": "uuid",
        "author_role": "member",
        "content": "post content",
        "posted_at": "ISO8601"
      }
    ],
    "sage_detection_notes": "Brief note on why this triggered escalation"
  }
}
```

**Total estimated context for the Opus conflict call:** ~2,400 tokens (soul injection ~900 + arc context ~200 + 20 posts ~900 + triggering exchange ~400). Well within Opus's context window.

**Add to SAGE_AGENTS — LLM Configuration table:**

| Operation | Model | Context Parts |
|-----------|-------|---------------|
| Conflict intervention | `claude-opus-4-6` | Tier 1 soul + arc phase + last 20 posts + triggering exchange |

---

### Issue 3.10 — Observer Finding Deduplication

**The problem in concrete terms:**

Observer Domain 1 (cluster health) runs every 6 hours. If a cluster stalls in Phase B for 4 days, Observer creates 16 identical finding records and sends 16 admin notifications. The admin has already seen this finding — they may have chosen to wait and see, or may not yet have had time to act. The 16th notification is indistinguishable from the 1st and carries no additional information.

**The fix: finding signatures with occurrence counting**

A `finding_signature` is a deterministic hash of the finding's identity: `domain_id + cluster_id + suggested_action_type`. Two findings with the same signature represent the same observation about the same cluster recommending the same action.

**Deduplication rule:**
Before creating a new `observer_findings` record, Observer checks whether a record with the same `finding_signature` already exists in `pending` or `approved` status. 

- **If yes:** Increment `occurrence_count`, update `last_seen_at`, do not create a new record, do not send a new admin notification. The existing record surfaces the updated count on the admin dashboard ("Observed 4 times — first seen March 14, last seen March 17").

- **If no:** Create a new record normally, send admin notification as specified.

**If the previous finding was `resolved` or `dismissed`:** Treat as a new finding. A cluster that briefly improved and then stalled again is a new signal, not a duplicate.

**New fields on `observer_findings`:**

```sql
ALTER TABLE observer_findings ADD COLUMN finding_signature VARCHAR(64);   -- SHA-256 hash
ALTER TABLE observer_findings ADD COLUMN occurrence_count INTEGER DEFAULT 1;
ALTER TABLE observer_findings ADD COLUMN last_seen_at TIMESTAMP;
ALTER TABLE observer_findings ADD COLUMN first_seen_at TIMESTAMP;         -- = created_at for new records
```

**Signature generation:**
```python
import hashlib
import json

def generate_finding_signature(domain_id: str, cluster_id: str, suggested_action_type: str) -> str:
    payload = json.dumps({
        "domain_id": domain_id,
        "cluster_id": cluster_id,
        "suggested_action_type": suggested_action_type
    }, sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()[:64]
```

**Admin dashboard display change:**
Finding cards show: "Cluster stalled in Phase B — observed 4 times (first: Mar 14, last: Mar 17)" rather than four separate entries. The occurrence history communicates persistence without noise.

**Escalation behavior on high occurrence count:**
If `occurrence_count` reaches 3 for a `severity: high` finding that remains in `pending` status, Observer automatically upgrades the finding to `severity: critical` and re-notifies the admin. This ensures that repeated observations of the same unaddressed issue escalate rather than disappear into a deduplicated queue.

Add to MASTER_INSTRUCTIONS tunable parameters:

| Parameter | Current Value | Notes |
|-----------|--------------|-------|
| `observer_dedup_escalation_threshold` | 3 | Occurrence count at which pending high-severity findings escalate to critical |

---

## Section 5 — MASTER_INSTRUCTIONS Updates Required

The following changes must be made to MASTER_INSTRUCTIONS to reflect this addendum:

**Document Inventory — add:**
```
| AGGILO_SPEC_ADDENDUM.md | v1.0 | Architecture | Scout outreach repurposing, card model, privacy gate, calibration queue, issue resolutions |
```

**Document Authority Hierarchy — add at position 3:**
```
3. AGGILO_SPEC_ADDENDUM.md — governs scout outreach, card sharing, calibration queue model
```

**Database Schema — new tables:**
- `scout_outreach_reports`
- `card_visit_events`
- `welfare_escalations`

**Database Schema — new fields on existing tables:**

| Table | New Fields |
|-------|-----------|
| `observer_findings` | `finding_signature`, `occurrence_count`, `last_seen_at`, `first_seen_at` |
| `cluster_polls` | `poll_validity`, `validity_exclusion_reason`, `weight_shift_applied`, `cumulative_cap_hit` |
| `atlas_calibration_history` | `sample_sufficient`, `calibration_mode`, `skip_reason` |
| `cluster_posts` | `sage_post_type ENUM('initiated', 'responsive')` |

**WORKER_MAP — update:**
```python
"scout_outreach": "ScoutOutreachWorker"   # Inbound traffic intelligence
```

**Tunable Parameters — add all parameters listed in Sections 3 and 4.**

**Key Design Decisions — add:**

| Decision | Resolution | Document |
|----------|-----------|----------|
| Cluster card sharing gated? | No gate. Shareable from inception. | SPEC_ADDENDUM v1.0 |
| Scout outreach behavior? | Inbound traffic intelligence, not external posting | SPEC_ADDENDUM v1.0 |
| Clio reviews cluster card? | Yes — demographic privacy gate before any refined description goes live | SPEC_ADDENDUM v1.0 |
| Calibration timing? | Queue-based, server availability, not cron | SPEC_ADDENDUM v1.0 |
| Welfare escalation v1.0 scope? | Active users only. Admin is terminal action for offline users. | SPEC_ADDENDUM v1.0 |
| Poll RL dampening? | ±0.10 per cycle, ±0.25 monthly cumulative | SPEC_ADDENDUM v1.0 |
| Conflict LLM context? | 4-part: Tier 1 soul + arc phase + last 20 posts + triggering exchange | SPEC_ADDENDUM v1.0 |
| Observer dedup? | finding_signature hash, occurrence_count, escalate at 3x pending high-severity | SPEC_ADDENDUM v1.0 |

---

*This addendum is authoritative over any conflicting logic in the documents listed in Section 5. When AGGILO_SOUL.md conflicts with this document, AGGILO_SOUL.md wins. For all other documents, this addendum wins on the sections it covers.*

**Aggilo Specification Addendum · v1.0 · Internal — Architecture Document**
