# Aggilo Social — Master Coding Agent Prompt
## Version 3.0 · Definitive Reference

> **For:** AI Coding Agent (Claude Code or equivalent agentic system)
> **Authority:** This prompt supersedes all previous master prompts. Where this document and any prior prompt conflict, this document wins.
> **Mode:** Ask questions until you have 100% confidence before executing any phase. Do not assume. Do not proceed past Phase 0 until all blocking questions in that phase are resolved.
> **Zero tolerance:** If you are about to touch a PRD file, stop. If you are about to write Laravel code, stop. If you see "Yantra" about to appear in new documentation, stop. These are the three hard stops in this project.

---

## Stack — Confirmed, Non-Negotiable

```
Main Platform:
  Frontend:   React 18 + Vite (PWA, mobile-first, TypeScript strict)
  Backend:    Node.js + Fastify (TypeScript strict)
  Database:   Supabase (PostgreSQL + Auth + Realtime + RLS)
  Queue:      BullMQ (Redis-backed, 3 priority lanes)
  Deployment: Vercel (React PWA) + Railway (Node API) + Supabase Cloud

MVP (Sisters in Dua) — Isolated Exception:
  Framework:  Next.js 14 (App Router) — self-contained in /phase0/mvp/ only
  Database:   Supabase (same project, separate tables)
  Stack rule: NEVER import from apps/api/ into /phase0/mvp/. NEVER use Fastify
              or BullMQ patterns inside /phase0/mvp/. The MVP is its own world.
```

**What does not exist in this project:**
- Laravel / PHP / Artisan / Composer / Laravel Horizon → zero occurrences allowed in any new or updated document
- "Yantra" as a term in new documentation → the concept lives on as BullMQ workers + Node services; the name is retired
- Two separate Clio chat modes → superseded by the unified presence model
- Sage as "Host" → she is the cluster "Anchor"

---

## Expert Personas — Active Throughout This Session

Switch persona explicitly at the start of each section. Never blend.

| Persona | Domain |
|---------|--------|
| **Principal Software Architect** (TypeScript, Node.js, Fastify, Supabase, Redis, BullMQ) | All backend decisions, API design, queue architecture |
| **Senior Full-Stack Engineer** (React 18 + Vite PWA, Next.js for MVP) | Implementation, component architecture, Supabase client patterns |
| **AI Systems Engineer** (LLM orchestration, BullMQ workers, agent prompt architecture) | Clio + Sage integration, job dispatch, context assembly |
| **UX Engineer** (mobile-first PWA, microinteractions, accessibility, real-time UX) | Frontend behaviour, loading states, animation |
| **Technical Documentation Lead** (Markdown, Mermaid, cross-reference integrity) | Doc structure, HTML parity, cross-references |
| **Information Architect** (folder structure, naming, consistency) | File placement, naming conventions, document hierarchy |

---

## Phase 0 — Read Everything Before Acting

Read every file completely. No skimming. No acting until Phase 0 is fully complete.

### 0.1 Reading Order

**Round 1 — Platform Foundation (Read-Only Reference — Do NOT modify these):**
```
AGGILO_SOUL.md
AGGILO_PLATFORM_RULES.md
CLAUDE.md
/PRD/00_prd_index.md          ← Read for context. Do NOT modify. Ever.
/PRD/01_registration_onboarding.md
/PRD/02_cluster_creation.md
/PRD/03_cluster_discovery.md
/PRD/04_in_cluster_experience.md
/PRD/05_premium_ai_matchmaker.md
/PRD/06_ai_agents.md
/PRD/07_moderation_admin.md
/PRD/08_data_strategy.md
/PRD/09_admin_platform.md
/PRD/10_atlas_agent.md
/PRD/11_llm_admin_routing.md
/PRD/12_premium_clusters.md
/PRD/premium_cluster_manager.md
```

> [!IMPORTANT]
> PRD files are frozen. They contain Laravel references that do not match the implemented stack. This is a known discrepancy — the architecture parts (Round 2) are the authoritative technical source. PRD files describe WHAT the product does. Architecture parts describe HOW it is built. You read PRDs to understand intent. You read architecture parts to understand implementation. You modify neither in Phase 0.

**Round 2 — Architecture (Authoritative Technical Source):**
```
/architecture/system_implementation_prompt_part1.md
/architecture/system_implementation_prompt_part2.md
/architecture/system_implementation_prompt_part3.md
/architecture/system_implementation_prompt_part4.md
/architecture/system_implementation_prompt_part5.md
/architecture/system_implementation_prompt_part6.md   ← Read this LAST in Round 2
                                                         It supersedes parts 1–5 where they conflict

/architecture/PLATFORM_AGENCY.md                      ← NEW: Three-layer platform agency model
                                                         Read before implementing Observer
/architecture/AGENT_COMMUNICATION_CONTRACT.md         ← NEW: Six communication patterns,
                                                         corrected Observer hierarchy
/architecture/AGENT_RUNTIME.md                        ← NEW: Runtime layer, Phase 1 jobs
/architecture/REALTIME_ENGAGEMENT_LAYER.md            ← NEW: Real-time signal contracts
```

> [!IMPORTANT]
> Part 4 §16 (Observer domains) is **superseded**. Do not implement
> Observer from Part 4. The canonical Observer sources are in Round 3
> below.

**Round 3 — Current Agent Configuration:**
```
/clio/SOUL.md
/clio/AGENTS.md
/clio/MEMORY.md
/clio/USER.md
/clio/clio_character_prompt.md
/clio/clio_overlay_prompt.md
/clio/skills/atlas_orchestration/SKILL.md
/clio/skills/connection_intro/SKILL.md
/clio/skills/sage_coordination/SKILL.md
/clio/skills/sage_introduction/SKILL.md
/clio/skills/waitlist_form/SKILL.md
/clio/personas/campus_18_24/IDENTITY.md
/clio/personas/momentum_25_35/IDENTITY.md
/clio/personas/anchor_36_50/IDENTITY.md
/clio/personas/explorer_13_17/IDENTITY.md

/sage/SOUL.md
/sage/AGENTS.md
/sage/SAGE_SKILLS.md
/sage/sage_character_prompt.md
/sage/skills/cluster_description_refinement/SKILL.md
/sage/skills/scripture_current_affairs/SKILL.md

/atlas/AGENTS.md
/atlas/SOUL.md
/atlas/skills/cluster_pulse/SKILL.md

/scout/AGENTS.md
/scout/SOUL.md

/observer/AGGILO_OBSERVER_AGENTS.md   ← CANONICAL Observer spec (10 domains, finding lifecycle)
/observer/OBSERVER_STEWARDSHIP.md     ← NEW: Autonomous stewardship mechanics (Phase 1)
/observer/OBSERVER_INTROSPECTION_ENGINE.md  ← NEW: Introspection prompt, priority queue (Phase 1)

/phase0/clusters/the_single_source/CLUSTER_DESCRIPTION.md
/phase0/clusters/the_single_source/CLUSTER_TOOLS.md
/phase0/clusters/the_single_source/CLIO_ONBOARDING.md
/phase0/clusters/the_single_source/SAGE_PERSONA.md
/clusters/CLUSTER_TOOLS_TEMPLATE.md
```

**Round 4 — Existing Docs (Current State):**
```
/docs/MASTER_INSTRUCTIONS.md
/docs/CLIO_SAGE_HANDOFF.md
/docs/CLIO_AMBIENT_PROTOCOL.md
/docs/AGGILO_ONBOARDING_PLAYBOOK.md        ← v1, being superseded
/docs/SOUL_INJECTION_MAP.md
/docs/SPEC_ADDENDUM.md
/docs/PRE_FLIGHT_AUDIT.md
/docs/PRODUCTION_FIXES.md
/docs/AGGILO_SYSTEM_DIAGRAM.mermaid
/docs/brand/brand_guidelines.md
/docs/brand/brand_positioning.md
/maintenance/README.md
/maintenance/templates/TOOL_PROPOSAL_TEMPLATE.md
```

**Round 5 — New Documents (Added This Session — To Be Incorporated):**

These are the new operational documents generated in this planning session. They are currently in `/docs/` but many need to move to agent-specific folders. Read them all before deciding placement.

```
/docs/AGGILO_ONBOARDING_PLAYBOOK_V2.md        ← Supersedes v1
/docs/CLUSTER_SKILL_DISCOVERY_PROTOCOL.md
/docs/CLIO_CLUSTER_HOST_CONTEXT.md
/docs/CLIO_PRIVATE_EPHEMERAL_CHAT.md          ← Partially superseded
/docs/CLIO_UNIFIED_CLUSTER_PRESENCE.md        ← Supersedes in-cluster chat section of above
/docs/SAGE_ANCHOR_PROTOCOL.md
/docs/SAGE_FEATURE_INTELLIGENCE.md
/docs/AGENT_COLLABORATION_CHATBOX.md
/docs/CLUSTER_FEATURES_TAB.md
/docs/CLUSTER_UI_MICROINTERACTIONS.md
```

**Round 6 — Landing Pages:**
```
/launch/landing/index.html
/launch/global_landing/index.html
/launch/webm/resting01_transparent.webm     ← Shared asset (confirmed deduplicated)
/launch/webm/resting02_transparent.webm
/launch/webm/Resting_to_empathy_transparent.webm
```

**Round 7 — Screen Prompts:**
```
/Revised_Screen_Prompts/mobile_screen_prompts_phase1.md
```

**Round 8 — MVP (Next.js — Isolated Stack):**
```
/phase0/mvp/src/app/page.tsx
/phase0/mvp/src/app/layout.tsx
/phase0/mvp/src/app/cluster/page.tsx
/phase0/mvp/src/app/api/sage/route.ts
/phase0/mvp/src/app/auth/callback/route.ts
/phase0/mvp/src/components/AuthForm.tsx
/phase0/mvp/src/components/ClioWelcome.tsx
/phase0/mvp/src/components/ClusterFeed.tsx
/phase0/mvp/src/components/ClusterHeader.tsx
/phase0/mvp/src/components/ClusterShell.tsx
/phase0/mvp/src/components/PostCard.tsx
/phase0/mvp/src/components/PostComposer.tsx
/phase0/mvp/src/hooks/useRealtimePosts.ts
/phase0/mvp/src/lib/sage-prompt.ts
/phase0/mvp/src/lib/supabase-browser.ts
/phase0/mvp/src/lib/supabase-server.ts
/phase0/mvp/src/lib/types.ts
/phase0/mvp/src/middleware.ts
/phase0/mvp/supabase/schema.sql
/phase0/mvp/supabase/schema-fixed.sql
/phase0/mvp/supabase/seed-vault.sql
/phase0/mvp/ARCHITECTURE.md
/phase0/mvp/CONTINUE.md
/phase0/mvp/Sisters In Dua/sisters_in_dua_cluster_spec_v3.1.md
```

**Round 9 — Legacy Reference (Read for context, note deprecated terms):**
```
/yantra/YANTRA_BRIDGE_SPEC.md    ← "Yantra" is retired; patterns live on as BullMQ workers
/yantra/routing_table.json       ← Still valid routing data; name is legacy only
/yantra/README.md
```

---

### 0.2 What You Must Understand Before Any Phase Begins

State your understanding of each of these in writing before proceeding to Phase 1. If your answer is incomplete or incorrect, re-read the relevant documents.

**Understanding Test 1 — The Clio Unified Presence:**
State in 3 sentences: (1) Where Clio conversations are persistent vs ephemeral. (2) What the user sees differently when talking to Clio inside a cluster vs outside one. (3) What the term "two-Clio model" referred to and why it was eliminated.

**Understanding Test 2 — Sage as Anchor:**
State in 3 sentences: (1) Why "Host" was the wrong title. (2) What "Anchor" communicates that "Host" does not. (3) What changes in Sage's SOUL.md as a result of this reframe.

**Understanding Test 3 — The Agent Collaboration Chatbox:**
State in 4 points: (1) Where it appears in the cluster layout. (2) How its cadence is determined. (3) What the two agents' distinct perspectives are (Sage: cluster-level; Clio: individual-level). (4) What "wait-and-observe" means and when it is used.

**Understanding Test 4 — Feature Intelligence Protocol:**
State the four disqualifying conditions for a feature (Redundant, Rare, Unrealistic, Off-purpose) and what happens to a feature that fails any one of them.

**Understanding Test 5 — @Sage:**
State: (1) When Sage always responds. (2) What Sage checks FIRST before generating any @Sage response. (3) How deduplication works and why it exists.

**Understanding Test 6 — Bridge Message:**
State: When Sage sends a bridge message, what it says, and what it never says. Explain why "the founder has been notified" is prohibited.

**Understanding Test 7 — MVP Stack Isolation:**
State: What framework the MVP uses, what it does NOT use, and what would happen if someone imported a BullMQ worker into `/mvp/src/`.

---

## Phase 1 — Document Migration and Organisation

*Priority: FIRST. Do this before touching any code.*

**Expert persona: Information Architect + Technical Documentation Lead**

### 1.1 Document Placement Map

Execute these moves exactly. No document is deleted — things that are superseded are archived or updated with deprecation notes, not removed.

**Move to `/clio/` (agent-specific documents):**

| Source (current) | Destination | Action |
|-----------------|-------------|--------|
| `/docs/CLIO_CLUSTER_HOST_CONTEXT.md` | `/clio/CLIO_CLUSTER_HOST_CONTEXT.md` | Move |
| `/docs/CLIO_UNIFIED_CLUSTER_PRESENCE.md` | `/clio/CLIO_UNIFIED_CLUSTER_PRESENCE.md` | Move |
| `/docs/CLIO_PRIVATE_EPHEMERAL_CHAT.md` | `/docs/_archived/CLIO_PRIVATE_EPHEMERAL_CHAT.md` | Archive (superseded by CLIO_UNIFIED_CLUSTER_PRESENCE.md for in-cluster behaviour; Redis/welfare/admin sections remain valid — add deprecation header pointing to superseding doc) |

**Move to `/sage/` (agent-specific documents):**

| Source (current) | Destination | Action |
|-----------------|-------------|--------|
| `/docs/SAGE_ANCHOR_PROTOCOL.md` | `/sage/SAGE_ANCHOR_PROTOCOL.md` | Move |
| `/docs/SAGE_FEATURE_INTELLIGENCE.md` | `/sage/SAGE_FEATURE_INTELLIGENCE.md` | Move |

**Move to `/Revised_Screen_Prompts/` (UI/UX reference):**

| Source (current) | Destination | Action |
|-----------------|-------------|--------|
| `/docs/CLUSTER_UI_MICROINTERACTIONS.md` | `/Revised_Screen_Prompts/CLUSTER_UI_MICROINTERACTIONS.md` | Move |

**Stay in `/docs/` (platform-wide, cross-agent documents):**

| File | Action |
|------|--------|
| `/docs/AGGILO_ONBOARDING_PLAYBOOK_V2.md` | Keep in place; add deprecation notice to v1 |
| `/docs/CLUSTER_SKILL_DISCOVERY_PROTOCOL.md` | Keep in place |
| `/docs/AGENT_COLLABORATION_CHATBOX.md` | Keep in place |
| `/docs/CLUSTER_FEATURES_TAB.md` | Keep in place |

**Archive v1 Onboarding Playbook:**

Add this header to `/docs/AGGILO_ONBOARDING_PLAYBOOK.md`:

```markdown
> [!WARNING]
> **DEPRECATED — Superseded by AGGILO_ONBOARDING_PLAYBOOK_V2.md**
> This document (v1) is archived. All references should point to V2.
> Retained for historical context only.
```

Do NOT delete the v1 file. Move it to `/docs/_archived/AGGILO_ONBOARDING_PLAYBOOK_V1.md`.

### 1.2 Existing Agent Files — Required Updates

These files exist and must be updated in place (not replaced):

**`/sage/AGENTS.md` — Three updates required:**

1. **Loading order: Add three new entries after the current final step:**
```
[N+1]. /sage/SAGE_ANCHOR_PROTOCOL.md — title update (Anchor), soul reframe,
       @Sage protocol, deduplication rules, bridge message spec
[N+2]. /sage/SAGE_FEATURE_INTELLIGENCE.md — feature signal observation,
       48h evaluation cycle, four disqualifying conditions, joint evaluation
       protocol with Clio
[N+3]. /docs/CLUSTER_SKILL_DISCOVERY_PROTOCOL.md — Platform Capability skill
       category, visible Clio-Sage dialogue rules (Phase A/B), maturity threshold
```

2. **Title references: Replace every instance of:**
   - `"cluster host"` → `"cluster Anchor"`
   - `"Host"` (when referring to Sage's role) → `"Anchor"`
   - `"host mode"` → `"anchor mode"`
   - The rendered label `"Sage · Host"` → `"Sage · Anchor"`

3. **@Sage rule: Add to Sage's skill routing section:**
```
@SAGE MENTION PROTOCOL:
When a member @mentions Sage, Sage ALWAYS responds. This is unconditional.
Before generating the response:
  Step 0: Feature signal check (runs asynchronously — does not delay response)
    - Does this mention reveal a cluster-level need? Flag if yes.
  Step 1: Deduplication check (see SAGE_ANCHOR_PROTOCOL.md §4.2)
    - Similarity ≥ 0.85: point to past response
    - Similarity ≥ 0.70: augment past response
    - Similarity < 0.70: generate fresh response
  Step 2: Generate and post response (clio-high queue lane, SLA: 30 seconds)
```

**`/sage/SOUL.md` — Soul reframe:**

The core character is unchanged: grounded, specific, honest. The emotional register shifts from neutral delivery to warm delivery. Apply these changes:

1. In the tone/character section, add:
```
EMOTIONAL REGISTER (updated):
Sage speaks with warmth and hope. She does not perform these qualities —
they are present in the precision of her attention and in how she frames
what is difficult. When something cannot be done, she names what can.
When something is hard, she names what is possible alongside it.
She is not falsely positive — she does not promise outcomes she cannot
guarantee. But she leads with what is open, not what is closed.

The path to hope is always present in what she says. Not as decoration.
As orientation.
```

2. Replace any language describing Sage as "mostly silent by default" with:
```
Sage responds when there is something genuine and appropriate to say.
Silence is not her default — judgment is. She does not speak to fill space.
She speaks when a response would make the cluster better for the people in it.
```

3. Replace "Sage · Host" wherever it appears with "Sage · Anchor".

**`/clio/AGENTS.md` — Three updates required:**

1. **Loading order: Add new entries:**
```
[N+1]. /clio/CLIO_UNIFIED_CLUSTER_PRESENCE.md — unified chat model,
       in-cluster ephemeral storage, single FAB presence, context assembly,
       cluster-scoped conversation rules
[N+2]. /clio/CLIO_CLUSTER_HOST_CONTEXT.md — arc state machine,
       message budgets (three separate budgets), Atlas orchestration,
       skill dialogue participation, post formatting
[N+3]. /docs/CLUSTER_SKILL_DISCOVERY_PROTOCOL.md — cross-agent skill
       dialogue protocol, Platform Capability skill category
[N+4]. /docs/AGENT_COLLABORATION_CHATBOX.md — agent chatbox system prompt,
       cadence rules, feature activation authority
```

2. **Unified chat model — add to conversational behaviour section:**
```
UNIFIED PRESENCE RULE:
There is one Clio. She does not have a "cluster mode" and a "private mode."
What changes by context is conversation storage:
  - Outside a cluster: persistent (survives sessions)
  - Inside a cluster: ephemeral (12-hour deletion, Redis-stored content)

The FAB is in the TOP-RIGHT corner of cluster screens (not bottom-right).
Position: 40px circle, 16px from right edge, 8px below cluster top bar.
Tap → panel expands downward-leftward from Clio's position.
Panel header shows "Clio · Private" inside clusters (vs "Clio" outside).
Timer: "Clears in Xh Xm" — gray 11px, below conversation thread.
```

3. **Skill dialogue authority — add:**
```
AGENT CHATBOX ACTIVATION AUTHORITY:
Clio may activate immediate features (no development required) upon
reaching agreement with Sage in the agent collaboration chatbox.
Requires: no rule violations, no admin override flag set for this cluster.
Admin can override any activation from the dashboard.
```

**`/docs/CLIO_SAGE_HANDOFF.md` — Update:**

Add a section at the top:
```
> [!NOTE]
> The Clio-Sage handoff now includes two new dimensions:
> 1. Sage's title is "Anchor" (not "Host") — update all references
> 2. The handoff signal now also populates the agent collaboration chatbox
>    context (triggering_observation field) for the cluster's first chatbox
>    exchange. See /docs/AGENT_COLLABORATION_CHATBOX.md §5.2.
```

**`/AGGILO_PLATFORM_RULES.md` — Three targeted updates:**

1. Replace all `"cluster host"` / `"Host"` references to Sage with `"cluster Anchor"` / `"Anchor"`
2. In AI Agent Rules, add @Sage rule after the Clio Agent section:
```
### @Sage — Direct Member Interaction
| Rule | Detail |
|------|--------|
| **Always responds** | Any @Sage mention in a cluster always receives a response |
| **Feature-first evaluation** | Before responding, Sage evaluates whether the @mention reveals a cluster-level feature need (async — does not delay response) |
| **Deduplication** | Sage checks semantic similarity against past responses (90-day window) — points to past answer if similarity ≥ 0.85, augments if ≥ 0.70 |
| **@Sage tip** | A one-time dismissible tip is shown to new cluster members introducing the @Sage feature |
| **Queue priority** | @Sage responses use clio-high lane (SLA: 30 seconds) |
```

3. Add Agent Collaboration Chatbox section:
```
### Agent Collaboration Chatbox
| Rule | Detail |
|------|--------|
| **Visibility** | Fixed panel in every premium cluster, between compose bar and Timeline |
| **Minimizable** | Members can minimize; state persists per user per device |
| **Never deleted** | Chatbox history is permanent — it is cluster content and reference |
| **Cadence** | Maximum frequency by member count: <100 members=2h, <300=4h, <500=6h, <750=8h, <1000=10h, 1000+=12h |
| **Wait-and-observe** | Either agent may propose an observation period; this is valid and honest |
| **No welfare in chatbox** | Welfare signals are never discussed in the chatbox — handled privately |
```

### 1.3 `docs/MASTER_INSTRUCTIONS.md` — Full Document Inventory Update

Add all new documents to the inventory. Mark superseded documents. Update version references. This is the last thing done in Phase 1.

---

## Phase 2 — Architecture Parts Update

*Priority: SECOND. After Phase 1 is complete.*

**Expert persona: Principal Software Architect**

The five architecture parts describe the main platform (React + Node/Fastify + Supabase + BullMQ). The new documents from this session add significant new architecture. Update the parts to incorporate this. Do NOT rewrite parts wholesale — make targeted additions and corrections.

### 2.1 What Each Part Needs

**Part 1 (Architecture, Stack, Separation of Concerns):**

No structural changes needed. However, add a brief section at the end:

```
## New Agent Architecture Layer (Added Session 2026-05)

The following documents add operational detail to the agent layer.
They do not change the system's high-level design. Read them in
addition to Part 4 for complete agent architecture:

/clio/CLIO_UNIFIED_CLUSTER_PRESENCE.md
/clio/CLIO_CLUSTER_HOST_CONTEXT.md
/sage/SAGE_ANCHOR_PROTOCOL.md
/sage/SAGE_FEATURE_INTELLIGENCE.md
/docs/CLUSTER_SKILL_DISCOVERY_PROTOCOL.md
/docs/AGENT_COLLABORATION_CHATBOX.md
/docs/CLUSTER_FEATURES_TAB.md
/Revised_Screen_Prompts/CLUSTER_UI_MICROINTERACTIONS.md
```

**Part 2 (Database Schema, ER Diagram, Sequence Diagrams):**

Add these tables to the schema section. Every table must also appear in a new Supabase migration file:

```sql
-- Agent collaboration chatbox
CREATE TABLE agent_chatbox_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id),
  exchange_number INT NOT NULL,
  trigger_type VARCHAR(64),
  triggering_observation TEXT,
  sage_message TEXT,
  clio_message TEXT,
  sage_message_at TIMESTAMPTZ,
  clio_message_at TIMESTAMPTZ,
  features_proposed JSONB DEFAULT '[]',
  features_activated JSONB DEFAULT '[]',
  observe_mode BOOLEAN DEFAULT FALSE,
  observe_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
  -- NOTE: No TTL. This table is permanent. It is cluster content.
);

-- Per-user chatbox view tracking
CREATE TABLE agent_chatbox_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  cluster_id UUID NOT NULL REFERENCES clusters(id),
  last_viewed_exchange INT DEFAULT 0,
  minimized BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cluster_id)
);

-- Cluster features tab
CREATE TABLE cluster_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id),
  display_name VARCHAR(128) NOT NULL,
  display_description TEXT,
  feature_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) DEFAULT 'proposed',
  source VARCHAR(64),
  source_description VARCHAR(128),
  chatbox_exchange_id UUID REFERENCES agent_chatbox_exchanges(id),
  admin_decision_at TIMESTAMPTZ,
  admin_decision_note TEXT,
  scheduled_eta VARCHAR(64),
  activated_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  member_upvote_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cluster_feature_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES cluster_features(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feature_id, user_id)
);

CREATE TABLE cluster_feature_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES cluster_features(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skill discovery (extends existing sage_skills)
CREATE TABLE skill_dialogue_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id),
  post_id UUID NOT NULL REFERENCES posts(id),
  initiating_agent VARCHAR(16) NOT NULL,
  dialogue_type VARCHAR(32) NOT NULL,
  skill_candidate VARCHAR(128),
  skill_category VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cluster_skill_tab (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id),
  skill_id UUID REFERENCES sage_skills(id),
  display_name VARCHAR(128) NOT NULL,
  display_description TEXT,
  status VARCHAR(32) DEFAULT 'proposed',
  source_description VARCHAR(64),
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE skill_tab_member_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_skill_tab_id UUID NOT NULL REFERENCES cluster_skill_tab(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  signal_type VARCHAR(16) NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ephemeral chat sessions (metadata only — content in Redis)
CREATE TABLE clio_ephemeral_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  cluster_id UUID NOT NULL REFERENCES clusters(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  message_count INT DEFAULT 0,
  welfare_flagged BOOLEAN DEFAULT FALSE,
  welfare_escalated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);
```

**ALTER existing tables:**

```sql
-- clusters
ALTER TABLE clusters
  ADD COLUMN skill_dialogue_last_exchange_at TIMESTAMPTZ,
  ADD COLUMN skill_dialogue_internal_since TIMESTAMPTZ,
  ADD COLUMN compose_bar_placeholder TEXT,
  ADD COLUMN first_post_ack_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN milestone_10_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN chatbox_observe_until TIMESTAMPTZ,
  ADD COLUMN chatbox_last_exchange_at TIMESTAMPTZ;

-- posts
ALTER TABLE posts
  ADD COLUMN post_subtype VARCHAR(64),
  -- Values: host_content | arc_milestone | first_post_ack | reengagement |
  --         skill_dialogue | skill_dialogue_response | skill_dialogue_initiation |
  --         skill_activation | dialogue_transition |
  --         agent_chatbox_sage | agent_chatbox_clio |
  --         sage_bridge
  ADD COLUMN skill_dialogue_id UUID REFERENCES skill_dialogue_posts(id),
  ADD COLUMN sage_bridge BOOLEAN DEFAULT FALSE;

-- sage_skills
ALTER TABLE sage_skills
  ADD COLUMN skill_dialogue_post_id UUID,
  ADD COLUMN clio_response_post_id UUID,
  ADD COLUMN member_upvotes INT DEFAULT 0,
  ADD COLUMN member_comments INT DEFAULT 0,
  ADD COLUMN platform_capability_status VARCHAR(32);
  -- null | developer_queued | built | activated
```

**RLS Policies for new tables (add to migration file):**

```sql
-- agent_chatbox_exchanges: readable by cluster members only
CREATE POLICY "cluster_members_read_chatbox"
  ON agent_chatbox_exchanges FOR SELECT
  USING (cluster_id IN (
    SELECT cluster_id FROM cluster_members
    WHERE user_id = auth.uid() AND left_at IS NULL
  ));

-- cluster_features: readable by cluster members
CREATE POLICY "cluster_members_read_features"
  ON cluster_features FOR SELECT
  USING (cluster_id IN (
    SELECT cluster_id FROM cluster_members
    WHERE user_id = auth.uid() AND left_at IS NULL
  ));

-- clio_ephemeral_sessions: user reads own sessions only
CREATE POLICY "user_reads_own_sessions"
  ON clio_ephemeral_sessions FOR SELECT
  USING (user_id = auth.uid());
```

**Part 3 (API Design, State Management, Implementation Phasing):**

Add the following endpoint groups to Section 7:

```
Section 7.13 — Agent Chatbox
GET    /api/clusters/:id/chatbox                  Full chatbox history (paginated)
GET    /api/clusters/:id/chatbox/latest           Latest exchange (for panel preview)
PUT    /api/clusters/:id/chatbox/view             Mark exchanges as viewed (updates agent_chatbox_views)
PUT    /api/clusters/:id/chatbox/minimize         Toggle minimized state

Section 7.14 — Cluster Features Tab
GET    /api/clusters/:id/features                 Features tab (status: proposed/approved/scheduled/in_testing/live)
GET    /api/clusters/:id/features/:featureId      Single feature + comments
POST   /api/clusters/:id/features/:featureId/upvote     Toggle upvote
POST   /api/clusters/:id/features/:featureId/comment    Add comment

Section 7.15 — Clio Ephemeral Chat (In-Cluster)
POST   /api/clio/chat                             Unified endpoint — cluster_id present = ephemeral
GET    /api/clio/ephemeral/session                Session status (TTL, message count) — no content
DELETE /api/clio/ephemeral/session                User-initiated early deletion
POST   /api/clio/ephemeral/welfare                Internal: welfare escalation from ephemeral session

Section 7.16 — @Sage
POST   /api/sage/mention                          Trigger @Sage response (validates mention, dispatches job)

Section 7.17 — Admin: Features
GET    /api/admin/clusters/:id/features           Full admin view (includes rejected)
POST   /api/admin/features/:featureId/approve     Approve feature
POST   /api/admin/features/:featureId/reject      Reject with reason
PUT    /api/admin/features/:featureId/status      Update status
DELETE /api/admin/features/:featureId/rollback    Rollback immediate activation

Section 7.18 — Admin: Agent Chatbox Override
PUT    /api/admin/clusters/:id/chatbox/pause      Pause chatbox exchanges for this cluster
PUT    /api/admin/clusters/:id/chatbox/resume     Resume chatbox exchanges
```

**Part 4 (AI Agent Architecture):**

Add these sections at the end:

```
Section 22 — Clio Unified Cluster Presence

See /clio/CLIO_UNIFIED_CLUSTER_PRESENCE.md for full specification.
Summary for architecture reference:

Storage routing:
  - cluster_id present in /api/clio/chat → ephemeral mode
    Content: Redis key ephemeral:{session_id}:messages, TTL 43200s (12h)
    Metadata: clio_ephemeral_sessions table (Supabase)
  - cluster_id absent → persistent mode
    Content: clio_conversations table (Supabase)

FAB position change (cluster screens only):
  - Previous: bottom-right, 48px
  - New: top-right, 40px, 16px from edge, 8px below cluster top bar
  - This is a frontend-only change — no backend implications

Section 23 — Agent Collaboration Chatbox

See /docs/AGENT_COLLABORATION_CHATBOX.md for full specification.
Queue job summary:

AgentChatboxExchange       → events-medium  (scheduled cadence or event trigger)
AgentChatboxSageInitiation → events-medium  (Sage detects opportunity)
AgentChatboxClioInitiation → events-medium  (Clio detects opportunity)
AgentChatboxFeatureActivation → events-medium (immediate feature activated)
AgentChatboxObserveMode    → scout-low      (agents agreed to wait)

Cadence scheduler (runs every 30 minutes, checks per-cluster interval):
  member_count < 100:   2h interval
  member_count < 300:   4h interval
  member_count < 500:   6h interval
  member_count < 750:   8h interval
  member_count < 1000:  10h interval
  member_count >= 1000: 12h interval

Section 24 — Sage Feature Intelligence

See /sage/SAGE_FEATURE_INTELLIGENCE.md for full specification.
Queue job: SageFeatureEvaluation → events-medium, runs every 48h per cluster

Redis keys:
  sage:cluster:{cluster_id}:feature_signals → List, TTL 90 days
  sage:cluster:{cluster_id}:response_index  → Sorted set, TTL 90 days
  sage:cluster:{cluster_id}:response_count  → Counter, resets daily

Section 25 — @Sage Interaction

Queue: SageAtMentionResponse → clio-high lane
SLA: 30 seconds from @mention to Sage response appearing in Timeline

Deduplication:
  similarity >= 0.85 → point to past response
  similarity >= 0.70 → augment past response
  similarity < 0.70  → generate fresh response

Section 26 — Sage Bridge Message

Fires once per escalated thread when human has not responded within threshold.
Not a queue job — a Supabase edge function triggered by a pg_cron rule.
post_subtype: 'sage_bridge'
sage_bridge: true on the posts table row
Visual: amber left border (2px #D97706) in Timeline rendering
```

**Part 5 (any existing content) — Append:**

If Part 5 already has content, add a new section at the end. If it is empty or covers phasing, add implementation phases for the new features.

```
## Implementation Phases — New Agent Architecture (Session 2026-05)

### Phase A — Document Migration (No Code)
[Contents of prompt Phase 1]

### Phase B — Database Schema
Apply all new migrations. Test RLS policies with anon key.
Verify: SELECT tablename FROM pg_tables WHERE schemaname='public'
confirms all new tables present.

### Phase C — Core API Routes
Implement 7.13 through 7.18 in apps/api/src/routes/.
Each route gets Fastify TypeBox schema validation.
Stub routes acceptable for Phase C — full implementation in Phase D.

### Phase D — BullMQ Workers
AgentChatboxExchange worker — most complex, implement first.
SageFeatureEvaluation worker.
SageAtMentionResponse worker.
Clio ephemeral session management (Redis TTL enforcement).

### Phase E — Frontend
Agent chatbox panel component.
Features tab (new cluster tab).
Clio top-right position (cluster screens only — scope carefully).
@Sage tip + autocomplete.
Microinteractions per /Revised_Screen_Prompts/CLUSTER_UI_MICROINTERACTIONS.md.

### Phase F — MVP Update
[Contents of prompt Phase 3]
```

### 2.2 routing_table.json — Add New Operations

Add these operation keys to `/yantra/routing_table.json` (the file is valid; the "Yantra" folder name is the only legacy element):

```json
{
  "operation_key": "agent_chatbox_exchange",
  "operation_label": "Agent Collaboration Chatbox — Clio+Sage exchange generation",
  "agent": "clio+sage",
  "primary_llm": "kimi_k25",
  "fallback_llm": "groq_llama3",
  "latency_target_ms": 8000
},
{
  "operation_key": "sage_feature_evaluation",
  "operation_label": "Sage 48h feature intelligence evaluation",
  "agent": "sage",
  "primary_llm": "groq_llama3",
  "fallback_llm": "kimi_k25",
  "latency_target_ms": 15000
},
{
  "operation_key": "sage_at_mention",
  "operation_label": "Sage response to @Sage mention",
  "agent": "sage",
  "primary_llm": "kimi_k25",
  "fallback_llm": "groq_llama3",
  "latency_target_ms": 8000
},
{
  "operation_key": "sage_bridge_message",
  "operation_label": "Sage bridge message when human response delayed",
  "agent": "sage",
  "primary_llm": "kimi_k25",
  "fallback_llm": "groq_llama3",
  "latency_target_ms": 3000
}
```

---

## Phase 3 — Landing Page Updates

*Priority: THIRD. After Phase 2.*

**Expert persona: UX Engineer + Senior Full-Stack Engineer**

### 3.1 Both Landing Pages — Remove Sage References

Search both `/launch/landing/index.html` and `/launch/global_landing/index.html` for:
- The word "Sage" (all cases)
- "cluster host" (Sage-specific framing)
- Any description of an in-cluster AI agent that is not Clio

Remove or replace with general framing. Clio remains on both pages — she is the user-facing agent and appropriate for marketing. Sage operates inside clusters and is not a landing page concept.

### 3.2 Global Landing — Remove India-Specific Residue

Search for and evaluate every instance of:
- Indian city names (Hyderabad, Bangalore, Mumbai, etc.) → remove or make generic
- ₹ currency → remove entirely from global page
- Telugu, Hindi as the lead language examples → replace with "your language"
- UPI / Razorpay references → remove from public copy
- College/campus framing implying Indian higher education launch → make purpose-neutral

The global page tone shift: from warm-local-community to purposeful-intelligent-private. The promise of finding your people based on who you are, not where you live.

### 3.3 Shared WebM Assets

The three webm files have been deduplicated to `/launch/webm/`. Verify both landing pages reference `/launch/webm/` not their own local webm copies. If any local copies still exist in `/launch/landing/` or `/launch/global_landing/`, remove them.

---

## Phase 4 — Screen Prompts Update

*Priority: FOURTH. After Phase 3.*

**Expert persona: UX Engineer**

### 4.1 Clio Position Change — Cluster Screens

In `/Revised_Screen_Prompts/mobile_screen_prompts_phase1.md`, update the following screens:

**Screen 4.0 (Cluster Loading State), 4.1 (Timeline), 4.2 (Members), 4.3 (Messages Inbox), 4.4 (Post Composer), 4.5 (Cluster Info Sheet), 4.6 (Share Cluster Sheet):**

Replace all references to Clio FAB position from:
```
Clio FAB (48px) bottom-right, above nav
```
To:
```
Clio FAB (40px) top-right, 16px from edge, 8px below cluster top bar.
Fixed — does not scroll. Tap opens chat panel downward-leftward from Clio position.
Panel header: "Clio · Private" + timer. Minimize (—) + Close (X) both present.
```

Update all cluster screen layout ASCII diagrams to show Clio in top-right position within the cluster top bar row (but below it, not inside it).

### 4.2 New Cluster Screen Elements

Add to the cluster screen spec in `mobile_screen_prompts_phase1.md`:

**Agent Collaboration Chatbox panel (appears between compose bar and Timeline in cluster screens):**
```
Fixed panel. Background: #F0F9FF (light blue).
Border-left: 2px #0891B2 (teal).
Header: "🔵 Clio & Sage — Working on [Cluster Name]" + minimize [—] button.
Preview: last Sage message + last Clio response (3 lines each max).
Timestamp: "Xh ago · [See full discussion]"
"See full discussion" → full-screen bottom sheet (chronological history, never deleted).
Minimized state: single header line with new exchange count.
Default: expanded. User minimizes — state persists per device.
```

**Features tab (new third tab in cluster tab bar):**
```
Tab bar: [ Timeline ] [ Members ] [ Features ]
Features tab content: status-grouped feature cards.
Status groups: Live → In Testing → Scheduled → Approved → Proposed.
Feature card: name, one-line description, source, status badge, upvote + comment counts.
No link to agent conversation (admin-only link; members see source attribution only).
Empty state: "🌱 Nothing here yet. Sage and Clio are getting to know this community."
```

**@Sage tip bar:**
```
Appears below compose bar, above chatbox panel, on first cluster visit only.
Height: 40px. Background: #F0F9FF (same as chatbox).
Content: "💡 Use @Sage in your message to get her attention." + [Got it ✕]
Entry: slides up 2 seconds after Timeline first render.
Dismiss: permanent (never shown again).
```

### 4.3 Add Reference to Microinteraction Spec

Add at the top of `mobile_screen_prompts_phase1.md`:

```markdown
> [!NOTE]
> **Microinteraction and Motion Specification:**
> For all animation, motion, and interaction choreography for cluster-specific
> UI elements (Clio top-right overlay, agent chatbox, Features tab, @Sage, Sage
> Anchor presence), see:
> `/Revised_Screen_Prompts/CLUSTER_UI_MICROINTERACTIONS.md`
> That document is subordinate to this one for visual identity but takes
> precedence for motion and microinteraction behaviour.
```

---

## Phase 5 — Mobile Screen Prompts: Sage Label Update

In every screen that shows a Sage post card or Sage label in the Timeline:

Replace:
```
Label: "Sage · Host" (sage-green bold + gray)
```
With:
```
Label: "Sage · Anchor" (sage-green bold + gray)
```

This change appears in Screen 4.1 (Timeline) and in the global style prefix for Sage post cards.

---

## Phase 6 — MVP Implementation (Sisters in Dua)

*Priority: SIXTH — after all documentation and architecture phases are complete.*

**Expert persona: Senior Full-Stack Engineer (Next.js) + AI Systems Engineer**

> [!CRITICAL]
> The MVP uses **Next.js App Router** exclusively. Do not import from `apps/api/`. Do not use BullMQ. Do not use Fastify patterns. All API calls are Next.js App Router API routes (`/mvp/src/app/api/`). Supabase client patterns follow the existing `supabase-browser.ts` and `supabase-server.ts` patterns already in the codebase.

### 6.1 Study Current MVP State First

Before making any changes, document exactly what currently works:
- Which screens render successfully?
- Does magic link auth work end-to-end?
- Does the cluster feed render posts from Supabase?
- Does the Sage API route (`/app/api/sage/route.ts`) produce responses?
- What does `sage-prompt.ts` currently contain?
- Are there any TypeScript errors in the current build?
- Does `npm run build` succeed?

Write a brief status report and confirm with the user before proceeding.

### 6.2 Implementation Priority Order

Work in this exact order. Do not start an item until the previous is verified working.

**Priority 1 — Optimistic Post Submission**

The current `PostComposer.tsx` submits and waits for server confirmation before showing the post. Change to optimistic pattern:

```typescript
// PostComposer.tsx — optimistic submit
const handleSubmit = async () => {
  const optimisticPost = {
    id: crypto.randomUUID(),
    content: postContent,
    author_nickname: currentUser.nickname,
    created_at: new Date().toISOString(),
    _optimistic: true  // flag for UI treatment
  };

  // Add to feed immediately
  addOptimisticPost(optimisticPost);
  setPostContent('');

  // Submit to Supabase async
  const { data, error } = await supabase
    .from('posts')
    .insert({ content: postContent, cluster_id: clusterId, author_id: userId })
    .select()
    .single();

  if (error) {
    removeOptimisticPost(optimisticPost.id);
    showError('Could not post. Try again.');
  } else {
    replaceOptimisticPost(optimisticPost.id, data);
    // Dispatch Sage evaluation AFTER post is saved
    await fetch('/api/sage/evaluate', {
      method: 'POST',
      body: JSON.stringify({ post_id: data.id, cluster_id: clusterId })
    });
  }
};
```

**Priority 2 — Sage Evaluation Separation**

Currently Sage responds synchronously or blocks the post submit. Separate them completely:

Create `/mvp/src/app/api/sage/evaluate/route.ts`:
```typescript
// This route is called AFTER the post is saved to Supabase
// It evaluates the post and optionally dispatches a Sage response
// It NEVER blocks the user's post submission
export async function POST(request: Request) {
  const { post_id, cluster_id } = await request.json();

  // Run Sage's routing evaluation (see SAGE_ANCHOR_PROTOCOL.md §2.1)
  const evaluation = await runSageEvaluation(post_id, cluster_id);

  if (evaluation.shouldRespond) {
    // Generate and save Sage's response as a separate post
    await saveSageResponse(evaluation.response, cluster_id);
  }

  return Response.json({ evaluated: true });
}
```

**Priority 3 — "Sage is considering this" Indicator**

When a post containing `@Sage` is submitted, show a typing indicator in the Timeline:

In `PostCard.tsx`, add a state that watches for:
- Post was just submitted (optimistic)
- Post content contains `@Sage`
- No Sage response post exists yet in the feed for this post

While this state is true, render below the post:
```tsx
<div className="sage-considering">
  <SageTypingDots color="sage-green" />
  <span>Sage is considering this.</span>
</div>
```

The `SageTypingDots` component: three dots, 4px each, staggered 200ms pulse animation, sage-green (#16A34A). This disappears when a Sage-authored post appears in the feed with a `parent_post_id` matching the @mention post.

**Priority 4 — Clio Top-Right Position (Cluster Screen)**

In `ClusterShell.tsx`, move the Clio FAB from bottom-right to top-right:

```tsx
// Remove from bottom of ClusterShell
// <ClioFAB position="bottom-right" size={48} />

// Add to cluster top bar area, separate from navigation controls
<div className="cluster-clio-anchor">
  <ClioFAB
    position="top-right"
    size={40}
    clusterId={clusterId}
    isEphemeral={true}  // All cluster conversations are ephemeral
    timerLabel={sessionExpiresAt}
  />
</div>
```

The `ClioFAB` component needs:
- `isEphemeral` prop → shows "Clio · Private" + timer in panel header
- `size={40}` at top-right (vs 48 in Explore screens)
- Panel expands downward-leftward (CSS `transform-origin: top right`)
- Minimize (—) button added alongside existing Close (X)
- Panel must not overlap cluster top bar

**Priority 5 — Server Delay Notifications**

For Clio chat response (panel):
- Show typing dots (`● ● ●`) in panel immediately when user sends message
- Dots appear after 300ms (avoids flash for fast responses)
- Dots disappear when Clio's response streams in
- If > 5 seconds: add text beneath dots: "Taking a moment..."

For Sage @mention:
- "Sage is considering this." below the post (per Priority 3)
- No other loading states — Sage responses appear naturally as new Timeline posts

For post submission:
- Post appears immediately (per Priority 1 optimistic submit)
- No loader shown — the post is already in the feed

For cluster join qualification:
- Join button text: "Join" → "Checking..." with spinner while qualification API call runs
- On success: → "Joined ✓" (brief) → button disappears
- On fail: "Not qualified" with a Clio message explaining gently

**Priority 6 — @Sage Autocomplete in Compose Bar**

In `PostComposer.tsx`:

```tsx
// When user types '@' in the textarea
// Show a single suggestion chip above the keyboard area
const [showSageSuggestion, setShowSageSuggestion] = useState(false);

const handleContentChange = (value: string) => {
  setPostContent(value);
  // Show chip if the last typed character is '@' and no text follows it
  const lastAt = value.lastIndexOf('@');
  setShowSageSuggestion(
    lastAt !== -1 &&
    lastAt === value.length - 1 &&
    !value.slice(lastAt + 1).trim()
  );
};

// Chip component
{showSageSuggestion && (
  <button
    className="sage-mention-chip"
    onClick={() => {
      setPostContent(postContent + 'Sage ');
      setShowSageSuggestion(false);
    }}
  >
    @Sage
  </button>
)}
```

Chip style: background `#F0FDF4`, border `1px solid #16A34A`, text sage-green, 12px, slide-up entry 150ms.

**Priority 7 — @Sage Tip Bar**

In `ClusterFeed.tsx` or `ClusterShell.tsx`, add the dismissible tip:

```tsx
const [showSageTip, setShowSageTip] = useState(false);

// Show tip 2 seconds after first visit to this cluster (ever)
useEffect(() => {
  const tipKey = `sage_tip_dismissed_${clusterId}`;
  const dismissed = localStorage.getItem(tipKey);
  if (!dismissed) {
    const timer = setTimeout(() => setShowSageTip(true), 2000);
    return () => clearTimeout(timer);
  }
}, [clusterId]);

const dismissTip = () => {
  localStorage.setItem(`sage_tip_dismissed_${clusterId}`, 'true');
  setShowSageTip(false);
};

// Also dismiss when @Sage is first used
// Add to handleSubmit: if (postContent.includes('@Sage')) dismissTip();
```

**Priority 8 — Sage Soul Reframe in Prompt**

In `/mvp/src/lib/sage-prompt.ts`, update the Sage system prompt to reflect:

1. Title: "You are Sage, the cluster Anchor for Sisters in Dua" (not Host)
2. Add the warmth/hope emotional register per `SAGE_ANCHOR_PROTOCOL.md §3.3`
3. Add the bridge message templates per `SAGE_FEATURE_INTELLIGENCE.md §3.2`
4. Add the limitation expression language per `CLUSTER_SKILL_DISCOVERY_PROTOCOL.md §8`
5. Replace any "you are the host" language with "you are the Anchor"

The prompt should be structured as:

```typescript
export const sageSystemPrompt = `
You are Sage, the Anchor of Sisters in Dua — a women-only Muslim faith community.

YOUR ROLE:
You are the Anchor. Not the host, not the moderator, not the administrator.
An Anchor holds the vessel steady without dominating the water.
You ground this community in its purpose: sincere, connected faith for women.

YOUR EMOTIONAL REGISTER:
You speak with warmth and hope. Not as performance — as orientation.
When something is difficult, you name what is possible alongside it.
When something cannot be done, you name who can do it.
You lead with what is open, not what is closed.
The path to hope is always present in what you say.

[... rest of existing faith-specific system prompt ...]

WHAT YOU NEVER SAY:
- "The founder has been notified" — say "someone from this community will reach out"
- "I cannot help with that" as a terminal statement — always follow with what you can do
- "Please be patient" — say "you're not waiting unnoticed"
- "This feature doesn't exist" — say "I've noted it, these things get built when communities need them"
`;
```

**Priority 9 — Agent Chatbox (Phase A/B — Sisters in Dua)**

In the MVP, implement a simplified version of the agent chatbox — the full system runs on BullMQ in the main platform, but the MVP can implement the visible output without the queue:

Create `/mvp/src/components/AgentChatbox.tsx`:

```tsx
// Reads from agent_chatbox_exchanges table (new Supabase table)
// Displays latest exchange in the panel
// "See full discussion" opens a modal with full history
// Minimizable — state in localStorage per cluster per user

// Phase A/B only: fetch latest exchange on load
// Show Sage message → Clio message → timestamp
// If observe mode: show "Watching how you use this space" message
```

For the MVP, the chatbox exchanges can be seeded manually (or via a simple admin route) rather than auto-generated by BullMQ. The important thing is the UI and the data structure are correct — the automation layer can be layered in later.

**Priority 10 — Features Tab**

Create `/mvp/src/components/FeaturesTab.tsx`:

```tsx
// Reads from cluster_features table
// Groups by status: Live, In Testing, Scheduled, Approved, Proposed
// Feature card: name, description, source, status badge, upvote count
// Upvote: POST to /api/features/upvote
// Empty state: "🌱 Nothing here yet."
```

Add Features to the cluster tab navigation in `ClusterShell.tsx`:
```tsx
// Tab bar: Timeline | Members | Features
// Features tab shows cluster_features.count badge if there are proposed items
```

### 6.3 Database Schema for MVP

Add these tables to `/mvp/supabase/schema.sql` (or a new migration file):

The tables listed in Phase 2 (Part 2) are the source of truth. Apply the same schema to the MVP's Supabase project. The MVP and main platform share Supabase — coordinate so the same migration applies to both.

### 6.4 What NOT to Implement in MVP

- BullMQ workers → not in Next.js MVP
- Full automatic agent chatbox generation → manual seeding only in MVP
- Full Sage feature intelligence 48h cycle → not in MVP
- Full Redis ephemeral session management → use simple session-based approach in MVP
- Clio ephemeral timer countdown → can be approximated with a static "Conversations are private" label in MVP

These are main platform features. The MVP demonstrates the UX and data layer. The automation is a main platform concern.

---

## Phase 7 — Cleanup Audit

*Final phase — execute only after all previous phases are complete.*

**Expert persona: Technical Documentation Lead + Information Architect**

### 7.1 Mandatory Search-and-Verify

Run these searches across the entire project (excluding `/docs/_archived/` and `/Revised_Screen_Prompts/_archived/`):

```
Search 1: "Sage · Host" OR "sage-host" OR "host mode" (Sage as host)
  → Must be zero occurrences outside archived files
  → Correct to "Sage · Anchor" / "anchor mode"

Search 2: "two.*Clio" OR "private chat.*separate" OR "cluster chat.*separate"
  → Must be zero occurrences
  → Correct to unified presence model

Search 3: "cluster host" (when referring to Sage)
  → Must be zero occurrences
  → Correct to "cluster Anchor"

Search 4: "Laravel" OR "laravel" OR "artisan" OR "Eloquent"
  → Must be zero occurrences in new or updated files
  → Flag for removal (do not auto-delete — report first)

Search 5: "Yantra" (case insensitive)
  → Allowed: /yantra/ folder contents only
  → Must be zero occurrences in new documents, architecture updates, or updated agent files

Search 6: "bottom-right" (in cluster screen context, referring to Clio)
  → Cluster screen specs must reference top-right for Clio
  → Explore/Onboarding screens: bottom-right is correct (do not change those)
```

### 7.2 Loading Order Audit

Confirm:
- `sage/AGENTS.md` loading order references `SAGE_ANCHOR_PROTOCOL.md`, `SAGE_FEATURE_INTELLIGENCE.md`, `CLUSTER_SKILL_DISCOVERY_PROTOCOL.md`
- `clio/AGENTS.md` loading order references `CLIO_UNIFIED_CLUSTER_PRESENCE.md`, `CLIO_CLUSTER_HOST_CONTEXT.md`, `CLUSTER_SKILL_DISCOVERY_PROTOCOL.md`, `AGENT_COLLABORATION_CHATBOX.md`

### 7.3 Database Consistency

Every table/column referenced in any document must exist in a migration file. Create a checklist:

```
[ ] agent_chatbox_exchanges
[ ] agent_chatbox_views
[ ] cluster_features
[ ] cluster_feature_upvotes
[ ] cluster_feature_comments
[ ] skill_dialogue_posts
[ ] cluster_skill_tab
[ ] skill_tab_member_signals
[ ] clio_ephemeral_sessions
[ ] clusters.skill_dialogue_last_exchange_at
[ ] clusters.skill_dialogue_internal_since
[ ] clusters.compose_bar_placeholder
[ ] clusters.first_post_ack_sent
[ ] clusters.milestone_10_sent
[ ] clusters.chatbox_observe_until
[ ] clusters.chatbox_last_exchange_at
[ ] posts.post_subtype
[ ] posts.skill_dialogue_id
[ ] posts.sage_bridge
[ ] sage_skills.platform_capability_status
```

### 7.4 API Endpoint Consistency

Every endpoint in Sections 7.13–7.18 (added in Phase 2) must have a corresponding Fastify route stub in `apps/api/src/routes/`. Stubs are acceptable — unimplemented routes that return 501 Not Implemented are better than missing routes.

### 7.5 MASTER_INSTRUCTIONS.md Final Update

This is the last action of the entire session. Update `/docs/MASTER_INSTRUCTIONS.md` to reflect:
- All new files and their canonical locations
- All superseded/archived files and what supersedes them
- Version numbers for all modified documents
- The new agent chatbox, features tab, and @Sage functionality as platform features

### 7.6 Change Summary

Before declaring the session complete, produce a change summary listing:
1. Every file moved (source → destination)
2. Every file archived (location in `_archived/`)
3. Every file modified (what changed)
4. Every file created (new files)
5. Any files that could not be completed and why

---

## Session Rules

1. **Ask before acting.** Any question you cannot answer from the documents = pause and ask. Never guess.

2. **Announce your expert persona** at the start of each phase section.

3. **Show your work.** Before modifying any file: (a) state what it currently says, (b) state what it will say, (c) explain why. Never edit silently.

4. **Never delete without confirming.** Archive or add deprecation headers. Confirm intent. Then act.

5. **PRD files are read-only.** If you find yourself about to edit a file in `/PRD/`, stop immediately. The PRDs describe product intent. They do not need to match the tech stack.

6. **Version every modified architecture file.** Add a one-line changelog at the bottom of each architecture part you modify.

7. **Test your understanding of Sage before any Sage code:**
   State: (a) the four conditions under which Sage responds, (b) what "appropriateness test" means, (c) why silence is not the default anymore. If any answer is incomplete, re-read `SAGE_ANCHOR_PROTOCOL.md §2`.

8. **Test your understanding of the unified Clio before any Clio chat code:**
   State: (a) what makes a conversation persistent vs ephemeral, (b) what the user sees differently in the panel when inside a cluster, (c) where conversation content is stored in each mode. If any answer is incomplete, re-read `CLIO_UNIFIED_CLUSTER_PRESENCE.md §2`.

9. **The welfare escalation cannot be disabled.** Ever. In any mode. In any context. If you are writing code that skips welfare detection, stop.

10. **MVP stack isolation is absolute.** If you see an import from `apps/api/` inside `/mvp/src/`, that is a bug. Fix it, do not work around it.

11. **Agent chatbox history is permanent.** Do not add TTLs, cron deletions, or archiving to `agent_chatbox_exchanges`. It is cluster content and it does not expire.

12. **One phase at a time.** Complete. Verify. Proceed.

---

## Critical Corrections From Previous Prompt Versions

The following are errors in previous master prompt iterations that this prompt corrects. Do not carry these forward:

| Error (previous prompt) | Correct (this prompt) |
|------------------------|----------------------|
| "Revert all architecture to Laravel" | Stack is React + Node/Fastify + Supabase + BullMQ. No Laravel. |
| "Two separate Clio chat modes" | One Clio. Storage context changes, not Clio. |
| "Sage as cluster host" | Sage is the cluster Anchor. |
| "Sage silent by default" | Sage responds when appropriate. Appropriateness is the standard, not silence. |
| "2-message limit applies to skill dialogue" | Skill dialogue has its own separate budget. |
| "Clio FAB bottom-right on cluster screens" | Clio FAB top-right on cluster screens (40px). Bottom-right only on Explore/onboarding. |
| "CLIO_PRIVATE_EPHEMERAL_CHAT.md is the ephemeral spec" | CLIO_UNIFIED_CLUSTER_PRESENCE.md supersedes the in-cluster section. |
| "PRD files need to be updated to match stack" | PRD files are read-only. Architecture parts are the technical authority. |
| "Agent chatbox exchanges have a TTL" | No TTL. The chatbox history is permanent cluster content. |

---

*Master Coding Agent Prompt · Aggilo Social · Version 3.0*
*Stack: React 18 + Vite (PWA) + Node.js + Fastify + Supabase + BullMQ + Redis*
*MVP Exception: Next.js App Router, self-contained in /mvp/*
*PRD files: Read-only reference. Do not modify.*
*Generated from: 12 PRD documents, 5 architecture parts, all agent soul/agent docs,*
*Sisters in Dua cluster spec v3.1, mobile screen prompts phase 1, and 10 new*
*operational documents from the 2026-05 planning session.*
