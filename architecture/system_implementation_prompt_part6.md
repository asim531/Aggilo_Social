# System Implementation Prompt — Part 6
## Multi-cluster prompt architecture, audit consolidation, and inheritance contract

> **Status:** Production architecture, current.
>
> **Scope:** This part consolidates V3.7–V3.12 architectural learnings into one place and supersedes any Phase 0 expedients still mentioned by name in parts 1–5. Coding agents implementing platform features should read this part before opening parts 1–5 — it sets the inheritance contract every other part now operates under.
>
> **Predecessor parts:** 1 (platform foundations), 2 (data model), 3 (orchestration), 4 (agent surfaces & UX), 5 (operations & lifecycle).
>
> **Authority over Phase 0 work:** The pilot cluster (`PHASE_0_PILOT.md` in docs/) implements this architecture as a working reference. Where a Phase 0 expedient differs from this part, the architecture wins; the expedient is a temporary scaffold to be retired.

---

## 33. The platform's character lives in one place

Aggilo's character — the soul, the safety floor, the voice baseline, the forbidden list, the empowered list, the one line — is a single canonical document loaded literally into every agent's system message stack. It is not restated per agent. It is not restated per cluster. It is inherited.

This is the inheritance contract:

```
Every agent LLM call:
  1. Platform super-prompt   (the immutable platform layer)
  2. Agent character          (Sage, Clio, Atlas, Scout, Observer — generic)
  3. Cluster identity         (per-cluster vocabulary + identity)
  4. Per-call signals         (welfare, character, @mention, vault, recent posts)
```

**Layer 1 — platform super-prompt.** The literal block defining the soul, the safety floor, the voice baseline, the forbidden list, the empowered list, the JSON contract conventions, the failure-handling baseline, and "the one line that cannot be crossed." Token budget ≤600. Loaded as the first system message of every LLM call without exception.

**Layer 2 — agent character.** Sage's decision framework (Steps 0–6), Clio's character + welfare response shape + ephemeral frame, Atlas/Scout/Observer's editorial register, the share-mode rules. Cluster-agnostic — every cluster on the platform receives the same agent character.

**Layer 3 — cluster identity.** Display name, tagline, description, demographic chips, anchor seed, member noun, authority terminology, primary language. Per-cluster, written once at cluster creation, edited only through admin UI.

**Layer 4 — per-call data.** Welfare/character/@mention signal notes; vault context; recent room posts as conversational context; the user's current message.

The contract is enforced structurally: the platform code's prompt builders prepend layers 1 and 2 from a single source of truth and stitch the cluster's layer 3 from a registry. A cluster cannot accidentally inherit the wrong voice baseline because the platform layer is loaded by the builder, not by the cluster.

---

## 34. Cluster types and the registry

Every cluster carries a `type`. Two types exist at the architectural level:

### 34.1 Generic clusters

Stock-template clusters anyone can spin up with default settings. Generic clusters use the platform's default member noun ("member"), default authority terminology ("Admin"), no demographic restrictions, and the platform's standard medium-involvement defaults. Self-serve clusters created by partners in production are generic until customised.

### 34.2 Premium clusters

Admin-customisable clusters. Premium clusters carry the same baseline as generic clusters and additionally expose:

- Agent involvement slider (low / medium / high)
- Free-text guidance field (parsed into structured directives by the validator agent)
- Enabled-skills catalogue (which optional capabilities run in the cluster)
- Per-cluster admin overrides for vocabulary, vault scope, and register

Premium-tier configurability never overrides the platform safety floor (Layer 1). Welfare detection, character detection, dignity invariants, and the no-protocol-disclosure rule are immutable across all clusters.

### 34.3 The cluster registry

Routes resolve a `cluster_id` to a cluster module via a single registry. Routes never import cluster-specific files. A new cluster is one new directory under `clusters/` plus one entry in the registry; an existing cluster removed is the inverse. Adding or removing a cluster never touches a route.

The registry's entries map `cluster_id → ClusterModule` where each module exports:

- `identity` — the canonical `ClusterIdentity` (displayName, tagline, description, chips, member noun, authority noun, primary language, seed posts)
- `sagePrompt` — Sage system prompt fragment specific to this cluster
- `clioClusterContext` — Clio cluster-mode context fragment specific to this cluster

Routes ask the registry for the module by `cluster_id`. The prompt builders stitch layers 1–3 into the LLM call.

### 34.4 Default cluster resolution

Production routes accept an explicit `cluster_id` on every request — from the post being evaluated, from the cluster page being served, from the admin action being audited. There is no platform-wide default cluster. Routes that cannot resolve a `cluster_id` return 400, never fall back silently.

(A `DEFAULT_CLUSTER_ID` constant exists for migration paths only and is removed once every route reads `cluster_id` from the request explicitly.)

---

## 35. The prompt source-code layout

```
src/lib/prompts/
├── platform/                              ← cluster-agnostic, every agent inherits
│   ├── super-prompt.ts                          AGGILO_SUPER_PROMPT_LITERAL
│   ├── sage-character.ts                        Sage character + decision framework
│   ├── clio-character.ts                        Clio character + welfare shape + ephemeral frame + dua review
│   └── share-mode.ts                            Share-line voice rules (cluster card + invite)
│
├── cluster-types/                         ← per-type defaults
│   ├── types.ts                                 Shared TS interfaces
│   ├── generic.ts                               Stock-template defaults
│   └── premium.ts                               Premium-tier defaults
│
├── clusters/                              ← concrete cluster implementations
│   └── <cluster_id>/
│       ├── identity.ts                          Display name, tagline, chips, seed posts, vocabulary
│       ├── sage.ts                              Cluster-specific Sage prompt fragment
│       ├── clio.ts                              Cluster-specific Clio context fragment
│       ├── index.ts                             Module entry point — exports ClusterModule
│       └── README.md                            Per-cluster doc
│
├── registry.ts                            ← cluster_id → cluster module resolver
├── sage-builder.ts                        ← stitches layers 1–4 for Sage
├── clio-builder.ts                        ← stitches layers 1–3 for Clio (cluster + ephemeral)
├── share-builder.ts                       ← stitches layers 1+share rules for share lines
└── README.md                              ← layout overview
```

**Editing rules:**

- Platform rules change in `platform/`. One edit, every cluster inherits.
- Cluster vocabulary changes in `clusters/<id>/identity.ts`. Only that cluster is affected.
- Adding a cluster never edits another cluster.
- A new cluster type lives in `cluster-types/<type>.ts` with the type-level defaults; concrete clusters declare their type and the resolver merges the type defaults under cluster-specific overrides.

---

## 36. The audit and the bad-example pattern

A platform-wide prompt audit (`docs/PROMPT_AUDIT_RESULTS.md`) evaluated all twenty-one platform prompts against a twelve-point rubric (C1 soul alignment through C12 drift defence). The findings produced three lasting architectural conclusions:

### 36.1 The cadence-exchange validator-with-retry-and-degrade pattern is the gold standard for structured output

When an agent produces JSON consumed by downstream code, the production pattern is:

1. **Prompt-level rejection examples.** A "Bad examples that have shipped before — do not produce these" block listing actual phrasings the model has slipped into and that have been retracted. Models recognise concrete drift patterns far more reliably than they follow abstract rules.
2. **Server-side regex validator.** After the LLM returns, a small set of regexes (e.g. `FORBIDDEN_SUBJECT_PATTERNS` for member-blame framing) checks the structured fields.
3. **One retry with hardened reminder.** On validator hit, retry the call once with an additional system message that names what was wrong and what the rules require.
4. **Degraded fallback on second failure.** If the retry also fails the validator, emit a fixed safe line (or set `observe_mode = true`) and log the failure to a behavioural-events table for offline review.

Every prompt that produces structured output downstream of the platform — cadence-exchange, introspection, suggest-dua, link unfurl, future Atlas/Scout outputs — follows this shape.

### 36.2 Deterministic templates for high-stakes member-facing first-impression copy

Two surfaces in the platform — new-member welcome and Sage→Clio handoff greeting — are explicitly **not** LLM-generated. They are deterministic templates picked by reason × stable-hash-of-id. The architectural argument is:

- The cost of a model going off-script during these moments is high (a wrong tone on a welfare handoff is irrecoverable).
- The value of personalisation is low (the surface is the introduction; personality emerges in the conversation that follows).

Carry this pattern forward. When the cost of model drift is high and the value of personalisation is low, choose templates. The cluster fit evaluator (Phase 1) and the free-text guidance validator (Phase 1) each carry templated fallback paths for when the LLM call fails or the verdict is uncertain.

### 36.3 Drift defence is structural, not procedural

Drift between agent prompts (the "21 ways to write the same rule" problem) is solved by inheritance, not by careful reading. Layer 1 lives in one file. Per-agent prompts that previously restated the voice baseline have had those restatements removed; they inherit instead. The token saving is real (~25–35% per call on refactored prompts) but the maintainability and correctness wins are larger: a rule changed in `platform/super-prompt.ts` is inherited by every agent at the next call. No 21-file sweep, no risk of one prompt drifting because someone forgot to update it.

---

## 37. Welfare/character precedence over @mention protocols

Member @mentions of an agent (e.g. "@Sage", "@Clio") trigger the agent's mention protocol, which in the absence of safety-floor signals requires a response. **The mention protocol is not absolute.** When welfare or character signals fire on the same message, the safety-floor protocol takes precedence, including the option of a public silence with a private agent handoff.

The signal note injected by the platform reads (paraphrased): "respond unless a higher-priority safety protocol explicitly authorises a different response shape; when welfare or character takes over, the protocol's response shape — including public [SAGE_SILENT] with private Clio handoff — supersedes the default 'always respond' rule."

Belt-and-braces enforcement: the application-layer welfare regex and character regex pre-filters fire independently of the LLM, so the safety floor lights up regardless of how the model reads the prompt.

---

## 38. Single source of truth for downstream classifiers

Where two routes need the same classification (link alignment is the canonical example), one endpoint owns the prompt and the other delegates. The duplicated-prompt pattern produces:

- Two places to edit when the rule changes (drift risk).
- Two observability trails (broken telemetry).
- Two budget paths (cost double-counting).

Production architecture: one classifier endpoint per classification task. Other routes that need the result POST same-origin to that endpoint and map the verdict onto their local data shape. Every classifier flows through the platform's observability layer (`llmCall()`); none reads `LLM_BASE_URL` or `LLM_API_KEY` directly.

---

## 39. Phase separation in the architecture corpus

Architecture parts 1–5 describe **how the production platform is built**. Phase 0 specifics (any pilot cluster running today, any session-by-session migration pace, any Phase 0 implementation expedients) live in `docs/PHASE_0_PILOT.md` — a single record per phase, not scattered through the architecture.

When a coding agent reads the architecture parts, it reads production architecture. When the same agent needs to know the current pilot's state, it opens the Phase 0 doc. The two are separated by file location, not by paragraph-by-paragraph reading.

This part (6) is the bridge: it captures the architectural learnings the pilot produced, in production language, with no MVP terminology. Whatever the pilot taught, lives here as architecture.

---

## 40. Inheritance contract for new agents

When a new agent is added to the platform (Atlas, Scout, Observer, cluster fit evaluator, free-text guidance validator), the contract is:

1. Create `platform/<agent>-character.ts` with the agent's cluster-agnostic register, decision framework, and bad-example block. Do **not** restate the platform safety floor, voice baseline, or forbidden list — those are inherited from layer 1.
2. If the agent is cluster-aware, add a cluster fragment file under each cluster directory (`clusters/<id>/<agent>.ts`).
3. Add the agent's builder to `prompts/<agent>-builder.ts` that stitches layers 1, 2, and (where applicable) 3, then appends per-call data.
4. Route the agent's LLM calls through `llmCall()`.
5. Add the agent's first-build rubric checks to `docs/PROMPT_AUDIT_RESULTS.md` against the same C1–C12 grid every existing prompt was audited against.

Agents added without following the contract drift. The audit pattern catches the drift; the inheritance contract prevents it.

---

## 41. What this part supersedes in parts 1–5

| Part | Section | Superseded by |
|---|---|---|
| 1 | Cluster identity hardcodes | §34 (cluster types + registry) |
| 1 | "MVP single-cluster" framing | §34.4 (no platform default; routes accept `cluster_id` explicitly) |
| 2 | Cluster-scoped vault (single-cluster path) | §34 plus §35 (registry resolves per-cluster) |
| 4 | Cluster-specific prompt examples inlined | §35 (per-cluster files in `clusters/<id>/`) |
| 4 | Inline voice rules in agent surfaces | §33 (super-prompt inheritance) |
| 5 | sessionStorage references in Clio surfaces | Phase 0 detail; production uses Redis (Phase 1 prerequisite captured in `PHASE_0_PILOT.md`) |
| 5 | "post-MVP" annotations | All such annotations are now Phase 1 prerequisites; pilot expedients live in `PHASE_0_PILOT.md` |

When a coding agent encounters a contradiction between this part and parts 1–5, this part wins. Parts 1–5 will be edited to remove the superseded content as the production codebase migrates off the pilot expedients.

---

## 42. Done criteria for "the architecture is current"

The platform's architecture corpus is current when:

- [x] Layer 1 lives in exactly one file, loaded by every agent builder.
- [x] Layer 2 (per-agent character) is cluster-agnostic and lives in `platform/`.
- [x] Cluster identity lives in exactly one file per cluster.
- [x] The cluster registry is the only resolver from `cluster_id` to module.
- [x] No prompt restates the soul, safety floor, voice baseline, forbidden list, or empowered list.
- [x] Every classifier task has one canonical endpoint.
- [x] Every LLM call flows through the observability layer.
- [x] Welfare and character precedence over @mention protocols is named explicitly in the prompt builder.
- [x] Bad-example blocks exist for every refactored prompt.
- [x] Phase 0 expedients are recorded once in `docs/PHASE_0_PILOT.md`, not duplicated through the architecture.
- [ ] Routes accept `cluster_id` from the request explicitly (Phase 1 prerequisite — `DEFAULT_CLUSTER_ID` removed).
- [ ] Cluster vocabulary (member noun, authority terminology) is parameterised throughout per-cluster Sage and Clio fragments (Phase 1 prerequisite — current per-cluster files still inline some literal vocabulary).
- [ ] The first-build rubric in `PROMPT_AUDIT_RESULTS.md` has been applied to every shipped agent (Atlas, Scout, Observer, cluster fit evaluator, free-text guidance validator on first ship).

Boxes that remain unchecked are the next sprint's scope.

---

*Part 6 — Created 2026-05-22. Authority: production architecture. Phase 0 specifics live in `docs/PHASE_0_PILOT.md`. When this part contradicts parts 1–5, this part wins.*
