# Agent Runtime — Architecture

> **Status:** Architectural spec. Establishes the canonical name for
> the runtime layer (formerly "Yantra") and documents the BullMQ
> implementation that backs it in production.
>
> **Authority:** Subordinate to
> `architecture/system_implementation_prompt_part1..6.md`. This document
> is the canonical home for runtime concerns; per-agent AGENTS files
> reference it rather than describing the runtime themselves.

---

## Naming — the rename from Yantra

The runtime layer was named "Yantra" in early architecture documents
and per-agent specs. The name has been deprecated. The canonical
language is now:

| Surface | Term to use |
|---------|-------------|
| Architecture documents (parts 1–6, this file, the agent communication contract) | **Agent Runtime** (capitalised, two words) |
| Code comments and runbook docs | **BullMQ worker** / **BullMQ queue** / **BullMQ lane** |
| Per-agent AGENTS files | **Agent Runtime worker** at the top of the file; **BullMQ worker** when describing concrete queue jobs |
| Member-facing surfaces | Never named. Members do not know agents run as workers. |

When migrating an existing file from "Yantra" terminology to current
language, the rule is:

- "Yantra Configuration" header → "Agent Runtime Configuration"
- "Yantra worker" → "Agent Runtime worker (BullMQ)"
- "Yantra dispatch" → "Agent Runtime dispatch"
- The `yantra/` directory (if it carries useful content) → relocate
  contents to `architecture/AGENT_RUNTIME_INTERNALS.md`. The directory
  itself is renamed `_archived/yantra/` if its content is historical
  only.

The rename is a documentation change. No code rename is required;
worker code already uses BullMQ-native naming.

---

## What the Agent Runtime is

A queue-and-worker layer that:

1. Accepts structured job payloads from agents and the platform
   scheduler.
2. Dispatches jobs to workers with **lane-based priority** so user-
   facing operations (Sage evaluating a member post) never queue
   behind background ones (Observer's daily sweep).
3. Enforces **timeouts** per job — no job blocks indefinitely.
4. Honours **idempotency keys** so a retried job does not double-
   execute (welfare insertion, post creation, audit row writes).
5. Logs every dispatch through the platform's observability layer
   (`llm_response_logs` for LLM calls, `behavioural_events` for
   non-LLM operations).

Implementation: **BullMQ + Redis** in production. Pilot deployments
use Next.js API routes invoked by Vercel cron + client-side timers
with server-side cadence guards (per part 1 §8.4 — the Pilot Stack
Isolation Rule).

---

## The four lanes

Every job is assigned to one of four lanes at submit time:

| Lane | Used by | SLA |
|------|---------|-----|
| **critical** | Welfare flag write, character concern write, account safety flag | <1s p99 |
| **high** | Member post evaluation (Sage), Clio chat reply, Atlas brief from Sage | <5s p95 |
| **medium** | Cadence dialogue, introspection, link unfurl, suggest-dua, **GenesisSpecGenerate**, **GenesisClusterValidate**, **PromptRefinementIntrospection** | <30s p95 |
| **low** | Atlas pulse refresh, Scout discovery, Observer domain sweeps, calibration, **GenesisGapRemediate**, **GenesisPostLaunchMonitor**, **ClusterTokenBudgetPromote** | <10min p95 (background) |

Lane assignment is per-job and immutable. A job submitted to `medium`
cannot upgrade itself to `high`; it can only complete or fail.

**Why four lanes:** member-perceived latency must not be held hostage
to background sweeps. The lanes are the contract between the runtime
and the agent specs that submit work to it.

---

## Per-agent runtime profile

Each agent's AGENTS.md declares its runtime profile in a single block.
The shape:

```yaml
agent_runtime:
  primary_lane: critical | high | medium | low
  llm_quota_share_pct: 0-100   # share of NIM / paid LLM quota
  overflow_provider: groq_llama3 | none
  job_types:
    - name: SageEvaluatePost
      lane: high
      timeout_ms: 5000
    - name: SageDuaSuggest
      lane: medium
      timeout_ms: 30000
  cron:
    - schedule: "0 */6 * * *"
      job: SageDuaSuggest
```

When a new agent is added, its AGENTS.md must include this block.
Coding agents implementing the runtime read the block, register the
queues, and wire the schedules.

The current agents' profiles are referenced — not duplicated — in this
document; each agent's AGENTS.md remains the source of truth for its
own profile.

---

## Idempotency

Every job carries an idempotency key:

```
{agent}_{operation_key}_{related_id}_{coarse_timestamp}
```

For example, a Sage evaluate of post `abc-123` at 14:23 produces:
`sage_evaluate_abc-123_20260522_1423`.

Coarse timestamp granularity is per-job-type (Sage evaluate uses
minute precision; cadence-exchange uses 15-minute precision; Observer
sweeps use day precision).

**The runtime refuses to dispatch a job whose idempotency key has
already been processed in the current dedup window** (default 1 hour;
per-job override allowed).

---

## Failure modes

| Failure | Runtime behaviour |
|---------|-------------------|
| Worker crash mid-job | Job re-queued with backoff (1s, 5s, 30s); after 3 retries, moved to `failed` queue and surfaced as Observer Domain 5 finding |
| Timeout | Job marked timed-out; partial-result handler invoked if defined; surfaced as Observer Domain 5 finding |
| LLM provider 5xx | `llmCall()` retries with overflow provider per agent's runtime profile; returns `status: 'error'` after exhaustion |
| Daily LLM budget exceeded | `llmCall()` returns `status: 'budget_exceeded'`; agent surface degrades gracefully (Sage stays silent; Clio shows a brief platform line; cadence-exchange writes a `budget_exceeded` exchange row) |
| **Per-cluster Genesis budget exhausted** | Operation stops immediately. Human escalation gate fires: cluster admin (premium) or platform admin (generic) notified. 7-day response window before Observer review. |
| Cluster missing from registry | Job rejects at dispatch; logs an `unknown_cluster` event; never reaches the worker |
| Idempotency collision | Job rejects at dispatch; logs an `idempotency_collision` event; the original in-flight job continues |

Each failure mode is observable. The runtime never silently swallows
errors.

---

## Observability

Every dispatch and completion writes to one of:

- **`llm_response_logs`** — for jobs that invoked the LLM. Carries
  cost, latency, status, agent, operation_key, related_post_id,
  cluster_id.
- **`behavioural_events`** — for jobs that did not invoke the LLM.
  Carries event_type, user_id (when applicable), cluster_id,
  event_data.

Observer Domain 5 (Agent Performance) reads both tables for its
findings.

The runtime itself emits two events per job: `dispatched` and
`completed | failed | timed_out`. These are structured rows in
`runtime_events` (a new table — schema below).

---

## Schema

```sql
-- New in V3.14 to consolidate runtime observability.
-- This table is the single source of truth for "did the job run".
-- Distinct from llm_response_logs (which is per-LLM-call) and
-- behavioural_events (which is per-platform-event).

CREATE TABLE IF NOT EXISTS public.runtime_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  job_type VARCHAR(64) NOT NULL,
  agent VARCHAR(32) NOT NULL,
  cluster_id TEXT,
  lane VARCHAR(8) NOT NULL,
  status VARCHAR(16) NOT NULL,
  -- 'dispatched' | 'completed' | 'failed' | 'timed_out' | 'rejected'
  rejection_reason VARCHAR(64),
  -- 'idempotency_collision' | 'unknown_cluster' | 'budget_exceeded' | etc.
  idempotency_key VARCHAR(256),
  retry_count SMALLINT DEFAULT 0,
  duration_ms INT,
  payload_size_bytes INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_runtime_events_job_type_created
  ON public.runtime_events(job_type, created_at DESC);

CREATE INDEX idx_runtime_events_status_created
  ON public.runtime_events(status, created_at DESC)
  WHERE status IN ('failed', 'timed_out', 'rejected');
```

The `runtime_events` table is what Observer Domain 5 reads to compute
agent performance statistics.

---

## What this document does NOT include

- **Per-agent runtime profiles.** Each agent's AGENTS.md owns its own
  profile.
- **Specific BullMQ configuration.** Concurrency settings, queue
  prefixes, Redis cluster topology — these live in runbook docs, not
  in architecture.
- **Pilot-stack runtime details.** The pilot's Vercel-cron + client-
  timer approach is documented in `docs/PHASE_0_PILOT.md`. This
  document describes the production architecture; the pilot
  approximates it within Next.js constraints.

---

## Migration checklist (V3.14 rename)

The following files reference "Yantra" and need to migrate to current
language. None of them require code changes — the rename is
documentation-only.

| File | Change |
|------|--------|
| `atlas/AGENTS.md` | "Operational Rules · Yantra Configuration" → "Operational Rules · Agent Runtime Configuration"; "background Yantra worker" (4 occurrences) → "background Agent Runtime worker (BullMQ)" |
| `scout/AGENTS.md` | Same pattern |
| `observer/AGGILO_OBSERVER_AGENTS.md` | "Yantra Configuration" → "Agent Runtime Configuration"; runtime references updated |
| `clio/AGENTS.md` | "Yantra" → "Agent Runtime" with BullMQ noted in runtime sections |
| `sage/AGENTS.md` | Same pattern |
| `yantra/` directory | Inspect contents; if useful, relocate to `architecture/AGENT_RUNTIME_INTERNALS.md`; otherwise move to `_archived/yantra/` |

The migration is a bounded ~2-hour task in a separate session, gated
by the same authority as any architecture edit.

---

*Architecture · 2026-05-22 · Authoritative for the runtime layer
naming and contract. Subordinate to part 6 inheritance contract and to
the agent communication contract.*
