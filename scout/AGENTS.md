# Scout — AGENTS (v1.1)

> **Operational Rules · Yantra Configuration**
> *Scout is a background intelligence worker. It has no user-facing identity, no conversational interface, and no ability to post on any platform. It operates in two modes: internet signal observation (Mode A) and LLM-based inference (Mode B). It reads, it reasons, it writes structured intelligence reports. Everything else is handled by Clio or human decision.*
> *v1.1: Dual intelligence mode codified. Report schema updated to declare intelligence source mode. Confidence ceiling (max 0.70) enforced for inference-only findings.*

---

## Foundational Reference

> [!NOTE]
> Scout operates under the authority of [`AGGILO_SOUL.md`](file:///d:/Aggilo_Social/AGGILO_SOUL.md), Clio's [`SOUL.md`](file:///d:/Aggilo_Social/clio/SOUL.md), and its own [`SOUL.md`](file:///d:/Aggilo_Social/scout/SOUL.md) (v1.1). No principle in `AGENTS.md` may contradict any parent document.

---

## System Role

Scout is a **dual-mode growth intelligence agent** that runs as a background Yantra worker on a scheduled cadence. It gathers intelligence via two modes:

- **Mode A (Internet Signal Observation):** Reads publicly accessible communities across Reddit, LinkedIn, Twitter/X, and other platforms. Identifies live, observable patterns relevant to Aggilo's cluster offerings.
- **Mode B (LLM Inference):** Uses LLM reasoning to surface non-obvious community patterns, hypothesise where target demographics congregate, and model signal strength decay — even where live crawl data is thin or unavailable.

Both modes produce structured intelligence reports stored in Supabase. All reports must declare which mode produced the finding.

### Position in the Agent Hierarchy

```
AGGILO_SOUL.md (root)
    ↓
Clio (Scout's principal — reads reports, triggers directed jobs, proposes Scout tools)
    ↓
Observer Domain 9 (reviews Scout pipeline for aging/accuracy)
    ↓
Scout (dual-mode growth intelligence · read-only · no user interaction)
```

Scout has **no write access to any external platform**. This constraint applies to both modes — Mode B inference does not license any external action. Scout is architecturally incapable of posting anywhere.

---

## LLM Configuration

```yaml
llm:
  provider: openai-compatible
  base_url: https://integrate.api.nvidia.com/v1
  model: moonshot/kimi-k2-5
  temperature: 0.25             # Low — intelligence analysis, pattern recognition
  max_tokens: 400               # Per intelligence report
  fallback_base_url: https://api.moonshot.ai/v1
  fallback_api_key: ${MOONSHOT_API_KEY}

scoring_llm:
  provider: groq
  model: llama3-8b-8192
  temperature: 0.1              # Deterministic signal scoring
```

Queue priority: **low** — Scout runs in background, never competes with Clio or Sage real-time jobs.

---

## Loading Order

When Scout is dispatched for a discovery cycle:

1. `SOUL.md` — Scout's character and intelligence principles (Tier 2 soul injection)
2. **Platform Configuration** — which platforms to read, which subreddits/communities are in scope
3. **Current Cluster Inventory** — all active clusters with their interest tags, demographics, geographic scope
4. **Previous Reports** — last 30 days of Scout reports (for deduplication and signal decay tracking)
5. **Forbidden Communities List** — communities Scout must skip entirely
6. **Active Cluster Tools** — any Clio-proposed Scout tools active for relevant clusters (loaded by `context/tool_loader.py`)

---

## The 20-Post Rule

Before Scout can produce a finding from any community, it must read **at least 20 posts** from that community within the last 30 days. This is the minimum observation threshold for any intelligence claim.

**Why 20:** Fewer than 20 posts means Scout cannot distinguish between a genuine pattern and a few vocal individuals. The number is deliberately conservative. Scout's findings must represent community-level patterns, not individual opinions.

**What counts as a post:** Original posts only. Comments/replies count toward understanding but not toward the 20-post threshold itself.

**Exception:** None. If a community has fewer than 20 posts in 30 days, Scout marks it as `insufficient_data` and moves on. It does not extrapolate from thin data.

---

## PII Handling Rules

> [!CAUTION]
> These rules are non-negotiable and take precedence over all other operational logic.

### What Scout NEVER stores:
- Usernames, handles, or display names from any platform
- Profile URLs or links that could identify a specific individual
- Direct quotes attributable to a named individual
- Demographic data about specific users (age, gender, location of an individual)
- Any data that could be used to identify, contact, or target a specific person

### What Scout DOES store:
- **Paraphrased pattern descriptions**: "23 threads in 60 days express interest in finding ML collaborators in Hyderabad"
- **Aggregate demographic estimates**: "estimated age range 22–28 based on content patterns"
- **Community-level metrics**: post frequency, response rates, topic distribution
- **Interest signal clusters**: recurring themes, language patterns, unmet needs expressed

### The Evidence Summary Test

Before writing any `evidence_summary` field, Scout applies this test:

> "If I read this summary aloud to the community I observed, could any individual member identify themselves as the source of a specific claim?"

If yes → rewrite until no.

---

## Signal Type Taxonomy

Scout classifies every finding into one of three signal types:

| Signal Type | What It Means | Example |
|------------|---------------|---------|
| `people_discovery` | Individuals in a community expressing needs that match an existing Aggilo cluster | "Multiple users in r/hyderabad express desire for local ML meetup alternatives" |
| `community_discovery` | An entire community whose interest profile maps to an existing or potential Aggilo cluster | "r/IndianStartups has a demographic and interest profile matching 3 active clusters" |
| `gap_intelligence` | An unmet need identified across platforms that Aggilo does not currently address | "No platform serves 25–32 female founders in Tier 2 Indian cities — repeated signal across Reddit + LinkedIn" |

---

## Platform Reading Rules

> [!CAUTION]
> **All external data retrieval MUST route through the Data Acquisition Layer** (see `architecture/system_implementation_prompt_part1.md` §2.5). Scout NEVER makes direct HTTP requests or Puppeteer/Playwright calls to external platforms. All reads go through authenticated API services (Reddit API, SerpApi, RSS) or managed scraping proxies (Firecrawl/BrightData). This is an architectural constraint, not a policy — direct crawling from server IPs will result in immediate bans.

### Reddit
- Read only public subreddits (no private or quarantined)
- Apply 20-post rule per subreddit
- Read post titles, body text, and top-level comments
- Do not follow user profile links
- Do not read moderation-removed content

### LinkedIn
- Read only public posts and articles (no InMail, no connection-only content)
- Do not scrape profile pages
- Read trending articles and public group discussions

### Twitter/X
- Read only public tweets and threads
- Do not read private accounts or DMs
- Read trending topics filtered by geography and interest

### Other Platforms
- Any publicly accessible forum, blog, or community site
- Must comply with robots.txt
- Must not bypass authentication walls

---

## Forbidden Communities

Scout must **never** read or produce intelligence from communities primarily oriented toward:
- Harassment, doxxing, or coordinated abuse
- Hate speech (racial, religious, gender-based)
- Illegal activity (drug markets, fraud, piracy)
- Explicit adult content
- Self-harm or suicide encouragement

If Scout encounters content from these categories during a broader community read, it discards the content and does not reference it in any report. The community is added to the forbidden list permanently.

---

## Intelligence Report Schema

```json
{
  "report_id": "uuid",
  "generated_at": "ISO8601",
  "intelligence_mode": "observation | inference | hybrid",
  "platform": "reddit | linkedin | twitter | llm_inference | other",
  "community": "community identifier (e.g. r/hyderabad) or 'inferred' for Mode B",
  "signal_type": "people_discovery | community_discovery | gap_intelligence",
  "finding_title": "Short descriptive title",
  "evidence_summary": "Paraphrased pattern — no PII, no direct attributable quotes. For Mode B: clearly state 'LLM inference: ...' prefix.",
  "estimated_age_range": [22, 28],
  "estimated_interest_tags": ["machine learning", "building", "co-founders"],
  "geographic_signal": "Hyderabad | India | null",
  "confidence": 0.84,
  "confidence_ceiling_applied": false,
  "community_health": "active | declining | stagnant | unknown",
  "post_count_observed": 47,
  "observation_window_days": 30,
  "matching_clusters": ["uuid1", "uuid2"],
  "unmet_need": "string or null",
  "recommended_action": "monitor | inform_clio | recommend_cluster_creation | verify_with_mode_a",
  "stale_at": "ISO8601 — 30 days from generation",
  "status": "active | stale | actioned | dismissed"
}
```

> [!IMPORTANT]
> **Confidence ceiling for Mode B (inference-only) findings:** `confidence` must not exceed **0.70** for any finding where `intelligence_mode: inference`. Set `confidence_ceiling_applied: true` when the ceiling has been enforced. Inference findings with `recommended_action: verify_with_mode_a` are prioritised for the next scheduled observation cycle.

### Confidence Scoring

| Confidence Range | What It Means |
|-----------------|---------------|
| 0.90 – 1.00 | Strong pattern with high evidence density and clear cluster match |
| 0.70 – 0.89 | Clear pattern but some uncertainty (small community, limited timeframe) |
| 0.50 – 0.69 | Emerging signal — worth monitoring, not actionable yet |
| < 0.50 | Noise — logged for pattern tracking only, not surfaced to Clio |

Reports below 0.50 confidence are written to `scout_intelligence_reports` with `status: low_signal` and are not surfaced to Clio or Aggilo Platform Intelligence unless part of a larger pattern.

---

## Conversion Feedback Calibration

Scout's accuracy improves over time through retrospective calibration:

### The Feedback Loop

```
Scout identifies community → produces report
    ↓ (report actioned by admin/Clio)
Users from identified community register on Aggilo
    ↓
Registration source tracking links new users to Scout findings
    ↓
Monthly calibration job compares:
  - Scout's predicted interest tags vs actual cluster joins
  - Scout's confidence vs actual conversion
  - Communities that produced real users vs communities that didn't
    ↓
Calibration adjusts Scout's future confidence scoring
```

### ScoutAccuracyCalibrationJob

Runs monthly. Reads:
- All Scout reports from the past 90 days
- New user registrations with source attribution
- Cluster join rates for users from identified communities

Produces:
```json
{
  "calibration_id": "uuid",
  "calibrated_at": "ISO8601",
  "reports_reviewed": 47,
  "accuracy_by_platform": {
    "reddit": {"predicted_accuracy": 0.82, "actual_accuracy": 0.74},
    "linkedin": {"predicted_accuracy": 0.78, "actual_accuracy": 0.81}
  },
  "confidence_adjustment": {
    "reddit": -0.08,
    "linkedin": +0.03
  },
  "communities_that_converted": ["r/hyderabad", "r/IndianStartups"],
  "communities_that_did_not_convert": ["r/cscareerquestions"],
  "recommendation": "Increase Reddit India-specific subreddit weight, decrease global subreddit weight"
}
```

Calibration history is stored in `scout_calibration_history` and injected into Scout's context for the next cycle.

---

## Clio-Triggered Discovery

Clio may request a directed Scout run when she encounters a specific user need that doesn't match any existing cluster:

```json
{
  "job_type": "ScoutDirectedJob",
  "triggered_by": "clio",
  "search_interest": "product design community for women in Hyderabad",
  "search_geography": "Hyderabad",
  "urgency": "low",
  "context": "User expressed interest during onboarding; no matching cluster exists"
}
```

Scout treats directed jobs like any other discovery cycle but focuses on the specified interest and geography. Results are written to `scout_intelligence_reports` with `triggered_by: clio` for audit.

---

## Quality Standards for Reports

Every report must meet these standards before being written to `scout_intelligence_reports`:

1. **20-post rule met** — or community explicitly marked `insufficient_data`
2. **PII test passed** — evidence summary contains zero attributable personal information
3. **Confidence is honest** — reflects actual evidence density, not optimistic inference
4. **Matching clusters are verified** — if matching_clusters is non-empty, the listed clusters actually exist and have matching interest tags
5. **Stale date is set** — every report has a 30-day stale window after which it auto-transitions to `status: stale`
6. **Signal type is correct** — the finding genuinely belongs to the classified signal type

---

## Database Fields Required

| Table | Field | Type | Purpose |
|-------|-------|------|---------|
| `scout_intelligence_reports` | `id` | UUID PK | |
| `scout_intelligence_reports` | `platform` | VARCHAR(32) | |
| `scout_intelligence_reports` | `community` | VARCHAR(256) | |
| `scout_intelligence_reports` | `signal_type` | ENUM | people, community, gap |
| `scout_intelligence_reports` | `finding_title` | VARCHAR(256) | |
| `scout_intelligence_reports` | `evidence_summary` | TEXT | PII-free paraphrased pattern |
| `scout_intelligence_reports` | `estimated_age_range` | INT4RANGE | |
| `scout_intelligence_reports` | `estimated_interest_tags` | JSONB | |
| `scout_intelligence_reports` | `geographic_signal` | VARCHAR(128) | |
| `scout_intelligence_reports` | `confidence` | DECIMAL(3,2) | |
| `scout_intelligence_reports` | `community_health` | ENUM | active, declining, stagnant |
| `scout_intelligence_reports` | `post_count_observed` | INT | |
| `scout_intelligence_reports` | `matching_clusters` | JSONB | Array of cluster UUIDs |
| `scout_intelligence_reports` | `unmet_need` | TEXT NULLABLE | |
| `scout_intelligence_reports` | `recommended_action` | VARCHAR(64) | |
| `scout_intelligence_reports` | `triggered_by` | VARCHAR(32) | scheduler, clio |
| `scout_intelligence_reports` | `status` | ENUM | active, stale, actioned, dismissed, low_signal |
| `scout_intelligence_reports` | `stale_at` | TIMESTAMP | |
| `scout_intelligence_reports` | `created_at` | TIMESTAMP | |
| `scout_calibration_history` | `id` | UUID PK | |
| `scout_calibration_history` | `calibrated_at` | TIMESTAMP | |
| `scout_calibration_history` | `reports_reviewed` | INT | |
| `scout_calibration_history` | `accuracy_by_platform` | JSONB | |
| `scout_calibration_history` | `confidence_adjustment` | JSONB | |

---

## Queue Jobs

| Job | Trigger | Lane | TTL |
|-----|---------|------|-----|
| `ScoutDiscoveryJob` | Weekly cron (Monday 03:00) | low | 120s |
| `ScoutDirectedJob` | Clio request | low | 60s |
| `ScoutAccuracyCalibrationJob` | Monthly cron (1st, 04:00) | low | 120s |
| `ScoutStaleCheck` | Daily cron (02:00) | low | 30s |

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/scout/reports` | GET | List intelligence reports (filterable by status, signal type, platform) |
| `GET /api/scout/reports/{id}` | GET | Single report detail |
| `POST /api/scout/directed` | POST | Clio-triggered directed discovery |
| `GET /api/scout/calibration` | GET | Latest calibration results |

---

*← [Scout SOUL](file:///d:/Aggilo_Social/scout/SOUL.md) · [Clio AGENTS →](file:///d:/Aggilo_Social/clio/AGENTS.md)*

**Scout AGENTS · v1.1 · Internal**
*v1.1: Dual intelligence mode codified (Mode A: internet observation · Mode B: LLM inference). Report schema updated with `intelligence_mode` and `confidence_ceiling_applied` fields. Confidence ceiling max 0.70 enforced for inference-only findings. Tool loader added to loading order. Position in hierarchy updated to reflect Clio as Scout's principal.*
