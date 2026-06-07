# Sub-Cluster / Dual-Surface Concept

> ⚠️ **Concept — not yet implemented.** This document is a placeholder for a future architecture primitive. Do not wire into implementation specs or task files until a second concrete example validates the pattern.
>
> **Last updated:** 2026-06-06  
> **Authoritative example:** `architecture/examples/cluster-spec-parents-teaching-fractions.md`  
> **Related docs:** `architecture/CLUSTER_SPAWN_ENGINE.md` §1.5, `architecture/CLUSTER_GENESIS_ENGINE.md`

---

## 1. Definition

A **sub-cluster** (or "dual-surface cluster") is a single cluster identity that hosts **two or more firewalled content surfaces** for distinct stakeholder groups bound in a tight service loop.

- Same `cluster_id`, same AGGIL settings, same admin dashboard
- Different `sub_surface_id`s with separate content feeds, UI surfaces, and agent registers
- Members of each surface are bound by relationship (supporter ↔ beneficiary, mentor ↔ mentee) — they do not choose independently

---

## 2. When to Use (vs Spawn)

| Signal | Spawn New Cluster | Create Sub-Surface |
|--------|-------------------|-------------------|
| Member relationship | Independent | Bound in service loop |
| Identity | New purpose, new tags, new AGGIL | Same purpose, shared AGGIL |
| Admin | Separate dashboard, separate budget | Shared admin, shared budget |
| Member choice | Must actively choose to join | No choice — part of same membership |
| Auth | Standard phone/OTP | Dual auth (supporter auth + beneficiary auth) |
| UI | Standard Timeline | Dual feed (supporter Timeline + beneficiary card grid) |
| Agent register | Single per cluster | Multiple per sub-surface |

**Decision signal:** If the sub-group's needs are meaningfully different → **spawn**. If the two groups are inextricably linked in a single service journey → **sub-surface**.

---

## 3. Concrete Example

> For a domain-specific illustration of this pattern, see `architecture/examples/cluster-spec-parents-teaching-fractions.md` §12 UI Configuration.

**Cluster:** "[Supporter + Beneficiary Learning Service]"

| Surface | Audience | Feed Type | Agent Register | Key Features |
|---------|----------|-----------|----------------|--------------|
| `supporter_space` | `supporter_1` | Timeline (standard) | `inquiry`, `honoured` | Discussion, resource sharing, guidance, beneficiary progress panel |
| `beneficiary_space` | `beneficiary_1` | Card grid (visual) | `playfulness`, `guarded` | Interactive tools, adaptive assessment, progress tracking, effort recognition |

---

## 4. Open Questions (Defer Until Second Example)

### 4.1 Visual Cues on Explore Card

How does the Explore card indicate "this cluster has a beneficiary surface"?
- Options: "Dual Surface" badge, icon overlay, Clio insight line mention
- Risk: Cognitive overload for users who don't need the beneficiary surface

### 4.2 Findy Clio Explanation

Should Clio proactively explain sub-surfaces on first cluster visit?
- Supporter view: "This cluster has a learning space for your beneficiary too. Switch to their view from the profile menu."
- Beneficiary view: No explanation needed — beneficiary sees their surface by default
- Risk: Supporter may not realize beneficiary surface exists

### 4.3 Auth Fluidity

Should sub-surface auth model be configurable per cluster type?
- Supporter-beneficiary: dual auth (supporter auth + beneficiary auth)
- Mentor-mentee: maybe same auth, different role assignment
- Coach-client: maybe institutional SSO
- **Open:** Is this a per-cluster configuration or a platform-wide pattern?

### 4.4 Who Proposes Sub-Surfaces?

- Genesis Engine at creation time (infer from founder description)?
- Observer post-launch (detect stakeholder divergence)?
- Clio on member request?
- **Open:** Proposal routing and approval workflow

### 4.5 Sub-Surface Evolution

- Does each sub-surface have its own evolution budget allocation?
- Can Observer propose evolution changes to one sub-surface without affecting the other?
- **Open:** Budget splitting, outcome monitoring per surface

---

## 5. Schema Placeholder (Not Implemented)

When implemented, `cluster_specs.spec` would gain:

```json
{
  "sub_surfaces": [
    {
      "id": "supporter_space",
      "name": "[Supporter Circle]",
      "audience": ["supporter_1"],
      "feed_type": "timeline",
      "soul_manifestation_profile_key": "supporter_1",
      "features": ["discussion", "resource_sharing", "guidance"]
    },
    {
      "id": "beneficiary_space",
      "name": "[Beneficiary Explorer]",
      "audience": ["beneficiary_1"],
      "feed_type": "card_grid",
      "soul_manifestation_profile_key": "beneficiary_1",
      "features": ["[domain_visualizer]", "adaptive_assessment", "interactive_response"]
    }
  ]
}
```

**Current state:** This field is `null` for all clusters. No schema migration needed until implementation.

---

## 6. Trigger for Full Implementation

When a **second concrete example** emerges with the same stakeholder-bound pattern, flesh out:
- Full schema migration (`cluster_specs.spec.sub_surfaces`)
- Task file updates (B08, F03, A01, A03, AD01)
- Admin dashboard panels (sub-surface management)
- Explore card visual cue spec
- Findy Clio behavior spec
- Auth model configuration
- Evolution Governor budget splitting

**Candidate second examples:**
- Mentor-Mentee Programming Club (mentor sub-space + mentee sub-space)
- Teacher-Student Quran Recitation (teacher sub-space + student sub-space)
- Coach-Athlete Training Hub (coach sub-space + athlete sub-space)
