# White Paper Analysis Quality Audit — Research Circle MJ

**Date:** 2025-06-02  
**Scope:** Paper upload → analysis → discussion pipeline  
**Audited files:** `analyze/route.ts`, `decompose-prompts.ts`, `diagram-prompt.ts`, `ResearchPaperCard.tsx`, `PaperDecomposition.tsx`, `PaperDiagramViewer.tsx`, `PaperCitationLinks.tsx`, `PaperTagThreads.tsx`, `white-paper-html-export.ts`, `PostComposer.tsx`

---

## 1. Vague problem framing — baselines, specific brokenness

**Status:** ⚠️ PARTIAL

**What exists:**
- The `gaps` decomposition pass asks: "missing data, weak generalizations, unaddressed confounders"
- The `argument` pass asks for "central thesis, supporting claims, key evidence"

**What's missing:**
- No prompt asks: "What is the baseline? By how much does this paper improve it?"
- No section requires quantified claims ("3.2x speedup", "reduces error from 12% to 4%")
- The analysis is descriptive, not evaluative against a standard

**Fix:** Add a `baseline` field to the `gaps` pass prompt. Require every pass to extract: (1) claimed improvement, (2) baseline comparison, (3) whether evidence supports the claim.

---

## 2. Related work treated as an afterthought

**Status:** ⚠️ PARTIAL

**What exists:**
- Citation extraction links papers that explicitly mention each other (`paper_citations` table)
- `PaperCitationLinks.tsx` shows bidirectional links

**What's missing:**
- No pass evaluates whether the paper adequately covers prior work
- No prompt asks: "Does the related work section miss key papers?"
- Citations are extracted but not critiqued (coverage depth, recency, relevance)

**Fix:** Add a `related_work` pass to decomposition. Prompt: "Evaluate the related work section: coverage depth, missing seminal papers, whether cited works are fairly characterized."

---

## 3. No reproducible evidence

**Status:** ❌ MISSING

**What exists:**
- The `gaps` pass notes "missing data, weak generalizations"
- Metadata extraction pulls authors, venue, year, DOI

**What's missing:**
- No extraction of benchmarks, datasets, or experimental setup
- No complexity analysis (Big-O, throughput, latency)
- No table of results with numbers
- The analysis is entirely LLM-generated prose — no structured data

**Fix:** Add a `results` pass that extracts:
  - Datasets used (name, size, source)
  - Metrics (accuracy, F1, latency, throughput)
  - Baseline comparison table
  - Statistical significance claims
  - Code / data availability statements

---

## 4. Architecture diagrams that explain nothing

**Status:** ❌ MISSING

**What exists:**
- 4 diagram types generated: concept_map, process_flow, architecture, argument_tree
- `PaperDiagramViewer.tsx` renders SVGs with pan/zoom

**What's missing:**
- No diagram captions explaining what conclusion to draw
- Titles are generic: `"Paper Title — concept_map"`
- No text below diagrams saying: "This shows X, which means Y"
- Users see pretty boxes but don't know why they matter

**Fix:**
  1. Update diagram prompt to include a `caption` field: "Write a 1-2 sentence caption explaining what this diagram reveals about the paper's contribution."
  2. Render caption below each diagram in `PaperDiagramViewer.tsx`
  3. In HTML export, include captions under each diagram section

---

## 5. Define your audience before writing

**Status:** ❌ MISSING

**What exists:**
- The `compression` pass produces "a non-expert could understand" summary
- `PostComposer.tsx` has generic placeholders like "Share a draft, a question, or a finding…"

**What's missing:**
- No audience selection for posts or analysis
- No "practitioner vs researcher vs decision-maker" targeting
- The 5-pass decomposition doesn't adapt depth based on who will read it
- Discussion threads have no audience tagging

**Fix:**
  1. Add audience selector to `PostComposer.tsx`: `[Practitioner] [Researcher] [Decision-maker] [All]`
  2. Store audience on posts, pass to Sage evaluation
  3. Adapt decomposition prompts: practitioner gets implementation focus, researcher gets theoretical depth, decision-maker gets cost/benefit framing

---

## 6. Lead with the problem, not your solution

**Status:** ⚠️ PARTIAL

**What exists:**
- The `argument` pass identifies the central thesis
- Default discussion tags include `#limitations` (problem-oriented)

**What's missing:**
- The 5-pass order starts with `structure` (descriptive), not the problem
- No explicit "Problem Statement" decomposition pass
- Posts don't have a "What's the problem?" template
- The `compression` summary often leads with what was done, not why it matters

**Fix:**
  1. Reorder passes: `problem → argument → structure → terminology → gaps → compression`
  2. Add a `problem` pass prompt: "What concrete problem does this paper solve? Who feels the pain? How bad is it?"
  3. Update `PostComposer.tsx` placeholder: "What problem are you trying to solve? What have you tried?"

---

## 7. Numbered sections with consistent heading logic

**Status:** ⚠️ PARTIAL

**What exists:**
- The 5-pass decomposition has consistent structure: title, content, key_points
- HTML export has consistent `<h2>` sections

**What's missing:**
- Passes aren't numbered (users see "Structure Map" not "1. Structure Map")
- No enforcement of numbered subsections within each pass
- Discussion threads (`PaperTagThreads`) have no section numbering
- Export lacks a table of contents

**Fix:**
  1. Number passes in UI: "1. Problem Statement", "2. Core Argument", etc.
  2. Update `PaperDecomposition.tsx` to show pass numbers
  3. Add TOC to HTML export
  4. In prompts, require numbered subsections: "1.1 Background", "1.2 Specific gap"

---

## 8. Consistent notation — variable naming in formal sections

**Status:** ⚠️ PARTIAL

**What exists:**
- The `terminology` pass extracts terms and definitions
- `DecompositionResult` type enforces `{ title, content, key_points }` structure

**What's missing:**
- No cross-pass consistency check (same term used differently in `argument` vs `gaps`)
- No notation extraction (mathematical symbols, variables)
- No glossary that persists across the cluster
- Posts don't enforce notation conventions

**Fix:**
  1. Add `notation` field to `terminology` pass: extract variables, symbols, equations
  2. Build a cluster-wide glossary from all papers' terminology passes
  3. Show glossary sidebar in `ResearchPaperCard.tsx`
  4. Flag inconsistent notation across papers (e.g., `N` means samples in one, nodes in another)

---

## 9. Outsider readability test — intro/conclusion clarity

**Status:** ⚠️ PARTIAL

**What exists:**
- The `compression` pass is designed for non-expert understanding
- `PaperDecomposition.tsx` has a generic-title fallback that uses pass labels

**What's missing:**
- No explicit test: "Can a first-year grad student explain this back to you?"
- No clarity scoring or readability metrics
- The `compression` pass runs after all others, not as a gate
- No "explain it like I'm 5" forced summary

**Fix:**
  1. Add a `readability` pass: "Summarize this paper in 3 sentences that a smart 12-year-old could understand. If you can't, the paper may be poorly written."
  2. Surface readability score in `ResearchPaperCard.tsx` header
  3. In `PostComposer.tsx`, add a "ELI5 your point" inline helper

---

## Summary Table

| Principle | Status | File to change | Effort |
|-----------|--------|----------------|--------|
| 1. Vague problem framing | ⚠️ PARTIAL | `decompose-prompts.ts` gaps pass | Low |
| 2. Related work | ⚠️ PARTIAL | `decompose-prompts.ts` new pass | Medium |
| 3. Reproducible evidence | ❌ MISSING | `decompose-prompts.ts` new pass + DB migration | Medium |
| 4. Diagram captions | ❌ MISSING | `diagram-prompt.ts`, `PaperDiagramViewer.tsx` | Low |
| 5. Audience definition | ❌ MISSING | `PostComposer.tsx`, `decompose-prompts.ts` | Medium |
| 6. Problem-first | ⚠️ PARTIAL | `decompose-prompts.ts` reorder + new pass | Low |
| 7. Numbered sections | ⚠️ PARTIAL | `PaperDecomposition.tsx`, `white-paper-html-export.ts` | Low |
| 8. Consistent notation | ⚠️ PARTIAL | `decompose-prompts.ts`, new glossary feature | Medium |
| 9. Outsider readability | ⚠️ PARTIAL | `decompose-prompts.ts` new pass | Low |

---

## Recommended Implementation Order

1. **Diagram captions** (low effort, high visibility) — fix `diagram-prompt.ts` + `PaperDiagramViewer.tsx`
2. **Numbered passes** (low effort) — update `PaperDecomposition.tsx` labels
3. **Problem-first reorder** (low effort) — reorder passes, add `problem` pass
4. **Baseline extraction** (medium effort) — add `results` pass with structured fields
5. **Audience targeting** (medium effort) — add audience selector to composer
6. **Related work critique** (medium effort) — add `related_work` pass
7. **Notation glossary** (medium effort) — build cluster-wide glossary from terminology
8. **Readability test** (low effort) — add `readability` pass
