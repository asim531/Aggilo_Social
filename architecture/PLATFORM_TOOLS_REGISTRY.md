# Platform Tools Registry

> **Authority:** Global, versioned registry of reusable platform tools. Tools are libraries clusters import, configure, and skin — not custom builds per cluster.
> **Expert profile:** Platform Architecture Expert · Senior Product Strategist

---

## 1. The Library Model

| Programming | Platform Equivalent |
|-------------|---------------------|
| npm / PyPI registry | `platform_tools` table |
| `package.json` | `cluster_tool_enablements` table |
| `npm install` | One-click enable in admin dashboard |
| Constructor args | `config_overrides` (validated against JSON Schema) |
| Fork a repo | Copy `platform_tools` row → new tool with different `code_module` |
| Package deprecation | `unused` → `archived` status (soft hide, not removal) |

**Core principle:** One backend, many skins. Same `document_analysis` code runs everywhere. Research Circle sees "Upload papers." Faith Study sees "Share passages."

---

## 2. Schema

### 2.1 `platform_tools` — Global Catalog

```sql
CREATE TABLE platform_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name VARCHAR(128) NOT NULL UNIQUE,
  display_name VARCHAR(128) NOT NULL,
  description TEXT NOT NULL,
  tool_kind VARCHAR(32) NOT NULL CHECK (tool_kind IN ('agent_tool','member_feature','platform_capability')),
  code_module VARCHAR(256) NOT NULL,
  prompt_template TEXT,
  config_schema JSONB,
  min_cluster_type VARCHAR(16) DEFAULT 'generic' CHECK (min_cluster_type IN ('generic','premium')),
  incompatible_tools UUID[],
  status VARCHAR(32) NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed','approved','active','unused','archived')),
  reusability_score INT,
  promoted_at TIMESTAMPTZ,
  promoted_by VARCHAR(32) DEFAULT 'observer_auto' CHECK (promoted_by IN ('observer_auto','admin_manual')),
  admin_vetoed BOOLEAN DEFAULT FALSE,
  version VARCHAR(16) NOT NULL DEFAULT '1.0.0',
  superseded_by UUID REFERENCES platform_tools(id),
  cost_profile JSONB DEFAULT '{}',
  total_clusters_enabled INT DEFAULT 0,
  total_invocations_30d INT DEFAULT 0,
  last_invoked_at TIMESTAMPTZ,
  unused_since TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 `cluster_tool_enablements` — Per-Cluster Import

```sql
CREATE TABLE cluster_tool_enablements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id),
  platform_tool_id UUID NOT NULL REFERENCES platform_tools(id),
  platform_tool_version VARCHAR(16) DEFAULT '1.0.0',
  cluster_display_name VARCHAR(128),
  cluster_description TEXT,
  cluster_icon VARCHAR(64),
  cluster_prompt_fragment TEXT,
  config_overrides JSONB DEFAULT '{}',
  status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','removed')),
  enabled_by VARCHAR(32) NOT NULL CHECK (enabled_by IN ('genesis_engine','admin','clio','member_vote')),
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  invocation_count INT DEFAULT 0,
  last_invoked_at TIMESTAMPTZ,
  UNIQUE(cluster_id, platform_tool_id)
);
```

**Notes:**
- `cluster_tools` is deprecated. Migrate on first Genesis Engine run.
- Config validated against JSON Schema on enablement. Invalid configs rejected.
- Existing clusters stay pinned to their version until admin upgrades.

---

## 3. Tool Lifecycle

### 3.1 Stage 1: Cluster-Specific Birth

Cluster needs capability → tool proposal chain fires → code written → row in `cluster_tool_enablements` only (private to cluster).

### 3.2 Stage 2: Auto-Promotion by Probability

**No concurrence requirement.** Observer scores reusability on first build (same LLM call as Domain 10 review):

| Criterion | Weight |
|-----------|--------|
| Domain-agnostic? | 0-30 |
| No hardcoded refs? | 0-20 |
| Configurable? | 0-20 |
| Low infra cost? | 0-15 |
| Prompt generic? | 0-15 |
| **Total** | **0-100** |

- **Score ≥ 80:** Auto-promote to `platform_tools` (status `approved`). Available immediately. Admin can veto retroactively.
- **Score 50-79:** Flag for admin review. One-click approve.
- **Score < 50:** Keep cluster-private. Re-evaluate in 30 days.

**Why auto-promote?** Observer already analyzes the tool. Reusability scoring is natural extension. Waiting for 3 clusters is wasteful. Admin veto (not approval) flips burden.

### 3.3 Stage 3: Global Discovery & Enablement

New cluster creation → Genesis Engine browses `platform_tools` → filters by cluster type, conflicts → presents catalog → one-click enable → `cluster_tool_enablements` row with validated config + cluster skin.

### 3.4 Stage 4: Soft Retirement

- **90 days unused:** Status → `unused`. Still in catalog under "Show unused" toggle. Revival: one click.
- **180 days unused:** Status → `archived`. Hidden from default view. Revival: platform_admin only. No rebuild cost.
- **No active deletion.** Code stays in repo. Hiding is free; deletion is expensive and risky.

---

## 4. Cluster-Specific Skin

| Field | Default (`platform_tools`) | Cluster Override (`cluster_tool_enablements`) |
|-------|---------------------------|-----------------------------------------------|
| Display name | "Document Analysis" | "Paper Analysis" / "Scripture Upload" |
| Description | "Upload and analyze documents" | "Upload academic papers for discussion" |
| Icon | 📄 | 📖 / 🧪 |
| Prompt fragment | "Help members analyze documents" | "Focus on philosophical arguments" |
| Config | `{ max_file_size_mb: 50 }` | `{ max_file_size_mb: 100 }` |

**Rule:** Override null → use default. All overrides validated against JSON Schema.

---

## 5. Versioning

New clusters get latest version by default. Existing clusters stay pinned until admin clicks "Upgrade" or Genesis auto-upgrades on validation.

**Breaking changes:** If new version changes `config_schema`, old-version clusters NOT auto-upgraded. Admin reviews and migrates config manually.

---

## 6. The Fork Pattern

If a cluster needs different backend logic (not just config):

```
Cluster B needs custom scripture citation parsing
→ Create new `platform_tools` row:
  tool_name: "document_analysis_faith"
  code_module: "src/tools/document-analysis-faith/index.ts"
→ Observer scores independently
  ≥80 → Global; <50 → Private to Cluster B
```

**Forking allowed but discouraged.** Observer's score asks: "Genuine new tool or just config variation?" Config variations use `config_overrides`, not forks.

---

## 7. Integration

### Genesis Engine
`cluster_genesis_spec.tools[]` references `platform_tool_id`. Cycle B validates that each has a `cluster_tool_enablements` row.

### Feature Signals
Before proposing new tools, Clio/Sage check `platform_tools`. Match exists → recommend enabling. No match → standard proposal chain.

### Tool Economy (Deferred)
`platform_tools.cost_profile` stores dev cost, deployment cost, per-invocation LLM tokens/compute. Per-cluster marginal cost = deployment + (invocations × per_invocation).

### Admin Dashboard
```
Tools & Features tab
┌──────────────────────────────────────────────────────┐
│ Active Tools (3)                                    │
│  ✓ Paper Analysis    [Configure] [Pause] [Upgrade] │
│  ✓ Reading Themes    [Configure] [Pause]            │
│  ✓ Polls             [Configure] [Pause]            │
│                                                      │
│ Available Tools (12)                                 │
│  ○ Citation Manager ⭐  [Enable]  (premium)          │
│  ○ Event Coordination    [Enable]  (generic)          │
│  ○ Diagram Generator ⭐  [Enable]  (premium)          │
│                                                      │
│ [ Browse Full Library → ] [ Show Unused (3) ]        │
└──────────────────────────────────────────────────────┘
```

---

## 8. Constraints

1. **Global tools still require human enablement** — registry does not bypass admin/Genesis gates.
2. **Cluster type compatibility enforced** — premium tools cannot be enabled on generic clusters.
3. **Tool conflicts resolved** — `incompatible_tools` array prevents dangerous combinations.
4. **Versioning protects existing clusters** — upgrades do not break live clusters.
5. **Soft retirement only** — no active deletion. Archiving hides without breaking.
6. **No protocol disclosure** — members never see why a tool is or isn't available.
7. **Phase 0 does not implement** — registry is main-product only.
8. **Config schema validation prevents runtime errors** — invalid configs rejected at enablement.
9. **Admin can veto any auto-promotion** — one-click demote with audit log.
10. **Forking is audited** — every fork is logged and scored independently.
