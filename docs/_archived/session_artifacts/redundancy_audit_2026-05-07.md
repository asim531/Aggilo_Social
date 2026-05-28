# Redundancy Audit

> **Scope:** All files in `d:\Aggilo_Social` reviewed for duplicates, superseded copies, stale redirects, and orphaned files  
> **Date:** 2026-05-07

---

## Summary

| Category | Count | Reclaimable Space |
|:---|:---|:---|
| 🔴 Identical duplicate files | 3 files (webm videos) | **1.93 MB** |
| 🟡 Redirect stubs (deletable) | 4 files | ~3 KB |
| 🟡 Superseded docs (should archive) | 2 files | ~22 KB |
| 🟢 Empty error directory | 1 dir | 0 |
| **Total** | **10 items** | **~1.95 MB** |

---

## 🔴 Identical Duplicates — Delete One Copy

### 1. WebM videos duplicated across landing pages

The India landing (`launch/landing/webm/`) and global landing (`launch/global_landing/webm/`) contain **byte-identical copies** of all 3 Clio animation videos (verified via SHA-256 hash):

| File | Size | Identical? |
|:---|:---|:---|
| `resting01_transparent.webm` | 553 KB × 2 | ✅ Same hash |
| `resting02_transparent.webm` | 704 KB × 2 | ✅ Same hash |
| `Resting_to_empathy_transparent.webm` | 714 KB × 2 | ✅ Same hash |

**Recommendation:** Move the 3 webm files to a shared `launch/webm/` folder and update both `index.html` files to reference the shared path. Saves **1.93 MB**.

---

## 🟡 Redirect Stubs — Safe to Delete

These exist only for backward compatibility. If no external bookmarks point to them, they can be removed.

| File | Points to | Size |
|:---|:---|:---|
| `yantra_guide.html` (root) | → `yantra/guides/yantra_guide.html` | 729 B |
| `architecture_reference.html` (root) | → `yantra/guides/architecture_reference.html` | 779 B |
| `agentic_workflow.html` (root) | → `yantra/guides/agentic_workflow.html` | 757 B |
| `docs/YANTRA_BRIDGE_SPEC.md` | → `yantra/YANTRA_BRIDGE_SPEC.md` | 407 B |

**Recommendation:** Delete all 4. The canonical files in `yantra/` and `yantra/guides/` are the source of truth. No external system references these root-level stubs.

---

## 🟡 Superseded Documents — Move to `_archived`

### 2. `docs/CLUSTER_DESCRIPTION_REFINEMENT.md` (11.3 KB)

This is an earlier version of the cluster description refinement spec. The canonical version lives at `sage/skills/cluster_description_refinement/SKILL.md` (11.8 KB — slightly larger, has been updated). The `docs/` version is stale.

**Recommendation:** Move to `docs/_archived/CLUSTER_DESCRIPTION_REFINEMENT.md`.

### 3. `docs/_archived/CLIO_SAGE_HANDOFF_PROTOCOL.md` (16 KB)

The canonical handoff protocol is `docs/CLIO_SAGE_HANDOFF.md` (29.4 KB — nearly 2× larger, significantly expanded). The archived version is the original draft.

**Status:** Already in `_archived/` ✅ — no action needed. Correctly placed.

---

## 🟢 Empty Error Directory — Delete

### 4. `-Force` directory (root)

Empty directory at `d:\Aggilo_Social\-Force\`. This was likely created by a PowerShell command where `-Force` was accidentally treated as a directory name (e.g., `New-Item -Force` with a misplaced argument).

**Recommendation:** Delete. It contains nothing and its name is clearly an error.

---

## Items Reviewed — NOT Redundant

These looked suspicious but are intentionally separate:

| Item | Why it's NOT redundant |
|:---|:---|
| **PRD `.html` + `.md` pairs** (12 pairs) | The `.md` is the source, the `.html` is the rendered visual version with Mermaid diagrams. Both needed. |
| **`clio/legacy/` folder** (3 files: .txt, .docx, .html) | Historical v0 character bible in 3 formats. Correctly archived in `legacy/`. The `.html` now has a deprecation header. |
| **`docs/_archived/` folder** (5 files + session_artifacts/) | Correctly archived superseded docs. No action needed. |
| **`Revised_Screen_Prompts/_archived/`** | Contains v1 of screen prompts. v2 (phase1) is the current version. Correctly archived. |
| **`Ideal_user/Rajvir/`** | User research recordings (80MB audio + 350MB video). Large but intentional — user persona research data. |
| **`asset_persona_review.md`** (root) | The original review document you shared. Reference doc — keep. |
| **`walkthrough.md`** (root) | Session walkthrough from a previous conversation. Reference — keep or archive. |
| **`clio/assets/web/.gitkeep`** | Placeholder for future web-optimized assets. Correct Git pattern. |
| **`clio/assets/source/.gitkeep`** | Same — placeholder. Correct. |

---

## Decision Table

| # | Item | Action | Your Call |
|:---|:---|:---|:---|
| 1 | 3× duplicate webm files | **Consolidate** to `launch/webm/` | Approve? |
| 2 | 3× root redirect HTML stubs | **Delete** | Approve? |
| 3 | `docs/YANTRA_BRIDGE_SPEC.md` redirect | **Delete** | Approve? |
| 4 | `docs/CLUSTER_DESCRIPTION_REFINEMENT.md` | **Move** to `docs/_archived/` | Approve? |
| 5 | `-Force` empty directory | **Delete** | Approve? |
