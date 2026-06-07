# Aggilo Tasks Index

> Atomic tasks (2–8h) grouped by domain. See individual files in this folder for full details.

## Foundations
- F01 — runtime_events migration
- F02 — LLM routing & op-key schemas
- F03 — Prompt builder 4-layer ceilings
- F04 — Validator + retry + degrade
- F05 — BullMQ idempotency enforcement

## Backend / APIs
- B01 — DM schemas
- B02 — DM APIs + cross-cluster merge (Dep: B01)
- B03 — Activity aggregation service + schema
- B04 — Notifications service (tokens, toggles, quiet hours)
- B05 — Moderation pipeline
- B06 — Feature signals schema + API
- B07 — Platform tools schemas + loader stub
- B08 — Genesis Engine schemas **(+ soul manifestation profile schema, expanded)**
- B09 — Observer stewardship tables **(+ Rule 10, manifestation update types, expanded)**
- B10 — Cluster creation API constraints (Dep: F03)
- B11 — Realtime backend channels (Dep: F01)
- B12 — Activity→Push integration (Dep: B03, B04)
- **B13 — Migration 022: soul manifestation schema (Dep: B08)**
- **B14 — API routes: soul manifestation + persona override (Dep: B13, B10)**

## Frontend
- FE01 — Clio FAB dual-tab UI (Dep: none)
- FE02 — Clio AMA panel (Dep: FE01)
- FE03 — Cluster creation overlay (Dep: FE01)
- FE04 — Activity tab UI (Dep: B03)
- FE05 — Members action sheet + DM request modal (Dep: B01, B02)
- FE06 — Messages inbox overlay (Dep: FE05, B02)
- FE07 — Cluster Info sheet + milestone + share
- FE08 — Realtime UX (Dep: B11 backend realtime)
- FE09 — Calibrated Explore UI (Dep: FE02)
- **FE10 — Cluster info: soul manifestation display (Dep: FE07, AD03)**

## Agents / Runtime
- A01 — Clio prompt L4 injection + veto **(+ soul manifestation profile in L3, expanded)** (Dep: B09, F03)
- A02 — Clio meltdown detection (Dep: F04)
- A03 — Sage arc assembler **(+ soul manifestation profile in L3, expanded)** (Dep: B01, B10)
- A04 — Atlas brief protocol **(+ register-aware content tone, expanded)** (Dep: F03)
- A06 — Observer Domain 10 tool analysis trigger (Dep: B07, B09)
- A07 — Feature Signal capture + Domain 11 review (Dep: B06)
- **A08 — Genesis Engine: soul manifestation profile generation (Dep: B08, F03)**
- **A09 — Cluster persona override: runtime merge (Dep: A01, A08)**
- **A10 — Observer Dimension 6: Manifestation Alignment + drift (Dep: B09, A08)**

## Admin / QA / Maintenance
- AD01 — Admin dashboard **(+ Soul Manifestation Panel, Voice Preview, Persona Override Manager, expanded)** (Dep: B03, B05, B07, B09)
- AD02 — Persona governance UI **(+ cluster override approval, expanded)** (Dep: F02)
- **AD03 — Admin UI: Soul Manifestation + Voice Preview panels (Dep: AD01, A08)**
- QA01 — API contract tests (Dep: B02, B03, B04, B10)
- QA02 — LLM regression harness (Dep: F03, F04)
- M01 — Align system implementation prompts with agent prompt drafts **(+ catalog reference, expanded)** (Dep: F02)
- **M02 — Write SOUL_MANIFESTATION_CATALOG.md + update system prompts (Dep: M01)**

## Premium / Payments (Specs)
- P01 — Premium gating logic spec
- P02 — Payments integration plan (Dep: P01)

## DevOps / Security (Specs)
- D01 — DevOps runbook (environments, deploy, rollback)
- D02 — Security & Privacy architecture (RLS + data classification)
- D03 — Monitoring & alerts plan (APM, logs, SLOs)

## Suggested Start Order
1) F01 → F03(expanded) → F04 → F05 → B01 → B02 → FE01 → FE03 → B08(expanded) → B13 → A08 → A01(expanded) → A03(expanded)
                    ↘ M02 (parallel, docs)

## Notes
- Phase0 is out of scope; all tasks target production stack (React/Vite + Fastify + Supabase + BullMQ).
- Dependencies reflect minimum prerequisites; see individual files for full details and validation steps.
