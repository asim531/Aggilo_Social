# Aggilo — Master Task Registry (Atomic Tasks, 2–8h each)

> Each task: single responsibility, clear dependency, success criteria. Phase0 excluded. Use TypeScript strict.

## Legend
- **Dep:** Prerequisite task codes
- **SC:** Success Criteria

## Foundations
- **F01**: Create `runtime_events` migration (per AGENT_RUNTIME) — Dep: none — SC: table exists, indexed, logged in migration history.
- **F02**: Define `llm_routing_config` + `llm_operation_keys` schema — Dep: none — SC: migrations applied, enums for providers/models, op-key registry populated with Clio/Sage/Atlas/Scout ops.
- **F03**: Implement prompt builder 4-layer assembly with token ceilings — Dep: F02 — SC: unit tests showing ceiling enforcement, trim order (history first) verified.
- **F04**: Add validator + retry + degrade pattern (Part 6 §36) to agent LLM calls — Dep: F03 — SC: retries logged, degrade path invoked on 2 failures, tests green.
- **F05**: Add idempotency key enforcement to BullMQ submitters — Dep: none — SC: duplicate submissions rejected within dedup window, logs `idempotency_collision`.

## DevOps / Security (spec + initial setup)
- **D01**: Draft DevOps runbook (CI/CD, envs, secrets, monitoring, backups) — Dep: none — SC: document checked in `docs/DEVOPS_RUNBOOK.md` with owners.
- **D02**: Define Security & Privacy architecture (RLS matrix, retention, incident response) — Dep: D01 — SC: `docs/SECURITY_PRIVACY.md` with RLS table per entity.
- **D03**: Configure monitoring/alerts for queues, DB, LLM cost — Dep: D01 — SC: alert rules defined, dashboard links recorded.

## Backend APIs & Schemas
- **B01**: Design DM schemas (`dm_threads`, `dm_messages`, `dm_requests`, `connections`) — Dep: none — SC: migrations committed, ERD updated.
- **B02**: Implement DM request/accept APIs + cross-cluster thread merge — Dep: B01 — SC: e2e test covers request→accept→message→merge.
- **B03**: Implement Activity aggregation service + schema — Dep: none — SC: table populated from posts/DM/Clio matches; API `GET /api/activity` returns grouped sections.
- **B04**: Implement Notifications service (FCM token, quiet hours, per-cluster toggles) — Dep: none — SC: endpoints for register token, toggle preferences; tokens stored.
- **B05**: Implement Moderation pipeline (AI pre-screen, severity, report handling) — Dep: none — SC: endpoints for report, moderation queue, status transitions; tests.
- **B06**: Implement Feature Signals schema + API (capture, list aggregated) — Dep: none — SC: `feature_signals` table, hash dedup, capture endpoint validates rules.
- **B07**: Implement Platform Tools schemas (`platform_tools`, `cluster_tool_enablements`) — Dep: none — SC: migrations applied, loader stub exists.
- **B08**: Implement Genesis Engine schemas (`cluster_intake_drafts/refined`, `cluster_specs`, `cluster_genesis_reports`) — Dep: none — SC: migrations applied, basic CRUD for drafts.
- **B09**: Implement Observer Stewardship tables (`observer_prompt_updates`, `clio_observer_signals`, `observer_cluster_context`, `cluster_prompt_versions`) — Dep: none — SC: migrations applied, access via admin-only RLS.
- **B10**: Implement cluster creation API constraints (duplicate detection, founder self-inclusion, cluster_score) — Dep: F03 — SC: tests for duplicate prevention, locked gender/age, score computation.
- **B11**: Implement Realtime presence/composition channels with multi-cluster scoping — Dep: none — SC: channel names include cluster_id, anonymous typing events throttled.
- **B12**: Implement Activity + Notification integration (Activity rows generate push) — Dep: B03, B04 — SC: push triggered when new activity row created and preference ON.

## Frontend (React, per screen gaps)
- **FE01**: Build Clio FAB dual-tab UI (cluster/private) with sessionStorage TTL countdown — Dep: none — SC: tabs persist per spec, TTL countdown visible, no data persists server-side.
- **FE02**: Build Clio AMA Panel UI (3.3) with calibration summary card and adjust interactions — Dep: FE01 — SC: end-to-end panel interaction matches prompt; active dot on Tune.
- **FE03**: Build Cluster Creation conversational overlay (5.1–5.6) — Dep: FE01 — SC: all states implemented incl. similar check, disambiguation, constraints, success modal.
- **FE04**: Build Activity tab UI (6.1) with row types, grouping, swipe-to-dismiss — Dep: B03 — SC: renders grouped sections, dismiss persists in client state.
- **FE05**: Build Members tab action sheet with stage gating + DM request modal (4.2/4.2a) — Dep: B01/B02 — SC: Stage 1-2 hide Message; Stage 3 shows; request modal works.
- **FE06**: Build Messages inbox overlay (4.3) with pending requests + unread indicators — Dep: FE05 — SC: cross-cluster thread merge displayed, empty state present.
- **FE07**: Build Cluster Info sheet + milestone modal + share sheet (4.5/4.6) — Dep: none — SC: founder-only score badge, 10-member milestone modal, share copy link.
- **FE08**: Implement realtime UX: presence dots, typing slot, arrival pill, care reach-out FAB dot — Dep: B11 — SC: four signals render with fallback states.
- **FE09**: Implement AMA-calibrated Explore reload + pills (3.4) — Dep: FE02 — SC: calibrated pill text matches mode, zero-state flows.

## Agents / Runtime
- **A01**: Wire Clio prompt builder to Layer 4 observer signals + veto window handling — Dep: B09, F03 — SC: observer signals injected with TTL; veto respected.
- **A02**: Implement Clio retry+degrade with meltdown detection counters — Dep: F04 — SC: 3 failures/hour triggers Observer Domain 5 record.
- **A03**: Implement Sage arc phase assembler (cluster-scoped, no cross-cluster bleed) — Dep: B01, B10 — SC: assembler unit tests ensure isolation.
- **A04**: Implement Atlas brief protocol (3 rounds, zero-content synthesis) — Dep: F03 — SC: round transitions logged, synthesis flag persisted.
- **A05**: Implement Scout directed jobs queue + report persistence — Dep: Data Acquisition — SC: job submission, result rows with confidence.
- **A06**: Implement Observer Domain 10 tool analysis trigger + CliToolProposalJob — Dep: B07, B09 — SC: finding triggers draft in maintenance/, admin approval gate.
- **A07**: Implement Feature Signal capture in Clio + Observer Domain 11 review job — Dep: B06 — SC: captured when unsolicited, deduped, Observer review sets status.

## Admin & QA
- **AD01**: Build Admin Dashboard sections (Critical/High/Medium/Low, By Domain, Pending Approvals) — Dep: B03, B05, B07, B09 — SC: findings list with approve/reject triggers jobs.
- **AD02**: Build persona governance UI (approve/activate/revoke) — Dep: F02 — SC: persona status transitions logged with reviewer.
- **QA01**: Add contract tests for key APIs (auth, cluster create, DM, activity, notifications) — Dep: B02-B04 — SC: CI green, fixtures cover success + failure cases.
- **QA02**: Add LLM regression harness for Clio/Sage (golden responses, format validators) — Dep: F03-F04 — SC: snapshot/golden tests; validator failures fail CI.
- **M01**: Reconcile system implementation prompts with agent prompt drafts and planning docs — Dep: F02 — SC: top-of-file notes in part1-6 point to canonical sources; no contradictions remain.

## Realtime / Notifications
- **RT01**: Implement initial-pull-on-mount fallback for all realtime consumers — Dep: FE08 — SC: offline→online recovers missed events.
- **RT02**: Implement care reach-out FAB dot + Just Clio tab rendering — Dep: FE08 — SC: handoff greeting renders from clio_handoff_greetings insert.

## Premium (track, deferred)
- **P01**: Define premium gating logic (Stage unlock, AI Matchmaker, people suggestions) — Dep: none — SC: documented spec.
- **P02**: Payment integration plan (Razorpay/GPB) — Dep: P01 — SC: sequence diagrams + webhook contract.

---

## Suggested Ordering (first 10 tasks)
1) F01  2) F03  3) F04  4) F05  5) B01  6) B02  7) FE01  8) FE03  9) B10  10) A03
