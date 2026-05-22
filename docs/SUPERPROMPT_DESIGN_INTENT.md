# Super-Prompt Design Intent — Why the cosmology layer is in Layer 3

> **Status:** Authoritative design record. Do not "fix" the cosmology layer
> without reading this document and the founder/maintainer above you.
>
> **Authority:** Founder-level architectural decision. Recorded
> 2026-05-22 alongside V3.14.

---

## The decision in one paragraph

The Aggilo super-prompt's literal block carries three layers: universal
values, universal craft, and a specific cosmological framing
(monotheism). The third layer is **deliberate**. It was considered as a
trade-off (see senior-UX review notes) and the founder decision was to
keep it. This document records why, so that future coding agents,
maintainers, and partners do not interpret the cosmology layer as a bug
to abstract away.

---

## What the cosmology layer is

In `src/lib/prompts/platform/super-prompt.ts`, the literal block opens
with:

> *"You operate on Aggilo, a platform whose foundation is monotheistic
> — one originating source of all existence. You hold this orientation
> quietly. You never preach it. You never argue for it. Your purpose is
> to help people feel a deeper commonality with each other, without
> naming it, explaining it, or making it a sermon."*

This text is loaded as the first system message of every agent call,
on every cluster, regardless of cluster domain.

## What "the leak is part of the design" means

A senior-UX/behavioural review flagged that holding a specific
cosmology in every agent's context introduces leak risk — the model has
the substrate available even when the surface text is silent about it.
The review proposed moving the cosmology to a per-cluster identity
field so that a generic or non-faith cluster could declare its own
worldview.

The founder's response, summarised:

> *"The leak is part of the design and desirable at the appropriate
> time. Going forward we want members to ponder the credibility of
> their own choices."*

What this means architecturally:

1. **The cosmology is a substrate, not a message.** Agents do not
   surface monotheism in routine conversation. The "hold quietly,
   never preach, never argue" rules are immutable.
2. **Edge-case visibility is intended.** When the cosmology surfaces —
   a member explicitly asks, a thread reaches existential depth, an
   admin adjusts free-text guidance — the platform's foundation is
   visible *as foundation*, not as advocacy. The visibility itself is
   the design feature.
3. **The platform's long-game purpose includes inviting reflection.**
   Connection is the means; good and noble character is the end.
   Members eventually noticing the platform's foundation, and weighing
   their own choices against it, is consistent with that long game.
   The platform is not neutral about what makes a meaningful life. It
   refuses to perform neutrality.

## What this is NOT

- **Not a bug.** Coding agents reviewing the super-prompt should not
  refactor the cosmology line out without explicit founder approval.
- **Not a marketing posture.** This is a substrate, not a tagline. It
  is never marketed. It never appears on landing pages, partner sales
  decks, or onboarding screens.
- **Not proselytising.** The platform's existing rules forbid
  preaching, arguing, cross-tradition ranking, and cosmology-as-
  unprompted-message. Those rules remain immutable. The substrate
  exists *under* those rules, not despite them.

## Implications for partners and clusters

- **Faith-aligned partners** (e.g. the Sisters in Dua pilot): the
  cosmology aligns with cluster purpose. No friction.
- **Adjacent partners** (e.g. recovery, mentorship, scholarly
  communities where members may or may not share the substrate): the
  "hold quietly" rules ensure the cluster's surface remains domain-
  appropriate. The substrate is present in agent context but not in
  agent output unless invited.
- **Cosmologically-incompatible partners** (e.g. explicitly
  non-religious or polytheistic communities): the platform is not the
  right home for them. This is a deliberate boundary, not a gap. The
  platform team declines partnerships that would force the cosmology
  underground in a way that contradicts the substrate.

## How to read the literal block going forward

When reviewing the super-prompt:

- **Layer 1 — universal values** (connection-as-means, character-as-
  end, never-treating-humans-as-metric): edit freely with founder
  approval. These are the most general claims.
- **Layer 2 — universal craft rules** (no emoji, no sycophancy,
  service framing, dignity invariants): edit with caution. These are
  craft choices that have been tested.
- **Layer 3 — cosmological substrate** (monotheism, originating
  source, "hold quietly"): **do not edit** without explicit founder
  approval recorded in this document. The line carries the founder
  decision; subsequent edits update the record below.

## Decision history

| Date | Reviewer | Outcome |
|------|----------|---------|
| 2026-05-22 | Senior UX/behavioural review | Flagged cosmology layer as platform-vs-cluster trade-off; proposed moving to cluster identity. |
| 2026-05-22 | Founder | **Decision: keep in Layer 3.** Leak is part of the design; long-game intent is to invite member self-reflection. Substrate stays universal across clusters. Recorded in this document. |

## Who this document is for

- **Coding agents** refactoring the super-prompt: read this document
  before any edit to Layer 3. Treat it as inheritance.
- **Future maintainers** considering a cosmology-per-cluster
  refactor: do not proceed without re-opening this decision with the
  founder.
- **Partner-facing engineers** explaining the platform's substrate to
  a non-faith partner: this document records the architectural
  position. The conversation with the partner is a separate matter.

---

*Founder decision · 2026-05-22 · Architecturally binding · Reviewed
against AGGILO_SOUL.md and AGGILO_PLATFORM_RULES.md.*
