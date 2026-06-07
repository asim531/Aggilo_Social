# Aggilo — Executable Task File Template

> Use this template to generate per-task execution files (one per atomic task). Name files `tasks/<task-code>.md`.

## Frontmatter
```
---
task: <code>
title: <short name>
owners: [<engineer>]
depends_on: [<task-codes>]
estimate_hours: <2-8>
status: pending | in_progress | blocked | done
---
```

## Sections
1) **Goal** — One sentence outcome.
2) **Scope** — What is included.
3) **Requirements** — Bullet list of acceptance criteria.
4) **Dependencies** — Services, schemas, docs needed before starting.
5) **Plan** — 3–6 steps (actionable, ordered).
6) **Files to Touch** — Paths expected to change.
7) **Validation** — How to verify (commands, tests, UI states, sample payloads).
8) **Risks & Mitigations** — Known traps, rollbacks.
9) **Out of Scope** — Explicit exclusions.

## Example (Task F03 — Prompt Builder 4-Layer Assembly)
```
---
task: F03
title: Prompt builder 4-layer assembly with ceilings
owners: [backend-eng]
depends_on: [F02]
estimate_hours: 6
status: pending
---

Goal
- Assemble prompts with 4-layer inheritance contract enforcing token ceilings.

Scope
- Prompt builder code and tests only; no agent behaviour changes.

Requirements
- Layer order: 1 Soul, 2 Platform Rules + agent character, 3 cluster identity, 4 per-call signals.
- Token ceilings: L1 ≤600, L2 ≤800, L3 ≤400, L4 trim oldest history first.
- If over budget: trim L4 oldest → compress L3 → fail with structured error (no silent drop).

Dependencies
- `llm_operation_keys` from F02; Platform Rules source file path.

Plan
- Locate prompt builder module; add layering function with ceilings.
- Implement trim strategy and structured overflow error.
- Add unit tests covering normal, over-budget, trim order.
- Wire logging to `llm_response_logs` with tokens used and trim events.

Files to Touch
- `apps/api/src/lib/prompt-builder.ts`
- `apps/api/test/prompt-builder.test.ts`

Validation
- `pnpm test prompt-builder`
- Manual: construct over-budget payload → expect trim sequence logged.

Risks & Mitigations
- Risk: Hidden prompt drift. Mitigate with snapshot tests and explicit layer ordering.
- Risk: Performance. Mitigate by memoizing static layers (Soul/Rules).

Out of Scope
- UI changes, agent behaviour prompts, LLM provider routing.
```
