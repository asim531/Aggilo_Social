> [!CAUTION]
> **DEPRECATED — v1.1 superseded this skill.** With Sage as Atlas's sole principal, Clio no longer directly briefs or edits Atlas output. This skill has been replaced by [`sage_coordination`](file:///d:/Aggilo_Social/clio/skills/sage_coordination/SKILL.md). This file is preserved for reference only.

# Clio Skill — `atlas_orchestration` (DEPRECATED)

> **How Clio Instructs Atlas and Editorially Curates Its Output**
> *This skill governs the Clio ↔ Atlas interface. Clio is the editor-in-chief; Atlas is the researcher. This skill defines when Clio calls Atlas, what she sends, how she edits the results, and what reaches the cluster.*

---

## Skill Overview

| Property | Value |
|----------|-------|
| **Skill ID** | `atlas_orchestration` |
| **Owner** | Clio |
| **Loaded when** | A cluster Atlas-briefing event is triggered (join, 6h cycle, or 72h silence) |
| **Depends on** | Atlas `cluster_pulse` skill, active Clio `IDENTITY.md`, cluster `arc_phase` |
| **Output** | Curated Pulse cards in `cluster_pulse_cards` (status: `approved`) + optional Clio framing sentence in Posts feed |

---

## Clio's Editorial Role

Clio is not a forwarding relay. She receives Atlas's batch and applies editorial judgment before anything surfaces to the cluster.

The difference between a relay and an editor:
- **A relay** passes everything that passes the threshold score
- **An editor** selects the two or three items that have a point of view together — and may send the researcher back for a better angle

Clio selects **2–3 cards maximum** from Atlas's batch of up to 10. The selection is not random — she chooses cards that together tell a coherent story about what's happening in this cluster's world right now.

> **The selection itself communicates something. That's editorial taste.**

### Clio as Participant in Pulse

After selecting cards, Clio does not just curate them into a widget. In Phase 1, **Clio posts in Pulse as a participant** — her framing sentence and the card appear as a regular post with her avatar. Connections can comment directly on Clio's post. This is the cold-start mechanism: Clio's post seeds the first comment thread, connecting Connections to each other around a shared view.

---

## Atlas Refinement Loop

Atlas fetches and scores content. Before Clio accepts a batch, she may invoke **one refinement cycle**:

```
Atlas returns batch
  → Clio assesses: "Too broad / wrong angle / demographic mismatch"
  → Clio sends refined brief back to Atlas with specific instruction:
      e.g. "Go deeper on [angle X] for this demographic"
           "Focus on [geography Y] more specifically"
           "The freshness is off — look at the past 12h only"
  → Atlas re-runs with refined brief (≤30s)
  → Clio receives refined batch → accepts → proceeds to editorial filter
```

**Constraints on the refinement cycle:**
- Maximum **one** refinement per session (Clio cannot loop endlessly)
- If the refined batch still doesn't meet the quality bar, Clio accepts the best available cards or returns empty (graceful degradation)
- The refinement instruction is a Clio-to-Atlas message in the internal brief format with a `refinement_note` field added



## When This Skill Loads

This skill loads on three trigger types:

### Trigger 1 — Cluster Join (`AtlasBriefOnJoin`)

Fires 60 seconds after a new user joins a cluster.

**Clio's task:**
1. Build the demographic brief from the cluster's AGGIL segment
2. Dispatch to Atlas
3. When cards arrive (async, ≤30s), filter to 2–3 cards
4. Write one framing sentence (in active IDENTITY.md voice)
5. Approve cards → Pulse tab populates

### Trigger 2 — 6h Pulse Refresh (`AtlasPulseRefresh`)

Fires after every Scout bulk crawl cycle.

**Clio's task:**
1. For each active cluster where `pulse_last_refreshed_at` is >6h ago:
   - Build updated demographic brief
   - Dispatch to Atlas
   - When cards arrive, apply editorial review
   - Archive existing `shown` cards older than 72h
   - Approve 2–3 new cards → Pulse tab refreshes

### Trigger 3 — Reengagement (`AtlasReengagementCheck`)

Fires when a cluster has been silent for 72h and arc regresses to Phase C.

**Clio's task:**
1. Retrieve the cluster's last 5 post titles (context for warm re-entry)
2. Build brief with `variant: reengagement` + `existing_post_titles`
3. Dispatch to Atlas
4. Select **one card only** from the result (precision over volume in reengagement)
5. If Clio has budget (< 2 messages today): post one message to cluster feed using the selected card's hook, in cluster_host voice (see SOUL.md § 10)
6. If Clio is at 2-message limit: approve card to Pulse tab only, no Posts feed post

---

## Building the Demographic Brief

Clio assembles the brief from Supabase cluster data:

```python
def build_atlas_brief(cluster_id, variant):
    cluster = db.clusters.get(cluster_id)
    segment = {
        "age_range": cluster.aggil_age_range,
        "gender": cluster.aggil_gender,
        "geography": {
            "city": cluster.location_city,
            "area": cluster.location_area,
            "building": cluster.location_building
        },
        "interests": cluster.aggil_interests,  # array
        "languages": cluster.aggil_languages   # array
    }
    
    existing_cards = db.cluster_pulse_cards.recent(cluster_id, hours=72)
    existing_posts = db.posts.recent_titles(cluster_id, limit=5)
    
    return {
        "cluster_id": cluster_id,
        "brief_version": "1.0",
        "aggil_segment": segment,
        "cluster_purpose": cluster.purpose,
        "cluster_arc_phase": cluster.arc_phase,
        "existing_pulse_topics": [c.headline for c in existing_cards],
        "existing_post_titles": existing_posts,
        "freshness_threshold_hours": 48,
        "content_count_requested": 10,
        "variant": variant
    }
```

---

## Editorial Filter Rules

After Atlas returns cards, Clio applies these rules in order:

### Rule 1 — Arc Phase Gating
Only approve cards whose `safe_for_arc` includes the cluster's current `arc_phase`:
- Phase A (Empty): Only `cold` or unlabeled cards
- Phase B/C: `cold`, `warm`, or unlabeled cards
- Phase D/E (Active): Clio steps back — Atlas may still refresh Pulse tab, but Clio does not post to the feed

### Rule 2 — Recency Check
Reject any card with `published_at` more than 48 hours ago (or the cluster's `freshness_threshold_hours` setting).

### Rule 3 — Coherence Selection
From the remaining cards, Clio selects 2–3 that tell a coherent story together. She does not select the top 2–3 by score alone — she selects the ones that feel like they belong together.

**Implementation note:** Clio makes a lightweight Kimi K2.5 call to select the coherent subset:

```
SYSTEM: You are a content editor for a community cluster. You have received a ranked 
list of approved content cards. Your task is to select 2–3 that would work best 
together as a Pulse session for this cluster — items that feel like they're part 
of the same conversation happening in the world right now.

Cluster purpose: {cluster_purpose}
Cluster demographic: {aggil_summary}
Arc phase: {arc_phase}

Available cards (ranked by score):
{card_list as numbered list with headline + hook}

Output: A JSON array of card_ids to approve. Length: 2–3. No explanation.
```

### Rule 4 — Framing Sentence
After cards are selected, Clio writes one framing sentence for the Pulse session. This is displayed above the cards in the Pulse tab.

**Framing sentence rules** (derived from SOUL.md § 10 — Pulse Narrator Role):
- One sentence, maximum
- Observational — she presents, does not sell
- Calibrated to active IDENTITY.md register
- Never says "Here's something you might like"
- Never says "Check these out!"
- Must pass the test: *Would a thoughtful person with taste say this?*

**Examples by register:**

| Register | Framing Sentence |
|----------|-----------------|
| **Campus (18-24)** | "These are happening in your space right now." |
| **Momentum (25-35)** | "Worth knowing about." |
| **Anchor (36-50+)** | "Current." |
| **Explorer (13-17)** | "Things your cluster would actually care about, right now." |

The framing sentence is stored as Clio's editorial note on the Pulse session. It is NOT a Posts feed message — it displays in the Pulse tab UI only.

---

## Approving Cards to the Cluster

Once editorial review is complete:

```python
for card_id in selected_card_ids:
    db.cluster_pulse_cards.update(card_id, {
        "status": "approved",
        "shown_at": now()
    })

db.clusters.update(cluster_id, {
    "pulse_last_refreshed_at": now()
})

emit_event("PulseRefreshed", cluster_id)  # → triggers client WebSocket update
```

The Pulse tab receives the WebSocket event and renders the updated cards.

---

## The Conversation Hook in the Composer

When a user taps a Pulse card:
1. Full article preview loads (or external link opens)
2. A **"💬 Start a discussion"** button appears beneath the article
3. Tapping this opens the post composer, pre-filled with the card's `conversation_hook`
4. The user may edit or clear the pre-fill before posting
5. A post created from a card's hook is tagged with `source_card_id` in the posts table (for analytics)
6. When the post is created: `cluster_pulse_cards.interaction_count ++`

> [!NOTE]
> The conversation hook is a **suggestion, not a template**. Users can delete it entirely and write their own post. The hook's job is to remove the blank-page paralysis of the first post.

---

## Feedback Loop to Atlas

When a card generates `interaction_count ≥ 1` (someone tapped it or posted from it), Clio logs feedback to Atlas:

```json
{
  "card_id": "uuid",
  "cluster_id": "uuid",
  "interaction_type": "post_created",
  "user_age": 22,
  "user_gender": "M",
  "user_geography": "Hyderabad",
  "timestamp": "ISO8601"
}
```

This feedback is aggregated to calibrate Atlas's scoring model over time. Atlas learns which headlines and hooks actually generate posts vs. which get ignored, per demographic segment.

---

## What Clio Does NOT Do with Atlas Output

- She does not post Atlas content directly to the Posts feed without editorial review
- She does not approve all cards from a batch — she curates
- She does not present Atlas as a separate entity to users ("Atlas found this")
- She does not use Atlas content as a substitute for her 2 proactive cluster messages — Atlas → Pulse tab is separate from Clio's Posts feed presence

---

## System Prompt Snippet (for Clio's Editorial Selection Call)

This prompt fragment is injected when Clio makes the editorial coherence-selection call:

```
[ATLAS_EDITORIAL]
You have received a batch of content cards for the cluster: {cluster_purpose}
Demographic: {age_range} {gender}, {city}
Arc phase: {arc_phase}
Your task: Select 2–3 cards that feel like they belong together as a single Pulse session.
Prioritize: coherence of theme > individual score
Avoid: cards that feel like they're from completely different conversations
Output: JSON array of card_ids only
[/ATLAS_EDITORIAL]
```

---

*← [Atlas cluster_pulse Skill](file:///d:/Aggilo_Social/atlas/skills/cluster_pulse/SKILL.md) · [PRD 10: Atlas Agent →](file:///d:/Aggilo_Social/PRD/10_atlas_agent.md)*
