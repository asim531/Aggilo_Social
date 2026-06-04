# Aggilo — Comprehensive Platform Report for Coding Agents

> **Generated:** 2026-05-29
> **Authority:** This document synthesizes the root project overview (`README.md`, `ARCHITECTURE.md`, `AGGILO_SOUL.md`, `implementation_plan.md`) with the full production architecture spec (`architecture/system_implementation_prompt_part1-6.md`, `PLATFORM_AGENCY.md`, `AGENT_RUNTIME.md`, `REALTIME_ENGAGEMENT_LAYER.md`, `AGENT_COMMUNICATION_CONTRACT.md`, `CLUSTER_INTELLIGENCE_MODULES.md`, `premium_cluster_requirements.md`). Where contradictions exist, the `architecture/` folder wins per `ARCHITECTURE.md`.

---

## Table of Contents

1. [What This App Is](#1-what-this-app-is)
2. [Current State: Code vs. Documentation](#2-current-state-code-vs-documentation)
3. [Tech Stack](#3-tech-stack)
4. [Monorepo Structure](#4-monorepo-structure)
5. [The 5 AI Agents](#5-the-5-ai-agents)
6. [Database Schema](#6-database-schema)
7. [API Endpoints](#7-api-endpoints)
8. [BullMQ Agent Runtime](#8-bullmq-agent-runtime)
9. [The Four-Layer Inheritance Contract](#9-the-four-layer-inheritance-contract)
10. [Cluster Lifecycle & Arc State Machine](#10-cluster-lifecycle--arc-state-machine)
11. [Data Acquisition Layer](#11-data-acquisition-layer)
12. [Real-Time Engagement Layer](#12-real-time-engagement-layer)
13. [Observer — Platform Steward](#13-observer--platform-steward)
14. [Cluster Intelligence Modules](#14-cluster-intelligence-modules)
15. [Cluster Intake Pipeline](#15-cluster-intake-pipeline)
16. [Inter-Agent Communication Patterns](#16-inter-agent-communication-patterns)
17. [Premium Clusters & Agent Governance](#17-premium-clusters--agent-governance)
18. [Key Architectural Constraints](#18-key-architectural-constraints)
19. [Implementation Phasing](#19-implementation-phasing)
20. [What Is NOT in This Architecture](#20-what-is-not-in-this-architecture)
21. [File Reference Map](#21-file-reference-map)

---

## 1. What This App Is

**Aggilo** is an AI-native social network designed to build small, meaningful communities called **clusters** around who people actually are — their age, city, language, and interests. The core premise: instead of algorithmic feeds and performative social media, an AI agent named **Clio** discovers the right people near you and places them in small groups where real connection can happen.

### The Philosophy

The platform is built on a deeply held conviction: the universe was not an accident, and every human being carries inherent worth. Connection between people is not the end goal — it is the *means* through which good character (honesty, patience, generosity, care) is practiced and witnessed. The agents never optimize for engagement. Engagement is a by-product of two people whose meeting served them.

> **The one line that cannot be crossed:** The agent must never treat a human being as a means to a metric — not for retention, not for engagement, not for the platform's growth.

### Key Concepts

| Term | Meaning |
|------|---------|
| **Cluster** | A small community (typically 5-50 members) built around shared demographics and interests |
| **AGGIL** | The matching engine: Age, Gender, Geography, Interests, Language |
| **Clio** | The personal AI orchestrator — visible via FAB overlay, never posts to Timeline |
| **Sage** | The cluster anchor — posts content, guides discussions, visible in Timeline as `system_sage` |
| **Atlas** | Content intelligence — discovers relevant articles, videos, trends for clusters |
| **Scout** | Macro-discovery — crawls the internet for emerging community opportunities |
| **Observer** | Platform steward — monitors 10 domains of platform health autonomously |
| **Arc Phase** | Cluster maturity state machine: A (empty) → B (first post) → C (72h silence) → D (active) → E (thriving) |
| **CIM** | Cluster Intelligence Modules — periodic multi-dimensional analysis (behavioural, functional, vibe, purpose, growth) that synthesizes agent outputs into admin-private intelligence reports |
| **Premium cluster** | Human-administered cluster with an Admin + up to 3 Managers. Agents serve human authority; vault is cluster-specific |
| **Agent Involvement Slider** | Min / Medium / High ceiling for agent presence in a cluster. Immutable safety floor always runs |
| **Room Workshop** | Clio + Sage working dialogue + feature/tool pipeline. Members can propose, upvote, and comment on features |
| **Vault** | Premium-cluster-specific knowledge base. Admin-curated entries that Sage may surface as verified references |

---

## 2. Current State: Code vs. Documentation

**The root folder is almost entirely specifications and documentation. There is NO production application codebase here yet.**

### What Exists Now

| Location | What It Is |
|----------|-----------|
| `architecture/` | 6-part system implementation spec + agency/runtime/engagement docs |
| `PRD/` | 12 Product Requirement Documents |
| `docs/` | 50+ operational specs (onboarding, chatbox, skill discovery, soul injection, etc.) |
| `clio/`, `sage/`, `scout/`, `atlas/`, `observer/` | Agent configuration files (SOUL.md, AGENTS.md, skills, prompts) |
| `launch/` | Static HTML landing pages (marketing site with Clio interaction card) |
| `yantra/` | **Deprecated** — legacy Python runtime spec. Only `routing_table.json` is still valid |
| `clusters/` | Cluster tooling template + first live cluster docs |
| `phase0/` | **Pilot workspace** — two isolated Next.js apps (`mvp/` = Sisters in Dua, `lc/` = Long Conversation). Separate stack, separate deployment. |

### What Does NOT Exist Yet

- No `package.json`, `vite.config.ts`, or `tsconfig.json` in the root
- No `apps/web/` or `apps/api/` directories
- No `src/` code outside `phase0/`
- No running production backend or frontend

**The architecture is fully specified and ready to implement.**

---

## 3. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Language** | TypeScript (strict mode) everywhere | Type safety across full stack |
| **Frontend** | React 18+ (Vite build) | Mobile-first PWA, fast HMR |
| **Backend** | Node.js + **Fastify** | Better perf than Express, schema validation built-in (TypeBox) |
| **Database** | Supabase (PostgreSQL) | Auth, Realtime, RLS, Storage — all native |
| **Auth** | Supabase Auth (Email/Phone OTP) | JWT forwarded to Node for verified routes |
| **Realtime** | Supabase Realtime (WebSockets) | DMs, cluster chat, live updates |
| **AI Orchestration** | Node.js services calling external LLM APIs | Replaces original "Yantra VPS" concept |
| **Queue** | BullMQ (Redis-backed) | 4 priority lanes: `critical`, `clio-high`, `events-medium`, `scout-low` |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | Free tier sufficient for launch |
| **Payments** | Razorpay + Google Play Billing | India-focused UPI + Play Store |
| **Data Acquisition** | Tiered APIs → Search Proxies → Managed Scraping | Scout & Atlas MUST NOT crawl directly |
| **Deployment** | Vercel (React PWA) + Railway (Node API) + Supabase Cloud | |

> **MASTER_INSTRUCTIONS_v2 — Stack Declaration:** The PRDs reference Laravel/PHP. This blueprint **permanently replaces** the entire backend with React + Node.js/Fastify + Supabase. There is no Laravel, no PHP, no Python, no "Yantra VPS" in this architecture.

> **No Direct Web Scraping:** Scout and Atlas MUST NEVER crawl the web using Puppeteer/Playwright from Railway server IPs. Direct crawling is architecturally prohibited.

---

## 4. Monorepo Structure

```
aggilo/
├── package.json                    # Root workspace config (Turborepo)
├── turbo.json                      # Turborepo pipeline (build, dev, lint)
├── .env.example                    # All required env vars documented
├── .gitignore
│
├── apps/
│   ├── web/                        # React PWA (Vite)
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── index.html
│   │   ├── public/
│   │   │   ├── manifest.json       # PWA manifest
│   │   │   └── sw.js               # Service worker
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── routes/             # File-based or manual routing
│   │       │   ├── onboarding/
│   │       │   ├── dashboard/
│   │       │   ├── cluster/
│   │       │   ├── dm/
│   │       │   ├── settings/
│   │       │   └── admin/
│   │       ├── components/
│   │       │   ├── ui/             # Primitives (Button, Input, Card, Modal)
│   │       │   ├── clio/           # Clio FAB, chat panel, speech bubbles
│   │       │   ├── cluster/        # ClusterCard, Timeline, MemberList
│   │       │   ├── feed/           # PostCard, CommentThread, CreatePost
│   │       │   └── layout/         # AppShell, TabBar, Header
│   │       ├── hooks/              # useAuth, useClio, useCluster, useRealtime
│   │       ├── lib/
│   │       │   ├── supabase.ts     # Supabase client init
│   │       │   ├── api.ts          # Fastify API client (axios/fetch wrapper)
│   │       │   └── constants.ts
│   │       ├── store/              # React Context providers
│   │       ├── types/              # Shared TS types (imported from packages/)
│   │       └── styles/
│   │           ├── globals.css
│   │           └── tokens.css      # Design tokens
│   │
│   └── api/                        # Node.js Fastify server
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts            # Server bootstrap
│           ├── config/
│           │   ├── env.ts          # Validated env loading (zod)
│           │   └── supabase.ts     # Supabase admin client (service role)
│           ├── plugins/
│           │   ├── auth.ts         # JWT verification middleware
│           │   ├── rateLimit.ts
│           │   └── cors.ts
│           ├── routes/
│           │   ├── auth/           # OTP send/verify, profile create
│           │   ├── health.ts       # /health and /ready (no auth)
│           │   ├── clusters/       # CRUD, search, join/leave, scoring
│           │   ├── posts/          # Create, like, comment, report
│           │   ├── dm/             # Request, accept, send, conversations
│           │   ├── clio/           # Chat endpoint, history
│           │   ├── sage/           # Persona, status, description proposals
│           │   ├── scout/          # Admin triggers, status, results
│           │   ├── atlas/          # Brief dispatch, results poll
│           │   ├── premium/        # Subscription, matchmaker
│           │   ├── admin/          # Dashboard, moderation, personas, LLM routing, observer
│           │   ├── notifications/  # Device register, preferences
│           │   └── payments/       # Razorpay/Google Play webhooks
│           ├── services/
│           │   ├── aggil-engine.ts  # AGGIL scoring, qualification, matching
│           │   ├── clio.ts          # Clio orchestrator
│           │   ├── sage.ts          # Sage cluster intelligence
│           │   ├── scout.ts         # Scout intelligence logic
│           │   ├── atlas.ts         # Atlas content intelligence
│           │   ├── data-acquisition.ts # External data retrieval (NO direct crawling)
│           │   ├── llm-router.ts    # Dynamic LLM routing + A/B testing
│           │   ├── moderation.ts    # Content screening + severity
│           │   ├── notification.ts  # FCM dispatch + batching
│           │   ├── email.ts         # Resend transactional email
│           │   └── payments.ts      # Razorpay/GP verification
│           ├── workers/
│           │   ├── queue.ts         # BullMQ setup (4 lanes)
│           │   ├── scout-worker.ts
│           │   ├── atlas-worker.ts
│           │   ├── arc-evaluator.ts # Cluster arc phase transitions
│           │   ├── sage-worker.ts   # Sage content posting, first-post ack, milestone
│           │   ├── sage-reset.ts    # Daily sage_posts_today reset
│           │   └── observer-worker.ts # 10-domain passive intelligence (6h cycle)
│           ├── db/
│           │   └── queries/         # Typed Supabase queries
│           └── types/
│
├── packages/
│   ├── shared/                     # Shared types, constants, validators
│   │   ├── package.json
│   │   └── src/
│   │       ├── types/              # DB row types, API request/response types
│   │       ├── validators/         # Zod schemas shared across apps
│   │       └── constants/          # AGGIL dimensions, enums, config
│   └── supabase/
│       ├── package.json
│       ├── config.toml             # Supabase project config
│       ├── migrations/             # SQL migration files (numbered)
│       │   ├── 001_users_profiles.sql
│       │   ├── 002_clusters.sql
│       │   ├── 003_posts_comments.sql
│       │   ├── 004_dms.sql
│       │   ├── 005_ai_agents.sql
│       │   ├── 006_moderation.sql
│       │   ├── 007_premium.sql
│       │   ├── 008_notifications.sql
│       │   ├── 009_llm_routing.sql
│       │   ├── 010_atlas.sql
│       │   ├── 011_premium_clusters.sql
│       │   ├── 012_rls_policies.sql
│       │   ├── 013_sage.sql
│       │   ├── 014_cluster_tools.sql
│       │   ├── 015_observer.sql
│       │   ├── 016_cluster_polls.sql
│       │   ├── 017_behavioural_events.sql
│       │   ├── 018_persona_files.sql
│       │   └── 019_rls_policies_v2.sql
│       ├── seed.sql                # Initial data (LLM routing defaults, etc.)
│       └── types/
│           └── database.ts         # Auto-generated from schema
│
└── docs/
    └── prd/                        # PRD reference copies
```

---

## 5. The 5 AI Agents

```
AGGILO SOUL (Layer 1 — immutable, every LLM call)
        │
PLATFORM RULES + INHERITANCE CONTRACT (Layer 2)
        │
    Observer  ←── Platform Steward
    │    │
    │    ├── Channel 1: Autonomous stewardship (Phase 1)
    │    └── Channel 2: Finding-and-approve (Tier 3)
    │
    └── Welfare signals → Admin always

CLUSTER INTELLIGENCE LAYER (above agents, admin-private)
    CIM (Cluster Intelligence Modules)
        ├── Consumes: Sage Feature Intelligence signal log
        ├── Consumes: Observer findings (scoped)
        ├── Consumes: Clio FAB aggregated signals (anonymized)
        └── Outputs: Intelligence reports → admin dashboard (auto-approve or review)

MEMBER-FACING AGENT HIERARCHY
    Clio (orchestrator + member voice)
        ├── Sage (cluster anchor) → Atlas (content layer)
        └── Scout (community intelligence)
```

| Agent | Visibility | Role | Lane | Key Output |
|-------|-----------|------|------|------------|
| **Clio** | Personal FAB overlay | Orchestrator + member voice | `clio-high` | Chat replies, cluster creation, discovery, premium matchmaker |
| **Sage** | Cluster Timeline | Cluster anchor / assistant | `events-medium` | Timeline posts (`system_sage`), description refinement, `@Sage` replies |
| **Atlas** | Invisible | Content intelligence | `events-medium` | Content cards → Sage curates and posts |
| **Scout** | Invisible | Macro-discovery / trend crawling | `scout-low` | Topic reports, auto-clusters, suggestion cards |
| **Observer** | Invisible | Platform steward / passive monitoring | `events-medium` | 10-domain findings, autonomous stewardship (Phase 1) |
| **CIM** | Invisible (admin-only) | Cluster intelligence synthesis | `events-medium` / `clio-high` | Admin-private reports with auto-approved or reviewed recommendations |

**Sage is Clio's subordinate, not a peer.** Clio delegates cluster-level intelligence to Sage, who operates semi-autonomously. Clio retains override authority at all times. Sage owns all cluster-level posting.

---

## 6. Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `auth_users` | Supabase native auth (id, email, phone) |
| `profiles` | Extends auth.users: year_of_birth, gender, nickname, languages, interests, purpose, location_data, premium_status, is_admin, sage_introduced, deletion_status |

### Cluster Tables

| Table | Purpose |
|-------|---------|
| `clusters` | id, created_by, name, description, purpose, interest_tags, age_min/max, gender_filter, geography, languages, hard_language_gate, cluster_score, is_premium, credibility_score, hard_location_type/data, arc_phase, sage_posts_today, member_count, post_count |
| `cluster_members` | cluster_id, user_id, is_founder, is_manager, joined_at, left_at |

### Content Tables

| Table | Purpose |
|-------|---------|
| `posts` | cluster_id, author_id, author_type (user\|system_sage), content, image_url, source_url, conversation_hook, like_count, comment_count, is_pinned, is_hidden |
| `comments` | post_id, author_id, author_type, content, is_hidden |
| `post_likes` | post_id, user_id |

### DM Tables

| Table | Purpose |
|-------|---------|
| `dm_threads` | user_a, user_b, cluster_context, status (pending\|accepted\|declined\|expired) |
| `dm_messages` | thread_id, sender_id, content |

### AI Agent Tables

| Table | Purpose |
|-------|---------|
| `clio_conversations` | user_id, cluster_id, context, messages, register_used, arc_beat_reached, outcome |
| `sage_personas` | One per cluster: register, formality, interjection_frequency |
| `sage_description_proposals` | Proposed description refinements (pending\|approved\|rejected) |
| `atlas_discoveries` | Scored content cards: headline, source, relevance_score, demographic_confidence, conversation_hook, arc_variant |
| `scout_discoveries` | Internet trend findings: segment_key, topic, relevance_score, status |

### Observer Tables (Phase 1)

| Table | Purpose |
|-------|---------|
| `observer_findings` | 10-domain findings with severity, signature hash, occurrence_count |
| `observer_prompt_updates` | Autonomous stewardship: target_agent, target_layer, proposed_value, autonomy_tier, veto_deadline |
| `clio_observer_signals` | TTL-bounded signals injected into Layer 4 |
| `observer_cluster_context` | Rolling memory per cluster |
| `cluster_prompt_versions` | Prompt version history |

### Cluster Intelligence Tables (CIM)

| Table | Purpose |
|-------|---------|
| `cluster_intelligence_reports` | One row per module run: module_type, trigger_type, confidence_overall, llm_raw_analysis, status |
| `intelligence_findings` | 1:N with reports: finding_type, description, evidence_summary, confidence, severity |
| `intelligence_recommendations` | 1:N with reports: category, risk_level, auto_approved, implementation_scope, status, admin_decision |
| `intelligence_questions` | 1:N with reports: stakeholder questions with who_should_answer and urgency |
| `intelligence_llm_comparisons` | Admin A/B testing: canonical_report_id, compared_llms, admin_selected_llm |
| `intelligence_introspection` | Self-critique layer: alternative_perspectives, blind_spots, confidence_adjustment, findings_revised |

### Premium Cluster & Workshop Tables

| Table | Purpose |
|-------|---------|
| `cluster_config` | Cluster settings: agent_involvement, agent_disabled, free_text_guidance, parsed_directives, is_public_listed, public_slug, public_meta |
| `vault_sources` | Curated external sources Sage may pull verified entries from |
| `vault_gap_requests` | Sage-detected gaps in vault coverage |
| `cluster_features` | Workshop features: kind (agent_tool / member_feature), status, proposed_by |
| `cluster_feature_upvotes` | Member votes on proposed features |
| `cluster_feature_comments` | Member comments on proposed features |
| `sage_decision_logs` | Every Sage decision: step_matched, register_used, content_hash, suppression_reason |
| `agent_feedback` | Member/agent feedback on AI outputs |
| `agent_prompt_proposals` | Proposed prompt changes (audited) |
| `skill_registry` | Platform-wide skill catalog |
| `welfare_notifications` | Welfare alert queue for Admin/Managers |
| `character_concerns` | Character-concern alert queue (care queue) |
| `cluster_demand_signals` | Anonymous demand signals from AGGIL-mismatched visitors |
| `atlas_pulses` | Public-safe Atlas content pulses for public cluster surfaces |
| `public_cluster_view` | Postgres view: anonymous-safe cluster preview data only |

### LLM Ops Tables

| Table | Purpose |
|-------|---------|
| `llm_routing_config` | operation_key → primary_llm, fallback_llm, cost_ceiling, A/B test config |
| `response_logs` | Every LLM call: provider, model, latency, tokens, cost, user_rating |
| `runtime_events` | BullMQ job dispatch/completion/failure telemetry |

### Safety Tables

| Table | Purpose |
|-------|---------|
| `reports` | Content reports: category, severity, status, admin_verdict |
| `user_bans` | ban_type, reason, banned_by, expires_at |
| `behavioural_events` | Pseudonymized: event_type, cluster_id, segment_l1/l2/l3 |

---

## 7. API Endpoints

All endpoints require `Authorization: Bearer {JWT}` unless noted. Admin endpoints additionally require `profiles.is_admin = true`.

### Auth & Profile

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/api/auth/send-otp` | None |
| `POST` | `/api/auth/verify-otp` | None |
| `POST` | `/api/profile/create` | JWT |
| `GET`  | `/api/profile/me` | JWT |
| `PUT`  | `/api/profile/me` | JWT |
| `POST` | `/api/nickname/check` | None |
| `POST` | `/api/account/delete-request` | JWT |

### Clusters

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/api/clusters` | JWT |
| `GET`  | `/api/clusters/search` | JWT |
| `GET`  | `/api/clusters/suggestions` | JWT |
| `GET`  | `/api/clusters/:id` | JWT |
| `POST` | `/api/clusters/:id/join` | JWT |
| `POST` | `/api/clusters/:id/leave` | JWT |
| `GET`  | `/api/clusters/:id/members` | JWT |
| `GET`  | `/api/clusters/:id/preview` | None |

### Posts & Feed

| Method | Path | Auth |
|--------|------|------|
| `GET`  | `/api/clusters/:id/feed` | JWT |
| `POST` | `/api/clusters/:id/posts` | JWT |
| `POST` | `/api/posts/:id/like` | JWT |
| `POST` | `/api/posts/:id/comment` | JWT |
| `POST` | `/api/posts/:id/report` | JWT |

### DMs

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/api/dm/request` | JWT |
| `POST` | `/api/dm/respond` | JWT |
| `POST` | `/api/dm/send` | JWT |
| `GET`  | `/api/dm/conversations` | JWT |

### Clio (Unified Chat)

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/api/clio/chat` | JWT |
| `GET`  | `/api/clio/history` | JWT |
| `GET`  | `/api/clio/tips/:clusterId` | JWT |
| `POST` | `/api/clio/tips/:tipId/act` | JWT |
| `POST` | `/api/clio/tips/:tipId/dismiss` | JWT |

> **Unified-presence note:** The legacy split between cluster-mode chat and private-mode chat is retired. There is one `/api/clio/chat`. The presence of `cluster_id` in the request body is the only switch.

### Sage

| Method | Path | Auth |
|--------|------|------|
| `GET`  | `/api/sage/:clusterId/persona` | JWT |
| `GET`  | `/api/sage/:clusterId/status` | JWT |
| `POST` | `/api/sage/description-proposal/:clusterId` | Service |
| `POST` | `/api/sage/mention` | JWT |

### Premium & Payments

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/api/premium/subscribe` | JWT |
| `POST` | `/api/premium/cancel` | JWT |
| `POST` | `/api/payments/razorpay/create-order` | JWT |
| `POST` | `/api/payments/razorpay/verify` | Webhook |

### Admin

| Method | Path | Auth |
|--------|------|------|
| `GET`  | `/api/admin/dashboard` | Admin |
| `GET`  | `/api/admin/users` | Admin |
| `GET`  | `/api/admin/clusters` | Admin |
| `GET`  | `/api/admin/reports` | Admin |
| `POST` | `/api/admin/reports/:id/action` | Admin |
| `GET`  | `/api/admin/observer/findings` | Admin |
| `GET`  | `/api/admin/observer/stewardship/pending` | Admin |
| `GET`  | `/api/admin/llm/routing` | Admin |
| `PUT`  | `/api/admin/llm/routing` | Admin |
| `GET`  | `/api/admin/sage/overview` | Admin |

---

## 8. BullMQ Agent Runtime

Formerly called "Yantra" — now "Agent Runtime" (BullMQ + Redis).

### Four Priority Lanes

| Lane | Used By | SLA |
|------|---------|-----|
| **`critical`** | Welfare flags, character concerns, account safety | <1s p99 |
| **`clio-high`** | Clio chat replies, `@Sage` responses, ephemeral chat | <5s p95 |
| **`events-medium`** | Sage posting, Atlas briefs, Observer cycles, arc evaluation, agent chatbox | <30s p95 |
| **`scout-low`** | Scout crawls, Atlas crawls, calibration jobs | <10min p95 |

### Key Job Types

| Job | Lane | Trigger | Concurrency |
|-----|------|---------|-------------|
| `ClioChatJob` | `clio-high` | On-demand | 10 |
| `SagePostFromAtlas` | `events-medium` | Atlas content ready | 3 |
| `SageFirstPostAck` | `events-medium` | First organic post (0→1) | 5 |
| `SageMilestoneMessage` | `events-medium` | Member count hits 10 | 5 |
| `SageAtMentionResponse` | `clio-high` | `@Sage` mention | 5 |
| `AtlasBriefOnJoin` | `events-medium` | 60s delay after join | 5 |
| `AtlasReengagementCheck` | `events-medium` | Every 6h | 3 |
| `ObserverCycle` | `events-medium` | Every 6h (10 domains) | 2 |
| `ClusterArcEvaluate` | `events-medium` | Every 6h | 3 |
| `ScoutCrawlJob` | `scout-low` | 6h/12h/24h by segment | 2 |
| `AgentChatboxExchange` | `events-medium` | Scheduled cadence | 3 |
| `SageFeatureEvaluation` | `events-medium` | Every 48h per cluster | 3 |
| `SagePostsDailyReset` | `events-medium` | Midnight | 1 |
| `ChatboxCadenceScheduler` | `events-medium` | Every 30 min | 1 |
| `ClusterIntelligenceWeekly` | `events-medium` | Weekly cron per cluster | 1 | Runs selected modules based on cluster state |
| `ClusterIntelligenceBootstrap` | `events-medium` | 24h after cluster creation | 1 | Runs all modules in inference mode |
| `ClusterIntelligenceOnDemand` | `clio-high` | Admin dashboard action | 1 | Runs selected modules with specified LLM |
| `ClusterIntelligenceCrossAgentReview` | `events-medium` | Confidence ≥ 0.75 finding | 1 | Sage ↔ Clio chatbox exchange |
| `ClusterIntelligenceAutoImplement` | `scout-low` | Low-risk auto-approved | 1 | Queues implementation of approved changes |

### Idempotency

Every job carries: `{agent}_{operation_key}_{related_id}_{coarse_timestamp}`

The runtime refuses to dispatch a job whose idempotency key has already been processed in the current dedup window (default 1 hour).

### Failure Modes

| Failure | Runtime Behaviour |
|---------|-------------------|
| Worker crash mid-job | Re-queued with backoff (1s, 5s, 30s); after 3 retries → `failed` queue → Observer Domain 5 finding |
| Timeout | Marked timed-out; partial-result handler invoked if defined |
| LLM provider 5xx | Retry once → call fallback LLM → return `status: 'error'` |
| Daily LLM budget exceeded | Return `status: 'budget_exceeded'`; agent degrades gracefully |
| Idempotency collision | Rejected at dispatch; original in-flight job continues |

---

## 9. The Four-Layer Inheritance Contract

Every LLM call assembles context in this exact order:

```
Layer 1 — Platform super-prompt   (≤600 tokens, NEVER trimmed)
  Soul, safety floor, voice baseline, forbidden list, empowered list,
  JSON contract conventions, failure-handling baseline

Layer 2 — Agent character         (≤800 tokens, NEVER trimmed)
  Sage/Clio/Atlas/Scout/Observer register + decision framework

Layer 3 — Cluster identity        (≤400 tokens, compress if needed)
  Display name, tagline, description, vocabulary, arc phase, member count,
  demographic chips, anchor seed, member noun, authority terminology,
  primary language

Layer 4 — Per-call signals        (variable; trim oldest turns first)
  Memory, welfare flags, @mentions, vault context, recent posts,
  Observer signals, user message
```

**80% Rule:** When total assembled context exceeds 80% of the model's context window, Layer 4 history is trimmed from oldest turns first. If still over 80%, Layer 3 is compressed to key fields only. **Layer 1 and Layer 2 are never trimmed.**

**Ceiling enforcement is the builder's responsibility.** Every `*-builder.ts` checks token counts before calling `llmCall()`. Violations logged as `meta.context_trim_applied = true`.

**Source code layout:**
```
src/lib/prompts/
├── platform/          # cluster-agnostic, every agent inherits
│   ├── super-prompt.ts
│   ├── sage-character.ts
│   ├── clio-character.ts
│   └── share-mode.ts
├── cluster-types/     # per-type defaults
│   ├── generic.ts
│   └── premium.ts
├── clusters/<id>/     # concrete cluster implementations
│   ├── identity.ts
│   ├── sage.ts
│   ├── clio.ts
│   └── index.ts
├── registry.ts        # cluster_id → cluster module resolver
├── sage-builder.ts
├── clio-builder.ts
└── share-builder.ts
```

---

## 10. Cluster Lifecycle & Arc State Machine

Clusters progress through 5 arc phases. The backend evaluates transitions every 6h via `ClusterArcEvaluate` worker.

| Phase | Name | Trigger | Sage Behavior |
|-------|------|---------|---------------|
| **A** | Empty | `post_count = 0` | Host mode: dispatch Atlas cold content, post 1 seed item |
| **B** | First post | `post_count > 0` | Acknowledge first organic post within 60s (1 sentence). Silent 24h. |
| **C** | 72h silence | No posts in 72h | Atlas checks for reengagement content. Post 1 item if ≥90% relevance. Else silent. |
| **D** | Active | 6+ posts in 7 days | **Passive.** No proactive posting. |
| **E** | Thriving | 10+ members, 15+ posts/week | Milestone message at 10 members. Then permanently passive. |

**Regressions:** D→C on 72h silence. E→C on 72h silence.

**Sage daily limit:** `sage_posts_today < 2` per cluster. Reset at midnight.

---

## 11. Data Acquisition Layer

Scout and Atlas browse the web. They **MUST NEVER** use Puppeteer/Playwright from Railway server IPs.

### Tier 1 — Structured APIs (preferred)

| Source | API | Free Tier |
|--------|-----|-----------|
| Reddit | Reddit OAuth2 API | 100 req/min |
| YouTube | YouTube Data API v3 | 10,000 units/day |
| Hacker News | HN Algolia API | Unlimited |
| ProductHunt | GraphQL API | 450 req/day |
| Google News | RSS feeds | Unlimited |

### Tier 2 — Search API Proxies

| Provider | Purpose | Env Var |
|----------|---------|---------|
| **SerpApi** OR **Serper.dev** | Google search/news, Twitter/X trends | `SERP_API_KEY` |

### Tier 3 — Managed Scraping (fallback only)

| Provider | Purpose | Env Var |
|----------|---------|---------|
| **Firecrawl** OR **BrightData** | LinkedIn, The Ken, non-API sources | `SCRAPING_API_KEY` |

### Tier 4 — NEVER

Direct headless browser crawling from Railway IPs is **architecturally prohibited**. There is no exception path.

---

## 12. Real-Time Engagement Layer

Four real-time signals flow through Supabase Realtime:

### Signal 1 — Presence
- **Channel:** `cluster:{cluster_id}:presence`
- **Tracks:** `{user_id, nickname, online_at}`
- **Consumers:** Cluster header (live count), PostCard (green dot next to online members)

### Signal 2 — Composition (typing indicator)
- **Channel:** Same presence channel (broadcast events)
- **Event name:** `typing`
- **Throttle:** 2s per emit per member. Auto-clears after 4s.
- **Privacy:** **Anonymous.** Members see "a sister is writing…" never the nickname.

### Signal 3 — Arrival (new content)
- **3a:** Postgres INSERT on `posts` → `↑ N new posts` pill
- **3b:** Postgres UPDATE on `posts.sage_handoff_to_clio_at` → "Clio is following up privately."
- **3c:** Postgres INSERT on `agent_chatbox_exchanges` → Workshop dialogue updates

### Signal 4 — Care Reach-Out
- **Channel:** Postgres INSERT on `clio_handoff_greetings` filtered to `user_id`
- **Delivery:** Clio FAB shows soft rose dot. Greeting lands in "Just Clio · forgets" tab.
- **Privacy:** Private to one user. Never visible in cluster timeline.
- **Templates:** Deterministic templates only — no LLM generation on high-stakes moments.

### Fallback Contract

| Signal | Online | Reconnecting | Offline |
|--------|--------|--------------|---------|
| Presence | Live count | Last-known + stale marker | Hidden |
| Composition | Live indicator | Hidden | Hidden |
| Arrival (posts) | Pill + auto-refresh | On-reconnect-fetch | Pull-to-refresh |
| Care reach-out | Realtime INSERT | Initial pull on mount | Visible on next FAB open |

---

## 13. Observer — Platform Steward

Observer monitors 10 domains every 6 hours as a background BullMQ worker.

| Domain | Label | Severity | What It Detects |
|--------|-------|----------|-----------------|
| 1 | `language_distribution` | info | ≥8 members share secondary language + ≥3 posts → recommend parallel cluster |
| 2 | `engagement_decay` | warning | 7-day post rate declining ≥40% |
| 3 | `topic_drift` | info | LLM-scored divergence from cluster purpose > 0.6 |
| 4 | `content_quality` | warning | ≥30% of posts under 15 words or low-effort |
| 5 | `member_churn` | warning | ≥3 members left in 48h or 60% join-and-ghost |
| 6 | `cross_cluster_overlap` | info | ≥5 users in 3+ overlapping clusters → merge candidate |
| 7 | `posting_cadence` | warning | Single member ≥50% of posts in 7 days |
| 8 | `toxic_signals` | critical | Coded language, dogwhistles, escalating hostility |
| 9 | `tool_effectiveness` | info | Which Atlas/Sage content gets engagement |
| 10 | `growth_anomalies` | warning | Sudden spike (≥10 joins in 1h) or bot wave |

### Two Output Channels

**Channel 1 — Autonomous Stewardship (Phase 1):**
- Observer proposes prompt updates (Layers 2, 3, 4).
- Platform Rules validation layer checks against immutable constraints.
- Minimality test confirms smallest intervention.
- Tier 1: applies immediately. Admin has 30-min veto window.
- If vetoed: rolls back + escalates to Channel 2.

**Channel 2 — Finding-and-Approve:**
- Observer writes structured finding to `observer_findings`.
- Admin dashboard surfaces severity + suggested action.
- Admin approves/rejects. On approval: job triggers.
- **Welfare signals ALWAYS use Channel 2.** Observer has zero autonomy on welfare.

### What Observer Cannot Do
- Modify Layer 1 (Soul) — structurally impossible
- Modify welfare detection or character detection logic
- Modify the cosmological substrate
- Act on welfare signals autonomously
- Direct other agents in real-time conversation

---

## 14. Cluster Intelligence Modules

Cluster Intelligence Modules (CIM) synthesize cluster data with **LLM inference** to produce actionable intelligence for the admin. CIM does not merely aggregate statistics — it uses the LLM's reasoning capability to infer patterns, tensions, opportunities, and risks that raw data alone cannot surface.

**Applicable to:** Both **generic** and **premium** clusters. Intelligence adapts to cluster type — premium clusters include Admin/Manager authority signals, vault context, and Workshop state.

CIM is **not** a member-facing feature. Members never see module reports, are never named in output, and cannot opt into or out of analysis. All output is pattern-level, anonymized, and admin-private.

**Background-only implementation:** Approved recommendations are implemented *subtly in the background* (Sage persona calibration, content nudges). Members never see "CIM recommended this." Only if the admin explicitly pushes a finding to the Workshop Room does CIM output become member-visible.

### The Five Modules

| Module | Dimension | Question It Answers |
|--------|-----------|---------------------|
| **Behavioural** | Member interaction patterns | Reply-network topology, engagement depth, lurker patterns (satisfied/at-risk/new), sub-community surface-to-admin, cultural setter dynamics |
| **Functional** | Feature and tool gaps | Unused skills, missing capabilities, UX friction, tool coverage |
| **Vibe** | Emotional and tonal health | Tone trajectory, trust indicators, belonging signals, safety perception |
| **Purpose** | Mission alignment | Content-theme drift, member-intent alignment, goal-progress tracking |
| **Growth** | Expansion and sustainability | Acquisition velocity, retention, invitation conversion, capacity tension |

### Execution Model

**Three trigger types:**

| Trigger | When | Who Initiates |
|---------|------|---------------|
| **Weekly cadence** | Every 7 days, staggered by cluster creation date | Platform scheduler |
| **Creation bootstrap** | 24h after cluster creation | Platform event (`cluster_created`) |
| **Admin on-demand** | Any time | Admin via dashboard |

**Module selection logic:**

```
IF creation_bootstrap: Run ALL modules (inference mode)
IF weekly_cadence:   Always Vibe + Functional
                     If member_count >= 10: Behavioural + Purpose
                     If member_count >= 25 AND arc_phase >= C: Growth
IF admin_on_demand:  Run modules specified by admin
```

**Five-step analysis pipeline:**

1. **Data Assembly** — Query Supabase, read Sage FI signal log (Redis), read Observer findings, aggregate and anonymize
2. **LLM Inference & Analysis** — Module-specific prompt with cluster context, arc phase, **demographic lens** (age, gender, geography, interests, languages shape interpretation), and premium cluster context (vault, Workshop, Admin guidance)
3. **Structured Extraction** — Parse raw analysis into typed report schema, compute confidence, tag risk
4. **Introspection** (optional) — Second-pass self-critique: "What perspectives did I miss? How would a different demography re-read this data?" Adjusts confidence based on blind spots found
5. **Cross-Agent Review** (optional) — For confidence >= 0.75: Sage <-> Clio chatbox exchange -> PROCEED / MONITOR / DEFER
6. **Persistence & Routing** — Write to `cluster_intelligence_reports`; low-risk + high-confidence -> auto-approve; medium -> admin review; high -> admin + platform_admin review

### Output Format

Every module produces an `IntelligenceReport` with:
- `findings[]`: pattern | anomaly | opportunity | risk
- `recommendations[]`: category (`feature_create`, `persona_adjust`, `skill_toggle`, `goal_update`, etc.), risk_level, auto_approved, implementation_scope, status
- `stakeholder_questions[]`: who_should_answer, urgency

**Confidence scoring:** Weighted compositional model
`final = clamp((base × 0.40) + (data_quality × 0.25) + (introspection × 0.20) + (cross_agent × 0.15), min=0.15, max=0.98)`
- Replaces fragile multiplicative model; preserves signal even when one factor is uncertain
- Admin-adjustable thresholds (default auto-approve at 0.80, range 0.70-0.90)
- Manual calibration in Phase 1; empirical validation deferred to Phase 2+

**Risk classification:**
- Low: `skill_toggle`, `persona_adjust`, `description_update`, `goal_update` -> auto-approve at confidence >= 0.80
- Medium: `feature_create`, `feature_remove`, `tool_create` -> never auto, admin approval required
- High: `protocol_update` (welfare, character, privacy) -> never auto, platform_admin review required

### Admin Dashboard — Intelligence Tab

- **Report list:** Recent reports with confidence, risk, status (auto-approved / pending / rejected)
- **Report detail:** Findings, recommendations with Approve/Reject/Defer/Edit, stakeholder questions, raw LLM output, cross-agent exchange
- **LLM inference layer:** Admin can change LLM per run for different perspectives. Every inference saved with provider, model, timestamp, tokens, cost, and hash
- **LLM comparison:** Run same module with different LLMs (Kimi, Claude, Groq) -> diff view -> select canonical
- **Introspection detail:** Self-critique, blind spots, alternative perspectives by life-stage/gender/cultural/language/purpose lens
- **Deep vs. Fast toggle:** Admin chooses "Deep introspection" (~30-40% more tokens) or "Fast inference"
- **Cost guardrail:** LLM comparison quota (default 1/month/cluster, admin-adjustable 0-3)

### Privacy & Security

- **No individual identification:** Pattern-level language only ("Two members" not "Alice and Bob")
- **No cross-cluster data:** Each module sees only its own cluster
- **No FAB content leakage:** Only aggregated, anonymized signals
- **No persistent member profiles:** Output does not build member profiles
- **K-anonymity guardrail:** Clusters < 8 members skip CIM. Clusters 8-14 use aggregated AGGIL (broad age bands, region not city). Full AGGIL only for 25+ members.

---

## 15. Cluster Intake Pipeline

New clusters don't get created directly. Raw signals go through a two-pass agentic interpretation:

```
Raw signal (waitlist form / Scout internet signal / Clio member inference)
    ↓
Intake Interpreter → Draft v1 (full AGGIL config, name, description, Sage persona, seed questions)
    ↓
Adversarial Reviewer → challenges every assumption, checks demographic bias, name fit, AGGIL scope
    ↓
Draft v2 + structured diff surfaced in Admin Dashboard
    ↓
Admin reviews, may edit Draft v2, approves or rejects
    ↓
Approval → ClusterCreationJob fires → cluster live → founder invite link
    ↓
Rejection → archived with reason. No cluster created.
```

Every cluster created on the platform has a versioned intake record (v1 + v2 + diff).

---

## 16. Inter-Agent Communication Patterns

Every inter-agent communication is one of 7 patterns:

| Pattern | Used By | Shape |
|---------|---------|-------|
| **1. Brief-and-iterate** | Sage ↔ Atlas | Structured JSON brief → response → refinement. Max 3 rounds. |
| **2. Directed job** | Clio → Scout | Structured job payload to queue. Worker runs async. Caller polls/subscribes. |
| **3. Soft handoff** | Sage → Clio | Trigger fires → public silence → deterministic-template greeting INSERTed into per-user channel. |
| **4. Finding-and-approve** | Observer → Admin → agents | Structured finding → admin dashboard → human approves → job triggers. |
| **5. Tool proposal** | Observer → Clio; Clio → Sage; etc. | Markdown proposal doc → `tool_proposals` row → admin approves → activated. |
| **6. Autonomous stewardship** | Observer → prompt layers | Introspection → minimal prompt update → validation → apply → veto window. |
| **7. Cluster intake** | Intake Interpreter → Adversarial Reviewer → Admin | Raw signal → Draft v1 → critique → Draft v2 → admin approves → cluster live. |

---

## 17. Premium Clusters & Agent Governance

A **premium cluster** is a human-administered cluster where a real Admin and up to 3 Managers hold guidance authority alongside the agents. Premium clusters serve communities where domain expertise lives outside the AI — fiqh, medical practice, legal counsel, scholarly traditions.

### Roles

| Role | DB enum | Authority |
|------|---------|-----------|
| **Admin** | `profiles.role = 'founder'` | Full cluster authority. Vault ownership. Manager appointment. Member removal. Feature approval. |
| **Manager** | `profiles.role = 'manager'` | Guidance authority. Welfare and character-concern resolution. Cannot modify vault or remove other managers. |
| **Member** | `profiles.role = 'member'` | Standard member. |

The UI always shows "Admin" inside a premium cluster — never "Founder".

### The 9 Immutables (Admin Cannot Override)

1. **The Aggilo Soul** — Agents' monotheistic foundation and value system
2. **The welfare protocol** — Welfare detection runs on every message; always routes to a human
3. **The character protocol** — Step 0.5 guardrail runs on every message
4. **No human middleware on welfare** — Alerts surface in realtime; cannot be queued or batched
5. **Sage's hard limits** — Never generates Arabic/Quranic text, never rules on fiqh, never mocks traditions, never debates
6. **Privacy boundaries** — Clio's private tab content is never persisted server-side
7. **Member dignity** — No customisation makes vulnerability into leverage or surveillance
8. **AGGIL post-spawn protections** — Cannot retroactively narrow age range, add gender restriction, tighten geography, or pivot core topic
9. **The agent character** — Clio is warm but never performs warmth; Sage is grounded and silent by judgement

### How Agents Behave Differently

| Behaviour | Regular cluster | Premium cluster |
|-----------|----------------|-----------------|
| Welfare routing | To Aggilo platform admin | To cluster Admin and Managers (faster, domain-aware) |
| Vault | Cross-cluster (Aggilo-managed) | Cluster-specific (Admin-curated) |
| Thread state `unattended` -> `attended` | Sage's care-witness post counts | Only Admin/Manager post counts; Sage signals the gap |
| Feature approval | Aggilo platform team | Cluster Admin approves; platform team retains override |
| Member removal | Not allowed | Allowed, logged |
| Post deletion | Author-only | Admin/Manager can delete; logged |

### Agent Involvement Slider

Admin controls agent presence via a 3-level slider: **Min / Medium (default) / High**.

| Behaviour | Min | Medium | High |
|-----------|-----|--------|------|
| Welfare detection | **Yes (immutable floor)** | Yes | Yes |
| Character detection | **Yes (immutable floor)** | Yes | Yes |
| @Sage response | Yes (invitation honoured) | Yes | Yes |
| Cadence Workshop dialogue | Off | 2h cold / 4h active | 1h cold / 2h active |
| Verified-reference autonomous post | Off | Every 6h | Every 4h |
| Welcome new-member post | Quiet (batched) | Standard | Warm |
| Typing indicator broadcast | Off | On | On |
| Introspection cycle | Off | Every 6h | Every 3h |

`agent_disabled = true` + `min` silences all non-safety agent activity. The immutable floor still runs silently.

Free-text admin guidance (`cluster_config.free_text_guidance`) is parsed and **rejected** if it requests behaviour above the slider ceiling or violates any invariant.

### Room Workshop

The Workshop is where Clio and Sage debate tools and features for the cluster. It lives below the Timeline in the UI hierarchy.

**Two-track invariant:**
- **Tools** (`kind=agent_tool`) — Cyan accents, no vote. Agents run them; members receive output.
- **Features** (`kind=member_feature`) — Amber accents, upvote-gated. Members touch them.

**Workshop tiers by cluster size:**

| Size | Workshop | Member voting | Comments | Agent ideation |
|------|----------|---------------|----------|----------------|
| 0–4 | Hidden to members | — | — | Active (admin sees dashboard) |
| 5–14 | Placeholder | Off | Off | Active |
| 15–49 | Active | Signal-only | On | Active |
| 50+ | Active | Full polling (10+ upvotes -> admin priority) | On | Active |

Members can propose features directly. The flow: member suggestion -> `cluster_features` row -> Sage + Clio debate in next ideation cycle -> if accepted, surfaces in Workshop -> upvote/comment/admin-decision flow.

Tools labelled `deployable_now` ship autonomously when agents agree. Admin can veto any tool at any time.

### Public Listing Controls

Premium clusters can opt in to a public surface at `/c/<slug>`.

**Privacy invariant:** A Postgres view `public_cluster_view` is the **only** surface anonymous visitors read. It returns:
- `display_name`, `tagline`, `description`, `demographic_chips`
- `anchor_seed_text` (founding statement)
- `member_count_bracket` (`0-9` / `10-49` / `50-249` / `250+`)
- `latest_pulse_*` (only when public-safe and live)

Member posts, replies, welfare flags, vault entries, and Workshop dialogue are **structurally absent**. Until `is_public_listed = TRUE`, the page returns 404.

**Inbound flow:** Visitor clicks "Join" -> auth with `?ref=<slug>` -> AGGIL mismatch routes to graceful waitlist + anonymous `cluster_demand_signals` insert.

### Trust Signals

- **"Founded" badge:** Quiet credential pill on public preview and auth pages. Tooltip: "Built and actively run by a dedicated host and team." Not configurable by admin.
- **Clio's signature statement:** Short, humanized closing statement below cluster description on auth/public pages. Register-matched to cluster. Varies per session. Attribution: `— Clio, your Aggilo guide` (invariant).

---

## 18. Key Architectural Constraints

1. **No direct web scraping.** Scout/Atlas use tiered Data Acquisition Layer only.
2. **Sage is Clio's subordinate.** Clio delegates cluster posting to Sage. Clio never posts to Timeline.
3. **Observer is platform steward.** Principal is platform rules + admin team, not any other agent.
4. **Deterministic templates for high-stakes moments.** New-member welcome and Sage→Clio handoff greetings are NOT LLM-generated.
5. **Validator-with-retry-and-degrade.** Every structured-output prompt: bad-example block + regex validator + one retry + degraded fallback.
6. **Cluster registry is the only resolver.** Routes never import cluster-specific files directly. New cluster = one directory + one registry entry.
7. **RLS enforced on every table.** No default read access.
8. **Never treat a human as a means to a metric.** The one line that cannot be crossed.
9. **No protocol disclosure.** Agents never narrate their decision frameworks to members.
10. **Sycophancy ban in agent-to-agent dialogue.** ~40% of exchanges should involve pushback or skepticism. "Good point", "absolutely", "great idea" are banned.
11. **Repetition guard.** Server-side Jaccard similarity check (threshold 0.55) on Sage's last 15 posts. Fires → suppress + log `step_matched = 'silent'`.
12. **Welfare/character precedence over @mention.** Safety floor always wins.

---

## 19. Implementation Phasing

| Phase | What Gets Built |
|-------|-----------------|
| **Phase 1-5** | Auth, profiles, clusters, posts, comments, likes, DMs, onboarding, dashboard, settings |
| **Phase 6** | Sage cluster intelligence: persona resolution, content curation, daily limit, first-post ack, milestone message, description refinement |
| **Phase 7** | Clio basic chat + LLM Router + BullMQ setup + response logging + Sage introduction beat |
| **Phase 9** | Atlas full pipeline + Scout crawl cycle + Observer 10 domains + arc state machine |
| **Phase 10** | Moderation engine (AI severity) + welfare escalation + passive safety sampling |
| **Phase 11** | Premium matchmaker + preference learning + questionnaire dispatch |
| **Phase A-H** | Agent chatbox, `@Sage`, feature intelligence, bridge messages, two-lens Clio, soft handoff, cluster intake pipeline |

---

## 20. What Is NOT in This Architecture

- **`/phase0/`** — Two isolated pilot Next.js apps (`mvp/` and `lc/`). Separate stack, separate deployment lifecycle. Never import from `apps/api/` into pilot apps.
- **Laravel / PHP / Artisan** — Do not exist in this project.
- **"Yantra"** — Retired term. The runtime is now BullMQ workers + Node services.
- **Direct web scraping** — Architecturally prohibited. No exception path.

---

## 21. File Reference Map

### Canonical Architecture (read in order)

| File | Purpose |
|------|---------|
| `architecture/system_implementation_prompt_part1.md` | Stack, folder structure, env vars, infra, Data Acquisition Layer |
| `architecture/system_implementation_prompt_part2.md` | Database schema, ER diagram, RLS policies |
| `architecture/system_implementation_prompt_part3.md` | API design, state management, implementation phasing |
| `architecture/system_implementation_prompt_part4.md` | AI agent architecture, BullMQ, LLM Router, Observer, ephemeral chat |
| `architecture/system_implementation_prompt_part5.md` | Sage full specification, arc phase behaviors, content curation |
| `architecture/system_implementation_prompt_part6.md` | Multi-cluster prompt architecture, inheritance contract, audit, context engineering |
| `architecture/PLATFORM_AGENCY.md` | Three-layer platform agency model (Soul / Rules / Observer) |
| `architecture/AGENT_RUNTIME.md` | BullMQ lanes, idempotency, failure modes, runtime_events schema |
| `architecture/REALTIME_ENGAGEMENT_LAYER.md` | Four real-time signals, fallback contract, privacy ceiling |
| `architecture/AGENT_COMMUNICATION_CONTRACT.md` | 7 inter-agent communication patterns, hierarchy, intake pipeline |
| `architecture/CLUSTER_INTELLIGENCE_MODULES.md` | CIM system: 5 modules, execution model, admin dashboard, structured report schema, LLM comparison |
| `architecture/premium_cluster_requirements.md` | Premium cluster roles, immutables, Agent Involvement Slider, Room Workshop, public listing, trust signals |

### Agent Configuration

| Directory | Contents |
|-----------|----------|
| `clio/` | SOUL.md, AGENTS.md, CLIO_CLUSTER_HOST_CONTEXT.md, CLIO_UNIFIED_CLUSTER_PRESENCE.md, personas/, skills/ |
| `sage/` | SOUL.md, AGENTS.md, SAGE_ANCHOR_PROTOCOL.md, SAGE_FEATURE_INTELLIGENCE.md, SAGE_SKILLS.md, skills/ |
| `scout/` | SOUL.md, AGENTS.md |
| `atlas/` | SOUL.md, AGENTS.md, skills/ |
| `observer/` | AGGILO_OBSERVER_AGENTS.md, OBSERVER_STEWARDSHIP.md, OBSERVER_INTROSPECTION_ENGINE.md |

### Operational Documents

| File | Purpose |
|------|---------|
| `AGGILO_SOUL.md` | Philosophical foundation — loaded into every LLM call as Layer 1 |
| `AGGILO_PLATFORM_RULES.md` | Operational rules and infrastructure constraints |
| `docs/AGENT_COLLABORATION_CHATBOX.md` | Agent chatbox cadence and authority |
| `docs/CLUSTER_SKILL_DISCOVERY_PROTOCOL.md` | Cross-agent skill dialogue protocol |
| `docs/CLIO_SAGE_HANDOFF.md` | Handoff protocol (Anchor terminology, chatbox triggering) |
| `docs/SOUL_INJECTION_MAP.md` | Soul tier injection per agent |
| `docs/AGGILO_ONBOARDING_PLAYBOOK_V2.md` | Onboarding flow specification |

### PRDs (read for product intent only — stack references superseded)

| File | Covers |
|------|--------|
| `PRD/01_registration_onboarding.md` | Registration & onboarding |
| `PRD/02_cluster_creation.md` | Cluster creation flow |
| `PRD/03_cluster_discovery.md` | Discovery & search |
| `PRD/04_in_cluster_experience.md` | In-cluster UX |
| `PRD/05_premium_ai_matchmaker.md` | Premium matchmaker |
| `PRD/06_ai_agents.md` | AI agents overview |
| `PRD/07_moderation_admin.md` | Moderation & admin |
| `PRD/08_data_strategy.md` | Data strategy |
| `PRD/09_admin_platform.md` | Admin platform |
| `PRD/10_atlas_agent.md` | Atlas agent |
| `PRD/11_llm_admin_routing.md` | LLM routing |
| `PRD/12_premium_clusters.md` | Premium clusters |

---

*This document is a single-source synthesis for coding agents implementing the Aggilo platform. The canonical technical source remains the `architecture/` folder; this report is a navigable index and briefing. Where this report and any `architecture/` file conflict, the `architecture/` file wins.*
