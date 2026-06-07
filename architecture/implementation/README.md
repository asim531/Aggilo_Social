# Aggilo — Master Implementation Package

This folder is the single entry point for engineering execution. It references all planning assets and task files without duplicating content.

## Contents
- **Planning Docs (source)** → `../planning/`
  - 01_DOMAIN_MAP.md — System domain map
  - 02_USER_JOURNEYS.md — User journey map
  - 03_SCREEN_INVENTORY.md — Screen inventory
  - 04_CAPABILITY_MAP.md — Capability map
  - 05_DEPENDENCY_GRAPH.md — Dependency graph
  - 06_GAP_ANALYSIS.md — Gap analysis
  - 07_MASTER_TASK_REGISTRY.md — Atomic tasks catalog
  - 08_IMPLEMENTATION_ROADMAP.md — Milestones 0–18
  - 09_TASK_FILE_TEMPLATE.md — Template for per-task files
  - 10_AGENT_PROMPT_REFINEMENT.md — Prompt hardening guidance
  - agent_prompts/ — Refined system prompt drafts (Clio, Sage, Atlas, Scout, Observer)

- **Execution Tasks** → `/tasks/`
  - README.md — Task index, dependencies, suggested start order
  - All task files (F*, B*, FE*, A*, AD*, QA*, P*)

## How to Use
1. **Start Here:** Read 06_GAP_ANALYSIS.md and 08_IMPLEMENTATION_ROADMAP.md to choose milestone.
2. **Pick Tasks:** Use 07_MASTER_TASK_REGISTRY.md for scope and dependencies; open matching file in `/tasks/` for execution details.
3. **Prompts:** For agent work, load the relevant draft in `agent_prompts/` and apply token ceilings/validators.
4. **Logging/Validation:** Follow testing/validation steps in each task file; update `/tasks/README.md` status as you progress (or issue-level tracking).

## Scope Notes
- Phase0 is excluded. This package targets the production stack: React/Vite (TS strict) + Fastify + Supabase + BullMQ.
- All prompt work must honor the 4-layer inheritance contract and token ceilings.
- Use the task template (09_TASK_FILE_TEMPLATE.md) for any new tasks.

## Quick Links
- Planning index: `../planning/`
- Task index: `/tasks/README.md`
- Agent prompts: `../planning/agent_prompts/`

## Ownership
- Use task owners in `/tasks/` files; assign per team norms.

## Agent Prompts Index
- Clio: `../planning/agent_prompts/CLIO_SYSTEM_PROMPT.md`
- Sage: `../planning/agent_prompts/SAGE_SYSTEM_PROMPT.md`
- Atlas: `../planning/agent_prompts/ATLAS_SYSTEM_PROMPT.md`
- Scout: `../planning/agent_prompts/SCOUT_SYSTEM_PROMPT.md`
- Observer: `../planning/agent_prompts/OBSERVER_SYSTEM_PROMPT.md`

## Milestone 0 Checklist (Foundations & Observability)
- [ ] F01 runtime_events migration applied
- [ ] F02 llm_routing/op-key schemas applied
- [ ] F03 prompt builder ceilings + trim order tested
- [ ] F04 validator + retry + degrade wired and logged
- [ ] F05 BullMQ idempotency enforcement live

## Milestone 1 Checklist (Security & DevOps Spec)
- [ ] D01 DevOps runbook committed
- [ ] D02 Security & Privacy architecture (RLS matrix) committed
- [ ] D03 Monitoring/alerts defined with endpoints

## Milestones → Key Tasks
- **Milestone 0 – Foundations & Observability**
  - F01, F02, F03, F04, F05
  - B03 (activity), B04 (notifications), B11 (realtime backend), B12 (activity→push)
  - QA01 (API contracts), QA02 (LLM regression)

- **Milestone 1 – DevOps & Security Specs**
  - D01 (DevOps runbook), D02 (Security & Privacy architecture), D03 (Monitoring & alerts plan)

- **Milestone 2 – DM & Cluster Creation Core**
  - B01, B02, B10
  - FE01, FE03
  - A03 (Sage arc assembler)

- **Milestone 3 – Activity, Notifications & Realtime UX**
  - B03, B04, B11, B12
  - FE04, FE05, FE06, FE08
  - AD01 (admin dashboard: activity/moderation/notifications)

- **Milestone 4 – Agent Runtime Hardening**
  - A01, A02, A04, A06, A07
  - F03, F04, F05
  - B06, B07, B09

- **Milestone 5 – Premium & Payments Specs**
  - P01, P02

> For detailed milestone definitions and success criteria, see `../planning/08_IMPLEMENTATION_ROADMAP.md`.
