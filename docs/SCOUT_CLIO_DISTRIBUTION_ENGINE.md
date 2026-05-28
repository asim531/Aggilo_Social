# Scout → Clio: Distribution Engine

> **Status:** Architecture Spec · Phase 1
>
> **Authority:** Subordinate to `AGGILO_SOUL.md`, `AGGILO_PLATFORM_RULES.md`,
> and `architecture/AGENT_COMMUNICATION_CONTRACT.md`.
> Supersedes any prior implicit description of Scout's role
> in cluster discovery or external posting.
>
> **Scope:** Defines the full lifecycle from Scout niche discovery
> through Clio cluster proposal, admin review, cluster generation on
> the Aggilo platform, and post-launch distribution placement intelligence.
>
> **Companion documents:**
> - `architecture/AGENT_COMMUNICATION_CONTRACT.md` — the six inter-agent
>   communication patterns (this lifecycle uses Pattern 2 + Pattern 4)
> - `docs/AGGILO_ADMIN_DASHBOARD_SPEC.md` — the Demand tab and Findings
>   surfaces that host this lifecycle's admin-facing steps
> - `docs/SPEC_ADDENDUM.md` §1 — Scout's soul: no outbound capability;
>   observational intelligence only
> - `docs/WAITLIST_INTELLIGENCE_SPEC.md` — the parallel demand-detection
>   path via waitlist scoring

---

## Why This Document Exists

The Scout → Clio → Admin → Cluster lifecycle existed implicitly across
several files but was never specified as a single, end-to-end flow. That
gap matters because this lifecycle is Aggilo's **primary demand-detection
and cluster-seeding engine** — the mechanism by which the platform finds
real unmet need in the world and turns it into a live cluster.

The lifecycle has five stages:

```
Stage 1 — Scout detects a niche or global need on the internet
         ↓
Stage 2 — Scout reports to Clio (structured intelligence report)
         ↓
Stage 3 — Clio evaluates, generates a cluster proposal under scrutiny
         ↓
Stage 4 — Cluster proposal + distribution brief land in the admin dashboard
         ↓
Stage 5 — Admin approves → cluster is created → admin receives
           distribution placement brief and posts the cluster card
           link at the identified locations
```

Each stage is specified below.

---

## Stage 1 — Scout: Niche and Global Need Detection

### What Scout Reads

Scout reads public internet communities — subreddits, forum threads,
Quora questions, Discord announcement channels (public), and similar
indexed surfaces — for signals that an unmet connective need exists
in a population that Aggilo could serve.

Scout's principal is Clio. It runs in two modes:

| Mode | Trigger | What Scout looks for |
|------|---------|---------------------|
| **Ambient discovery** | Cron-scheduled (`ScoutDiscoveryWorker`, low lane) | Recurring patterns across a Scout's monitored community list that suggest a latent group need not yet served by any existing cluster |
| **Directed discovery** | Clio issues a `ScoutDirectedJob` or admin submits via dashboard | A specific niche, geography, or topic Clio or the admin wants investigated |

### What Constitutes a Qualifying Signal

Scout does not report on every interesting thread. A signal qualifies when:

1. **Pattern, not incident.** The need appears across multiple threads,
   multiple posters, in the same or closely related communities — not a
   single post.
2. **Connective in nature.** The underlying need is for *people* — a
   group, a community, a shared space — not just information.
3. **Geography-reachable.** The population can be mapped to a city or
   area that the AGGIL engine can serve (or is globally distributed in
   a way that a language-scoped cluster makes sense).
4. **Unmet or badly served.** The thread evidence shows people are not
   finding what they need on the platform where Scout found them.

Scout does not report on needs that are purely informational, purely
commercial, or already well-served by existing communities on the same
platform.

### Scout's PII Rules (unchanged from Scout soul)

Scout reads community-level patterns. It never stores:
- Usernames or profile identifiers of the people it observes
- Exact post text verbatim (paraphrased evidence summaries only)
- Any information that would identify an individual

The 20-post rule applies: no single post excerpt exceeds 20 words of
verbatim quotation.

---

## Stage 2 — Scout Reports to Clio

Scout writes a structured intelligence report to `scout_intelligence_reports`.
This is Pattern 2 (Directed Job) from the Agent Communication Contract —
Scout runs asynchronously, writes rows, and Clio reads on her next cycle.

### `scout_intelligence_reports` Row (additions for this lifecycle)

The existing `scout_intelligence_reports` table gains two fields
specific to the distribution engine lifecycle:

```sql
ALTER TABLE scout_intelligence_reports
  ADD COLUMN signal_type VARCHAR(32),
    -- 'niche_need' | 'global_need' | 'community_discovery' | 'gap_intelligence'
  ADD COLUMN distribution_locations JSONB,
    -- Where Scout found the signal — structured for Stage 5 use
  ADD COLUMN clio_proposal_id UUID REFERENCES cluster_proposals(id);
    -- Populated by Clio at Stage 3
```

### Full Report Schema (relevant fields)

```json
{
  "report_id": "uuid",
  "cluster_id": null,
  "signal_type": "niche_need",
  "generated_at": "ISO8601",

  "need_summary": "Telugu-speaking women in Hyderabad 25–34 trying to find other serious home bakers — not hobbyists, but people working toward selling. Discord servers and WhatsApp groups exist but are general-purpose; the specific peer group for 'serious bakers who want to turn this into income' is absent.",

  "evidence_summary": "Pattern observed across r/hyderabad (3 threads, 2026-Apr–May), r/IndianFood (4 threads), and a public Facebook group (Hyderabad Bakers). Recurring language: 'can't find people at the same stage', 'groups are either too casual or too professional'. No existing cluster on Aggilo addresses this.",

  "geographic_scope": {
    "type": "city",
    "city": "Hyderabad",
    "country": "India"
  },

  "aggil_signals": {
    "interest_domain": "Food & Craft",
    "language": ["Telugu", "English"],
    "gender_signal": "predominantly women (inferred from thread voice — not stored as a demographic filter target, available to Clio for cluster brief consideration)",
    "life_stage_signal": "building — early-income or pre-income stage"
  },

  "confidence": 0.84,
  "confidence_ceiling": null,

  "distribution_locations": [
    {
      "location_id": "uuid",
      "platform": "reddit",
      "identifier": "r/hyderabad",
      "location_type": "subreddit",
      "posting_context": "thread_comment",
      "scout_rationale": "Three threads in 60 days show people looking for exactly this peer group. The community is receptive to local-specific posts when they're genuine and specific.",
      "thread_types_recommended": ["advice", "community", "local-specific"],
      "content_notes": "Posts that anchor to Hyderabad specifically perform better than generic food content here. The subreddit has an active mod presence — dropped-link posts get removed.",
      "estimated_reach_quality": "high"
    },
    {
      "location_id": "uuid",
      "platform": "reddit",
      "identifier": "r/IndianFood",
      "location_type": "subreddit",
      "posting_context": "thread_comment",
      "scout_rationale": "Larger audience but less targeted. Good for reaching people who haven't yet found hyper-local communities. Thread recommendation: respond to existing 'looking for bakers' threads rather than starting new ones.",
      "thread_types_recommended": ["question", "advice"],
      "content_notes": "This subreddit favours participation-style posts. A standalone link drop will not survive. Recommended: respond to an existing thread with context before sharing the cluster card.",
      "estimated_reach_quality": "medium"
    },
    {
      "location_id": "uuid",
      "platform": "facebook_group",
      "identifier": "Hyderabad Bakers (public group)",
      "location_type": "public_group",
      "posting_context": "new_post",
      "scout_rationale": "The group exists but is general-purpose. The cluster card offers what several members explicitly said they wanted: a more focused peer group. Admin can post as a genuine announcement.",
      "thread_types_recommended": ["announcement", "resource"],
      "content_notes": "Group admin approval may be needed for a new post from an unknown account. Consider framing as a resource for members rather than a promotional post.",
      "estimated_reach_quality": "high"
    }
  ],

  "recommended_cluster_type": "premium",
  "recommended_action": "recommend_cluster_creation_to_admin",
  "unmet_need": "Peer group for women in Hyderabad who are building a baking income — not hobbyists, not professionals. The 'serious amateur turning pro' stage is unserved.",

  "uncertainty_flags": [
    "Gender signal is inferred from thread voice, not stated demographic data. Clio should treat as directional, not prescriptive.",
    "Facebook group reach quality is estimated — Scout cannot verify current group activity level."
  ]
}
```

---

## Stage 3 — Clio Evaluates and Generates the Cluster Proposal

When Clio encounters a new `scout_intelligence_reports` row with
`recommended_action = 'recommend_cluster_creation_to_admin'` or
`'create_cluster_prompt_to_admin'`, she runs her evaluation cycle.

### Clio's Scrutiny Checklist

Before generating a proposal, Clio evaluates:

| Check | What Clio asks | Gate |
|-------|---------------|------|
| **Soul alignment** | Does this cluster serve genuine human connection, or does it feel like a content pipeline? | Hard gate — no proposal if connection purpose is absent |
| **AGGIL viability** | Can the AGGIL engine actually configure a cluster for this population? Is geography specific enough? | Hard gate — no proposal without a mappable geography |
| **Privacy gate** | Would the cluster's public-facing description expose AGGIL parameters (age, gender, specific income)? | Soft gate — Clio revises the proposed public description before proposing |
| **Duplication check** | Does an existing Aggilo cluster already serve this need in this geography? | Hard gate — no duplicate |
| **Confidence floor** | Is Scout's confidence ≥ 0.70? | Soft gate — Clio may propose at lower confidence but flags it |

If all hard gates pass, Clio generates a `cluster_proposals` row.

### `cluster_proposals` Table (new)

```sql
CREATE TABLE cluster_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source
  scout_report_id UUID REFERENCES scout_intelligence_reports(id),

  -- Proposal content
  proposed_name VARCHAR(128),
  proposed_description TEXT,          -- Public-safe (Clio privacy-gated)
  proposed_tagline VARCHAR(256),
  proposed_interest_domain VARCHAR(64),
  proposed_geographic_scope JSONB,    -- { type, city, country }
  proposed_language TEXT[],
  proposed_cluster_type VARCHAR(16),  -- 'premium' | 'generic'

  -- AGGIL configuration (internal — not public)
  aggil_config_notes TEXT,            -- Clio's notes on likely AGGIL parameters; not exposed in cluster card

  -- Clio's evaluation record
  soul_alignment_passed BOOLEAN NOT NULL,
  aggil_viability_passed BOOLEAN NOT NULL,
  privacy_gate_passed BOOLEAN NOT NULL,
  duplication_check_passed BOOLEAN NOT NULL,
  scout_confidence DECIMAL(3,2),
  clio_evaluation_notes TEXT,         -- Clio's reasoning, surfaced to admin

  -- Distribution brief (populated from Scout's report)
  distribution_locations JSONB,       -- Copied + enriched from scout report

  -- Lifecycle
  status VARCHAR(32) DEFAULT 'pending_admin_review',
    -- 'pending_admin_review' | 'approved' | 'rejected' | 'deferred'
  admin_decision_by UUID REFERENCES profiles(id),
  admin_decision_at TIMESTAMPTZ,
  admin_notes TEXT,

  -- Post-approval
  cluster_id UUID REFERENCES clusters(id),  -- populated after cluster creation
  cluster_created_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### What Clio Produces in the Proposal

The proposal surfaces to the admin with three parts:

**Part A — The cluster brief**
- Proposed name, description (privacy-gated), tagline
- Interest domain, geography, language
- Cluster type recommendation (premium / generic) with rationale
- Clio's evaluation notes (what she checked, what she found)

**Part B — The distribution brief**
Per distribution location, Clio surfaces:

1. **The link or page** — specific subreddit, thread, group, or page
   URL where the cluster card link can be posted
2. **Where to post it** — specific recommendation: existing thread type,
   new post, comment on a specific kind of thread, etc.
3. **Why** — a one-line reason in plain language so the admin understands
   the context before they post

This third element is not optional. An admin who does not understand why
they are posting in a specific location will post badly — generic, tone-deaf,
or as a naked link drop. Clio's one-liner gives them the context they need
to post as a participant, not an advertiser.

**Part C — A "posted" tracking surface**
For each distribution location, the proposal carries a `posted` flag
the admin can flip after they post the cluster card link. This prevents
duplication across refresh cycles (see §Refresh and Deduplication below).

---

## Stage 4 — Admin Dashboard: The Cluster Proposals Surface

### Where It Lives

The cluster proposal surfaces in the admin dashboard under **Demand** tab,
as a new sub-tab alongside Active reports, Calibration history, and
Directed discovery.

```
Aggilo Admin
└── Demand
    ├── Active reports         (Scout intelligence: people_discovery, gap_intelligence)
    ├── Cluster proposals      ← THIS SURFACE (new sub-tab)
    ├── Calibration history
    └── Directed discovery
```

### Proposal Card

Each cluster proposal renders as a card:

```
┌─────────────────────────────────────────────────────────────────────┐
│  🟢 PROPOSAL  ·  Hyderabad · Food & Craft  ·  2 days ago            │
│                                                                     │
│  Proposed name: The Home Baker Collective                           │
│  "A peer group for serious home bakers in Hyderabad who are        │
│   building toward their first sale — not a hobby group."           │
│                                                                     │
│  Cluster type: Premium  ·  Confidence: 0.84                        │
│                                                                     │
│  Clio's notes: "Scout found consistent unmet demand across 3        │
│  platforms in 60 days. The 'serious amateur turning pro' stage is   │
│  genuinely unserved in Hyderabad. Privacy gate passed — no AGGIL   │
│  parameters in the public description."                             │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  DISTRIBUTION BRIEF (3 locations)           [Expand ▼]     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [Approve & Create Cluster]  [Reject]  [Defer 7 days]              │
└─────────────────────────────────────────────────────────────────────┘
```

**Distribution brief (expanded):**

```
┌─────────────────────────────────────────────────────────────────────┐
│  DISTRIBUTION LOCATIONS                                             │
│                                                                     │
│  1.  r/hyderabad  ·  Reddit                                        │
│      Post as: Comment on advice or community threads               │
│      Why: Three threads in 60 days show people looking for exactly  │
│      this peer group. The community accepts local-specific posts    │
│      when genuine and specific.                                     │
│      ⚠️ Note: Standalone link drops get removed by mods. Post       │
│      as a comment with context, not a new link post.               │
│      [ ] Marked as posted                                           │
│                                                                     │
│  2.  r/IndianFood  ·  Reddit                                       │
│      Post as: Comment on existing 'looking for bakers' threads     │
│      Why: Larger audience, less targeted. Best for reaching people  │
│      who haven't found local communities yet.                       │
│      ⚠️ Note: Favour responding to existing threads — don't start  │
│      a new post.                                                    │
│      [ ] Marked as posted                                           │
│                                                                     │
│  3.  Hyderabad Bakers (Facebook group, public)                     │
│      Post as: New announcement post                                │
│      Why: Group members have explicitly said they want a more       │
│      focused peer group — this cluster is that.                    │
│      ⚠️ Note: May need group admin approval. Frame as a resource    │
│      for members, not a promotional post.                          │
│      [ ] Marked as posted                                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Admin Actions

| Action | Outcome |
|--------|---------|
| `Approve & Create Cluster` | Marks `status = 'approved'`. Triggers `ClusterCreationJob` (high lane). The cluster is generated on the Aggilo platform. The proposal card updates to show the live cluster card link. The distribution brief activates for the admin to use. |
| `Reject` | Marks `status = 'rejected'`. Scout does not re-report the same need for 30 days. No cluster is created. |
| `Defer 7 days` | Re-queues the proposal. No action taken. Admin receives a reminder notification in 7 days. |

Every action writes to `cluster_admin_actions` with `actor_role = 'platform_admin'`.

---

## Stage 5 — Distribution: The Admin Posts the Cluster Card

### What Happens After Approval

When a cluster is created from an approved proposal:

1. The Aggilo platform generates the cluster and its shareable cluster card link.
2. The cluster card link is written back to the `cluster_proposals` row
   (`cluster_id` populated).
3. The admin dashboard's proposal card updates: the distribution brief
   is now **active**, showing the cluster card link prominently alongside
   each location.
4. The admin manually copies the cluster card link and posts it at each
   identified location, in the manner Clio's distribution brief describes.

### The Admin's Job at This Stage

The admin's job is not to be a link-dropper. It is to be a participant.
Clio's distribution brief gives them enough context to post naturally:

- They know **which** specific thread or group to use
- They know **how** to frame the post (comment vs. new post, etc.)
- They know **why** this community is the right one

The cluster card link is what they paste. But the words around it are
theirs — informed by the brief, not scripted by it.

### Marking Locations as Posted

Each distribution location has a `[ ] Marked as posted` checkbox on
the proposal card. When the admin checks it:

```sql
UPDATE cluster_proposal_locations
SET
  posted = TRUE,
  posted_at = NOW(),
  posted_by = auth.uid()
WHERE id = location_id;
```

The dashboard reflects posted / not-posted status per location so the
admin always knows what has been done and what remains.

A cluster may have **multiple distribution locations** — all are tracked
independently. The admin can post to some now and others later. There is
no deadline enforced by the system; this is a human distribution decision.

---

## Refresh and Deduplication

### How Often Clio Refreshes These Recommendations

Distribution location recommendations are **not automatically refreshed**
on a fixed cadence. This is by design.

Scout refreshes its intelligence reports on the discovery cycle
(ambient: per `ScoutDiscoveryWorker` schedule; directed: on demand).
If Scout generates a new report on the same need with higher confidence
or new locations, Clio evaluates whether the new report changes the
existing proposal's distribution brief.

**Clio's refresh trigger logic:**

| Condition | Action |
|-----------|--------|
| Scout produces a new report on the same geographic+interest scope and a cluster already exists | Clio adds new locations to the existing cluster's distribution brief (if not already posted) |
| Scout produces a new report and a cluster proposal is pending admin review | Clio updates the pending proposal's distribution brief before admin acts on it |
| Scout produces a new report and the prior proposal was rejected | Clio evaluates as a new proposal if confidence has increased by ≥ 0.10; otherwise logs as `signal_persistent` and monitors |
| No new Scout report | No refresh |

The underlying principle: Clio does not chase freshness for its own sake.
She refreshes when Scout gives her new information that changes the
distribution picture.

### The "Already Posted" Deduplication Rule

When the admin marks a location as `posted = TRUE`, that location is
**excluded from future recommendations** for the same cluster for 30 days.

After 30 days, a posted location becomes eligible again — not automatically
re-added, but eligible if Scout's next report identifies it as still
relevant. This reflects the reality that a thread becomes stale after a
month; a new post to the same community may be appropriate when the
cluster has grown or has new content to surface.

If the admin explicitly marks a location as `do_not_repost` (an
additional flag available per location), that location is permanently
excluded from future recommendations for this cluster. Useful if
the admin knows the community is hostile or inappropriate.

```sql
-- Additional fields on cluster_proposal_locations
ALTER TABLE cluster_proposal_locations
  ADD COLUMN posted BOOLEAN DEFAULT FALSE,
  ADD COLUMN posted_at TIMESTAMPTZ,
  ADD COLUMN posted_by UUID REFERENCES profiles(id),
  ADD COLUMN do_not_repost BOOLEAN DEFAULT FALSE,
  ADD COLUMN do_not_repost_reason TEXT;
```

---

## Database Schema: New Tables

### `cluster_proposals`

Defined in Stage 3 above. Primary table for the lifecycle.

### `cluster_proposal_locations`

The per-location distribution brief, normalised out of the `cluster_proposals.distribution_locations` JSONB for easier querying and per-location state tracking.

```sql
CREATE TABLE cluster_proposal_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES cluster_proposals(id) ON DELETE CASCADE,

  -- Location identity
  platform VARCHAR(32),           -- 'reddit' | 'facebook_group' | 'quora' | 'discord' | 'other'
  identifier VARCHAR(256),        -- subreddit name, group name, URL slug
  location_type VARCHAR(32),      -- 'subreddit' | 'public_group' | 'thread' | 'channel'
  posting_context VARCHAR(32),    -- 'thread_comment' | 'new_post' | 'existing_thread_comment'

  -- Clio's briefing for this location
  scout_rationale TEXT,           -- Why Scout identified this location
  clio_recommendation TEXT,       -- Where specifically to post (thread type, etc.)
  clio_why TEXT NOT NULL,         -- One-line reason for the admin — why this community, why now
  content_notes TEXT,             -- Tactical notes (mod rules, framing tips)
  estimated_reach_quality VARCHAR(8), -- 'high' | 'medium' | 'low'

  -- Admin state
  posted BOOLEAN DEFAULT FALSE,
  posted_at TIMESTAMPTZ,
  posted_by UUID REFERENCES profiles(id),
  do_not_repost BOOLEAN DEFAULT FALSE,
  do_not_repost_reason TEXT,

  -- Re-eligibility
  eligible_again_after TIMESTAMPTZ,  -- populated when posted = TRUE (posted_at + 30 days)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proposal_locations_proposal ON cluster_proposal_locations(proposal_id);
CREATE INDEX idx_proposal_locations_platform ON cluster_proposal_locations(platform, identifier);
```

---

## Job Additions

| Job | Trigger | Lane | TTL |
|-----|---------|------|-----|
| `ClioProposalGenerationJob` | New `scout_intelligence_reports` row with `recommended_action` in ('recommend_cluster_creation_to_admin', 'create_cluster_prompt_to_admin') | medium | 60s |
| `ClioDistributionBriefRefreshJob` | New Scout report overlaps geography+interest of existing cluster proposal | low | 120s |
| `ClusterCreationJob` | Admin approves a cluster proposal | high | 30s |
| `ProposalDeferralReminder` | Proposal deferred; fires at `deferred_until` | medium | 30s |

---

## Agent Communication Contract Classification

This lifecycle uses two of the six established patterns:

| Stage | Pattern | Description |
|-------|---------|-------------|
| Scout → Clio (Stage 2) | **Pattern 2 — Directed job** | Scout writes rows asynchronously; Clio reads and evaluates |
| Clio → Admin (Stage 4) | **Pattern 4 — Finding-and-approve** | Clio's proposal surfaces in the admin dashboard; admin approves or rejects; approval triggers `ClusterCreationJob` |

No new pattern is introduced. Both stages fit the existing taxonomy.

---

## What Clio Never Does in This Lifecycle

- Clio never posts the cluster card link herself. She has no outbound
  capability to external platforms. The brief is intelligence for the
  admin; the posting is a human act.
- Clio never creates a cluster without admin approval. The proposal is
  always a recommendation; the creation always requires a human decision.
- Clio never surfaces distribution locations that Scout did not identify.
  She may enrich Scout's locations with context, but she does not invent
  new ones.
- Clio never promises a timeline or outcome to anyone. The distribution
  brief is advisory; actual reach depends on the admin's posting and
  the community's reception.

---

## What Scout Never Does in This Lifecycle

- Scout never posts. Not the cluster card, not a comment, not anything.
  Scout reads; Scout writes reports; Scout's authority ends there.
  (Per `SPEC_ADDENDUM.md` §1: no outbound capability — architectural
  constraint, not policy.)
- Scout never tracks whether the cluster card was posted or its performance
  at the distribution locations. That is the `scout_outreach` job's domain
  (inbound traffic intelligence per SPEC_ADDENDUM §1).
- Scout never names individual people it observed while identifying the
  need. Evidence summaries are community-level and PII-free.

---

## Admin Dashboard Updates Required

The **Demand** tab in `docs/AGGILO_ADMIN_DASHBOARD_SPEC.md` gains a
fourth sub-tab: **Cluster proposals**.

Updated navigation:

```
Demand
├── Active reports
├── Cluster proposals    ← NEW
├── Calibration history
└── Directed discovery
```

The **Cluster proposals** sub-tab reads from `cluster_proposals`
filtered to `status = 'pending_admin_review'` by default. Tabs:

- **Pending review** (default)
- **Approved** (shows live clusters created from proposals)
- **Rejected / Deferred**

---

## MASTER_INSTRUCTIONS Updates Required

**Document Inventory — add:**
```
| SCOUT_CLIO_DISTRIBUTION_ENGINE.md | v1.0 | Architecture | Scout niche discovery, Clio cluster proposals, distribution placement intelligence |
```

**Database Schema — new tables:**
- `cluster_proposals`
- `cluster_proposal_locations`

**WORKER_MAP — add:**
```python
"clio_proposal_generation":        "ClioProposalGenerationWorker",
"clio_distribution_brief_refresh": "ClioDistributionBriefRefreshWorker",
"cluster_creation":                "ClusterCreationWorker",
"proposal_deferral_reminder":      "ProposalDeferralReminderWorker",
```

**Key Design Decisions — add:**

| Decision | Resolution | Document |
|----------|-----------|----------|
| Does Clio auto-create clusters from Scout reports? | No. Proposal always requires admin approval. | SCOUT_CLIO_DISTRIBUTION_ENGINE v1.0 |
| Does Scout post cluster card links externally? | No. Architectural constraint — Scout has no outbound capability. Admin posts manually. | SCOUT_CLIO_DISTRIBUTION_ENGINE v1.0 |
| How often are distribution recommendations refreshed? | On new Scout reports only — not on a fixed cadence. | SCOUT_CLIO_DISTRIBUTION_ENGINE v1.0 |
| Can the admin mark a location as permanently off-limits? | Yes — `do_not_repost` flag per location. | SCOUT_CLIO_DISTRIBUTION_ENGINE v1.0 |
| How long before a posted location becomes re-eligible? | 30 days. Configurable via `distribution_repost_window_days` tunable parameter. | SCOUT_CLIO_DISTRIBUTION_ENGINE v1.0 |
| What prevents the admin from posting blindly? | Clio's mandatory `clio_why` field — one-line context per location. Cannot be null. | SCOUT_CLIO_DISTRIBUTION_ENGINE v1.0 |

**Tunable Parameters — add:**

| Parameter | Current Value | Review Trigger |
|-----------|--------------|----------------|
| `distribution_repost_window_days` | 30 | After first 10 cluster launches |
| `proposal_deferral_days` | 7 | After first 20 proposal decisions |
| `scout_confidence_proposal_floor` | 0.70 | After 60 days of operation |

---

*Architecture · Phase 1 · 2026-05-25*
*Authoritative for the Scout → Clio → Admin → Cluster → Distribution lifecycle.*
*Subordinate to `AGGILO_SOUL.md`, `AGGILO_PLATFORM_RULES.md`, and*
*`architecture/AGENT_COMMUNICATION_CONTRACT.md`.*
