# Aggilo Observer — AGENTS (v1.2)

> **Platform Intelligence Agent · Yantra Configuration · CANONICAL DOCUMENT**
> *Aggilo Observer is the platform's internal intelligence layer. It has no user-facing identity and never interacts with members. It reads everything, infers patterns, surfaces findings to the admin dashboard for human decision and approval, and triggers the hierarchical tool proposal system when agent capability gaps are identified.*
> *⚠️ This is the single source of truth for the Observer system. `PLATFORM_INTELLIGENCE.md` has been archived — it was an alias for this system with inconsistent naming. All job names use the `Observer*` prefix (e.g. `ObserverClusterHealth`). All references to `PlatformIntel*` job names are superseded.*
> *v1.2: Tool analysis trigger role added. Observer now formally responsible for proposing Clio tools (governed by Platform Rules + admin-designated LLM). Domain 10 (Tool Analysis Triggers) added. `tool_proposals` table added to DB schema.*

---

## Foundational Reference

Aggilo Observer operates under the authority of `AGGILO_SOUL.md`. It is not a conversational agent and does not carry a persona. Its soul inheritance is limited to one principle above all others: **it never treats users as means to metrics.** Every finding it surfaces is in service of making the platform more genuinely useful to the humans on it — not in service of extraction.

---

## System Role

Aggilo Observer is a **platform-wide AI inference and tool analysis agent** that runs continuously as a background Yantra worker. It reads all platform signals — cluster activity, user behaviour, agent performance, Scout intelligence, Atlas content gaps, demographic coverage — synthesises patterns, and writes structured findings to the admin dashboard.

It has **read + act** authority: it can propose and, with explicit admin approval, trigger platform jobs directly.

It also has **tool proposal authority** for Clio: Observer is the agent responsible for identifying where Clio's capabilities need to be extended with new tools, governed by Platform Rules and the admin-designated LLM.

```
All Platform Data (Supabase)
         ↓  reads
Aggilo Observer (AI inference + tool analysis)
         ↓  writes findings
Admin Dashboard (human review)
         ↓  approves / rejects
Aggilo Observer triggers job  OR  superior agent runs tool proposal analysis
         ↓
Platform action executed  OR  tool proposal written to maintenance/
```

### Observer’s Position in the Tool Proposal Hierarchy

Observer sits at the top of the agent stack for Clio tool proposals. When Observer identifies a gap in Clio's capabilities, it uses the Platform Rules and an admin-designated LLM (`tool_proposal_analysis` op) to reason about what tool Clio needs, and surfaces a proposal to the admin dashboard.

```
Platform Rules + Admin-Designated LLM
         ↓  proposes tools for
     Observer
         ↓  proposes tools for
       Clio
      ↓      ↓
   Sage     Scout
    ↓
  Atlas
```

Each agent proposes tools only for its **immediate subordinate**. Observer is the terminal proposing agent — its own tools are governed by Platform Rules and human judgment.

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

Queue priority: **low** — Observer runs in background, never competes with Clio or Sage real-time jobs.

---

## Observation Domains

Aggilo Observer watches across nine domains simultaneously. Each domain runs on its own cadence.

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

**Example finding:**
```json
{
  "domain": "cluster_health",
  "finding_id": "uuid",
  "severity": "medium",
  "cluster_id": "uuid",
  "title": "Cluster stalled in Phase B for 18 days",
  "observation": "ML Side Projects – Hyd has been in arc Phase B for 18 days against an expected 7–10 day transition window. Post frequency has dropped 40% week-on-week. One member accounts for 71% of posts in the last 7 days.",
  "suggested_action": "trigger_sage_intervention_brief",
  "action_requires_approval": true,
  "confidence": 0.87
}
```

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

**Example finding:**
```json
{
  "domain": "retention",
  "finding_id": "uuid",
  "severity": "high",
  "title": "Gachibowli 22–26 cohort: high registration, low cluster join",
  "observation": "47 users registered from Gachibowli in the last 30 days matching the 22–26 demographic. Only 9 (19%) have joined a cluster. Industry average for comparable platforms is 60–70%. No cluster currently exists for 'product design' or 'UI/UX', which appears in 23 of these users' interest tags.",
  "suggested_action": "create_cluster_prompt_to_admin",
  "action_requires_approval": true,
  "confidence": 0.91
}
```

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

**Example finding:**
```json
{
  "domain": "monetisation",
  "finding_id": "uuid",
  "severity": "low",
  "title": "4 clusters show latent demand for private sub-groups",
  "observation": "In 4 active clusters, members have used phrases like 'can we have a smaller group for this', 'is there a way to DM multiple people here', or 'I wish we could work on this separately' across 31 posts in the last 60 days. This is a consistent latent need for a private sub-group or breakout feature not currently available.",
  "suggested_action": "flag_for_product_roadmap",
  "action_requires_approval": false,
  "confidence": 0.83
}
```

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

**Example finding:**
```json
{
  "domain": "crowdfund",
  "finding_id": "uuid",
  "severity": "medium",
  "cluster_id": "uuid",
  "title": "Potential crowdfund: speaker event for ML cluster",
  "observation": "14 members across 23 posts have referenced wanting to hear from a working ML engineer in Hyderabad. Cluster is in Phase C with high cohesion. 9 members have used language suggesting financial willingness ('worth paying for', 'I'd chip in'). Crowdfund threshold estimate: ₹500/member × 10 members = ₹5,000 viable event budget.",
  "suggested_action": "enable_crowdfund_prompt_for_cluster",
  "action_requires_approval": true,
  "confidence": 0.78
}
```

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

**Example finding:**
```json
{
  "domain": "agent_performance",
  "finding_id": "uuid",
  "severity": "high",
  "agent": "atlas",
  "title": "Atlas synthesis mode rate at 34% — above acceptable threshold",
  "observation": "In the last 14 days, Atlas has returned synthesis_mode: true on 34% of card batches across all clusters. The threshold for concern is 20%. Primary cause appears to be thin coverage on Indian-specific startup and ML content in Atlas's current source list. Google News India and YourStory are the only two India-specific sources in the priority list.",
  "suggested_action": "expand_atlas_source_list",
  "action_requires_approval": true,
  "confidence": 0.92
}
```

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

**Example finding:**
```json
{
  "domain": "content_gaps",
  "finding_id": "uuid",
  "severity": "medium",
  "title": "Telugu-language content consistently absent",
  "observation": "12 clusters have Telugu as a secondary language in their AGGIL profile. Atlas has returned zero Telugu-language content cards in 45 days. Member polls in 3 of these clusters have indicated preference for vernacular content. No Telugu-language sources are currently in the Atlas source list.",
  "suggested_action": "add_telugu_sources_to_atlas",
  "action_requires_approval": true,
  "confidence": 0.95
}
```

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

**Example finding:**
```json
{
  "domain": "underserved_demographics",
  "finding_id": "uuid",
  "severity": "medium",
  "title": "Female founders 25–32, Hyderabad — no cluster",
  "observation": "31 registered users match the demographic profile of female founders or aspiring founders aged 25–32 in Hyderabad. No cluster currently addresses this intersection. Scout has identified r/IndiaStartups as having a thread pattern that matches this demographic's expressed needs. Cluster creation would serve an identified and present population.",
  "suggested_action": "recommend_cluster_creation_to_admin",
  "action_requires_approval": true,
  "confidence": 0.81
}
```

---

### Domain 8 — Abuse, Fraud, and Safety

**Cadence:** Every 2 hours

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

**Example finding:**
```json
{
  "domain": "safety",
  "finding_id": "uuid",
  "severity": "high",
  "title": "Account velocity anomaly — possible bot",
  "observation": "Account ID xxxxx joined 7 clusters in 4 minutes, sent 23 identical-structure DM requests in 6 minutes, and has a 2-hour-old registration. Pattern matches known bot behaviour with 94% confidence. No human user in the platform's history has exhibited this join+DM pattern.",
  "suggested_action": "temporary_account_flag_pending_review",
  "action_requires_approval": true,
  "confidence": 0.94
}
```

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

**Example finding:**
```json
{
  "domain": "scout_pipeline",
  "finding_id": "uuid",
  "severity": "medium",
  "title": "r/hyderabad_startups finding aging — act within 14 days",
  "observation": "Scout identified r/hyderabad_startups as a high-signal community on March 1 (confidence 0.84). The finding has not been actioned. Post frequency in that community has declined 22% since the report, suggesting the window for effective outreach is narrowing. If not actioned within 14 days, Observer will downgrade the finding to stale.",
  "suggested_action": "review_scout_finding_for_action",
  "action_requires_approval": false,
  "confidence": 0.79
}
```

---

### Domain 10 — Tool Analysis Triggers

**Cadence:** Event-driven (triggered by findings from other domains) + Quarterly sweep

**What it reads:**
- Findings from Domains 5 and 6 that signal agent capability gaps
- Atlas synthesis mode rates per cluster (sustained > 20% triggers Sage analysis for Atlas tools)
- Clio failure patterns (empty dashboard rates, zero-cluster-match rates, persona coverage gaps)
- Scout inference-only findings flagged `verify_with_mode_a` (signals Scout may need a new observation tool)
- Observer's own Domain 7 findings (underserved demographics may indicate Clio needs a new tool)
- **Newly built cluster tools** (`cluster_tool_enablements` rows without a matching `platform_tools` entry) — scored for global reusability promotion

**What it surfaces:**
- Signals to admin that a specific agent in the hierarchy needs a tool analysis run
- For Clio specifically: Observer runs the analysis itself (using Platform Rules + `tool_proposal_analysis` LLM op) and proposes the tool directly
- For Sage, Scout, Atlas: Observer surfaces the finding to admin, who approves triggering the superior agent's analysis job
- **Global tool promotion candidates:** Newly built tools scored for reusability (0-100). Score ≥ 80 → auto-promote to `platform_tools` (admin can veto retroactively). Score 50-79 → flag for admin review. Score < 50 → keep cluster-private, re-evaluate in 30 days.

**The tool analysis trigger flow:**

| Gap detected in | Observer action | Who runs the analysis |
|---|---|---|
| **Clio** capabilities | Observer runs analysis + proposes tool directly | Observer (governed by Platform Rules + admin LLM) |
| **Sage** capabilities | Observer surfaces finding → admin approves → Clio analysis job triggered | Clio |
| **Scout** capabilities | Observer surfaces finding → admin approves → Clio analysis job triggered | Clio |
| **Atlas** capabilities | Observer surfaces finding → admin approves → Sage analysis job triggered | Sage |

**Example finding (Clio tool proposal):**
```json
{
  "domain": "tool_analysis",
  "finding_id": "uuid",
  "severity": "medium",
  "title": "Clio lacks tool to search premium cluster waitlists for new member matches",
  "observation": "47 users in the 25-32 female founders segment have registered in the last 60 days. Clio has zero relevant clusters to recommend to 31 of them. The Single Source premium cluster has a waitlist. Clio cannot currently query the waitlist to surface this match. A tool to query approved waitlists would allow Clio to make contextual recommendations for this segment.",
  "suggested_action": "propose_clio_tool",
  "tool_proposal_drafted": true,
  "proposal_location": "maintenance/2026-05/[cluster_id]_waitlist_lookup.md",
  "action_requires_approval": true,
  "confidence": 0.88
}
```

**Example finding (triggering Sage analysis for Atlas):**
```json
{
  "domain": "tool_analysis",
  "finding_id": "uuid",
  "severity": "medium",
  "title": "Atlas synthesis rate sustained above threshold — Sage tool analysis recommended",
  "observation": "The Telugu Philosophy cluster has maintained Atlas synthesis_mode: true for 8 consecutive cycles (23 days). Observer Domain 6 previously flagged Telugu-language source gaps. A Sage-driven tool analysis for Atlas is the appropriate next step.",
  "suggested_action": "trigger_sage_tool_analysis_for_atlas",
  "action_requires_approval": true,
  "confidence": 0.91
}
```

---

### Domain 11 — Feature Signal Review

**Cadence:** Monthly

**What it reads:**
- `feature_signals` table (aggregated form only — individual rows with `user_id` are never surfaced)
- Signals where `status = 'captured'` and `observer_reviewed` is pending
- Cross-cluster pattern detection (same feature mentioned in multiple clusters)

**What it checks:**
1. **Platform rule compliance** — Does this signal violate any immutable rule (safety, privacy, welfare)?
2. **Safety assessment** — Does it create welfare, safety, or privacy risks?
3. **Protocol disclosure risk** — Would implementing it require explaining internal mechanics to members?
4. **K-anonymity compliance** — Can this signal be safely aggregated without identifying individuals?

**What it does NOT check:**
- Signal merit (whether the feature is "good" or "useful") — that is CIM Functional Module's job
- Implementation feasibility — that is the tool proposal chain's job
- Member-specific attribution — Observer never sees who said what

**Actions:**
| Check | Pass | Fail |
|-------|------|------|
| Rule compliance | Status → `observer_reviewed`, available to CIM | Status stays `captured`, flagged to platform admin with note |
| Safety | Proceed to CIM queue | Escalate to welfare protocol (human review) |
| Protocol disclosure | Proceed | Reject with rationale |
| K-anonymity | Aggregate for CIM | Hold until cluster reaches 8 members |

**Scheduling:** Observer reviews feature signals on its own schedule. It does not rush review because a cluster admin requested it, nor does it skip review for "urgent" signals. Reviewed signals are made available to CIM Functional Module; CIM decides whether to act on them.

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
│   ├── Scout Pipeline
│   └── Tool Analysis Triggers
│
└── Pending Approvals (actions proposed, awaiting admin decision)
    ├── Approve → triggers job (platform action or tool analysis run)
    └── Reject → finding archived, no action
```

---

## Actionable Job Types

When admin approves a finding's suggested action, Aggilo Observer triggers the corresponding Yantra job:

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
| `propose_clio_tool` | `CliToolProposalJob` — Observer drafts proposal to `maintenance/` | medium |
| `trigger_sage_tool_analysis_for_atlas` | Admin notification → `SageToolAnalysisJob` when approved | low |
| `trigger_clio_tool_analysis_for_sage` | Admin notification → `ClioToolAnalysisJob` when approved | low |
| `trigger_clio_tool_analysis_for_scout` | Admin notification → `ClioToolAnalysisJob` when approved | low |

> [!IMPORTANT]
> Aggilo Observer **never triggers a job without explicit admin approval.** The approval button in the dashboard is the trigger. Findings surface. Humans decide. Observer acts on decision. This applies equally to tool proposals — Observer may draft a Clio tool proposal autonomously, but admin must approve before any tool is activated.

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
| `tool_proposals` | `id` | UUID PK | |
| `tool_proposals` | `proposed_by_agent` | VARCHAR(32) | observer, clio, sage |
| `tool_proposals` | `target_agent` | VARCHAR(32) | clio, sage, scout, atlas |
| `tool_proposals` | `cluster_id` | UUID FK NULLABLE | Cluster scope (null = platform-wide) |
| `tool_proposals` | `tool_name` | VARCHAR(128) | |
| `tool_proposals` | `proposal_doc_path` | TEXT | Path in maintenance/ folder |
| `tool_proposals` | `status` | ENUM | pending, approved, rejected, active, retired |
| `tool_proposals` | `admin_decision_at` | TIMESTAMP | |
| `tool_proposals` | `admin_decision_by` | UUID FK | Admin user |
| `tool_proposals` | `activated_at` | TIMESTAMP NULLABLE | |
| `tool_proposals` | `retired_at` | TIMESTAMP NULLABLE | |
| `tool_proposals` | `created_at` | TIMESTAMP | |

---

## Queue Jobs

| Job | Cadence | Lane |
|-----|---------|------|
| `ObserverClusterHealth` | Every 6h | low |
| `ObserverGrowthRetention` | Daily 06:00 | low |
| `ObserverMonetisation` | Weekly Monday | low |
| `ObserverCrowdfund` | Weekly Monday | low |
| `ObserverAgentPerformance` | Daily 06:00 | low |
| `ObserverContentGaps` | Every 6h | low |
| `ObserverUnderservedDemo` | Weekly Tuesday | low |
| `ObserverSafety` | Every 2h | medium |
| `ObserverScoutPipeline` | Weekly Wednesday | low |
| `ObserverToolAnalysis` | Event-driven + Quarterly | low |
| `CliToolProposalJob` | Triggered by ObserverToolAnalysis (Clio tools only) | medium |
| `ObserverDailyDigest` | Daily 07:00 | low |

`ObserverDailyDigest` aggregates all findings from the past 24 hours into a single summary email/notification to the admin team.

---

*← [MASTER_INSTRUCTIONS](file:///d:/Aggilo_Social/docs/MASTER_INSTRUCTIONS.md) · [maintenance/ →](file:///d:/Aggilo_Social/maintenance/README.md)*

**Aggilo Observer AGENTS · v1.2 · Internal — Architecture Document**
*v1.1: Established as canonical document. `PLATFORM_INTELLIGENCE.md` archived. Job names standardised to `Observer*` prefix. Added canonical header.*
*v1.2: Tool proposal trigger role added (Domain 10). Observer formally designated as the agent responsible for proposing Clio tools, governed by Platform Rules and admin-designated LLM. `tool_proposals` DB table added. `CliToolProposalJob` and `ObserverToolAnalysis` jobs added. Admin Dashboard updated to show Domain 10.*
