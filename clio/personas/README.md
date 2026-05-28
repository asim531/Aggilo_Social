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

— *end of README* —
