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
>
> **2026-05-25 addition:** Pattern 7 (Cluster Intake Interpretation)
> added. New section "The Cluster Intake Pipeline" added. Hierarchy
> diagram and key relationships table updated to reflect the intake
> layer. See §Pattern 7 and §Cluster Intake Pipeline.
>
> **2026-06-05 addition:** Patterns 8 (Genesis Engine orchestration) and
> 9 (Feature signal flow) added. See §Pattern 8 and §Pattern 9.

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

**2026-05-25 addition — the intake gap:** Analysis of the first
real-world cluster request (Minds That Stay / Long Conversation,
submitted via waitlist form) revealed a structural gap: the
architecture specified what happens inside the platform once clusters
and members exist, but not what happens when a raw cluster signal
arrives and needs to be interpreted into a cluster spec. That
interpretation process — reading ambiguous signals, challenging
assumptions, producing a draft, running a second-pass adversarial
review, and presenting a versioned record for admin approval — was
entirely absent. Pattern 7 and the Cluster Intake Pipeline section
below close that gap.

---

## The agent hierarchy

> [!IMPORTANT]
> **Observer's position corrected (Phase 1).** Observer is not Clio's
> superior in any operational sense. Observer's principal is the
> platform's own rules and the human admin team — not any other agent.
> Observer has two output channels: autonomous stewardship (prompt
> layer updates with veto window) and finding-and-approve (unchanged).
> See `architecture/PLATFORM_AGENCY.md` for the full three-layer
> platform agency model.

```
AGGILO SOUL (Layer 1 — immutable, every LLM call)
        │
PLATFORM RULES + INHERITANCE CONTRACT (Layer 2)
        │
    Observer  ←── Platform Steward (not in member-facing hierarchy)
    │    │
    │    ├── Channel 1: Autonomous stewardship (Phase 1)
    │    │   Tier 1/2: prompt layer updates + veto window
    │    │   → observer/OBSERVER_STEWARDSHIP.md
    │    │
    │    └── Channel 2: Finding-and-approve (Tier 3, unchanged)
    │        → observer_findings → Admin Dashboard → job triggers
    │
    └── Welfare signals → Admin always (Channel 2, no autonomy)

CLUSTER INTAKE LAYER (pre-creation — Pattern 7)
    Intake Interpreter  ←── reads raw cluster signals from any source
        │
        ├── Source A: Waitlist form submission (aggilo.in)
        ├── Source B: Scout internet signal (demand detection)
        └── Source C: Clio inference (member behaviour patterns)
        │
        ▼
    Draft v1 (ClusterIntakeDraft)
        │
        ▼
    Adversarial Reviewer  ←── second-pass agentic challenge
        │
        ▼
    Draft v2 (ClusterIntakeRefined)
        │
        ▼
    Admin Dashboard (versioned record: v1 + v2 + diff)
        │
        ▼ (admin approves)
    ClusterCreationJob → cluster live → founder invite link

MEMBER-FACING AGENT HIERARCHY
    Clio  (orchestrator + member voice)
        │
        ├── Sage  (cluster anchor)
        │       └── Atlas  (content layer)
        └── Scout  (community intelligence)
```

**Key relationships:**

| Pair | Direction | Output type | Governance |
|------|-----------|-------------|------------|
| Observer → Admin | Findings (10 domains) | Structured rows in `observer_findings` | Admin approval gates job triggers |
| Observer → prompt layers | Autonomous updates (Phase 1) | `observer_prompt_updates` rows | Platform Rules validation + veto window |
| Observer → Clio Layer 4 | Observer signals (Phase 1) | `clio_observer_signals` rows (TTL-bounded) | Tier 1 autonomy + veto window |
| Observer → Clio (tool proposals) | Tool proposals (Domain 10) | Markdown drafts in `maintenance/` | Admin approval before activation |
| **Intake Interpreter → Adversarial Reviewer** | **Draft v1 cluster spec** | **`cluster_intake_drafts` row (v1)** | **Pattern 7 — agentic, no human in loop** |
| **Adversarial Reviewer → Admin** | **Refined cluster spec** | **`cluster_intake_drafts` row (v2) + diff** | **Admin approves → ClusterCreationJob** |
| **Scout → Intake Interpreter** | **Internet demand signal** | **`scout_intelligence_reports` row flagged `intake_candidate`** | **Pattern 7 trigger — Source B** |
| **Clio → Intake Interpreter** | **Member inference signal** | **`clio_intake_signals` row** | **Pattern 7 trigger — Source C** |
| Clio → Sage | Cluster context, member arc state | Conversation handoff metadata | Soul invariants + cluster config |
| Clio → Scout | Directed discovery jobs | Structured `ScoutDirectedJob` payload | Geographic + interest scoping |
| Clio → Member | Member-facing speech (outside cluster) | Persona-keyed prompt builds | Persona governance + welfare floor |
| Clio → Member (cluster-scoped FAB) | Private nudge based on public Timeline observation | Persona-keyed prompt builds + `timeline_state` in Layer 4 | Soul invariants + `private_tip_mechanic` rules — see `clio/CLIO_CLUSTER_HOST_CONTEXT.md` §11. Clio reads public Timeline posts; she never cross-references two members' private FAB conversations with each other. |
| Clio → Admin (cluster proposals) | Cluster proposals from Scout intelligence | Structured rows in `cluster_proposals` + distribution brief in `cluster_proposal_locations` | Admin approval gates `ClusterCreationJob` — Pattern 4 |
| Sage → Clio | Soft handoff (welfare/disclosure/fiqh) | INSERT into `clio_handoff_greetings` | Deterministic templates only |
| Sage → Atlas | Content brief | Structured JSON brief (see Atlas spec) | Iterative dialogue, max 3 rounds |
| Sage → Member | Cluster-facing speech | Decision-tag-bounded LLM output | 7-step framework + super-prompt |
| Atlas → Sage | Content card batch | `cluster_content_card[]` | Quality gates + synthesis-mode flagging |
| Scout → Clio | Intelligence reports (demand detection + niche discovery) | Structured rows in `scout_intelligence_reports` | PII rules + 20-post rule — triggers `ClioProposalGenerationJob` when `recommended_action` = cluster creation |
| **Genesis Engine → cluster_spec** | **Spec generation + validation** | **`cluster_specs` JSONB + `cluster_genesis_reports`** | **Pattern 8 — two-cycle validation with token budget** |
| **Genesis Engine → Observer** | **Drift / format coherence findings** | **`observer_findings` rows (Domain 3)** | **Pattern 8 output — triggers prompt refinement** |
| **Clio / Sage → feature_signals** | **Organic member need capture** | **`feature_signals` rows (k-anonymity)** | **Pattern 9 — Observer review → CIM intake** |
| **Observer → Evolution Governor** | **Composition inference / signal classification** | **`evolution_proposals` rows** | **Pattern 10 — urgency-based change proposals with dynamic capacity budget** |
| **Observer → Spawn Engine** | **Sub-community detection / linked cluster proposal** | **`cluster_spawn_proposals` rows** | **Pattern 11 — member-choice migration, never auto-enroll** |

---

## The eleven communication patterns

Every inter-agent communication on the platform is one of these eleven
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

### Pattern 6 — Autonomous stewardship (Phase 1)

**Used by:** Observer → prompt layers (Layers 2, 3, 4)

**Shape:**
- Observer's introspection cycle evaluates a cluster across five
  dimensions (purpose alignment, demographic fit, prompt quality,
  engagement quality, improvement potential).
- Observer proposes a specific, minimal, evidenced prompt update.
- Platform Rules validation layer checks the proposal against all
  immutable constraints.
- Minimality test confirms the change is the smallest intervention
  that addresses the gap.
- If both pass: Observer applies the change (Tier 1: immediately;
  Tier 2: at next agent cycle).
- Admin is notified via realtime push to Observer Stewardship dashboard.
- Admin has a veto window (30 minutes for Tier 1) to roll back.
- If no veto: change commits. If vetoed: change rolls back and
  escalates to Pattern 4 (finding-and-approve).

**Why this pattern:** prompt refinements have lower blast radius than
structural actions and are fully reversible. The veto window preserves
admin control without requiring approval for every routine update.
Welfare signals are never handled by this pattern — they always use
Pattern 4.

**Full specification:** `observer/OBSERVER_STEWARDSHIP.md` and
`observer/OBSERVER_INTROSPECTION_ENGINE.md`

### Pattern 7 — Cluster intake interpretation (added 2026-05-25)

**Used by:** Intake Interpreter → Adversarial Reviewer → Admin

**Shape:**
- A raw cluster signal arrives from one of three sources (see §Cluster
  Intake Pipeline for full source taxonomy).
- The Intake Interpreter reads the signal, resolves ambiguities, and
  produces a structured Draft v1: full AGGIL configuration, cluster
  name, description, Sage persona, Clio onboarding register, seed
  questions, Atlas content brief, Scout discovery brief, and an
  explicit list of interpretive assumptions made.
- Draft v1 is written to `cluster_intake_drafts` with `version: 1`
  and `status: pending_review`.
- The Adversarial Reviewer reads Draft v1 and challenges it: tests
  every interpretive assumption, checks for demographic bias, checks
  for name/framing fit, checks AGGIL configuration against the signal
  source, and produces a structured critique.
- The Intake Interpreter reads the critique and produces Draft v2:
  a revised spec that addresses every challenged assumption. Where
  the Interpreter disagrees with the critique, it states why and
  holds its position — the disagreement is recorded, not suppressed.
- Draft v2 is written to `cluster_intake_drafts` with `version: 2`
  and `status: awaiting_admin`.
- Both versions plus a structured diff are surfaced in the admin
  dashboard under "Cluster Intake Queue."
- Admin reviews the versioned record, may edit Draft v2 directly,
  and approves or rejects.
- On approval: `ClusterCreationJob` fires, cluster goes live, founding
  member receives invite link.
- On rejection: record is archived with rejection reason. No cluster
  is created.

**Why this pattern:** raw cluster signals — whether from a waitlist
form, Scout internet discovery, or Clio member inference — are
ambiguous. A single-pass interpretation produces wrong clusters (wrong
gender configuration, wrong framing, wrong name). The two-pass
agentic loop catches the errors that a single pass misses, without
requiring a human to do the interpretive work. The versioned record
gives admin a clear audit trail: what was the raw signal, what did
the first pass produce, what did the second pass challenge and change,
and what was finally approved. Every cluster created on the platform
has this record.

**The adversarial reviewer's mandate:** The Adversarial Reviewer is
not trying to reject clusters. It is trying to make them better. Its
job is to ask the questions a thoughtful human would ask if they were
reviewing the draft: *Is this the right gender configuration? Is the
name doing the right work? Is the AGGIL scope too narrow or too wide?
Are there interpretive assumptions that could be wrong?* It challenges
specifically, not generically. A challenge must name the assumption,
explain why it might be wrong, and propose an alternative. Vague
objections are not valid challenges.

**Bounded rounds:** The intake loop runs exactly two passes (v1 → v2).
It does not iterate further. If the Adversarial Reviewer's critique
is not fully resolved in v2, the unresolved items are flagged in the
diff for admin attention. The loop does not run a third time
autonomously — that would risk circular refinement with no convergence.

**The closing surface — founding-member feedback:** Pattern 7 has a
human-facing closing step. After the cluster is created and the
founding member arrives via their invite link, Clio offers them a
chance to validate the room before they settle in. This closes the
interpretive loop with the actual person whose request produced the
cluster — the only correct judge of whether the two-pass
interpretation hit the mark.

**UX requirements for the closing surface:**

1. **User-invoked, never auto-firing.** A persistent badge in cluster
   chrome ("Clio has a note for you") opens the modal on click. No
   timer-based surfacing. Auto-firing modals on entry compete with
   the room itself for attention; the room is the experience.
2. **Re-openable until explicit response.** "Not now" closes the
   modal but leaves the badge visible. Only an explicit response
   chip (accept / mostly-right / structural change) stamps
   `close_reason`. The badge stays visible across visits until then.
3. **Explicit loading states for the LLM round-trip.** Five-phase
   model: `opening` → `ready` → `sending` → `ack` → `badge_offer`,
   with a friendly retry message on network failure. Without these,
   slow networks make the UI feel broken.
4. **One-shot interaction.** One open prompt, one response cycle, then
   step back. Tier-1 changes (description, seed questions, Sage
   register) are routed to admin in Phase 0; in Phase 1, Clio applies
   them autonomously per the Observer stewardship contract. Structural
   changes (AGGIL, name, type, tools) are queued for admin in any
   phase.
5. **Founder badge offer is a fourth state.** After the conversation
   closes, Clio offers the founder a small `✦ Founder` chip next to
   their nickname. Opt-in, dismissible later, never automatic.

The Tier-1 stewardship pathway lets Clio apply small
copy/seed-question/Sage-register adjustments autonomously (Phase 1);
structural changes (AGGIL, name, type, tools) are queued for admin
within 48h in any phase. Source-A clusters always show this prompt
to the founding member; Source-B/C/D clusters either have no founding
member (B, C) or a self-selected one whose context Clio captured
during the AMA flow (D). For all of them, the closing surface is the
same: did we get it right?

**Full founding-feedback specification:**
`docs/AMA_CLUSTER_CREATION_AND_FOUNDING_FEEDBACK.md` Part 1.

**Full specification:** `docs/CLUSTER_INTAKE_PIPELINE.md`
(to be created — this pattern entry is the authoritative summary).

---

### Pattern 8 — Genesis Engine orchestration (added 2026-06-05)

**Used by:** Genesis Engine ↔ cluster lifecycle (pre-creation, creation, post-launch)

**Shape:**
- **Cycle A (Spec Generation):** Intake questionnaire responses (`cluster_intent_responses`) + cluster draft → Genesis Engine generates `cluster_genesis_spec` (JSONB) → introspection validates against platform rules → stored in `cluster_specs`
- **Cycle B (Creation Validation):** Live cluster state diffed against spec → low-risk gaps auto-remediated → medium/high-risk gaps surfaced to admin
- **Post-launch monitor:** Weekly drift detection → if drift changes demographics, proposes NEW cluster instead of modifying existing

**Token budget enforcement:**
- Every Genesis operation has a hard token cap (Standard: 52K tokens / 6 calls; Elevated: 104K / 12; Maximum: 156K / 18)
- Budget exhaustion → admin escalation with 7-day response window
- No nested introspection, no budget borrowing across clusters

**Why this pattern:** Cluster creation is the highest-stakes configuration moment. A poorly configured cluster degrades member experience for everyone inside it. The Genesis Engine automates the expertise that would otherwise require a senior platform admin to review every new cluster. The two-cycle design (generate → validate) catches spec errors before members arrive.

**Full specification:** `architecture/CLUSTER_GENESIS_ENGINE.md`

---

### Pattern 9 — Feature signal flow (added 2026-06-05)

**Used by:** Clio / Sage → `feature_signals` → Observer → CIM

**Shape:**
- **Capture:** Clio records organic member needs during natural conversation (never solicits). Sage infers needs from cluster-wide patterns. Both write to `feature_signals` with `signal_type`, `scope`, `feature_hash` for deduplication.
- **Privacy gate:** Individual signals (with user_id) are never shown to humans or agents. Only aggregated signals (frequency ≥ 3 OR cluster ≥ 8 members) are surfaced.
- **Observer review:** Dimension 9 (Ecosystem Spec Mismatch Detection) — Observer reviews signals monthly for platform rule compliance. Checks: no rule violation, safe to aggregate, no protocol disclosure.
- **CIM intake:** Approved signals feed into Cluster Intelligence Modules for evaluation. CIM decides whether to propose tools, workflow changes, or cluster configuration adjustments.

**Why this pattern:** Feature requests from members are the most valuable product input, but they are also the most privacy-sensitive. This pattern captures them organically, protects individual privacy via k-anonymity, and routes them through governance (Observer) before they influence cluster behavior.

**Full specification:** `architecture/AGENTIC_FEATURE_SIGNALS.md`

---

### Pattern 10 — Evolution proposal (added 2026-06-06, updated 2026-06-07)

**Used by:** Observer → [Genesis Re-Eval Gate] → Evolution Governor → Admin → Agents

**Shape:**
- **Detect:** Observer continuously monitors cluster signals (engagement, feedback, content themes) and classifies each into urgency tiers (Tier 1–4).
- **Spec-mismatch check:** Observer Dimension 9 (Ecosystem Spec Mismatch Detection) evaluates whether signals indicate a **framework-level** problem (e.g., `learning_management` cluster has become `emotional_support` in practice). If confidence ≥ 0.70, the finding is escalated to Genesis Re-Eval instead of standard Evolution routing.
- **Genesis Re-Eval (interception):** Genesis evaluates whether the ecosystem type itself is still valid. Outputs: `no_change`, `soft_pivot`, `hard_pivot`, or `spawn_recommended`. Hard pivots require admin approval; high-disruption hard pivots require member poll.
- **Standard classify:** Non-spec-mismatch signals are evaluated for evidence strength, confidence, and jarring-ness (how disruptive to members).
- **Propose:** Evolution Governor generates an `evolution_proposal` with cost, tier, and evidence. Low-cost, high-confidence proposals may auto-execute (Tier 1/2). Others queue for admin approval.
- **Communicate:** Agent tells members what changed and why, inviting feedback. Hard pivots use the 6-step autism-safe communication protocol (acknowledge → state → change → preserve → invite → opt-out).
- **Monitor:** Outcome is tracked for 7 days. If worsened, reversal is proposed.

**Why this pattern:** Clusters are living systems. Static configuration degrades member experience over time. This pattern allows clusters to adapt — fast when evidence is strong (crisis), gently when evidence is weak (background drift) — while keeping members informed and preserving admin oversight. The Genesis Re-Eval gate ensures the platform does not optimize within a broken framework.

**Full specification:** `architecture/EVOLUTION_GOVERNOR.md` and `architecture/CLUSTER_GENESIS_ENGINE.md` §10

---

### Pattern 11 — Cluster spawn proposal (added 2026-06-06)

**Used by:** Observer → Spawn Engine → Admin → Members (choice)

**Shape:**
- **Detect:** Observer Dimension 7 (Composition Inference) monitors for sub-community signals: recurring sub-topics, stakeholder divergence, tone friction.
- **Evaluate:** Spawn Engine evaluates whether the sub-group's needs are meaningfully different from the parent cluster.
- **Propose:** If distinct, a `cluster_spawn_proposal` is generated with link type (sequel/spinoff/sibling), inferred composition, and migration path.
- **Approve:** Admin reviews and approves/rejects.
- **Notify:** Relevant members receive invitation via Clio DM. They choose: stay, join new, or both. Never auto-enrolled.

**Why this pattern:** A cluster that tries to serve too many distinct needs degrades for everyone. Spawning allows sub-communities to flourish in their own space while preserving the parent cluster's integrity. Member choice is absolute.

**Full specification:** `architecture/CLUSTER_SPAWN_ENGINE.md`

---

## The Cluster Intake Pipeline

> **Added 2026-05-25.** This section specifies the full lifecycle of
> a cluster signal from raw input to live cluster. It is the
> operational detail behind Pattern 7.

### Signal sources

A cluster signal can arrive from three sources. All three feed the
same intake pipeline. The source is recorded in
`cluster_intake_drafts.signal_source` and shapes how the Intake
Interpreter reads the signal.

| Source | What arrives | How it enters the pipeline |
|--------|-------------|---------------------------|
| **A — Waitlist form** | Structured form submission from aggilo.in: name (nickname), email, birth year, life cohort, gender, languages, interest domain, location (GPS + city), gathering sought (self-description), duration of search, platforms tried, form version, submitted_at | Webhook → `cluster_intake_signals` INSERT → `ClusterIntakeJob` dispatched |
| **B — Scout internet signal** | `scout_intelligence_reports` row with `recommended_action = 'cluster_creation'` and `intake_candidate = true` — Scout has detected a demand pattern on the internet (Reddit threads, Twitter/X clusters, news trends, search volume) that maps to an unmet need in Aggilo's AGGIL space | Scout worker flags the row → `ClusterIntakeJob` dispatched |
| **C — Clio member inference** | Pattern detected across ≥3 separate member FAB conversations within 30 days: members are describing a need that no existing cluster serves. Clio writes a `clio_intake_signals` row with the pattern summary, the member count, and the inferred AGGIL profile (PII-free — no individual member data) | Clio worker writes row → `ClusterIntakeJob` dispatched |

**Source A is the highest-signal source.** A human submitted a form.
They named their life cohort, their gender, their location, their
search duration, the platforms they tried. Every field is a signal.
The Intake Interpreter reads them with interpretive intelligence, not
as a mechanical mapping.

**Source B is the broadest signal.** Scout has found a pattern on the
internet. The signal is demographic and topical, not individual. The
Intake Interpreter must infer the AGGIL configuration from the
pattern, which requires more assumption-making than Source A. The
Adversarial Reviewer's challenge is correspondingly more important
for Source B clusters.

**Source C is the most contextually rich signal.** Clio has been
talking to real members. The pattern she detected is grounded in
actual human expression. But it is also the most privacy-sensitive
source — the Intake Interpreter must work from Clio's PII-free
summary, never from individual member data.

---

### The Intake Interpreter's job (Draft v1)

The Intake Interpreter reads the raw signal and produces a complete
cluster spec. It does not produce a partial spec or a list of
questions. It makes decisions — and it records every decision as an
explicit interpretive assumption.

**Draft v1 must contain:**

```json
{
  "signal_source": "waitlist_form | scout_signal | clio_inference",
  "signal_id": "uuid of the source row",
  "cluster_name": {
    "proposed": "string",
    "rationale": "why this name — what it centres, what it filters"
  },
  "cluster_description": {
    "public_facing": "string — the description members will see",
    "internal_thesis": "string — what this cluster is actually for"
  },
  "aggil": {
    "age_birth_year_range": [int, int],
    "age_rationale": "string",
    "gender": "all | male | female | male+female | male+nonbinary | female+nonbinary",
    "gender_rationale": "string",
    "geography": "string — named location, regional scope, or GPS+landmark",
    "geography_rationale": "string",
    "interest_tags": ["string"],
    "interest_rationale": "string",
    "language_primary": "string",
    "language_rationale": "string"
  },
  "sage_persona": {
    "register": "academic | casual | professional | community | neutral | intimacy",
    "formality": 0.0,
    "tone_description": "string — how Sage sounds in this cluster",
    "key_behaviours": ["string — specific things Sage does or does not do"],
    "first_post_acknowledgment": "string — exact text"
  },
  "clio_onboarding": {
    "persona_in_use": "momentum | campus | anchor | explorer",
    "persona_modifier": "string — any cohort-specific softening or sharpening",
    "hook_message": "string — Clio's first message to a matched member",
    "sage_introduction": "string — how Clio introduces Sage before entry"
  },
  "seed_questions": ["string — 3 to 5 questions placed before first member post"],
  "atlas_content_brief": {
    "tool_name": "string",
    "sources": ["string"],
    "rationale": "string"
  },
  "scout_discovery_brief": {
    "tool_name": "string",
    "target_profile": "string — who Scout is looking for",
    "calibration_notes": "string — any gender balance or demographic weighting"
  },
  "interpretive_assumptions": [
    {
      "field": "string — which field this assumption affects",
      "assumption": "string — what was assumed",
      "signal_basis": "string — what in the raw signal led to this assumption",
      "alternative_reading": "string — what else the signal could mean",
      "confidence": "high | medium | low"
    }
  ],
  "welfare_sensitivity": "standard | elevated | high",
  "welfare_rationale": "string"
}
```

**The interpretive assumptions block is mandatory.** Every non-obvious
decision must be recorded as an assumption with its signal basis and
its alternative reading. This is what the Adversarial Reviewer reads.
A Draft v1 with no interpretive assumptions is a red flag — it means
the Interpreter made decisions without acknowledging they were
decisions.

---

### The Adversarial Reviewer's job (challenge → Draft v2)

The Adversarial Reviewer reads Draft v1 and produces a structured
critique. It then passes the critique back to the Intake Interpreter,
which produces Draft v2.

**The Adversarial Reviewer challenges on five dimensions:**

| Dimension | What it checks |
|-----------|---------------|
| **Demographic bias** | Did the Interpreter default to a demographic assumption not supported by the signal? (e.g. assuming women-only when the signal said "intimacy") |
| **AGGIL scope** | Is the age range, gender filter, and geography right for the cluster's purpose? Too narrow? Too wide? The U-shaped scoring model applies — hyper-narrow and fully global both score high; the muddled middle scores low. |
| **Name/framing fit** | Does the cluster name centre the right thing? Does it work in Clio's mouth? Does it filter correctly — attracting the right people and letting the wrong ones self-select out? Is it dramatic, cold, too professional, too casual? |
| **Purpose clarity** | Is the internal thesis clear? Is the public description honest about what the cluster is and is not? |
| **Assumption validity** | For each interpretive assumption in the v1 block: is the confidence rating correct? Is the alternative reading plausible enough to warrant a different decision? |

**The critique format:**

```json
{
  "challenges": [
    {
      "dimension": "demographic_bias | aggil_scope | name_framing | purpose_clarity | assumption_validity",
      "field_affected": "string — which Draft v1 field this challenges",
      "challenge": "string — specific, not generic. Names the problem.",
      "proposed_alternative": "string — what the field should say instead",
      "severity": "blocking | significant | minor"
    }
  ],
  "confirmed_correct": ["string — fields the Reviewer explicitly confirms are right"],
  "overall_assessment": "string — one paragraph summary"
}
```

**Blocking challenges must be resolved in Draft v2.** Significant
challenges should be resolved unless the Interpreter has a specific
reason to hold its position (which must be recorded). Minor challenges
are advisory.

**Draft v2** is the Intake Interpreter's response to the critique.
It contains the same structure as Draft v1, plus:

```json
{
  "v1_to_v2_changes": [
    {
      "field": "string",
      "v1_value": "string",
      "v2_value": "string",
      "change_reason": "string — which challenge prompted this change"
    }
  ],
  "held_positions": [
    {
      "challenge_field": "string",
      "reason_held": "string — why the Interpreter did not change this"
    }
  ]
}
```

---

### The admin dashboard view

Both versions are surfaced in the admin dashboard under
**"Cluster Intake Queue"** as a single record per intake signal.

The record shows:
- Signal source and raw signal data
- Draft v1 (full spec)
- Adversarial Reviewer critique (full)
- Draft v2 (full spec)
- Structured diff: every field that changed between v1 and v2, with
  the challenge that prompted the change
- Held positions: every challenge the Interpreter did not act on,
  with its reason
- Admin action buttons: **Approve as-is** | **Edit and approve** |
  **Reject**

**Edit and approve** opens Draft v2 for direct admin editing before
the cluster is created. The admin's edits are recorded as a v3 in
`cluster_intake_drafts` with `version: 3, edited_by: admin`.

**On approval:** `ClusterCreationJob` fires with the approved spec.
The cluster is created. The founding member (Source A: the form
submitter; Source B: no founding member — cluster is open; Source C:
no founding member — cluster is open) receives an invite link via
email.

**On rejection:** The record is archived with the admin's rejection
reason. No cluster is created. If the signal was Source A (a real
person submitted a form), a rejection acknowledgment is sent to their
email: *"We received your request. We're not creating this cluster
right now — [reason if shareable]. We'll keep your details and reach
out if something changes."*

---

### Database schema

```sql
-- Raw intake signals (one row per incoming signal, any source)
CREATE TABLE cluster_intake_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_source VARCHAR(32) NOT NULL,
  -- 'waitlist_form' | 'scout_signal' | 'clio_inference'
  source_ref_id UUID,
  -- FK to waitlist_submissions, scout_intelligence_reports,
  -- or clio_intake_signals depending on source
  raw_signal JSONB NOT NULL,
  -- Full raw payload from the source
  status VARCHAR(32) DEFAULT 'pending',
  -- 'pending' | 'processing' | 'drafted' | 'approved' | 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Versioned cluster specs produced by the intake pipeline
CREATE TABLE cluster_intake_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_signal_id UUID NOT NULL REFERENCES cluster_intake_signals(id),
  version SMALLINT NOT NULL,
  -- 1 = Intake Interpreter output
  -- 2 = post-Adversarial-Reviewer output
  -- 3 = admin-edited (if admin edits before approval)
  authored_by VARCHAR(32) NOT NULL,
  -- 'intake_interpreter' | 'intake_interpreter_v2' | 'admin'
  spec JSONB NOT NULL,
  -- Full ClusterIntakeSpec as defined above
  adversarial_critique JSONB,
  -- Populated on version 2 rows — the full critique that produced v2
  v1_to_v2_changes JSONB,
  -- Populated on version 2 rows — structured diff
  held_positions JSONB,
  -- Populated on version 2 rows — challenges not acted on
  status VARCHAR(32) DEFAULT 'draft',
  -- 'draft' | 'pending_review' | 'awaiting_admin' | 'approved' | 'rejected'
  admin_decision_at TIMESTAMPTZ,
  admin_decision_by UUID REFERENCES profiles(id),
  admin_rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PII-free Clio inference signals (Source C)
CREATE TABLE clio_intake_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_summary TEXT NOT NULL,
  -- What Clio observed — no individual member data
  member_count INT NOT NULL,
  -- How many separate conversations showed this pattern
  inferred_aggil JSONB NOT NULL,
  -- PII-free AGGIL profile inferred from the pattern
  observation_window_days INT DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Waitlist form submissions (Source A)
CREATE TABLE waitlist_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname VARCHAR(64),
  email VARCHAR(256) NOT NULL,
  birth_year SMALLINT,
  life_cohort VARCHAR(64),
  gender VARCHAR(16),
  languages TEXT[],
  interest_domain VARCHAR(128),
  location_gps POINT,
  location_city VARCHAR(128),
  gathering_sought TEXT,
  search_duration VARCHAR(64),
  platforms_tried TEXT[],
  form_version VARCHAR(16),
  submitted_at TIMESTAMPTZ NOT NULL,
  intake_signal_id UUID REFERENCES cluster_intake_signals(id),
  -- Populated when the intake pipeline picks this up
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: cluster_intake_drafts readable by platform_admin only
CREATE POLICY "platform_admin_reads_intake_drafts"
  ON cluster_intake_drafts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'platform_admin'
    )
  );

-- RLS: waitlist_submissions readable by platform_admin only
CREATE POLICY "platform_admin_reads_waitlist"
  ON waitlist_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'platform_admin'
    )
  );

-- RLS: clio_intake_signals readable by platform_admin only
CREATE POLICY "platform_admin_reads_clio_signals"
  ON clio_intake_signals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'platform_admin'
    )
  );
```

---

### BullMQ jobs

| Job | Lane | Trigger | SLA |
|-----|------|---------|-----|
| `ClusterIntakeJob` | medium | INSERT on `cluster_intake_signals` | <2min p95 — produces Draft v1 |
| `ClusterAdversarialReviewJob` | medium | Draft v1 written (`status: pending_review`) | <2min p95 — produces critique + Draft v2 |
| `ClusterCreationJob` | medium | Admin approves Draft v2 (or v3) | <30s p95 — creates cluster, sends invite |
| `WaitlistRejectionNotification` | low | Admin rejects Source A signal | <5min p95 — sends email to submitter |

---

### The founding member invite link

When a Source A cluster is approved and created:

1. The cluster is created with `arc_phase: A`.
2. A unique invite link is generated: `aggilo.in/join/<cluster_slug>?ref=<intake_signal_id>`.
3. The invite link is emailed to the waitlist submitter's email address.
4. The email is plain, warm, and specific — it references the cluster
   name and one sentence about what the cluster is for. It does not
   explain the intake process or reference the form submission.
5. The submitter clicks the link, registers (or logs in), and is
   auto-joined to the cluster as the founding member.
6. Clio's onboarding for this cluster fires immediately on join,
   using the `clio_onboarding` spec from the approved Draft.

For Source B and Source C clusters, there is no founding member.
The cluster is open and discoverable via AGGIL matching. Scout's
discovery brief fires immediately to begin populating it.

---

### What this pipeline does NOT do

- **Does not create clusters without admin approval.** The two-pass
  agentic loop is fully autonomous, but the final gate is always
  human. No cluster goes live without an admin approving the spec.
- **Does not expose individual member data.** Source C signals are
  PII-free summaries. The Intake Interpreter never sees individual
  member FAB conversations.
- **Does not run more than two agentic passes.** The loop is bounded.
  Unresolved challenges are flagged for admin, not iterated further.
- **Does not guarantee cluster creation.** Admin can reject any spec.
  The pipeline produces the best possible spec; it does not override
  human judgment.

---

*Cluster Intake Pipeline · added 2026-05-25 · Authoritative for the
pre-creation cluster interpretation process. Full implementation spec
to be written in `docs/CLUSTER_INTAKE_PIPELINE.md`.*

---

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
classified into one of the eleven communication patterns, the agent's
spec is not ready.

---

## What this document does not include

- **The agent SOULs.** Each agent's character lives in
  `<agent>/SOUL.md`. This document does not duplicate them.
- **Per-agent decision frameworks.** Each agent's framework lives in
  `<agent>/AGENTS.md`. This document references them.
- **The runtime layer.** How jobs are queued, scheduled, and retried
  lives in `architecture/AGENT_RUNTIME.md`.
- **Observer's stewardship mechanics.** Three-tier autonomy, veto
  windows, prompt update schema, and the introspection engine live in
  `observer/OBSERVER_STEWARDSHIP.md` and
  `observer/OBSERVER_INTROSPECTION_ENGINE.md`.
- **The platform agency concept.** The three-layer model (Soul /
  Platform Rules / Observer) lives in `architecture/PLATFORM_AGENCY.md`.
- **The Scout → Clio distribution engine.** The full lifecycle from
  Scout niche discovery through Clio cluster proposal, admin review,
  cluster creation, and distribution placement intelligence lives in
  `docs/SCOUT_CLIO_DISTRIBUTION_ENGINE.md`.
- **The Cluster Intake Pipeline full implementation spec.** The
  Pattern 7 summary and the pipeline section above are authoritative.
  The full implementation spec — prompt templates for the Intake
  Interpreter and Adversarial Reviewer, admin dashboard UI spec,
  email templates, and BullMQ worker implementation detail — lives in
  `docs/CLUSTER_INTAKE_PIPELINE.md` (to be created).

---

*Architecture · 2026-05-25 · Authoritative for inter-agent
communication. Subordinate to per-agent SOULs and to the super-prompt.
Pattern 7 (Cluster Intake Interpretation) and the Cluster Intake
Pipeline section added 2026-05-25.*
