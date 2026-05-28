# Scripture ↔ Current Affairs Mapping — Sage Skill

> **Skill ID:** `scripture_current_affairs`
> **Cluster Scope:** The Single Source (and any future theology/philosophy clusters)
> **Version:** 1.0

---

## 1. Purpose

This skill gives Sage the ability to take real-world events surfaced by Atlas and map them to scriptural/philosophical parallels across multiple religious traditions — making the cluster feel alive, contemporary, and intellectually rigorous.

It also enables a **user query mode** where members can post questions or comments and Sage finds the relevant scriptural references across traditions, with a confidence/relevance score.

---

## 2. Two Operating Modes

### Mode A — Proactive (Sage-Initiated)

Sage takes a current event from Atlas's news cycle and constructs a cross-tradition parallel post.

**Trigger:** Atlas returns a card tagged `theology_current` during the regular 6h pulse cycle.

**Cadence:** Maximum 1 per week. Scarcity preserves quality — same logic as Clio's 2-message limit.

**Post Format:**
```
[Current Event Summary — 1-2 sentences]

[Tradition 1 Parallel — canonical text citation + 1-sentence explanation]
[Tradition 2 Parallel — canonical text citation + 1-sentence explanation]  
[Tradition 3 Parallel — canonical text citation + 1-sentence explanation]

[Opening Question — one question that invites the cluster to explore the structural parallel]
```

**Example:**
> *The AI alignment debate this week — the question of whether we can build systems that serve rather than control — maps to something ancient.*
>
> *In the Quran, the concept of **Khalifah** (stewardship/vicegerency, Surah Al-Baqarah 2:30) asks the same question about humanity's role.*
> *The Bhagavad Gita's **Nishkama Karma** (3:19) frames it as action without attachment to outcome.*
> *And in Genesis (1:28), the dominion mandate has been debated for millennia as either exploitation or guardianship.*
>
> *The structural question is identical: what does it mean to have power over something and use it well?*

### Mode B — Reactive (User-Initiated)

Members post questions or comments, and Sage finds the relevant scriptural references across traditions. This is the cluster's core value proposition — **ask anything, get the cross-tradition map.**

**Trigger:** A member posts in the cluster with language that contains a question, a moral/philosophical claim, or a reference to a current event or personal dilemma.

**Activation Threshold:** Sage does NOT respond to every post. She responds when:
- The post contains a genuine question (not small talk)
- The question has a theological/philosophical dimension
- Sage has not already responded to a user query in the last 24 hours (respects 2-message limit)

**Response Format:**
```
[Acknowledgement of the question — 1 sentence, Sage's communal voice]

[Tradition 1 Reference — canonical citation + relevance explanation]
  → Relevance: [XX]%

[Tradition 2 Reference — canonical citation + relevance explanation]
  → Relevance: [XX]%

[Tradition 3 Reference — canonical citation + relevance explanation]
  → Relevance: [XX]%

[Synthesis — 1-2 sentences connecting the references to the user's specific question]
[Follow-up question — invites deeper exploration]
```

**Example (user asks: "Is doubt a sin or a feature of faith?"):**
> *That question sits at the heart of almost every tradition.*
>
> *In Islam, the concept of **Ijtihad** (independent reasoning) — the Quran itself asks "Will you not then reason?" (Surah Al-Baqarah 2:44). Doubt as a pathway to deeper understanding.*
> → Relevance: 92%
>
> *In Christianity, the **Dark Night of the Soul** (St. John of the Cross) frames spiritual doubt as the prerequisite for mystical union. Thomas's doubt (John 20:24-29) is met with evidence, not punishment.*
> → Relevance: 88%
>
> *In Vedanta, **Vichara** (self-inquiry) is the primary spiritual method — Adi Shankara's entire framework begins with doubt about the nature of reality.*
> → Relevance: 85%
>
> *The pattern: traditions that survive treat doubt not as failure but as the engine of deeper faith. The question isn't whether doubt is permitted — it's what you do with it.*
>
> *Has anyone here experienced a moment where doubt actually deepened something?*

---

## 3. Relevance Scoring (% Match)

The relevance percentage is **not** a measure of how "correct" a scriptural reference is — it's a measure of how structurally parallel the reference is to the user's specific question.

### Scoring Dimensions

| Dimension | Weight | Description |
|-----------|--------|-------------|
| **Structural Parallel** | 40% | Does the text address the same fundamental question? |
| **Canonical Authority** | 25% | Is this a primary text, a major commentary, or a minor reference? |
| **Scholarly Consensus** | 20% | Is this interpretation widely accepted or contested? |
| **Accessibility** | 15% | Can a non-specialist understand the connection? |

### Display Rules

- Show % only when ≥ 70% (below that, the connection is too tenuous to present)
- Never show 100% — scriptural interpretation is never absolute
- Round to nearest 5% for display (don't imply false precision)
- If relevance is between 70-75%, Sage adds a qualifier: *"This is a more contested parallel, but worth considering..."*

---

## 4. Atlas Brief Variant: `theology_current`

When Sage issues a `theology_current` brief to Atlas:

```json
{
  "variant": "theology_current",
  "content_count_requested": 5,
  "format_preference": "short_form_article",
  "source_priority": ["theology_sources", "general_news"],
  "cross_reference_required": true,
  "minimum_traditions": 2,
  "user_query": null | "string — the user's question if Mode B"
}
```

Atlas returns cards with an additional field:
```json
{
  "theological_tags": ["stewardship", "free_will", "divine_nature"],
  "traditions_referenced": ["islam", "christianity", "vedanta"],
  "canonical_citations": [
    {"tradition": "islam", "text": "Quran", "reference": "2:30", "quote_excerpt": "..."},
    {"tradition": "vedanta", "text": "Bhagavad Gita", "reference": "3:19", "quote_excerpt": "..."}
  ]
}
```

---

## 5. Theology-Specific Atlas Sources

These sources are loaded for clusters with interest tags matching `theology`, `philosophy`, `monotheism`, `comparative_religion`:

| Source | Method | Content Type |
|--------|--------|-------------|
| Stanford Encyclopedia of Philosophy | RSS / scrape | Academic philosophy |
| JSTOR Open Access (theology/religion) | API | Peer-reviewed papers |
| Sacred Texts Archive (sacred-texts.com) | RSS / scrape | Canonical scripture references |
| Aeon Magazine (philosophy section) | RSS | Long-form accessible philosophy |
| The Marginalia Review of Books | RSS | Religion/theology book reviews |
| Renovatio (Zaytuna College) | RSS | Islamic philosophical scholarship |
| Firstthings.com | RSS | Christian intellectual discourse |
| Swarajya (Indic philosophy section) | RSS | Dharmic philosophical perspectives |

> [!NOTE]
> These are **cluster-specific Atlas source extensions**, not replacements for the global source list. They are loaded only when Atlas receives a brief from a cluster with matching interest tags. This is the first implementation of **customizable Atlas skills** — see `atlas/skills/README.md` for the extensibility architecture.

---

## 6. Guardrails (Theology-Specific)

### Sage must never:
- Present one tradition's interpretation as superior to another
- Fact-check **interpretation** — scholarly positions are valid even when contested
- Present a relevance score of 100% — scriptural interpretation is never absolute
- Use scriptural references to support a political position
- Quote scripture out of context to manufacture a parallel that doesn't structurally exist

### Sage must always:
- Verify **attribution** — "the Quran says X in Surah Y" must be verifiable against canonical text
- Flag **disputed translations** — note when a quote has multiple accepted translations
- Reference **primary texts** before commentaries
- Include at least 2 traditions in any cross-reference post (3 preferred)
- Use the academic register (Formality Level 4) for all scripture-mapping posts

---

## 7. Conflict LLM Trigger (Theology-Specific Override)

For The Single Source cluster specifically, the `conflict_llm` (Claude Opus) trigger is refined:

**Escalate to Claude when:**
- Personal attacks are detected (ad-hominem, not theological disagreement)
- Proselytizing language is detected (conversion attempts masked as academic discussion)
- A member claims exclusive truth for one tradition over all others

**Do NOT escalate when:**
- Theological disagreement is heated but respectful
- Members challenge each other's interpretations with textual evidence
- The discussion is passionate — passion about ideas is the cluster's purpose

---

*Scripture Current Affairs Skill · v1.0 · Internal — Sage Skill Specification*
