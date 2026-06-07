# Aggilo — System Domain Map

> Generated 2026-06-05 from full architecture + screen prompts + agent configs.

## Domains

### 1. Authentication & Identity
- **Purpose:** Registration, login, OTP, session management
- **Owner:** Supabase Auth + Fastify auth plugin
- **Dependencies:** Supabase Auth, PostgreSQL
- **Consumers:** All domains
- **Criticality:** CRITICAL | **Complexity:** Low | **Risk:** Low

### 2. Profiles
- **Purpose:** User profile (YoB, gender, nickname, languages, interests, location, premium_status)
- **Owner:** Fastify `/api/profile`
- **Dependencies:** Authentication, AGGIL
- **Consumers:** Clusters, Clio, Sage, Scout, DM, Premium
- **Criticality:** CRITICAL | **Complexity:** Medium | **Risk:** Medium (DPDPA, immutable fields)

### 3. AGGIL Engine
- **Purpose:** Age/Gender/Geography/Interest/Language matching — cluster visibility & eligibility
- **Owner:** `apps/api/src/services/aggil-engine.ts`
- **Dependencies:** Profiles, Clusters
- **Consumers:** Cluster Discovery, Creation, Clio, Scout
- **Criticality:** CRITICAL | **Complexity:** High | **Risk:** Medium

### 4. Clusters
- **Purpose:** Cluster CRUD, search, discovery, scoring, lifecycle
- **Owner:** Fastify `/api/clusters`
- **Dependencies:** Profiles, AGGIL, Auth
- **Consumers:** Feed, Members, Clio, Sage, Scout, Admin
- **Criticality:** CRITICAL | **Complexity:** High | **Risk:** High

### 5. Cluster Membership
- **Purpose:** Join/leave, roles, member lists
- **Owner:** Fastify `/api/clusters/:id/join|leave|members`
- **Dependencies:** Clusters, Profiles, AGGIL
- **Consumers:** Feed, DM, Notifications, Clio, Sage
- **Criticality:** CRITICAL | **Complexity:** Medium | **Risk:** Medium

### 6. Feed / Timeline
- **Purpose:** Chronological post feed, compose bar, content display
- **Owner:** Fastify `/api/clusters/:id/feed` + React components
- **Dependencies:** Clusters, Posts, Membership, Realtime
- **Consumers:** Members, Clio, Sage
- **Criticality:** CRITICAL | **Complexity:** Medium | **Risk:** Low

### 7. Posts & Comments
- **Purpose:** Post CRUD, likes, comments, reporting
- **Owner:** Fastify `/api/posts`
- **Dependencies:** Clusters, Profiles, Membership
- **Consumers:** Feed, Moderation, Notifications, Sage
- **Criticality:** CRITICAL | **Complexity:** Medium | **Risk:** Low

### 8. Direct Messaging (DM)
- **Purpose:** Request/accept flow, DM threads, Connections
- **Owner:** Fastify `/api/dm`
- **Dependencies:** Profiles, Clusters, Membership, Realtime
- **Consumers:** Members (Stage 3+), Activity
- **Criticality:** HIGH | **Complexity:** Medium | **Risk:** Medium

### 9. Notifications
- **Purpose:** Push (FCM) + in-app Activity feed
- **Owner:** Fastify `/api/notifications` + FCM service
- **Dependencies:** Profiles, Clusters, Posts, DM
- **Consumers:** All members
- **Criticality:** MEDIUM | **Complexity:** Medium | **Risk:** Low

### 10. Realtime / Presence
- **Purpose:** Live presence, typing, post arrival, care reach-out (4 signals)
- **Owner:** Supabase Realtime + React hooks
- **Dependencies:** Auth, Clusters, Posts
- **Consumers:** Feed, DM, Clio FAB, Agent Chatbox
- **Criticality:** HIGH | **Complexity:** Medium | **Risk:** Medium

### 11. Clio (Orchestrator Agent)
- **Purpose:** Personal AI — FAB, conversational creation, discovery, tips, welfare, feature signals
- **Owner:** `apps/api/src/services/clio.ts` + BullMQ
- **Dependencies:** Profiles, Clusters, AGGIL, Sage, Scout, Observer
- **Consumers:** All members
- **Criticality:** CRITICAL | **Complexity:** VERY HIGH | **Risk:** High

### 12. Sage (Cluster Anchor Agent)
- **Purpose:** Timeline posts, content curation, @Sage, arc phases, Atlas briefing, welfare escalation
- **Owner:** `apps/api/src/services/sage.ts` + BullMQ
- **Dependencies:** Clio, Clusters, Atlas, Posts
- **Consumers:** Cluster members (Timeline)
- **Criticality:** CRITICAL | **Complexity:** VERY HIGH | **Risk:** High

### 13. Atlas (Content Intelligence)
- **Purpose:** Content discovery — articles, videos, trends for clusters
- **Owner:** `apps/api/src/services/atlas.ts` + BullMQ
- **Dependencies:** Sage, Data Acquisition, LLM Routing
- **Consumers:** Sage (sole consumer)
- **Criticality:** HIGH | **Complexity:** High | **Risk:** Medium

### 14. Scout (Community Intelligence)
- **Purpose:** Macro-discovery, auto-clusters, suggestion cards
- **Owner:** `apps/api/src/services/scout.ts` + BullMQ
- **Dependencies:** Clio, Data Acquisition, AGGIL
- **Consumers:** Clio, Intake Interpreter
- **Criticality:** MEDIUM | **Complexity:** High | **Risk:** Medium

### 15. Observer (Platform Steward)
- **Purpose:** 11-domain monitoring, autonomous stewardship, finding-and-approve
- **Owner:** BullMQ workers
- **Dependencies:** All platform data (read-only), Platform Rules
- **Consumers:** Admin, Clio (Layer 4), Genesis Engine
- **Criticality:** HIGH | **Complexity:** VERY HIGH | **Risk:** High

### 16. CIM (Cluster Intelligence Modules)
- **Purpose:** 5-module cluster analysis (behavioural, functional, vibe, purpose, growth)
- **Owner:** BullMQ workers
- **Dependencies:** Observer, Sage signals, Clio signals, feature_signals
- **Consumers:** Admin (private)
- **Criticality:** MEDIUM | **Complexity:** High | **Risk:** Medium

### 17. Genesis Engine
- **Purpose:** Cluster config validation — questionnaires, spec generation, post-launch monitoring
- **Owner:** Observer sub-component
- **Dependencies:** Observer, Clio, Clusters
- **Consumers:** Admin, Founders
- **Criticality:** MEDIUM | **Complexity:** High | **Risk:** Medium

### 18. Platform Tools Registry
- **Purpose:** Global versioned tool catalog, cluster import/skin
- **Owner:** Admin + Observer auto-promotion
- **Dependencies:** Clusters, Observer Domain 10
- **Consumers:** All agents (via cluster-tools loader)
- **Criticality:** MEDIUM (deferred) | **Complexity:** Medium | **Risk:** Low

### 19. Feature Signals
- **Purpose:** Organic member needs captured by Clio, reviewed by Observer Domain 11
- **Owner:** Clio (capture) + Observer (review)
- **Dependencies:** Clio, Observer
- **Consumers:** CIM, Admin
- **Criticality:** LOW | **Complexity:** Medium | **Risk:** Low

### 20. Moderation & Safety
- **Purpose:** AI-first content screening, reports, bans, appeals
- **Owner:** Moderation service + Observer Domain 8
- **Dependencies:** Posts, Comments, DM, Profiles
- **Consumers:** Admin, Members
- **Criticality:** CRITICAL | **Complexity:** High | **Risk:** High

### 21. Administration
- **Purpose:** Admin dashboard, user/cluster management, Observer review, LLM routing, persona approval
- **Owner:** Fastify `/api/admin`
- **Dependencies:** All domains
- **Consumers:** Admin users
- **Criticality:** HIGH | **Complexity:** High | **Risk:** Medium

### 22. Premium / Monetization
- **Purpose:** Subscriptions, AI Matchmaker, premium clusters
- **Owner:** Fastify `/api/premium` + `/api/payments`
- **Dependencies:** Profiles, Clusters, Payments
- **Consumers:** Premium members
- **Criticality:** LOW (hidden until ~100k) | **Complexity:** Medium | **Risk:** Low

### 23. Payments
- **Purpose:** Razorpay UPI + Google Play Billing
- **Owner:** Fastify `/api/payments` + webhooks
- **Dependencies:** Premium, Profiles
- **Consumers:** Premium members
- **Criticality:** LOW (deferred) | **Complexity:** Medium | **Risk:** Low

### 24. LLM Routing
- **Purpose:** Dynamic provider routing, A/B testing, cost tracking, fallback
- **Owner:** `apps/api/src/services/llm-router.ts`
- **Dependencies:** All agent services
- **Consumers:** Every LLM call
- **Criticality:** CRITICAL | **Complexity:** High | **Risk:** High

### 25. Data Acquisition
- **Purpose:** Tiered external data (T1: APIs → T2: SerpApi → T3: Firecrawl)
- **Owner:** `apps/api/src/services/data-acquisition.ts`
- **Dependencies:** Scout, Atlas
- **Consumers:** Scout, Atlas
- **Criticality:** HIGH | **Complexity:** Medium | **Risk:** Medium

### 26. Prompt Management
- **Purpose:** 4-layer inheritance contract, assembly, versioning, audit
- **Owner:** Prompt builder (`src/lib/prompts/`)
- **Dependencies:** All agent configs, Platform Rules, Cluster specs
- **Consumers:** Every LLM call
- **Criticality:** CRITICAL | **Complexity:** VERY HIGH | **Risk:** High

### 27. Audit & Observability
- **Purpose:** LLM logs, runtime events, behavioural events, prompt audit, cost tracking
- **Owner:** Runtime + Observer Domain 5
- **Dependencies:** All domains
- **Consumers:** Admin, Observer
- **Criticality:** HIGH | **Complexity:** Medium | **Risk:** Medium

### 28. Infrastructure & DevOps
- **Purpose:** CI/CD, deployment, monitoring, secrets, health checks
- **Owner:** Platform team
- **Dependencies:** All domains
- **Consumers:** All domains
- **Criticality:** CRITICAL | **Complexity:** High | **Risk:** HIGH (no consolidated spec)
