# Cluster Tools — Research Circle MJ

> **Active and proposed tools for this cluster's agents.**
> *Maintained by admin. Updated whenever a tool is activated or retired.*
> *Tool proposals live in `maintenance/[YYYY-MM]/[cluster_id]_[tool_name].md`*

---

## Cluster Identity

| Field | Value |
|---|---|
| **Cluster Name** | Research Circle MJ |
| **Cluster ID** | `research_circle_mj` |
| **Tier** | Generic |
| **AGGIL Summary** | Age: 30–50 · Gender: Everyone · Geo: MJ College, Hyderabad · Interests: Academic Writing / Research / Education / Books · Language: English |
| **Arc Phase** | A (Seeding — Clio is primary presence until 3+ Connections have posted) |
| **Last Tool Review** | 2026-05-31 (initial setup) |

---

## Active Tools

### Atlas Tools
*Proposed by Sage. Tools that extend Atlas's content sources for this cluster.*

| Tool Name | Function | Activated | Proposal Ref |
|---|---|---|---|
| `academic_research_india` | Pulls from sources relevant to Indian STEM academia: current research trends, funding announcements, methodological guides, cross-disciplinary synthesis. Sources: ArXiv India, ResearchGate, university press releases, curated academic blogs. Replaces Atlas's general news crawl for this cluster. | 2026-05-31 (initial config) | See `atlas/skills/README.md` |

### Sage Tools
*Proposed by Clio. Tools that extend Sage's cluster management capabilities.*

| Tool Name | Function | Activated | Proposal Ref |
|---|---|---|---|
| `topic_document_linking` | **Platform Capability — pre-activated via PSIM.** Infers topics from post content using local LLM classifier. Tags documents, images, videos, and links to topics. Surfaces recurring themes as persistent topic filters. Auto-applies at confidence ≥ 0.85; member override always available. See `CLUSTER_DESCRIPTION.md` §4.1. | 2026-05-31 (pre-activated at creation) | `psim_finding_001` |
| `thread_topic_evolution` | Monitors thread replies for topic drift. If ≥3 replies share a keyword/concept not in the opening post's topics, proposes a new topic link. Detects thread convergence and proposes topic merges. Reactive only — never forces. | 2026-05-31 (initial config) | See `SAGE_PERSONA.md` §3 |
| `media_indexing` | Ensures all uploaded documents, images, videos, and shared links are indexed as first-class objects with titles, types, and topic links. Extracts URL titles for link previews. Generates thumbnails for images and videos. | 2026-05-31 (initial config) | See cluster schema spec |

### Scout Tools
*Proposed by Clio. Tools that extend Scout's signal-finding for clusters Clio is trying to fill.*

| Tool Name | Function | Activated | Proposal Ref |
|---|---|---|---|
| `academic_mj_discovery` | Directs Scout to identify members at or near MJ College (named location match or self-declared affiliation) matching the cluster's AGGIL profile (age 30–50, English-primary, academic/research/writing interest signals). Calibrated to surface faculty and researchers across all departments. | 2026-05-31 (initial config) | See `scout/AGENTS.md` |

### Clio Tools
*Proposed by Observer (governed by Platform Rules). Tools that extend Clio's capabilities for this cluster's user onboarding or engagement.*

| Tool Name | Function | Activated | Proposal Ref |
|---|---|---|---|
| `topic_orient_mechanic` | Clio orients new members to the Topics tab, demonstrates document upload with topic linking, and routes "where is X?" questions to topic chips. Never answers from memory. Max 1 orientation nudge per member per session. Full spec in `CLIO_ONBOARDING.md`. | 2026-05-31 (initial config) | See `CLIO_ONBOARDING.md` |

---

## Pending Proposals

| Tool Name | Target Agent | Proposed By | Date | Status |
|---|---|---|---|---|
| *(none)* | | | | |

---

## Retired Tools

| Tool Name | Target Agent | Reason Retired | Date |
|---|---|---|---|
| *(none)* | | | |

---

## Tool Review Notes

### 2026-05-31 — Initial Setup Review

- `topic_document_linking` was pre-activated at cluster creation via Pre-Spawn Inference Module. This is the first cluster to ship with a PSIM-derived Platform Capability skill. It must be monitored more closely than post-discovered skills.
- `thread_topic_evolution` is novel. It assumes threads deepen over time rather than branch randomly. If MJ College researchers post short, disconnected replies, this tool may over-propose topic links. Monitor override rates.
- `media_indexing` treats all upload types (document, image, video, link) as first-class indexed objects. This is a schema-level commitment. If storage costs become prohibitive, video indexing may need to be retired.

**Next review triggers:**

1. **At 5 active members** — assess whether `topic_document_linking` auto-tags are accurate. Are members overriding Sage's suggestions? Target override rate: <30%. If higher, re-tune classifier.

2. **At 10 active members** — assess whether Topics tab is being used. Target: ≥20% of feed views use topic filters. If lower, the UX is invisible — consider Clio nudge frequency increase.

3. **`thread_topic_evolution` first review (30 days post-launch)** — key questions:
   - Are threads actually deepening, or are replies shallow?
   - Is Sage proposing topic merges that members agree with?
   - Are topic tags on threads stable, or do they shift too often?
   - If any member finds thread topic evolution confusing, the tool should be disabled for that thread type.

4. **Document re-engagement check (60 days)** — are old documents being clicked via topic filters? This measures whether the core anti-WhatsApp promise is being delivered.

5. **Media upload mix (30 days)** — what proportion of uploads are documents vs. images vs. videos vs. links? If videos dominate, storage and playback costs need review. If links dominate, URL title extraction accuracy needs review.

**Welfare sensitivity note:** Research clusters have lower emotional disclosure than intimacy cohorts, but academic pressure and impostor syndrome are real. Observer Domain 3 (welfare) should be calibrated to recognise distress signals in scholarly language ("I can't finish this", "nothing I write is good enough", "everyone else is publishing").

**Language monitoring:** Observer monitors language patterns per platform rules. If ≥8 members share a non-English language AND ≥3 have posted in it, Observer surfaces a finding recommending a language-parallel instance. Expected languages to watch: Hindi, Telugu, Urdu.

---

*Cluster Tools · Research Circle MJ · v1.0 · Internal · 2026-05-31*
