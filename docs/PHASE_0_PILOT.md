# Phase 0 Pilot — current state and scope

> **Status:** Active. The production platform is described in
> `architecture/system_implementation_prompt_part1..6.md`. This document
> records the **pilot's** current state — what's running, what is a
> Phase 0 expedient, and what the production architecture says will
> replace each expedient.

---

## What Phase 0 is

Phase 0 is the period from first cluster launch through the moment the
platform proves multi-cluster behaviour end-to-end. **Phase 0 is not a
single-cluster product.** The platform exists to host:

- **Premium clusters** — admin-configurable. Sisters in Dua is the
  first; more are signed as partners onboard.
- **Generic clusters** — stock-template, used during Phase 0 to verify
  the registry, the resolver, and the cluster-vocabulary
  parameterisation before any second partner cluster ships in
  production.

Phase 0 ends when the platform supports self-serve cluster creation by
partners and when the architecture's "Phase 1 prerequisite" boxes (in
part 6 §42) are all checked.

---

## Live pilot clusters

| `cluster_id` | Type | Display name | Status |
|---|---|---|---|
| `the_single_source` | premium | Sisters in Dua | Live, real members, production-grade content |

This `cluster_id` is a legacy database identifier preserved across the
V3.x revisions for continuity. The display name lives at
`src/lib/prompts/clusters/sisters_in_dua/identity.ts`. The two are not
required to match; the registry decouples them.

## Planned pilot clusters

| `cluster_id` | Type | Display name | Status |
|---|---|---|---|
| `_test_generic_v1` | generic | (TBD) | Planned. Spun up to verify the multi-cluster registry, resolver, and vocabulary parameterisation end-to-end before any second partner cluster ships. |

When a Phase 0 pilot cluster is created, retired, or renamed, this
table is the record. Production architecture (parts 1–6) does not name
specific clusters.

---

## Phase 0 expedients

These are deliberate Phase 0 shortcuts that the production architecture
does not endorse. Each one carries a named Phase 1 replacement.

### Expedient: Clio ephemeral storage uses sessionStorage

Phase 0: Clio's "Just between us" tab persists messages in browser
`sessionStorage` with a 12-hour TTL. The platform observes only that a
session existed (count, welfare flag, duration); never the content.

Production architecture (part 5): ephemeral content lives in
**Redis** with a 12h TTL, server-side. Eliminates the loss-on-
browser-clear edge case and supports cross-device continuity.

Replacement gate: Phase 1, when the BullMQ + Redis worker tier ships.

### Expedient: Routes pass DEFAULT_CLUSTER_ID implicitly

Phase 0: Several routes in the cluster surface (Sage evaluate, Clio
chat, cadence-exchange, suggest-dua, introspection, welcome-new-member)
default to `the_single_source` when no `cluster_id` is provided in the
request body.

Production architecture (part 6 §34.4): routes accept `cluster_id`
from the request explicitly. Routes that cannot resolve a `cluster_id`
return 400, never fall back silently.

Replacement gate: Phase 1, when the second cluster ships and routes
must distinguish.

### Expedient: Cluster vocabulary inlined in per-cluster Sage / Clio fragments

Phase 0: The Sisters in Dua Sage fragment
(`src/lib/prompts/clusters/sisters_in_dua/sage.ts`) inlines literal
phrases like "this room", "Admin", "verified vault" — they are
correct for Sisters in Dua, but if the cluster's vocabulary changes
(e.g. an Urdu-primary-language cluster), the fragment edit replaces
them.

Production architecture (part 6 §35 + §42): cluster vocabulary
(`memberNoun`, `authorityNoun`, `collectiveNoun`, `primaryLanguage`)
is parameterised throughout the per-cluster Sage and Clio fragments,
read from `ClusterIdentity` at build time.

Replacement gate: Phase 1, when the second concrete cluster's
identity differs in vocabulary terms.

### Expedient: Atlas runtime via Vercel cron (not BullMQ)

Phase 0: Atlas's RSS curation + scoring runs on Vercel cron (hourly,
authenticated by `ATLAS_CRON_SECRET`). One Vercel function per tick.

Production architecture (part 5): Atlas runs as a Node.js BullMQ
worker on Railway, with Redis-backed queues and idempotent retries.

Replacement gate: Phase 1, when the worker tier infrastructure ships.

### Expedient: Manager appointment policy not enforced server-side

Phase 0: Premium clusters require at least one Manager once active
member count exceeds 25. Currently a documented requirement, not
machine-enforced.

Production architecture (`premium_cluster_requirements.md` §2.5):
machine-enforced. Above the threshold, admin actions that depend on
Manager presence (welfare assignment, Sage handoff routing) refuse
until a Manager is appointed.

Replacement gate: Phase 1, before the second premium cluster ships.

### Expedient: Single-language platform surfaces

Phase 0: All platform surfaces (cluster pages, FAB, share-line copy,
admin) are English. The pilot cluster's primary language is English.
The platform's cluster identity carries `primaryLanguage` (`"en"` for
the pilot) but the surfaces don't yet read it.

Production architecture (part 6 §34): surfaces respect
`primaryLanguage`. Share lines may emit in the cluster's primary
language. Sage's voice baseline names "plain modern English (or the
cluster's primary language)" explicitly.

Replacement gate: Phase 1, when a non-English cluster is signed.

---

## Phase 0 pilot decisions worth recording

These are decisions made during pilot operation that production
architecture should preserve.

- **Cluster `cluster_id` is stable across V3.x for the live pilot**
  (`the_single_source` for Sisters in Dua). Future clusters use new
  ids; existing live `cluster_id`s never get renamed.
- **The pilot validated the deterministic-templates pattern** for
  high-stakes member-facing first-impression copy (welcome new member,
  Sage→Clio handoff greeting). Production architecture (part 6 §36.2)
  carries this forward.
- **The pilot validated the validator-with-retry-and-degrade pattern**
  for structured-output prompts (cadence-exchange caught the V3.4
  member-blame bug at the regex layer; introspection adopted the same
  pattern in V3.11). Production architecture (part 6 §36.1) names this
  as the standard.
- **The pilot's prompt audit (Session C) found no critical or high
  failures** against the C1–C12 rubric. The medium-priority refactors
  shipped in V3.11. The findings are recorded permanently in
  `docs/PROMPT_AUDIT_RESULTS.md` and apply to every future prompt.

---

## Reading guide

- **Coding agents implementing platform features:** read
  `architecture/system_implementation_prompt_part6.md` first, then
  parts 1–5 with part 6 as the inheritance contract every other part
  operates under.
- **Coding agents working on the live pilot specifically:** also read
  this document. It tells you what the current pilot uses, what's a
  Phase 0 expedient (don't replicate it for new work), and what the
  Phase 1 replacement looks like.
- **Architecture readers from outside the team:** start with parts
  1–6 in order. Skip this document — it's pilot operational state, not
  architecture.

---

*Phase 0 pilot record · Created 2026-05-22 alongside V3.12 doc reorg.
Maintainer: rotates per pilot session.*


---

## Pilot cluster profile — Sisters in Dua

This is the filled-in cluster profile for the live pilot premium cluster. It implements the template defined in `architecture/premium_cluster_requirements.md` §6.

| Field | Value |
|-------|-------|
| `cluster_id` | `the_single_source` |
| Display name | Sisters in Dua |
| Domain | Faith — Muslim women navigating Islam in real life |
| Sage register | `community` — warm, present-tense, no emoji |
| Reference vocabulary | dua / ayah / hadith |
| Vault grading rules | Sahih / Hasan only; Da'if flagged with explanation; Mawdu rejected |
| Authority redirect language | "The Admin or a scholar you trust" |
| Geographic gate | India only (pilot expedient) |
| Beta disclosure | Shown to non-S/SE-Asia members |
| Manager profile | Practitioners and scholars from South and Southeast Asia |
| Demographic restrictions | Women only (pilot expedient) |
| Primary language | `en` |
| Member-facing chips | India, Women |

The pilot's identity file is `src/lib/prompts/clusters/sisters_in_dua/identity.ts`.

### Pilot operational constraints (currently active)

These are the constraints the pilot runs under today. Each is a Phase 0 expedient; Phase 1 lifts them.

- **India-only geographic gate** — enforced at onboarding (country selection).
- **Women-only gender gate** — enforced at onboarding (gender selection).
- **Vault-only references** — no Atlas live, no external source crawling. All references come from `dua_vault` until Atlas Phase 1 ships.
- **Single registered cluster in the registry** — second cluster (planned `_test_generic_v1`) not yet registered.
- **Hand-curated vault** — Admin adds duas via Supabase SQL Editor. Vault curation UI is on the Phase 1 roadmap.
- **Manual admin elevation** — Admin promotes themselves via SQL. Auto-elevation via `ADMIN_EMAILS` env is available but optional.

### Pilot's vault repetition protocol — current settings

The vault is small (10–60 entries at pilot launch). Repetition is a real risk. Settings:

- **14-day exclusion window** — a vault entry posted in the last 14 days is excluded from the eligible pool in `suggest-dua`.
- As the vault grows past 60 entries, the exclusion window may be shortened.
- At 180+ entries (pre-Ramadan target), the window can be reduced to 7 days.

The protocol's mechanics (vault-ID dedup map, pointer-reply path, Jaccard similarity guard) live in `architecture/system_implementation_prompt_part5.md` §33 — they are platform-wide and not pilot-specific. Only the threshold values above are pilot-tuned.

### What the pilot validates

The pilot is the validation environment for every agent behaviour, UX pattern, and closed-loop mechanism described in the architecture. As of V3.12 the pilot has validated:

| Behaviour | Validation status |
|---|---|
| Sage's decision framework (Steps 0–6) | ✅ Validated |
| Welfare protocol | ✅ Validated |
| Good-character protocol (Step 0.5) | ✅ Validated |
| Dua repetition guard | ✅ Validated |
| Workshop pipeline (cluster_features two-track) | ✅ Validated |
| Introspection cycle (Clio reads 7-day telemetry every 6h) | ✅ Validated |
| Hierarchy-first UX | ✅ Validated |
| Closed-loop telemetry | ✅ Validated |
| Admin dashboard | ✅ Validated |
| Multi-cluster registry | ⏳ Awaiting `_test_generic_v1` to verify end-to-end |
| Cluster vocabulary parameterisation | ⏳ Phase 1 prerequisite |

A new validation row is added each time the pilot exercises a new platform capability.