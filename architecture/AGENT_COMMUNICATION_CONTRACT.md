# Agent Communication Contract — Architecture

> **Status:** Architectural spec. Consolidates inter-agent communication
> patterns scattered across the per-agent AGENTS.md files into one
> normative contract.
>
> **Authority:** Subordinate to
> `architecture/system_implementation_prompt_part1..6.md` and to the
> per-agent SOULs and AGENTS files. This document does not override
> any agent's behaviour; it makes the runtime communication explicit
> so coding agents and partner engineers can read one document instead
> of five.

---

## Why this document exists

Per the senior-UX/behavioural review, the agent-to-agent communication
architecture was scattered across:

- `clio/AGENTS.md` (Clio orchestration)
- `sage/AGENTS.md` (Sage operations)
- `atlas/AGENTS.md` (Atlas as Sage's content layer)
- `scout/AGENTS.md` (Scout as Clio's intelligence layer)
- `observer/AGGILO_OBSERVER_AGENTS.md` (Observer as platform mirror)

Each file documents its own pairwise contract. None of them captures
the system shape: who talks to whom, in what direction, with what
output type, and what governance applies.

This document is that system shape.

---

## The agent hierarchy

```
                    Platform Rules + Admin-designated LLM
                                    │
                               proposes tools for
                                    ▼
                                 Observer  (platform mirror, 10 domains)
                                    │
                       proposes tools for / triggers
                                    ▼
                                  Clio  (orchestrator + member voice)
                                    │
                          briefs / introduces
                              ┌────┴────┐
                              ▼         ▼
                            Sage      Scout
                       (cluster        (community
                         anchor)       intelligence)
                              │
                          briefs
                              ▼
                            Atlas
                       (content layer)
```

**Key relationships:**

| Pair | Direction | Output type | Governance |
|------|-----------|-------------|------------|
| Observer → Clio | Tool proposals (Domain 10) | Markdown drafts in `maintenance/` | Admin approval before activation |
| Observer → Admin | Findings (10 domains) | Structured rows in `observer_findings` | Admin approval gates job triggers |
| Clio → Sage | Cluster context, member arc state | Conversation handoff metadata | Soul invariants + cluster config |
| Clio → Scout | Directed discovery jobs | Structured `ScoutDirectedJob` payload | Geographic + interest scoping |
| Clio → Member | Member-facing speech | Persona-keyed prompt builds | Persona governance + welfare floor |
| Sage → Clio | Soft handoff (welfare/disclosure/fiqh) | INSERT into `clio_handoff_greetings` | Deterministic templates only |
| Sage → Atlas | Content brief | Structured JSON brief (see Atlas spec) | Iterative dialogue, max 3 rounds |
| Sage → Member | Cluster-facing speech | Decision-tag-bounded LLM output | 7-step framework + super-prompt |
| Atlas → Sage | Content card batch | `cluster_content_card[]` | Quality gates + synthesis-mode flagging |
| Scout → Clio | Intelligence reports | Structured rows in `scout_intelligence_reports` | PII rules + 20-post rule |

---

## The five communication patterns

Every inter-agent communication on the platform is one of these five
patterns. New communication paths must be classified before they ship.

### Pattern 1 — Brief-and-iterate

**Used by:** Sage ↔ Atlas

**Shape:**
- Superior agent issues a structured JSON brief.
- Subordinate agent returns a structured response.
- Superior reviews and may issue refinement feedback.
- Iterate up to N rounds (Sage ↔ Atlas: max 3).
- After N rounds, superior makes final editorial decision.

**Why this pattern:** content fetch is non-deterministic; iteration
catches what one round cannot. The bounded-rounds rule prevents
runaway dialogue.

### Pattern 2 — Directed job

**Used by:** Clio → Scout

**Shape:**
- Calling agent submits a structured job payload to a queue.
- Worker agent runs the job in background, writes structured rows.
- Calling agent polls / subscribes to results.

**Why this pattern:** discovery is asynchronous; results are not
needed in the immediate conversation turn. Decoupling avoids blocking
the caller's surface.

### Pattern 3 — Soft handoff

**Used by:** Sage → Clio (welfare / disclosure / fiqh-with-distress)

**Shape:**
- Triggering condition fires (welfare regex, character regex, fiqh
  pattern with emotional weight).
- Triggering agent stays silent on the public surface (or replies in
  a tightly-bounded shape).
- Triggering agent INSERTs a deterministic-template greeting into a
  per-user channel.
- Receiving agent renders the greeting in a private surface.

**Why this pattern:** the highest-stakes member moments deserve
deterministic handling. No iteration, no dialogue, no LLM-improvised
copy. The handoff is a state transition, not a conversation.

### Pattern 4 — Finding-and-approve

**Used by:** Observer → Admin → (Clio | Sage | Scout | Atlas)

**Shape:**
- Observer detects a pattern across a domain.
- Observer writes a structured finding to `observer_findings`.
- Finding surfaces in admin dashboard with severity + suggested action.
- Admin approves or rejects.
- On approval, the corresponding job (or downstream agent's
  analysis) is triggered.

**Why this pattern:** the platform mirror's findings touch live cluster
behaviour. Human approval is the gate that prevents runaway autonomous
action. Per Principle 5 ("no human middleware"), the gate is binary
and quick — not a multi-step review.

### Pattern 5 — Tool proposal

**Used by:** Observer → Clio (Observer self-proposes); Clio → Sage,
Clio → Scout, Sage → Atlas (each agent proposes for its immediate
subordinate)

**Shape:**
- Trigger detected (Observer Domain 10, or downstream gap signal).
- Proposing agent runs analysis under Platform Rules + admin-
  designated LLM op (`tool_proposal_analysis`).
- Proposal written as a Markdown doc to `maintenance/[YYYY-MM]/`.
- Row inserted in `tool_proposals`.
- Admin approves or rejects.
- On approval, tool is activated for the target agent / cluster.

**Why this pattern:** capability extension is the most consequential
inter-agent action. It changes what an agent *can* do, not just what
it does today. The proposal-document layer makes the change auditable.

---

## The substrate every communication inherits

Regardless of pattern, every inter-agent communication inherits:

1. **The super-prompt's safety floor.** Welfare and character signals
   take precedence over any communication. An Atlas brief will be
   refused if it asks Atlas to retrieve content that violates the
   safety floor.
2. **The dignity invariants.** Subjects of agent dialogue are: the
   room, the room's capabilities, and the agents themselves. Never
   member behaviour. This rule applies to inter-agent surfaces visible
   to members (Workshop dialogue) AND to internal-only surfaces
   (briefs, findings, proposals).
3. **The observability layer.** Every LLM call routes through
   `llmCall()`. Every cost, latency, and decision lands in
   `llm_response_logs`.
4. **The protocol-disclosure rule.** Even in internal surfaces,
   agents do not disclose member-protocol mechanics in language a
   leak would expose. Tool proposals describe capability needs, not
   member behavioural triggers.

---

## Adding a new agent

When a new agent is proposed:

1. **Classify its principal.** Which agent is its immediate superior?
   The hierarchy diagram is the answer.
2. **Classify its primary communication pattern.** Brief-and-iterate?
   Directed job? Soft handoff? Finding-and-approve? Tool proposal?
   Most agents have a primary pattern and a secondary.
3. **Document its output type.** Structured row, JSON payload, queue
   message, deterministic-template insertion?
4. **Document its governance.** What rule set governs its decisions
   (super-prompt, soul, AGENTS, agent-specific platform rules)?
5. **Document its observability path.** Which `llm_response_logs`
   `agent` value? Which `operation_key`?

Five answers, one paragraph each. If the agent cannot be cleanly
classified into one of the five communication patterns, the agent's
spec is not ready.

---

## What this document does not include

- **The agent SOULs.** Each agent's character lives in
  `<agent>/SOUL.md`. This document does not duplicate them.
- **Per-agent decision frameworks.** Each agent's framework lives in
  `<agent>/AGENTS.md`. This document references them.
- **The runtime layer.** How jobs are queued, scheduled, and retried
  lives in `architecture/AGENT_RUNTIME.md` (planned alongside the
  Yantra → Agent Runtime rename).

---

*Architecture · 2026-05-22 · Authoritative for inter-agent
communication. Subordinate to per-agent SOULs and to the super-prompt.*
