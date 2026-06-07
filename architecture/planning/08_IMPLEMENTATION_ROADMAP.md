# Aggilo — Implementation Roadmap (Milestones 0–18)

> Thematic, sequenced milestones. Each milestone bundles 1–3 day chunks of atomic tasks from the registry.

## Milestone 0 — Foundations & Observability
- F01 runtime_events migration
- F02 LLM routing schemas
- F03 prompt builder 4-layer assembly with ceilings
- F04 validator + retry + degrade
- F05 idempotency enforcement
- SC: Core runtime safety nets in place; logs visible

## Milestone 1 — Security & DevOps Spec
- D01 DevOps runbook
- D02 Security & Privacy architecture (RLS matrix)
- D03 Monitoring/alerts definition
- SC: Docs checked in; owners assigned; alert endpoints configured

## Milestone 2 — Realtime Contract
- B11 Realtime channels multi-cluster
- FE08 Realtime UX (presence, typing, arrival, care reach-out)
- RT01 initial-pull fallback
- RT02 care reach-out FAB rendering
- SC: Four signals live with fallbacks; anonymous typing; per-user handoff

## Milestone 3 — DM System
- B01 DM schemas
- B02 DM APIs + cross-cluster merge
- FE05 Members action sheet + request modal
- FE06 Messages inbox overlay
- SC: Request→accept→message flow works; merge rule enforced; stage gating honored

## Milestone 4 — Activity & Notifications
- B03 Activity aggregation
- B04 Notifications service (tokens, toggles, quiet hours)
- B12 Activity→Push integration
- FE04 Activity UI
- SC: Activity feed matches spec; push respects preferences; empty/locked states handled

## Milestone 5 — Moderation & Safety
- B05 Moderation pipeline
- AD01 Admin dashboard sections (findings/reports)
- SC: Reports triaged; severity tiers; admin actions recorded

## Milestone 6 — Feature Signals + Tools
- B06 Feature signals schema/API
- A07 Clio capture + Observer Domain 11 review
- B07 Platform tools schemas + loader stub
- A06 Observer Domain 10 + CliToolProposalJob
- SC: Signals captured/deduped; reviewed; tool proposals generated with admin gate

## Milestone 7 — Cluster Creation Hardening
- B10 Cluster creation constraints (duplicate detection, self-inclusion, score)
- FE03 Creation overlay (5.1–5.6)
- A03 Sage arc assembler isolation (preps for anchor behavior)
- SC: Conversational creation end-to-end; constraints enforced; arc init validated

## Milestone 8 — Clio AMA & Calibrated Discovery
- FE02 AMA panel
- FE09 Calibrated Explore
- Backend: calibrated search params wired to Clio session
- SC: AMA flow produces calibrated results; active dot; zero-state handling

## Milestone 9 — Cluster Info & Sharing
- FE07 Cluster info sheet + milestone modal + share sheet
- SC: Founder-only score visibility; 10-member milestone modal; share copy link

## Milestone 10 — Timeline & Sage Ops
- A04 Atlas brief protocol (3 rounds + synthesis)
- Sage posting pipeline integration (existing feed)
- SC: Sage posts follow cadence; synthesis path logged; arc-aware behavior

## Milestone 11 — Observer Stewardship & Admin
- B09 Stewardship tables
- A01 Clio prompt layer injection + veto handling
- AD01 (if not done) ensure findings + approvals live
- SC: Observer prompt updates flow with veto window; findings trigger jobs on approval

## Milestone 12 — Activity Polishing & Notifications
- Edge cases: dwell-time FAB nudge, calibration reset, AMA start-fresh
- Notification batching/caps
- SC: UX polish complete; no noisy pushes

## Milestone 13 — CIM & Content Gap Loop
- CIM pipelines hooked to Observer outputs
- Atlas source gap remediation via Sage tool proposals
- SC: Domain 6/10 loop produces actions; admin dashboard shows CIM insights

## Milestone 14 — Premium Prep (Deferred Live)
- P01 premium gating logic spec
- P02 payment integration plan
- SC: Plans documented; code gated behind feature flags

## Milestone 15 — Testing & QA Harness
- QA01 API contract tests
- QA02 LLM regression harness + validators
- SC: CI suite green; golden tests prevent drift

## Milestone 16 — Performance & Cost Guardrails
- LLM cost dashboards, budget ceilings per op
- Runtime queue latency monitors
- SC: p95 meets lane SLAs; budget alerts in place

## Milestone 17 — Accessibility & Compliance
- A11y audit pass on key screens (Explore, Timeline, Creation, Activity)
- Privacy compliance checks vs Security doc
- SC: WCAG AA for main flows; privacy checks signed off

## Milestone 18 — Launch Readiness
- Bug scrub, freeze checklist
- Runbooks validated (on-call, incident response)
- SC: Go/no-go sign-off; rollback tested

---

## Critical Path (first 5 milestones)
0 → 1 → 2 → 3 → 4 (establish safety nets, security, realtime, DM, notifications)
