# Yantra — Agent Runtime

> **⚠️ DEPRECATED NAMING** — The term "Yantra" is retired. The patterns in this document are now implemented as Node.js services and BullMQ workers. See [`/architecture/system_implementation_prompt_part1.md`](file:///d:/Aggilo_Social/architecture/system_implementation_prompt_part1.md) for current implementation. This file is retained as a read-only legacy reference.

> **Entry Point for the Yantra Service**
> Yantra is the Python-based agentic runtime that powers all Aggilo AI agents (Clio, Sage, Scout, Atlas, Observer). It is a separate service from the Laravel API backend, communicating via Redis queues and writing results to Supabase.

---

## What Yantra Is

Yantra is **not an agent**. It is the **engine that runs agents** — the orchestration layer that:

- Consumes jobs from Redis queues (dispatched by Laravel)
- Assembles agent context (soul injection + user context + cluster context + cluster tools)
- Routes LLM calls to the correct provider via `routing_table.json`
- Writes results to Supabase
- Sends callbacks to Laravel for synchronous flows (Clio turns)

The agents (Clio, Sage, Scout, Atlas, Observer) define **who they are** and **what they do**. Yantra defines **how they run**.

---

## Documents in This Folder

| Document | Purpose |
|---|---|
| `YANTRA_BRIDGE_SPEC.md` | Complete technical contract: Laravel ↔ Yantra — queue schema, job types, worker patterns, LLM router, rate limiting, health monitoring |
| `routing_table.json` | Admin-managed LLM operation routing table (14 ops) — edit this to change which model handles which job type across all agents |
| `guides/yantra_guide.html` | Visual guide to the Yantra runtime |
| `guides/agentic_workflow.html` | End-to-end agentic workflow diagram |
| `guides/architecture_reference.html` | System architecture reference |

---

## Where Yantra Sits in the Stack

```
Laravel API (PHP)
    ↓ Redis LPUSH (3 priority queues: high · medium · low)
Yantra Runtime (Python / FastAPI)
    ├── Assembles context (soul + user + cluster + tools)
    ├── Routes to correct LLM provider (via routing_table.json)
    ├── Runs agent worker (Clio / Sage / Scout / Atlas / Observer)
    └── Writes result → Supabase + callback → Laravel
```

---

## Relationship to Other Documents

| Document | Location | Why Separate |
|---|---|---|
| `MASTER_INSTRUCTIONS.md` | `docs/` | Platform-wide — covers all services, not just Yantra |
| `SOUL_INJECTION_MAP.md` | `docs/` | Governs soul injection across all agents — not Yantra-specific |
| `SPEC_ADDENDUM.md` | `docs/` | Platform-wide patches and protocol clarifications |
| Agent SOUL/AGENTS.md files | `clio/`, `sage/`, `scout/`, `atlas/`, `Observer/` | Each agent's own identity and operational configuration |

---

## Cluster Tools

Each cluster can have a set of **cluster-specific tools** — runtime-callable functions that extend what an agent can reach for that particular cluster. These are proposed by the superior agent in the hierarchy, approved by admin, and loaded by Yantra at job dispatch time.

- Tool proposals live in `maintenance/`
- The standard proposal format is defined in `maintenance/templates/TOOL_PROPOSAL_TEMPLATE.md`
- Active tools per cluster are documented in `clusters/[cluster_name]/CLUSTER_TOOLS.md`

---

## Runtime Directory Structure

When the Python code is written, it lives inside this `yantra/` folder, per `YANTRA_BRIDGE_SPEC.md §Directory Structure`:

```
yantra/
├── README.md                    ← This file
├── YANTRA_BRIDGE_SPEC.md        ← Technical spec
├── routing_table.json           ← Admin-managed LLM routing
├── guides/                      ← Visual reference guides
├── main.py                      ← FastAPI app + startup
├── config.py                    ← Environment configuration
├── workers/
│   ├── base_worker.py
│   ├── clio_worker.py
│   ├── sage_worker.py
│   ├── scout_worker.py
│   ├── atlas_worker.py
│   └── observer_worker.py
├── queue/
│   ├── consumer.py
│   ├── dispatcher.py
│   └── dead_letter.py
├── context/
│   ├── assembler.py
│   ├── soul_loader.py
│   ├── tool_loader.py           ← Loads cluster-specific tools at dispatch time
│   └── compressor.py
├── llm/
│   ├── router.py
│   ├── rate_limiter.py
│   └── providers/
├── storage/
│   ├── supabase_client.py
│   └── result_writer.py
└── monitoring/
    ├── health.py
    ├── metrics.py
    └── logger.py
```

> [!NOTE]
> `tool_loader.py` is a new addition to the spec. It reads the active cluster tools from Supabase at job dispatch time and makes them available to the agent worker for that job.

---

*Yantra README · v1.0 · Internal*
