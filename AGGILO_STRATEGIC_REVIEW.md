# Aggilo Social — Strategic Architecture Review

> **Scope:** Full `Aggilo_Social` codebase review — root vs. `phase0`, `architecture/` folder completeness, cross-spec validation, and operational readiness for final product development. Cross-reference: `Revised_Screen_Prompts/mobile_screen_prompts_phase1.md`.

---

## 1. Executive Summary — Top 10 Findings

| # | Finding | Severity |
|---|---------|----------|
| 1 | **`architecture/system_implementation_prompt_part4.md` §13.5 incorrectly states backend owns arc state machine** — Clio is the owner. Creates risk of implementing wrong worker architecture. | 🔴 High |
| 2 | **No dedicated DevOps/Infrastructure architecture document** — CI/CD, observability, data retention, backup/DR scattered across implementation prompts but never consolidated. | 🔴 High |
| 3 | **No Security & Compliance architecture document** — DPDPA (India), RLS audit, auth hardening implied but not spec'd. | 🔴 High |
| 4 | **`context/tool_loader.py` referenced in agent docs, but architecture specifies Node.js `apps/api/src/services/cluster-tools.ts`** — residual Python/Yantra assumptions. | 🟠 Medium |
| 5 | **Mobile screen prompts vs. backend contract gaps** — "Pulse tab" referenced but Phase 1 mandates Timeline-only; 120s browse trigger lacks backend telemetry contract. | 🟡 Low-Medium |
| 6 | **Prompt audit found C8/C12 failures in Tier 1 prompts** — fixes proposed but not tracked as implementation tickets. | 🟡 Low-Medium |
| 7 | **No Testing & QA architecture document** — agent prompt regression, chaos engineering, load testing absent. | 🟠 Medium |

**Overall Architecture Completeness Score: 67/100**
- Agent architecture & orchestration: 92/100
- Data model & API surface: 85/100
- Frontend/mobile architecture: 55/100
- Infrastructure & DevOps: 30/100
- Security & compliance: 25/100
- Testing & QA: 20/100

---

## 2. Root vs. `phase0` Boundary Analysis

### 2.1 What Lives Where

| Domain | Root Folder | `phase0/` | Boundary |
|--------|-------------|-----------|----------|
| Production platform architecture | `architecture/`, `clio/`, `sage/`, `atlas/`, `scout/`, `observer/` | — | Clean |
| Platform rules & soul | `AGGILO_PLATFORM_RULES.md`, `AGGILO_SOUL.md` | — | Clean |
| Product requirements (frozen) | `PRD/` | — | Clean — PRDs define functionality; architecture guides implementation |
| Mobile UI design system | `Revised_Screen_Prompts/` | — | Clean |
| Pilot Next.js apps | — | `phase0/mvp/`, `phase0/lc/` | Clean |
| Pilot cluster specs | — | `phase0/clusters/` | Clean |
| Operational docs | `docs/` | `phase0/docs/` | Some docs straddle both |
| DB migrations (production) | `packages/supabase/migrations/` (implied) | `phase0/*/supabase/` | Pilot SQL not canonical |

### 2.2 Phase 0 Isolation Boundary

`docs/PHASE_0_PILOT.md` records six expedients used in pilot apps (`phase0/mvp/`, `phase0/lc/`). **Phase 0 is explicitly isolated from the production platform** — it exists only for operational feature review and correction. There is no migration path from Phase 0 to production.

The production platform (`architecture/`, `apps/`) is built independently. Phase 0 learnings inform production architecture but do not graduate as code. The "Phase 1 prerequisite" checkboxes in `architecture/part6.md` §43 refer to production readiness gates, not migration tasks.

### 2.3 Deployment Lifecycle Confusion

| App | Branch | Root Dir | URL |
|-----|--------|----------|-----|
| MVP (Sisters in Dua) | `main` | `phase0/mvp` | `mvp.aggilo.in` |
| Long Conversation | `chore/phase0-folder-reshape` | `phase0/lc` | `mvp.aggilo.in/c/long-conversation` |
| Production platform | `main` (future) | `apps/` (future) | `aggilo.in` (future) |

**Risk:** Three active deployment targets on two branches with three root directories. Recipe for mispush incidents.

**Recommendation:** Add `architecture/DEPLOYMENT_TOPOLOGY.md` visualising all environments, branches, and promotion paths.

---

## 3. `architecture/` Folder Completeness Score

### 3.1 What Exists (Strong)

| Document | Category | Status |
|----------|----------|--------|
| `system_implementation_prompt_part1.md` | Stack, structure, data acquisition | Complete |
| `system_implementation_prompt_part2.md` | Database schema, ER diagram, RLS | Complete |
| `system_implementation_prompt_part3.md` | API routes, state management, phasing | Complete |
| `system_implementation_prompt_part4.md` | Agent hierarchy, Clio, Scout, Atlas, Observer | Complete |
| `system_implementation_prompt_part5.md` | Sage specification, arc phases, curation | Complete |
| `system_implementation_prompt_part6.md` | Inheritance contract, context engineering | Complete |
| `PLATFORM_AGENCY.md` | Three-layer agency model | Complete |
| `AGENT_RUNTIME.md` | BullMQ + Redis, lanes, failure modes | Complete |
| `REALTIME_ENGAGEMENT_LAYER.md` | 4 signals, channels, privacy | Complete |
| `AGENT_COMMUNICATION_CONTRACT.md` | 7 patterns, intake pipeline | Complete |
| `CLUSTER_INTELLIGENCE_MODULES.md` | 5 CIM modules, 5-step pipeline | Complete |
| `premium_cluster_requirements.md` | Premium roles, invariants, UX | Complete |

### 3.2 What Is Missing

#### P0 — Must Exist Before Production Launch

| Missing Document | Why Critical | Contents |
|------------------|--------------|----------|
| `INFRASTRUCTURE_AND_DEVOPS.md` | No CI/CD, deployment, or infrastructure spec. | Turborepo pipeline, Vercel/Railway config, environment separation, secret rotation, health checks, log aggregation, rollback, blue-green deploy. |
| `SECURITY_AND_COMPLIANCE.md` | DPDPA compliance not addressed; privacy is marketing pillar #1. | Threat model, RLS audit, encryption, JWT rotation, pen-testing plan, data retention, right-to-erasure, breach response. |
| `TESTING_AND_QA_ARCHITECTURE.md` | No testing strategy for AI-native platform. | Vitest unit tests, Fastify integration tests, agent prompt regression (C1-C12 automated), chaos engineering, load tests, visual regression. |

#### P1 — Needed for Phase 1 Scale

| Missing Document | Why Important | Contents |
|------------------|---------------|----------|
| `FRONTEND_MOBILE_ARCHITECTURE.md` | Frontend state management sketched but not architected. | Service worker caching, offline fallback, Clio FAB state machine, animation frame budget, component library strategy. |
| `MULTI_TENANCY_AND_SCALE.md` | No scale architecture for RLS at volume, Redis clustering, queue backpressure. | RLS performance at 10k+ users, Redis clustering, queue thresholds, read replicas, connection pooling, Realtime channel limits. |
| `INTEGRATION_AND_EXTERNAL_APIS.md` | Payment webhooks, FCM, Razorpay edge cases mentioned in API routes but not as integration architecture. | Webhook idempotency, payment reconciliation, FCM token rotation, deep-linking, SMS failover, rate limit handling, API key rotation. |
| `COST_AND_BUDGET_MANAGEMENT.md` | LLM daily budget ($5 default) mentioned but not a full cost architecture. | Per-agent budget allocation, cost attribution per cluster, quota overflow, cost alerting, monthly forecasting, cost-per-DAU target. |

#### P2 — Operational Hygiene

| Missing Document | Why Useful | Contents |
|------------------|------------|----------|
| `INCIDENT_RESPONSE_AND_RUNBOOKS.md` | Agent failures, welfare escalations, LLM meltdowns need playbooks. | On-call rotation, PagerDuty, welfare runbook, meltdown response, cluster health SOP, data corruption recovery. |
| `DATA_RETENTION_AND_LIFECYCLE.md` | Ephemeral chat, deletion grace period, Observer findings have retention rules but no unified policy. | Retention matrix, automated purge, legal hold, cross-border transfer. |
| `DESIGN_SYSTEM_AND_COMPONENT_LIBRARY.md` | Mobile screen prompts exist but no component architecture. | Component hierarchy, design tokens, animation constraints, a11y baseline, dark mode. |
| `MONITORING_AND_ALERTING.md` | Beyond Observer findings, no application monitoring architecture. | Sentry/Rollbar, custom metrics, dashboard alerts, synthetic monitoring. |

---

## 4. Cross-Spec Inconsistency Register

| ID | Inconsistency | Files | Severity | Fix |
|----|---------------|-------|----------|-----|
| **I-01** | Clio arc-phase ownership: `clio/AGENTS.md` correctly states Clio "tracks and advances" arc phase; `architecture/part4.md` §13.5 incorrectly says "backend owns state machine, Sage acts." | `clio/AGENTS.md` vs `architecture/part4.md` §13.5 | 🟠 Medium | Update `architecture/part4.md` §13.5: Clio owns the arc state machine. Remove `ClusterArcEvaluate` worker. Sage acts per Clio's delegation. |
| **I-02** | Tool loader language: agent docs reference `context/tool_loader.py`; architecture specifies Node.js `apps/api/src/services/cluster-tools.ts`. | `scout/AGENTS.md`, `atlas/AGENTS.md` vs `architecture/part1.md` | 🟠 Medium | Global replace `tool_loader.py` -> `cluster-tools.ts` in agent docs. |
| **I-03** | Atlas trigger timing: 60s post-join vs 6h cycle vs "immediately" in different docs. | `atlas/AGENTS.md` vs `architecture/part4.md` vs `sage/AGENTS.md` | 🟡 Low | Consolidate: 60s cold-start, then 6h cycle, 72h silence override. |
| **I-04** | "Yantra" naming remnants in active doc headers. | `scout/AGENTS.md`, `SOUL_INJECTION_MAP.md`, `observer/AGGILO_OBSERVER_AGENTS.md` | 🟡 Low | Retire "Yantra" in active headers; replace with "Agent Runtime (BullMQ)." |
| **I-05** | "Phase 1" means different things: implementation phase, UI constraint phase, platform rollout phase, observer status. | Throughout corpus | 🟠 Medium | Create canonical "Phase Definitions" appendix in `ARCHITECTURE.md`. |
| **I-06** | Mobile prompts reference "Pulse tab" but Phase 1 mandates Timeline-only. | `mobile_screen_prompts_phase1.md` vs `sage/AGENTS.md` | 🟡 Low | Replace "Pulse" with "Timeline" in mobile prompts where Phase 1 is intended. |
| **I-07** | Observer domain count: intro says "nine domains" but lists 10. | `observer/AGGILO_OBSERVER_AGENTS.md` | 🟡 Low | Fix intro sentence from "nine" to "ten." |
| **I-08** | Sage daily post limit (2/day) could be confused with Clio's 2 proactive messages. | `sage/AGENTS.md` vs `clio/AGENTS.md` | 🟡 Low | Clarify in `clio/AGENTS.md`: Clio's limit is FAB tips only; Sage's limit is Timeline posts. |
| **I-09** | Prompt audit C8/C12 failures not tracked as implementation tasks. | `PROMPT_AUDIT_RESULTS.md` vs codebase | 🟠 Medium | Create `architecture/PROMPT_AUDIT_REMEDIATION_TRACKER.md`. |
| **I-10** | Aggilo admin dashboard vs cluster admin console overlap (Findings, Runtime, LLM). | `AGGILO_ADMIN_DASHBOARD_SPEC.md` vs `CLUSTER_ADMIN_CONSOLE_SPEC.md` | 🟡 Low | Add cross-reference matrix at top of both specs. |

---

## 5. Mobile Screen Prompts Cross-Verification

### 5.1 What Validates Cleanly

| UI Constraint | Architecture Contract | Status |
|---------------|----------------------|--------|
| Hidden search bar on first visit | `mobile_screen_prompts_phase1.md` §3.1 + `architecture/part1.md` §7.5 | Aligned |
| Clio FAB position (bottom-right outside, top-right inside) | `clio/CLIO_UNIFIED_CLUSTER_PRESENCE.md` + `mobile_screen_prompts_phase1.md` §4.1 | Aligned |
| Clio FAB state transitions (Resting/Curious/Processing/Prominent) | `mobile_screen_prompts_phase1.md` + `clio/AGENTS.md` §Proactive triggers | Aligned |
| "+" Create icon hidden until 2+ clusters | `mobile_screen_prompts_phase1.md` §3.1 + `architecture/part1.md` §7.5 | Aligned |
| Timeline-only, no Media/Pulse tabs in Phase 1 | `mobile_screen_prompts_phase1.md` §4 + `sage/AGENTS.md` | Aligned |
| 120-second browse trigger -> Clio FAB Curious | `mobile_screen_prompts_phase1.md` §3.1 + `clio/AGENTS.md` | Aligned |
| Cluster header: live now + total + joined this week | `mobile_screen_prompts_phase1.md` §4.1 + `architecture/part1.md` §7.5 | Aligned |

### 5.2 UI Features Without Backend Contracts

| UI Feature | Mobile Prompt Reference | Missing Backend Contract | Risk |
|------------|------------------------|--------------------------|------|
| Clio FAB idle breathing animation | "breathes gently with soft halo" | No animation frame budget | Low — purely frontend |
| 120s browse trigger | Screen 3.1 | No API/event-logging contract for browse time | Medium — needed for Observer Domain 5 |
| Clio insight pill | Screens 3.1, 3.2 | No backend spec for pill generation/storage/A/B | Medium — currently client-side? |
| Evangelist accelerated onboarding | Screen 2.6E | No backend spec for invite-link pre-fill validation | Medium — URL query param only? |

---

## 6. Operational Readiness Assessment

### 6.1 Ready to Build (Strong)

- Agent hierarchy & inheritance contract (4-layer contract, builder pattern, done criteria)
- Database schema (21 migrations, RLS policies, seed data)
- API endpoint surface (65+ routes, auth patterns, admin scopes)
- Soul, guardrails, crisis response (`AGGILO_SOUL.md`, per-agent SOUL, injection map, crisis protocols)
- Cluster creation & AGGIL engine (`AGGILO_PLATFORM_RULES.md`)
- Prompt audit rubric (C1-C12 standard, cadence-exchange gold-standard pattern)

### 6.2 Needs More Spec (Medium)

- LLM routing & A/B testing (routing architecture in `architecture/part4.md` §17 + admin dashboard in `AGGILO_ADMIN_DASHBOARD_SPEC.md` §LLM observability — complete)
- Admin dashboards (UI specs exist; missing backend aggregation queries, real-time subscriptions, admin RLS)
- Premium cluster configurability (slider spec exists; free-text guidance validator not fully spec'd)
- Atlas data acquisition layer (Tier 1-3 APIs listed; missing actual API client implementation spec)
- Scout directed discovery (JSON schema defined; missing Clio -> Scout dispatch protocol)

### 6.3 Not Ready — Requires New Architecture Documents (Weak)

- CI/CD pipeline — no `INFRASTRUCTURE_AND_DEVOPS.md`
- Security audit & DPDPA compliance — no `SECURITY_AND_COMPLIANCE.md`
- Testing strategy — no `TESTING_AND_QA_ARCHITECTURE.md`
- Cost management at scale — no `COST_AND_BUDGET_MANAGEMENT.md`
- Incident response — no `INCIDENT_RESPONSE_AND_RUNBOOKS.md`
- Frontend component architecture — no `FRONTEND_MOBILE_ARCHITECTURE.md`
- PWA offline strategy — mentioned but no service worker spec

---

## 7. Recommended Reading Order Updates for `ARCHITECTURE.md`

```
## Reading Order (Updated)

1. `architecture/system_implementation_prompt_part6.md` — START HERE. Inheritance contract.
2. `architecture/system_implementation_prompt_part1.md` — Stack, structure, data acquisition, 7 principles.
3. `architecture/system_implementation_prompt_part2.md` — Database schema & RLS.
4. `architecture/system_implementation_prompt_part3.md` — API routes, state management, phasing.
5. `architecture/system_implementation_prompt_part4.md` — Agent hierarchy, Clio, Scout, Atlas, Observer.
6. `architecture/system_implementation_prompt_part5.md` — Sage full specification.
7. `AGGILO_SOUL.md` — Philosophical foundation (read once, reference often).
8. `AGGILO_PLATFORM_RULES.md` — All platform rules.

## Operational Documents (read as needed)
- `clio/CLIO_UNIFIED_CLUSTER_PRESENCE.md` — Clio FAB behaviour
- `clio/CLIO_CLUSTER_HOST_CONTEXT.md` — Cluster anchor behaviour
- `sage/SAGE_ANCHOR_PROTOCOL.md` — @Sage protocol, deduplication
- `sage/SAGE_FEATURE_INTELLIGENCE.md` — Feature evaluation
- `observer/AGGILO_OBSERVER_AGENTS.md` — 10 domains
- `observer/OBSERVER_STEWARDSHIP.md` — Autonomous stewardship
- `observer/OBSERVER_INTROSPECTION_ENGINE.md` — Priority queue & reasoning
- `docs/CLUSTER_SKILL_DISCOVERY_PROTOCOL.md` — Cross-agent skill dialogue
- `docs/AGENT_COLLABORATION_CHATBOX.md` — Visible agent dialogue

## NEW (Proposed — see Section 3.2)
- `architecture/INFRASTRUCTURE_AND_DEVOPS.md`
- `architecture/SECURITY_AND_COMPLIANCE.md`
- `architecture/TESTING_AND_QA_ARCHITECTURE.md`
- `architecture/FRONTEND_MOBILE_ARCHITECTURE.md`
```

---

## 8. Risk Register — Highest-Risk Gaps for Production Launch

| Risk ID | Risk | Likelihood | Impact | Mitigation |
|---------|------|------------|--------|------------|
| **R-01** | DPDPA audit failure due to lack of documented data retention / erasure architecture. | Medium | Critical | Create `SECURITY_AND_COMPLIANCE.md` before production data ingress. |
| **R-02** | LLM costs exceed budget due to lack of per-cluster cost attribution and alerting. | High | High | Create `COST_AND_BUDGET_MANAGEMENT.md`; implement cost aggregation dashboard. |
| **R-03** | Agent prompt drift in production (no automated C1-C12 regression testing). | Medium | High | Create `TESTING_AND_QA_ARCHITECTURE.md`; implement automated prompt regression. |
| **R-04** | Cluster vocabulary parameterisation not implemented before second partner cluster, causing hardcoded "sisters"/"dua" leakage. | Medium | High | Elevate vocabulary parameterisation from prerequisite to active sprint. |
| **R-05** | Redis/BullMQ worker tier failure with no runbook or graceful degradation spec. | Medium | Medium | Create `INCIDENT_RESPONSE_AND_RUNBOOKS.md`; implement degrade-to-read-only mode. |
| **R-06** | Mispush to wrong branch (`main` vs `chore/phase0-folder-reshape`) due to deployment topology confusion. | Medium | Medium | Create `DEPLOYMENT_TOPOLOGY.md`; add branch guards in CI. |

---

## 9. Actionable Recommendations (Prioritized)

### Immediate (This Sprint)
1. **Fix I-01 (arc ownership), I-02, I-04, I-07, I-08** — single-line edits in docs. Priority: `architecture/part4.md` §13.5 must state Clio owns arc state machine.
2. **Create `architecture/PROMPT_AUDIT_REMEDIATION_TRACKER.md`** linking audit findings to implementation tickets.

### Short-Term (Next 2 Sprints)
3. **Create P0 missing docs:** `INFRASTRUCTURE_AND_DEVOPS.md`, `SECURITY_AND_COMPLIANCE.md`, `TESTING_AND_QA_ARCHITECTURE.md`.
4. **Implement cluster vocabulary parameterisation** (blocking second partner cluster).

### Medium-Term (Next Month)
5. **Create P1 missing docs:** `FRONTEND_MOBILE_ARCHITECTURE.md`, `MULTI_TENANCY_AND_SCALE.md`, `INTEGRATION_AND_EXTERNAL_APIS.md`, `COST_AND_BUDGET_MANAGEMENT.md`.
6. **Create P2 missing docs:** `INCIDENT_RESPONSE_AND_RUNBOOKS.md`, `DATA_RETENTION_AND_LIFECYCLE.md`, `MONITORING_AND_ALERTING.md`.
7. **Update `ARCHITECTURE.md`** with new reading order and Phase Definitions appendix.

---

## 10. Arc Phase Reference (A–E)

> **Source:** `clio/AGENTS.md` §Cluster-Level Arc (A–E) — canonical definition.  
> **Note:** `architecture/system_implementation_prompt_part4.md` §13.5 incorrectly states the backend owns the arc state machine. Per user clarification, **Clio owns it.**

The arc phase is a **per-cluster maturity state machine** stored on each cluster's DB record (`cluster_arc_phase`). It governs how Sage behaves as the cluster's Anchor, based on how alive the cluster is. Clio appoints Sage as assistant for every created cluster; Sage acts per Clio's instructions and within the cluster's limitations. Sage never interacts with users on a personal level — only in-cluster (Timeline). Clio handles all personal-level interactions (FAB).

| Phase | Name | Condition | Sage's Role |
|-------|------|-----------|-------------|
| **A** | **Empty Room** | `post_count = 0` | Active host. Surfaces 1 Atlas content card as a Timeline post. Composes invite. Sets the room's atmosphere. |
| **B** | **First Voice** | `post_count = 1` | First-post acknowledgement (1 sentence, 60s after first post). Then **24h silence.** |
| **C** | **Low Activity** | `post_count 2–5` OR `72h silence` | Re-engagement: posts 1 Atlas content card with a question frame. Max 1 per 72h. |
| **D** | **Active** | `posts per week ≥ 6` | **Passive.** Only responds when directly addressed (@Sage). No proactive posting. |
| **E** | **Thriving** | `Connections ≥ 10` AND `posts per week ≥ 15` | One private message to the Founder only: *"Ten people. This one found its people."* Then silent permanently unless regression to Phase C. |

### Why it's helpful

Without the arc phase, Sage would either:
- **Overwhelm** an active cluster with unnecessary content cards, or
- **Abandon** an empty cluster where a host is desperately needed

The arc phase dynamically scales AI involvement to match cluster maturity. It governs:
- Whether Sage proactively posts content
- Whether first-post acknowledgement fires
- Whether re-engagement triggers
- Tone, frequency, and visibility of agent interventions

### Transition rules (Clio-owned)

| Transition | Trigger |
|------------|---------|
| A → B | On first post created in cluster |
| B → C | After 72h of silence following first post, OR when `post_count` reaches 2–5 |
| C → D | When 7-day post rate reaches ≥ 6 |
| D → E | When Connection count ≥ 10 AND 7-day post rate ≥ 15 |
| D/E → C | If cluster goes 72h silent (regression — Sage re-activates gently) |

---

*Review completed. This document is a living artifact — update as gaps are closed and new architecture documents are created.*
