# Pre-Flight System & Strategy Evaluation

> **Aggilo Social — Pre-Development Audit**
> *Generated 2026-05-09. Covers all architecture parts (1-5), all 5 agent specs (Clio, Sage, Atlas, Scout, Observer), all PRDs (00-12), AGGILO_SOUL.md, AGGILO_PLATFORM_RULES.md, UI prompt file, and walkthrough.md.*

---

## Section 1 — First Principles Synthesis

### The Problem Being Solved

Indian youth (18-35, primary demographic) experience a specific kind of social isolation: they are surrounded by people but not *their* people. Existing platforms (Instagram, WhatsApp groups, Reddit) either require real-identity exposure or offer no demographic intelligence — you find communities by accident, not by design.

### The Proposed Solution

A privacy-first social network where:
1. **AGGIL engine** (Age, Gender, Geography, Interest, Language) filters cluster visibility so users only see communities where they structurally belong
2. **AI agents** (Clio personal assistant, Sage cluster host) reduce the "now what?" paralysis after joining by seeding content and guiding group dynamics
3. **Nickname-only identity** decouples the social experience from real-world identity, reducing harassment risk and enabling authentic expression

### What Makes This Defensible (If It Works)

The SOUL documents are the real moat. The philosophical foundation — that the agent must never treat a human as a means to a metric, must never manufacture urgency, must respect silence — creates a *behavioral* differentiator that cannot be copied by engineering alone. A competitor can replicate the AGGIL filters in a weekend. They cannot replicate the conviction-driven agent character without the founder's philosophical commitment.

### Fit Grade: B+

**Strong fit:**
- Problem is real, visceral, and under-served in India specifically
- AGGIL engine is a genuinely novel matching primitive — the U-shaped scoring model rewards intentionality on both extremes
- Privacy-first positioning is timely (DPDPA compliance, growing Indian privacy awareness)
- The Clio/Sage agent split is architecturally sound — personal vs. communal is the right decomposition

**Gaps preventing A:**
- **No validation of the specific cluster unit.** The spec assumes people want "clusters" (persistent, topic-anchored groups). But the validated user (Rajvir, 22yo UX designer) resonated with the *concept* and never used the product. The gap between "this sounds great" and "I'll post in a cluster every week" is the entire business risk.
- **Content cold start is designed around AI, not around humans.** Sage/Atlas seed content, but the first *human* post is the hardest moment in any community product. The spec has an elegant first-post-acknowledgment system — but no strategy for getting that first post to happen at all.
- **The Sage behavioral vision exceeds current LLM capability.** The Sage SOUL describes an agent that "reads the quality of silence," "identifies where energy gathers and drains," and "navigates conflict with productive friction." These are aspirational descriptions of a system that, in practice, will be pattern-matching on post frequency and keyword extraction. The gap between the soul and the implementation will be visible to users.

---

## Section 2 — Devil's Advocate: Failure Assumptions & Edge Cases

### Assumption 1: "AI agents solve the cold start problem"

**The claim:** Scout auto-creates clusters, Sage seeds them with Atlas content, Clio introduces users — the platform bootstraps itself.

**Why this might fail:**
- Scout needs AGGIL *segments* to crawl for. Segments are defined by user demographics. With 0-100 users, segments are so sparse that Scout's crawl schedule (6h for 100+ users, 24h for <20) means most segments get one crawl per day producing generic results.
- Sage's first post in an empty cluster (Phase A) is an Atlas-sourced content card. But an Atlas content card in an empty cluster has no social context — it's an AI talking to itself. The *experience* is "I joined this cluster and there's a robot posting news articles." This is indistinguishable from an RSS feed.
- The first 50 users will each see clusters with 0-1 other members and AI-authored content. This is the moment they decide if Aggilo is real or performative. No amount of Sage philosophical depth will matter if the room feels empty.

**Risk level:** CRITICAL — this is the existential risk.

**Mitigation the spec doesn't address:** A human seeding strategy. The "Single Source" WhatsApp cluster pivot is the right instinct, but the spec has no operational bridge from "WhatsApp community shows interest" to "those people are active on Aggilo daily."

### Assumption 2: "5 agents, 12 LLM operations, 3 queue lanes are necessary at launch"

**The claim:** The full agent hierarchy (Clio → Sage → Atlas → Scout → Observer) must exist from Day 1.

**Why this might fail:**
- The system has 5 agents, 12 LLM operation keys, 3 BullMQ queue lanes, 10 Observer domains, 5 arc phases, 3 content variants, and a dynamic LLM router with A/B testing — all for a platform that has zero users.
- Each LLM call costs money. At the specified routing (Kimi K2.5 for chat, Claude Opus for moderation/creation, Groq Llama 3 for Scout/Atlas), the cost per user per day with full agent activity could reach $0.05-0.15. At 1,000 users, that's $50-150/day in LLM costs before revenue.
- Observer's 10 domains (language distribution, engagement decay, topic drift, content quality, member churn, cross-cluster overlap, posting cadence, toxic signals, tool effectiveness, growth anomalies) require meaningful data to produce meaningful findings. At <1,000 users, most domains will produce noise.

**Risk level:** HIGH — over-engineering at launch delays shipping and burns runway.

**What's actually needed at launch:** Clio (basic chat), Sage (content posting), and moderation. Scout, Atlas, Observer, Matchmaker, the full LLM router, A/B testing, the tool proposal system — all of these can be phased in after product-market fit signals appear.

### Assumption 3: "The AGGIL engine works with India's demographic complexity"

**The claim:** Five dimensions (Age, Gender, Geography, Interest, Language) are sufficient for precise community matching.

**Edge cases the spec doesn't fully address:**

- **Religion/caste as invisible filters.** The spec explicitly excludes religion and caste from AGGIL (rightfully). But in Indian social dynamics, a "25-30 male Hyderabad Telugu cricket" cluster will inevitably develop caste or religious undertones. The spec's moderation engine handles explicit hate speech but has no strategy for *coded* social stratification.
- **Gender "NB" (non-binary) in Indian context.** The gender enum is `M | F | NB`. In India, the third gender category is legally "Transgender" (Supreme Court NALSA judgment, 2014). The spec uses "NB" (Western terminology). This is a cultural mismatch that could alienate the very users it's trying to include.
- **Language hierarchy.** The spec treats languages as equal dimensions. In practice, English-language clusters will attract higher-SES users, vernacular clusters will attract larger but less commercially valuable segments. The spec has no strategy for this bifurcation, which will shape the platform's identity.

**Risk level:** MEDIUM — addressable through early moderation learning.

### Assumption 4: "Premium at `300/mo is viable for Indian market"

**The claim:** Premium features (matchmaker, persistent Clio, priority Scout) justify ₹300/month.

**Why this might fail:**
- ₹300/month is ~$3.50. This is competitive with Spotify India (₹119) and YouTube Premium (₹149), both of which offer clear, tangible value. Aggilo Premium's core offering is "AI remembers you better" and "people matching" — both of which are intangible.
- The spec correctly defers premium visibility until ~100k users. But it also defers premium *design validation*. By the time premium ships, the free experience may be "good enough" that the conversion funnel collapses.
- No competitive analysis of Indian social premium models (ShareChat, Koo, etc.) — most failed.

**Risk level:** LOW (deferred problem) — but needs validation before building Phase 11.

### Assumption 5: "Supabase free tier + Railway + Redis 25MB is sufficient for launch"

**The claim:** The entire backend runs on Supabase free tier, Railway starter, and 25MB Redis.

**Edge cases:**
- **Supabase free tier limits:** 500MB database, 2GB bandwidth, 50MB file storage, 50,000 monthly active users. The spec's 31+ tables with full ER relationships and 19 migration files will approach 500MB quickly once clusters and posts scale.
- **Railway Redis 25MB:** BullMQ metadata only — but with 12 job types across 3 queues, job history retention (1,000 completed, 5,000 failed), and rate limiter state, this will be tight.
- **Supabase Realtime connections:** Free tier allows 200 concurrent connections. With DM threads and cluster feed subscriptions, 100 concurrent users could exceed this.

**Risk level:** MEDIUM — needs a clear "when to upgrade" trigger before users hit limits silently.

---

## Section 3 — Requirement Gap Analysis (Developer Readiness)

### GAP 1: Massive Document Contradictions — Legacy Stack References

**Severity: CRITICAL**

The architecture docs (Parts 1-5) declare the stack as React + Node/Fastify + Supabase + BullMQ, and explicitly state: *"There is no Laravel, no PHP, no Python... Any prior document referencing those technologies is permanently superseded."*

**But the following documents still reference the old stack:**

| Document | Legacy Reference | Line/Section |
|----------|-----------------|--------------|
| `AGGILO_PLATFORM_RULES.md` | "Backend API: Laravel (PHP 8.2+), Hostinger KVM 4 VPS" | §Infrastructure Rules |
| `AGGILO_PLATFORM_RULES.md` | "Open Claw + headless Chrome on Hostinger Yantra VPS" | §Scout Agent Technology |
| `clio/AGENTS.md` | "Laravel Backend → Redis Queue" | §Orchestrator Coordination architecture diagram |
| `clio/AGENTS.md` | "Laravel Cron → Redis Queue" | §Orchestrator Coordination Scout Lane A |
| `clio/AGENTS.md` | "User creates/joins cluster → Laravel event" | §Scout Lane B |
| `clio/AGENTS.md` | References `context/tool_loader.py` (Python) | §Loading Order step 6 |
| `sage/AGENTS.md` | "Yantra worker" | §System Role |
| `sage/AGENTS.md` | References `context/tool_loader.py` | §Loading Order step 8 |
| `sage/AGENTS.md` | "Yantra must load" | Implied throughout |
| `walkthrough.md` | Entire doc references Yantra folder, Laravel cron, Python workers | Throughout |
| `PRD/00_prd_index.md` | "Laravel + Supabase + Yantra VPS" | §Technology Stack |
| All 12 PRD files | Stack references throughout | Various |

**Impact for developers:** A developer reading `clio/AGENTS.md` will see Laravel + Yantra + Python. Then they read Part 1 and see Node/Fastify. Then they read `sage/AGENTS.md` and see Yantra again. The cognitive overhead of "which document is current?" will slow development and cause implementation errors.

**Required action:** All non-architecture documents must be updated to remove legacy stack references, OR each must carry a prominent header stating the architecture docs are authoritative.

### GAP 2: Clio SOUL.md Still Describes Clio as Cluster Host

**Severity: HIGH**

The architecture (Part 4 §12, Part 5) permanently established that **Sage is the cluster host** and Clio is FAB-only/personal. But `clio/SOUL.md` §10 "Cluster Presence" (lines 222-300) contains 78 lines describing Clio's cluster hosting behavior:

- "The Empty Room Protocol" — Clio as room presence (should be Sage)
- "The Pulse Narrator Role" — Clio as content editor (should be Sage)
- "The First Post Intervention" — Clio acknowledges first post (should be Sage)
- "The Return Signal" — Clio greets returning members (should be Sage)
- "The Silence Respect Principle" — Clio steps back in active clusters (should be Sage)
- §11 "The 2-Message Limit" — described as Clio's limit (should be Sage's)

Similarly, `clio/AGENTS.md` still has `cluster_host` and `atlas_orchestration` skills listed (lines 206-219) with full behavioral rules for Clio posting to Timeline — all of which should be Sage's domain.

**Impact:** These are the documents that will be injected into the LLM context when Clio is invoked. If un-updated, the LLM will receive contradictory instructions about who hosts clusters.

### GAP 3: Missing Database Tables

**Severity: HIGH**

`sage/AGENTS.md` §Database Fields Required (lines 382-407) defines three tables that **do not exist** in the Part 2 schema:

| Table | Defined In | Missing From |
|-------|-----------|--------------|
| `cluster_arc_history` | sage/AGENTS.md | Part 2 ER diagram, migration files |
| `cluster_welfare_escalations` | sage/AGENTS.md | Part 2 ER diagram, migration files |
| `cluster_crowdfund_signals` | sage/AGENTS.md | Part 2 ER diagram, migration files |

These tables are operationally critical — arc history for debugging phase transitions, welfare escalations for the crisis protocol, crowdfund signals for the community feature.

Additionally, several fields referenced in sage/AGENTS.md are missing from the Part 2 `clusters` table:
- `arc_phase_since` (Part 2 has `arc_phase_updated_at` — semantically similar but different name)
- `sage_last_posted_at`
- `reengagement_sent_at`

### GAP 4: Arc Phase System Contradictions

**Severity: MEDIUM**

Three different arc phase systems exist in the spec:

| Source | Phases | Transition Logic |
|--------|--------|------------------|
| **Part 4 §13.5** (architecture) | A→E, condition-based | Simple: A→B on first post, B→C on 72h silence, C→D on 6 posts/week, D→E on 10 members + 15 posts/week |
| **sage/AGENTS.md** (agent spec) | A→E, observation-window-based | Complex: A→B requires 3 members posted + 2 responded (5-day minimum), B→C requires navigated conflict (7-day minimum), etc. |
| **clio/AGENTS.md** (Clio agent) | A→E, condition-based | Different conditions: Phase C = "post_count 2-5 OR 72h silence" |

A developer implementing the arc evaluator worker will find three conflicting specifications. Part 4 is the simplest and most implementable. sage/AGENTS.md is the most philosophically aligned with Sage's character but requires subjective assessment ("conflict has been navigated"). clio/AGENTS.md should be irrelevant (Clio doesn't own arc transitions) but is still there.

**Required action:** Designate one source as canonical for arc transitions. Recommendation: Part 4 for the backend evaluator, with sage/AGENTS.md conditions as *aspirational* for when NLP-based behavioral analysis is feasible.

### GAP 5: Feature Progression System (Stages 1→2→3) Undefined

**Severity: MEDIUM**

The UI prompt file (`mobile_screen_prompts_phase1.md`) defines a "Feature Progression System" with three stages:
- Stage 1: FAB exploration + Timeline basic (Clio-gated)
- Stage 2: Unlocked by Clio after first post
- Stage 3: DM access, full Explore, cluster creation

But this system has **zero specification** in any architecture document, PRD, or agent spec. No database field tracks the user's stage. No API endpoint progresses it. No Clio logic determines when to unlock features.

This is a significant gap because the UI prompt describes it as the primary onboarding gating mechanism — "users never know stages exist" but features are Clio-gated.

### GAP 6: No Error/Degradation UX Specified

**Severity: MEDIUM**

The spec defines what happens when everything works. It does not define what happens when:
- The LLM provider is down (Clio says nothing? Shows a generic message?)
- Supabase is unreachable (cached data? Offline mode?)
- Atlas returns zero content for a cluster for a week (Sage says nothing? Generic post?)
- A user's OTP provider fails (retry? Fallback to email?)
- BullMQ Redis is lost (spec says "queues rebuild from empty" — but what do users see during rebuild?)

The UI prompt file added shimmer/loading/error states in the fix pass, but the *backend* degradation paths are unspecified.

### GAP 7: Streaming/Response Delivery for Clio FAB

**Severity: LOW**

The spec defines Clio chat as `POST /api/clio/chat` returning `{ response_text, response_log_id }`. But the UI prompt describes Clio's FAB panel with real-time typing indicators, streaming responses, and "Clio is thinking..." states. This implies SSE or WebSocket streaming, which is not specified in the API design.

### GAP 8: Subscription Payment Provider for India

**Severity: LOW (deferred)**

The spec lists Razorpay for UPI payments and Google Play Billing for subscriptions. But Razorpay subscription management (recurring payments, grace periods, dunning) is a separate product from Razorpay Orders. The integration pattern is not specified.

---

## Section 4 — Ecosystem & Flow Mapping

### Primary User Flow (Phase 1)

```
Phone OTP → Profile Creation (YoB, Gender, Language, Nickname, Tags)
  → Dashboard/Explore Tab
    → AGGIL-matched cluster cards (GET /api/clusters/suggestions)
      → Cluster Detail → Join (POST /api/clusters/:id/join)
        → 60s: AtlasBriefOnJoin fires
          → Atlas fetches content via Data Acquisition Layer
            → Sage curates top item → Posts to Timeline as system_sage
        → User sees Timeline with Sage's content card
          → User posts (POST /api/clusters/:id/posts)
            → SageFirstPostAck fires (60s) → Sage acknowledges
              → Arc phase: A → B
        → Clio FAB available throughout (POST /api/clio/chat)
```

### Data Flow Dependencies (Critical Path)

```
User Profile → AGGIL Engine → Cluster Visibility
                                    ↓
                            Cluster Membership → Atlas Brief
                                                      ↓
                                                Data Acquisition Layer
                                                      ↓
                                                Atlas Scoring (Groq LLM)
                                                      ↓
                                                Sage Curation (Kimi K2.5 LLM)
                                                      ↓
                                                Timeline Post (Supabase INSERT)
                                                      ↓
                                                Realtime Subscription → React Update
```

### Circular Dependencies Identified

**1. Sage Persona Resolution Chicken-and-Egg**

Sage's persona is resolved from 3 sources in priority order:
1. Clio aggregate tone signals (from cluster members)
2. Cluster purpose mapping
3. Observe-and-create (neutral for 14 days, then formalized)

Source 1 requires Clio to have interacted with cluster members — but Clio's interaction depends on users being active, which depends on Sage's content quality, which depends on Sage's persona resolution. At launch, every cluster will use source 2 or 3 (neutral fallback).

**This is acceptable** — the spec handles it by defaulting to cluster purpose mapping. But the 14-day observation window for source 3 means Sage's persona will feel generic for the first two weeks of any cluster's life.

**2. Scout → Clusters → Users → Scout**

Scout crawls segments to find topics → creates clusters → clusters need users to generate segment data → Scout needs segments to crawl.

At launch with <100 users, Scout will operate on admin-defined segments, not organic ones. This is partially addressed by the "admin trigger" endpoint (`POST /api/scout/trigger`) but the transition from admin-seeded to organically-driven segments is not specified.

### Integration Points Requiring Coordination

| Integration | Services Involved | Failure Impact |
|-------------|-------------------|----------------|
| LLM Router → 3 Providers | NIM (Kimi), Anthropic (Claude), Groq (Llama) | Clio goes silent, Sage can't post, moderation fails |
| Supabase Auth → Fastify JWT | Supabase JWKS endpoint | All authenticated requests fail |
| BullMQ → Redis | Redis connection | All background jobs stop |
| Atlas → Data Acquisition Layer → 5+ APIs | SerpApi, Reddit, YouTube, HN, RSS | Sage has no content to curate |
| FCM → Device Tokens | Firebase project | Push notifications stop |

### What's Missing from the Ecosystem Map

- **No monitoring/alerting system specified.** The spec mentions PagerDuty for welfare escalations but has no general observability strategy. No metrics, no dashboards, no alerts for when LLM costs spike or response times degrade.
- **No CI/CD pipeline defined.** The spec has a Railway deployment section but no build/test/deploy pipeline. For a monorepo with 2 apps and 19 migration files, this matters.
- **No staging environment strategy.** The spec mentions Railway "environments for development and production" but no staging or preview deployments for testing agent behavior before production.

---

## Section 5 — Must-Answer Interrogation

These are questions the founder must answer *before* a developer writes the first line of code. They are ordered by impact.

### Question 1: What happens in the first 14 days with 10 users?

The entire spec is designed for a platform at scale. But the first 14 days will have ~10 users (The Single Source WhatsApp community members who migrate). What does their experience actually look like?

- They each create a profile. AGGIL matches them to... each other (there are no other users).
- They join 1-3 clusters. Each cluster has 2-5 members.
- Sage posts Atlas content cards. Users see AI-authored content in a room with 3 humans.
- Clio is available via FAB but has limited context (few clusters, few interactions).
- Scout crawls segments but the output is academic — there aren't enough users to form distinct segments.

**The spec needs:** A "first 30 days" operational playbook. Which clusters are pre-created? Who seeds the first organic posts? Is the founder manually creating content? Is there a "founding member" experience that's distinct from the regular onboarding? The WhatsApp-to-Aggilo migration bridge is the actual launch strategy — it needs specification.

### Question 2: Which documents are canonical for developers?

Right now, a developer faces:
- 5 architecture parts (the declared canonical source)
- 12 PRD files (declared superseded but still referenced everywhere)
- 5 agent SOUL documents (character definitions)
- 5 agent AGENTS documents (operational rules, some contradicting architecture)
- AGGILO_PLATFORM_RULES.md (contains superseded infrastructure rules)
- AGGILO_SOUL.md (philosophical foundation)
- UI prompt file (2,400+ lines, references features not in architecture)
- walkthrough.md (references Yantra/Laravel throughout)

**The founder must decide:** Do we update all legacy documents to match the architecture? Or do we add a "READ THIS FIRST" header to every legacy doc saying "Parts 1-5 are authoritative, ignore stack references here"?

**Recommendation:** The minimum viable action is updating `clio/AGENTS.md`, `sage/AGENTS.md`, and `AGGILO_PLATFORM_RULES.md` to remove Laravel/Yantra/Python references. These are the documents that will be loaded into LLM context during development — if they contradict the architecture, the AI coding agent will produce wrong code.

### Question 3: What is the actual launch scope?

The architecture defines 11 phases. The UI prompt defines Phase 1 with a 3-tab nav (Explore, Activity, Settings) and Clio FAB. But Phase 1 in the architecture includes Phases 1-8 (scaffold through DMs) before you have a shippable product.

**The real question is:** What is the *Minimum Launchable Product*?

From the spec, the hard requirements for the first user to have a complete experience are:
1. Auth (OTP → profile creation)
2. Cluster CRUD (create, search, join)
3. AGGIL engine (qualification gating)
4. Timeline (posts, comments, likes)
5. Clio basic chat (FAB)
6. Sage basic posting (Atlas-stubbed content)

That's Phases 1-6 in the architecture. DMs (Phase 8), Scout (Phase 9), Observer (Phase 9), full Atlas (Phase 9), moderation (Phase 10), payments (Phase 11) — all of these can come after.

**But even Phase 1-6 is ~3-4 months of development for a single developer.** The founder needs to define a "Phase 0.5" — the absolute minimum that gets real users posting in real clusters, even if Sage is just posting hardcoded seed content.

### Question 4: How will you know if the core loop works?

The core loop is: User joins cluster → sees relevant content → posts → others respond → user returns.

**What metrics prove this loop is working?**

The spec has no success metrics, no KPIs, no analytics events beyond the behavioral_events table. The Observer has 10 domains for platform health, but no user-level retention metrics.

**Minimum metrics needed before launch:**
- Day 1/7/30 retention by cohort
- Posts per user per week
- Time-to-first-post after joining a cluster
- Clio chat completion rate (did the user finish the conversation or abandon?)
- Cluster join → first post conversion rate

The `behavioural_events` table exists and can support this, but no analytics queries or dashboards are specified.

### Question 5: What is the LLM cost ceiling and what happens when it's hit?

The spec defines a `cost_ceiling_usd` field in `llm_routing_config` and mentions switching to fallback LLMs when costs exceed ceiling. But:

- What is the actual ceiling per operation? Per day? Per month?
- When the ceiling is hit, does Clio go silent? Switch to a free model? Show a generic response?
- At 100 daily active users each sending 5 Clio messages and viewing 3 clusters (triggering Sage/Atlas), the estimated daily LLM cost is:
  - 500 Clio chats × ~$0.003/call (Kimi K2.5) = $1.50
  - 300 Atlas scores × ~$0.001/call (Groq) = $0.30
  - 100 Sage framings × ~$0.003/call (Kimi K2.5) = $0.30
  - Moderation sampling = ~$0.50
  - **Total: ~$2.60/day → ~$78/month at 100 DAU**
- At 1,000 DAU: ~$780/month. At 10,000 DAU: ~$7,800/month.
- Revenue at 10,000 DAU with 2% premium conversion at ₹300/month: 200 × $3.50 = $700/month.

**The unit economics don't work at scale without either reducing LLM calls per user or increasing conversion.** The founder must define:
1. The hard monthly LLM budget
2. The degradation UX when the budget is hit
3. The per-user LLM call budget (how many Clio messages per day before throttling?)

---

## Summary Matrix

| Section | Grade | Verdict |
|---------|-------|---------|
| **First Principles Fit** | B+ | Problem-solution fit is strong. Execution gap between philosophical vision and launch reality. |
| **Failure Assumptions** | 3 Critical, 2 Medium | Cold start, over-engineering, and unit economics are the top risks. |
| **Developer Readiness** | NOT READY | 8 gaps identified. Legacy document contradictions (Gap 1) and missing tables (Gap 3) will cause implementation errors. |
| **Ecosystem Mapping** | Mostly Complete | Primary flows are well-defined. Missing: monitoring, CI/CD, staging, degradation paths. |
| **Must-Answer Questions** | 5 Blockers | None are unanswerable, but all must be answered before Phase 1 code begins. |

### Top 3 Actions Before Writing Code

1. **Reconcile the document corpus.** Update `clio/AGENTS.md`, `sage/AGENTS.md`, `AGGILO_PLATFORM_RULES.md`, and PRD index to remove Laravel/Yantra/Python references. Designate Parts 1-5 as the single source of truth with a one-line header on every other doc.

2. **Write the "first 30 days" operational playbook.** Define pre-seeded clusters, founding member experience, WhatsApp migration bridge, and manual content seeding strategy. This is the document that turns "architecture" into "launch."

3. **Define the Minimum Launchable Product (Phase 0.5).** Strip Phases 1-6 to the absolute minimum: Auth, 3 pre-created clusters, Timeline, Clio with hardcoded responses (no LLM), Sage with hardcoded seed posts. Get 10 real users posting before building the AI layer.

---

*Pre-Flight Audit · Aggilo Social · 2026-05-09*
