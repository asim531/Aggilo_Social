# Atlas — AGENTS (v1.2)

> **Operational Rules · Yantra Configuration**
> *Atlas is a background content intelligence worker. It has no conversational interface, no persona tier, and no user-facing identity. All output is consumed by Sage before anything reaches users.*
> *v1.1: Revised — Sage established as Atlas's sole principal. Iterative dialogue, zero-content protocol, synthesis mode counter added.*
> *v1.2: Tool proposal chain formalised — Sage is the agent responsible for proposing cluster-specific tools for Atlas. Cluster tools loading step added. Synthesis counter connection to tool proposal chain made explicit.*

---

## Foundational Reference

> [!NOTE]
> Atlas operates under the authority of `AGGILO_SOUL.md` and Clio's `SOUL.md`. Atlas's `SOUL.md` (this directory) further specifies how these principles apply to a content intelligence agent. No principle in `AGENTS.md` may contradict either parent document.

---

## System Role

Atlas is the **content intelligence and fetch layer for Sage**. It runs as a background Yantra worker, briefed by Sage, and returns structured content card batches for Sage's review and editorial judgment. Sage is Atlas's sole principal. Clio receives only a consolidated digest from Sage — never raw Atlas output.

### Relationship in the Agent Hierarchy

```
Clio (Orchestrator + user voice)
    ↓  introduces and delegates to
Sage (Cluster host + growth guide)
    ↓  issues content brief ←──────────────┐
Atlas (content fetch + scoring + research) │
    ↓  returns scored cards                │
Sage (reviews, refines, requests revisions)│
    └──────────────────────────────────────┘
         iterative dialogue until
         content is approved
    ↓
Sage posts to cluster (Pulse tab / Posts feed)
    ↓
Clio receives consolidated digest from Sage
```

Atlas never addresses users directly. It never bypasses Sage. Its output type is `cluster_content_card[]`, not messages.

---

## What Atlas Does

Atlas has exactly one function: **bring the most relevant, accurate, real-world content to Sage for each cluster, in the right format, at the right depth.**

It does this through four sequential steps:

1. **Receive a content brief from Sage** — cluster's AGGIL segment, arc phase, existing content history, format preference, and any refinement feedback from previous rounds
2. **Determine the optimal content format** for this brief and arc phase (video, image, HTML snippet, long-form article, short-form post, data visualization)
3. **Fetch existing real-world content** in that format from a curated source list, matched to the cluster's interest tags, demographic profile, and geography — Atlas finds content, it does not generate or fabricate it
4. **Return a scored card batch to Sage** — or, if real-world data is genuinely thin, synthesize an inference and flag it explicitly as `synthesis_mode: true`

---

## LLM Configuration

```yaml
llm:
  provider: openai-compatible
  base_url: https://integrate.api.nvidia.com/v1   # NVIDIA NIM free tier
  model: moonshot/kimi-k2-5
  api_key: ${NVIDIA_NIM_API_KEY}
  temperature: 0.3                                  # Low — Atlas scores and fetches, doesn't create
  max_tokens: 256                                   # Per content card (hook + synthesis only)
  fallback_base_url: https://api.moonshot.ai/v1
  fallback_api_key: ${MOONSHOT_API_KEY}

scoring_llm:
  provider: groq
  model: meta-llama/Llama-3-8b-instruct
  temperature: 0.1                                  # Deterministic scoring
```

---

## Loading Order

When Atlas is dispatched for a cluster:

1. `SOUL.md` — Atlas's content quality principles
2. `cluster_content` Skill — Content retrieval, scoring, and format procedure
3. **Dynamic Context** — Received from Sage as a structured JSON brief
4. **Cluster Content History** — Cards shown in the past 72h (to avoid repetition)
5. **Cluster Poll Feedback** — Most recent poll results with member counts, percentages, and dates (RL parameter injection)
6. **Exclusion List** — Topics already in this cluster's Posts feed
7. **Active Cluster Tools** — Any Sage-proposed Atlas tools active for this cluster (loaded by `context/tool_loader.py`). These extend Atlas's fetch sources beyond the default source list for this specific cluster.

---

## Dynamic Context Schema

Atlas activates only when briefed by Sage. The brief is a structured JSON payload:

```json
{
  "cluster_id": "uuid",
  "brief_version": "1.1",
  "issued_by": "sage",
  "aggil_segment": {
    "age_range": [18, 24],
    "gender": "mixed",
    "geography": {
      "city": "Hyderabad",
      "area": "Gachibowli"
    },
    "interests": ["machine learning", "startup culture", "side projects"],
    "languages": ["English", "Telugu"]
  },
  "cluster_purpose": "Find co-founders for ML side projects in Hyderabad",
  "cluster_arc_phase": "B",
  "format_preference": "short_form_article",
  "existing_pulse_topics": ["GPT-4o multimodal updates", "Startup India program"],
  "existing_post_titles": [],
  "freshness_threshold_hours": 48,
  "content_count_requested": 10,
  "variant": "warm",
  "refinement_feedback": null,
  "poll_rl_context": {
    "last_poll_topic": "What kind of content do you want more of?",
    "results": [
      {"option": "Technical deep-dives", "votes": 14, "pct": 58, "date": "2026-03-20"},
      {"option": "Founder stories", "votes": 7, "pct": 29, "date": "2026-03-20"},
      {"option": "Local events", "votes": 3, "pct": 13, "date": "2026-03-20"}
    ]
  }
}
```

### poll_rl_context Usage

Atlas reads `poll_rl_context` and adjusts its search priorities and weighting accordingly before executing the fetch. This is contextual-level fine-tuning — poll data shifts Atlas's source priority and relevance scoring for this specific brief, without changing any model weights. The adjustment is logged in the card batch metadata so Sage can audit it.

### Variant Values

| Variant | Used When | Behavior |
|---------|-----------|----------|
| `cold` | Arc Phase A, new cluster | Conservative, widely accessible topics |
| `warm` | Arc Phase B/C | Builds on existing discussion themes, goes deeper |
| `depth` | Arc Phase D | Hard questions, research-grade content, provokes genuine reflection |
| `reengagement` | 72h silence | One high-precision item referencing past cluster activity |

---

## Content Format Detection

Before fetching, Atlas evaluates the brief and selects the optimal format. Format selection is driven by: arc phase, cluster interests, recent engagement patterns, and format_preference from Sage's brief (Sage's explicit preference overrides Atlas's determination).

| Arc Phase | Default Format Preference |
|-----------|--------------------------|
| A (Cold) | Short-form article, image-led post |
| B (Friction) | Short-form article, discussion thread reference |
| C (Cohesion) | Mixed: video + short-form, data snippet |
| D (Depth) | Long-form article, research paper reference, structured data |
| E (Self-sustaining) | Minimal — only on Sage's explicit request |

Format types Atlas can fetch and return:

| Format | What Atlas Returns |
|--------|--------------------|
| `short_form_article` | URL, headline, summary (≤150 words), source, published_at |
| `long_form_article` | URL, headline, key excerpt (≤300 words), source, published_at |
| `video` | URL (YouTube/Vimeo/X), title, channel, duration, transcript excerpt if available |
| `image` | URL, caption, source attribution |
| `data_html_snippet` | Structured data formatted as minimal HTML table/chart — sourced from real data, not generated |
| `discussion_thread` | Platform, thread URL, top 3 replies summarized |

---

## Content Quality Gates

Atlas does not generate content — it fetches from curated, credible sources matched to the cluster's interest tags, demographic profile, and geography. Content quality is enforced through three structural gates:

1. **Curated Source List** — Atlas only crawls from admin-managed, known-credible sources (see Crawl Sources below). Source authority is enforced by the list itself, not per-card verification.
2. **Freshness Filter** — Content older than `freshness_threshold_hours` is discarded during crawl, before scoring.
3. **Safety Classifier** — Every card passes a lightweight safety check (political polarization, explicit content, manufactured urgency) via Llama 3 8B before reaching Sage.

These three gates, combined with the ≥0.80/0.80 scoring threshold and Sage's 3-round editorial review, provide the quality floor without per-card verification overhead.

---

## Zero-Content Protocol (Synthesis Mode)

When Atlas exhausts its source list and finds zero items that clear the scoring threshold, it does not return an empty batch silently. Instead:

```
Step 1 — Synthesis
  Atlas synthesizes an inference based on what it knows about:
  - The cluster's AGGIL segment
  - The cluster_purpose
  - Adjacent real-world signals it did find (even if below threshold)
  
  The synthesis is Atlas's best inference about what is happening in
  this space — not fabricated facts, but reasoned interpretation of
  thin or absent data.

Step 2 — Flag
  The card is returned with:
    synthesis_mode: true
    synthesis_reason: "No external sources cleared threshold for [topic] in [date range]"
    source_name: "Atlas inference"
    source_url: null

Step 3 — Sage reviews
  Sage evaluates the synthesis for plausibility, accuracy, and appropriateness.
  Sage may:
    (a) Accept and post it transparently to the cluster (preferred)
    (b) Request a revised synthesis from Atlas
    (c) Discard it and handle the gap through member engagement instead

Step 4 — Transparent posting (if accepted)
  Sage posts the synthesis to the cluster with explicit framing:
  "We couldn't find much out there on this yet — here's what we're thinking
  based on what we do know. What's your read?"
  Sage then initiates a poll or open question to gather member signal.

Step 5 — RL injection
  Member responses to synthesis posts are tagged `synthesis_feedback: true`
  in the interaction log and injected into Atlas's next brief as a
  high-weight poll_rl_context entry.
```

---

## Sage ↔ Atlas Iterative Dialogue

The relationship between Sage and Atlas is not a single request-response. It is an iterative dialogue that continues until Sage is satisfied with the content batch.

```
Round 1: Sage issues initial brief → Atlas returns first card batch
Round 2: Sage reviews batch, may return to Atlas with:
  - "Go deeper on [topic X] — the cluster has been circling it for 2 weeks"
  - "Swap format from article to video for cards 3 and 4"
  - "The hook on card 2 is too generic — regenerate for this arc phase"
  - "Find an Indian source for card 1 — the US framing won't land here"
Atlas revises and returns updated batch.

Rounds continue until Sage accepts the batch or determines
that no further refinement will help (zero-content protocol triggers).

Maximum rounds: 3 per brief cycle. After round 3, Sage makes a final
editorial decision with whatever is available.
```

Refinement feedback from Sage is injected into Atlas's brief context for each subsequent round. This feedback history is also available at the next brief cycle as `refinement_history` — Atlas learns what this cluster's Sage has consistently asked for, and pre-adjusts before round 1.

---

## Output Schema — Content Card Batch

```json
{
  "cluster_id": "uuid",
  "generated_at": "ISO8601 timestamp",
  "variant": "warm",
  "brief_issued_by": "sage",
  "round": 1,
  "poll_rl_applied": true,
  "cards": [
    {
      "card_id": "uuid",
      "format": "short_form_article",
      "headline": "IIT Hyderabad students raise ₹2.5Cr seed for AI-driven logistics startup",
      "source_name": "Tech In Asia",
      "source_url": "https://...",
      "published_at": "ISO8601 timestamp",
      "relevance_score": 0.94,
      "demographic_confidence": 0.91,
      "conversation_hook": "If you were pitching to angel investors next month, what problem in your city would you actually solve?",
      "category": "startup",
      "tags": ["funding", "student founders", "AI", "Hyderabad"],
      "safe_for_arc": ["warm", "depth"],
      "synthesis_mode": false,
      "synthesis_reason": null
    }
  ]
}
```

### Scoring Thresholds

| Mode | Relevance | Demographic Confidence |
|------|-----------|----------------------|
| Standard | ≥ 0.80 | ≥ 0.80 |
| Synthesis | N/A | N/A — synthesis is flagged, Sage decides |

---

## Crawl Sources

Source selection is driven by the cluster's **interest tags, demographic profile, and geography** — not a static priority list. Atlas matches the cluster's AGGIL segment against the source registry to select the 3-5 most relevant sources per brief.

> [!CAUTION]
> **All external data retrieval MUST route through the Data Acquisition Layer** (see `architecture/system_implementation_prompt_part1.md` §2.5). Atlas NEVER makes direct HTTP requests or Puppeteer/Playwright calls to external content sources. All fetches go through authenticated API services or managed scraping proxies. This is an architectural constraint — direct crawling from server IPs will result in immediate bans.

**Sourcing approach: Structured API → Search API proxy → Managed scraping API fallback. NO direct Puppeteer/Playwright.**

| Source | Method | Best For |
|--------|--------|---------|
| Google News India (region-filtered) | RSS feed + SerpAPI fallback | Breaking news, local relevance |
| Reddit (subreddit-matched to interests) | Reddit API (100 req/min) | Discussion threads, opinions |
| YouTube (topic-matched, recent) | YouTube Data API v3 | Video format cards |
| ProductHunt | ProductHunt GraphQL API (450 req/day) | Tech, startup, product launches |
| YourStory.com | RSS feed | Indian startup ecosystem |
| The Ken | Managed scraping API (Firecrawl/BrightData — no public API) | Indian business depth |
| LinkedIn trending articles | Managed scraping API (Firecrawl/BrightData — no public API) | Professional/career interests |
| Hacker News | HN Algolia API (free, unlimited) | Dev, tech, startup |
| Specific interest blogs | RSS feed (admin-managed) | Interest-matched per cluster tags |

> [!NOTE]
> Twitter/X has been removed from the source list — the X API requires a paid tier that is not justified at Phase 1 scale. Re-evaluate when user volume warrants the cost.

---

## Guardrails

### Atlas must never:
- Return content shown to this cluster in the past 72 hours
- Return content below threshold without `synthesis_mode: true` flagging
- Fabricate a source URL — if synthesis mode, `source_url` is null, always
- Return content with political polarization potential
- Generate hooks that manufacture urgency or use sycophantic framing
- Return a card without a `conversation_hook`
- Communicate with users — all output goes to Sage
- Exceed its NIM quota reservation (30%) — overflow to Groq

### Atlas must always:
- Flag synthesis mode content explicitly and honestly
- Respect `freshness_threshold_hours`
- Apply `poll_rl_context` adjustments before round 1 of every brief (see Poll RL Mechanism below)
- Log `refinement_history` for the next brief cycle
- Return results within **30 seconds** of dispatch, or log timeout and return `[]`
- Check the shared crawl cache before initiating a new source crawl

---

## Queue Jobs

| Job | Trigger | Priority Lane | Issued By |
|-----|---------|--------------|-----------|
| `AtlasBriefFromSage` | Sage requests content for cluster | **medium** | Sage |
| `AtlasRefinementRound` | Sage returns feedback on batch | **medium** | Sage |
| `AtlasPulseRefresh` | Daily at 04:00 (cron) | **low** | Scheduler |
| `AtlasReengagementCheck` | Every 6h (cron) | **medium** | Scheduler |

---

## Atlas Budget Model

Atlas shares the NIM quota with Clio and Sage. To prevent Atlas from starving user-facing agents:

```yaml
atlas_budget:
  nim_reservation_pct: 30          # Atlas can use at most 30% of NIM quota
  clio_reservation_pct: 50         # Clio gets 50% reserved
  remaining_pct: 20                # Sage + Scout + Observer share the rest
  overflow_provider: groq_llama3   # When NIM quota exhausted, Atlas overflows to Groq
  max_batch_size: 5                # Cards per Atlas batch (default)
```

**Overflow behavior:** When Atlas's NIM reservation is exhausted for the current window, the next batch automatically routes hook generation and scoring to Groq/Llama 3. Each new batch starts with a fresh deduplication check against `existing_pulse_topics` to prevent repetition across quota boundaries.

**Groq is sufficient for Phase 1:** At ~50 active clusters with daily refresh, Atlas generates ~250-500 LLM calls/day. Groq's 100 RPM free tier handles this comfortably alongside Atlas scoring calls.

---

## Shared Crawl Cache

Multiple clusters with overlapping interests crawl the same sources. A shared Redis crawl cache eliminates redundant HTTP requests:

```
cache_key = hash(source_url + interest_tags + freshness_window)
TTL: 1 hour

Before crawling a source:
  If cache hit → use cached raw content → proceed to scoring
  If cache miss → crawl → cache result → proceed to scoring
```

Scoring is always per-cluster (demographic-specific). Only the raw crawl is shared.

---

## Poll RL Mechanism

When `poll_rl_context` is present in the brief, Atlas applies it mechanically:

1. **Topic signal:** Extract winning option's topic signal. Add to scoring prompt as bonus weight: `+0.10 relevance bonus for items related to {winning_option_topic}`
2. **Format signal:** If poll indicates format preference (e.g., "video" won), set `format_preference` in the brief to that format
3. **Validity:** Sage has already applied the validity gate (SPEC_ADDENDUM § Poll RL Dampening). Atlas applies the weight as received.

---

## Synthesis Mode Counter

When Atlas returns `synthesis_mode: true`, the cluster's `consecutive_synthesis_count` is incremented. When Atlas returns ≥1 real card, the counter resets to 0.

**At 3 consecutive synthesis cycles:** Atlas triggers an Observer finding:
```json
{
  "domain": "content_gaps",
  "severity": "medium",
  "title": "Cluster [X] has received 3 consecutive synthesis-only cycles",
  "suggested_action": "review_atlas_source_coverage",
  "action_requires_approval": true
}
```

This prevents silent content gaps from persisting indefinitely.

> [!NOTE]
> **Connection to tool proposal chain:** When Observer's Domain 6 or Domain 10 (Tool Analysis Triggers) picks up this finding, it may surface a trigger for Sage to run a tool analysis for Atlas. Sage — as Atlas's immediate superior — is the agent that proposes new data sources or fetch tools to extend Atlas's reach for this cluster. The proposal goes to `maintenance/[YYYY-MM]/` for admin review. See `maintenance/README.md` for the full flow.

---

## Database Fields Required

All previously specified fields remain. New fields:

| Table | Field | Type | Purpose |
|-------|-------|------|---------|
| `cluster_pulse_cards` | `synthesis_mode` | BOOLEAN | Whether this card is Atlas inference |
| `cluster_pulse_cards` | `synthesis_reason` | TEXT | Why synthesis was required |
| `cluster_pulse_cards` | `format` | VARCHAR(32) | Content format type |
| `cluster_pulse_cards` | `round` | TINYINT | Which Sage-Atlas round produced this card |
| `clusters` | `atlas_refinement_history` | JSONB | Last 3 rounds of Sage refinement feedback |
| `clusters` | `consecutive_synthesis_count` | INT DEFAULT 0 | Counter for consecutive synthesis-only cycles |
| `cluster_polls` | `synthesis_feedback` | BOOLEAN | Whether poll was triggered by synthesis post |

---

**Atlas AGENTS · v1.2 · Internal**
*v1.1: Sage established as Atlas's sole principal. Iterative dialogue, zero-content protocol, synthesis mode counter, poll RL, shared crawl cache added.*
*v1.2: Tool proposal chain formalised — Sage proposes cluster-specific Atlas tools (via `ClioToolAnalysisJob` triggered by Observer). Cluster tools added to loading order (step 7). Synthesis counter connected explicitly to tool proposal trigger chain.*
