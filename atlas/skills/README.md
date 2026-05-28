# Atlas Skills — Extensibility Architecture

> **Purpose:** Atlas's source list and content behavior are **customizable per cluster interest profile**. This document defines how cluster-specific Atlas skill extensions work.

---

## 1. How Atlas Skills Work

Atlas's default source list (Google News, Reddit, YouTube, ProductHunt, etc.) serves most clusters. However, specialized clusters require domain-specific sources and content handling rules.

**Atlas skills are loaded when a cluster's interest tags match a skill's activation tags.**

```yaml
# Example: theology skill activation
skill_id: theology_sources
activation_tags: ["theology", "philosophy", "monotheism", "comparative_religion"]
sources:
  - name: Stanford Encyclopedia of Philosophy
    method: rss
    url: https://plato.stanford.edu/rss/sep.xml
  - name: Aeon Magazine (philosophy)
    method: rss
    url: https://aeon.co/feed.rss
  # ... additional sources
content_rules:
  - do_not_factcheck_interpretation: true
  - verify_attribution: true
  - flag_disputed_translations: true
```

## 2. Skill Loading at Brief Time

When Sage issues an Atlas brief:
1. Atlas reads the cluster's interest tags from the brief's `aggil_segment.interests`
2. Atlas checks `atlas/skills/` for any skill whose `activation_tags` intersect with the cluster's interests
3. Matching skill sources are **appended** to the default source list (not replacing it)
4. Matching skill `content_rules` are injected into Atlas's scoring and verification pipeline
5. Skill loading is logged in the card batch metadata for Sage's audit

## 3. Creating a New Atlas Skill

To add a new domain-specific Atlas skill:

1. Create a directory: `atlas/skills/<skill_id>/`
2. Create `SKILL.yaml` with the schema below
3. Admin approval required before activation (same lifecycle as persona IDENTITY files: `draft → review → approved → active`)

### SKILL.yaml Schema

```yaml
skill_id: string           # Unique identifier
version: string            # Semver
status: draft | review | approved | active
activation_tags: [string]  # Interest tags that trigger this skill
priority: int              # Source priority weight (higher = preferred)
sources:
  - name: string
    method: rss | api | headless_chrome
    url: string
    rate_limit: string     # e.g. "100/min"
    geography_filter: string | null
content_rules:
  key: value               # Domain-specific scoring/verification overrides
approved_by: string | null
last_reviewed: ISO8601 | null
```

## 4. Current Skills Registry

| Skill ID | Activation Tags | Status | Sources Added |
|----------|----------------|--------|---------------|
| `theology_sources` | theology, philosophy, monotheism, comparative_religion | `active` | Stanford Phil, JSTOR, Sacred Texts, Aeon, Marginalia, Renovatio, Firstthings, Swarajya |
| `india_startup` | startup, entrepreneurship, tech + geography:india | `active` | YourStory, The Ken, Inc42, Entrackr |
| *(more skills added as clusters diversify)* | | | |

## 5. Rules

- Skills are additive — they extend the source list, never replace it
- A cluster can activate multiple skills simultaneously if its interest tags match
- Skills follow the same admin approval lifecycle as personas
- Atlas logs which skills were active for each card batch (audit trail)
- Source rate limits in skills are enforced independently from default source limits

---

*Atlas Skills README · v1.0 · Internal Architecture Document*
