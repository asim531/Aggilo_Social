# Platform Agency — Architecture

> **Status:** Authoritative architectural concept document. Phase 1.
>
> **Authority:** Subordinate to `AGGILO_SOUL.md` and
> `AGGILO_PLATFORM_RULES.md`. Supersedes any prior implicit or
> scattered description of "Aggilo as an agent."
>
> **Scope:** Names the three layers through which Aggilo operates as
> an agent in its own right — distinct from the individual agents
> (Clio, Sage, Atlas, Scout) that serve members and clusters.
>
> **Companion documents:**
> - `observer/OBSERVER_STEWARDSHIP.md` — Observer's autonomous
>   stewardship mechanics (three-tier autonomy, introspection engine,
>   veto windows, prompt update architecture)
> - `architecture/AGENT_COMMUNICATION_CONTRACT.md` — inter-agent
>   communication patterns including the autonomous stewardship pattern
> - `observer/AGGILO_OBSERVER_AGENTS.md` — Observer's 10 observation
>   domains, finding lifecycle, and job schedule

---

## The Core Concept

Aggilo is not just a platform that runs agents. Aggilo is itself an
agent — one that has beliefs, operates under rules, and watches itself
to act on what it sees.

This agency is not concentrated in any single component. It is
distributed across three layers that together constitute the platform's
will, law, and self-awareness.

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER A — INTENT                                           │
│  AGGILO_SOUL.md                                             │
│  What the platform believes and why it exists.              │
│  Loaded into every LLM call. Immutable.                     │
│  This is the platform's will.                               │
├─────────────────────────────────────────────────────────────┤
│  LAYER B — SPECIFICATION                                    │
│  AGGILO_PLATFORM_RULES.md + Part 6 inheritance contract     │
│  What agents are allowed to do and how the platform         │
│  governs itself. Machine-readable. Governs all decisions.   │
│  This is the platform's law.                                │
├─────────────────────────────────────────────────────────────┤
│  LAYER C — EXECUTION                                        │
│  Observer (platform/OBSERVER_STEWARDSHIP.md)                │
│  The platform watching itself and acting on what it sees.   │
│  Observer's principal is the platform's own rules and the   │
│  human admin team — not any other agent.                    │
│  This is the platform's eyes and hands.                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer A — Intent (AGGILO_SOUL.md)

The Soul document is not a system prompt. It is the answer to the
question every agent must be asked before it speaks its first word:
*what do you believe, and why does that make you safe to trust?*

**What it contains:**
- The cosmological substrate: monotheism held quietly, never preached
- The creed: seven foundational beliefs about human beings and
  connection
- The one line that cannot be crossed: agents must never treat a
  human being as a means to a metric

**How it operates:**
The Soul is loaded as the first system message of every LLM call on
the platform — for every agent, on every cluster, without exception.
It is Layer 1 of the four-layer inheritance contract (Part 6 §33).

**What cannot change it:**
Nothing. No admin setting, no cluster configuration, no Observer
autonomous update, no free-text guidance can modify Layer 1. The
prompt builder loads it from a single source file. Observer has no
write access to it. This is structural, not procedural.

---

## Layer B — Specification (Platform Rules + Inheritance Contract)

The Platform Rules document and the Part 6 inheritance contract
together constitute the platform's operational law — what agents are
allowed to do, how they govern themselves, and what is immutable
across all clusters.

**What it contains:**
- AGGIL engine rules (age, gender, geography, interest, language)
- Cluster creation, membership, and persistence rules
- AI agent rules (Clio, Sage, Scout, Atlas, Observer)
- The four-layer inheritance contract (Part 6 §33–42)
- The immutable invariants (welfare protocol, character protocol,
  dignity invariants, no protocol disclosure)

**How it operates:**
The Platform Rules are the constraint layer that every agent decision
is evaluated against. The inheritance contract ensures that platform
rules are structurally enforced — they cannot be accidentally omitted
from a prompt because the prompt builder prepends them automatically.

**The five context quality criteria (Vishnyakova, 2026):**
The specification layer is designed to satisfy all five:
- **Relevance**: only rules applicable to the current agent/cluster
  are loaded
- **Sufficiency**: the full rule set is present — no rule is assumed
- **Isolation**: platform rules are in Layer 1–2; cluster-specific
  rules are in Layer 3; per-call data is in Layer 4
- **Economy**: the super-prompt token budget is ≤600 tokens
- **Provenance**: every rule is traceable to its source document

---

## Layer C — Execution (Observer as Platform Steward)

Observer is the only agent whose principal is the platform itself
rather than another agent. Every other agent has a named agent
superior (Sage → Clio, Atlas → Sage, Scout → Clio). Observer's
principal is the platform's own rules and the human admin team.

This makes Observer structurally different from every other agent.
It is not in the member-facing hierarchy — it is above it, watching
it.

**Observer's two output channels:**

```
Channel 1 — Autonomous stewardship (Phase 1)
  Observer acts within defined boundaries, notifies admin,
  accepts vetoes within a time window.
  Used for: prompt refinements, context updates, per-call signals.
  Full specification: observer/OBSERVER_STEWARDSHIP.md

Channel 2 — Finding-and-approve (unchanged from original design)
  Observer surfaces findings. Admin approves or rejects.
  Used for: structural actions, welfare, account safety,
  capability extensions, anything with high blast radius.
  Full specification: observer/AGGILO_OBSERVER_AGENTS.md
```

**What Observer cannot do:**
- Modify Layer 1 (Soul) — structurally impossible
- Modify welfare detection or character detection logic — validation
  layer rejects these
- Modify the cosmological substrate — validation layer rejects these
- Act on welfare signals autonomously — welfare always routes to admin
  via Channel 2
- Direct other agents in real-time conversation — Observer updates
  context, it does not send messages

**Observer's relationship to the agent hierarchy:**

The `AGENT_COMMUNICATION_CONTRACT.md` hierarchy diagram shows
Observer → Clio as a direct relationship. This is misleading.
The correct relationship is:

```
Observer → Admin Dashboard → (approves) → Job triggers → agents
Observer → Autonomous stewardship → prompt layers → agents (next call)
```

Observer has no direct runtime authority over any agent's behaviour
in the current turn. Its authority is over:
1. The admin's attention (Channel 2 findings)
2. The context agents receive on their next call (Channel 1 updates)

---

## The Hierarchy Corrected

The full platform agency hierarchy, with Observer's correct position:

```
AGGILO SOUL (Layer 1 — immutable, every LLM call)
        │
PLATFORM RULES + INHERITANCE CONTRACT (Layer 2)
        │
    Observer  ←── Platform Steward
    │    │
    │    ├── Channel 1: Autonomous stewardship
    │    │   (Tier 1: immediate + veto window)
    │    │   (Tier 2: staged + veto window)
    │    │   → updates prompt Layers 2, 3, 4
    │    │   → injects clio_observer_signals (Layer 4, TTL-bounded)
    │    │
    │    └── Channel 2: Finding-and-approve (Tier 3)
    │        → observer_findings → Admin Dashboard
    │        → Admin approves → job triggers
    │
    └── Welfare signals → Admin always (Channel 2, no autonomy)

AGENT HIERARCHY (member-facing)
    Clio (orchestrator + member voice)
        ├── Sage (cluster anchor) → Atlas (content layer)
        └── Scout (community intelligence)
```

---

## What This Document Does NOT Include

- **Observer's 10 observation domains** — `observer/AGGILO_OBSERVER_AGENTS.md`
- **Observer's autonomous stewardship mechanics** — `observer/OBSERVER_STEWARDSHIP.md`
- **The inter-agent communication patterns** — `architecture/AGENT_COMMUNICATION_CONTRACT.md`
- **The runtime layer** — `architecture/AGENT_RUNTIME.md`
- **Per-agent SOULs and AGENTS files** — each agent's own directory

---

## Phase 1 Prerequisites

The following are required before Observer's autonomous stewardship
(Layer C, Channel 1) can ship:

- [ ] `observer_prompt_updates` table live (schema in
      `OBSERVER_STEWARDSHIP.md`)
- [ ] `clio_observer_signals` table live
- [ ] `observer_cluster_context` table live
- [ ] `cluster_prompt_versions` table live (prompt version history)
- [ ] `ObserverIntrospectionCycle` job registered in BullMQ
- [ ] `ObserverVetoWindowClose` job registered in BullMQ
- [ ] Platform Rules validation layer implemented in
      `observer-steward.ts`
- [ ] Observer Stewardship section live in admin dashboard
- [ ] Founder-scoped Observer view live in per-cluster admin dashboard

Observer's Channel 2 (finding-and-approve) ships independently and
has no dependency on the above. It is the foundation that Channel 1
is built on.

---

*Architecture · Phase 1 · 2026-05-24*
*Authoritative for the platform agency concept.*
*Subordinate to AGGILO_SOUL.md and AGGILO_PLATFORM_RULES.md.*
