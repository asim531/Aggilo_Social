# Agent Involvement Slider — Implementation Spec

> **Scope:** Premium cluster admin surface. Implementation-ready spec
> for a future session.
>
> **Predecessor:** `architecture/premium_cluster_requirements.md` §10
> (the behavioural matrix). This spec adds the UX layer the matrix
> implies but does not specify.
>
> **Status:** Spec — ready to build. No code in this commit.

---

## What ships

A premium cluster admin opens the cluster identity / configuration
surface and sees an `Agent involvement` control. The control:

1. Shows three levels (`Min`, `Medium`, `High`).
2. Defaults to `Medium`.
3. Surfaces a **recommended-for-this-cluster** label next to one of the
   levels based on cluster metadata.
4. When the admin moves the slider, immediately surfaces a 3-bullet
   **member-visible behaviour preview** — what changes for members at
   the new level.
5. On save, writes to `cluster_config.agent_involvement` and an audit
   row to `cluster_admin_actions`. The save is gated by a confirmation
   dialog that re-shows the preview.

The slider is the *ceiling* for free-text guidance (per the existing
behavioural matrix). Free-text below the slider's ceiling is allowed;
above it is rejected.

---

## The recommendation engine

When the admin lands on the configuration surface, the platform
computes a recommendation based on three cluster signals:

| Signal | Source | Weight |
|--------|--------|--------|
| Cluster size | `clusters.member_count` | 0.4 |
| Cluster age | days since `clusters.created_at` | 0.3 |
| Domain sensitivity | `cluster_config.domain_sensitivity` (new field) | 0.3 |

`domain_sensitivity` is a new enum: `low | medium | high`. A faith
cluster is `high`. A founder peer-support cluster is `medium`. A
hobbyist book club is `low`. The platform sets the default at cluster
creation; admin can override.

**Recommendation rule:**

| Cluster state | Recommended level |
|---|---|
| New (<7 days), small (<25 members) | `Min` (let the room settle before agents are visible) |
| Active, low-sensitivity domain | `Medium` |
| Active, medium-sensitivity domain | `Medium` |
| Active, high-sensitivity domain | `Medium` (high agent involvement is rarely the right answer in tender domains; admins lean into it after they trust the platform) |
| Mature (>180 days), large (>200 members), low-sensitivity | `High` (the room has settled and can carry more agent activity without the agents dominating) |

Recommendation is shown as a small label next to the matched level:
`Recommended for this cluster`. Not a hard prompt; not a nag; just a
visible default.

---

## The behaviour preview

When the admin moves the slider (before save), the surface immediately
re-renders a 3-bullet preview. The bullets describe what *members* see
change — not what tables update.

**Preview content rules:**

- Plain language. No internal mechanic names ("cadence cycle", "Step 0.5",
  "introspection", "vault gap").
- Member-perspective only. *"Members will see…"*, *"The room will get…"*.
- 3 bullets max. Pick the three with the largest member-visible delta.
- Difference highlighted relative to the *current* level, not the default.

**Reference content per transition (this is the source of truth — do
not paraphrase at runtime; render these strings directly):**

```ts
// Transitions FROM Medium (the default)
"medium_to_min": [
  "Sage will speak less often — only when a member directly asks (with @Sage), or when the safety floor needs her.",
  "Members will not see the Workshop dialogue between Sage and Clio.",
  "The daily reflection prompt and the rotating Sage references will pause."
]

"medium_to_high": [
  "Members will see Sage references more often — roughly every 4 hours instead of every 6.",
  "The daily reflection prompt will run automatically every morning.",
  "Sage and Clio's Workshop dialogue will refresh more frequently — about every 1–2 hours."
]

// Transitions FROM Min
"min_to_medium": [
  "Sage will start surfacing verified references on a 6-hour cadence.",
  "Members will see the Workshop dialogue between Sage and Clio when they scroll past the timeline.",
  "Welcome posts for new members will run on the standard cadence."
]

"min_to_high": [
  "Sage will start surfacing verified references roughly every 4 hours.",
  "Members will see the Workshop dialogue more often, with auto-running daily reflections.",
  "Welcome posts will become warmer and more frequent."
]

// Transitions FROM High
"high_to_medium": [
  "Sage references will slow to roughly every 6 hours from every 4.",
  "The Workshop dialogue will refresh on a slower cadence.",
  "Daily reflection prompts will only run when proposed and member-voted, not automatically."
]

"high_to_min": [
  "Sage will only speak when a member directly asks her, or when the safety floor needs her.",
  "Members will not see the Workshop dialogue between Sage and Clio.",
  "Auto-running prompts and reflections will all pause."
]
```

**The safety-floor footnote** appears beneath the preview at every
level, in smaller text:

> *"Welfare and character protocols always run, regardless of this
> setting. Members in distress are still routed to the cluster's care
> authority. This is the floor below which the platform cannot fall."*

---

## The save flow

1. Admin moves the slider.
2. Preview re-renders.
3. Admin taps "Save".
4. Confirmation dialog appears with the same 3 bullets re-rendered as
   "What you are agreeing to". Two buttons: `Confirm change` (primary)
   and `Cancel`.
5. On confirm: write to `cluster_config.agent_involvement`; insert
   audit row to `cluster_admin_actions` with `action_type =
   'agent_involvement_changed'`, `before_state`, `after_state`,
   `rationale = NULL` (admin can add a rationale field if they want).
6. The new level takes effect on the next agent operation. Existing
   in-flight operations complete at the old level.

---

## The free-text guidance interaction

Below the slider is the free-text guidance editor (existing surface,
unchanged in this spec). The validation rule the parser already
enforces:

- Free-text guidance is rejected if it requests behaviour above the
  slider ceiling.
- Free-text guidance is rejected if it violates an immutable invariant.
- Free-text guidance is accepted if it refines voice / vocabulary
  within the ceiling.

The new UX add: when the parser rejects a directive, the rejection
message names the slider ceiling explicitly:

> *"This guidance asks the agents to run a daily reflection prompt
> automatically. That behaviour is only available at `High`
> involvement. Your slider is currently at `Medium`. Either raise the
> slider to `High`, or revise the guidance."*

This makes the slider's contract role legible. Admins learn what the
slider gates without having to read the matrix doc.

---

## Generic clusters

Generic clusters (cluster_type = `generic`) **do not get the slider in
their admin surface**. Their default involvement is `Medium`, fixed.

Why: the slider is a premium-tier configuration affordance. Generic
clusters use platform defaults; their configurability lives in the
free-text and skill-catalogue layers, not in the slider.

Phase 1 may add a slider to generic clusters once the platform has
data on which defaults are working. For Phase 0, generic = no slider.

---

## Database fields

```sql
-- Existing: cluster_config.agent_involvement (VARCHAR(8) default 'medium')
-- Existing: cluster_config.agent_disabled (BOOLEAN default FALSE)

-- New for V3.14:
ALTER TABLE public.cluster_config
  ADD COLUMN domain_sensitivity VARCHAR(8) DEFAULT 'medium';

-- Allowed values: 'low', 'medium', 'high'.
-- Default 'medium' is conservative; admin overrides at cluster creation
-- or during configuration.
```

No other schema changes. The audit row schema (`cluster_admin_actions`)
is already in place from V3.5.

---

## Out of scope for this spec

- **Continuous (0-100) slider.** Decided against in
  `premium_cluster_requirements.md` §10.6. Three discrete levels for
  legibility and decision-burden reasons.
- **Per-behaviour toggles.** Admin cannot turn off "cadence dialogue"
  while leaving "verified-reference autonomous post" on. The matrix
  is a contract, not a checklist.
- **Slider for generic clusters.** Phase 1 question, not Phase 0.

---

## Done criteria

- [ ] Slider control rendered in premium cluster admin config surface
- [ ] Recommendation engine computes per-cluster recommendation
- [ ] Preview re-renders on slider movement
- [ ] Confirmation dialog gates the save
- [ ] Save writes `cluster_config.agent_involvement` and audit row
- [ ] Free-text validator's rejection message names the slider ceiling
- [ ] Safety-floor footnote rendered at every level
- [ ] `domain_sensitivity` field added to `cluster_config`
- [ ] Generic clusters do not see the slider; their config surface
      stays unchanged

---

*Implementation-ready · estimated 1 dev-day for the slider UX, ½ day
for the recommendation engine, ½ day for the validator-rejection-
message thread. Schema migration is one ALTER TABLE.*
