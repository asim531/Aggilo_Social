# Cluster Tools — The Single Source

> **Active and proposed tools for this cluster's agents.**
> *Maintained by admin. Updated whenever a tool is activated or retired.*
> *Tool proposals live in `maintenance/[YYYY-MM]/[cluster_id]_[tool_name].md`*

---

## Cluster Identity

| Field | Value |
|---|---|
| **Cluster Name** | The Single Source (Monotheism Exploration) |
| **Cluster ID** | *(assign UUID on creation)* |
| **Tier** | Premium |
| **AGGIL Summary** | Age: All · Gender: Mixed · Geo: Global · Interests: Comparative Theology / Monotheism · Language: English (primary) |
| **Arc Phase** | B (Active — starts here, per CLUSTER_DESCRIPTION.md) |
| **Last Tool Review** | 2026-05-04 (initial setup) |

---

## Active Tools

### Atlas Tools
*Proposed by Sage. Tools that extend Atlas's content sources for this cluster.*

| Tool Name | Function | Activated | Proposal Ref |
|---|---|---|---|
| `theology_sources` | Pulls from Stanford Encyclopedia of Philosophy, JSTOR Open Access, Sacred Texts Archive, Aeon Magazine, and theology-specific academic sources. Replaces Atlas's general news crawl for this cluster. | 2026-05-04 (initial config) | See `atlas/skills/README.md` |

### Sage Tools
*Proposed by Clio. Tools that extend Sage's cluster management capabilities.*

| Tool Name | Function | Activated | Proposal Ref |
|---|---|---|---|
| `scripture_current_affairs` | Maps current events to cross-tradition scriptural parallels. Proactive: 1×/week post. Reactive: responds to user queries with relevance-scored scriptural references within the 2-message limit. | 2026-05-04 (initial config) | See `sage/skills/scripture_current_affairs/SKILL.md` |

### Scout Tools
*Proposed by Clio. Tools that extend Scout's signal-finding for clusters Clio is trying to fill.*

| Tool Name | Function | Activated | Proposal Ref |
|---|---|---|---|
| *(none yet)* | | | |

### Clio Tools
*Proposed by Observer (governed by Platform Rules). Tools that extend Clio's capabilities for this cluster's user onboarding or engagement.*

| Tool Name | Function | Activated | Proposal Ref |
|---|---|---|---|
| *(none yet)* | | | |

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

### 2026-05-04 — Initial Setup Review
- `theology_sources` (Atlas) and `scripture_current_affairs` (Sage) were both established at cluster inception, not through the standard Observer-triggered proposal flow — they are foundational to this cluster's purpose and were defined directly in `CLUSTER_DESCRIPTION.md`.
- Future tool proposals for this cluster should follow the standard `maintenance/` flow: Observer identifies gap → superior agent proposes → admin approves.
- **Next review trigger:** When Observer Domain 5 reports on Sage's intervention accuracy for this cluster (watch for: are scripture references landing with members? Is Atlas finding relevant academic content?). Expected within 60 days of cluster launch.
- **Language parallel monitoring:** Observer monitors language patterns per `CLUSTER_DESCRIPTION.md §3`. When ≥8 members share a non-English language AND ≥3 have posted in it, Observer surfaces a finding. If a language-parallel instance is created, it will need its own `CLUSTER_TOOLS.md`.

---

*Cluster Tools · The Single Source · v1.0 · Internal · 2026-05-04*
