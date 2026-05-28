# Aggilo Platform Intelligence

> **Built-in Platform-Wide Intelligence Layer · OpenClaw Configuration**
> *Aggilo Platform Intelligence is the platform's internal intelligence layer. It is not a user-facing agent. It reads everything, infers patterns, and surfaces findings to the admin dashboard for human decision and approval.*
> *Aggilo IS the observer. This intelligence is not a separate entity — it is a built-in capability of the platform itself.*

---

## Foundational Reference

Aggilo Platform Intelligence operates under the authority of [`AGGILO_SOUL.md`](file:///d:/Aggilo_Social/AGGILO_SOUL.md). It is not a conversational agent and does not carry a persona. Its soul inheritance is limited to one principle above all others: **it never treats users as means to metrics.** Every finding it surfaces is in service of making the platform more genuinely useful to the humans on it — not in service of extraction.

---

## System Role

Aggilo Platform Intelligence is a **platform-wide AI inference layer** that runs continuously as a background OpenClaw worker. It reads all platform signals — cluster activity, user behaviour, agent performance, Scout intelligence, Atlas content gaps, demographic coverage — synthesises patterns, and writes structured findings to the admin dashboard.

It has **read + act** authority: it can propose and, with explicit admin approval, trigger platform jobs directly.

```
All Platform Data (Supabase)
         ↓  reads
Platform Intelligence (AI inference)
         ↓  writes findings
Admin Dashboard (human review)
         ↓  approves / rejects
Platform Intelligence triggers job
         ↓
Platform action executed
```

---

## LLM Configuration

```yaml
llm:
  provider: openai-compatible
  base_url: https://integrate.api.nvidia.com/v1
  model: moonshot/kimi-k2-5
  temperature: 0.2          # Low — inference and pattern recognition, not creativity
  max_tokens: 800           # Findings are substantive, not brief
  fallback_base_url: https://api.moonshot.ai/v1

scoring_llm:
  provider: groq
  model: llama3-8b-8192
  temperature: 0.1          # Deterministic scoring
```

Queue priority: **low** — Platform Intelligence runs in background, never competes with Clio or Sage real-time jobs.

---

## Observation Domains

Platform Intelligence watches across nine domains simultaneously. Each domain runs on its own cadence.

---

### Domain 1 — Cluster Health

**Cadence:** Every 6 hours

**What it reads:**
- Post frequency, response rates, member activity distribution
- Arc phase progression vs expected timeline
- Sage intervention frequency and outcome signals
- Atlas content acceptance rate per cluster

**Findings it surfaces:**
- Clusters stalling in a given arc phase beyond expected duration
- Clusters where one member dominates >60% of posts (narrowing risk)
- Clusters approaching Phase E naturally (success signal — flag for reduced agent cost allocation)
- Clusters with declining activity after a previously active period

---

### Domain 2 — User Growth, Retention, and Churn

**Cadence:** Daily

**What it reads:**
- New user registrations by demographic segment and geography
- Time-to-first-cluster-join
- Time-to-first-post
- Session frequency and recency per user cohort
- Users who have not returned in 14, 30, 60 days
- Sage opt-in rate and opt-in timing patterns

**Findings it surfaces:**
- Cohorts with unusually high or low activation rates (time-to-first-post)
- Geographic segments with strong registration but poor cluster join rates (supply gap — no relevant cluster exists)
- Users approaching 30-day silence (pre-churn signal)
- Sage opt-in rate trend — if declining, surfaces for review

---

### Domain 3 — Monetisation Gaps and Opportunities

**Cadence:** Weekly

**What it reads:**
- Free tier cluster activity levels and Sage engagement depth
- Features being used heavily on free tier that indicate premium intent
- Clusters where members have expressed resource, funding, or collaboration needs in posts
- Cross-cluster patterns that suggest a paid group offering would be viable

**Findings it surfaces:**
- Free tier clusters where engagement depth suggests members would pay for enhanced features
- Specific features being used at capacity on free tier (signal of upgrade intent)
- Latent needs expressed in cluster conversations that map to a potential paid product

---

### Domain 4 — Free Tier Crowdfund Opportunities

**Cadence:** Weekly

**What it reads:**
- Clusters where members are collectively asking for a specific resource, tool, event, or feature
- Post language indicating willingness to contribute ("I'd pay for," "we should pool," "someone should organise")
- Cluster cohesion score (Phase C+ only — crowdfunding requires trust)

**Findings it surfaces:**
- Clusters where a specific shared need has reached critical expression mass — enough members have voiced it that a crowdfund mechanism would be viable
- Suggested crowdfund framing for each identified cluster

**What a crowdfund feature means here:** A lightweight in-cluster mechanism where Sage proposes a shared goal (e.g. "this cluster wants to bring a speaker in — 12 members have mentioned it — would you collectively fund it?"), members indicate willingness, and if threshold is reached, admin is notified to facilitate. This is not a payment product — it is a coordination signal.

---

### Domain 5 — Agent Performance

**Cadence:** Daily

**What it reads:**
- Clio: session length, opt-in conversion, Sage introduction acceptance rate, welfare escalation frequency
- Sage: arc phase transition rate, Atlas brief acceptance rate, synthesis post engagement, description refinement proposals accepted vs returned
- Atlas: relevance score distribution, synthesis mode frequency, AutoResearch failure rate, calibration job delta size
- Scout: intelligence report accuracy (retrospective — did identified communities produce genuine users?), report volume and signal density

**Findings it surfaces:**
- Agent quality degradation signals (e.g. Atlas synthesis mode rate rising above 20% — content source coverage gap)
- Clio's Sage introduction acceptance rate below expected threshold
- Sage arc phase transitions not occurring in clusters where conditions are met
- Scout reports with low retrospective accuracy

---

### Domain 6 — Content Gaps

**Cadence:** Every 6 hours (aligned with Atlas pulse refresh)

**What it reads:**
- Atlas zero-card result frequency by cluster and interest category
- Synthesis mode frequency by topic area
- Member poll feedback indicating content dissatisfaction
- Topics members are asking about that Atlas has not addressed

**Findings it surfaces:**
- Interest categories consistently producing zero or low-quality Atlas results
- Specific topics members are requesting that fall outside Atlas's current source coverage
- Source list gaps by geography or interest domain

---

### Domain 7 — Underserved Demographics

**Cadence:** Weekly

**What it reads:**
- AGGIL demographic breakdown of registered users vs existing cluster coverage
- Interest tag frequency across users with no matching cluster
- Geographic segments with registered users but no local cluster
- Scout intelligence reports flagging unmet needs

**Findings it surfaces:**
- Demographic segments present on the platform with no cluster serving them
- Interest combinations that appear repeatedly across user profiles but have no cluster home
- Geographic pockets with sufficient user density for a new cluster

---

### Domain 8 — Abuse, Fraud, and Safety

**Cadence:** Every 2 hours

> [!CAUTION]
> This domain has the highest cadence and priority of all observation domains. Safety findings at `critical` severity are surfaced immediately.

**What it reads:**
- Account creation velocity anomalies (bot signals)
- Post content flagged by safety classifier (not LLM — rule-based first pass)
- Member report signals from within clusters
- Unusual interaction patterns (e.g. one account generating high volume of DM requests to new users)
- Cluster creation anomalies (multiple clusters created by same account with similar descriptions — potential spam cluster)

**Findings it surfaces:**
- Accounts exhibiting bot-like behaviour (high velocity, low variation, new account)
- Content that may violate platform safety standards
- Clusters that appear to exist for commercial spam rather than genuine community
- Patterns suggesting coordinated inauthentic behaviour

**Severity levels:**

| Severity | Response |
|----------|----------|
| `critical` | Immediately surfaces to admin. Suggested action may include temporary account suspension pending review. |
| `high` | Surfaces within the hour. Admin review required before any action. |
| `medium` | Surfaces in next daily digest. Logged for pattern tracking. |
| `low` | Logged only. Included in weekly pattern report. |

---

### Domain 9 — Scout Prospect Pipeline

**Cadence:** Weekly (aligned with Scout intelligence cycle)

**What it reads:**
- All Scout intelligence reports in the last 30 days
- Conversion rate of previously identified communities (did they produce users?)
- Communities Scout identified that have not yet been actioned
- Signal strength decay (a community Scout identified 60 days ago may no longer be active)

**Findings it surfaces:**
- High-confidence Scout findings that have not been actioned within 30 days (opportunity decay risk)
- Communities where signal strength is decaying — act now or lose the window
- Retrospective accuracy of Scout's previous findings — used to calibrate future Scout confidence scores

---

## Admin Dashboard Structure

Findings populate a structured admin dashboard with the following sections:

```
Aggilo Admin Dashboard
│
├── 🔴 Critical (requires immediate attention)
├── 🟠 High Priority (review within 24h)
├── 🟡 Medium (weekly review)
├── ⚪ Low / Informational
│
├── By Domain
│   ├── Cluster Health
│   ├── Growth & Retention
│   ├── Monetisation
│   ├── Crowdfund Opportunities
│   ├── Agent Performance
│   ├── Content Gaps
│   ├── Underserved Demographics
│   ├── Safety & Abuse
│   └── Scout Pipeline
│
└── Pending Approvals (actions proposed, awaiting admin decision)
    ├── Approve → triggers job
    └── Reject → finding archived, no action
```

---

## Actionable Job Types

When admin approves a finding's suggested action, Platform Intelligence triggers the corresponding OpenClaw job:

| Suggested Action | Job Triggered | Queue |
|-----------------|---------------|-------|
| `trigger_sage_intervention_brief` | `SageInterventionJob` | medium |
| `create_cluster_prompt_to_admin` | Admin notification only — no auto-creation | — |
| `enable_crowdfund_prompt_for_cluster` | `SageCrowdfundPromptJob` | medium |
| `expand_atlas_source_list` | Admin config change — no job | — |
| `add_telugu_sources_to_atlas` | Admin config change — no job | — |
| `recommend_cluster_creation_to_admin` | Admin notification only | — |
| `temporary_account_flag_pending_review` | `AccountSafetyFlagJob` | high |
| `review_scout_finding_for_action` | Admin notification only | — |

> [!IMPORTANT]
> Platform Intelligence **never triggers a job without explicit admin approval.** The approval button in the dashboard is the trigger. Findings surface. Humans decide. Platform Intelligence acts on decision.

---

## Database Fields Required

| Table | Field | Type | Purpose |
|-------|-------|------|---------|
| `observer_findings` | `id` | UUID PK | |
| `observer_findings` | `domain` | VARCHAR(64) | Which observation domain |
| `observer_findings` | `severity` | ENUM | critical, high, medium, low |
| `observer_findings` | `title` | VARCHAR(256) | |
| `observer_findings` | `observation` | TEXT | Full AI-written finding |
| `observer_findings` | `suggested_action` | VARCHAR(128) | |
| `observer_findings` | `action_requires_approval` | BOOLEAN | |
| `observer_findings` | `confidence` | DECIMAL(3,2) | 0–1 |
| `observer_findings` | `status` | ENUM | pending, approved, rejected, actioned, stale |
| `observer_findings` | `admin_decision_at` | TIMESTAMP | |
| `observer_findings` | `admin_decision_by` | UUID FK | Admin user |
| `observer_findings` | `job_triggered_at` | TIMESTAMP | |
| `observer_findings` | `related_cluster_id` | UUID FK NULLABLE | |
| `observer_findings` | `related_user_id` | UUID FK NULLABLE | |
| `observer_findings` | `created_at` | TIMESTAMP | |
| `observer_findings` | `stale_at` | TIMESTAMP | Auto-calculated per domain |

---

## Queue Jobs

| Job | Cadence | Lane |
|-----|---------|------|
| `PlatformIntelClusterHealth` | Every 6h | low |
| `PlatformIntelGrowthRetention` | Daily 06:00 | low |
| `PlatformIntelMonetisation` | Weekly Monday | low |
| `PlatformIntelCrowdfund` | Weekly Monday | low |
| `PlatformIntelAgentPerformance` | Daily 06:00 | low |
| `PlatformIntelContentGaps` | Every 6h | low |
| `PlatformIntelUnderservedDemo` | Weekly Tuesday | low |
| `PlatformIntelSafety` | Every 2h | medium |
| `PlatformIntelScoutPipeline` | Weekly Wednesday | low |
| `PlatformIntelDailyDigest` | Daily 07:00 | low |

`PlatformIntelDailyDigest` aggregates all findings from the past 24 hours into a single summary email/notification to the admin team.

---

*← [Sage AGENTS](file:///d:/Aggilo_Social/sage/AGENTS.md) · [MASTER_INSTRUCTIONS](file:///d:/Aggilo_Social/docs/MASTER_INSTRUCTIONS.md)*

**Aggilo Platform Intelligence · v1.0 · Internal — Architecture Document**
