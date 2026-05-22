# Aggilo — System Implementation Prompt for AI Coding Agent
## Part 1: Architecture, Stack Decisions & Separation of Concerns

> **Role**: You are a senior full-stack engineer. Build the Aggilo social platform per this blueprint.
> **Read ALL parts (1-5) before writing any code. This document set constitutes MASTER_INSTRUCTIONS_v2.**

---

## 1. Mandatory Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Language** | TypeScript (strict mode) everywhere | Type safety across full stack |
| **Frontend** | React 18+ (Vite build) | Mobile-first PWA, fast HMR |
| **Backend** | Node.js + **Fastify** | Better perf than Express, schema validation built-in, TypeBox for TS types |
| **Database** | Supabase (Postgres) | Auth, Realtime, RLS, Storage — all native |
| **Auth** | Supabase Auth (Email/Phone OTP) | JWT forwarded to Node for verified routes |
| **Realtime** | Supabase Realtime (WebSockets) | DMs, cluster chat (future), live updates |
| **AI Orchestration** | Node.js services calling external LLM APIs | Replaces the original "Yantra VPS" concept |
| **Queue** | BullMQ (Redis-backed) | 3 priority lanes: `clio-high`, `events-medium`, `scout-low` |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | Free tier sufficient for launch |
| **Payments** | Razorpay + Google Play Billing | India-focused UPI + Play Store |
| **Data Acquisition** | Tiered: Structured APIs → Search API Proxies → Managed Scraping APIs | Scout & Atlas MUST NOT crawl directly. See §2.5 Data Acquisition Layer |
| **Deployment** | Vercel (React PWA) + Railway (Node API) + Supabase Cloud | [ASSUMPTION: These deployment targets unless you specify otherwise] |

> [!IMPORTANT]
> **MASTER_INSTRUCTIONS_v2 — Stack Declaration**: The PRDs reference Laravel/PHP. This blueprint **permanently replaces** the entire backend with React + Node.js/Fastify + Supabase. There is no Laravel, no PHP, no Python, no Flask, no Django, no "Yantra VPS" in this architecture. All business logic, API endpoints, and queue jobs are re-mapped to this stack. Any prior document referencing those technologies is superseded.

> [!CAUTION]
> **No Direct Web Scraping**: Scout and Atlas MUST NEVER crawl the web using Puppeteer/Playwright from Railway server IPs. All external data retrieval must route through authenticated API services or managed scraping proxies. Direct crawling will result in IP bans within days. See §2.5 for the required Data Acquisition Layer.

---

## 2. Architectural Separation of Concerns

### 2.1 React Frontend Responsibilities
- **UI rendering**: All screens (Onboarding, Dashboard/Explore, Cluster pages, DMs, Settings, Admin)
- **Supabase client SDK**: Direct reads for public/RLS-gated data (clusters, posts, members)
- **Auth flow**: Supabase Auth SDK for OTP send/verify, session management (30-day)
- **Realtime subscriptions**: Supabase Realtime for DM threads, cluster feed live updates
- **Local state**: React Context + `@tanstack/react-query` for server state caching
- **Offline resilience**: LocalStorage draft persistence for compose fields
- **PWA**: Service worker, manifest, installability

### 2.5 Data Acquisition Layer (Scout & Atlas External Data)

> [!CAUTION]
> **CRITICAL ARCHITECTURAL CONSTRAINT**: Scout and Atlas browse the web to discover content and trends. They MUST NEVER do this via direct Puppeteer/Playwright crawling from Railway server IPs. All external data retrieval is routed through a **tiered Data Acquisition Layer** to prevent IP bans, ensure reliability, and comply with source platform ToS.

#### Tier 1 — Structured APIs (Preferred: reliable, rate-limited, no IP risk)

| Source | API | Free Tier | Used By |
|--------|-----|-----------|---------|
| Reddit | Reddit OAuth2 API | 100 req/min | Scout + Atlas |
| YouTube | YouTube Data API v3 | 10,000 units/day | Atlas |
| Hacker News | HN Algolia API | Unlimited | Atlas |
| ProductHunt | GraphQL API | 450 req/day | Atlas |
| Google News | RSS feeds (region-filtered) | Unlimited | Scout + Atlas |
| Admin-managed blogs | RSS feeds | Unlimited | Atlas |

#### Tier 2 — Search API Proxies (For Google Search, News, Twitter/X)

| Provider | Purpose | Pricing | Env Var |
|----------|---------|---------|---------|
| **SerpApi** OR **Serper.dev** | Google search/news queries, Twitter/X trends | ~$50/mo for 5,000-12,500 searches | `SERP_API_KEY` |

Scout and Atlas call these APIs instead of directly scraping Google or Twitter. The API provider handles IP rotation, CAPTCHA solving, and rate limiting.

#### Tier 3 — Managed Scraping API (Fallback for non-API sources)

| Provider | Purpose | Pricing | Env Var |
|----------|---------|---------|---------|
| **Firecrawl** OR **BrightData Web Scraper** | LinkedIn trending articles, The Ken, other non-API sources | ~$19-50/mo | `SCRAPING_API_KEY` |

Used ONLY when a source has no public API or RSS feed. The managed service handles residential proxy rotation and headless rendering.

#### Tier 4 — NEVER: Direct Puppeteer/Playwright

Direct headless browser crawling from Railway IPs is **architecturally prohibited**. There is no exception path. If a source cannot be reached via Tiers 1-3, it is excluded from the source list until an API path is available.

#### Implementation in Node.js

```typescript
// apps/api/src/services/data-acquisition.ts

interface DataAcquisitionService {
  // Tier 1: Structured API calls
  fetchReddit(subreddit: string, limit: number): Promise<RedditPost[]>;
  fetchYouTube(query: string, regionCode: string): Promise<YouTubeVideo[]>;
  fetchHackerNews(query: string): Promise<HNItem[]>;
  fetchRSS(feedUrl: string): Promise<RSSItem[]>;

  // Tier 2: Search API proxy
  searchGoogle(query: string, region: string): Promise<SearchResult[]>;
  searchNews(query: string, region: string): Promise<NewsResult[]>;

  // Tier 3: Managed scraping (fallback only)
  scrapeUrl(url: string): Promise<ScrapedContent>;
}
```

All Scout and Atlas services consume data exclusively through this service. They never make direct HTTP requests to external content sources.

#### Environment Variables (add to .env.example)

```bash
# === Data Acquisition (Scout & Atlas) ===
SERP_API_KEY=your-serpapi-or-serper-key
SCRAPING_API_KEY=your-firecrawl-or-brightdata-key
REDDIT_CLIENT_ID=your-reddit-oauth-client-id
REDDIT_CLIENT_SECRET=your-reddit-oauth-client-secret
YOUTUBE_API_KEY=your-youtube-data-api-key
```

---

### 2.2 Node.js (Fastify) Backend Responsibilities
- **Authenticated API**: All write operations and business logic behind JWT verification
- **AGGIL Engine**: Cluster scoring (U-shaped model), qualification gating, suggestion ranking
- **AI Agent Orchestration**: Clio chat, Scout intelligence, Atlas content intelligence — all LLM calls
- **Data Acquisition Layer**: All external data retrieval for Scout/Atlas via authenticated APIs and managed scraping proxies (see §2.5 — NO direct Puppeteer/Playwright crawling)
- **BullMQ Workers**: Background jobs (Scout cycles, Atlas briefing, arc phase evaluation, daily resets)
- **LLM Router**: Dynamic routing per `llm_routing_config` table, A/B testing, cost ceiling enforcement
- **Moderation Engine**: AI content screening, severity classification, auto-ban logic
- **Payment Webhooks**: Razorpay/Google Play verification and subscription management
- **FCM Dispatch**: Push notification batching, frequency caps, quiet hours enforcement
- **Premium Cluster Evaluation**: Credibility scoring for "Make Your Crowd" applications

### 2.3 Supabase Native Responsibilities
- **Auth**: `auth.users` table, OTP (phone/email), JWT issuance, session tokens
- **Database**: All Postgres tables with strict RLS policies
- **Row Level Security**: Enforced on every table — no default read access
- **Realtime**: WebSocket channels for DMs and live feed updates
- **Storage**: User avatars, post images (future phases)
- **Edge Functions**: Lightweight webhook receivers if needed

### 2.4 Auth Flow (Supabase → Node)

```
1. React calls Supabase Auth SDK → sends OTP
2. User enters OTP → Supabase verifies → returns JWT + session
3. React stores session, attaches JWT to all Node API calls via Authorization header
4. Fastify middleware verifies JWT against Supabase JWKS
5. Node extracts `user_id` from JWT claims for all DB operations
6. RLS policies on Supabase tables use `auth.uid()` for row-level access control
```

---

## 3. Folder Structure (Monorepo)

```
aggilo/
├── package.json                    # Root workspace config
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
│           │   ├── clio.ts          # Clio orchestrator (context assembly, LLM call)
│           │   ├── sage.ts          # Sage cluster intelligence (persona, curation, posting)
│           │   ├── scout.ts         # Scout intelligence logic
│           │   ├── atlas.ts         # Atlas content intelligence
│           │   ├── data-acquisition.ts # External data retrieval (APIs + managed scraping — NO direct crawling)
│           │   ├── llm-router.ts    # Dynamic LLM routing + A/B testing
│           │   ├── moderation.ts    # Content screening + severity
│           │   ├── notification.ts  # FCM dispatch + batching
│           │   ├── email.ts         # Resend transactional email
│           │   └── payments.ts      # Razorpay/GP verification
│           ├── workers/
│           │   ├── queue.ts         # BullMQ setup (3 lanes)
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
│       │   ├── 013_sage.sql                # sage_personas, sage_description_proposals, cluster_description_history
│       │   ├── 014_cluster_tools.sql       # cluster_tools, tool_proposals
│       │   ├── 015_observer.sql            # observer_findings
│       │   ├── 016_cluster_polls.sql       # cluster_polls
│       │   ├── 017_behavioural_events.sql  # behavioural_events
│       │   ├── 018_persona_files.sql       # persona_files (DB-stored, no filesystem)
│       │   └── 019_rls_policies_v2.sql     # RLS for tables 013-018
│       ├── seed.sql                # Initial data (LLM routing defaults, etc.)
│       └── types/
│           └── database.ts         # Auto-generated from schema
│
└── docs/
    └── prd/                        # PRD reference copies
```

---

## 4. Environment Variables (.env.example)

```bash
# === Supabase ===
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# === Redis (BullMQ) ===
REDIS_URL=redis://localhost:6379

# === LLM Providers ===
NVIDIA_NIM_API_KEY=your-nvidia-nim-key
NVIDIA_NIM_BASE_URL=https://integrate.api.nvidia.com/v1
ANTHROPIC_API_KEY=your-anthropic-key
GROQ_API_KEY=your-groq-key

# === Firebase (FCM) ===
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT=path/to/service-account.json

# === Payments ===
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# === SMS/OTP ===
SMS_GATEWAY_API_KEY=your-sms-key
SMS_GATEWAY_SENDER_ID=AGGILO

# === Data Acquisition (Scout & Atlas — see §2.5) ===
SERP_API_KEY=your-serpapi-or-serper-key
SCRAPING_API_KEY=your-firecrawl-or-brightdata-key
REDDIT_CLIENT_ID=your-reddit-oauth-client-id
REDDIT_CLIENT_SECRET=your-reddit-oauth-client-secret
YOUTUBE_API_KEY=your-youtube-data-api-key

# === App Config ===
NODE_ENV=development
API_PORT=3001
CORS_ORIGIN=http://localhost:5173
API_BASE_URL=http://localhost:3001

# === Email (Transactional) ===
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@aggilo.app
```

---

## 5. Infrastructure & DevOps Appendix

### 5.1 Logging — Pino

All backend services use [Pino](https://getpino.io/) for structured JSON logging. Pino is Fastify's default logger.

```typescript
// apps/api/src/index.ts
import Fastify from 'fastify';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined, // JSON in production (Railway log drain compatible)
  },
});
```

**Log levels by context:**
| Context | Level | Example |
|---------|-------|---------|
| HTTP requests | `info` | Automatic via Fastify (method, url, status, latency) |
| LLM calls | `info` | Provider, operation key, latency, token count |
| Worker jobs | `info` | Job name, queue, duration, result |
| Auth failures | `warn` | Invalid JWT, expired session |
| LLM fallback triggered | `warn` | Primary provider failure, switching to fallback |
| Unhandled errors | `error` | Stack trace, request context |
| Welfare escalation | `fatal` | Immediate PagerDuty alert correlation |

### 5.2 Health & Readiness Endpoints

```typescript
// apps/api/src/routes/health.ts
// NO authentication required — used by Railway health checks

app.get('/health', async () => {
  return { status: 'ok', uptime: process.uptime() };
});

app.get('/ready', async () => {
  const checks = {
    database: await checkSupabaseConnection(),
    redis: await checkRedisConnection(),
  };
  const allReady = Object.values(checks).every(Boolean);
  return {
    status: allReady ? 'ready' : 'degraded',
    checks,
  };
});
```

**Railway configuration:** Set `HEALTHCHECK_ENDPOINT=/health` in Railway service settings. Railway pings this endpoint to determine container health. `/ready` is used for zero-downtime deploy gating.

### 5.3 Email — Resend

Transactional emails (OTP fallback, account deletion confirmation, premium receipts) use [Resend](https://resend.com/).

```typescript
// apps/api/src/services/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailService {
  sendOTPFallback(to: string, otp: string): Promise<void>;
  sendDeletionConfirmation(to: string, daysRemaining: number): Promise<void>;
  sendPremiumReceipt(to: string, plan: string, amount: number): Promise<void>;
}
```

**Free tier:** 3,000 emails/month, 100/day — sufficient for launch. No email digest or marketing email in Phase 1.

### 5.4 Railway Deployment

| Service | Railway Config | Resources |
|---------|---------------|-----------|
| **API** | `apps/api` — Dockerfile or Nixpack | 512MB RAM, 0.5 vCPU (starter) |
| **Workers** | Same deploy, separate process (`npm run workers`) | Shares API resources |
| **Redis** | Railway Redis plugin | 25MB free tier (BullMQ metadata only) |

```toml
# railway.toml (root)
[build]
  builder = "nixpacks"
  buildCommand = "npm run build --workspace=apps/api"

[deploy]
  startCommand = "npm run start --workspace=apps/api"
  healthcheckPath = "/health"
  healthcheckTimeout = 30
  restartPolicyType = "on_failure"
  restartPolicyMaxRetries = 3
```

**Environment separation:** Railway environments for `development` and `production`. All secrets stored in Railway environment variables, never in code.

### 5.5 BullMQ / Redis Configuration

```typescript
// apps/api/src/config/redis.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,  // Required by BullMQ
  enableReadyCheck: false,     // Required by BullMQ
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

// Queue defaults
const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: { count: 1000 },  // Keep last 1000 completed
  removeOnFail: { count: 5000 },      // Keep last 5000 failed for debug
};
```

**Redis memory budget (Railway free tier — 25MB):**
| Usage | Estimated Size |
|-------|---------------|
| BullMQ job metadata (3 queues) | ~5MB |
| Rate limiter state | ~1MB |
| Clio routing config cache (60s TTL) | ~100KB |
| Headroom | ~19MB |

> [!NOTE]
> Redis stores only queue metadata and rate limiter state. All persistent data lives in Supabase Postgres. If Redis is lost, BullMQ queues rebuild from empty — in-flight jobs retry automatically.



---

## 6. New Agent Architecture Layer (Added Session 2026-05)

The following operational documents add behavioural and integration detail to the agent layer. They do not change the system's high-level design (React + Node/Fastify + Supabase + BullMQ remains canonical). Read them in addition to Part 4 for complete agent architecture:

| Document | Domain | Cross-references |
|----------|--------|------------------|
| [`clio/CLIO_UNIFIED_CLUSTER_PRESENCE.md`](../clio/CLIO_UNIFIED_CLUSTER_PRESENCE.md) | Single Clio presence — storage differs by context (persistent outside clusters, ephemeral inside). FAB top-right inside clusters (40px), bottom-right outside (48px). | Part 4 §23, Part 3 §7.16 |
| [`clio/CLIO_CLUSTER_HOST_CONTEXT.md`](../clio/CLIO_CLUSTER_HOST_CONTEXT.md) | Clio's anchor behaviour, message budgets (three independent budgets), Atlas orchestration, skill dialogue participation, post formatting. | Part 4 §13, Part 5 §28 |
| [`sage/SAGE_ANCHOR_PROTOCOL.md`](../sage/SAGE_ANCHOR_PROTOCOL.md) | Sage's title is **Anchor** (not Host). @Sage mention protocol with deduplication (≥0.85 → point to past, ≥0.70 → augment, <0.70 → fresh). Bridge-message spec for delayed human escalations. | Part 4 §26–27, Part 3 §7.19 |
| [`sage/SAGE_FEATURE_INTELLIGENCE.md`](../sage/SAGE_FEATURE_INTELLIGENCE.md) | 48h evaluation cycle. Four disqualifying conditions (Redundant, Rare, Unrealistic, Off-purpose). Joint evaluation protocol with Clio. | Part 4 §25, Part 3 §7.17 |
| [`docs/CLUSTER_SKILL_DISCOVERY_PROTOCOL.md`](../docs/CLUSTER_SKILL_DISCOVERY_PROTOCOL.md) | Cross-agent skill dialogue (Phase A internal, Phase B visible). Platform Capability skill category. Maturity threshold rules. | Part 3 §7.15 |
| [`docs/AGENT_COLLABORATION_CHATBOX.md`](../docs/AGENT_COLLABORATION_CHATBOX.md) | Visible Clio + Sage collaboration panel inside premium clusters. Cadence by member-count tier (2h–12h). Wait-and-observe semantics. Feature activation authority. | Part 4 §24, Part 3 §7.16 |
| [`docs/CLUSTER_FEATURES_TAB.md`](../docs/CLUSTER_FEATURES_TAB.md) | Member-visible features surface in clusters. Status pipeline: proposed → approved → scheduled → in_testing → live. Member upvotes and comments. | Part 3 §7.17, §7.20 |
| [`Revised_Screen_Prompts/CLUSTER_UI_MICROINTERACTIONS.md`](../Revised_Screen_Prompts/CLUSTER_UI_MICROINTERACTIONS.md) | Motion and microinteraction specification for the new cluster UI. Subordinate to `mobile_screen_prompts_phase1.md` for visual identity; takes precedence for motion. | Part 3 §8 frontend |

> **Naming note (V3 alignment):** The retired term *Yantra* referred to the agent runtime engine. Under V3 it is now called the **Agent Runtime** — implemented as BullMQ workers on the Node.js + Fastify backend. The runtime's behaviour is unchanged; only the name. The `/yantra/` folder is preserved as read-only legacy reference for the original routing-table and worker-pattern documentation. The `routing_table.json` inside that folder remains the canonical LLM-routing source until migrated into the `llm_routing_config` Supabase table.


---

## 7. The Seven AI-Native Principles — Architectural Implications

> **Status (V3.2 alignment):** The platform's design and the agent runtime are evaluated against the seven AI-native principles. These principles apply to **every cluster**, premium or regular, and are baked into the architecture rather than retrofitted into individual cluster configs.

### 7.1 The Principles as Architecture

| # | Principle | Architectural manifestation |
|---|-----------|----------------------------|
| 1 | **AI as OS** | Every workflow flows through an intelligent layer. Onboarding is Clio-led conversational. Sage evaluates every member message before posting. Clio improvises Sage's prompts based on observed behaviour (`agent_prompt_proposals`). The platform itself routes welfare, character, and feature signals through agent judgment. |
| 2 | **Closed loops** | Every important process captures its output and feeds it back. `llm_response_logs` (cost/latency/decision per call), `sage_decision_logs` (which framework step matched, what was rejected), `agent_feedback` (member ratings), `behavioural_events` (every meaningful action), `welfare_notifications.resolved`, `clio_handoff_greetings.greeting_responded_at`. None of these tables are decorative — each is read by a downstream agent or admin process. |
| 3 | **Legible organization** | All key actions become queryable data. Schema-first design: 30+ tables with RLS, every agent decision a row, every member action a row. Admin dashboard surfaces what is happening, never less. The agents themselves read these tables — Clio's cluster-context assembler queries `cluster_intel` (a view aggregating recent activity) before each call. |
| 4 | **Software factories** | Humans (founders, admin team) define what success looks like; agents generate and iterate the implementation. Sage's prompt is DB-backed via `agent_prompt_proposals` — Clio drafts refinements grounded in evidence (logs, feedback, events), admin approves, the new prompt activates. Cluster-specific personas live in `sage_personas` and adapt without code changes. Tool/feature ideation flows from agent dialogue → member polling → admin approval → development. |
| 5 | **No human middleware** | Every layer that exists only to route information is removed. Welfare flags realtime-push to admin (no polling). Sage→Clio handoff happens autonomously when public silence is right but private follow-up serves the member. Vault gaps Sage notices auto-create curation tasks for the admin. The cluster's daily operation requires the human only at decision points the platform genuinely cannot judge. |
| 6 | **Three archetypes** | The platform supports builder-operators (admin, managers — directly run their clusters), DRIs (a cluster's named admin owns its outcomes), and AI-led workflows (Sage and Clio operate semi-autonomously under Clio's orchestration, with admin override). No diffused accountability — every cluster has one admin, every welfare flag has one human owner. |
| 7 | **Token-max** | Spending is bounded but generous: a daily budget cap (`LLM_DAILY_BUDGET_USD`, default $5 for MVP) prevents runaway, but inside the cap the agents are willing to call the LLM for every member message, every cadence exchange, every feature evaluation. Cost is measured per-call (`llm_response_logs.cost_estimate_usd`), surfaced per-operation in the admin LLM tab, and trades headcount (vault curators, moderators, community managers) for AI throughput. |

### 7.2 What is Immutable Across All Clusters

These do not vary by cluster type, persona, or admin preference:

1. **The Aggilo Soul** — monotheistic foundation; connection as means, good character as the end.
2. **Welfare protocol** — regex pre-filter + Sage Step 0 + admin queue. Cannot be disabled.
3. **Good-character protocol** — Sage Step 0.5. Cannot be disabled.
4. **No protocol disclosure** — Sage never narrates her decision tree. Admins see neutralised labels in the dashboard, not framework mechanics.
5. **Repetition guard** — Sage's recent posts are part of every prompt. Application-layer Jaccard similarity check (`isSagePostRepetitive`, threshold ≥ 0.55) suppresses near-duplicates before they reach the cluster.
6. **Skepticism in agent dialogue** — the cadence and ideation prompts forbid sycophancy. Disagreement and "let's wait" are valid outcomes.
7. **Privacy boundaries** — Clio's "Just between us" tab content never persists server-side. The admin sees that a session existed, never its content.
8. **AGGIL post-spawn protections** — once members join, the cluster cannot retroactively narrow.

### 7.3 What Varies by Cluster

These are configurable per cluster (see [`premium_cluster_requirements.md`](premium_cluster_requirements.md) for premium specifics):

- Sage's register, formality, and interjection frequency (`sage_personas`)
- Reference vocabulary (e.g. `dua / ayah / hadith` for a faith cluster, `case / passage / precedent` for a legal cluster, etc.)
- Vault grading rules
- Authority redirect language (e.g. "the Admin or the right specialist")
- Geographic gate
- Feature pipeline thresholds (regular vs. premium)

### 7.4 Cluster Maturity Tiers — Feature Pipeline

Feature ideation by agents runs from Day 1, but member-facing visibility is gated by cluster size. This prevents an empty room from looking empty AND prevents a tiny room from polling itself into chaos.

| Members | Workshop | Member voting | Comments |
|---------|----------|----------------|----------|
| 0–4 | Hidden to members | — | Agents discuss internally; admin sees in Workshop dashboard |
| 5–14 | Visible as "Coming soon — agents are figuring out what this room could gain" placeholder | Disabled | Disabled |
| 15–49 | Active. Members see proposed tools and features, can upvote features, can comment | Signal collection only | Enabled |
| 50+ | Full | Active polling: ≥ 10 upvotes flags admin priority | Enabled |

The thresholds are stored in `platform_settings` and overridable per cluster.

### 7.5 First-Visit Cognitive Load — UX Invariants

A new member arriving in a cluster sees, in priority order:

1. **Cluster header** — name, tagline, **demographic restriction chips** (only the active restrictions; if none, a single "Global" chip), **prominent live-presence indicator** (members online now, total, joined this week). Social proof first. Cluster-specific noun ("sisters", "members", "founders", etc.) is plugged in from the cluster's vocabulary config.
2. **Pinned anchor** — Sage's seed post, expanded on first visit, collapsed thereafter. Per-device preference.
3. **Timeline** — newest first.
4. **Compose bar** — sticky bottom, with a daily nudge prompt and an anonymous typing indicator ("someone is writing…", or in a faith cluster "a sister is writing…") when other members are typing.
5. **Clio FAB** — top-right, dual-tab (Just between us / Ask me anything). The button breathes gently with a soft halo while idle to communicate that the intelligence layer is alive without demanding attention.
6. **Room Workshop** — **collapsed by default**. A one-line strip that members can expand if curious. Shows what Clio and Sage are building for the room: tools they run, features for member voting. Never the foreground; never about members.

The Workshop and admin link only surface when the user has earned their way to them (3+ posts, role=admin/manager).

### 7.6 Welcome Surface (New Members)

When a new profile is created (via auth callback), the platform fires `POST /api/agents/welcome-new-member`. The endpoint:

- Returns early if the user already has a `session_started` event with `welcome_posted=true`
- Returns early if the user has any post (they're not new enough)
- Batches with any Sage welcome posted in the last 30 minutes (don't pile up multiple welcomes)
- Otherwise posts one short, restrained line ("A new member joined this room" — exact wording is cluster-specific) and records a behavioural event

The wording is intentionally non-performative. No exclamation marks. No "welcome!". Sage's voice. The point is social proof for the rest of the room — "people are arriving" — not making the new member feel scripted at.

### 7.7 Demographic Restriction Chips (Cluster Header)

Every cluster declares its AGGIL configuration: age range, gender filter, geography, languages, interest tags. The header surface treats these as **expectation-setting**, not warnings. The rule:

- **Show only what's restricted.** If a cluster has no age restriction, no age chip. If it has no gender restriction, no gender chip. Silence on a dimension means "open to all on this dimension".
- **All dimensions open → single `🌐 Global` chip.** A cluster open to everyone earns one chip that confirms the openness rather than leaving the header empty on this dimension.
- **Visual register: muted, pill-shaped, bordered, ~11px font.** Sits below the cluster tagline, above the description. Not a badge, not a warning, not a notification. Quiet context.
- **Examples:**
  - A clinical-aid cluster gated to verified medical professionals: `🩺 Medical professionals` (one chip)
  - A Phase 0 faith cluster gated to women in India: `🇮🇳 India · ♀ Women` (two chips)
  - A founders peer support cluster open globally: `🌐 Global` (one chip)

**Why it works:** for members who fit the restrictions, the chips are quiet affirmation that this room is for them. For members who don't fit (or who arrived from a search expecting something different), the chips set expectation immediately and honestly — without making fit-judgment a moral statement.

The chip data is read from `clusters.aggil_config` (Phase 1) or hard-coded per cluster (Phase 0). The icon-and-label table is platform-level so chips render consistently across clusters.

### 7.8 Room Workshop — The Two-Track Capability Model (V3.4)

The agent collaboration surface — visible to members, ambient by default, expandable on tap — is called the **Room Workshop**. It replaces the earlier "Agent Thoughts" framing and corrects a behavioural drift: the agents must read as **service providers**, not observers.

#### Service framing — non-negotiable

Agents in the Workshop never observe or comment on members. Every line of dialogue refers to:
- The **room's capabilities** (what the room could gain)
- The **agents' own work** (what they're running, what they're proposing)
- A **specific tool or feature** under discussion

Forbidden subjects in agent dialogue: member behaviour patterns, engagement metrics, room "mood" descriptions, anything that uses members as the subject of a sentence. The cadence-exchange prompt enforces this with a hard rule. Drift is detectable in production (LLM logs show the rejected outputs).

This is a soul-document alignment fix. The agent is a servant, not an authority. The Workshop frame makes that visible.

#### Two tracks: agent tools and member features

Every capability the agents propose is one of two kinds. The distinction is platform-level:

| Property | Agent Tool (`kind: 'agent_tool'`) | Member Feature (`kind: 'member_feature'`) |
|---|---|---|
| **What it is** | A capability Sage or Clio runs on behalf of the room | A UI surface or interaction members touch |
| **Who decides** | Agents deploy autonomously within rules; admin can veto | Member upvote (≥10 = admin priority); admin awareness required |
| **Member UI** | "Already running" / "We'll build this" / "Live" — no vote button | Upvote + comment, vote-gated by cluster size |
| **Examples** | Tajweed-aware reference formatter, daily reflection prompt, verified-source digest | "Mark thread resolved" button, quiet hours setting, member question queue |

Both kinds carry a **build status**, distinct from the member-facing pipeline status:

- `deployable_now` — Sage can simulate this today using existing primitives (e.g. inline tajweed formatting in posts)
- `needs_building` — requires developer code work (Phase 0: admin builds; Phase 1: agents may build in sandbox per §7.10 future)
- `building` / `live` / `paused` / `retired` — lifecycle endings

#### Approval flow by track

The Workshop encodes the platform's stance on AI autonomy:

- **Agent tools, `deployable_now`** — ship immediately. Logged. No member vote. Admin can veto from dashboard at any time. This is the autonomy reward for capabilities that pose no member-facing risk.
- **Agent tools, `needs_building`** — propose, surface in Workshop as "We'll build this." Phase 0: admin builds, registers the tool, agents invoke it. Phase 1: agents build in a sandboxed runtime, register on success.
- **Member features** — propose, surface in Workshop, members vote. ≥10 upvotes flags admin priority. Admin approves for development. (The threshold is count-based, not percentage, so it scales identically for a 20-member room and a 5,000-member room.)

#### Closed-loop telemetry

Every tool invocation writes a row to `cluster_tool_invocations`. The Workshop displays "Run N times in this room" on each tool card, drawn from the denormalised `cluster_features.invocation_count` counter. This isn't decoration — it's the closed-loop signal that tells admin (and agents) which tools are actually serving the room. A tool with 0 invocations after 30 days is a candidate for retirement.

#### What the rename signals to members

Members reading "Room Workshop" feel: *the agents are working on this room*. Members reading "Agent Thoughts" felt: *the agents are thinking about us*. The first is service. The second is surveillance with extra steps. The rename is small; the behavioural shift it produces is large.

#### Schema

Storage is consolidated in `cluster_features` (single table for both tracks, discriminated by `kind`) plus the new `cluster_tool_invocations` telemetry table. See Part 2 §5.1.3 (V3.4 additions) for the full DDL. Existing Phase 0 deployments apply via `mvp/supabase/APPLY_NOW.sql` v1.7.

### 7.9 Per-Cluster Configurability + The platform_admin Role (V3.5)

Premium clusters expose a small, discrete set of configuration controls to their admin. The full behavioural matrix (which behaviours each level enables, what is immutable safety floor, how free-text guidance is bounded by the slider) lives in [`premium_cluster_requirements.md` §10](premium_cluster_requirements.md#10-agent-involvement-slider--behavioural-matrix-v35). The platform-level summary:

- **Agent involvement slider** (`min` / `medium` / `high`, default `medium`) — the ceiling for autonomous agent behaviour in the cluster
- **`agent_disabled` flag** — when paired with `min`, silences agents entirely except for the immutable safety floor (welfare, character protocol, Sage→Clio handoff, @Sage member invitations)
- **Free-text guidance** — admin writes intent in plain language; Clio parses it into `parsed_directives` and rejects anything that violates immutable invariants OR exceeds the slider ceiling
- **Skill enable/disable** — per-cluster toggles drawn from a platform-wide `skill_registry`; admin requests for skills not yet in the registry route to the Workshop pipeline (no fast-track)

The slider is intentionally three discrete levels, not a continuous control. The behaviours it governs (cadence intervals, daily reflection on/off, introspection cycle frequency) are themselves discrete; a 0–100 slider creates the illusion of fine-grained control where there is none, increases admin decision burden, and breaks member legibility.

#### The fourth role: `platform_admin`

The DB enum `profiles.role` accepts four values: `member`, `manager`, `founder`, `platform_admin`. The first three are within-cluster. The fourth (`platform_admin`) is the Aggilo team — cross-cluster authority for safety, governance, and skill catalogue stewardship.

What `platform_admin` can do:

- Read any cluster's `cluster_config` and `cluster_admin_actions` audit trail
- Override any cluster's slider, skill list, or free-text guidance — every override writes a row to `cluster_admin_actions` with `actor_role = 'platform_admin'` and a `rationale`
- Veto a cluster admin's free-text directive even if Clio's parser accepted it
- Mutate `skill_registry` (add new skills, retire skills platform-wide)

What `platform_admin` cannot do:

- Bypass the immutable safety floor (welfare detection, character protocol, soft handoff). These run for every cluster regardless of any role's preference.
- Read members' private Clio "Just between us" tab content. The privacy boundary is structural, not policy — the data does not leave the user's browser.
- Act untraceably. Every `platform_admin` action produces a `cluster_admin_actions` row.

The role exists as a structural escape hatch for the small number of cases where the platform must intervene faster than the workshop pipeline allows: an admin makes a configuration choice that violates an invariant the parser missed, a skill needs to be retired across all clusters because of a discovered issue, or a cluster goes silent and the team needs to read its config to understand why.

#### Schema location

The full DDL for `cluster_config`, `cluster_admin_actions`, `skill_registry`, plus the `profiles.role` CHECK constraint extension to include `platform_admin`, lives in `mvp/supabase/APPLY_NOW.sql` v1.8 (Phase 0 reference implementation). Phase 1 will re-implement against the equivalent service layer; the table shapes and RLS policies are stable.


---

## 8. Phase 0 — Single-Cluster Validation Stage (V3.2)

> **Phase 0 is a generic platform stage, not a specific cluster.** It is the first live instantiation pattern of an Aggilo deployment: a single premium cluster running on a stripped-down stack, used to validate agent behaviour, welfare protocol, feature pipeline, closed-loop telemetry, and hierarchy-first UX before scaling to generic multi-cluster Phase 1.
>
> The first cluster running under Phase 0 (and the cluster-specific configuration of its vault, register, vocabulary, geographic gate, etc.) is described in [`premium_cluster_requirements.md` §6](premium_cluster_requirements.md#6-sisters-in-dua--the-first-premium-cluster) and [`premium_cluster_requirements.md` §9](premium_cluster_requirements.md#9-phase-0--sisters-in-dua-as-the-first-premium-cluster). This section defines the **generic** Phase 0 stage pattern — what is true of any cluster operating under Phase 0 conditions.

### 8.1 What Phase 0 Is (generic stage)

| Dimension | Phase 0 (single-cluster validation) | Phase 1 (generic platform) |
|---|---|---|
| Clusters | 1 (a premium cluster) | Unlimited (generic + premium) |
| Cluster creation | Not available | Clio-led conversational creation |
| AGGIL engine | Not active | Full AGGIL scoring, qualification, matching |
| Scout | Not active | Macro-discovery, auto-cluster creation |
| Atlas | Not active (vault-only references) | Cluster content intelligence |
| Observer | Not active | 10-domain passive monitoring |
| Matchmaker | Not active | Premium feature |
| Geographic gate | Single region (cluster-specific) | AGGIL-configured per cluster |
| Vault | Hand-curated by Admin, cluster-specific schema | Cluster-specific, Admin-curated |
| Admin | Human-appointed (SQL elevation or `ADMIN_EMAILS` env) | Auto-elevation via `ADMIN_EMAILS` env |
| Stack | Next.js 14 (App Router) + Supabase + single LLM endpoint with fallback | React 18 + Vite + Node/Fastify + BullMQ + multi-LLM router |

### 8.2 What Phase 0 Validates

A Phase 0 deployment exists to prove these behaviours work end-to-end, with real members, before they are re-implemented in the Phase 1 stack:

1. **Agent behaviour** — Sage's decision framework, welfare protocol, character guardrail, repetition guard, vault-entry dedup, pointer behaviour.
2. **Closed-loop telemetry** — `llm_response_logs`, `sage_decision_logs`, `agent_feedback`, `behavioural_events`, welfare/care resolution.
3. **Feature pipeline** — Workshop → `cluster_features` (kind=member_feature) → member upvote/comment → admin approval. Tools (kind=agent_tool) deploy autonomously when `deployable_now`.
4. **Introspection cycle** — Clio reads 7-day telemetry, produces self-critique + concrete proposal every 6h.
5. **Hierarchy-first UX** — Members first, agents in service. Compose bar as primary surface. Room Workshop below the timeline.
6. **Admin dashboard** — Welfare queue, care queue, LLM observability, vault curator, features pipeline, behavioural events.

### 8.3 Phase 0 → Phase 1 Transition Criteria

Phase 1 readiness for a given Phase 0 deployment is signalled when:
- The cluster has ≥ 50 active members (posted at least once in the last 30 days)
- Welfare protocol has been exercised and resolved at least 3 times
- Feature pipeline has produced at least 2 admin-approved features
- Introspection cycle has run at least 10 times with non-trivial proposals
- Admin has reviewed and refined at least 1 Sage prompt proposal from `agent_prompt_proposals`

These are not hard gates — they are readiness signals. The decision to move to Phase 1 is the Admin's. Specific Phase 0 cluster transition timing lives in the cluster's own spec.

### 8.4 Phase 0 Stack Isolation Rule

A Phase 0 codebase (e.g. `/mvp/`) is its own world. It MUST NOT import from the Phase 1 `apps/api/` or use Fastify/BullMQ patterns. A Phase 0 deployment is a Next.js 14 App Router application. All agent logic runs as Next.js API routes. All queue-like behaviour is implemented as client-side timers with server-side cadence guards.

When Phase 1 is built, the agent behaviour patterns validated in Phase 0 are re-implemented in the Node/Fastify/BullMQ stack. The Phase 0 codebase is not migrated — it is a reference implementation.
