# Prompts directory layout

> Cluster-aware prompt structure for Aggilo. Single source of truth for
> how Sage, Clio, and platform-level agents construct their LLM
> instructions across multiple clusters and cluster types.

## Why this layout

Phase 0 is **not** a single-cluster product. The MVP launches with one
premium cluster (Sisters in Dua), but the platform exists to host:

- **Premium clusters** — admin-configurable (slider, free-text guidance,
  enabled skills). Sisters in Dua is the first; more arrive as we sign
  partner communities.
- **Generic clusters** — stock-template clusters anyone can spin up
  with default settings. These exist to test the platform's
  multi-cluster behaviour during Phase 0 itself.

Mixing MVP-specific prompts with platform-level rules in the same file
created two problems:

1. **Confusion.** A reader couldn't tell which lines apply to every
   cluster vs which lines describe Sisters in Dua specifically.
2. **No path to a second cluster.** Adding even a generic test cluster
   would have meant duplicating Sage's voice rules a second time —
   exactly the drift pattern Session C's audit flagged across 21 prompts.

This layout separates the three concerns so each piece is editable in
isolation and inheritance is unambiguous.

## Layout

```
prompts/
├── platform/            ← cluster-agnostic. Inherited by every agent on every cluster.
│   ├── super-prompt.ts          AGGILO_SUPER_PROMPT_LITERAL — soul, safety floor, voice baseline
│   ├── sage-character.ts        Generic Sage character + decision framework (no cluster vocabulary)
│   ├── clio-character.ts        Generic Clio character (no cluster vocabulary)
│   └── share-mode.ts            Share-line voice rules (cluster-card share, member invite line)
│
├── cluster-types/       ← per-type defaults. Generic vs premium differ here.
│   ├── generic.ts               Stock cluster. Defaults that ship with any new cluster.
│   └── premium.ts               Premium cluster. Admin-configurable hooks.
│
├── clusters/            ← concrete cluster implementations.
│   └── sisters_in_dua/          The MVP premium cluster.
│       ├── identity.ts          Cluster name, tagline, description, demographic chips, anchor seed
│       ├── sage.ts              Cluster-flavoured Sage system prompt (stitches platform + identity)
│       ├── clio.ts              Cluster context block injected into Clio's cluster-mode prompt
│       └── README.md            What this cluster is, scope notes, who maintains it
│
├── registry.ts          ← cluster_id → cluster module resolver.
└── README.md            ← this file.
```

## Inheritance order (every Sage call)

1. **Platform super-prompt** (`platform/super-prompt.ts`) — the immutable
   soul + safety floor + voice baseline.
2. **Sage's generic character + decision framework** (`platform/sage-character.ts`)
   — Steps 0–6, hard limits, bad-example block.
3. **Cluster identity + flavour** (`clusters/<cluster_id>/sage.ts`) —
   what the cluster is, who the audience is, what the Admin/Manager
   structure looks like.
4. **Per-call signals + vault context + recent posts** — runtime data
   injected by the route.

The same order applies to Clio (substituting `clio-character.ts` and
`clusters/<cluster_id>/clio.ts`).

## Adding a new cluster

1. Create `clusters/<your_cluster_id>/`
2. Add `identity.ts` (name, tagline, description, chips, seed posts)
3. Add `sage.ts` (cluster-specific Sage prompt — stitches the platform
   character + the identity)
4. Add `clio.ts` (cluster context for Clio)
5. Add `README.md` (what this cluster is, who admins it)
6. Register the cluster in `registry.ts`

That's it. No edits to any platform file. No edits to any other cluster.

## Adding a new cluster type

A new cluster type (e.g. "open" — completely public) lives at
`cluster-types/open.ts` with the type-level defaults. Concrete clusters
that adopt that type set their `clusterType: "open"` in the registry
entry, and the resolver merges the type defaults under the cluster-
specific overrides.

## Phase 0 plan

Phase 0 will likely host:

- One premium cluster: `sisters_in_dua` (live)
- One generic test cluster (planned — exists to verify the multi-cluster
  resolver works end-to-end before any second partner cluster signs)
- Zero or more developer-only test clusters under
  `clusters/_test_<name>/` (gitignored by convention if ephemeral, or
  prefixed `_test_` for clarity if checked in)

The registry's role is to make this a one-line addition each time.

## What lives in the legacy paths

`src/lib/sage-prompt.ts`, `src/lib/clio-prompt.ts`, `src/lib/share-prompts.ts`,
and `src/lib/super-prompt.ts` are now thin **re-export shims** that
forward to the new structure. Existing route imports keep working
unchanged. A follow-up commit migrates routes to the new paths and
removes the shims.

## Where the audit findings live

Layout choices in this directory map directly to specific findings in
`docs/PROMPT_AUDIT_RESULTS.md`:

- **C8 (token efficiency, super-prompt redundancy)** is solved by
  inheritance order above — duplicates between platform and cluster
  files are caught structurally, not by careful reading.
- **C11 (cluster vocabulary parameterisation, Phase 1 prerequisite)**
  is now structural. The cluster identity file is the only place a
  cluster's vocabulary can live, by construction.
- **C12 (drift defence)** — bad-example blocks live with the agent
  character, not with the cluster identity, so they apply across every
  cluster the agent serves.

*Created in V3.12 — multi-cluster prompt restructure.*
