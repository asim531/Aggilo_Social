# PRD — Product Requirement Documents

> **⚠️ STACK REFERENCES SUPERSEDED**
>
> These PRDs were written for an earlier Laravel/PHP stack. The production architecture **permanently replaces** the entire backend with:
> - React 18 + Vite (PWA frontend)
> - Node.js + Fastify (API backend)
> - Supabase (PostgreSQL + Auth + Realtime)
> - BullMQ (Redis-backed queue)
>
> **Do not implement from these PRDs directly.** Read `architecture/` for canonical specs.
>
> These documents are preserved for product intent and feature requirements only. All technical implementation details (stack, folder structure, deployment) are superseded by `architecture/system_implementation_prompt_part1-6.md`.

## Reading Order

| PRD | Covers |
|-----|--------|
| `01_registration_onboarding.md` | Registration & onboarding flows |
| `02_cluster_creation.md` | Cluster creation flow |
| `03_cluster_discovery.md` | Discovery & search |
| `04_in_cluster_experience.md` | In-cluster UX (posts, comments, DMs) |

## Canonical Technical Source

For all implementation details, read in order:
1. `../ARCHITECTURE.md` — Navigation index
2. `../architecture/system_implementation_prompt_part1.md` — Stack, folder structure
3. `../architecture/system_implementation_prompt_part2.md` — Database schema, RLS
4. `../architecture/system_implementation_prompt_part3.md` — API design, state management
5. `../architecture/system_implementation_prompt_part4.md` — AI agent architecture
6. `../architecture/system_implementation_prompt_part5.md` — Sage agent spec
7. `../architecture/system_implementation_prompt_part6.md` — Multi-cluster prompt architecture
