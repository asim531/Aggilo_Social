# Phase 0 — clusters and what lives where

> **Version 1.0 — Created in V3.12 alongside the prompt restructure.**
>
> Phase 0 is *not* a one-cluster product. The MVP launches with a single
> live premium cluster (Sisters in Dua) but the platform is designed to
> host many. This document is the source of truth for which clusters
> exist, what type each is, and where their code lives.

---

## What "Phase 0" means here

Phase 0 is the period from MVP launch through the moment the platform
proves multi-cluster behaviour end-to-end. It is **not** the period in
which only Sisters in Dua exists. We need at least one generic test
cluster running before the platform can claim multi-cluster integrity.

Phase 0 ships:

- **Sisters in Dua** — the premium reference cluster. Live. Real
  members. Production-grade content.
- **A generic test cluster** (planned) — a stock-template cluster
  used to exercise the multi-cluster resolver, the registry, and the
  cluster-vocabulary parameterisation. Not member-facing in the
  marketing sense; reachable for internal testing.
- **Optional ephemeral test clusters** — short-lived clusters spun up
  to verify a specific behaviour or refactor. Prefixed `_test_<name>`
  in the registry; deleted when the test is complete.

Phase 1 begins when the platform supports self-serve cluster creation
by partners.

---

## Cluster types

Every cluster has a `type` that drives type-level defaults. Two types
exist today:

### `generic`

Stock cluster. Defaults from `lib/prompts/cluster-types/generic.ts`.
Used for:

- Phase 0 internal test clusters
- Phase 1 self-serve clusters that haven't customised yet

A generic cluster has no demographic restrictions by default, uses the
platform's default member noun ("member") and authority terminology
("Admin"), and runs on the platform's standard slider-medium agent
involvement.

### `premium`

Admin-customisable cluster. Defaults from
`lib/prompts/cluster-types/premium.ts`. Used for:

- The Aggilo MVP cluster (Sisters in Dua)
- Future paid partner clusters

A premium cluster carries the same defaults as a generic cluster but
gains the configurability hooks: the agent involvement slider, the
free-text guidance field, the enabled-skills catalogue, and per-cluster
admin overrides.

The **type does not change Sage's character or the platform safety
floor.** It changes what an Admin can configure.

---

## Where prompt code lives

```
mvp/src/lib/prompts/
├── platform/            ← cluster-agnostic. Inherited by every agent on every cluster.
│   ├── super-prompt.ts          AGGILO_SUPER_PROMPT_LITERAL
│   ├── sage-character.ts        Generic Sage character + decision framework
│   ├── clio-character.ts        Generic Clio character (cluster + ephemeral)
│   └── share-mode.ts            Share-line voice rules
│
├── cluster-types/       ← per-type defaults
│   ├── generic.ts               Stock-template defaults
│   ├── premium.ts               Premium-tier defaults
│   └── types.ts                 Shared TS interfaces (ClusterIdentity, ClusterModule)
│
├── clusters/            ← concrete cluster implementations
│   └── sisters_in_dua/          The MVP premium cluster
│       ├── identity.ts          Display name, tagline, chips, seed posts, member noun
│       ├── sage.ts              Cluster-specific Sage prompt fragment
│       ├── clio.ts              Cluster-specific Clio context fragment
│       ├── index.ts             Module entry point (the ClusterModule export)
│       └── README.md            Per-cluster doc
│
├── registry.ts          ← cluster_id → cluster module resolver
└── README.md            ← layout overview + how to add a cluster
```

**Editing rules:**

- **Platform rules change in `platform/`.** One edit, every cluster
  inherits.
- **Cluster vocabulary changes in `clusters/<id>/identity.ts`.** Only
  that cluster is affected.
- **Adding a cluster never edits another cluster.** Copy the directory
  template, edit the new identity, register it.

---

## Existing clusters

### `sisters_in_dua` — premium · live

The MVP cluster. Women-only Muslim community navigating faith in real
life. Located at `lib/prompts/clusters/sisters_in_dua/`. Read the
cluster's own `README.md` for scope notes.

### Planned: `_test_generic_v1` — generic · not yet created

A stock cluster spun up to verify multi-cluster behaviour. Will be
added before the V3.12 → V3.13 follow-up that migrates routes off the
legacy shims. Marked `_test_` so it's clearly internal.

---

## Adding a cluster

Five files in a directory and one registry entry:

1. `mkdir mvp/src/lib/prompts/clusters/<your_id>`
2. `identity.ts` — populate `ClusterIdentity` (see
   `cluster-types/types.ts` for the shape)
3. `sage.ts` — write the cluster-specific Sage prompt fragment
   (one or two paragraphs of cluster identity copy)
4. `clio.ts` — write the Clio cluster context fragment
   (cluster description + Sage's role + authority structure)
5. `index.ts` — export the `ClusterModule`
6. `README.md` — describe the cluster and who maintains it
7. Add the entry to `prompts/registry.ts`

That's it. No edits to `platform/`. No edits to any other cluster.

---

## How agent routes resolve a cluster

Routes call `requireClusterModule(cluster_id)` from
`prompts/registry.ts`. They never import a specific cluster file.
This means:

- Adding a cluster never touches a route.
- Removing a cluster never touches a route.
- Renaming a cluster's display name touches one file (its
  `identity.ts`); the registry continues to resolve the same
  `cluster_id`.

`DEFAULT_CLUSTER_ID` exists for Phase 0 routes that haven't yet been
updated to read `cluster_id` from the request. Phase 1 prerequisite:
every route accepts an explicit `cluster_id` and the default is
deleted.

---

## What lives in the legacy paths

`src/lib/sage-prompt.ts`, `src/lib/clio-prompt.ts`,
`src/lib/share-prompts.ts`, and `src/lib/super-prompt.ts` are now
**re-export shims** that forward to the new structure. Existing route
imports keep working unchanged.

A V3.13 follow-up will migrate routes to import from the new paths
directly and remove the shims. Until then, both paths work; new code
should use the new paths.

---

## Decisions captured here

- Phase 0 is multi-cluster from day one (one live + one test).
- The `cluster_id` `the_single_source` is a legacy DB identifier
  preserved across V3.x for continuity. Do not rename.
- The platform's safety floor and voice baseline live in **one file**
  (`platform/super-prompt.ts`). Drift across clusters is structurally
  prevented.
- Cluster-specific vocabulary lives in **one file per cluster**
  (`clusters/<id>/identity.ts`). No second copy anywhere.
- A new cluster is **never** added by editing an existing cluster's
  files.

*Created 2026-05-22 as part of V3.12 (multi-cluster prompt
restructure). Maintained alongside the registry; update both when a
cluster is added or removed.*
