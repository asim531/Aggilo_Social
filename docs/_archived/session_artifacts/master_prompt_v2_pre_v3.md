# Aggilo — Master Coding Agent Prompt
## Review · Architecture Alignment · MVP Implementation

> **For:** AI Coding Agent (Claude Code or equivalent)
> **Mode:** Adopt the best expert in every respective field named below. Ask questions until you have 100% confidence before executing any phase. Do not assume. Do not proceed past Phase 0 until all blocking questions are resolved.
> **Scope:** This prompt governs a complete review, alignment, and build session covering project documentation, PRD tech stack correction, architecture file updates, landing pages, and the Sisters in Dua MVP cluster implementation.

---

## Expert Personas — Active Throughout This Session

You are simultaneously:

- **Principal Software Architect** (TypeScript strict mode, Node.js, Fastify, Supabase, Redis, BullMQ queue systems) — owns all backend decisions
- **Senior Full-Stack Engineer** (React 18 + Vite PWA, Fastify API, Supabase JS client; Next.js for the contained `/mvp/` build only) — owns implementation
- **AI Systems Engineer** (LLM orchestration, BullMQ workers, agent prompt architecture) — owns Clio and Sage integration
- **UX Engineer** (mobile-first PWA, real-time feedback states, accessibility) — owns frontend behaviour
- **Technical Documentation Lead** (Markdown, Mermaid, cross-reference integrity) — owns doc structure and HTML rendering
- **Information Architect** (folder structure, naming conventions, cross-file consistency) — owns project organisation
- **Human-Centred Design Specialist** (community psychology, onboarding trust design, agent interaction patterns) — owns Clio/Sage UX behaviour

Switch persona explicitly when answering in that domain. Never blend them into a generic "developer" voice.

---

## Phase 0 — Study Phase (Mandatory Before Any Action)

### 0.1 Files to Read — In This Exact Order

Read every file completely before forming any plan. Do not skim.

**Step 1 — Project PRD and Platform Rules:**
```
/PRD/00_prd_index.md
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
AGGILO_PLATFORM_RULES.md
AGGILO_SOUL.md
CLAUDE.md
```

**Step 2 — Architecture Files (Source of Truth — Read All Five Parts):**
```
/architecture/system_implementation_prompt_part1.md
/architecture/system_implementation_prompt_part2.md
/architecture/system_implementation_prompt_part3.md
/architecture/system_implementation_prompt_part4.md
/architecture/system_implementation_prompt_part5.md
```

> [!IMPORTANT]
> Parts 1–5 are **MASTER_INSTRUCTIONS_v2** and are the authoritative source of truth for the tech stack. These documents permanently replace the entire backend with **React + Node.js/Fastify + Supabase + BullMQ**. The PRD files (Step 1) still reference Laravel/PHP — this is an error in those documents, not in the architecture. Your job in Phase 2 is to correct the PRD files to match the architecture, not the other way around.

**Step 3 — Agent Configuration Files (Current State):**
```
/clio/SOUL.md
/clio/AGENTS.md
/sage/SOUL.md
/sage/AGENTS.md
/sage/SAGE_SKILLS.md
/docs/CLIO_SAGE_HANDOFF.md
/docs/MASTER_INSTRUCTIONS.md
[Read any other files in /clio/, /sage/, /docs/, /clusters/]
```

**Step 4 — New Documents to Be Incorporated (Added in /docs/ folder):**
```
/docs/AGGILO_ONBOARDING_PLAYBOOK_V2.md
/docs/CLUSTER_SKILL_DISCOVERY_PROTOCOL.md
/docs/CLIO_CLUSTER_HOST_CONTEXT.md
/docs/CLIO_PRIVATE_EPHEMERAL_CHAT.md
```

**Step 5 — Landing Pages:**
```
/launch/landing/index.html           [India landing page]
/launch/global_landing/index.html    [Global landing page]
[Read all files in /launch/ and /launch/phase_1/]
```

**Step 6 — MVP Implementation:**
```
[Read every file in the /mvp/ folder]
[Read the cluster spec: /clusters/the_single_source/ or equivalent]
```

> [!NOTE]
> The `/mvp/` folder uses **Next.js** (not the Vite + Fastify monorepo used by the main platform). This is an intentional, contained exception for the Sisters in Dua MVP only. Do not treat the Next.js stack in /mvp/ as representative of the main platform architecture.

**Step 7 — Mobile Screen Prompts:**
```
/Revised_Screen_Prompts/mobile_screen_prompts_phase1.md
[Or wherever the current phase 1 screen prompts live]
```

**Step 8 — Agent Runtime Routing (Legacy Reference — Read for Context Only):**
```
/yantra/YANTRA_BRIDGE_SPEC.md
/yantra/routing_table.json
/maintenance/README.md
```

> [!CAUTION]
> The `/yantra/` folder contains legacy documents from an earlier naming convention. The term "Yantra" has been deprecated and does not appear in the current architecture (Parts 1–5). Read these files for historical context on routing and job dispatch patterns. Do **not** carry the "Yantra" name forward into any new or updated documents. Where these files describe system behaviour that is still valid, the equivalent is now implemented as Node.js services and BullMQ workers as specified in the architecture parts.

---

### 0.2 Questions to Ask After Reading — Before Any Execution

After completing Phase 0 reading, you must ask every question below that you cannot answer from the files. Do not guess. Do not assume reasonable defaults. Ask and wait for answers.

**Blocking questions — no phase may begin without these answered:**

**Q1 — PRD Alignment Scope (Critical):**
> The PRD files (Parts 1–12, AGGILO_PLATFORM_RULES.md) explicitly reference Laravel (PHP 8.2+) as the backend framework. The architecture documents (system_implementation_prompt_parts 1–5) permanently supersede this with React 18 + Vite (frontend), Node.js + Fastify (backend), Supabase (database/auth/realtime), BullMQ (queue), and Railway + Vercel (deployment). The `/mvp/` folder uses Next.js as a contained exception for the Sisters in Dua MVP only.
>
> Before I proceed to update the PRD files:
> - Confirm the PRD tech stack substitution direction: Laravel → Node.js/Fastify for backend; Blade/Livewire → React 18 + Vite for frontend; Laravel Horizon → BullMQ; Laravel Sanctum → Supabase Auth + JWT verification in Fastify. Is this mapping confirmed for all PRD documents?
> - The MVP at `/mvp/` uses Next.js specifically — should the PRD documents acknowledge this distinction (Next.js for MVP, Vite + Fastify for main platform), or should the MVP be treated as a transitional implementation detail not referenced in the PRDs?
> - Should HTML counterparts of PRD files be regenerated from the updated MD files, or are they maintained by hand? This determines whether I update both simultaneously or only the MD files and flag the HTML for a separate pipeline step.

**Q2 — Folder Structure:**
> I need to confirm the exact project folder structure before making any file placements. Please confirm or provide:
> - Where do the new docs currently live? Are they already in /docs/ or are they in a different location?
> - Where is the MVP implementation? Is it /mvp/ or another path?
> - Are the HTML versions of MD files generated by a build step or manually maintained?

**Q3 — Landing Page Scope:**
> The instruction is to: (1) remove Sage references from both landing pages, (2) make the global landing feel genuinely global rather than India-focused. Before I proceed:
> - Is there a specific geographic scope for the global landing page? Worldwide? English-speaking markets? Something else?
> - What languages should the global landing page support or reference?
> - Are there brand guidelines (colours, fonts, imagery direction) that differ between the India and global landing pages?
> - Should the global landing page reference Premium Clusters ("Make Your Crowd") and the waitlist, or only the general Aggilo platform?
> - Is Clio still referenced on both landing pages? The instruction removes Sage — Clio's presence on landing pages is not specified.

**Q4 — New Document Placement:**
> The four new documents need to be placed in relevant folders with their MD files placed accordingly, and HTML counterparts updated. Before I decide placement:
> - `AGGILO_ONBOARDING_PLAYBOOK_V2.md` — should this replace the existing `AGGILO_ONBOARDING_PLAYBOOK.md` or live alongside it with a version suffix?
> - `CLUSTER_SKILL_DISCOVERY_PROTOCOL.md` — this is a cross-agent document. Confirm it belongs in /docs/ not inside /clio/ or /sage/.
> - `CLIO_CLUSTER_HOST_CONTEXT.md` — this is Clio-specific. Should it live in /clio/ or in /docs/?
> - `CLIO_PRIVATE_EPHEMERAL_CHAT.md` — same question: /clio/ or /docs/?
> - HTML counterparts: are these generated from MD by a specific tool (e.g., a build script, pandoc, a markdown-to-HTML pipeline)? Or hand-coded?
> - The `/yantra/` folder: should `YANTRA_BRIDGE_SPEC.md` and `routing_table.json` be archived (moved to `/docs/_archived/`) now that the Yantra naming is deprecated, or left in place as read-only legacy reference?

**Q5 — MVP Scope:**
> For the Sisters in Dua MVP, I need to understand the current implementation state before making changes:
> - What is currently implemented in the MVP? (Frontend screens, backend routes, database tables, agent integration, or only UI mockups?)
> - Does the MVP currently have any Clio or Sage integration, or is it static/semi-static?
> - What is the hosting environment for the MVP? Is it Vercel, Railway, or another provider?
> - The instruction specifies that "when a user posts, it does not mean they are asking Sage" — confirm this means Sage's `message_review` skill should evaluate all posts but only respond when her skill triggers fire, not on every post.
> - For the "server delay" notification requirement: what is the expected latency for the most common slow operations (Sage message review, Atlas brief, Clio response)? I need specific thresholds to define when "contemplating..." appears.

**Q6 — MASTER_INSTRUCTIONS.md Authority:**
> `MASTER_INSTRUCTIONS.md` appears to be the canonical document inventory. After all changes are made, it must be updated to reflect the new file locations and versions. Confirm: should I update MASTER_INSTRUCTIONS.md as the final step of every phase, or maintain it as I go?

**Q7 — Architecture Parts Versioning:**
> The current architecture parts are MASTER_INSTRUCTIONS_v2 (Parts 1–5). After PRD alignment and new document incorporation, should the architecture parts themselves be:
> (a) Versioned (e.g., v2.1 with changelog entry) to reflect that new operational documents have been cross-referenced?
> (b) Left unchanged — the PRDs and new docs absorb the updates, parts 1–5 remain v2.0?
> (c) Supplemented with cross-reference links to new documents without version bump?

---

## Phase 1 — Document Placement and Organisation

*Execute only after Phase 0 questions are resolved.*

**Expert persona active: Information Architect + Technical Documentation Lead**

### 1.1 New Document Placement

Place each new document in the correct location based on confirmed answers to Q4:

| Document | Target Location | Action |
|----------|----------------|--------|
| `AGGILO_ONBOARDING_PLAYBOOK_V2.md` | Confirmed path | Place + update any cross-references from v1 |
| `CLUSTER_SKILL_DISCOVERY_PROTOCOL.md` | Confirmed path | Place + add to MASTER_INSTRUCTIONS.md inventory |
| `CLIO_CLUSTER_HOST_CONTEXT.md` | Confirmed path | Place + add step 9 to `clio/AGENTS.md` loading order |
| `CLIO_PRIVATE_EPHEMERAL_CHAT.md` | Confirmed path | Place + add reference to `clio/AGENTS.md` |

### 1.2 Agent File Updates (Loading Order Additions)

**`sage/AGENTS.md` — Add Step 9 to loading order:**
```
9. CLUSTER_SKILL_DISCOVERY_PROTOCOL.md — cross-agent skill dialogue rules
   (loaded after active cluster tools — governs all Platform Capability skill proposals
   and the visible Clio-Sage dialogue protocol)
```

**`clio/AGENTS.md` — Add section reference under cluster-host skill:**
```
## Cluster Host Extended Reference
- CLIO_CLUSTER_HOST_CONTEXT.md — arc state machine, message budgets, Atlas orchestration,
  skill dialogue participation rules, post formatting and delivery
- CLUSTER_SKILL_DISCOVERY_PROTOCOL.md — cross-agent skill dialogue protocol (shared with Sage)
- CLIO_PRIVATE_EPHEMERAL_CHAT.md — private ephemeral chat context assembly and constraints
```

**`sage/SAGE_SKILLS.md` — Add Platform Capability to skill category table:**
Add this row to the existing four-category table:
```
| Platform Capability | Rendering, accessibility, and content format requirements
                        specific to this cluster's needs | Arabic/RTL font rendering,
                        zoom controls for sacred text, academic source access, audio
                        content support, reference source whitelisting |
```
Note: Platform Capability is the only category where skill proposals trigger both
admin queue AND public Clio-Sage dialogue post. All other categories: admin queue only.

### 1.3 HTML Counterpart Updates

For every MD file placed or modified:
- If HTML is build-generated: trigger the build pipeline and verify output
- If HTML is hand-maintained: update the HTML counterpart to reflect all changes
- Pay specific attention to Mermaid diagram blocks — confirm they render in the HTML output
- Verify all internal cross-reference links (`../`, relative paths) are correct after any file moves

### 1.4 Cross-Reference Audit

After all placements, run a cross-reference audit:
- Every document that references `AGGILO_ONBOARDING_PLAYBOOK.md` must be checked — update to V2 where appropriate
- Every document that references `sage/AGENTS.md` as loading order source — verify step 9 is now present
- `MASTER_INSTRUCTIONS.md` — update document inventory with all new files, their locations, and version numbers
- If the `/yantra/` files remain in place (per Q4 answer), add a deprecation notice to `YANTRA_BRIDGE_SPEC.md` header stating: "**DEPRECATED NAMING** — The term 'Yantra' is retired. The patterns in this document are now implemented as Node.js services and BullMQ workers. See `/architecture/system_implementation_prompt_part1.md` for current implementation." Do not delete the files; flag them.
- If the `/yantra/` files are being archived, confirm the move target (`/docs/_archived/`) and update any cross-references that point to them

---

## Phase 2 — PRD Tech Stack Alignment (React/Node/Supabase Throughout)

*Execute only after Phase 1 is complete and Q1 answers are confirmed.*

**Expert persona active: Principal Software Architect + Technical Documentation Lead**

### 2.1 Scope of Change

The PRD documents (all 12 files in `/PRD/`, plus `AGGILO_PLATFORM_RULES.md`) were written assuming a Laravel (PHP 8.2+) backend. The architecture (system_implementation_prompt_parts 1–5) has permanently replaced this with React + Node.js/Fastify + Supabase + BullMQ. The architecture files are correct and are not changed in this phase. The PRD files are wrong and must be updated to match.

The `/mvp/` folder uses Next.js — this is a legitimate, intentional exception for the Sisters in Dua MVP. PRD updates should acknowledge this distinction if Q1 confirms it.

### 2.2 Technology Substitution Map (PRD → Architecture Alignment)

Apply these substitutions consistently across all PRD markdown and HTML files:

| Remove From PRDs (Old) | Replace With (Correct) | Notes |
|------------------------|------------------------|-------|
| `Laravel` / `Laravel 11` | `Node.js + Fastify` | Core backend framework |
| `PHP 8.2+` / `PHP` | `TypeScript (strict mode)` | Backend language |
| `Laravel Form Requests` / `TypeBox validation` | `TypeBox (Fastify schema validation)` | Schema validation |
| `Laravel Horizon` | `BullMQ (Redis-backed)` | Queue system |
| `Laravel Queue` / `Laravel Jobs` | `BullMQ Workers` | Background jobs |
| `app/Jobs/` | `apps/api/src/workers/` | Worker file location |
| `app/Services/` | `apps/api/src/services/` | Service layer |
| `routes/api.php` | `apps/api/src/routes/` | Route definitions |
| `app/Http/Middleware/` | `apps/api/src/plugins/` | Middleware/plugins |
| `Laravel Sanctum` / `tymon/jwt-auth` | `Supabase Auth JWT + Fastify JWT plugin` | Auth mechanism |
| `Blade` / `Livewire` / `Inertia.js` | `React 18 + Vite (PWA)` | Frontend |
| `composer.json` / `vendor/` | `package.json` / `node_modules/` | Dependencies |
| `php artisan` commands | `npm run` / TypeScript CLI equivalents | Developer commands |
| `Hostinger KVM VPS (Laravel)` | `Railway (Node API) + Vercel (React PWA)` | Deployment targets |
| `database/migrations/` (Laravel) | `packages/supabase/migrations/` | Migration location |
| `resources/` (Laravel views) | `apps/web/src/` | Frontend source |
| `Laravel Scheduler` / `Kernel.php` | `BullMQ repeatable jobs` / `node-cron` | Scheduled tasks |
| `Browsershot` / `Headless Chrome via Yantra` | `Firecrawl / BrightData (managed scraping)` | Scraping — see Data Acquisition Layer §2.5 of Part 1 |
| `Yantra VPS` | `Railway (Node API server)` | Infrastructure |
| Any remaining use of `"Yantra"` as a name | Remove or replace with `"agent runtime"` / `"Node.js services"` | Deprecated term |

**Queue lane mapping — confirm in PRD files that this is the correct structure:**

| Queue Lane | BullMQ Queue Name | Priority |
|-----------|-------------------|---------|
| High (Clio) | `clio-high` | Highest |
| Medium (Events) | `events-medium` | Mid |
| Low (Scout) | `scout-low` | Lowest |

**BullMQ Worker class naming — use these TypeScript conventions in PRD references:**

| Job Type | TypeScript Worker Path |
|----------|----------------------|
| `ClioChatJob` | `apps/api/src/workers/clio/ClioChatJob.ts` |
| `FirstPostAcknowledgement` | `apps/api/src/workers/clio/FirstPostAcknowledgement.ts` |
| `MilestoneMessage` | `apps/api/src/workers/clio/MilestoneMessage.ts` |
| `AtlasBriefOnJoin` | `apps/api/src/workers/atlas/AtlasBriefOnJoin.ts` |
| `AtlasCrawlJob` | `apps/api/src/workers/atlas/AtlasCrawlJob.ts` |
| `AtlasReengagementCheck` | `apps/api/src/workers/atlas/AtlasReengagementCheck.ts` |
| `ObserverLanguageScan` | `apps/api/src/workers/observer/ObserverLanguageScan.ts` |
| `ClusterArcEvaluate` | `apps/api/src/workers/sage/ClusterArcEvaluate.ts` |
| `PassiveSafetySampling` | `apps/api/src/workers/moderation/PassiveSafetySampling.ts` |
| `ScoutCrawlJob` | `apps/api/src/workers/scout/ScoutCrawlJob.ts` |
| `ClioPostsDailyReset` | `apps/api/src/workers/clio/ClioPostsDailyReset.ts` |
| `SageSkillDialoguePost` | `apps/api/src/workers/sage/SageSkillDialoguePost.ts` |
| `ClioSkillDialogueResponse` | `apps/api/src/workers/clio/ClioSkillDialogueResponse.ts` |
| `SkillActivationConfirmation` | `apps/api/src/workers/clio/SkillActivationConfirmation.ts` |
| `ClioEphemeralWelfareEscalate` | `apps/api/src/workers/clio/EphemeralWelfareEscalate.ts` |
| `ClioChatEphemeral` | `apps/api/src/workers/clio/EphemeralChatJob.ts` |

**Scheduled task mapping — confirm PRDs reference BullMQ repeatable jobs, not Laravel Scheduler:**

```typescript
// apps/api/src/workers/scheduler.ts
// All recurring jobs registered as BullMQ repeatable jobs at server startup

clusterArcQueue.add('evaluate', {}, { repeat: { every: 3 * 60 * 60 * 1000 } });   // 3h
scoutQueue.add('crawl', {}, { repeat: { every: 6 * 60 * 60 * 1000 } });            // 6h
clioQueue.add('daily-reset', {}, { repeat: { cron: '0 0 * * *' } });               // midnight
atlasQueue.add('reengagement-check', {}, { repeat: { every: 6 * 60 * 60 * 1000 } }); // 6h
observerQueue.add('language-scan', {}, { repeat: { every: 6 * 60 * 60 * 1000 } }); // 6h
moderationQueue.add('passive-sampling', {}, { repeat: { every: 6 * 60 * 60 * 1000 } }); // 6h
```

### 2.3 Project Structure Reference (From Architecture Part 1)

The correct project structure is the Turborepo monorepo defined in `system_implementation_prompt_part1.md` Section 3. Where any PRD file references a Laravel folder structure (`app/Http/Controllers/`, `resources/views/`, etc.), replace with references to the monorepo structure:

```
aggilo/                              # Monorepo root
├── apps/
│   ├── web/                         # React PWA (Vite + TypeScript)
│   └── api/                         # Node.js + Fastify backend
│       ├── src/
│       │   ├── routes/              # Fastify route definitions
│       │   ├── services/            # Business logic services
│       │   ├── workers/             # BullMQ worker classes
│       │   └── plugins/             # Fastify middleware/plugins
├── packages/
│   ├── supabase/
│   │   └── migrations/              # Supabase/Postgres migrations
│   └── shared/                      # Shared TypeScript types
└── mvp/                             # Next.js — Sisters in Dua MVP ONLY
```

### 2.4 .env.example Reference (From Architecture Part 1)

Where any PRD references environment variables in Laravel format (e.g., `APP_KEY`, `DB_CONNECTION=pgsql` in Laravel config style), replace with the correct `.env.example` defined in `system_implementation_prompt_part1.md` Section 4. Key substitutions:

| Remove (Laravel .env) | Replace With (Node .env) |
|----------------------|--------------------------|
| `APP_KEY=` | Remove — not applicable |
| `APP_ENV=local` | `NODE_ENV=development` |
| `DB_CONNECTION=pgsql` + `DB_HOST=` etc. | `SUPABASE_URL=` + `SUPABASE_SERVICE_ROLE_KEY=` |
| `QUEUE_CONNECTION=redis` (Laravel) | `REDIS_URL=redis://localhost:6379` (ioredis/BullMQ) |
| `YANTRA_BASE_URL=` | Remove — deprecated |
| `YANTRA_SECRET=` | Remove — deprecated |

### 2.5 Files That Must Be Updated

Search every file in the `/PRD/` folder (both `.md` and `.html` versions) and `AGGILO_PLATFORM_RULES.md` for any of the following strings and replace per the mapping in 2.2:

Search targets in PRD files:
- `Laravel` / `laravel`
- `PHP` / `php`
- `Artisan` / `artisan`
- `Blade` / `Livewire` / `Inertia`
- `Laravel Horizon`
- `composer` / `Composer`
- `Laravel Queue` / `Laravel Jobs`
- `routes/api.php` (as Laravel routing reference)
- `app/Http/` (as Laravel folder structure)
- `Laravel Sanctum`
- `Yantra` / `yantra` (any occurrence)

**After replacement:** Read each modified file back and verify no orphaned references remain. A single leftover `Laravel` mention in a spec creates implementation confusion.

**HTML counterparts:** For every `.md` file updated, update the corresponding `.html` file in the same `/PRD/` folder. Both formats must be consistent.

### 2.6 PRD Sections — Specific Areas to Update

**PRD 01 (Registration/Onboarding) — Auth flow section:**
- Replace Laravel Sanctum token issuance with: Supabase Auth (OTP) → JWT returned → Fastify middleware verification
- Replace any references to Laravel session management

**PRD 06 (AI Agents) — Agent implementation section:**
- Replace any Laravel Job class names with the TypeScript worker paths from §2.2
- Remove "Yantra VPS" references — replace with "Railway-hosted Node.js API server"
- Replace Laravel Horizon queue references with BullMQ

**PRD 08 (Data Strategy) — Backend processing section:**
- Replace Laravel service layer references with Fastify service pattern
- Confirm the Data Acquisition Layer (Tier 1-4 from Part 1 §2.5) is referenced, not Laravel Browsershot or direct Puppeteer

**PRD 09 (Admin Platform) — Backend admin section:**
- Replace any references to Laravel admin packages (Nova, Filament, etc.) with the React-based admin routes defined in Part 3

**PRD 11 (LLM Admin Routing) — Queue and routing section:**
- Replace Laravel Horizon queue config with BullMQ lane structure
- Replace `llm_routing_config` table references with the Fastify LLMRouter service pattern from Part 1 §2.2

**PRD 12 (Premium Clusters) — Payment processing section:**
- Replace Laravel payment webhook handling with Fastify webhook routes from Part 3 §7.10
- Razorpay + Google Play Billing integration: the pattern is correct; only the framework reference changes

---

## Phase 3 — Landing Page Updates

*Execute only after Phase 2 is complete and Q3 answers are confirmed.*

**Expert persona active: UX Engineer + Human-Centred Design Specialist**

### 3.1 Both Landing Pages — Remove Sage References

**What "remove Sage" means:**

Sage is an in-cluster agent. She is not an onboarding or marketing concept. Mentioning her on the landing page creates expectation for something users will not encounter until they are inside a specific cluster. Remove all references to Sage by name from both landing pages.

**What to keep:** Clio is appropriate on landing pages — she is the user's point of contact from the moment they engage. References to "your cluster host," "AI-powered communities," or "AI that watches over your group" are also acceptable without naming Sage specifically.

**Search terms to find and remove from both landing page files:**
- "Sage"
- "cluster host agent"
- Any description that could only refer to Sage's specific role

**Replacement approach:** Where Sage was mentioned, either remove the sentence entirely (if it is feature-specific detail inappropriate for a landing page) or replace with a general cluster intelligence reference (e.g., "Every cluster is actively hosted" without naming who or what hosts it).

### 3.2 India Landing Page — Scope

The India landing page targets the Phase 1 launch (Hyderabad colleges). Keep:
- Regional language references (Telugu, Hindi)
- College/campus-specific copy and imagery direction
- India-specific pricing references (₹300/mo — hidden until 100k users per PRD)
- UPI and Razorpay references in the technical footer (not user-facing copy)
- Local cultural context (Hyderabad, South India, AGGIL engine)

Remove from India page:
- All Sage references (per 3.1)
- Any "global" framing that contradicts the regional launch focus

### 3.3 Global Landing Page — Scope

The global landing page must feel genuinely worldwide — not India-first with some text changes. This requires more than find-and-replace.

**Audit the global page for India-specific residue:**

Search for and evaluate every instance of:
- City names (Hyderabad, Bangalore, etc.)
- Currency symbols (₹)
- Indian cultural references (IPL, Diwali, etc.)
- Language references that are India-specific (Telugu, Hindi as default)
- Payment methods (UPI, Razorpay — replace with generic "local payment methods" or remove)
- College/campus framing that implies an Indian higher-education launch context

**Replace with globally neutral equivalents:**

| India-specific | Global equivalent |
|---------------|------------------|
| "Find your people in Hyderabad" | "Find your people — wherever you are" |
| "Telugu, Hindi, English" | "Your language. Your community." |
| "₹300/month" | Remove or "Local pricing" |
| "Colleges in Hyderabad" | "Communities around shared purpose" |
| UPI references | Remove from public-facing copy |
| AGGIL engine described with India context | AGGIL described as demographic-aware without region |

**Global page must include:**
- Language diversity as a hero feature — not India-specific languages but the principle that communities form in their own language
- Geographic diversity framing — clusters are not location-limited unless the creator chooses
- The AGGIL engine explained without assuming any specific country's demographic structure
- The privacy promise as the primary value proposition (this is universal)
- Clio as the user's personal guide (universal framing, not region-specific)
- "Make Your Crowd" / Premium Clusters — globally applicable, frame accordingly

**Tone shift for global page:**
- India page: warm, local, community-feel, first-generation-college-student empathy
- Global page: purposeful, intelligent, private, interest-first — the promise of finding your people based on who you are, not where you live

---

## Phase 4 — Architecture Completion (New Operational Layers)

*Execute only after Phases 1-3 are complete.*

**Expert persona active: AI Systems Engineer + Principal Software Architect**

### 4.1 What the New Documents Add to the Architecture

The four new documents add operational detail that was missing from the existing architecture parts. They do not change the system's high-level design — they fill in the behaviour gaps. Each has specific architectural implications:

**CLIO_CLUSTER_HOST_CONTEXT.md adds:**
- Three separate message budget types with independent ceilings and reset schedules
- Skill dialogue as a distinct message category with its own database field and queue job
- Compose bar placeholder as a Clio-generated, arc-phase-aware database field
- New database fields: `clio_posts_today`, `skill_dialogue_last_exchange_at`, `skill_dialogue_internal_since`, `compose_bar_placeholder`, `first_post_ack_sent`, `milestone_10_sent`
- New post subtypes: `host_content`, `arc_milestone`, `first_post_ack`, `reengagement`, `skill_dialogue`, `skill_dialogue_response`, `skill_activation`, `dialogue_transition`
- New queue jobs: `SageSkillDialoguePost`, `ClioSkillDialogueResponse`, `ClioSkillDialogueInitiation`, `SkillActivationConfirmation`, `DialogueTransitionPost`

**CLUSTER_SKILL_DISCOVERY_PROTOCOL.md adds:**
- Fifth skill category: `platform_capability`
- New database tables: `skill_dialogue_posts`, `cluster_skill_tab`, `skill_tab_member_signals`
- Alter existing `sage_skills` table: add columns for skill dialogue tracking and platform capability status
- New queue jobs: `SageSkillDialoguePost`, `ClioSkillDialogueResponse`, `ClioSkillDialogueInitiation`, `SkillConfirmationPost`, `SkillTabUpdate`, `MaturityThresholdCheck`
- New admin dashboard section: Skill Discovery (visible proposed skills, member upvotes, admin approval queue)

**CLIO_PRIVATE_EPHEMERAL_CHAT.md adds:**
- Redis-based ephemeral session storage (not Supabase) for conversation content
- New Supabase table: `clio_ephemeral_sessions` (metadata only — no conversation content)
- Redis key patterns: `ephemeral:{session_id}:messages` (TTL: 43200s), `ephemeral_welfare:{session_id}` (TTL: 86400s)
- New API endpoints: `GET /api/clio/private/session`, `DELETE /api/clio/private/session`, `POST /api/clio/private/welfare`
- Modified endpoint: `POST /api/clio/chat` — add `cluster_id` null-check to route to ephemeral mode
- New queue jobs: `ClioChatEphemeral`, `ClioEphemeralWelfareEscalate`
- Minimize panel UI behaviour — new frontend state (not a new screen — the existing Clio panel gets minimize capability)
- FAB mood state for private chat mode — visual spec addition to `mobile_screen_prompts_phase1.md`

**AGGILO_ONBOARDING_PLAYBOOK_V2.md adds:**
- Cluster-type-calibrated onboarding copy (not new technical architecture — but implies the onboarding flow must be parameterised by `cluster_purpose` to serve different copy)
- Beta disclosure as a conditional at-join screen element (new UI element for clusters flagged `beta_disclosure: true`)
- Clio-Sage introduction as a specific message template populated from Sage's `persona_confirmed` signal
- Pre-launch checklist as an admin/founder workflow (admin dashboard addition)

### 4.2 Architecture Part 2 — Database Schema Additions

**File to edit:** `/architecture/system_implementation_prompt_part2.md`

Open this file. Locate Section 5.1 (Entity-Relationship Diagram) and Section 5.2 (table definitions). Add the new tables and ALTER statements below to the schema, in the same SQL format already used in that file. After adding them, add a cross-reference block at the top of Section 5 (before the ER diagram):

```markdown
> **Schema additions from operational documents (v2.1):**
> The following tables were added from four operational documents incorporated after the initial schema design.
> See: `CLIO_CLUSTER_HOST_CONTEXT.md`, `CLUSTER_SKILL_DISCOVERY_PROTOCOL.md`, `CLIO_PRIVATE_EPHEMERAL_CHAT.md`.
> These documents are the authoritative spec for the behaviour these tables support.
```

Add the following to the database schema section:

**New tables (from new documents):**

```sql
-- Skill dialogue posts tracking (from CLUSTER_SKILL_DISCOVERY_PROTOCOL.md)
CREATE TABLE skill_dialogue_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id),
  post_id UUID NOT NULL REFERENCES posts(id),
  initiating_agent VARCHAR(16) NOT NULL,     -- 'sage' | 'clio'
  dialogue_type VARCHAR(32) NOT NULL,        -- 'skill_dialogue' | 'skill_dialogue_response' | 'skill_dialogue_initiation'
  skill_candidate VARCHAR(128),
  skill_category VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skills tab (member-visible) (from CLUSTER_SKILL_DISCOVERY_PROTOCOL.md)
CREATE TABLE cluster_skill_tab (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id),
  skill_id UUID REFERENCES sage_skills(id),
  display_name VARCHAR(128) NOT NULL,
  display_description TEXT,
  status VARCHAR(32) DEFAULT 'proposed',     -- proposed | active | suspended | removed
  source_description VARCHAR(64),            -- 'Noticed by Sage' | 'Raised by members' | 'Suggested by Clio'
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member signals on proposed skills (from CLUSTER_SKILL_DISCOVERY_PROTOCOL.md)
CREATE TABLE skill_tab_member_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_skill_tab_id UUID NOT NULL REFERENCES cluster_skill_tab(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  signal_type VARCHAR(16) NOT NULL,         -- 'upvote' | 'comment'
  content TEXT,                              -- null for upvotes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ephemeral chat session metadata (from CLIO_PRIVATE_EPHEMERAL_CHAT.md)
-- Content stored in Redis ONLY — not in Supabase
CREATE TABLE clio_ephemeral_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,          -- started_at + interval '12 hours'
  message_count INT DEFAULT 0,
  welfare_flagged BOOLEAN DEFAULT FALSE,
  welfare_escalated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ                    -- set at TTL expiry; row kept 7 days for audit
);
```

**Altered tables:**

```sql
-- Add to clusters table
ALTER TABLE clusters ADD COLUMN skill_dialogue_last_exchange_at TIMESTAMPTZ;
ALTER TABLE clusters ADD COLUMN skill_dialogue_internal_since TIMESTAMPTZ;
ALTER TABLE clusters ADD COLUMN compose_bar_placeholder TEXT;
ALTER TABLE clusters ADD COLUMN first_post_ack_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE clusters ADD COLUMN milestone_10_sent BOOLEAN DEFAULT FALSE;

-- Add to posts table
ALTER TABLE posts ADD COLUMN post_subtype VARCHAR(32);
  -- Values: null (standard) | host_content | arc_milestone | first_post_ack |
  --         reengagement | skill_dialogue | skill_dialogue_response |
  --         skill_activation | dialogue_transition
ALTER TABLE posts ADD COLUMN skill_dialogue_id UUID REFERENCES skill_dialogue_posts(id);

-- Add to sage_skills table
ALTER TABLE sage_skills ADD COLUMN skill_dialogue_post_id UUID;
ALTER TABLE sage_skills ADD COLUMN clio_response_post_id UUID;
ALTER TABLE sage_skills ADD COLUMN member_upvotes INT DEFAULT 0;
ALTER TABLE sage_skills ADD COLUMN member_comments INT DEFAULT 0;
ALTER TABLE sage_skills ADD COLUMN platform_capability_status VARCHAR(32);
  -- Values: null | developer_queued | built | activated
```

### 4.3 Architecture Part 3 — API Endpoint Additions

**File to edit:** `/architecture/system_implementation_prompt_part3.md`

Open this file. Locate Section 7 (API Endpoint Map). Add the new endpoints below to their respective subsections. Then add a cross-reference note immediately below the Section 7 heading:

```markdown
> **Endpoint additions from operational documents (v2.1):**
> Endpoints in Sections 7.5 (Clio private chat) and 7.13 (Skill Discovery) were added from
> `CLIO_PRIVATE_EPHEMERAL_CHAT.md` and `CLUSTER_SKILL_DISCOVERY_PROTOCOL.md` respectively.
> Consult those documents for full behaviour specification before implementing these routes.
```

Add these endpoints to the relevant sections:

**Section 7.5 (Clio endpoints) — Add:**
```
GET    /api/clio/private/session          Private ephemeral session status
DELETE /api/clio/private/session          User-initiated session early deletion
POST   /api/clio/private/welfare          Internal: welfare escalation from private chat
```

**New Section 7.13 (Skill Discovery):**
```
GET    /api/clusters/{id}/skills                       Get cluster skills tab entries
POST   /api/clusters/{id}/skills/{skillId}/upvote      Member upvote on proposed skill
POST   /api/clusters/{id}/skills/{skillId}/comment     Member comment on proposed skill
GET    /api/admin/skills/proposals                     Admin: pending skill proposals queue
POST   /api/admin/skills/{id}/approve                  Admin: approve skill proposal
POST   /api/admin/skills/{id}/reject                   Admin: reject skill proposal
POST   /api/admin/skills/{id}/defer                    Admin: defer skill proposal
```

### 4.4 Architecture Part 4 — Agent Section Updates

**File to edit:** `/architecture/system_implementation_prompt_part4.md`

Open this file. Make the following edits in order. After all edits, add a version changelog entry at the bottom of the file:
```
## Changelog
- v2.1: Added cross-references to CLIO_CLUSTER_HOST_CONTEXT.md, CLUSTER_SKILL_DISCOVERY_PROTOCOL.md,
  CLIO_PRIVATE_EPHEMERAL_CHAT.md, AGGILO_ONBOARDING_PLAYBOOK_V2.md. Added new queue job types.
  Added Section 22 (Ephemeral Chat Architecture).
```

**Also check Part 5:** `/architecture/system_implementation_prompt_part5.md` — Open this file. Locate the section covering Sage's skill list. Add a note referencing `CLUSTER_SKILL_DISCOVERY_PROTOCOL.md` as the governing document for Platform Capability skills and the Sage-Clio skill dialogue protocol. Add a similar note referencing `CLIO_CLUSTER_HOST_CONTEXT.md` for Clio's cluster host behaviour where that is described.

**Edits to Part 4:**

**Section 13 (Clio — The Orchestrator):** Add reference to `CLIO_CLUSTER_HOST_CONTEXT.md` for the full cluster host specification. The architecture part should summarise; the dedicated document is the authoritative spec.

**Section 18 (Queue Architecture):** Add all new job types from new documents to the job type table. Update lane assignments per the new document specs.

**New Section 22 — Ephemeral Chat Architecture:**

Add a section covering:
- Redis key patterns and TTL enforcement
- Supabase metadata table (sessions only, no content)
- Context assembly for ephemeral mode (session-scoped, not cluster-scoped)
- Welfare detection pipeline in ephemeral context
- The privacy architecture distinction (session-scoped context vs no context)

### 4.5 Update MASTER_INSTRUCTIONS.md

Add all new files to the document inventory:

| File | Location | Version | Status |
|------|----------|---------|--------|
| AGGILO_ONBOARDING_PLAYBOOK_V2.md | [confirmed path] | v2.0 | Active — supersedes v1 |
| CLUSTER_SKILL_DISCOVERY_PROTOCOL.md | [confirmed path] | v1.0 | Active |
| CLIO_CLUSTER_HOST_CONTEXT.md | [confirmed path] | v1.0 | Active |
| CLIO_PRIVATE_EPHEMERAL_CHAT.md | [confirmed path] | v1.0 | Active |

Update the DB schema source references to include new tables. Update the authority hierarchy to include the new cross-agent document at the correct level.

---

## Phase 5 — MVP: Sisters in Dua Cluster Implementation

*Execute only after Phase 4 is complete and Q5 answers are confirmed.*

**Expert persona active: Senior Full-Stack Engineer + AI Systems Engineer + UX Engineer**

> [!NOTE]
> The MVP runs on **Next.js** (not the Vite + Fastify monorepo). All code written in this phase must be appropriate for the Next.js stack in `/mvp/src/`. This includes Next.js API routes (`/app/api/`), server components where appropriate, and the Supabase JS client already configured in `/mvp/src/lib/`. Do not introduce Fastify patterns, BullMQ workers, or Turborepo-specific imports into the MVP codebase.

### 5.0 Governing Documents for MVP Implementation (Mandatory — Read Before Any Code)

The four new operational documents are not supplementary reading for the MVP — they directly govern specific features you will implement. Before writing any MVP code, confirm you have read each document and can answer the verification question next to it.

| Document | Governs in MVP | Verification Question |
|----------|---------------|----------------------|
| `CLIO_CLUSTER_HOST_CONTEXT.md` | Clio FAB behaviour inside the cluster; arc state; message budgets; compose bar placeholder; first-post acknowledgement; Atlas shim message | What are the three message budget types and their independent reset schedules? |
| `CLUSTER_SKILL_DISCOVERY_PROTOCOL.md` | Sage's Platform Capability skill category; the Sage-Clio skill dialogue protocol; Sage's limitation expression language (Section 8) | What is the difference between a Platform Capability skill proposal and all other skill categories in terms of what fires when it is proposed? |
| `CLIO_PRIVATE_EPHEMERAL_CHAT.md` | The lock icon → private ephemeral chat; what is stored in Redis vs Supabase vs nowhere; the 12-hour TTL; welfare escalation from private chat | What happens at 12h00s01 — exactly, in sequence? |
| `AGGILO_ONBOARDING_PLAYBOOK_V2.md` | Beta disclosure screen element at join; Clio-Sage introduction message template; cluster-type-calibrated onboarding copy | Under what condition does the beta disclosure screen element appear, and what triggers it? |

If you cannot answer any verification question above, re-read the corresponding document before proceeding.

**MVP implementation mapping — which document governs which checklist item:**

| MVP Checklist Item | Governing Document |
|-------------------|-------------------|
| Clio FAB present inside cluster | `CLIO_CLUSTER_HOST_CONTEXT.md` §[arc state + FAB presence] |
| Clio introduces Sage before cluster entry | `AGGILO_ONBOARDING_PLAYBOOK_V2.md` + `CLIO_CLUSTER_HOST_CONTEXT.md` |
| Compose bar placeholder is phase-appropriate | `CLIO_CLUSTER_HOST_CONTEXT.md` §[compose bar placeholder] |
| Clio private ephemeral chat via lock icon | `CLIO_PRIVATE_EPHEMERAL_CHAT.md` — entire document |
| Beta disclosure at join for non-South/SE Asia members | `AGGILO_ONBOARDING_PLAYBOOK_V2.md` §[beta disclosure] |
| Sage's limitation expression language | `CLUSTER_SKILL_DISCOVERY_PROTOCOL.md` Section 8 |
| Sage escalation language ("someone from this community") | `CLUSTER_SKILL_DISCOVERY_PROTOCOL.md` |
| Welfare escalation from private chat | `CLIO_PRIVATE_EPHEMERAL_CHAT.md` §[welfare detection] |
| Founder notification fires for welfare-flagged threads | `CLIO_PRIVATE_EPHEMERAL_CHAT.md` + `CLIO_CLUSTER_HOST_CONTEXT.md` |

> [!NOTE]
> In the Next.js MVP, there is no BullMQ. Where these documents specify a queue job (e.g., `ClioEphemeralWelfareEscalate`), implement the equivalent as a fire-and-forget Next.js API route call or Supabase Edge Function. The behaviour specified in the document must be preserved even if the delivery mechanism differs from the main platform.

---

### 5.1 Study the MVP Current State First

Before any changes, document what currently exists in the MVP:
- What screens/views are implemented?
- What backend routes exist?
- What database tables are in use?
- What agent integration (Clio, Sage, Atlas) currently exists, if any?
- What is the rendering state of the Arabic font and tajweed markup?
- What does the current Timeline look like?
- What is the current message posting flow?

Write a brief status document before proceeding. Ask for confirmation that your understanding is correct before making any changes.

### 5.2 Critical Behavioural Rule — Sage Does Not Own Every Post

This is the most important behavioural correction for the MVP:

**Current risk:** If Sage's `message_review` skill is implemented as "respond to every user post," the cluster will feel like every message goes to a bot. This breaks community trust immediately.

**Correct behaviour:**

Every user post passes through `message_review` (Skill 1) — this is a silent read, not a response trigger. The `message_review` routing is:

```
User posts → Sage reads silently → Routes through decision tree:

STEP 0: Does the message contain a welfare signal?
  YES → welfare_signal skill fires immediately (Skill 8)
  NO  → continue

STEP 1: Contains a dua/hadith/Quranic citation?
  YES → citation_check + evaluation (Skills 2, 3)
  NO  → continue

STEP 2: Is this a fiqh/permissibility/madhab question?
  YES → authority_redirect (Skill 6)
  NO  → continue

STEP 3: Would a verified reference genuinely ground this discussion?
  YES → reference_surface (Skill 4 — Atlas brief issued)
  NO  → continue

STEP 4: Emotionally significant + thread_state = unattended?
  YES → care-witness response (Skill 5, Mode B)
  NO  → continue

STEP 5: Thread 5+ posts, no prior Sage involvement, something genuine to contribute?
  YES → witness_participation (Skill 5, Mode A)
  NO  → SILENCE (default)
```

**A user asking "how was everyone's day?" produces no Sage response.** A user sharing a hadith produces a citation check. A user describing that they cannot pray produces a welfare signal and care-witness response. The routing is content-based, not post-presence-based.

**Implementation:** The `message_review` evaluation must run asynchronously after the post is saved. The user's post appears in the Timeline immediately. Sage's response (if any) appears separately, seconds or minutes later, as a distinct Sage-authored post. They are never the same action.

### 5.3 Server Delay Notification System

When any server operation takes longer than the defined threshold, the user must see a contextual "thinking" state. This applies to:

| Operation | Threshold | User-Facing Message |
|-----------|-----------|-------------------|
| Sage `message_review` evaluation | > 2 seconds | No message — Sage's response arrives when ready; user is not waiting |
| Atlas brief + content retrieval | > 5 seconds | No message — Atlas content arrives asynchronously; user is not waiting |
| Clio FAB chat response | > 1.5 seconds | Clio FAB enters Thinking mood state (M2 animation). No text message. |
| Clio ephemeral chat response | > 1.5 seconds | Typing indicator (three-dot animation) inside chat panel |
| Cluster join qualification check | > 1 second | "Checking..." in the join button (spinner replaces button text) |
| Post submission (API call) | > 500ms | Post button shows spinner; post appears optimistically in Timeline |
| OTP verification | > 1 second | "Verifying..." replaces button text |

**For Sage specifically:** Sage never makes the user wait for her. Sage's evaluation runs in the background. If Sage decides to post (after her evaluation), her post appears in the Timeline naturally — it is not triggered by the user waiting. The user posts, sees their post appear, and may later see a Sage response as a separate Timeline entry. There is no "Sage is thinking..." visible to users.

**For Clio in cluster host mode:** If Atlas is being briefed (60 seconds after a join), Clio may post a shim message to the Timeline: "I'm checking what's happening in this space right now..." — this is specified in `mobile_screen_prompts_phase1.md` (Screen 4.1, empty state). This is the one case where a delay-related message appears, and it is Clio's voice, not a system loader.

**For Clio in private ephemeral chat:** The typing indicator (three-dot animation) appears immediately when Clio begins generating. It disappears when the response arrives. This is standard messaging UX and should be implemented the same way as any modern messaging app.

**Implementation approach for optimistic posting (Next.js API route):**

```typescript
// mvp/src/app/api/sage/route.ts — or equivalent post submission route
// POST /api/clusters/[clusterId]/posts

export async function POST(request: Request, { params }: { params: { clusterId: string } }) {
  const supabase = createServerSupabaseClient();
  const body = await request.json();

  // Save post to Supabase immediately
  const { data: post, error } = await supabase
    .from('posts')
    .insert({ cluster_id: params.clusterId, content: body.content, ...body })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Return post to frontend immediately — do not wait for Sage
  const response = Response.json({ post, status: 'saved' }, { status: 201 });

  // Dispatch Sage message_review asynchronously via fetch to internal API
  // (In production: enqueue via BullMQ on main platform. In Next.js MVP: fire-and-forget fetch)
  fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/sage/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId: post.id, clusterId: params.clusterId }),
  }).catch(() => {}); // Non-blocking — failure does not affect post submission

  return response;
}
```

The user sees their post appear instantly. Sage evaluates in the background. Sage's response (if any) appears later as a distinct Timeline entry via Supabase Realtime.

### 5.4 Sisters in Dua MVP — Specific Implementation Checklist

Work through this checklist in order. Mark each item complete before proceeding to the next.

**Database:**
- [ ] `dua_vault` table created with full schema from cluster spec Section 5.1
- [ ] `thread_state` field added to relevant table (posts or threads)
- [ ] `welfare_flagged` state logic implemented with explicit resolution requirement
- [ ] Arabic font asset (KFGQPC Uthmanic Script Hafs) available and loadable
- [ ] Tajweed color scheme CSS variables defined (7 rules from spec Section 6.3)
- [ ] Progressive disclosure rendering (Arabic visible, transliteration visible, translation collapsed on tap)

**Sage Skill Implementation:**
- [ ] `message_review` routing implemented as described in 5.2 (silent read + conditional trigger)
- [ ] `citation_check` queries vault → Tier 1 APIs (HadithAPI, Quran.com v4)
- [ ] `evaluation` surfaces complete verified version in progressive disclosure format
- [ ] `reference_surface` triggers Atlas brief when "genuinely grounding" test passes
- [ ] `witness_participation` Mode A (standard) and Mode B (care-witness, 2-sentence hard limit)
- [ ] `authority_redirect` with single-beat and two-beat format (personal context detection)
- [ ] `welfare_signal` Skill 8 — Step 0, always first, three simultaneous actions confirmed
- [ ] `ramadan_mode` Hijri calendar module integrated (deterministic algorithm, no API needed)
- [ ] Sage's limitation expression language implemented per `CLUSTER_SKILL_DISCOVERY_PROTOCOL.md` Section 8
- [ ] Sage's escalation language uses "someone from this community will reach out" — never "founder" by name

**Atlas Modified Behaviour:**
- [ ] Standard internet crawl disabled for this cluster
- [ ] Vault-first query logic (Tier 0 → Tier 1 → Tier 2 → empty) implemented
- [ ] Madhab balance rule tracking implemented
- [ ] `vault_gap` counter triggers Observer finding at 3 consecutive gaps per thematic area
- [ ] Da'if and Mawdu grades never returned as reference content

**Content Rendering:**
- [ ] Arabic text renders right-to-left at 24px minimum, KFGQPC Uthmanic Script Hafs
- [ ] Tajweed markup renders for Quranic verses (pre-stored from Quran.com API, never generated dynamically)
- [ ] Transliteration visible by default (not hidden behind tap)
- [ ] Translation collapsed by default, tap to reveal
- [ ] Source citation renders below every reference

**Clio Integration:**
- [ ] Clio introduces Sage before user enters cluster (from `persona_confirmed` signal)
- [ ] Introduction is cluster-specific, not generic (references actual current activity)
- [ ] Introduction maximum 3 sentences, names what Sage does and does not do
- [ ] Clio FAB present inside cluster (accessible, not intrusive)
- [ ] Clio private ephemeral chat available from inside cluster via lock icon

**Governance:**
- [ ] Founder notification fires for welfare-flagged threads
- [ ] `welfare_flagged` thread state visible in Manager panel with distinct indicator
- [ ] Manager panel shows Sage intervention log with flag option
- [ ] Country selection at join (mandatory, non-gating)
- [ ] Beta disclosure for non-South/Southeast Asia members (one-time, at join confirmation)

**UX:**
- [ ] Post submission is optimistic — post appears immediately, Sage evaluates asynchronously
- [ ] No "Sage is thinking..." visible to users
- [ ] Clio FAB shows Thinking state only during Clio's own response generation
- [ ] Typing indicator in Clio ephemeral chat
- [ ] Compose bar placeholder is cluster-specific and phase-appropriate
- [ ] Salah window detection — Sage does not post within 10 minutes of prayer time for cluster's primary time zones

---

## Phase 6 — Final Verification and Consistency Audit

*Execute only after all previous phases are complete.*

**Expert persona active: Technical Documentation Lead + Information Architect**

### 6.1 Cross-Document Consistency Check

Run these checks before declaring the session complete:

**Tech stack audit:** Search the entire project for any remaining Laravel/PHP/artisan references. Zero tolerance. Report every finding before closing. Specifically search for:
- `Laravel` / `laravel`
- `PHP` / `.php` (excluding the `/launch/landing/submit.php` and `/launch/global_landing/submit.php` form handlers, which are intentional legacy HTML form processors — flag these for future replacement but do not break them)
- `Artisan` / `artisan`
- `Yantra` / `yantra` (the deprecated name — must be zero occurrences outside `/yantra/` folder itself and any archived docs)
- `composer.json` (as a dependency management reference in new documentation)
- `Laravel Horizon` (anywhere outside of archived documents)

**Agent loading order audit:** Confirm that both `sage/AGENTS.md` and `clio/AGENTS.md` reference all new documents in their loading order sections.

**Database consistency:** Confirm that every table and column referenced in any MD file exists in at least one migration file. No document should reference a field that has no migration.

**API endpoint consistency:** Confirm that every endpoint referenced in any PRD or architecture file has a corresponding route definition (or placeholder) in `apps/api/src/routes/`.

**Queue job consistency:** Confirm that every job type named in any document has a corresponding TypeScript worker file created or stubbed in `apps/api/src/workers/`.

**HTML parity:** For every MD file that has an HTML counterpart, confirm the HTML was updated to reflect all changes.

**MASTER_INSTRUCTIONS.md final state:** This document should be the complete, accurate inventory of every file in the project with its version and status. Verify it is current.

### 6.2 Questions to Ask Before Closing

Before declaring the session complete, ask:

1. Are there any files I modified that I have not explicitly listed in a change summary?
2. Are there any PRD files that reference behaviour now governed by new documents — where the PRD and the new document might create contradictory guidance?
3. Is the MVP build-runnable after these changes, or does it require additional configuration not covered in this session?
4. Are there any team members or other agents who use these files for their own work whose workflows I may have disrupted?

---

## Session Rules for the Coding Agent

1. **Ask before acting.** If a question is listed in Phase 0 and it is unanswered, do not proceed past that phase. Create a waiting state and ask.

2. **Announce your expert persona** at the start of each section. "As Principal Software Architect, here is my analysis..." not generic "here's what I'll do."

3. **Show your work.** Before making changes to any file, state: (a) what the file currently says, (b) what it will say after, (c) why the change is correct. Do not edit silently.

4. **Never delete without confirming.** If a file should be replaced or archived, state your intention and wait for confirmation before executing.

5. **Version everything.** Every modified architecture file gets a version bump and a one-line changelog entry at the bottom.

6. **Test your understanding of Sage.** Before writing any Sage implementation code, state in one paragraph: what Sage does, what she does not do, and what the difference is between `message_review` as a routing skill vs a response trigger. If your paragraph is wrong, you have not understood the spec.

7. **Test your understanding of the ephemeral chat.** Before implementing any ephemeral chat code, state: what is stored in Redis, what is stored in Supabase, what is stored nowhere, and what happens at 12h00s01. If you cannot answer all four, re-read `CLIO_PRIVATE_EPHEMERAL_CHAT.md`.

8. **The welfare escalation cannot be disabled.** In no implementation, in no mode, in no context does Sage or Clio silently ignore a welfare signal. This is a hard constraint. If you find yourself writing code that would skip welfare detection, stop and ask.

9. **Sage's silence is a feature.** A user posting without triggering any of Sage's skill conditions receives no Sage response. This is correct. It is not a bug. It is not an edge case to be handled. Do not add fallback responses.

10. **One thing at a time.** Complete a phase fully before beginning the next. Partial completion of multiple phases simultaneously creates consistency errors that are hard to track.

11. **The MVP stack is Next.js — do not bleed in the main platform stack.** All code written inside `/mvp/` must use Next.js patterns (App Router API routes, server components, Supabase JS client). Do not import from `apps/api/`, do not introduce BullMQ into the MVP, do not use Fastify patterns inside `/mvp/`. The MVP is a self-contained Next.js application.

---

*Master Coding Agent Prompt · Aggilo Platform · Session: PRD Alignment, Architecture Completion, MVP Implementation*
*Generated from session context including PRD (12 documents), platform rules, agent soul documents, Sisters in Dua cluster spec v3.1, mobile screen prompts phase 1, system implementation prompts parts 1–5 (MASTER_INSTRUCTIONS_v2), and four new operational documents (Onboarding Playbook V2, Cluster Skill Discovery Protocol, Clio Cluster Host Context, Clio Private Ephemeral Chat).*
