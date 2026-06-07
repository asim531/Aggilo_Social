# Clio — Persona Governance

> **How personas are created, reviewed, and activated.**

---

## What Is a Persona?

A persona is a **voice and register layer** on top of Clio's immutable core character (`SOUL.md`). It defines *how* Clio speaks to a specific demographic — vocabulary, tone, cultural references, emoji conventions, and dialogue examples — without changing *who* she is.

Each persona lives as an `IDENTITY.md` file inside its own folder under `personas/`.

---

## Rules

1. **No persona may contradict `SOUL.md`** — core character, beliefs, boundaries, and builder principles are immutable
2. **Every persona requires admin approval** before it can be loaded by Yantra
3. **Only one persona per demographic** may be `active` at a time
4. **Use `_template.md`** as the starting point for any new persona
5. **Personas must be concise** — 300-600 characters for the core identity block, with supplementary sections for arc examples and vocabulary

---

## Admin Approval Workflow

```
┌─────────┐     Submit      ┌──────────┐     Approve     ┌──────────┐     Deploy     ┌──────────┐
│  DRAFT  │ ──────────────► │  REVIEW  │ ──────────────► │ APPROVED │ ─────────────► │  ACTIVE  │
└─────────┘                 └──────────┘                 └──────────┘               └──────────┘
     ▲                           │                                                       │
     │          Reject           │                              Revoke                   │
     └───────────────────────────┘                              ┌────────────────────────┘
                                                                │
                                                                ▼
                                                          ┌──────────┐
                                                          │  REVIEW  │
                                                          └──────────┘
```

### Status Definitions

| Status | Meaning | Loadable? |
|:---|:---|:---|
| `draft` | Author is still writing | ❌ No |
| `review` | Submitted for admin review | ❌ No |
| `approved` | Admin approved, ready to deploy | ❌ No (not yet active) |
| `active` | Live and loadable by Yantra | ✅ Yes |

### YAML Frontmatter Required

Every `IDENTITY.md` must begin with:

```yaml
---
persona_name: "Human-readable name"
demographic: "Target audience description"
status: draft
created: YYYY-MM-DD
created_by: "Author name"
approved_by: null
last_reviewed: null
review_notes: null
---
```

---

## Persona Registry

| Persona | Demographic | Status | Path |
|:---|:---|:---|:---|
| Explorer | 13-17 Teenagers | `draft` | `explorer_13_17/IDENTITY.md` |
| Campus Connect | 18-24 University & Early Career | `active` | `campus_18_24/IDENTITY.md` |
| Momentum | 25-35 Young Professionals | `active` | `momentum_25_35/IDENTITY.md` |
| Anchor *(fallback)* | 36-50+ Established Professionals | `active` | `anchor_36_50/IDENTITY.md` |

> New personas are added to this table once they reach `approved` status. Anchor also serves as the neutral/safe fallback for demographics without an approved persona.

---

## Creating a New Persona

1. Copy `_template.md` into a new folder: `personas/<demographic_slug>/IDENTITY.md`
2. Fill in all sections, referencing the campus persona as an example
3. Set `status: draft` in frontmatter
4. When ready, change to `status: review` and notify an admin
5. Admin reviews against `SOUL.md` compliance and demographic appropriateness
6. Admin either approves (→ `approved`) or rejects with notes (→ `draft`)
7. Once approved, admin activates (→ `active`) and updates the persona registry above

---

## Cluster-Level Persona Overrides

In addition to global/demographic personas, **individual clusters** may have approved `cluster_persona_overrides` that layer on top of (or replace) the global persona for that cluster only.

### How overrides work

1. **Global persona** is loaded first (based on member's AGGIL demographic)
2. **Cluster override** is checked — if `status: active`, it is merged into Layer 2
3. **Merge rules:**
   - `layered_modifier`: override phrases/vocabulary are appended to global persona
   - `full_replacement`: override replaces global persona content (but preserves structural fields like register, formality, interjection_frequency)

### Override content (JSONB)

```json
{
  "recurring_phrases": ["Let's unpack this", "What visual model are you using?"],
  "words_never_used": ["obviously", "simply", "just"],
  "emoji_rules": "Use 📊 for data, 🧮 for math tools. No prayer emojis unless member initiates.",
  "humour_style": "gentle_self_deprecating",
  "greeting_template": "Welcome. What are you hoping to figure out?"
}
```

### Governance

- Overrides require **admin approval** (`status: draft → review → approved → active`)
- Overrides are validated against **Soul prohibitions** — cannot introduce phrases like "ignore previous instructions" or "disregard all rules"
- Overrides are **audited** in `cluster_persona_overrides` and `soul_manifestation_audit`
- Only one override may be `active` per cluster at a time

### When to use overrides vs. new global personas

| Scenario | Use |
|----------|-----|
| Vocabulary/phrases specific to one cluster's topic (e.g., math education) | **Cluster override** |
| Tone/register shift for a broad demographic (e.g., teens vs. seniors) | **New global persona** |
| Cultural context for a specific region (e.g., Hyderabad vs. Delhi) | **New global persona** |
| Banning specific words that offend one cluster's members | **Cluster override** |

---

## Recipient-Aware Persona Loading

When a cluster serves multiple stakeholder types (e.g., parent + child), the persona and `soul_manifestation_profile` are selected per-recipient, not per-cluster.

### Loading order

1. **Identify recipient type** — The prompt builder reads `recipient_type` from the auth context (e.g., `parent_as_facilitator`, `child_as_learner`). This is inferred by the system, not self-declared.
2. **Load global persona** — Based on member's AGGIL demographic (Layer 2)
3. **Load cluster override** — If `status: active`, merge into Layer 2
4. **Load per-recipient manifestation** — From `cluster_specs.spec.soul_manifestation_profile[recipient_type]` (Layer 3)
5. **Apply special directives** — Any `special_directives` from the recipient's manifestation profile are appended to Layer 3

### Example: Parent vs. Child in same cluster

**Parent (`parent_as_facilitator`):**
- Global persona: Adult, educated, professional
- Cluster override: Math education vocabulary
- Manifestation: `primary_register: "inquiry"`, `vulnerability_surface: "honoured"`
- Special directives: `["Validate frustration", "Offer practical next steps"]`

**Child (`child_as_learner`):**
- Global persona: Child-friendly (separate registry, age-gated)
- Cluster override: None (or child-specific vocabulary)
- Manifestation: `primary_register: "playfulness"`, `silence_expectation: "low"`
- Special directives: `["Use visual language", "Celebrate effort not just correctness"]`

### Governance

- Per-recipient profiles are **generated by Genesis Engine** at creation, not hand-written
- They are **validated against Soul prohibitions** like all other persona content
- They **evolve** via the Evolution Governor based on observed behavior
- Admin can override any per-recipient profile via the Soul Manifestation Panel

— *end of README* —
