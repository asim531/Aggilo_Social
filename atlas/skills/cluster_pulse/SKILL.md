# Atlas Skill — `cluster_pulse`

> **Cluster Content Retrieval + Scoring + Hook Generation**
> *Loaded on every Atlas dispatch. This skill defines the full procedure Atlas follows from receiving Sage's content brief to returning a ranked content card batch.*

---

## Skill Overview

| Property | Value |
|----------|-------|
| **Skill ID** | `cluster_pulse` |
| **Owner** | Atlas |
| **Triggered by** | Every Atlas dispatch (job: `AtlasBriefFromSage`, `AtlasRefinementRound`, `AtlasPulseRefresh`, `AtlasReengagementCheck`) |
| **Input** | Content brief JSON (from Sage) |
| **Output** | `cluster_content_card[]` batch (to Sage for editorial review) |
| **Max execution time** | 30 seconds |
| **LLM calls** | Scoring: Llama 3 8B (Groq). Hook generation: Groq/Llama 3 (primary), Kimi K2.5/NIM (fallback) |

---

## Step-by-Step Procedure

### Step 1 · Parse the Content Brief

Read and validate the incoming brief from Sage:

```
✓ cluster_id is valid and cluster exists
✓ aggil_segment has all required fields (age_range, gender, geography, interests, languages)
✓ variant is one of: cold | warm | depth | reengagement | synthesis_request
✓ freshness_threshold_hours is set (default: 48)
✓ content_count_requested is set (default: 5, max: 10)
✓ poll_rl_context is read and applied to source priority weighting (if present)
✓ refinement_feedback is parsed for round 2+ adjustments (if present)
✓ format_preference is read for content format selection (if present)
```

If validation fails, log error + return empty batch. Do not throw exception.

### Step 2 · Build the Source Queue

Based on the `aggil_segment.interests` array, demographic profile, and geography, select the 3-5 most relevant sources from the source registry (see AGENTS.md § Crawl Sources).

**Sourcing priority: API/RSS-first, headless Chrome as fallback only.**

| Interest Detected | Sources Selected | Method |
|-------------------|-----------------|--------|
| `startup culture` | YourStory (RSS), ProductHunt (API), The Ken (Chrome) | Mixed |
| `machine learning` | HackerNews (API), Reddit r/MachineLearning (API), Google News (RSS) | API-first |
| `fitness` | Reddit r/india (API), Google News (RSS) | API-first |
| `music` | Reddit r/IndianMusic (API), YouTube (API) | API-first |
| `career` | LinkedIn trending (Chrome), The Ken (Chrome), Reddit r/CSCareerQuestions (API) | Mixed |

Always include **Google News India** (city-level filtered via RSS) as a baseline source.

### Step 2b · Check Shared Crawl Cache

Before crawling any source, check the shared Redis crawl cache:
```
cache_key = hash(source_url + interest_tags + freshness_window)
TTL: 1 hour

If cache hit → use cached raw content → skip to Step 3 scoring
If cache miss → proceed to Step 3 crawl → cache result after crawl
```

This eliminates redundant crawls for clusters with overlapping interests.

### Step 3 · Crawl Sources

For each selected source (cache miss only):
1. Loads the source via API/RSS (preferred) or headless Chrome (fallback)
2. Extracts up to 10 raw content items (headline, URL, publication date, summary snippet)
3. Applies the `freshness_threshold_hours` filter — discards anything older than the threshold
4. Deduplicates against `existing_pulse_topics` from the brief
5. Caches result in shared crawl cache
6. Returns raw content list to Step 4

**Timeout per source:** 8 seconds. If a source times out, skip silently.

### Step 4 · Score for Relevance (Llama 3 8B)

For each raw content item, send a single scoring call to Llama 3 8B (Groq):

```
SYSTEM: You are a content relevance scorer. You receive a piece of content and a 
demographic profile. You output a JSON object with two scores:
- relevance_score (0.0–1.0): How relevant is this content to the stated interests?
- demographic_confidence (0.0–1.0): How likely is this content to resonate with 
  the stated demographic (age, gender, geography, language)?
Output JSON only. No explanation.

DEMOGRAPHIC PROFILE:
Age: {age_range[0]}–{age_range[1]}
Gender: {gender}
Geography: {city}, {area}
Interests: {interests joined with ", "}
Languages: {languages joined with ", "}
Cluster purpose: {cluster_purpose}

CONTENT ITEM:
Headline: {headline}
Summary: {summary_snippet}
Source: {source_name}
Published: {published_at}

OUTPUT FORMAT:
{"relevance_score": 0.00, "demographic_confidence": 0.00}
```

**Batch scoring:** Up to 15 items scored in parallel (Groq handles concurrency).

**Threshold filter:** Discard any item where `relevance_score < 0.80` OR `demographic_confidence < 0.80`.

### Step 5 · Safety Check

For each item passing Step 4, apply a lightweight safety check:

Items are **discarded** if they contain:
- Political polarization (scoring threshold: Llama 3 8B, single call, `safe_content: bool`)
- Religious controversy
- Individual user private information
- Explicit content
- Manufactured urgency language (\"only X left\", \"breaking: must act now\")

This check runs as a second Llama 3 8B call, batched:

```
SYSTEM: You are a content safety gate for a social app used by 13–50 year olds.
Output JSON: {"safe": true/false, "reason": "string or null"}
Flag content as unsafe if it contains: political polarization designed to inflame, 
religious controversy, privacy-violating personal information, explicit content, 
or manufactured urgency/scarcity language.
Flag as safe if it's general news, cultural events, career/learning topics, 
technology developments, or community discussions.
```

### Step 6 · Generate Conversation Hook (Groq / Llama 3)

For each item passing Step 4 + 5, generate a conversation hook.

**Primary model: Groq/Llama 3** (frees NIM quota for Clio). **Fallback: NIM/Kimi K2.5.**

```
SYSTEM: You write precise, judgment-free discussion prompts for social clusters.
Your output is one sentence — a question or observation that invites real discussion.

Rules:
- Never start with "What do you think?" (too generic)
- Never manufacture urgency
- Never use sycophantic framing
- The question must be specific to the content item and the cluster's demographic
- It should feel like something a thoughtful community member would post, not a bot
- Target demographic: {age_range} {gender} in {city}
- Cluster purpose: {cluster_purpose}
- Variant: {variant}

Content item:
Headline: {headline}
Summary: {summary_snippet}

Output: A single sentence (30–80 words). No prefix. Just the hook.
```

**Variant-specific guidance (injected into prompt):**
- `cold`: Frame the hook as an invitation to the first post — low stakes, easy to respond to
- `warm`: Build on the cluster's existing discussion — reference a theme from `existing_post_titles` if available
- `depth`: Provoke genuine reflection — harder questions, more specific to the cluster's arc phase D maturity
- `reengagement`: Reference a topic the cluster has discussed before but re-anchor to new development

### Step 7 · Rank and Select

Rank all passing cards by `relevance_score × demographic_confidence` (combined score). Truncate to `content_count_requested` (default: 5).

### Step 8 · Return to Sage

Package cards into the output schema (see [AGENTS.md](file:///d:/Aggilo_Social/atlas/AGENTS.md) § Output Schema) and write to Supabase (`cluster_pulse_cards` table, status: `pending`).

Trigger `AtlasCardBatch.Ready` event → Sage's editorial review picks up new cards.

Update `clusters.atlas_last_briefed_at` to current timestamp.

### Step 9 · Handle Synthesis Mode (Zero-Content)

If 0 cards pass all steps after all sources are exhausted:
1. Atlas synthesises an inference from the cluster's AGGIL segment, purpose, and adjacent signals found
2. Returns a single card with `synthesis_mode: true`, `synthesis_reason` explaining the gap, and `source_url: null`
3. Increments `clusters.consecutive_synthesis_count`. If count reaches 3, triggers Observer finding (domain: content_gaps, severity: medium)
4. Sage decides whether to post it with transparent framing or discard

See [AGENTS.md](file:///d:/Aggilo_Social/atlas/AGENTS.md) § Zero-Content Protocol for full spec.

---

## Hook Quality Examples

### Cold Variant (Arc A — first member joins)

| Cluster | Headline | ✅ Good Hook | ❌ Bad Hook |
|---------|----------|-------------|------------|
| ML students, Hyderabad | IIT Hyderabad students raise ₹2.5Cr seed | "If you were pitching to angels next month, what problem in your city would you actually solve?" | "What do you think about this funding?" |
| Startup founders, Mumbai | India's VC slowdown — Q1 2026 data | "Is the funding winter actually stopping you, or is it creating better pressure to be default-alive?" | "Interesting article! Share your thoughts." |

### Warm Variant (Arc B/C — cluster has some posts)

Uses `existing_post_titles` from the brief to create a thread-connected hook.

> If a cluster has discussed "finding the right co-founder", and Atlas surfaces a piece about equity split best practices, the hook might be: *"Everyone debates the right idea — this suggests the split conversation matters just as much. Curious where your cluster lands on this."*

### Reengagement Variant (72h silence)

Precisely references a specific topic the cluster engaged with before:

> *"You were all discussing [specific_recent_topic]. This piece is the next chapter of that conversation — seems worth picking up."*

---

## Error Handling

| Failure | Behavior |
|---------|----------|
| Brief validation fails | Log error, return `[]`, update `atlas_last_briefed_at` |
| All sources time out | Return `[]`, schedule retry in 30 minutes |
| 0 cards pass threshold | Trigger synthesis mode (Step 9) — not an empty return |
| Safety check flags all cards | Return `[]` with log. Not a synthesis trigger. |
| LLM scoring timeout | Skip scoring turn, return partial batch with available cards |
| Hook generation fails for a card | Include card without `conversation_hook` (field null) |
| Supabase write fails | Retry 3×, then log + alert admin |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| End-to-end execution time | ≤ 30 seconds |
| Cards returned per dispatch | 0–5 (median: ~3) |
| Scoring calls (Llama 3 8B) | ≤ 15 per dispatch |
| Hook generation calls (Groq/Llama 3) | ≤ 5 per dispatch |
| Source crawl timeout per source | 8 seconds |

---

*← [Atlas AGENTS](file:///d:/Aggilo_Social/atlas/AGENTS.md) · [Sage AGENTS →](file:///d:/Aggilo_Social/sage/AGENTS.md) · [Clio's Sage Coordination Skill →](file:///d:/Aggilo_Social/clio/skills/sage_coordination/SKILL.md)*
