# Aggilo — Platform Architecture

> **For:** AI coding agents implementing the Aggilo platform.
>
> **Authority:** This document is a navigation index. The canonical
> technical source is the `architecture/` folder. Where this document
> and any `architecture/` file conflict, the `architecture/` file wins.
>
> **Scope:** The production platform (React + Node/Fastify + Supabase +
> BullMQ). The pilot apps in `/phase0/` (Sisters in Dua and Long
> Conversation) are isolated Next.js applications and are NOT part of
> this architecture. Pilot-only specs and deployment docs live under
> `/phase0/`.

---

## Stack (non-negotiable)

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite (PWA, mobile-first, TypeScript strict) |
| Backend | Node.js + Fastify (TypeScript strict) |
| Database | Supabase (PostgreSQL + Auth + Realtime + RLS) |
| Queue | BullMQ (Redis-backed, 4 priority lanes) |
| Deployment | Vercel (React PWA) + Railway (Node API) + Supabase Cloud |

---

## Architecture Folder — Reading Order

Read every file in this order before writing any code. No skimming.

```
architecture/
├── system_implementation_prompt_part1.md  ← Stack, folder structure, env vars, infra
├── system_implementation_prompt_part2.md  ← Database schema, ER diagram, RLS
├── system_implementation_prompt_part3.md  ← API design, state management, build phases
├── system_implementation_prompt_part4.md  ← AI agent architecture & orchestration
├── system_implementation_prompt_part5.md  ← Sage agent — cluster intelligence
├── system_implementation_prompt_part6.md  ← Multi-cluster prompt architecture,
│                                             inheritance contract, audit
│
├── PLATFORM_AGENCY.md          ← THREE-LAYER PLATFORM AGENCY MODEL (read before Observer)
│                                  Soul / Platform Rules / Observer as platform steward
│
├── AGENT_COMMUNICATION_CONTRACT.md  ← Six inter-agent communication patterns
│                                       Corrected Observer hierarchy
│
├── AGENT_RUNTIME.md            ← BullMQ lanes, idempotency, failure modes,
│                                  Phase 1 Observer stewardship jobs
│
├── REALTIME_ENGAGEMENT_LAYER.md ← Four real-time signals, fallback contract,
│                                   privacy ceiling
│
└── premium_cluster_requirements.md ← Premium cluster spec, agent involvement
                                       slider, public listing controls
```

---

## Observer — Canonical Sources

Observer has been significantly expanded beyond Part 4. **Do not
implement Observer from Part 4 §16** — that section is superseded.
Read these instead, in order:

```
observer/
├── AGGILO_OBSERVER_AGENTS.md        ← 10 canonical domains, finding lifecycle,
│                                       job schedule, DB schema, tool proposal authority
├── OBSERVER_STEWARDSHIP.md          ← Autonomous stewardship: three-tier autonomy,
│                                       veto windows, prompt update architecture,
│                                       Platform Rules validation layer, DB schema
└── OBSERVER_INTROSPECTION_ENGINE.md ← Priority queue engine, five-dimension
                                        cluster evaluation prompt, minimality test,
                                        user feedback digest, cold-start mode
```

---

## Agent Hierarchy

```
AGGILO SOUL (Layer 1 — immutable, every LLM call)
        │
PLATFORM RULES + INHERITANCE CONTRACT (Layer 2)
        │
    Observer  ←── Platform Steward
    │    ├── Channel 1: Autonomous stewardship (Phase 1)
    │    └── Channel 2: Finding-and-approve (Tier 3)
    │
    └── Welfare → Admin always

MEMBER-FACING AGENTS
    Clio (orchestrator + member voice)
        ├── Sage (cluster anchor) → Atlas (content layer)
        └── Scout (community intelligence)
```

Full spec: `architecture/PLATFORM_AGENCY.md`

---

## The Four-Layer Inheritance Contract

Every LLM call assembles context in this order:

```
Layer 1 — Platform super-prompt     (immutable, every agent, every cluster)
Layer 2 — Agent character           (Sage, Clio, Atlas, Scout, Observer — generic)
Layer 3 — Cluster identity          (per-cluster vocabulary + identity)
Layer 4 — Per-call signals          (welfare, character, @mention, vault, recent posts,
                                     Observer signals)
```

Source: `architecture/system_implementation_prompt_part6.md` §33
Prompt layout: `src/lib/prompts/` (see Part 6 §35)

---

## Key Architectural Decisions

**1. No direct web scraping.** Scout and Atlas use the Data Acquisition
Layer (Tier 1: structured APIs → Tier 2: SerpApi/Serper → Tier 3:
Firecrawl/BrightData). Puppeteer/Playwright from server IPs is
architecturally prohibited. See Part 1 §2.5.

**2. Sage is Clio's subordinate.** Clio delegates cluster-level
intelligence to Sage. Clio retains override authority. Sage owns all
cluster-level posting. See Part 4 §12–13, Part 5.

**3. Observer is the platform steward.** Observer's principal is the
platform's own rules and the admin team — not any other agent. It has
two output channels: autonomous stewardship (Phase 1) and
finding-and-approve. Welfare always routes to admin. See
`architecture/PLATFORM_AGENCY.md`.

**4. Deterministic templates for high-stakes moments.** New-member
welcome and Sage→Clio handoff greetings are not LLM-generated. See
Part 6 §36.2.

**5. Validator-with-retry-and-degrade for structured output.** Every
prompt producing JSON consumed downstream uses: bad-example block +
server-side regex validator + one retry + degraded fallback. See
Part 6 §36.1.

**6. The cluster registry is the only resolver.** Routes never import
cluster-specific files directly. A new cluster = one directory under
`clusters/` + one entry in `registry.ts`. See Part 6 §34.3.

---

## Phase 1 Prerequisites (not yet implemented)

These are designed and documented but not yet built:

- Observer autonomous stewardship (Channel 1): `observer/OBSERVER_STEWARDSHIP.md`
- Observer introspection engine: `observer/OBSERVER_INTROSPECTION_ENGINE.md`
- Platform agency model: `architecture/PLATFORM_AGENCY.md`
- Observer Stewardship admin dashboard section
- Founder-scoped Observer view in per-cluster dashboard
- `cluster_prompt_versions` table (prompt version history)
- `observer_prompt_updates`, `clio_observer_signals`,
  `observer_cluster_context`, `observer_learnings`,
  `clio_cluster_intelligence` tables

---

## What Is NOT Part of This Architecture

- `/phase0/` — pilot workspace. Two isolated Next.js apps
  (`phase0/mvp/` for Sisters in Dua, `phase0/lc/` for Long
  Conversation), their cluster-specific specs at `phase0/clusters/`,
  and the pilot deployment guide at `phase0/docs/`. Separate stack,
  separate deployment lifecycle. Never import from `apps/api/` into
  the pilot apps.
- Laravel / PHP / Artisan — do not exist in this project.
- "Yantra" — retired term. The concept lives on as BullMQ workers +
  Node services. See `architecture/AGENT_RUNTIME.md`.

---

*Navigation index · 2026-05-24 · Canonical source is `architecture/`.*
