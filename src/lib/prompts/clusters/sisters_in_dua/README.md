# Sisters in Dua — cluster module

## What this cluster is

A women-only community for Muslim women navigating faith in real life.
Grounded in Quran and authentic Sunnah. The first live cluster on the
Aggilo platform — premium type. Phase 0's reference cluster: a one-off
case used to test and refine the platform before any second partner
cluster signs.

## DB cluster_id

`the_single_source` (kept stable for V3.x continuity; do not rename).

## Files in this directory

| File | What it carries |
|------|-----------------|
| `identity.ts` | Display name, tagline, description, demographic chips, seed posts, member noun, authority terminology — everything the platform needs to render the cluster's surface and prompts |
| `sage.ts` | Sage's cluster-specific prompt fragment. Stitched on top of `platform/sage-character.ts` |
| `clio.ts` | Clio's cluster-mode context fragment. Stitched on top of `platform/clio-character.ts` |
| `index.ts` | Module entry point — exports the `ClusterModule` consumed by the registry |
| `README.md` | This file |

## Inheritance order (Sage)

1. `prompts/platform/super-prompt.ts` — soul + safety floor + voice baseline
2. `prompts/platform/sage-character.ts` — Sage's character + decision framework + bad-examples
3. `prompts/clusters/sisters_in_dua/sage.ts` — cluster identity (this directory)
4. Per-call signals (welfare, character, @Sage), vault context, recent posts

Same shape for Clio (substitute `clio-character.ts` and `clio.ts`).

## Cluster-specific decisions

- **Demographic restrictions:** women-only, India-focused. Surfaced as
  chips on the cluster header.
- **Authority terminology:** "Admin / Managers" — the platform default.
  Premium clusters can override but Sisters in Dua keeps the default.
- **Vault grading floor:** Sahih and Hasan only. No Da'if, no Mawdu.
  Enforced by the vault's `verified_by_founder` flag in the database.
- **Primary language:** English. Arabic only appears verbatim from the
  verified vault.

## Who maintains this

The platform team owns `platform/` rules. The cluster's Admin
(currently the platform team for Phase 0) owns the cluster's
identity copy. Changes to identity should pair with a V3.x changelog
entry.

## When this becomes a template

When Aggilo signs a second premium cluster, **do not edit this
directory** to fit the new cluster. Instead:

1. Copy the structure to `clusters/<new_cluster_id>/`
2. Edit the new cluster's `identity.ts`, `sage.ts`, `clio.ts`
3. Register it in `prompts/registry.ts`

The two clusters then evolve independently. The platform character
stays in one place.
