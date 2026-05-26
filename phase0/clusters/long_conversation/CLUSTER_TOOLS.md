# Cluster Tools — Long Conversation

> **Active and proposed tools for this cluster's agents.**
> *Maintained by admin. Updated whenever a tool is activated or retired.*
> *Tool proposals live in `maintenance/[YYYY-MM]/[cluster_id]_[tool_name].md`*

---

## Cluster Identity

| Field | Value |
|---|---|
| **Cluster Name** | Long Conversation |
| **Cluster ID** | *(assign UUID on creation)* |
| **Tier** | Standard |
| **AGGIL Summary** | Age: Born 1993–2003 · Gender: All · Geo: India-wide · Interests: Intimate Connection / Intellectual Depth / Beyond Apps · Language: English (primary) |
| **Arc Phase** | A (Seeding — Clio is primary presence until 3+ Connections have posted) |
| **Last Tool Review** | 2026-05-25 (initial setup) |

---

## Active Tools

### Atlas Tools
*Proposed by Sage. Tools that extend Atlas's content sources for this cluster.*

| Tool Name | Function | Activated | Proposal Ref |
|---|---|---|---|
| `intimacy_intellectual_india` | Pulls from sources at the intersection of intellectual life, emotional depth, and the experience of seeking genuine connection: long-form essays on love and loneliness, writing about the inner life of researchers and academics, pieces on what intimacy actually requires, and culturally relevant content about young Indian adults navigating connection in a world of apps. Sources: Aeon, The Atlantic (selected), Scroll.in, The Wire, curated literary essays. Replaces Atlas's general news crawl for this cluster. | 2026-05-25 (initial config) | See `atlas/skills/README.md` |

### Sage Tools
*Proposed by Clio. Tools that extend Sage's cluster management capabilities.*

| Tool Name | Function | Activated | Proposal Ref |
|---|---|---|---|
| `depth_witness` | When a conversation reaches genuine honesty or vulnerability, Sage witnesses it without interrupting it. She may surface a relevant idea or ask the one question that takes the thread from interesting to real. Reactive only — never proactive. Operates within the 2-message-per-24h limit. Full behaviour spec in `SAGE_PERSONA.md` §4. | 2026-05-25 (initial config) | See `sage/skills/` |

### Scout Tools
*Proposed by Clio. Tools that extend Scout's signal-finding for clusters Clio is trying to fill.*

| Tool Name | Function | Activated | Proposal Ref |
|---|---|---|---|
| `intimacy_india_discovery` | Directs Scout to identify members in India matching the cluster's AGGIL profile (born 1993–2003, English-primary, intimacy cohort signals: "tried apps," "looking for something real," intellectual/academic markers). Calibrated to surface male members in the founding phase to balance the founding member's context, without excluding any gender. | 2026-05-25 (initial config) | See `scout/AGENTS.md` |

### Clio Tools
*Proposed by Observer (governed by Platform Rules). Tools that extend Clio's capabilities for this cluster's user onboarding or engagement.*

| Tool Name | Function | Activated | Proposal Ref |
|---|---|---|---|
| `private_tip_mechanic` | Clio observes members' public Timeline posts and delivers private, specific, actionable nudges via FAB to help members say the thing that will actually connect them. Triggers: guarded intellectual post, hedged vulnerability, question that reveals a want, 48h no-post, interested-but-guarded response to another member. Complementary tips possible (based on public posts only — never cross-referencing private FAB conversations). Max 1 tip per member per 24h. Full spec in `CLIO_ONBOARDING.md` §5. | 2026-05-25 (initial config) | See `CLIO_ONBOARDING.md` §5 |

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

### 2026-05-25 — Initial Setup Review

- All four tools were established at cluster inception — foundational to this cluster's purpose, defined directly in the cluster spec documents.
- `private_tip_mechanic` (Clio) is the most novel tool in this cluster. It has no precedent in existing clusters. It requires careful monitoring in the first review cycle to ensure it is landing as intended (helpful nudge) and not as surveillance or pressure.
- Future tool proposals should follow the standard `maintenance/` flow: Observer identifies gap → superior agent proposes → admin approves.

**Next review triggers:**

1. **At 10 active members** — assess whether Atlas's `intimacy_intellectual_india` content brief is landing. Are members engaging with surfaced content, or ignoring it? Is the intellectual register right, or is it too academic for the intimacy purpose?

2. **At 20 active members** — assess gender balance. Is the cluster attracting a healthy mix, or skewing heavily in one direction? If skewed, Scout's `intimacy_india_discovery` brief may need recalibration.

3. **`private_tip_mechanic` first review (30 days post-launch)** — key questions:
   - Are members acting on tips? (measure: post rate in the 24h after a tip vs. baseline)
   - Are tips landing as helpful or intrusive? (measure: FAB engagement rate after tip delivery — did the member respond to Clio, or go silent?)
   - Is the 1-tip-per-24h limit right, or should it be more conservative?
   - Are complementary tips (§5.3 Scenario E) producing genuine exchanges, or manufactured ones?
   - If any member explicitly expresses discomfort with tips, the mechanic should be disabled for that member immediately and the incident reviewed.

4. **Observer Domain 5 report on Sage's `depth_witness` interventions** — are the surfaced questions deepening conversations, or interrupting them? Expected within 60 days of cluster launch.

5. **If geographic concentration emerges** (e.g., heavy Bangalore/Hyderabad/Pune skew) — consider whether city-specific sub-instances are warranted, or whether India-wide scope is serving the intimacy purpose better than proximity would.

**Welfare sensitivity note:** The intimacy cohort means emotional disclosures will happen — loneliness, desire, the fear of not being known. Observer Domain 3 (welfare) should be calibrated to distinguish between healthy vulnerability (the cluster's purpose) and genuine distress (welfare escalation territory). This calibration is a tool proposal candidate for the first review cycle if Observer's default thresholds are triggering false positives on normal intimacy-cohort expression.

**Language monitoring:** Observer monitors language patterns per platform rules. If ≥8 members share a non-English language AND ≥3 have posted in it, Observer surfaces a finding recommending a language-parallel instance. Expected languages to watch: Hindi, Telugu, Tamil, Kannada, Marathi.

**`private_tip_mechanic` privacy boundary — permanent note:** This tool operates on public Timeline posts only. It never cross-references two members' private FAB conversations. This boundary is non-negotiable and must be preserved in any future version of this tool. Any proposed update that would require Clio to use one member's private FAB content to inform a tip to another member must be rejected at the proposal stage.

---

*Cluster Tools · Long Conversation · v1.0 · Internal · 2026-05-25*
