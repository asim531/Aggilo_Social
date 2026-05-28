# Cluster Creation Workflow — Implementation Spec
## Phase 0 · Platform Admin Creates Generic and Premium Clusters

> **Status:** Implementation-ready. Part of the orchestrator spec set.
> **Authority:** Subordinate to `ORCHESTRATOR_SPEC.md`.
> **Route:** `/admin/orchestrator/clusters/new`
> **Who:** `platform_admin` role only in Phase 0.

---

## 0. Principles Applied

| Principle | How it manifests in this workflow |
|-----------|----------------------------------|
| 1 — AI as OS | Clio scores the cluster configuration live; agent validates Atlas URLs |
| 2 — Closed loops | Every creation step writes an audit row; cluster score is queryable |
| 3 — Legible organization | Every field maps to a DB column; nothing is implicit |
| 4 — Software factories | Agent computes cluster score and recommendation; human confirms |
| 5 — No human middleware | Validation is instant; no approval queue for platform admin |
| 6 — Three archetypes | Platform admin creates; founder is assigned; DRI accountability is set at creation |
| 7 — Token-max | Cluster score computation and Atlas URL validation use LLM; cost is logged |

---

## 1. Workflow Overview

```
Step 1: Type Selection
    ↓
Step 2: Identity (cluster_id, name, description, purpose, icon, language)
    ↓
Step 3: AGGIL Configuration (age, gender, geography, interests, languages)
    Live cluster score updates as admin fills in fields
    ↓
Step 4: Premium Configuration (premium only)
    Slider + domain sensitivity
    Atlas access mode
    ↓
Step 5: Review + Create
    Summary of all settings
    Final cluster score
    [Create cluster] → status: 'creating'
    ↓
Step 6: Post-Creation Checklist (shown on detail page)
    □ Register prompt module in registry.ts
    □ Seed vault (premium only)
    □ Assign founder (premium only)
    □ [Activate cluster] → status: 'active'
```

---

## 2. Step 1 — Type Selection

Two cards, side by side:

**Generic Cluster**
> Platform defaults. Sage, Clio, Atlas, Scout, and Observer all run at
> medium involvement. No admin or manager roles. No vault. No slider.
> Best for: test clusters, community experiments, Scout-discovered topics.

**Premium Cluster**
> Everything in Generic, plus: a named Admin and up to 3 Managers,
> agent involvement slider, free-text goals, Atlas source controls,
> skills catalogue, and a curated vault.
> Best for: partner communities, faith clusters, professional networks.

Selection is a single click. No confirmation needed at this step.

---

## 3. Step 2 — Identity

| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `cluster_id` | text | snake_case, 3–64 chars, unique | Immutable after creation. Shown with a lock icon after first save. |
| Display name | text | 2–128 chars | Shown to members. Can be changed later. |
| Description | textarea | 10–500 chars | Used in prompts and public preview. |
| Purpose | textarea | 10–300 chars | What the cluster is for. Feeds Sage's context. |
| Icon | emoji picker | single glyph | Defaults to 🌐 |
| Primary language | select | ISO 639-1 | Defaults to 'en' |

**`cluster_id` rules:**
- Must start with a letter
- Lowercase letters, digits, underscores only
- No leading/trailing underscores
- Cannot match an existing `cluster_id`
- Test clusters should use `_test_` prefix by convention

**Uniqueness check:** fires on blur (debounced 500ms). Shows ✅ or ❌ inline.

---

## 4. Step 3 — AGGIL Configuration

### 4.1 Age Range

Two number inputs: Min age / Max age. Both optional.
- If both empty: cluster is open to all ages
- Validation: min < max, both ≥ 18 (platform minimum)
- Helper text: "The cluster's age range shifts as years pass. A 25–35
  cluster becomes 35–45 in 10 years."

### 4.2 Gender Filter

Radio group:
- Anyone (default)
- Male only
- Female only
- Non-binary only
- Male + Non-binary
- Female + Non-binary

### 4.3 Geography

Three modes (radio):

**Named locations** — multi-select of cities/regions
- Text input with autocomplete (Phase 0: free text; Phase 1: geocoded)

**Regional scope** — single text input (e.g. "Telangana", "India")

**GPS landmark + radius** — two inputs: landmark name + radius in km
- Note shown: "Members must be within this radius AND have GPS sharing enabled."

### 4.4 Interest Tags

Multi-select from predefined categories + free-text custom tags.
Predefined categories (from PRD): Faith, Sports, Music, Tech, Food,
Fitness, Books, Film, Travel, Career, Parenting, Health, Gaming, Art,
Language, Education, Finance, Politics, Environment, Other.

### 4.5 Languages

Multi-select. English is always an implicit soft match.

### 4.6 Live Cluster Score

A live animated score bar updates as the admin fills in fields.
Computed client-side using the U-shaped intentionality model:

```typescript
// Computed in the browser — no LLM call for the score itself
function computeClusterScore(config: ClusterCreateInput): number {
  // Purpose clarity (30%): description length + interest tag count
  // Intentionality signal (25%): U-shaped — hyper-narrow OR fully open = high
  // Name quality (20%): display name length + uniqueness signal
  // Clio confidence (25%): how well the AGGIL config maps to a known segment
  // Returns 0–100
}
```

Clio coaching copy shown below the score bar:
- 0–40%: "This feels like it could be anything. What if you went sharper — or wider? Both work. The middle doesn't."
- 40–70%: "Getting there. You're close to something specific — push it further."
- 70–100%: "Now we're talking. I know exactly who to look for."
- 90%+: "This is going to be a great cluster. I already have ideas for who should be here." + 🔥

---

## 5. Step 4 — Premium Configuration (premium only)

### 5.1 Domain Sensitivity

Radio group: Low / Medium / High
- Low: hobbyist, entertainment, casual communities
- Medium: professional, educational, general interest
- High: faith, health, recovery, legal, financial

Helper text: "This helps the platform recommend the right level of
agent involvement for your cluster's domain."

### 5.2 Agent Involvement Slider

Three buttons: Min · Medium · High

Recommendation label appears next to the computed recommendation:
```
Min    Medium ← Recommended for this cluster    High
```

Behaviour preview (3 bullets) renders immediately on selection.
Safety-floor footnote always visible below.

### 5.3 Atlas Access Mode

Three options:

**None** (default)
> Atlas does not fetch external content. Sage operates from the vault only.

**Specific URLs** (curated)
> Atlas fetches only from the URLs you provide. You control the sources.
> [+ Add URL] button opens a URL input with label field.
> Each URL is validated on add: HEAD request + agent relevance check.
> Validation result shown inline.

**Full internet** (open)
> Atlas may fetch from any public source. Content quality and safety
> depend on what Atlas finds.
> [Enable full internet access] button opens a confirmation dialog:
> "Atlas will fetch content from any public source. You are responsible
> for reviewing Atlas Pulse cards before they go live. Type CONFIRM to proceed."

---

## 6. Step 5 — Review + Create

A summary card showing all configured fields. Editable by clicking
the pencil icon next to each section (navigates back to that step).

**Cluster score shown prominently** with the Clio coaching copy.

**[Create cluster]** button:
- Disabled until `cluster_id` is validated and unique
- On click: POST to `/api/orchestrator/clusters`
- On success: redirect to `/admin/orchestrator/clusters/[id]`
- On error: inline error message

**Test cluster option (bottom of Step 5):**

```
─────────────────────────────────────────────────────
Internal settings

☐ This is a test cluster
  Not visible in member discovery. Excluded from platform metrics.
  Can be destroyed immediately. Appears with [TEST] badge in the
  orchestrator board.

  Test purpose (optional):
  [textarea — describe what you're testing]

Feature configuration (optional — all features enabled by default)
  [toggle] Clio chat (FAB)          ✅ Enabled
  [toggle] Sage Timeline posts      ✅ Enabled
  [toggle] @Sage mentions           ✅ Enabled
  [toggle] Room Workshop            ✅ Enabled
  [toggle] Features tab             ✅ Enabled
  [toggle] Atlas Pulse cards        ✅ Enabled
  [toggle] Vault references         ✅ Enabled
─────────────────────────────────────────────────────
```

Feature configuration is available for all clusters (test and
production). Full spec: `docs/orchestrator/TEST_CLUSTER_SPEC.md`.

**What happens on create:**
1. INSERT into `clusters` (status: 'creating', `is_test_cluster` per checkbox)
2. INSERT into `cluster_config` (defaults + any premium settings + feature_gates)
3. INSERT into `cluster_admin_actions` (action_type: 'cluster_created')
4. If premium: INSERT into `cluster_goals` placeholder row (empty, not active)

---

## 7. Step 6 — Post-Creation Checklist

Shown on the cluster detail page (`/admin/orchestrator/clusters/[id]`)
when status is 'creating'.

```
This cluster is in provisioning. Complete these steps to activate it.

□ Register the prompt module
  Add an entry to src/lib/prompts/registry.ts for cluster_id: [cluster_id]
  See docs/orchestrator/PROMPT_MODULE_GUIDE.md for instructions.
  [Mark complete]

□ Seed the vault (premium only)
  Add verified entries to the vault table for this cluster.
  [Go to Vault →]

□ Assign a founder (premium only)
  The founder is the cluster's Admin — the human DRI.
  [Assign founder →]

[Activate cluster]  ← enabled only when all required steps are checked
```

**Activation:**
- PATCH `/api/orchestrator/clusters/[id]` with `{ to_status: 'active', reason: 'provisioning complete' }`
- Writes `clusters.activated_at` + `cluster_admin_actions` row
- Cluster is now live and serving traffic

---

## 8. Invariants

These are enforced at the API layer and cannot be bypassed by the UI:

1. `cluster_id` is immutable after creation
2. `cluster_type` is immutable after creation (generic cannot become premium in Phase 0)
3. A premium cluster cannot be activated without a `founder` assignment
4. AGGIL post-spawn protections apply immediately after the first member joins
5. The immutable safety floor (welfare, character, handoff) is always enabled
   regardless of slider setting — these skills cannot be toggled off
6. Every lifecycle transition writes a `cluster_admin_actions` row
7. Destroying a cluster is irreversible — the row is kept for audit

---

## 9. Prompt Module Registration (manual step, Phase 0)

Phase 0 requires manual registration of the prompt module. The
post-creation checklist links to a guide:

**For a generic cluster:**
1. Create `mvp/src/lib/prompts/clusters/[cluster_id]/`
2. Copy the generic template from `mvp/src/lib/prompts/clusters/_template_generic/`
3. Edit `identity.ts` with the cluster's display name, tagline, description
4. Edit `sage.ts` with any cluster-specific Sage context
5. Edit `clio.ts` with any cluster-specific Clio context
6. Add the export to `index.ts`
7. Register in `registry.ts`: `[CLUSTER_MODULE.identity.id]: CLUSTER_MODULE`

**For a premium cluster:**
Same as generic, plus:
- Set `type: 'premium'` in `identity.ts`
- Add `memberNoun`, `authorityNoun`, `collectiveNoun` per the cluster's vocabulary
- Add `demographicChips` per the cluster's identity

Phase 1: this step is automated — the creation wizard generates the
prompt module files from the identity fields.

---

*Cluster Creation Workflow · Phase 0 · 2026-05-23*
*Part of the orchestrator spec set. See ORCHESTRATOR_SPEC.md for the master spec.*
