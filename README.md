# Aggilo — Social Platform for Purpose-Driven Communities

> **Stack:** React 18 + Vite (PWA) · Node.js + Fastify · Supabase (PostgreSQL + Auth + Realtime) · BullMQ (Redis)

> **Deployment:** Vercel (frontend) · Railway (API) · Supabase Cloud (database)

## What is Aggilo

Aggilo is a social platform where communities ("clusters") form around shared purpose, not just shared interests. Each cluster has AI agents — Clio (orchestrator), Sage (cluster anchor), Atlas (content intelligence), Scout (discovery) — that serve members without replacing human connection.

## Quick Start

1. **Read the architecture** → Start with `ARCHITECTURE.md` (navigation index), then read `architecture/` files in order
2. **Understand the agents** → `clio/`, `sage/`, `atlas/`, `scout/`, `observer/` directories contain agent souls and specs
3. **Check platform rules** → `AGGILO_PLATFORM_RULES.md` and `AGGILO_SOUL.md` are immutable foundations

## Repository Layout

| Directory | Contents |
|-----------|----------|
| `architecture/` | 16 canonical architecture documents. Read in order before writing code. |
| `clio/`, `sage/`, `atlas/`, `scout/`, `observer/` | Agent souls, skills, and behavioral specs |
| `docs/` | 50+ operational specs, help text, and session logs |
| `launch/` | Marketing site (aggilo.in) |
| `phase0/` | **Pilot workspace** — two isolated Next.js apps (Sisters in Dua, Long Conversation). Separate stack, separate deployment. |
| `PRD/` | Product requirement documents (stack references superseded — see `architecture/` for canonical specs) |

## Phase 0 (Pilot)

- `phase0/mvp/` — Sisters in Dua cluster (Next.js 14, deployed from `main`)
- `phase0/lc/` — Long Conversation cluster (Next.js 14, deployed from `chore/phase0-folder-reshape`)

Phase 0 apps are **not** part of the production architecture. They are hand-curated pilot deployments with manual cluster configuration. Production platform (Phase 1+) uses React PWA + Fastify + BullMQ + automated Genesis Engine.

## Key Documents

| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | Navigation index — start here |
| `AGGILO_PLATFORM_REPORT.md` | Complete platform overview (§1-§21) |
| `AGGILO_SOUL.md` | Philosophical foundation — loaded into every LLM call |
| `AGGILO_PLATFORM_RULES.md` | Operational rules and infrastructure constraints |

## Contributing

1. Read `architecture/` in order before writing code
2. Follow the Four-Layer Inheritance Contract (Layer 1: Soul → Layer 2: Agent → Layer 3: Cluster → Layer 4: Per-call)
3. All database tables require RLS policies
4. No direct web scraping — use the Data Acquisition Layer (Tier 1: APIs → Tier 2: Search proxies → Tier 3: Managed scraping)

---

*Aggilo Platform · 2026*
