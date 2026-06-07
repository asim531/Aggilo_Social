# Aggilo — Gap Analysis (Architecture vs Screens vs Codebase)

> Focus: production platform (React + Fastify + Supabase + BullMQ). Phase0 excluded. No code changes here.

## Missing / Underspecified Documents
1. **DevOps / Infrastructure Runbook** — CI/CD, envs, secrets, rollouts, monitoring, backups, health checks (highlighted in STRATEGIC_REVIEW). **Owner:** Platform.
2. **Security & Privacy Architecture** — RLS matrix, data retention, encryption at rest/in transit, key rotation, incident response. **Owner:** Platform.
3. **Testing Strategy** — Unit/integration/e2e, contract tests for agents, LLM regression harness, prompt diff tests. **Owner:** Platform + QA.
4. **LLM Routing Config Spec** — Operation-key registry, routing rules, fallback matrices, budget ceilings. **Owner:** Platform AI.
5. **Persona Governance Ops** — Admin UI + workflow for persona approve/activate/revoke, audit trail. **Owner:** Admin.

## Backend/API Gaps
1. **Cluster Creation API alignment** with Clio conversational flow:
   - Duplicate detection (semantic) endpoint not specified.
   - Gender/age self-inclusion validation (founder) not codified.
   - Cluster score computation (U-shaped) not detailed.
2. **DM System**:
   - Request/accept state machine and Connection concept require schema + APIs.
   - Cross-cluster thread merge logic unspecified.
3. **Activity Feed**:
   - Aggregation spec missing (sources, grouping, pagination, unread state).
4. **Notifications**:
   - FCM token lifecycle, per-cluster toggles, quiet hours, batching/caps unspecified.
5. **Moderation**:
   - AI-first screening pipeline, severity tiers, appeal flow, and admin tooling unspecified.
6. **Feature Signals**:
   - Capture → Observer review → CIM flow needs schemas and API endpoints.
7. **Platform Tools Registry**:
   - platform_tools schema, versioning, auto-promotion job, cluster_tools loader contract not codified.
8. **Genesis Engine**:
   - Intake Interpreter, Adversarial Reviewer, validation jobs, drift monitors not mapped to APIs/schemas.

## Frontend Gaps (from screen prompts)
1. **Clio FAB Dual-Tab** (Cluster vs Private) — UI component, storage (sessionStorage for Private), TTL countdown, tab switching.
2. **Clio AMA Panel** — calibration summary card UI & tap-to-adjust pattern.
3. **Cluster Creation Overlay** — conversational UI states (similar check, disambiguation, 3 questions, confirmation with constraints, success modal).
4. **Activity Tab** — row types, swipe-to-dismiss, empty state, locked state absence in Stage 1.
5. **Members Tab** — Stage-based action sheet (DM gating), DM request modal.
6. **Messages Inbox** — per-cluster context, pending requests section, unread indicators, cross-cluster merge rule.
7. **Cluster Info Sheet** — Precision Score badge (founder-only), 10-member milestone modal.
8. **Realtime UX** — presence dots, typing indicator slot, arrival pills, care reach-out FAB dot.

## Data Model Gaps
1. **DM:** `dm_threads`, `dm_messages`, `dm_requests`, `connections` schemas missing.
2. **Activity:** Aggregated events table missing (source fields, unread, dismiss state).
3. **Feature Signals:** `feature_signals`, k-anonymity fields, `observer_reviewed` flag.
4. **Platform Tools:** `platform_tools`, `cluster_tool_enablements`, versioning fields.
5. **Genesis Engine:** `cluster_intake_drafts`, `cluster_intake_refined`, `cluster_specs`, `cluster_genesis_reports`.
6. **Observer Stewardship:** `observer_prompt_updates`, `clio_observer_signals`, `observer_cluster_context`, `cluster_prompt_versions`.
7. **Runtime Observability:** `runtime_events` table migration pending (per AGENT_RUNTIME spec).
8. **LLM Routing:** `llm_routing_config`, `llm_operation_keys`, `llm_cost_tracking` not defined.

## Agent Runtime Gaps
1. **Retry + Degrade Pattern** (Part 6 §36) — implementation plan not mapped to code.
2. **Token Budget Enforcement** — 4-layer ceilings not wired to prompt builder.
3. **Idempotency Keys** — per-job dedup window per AGENT_RUNTIME spec needs enforcement.
4. **Meltdown Detection** — Observer Domain 5 triggers for 3x validator failures/hour not implemented.

## Realtime/Presence Gaps
1. Multi-cluster scoping validation (presence channel names, handoff filter) pending.
2. Fallback contract instrumentation (initial-pull-on-mount, stale markers) unspecified.

## Premium/Payments Gaps (deferred but track)
1. Razorpay/GPB integration plan absent.
2. Premium feature gating (AI Matchmaker, people suggestions, personalization questionnaire) not specified.

## Operational Gaps
1. **Admin Dashboard** — needs sections for findings, reports, users, clusters, tools, prompt updates.
2. **Auditability** — prompt version history, cost logs, tool proposals, admin decisions tables need migrations.
3. **Privacy** — K-anonymity enforcement for feature signals, DM/no PII safeguards in UI/DB.

## Alignment Issues (per STRATEGIC_REVIEW)
- `architecture/system_implementation_prompt_part4.md` incorrectly states backend owns arc state machine — Clio owns. Ensure all specs align.
- Avoid any reference to /phase0/ in production plans.

## Highest-Risk Gaps (Top 5)
1. DevOps/Infra runbook (deploy, secrets, monitoring, backups) — blocker for shipping.
2. Security/Privacy/RLS spec — risk of data leakage and non-compliance.
3. DM system schema + APIs — core Phase 1 feature not defined.
4. Moderation/safety pipeline — legal/reputational risk.
5. Prompt/LLM routing enforcement (token budgets, retry+degrade, validator) — agent reliability risk.
