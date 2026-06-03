# Cluster Features Gap Analysis — Research Circle MJ

**Date:** 2025-06-02
**Scope:** Full platform review prioritizing the paper analysis pipeline
**Auditor:** Expert senior research analyst perspective

---

## Executive Summary

The Research Circle MJ cluster is a competent Phase 0 implementation with strong foundational architecture (cluster scoping, optimistic UI, realtime, layered prompts). However, from a senior research analyst's perspective, **the white-paper tools are currently a surface-level LLM wrapper rather than a rigorous research analysis engine**. The decomposition produces prose summaries, not structured, evaluative, or comparative analysis. Key gaps include: no reproducibility tracking, no cross-paper comparison, shallow citation linking, weak diagram utility, no evidence extraction, and no researcher collaboration primitives beyond basic comments.

---

## 🔴 Critical Gaps — Missing Core Research Workflows

### 1. No Reproducibility / Evidence Pass
**Status:** ❌ MISSING — Blocks research rigor

**What exists:** The `gaps` pass notes "missing data, weak generalizations."
**What's missing:** No structured extraction of:
- Datasets used (name, size, source URL)
- Benchmarks / metrics with actual numbers
- Baseline vs. claimed improvement (quantified)
- Experimental setup details
- Statistical significance claims (p-values, confidence intervals)
- Code / data availability statements
- Hardware / compute requirements

**Why it matters:** A research analyst cannot evaluate a paper without knowing what was measured, how it was measured, and what the numbers are. The current analysis is purely descriptive prose — it tells you *what* the paper says, not whether the claims hold up.

**Recommended fix:** Add a `results` decomposition pass with a strict JSON schema:
```json
{
  "datasets": [{"name": "", "size": "", "source": "", "availability": ""}],
  "metrics": [{"name": "", "baseline_value": "", "claimed_value": "", "unit": ""}],
  "statistical_tests": [{"claim": "", "p_value": "", "confidence_interval": ""}],
  "code_availability": "",
  "reproducibility_score": "high|medium|low"
}
```

---

### 2. No Cross-Paper Comparison
**Status:** ❌ MISSING — Prevents literature synthesis

**What exists:** Citations link papers that explicitly mention each other. PaperIndex lists all docs.
**What's missing:**
- No way to compare two papers side-by-side on the same metrics
- No aggregation of "all papers in this cluster that use dataset X"
- No "papers citing the same prior work" view
- No thematic clustering of papers by method, domain, or dataset
- No trend analysis ("papers in this cluster increasingly use transformer architectures")

**Why it matters:** A research circle is not a file dropbox. The value is in synthesizing across papers — spotting trends, gaps in the collective literature, and methodological convergence/divergence.

**Recommended fix:**
1. Add a "Compare" mode to ResearchPaperCard that lets users select 2+ papers and see their decomposition passes side-by-side
2. Build a cluster-wide dashboard: methods used, datasets referenced, venues published in, year distribution
3. Add an RPC that finds papers sharing keywords / datasets

---

### 3. Citations Are Literal-String Matching, Not Semantic
**Status:** ⚠️ SHALLOW — Functional but brittle

**What exists:** `citation-extract.ts` prompts the LLM to find explicit title mentions in the text, then fuzzy-string-matches against existing doc_titles/file_names in the cluster.

**Problems:**
- Only catches citations where the *title* is explicitly mentioned in the text (many papers use author-year citations: "Smith et al., 2023")
- No linking to external papers (arXiv, DOI, Google Scholar)
- No verification that the cited paper actually exists
- No citation *context* analysis ("cited as supporting evidence" vs "cited as contrast")
- The `mention_context` field stores the raw sentence but is never analyzed

**Recommended fix:**
1. Accept author+year citations and attempt to resolve them via OpenAlex/CrossRef API
2. Add a `citation_context` enum: ["supports", "contrasts", "extends", "critiques", "mentions_in_passing"]
3. Show citation sentiment in the UI (green for supporting, red for contrasting)

---

### 4. Diagrams Lack Utility for Research Analysis
**Status:** ⚠️ SHALLOW — Pretty but not informative

**What exists:** 4 diagram types (concept_map, process_flow, architecture, argument_tree) generated as SVGs with pan/zoom.

**Problems:**
- Diagrams are static — if the decomposition text is updated, diagrams don't regenerate
- No "results table" diagram type (the most useful diagram for research papers)
- No interactive elements (hover for details, click to navigate to decomposition pass)
- No export of diagrams as standalone PNG/SVG files
- The LLM-generated SVGs are often structurally incorrect (overlapping text, broken arrows)
- Captions exist in the prompt but are embedded in SVG `<text>` elements — not human-readable as annotations

**Recommended fix:**
1. Add a `results_table` diagram type: structured HTML table showing metrics, baselines, datasets
2. Store diagram `caption` as a separate text field, render it prominently below the diagram
3. Add a "regenerate diagram" button tied to the decomposition pass
4. Offer diagram export (PNG/SVG download)

---

### 5. No Peer Review / Rating System
**Status:** ❌ MISSING — Core research circle primitive

**What exists:** Tag-threaded comments (`#methodology`, `#limitations`) + private/public annotations on decomposition passes.

**What's missing:**
- No formal peer review workflow (request review → receive structured feedback → revise → approve)
- No rating dimensions: novelty, rigor, clarity, significance, reproducibility
- No "reviewer assignment" — anyone can comment, but there's no mechanism to request a specific person's review
- No revision tracking for the paper itself (versions table exists but is unused — no UI for uploading v2)
- No "request Sage review of this paper" button that triggers a deeper, targeted analysis

**Recommended fix:**
1. Add a `paper_reviews` table with dimensions: novelty, rigor, clarity, significance, reproducibility (1-5 scale + text)
2. Add a "Request Review" button in ResearchPaperCard that notifies specific members
3. Wire the `paper_versions` table to the upload flow (detect same-title upload = new version)
4. Add a `@sage review #novelty` mention pattern that triggers targeted deep-dive on a specific dimension

---

### 6. Search Does Not Search Paper Content
**Status:** ⚠️ SHALLOW — Misses the most important search target

**What exists:** ThreadSearchBar searches: paper tags (by name), posts (by content), replies (by content), papers (via `search_papers` RPC — likely title/filename only).

**What's missing:** Full-text search across:
- Extracted PDF text (`post_attachments.extracted_text`)
- Decomposition pass content (`paper_decompositions.result_json`)
- Diagram captions
- Annotation bodies
- Comments in tag threads

**Why it matters:** A researcher needs to find "papers that mention ResNet" or "papers that evaluate on CIFAR-10." Current search only finds papers whose *title* contains the query.

**Recommended fix:**
1. Add a `search_papers_fulltext` RPC that queries `extracted_text` and `result_json` content
2. Use the `paper_embeddings` table (already exists!) for semantic search — vector similarity on the query embedding
3. Index decomposition content in search results ("Found in: Evidence & Gaps pass")

---

## 🟡 Quality Gaps — Features Exist But Are Underpowered

### 7. Decomposition Passes Are Independent, Not Cumulative
**Status:** ⚠️ SHALLOW

**What exists:** 6 passes run in isolation with the same 7000-char text window. Each pass gets no context from previous passes.

**Problems:**
- The `gaps` pass might flag "no baseline given" while the `problem` pass already identified the baseline — but they never see each other's output
- The `argument` pass might mischaracterize a claim because it didn't read the `terminology` pass's definitions
- Inconsistent terminology across passes (same concept called different things)
- No "cross-pass consistency check" — the analyst has to spot contradictions manually

**Recommended fix:**
1. Make passes cumulative: pass N receives the text + output of passes 1…N-1
2. Add a final `consistency` pass that checks for contradictions across all 6 passes
3. Store pass dependencies in a DAG instead of a flat list

---

### 8. Metadata Extraction Is Not Stored
**Status:** ⚠️ DATA LOSS

**What exists:** `buildMetadataExtractPrompt` extracts authors, venue, year, DOI, abstract, keywords. The `analyze/route.ts` calls it and logs the result.

**What's missing:** The metadata is NOT persisted to the attachment row. The update block (line 163-174) only stores `doc_title`, `doc_summary`, and `white_paper_tools_enabled`.

**Evidence:**
```typescript
const { error: updateErr } = await admin
  .from("post_attachments")
  .update({
    extracted_text: extractedText,
    doc_type: docType,
    doc_title: docTitle,
    doc_summary: metaResult.abstract ?? null,
    white_paper_tools_enabled: isResearchPaper,
    extracted_at: new Date().toISOString(),
  })
```

`metaResult.authors`, `venue`, `year`, `doi`, `keywords` are computed but discarded.

**Recommended fix:** Include all metadata fields in the update. The schema has them (`08_document_intelligence.sql` adds `authors`, `venue`, `year`, `doi`, `abstract`, `keywords`).

---

### 9. Schema Comment is Stale
**Status:** ⚠️ MAINTENANCE DEBT

**What exists:** `07_white_paper_tools.sql` line 155-157 says:
```sql
-- ┌──────────────────────────────────────────────────────────────────┐
-- │  STEP 5: paper_decompositions — 5-pass analysis results          │
-- └──────────────────────────────────────────────────────────────────┘
```

The code uses 6 passes (`problem` was added). The comment says 5. The `pass_type` column comment also lists only 5 passes.

---

### 10. No Analysis Quality Scoring
**Status:** ❌ MISSING

**What exists:** Decomposition passes run blindly. No feedback loop on whether the LLM produced good output.

**What's missing:**
- No confidence score per pass
- No fallback for low-confidence passes (re-run with different temperature/prompt)
- No user flagging of "this decomposition is wrong"
- No tracking of which passes succeeded vs failed
- No alerting if a paper gets classified as "research_paper" but all 6 decomposition passes fail

**Recommended fix:**
1. Add `confidence`, `quality_score`, `status` columns to `paper_decompositions`
2. If a pass produces a generic title ("research_paper"), auto-retry with a stricter prompt
3. Show pass quality indicators in the UI (green/yellow/red dot)

---

### 11. Paper Lifecycle Status Is Invisible
**Status:** ⚠️ UNWIRED

**What exists:** `post_attachments.paper_status` column exists with a default of `'uploaded'`. No enum constraints.

**What's missing:**
- No state machine defined (`uploaded` → `extracting` → `analyzing` → `ready` → `reviewed` → `archived`)
- No UI showing current status
- No workflow triggers (e.g., when all members have marked as "read", move to `reviewed`)
- The `ResearchPaperCard` header shows a reading status dropdown (personal) but not the paper's lifecycle status (collective)

---

### 12. Discussion Threads Lack Threading Depth
**Status:** ⚠️ SHALLOW

**What exists:** `paper_comments` is a flat list per tag. No replies to comments.

**What's missing:**
- No nested replies in tag threads (a comment on `#methodology` can't have a sub-thread)
- No "resolve" mechanism for comments (mark as addressed / won't fix)
- No integration with the main feed (a heated `#limitations` thread should surface as a top-level post)
- No `@mention` support in paper comments
- No reaction types on comments (👍 👎 ❓)

---

### 13. Export Only Exports Prose, Not Structured Data
**Status:** ⚠️ SHALLOW

**What exists:** Markdown, BibTeX, and APA export in `ResearchPaperCard`.

**What's missing:**
- No JSON export of decomposition results (for importing into reference managers, spreadsheets, or other tools)
- No CSV export of the `results` table (metrics, datasets, baselines)
- No export of annotations (public notes only, with attribution)
- No "export all papers in cluster" for systematic literature review workflows

---

## 🟢 Functional Gaps — Platform-Level Missing Features

### 14. Semantic Search Table Exists But Is Unused
**Status:** ❌ UNWIRED

**What exists:** `paper_embeddings` table with 1536-dim vectors. `llmEmbedding()` function exists. Embeddings are generated during analysis (line 187-196 of analyze route).

**What's missing:**
- The `search_papers` RPC used by ThreadSearchBar does NOT use embeddings — it likely does `ilike` on title/filename
- No "find papers similar to this one" feature
- No semantic clustering of papers
- No "papers you might want to read next" recommendation

---

### 15. No Notification System for Paper Events
**Status:** ❌ MISSING

**What exists:** `notifications` table and API route exist (for the MVP). `welfare_notifications` for welfare flags.

**What's missing:**
- No notification when a paper you uploaded finishes analysis
- No notification when someone comments on a paper you annotated
- No notification when a paper you're reading gets a new version
- No notification when someone requests your review
- No email digest of cluster paper activity ("3 new papers uploaded this week, 12 new comments")

---

### 16. No Bulk Operations
**Status:** ❌ MISSING

**What's missing:**
- Bulk upload (drag 5 PDFs at once)
- Bulk delete / archive
- Bulk export (download all papers + analyses as a ZIP)
- Bulk re-analyze (if the decomposition prompt improves, re-run on all existing papers)

---

### 17. No Offline / Sync Support
**Status:** ❌ MISSING

**What's missing:**
- Papers can't be read offline
- Annotations don't sync if you lose connection mid-write
- No "save draft" for long annotations
- No indication of network status

---

### 18. Admin Dashboard Has No Paper Analytics
**Status:** ❌ MISSING

**What exists:** Admin welfare queue (`/admin/welfare`).

**What's missing:**
- Admin view of all papers with analysis status (which papers are stuck at "extracting"?)
- Admin view of cluster research activity (papers uploaded, comments made, reviews completed)
- Admin ability to re-trigger analysis for a failed paper
- Admin ability to edit decomposition results (correct LLM hallucinations)

---

## 📊 Summary Table

| # | Gap | Severity | Type | Files |
|---|-----|----------|------|-------|
| 1 | No reproducibility / evidence pass | 🔴 Critical | Missing | `decompose-prompts.ts`, schema |
| 2 | No cross-paper comparison | 🔴 Critical | Missing | New feature |
| 3 | Citations are literal-string matching | 🔴 Critical | Shallow | `citation-extract.ts`, `PaperCitationLinks.tsx` |
| 4 | Diagrams lack research utility | 🔴 Critical | Shallow | `diagram-prompt.ts`, `PaperDiagramViewer.tsx` |
| 5 | No peer review / rating system | 🔴 Critical | Missing | New feature |
| 6 | Search doesn't search paper content | 🔴 Critical | Shallow | `ThreadSearchBar.tsx`, `paper_embeddings` |
| 7 | Passes are independent, not cumulative | 🟡 Quality | Shallow | `analyze/route.ts`, `decompose-prompts.ts` |
| 8 | Metadata extraction not stored | 🟡 Quality | Data Loss | `analyze/route.ts` |
| 9 | Schema comment stale (says 5-pass) | 🟡 Quality | Debt | `07_white_paper_tools.sql` |
| 10 | No analysis quality scoring | 🟡 Quality | Missing | `paper_decompositions` schema |
| 11 | Paper lifecycle status invisible | 🟡 Quality | Unwired | `ResearchPaperCard.tsx` |
| 12 | Discussion threads lack depth | 🟡 Quality | Shallow | `PaperTagThreads.tsx` |
| 13 | Export only exports prose | 🟡 Quality | Shallow | `ResearchPaperCard.tsx` |
| 14 | Semantic search table unused | 🟢 Functional | Unwired | `paper_embeddings`, `search_papers` RPC |
| 15 | No notification system for papers | 🟢 Functional | Missing | Notifications system |
| 16 | No bulk operations | 🟢 Functional | Missing | `PostComposer.tsx`, upload API |
| 17 | No offline / sync support | 🟢 Functional | Missing | PWA / service worker |
| 18 | Admin dashboard lacks paper analytics | 🟢 Functional | Missing | Admin pages |

---

## Recommended Implementation Priority

### Phase A (Immediate — fixes existing broken/shallow features)
1. **Fix metadata persistence** (gap #8) — one-line change in `analyze/route.ts`
2. **Fix schema comment** (gap #9) — documentation fix
3. **Make passes cumulative** (gap #7) — pass previous outputs as context
4. **Add full-text search** (gap #6) — wire `paper_embeddings` + `extracted_text`
5. **Add diagram captions** (gap #4) — store caption as separate field, render below SVG

### Phase B (Short-term — adds missing research primitives)
6. **Add `results` decomposition pass** (gap #1) — structured evidence extraction
7. **Add citation context/sentiment** (gap #3) — richer citation linking
8. **Add peer review dimensions** (gap #5) — `paper_reviews` table + UI
9. **Add cross-paper comparison** (gap #2) — cluster-wide research dashboard

### Phase C (Medium-term — platform maturity)
10. **Notification system for papers** (gap #15)
11. **Bulk operations** (gap #16)
12. **Admin paper analytics** (gap #18)
13. **Offline support** (gap #17)

---

## Conclusion

The platform is well-architected and the white-paper tools are a promising start. But right now, the analysis pipeline produces **opinionated summaries**, not **analytical evidence**. A senior researcher using this would quickly hit walls: they can't verify claims against baselines, can't compare papers systematically, can't find papers by their content, and can't conduct a formal peer review.

The highest-impact fix is making the decomposition **evaluative and structured** (gaps #1, #7) rather than purely descriptive. The second-highest is making the search **semantic and content-aware** (gap #6). These two changes would transform the tool from a "paper summarizer" into a "research analysis assistant."
