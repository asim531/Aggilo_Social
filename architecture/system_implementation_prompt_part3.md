# Aggilo — System Implementation Prompt
## Part 3: API Design, State Management & Implementation Phasing

> **Canonical sources:** API surface and orchestration rules are defined primarily in:
> - `ARCHITECTURE.md`
> - `AGGILO_PLATFORM_REPORT.md`
> - `AGGILO_PLATFORM_RULES.md`
> - `architecture/planning/04_CAPABILITY_MAP.md`, `05_DEPENDENCY_GRAPH.md`, `08_IMPLEMENTATION_ROADMAP.md`
> - `AGENT_RUNTIME.md`, `REALTIME_ENGAGEMENT_LAYER.md`, `PLATFORM_AGENCY.md`
>
> This Part 3 file is an implementation helper. If any statement here conflicts with the documents above, the architecture and planning docs **win** and this series is considered secondary.

---

> **Phase 1 architecture additions (read these alongside this Part):**
> - [`architecture/PLATFORM_AGENCY.md`](PLATFORM_AGENCY.md) — three-layer platform agency model
> - [`observer/OBSERVER_STEWARDSHIP.md`](../observer/OBSERVER_STEWARDSHIP.md) — Observer's autonomous stewardship mechanics
> - [`observer/OBSERVER_INTROSPECTION_ENGINE.md`](../observer/OBSERVER_INTROSPECTION_ENGINE.md) — introspection prompt + priority queue
> - [`architecture/CLUSTER_GENESIS_ENGINE.md`](CLUSTER_GENESIS_ENGINE.md) — cluster spec generation, validation, token budgets
> - [`architecture/AGENTIC_FEATURE_SIGNALS.md`](AGENTIC_FEATURE_SIGNALS.md) — feature signal capture, k-anonymity, CIM integration
> - [`architecture/PLATFORM_TOOLS_REGISTRY.md`](PLATFORM_TOOLS_REGISTRY.md) — global tool catalog, auto-promotion, versioning
> - [`architecture/TOOL_ECONOMY.md`](TOOL_ECONOMY.md) — cost model, affinity gating, pricing tiers
>
> Phase 1 endpoints live in §7.14a (Observer Stewardship). Phase 1
> implementation steps live in Phase 9.5 (Observer Autonomous
> Stewardship). See Part 6 §41 for supersession rules.

---

## 7. API Endpoint Map (Fastify Routes)

> **Endpoint additions from operational documents (v2.1):**
> Endpoints in Sections 7.5 (Clio private chat) and 7.15 (Skill Discovery) were added from
> `CLIO_PRIVATE_EPHEMERAL_CHAT.md` and `CLUSTER_SKILL_DISCOVERY_PROTOCOL.md` respectively.
> Consult those documents for full behaviour specification before implementing these routes.

All endpoints require `Authorization: Bearer {JWT}` except where noted. Admin endpoints additionally require `profiles.is_admin = true`.

### 7.1 Auth & Profile

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `POST` | `/api/auth/send-otp` | Send OTP to phone/email | None |
| `POST` | `/api/auth/verify-otp` | Verify OTP, return JWT | None |
| `POST` | `/api/auth/check-email` | Check if email already has an account (used in signup flow to avoid duplicate creation) | None |
| `POST` | `/api/profile/create` | Create profile after first auth | JWT |
| `GET` | `/api/profile/me` | Get current user profile | JWT |
| `PUT` | `/api/profile/me` | Update mutable fields (nickname, languages, tags) | JWT |
| `POST` | `/api/nickname/check` | Check nickname availability in real-time during signup (returns `{available: boolean}`) | None |
| `GET` | `/api/nickname/check/:name` | Check availability + AI appropriateness | JWT |
| `GET` | `/api/nickname/suggest` | Get AI-generated alternatives | JWT |
| `POST` | `/api/account/delete-request` | Start 7-day deletion grace period | JWT |
| `POST` | `/api/account/cancel-deletion` | Cancel pending deletion | JWT |

> **Waitlist pre-fill re-entry note:** When a waitlist user follows an invite link that includes pre-collected demographic data (email, gender, birth_year, country), the frontend reads these as URL query parameters and pre-populates the signup form, advancing directly to the nickname step. The backend validates all fields normally at profile creation — pre-filling is a UX shortcut, not a bypass of validation. The OTP metadata carries the pre-filled values to the auth callback so the profile is created in a single round-trip. See `docs/AGGILO_ONBOARDING_PLAYBOOK_V2.md` §Principle 7 for the full flow spec.

### 7.2 Clusters

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `POST` | `/api/clusters` | Create cluster with AGGIL settings | JWT |
| `GET` | `/api/clusters/search` | Search with text + AGGIL filters (`?q=&filters=`) | JWT |
| `GET` | `/api/clusters/suggestions` | AGGIL-matched dashboard suggestions | JWT |
| `GET` | `/api/clusters/match-for-user` | On-demand empty-dashboard query | JWT |
| `GET` | `/api/clusters/nearby` | GPS-based nearby (`?lat=&lng=&range=`) | JWT |
| `GET` | `/api/clusters/:id` | Cluster detail | JWT |
| `GET` | `/api/clusters/:id/preview` | Public cluster preview (shared links) | None |
| `GET` | `/api/clusters/:id/qualify` | Check if user qualifies | JWT |
| `POST` | `/api/clusters/:id/join` | Join (includes qualification check) | JWT |
| `POST` | `/api/clusters/:id/leave` | Leave cluster | JWT |
| `GET` | `/api/clusters/:id/members` | Member list | JWT |
| `POST` | `/api/clusters/check-duplicate` | Check similar existing clusters | JWT |
| `GET` | `/api/clusters/score` | Calculate cluster quality score | JWT |
| `GET` | `/api/clusters/:id/soul-manifestation` | Get cluster's soul manifestation profile (member-visible summary) | JWT |
| `GET` | `/api/clusters/:id/persona-override` | Get active cluster persona override | JWT |

### 7.3 Posts & Comments

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `GET` | `/api/clusters/:id/feed` | Paginated timeline feed | JWT |
| `POST` | `/api/clusters/:id/posts` | Create post (text or image) | JWT |
| `POST` | `/api/posts/:id/like` | Toggle like | JWT |
| `POST` | `/api/posts/:id/comment` | Add comment | JWT |
| `POST` | `/api/posts/:id/report` | Report a post | JWT |

### 7.4 Direct Messages

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `POST` | `/api/dm/request` | Send DM request (with cluster context) | JWT |
| `POST` | `/api/dm/respond` | Accept or decline a DM request | JWT |
| `POST` | `/api/dm/send` | Send message in accepted thread | JWT |
| `GET` | `/api/dm/conversations` | List DM threads (requests + active) | JWT |
| `GET` | `/api/dm/threads/:id/messages` | Get messages in a thread | JWT |
| `POST` | `/api/users/:nickname/block` | Block a user | JWT |

### 7.5 Clio (AI Agent)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `POST` | `/api/clio/chat` | **Unified chat endpoint.** Send message to Clio. Storage is determined by request payload: `cluster_id` present → ephemeral mode (Redis, 12h TTL). `cluster_id` absent → persistent mode (Supabase). | JWT |
| `GET` | `/api/clio/history` | Persistent conversation history (premium: persistent across sessions; free: per-session) | JWT |
| `GET` | `/api/clio/cluster-arc/:clusterId` | Get cluster arc phase + sage_posts_today (for personal-context display only — Clio reads, Sage acts) | JWT |
| `GET` | `/api/clio/ephemeral/session` | Ephemeral session status (TTL remaining, message count) — **no content returned** | JWT |
| `DELETE` | `/api/clio/ephemeral/session` | User-initiated session early deletion (irreversible; flushes Redis key, marks session row as deleted_at) | JWT |
| `POST` | `/api/clio/ephemeral/welfare` | Internal: welfare escalation from ephemeral session | Service |
| `GET` | `/api/clio/tips/:clusterId` | Get active (pending, non-expired) tips for the current user in a cluster | JWT |
| `POST` | `/api/clio/tips/:tipId/act` | Mark tip as acted on (opens FAB) | JWT |
| `POST` | `/api/clio/tips/:tipId/dismiss` | Mark tip as dismissed | JWT |

> **Tip request payload note:** When a Clio chat response includes an inline tip (`data.tip` field), the client renders it as a distinct card inside the FAB panel. The server writes a `clio_tip_log` row with `tip_source = 'chat_inline'` at the same time as returning the response. The client polls `/api/clio/tips/:clusterId` on mount for proactively-pushed tips (source = 'proactive').

> **Unified-presence note (V3 alignment):** The legacy split between cluster-mode chat and private-mode chat is retired. There is one `/api/clio/chat`. The presence of `cluster_id` in the request body is the only switch the API needs. See [`clio/CLIO_UNIFIED_CLUSTER_PRESENCE.md`](../clio/CLIO_UNIFIED_CLUSTER_PRESENCE.md).

### 7.6 Scout

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `POST` | `/api/scout/trigger` | Manually trigger crawl for segment | Admin |
| `GET` | `/api/scout/status` | Current crawl status | Admin |
| `GET` | `/api/scout/results/:segment` | Discovery results for a segment | Admin |
| `POST` | `/api/scout/approve/:topic` | Approve/reject a discovery | Admin |
| `POST` | `/api/scout/claim-founder` | Claim founder on AI-created cluster | JWT |

### 7.7 Atlas

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `POST` | `/api/atlas/brief` | Internal: Clio → Atlas dispatch | Service |
| `GET` | `/api/atlas/results/:clusterId` | Internal: poll results | Service |
| `POST` | `/api/atlas/feedback` | Log interaction for calibration | JWT |
| `GET` | `/api/admin/atlas/:clusterId/queue` | Admin review queue | Admin |
| `POST` | `/api/atlas/approve/:discoveryId` | Admin approve/reject | Admin |

### 7.8 Premium & Payments

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `POST` | `/api/premium/subscribe` | Initiate subscription | JWT |
| `POST` | `/api/premium/cancel` | Cancel subscription | JWT |
| `GET` | `/api/premium/status` | Check subscription status | JWT |
| `POST` | `/api/matchmaker/chat` | Premium matchmaker chat | JWT+Premium |
| `POST` | `/api/matchmaker/questionnaire` | Create + send questionnaire | JWT+Premium |
| `POST` | `/api/matchmaker/questionnaire/:id/respond` | Submit response | JWT |
| `POST` | `/api/matchmaker/private-cluster` | Create private cluster | JWT+Premium |
| `POST` | `/api/payments/razorpay/create-order` | Create Razorpay order | JWT |
| `POST` | `/api/payments/razorpay/verify` | Verify payment webhook | Webhook |
| `POST` | `/api/payments/google-play/verify` | Verify GP purchase | Webhook |

### 7.9 Premium Clusters

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `POST` | `/api/premium-cluster/apply` | Submit "Make Your Crowd" application | None |
| `GET` | `/api/premium-cluster/status/:id` | Check application status | None |
| `POST` | `/api/premium-cluster/review` | Admin review application | Admin |
| `POST` | `/api/clusters/:id/admin/remove-member` | Founder: remove member | JWT+Founder |
| `DELETE` | `/api/clusters/:id/admin/content/:postId` | Founder: delete post | JWT+Founder |
| `POST` | `/api/clusters/:id/admin/mute/:nickname` | Founder: mute member | JWT+Founder |
| `POST` | `/api/clusters/:id/admin/pin/:postId` | Founder: pin post | JWT+Founder |
| `GET` | `/api/clusters/:id/admin/audit-log` | Founder: view admin actions | JWT+Founder |

### 7.10 Admin

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `GET` | `/api/admin/dashboard` | Metrics overview | Admin |
| `GET` | `/api/admin/users` | User management list | Admin |
| `GET` | `/api/admin/clusters` | Cluster management | Admin |
| `GET` | `/api/admin/analytics` | Detailed analytics | Admin |
| `GET` | `/api/admin/reports` | Moderation queue | Admin |
| `POST` | `/api/admin/reports/:id/action` | Take moderation action | Admin |
| `POST` | `/api/users/:id/ban` | Ban user | Admin |
| `POST` | `/api/users/:id/unban` | Unban user | Admin |
| `GET` | `/api/admin/personas` | List all personas | Admin |
| `GET` | `/api/admin/personas/:id` | Persona detail | Admin |
| `PUT` | `/api/admin/personas/:id` | Edit persona | Admin |
| `POST` | `/api/admin/personas/:id/approve` | Approve persona | Admin |
| `POST` | `/api/admin/personas/:id/activate` | Activate persona | Admin |
| `POST` | `/api/admin/personas/:id/preview` | Preview Clio with persona | Admin |
| `GET` | `/api/admin/clio/stats` | Clio orchestrator metrics | Admin |
| `GET` | `/api/admin/clio/conversations` | LLM-classified audit log | Admin |
| `GET` | `/api/admin/llm/performance` | LLM performance metrics | Admin |
| `GET` | `/api/admin/llm/routing` | Current routing rules | Admin |
| `PUT` | `/api/admin/llm/routing` | Update routing rules | Admin |
| `POST` | `/api/admin/llm/ab-test` | Start A/B test | Admin |
| `GET` | `/api/admin/llm/costs` | Cost breakdown | Admin |
| `GET` | `/api/admin/clusters/:id/soul-manifestation` | View full soul manifestation profile (admin detail) | Admin |
| `PUT` | `/api/admin/clusters/:id/soul-manifestation` | Edit soul manifestation profile | Admin |
| `POST` | `/api/admin/clusters/:id/soul-manifestation/regenerate` | Trigger Genesis Engine to regenerate profile | Admin |
| `GET` | `/api/admin/clusters/:id/soul-manifestation/audit` | Audit trail of profile changes | Admin |
| `POST` | `/api/admin/clusters/:id/persona-override` | Create cluster persona override | Admin |
| `PUT` | `/api/admin/clusters/:id/persona-override/:overrideId/approve` | Approve persona override | Admin |
| `PUT` | `/api/admin/clusters/:id/persona-override/:overrideId/reject` | Reject persona override with reason | Admin |
| `GET` | `/api/admin/clusters/:id/persona-override/preview` | Preview merged persona before approval | Admin |

### 7.11 Notifications

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `POST` | `/api/devices/register` | Register FCM device token | JWT |
| `PUT` | `/api/notifications/preferences` | Update global prefs | JWT |
| `PUT` | `/api/clusters/:id/notifications` | Update per-cluster settings | JWT |

### 7.12 AI Feedback

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `POST` | `/api/ai/feedback` | Submit rating on Clio response | JWT |
| `GET` | `/api/admin/llm/disagreements` | Flagged response queue | Admin |
| `POST` | `/api/admin/llm/disagreements/:id/verdict` | Admin verdict | Admin |

### 7.13 Sage (Cluster Intelligence)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `GET` | `/api/sage/:clusterId/persona` | Get Sage's resolved persona for a cluster | JWT |
| `GET` | `/api/sage/:clusterId/status` | Sage activity summary (posts today, arc phase, persona) | JWT |
| `POST` | `/api/sage/description-proposal/:clusterId` | Internal: Sage proposes description refinement | Service |
| `GET` | `/api/sage/description-proposals/:clusterId` | List pending proposals for cluster | JWT+Founder |
| `POST` | `/api/sage/description-proposals/:id/review` | Founder approves/rejects description proposal | JWT+Founder |
| `GET` | `/api/admin/sage/overview` | Platform-wide Sage activity metrics | Admin |
| `GET` | `/api/admin/sage/:clusterId/history` | Sage posting history for a cluster | Admin |
| `PUT` | `/api/admin/sage/:clusterId/persona` | Admin override Sage persona | Admin |

### 7.14 Observer & Tools

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `GET` | `/api/admin/observer/findings` | Observer findings dashboard (filterable by domain 1-10, severity) | Admin |
| `GET` | `/api/admin/observer/findings/:id` | Finding detail with occurrence history | Admin |
| `POST` | `/api/admin/observer/findings/:id/action` | Acknowledge, action, or dismiss a finding | Admin |
| `GET` | `/api/admin/tools/active` | Active tools across all clusters | Admin |
| `GET` | `/api/admin/tools/proposals` | Tool proposals queue | Admin |
| `POST` | `/api/admin/tools/proposals/:id/review` | Approve/reject tool proposal | Admin |

### 7.14a Observer Stewardship (Phase 1)

> Channel 1 — autonomous stewardship. Surfaces Observer's prompt updates
> with veto window. Welfare signals never appear here — they always route
> through Channel 2 (§7.14 findings). Full spec: `observer/OBSERVER_STEWARDSHIP.md`.

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `GET` | `/api/admin/observer/stewardship/pending` | Pending Tier 1/2 updates with veto countdown | Admin |
| `GET` | `/api/admin/observer/stewardship/committed` | Committed updates with outcome status | Admin |
| `GET` | `/api/admin/observer/stewardship/vetoed` | Vetoed updates with escalated findings | Admin |
| `GET` | `/api/admin/observer/stewardship/:updateId` | Update detail (diff, rationale, snapshot, reasoning chain) | Admin |
| `POST` | `/api/admin/observer/stewardship/:updateId/veto` | Veto a pending update (rolls back + escalates) | Admin |
| `POST` | `/api/admin/observer/stewardship/:updateId/rollback` | Manually roll back a committed update | Admin |
| `GET` | `/api/admin/observer/stewardship/rejected` | Proposals that failed validation/minimality | platform_admin |
| `GET` | `/api/admin/observer/learnings` | Cross-cluster outcome learnings | platform_admin |
| `PUT` | `/api/admin/clusters/:id/observer/priority` | Set priority override (urgent/elevated/normal/low/paused) | platform_admin |
| `PUT` | `/api/admin/clusters/:id/observer/quiet-hours` | Set quiet hours for this cluster | Admin |
| `PUT` | `/api/admin/clusters/:id/observer/grace-period` | Extend or end the new-admin grace period | platform_admin |
| `GET` | `/api/clusters/:id/observer/stewardship` | Founder-scoped view of Observer actions on own cluster | Founder |
| `POST` | `/api/clusters/:id/observer/stewardship/:updateId/veto` | Founder veto on own cluster | Founder |
| `POST` | `/api/clusters/:id/observer/stewardship/:updateId/rollback` | Founder rollback on own cluster | Founder |

### 7.15 Skill Discovery (v2.1)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `GET` | `/api/clusters/:id/skills` | Get cluster skills tab entries | JWT |
| `POST` | `/api/clusters/:id/skills/:skillId/upvote` | Member upvote on proposed skill | JWT |
| `POST` | `/api/clusters/:id/skills/:skillId/comment` | Member comment on proposed skill | JWT |
| `GET` | `/api/admin/skills/proposals` | Admin: pending skill proposals queue | Admin |
| `POST` | `/api/admin/skills/:id/approve` | Admin: approve skill proposal | Admin |
| `POST` | `/api/admin/skills/:id/reject` | Admin: reject skill proposal | Admin |
| `POST` | `/api/admin/skills/:id/defer` | Admin: defer skill proposal | Admin |

### 7.16 Agent Collaboration Chatbox (v2.2)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `GET` | `/api/clusters/:id/chatbox` | Full chatbox history (paginated, never deleted) | JWT |
| `GET` | `/api/clusters/:id/chatbox/latest` | Latest exchange — for panel preview | JWT |
| `PUT` | `/api/clusters/:id/chatbox/view` | Mark exchanges as viewed (updates `agent_chatbox_views.last_viewed_exchange`) | JWT |
| `PUT` | `/api/clusters/:id/chatbox/minimize` | Toggle minimized state for the requesting user (per-device persistence) | JWT |

### 7.17 Cluster Features Tab (v2.2)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `GET` | `/api/clusters/:id/features` | Features tab — grouped by status (`live` → `in_testing` → `scheduled` → `approved` → `proposed`). Excludes `rejected` (admin-only). | JWT |
| `GET` | `/api/clusters/:id/features/:featureId` | Single feature with comments | JWT |
| `POST` | `/api/clusters/:id/features/:featureId/upvote` | Toggle upvote (idempotent insert/delete) | JWT |
| `POST` | `/api/clusters/:id/features/:featureId/comment` | Add comment | JWT |

### 7.18 @Sage Mention (v2.2)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `POST` | `/api/sage/mention` | Trigger @Sage response. Validates the mention, dispatches `SageAtMentionResponse` to `clio-high` lane. SLA: 30 seconds from mention to Timeline post. | JWT |

> **Internal pipeline:** Step 0 — feature signal check (async, does not delay response). Step 1 — deduplication check (similarity ≥ 0.85 → point to past, ≥ 0.70 → augment, < 0.70 → fresh). Step 2 — generate and post response. See `sage/SAGE_ANCHOR_PROTOCOL.md` §4.2.

### 7.19 Admin: Cluster Features (v2.2)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `GET` | `/api/admin/clusters/:id/features` | Full admin view (includes `rejected` and source attribution) | Admin |
| `POST` | `/api/admin/features/:featureId/approve` | Approve feature → status moves to `approved` (member-visible) | Admin |
| `POST` | `/api/admin/features/:featureId/reject` | Reject with reason (logged to `admin_decision_note`) | Admin |
| `PUT` | `/api/admin/features/:featureId/status` | Update status (`scheduled` / `in_testing` / `live` with optional `scheduled_eta`) | Admin |
| `DELETE` | `/api/admin/features/:featureId/rollback` | Rollback an immediate activation (rare; logged) | Admin |

### 7.20 Admin: Agent Chatbox Override (v2.2)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `PUT` | `/api/admin/clusters/:id/chatbox/pause` | Pause chatbox exchanges for this cluster (overrides cadence scheduler) | Admin |
| `PUT` | `/api/admin/clusters/:id/chatbox/resume` | Resume chatbox exchanges | Admin |
| `PUT` | `/api/admin/clusters/:id/chatbox/feature-activation` | Toggle Clio's authority to activate immediate features in this cluster (`{ enabled: boolean }`) | Admin |

---

## 8. Frontend State Management Design

### 8.1 Architecture

```
React Context (global auth/user state)
  └── @tanstack/react-query (server state, caching, optimistic updates)
       └── Supabase JS Client (direct reads, realtime subscriptions)
       └── Fastify API Client (writes, business logic, AI calls)
```

### 8.2 State Domains

| Domain | Manager | Source | Cache Strategy |
|--------|---------|--------|----------------|
| **Auth Session** | `AuthContext` | Supabase Auth SDK | In-memory + localStorage |
| **User Profile** | `useQuery('profile')` | `GET /api/profile/me` | Stale-while-revalidate, 5min |
| **Cluster List** (joined) | `useQuery('my-clusters')` | Supabase client direct read | Invalidate on join/leave |
| **Cluster Feed** | `useInfiniteQuery('feed', clusterId)` | `GET /api/clusters/:id/feed` | Paginated, prepend on new post |
| **Cluster Suggestions** | `useQuery('suggestions')` | `GET /api/clusters/suggestions` | Stale 10min, invalidate on dismiss |
| **DM Threads** | `useQuery('dm-threads')` | `GET /api/dm/conversations` | Realtime subscription overlay |
| **DM Messages** | `useInfiniteQuery('dm', threadId)` | Supabase Realtime + REST fallback | Live via WebSocket |
| **Clio Chat** | `useMutation` + local state | `POST /api/clio/chat` | Conversation stored locally during session |
| **Search Results** | `useQuery('search', filters)` | `GET /api/clusters/search` | No cache (always fresh) |
| **Notifications** | `NotificationContext` | FCM + in-app badge counter | Push events update badge |
| **Admin Data** | `useQuery('admin-*')` | Admin API endpoints | Short cache, manual refresh |

### 8.3 Realtime Subscriptions

```typescript
// DM live messages
supabase.channel('dm-messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'dm_messages',
    filter: `thread_id=eq.${threadId}`
  }, handleNewMessage)
  .subscribe()

// Cluster feed live updates
supabase.channel('cluster-feed')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'posts',
    filter: `cluster_id=eq.${clusterId}`
  }, handleNewPost)
  .subscribe()
```

### 8.4 Supabase Client Setup

```typescript
// apps/web/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@aggilo/supabase/types'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## 9. Implementation Phasing

> [!IMPORTANT]
> ### MASTER_INSTRUCTIONS_v2 — Canonical Architecture Standard
> This five-part document (Parts 1-5) constitutes **MASTER_INSTRUCTIONS_v2**, the sole authoritative architecture specification for the Aggilo platform. The stack is **React 18 + Node.js/Fastify + Supabase + BullMQ**. There is no Laravel, no PHP, no Python, no Flask, no Django, no "Yantra VPS" anywhere in this system. Any PRD, design doc, or prior instruction referencing those technologies is **permanently superseded** and must not influence implementation decisions. When in doubt, this document wins.

### Phase 1 — Project Scaffold & Tooling
**Goal**: Monorepo running with empty shells for both apps.

1. Initialize Turborepo monorepo with `apps/web`, `apps/api`, `packages/shared`, `packages/supabase`
2. Set up `apps/web` with Vite + React + TypeScript (strict mode)
3. Set up `apps/api` with Fastify + TypeScript (strict mode)
4. Configure shared tsconfig paths
5. Create `.env.example` with all variables documented
6. Add ESLint + Prettier configs

**Verify**: `npm run dev` starts both apps. `npm run build` succeeds with zero errors. `npx tsc --noEmit` passes in both apps.

---

### Phase 2 — Supabase Database Schema
**Goal**: All tables created with RLS policies active.

1. Create Supabase project (or local via `supabase init`)
2. Write migration files `001` through `021` per the schema in Part 2 (§5.1, §5.1.1, §5.1.2, §5.1.3)
3. Apply migrations: `supabase db push` or `supabase migration up`
4. Create `019_rls_policies_v2.sql` enabling RLS on ALL tables (including Sage, Observer, Tools tables from migrations 013-018). Migration `020_agent_architecture_layer.sql` carries its own RLS policies (chatbox, features). Migration `021_observer_stewardship.sql` carries Phase 1 RLS policies for the seven Observer Stewardship tables.
5. Write `seed.sql` with initial `llm_routing_config` rows (12 operations)
6. Generate TypeScript types: `supabase gen types typescript > packages/supabase/types/database.ts`

**Verify**: `supabase db push` succeeds. Run `SELECT tablename FROM pg_tables WHERE schemaname='public'` — confirm 30+ tables. Run `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public'` — all show `true`.

---

### Phase 3 — Auth Flow (End-to-End)
**Goal**: User can send OTP, verify, create profile, and hit authenticated API.

1. Implement Supabase Auth client in React (`useAuth` hook)
2. Build onboarding screens: Phone input → OTP verify → Profile creation (YoB, gender, language, nickname, tags)
3. Implement Fastify JWT verification plugin (validate against Supabase JWKS)
4. Create `POST /api/profile/create` and `GET /api/profile/me` routes
5. Implement `GET /api/nickname/check/:name` with basic uniqueness check
6. [ASSUMPTION: AI nickname verification deferred to Phase 6 when LLM integration lands]

**Verify**: Complete registration flow in browser. JWT appears in network tab. `GET /api/profile/me` returns profile data. Invalid JWT returns 401.

---

### Phase 4 — Core Cluster CRUD
**Goal**: Create, search, join, leave clusters. AGGIL qualification gating works.

1. Implement `POST /api/clusters` with AGGIL settings
2. Implement `aggil-engine.ts` service: qualification check (gender → age → location → GPS)
3. Implement `POST /api/clusters/:id/join` with full qualification gating
4. Implement `POST /api/clusters/:id/leave`
5. Implement `GET /api/clusters/search` with text + AGGIL filters
6. Implement `GET /api/clusters/suggestions` (AGGIL-matched, ranked)
7. Implement cluster score calculation (U-shaped intentionality model)
8. Implement `POST /api/clusters/check-duplicate` (similarity detection)
9. Build React screens: Dashboard (Explore tab with cluster cards), Cluster detail page, Search

**Verify**: Create a cluster. Search finds it. A user with matching AGGIL can join. A user with non-matching gender/age CANNOT see it (returns empty). Cluster score calculates correctly for hyper-narrow and fully-open inputs.

---

### Phase 5 — Timeline & Content
**Goal**: Posts, comments, likes work. Timeline renders.

1. Implement `POST /api/clusters/:id/posts` (text + image URL)
2. Implement `GET /api/clusters/:id/feed` (paginated, newest-first)
3. Implement `POST /api/posts/:id/like` (toggle)
4. Implement `POST /api/posts/:id/comment`
5. Implement `POST /api/posts/:id/report` (creates report row)
6. Build React components: PostCard, CommentThread, CreatePost FAB, Timeline feed
7. Set up Supabase Realtime subscription for live feed updates
8. Implement offline draft persistence (localStorage)

**Verify**: Create post → appears in feed. Like toggles correctly. Comment appears in thread. Realtime: open two tabs, post in one → appears in other.

---

### Phase 6 — Sage Cluster Intelligence
**Goal**: Sage active in every cluster from creation, posting curated content from Atlas.

1. Implement `sage.ts` service: context assembly, persona resolution, content curation
2. Create `sage_personas` table and persona resolution logic (3 priority sources: Clio tone signals → cluster purpose → observe-and-create)
3. Implement `system_sage` author type in posts table
4. Implement Sage posting to Timeline with daily limit enforcement (2 posts/day per cluster)
5. Implement `SagePostsDailyReset` worker (midnight — resets `sage_posts_today` on all clusters)
6. Implement `SageFirstPostAck` worker (acknowledge first organic post within 60s, 1 sentence)
7. Implement `SageMilestoneMessage` worker (10-member milestone message)
8. Integrate with Atlas pipeline: Atlas → Sage → Timeline (stub Atlas initially with seed data)
9. Implement description refinement flow: Sage proposal → Clio privacy gate → founder approval via FAB
10. Implement one-time Sage introduction beat in Clio (on first cluster join, `sage_introduced` boolean)
11. Build Sage API endpoints: `GET /api/sage/:clusterId/persona`, `GET /api/sage/:clusterId/status`, description proposal review
12. Build React: Sage avatar + identity in Timeline posts (40px, differentiated from user posts), Sage card component

**Verify**: Create a cluster → Sage persona resolves (check `sage_personas` table). Atlas-stubbed content arrives → Sage curates and posts under `system_sage`. Post appears in Timeline with Sage's 40px avatar. Daily limit blocks 3rd post. First organic post gets Sage acknowledgment within 60s. Description proposal appears for founder review.

---

### Phase 7 — Clio AI Integration
**Goal**: Clio conversational agent works with LLM routing.

1. Implement `llm-router.ts` service: reads `llm_routing_config`, routes to correct provider, handles fallback
2. Implement `clio.ts` service: context assembly (profile, clusters, history, register, arc beat, anti-patterns)
3. Set up BullMQ with 3 priority lanes (`clio-high`, `events-medium`, `scout-low`)
4. Implement `POST /api/clio/chat` endpoint
5. Implement `GET /api/clio/history`
6. Implement response logging to `response_logs` table
7. Build React Clio FAB component + chat panel with message bubbles
8. Implement AI nickname verification (now that LLM is available)
9. Implement user feedback buttons (👍/👎) on Clio responses

**Verify**: Send a message to Clio → receive contextual response. Check `response_logs` — row exists with correct `llm_provider`. Feedback buttons log rating. Queue dashboard shows jobs processing in correct lanes.

---

### Phase 8 — Direct Messages
**Goal**: Request/accept DM system with realtime messaging.

1. Implement `POST /api/dm/request` (with cluster context, 5/day limit)
2. Implement `POST /api/dm/respond` (accept/decline)
3. Implement `POST /api/dm/send` (message in accepted thread)
4. Implement `GET /api/dm/conversations` (requests + active threads)
5. Implement `POST /api/users/:nickname/block`
6. Implement DM abuse protection (30-day cooldown after decline, 3-decline permanent block)
7. Set up Supabase Realtime for live DM messages
8. Build React DM UI: thread list, message view, request cards

**Verify**: Send DM request → recipient sees it. Accept → thread opens. Send messages → appear in realtime. Decline → 30-day cooldown enforced. 6th request in a day → blocked.

---

### Phase 9 — Atlas, Scout & Observer
**Goal**: AI agents operate autonomously — Atlas content pipeline, Scout discovery, Observer passive monitoring.

1. Implement cluster arc state machine (A→B→C→D→E with regression)
2. Create `ClusterArcEvaluate` worker (every 6h)
3. Implement Atlas service: brief parsing, source crawling via Data Acquisition Layer (Part 1 §2.5), relevance scoring, hook generation
4. Create `AtlasBriefOnJoin` worker (60s delay after join)
5. Create `AtlasCrawlJob` worker (6h cycle)
6. Connect Atlas output → Sage curation pipeline (replacing Phase 6 stubs with real Atlas data)
7. Implement Scout service: segment crawling, topic scoring, auto-creation (≥90%)
8. Create Scout cron worker
9. Implement Observer service: 11 canonical observation domains per `observer/AGGILO_OBSERVER_AGENTS.md` (NOT Part 4 §16.2 — that section is superseded)
10. Create `ObserverCycle` worker (every 6h, `events-medium` lane)
11. Build admin Observer dashboard: findings list, domain filters, severity badges, action buttons

**Verify**: Join a cluster → 60s later, Atlas-sourced Sage post appears in Timeline under `system_sage`. After 72h silence, reengagement check runs. Scout worker completes a cycle — check `scout_discoveries` table. Observer cycle completes — check `observer_findings` table for domain 1-11 entries. `sage_posts_today` resets at midnight.

---

### Phase 9.5 — Observer Autonomous Stewardship (Phase 1)

**Goal**: Observer gains Channel 1 — autonomous prompt updates with veto window. Channel 2 (finding-and-approve from Phase 9) remains unchanged. Welfare always routes via Channel 2.

**Prerequisites**: Phase 9 done-criteria met. ≥14 days of clean Observer findings observed. Admin team comfortable with finding-and-approve flow.

**Canonical sources**:
- `architecture/PLATFORM_AGENCY.md` — three-layer agency model
- `observer/OBSERVER_STEWARDSHIP.md` — mechanics, DB schema, validation layer
- `observer/OBSERVER_INTROSPECTION_ENGINE.md` — priority queue, five-dimension evaluation prompt, minimality test

**Implementation steps:**

1. Apply migration `021_observer_stewardship.sql` (see Part 2 §5.1.3) — 7 new tables + `cluster_config` extensions
2. Implement `observer-introspection-cycle.ts` worker:
   - Priority queue scoring (admin override + trajectory + health + recency + fairness)
   - Five-dimension evaluation prompt (purpose / demographic / prompt quality / engagement / improvement potential)
   - Cold-start mode for new clusters (<7 days, <5 posts)
   - Daily budget enforcement (5 deep / 15 standard / 30 light)
3. Implement `observer-prompt-steward.ts`:
   - `executePromptUpdate()` with Tier 1 (immediate) and Tier 2 (staged) paths
   - `handleAdminVeto()` with rollback and Tier 3 escalation
   - `closeVetoWindow()` scheduled job
   - Optimistic locking on `cluster_config.prompt_version`
4. Implement Platform Rules validation layer (`validateAgainstPlatformRules()`) enforcing 9 rules
5. Implement minimality test (rule-based + LLM check for complex changes)
6. Implement early warning rollback (48h check — auto-rollback if 2+ negative signals)
7. Implement outcome tracking (7-day signal → `observer_learnings` + suppressed actions)
8. Update Clio builder (`src/lib/prompts/clio-builder.ts`) to read `clio_observer_signals` into Layer 4
9. Update Clio session-end handler to write to `clio_cluster_intelligence` (PII-free summary)
10. Build admin dashboard Observer Stewardship section (4 tabs: Pending / Committed / Vetoed / Outcome tracking)
11. Build founder-scoped Observer view in per-cluster admin dashboard
12. Implement Priority Controls panel (urgent/elevated/normal/low/paused per cluster)
13. Implement Quiet Hours configuration UI
14. Add new admin onboarding grace period (30 days — auto-promote Tier 1 to Tier 2)

**BullMQ jobs added**:
- `ObserverIntrospectionCycle` (low lane, per priority band: 6h/12h/24h/72h)
- `ObserverVetoWindowClose` (medium lane, 30min after Tier 1 commit)
- `ObserverEarlyWarningCheck` (low lane, 48h after commit)
- `ObserverOutcomeTracking` (low lane, 7 days after commit)

**Verify**:
- Force a "stalled cluster" scenario (mock Phase B for 18 days, declining engagement)
- Observer introspection cycle runs → produces a Tier 1 update proposal
- Platform Rules validation passes → minimality test passes → update applied
- Admin sees the update in Observer Stewardship dashboard with 30-min countdown
- **Test veto path**: admin clicks veto → update rolls back → Tier 3 finding created
- **Test no-veto path**: 30 minutes pass → update commits → 48h early warning scheduled → 7-day outcome scheduled
- **Test conflict detection**: admin edits the same prompt during the veto window → Observer's update rejected with `conflict_detected`
- **Test welfare exclusion**: Observer never proposes welfare-related updates (validation rejects)
- **Test slider ceiling**: Set cluster involvement to "Min" → Observer cannot propose updates that would increase Sage activity
- Welfare findings continue to route only via Channel 2 (no autonomy)

---

### Phase 10 — Moderation, Notifications & Admin
**Goal**: Content safety, push notifications, and admin dashboard.

1. Implement moderation engine: AI severity classification (low/medium/high/critical/CSAM)
2. Implement auto-ban for high-risk content
3. Implement passive safety sampling (6h cron, keyword hash scan)
4. Implement FCM integration: device registration, notification dispatch
5. Implement batching rules (1 push/cluster/hour, daily digest for joins)
6. Implement quiet hours enforcement
7. Implement notification preferences API
8. Build admin dashboard: metrics, moderation queue, user management, cluster management
9. Build Persona Lab UI (list, review, approve/activate personas)
10. Build LLM routing admin UI (routing table, A/B testing, cost dashboard)

**Verify**: Report a post → appears in admin queue. High-risk content → auto-ban fires. Push notification received on device after new post. Admin can approve persona, update LLM routing. Passive sampling runs without errors.

---

### Phase 11 — Premium, Payments & Premium Clusters
**Goal**: Subscription flow, matchmaker, and "Make Your Crowd" application.

1. Implement Razorpay order creation + webhook verification
2. Implement Google Play purchase verification
3. Implement subscription lifecycle (active → grace → cancelled)
4. Implement premium guard middleware (checks `premium_status`)
5. Implement matchmaker chat (Clio with `premium_matchmaker` skill)
6. Implement questionnaire creation + dispatch + response
7. Implement private premium cluster creation
8. Build "Make Your Crowd" application form (5-step Clio-guided)
9. Implement credibility evaluation scoring
10. Implement Premium Cluster founder admin rights (remove member, delete content, pin, mute)
11. Build React premium upgrade flow, matchmaker chat, founder admin panel

**Verify**: Complete Razorpay test payment → `premium_status` updates to `active`. Access matchmaker chat → works. Access without premium → 403. Submit "Make Your Crowd" form → appears in admin review queue. Approved founder can remove member, delete post.

---

### Phase 12 — Genesis Engine (added 2026-06-05)

**Goal**: Automated cluster spec generation, validation, and post-launch monitoring with token budget enforcement.

**Prerequisites**: Phase 6 (Sage) and Phase 9 (Observer) done-criteria met.

1. Implement `cluster_intent_responses` ingestion (free-text founder description)
2. Implement Genesis Engine Cycle A — deep LLM inference from free-text description: `inferred_composition`, `stakeholders`, `feature_spawn_candidates`, `vibe_characterization`, `cluster_spawn_risk`, `agent_maturity`
3. Implement introspection validation against platform rules
4. Implement `cluster_genesis_spec` storage in `cluster_specs` JSONB (includes per-recipient `soul_manifestation_profile` map)
5. Implement Cycle B — live cluster state diff vs. spec, auto-remediate low-risk gaps
6. Implement feature pre-spawn: auto-instantiate features with `probability >= 0.70` and `auto_spawn: true`
7. Implement post-launch monitoring: continuous signal detection with urgency tiers (Tier 1–4), composition inference, format coherence check
8. Implement token budget enforcement: Standard (52K/6), Elevated (104K/12), Maximum (156K/18)
9. Implement `cluster_token_budget_log` with promotion/demotion audit trail
10. Implement admin dashboard "Cluster Spec" view + approval flow + composition visualization
11. Implement `vibe_characterization` extraction and composer capability mapping (per-recipient)

**Verify**: Founder writes description → Genesis Engine infers full spec → admin reviews → approves → cluster created with pre-spawned features and per-recipient UI. Budget exhaustion triggers dashboard alert.

---

### Phase 13 — Feature Signals (added 2026-06-05)

**Goal**: Organic member need capture with k-anonymity privacy protection and Observer governance.

**Prerequisites**: Phase 7 (Clio) and Phase 9 (Observer) done-criteria met.

1. Implement `feature_signals` table with `signal_type`, `scope`, `feature_hash`
2. Implement Clio organic capture: records needs during natural conversation (never solicits)
3. Implement Sage inference capture: cluster-wide pattern detection
4. Implement k-anonymity aggregation gate: individual signals invisible; only aggregated (freq ≥ 3 OR cluster ≥ 8 members) surfaced
5. Implement Observer Domain 11 monthly review: compliance check, no rule violation, no protocol disclosure
6. Implement CIM intake: approved signals feed into Cluster Intelligence Modules
7. Implement admin dashboard "Feature Signals" panel with aggregation view
8. Implement deduplication via `feature_hash` + 30-day rolling window

**Verify**: Member asks Clio for a feature in chat → signal captured → aggregated after threshold → appears in admin panel → Observer approves → CIM evaluates.

---

### Phase 14 — Platform Tools Registry (added 2026-06-05)

**Goal**: Global tool library with cluster-scoped enablement, auto-promotion, and soft retirement.

**Prerequisites**: Phase 9 (Observer) done-criteria met.

1. Implement `platform_tools` catalog table: name, description, category, cost_tier, promotion_threshold, deprecation_date
2. Implement `cluster_tool_enablements` junction table
3. Implement Observer auto-promotion: when ≥ N clusters independently enable a tool, Observer proposes global promotion
4. Implement admin veto on auto-promotion (48-hour window)
5. Implement tool versioning: major/minor version, breaking-change flag
6. Implement soft retirement: 90-day deprecation notice → disable by default → hard remove
7. Implement admin dashboard "Tools" panel: enable/disable per cluster, override global defaults
8. Implement cost tracking per tool per cluster

**Verify**: New tool added to catalog → 3 clusters enable it → Observer proposes global promotion → admin approves → tool promoted to default-enabled.

---

### Phase 15 — Admin Dashboard Help & Prompt Refinement (added 2026-06-05)

**Goal**: Source-of-truth for all admin-facing UI copy, tooltips, and help text. Plus prompt refinement priority/quota tracking.

**Prerequisites**: Phase 10 (Moderation) done-criteria met.

1. Implement `docs/ADMIN_DASHBOARD_HELP.md` as the canonical copy source
2. Implement Help Panel component: renders markdown from help document per dashboard section
3. Implement Tooltip system: all dashboard tooltips pull from `ADMIN_DASHBOARD_HELP.md`
4. Implement `cluster_prompt_audit` table: human-readable summaries, impact tracking, rollback
5. Implement Prompt History sub-tab: agent, aspect, direction, trigger, 7-day impact
6. Implement Pool B quota display: "X deep / Y standard remaining"
7. Implement rollback within 30 days (cluster admin) or any time (platform admin)
8. Implement Request Review button: triggers immediate Observer introspection (consumes 1 deep)
9. Implement veto window: 30-minute auto-rollback on Tier 1 changes

**Verify**: Dashboard tooltip renders from help doc → admin triggers review → Observer introspection runs → result appears in history → admin rolls back → prompt restored.

---

## 10. Critical Decisions & Flags

> [!IMPORTANT]
> Items marked **[PERMANENT]** are final architectural decisions under MASTER_INSTRUCTIONS_v2. They are not assumptions to revisit — they are settled.

| # | Decision | Impact |
|---|----------|--------|
| 1 | [ASSUMPTION: Deployment targets are Vercel (React), Railway (Node), Supabase Cloud] | Change if using different hosting |
| 2 | [ASSUMPTION: SMS OTP provider is not specified — using Supabase Auth phone provider or Twilio] | Needs provider selection |
| 3 | **[PERMANENT]** The entire backend is **Node.js/Fastify + TypeScript**. There is no Laravel, no PHP, no Python, no Flask, no Django in this system. All PRDs referencing those technologies are permanently superseded by this document (MASTER_INSTRUCTIONS_v2). | Stack is final — no migration path back |
| 4 | **[PERMANENT]** The "Yantra VPS" concept is replaced by **Node.js BullMQ workers on Railway**. AI orchestration is Node-native. There is no separate Python/VPS AI service. | AI architecture is final |
| 5 | **[PERMANENT]** External data retrieval uses a **tiered Data Acquisition Layer** (Part 1 §2.5): Structured APIs → Search API proxies (SerpApi/Serper) → Managed scraping APIs (Firecrawl/BrightData). Direct Puppeteer/Playwright crawling from server IPs is architecturally prohibited. The "Open Claw" headless browser concept is eliminated. | Scout/Atlas data retrieval is final |
| 6 | [ASSUMPTION: ClickHouse for behavioural events (mentioned in PRD 08) is deferred — using Supabase Postgres with time-series partitioning initially] | Scale decision for later |
| 7 | **[PERMANENT]** Clio persona files (SOUL.md, IDENTITY.md) are stored in Supabase DB (`persona_files` table), not filesystem. Railway has no persistent filesystem. | No file-based persona storage |
| 8 | [ASSUMPTION: Phase 1 = mobile-first PWA only. No desktop-optimized layouts.] | Per PRD explicit constraint |
| 9 | [ASSUMPTION: Premium features are built but hidden until ~100k users per PRD 05] | UI gating required |
| 10 | [ASSUMPTION: AI nickname verification uses the same LLM router — operation key `nickname_check`] | Lightweight LLM call |
| 11 | **[PERMANENT]** Sage is Clio's subordinate, active from cluster creation. Clio is personal/FAB-only and never posts to the cluster Timeline. All cluster-level intelligence (posting, reengagement, content curation) is delegated to Sage. | Agent hierarchy is final |

---

## 11. Final Instructions to Coding Agent

1. **Read all five parts** (MASTER_INSTRUCTIONS_v2: Parts 1-5) before generating any file.
2. **Generate `.env.example` first** — it documents every external dependency.
3. **TypeScript strict mode everywhere** — `"strict": true` in all tsconfig files.
4. **Every table gets RLS** — no exceptions. Test with anon key to confirm policies work.
5. **Every API route gets Fastify schema validation** — use TypeBox for request/response schemas.
6. **Mobile-first CSS** — all components designed for 375px viewport minimum. No desktop-first layouts.
7. **Follow the phase order** (Phases 1-11) — each phase builds on the previous. Do not skip ahead.
8. **Each phase ends with the stated verification** — run the command/test before proceeding.
9. **Flag any assumption** you make as `[ASSUMPTION: ...]` in code comments.
10. **All secrets via `.env`** — never hardcode API keys, URLs, or credentials.
11. **No legacy stack references** — if you encounter PRD content mentioning Laravel, PHP, Python, Flask, Django, or "Yantra VPS", ignore it entirely. MASTER_INSTRUCTIONS_v2 (this document) is the sole authority.
