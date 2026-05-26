# Phase 0 — Pilot Workspace

> **What lives here:** Everything tied to the Phase 0 pilot run —
> the two pilot cluster apps, their cluster-specific specs, the
> Phase 0 deployment guide, and the design docs for in-pilot product
> features (founding feedback, AMA cluster creation) that are
> implemented as part of the pilot but graduate to the main product
> later.
>
> **What does NOT live here:** Anything describing the production
> platform — agent souls (`/clio`, `/sage`, `/atlas`, `/scout`,
> `/observer`, `/yantra`), platform contracts (`/architecture`),
> agent behavioural specs (`/docs`), platform constants
> (`AGGILO_SOUL.md`, `AGGILO_PLATFORM_RULES.md`), and the marketing
> site at `/launch`. Those are product, not pilot.

---

## Folder layout

```
phase0/
├── README.md          ← this file
├── lc/                ← Long Conversation cluster app (Next.js 14)
├── mvp/               ← Sisters in Dua cluster app (Next.js 14)
├── clusters/          ← Cluster-specific specs for the pilot
│   ├── long_conversation/
│   │   ├── CLUSTER_DESCRIPTION.md
│   │   ├── CLIO_ONBOARDING.md
│   │   ├── CLUSTER_TOOLS.md
│   │   └── SAGE_PERSONA.md
│   └── the_single_source/
│       ├── CLUSTER_DESCRIPTION.md
│       ├── CLIO_ONBOARDING.md
│       ├── CLUSTER_TOOLS.md
│       └── SAGE_PERSONA.md
└── docs/              ← Phase-0 implementation/operations docs
    ├── DEPLOYMENT_AGGILO_IN_REWRITE.md   pilot deployment guide
    └── AMA_CLUSTER_CREATION_AND_FOUNDING_FEEDBACK.md
                                          stub → docs/AMA_CLUSTER_CREATION_AND_FOUNDING_FEEDBACK.md
                                          (the spec graduated to main product
                                          because founding feedback applies to
                                          every cluster, not just the pilot)
```

> **Note on naming.** The pilot apps follow a `phase0/<slug>/`
> convention. Two apps currently exist:
>
> - `phase0/lc/` — **Long Conversation** cluster
> - `phase0/mvp/` — **Sisters in Dua** cluster
>
> The `phase0/mvp/` folder is named `mvp` for historical reasons —
> it was the first pilot app, built before the multi-cluster pattern
> existed, and `mvp.aggilo.in` is its production URL. The `mvp` here
> is not a generic label for "the pilot folder"; it is the specific
> name of the Sisters in Dua deployment. New pilot clusters get a
> real slug (e.g. `phase0/study/`, `phase0/builders/`), not "mvp".
>
> The cluster's full identifier inside Supabase is
> `the_single_source` — that is the value of `cluster_id` on every
> row, and the folder name in `phase0/clusters/the_single_source/`.
> "MVP" is just the deployment shorthand.

---

## Why a separate folder

Phase 0 is the pilot — manual operations, single-tenant Vercel
deploys, hand-curated cluster specs for two pilot rooms. The
production platform (Phase 1+) is a different engineering shape:
React PWA + Fastify API + BullMQ workers + Observer stewardship +
intake pipeline. Mixing the two led to drift and to ambiguity about
which document was canonical for what.

The rule going forward:

| Concern | Where it lives |
|---|---|
| Pilot cluster apps + specs + ops | `phase0/` |
| Agent souls + skills | `clio/`, `sage/`, `atlas/`, `scout/`, `observer/`, `yantra/` |
| Platform architecture + contracts | `architecture/` |
| Agent behavioural specs (cross-cluster) | `docs/` |
| Production marketing site | `launch/` |
| Platform constants | root (`AGGILO_SOUL.md`, `AGGILO_PLATFORM_RULES.md`, etc.) |

The marketing site stays at `launch/` because it is a permanent
customer-facing surface — its current static implementation is the
pilot's launch surface, but the URL `aggilo.in` is the production
domain and the site itself is not throwaway.

---

## Convention for new pilot clusters

The detailed step-by-step ships in **`phase0/NEW_CLUSTER_CHECKLIST.md`**
(database scoping, app scaffold, prompt files, Vercel rewrite,
smoke test, gotchas to avoid). Read that first when spinning up
a new cluster.

In summary, every new cluster started during the pilot follows the
same shape:

1. The cluster's Next.js app goes at `phase0/<short-slug>/` (mirror
   of `phase0/lc/`). Its `NEXT_PUBLIC_CLUSTER_ID` is hard-pinned.
2. The cluster's specs (`CLUSTER_DESCRIPTION.md`, `SAGE_PERSONA.md`,
   `CLIO_ONBOARDING.md`, `CLUSTER_TOOLS.md`) go at
   `phase0/clusters/<full-cluster-id>/`.
3. The cluster gets a rewrite entry in `launch/landing/vercel.json`
   pointing `/c/<full-cluster-id>` to the new app's Vercel
   deployment URL.
4. The cluster's deployment notes get an entry in
   `phase0/docs/DEPLOYMENT_AGGILO_IN_REWRITE.md` under the
   "Adding a future cluster" section.

When pilot clusters graduate to the production platform (Phase 1),
they migrate to the canonical structure described in
`architecture/system_implementation_prompt_part6.md` §34. The pilot
specs in `phase0/clusters/<id>/` become the source for the
canonical `clusters/<id>/identity.ts` modules in the React PWA.

---

## In-pilot features that graduate

Some specs live here because they are implemented during the pilot
but belong to the main product. They stay here while the pilot is
the only place running them, and graduate to `docs/` or
`architecture/` when the production platform picks them up:

- `docs/AMA_CLUSTER_CREATION_AND_FOUNDING_FEEDBACK.md` —
  founding-member feedback prompt and AMA cluster creation. Promoted
  to a main-product spec on 2026-05-26 because founding feedback is
  required for every Source-A cluster across the platform. The Phase
  0 LC implementation is the reference; future clusters and the
  production platform read the canonical spec from `docs/`.

When a feature graduates, leave a one-line pointer behind so old
links don't rot:

```markdown
> **Moved:** This document graduated to the production platform.
> See `docs/<NEW_PATH>.md`.
```

---

*Phase 0 workspace · 2026-05-26.*
