# Aggilo — Dependency Graph (Narrative + ASCII)

## High-Level Stack
- **Frontend:** React 18 + Vite (PWA, mobile-first, TypeScript strict)
- **Backend:** Node.js + Fastify
- **DB/RT:** Supabase (PostgreSQL + Auth + Realtime + Storage + RLS)
- **Queues:** BullMQ + Redis (lanes: critical, high, medium, low)
- **AI:** Dynamic LLM routing (NIM/Kimi, Claude Opus, Groq), Prompt builder (4-layer contract)

## Core Dependency Arrows (Narrative)
- Auth → Profiles → AGGIL Engine → Clusters → Membership → Feed/Posts/Comments → Realtime (signals 1-4)
- Clio ← Profiles + Clusters + AGGIL + Scout + Sage + Observer signals + LLM routing + Prompt builder
- Sage ← Clio intro + Clusters + Posts + Atlas briefs → Posts (Timeline)
- Atlas ← Sage briefs + Data Acquisition + LLM routing → Cards → Sage posts
- Scout ← Clio directed jobs + Data Acquisition → Reports → Clio/Intake Interpreter
- Observer ← All logs/tables (read-only) → Findings + Prompt updates → Admin/Clio Layer 4
- Genesis Engine ← Observer → cluster_specs/validation → Admin/Founders
- CIM ← Observer + Clio/Sage signals → Admin (insights)
- Platform Tools Registry ← tool_proposals (Observer/Clio/Sage) → cluster_tools loader → Agents
- Notifications/Activity ← Events from Posts/DM/Clio → Activity feed + FCM
- LLM Routing ← Operation keys from all agents → Providers (with fallback) → Responses → llm_response_logs
- Audit/Observability ← runtime_events + llm_response_logs + behavioural_events → Admin/Observer

## ASCII Graph (simplified)
```
Auth → Profiles → AGGIL Engine → Clusters → Membership → Feed/Posts
                                         ↘              ↘
                                          Realtime       Notifications/Activity

Clio (orchestrator)
  ↑   ↑     ↑     ↑      ↑
  │   │     │     │      │
Profiles AGGIL Clusters Scout Reports Observer Signals
  │                  │
  │                  └→ Cluster Creation / Discovery
  │
  └→ Sage (intro handoff)
        ↑
        │ Atlas Cards ← Atlas (Data Acquisition, LLM Routing)
        │
        └→ Posts (Timeline) → Members

Scout (Community Intelligence)
  ↑
  │ (Directed jobs from Clio)
  └→ Reports → Clio / Intake Interpreter

Observer (Platform Steward)
  ↑ (runtime_events, llm_response_logs, behavioural_events, all tables)
  ├→ Findings → Admin Dashboard → Job triggers
  ├→ Prompt updates (Tier 1/2) → Prompt Builder Layers 2-4
  └→ Tool proposals (Clio) → maintenance/

Genesis Engine (sub of Observer)
  └→ cluster_specs, validation → Admin/Founders

CIM
  ← Observer + Clio/Sage aggregated signals → Admin

Platform Tools Registry
  ← tool_proposals (Observer/Clio/Sage) → cluster_tools loader → Agents

LLM Routing
  ← Operation keys from all agents → Providers (with fallback) → llm_response_logs

Audit & Observability
  ← runtime_events + llm_response_logs + behavioural_events → Admin/Observer
```

## Critical Data Flows
- **Layer 4 Signals:** observer_prompt_updates → Prompt builder → Clio/Sage calls
- **Tool Proposals:** Observer Domain 10 → maintenance drafts → Admin approval → cluster_tools/ platform_tools
- **Welfare Escalation:** Sage → Clio (handoff) → clio_handoff_greetings (S4) → user FAB
- **Atlas Content:** Sage briefs → Atlas → Cards → Sage posts → Timeline
- **Scout Intelligence:** Clio directed jobs → Scout → Reports → Intake/Clio → Cluster proposals
- **Realtime Presence:** presence channel → ClusterPresence/TypingIndicator/Post arrival → UI

## RLS / Privacy Boundaries
- Cluster-scoped queries must not leak cross-cluster data (Sage context assembler hard constraint)
- Composition signal anonymous; care reach-out private per user; admin-only tables (observer_findings, tool_proposals)

## Failure Isolation
- Queue lanes isolate latency (critical/high vs medium/low)
- Prompt assembly validator + retry+degrade prevents LLM meltdown cascading
- Idempotency keys per job prevent duplicate writes
- Realtime fallback to initial-pull-on-mount; Activity pull-based

## External Dependencies
- SerpApi/Serper (search), Firecrawl/BrightData (tier 3), Razorpay/GPB (deferred), FCM
- All external calls wrapped via Data Acquisition layer or payment service; never direct in agents
