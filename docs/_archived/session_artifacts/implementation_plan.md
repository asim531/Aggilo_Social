# Atlas Streamlining + AutoResearch Removal — Implementation Plan

## Goal

Three integrated changes:
1. **Remove AutoResearch** (verification + calibration) without affecting any other functionality
2. **Streamline Atlas** per all 9 recommendations (cadence, budget, hooks, sourcing, batch size, etc.)
3. **Clarify the Clio→Sage→Atlas flow** for pre-opt-in vs post-opt-in phases

---

## User Review Required

> [!IMPORTANT]
> **Atlas Budget — Provider Overflow Model:** You confirmed the hard cutoff of 200 batches/day is too rigid for production. The updated plan uses a **Groq overflow model**: NIM is primary (30% reservation), and when NIM is exhausted, the next batch rolls over to Groq/Llama 3 automatically. Each new batch starts with a fresh dedup check against what was already generated, so there's no repetition across quota boundaries.

> [!IMPORTANT]
> **Clio→Sage→Atlas Pre/Post Opt-In Flow:** The plan updates the PRD and architecture to show:
> - **Pre-opt-in:** Clio → Sage (background, invisible to user) → Atlas → content appears in cluster under Clio's voice
> - **Post-opt-in:** Sage → Atlas directly, Sage posts to cluster as herself
>
> This reconciles the PRD's "Clio instructs Atlas" with the current Sage-principal architecture. The tech stack doesn't change — Sage always handles Atlas. What changes is the attribution layer: before opt-in, Sage's output is presented as Clio's.

---

## Proposed Changes

### Component 1 — AutoResearch Removal

---

#### ~~[DELETE] AutoResearch Extended Document~~ ✅ ALREADY DONE

> [!NOTE]
> Both archives were completed in a prior session. The files now live at:
> - `AGGILO_COMPLETE_DOCS/_archived/AUTORESEARCH_EXTENDED_v1.0.md`
> - `docs/_archived/AUTORESEARCH_EXTENDED.md`
>
> No action required.

---

#### [MODIFY] Atlas AGENTS Documents (3 copies)

Files:
- [ATLAS_AGENTS_v1.1.md](file:///d:/Aggilo_Social/augments/agentic_framework/AGGILO_COMPLETE_DOCS/ATLAS_AGENTS_v1.1.md) (canonical)
- [ATLAS_AGENTS_v1.1.md](file:///d:/Aggilo_Social/augments/agentic_framework/ATLAS_AGENTS_v1.1.md) (copy)
- [AGENTS.md](file:///d:/Aggilo_Social/atlas/AGENTS.md) (root)

> [!TIP]
> **Edit order: bottom-up.** Process edits from highest line number to lowest so deletions don't shift line numbers for subsequent edits.

Changes per copy (ordered bottom-up):
1. Remove `atlas_engagement_weights` from database fields (line ~395)
2. Remove `autoResearch_passed` from database fields (line ~392)
3. **Delete `AtlasCalibrationJob` section** (lines ~363–381)
4. Remove "Include AutoResearch metadata" rule (line ~347)
5. Remove "Skip AutoResearch" guardrail (line ~341)
6. Remove `autoResearch` metadata block from output schema (lines ~293–299)
7. Zero-Content Protocol: change "pass AutoResearch and clear" → "clear" (line ~205)
8. **Delete entire AutoResearch Protocol section** (lines ~169–199)
9. Remove `AutoResearch` from skill description (line ~82)
10. Remove "Run AutoResearch" from the 5-step summary (line ~51) → becomes 4 steps

---

#### [MODIFY] Atlas SOUL

##### [MODIFY] [SOUL.md](file:///d:/Aggilo_Social/atlas/SOUL.md)
- Line 30: Remove "Running AutoResearch — multi-step verification..." from the 6-step list → becomes 5 steps
- Renumber remaining steps

---

#### [MODIFY] Cluster Pulse Skill

##### [MODIFY] [SKILL.md](file:///d:/Aggilo_Social/atlas/skills/cluster_pulse/SKILL.md)
- Line 3: Remove "AutoResearch" from title
- Line 14: Remove `AtlasCalibrationJob` from trigger list
- **Delete entire Step 5 section** (lines 101–113)
- Line 140: Change "Steps 4 + 5" → "Step 4"
- Line 175: Remove "including AutoResearch metadata per card"
- Line 222: Remove "AutoResearch cross-ref fails" row
- Renumber steps 6→5, 7→6, 8→7, 9→8, 10→9

---

#### [MODIFY] SPEC_ADDENDUM (2 copies)

##### [MODIFY] [AGGILO_SPEC_ADDENDUM_v1_0.md](file:///d:/Aggilo_Social/augments/agentic_framework/AGGILO_COMPLETE_DOCS/AGGILO_SPEC_ADDENDUM_v1_0.md) (canonical)
- **Delete entire Section 3** (lines 266–328) — Calibration Queue Model
- Remove `atlas_calibration_history` from Section 5 new fields table (line 592)

##### [MODIFY] [SPEC_ADDENDUM.md](file:///d:/Aggilo_Social/docs/SPEC_ADDENDUM.md) (copy)
- Line 270: Remove `AtlasCalibrationJob` reference in calibration description
- Lines 280, 285: Remove `SageCalibrationReadiness` → `AtlasCalibrationJob` dispatch flow
- Lines 312–327: Remove `atlas_calibration_history` schema additions and ALTER TABLE statements
- Line 321: **Delete entire AutoResearch queue model paragraph**
- Line 592: Remove `atlas_calibration_history` from new fields table

---

#### [MODIFY] MASTER_INSTRUCTIONS (2 copies — canonical already clean)

> [!NOTE]
> The canonical copy in `AGGILO_COMPLETE_DOCS/` was already cleaned in a prior session (confirmed: zero `AutoResearch`, `calibration`, or `autoResearch_passed` references). Only the two copies need Component 1 edits. All three copies need Component 2 additions (tunable parameters).

Files needing AutoResearch removal:
- [MASTER_INSTRUCTIONS.md](file:///d:/Aggilo_Social/augments/agentic_framework/MASTER_INSTRUCTIONS.md) (copy)
- [MASTER_INSTRUCTIONS.md](file:///d:/Aggilo_Social/docs/MASTER_INSTRUCTIONS.md) (copy)

Changes per copy:
1. Phase 4 build list: Remove "AutoResearch protocol" item (line 121) and "AtlasCalibrationJob" item (line 127)
2. Phase 4 test criteria: Remove AutoResearch from test script (lines 129-130)
3. Database fields: Remove `autoResearch_passed` (line 232)
4. Database fields: Remove `atlas_engagement_weights` (line 227)
5. Tunable parameters: Remove "Atlas calibration cadence" (line 247)

---

#### [MODIFY] Observer / Platform Intelligence Documents (3 files)

##### [MODIFY] [AGGILO_OBSERVER_AGENTS.md](file:///d:/Aggilo_Social/augments/agentic_framework/AGGILO_COMPLETE_DOCS/AGGILO_OBSERVER_AGENTS.md)
- Line 198: Remove "AutoResearch failure rate, calibration job delta size" from Domain 5 reads

##### [MODIFY] [AGGILO_OBSERVER_AGENTS.md](file:///d:/Aggilo_Social/augments/agentic_framework/AGGILO_OBSERVER_AGENTS.md) (copy)
- Line 198: Same edit — remove "AutoResearch failure rate, calibration job delta size"

##### [MODIFY] [PLATFORM_INTELLIGENCE.md](file:///d:/Aggilo_Social/docs/PLATFORM_INTELLIGENCE.md)
- Line 141: Remove "AutoResearch failure rate, calibration job delta size" from Atlas reads

---

#### [MODIFY] Sage AGENTS Documents (3 copies) — AutoResearch label removal

Files:
- [AGENTS.md](file:///d:/Aggilo_Social/sage/AGENTS.md) (root)
- [SAGE_AGENTS_v1.0.md](file:///d:/Aggilo_Social/augments/agentic_framework/SAGE_AGENTS_v1.0.md) (copy)
- [SAGE_AGENTS_v1.0.md](file:///d:/Aggilo_Social/augments/agentic_framework/AGGILO_COMPLETE_DOCS/SAGE_AGENTS_v1.0.md) (canonical)

Changes per copy:
- Line 28: Change `"Atlas (content intelligence · fetch · AutoResearch · score)"` → `"Atlas (content intelligence · fetch · score)"`

---

#### [MODIFY] Clio AGENTS — Deprecate stale atlas_orchestration reference

##### [MODIFY] [AGENTS.md](file:///d:/Aggilo_Social/clio/AGENTS.md)
- Line 206: Mark `atlas_orchestration` skill as `(DEPRECATED — see sage_coordination)` and remove "every 6h Scout cycle" cadence reference
- Line 266: Update "Scheduled (every 6h)" to note deprecation or remove stale Scout Lane A reference

---

#### [MODIFY] Architecture HTML Files

##### [MODIFY] [aggilo_architecture.html](file:///d:/Aggilo_Social/aggilo_architecture.html)
- Line 1116, 1354: "Fetch + AutoResearch + Score" → "Fetch + Score"
- Line 1376: Remove "④ AutoResearch verification" step
- Line 1627: "Fetch → AutoResearch → Score" → "Fetch → Score"
- Lines 1789, 1794: Remove AutoResearch references
- Line 1926: Remove `AutoResearch (6-step)` tag

##### [MODIFY] [agentic_workflow.html](file:///d:/Aggilo_Social/agentic_workflow.html)
- Line 407: Remove AutoResearch bullet
- Line 486: Remove "Runs AutoResearch verification"

---

### Component 2 — Atlas Streamlining (9 Recommendations)

---

#### [MODIFY] Atlas AGENTS (canonical — same files as Component 1)

1. **Cadence change:** `AtlasPulseRefresh` from "Every 6h" → "Daily at 04:00" (line 361)
2. **Batch size change:** Default `content_count_requested` from 10 → 5
3. **Crawl sources:** Add note: "API/RSS primary, headless Chrome fallback only"
4. **New section: Atlas Budget** — adds NIM quota reservation + Groq overflow model
5. **New field:** `clusters.consecutive_synthesis_count` (INT, default 0)
6. **Update Zero-Content Protocol:** Add 3-strike Observer alert for consecutive synthesis

---

#### [MODIFY] Cluster Pulse SKILL.md

1. **Step 2 (Build Source Queue):** Add priority order: RSS feed → API → Chrome fallback
2. **Step 4 (Score):** Batch size max from 20 → 10 items scored
3. **Step 7 (Generate Hook):** Note: "Primary: Groq/Llama 3. Fallback: NIM."
4. **Step 8 (Rank):** Truncate to 5 (not 10)
5. **Performance targets:** Update cards returned (0-5), scoring calls (≤15)
6. **New Step: Dedup Cache Check** before crawl — shared Redis cache with 1h TTL

---

#### [MODIFY] YANTRA_BRIDGE_SPEC (3 copies) — routing table + batch size

Files:
- [YANTRA_BRIDGE_SPEC.md](file:///d:/Aggilo_Social/docs/YANTRA_BRIDGE_SPEC.md)
- [YANTRA_BRIDGE_SPEC.md](file:///d:/Aggilo_Social/augments/agentic_framework/YANTRA_BRIDGE_SPEC.md)
- [YANTRA_BRIDGE_SPEC.md](file:///d:/Aggilo_Social/augments/agentic_framework/AGGILO_COMPLETE_DOCS/YANTRA_BRIDGE_SPEC.md)

Changes per copy:
1. **Routing table** (line ~472): Swap `atlas_hook_generation` primary/fallback:
```diff
  "op_id": "atlas_hook_generation",
- "primary": "nvidia_nim_kimi",
- "fallback": "groq_llama3",
+ "primary": "groq_llama3",
+ "fallback": "nvidia_nim_kimi",
```
2. **Batch size** (line ~171): Change `"content_count_requested": 10` → `"content_count_requested": 5`

---

#### [MODIFY] SAGE_AGENTS_v1.0.md (3 copies — same files as Sage AGENTS in Component 1)

1. Brief construction: `content_count_requested` default from 10 → 5
2. Brief issuance triggers: Atlas pulse cycle from "(6h)" → "(daily)"
3. Add Poll RL mechanical spec (explicit prompt bonus + format preference)
4. Posting cadence table: Atlas card approved from "Per Atlas cycle (6h)" → "Per Atlas cycle (daily)"

---

#### [MODIFY] MASTER_INSTRUCTIONS (tunable parameters table)

Add new tunable parameters:
```
| atlas_nim_reservation_pct | 30 | Atlas max share of NIM quota |
| clio_nim_reservation_pct | 50 | Clio reserved share of NIM quota |
| atlas_max_batch_size | 5 | Cards per Atlas batch |
| atlas_pulse_cadence | daily | Content refresh frequency |
| synthesis_consecutive_alert | 3 | Consecutive synthesis cycles before Observer alert |
```

---

### Component 3 — Clio→Sage→Atlas Flow Clarification

---

#### [MODIFY] PRD 10 — Atlas Agent

##### [MODIFY] [10_atlas_agent.md](file:///d:/Aggilo_Social/PRD/10_atlas_agent.md)

**Do NOT archive.** Update to show the dual-phase flow:

1. Update the header "Clio-Orchestrated" → "Clio/Sage-Orchestrated"
2. Update the Important note: "Clio instructs Atlas" → "Clio instructs Sage who instructs Atlas (pre-opt-in). After opt-in, Sage instructs Atlas directly."
3. Update the Mermaid diagram to show:
   ```
   Pre-opt-in: Clio → Sage (background) → Atlas → Clio posts to cluster
   Post-opt-in: Sage → Atlas → Sage posts to cluster
   ```
4. Update state machine to include Sage as intermediary
5. **Update `content_count_requested`** from 10 → 5 (line 147)
6. Keep all other PRD content (conversation hooks, demographic brief format, guardrails) — these are still valid

---

#### [MODIFY] CLIO_SAGE_HANDOFF_v1.1.md

Add a new section (after Section 05) clarifying:
- **Pre-opt-in content flow:** Sage runs behind the scenes for all clusters. Atlas cards are presented to users under Clio's voice. The user perceives Clio as the content curator.
- **Post-opt-in content flow:** Sage is visible. Atlas cards are presented under Sage's attribution.
- **No architectural difference:** The backend flow is always Sage → Atlas. The change is purely at the attribution/UI layer.

---

#### [MODIFY] Atlas SOUL.md

- Line 30: Update step list to clarify "Receiving a content brief from Sage (who may be operating on behalf of Clio for pre-opt-in users)"

---

## Open Questions

> [!IMPORTANT]
> **Groq Overflow — Rate Limit Awareness:** Groq currently offers 100 RPM free tier. If Atlas overflows to Groq frequently, those 100 RPM slots compete with Atlas scoring calls (which already run on Groq). Should we set a separate Groq budget partition for overflow hooks vs. scoring? Or is 100 RPM sufficient for both at Phase 1 scale?

> [!IMPORTANT]
> **RSS Feed Coverage:** Switching to API/RSS-first sourcing means we need to validate that RSS feeds exist and return useful data for all 10 priority sources. Some sources (The Ken, LinkedIn trending) may not have public RSS. Should we keep Chrome as the primary for those specific sources?

---

## Verification Plan

### Automated Tests

**AutoResearch Removal — zero-hit checks:**
1. `grep -ri "autoResearch" d:\Aggilo_Social` — should return zero results in non-archived files
2. `grep -ri "AtlasCalibrationJob" d:\Aggilo_Social` — should return zero results in non-archived files
3. `grep -ri "calibration_history" d:\Aggilo_Social` — should return zero in non-archived files (except `scout_calibration_history` in Scout AGENTS, which is Scout's own calibration and unrelated to Atlas AutoResearch)
4. `grep -ri "atlas_engagement_weights" d:\Aggilo_Social` — should return zero in non-archived files

**Targeted file checks (files that were missing from original plan):**
5. `grep -ri "AutoResearch" d:\Aggilo_Social\sage` — must return zero
6. `grep -ri "AutoResearch" d:\Aggilo_Social\docs\SPEC_ADDENDUM.md` — must return zero
7. `grep -ri "AutoResearch" d:\Aggilo_Social\docs\PLATFORM_INTELLIGENCE.md` — must return zero
8. `grep -ri "AtlasCalibrationJob" d:\Aggilo_Social\docs\SPEC_ADDENDUM.md` — must return zero

**Document consistency checks:**
9. Verify `content_count_requested` defaults to `5` across ALL files (including PRD, Yantra copies)
10. Verify `AtlasPulseRefresh` shows "Daily" across ALL files
11. Verify `atlas_hook_generation` routing shows `groq_llama3` as primary across all 3 Yantra copies

**Copy consistency:**
12. Diff canonical ATLAS_AGENTS vs. copies — must be identical
13. Diff canonical MASTER_INSTRUCTIONS vs. copies — must be identical
14. Diff canonical SAGE_AGENTS vs. copies — must be identical
15. Diff canonical YANTRA_BRIDGE_SPEC vs. copies — must be identical

### Manual Verification

- User reviews all modified files for accuracy
- User confirms the Clio→Sage→Atlas pre/post-opt-in flow description matches their mental model
