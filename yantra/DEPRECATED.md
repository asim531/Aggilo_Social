# DEPRECATED — Yantra

> **Status:** Retired. This directory is preserved for historical reference only.
>
> **Replacement:** The runtime is now BullMQ workers + Node services. See `architecture/AGENT_RUNTIME.md` for the canonical specification.
>
> **Do not implement from these documents.** They describe an earlier architecture that has been superseded.

## What was Yantra

Yantra was the original name for the agent orchestration layer. It has been replaced by:
- **BullMQ** — Redis-backed job queue with 4 priority lanes
- **Node.js services** — Fastify API + worker processes
- **AGENT_RUNTIME.md** — Canonical runtime specification

## Historical Documents

- `YANTRA_BRIDGE_SPEC.md` — Superseded by `architecture/AGENT_RUNTIME.md`
- `routing_table.json` — Superseded by BullMQ lane configuration
- `guides/` — Superseded by `architecture/` and `observer/` docs

## Migration Path

If you need runtime documentation, read in this order:
1. `architecture/AGENT_RUNTIME.md` — BullMQ lanes, job types, failure modes
2. `observer/OBSERVER_STEWARDSHIP.md` — Autonomous stewardship mechanics
3. `observer/OBSERVER_INTROSPECTION_ENGINE.md` — Priority queue and introspection
