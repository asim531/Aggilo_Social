# Aggilo Architecture — Walkthrough

> **Session summary: Strategic architecture implementation**
> *Covers changes made across Scout, Observer, Yantra, maintenance/, clusters/ — v2 of the strategic review fully implemented.*

---

## What Was Done

### 1. Yantra Separated Into Its Own Folder

**New structure:**
```
yantra/
├── README.md                  ← New: entry point explaining what Yantra is
├── YANTRA_BRIDGE_SPEC.md      ← Moved from docs/
├── routing_table.json         ← New: canonical file (was only a code block in the spec)
└── guides/
    ├── yantra_guide.html      ← Moved from root
    ├── agentic_workflow.html  ← Moved from root
    └── architecture_reference.html ← Moved from root
```

`docs/YANTRA_BRIDGE_SPEC.md` is now a redirect stub pointing to `yantra/`.

**`routing_table.json`** is now a real tracked file — two new ops added:
- `tool_proposal_analysis` — high-capability model (Claude/Kimi) for superior agent tool reasoning
- `pre_check_structured` — fast Groq call for radical-shift gate, scope checks, PII scans

---

### 2. Maintenance Folder Created

```
maintenance/
├── README.md                        ← Tool proposal lifecycle, hierarchy, admin checklist
├── templates/
│   └── TOOL_PROPOSAL_TEMPLATE.md   ← Standard MD format for every proposal
└── 2026-05/                         ← Monthly subdirectory (first one seeded)
```

The template covers: proposal header, why the tool is needed, trigger condition, input/output schema, implementation notes, privacy check, and admin decision tracking.

---

### 3. Hierarchical Tool Proposal System Documented

The key architectural principle established across all updated documents:

> **Tool proposals flow DOWN the authority chain — from each agent's immediate superior.**

| Agent | Who proposes its tools |
|---|---|
| **Atlas** | Sage |
| **Sage** | Clio |
| **Scout** | Clio |
| **Clio** | Observer (governed by Platform Rules) |
| **Observer** | Platform Rules + Admin-designated LLM |

All proposals are written as human-readable MD files in `maintenance/[YYYY-MM]/`. Admin reviews and approves before any tool is activated.

---

### 4. Scout Upgraded to v1.2 — Dual Intelligence Mode

**`scout/SOUL.md`** (v1.1 → v1.2) and **`scout/AGENTS.md`** (v1.0 → v1.1) now formally codify Scout's two operating modes:

| Mode | What it does |
|---|---|
| **Mode A — Internet Signal Observation** | Live crawl of public communities (Reddit, LinkedIn, Twitter/X). Requires 20-post minimum. |
| **Mode B — LLM Inference** | Reasons from trained knowledge to surface community patterns where live signal is thin or unavailable. |

Key rule added: **Inference-only findings (Mode B) have a confidence ceiling of 0.70** until confirmed by Mode A observation. The report schema now includes `intelligence_mode` and `confidence_ceiling_applied` fields.

The SPEC_ADDENDUM inbound-only constraint is clarified to apply to **actions** (Scout never posts externally), not to **reasoning mode**.

---

### 5. Observer Upgraded to v1.2 — Domain 10 Added

**`Observer/AGGILO_OBSERVER_AGENTS.md`** (v1.1 → v1.2):

- **System Role** updated: Observer is now formally the agent responsible for proposing Clio tools, governed by Platform Rules and the admin-designated LLM
- **Domain 10 (Tool Analysis Triggers)** added — event-driven, runs on Observer findings from Domains 5, 6, 7, plus quarterly sweep
- **Admin Dashboard** updated to include "Tool Analysis Triggers" as the 10th domain
- **New job types:** `ObserverToolAnalysis`, `CliToolProposalJob`
- **New DB table:** `tool_proposals` — tracks all proposals (pending / approved / rejected / active / retired) with full audit trail
- **Actionable Job Types** table updated with four new tool-related actions

---

### 6. MASTER_INSTRUCTIONS Updated to v1.2

**`docs/MASTER_INSTRUCTIONS.md`**:
- Document inventory updated with all new files (yantra/README, routing_table.json, Scout v1.2/AGENTS v1.1, Observer v1.2, maintenance/ docs, CLUSTER_TOOLS_TEMPLATE)
- Authority hierarchy updated: `yantra/YANTRA_BRIDGE_SPEC.md` at position 4, cluster tool specifications at position 8 (narrowest scope)
- New DB fields registered: `scout_intelligence_reports.intelligence_mode`, `scout_intelligence_reports.confidence_ceiling_applied`
- New DB tables registered: `cluster_tools`, `tool_proposals`

---

### 7. Cluster Tools Template + First Instance

**`clusters/CLUSTER_TOOLS_TEMPLATE.md`** — standard template for every cluster:
- Active tools per agent (Atlas / Sage / Scout / Clio)
- Pending proposals
- Retired tools
- Tool review notes

**`clusters/the_single_source/CLUSTER_TOOLS.md`** — first real instantiation:
- Documents the two founding tools already defined in `CLUSTER_DESCRIPTION.md`:
  - `theology_sources` (Atlas) — academic theology content sources
  - `scripture_current_affairs` (Sage) — scripture-to-current-events mapping skill
- Sets up the next review trigger (Observer Domain 5 reporting on Sage accuracy, expected within 60 days of launch)
- Notes language-parallel instance monitoring rule

---

## Files Changed

| File | Change |
|---|---|
| `yantra/README.md` | **NEW** |
| `yantra/YANTRA_BRIDGE_SPEC.md` | **NEW** (copied from docs/) → **UPDATED** v1.0 → v1.1 (tool loader spec, observer worker spec, tool payload schemas, SQL schema, 14 LLM ops, updated dispatch map) |
| `yantra/routing_table.json` | **NEW** (canonicalised + 2 new ops) |
| `yantra/guides/yantra_guide.html` | **NEW** (copied from root) |
| `yantra/guides/agentic_workflow.html` | **NEW** (copied from root) |
| `yantra/guides/architecture_reference.html` | **NEW** (copied from root) |
| `yantra_guide.html` | **REPLACED** with HTML redirect stub |
| `agentic_workflow.html` | **REPLACED** with HTML redirect stub |
| `architecture_reference.html` | **REPLACED** with HTML redirect stub |
| `docs/YANTRA_BRIDGE_SPEC.md` | **REPLACED** with markdown redirect stub |
| `docs/MASTER_INSTRUCTIONS.md` | **UPDATED** v1.1 → v1.2 (Phase 7 expanded with tool pipeline, DB schema source refs, Bridge Spec v1.1 registered) |
| `clio/AGENTS.md` | **UPDATED** v1.0 → v1.1 |
| `sage/AGENTS.md` | **UPDATED** v1.0 → v1.1 |
| `atlas/AGENTS.md` | **UPDATED** v1.1 → v1.2 |
| `scout/SOUL.md` | **UPDATED** v1.1 → v1.2 |
| `scout/AGENTS.md` | **UPDATED** v1.0 → v1.1 |
| `Observer/AGGILO_OBSERVER_AGENTS.md` | **UPDATED** v1.1 → v1.2 |
| `maintenance/README.md` | **NEW** |
| `maintenance/templates/TOOL_PROPOSAL_TEMPLATE.md` | **NEW** |
| `clusters/CLUSTER_TOOLS_TEMPLATE.md` | **NEW** |
| `clusters/the_single_source/CLUSTER_TOOLS.md` | **NEW** |

---

## What Was NOT Changed

Per the user's instruction — the working of the application as described in the PRD folder was not touched. All PRD files are unchanged. Agent SOUL values, AGENTS operational rules (other than Scout's dual-mode clarification), and the CLIO_SAGE_HANDOFF are unchanged. The platform rules (AGGILO_PLATFORM_RULES.md) are unchanged.

---

## What Was Completed (Session 2 — 2026-05-05)

All specification-level items from the original "What Comes Next" list have been resolved:

| # | Item | Status | Where |
|---|---|---|---|
| 1 | `context/tool_loader.py` specification | ✅ **Done** | YANTRA_BRIDGE_SPEC v1.1 §Cluster Tool Loader — full reference Python, interface, graceful degradation, assembler integration |
| 2 | `cluster_tools` + `tool_proposals` SQL schema | ✅ **Done** | YANTRA_BRIDGE_SPEC v1.1 §Tool Management Database Schema — full `CREATE TABLE`, constraints, indexes |
| 3 | Register `tool_proposal_analysis` + `pre_check_structured` ops | ✅ **Done** | `routing_table.json` (session 1) + YANTRA_BRIDGE_SPEC v1.1 embedded router (session 2) |
| 4 | First tool analysis cycle (pilot) | ⚪ **Deferred** | Runtime action — run Observer Domain 10 on The Single Source post-launch |
| 5 | `ObserverToolAnalysis` + `CliToolProposalJob` workers | ✅ **Done** | YANTRA_BRIDGE_SPEC v1.1 §Observer Worker + §Tool Analysis Payload Schemas — full job specs, payload schemas, dispatch map |

### Additional changes in session 2:

- **YANTRA_BRIDGE_SPEC.md bumped to v1.1** — 6 workers (added `observer_worker.py`), 14 LLM ops (added `tool_proposal_analysis` + `pre_check_structured`), 12 job types (added 5 tool/observer jobs), full payload schemas, tool loader reference code, `cluster_tools` + `tool_proposals` SQL, Laravel dispatcher updated
- **MASTER_INSTRUCTIONS.md updated** — Bridge Spec version registered as v1.1, Phase 7 expanded to include Domain 10 and full tool management pipeline, DB schema source references updated to point to Bridge Spec SQL
- **Directory structure** in Bridge Spec now includes `tool_loader.py` and `observer_worker.py`
- **Worker dispatch map** in Bridge Spec now routes all 12 job types to 6 workers

---

## What Comes Next (Post-Launch)

1. **Pilot: First tool analysis cycle** — run Observer Domain 10 manually on The Single Source cluster. If capability gaps are found, the first `maintenance/2026-05/` proposal will be generated.

---

*Walkthrough · Aggilo Strategic Architecture Implementation · Sessions: 2026-05-04, 2026-05-05*
