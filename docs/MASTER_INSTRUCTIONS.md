# Aggilo — Master Implementation Instructions

> **⚠️ This document has been superseded as the implementation specification.**
>
> The canonical system implementation specification now lives in the `architecture/` folder, split into focused parts:

| Part | File | Covers |
|------|------|--------|
| **1** | [`architecture/system_implementation_prompt_part1.md`](../architecture/system_implementation_prompt_part1.md) | Tech stack, project structure, config, data acquisition layer |
| **2** | [`architecture/system_implementation_prompt_part2.md`](../architecture/system_implementation_prompt_part2.md) | Database schema, ER diagram, RLS policies, sequence diagrams — **v2.1: 4 new tables, 5 ALTER statements** |
| **3** | [`architecture/system_implementation_prompt_part3.md`](../architecture/system_implementation_prompt_part3.md) | API routes, implementation phases, verification checklists — **v2.1: ephemeral chat + skill discovery endpoints** |
| **4** | [`architecture/system_implementation_prompt_part4.md`](../architecture/system_implementation_prompt_part4.md) | AI agent architecture, BullMQ queues, LLM router, Observer — **v2.1: Section 22 (Ephemeral Chat), 6 new queue jobs** |
| **5** | [`architecture/system_implementation_prompt_part5.md`](../architecture/system_implementation_prompt_part5.md) | Sage full specification, arc phase behaviors, content curation — **v2.1: skill dialogue cross-refs** |

> The active **session prompt** for documentation alignment is [`AGGILO_MASTER_PROMPT_V3.md`](../AGGILO_MASTER_PROMPT_V3.md) (the V3 prompt at workspace root). It governs Phase 1 (document migration), Phase 2 (architecture-parts updates), Phase 3 (landing pages), Phase 4 (screen prompts), Phase 5 (Sage label rename), and Phase 6 (MVP implementation).

---

## Document Inventory (post V3 Phase 1 migration)

### Authoritative Sources

| Layer | File | Purpose |
|-------|------|---------|
| Session prompt | [`AGGILO_MASTER_PROMPT_V3.md`](../AGGILO_MASTER_PROMPT_V3.md) | The current V3 prompt — supersedes all prior master prompts |
| Soul | [`AGGILO_SOUL.md`](../AGGILO_SOUL.md) | Philosophical foundation (read-only reference) |
| Platform rules | [`AGGILO_PLATFORM_RULES.md`](../AGGILO_PLATFORM_RULES.md) | Operational rules and Infrastructure (v3 alignment: Anchor terminology, @Sage rule, chatbox rule, Node/Fastify stack) |
| PRD index | [`PRD/00_prd_index.md`](../PRD/00_prd_index.md) | Frozen — read for product intent only. Stack references in PRDs are superseded by `architecture/`. |
| Tooling | [`CLAUDE.md`](../CLAUDE.md) | gstack tooling configuration |

### Operational Documents (post-V3 placement)

| File | Location | Version | Status |
|------|----------|---------|--------|
| `AGGILO_ONBOARDING_PLAYBOOK_V2.md` | `docs/` | v2.0 | Active |
| `AGENT_COLLABORATION_CHATBOX.md` | `docs/` | v1.0 | Active — agent chatbox cadence and authority |
| `CLUSTER_FEATURES_TAB.md` | `docs/` | v1.0 | Active — cluster features tab spec |
| `CLUSTER_SKILL_DISCOVERY_PROTOCOL.md` | `docs/` | v1.0 | Active — cross-agent protocol (Sage + Clio) |
| `CLIO_SAGE_HANDOFF.md` | `docs/` | v1.2 | Active — handoff protocol (Anchor terminology, chatbox triggering_observation hook) |
| `CLIO_AMBIENT_PROTOCOL.md` | `docs/` | v1.0 | Active — Clio's ambient invocation model |
| `CLIO_CLUSTER_HOST_CONTEXT.md` | `clio/` | v1.0 | Active — Clio's cluster anchor behaviour (filename retains "HOST" as historical naming; the document content reflects current architecture) |
| `CLIO_UNIFIED_CLUSTER_PRESENCE.md` | `clio/` | v1.0 | Active — unified Clio presence; supersedes the in-cluster behavioural framing previously in `CLIO_PRIVATE_EPHEMERAL_CHAT.md` |
| `SAGE_ANCHOR_PROTOCOL.md` | `sage/` | v1.0 | Active — Anchor reframe, @Sage protocol, deduplication, bridge messages |
| `SAGE_FEATURE_INTELLIGENCE.md` | `sage/` | v1.0 | Active — feature-signal observation, 48h evaluation cycle |
| `CLUSTER_UI_MICROINTERACTIONS.md` | `Revised_Screen_Prompts/` | v1.0 | Active — motion and microinteraction spec (subordinate to `mobile_screen_prompts_phase1.md` for visual identity) |
| `mobile_screen_prompts_phase1.md` | `Revised_Screen_Prompts/` | Phase 1 | Active — visual identity (V3 Phase 4–5 alignment pending) |
| `SOUL_INJECTION_MAP.md` | `docs/` | v1.0 | Active — soul tier injection per agent |
| `SPEC_ADDENDUM.md` | `docs/` | v1.0 | Active — Scout outreach reframe, privacy gate, calibration queue |
| `PRE_FLIGHT_AUDIT.md` | `docs/` | 2026-05-09 | Reference — pre-development audit (informational; some items already addressed by V3) |
| `PRODUCTION_FIXES.md` | `docs/` | v1.0 | Reference — patch set (informational; under review in V3 Phase 2) |
| `AGGILO_SYSTEM_DIAGRAM.mermaid` | `docs/` | — | Reference diagram (V3 Phase 2 will refresh to remove Yantra/Laravel labels) |

### Agent Configuration Files (v1.3 post-V3 alignment)

| File | Version | Notes |
|------|---------|-------|
| `clio/SOUL.md` | v1.0+ | Character brief — V3 Phase 2 may add cluster-presence note |
| `clio/AGENTS.md` | v1.3 | Cluster Anchor extended-reference section, unified presence rule, agent chatbox activation authority, retired `cluster_host`/`atlas_orchestration` skill rows |
| `clio/SOUL_EXTRACT.md` | v1.0 | Long-context fallback distillation — kept as a last-resort survival prompt under context pressure |
| `clio/MEMORY.md`, `clio/USER.md` | v1.0 | Per-user memory and context schemas |
| `clio/personas/_template.md` | v1.0 | Template for new persona authors |
| `clio/personas/{anchor_36_50,campus_18_24,explorer_13_17,momentum_25_35}/IDENTITY.md` | varies | Demographic personas |
| `clio/skills/{atlas_orchestration,connection_intro,sage_coordination,sage_introduction,waitlist_form}/SKILL.md` | v1.0 | On-demand skill files |
| `sage/SOUL.md` | v1.2 | Anchor reframe, warmth-and-hope register, silence-as-judgment |
| `sage/AGENTS.md` | v1.3 | Anchor terminology; SAGE_ANCHOR_PROTOCOL, SAGE_FEATURE_INTELLIGENCE, AGENT_COLLABORATION_CHATBOX in loading order; @Sage protocol; Timeline (not Pulse tab) framing |
| `sage/SAGE_SKILLS.md` | v1.2 | Five skill categories including Platform Capability |
| `sage/sage_character_prompt.md`, `sage/sage_image_prompts.md`, `sage/sage_animation_prompts_v1.md` | v1.0 | Visual identity (label changed from "Sage · Host" to "Sage · Anchor") |
| `sage/skills/{cluster_description_refinement,scripture_current_affairs}/SKILL.md` | v1.0 | Sage's named skills |
| `atlas/AGENTS.md`, `atlas/SOUL.md`, `atlas/skills/cluster_pulse/SKILL.md` | v1.x | Atlas — content intelligence |
| `scout/AGENTS.md`, `scout/SOUL.md` | v1.x | Scout — macro-discovery + outreach intelligence (per `SPEC_ADDENDUM.md`) |
| `observer/AGGILO_OBSERVER_AGENTS.md` | v1.2 | Observer — 10 domains |

### Cluster Tooling

| File | Purpose |
|------|---------|
| `clusters/CLUSTER_TOOLS_TEMPLATE.md` | Standard template for cluster tool inventories |
| `clusters/the_single_source/{CLIO_ONBOARDING.md, CLUSTER_DESCRIPTION.md, CLUSTER_TOOLS.md, SAGE_PERSONA.md}` | First live cluster instantiation |
| `maintenance/README.md` | Tool proposal lifecycle |
| `maintenance/templates/TOOL_PROPOSAL_TEMPLATE.md` | Standard tool-proposal MD format |

### Legacy Reference (read-only — do not modify)

| File | Location | Status |
|------|----------|--------|
| `YANTRA_BRIDGE_SPEC.md` | `yantra/` | Deprecated — patterns now in Node.js BullMQ workers (Agent Runtime). The folder name is the only legacy element; routing patterns remain a useful reference. |
| `yantra/README.md` | `yantra/` | Deprecated — see deprecation header in file |
| `yantra/routing_table.json` | `yantra/` | Routing data is **valid** — V3 Phase 2 will append new operation keys (`agent_chatbox_exchange`, `sage_feature_evaluation`, `sage_at_mention`, `sage_bridge_message`). Do not migrate the file; only extend. |
| `yantra/guides/*.html` | `yantra/guides/` | Read-only legacy guides retained for historical context |

### Archived (post-V3 cleanup)

| File | Archive location | Reason |
|------|-----------------|--------|
| `CLIO_PRIVATE_EPHEMERAL_CHAT.md` | `docs/_archived/` | Behavioural framing ("cluster mode" vs "private mode") superseded by `clio/CLIO_UNIFIED_CLUSTER_PRESENCE.md`. Redis storage / welfare-detection / lifecycle sections remain authoritative as a technical sub-spec. |
| `CLUSTER_DESCRIPTION_REFINEMENT.md` (early draft) | `docs/_archived/` | Superseded by `sage/skills/cluster_description_refinement/SKILL.md` |
| `CLIO_SAGE_HANDOFF_PROTOCOL.md` | `docs/_archived/` | Merged into `docs/CLIO_SAGE_HANDOFF.md` v1.2 |
| `AUTORESEARCH_EXTENDED.md`, `MEMPALACE_ARCHITECTURE.md`, `PLATFORM_INTELLIGENCE.md`, `aggilo-soul.html` | `docs/_archived/` | Earlier draft material |
| `master_prompt_v2_pre_v3.md`, `redundancy_audit_2026-05-07.md`, `walkthrough_pre_v3.md`, `project_structure_pre_v3.md`, `asset_persona_review_pre_v3.md` | `docs/_archived/session_artifacts/` | Pre-V3 session artifacts |
| `mobile_screen_prompts_v1.md` | `Revised_Screen_Prompts/_archived/` | Phase 1 v2 (`mobile_screen_prompts_phase1.md`) is current |
| `clio/legacy/clio_bible_text.txt`, `.docx`, `.html` | `clio/legacy/` | Historical character bible kept in agent-local legacy folder |

---

*Updated 2026-05-18 as part of V3 Phase 1 (document migration and organisation). Previous revision: 2026-05-16.*


---

## V3.2 — Phase 1 UX + 7-Principles Alignment (current)

This revision incorporates the Phase 1 UX work and the seven AI-native principles directly into the architecture documents. No new top-level docs were created. Existing docs were extended:

- `architecture/system_implementation_prompt_part1.md` § 7 — new section on the seven AI-native principles, what's immutable across all clusters, what varies, cluster maturity tiers, first-visit cognitive load invariants, welcome surface.
- `architecture/system_implementation_prompt_part4.md` § 33 — agent behavioural invariants: no protocol disclosure, repetition guard, sycophancy ban, welcome posts, admin label neutralisation, cadence prompt focus areas, feature ideation lifecycle.
- `architecture/premium_cluster_requirements.md` § 8 — Phase 1 UX invariants for premium clusters: cognitive load budget, social proof signals, agent dialogue rules, no protocol disclosure, repetition guard, feature pipeline tiers, member-initiated proposals.

### Key behavioural changes in code

| Change | Where |
|--------|-------|
| Sage repetition guard (Jaccard similarity) | `mvp/src/lib/sage-prompt.ts:isSagePostRepetitive` |
| Cadence prompt — skepticism | `mvp/src/app/api/agents/cadence-exchange/route.ts:PROMPT` |
| Welcome new-member endpoint | `mvp/src/app/api/agents/welcome-new-member/route.ts` |
| Anonymous typing indicator | `mvp/src/components/TypingIndicator.tsx`, `mvp/src/lib/presence-context.tsx` |
| Agent Thoughts collapsed by default | `mvp/src/components/AgentChatbox.tsx` |
| Admin label neutralisation ("Care queue", neutral step labels) | `mvp/src/components/admin/AdminNavbar.tsx`, `mvp/src/app/admin/character/page.tsx`, `mvp/src/app/admin/thoughts/page.tsx` |
| Sage no-protocol-disclosure rule | `mvp/src/lib/sage-prompt.ts:SAGE_SYSTEM_PROMPT` |
| Prominent presence header | `mvp/src/components/ClusterPresence.tsx` |

### What is now invariant across ALL clusters (premium and regular)

1. The Aggilo Soul (monotheistic foundation, connection-as-means)
2. Welfare protocol (regex + Step 0 + admin queue)
3. Good-character protocol (Step 0.5)
4. No protocol disclosure to members or admins (admins see neutralised labels only)
5. Repetition guard
6. Skepticism in agent-to-agent dialogue
7. Privacy boundaries on Clio's "Just between us" tab
8. AGGIL post-spawn protections

### What varies by cluster

Sage register, vocabulary, vault grading, authority redirect language, geographic gate, feature pipeline thresholds.

*Updated 2026-05-21 as part of V3.2 (Phase 1 UX + 7-principles audit). Previous revision: 2026-05-18.*


---

## V3.3 — Phase 0 Stage Definition + Vault-Entry Repetition Protocol (current)

### Phase 0 — Single-Cluster Validation Stage

The current live deployment (`mvp.aggilo.in`) operates under **Phase 0** of the Aggilo platform. Phase 0 is a generic stage definition: a single premium cluster running on a stripped-down Next.js 14 stack, used to validate agent behaviour, welfare protocol, feature pipeline, closed-loop telemetry, and hierarchy-first UX before scaling to generic clusters.

Phase 0 is NOT the platform. It is the first live cluster running under simplified conditions. Phase 1 (the platform) hosts generic and premium clusters with the full AGGIL engine, Scout, Atlas, Observer, and multi-cluster navigation.

**Generic Phase 0 scope:** Single cluster, single region, vault-only references, no Scout/Atlas/Observer, no generic cluster creation, no AGGIL engine. Admin manually elevated via SQL or `ADMIN_EMAILS` env. Stack is Next.js 14 App Router + Supabase + a single LLM endpoint with fallback. Cluster-specific Phase 0 details (vocabulary, geography, vault grading rules, register) live in the cluster's spec, not in this changelog or the architecture documents.

**Phase 0 → Phase 1 transition signals (per cluster):** ≥50 active members, welfare protocol exercised 3+ times, feature pipeline produced 2+ admin-approved features, introspection cycle run 10+ times, at least 1 Sage prompt proposal reviewed by Admin.

The first live Phase 0 cluster is Sisters in Dua. Cluster-specific configuration is documented in [`architecture/premium_cluster_requirements.md` §6 and §9](../architecture/premium_cluster_requirements.md#6-sisters-in-dua--the-first-premium-cluster) and the cluster's own spec.

### Vault-Entry Repetition Protocol

Two-layer deduplication prevents the same vault entry from appearing twice in a cluster within 14 days. The protocol is generic — the "vault" is whatever knowledge base a cluster maintains (duas, case studies, precedents, etc.):

1. **Cadence path** (`suggest-*` endpoints): excludes recently-used vault IDs from the eligible pool. If pool exhausted, posts a standalone pointer.
2. **Evaluate path** (`sage/evaluate`): checks `vaultIdToPostId` map after LLM responds. If the entry was already posted, posts a **reply-style pointer** to the triggering member's post instead of re-posting the entry.
3. **Jaccard similarity guard**: application-layer check (threshold 0.55) catches near-duplicate free-text responses.

The pointer behaviour is intentional: it says "I noticed we already covered this" — reinforcing the sense of a living, continuous room.

### Key additions in V3.3

| Change | Where |
|---|---|
| Vault-ID dedup + pointer reply in evaluate path | `mvp/src/app/api/sage/evaluate/route.ts` |
| Sage prompt: `vault_id_used` instruction | `mvp/src/lib/sage-prompt.ts` |
| Phase 0 stage definition (generic) | `architecture/system_implementation_prompt_part1.md` §8 |
| Vault-entry repetition protocol (generic) | `architecture/system_implementation_prompt_part5.md` §33 |
| Phase 0 cluster-specific spec | `architecture/premium_cluster_requirements.md` §9 |
| Phase 0 screen behaviour (cluster-specific) | `Revised_Screen_Prompts/mobile_screen_prompts_phase1.md` — Phase 0 appendix |

### V3.3.1 — Documentation cleanup

V3.3.1 corrects a documentation slip in the original V3.3 publication, where MVP-specific terms (e.g. `dua_vault`, "Sisters in Dua", India-only) had leaked into the architecture documents that are meant to describe the generic platform. The architecture documents (`system_implementation_prompt_part1.md`, `system_implementation_prompt_part5.md`) and this `MASTER_INSTRUCTIONS.md` are now cluster-agnostic. Cluster-specific configuration lives in `premium_cluster_requirements.md` and the cluster's own spec.

### V3.3.2 — Further architecture-cluster separation + demographic chips invariant

V3.3.2 extends V3.3.1 with three additional scoping fixes and one new platform-level UX invariant:

- **part1.md §7.5/§7.6** — replaced cluster-specific noun "sisters" with generic "members"; clarified that cluster-specific noun is plugged in from cluster vocabulary config. Updated the welcome-line example. Added Clio FAB idle-breathing note.
- **part1.md §7.7 (new)** — **Demographic Restriction Chips** invariant. Every cluster header shows only its active AGGIL restrictions as small muted pill chips. No restriction on a dimension means silence on that dimension. All dimensions open earns a single `🌐 Global` chip. Pattern is platform-level so chips render consistently across all clusters.
- **part4.md §13** — three paragraphs (Clio nudges, Cadence exchanges, Pinned reference variety, Typography, Time display) reframed to lead with the generic principle and treat the live faith cluster as a Phase 0 example, not the canonical case.
- **part5.md §32** — renamed "Phase F — MVP Alignment (Sisters in Dua)" to "Phase F — Phase 0 Cluster Alignment". Made the body cluster-agnostic.
- **Code (Phase 0 reference impl)** — ClusterHeader now renders demographic chips (`🇮🇳 India`, `♀ Women`); ClioFab gets idle-breathing halo (`clio-fab-idle`); PostCard context menu rendered through React Portal (fixes Mac right-click clipping where only the bottom action was visible).

*Updated 2026-05-21 as part of V3.3.2 (deeper architecture/cluster separation + demographic chips invariant). Previous revision: V3.3.1.*

---

## V3.4 — Room Workshop + Two-Track Capability Model (current)

The agent collaboration surface is renamed and reframed. The agents are visible **service providers**, not observers. The surface where members see them working — formerly "Agent Thoughts" — is now **"Room Workshop."** Every prompt instruction, label, and copy choice reinforces a single mental model: the agents are infrastructure, working *for* the room. They never observe or comment on members.

### The Service-vs-Surveillance Frame

The cadence-exchange prompt was rewritten with a hard rule: agents never say "members are…" or "the room feels quiet." Every sentence is about the room's capabilities, the agents' own work, or what could be built. Subjects of dialogue are: tools, features, the room as a thing, the agents themselves. Never the members.

This is a behavioural correction. Members reading agent dialogue framed as observation — even well-intentioned — feel surveilled. Members reading agent dialogue framed as service feel served. The platform's soul says the agent is a servant, not an authority. The Workshop frame finally aligns the visible dialogue with that conviction.

### The Two-Track Capability Model

A platform-level invariant introduced in V3.4. Every capability the agents propose is one of two kinds:

| Track | What it is | Who decides | Member UI |
|---|---|---|---|
| **Agent Tool** (`kind: 'agent_tool'`) | Sage/Clio run it on behalf of the room. Members receive output, never click. | Agents deploy autonomously within rules. Admin can veto. | "Already running" / "We'll build this" / "Live" — no vote button |
| **Member Feature** (`kind: 'member_feature'`) | UI surface or interaction members touch. | Member upvote (count threshold: 10 = admin priority flag) + admin awareness. | Upvote + comment, vote-gated by cluster-size tier |

Each capability also carries a `build_status`:

- `deployable_now` — Sage can simulate it today using existing primitives (e.g. inline tajweed formatting in posts)
- `needs_building` — requires developer code (Phase 0: admin builds; Phase 1: agents may build in sandbox)
- `building` / `live` / `paused` / `retired` — lifecycle

This separation matters because the approval and member-visibility flows differ. An agent tool with `deployable_now` ships immediately. A member feature with `needs_building` sits in the Workshop collecting upvotes until the admin approves development.

### Platform-Level Changes

| Change | Where |
|---|---|
| Cadence prompt rewrite (service framing, two-track output, spec field) | `mvp/src/app/api/agents/cadence-exchange/route.ts` |
| `cluster_features` schema extended: `kind`, `build_status`, `spec`, `invocation_count`, `last_invoked_at` | `mvp/supabase/APPLY_NOW.sql` v1.7 |
| New table: `cluster_tool_invocations` — closed-loop telemetry for tool usage | `mvp/supabase/APPLY_NOW.sql` v1.7 |
| Updated RLS: members see `agent_tool` only when `deployable_now` or `live` | `cluster_features` SELECT policy |
| Workshop UI — separates tools (cyan, no vote) from features (amber, vote) | `mvp/src/components/FeaturesList.tsx` |
| All "Agent Thoughts" labels → "Room Workshop" | `AgentChatbox.tsx`, `Navbar.tsx`, `AdminNavbar.tsx`, admin pages |
| Two-track invariant added to platform architecture | `architecture/system_implementation_prompt_part1.md` §7.8 (new) |
| Workshop reflected in cluster maturity tier table | `architecture/system_implementation_prompt_part1.md` §7.4 |
| Workshop reflected in premium-cluster invariants | `architecture/premium_cluster_requirements.md` §8 |

### What Stays the Same

- The seven AI-native principles (V3.2)
- Phase 0 stage definition (V3.3)
- Vault-entry repetition protocol (V3.3)
- Demographic chips invariant (V3.3.2)
- The cadence floor (2h cold / 4h active)
- The 60/40 ship/observe bias
- The skepticism-not-sycophancy rule in agent dialogue
- The no-protocol-disclosure rule

### Pending Doc Refactors (next pass)

These deep-spec documents still reference the old "Agent Thoughts" / "Features Tab" naming and need a v2 refactor to the Workshop + two-track model. Code is already correct; docs are scheduled:

- `docs/AGENT_COLLABORATION_CHATBOX.md` v2 — full refactor to Room Workshop spec
- `docs/CLUSTER_FEATURES_TAB.md` v2 — merge into the Workshop spec or deprecate
- `architecture/system_implementation_prompt_part2.md` §5.1.2 — schema-additions notes update
- `architecture/system_implementation_prompt_part3.md` §7.17 — API path naming (member-facing endpoints stay `/cluster/features` for URL stability; only labels change)
- `architecture/system_implementation_prompt_part4.md` — ASCII diagram update
- `architecture/system_implementation_prompt_part5.md` §32 Phase E — Workshop terminology

*Updated 2026-05-21 as part of V3.4 (Room Workshop + two-track capability model). Previous revision: V3.3.2.*


---

## V3.5 — Session A: Bug Fixes + Premium Configurability + Cluster Identity Decisions (current)

This revision closes Session A from `docs/sessions/SESSION_A_CONFIGURABILITY.md`. Five live-product bugs are fixed, three strategic cluster-identity decisions are recorded, and the schema for premium cluster configurability ships in `APPLY_NOW.sql` v1.8.

### Live-product bug fixes (B1–B5)

| Bug | Symptom | Fix |
|---|---|---|
| **B1** | `@Sage` queries about current developments produced silence — Sage's prompt biased toward verified-vault references with no honest fallback | Added Step 6 (Current-Events Fallback) to Sage's framework. Sage now acknowledges the limit honestly in two-to-three sentences, invites the member to share what they have heard, and offers to reflect together. New decision tag step `current_events_fallback` added to `SAGE_DECISION` schema. |
| **B2** | Cadence-exchange dialogue contained member-blame framing ("the room has been repeatedly requesting…", "indicating a need…") despite the V3.4 prompt forbidding it | Two-layer fix: (a) prompt hardened with rejection examples — exact phrasings that have shipped before are listed as banned patterns the model must recognise and refuse; (b) server-side regex validator (`hasForbiddenFraming`) runs on `sage_message`, `clio_message`, `trigger_context` after parse. On match: retry once with a hardened reminder; if second attempt also fails, degrade to fixed observe_mode line and log to `behavioural_events` (`cadence_validator_fallback`). |
| **B3** | "Sage is considering this" indicator only fired for optimistic posts, leaving members staring at silence during real-time @Sage processing | `PostCard.tsx` extended to fire the indicator for non-optimistic posts that mention @Sage and have no Sage reply yet, gated by post age <60s. A 5s tick interval re-renders so the indicator naturally times out at the 60s mark — genuine silence after that point is valid. |
| **B4** | Clio FAB privacy banners were misleading — both tabs are private to the user, but the AMA tab read like it was less private. Tab labels conflated privacy with storage class. | Tab labels: `Just between us · ephemeral` / `Private Chat · I remember`. Banners rewritten to make explicit: both tabs are private, the difference is what the platform remembers (12h ephemeral vs persistent). First-open tab explainer surfaces once per device with the same point in plain language. |
| **B5** | New members had no guided way to learn what each cluster surface does (Workshop, presence header, chips, posts, compose bar, @Sage) | Collapsible "What's on this page?" section added to the Private Chat tab inside a cluster. Nine platform-baseline help items, each with a label, description, and click-to-scroll-and-flash behaviour. Anchor IDs (`#aggilo-cluster-presence`, `#aggilo-cluster-chips`, etc.) added to the corresponding components. Platform-baseline list — every cluster gets these, not Workshop-driven. |

### Strategic cluster-identity decisions

| ID | Decision | Where recorded |
|---|---|---|
| **D1** | **Defer Atlas to Phase 1.** Phase 0 cost of building Atlas (data acquisition layer + worker infrastructure + Atlas prompt) is ~1 week vs ~30 min for an honest Sage fallback. The honest fallback is the better Phase 0 answer. | Sage prompt Step 6 ships the fallback; Atlas remains in Part 1 §13 / Part 5 §22 unchanged. |
| **D2** | **Keep "Sisters in Dua" as the formal cluster name.** The name is a poetic seed, not a content gate. Renaming costs SEO and member identity. Vocabulary expansion happens in Sage's prompt, not the cluster name. | No code change — clarification only. |
| **D3** | **Add `platform_admin` as the 4th `profiles.role` value.** Cross-cluster authority for the Aggilo team. Every action audited via `cluster_admin_actions`. | DDL in `APPLY_NOW.sql` v1.8 §27. Architecture in `system_implementation_prompt_part1.md` §7.9. |
| **D4** | **The slider is the ceiling for free-text guidance.** Free-text refines within the chosen level; it cannot transgress it. | `premium_cluster_requirements.md` §10.3. |
| **D5** | **Admin-requested skills go through Workshop pipeline. No fast-track.** Phase 0 turnaround 1–4 weeks is acceptable. | `premium_cluster_requirements.md` §10.4. |
| **D6** | **Three-level slider** (`min` / `medium` / `high`). Not a continuous 0–100. Behaviours are discrete; cognitive load is bounded; member legibility holds. | `premium_cluster_requirements.md` §10.6. |
| **D7** | **English-only free-text guidance for V1.** Multi-lingual parsing deferred to Phase 1. | Not yet in code; documented as a V1 constraint. |
| **D8** | **Skills opt-in to existing premium clusters when new skills ship.** Notify admin at next visit; do not auto-apply. | Behaviour deferred to skill-registry consumer code; documented in `premium_cluster_requirements.md` §10.4. |
| **D9** | **Defer hard language gate for premium clusters to Phase 1.** Phase 0 enforces by AGGIL only. | No code change; documented. |

### Premium configurability schema (APPLY_NOW.sql v1.8)

Five new objects, idempotent and safe to re-run:

| # | Object | Purpose |
|---|---|---|
| 27 | `profiles.role` CHECK extension | Adds `platform_admin` to allowed values |
| 28 | `cluster_config` | Per-cluster admin settings: slider, agent_disabled, free_text_guidance, parsed_directives, enabled_skills, custom_skill_requests |
| 29 | `cluster_admin_actions` | Append-only audit trail for every config change, override, or veto |
| 30 | `skill_registry` | Platform-wide skill catalogue. Seeded with 12 skills covering current Sage/Clio capabilities (verified-reference-curation, vault-gap-detection, cadence-workshop-dialogue, welfare-detection, character-protocol, clio-private-chat, sage-clio-handoff, link-on-topic-evaluation, introspection-cycle, typing-indicator-broadcast, presence-acknowledgment, current-events-fallback) |
| 31 | Backfill | Sisters in Dua gets a default `cluster_config` row at `medium` involvement with all default-enabled skills pre-applied — behaviour stays exactly as it is today after migration |

RLS: all members read their cluster's config; only `founder` / `manager` / `platform_admin` write. `skill_registry` is platform-wide read; only `platform_admin` mutates. `cluster_admin_actions` is append-only and admin-readable.

### Slider behavioural matrix recorded

The full matrix mapping each agent behaviour to Min / Medium / High slider levels — including the **immutable safety floor** rows that always run regardless of slider position or `agent_disabled` flag — lives in `architecture/premium_cluster_requirements.md` §10. The platform-level summary lives in `architecture/system_implementation_prompt_part1.md` §7.9.

### Files touched

**Code (`mvp/`):**
- `src/lib/sage-prompt.ts` — Step 6 current-events fallback + decision tag schema extension
- `src/app/api/agents/cadence-exchange/route.ts` — rejection-example block, `FORBIDDEN_SUBJECT_PATTERNS`, `hasForbiddenFraming` validator with retry-and-degrade
- `src/components/PostCard.tsx` — extended Sage indicator to non-optimistic posts <60s old with 5s tick
- `src/components/ClioFab.tsx` — corrected tab labels, banner copy, first-open explainer, `ClusterHelpSection` collapsible
- `src/components/ClusterFeed.tsx`, `src/components/ClusterHeader.tsx` — anchor IDs for help-section scroll targets
- `supabase/APPLY_NOW.sql` — v1.8 schema (objects 27–31)

**Architecture (`d:\Aggilo_Social\`):**
- `architecture/premium_cluster_requirements.md` — §10 slider behavioural matrix, §10.1–§10.6
- `architecture/system_implementation_prompt_part1.md` — §7.9 per-cluster configurability + platform_admin role

### What is now invariant across ALL clusters (V3.5 update)

The V3.4 invariant list extends with one operational addition:

9. **Server-side validation of agent-generated text against forbidden member-blame patterns.** Two layers: prompt rejection examples + runtime regex check with retry-and-degrade. Belt-and-braces ensures the soul-level rule (no surveillance framing) survives model drift.

### What stays the same

V3.4 invariants 1–8 are unchanged. Cadence floor (2h cold / 4h active), 60/40 ship/observe bias, skepticism-not-sycophancy rule, no-protocol-disclosure rule all carry forward.

### Pending for Session B

Session A done criteria fully met. Session B (`SESSION_B_DISCOVERABILITY.md`) is now unblocked: cluster identity is settled, the slider/skill/configurability schema is in place, and the bug fixes have stabilised the live product surface that public previews will link to.

*Updated 2026-05-22 as part of V3.5 (Session A: bug fixes + premium configurability + cluster identity decisions). Previous revision: V3.4.*


---

## V3.6 — Session B: External Discoverability + Atlas Pulse Foundation (current)

This revision closes Session B (Part a) from `docs/sessions/SESSION_B_DISCOVERABILITY.md`. Aggilo's clusters become discoverable on the open internet — search engines, social shares, and AI assistants — without leaking any member content. Atlas is registered as a live capability with the schema in place; the Atlas runtime worker, admin RSS panel, and Pulse Timeline card ship in Session B.5.

### Cluster identity becomes a public surface (member content stays sealed)

The discoverability layer is *additive*. The authenticated cluster room (`/cluster`) and every member-facing surface inside it remain unchanged. What ships is a *parallel public layer* that strangers and crawlers see:

- **`/c/<slug>` — public preview page.** Server-rendered. Reads from `public_cluster_view` only. Renders cluster name, tagline, description, demographic chips, anchor seed (the room's founding statement), rounded member-count bracket, the latest live Atlas Pulse if public-safe, and a curated capabilities list. Includes schema.org `Organization` JSON-LD (Aggilo as parent), full OpenGraph + Twitter card metadata, and a canonical URL.
- **`/api/og/cluster/<slug>` — dynamic 1200×630 OG image.** Generated on the fly from `public_cluster_view`. Cached 1h on the edge.
- **`/sitemap.xml` — admin-listed clusters only.** Until a cluster's founder flips `is_public_listed`, the cluster is invisible to search engines.
- **`/robots.txt` — strict allow/disallow.** Allows `/c/`, `/api/og/cluster/`, and the landing root. Disallows `/cluster`, `/admin`, `/api/`, `/auth/`. Search engines never reach member content.

The privacy invariant is enforced at the *data layer*: the public preview page can only read columns that exist in `public_cluster_view`. It is structurally incapable of returning member posts, replies, welfare flags, or vault gap requests.

### Atlas is registered as a live capability (runtime in B.5)

Atlas — Aggilo's contemporary-awareness layer — moves from concept to schema:

- `atlas_pulses` table holds every candidate Atlas considers, including ones Sage rejects (full editorial trail).
- `cluster_config.atlas_rss_feeds` holds the per-cluster admin-curated RSS feed list. **No platform-default feeds.** Atlas stays silent until the founder curates at least one source.
- `public_cluster_view` joins the latest live + public-safe Pulse so the public preview lights up automatically when Atlas surfaces.
- Three new entries in `skill_registry`: `atlas-cluster-pulse`, `public-discoverability`, `share-line-generator`.
- Sisters in Dua's enabled skill list is updated to include `atlas-cluster-pulse` and `share-line-generator`.

Sage holds editorial authority over every Pulse — `sage_verdict ∈ { pending, approved, rejected_off_topic, rejected_dignity, rejected_duplicate }`. Members and the public preview see only `approved` Pulses. The full design and B.5 deliverables are in [`docs/ATLAS_RUNTIME_DESIGN.md`](ATLAS_RUNTIME_DESIGN.md).

### Public-listing controls (per-cluster, admin-managed)

`cluster_config` extends with four columns:

| Column | Purpose |
|---|---|
| `is_public_listed` BOOL | Founder/platform-admin opt-in. Default FALSE. |
| `public_slug` TEXT UNIQUE | The slug used in `/c/<slug>`. Must be set when listed (CHECK constraint). |
| `public_meta` JSONB | Display name, tagline, description, demographic chips, accent gradient, capabilities copy, anchor seed post id, vault opt-in. |
| `atlas_rss_feeds` JSONB | Per-cluster Atlas RSS curation. Admin-managed in B.5. |

Sisters in Dua is **slug-seeded but listing-disabled** at migration time. `public_slug = 'sisters-in-dua'` and `public_meta` is fully populated, but `is_public_listed` stays FALSE until the founder flips it (B.5 admin panel). The moment they do, the page is live.

### Sage-voiced share-line generator

Two new prompts in `lib/share-prompts.ts`:

- **Cluster-card share** — outbound social post (Twitter, LinkedIn). ≤180 chars. Speaks to outsiders. No hype, no exclamations, no marketing voice.
- **Member-invite line** — for WhatsApp / Telegram. ≤120 chars before the URL. Sounds like a friend recommending a place.

Behind `POST /api/clusters/<slug>/share`. Admin-only (founder/manager/platform_admin). All calls observable via `llm_response_logs` and visible in the existing admin observability surface. Phase 0: admin reviews before posting; Phase 1 considers automation.

### Inbound landing flow respects the AGGIL filter

A visitor arriving at `/c/sisters-in-dua` and clicking "Join this room" lands on the existing auth flow with `?ref=<slug>` present. Two graceful exits handle the AGGIL mismatch cases:

- **Wrong gender** (man on a women-only cluster) → existing waitlist screen, plus a non-PII demand signal so the platform admin sees who knocked.
- **Wrong country** (non-India on the India-only beta) → existing geo-block screen, plus a demand signal recording country + slug.

Demand signals land in `cluster_demand_signals` (anon-writeable, admin-readable) so the founder/platform admin sees what audiences keep arriving for clusters that don't yet exist for them. This is a passive growth signal, not active outreach in Phase 0.

### AI provider directory tracking

A live document at [`docs/AI_PROVIDER_REGISTRATIONS.md`](AI_PROVIDER_REGISTRATIONS.md) tracks Aggilo's submissions to:

- **OpenAI** — GPT Store / Apps
- **Anthropic** — Apps / Connectors
- **Perplexity** — Sources
- **Google Gemini** — Extensions
- **You.com** — Sources
- **Meta AI** — no public channel today

Includes a reusable submission packet, a per-cluster rider template, and an OpenAPI 3.0 stub describing only the public-discovery endpoints (sitemap, robots, public page, OG image — no agent actions, no authenticated routes). The tracker applies to **every cluster** Aggilo hosts; per-cluster admin controls land in B.5.

### What V3.6 deliberately defers to B.5

- Admin panel UI for `is_public_listed`, `public_slug`, `public_meta` editor, RSS feed list, Pulse review queue.
- Atlas worker process (Node.js / BullMQ on Railway).
- Pulse card Timeline component for members.
- Per-cluster AI-provider submission tracker (today: a Markdown document at platform-admin level).

The schema is laid for all of this so B.5 is a UI + worker exercise, not another schema migration.

### Schema changes (APPLY_NOW.sql v1.9)

| # | Object | Purpose |
|---|---|---|
| 32 | `cluster_config` ALTER | Adds `is_public_listed`, `public_slug` (UNIQUE WHERE NOT NULL), `public_meta` JSONB, `atlas_rss_feeds` JSONB |
| 33 | `cluster_demand_signals` | Anon-writeable AGGIL-mismatch capture; admin-readable |
| 34 | `atlas_pulses` | Atlas → Sage editorial pipeline; status drives public/member surfacing |
| 35 | `public_cluster_view` | Anon-readable view; public-safe projection only — never member content |
| 36 | `skill_registry` INSERT | Three new skills: atlas-cluster-pulse, public-discoverability, share-line-generator |
| 37 | Sisters in Dua backfill | Slug, public_meta, expanded `enabled_skills`. Listing stays disabled until admin flips. |

Idempotent and safe to re-run.

### Files added

- `mvp/src/app/c/[slug]/page.tsx` — public preview page
- `mvp/src/app/api/og/cluster/[slug]/route.ts` — dynamic OG image
- `mvp/src/app/sitemap.ts`, `mvp/src/app/robots.ts`
- `mvp/src/app/api/clusters/[slug]/share/route.ts` — Sage-voiced share lines
- `mvp/src/app/api/demand-signals/route.ts` — anon demand signal capture
- `mvp/src/lib/public-cluster.ts` — read helpers + `siteUrl()` env-aware base
- `mvp/src/lib/share-prompts.ts` — Sage-voiced share prompts
- `docs/ATLAS_RUNTIME_DESIGN.md` — Atlas B.5 design + open questions
- `docs/AI_PROVIDER_REGISTRATIONS.md` — per-provider tracker + reusable packet
- `docs/sessions/SESSION_B5_PUBLIC_LISTING_ADMIN.md` — Session B.5 brief

### Files changed

- `mvp/src/components/AuthForm.tsx` — `?ref=<slug>` handling, demand-signal posts on AGGIL mismatch, sign-up tab default for inbound visitors
- `mvp/supabase/APPLY_NOW.sql` — v1.9 block

### Environment

- `NEXT_PUBLIC_SITE_URL` (optional) — defaults to `https://mvp.aggilo.in`. Override for staging or for a future cutover to `aggilo.in/c/`.

### Done criteria status

- Public preview page renders for `/c/sisters-in-dua` once the founder flips `is_public_listed = TRUE` (deferred admin panel; manual SQL until B.5).
- OG image route generates 1200×630 from view data.
- Sitemap.xml lists every publicly listed cluster with last-modified.
- Robots.txt allows `/c/`, `/api/og/cluster/`; disallows `/cluster`, `/admin`, `/api/`, `/auth/`.
- Schema.org JSON-LD validates as `Organization`.
- Sage-voiced share-line endpoint returns admin-reviewable copy for both kinds.
- Inbound landing flow handles AGGIL mismatch gracefully and writes demand signals.
- AI provider applications tracker documented; submissions queued for human action.
- Atlas runtime designed end-to-end; B.5 deliverables enumerated.

### What stays the same

V3.4 + V3.5 invariants are unchanged. Sage's voice, Clio's storage classes, the two-track capability model, the slider, the closed-loop telemetry — all carry forward without modification. The discoverability layer is *additive* on top of them.

*Updated 2026-05-22 as part of V3.6 (Session B Part a: external discoverability + Atlas Pulse foundation). Previous revision: V3.5.*


---

## V3.7 — Session B.5: Public-Listing Admin Panel + Atlas Runtime

This revision closes Session B.5 from `docs/sessions/SESSION_B5_PUBLIC_LISTING_ADMIN.md`. The admin surfaces V3.6 promised land, and Atlas Pulse moves from registered-capability to *running* end-to-end. Sisters in Dua's founder can now flip the cluster public from the UI, curate Atlas's RSS feeds, and review every Pulse Atlas considers — without touching SQL.

### Per-cluster admin panel (`/admin/clusters/<slug>`)

The new admin page renders four sections:

1. **Public identity editor** — toggle `is_public_listed`, set `public_slug`, edit `public_meta` (display name, tagline, description, demographic chips, accent gradient, capabilities copy, anchor seed picker, vault opt-in). Saves trigger `revalidatePath('/c/<slug>')` and `revalidatePath('/sitemap.xml')` so the public surface updates immediately.
2. **Atlas RSS feed list** — add/toggle/remove feeds. Add validates the URL with HEAD (or a tiny ranged GET fallback) before persisting. Each entry stores `last_fetched_at` and `last_fetch_status` once Atlas runs against it.
3. **Pulse review queue** — every Pulse Atlas considered, filterable by Sage's verdict. Admin can override a rejected verdict to `approved`, promote an approved draft to `live`, retract a live Pulse, and toggle public-safety per row.
4. **Demand signals preview** — last 10 AGGIL-mismatch arrivals scoped to this cluster's slug. Full table at `/admin/demand`.

Every write goes through one of three new admin endpoints, each of which appends a row to `cluster_admin_actions` for the audit trail:

- `PATCH /api/admin/clusters/[slug]/identity` — listing toggle, slug change, meta update
- `POST /api/admin/clusters/[slug]/feeds` — `{action: add|toggle|remove}`
- `POST /api/admin/clusters/[slug]/pulses` — `{action: go_live|retract|override_approve|toggle_public_safe}`

Action types stamped: `public_listing_toggled`, `public_slug_changed`, `public_meta_updated`, `atlas_feed_added`, `atlas_feed_enabled`, `atlas_feed_disabled`, `atlas_feed_removed`, `pulse_went_live`, `pulse_retracted`, `pulse_overridden`, `pulse_public_safe_on`, `pulse_public_safe_off`.

### Atlas runtime — `lib/atlas-runtime.ts` + `/api/admin/atlas/tick`

Per `system_implementation_prompt_part1.md` §8.4, Phase 0 must not run BullMQ workers. Atlas instead runs as a Next.js route invoked by Vercel cron (or any external scheduler):

```
GET  /api/admin/atlas/tick          (Bearer ATLAS_CRON_SECRET → tick all listed clusters, autoGoLive=true)
POST /api/admin/atlas/tick          (admin-authenticated → tick one cluster, autoGoLive=false by default)
```

Pipeline per tick (per cluster):

1. Read `cluster_config.atlas_rss_feeds` (active only).
2. Fetch each feed in parallel (timeout 8s, custom UA). Update `last_fetched_at` on every feed row.
3. Parse RSS 2.0 and Atom (no third-party dep — minimal regex parser; tolerant of CDATA, common quirks).
4. Dedupe candidate URLs against existing `atlas_pulses.source_url` for the cluster.
5. For up to 12 fresh candidates, Atlas scores against the cluster's `public_meta.description` + chip labels (`atlas_score` operation, ~80 prompt tokens, json_object response). Below 0.55 → row written with `sage_verdict='rejected_off_topic'`, no Sage call.
6. The highest-scoring approved candidate goes to Sage (`atlas_pulse_review`). Sage applies the on-topic / dignity / dedup gates and drafts a witness line on approval. Daily cap: max 1 approved Pulse per cluster per tick.
7. When `autoGoLive=true` (cron path), an approved Pulse is also published as a Sage-attributed Timeline post (`post_subtype='atlas_pulse'`) and `atlas_pulses.status` is set to `live`. When `autoGoLive=false` (admin tick), it stays `draft` for manual review.

Both Atlas scoring and Sage editorial calls flow through the existing `llmCall()` helper, so every call appears in `llm_response_logs` with token cost, latency, and fallback flag. Daily LLM budget cap (`LLM_DAILY_BUDGET_USD`) applies — when exceeded, both calls return the graceful step-back placeholder rather than over-spending.

The runtime is **idempotent**. The same RSS item appearing on consecutive ticks is dedup'd by URL; LLM calls do not fire for duplicates. A failed feed fetch surfaces in `last_fetch_status` for the admin and is otherwise silent.

### Vercel cron config

`mvp/vercel.json` schedules the tick hourly at minute 0:

```json
{ "crons": [ { "path": "/api/admin/atlas/tick", "schedule": "0 * * * *" } ] }
```

Vercel sends the cron's `Authorization: Bearer <CRON_SECRET>` header. The route accepts either that or `x-cron-secret`. Set `ATLAS_CRON_SECRET` in the Vercel environment to enable cron; without it, GET returns 500 and the route is effectively disabled.

### Demand signals admin (`/admin/demand`)

Full table view of `cluster_demand_signals` with status filter, inline status updates (`open` → `contacted` / `matched` / `archived`), and CSV export for outreach. Backed by `PATCH /api/admin/demand/[id]`.

### Admin nav additions

`AdminNavbar.tsx` now exposes two new tabs: **Cluster** (`/admin/clusters/sisters-in-dua`) and **Demand** (`/admin/demand`). Layout guard updated to accept `platform_admin` as a valid admin role (in addition to `founder` and `manager`).

### What V3.7 deliberately does not include

- Per-Pulse member voting / feedback wiring on Pulse Timeline cards. The cards render via the existing `PostCard` (Sage-attributed). Adding a Pulse-specific feedback row pulls Session C work forward and is deferred to a Session D scope decision.
- Pulse card visual polish (custom card vs. plain Sage post). Phase 0 reuses the existing post visual; B.5 ships function over polish.
- A per-cluster AI-provider submission tracker DB. The Markdown tracker at `docs/AI_PROVIDER_REGISTRATIONS.md` is the source of truth for Phase 0; the DB schema for it (`cluster_ai_provider_submissions`) waits until volume justifies it.
- Multi-cluster Phase 1 platform build.

### Files added (mvp)

- `src/app/admin/clusters/[slug]/page.tsx`
- `src/app/admin/demand/page.tsx`
- `src/app/api/admin/clusters/[slug]/identity/route.ts`
- `src/app/api/admin/clusters/[slug]/feeds/route.ts`
- `src/app/api/admin/clusters/[slug]/pulses/route.ts`
- `src/app/api/admin/atlas/tick/route.ts`
- `src/app/api/admin/demand/[id]/route.ts`
- `src/components/admin/ClusterIdentityForm.tsx`
- `src/components/admin/AtlasFeedList.tsx`
- `src/components/admin/PulseReviewTable.tsx`
- `src/components/admin/DemandSignalsPreview.tsx`
- `src/components/admin/DemandSignalsTable.tsx`
- `src/lib/admin-cluster.ts`
- `src/lib/atlas-runtime.ts`
- `vercel.json`

### Files changed (mvp)

- `src/app/admin/layout.tsx` — `platform_admin` role accepted
- `src/components/admin/AdminNavbar.tsx` — Cluster + Demand tabs, platform_admin label

### Schema status

No schema migration in V3.7. V3.6 (`APPLY_NOW.sql` v1.9) already laid `cluster_config.atlas_rss_feeds`, `atlas_pulses`, `cluster_demand_signals`, `public_cluster_view`. B.5 is UI + runtime only.

### Environment

- `ATLAS_CRON_SECRET` (required for cron; without it, `GET /api/admin/atlas/tick` returns 500)
- `SUPABASE_SERVICE_ROLE_KEY` (already required; the tick uses the service-role client for inserts)

### Done criteria status

- [x] Admin can toggle Sisters in Dua public from the UI; revalidates the preview path on save.
- [x] Identity editor saves all `public_meta` fields including chips, capabilities, anchor seed, accent.
- [x] At least one Atlas RSS feed can be added/toggled/removed; URL validated on add.
- [x] Manual Atlas tick endpoint runs end-to-end; admin can `Tick now` from the panel.
- [x] Pulse review queue lists every candidate with admin actions.
- [x] Demand-signal admin view + per-row status update + CSV export.
- [x] All admin actions land in `cluster_admin_actions`.
- [x] Vercel cron config in place; ATLAS_CRON_SECRET documented.

### What stays the same

V3.4 + V3.5 + V3.6 invariants are unchanged. The discoverability layer is still purely additive on top of the authenticated cluster surface. Public-safe projection still flows through `public_cluster_view` only. Atlas remains silent on any cluster without admin-curated feeds. Sage retains editorial authority over every Pulse — admin override exists but is audited and visible.

*Updated 2026-05-22 as part of V3.7 (Session B.5: public-listing admin panel + Atlas runtime). Previous revision: V3.6.*


---

## V3.8 — Session C: Comprehensive Prompt Audit

This revision closes Session C from `docs/sessions/SESSION_C_PROMPT_AUDIT.md`. Across 21 platform prompts, the same rules ("warm but skeptical", "no protocol disclosure", "skepticism not sycophancy") had been written 21 different ways. Drift accumulated invisibly. The cadence-exchange member-blame bug from V3.4 was drift made visible — and the audit confirmed there were 6–8 other instances of the same root cause (rule duplication without a single source of truth) waiting to surface.

V3.8 introduces an inheritance root for every prompt on the platform, lays a per-agent voice document on top, and audits 14 of 21 prompts in depth against a consistent C1–C12 rubric. No code prompts ship with this changelog — V3.8 is the *audit* and the *foundation*. The fixes themselves migrate into prompt files in V3.9 (medium-priority refactors, sprintable) and Phase 1 (cluster-vocabulary parameterisation, multi-cluster prerequisite).

### The Aggilo super-prompt — `docs/AGGILO_SUPER_PROMPT.md`

The single canonical platform-level prompt every Aggilo agent inherits before its agent-specific instructions are loaded. Sage, Clio, Atlas, Scout, Observer — each one operates under everything in the super-prompt, then its own prompt extends it.

The super-prompt has nine narrative sections (rationale, the soul, the safety floor, voice baseline, forbidden, empowered, JSON contract conventions, failure handling, the one line that cannot be crossed) and one **literal block** (§IX) — the exact text loaded into every agent's system message stack at runtime. The literal block is held to ≤600 tokens; the rationale around it is the document the maintainer reads, not the model.

Inheritance rule (§X): per-agent prompts must NOT restate any of:

- The seven AI-native principles
- The soul invariants
- The voice baseline
- The forbidden list
- The empowered list

When an agent prompt today restates any of these, it is overdue for refactoring against this super-prompt — tracked per prompt in `PROMPT_AUDIT_RESULTS.md`.

### Agent voices document — `docs/AGENT_VOICES.md`

Per-agent register layered on top of the super-prompt's voice baseline. Eleven sections covering Sage Anchor, Sage Internal, Sage Outward (share lines), Clio Personal, Clio Ephemeral, Clio Outward (invite lines), Atlas, Scout, Observer, cluster fit evaluator, and the free-text guidance validator. Each section names its register, formality, "I"-usage rule, emoji rule, length envelope, banned phrases, and the code location of the prompt(s) that implement it.

The deduplication this document buys: Sage's voice rules currently sit inline in `lib/sage-prompt.ts`, in `cadence-exchange/route.ts`, in `lib/share-prompts.ts`, and in `suggest-dua/route.ts`. Once V3.9 lands, all four will reference §I (Sage Anchor) of `AGENT_VOICES.md` instead of restating the rules. One source of truth, one place to update when a rule changes.

### Comprehensive prompt audit — `docs/PROMPT_AUDIT_RESULTS.md`

Fourteen of twenty-one prompts audited against C1–C12 in this session. The remaining seven are spec-only (Phase 1 agents and skills not yet built); each has a pre-written rubric scaffold lifted in when implementation begins.

Audit headlines:

- **No prompt failed C1, C2, or C3.** No critical fixes required. The soul, the safety floor, and the service-framing layer hold across the inventory.
- **No prompt failed C4–C7.** No high-priority fixes required.
- **Eight prompts** (1, 3, 4, 5, 7, 11, 12, 16) carry medium-priority C8 (token efficiency) findings — they restate super-prompt rules inline. Once the super-prompt loads literally into every agent call, ~30–40% of each prompt's tokens become inheritance overlap and can be removed.
- **Eight prompts** (1, 3, 4, 7, 8, 11, 12, 16) carry medium-priority C12 (drift defence) findings — they need bad-example blocks in the cadence-exchange model. The audit pre-writes most of these; they can be lifted in directly during the V3.9 sprint.
- **Three prompts** had inventory mis-classifications, now corrected: prompt 6 (welcome) and prompt 10 (handoff greeting) are deterministic templates, not LLM calls. Prompt 13 (vault gap detection) is not implemented as a discrete prompt at all today — it's SQL-only over `sage_decision_logs`. The deterministic-templates pattern in 6 and 10 turned out to be **the gold-standard pattern for high-stakes member-facing moments**: when the cost of a model going off-script is high and the value of personalisation is low, choose templates.

Two structural duplications surfaced and are recorded for V3.9:

1. `LINK_ALIGNMENT_PROMPT` in `sage/evaluate/route.ts` is a near-identical copy of the prompt in `links/unfurl/route.ts`. Fold into a single endpoint; have the evaluate route POST to `/api/links/unfurl` internally.
2. The `link-alignment` LLM call in `links/unfurl/route.ts` bypasses `llmCall()` and reads `LLM_BASE_URL` / `LLM_API_KEY` directly with `process.env`. Its cost, latency, and verdict don't appear in `llm_response_logs`. Route through `llmCall()` so it gains the platform's observability and budget guard.

### Prompt test suite — `docs/PROMPT_TEST_CASES.md`

Manual regression suite for every audited prompt. Run by hand at `temperature=0.3` before any prompt change ships. Phase 1 will automate as a CI job that runs on every prompt-file commit.

Coverage:

- Tier 1 prompts 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 — full test sets.
- Tier 2 prompts 11, 12 — full test sets.
- Tier 3 prompt 16 (introspection) — full test set.
- Tier 3 prompts 13, 14, 15 — pre-written scaffolds, executable when implementation lands.
- Tier 4 spec-only prompts 17–21 — deferred to implementation.

Each test row carries an input, an expected step / verdict / behaviour, and (where relevant) drift-rate sampling targets across N runs. Prompts 5 and 11 carry validator-specific synthetic-output tests for the regex layer that runs alongside the model call.

### Implementation order

Per the Session C §5 prioritisation rules:

- **Critical** (ship immediately as hotfix): nothing — no prompt failed C1–C3.
- **High** (ship within a week): nothing — no prompt failed C4–C7.
- **Medium** (V3.9 sprint): refactor 8 prompts to inherit the super-prompt literal block; add bad-example blocks; fold the link-alignment duplication; route prompt 8 through `llmCall()`; reword the @Sage signal note in `buildSageMessages` to acknowledge welfare precedence.
- **Low** (Phase 1 prerequisite): cluster-vocabulary parameterisation across all prompts (`{{CLUSTER_NAME}}`, `{{CLUSTER_PRIMARY_LANGUAGE}}`, `{{CLUSTER_MEMBER_NOUN}}`); deferred bad-example block in `welcome-new-member` (lift in if/when this becomes LLM-generated).

Each medium-priority fix carries a proposed diff in `PROMPT_AUDIT_RESULTS.md` and a test case it must pass in `PROMPT_TEST_CASES.md`.

### What V3.8 deliberately does not include

- Code prompt edits. V3.8 is documentation and audit only. The fixes ship in V3.9.
- Phase 1 agent implementations (Atlas/Scout/Observer/cluster fit evaluator/free-text guidance validator). The audit pre-writes the rubric checks each must pass on first build, which is the appropriate Phase 0 deliverable.
- Automation of the test suite. Phase 0 is manual at `temperature=0.3`; CI integration is Phase 1.
- Schema changes. V3.7 (`APPLY_NOW.sql` v1.9) remains the latest schema state.

### Files added (docs)

- `AGGILO_SUPER_PROMPT.md` — inheritance root for every platform prompt
- `AGENT_VOICES.md` — per-agent register layered on top of the super-prompt
- `PROMPT_AUDIT_RESULTS.md` — C1–C12 audit of all 14 implemented prompts + 7 spec-only scaffolds
- `PROMPT_TEST_CASES.md` — manual regression suite for every audited prompt

### Files changed (docs)

- `MASTER_INSTRUCTIONS.md` — V3.8 changelog; V3.7 marked closed
- `sessions/SESSION_C_PROMPT_AUDIT.md` — Done criteria checked; closure note appended
- `sessions/README.md` — Session C marked closed; cue for Session D (V3.9 prompt-refactor sprint) drafted

### Schema status

No schema migration in V3.8. Pure documentation + audit revision.

### Environment

No new environment variables. The audit observed that prompt 8 (link unfurl) reads `LLM_BASE_URL` / `LLM_API_KEY` directly; the V3.9 fix routes it through `llmCall()` and removes the direct reads.

### Done criteria status

- [x] `AGGILO_SUPER_PROMPT.md` written with literal block ≤600 tokens
- [x] `AGENT_VOICES.md` written, 11 sections covering all current and Phase 1 agents
- [x] All 14 implemented prompts audited against C1–C12 with scored output
- [x] Spec-only prompts (14, 15, 17–21) scaffolded with rubric checks for first-build audit
- [x] At least 3 test cases per Tier 1 prompt in `PROMPT_TEST_CASES.md`
- [x] Tier 3 prompt 16 (introspection) test set written
- [x] Critical fixes shipped — n/a, no prompt failed C1/C2/C3
- [x] High fixes scheduled — n/a, no prompt failed C4–C7
- [x] Medium fixes documented with proposed diff and test case
- [x] V3.8 changelog written
- [x] All committed and pushed (this entry)

### What stays the same

V3.4 + V3.5 + V3.6 + V3.7 invariants are unchanged. No live prompt was edited in V3.8; the platform's behaviour is identical to V3.7. The super-prompt is documented but not yet loaded into runtime — that is V3.9's first task. The audit's promise to readers is that when the V3.9 refactor ships, every per-prompt diff already has a written rationale, a pre-drafted edit, and a test case that proves it improved.

*Updated 2026-05-22 as part of V3.8 (Session C: comprehensive prompt audit). Previous revision: V3.7.*


---

## V3.9 — Clio anchored tour

V3.8's "What's on this page?" section in the Private Chat tab gave members a collapsible list of cluster surfaces with click-to-scroll behaviour and a brief flash highlight. V3.9 upgrades that interaction into a proper anchored tour: when a member taps a topic, the page scrolls to the surface and a Clio-attributed popover lands beside it with a one-or-two-sentence explanation, Prev/Next controls, a step counter, and a close affordance. The tour can be reopened from the same help section any time, and the help section now shows which step is currently active.

### Why this is not a duplicate surface

The help section list and the tour share **one source of truth** — `PLATFORM_HELP_ITEMS` in `ClioFab.tsx`. Both the collapsible list (Private Chat tab) and the popover (anchored at the surface) read from this single list. Adding or editing a surface means editing one array; both views update together. There is no second list, no parallel descriptions, no separate registry.

### What members see

1. Open the Private Chat tab. The "What's on this page?" section is collapsed by default.
2. Expand it. Tap a topic — for example "Room Workshop".
3. The chat panel closes (so the popover can land cleanly), the page smooth-scrolls the Workshop strip into view, the Workshop gets an emerald highlight ring, and a small Clio-attributed popover anchors beside it: "Clio · this is here / Room Workshop / What Clio and I are building for this room. / 8 of 9 / Back  Next".
4. Member can step Back/Next, hit Done at the last step, or close with × at any time.
5. Reopen Clio's panel any time — the help section lists every topic with the active one tagged "showing now".

### Architectural choices

- **Deterministic copy.** The tour's narration is hand-written, not LLM-generated. This follows the pattern surfaced in `PROMPT_AUDIT_RESULTS.md` #6 (welcome) and #10 (handoff greeting): high-stakes member-facing first-impression copy belongs in templates, not in the model. A model that improvises during a guided tour is a model that drifts during the moment that defines the room for a new member.
- **Portal-rendered popover.** `ClioTour.tsx` mounts to `document.body` so the popover sits above the FAB, the sticky compose bar, and any dialogs. The popover survives panel close — closing the chat panel does not close the tour, which is what makes the tour feel like a tour and not a tooltip.
- **Anchor-tracking position.** The popover's position is recomputed on `scroll` and `resize` (capture-phase scroll listener catches scroll on inner containers too). When a member scrolls or rotates the device mid-tour, the popover follows its target.
- **Held highlight.** The target surface gets a 3px emerald ring while its step is active; the ring is released and prior `box-shadow` restored on step change or close.
- **Keyboard support.** Esc closes; ←/→ steps. Arrow keys are gated by step bounds so first/last don't wrap.
- **Tour state owned at the FAB level.** `useState` lives in `ClioFab`. Closing the chat panel does not lose tour state; reopening the panel shows the active step. The help section receives `activeIndex` and `onJump`.

### Edge cases handled

- Target selector resolves to nothing in the DOM → tour closes itself rather than render a floating popover.
- Surface near the bottom 40% of viewport → popover flips above instead of below.
- Surface narrower or wider than the popover → popover horizontal position clamped to viewport with arrow re-aimed at the surface centre.
- Member uses keyboard navigation (Esc / ← / →) → handled.
- Smooth-scroll timing → first position pass deferred 280ms so the scroll has settled.

### What V3.9 deliberately does not include

- LLM-narrated tour copy. Out of scope per the deterministic-templates pattern.
- Cluster-admin-customised tour items. Phase 1 will let admins re-order, hide, or add tour items via the cluster identity editor; for now the platform-baseline list is the fixed nine surfaces.
- Workshop-driven tour items (member-feature tutorials). Out of scope; those land when a feature ships, not on the platform-baseline tour.
- Mobile-specific gesture hints. The popover responds to taps; swipe-to-step is a Phase 1 polish.
- Auto-start on first cluster visit. The first-open tab explainer banner already nudges the member toward "What's on this page?". Auto-running the tour without member action would be performative; the explicit-tap entry preserves the member's autonomy.

### Files added (mvp)

- `src/components/ClioTour.tsx` — anchored, portal-rendered Clio popover with Prev/Next controls and target highlight

### Files changed (mvp)

- `src/components/ClioFab.tsx` — `tourIndex` state, `<ClioTour>` mounted at root, `ClusterHelpSection` rewritten to drive the tour from a single shared `PLATFORM_HELP_ITEMS` list, active-step indicator in the help list

### Schema status

No schema migration. UI-only addition.

### Environment

No new environment variables.

### Verification

- `npm run build` clean (32/32 routes), no new TypeScript or lint diagnostics.
- Help section list and tour popover read from the same `PLATFORM_HELP_ITEMS` constant — verified by code inspection.
- Manual test pass at `temperature=n/a` (no LLM in this surface): each of the nine topics scrolls to the right surface, popover lands legibly, Prev/Next navigates, Esc closes, scroll-while-open re-anchors.

### What stays the same

V3.4 + V3.5 + V3.6 + V3.7 + V3.8 invariants are unchanged. No prompt edits in V3.9. The cluster timeline, Sage's behaviour, Clio's chat behaviour, the Workshop dialogue, and the ephemeral surface are untouched. The tour is purely additive on top of the V3.5 help section.

*Updated 2026-05-22 as part of V3.9 (Clio anchored tour). Previous revision: V3.8.*


---

## V3.10 — Cluster UX pass

This revision is a focused UX pass on the cluster surface, prompted by a senior-UX review of the V3.9 tour and the cluster shell. Eleven findings, all addressed in this revision. No prompt edits, no schema changes — pure interaction polish layered on V3.4's hierarchy-first foundation.

### Changes

1. **Click-anywhere-to-close on the tour popover.** The original `Done` button was a redundant fourth way to dismiss alongside Esc, ×, and an explicit dismissal target. Replaced with a capture-phase `pointerdown` listener that closes the popover whenever the click lands outside the popover and outside the active highlighted target. Tapping the highlighted surface itself does not dismiss — members can interact with the surface they're learning about (tap a post, expand the anchor) without the tour vanishing on the way to the popover. The last step's footer reads "Tap anywhere to close" so the affordance is named.

2. **`Done` button removed from the last tour step.** Once click-outside dismisses, "Done" is dead weight. The last step still shows step counter and Back; the Next slot becomes a quiet italic "Tap anywhere to close" instead of a fourth dismissal button.

3. **Skip-to-feed link.** Keyboard users now tab to a visually-hidden `<a href="#aggilo-cluster-timeline">Skip to feed</a>` as the first focusable element on the cluster page. WCAG 2.4.1 (Bypass Blocks). Reveals on focus with a high-contrast aggilo-deep button. Adds `tabIndex={-1}` to `#aggilo-cluster-timeline` so the anchor target accepts programmatic focus when activated.

4. **`role="status"` + `aria-live="polite"` on the new-posts pill.** Non-sighted members now hear the count change ("1 new post" / "3 new posts") without it interrupting current screen-reader output. The button itself carries an `aria-label` that includes the action ("3 new posts — tap to view") for clarity over the visual-only "↑" arrow.

5. **Dynamic new-posts pill threshold.** The 320px hard-coded `scrollY` threshold has been replaced with a position check on `feedTopRef`. The pill now appears only when the feed-top anchor has scrolled above the viewport with a 32px tolerance — meaning the pill triggers on actual feed-position state, not on header-height assumptions. On a tall pinned-anchor expansion the old constant could fire falsely; this version doesn't.

6. **First-session cadence gate.** Cadence dialogue (Sage ↔ Clio Workshop exchange) used to fire 12s after page mount, which meant a brand-new visitor could see agents debating before they understood who Sage and Clio are. V3.10 stamps `aggilo:first_session_done` after the welcome flow completes; cadence runs from session two onward. The trigger delay is also bumped from 12s to 30s on returning visits so the dialogue doesn't compete for attention with the dua suggestion + welcome ack on the same page mount.

7. **Pinned anchor collapsed-strip label rewritten.** "Room anchor · tap to read" was content-blind (members couldn't tell it was Sage's seed). New copy: `From Sage · Anchor — tap to expand`. Source named, intent named, action named — three pieces of information in the same vertical budget.

8. **Cluster meta line condensed.** "Beta Cluster · Hosted community · Verified sources only" was three equally-weighted labels for three different concerns (operational, positioning, trust). Operational ("Beta Cluster") removed from the member view — members don't need to know they're in beta and the URL says it. The remaining labels collapsed into a single warm trust line: "Hosted community · verified sources only".

9. **`TypingIndicator` reserves a fixed-height slot.** The indicator used to render-or-not-render based on typing presence, which on iOS could shift the compose textarea up mid-keystroke and move focus position. V3.10 reserves a 24px slot at all times. Empty when no one types (`aria-hidden`), filled when one or more sisters write. Compose bar position no longer shifts; iOS keystroke focus stays anchored.

10. **Workshop discoverability + `aria-expanded`.** The minimised Workshop strip now carries `aria-expanded={false}`, `aria-controls`, and a `title` attribute that names exactly what it is for first-time visitors: "What Clio and Sage are building for this room. Read if curious; the conversation is above." Layout cleanup: explicit ordering on the badge / chevron so they don't compete for the same `ml-auto` slot.

11. **Compose-bar placeholder shortened.** The default placeholder was 60+ characters and truncated on narrow inputs. Shortened to "Share what's on your heart…" with the per-user daily-rotating nudge handling variety. The same change is applied at both the prop default and the `ClusterFeed` parent override so a future renamer doesn't reintroduce the long string.

### New documentation

- `mvp/src/app/globals.css` now carries an in-file Aggilo accent budget block: six accents, one meaning each, with explicit guidance to retire one before adding a seventh. Documenting the visual budget at the source-code level so the next person who adds a feature sees it before reaching for a new hue.

### What V3.10 deliberately does not include

- Cluster-vocabulary parameterisation in the tour copy. Phase 1 prerequisite for multi-cluster — captured in the prompt audit as a C11 finding across the inventory.
- A side-panel tour variant. The senior-UX review proposed moving the popover to the page side; the architectural argument (mobile-first, eye-coordination, anchored-as-label) prevailed. Click-anywhere-to-close addresses the underlying friction without changing the position model.
- Auto-running the tour on first cluster visit. The first-open tab explainer in the FAB already nudges members toward "What's on this page?". Auto-running without member action would be performative; the explicit-tap entry preserves member autonomy.

### Files added (mvp)

None.

### Files changed (mvp)

- `src/components/ClioTour.tsx` — capture-phase click-outside dismissal; `data-clio-tour-popover` for the dismissal exemption; "Done" removed; last-step footer reads "Tap anywhere to close"
- `src/components/ClusterFeed.tsx` — dynamic new-posts pill threshold via `feedTopRef.getBoundingClientRect()`; `role="status"` + `aria-live="polite"` + `aria-label` on the pill; `tabIndex={-1}` on the timeline anchor; shorter compose placeholder default
- `src/components/ClusterShell.tsx` — skip-to-content link (`Skip to feed`); first-session cadence gate via `aggilo:first_session_done` localStorage flag; cadence trigger delay 12s → 30s
- `src/components/ClusterHeader.tsx` — meta line condensed; `Beta Cluster` removed from member view
- `src/components/PinnedAnchor.tsx` — collapsed-strip label rewritten; `aria-label` on the expand button
- `src/components/TypingIndicator.tsx` — fixed-height (24px) slot; `aria-hidden` when empty; `role="status"` + `aria-live="polite"` when active
- `src/components/PostComposer.tsx` — default nudge placeholder shortened
- `src/components/AgentChatbox.tsx` — `aria-expanded` + `aria-controls` + `title` on minimised Workshop strip
- `src/app/globals.css` — Aggilo accent budget documentation block

### Schema status

No schema migration in V3.10.

### Environment

No new environment variables.

### Verification

- `npm run build` clean (32/32 routes).
- No new TypeScript or lint diagnostics across the touched files.
- Manual test pass on the cluster surface: skip-to-feed reveals on Tab, new-posts pill triggers correctly only when feed-top is past viewport, click-outside dismisses tour without dismissing on highlighted-target taps, typing indicator no longer shifts compose bar, cadence skipped on first session, pinned anchor collapsed-strip self-describes.

### What stays the same

V3.4–V3.9 invariants are unchanged. No prompt edits in V3.10. Cluster behaviour, Sage's framework, Clio's chat model, Workshop dialogue logic, and the ephemeral surface are untouched. Skip-link, aria additions, and the typing-slot reservation are purely additive accessibility wins. The cadence-gate change is a delay, not a removal — once a member has spent one session in the room, cadence runs on its standard cold floor.

*Updated 2026-05-22 as part of V3.10 (Cluster UX pass). Previous revision: V3.9.*


---

## V3.11 — Prompt-refactor sprint (Session D)

V3.8's Session C audit identified eight prompts with super-prompt redundancy and eight with missing bad-example blocks, plus two structural duplications and one welfare-precedence ambiguity. V3.11 executes the medium-priority fixes the audit named, on the same day the cluster UX pass landed.

This is a **runtime change to every LLM call on the platform.** The super-prompt now loads literally as the first system message of every agent operation. Voice, forbidden, empowered, and the safety floor are inherited from one source rather than restated 21 different ways.

### What changed at the inheritance level

- **`src/lib/super-prompt.ts` (new).** `AGGILO_SUPER_PROMPT_LITERAL` mirrors `docs/AGGILO_SUPER_PROMPT.md` §IX exactly. Token budget verified ≤600. Every agent prompt that uses the LLM now prepends this constant as the first system message via `buildSystemMessages()` or by hand. Source-code-level inheritance contract is documented in the file's docblock.

### Per-prompt refactors

Each per-agent prompt was trimmed of duplicate voice / forbidden / empowered blocks (now inherited from the super-prompt), and where the audit pre-wrote a bad-example block, it was lifted in.

- **Prompt #1 — `lib/sage-prompt.ts`.** Removed: the inline monotheism paragraph, "no emoji or exclamation marks" block, "Hard Limits — Absolute, No Override" duplicates, "Your Voice" duplicate. Kept: cluster identity, decision framework Steps 0–6, the structured decision tag, and Sage-specific limits beyond the safety floor. Added: the audit's six-item bad-example block ("I hear you", "SubhanAllah, what a beautiful…", sycophancy, surveillance opening, "I think / I believe", filler). The `buildSageMessages()` helper now prepends `AGGILO_SUPER_PROMPT_LITERAL` as the first system message.

- **Prompt #3/#4 — `lib/clio-prompt.ts`.** Removed: `CLIO_CHARACTER_CORE` voice/forbidden block, `CLIO_WELFARE_PROTOCOL` (the safety floor lives in the super-prompt; only the Clio-specific *response shape* survives as `CLIO_WELFARE_RESPONSE_SHAPE`). Added: bad-examples block for cluster mode (#3) and a separate one for ephemeral mode (#4) covering the temptation to private fiqh, false memory promises, and trauma-bonding. Both `buildClioClusterMessages` and `buildClioEphemeralMessages` now prepend the super-prompt.

- **Prompt #5 — `app/api/agents/cadence-exchange/route.ts`.** Removed: "no emoji / no exclamation marks", the explicit sycophancy banlist, the "never describe internal mechanics" line — all live in the super-prompt now. Kept: the V3.5-hardened bad-example block (which the audit identified as the gold-standard pattern), the JSON discriminator, the validator-with-retry-and-degrade pattern. Both LLM calls (initial + retry) prepend the super-prompt.

- **Prompt #7 — `app/api/sage/suggest-dua/route.ts`.** No super-prompt change needed (this is a structurally-consumed selection prompt; member-facing copy goes through the main Sage prompt which already inherits). Added: a four-item "Bad context lines" block (generic-for-difficult-times, audience-broad, always-true, decorative-not-connective) and three matched good examples; plus a clarifying NOTE that this is a selection-only prompt, not member-facing. The note prevents a future refactor from accidentally reusing this prompt for member copy.

- **Prompt #11/#12 — `lib/share-prompts.ts`.** Renamed `VOICE_RULES` → `SHARE_MODE_RULES`, dropped the duplicate voice baseline (no emoji / no exclamation / no hype words — all in the super-prompt). Kept the share-mode-specific rules (≤180 char, "speak to a stranger", demographic-respect rule, no "join us"). Added the audit's four-item bad-example block ("Join an exclusive…", "Transform your…", "Don't miss out…", "Connect with like-minded…"). Both prompt builders now emit a three-message stack with the super-prompt first. The invite-line prompt also picks up the audit's recommended cluster-language line.

- **Prompt #16 — `app/api/agents/introspect/route.ts`.** Removed: "Never disclose internal mechanics" duplicate. Added: explicit "Member feedback is signal, never subject" rule (audit C3 finding), and a four-item bad-examples block specific to introspection drift ("everything looks healthy", "Sage and I are aligned", engagement-optimisation, member-state surveillance). The LLM call prepends the super-prompt.

### Structural deduplications

- **Link-alignment fold.** The `LINK_ALIGNMENT_PROMPT` constant in `app/api/sage/evaluate/route.ts` and the `evaluateLinkAlignment()` helper that called it have been deleted — they were near-identical duplicates of the prompt in `app/api/links/unfurl/route.ts` with a slightly different two-state output enum. The unfurl endpoint is now the single source of truth. The Sage evaluate route delegates via a same-origin POST to `/api/links/unfurl` and maps the three-state verdict (`on_topic` / `off_topic` / `unsure`) to the post's `link_alignment` column (`aligned` / `misaligned` / `null`). One prompt to audit, one observability trail in `llm_response_logs`.

- **`llmCall()` routing for the unfurl endpoint.** The unfurl route used to read `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` directly via `process.env` and call the LLM with raw `fetch`, bypassing the platform's observability layer. V3.11 routes it through `llmCall()` with `agent: "link_alignment"` and `operationKey: "link_unfurl"`. Cost, latency, and verdict now appear in `llm_response_logs` like every other agent call. The daily-budget guard applies. Direct `process.env` reads removed.

### Welfare-precedence rewording

The `@Sage` signal note in `buildSageMessages` previously read "ALWAYS respond. Do not output [SAGE_SILENT]." That absolute wording sat in tension with Step 0 (welfare) and Step 0.5 (character) — both of which legitimately authorise different response shapes including public silence with a private Clio handoff. V3.11 rewords the note to:

> "PLATFORM SIGNAL: This message contains an @Sage mention. The @Sage Mention Protocol applies: respond unless a higher-priority safety protocol (Step 0 welfare, Step 0.5 character) explicitly authorises a different response shape. When welfare or character takes over, the protocol's response shape — including the option of public [SAGE_SILENT] with private Clio handoff — supersedes the default 'always respond' rule. Address what the member asked when the safety floor is clear."

Welfare and character signal notes pick up matching tail lines: "Welfare/Step 0.5 precedence overrides the @Sage 'always respond' rule when both fire." Member outcome: a hostile @Sage post no longer pushes Sage toward debate, and a welfare-flagged @Sage post is allowed to land in the private handoff path rather than being forced into a public reply. The application-layer regex pre-filter in `evaluate/route.ts` already lights up welfare and character independently, so the safety floor is double-defended.

### Token-cost impact

Per-call token savings on the seven refactored prompts average roughly 25–35% of the system-prompt block (rough estimate from line-count diff; precise numbers will land once the next ten production calls are sampled). On a daily-budget basis this is below noise. The maintainability and drift-defence wins are larger than the token savings.

### What V3.11 deliberately does not include

- Cluster-vocabulary parameterisation across prompts (`{{CLUSTER_NAME}}`, `{{CLUSTER_PRIMARY_LANGUAGE}}`, `{{CLUSTER_MEMBER_NOUN}}`). Phase 1 prerequisite. The audit captured this at C11 across the inventory and it remains a Phase 1 task.
- Auto-running the prompt test suite (`docs/PROMPT_TEST_CASES.md`). Phase 0 stays manual at `temperature=0.3`; CI integration is a Phase 1 polish.
- Phase 1 agent implementations (Atlas/Scout/Observer/cluster fit evaluator/free-text guidance validator). The audit's first-build rubric checks for each of these still apply when implementation begins.
- Schema changes. None in V3.11.

### Files added (mvp)

- `src/lib/super-prompt.ts` — runtime literal of `AGGILO_SUPER_PROMPT_LITERAL` plus a `buildSystemMessages()` helper for the inheritance contract

### Files changed (mvp)

- `src/lib/sage-prompt.ts` — duplicates removed, bad-examples block added, super-prompt prepended in `buildSageMessages`, `@Sage` signal note rewritten for welfare/character precedence
- `src/lib/clio-prompt.ts` — duplicates removed, two bad-examples blocks added (cluster + ephemeral), `CLIO_WELFARE_PROTOCOL` reduced to `CLIO_WELFARE_RESPONSE_SHAPE`, super-prompt prepended in both builders
- `src/lib/share-prompts.ts` — `VOICE_RULES` renamed `SHARE_MODE_RULES`, voice duplicates removed, bad-examples block added, cluster-language line added to the invite prompt, super-prompt prepended in both builders
- `src/app/api/agents/cadence-exchange/route.ts` — voice duplicates removed, sycophancy banlist removed (super-prompt covers it), super-prompt prepended in both LLM calls
- `src/app/api/agents/introspect/route.ts` — duplicate disclosure rule removed, member-feedback-is-signal rule added, bad-examples block added, super-prompt prepended
- `src/app/api/sage/suggest-dua/route.ts` — bad-context-line examples added, selection-only NOTE added
- `src/app/api/links/unfurl/route.ts` — direct `process.env` reads + raw `fetch` removed; routed through `llmCall()`; super-prompt prepended
- `src/app/api/sage/evaluate/route.ts` — `LINK_ALIGNMENT_PROMPT` constant + `evaluateLinkAlignment()` helper deleted; new `syncLinkAlignment()` delegates to the unfurl endpoint; `fetchLinkMeta` import removed (now lives only in unfurl)

### Schema status

No schema migration in V3.11.

### Environment

No new environment variables. `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` are now read only via `lib/llm-fetch.ts` (the canonical observability layer); the unfurl route's direct reads are gone. Set the same values you already have.

### Verification

- `npm run build` clean (32/32 routes), no new TypeScript or lint diagnostics across the touched files.
- All eight refactored prompts inherit the super-prompt as the first system message; verified by code inspection.
- The link-alignment fold path was traced end-to-end: a post with a URL → evaluate route writes `link_alignment: "evaluating"` and posts to `/api/links/unfurl` → unfurl runs `llmCall("link_alignment", "link_unfurl", ...)` and writes `link_previews.sage_verdict` → evaluate route maps the three-state verdict to the two-state `posts.link_alignment` column.
- The `@Sage` signal note rewrite was verified by reading `buildSageMessages` end-to-end; welfare and character signal notes now carry matching precedence tails.

### What stays the same

V3.4–V3.10 invariants are unchanged. The cluster's behavior, Sage's framework, Clio's chat model, the Workshop dialogue cadence, the ephemeral surface, the tour, and the cluster UX polish all carry forward without modification. The platform's character has not changed — its rules now live in one place rather than 21.

*Updated 2026-05-22 as part of V3.11 (Session D: prompt-refactor sprint). Previous revision: V3.10.*


---

## V3.12 — Multi-cluster prompt restructure (current)

V3.11 placed the platform-level rules in one file and refactored seven prompts to inherit them. V3.12 takes the next step: separates **platform / cluster-type / cluster** concerns so the platform can host many clusters cleanly. Phase 0 is a multi-cluster product from day one — the MVP launches with one premium cluster (Sisters in Dua), but the structure is built for the generic test cluster, the second premium partner, and Phase 1 self-serve, all of which are imminent.

This is a **structural change with zero behavioural change.** Every existing import keeps working via thin re-export shims; routes don't need migrating in this commit. The build is green, the LLM calls are identical, the on-screen experience is identical. What changed is where files live and how the inheritance order is expressed in code.

### Why this was needed

Up to V3.11, `lib/sage-prompt.ts` carried the Sage character framework AND the Sisters-in-Dua-specific vocabulary in a single file. Same in `lib/clio-prompt.ts`. That structure ran into three problems:

1. **No path to a second cluster.** Adding even a generic test cluster meant duplicating Sage's full character — exactly the drift pattern the V3.4 cadence-exchange member-blame bug exposed.
2. **No clear scope when reading a file.** A reader of `sage-prompt.ts` couldn't tell which lines applied to every cluster vs which described Sisters in Dua specifically.
3. **No place for the cluster registry to land.** Phase 0's "spin up a generic cluster to verify multi-cluster behaviour" couldn't happen without a structural home.

### The new layout

```
mvp/src/lib/prompts/
├── platform/                       ← cluster-agnostic, every agent inherits
│   ├── super-prompt.ts                   AGGILO_SUPER_PROMPT_LITERAL
│   ├── sage-character.ts                 Generic Sage character + framework
│   ├── clio-character.ts                 Generic Clio character + welfare shape + ephemeral frame + dua review
│   └── share-mode.ts                     Share-line voice rules
├── cluster-types/                  ← per-type defaults
│   ├── generic.ts                        Stock-template defaults
│   ├── premium.ts                        Premium-tier defaults
│   └── types.ts                          Shared TS interfaces
├── clusters/                       ← concrete cluster implementations
│   └── sisters_in_dua/
│       ├── identity.ts                   Display name, tagline, chips, seed posts
│       ├── sage.ts                       Cluster-specific Sage prompt fragment
│       ├── clio.ts                       Cluster-specific Clio context fragment
│       ├── index.ts                      Module entry point
│       └── README.md                     Per-cluster doc
├── registry.ts                     ← cluster_id → cluster module resolver
├── sage-builder.ts                 ← stitches platform + cluster + signals + vault for Sage
├── clio-builder.ts                 ← stitches platform + cluster context for Clio (cluster + ephemeral)
├── share-builder.ts                ← stitches platform + share-mode for share-line builders
└── README.md                       ← layout overview
```

### Inheritance order (Sage, end-to-end)

1. `prompts/platform/super-prompt.ts` — soul + safety floor + voice baseline (the immutable platform layer)
2. `prompts/platform/sage-character.ts` — Sage's character + decision framework + bad-examples (Sage on every cluster)
3. `prompts/clusters/<cluster_id>/sage.ts` — cluster identity (this cluster only)
4. Per-call signals (welfare, character, @Sage), vault context, recent posts (runtime data)

Same shape for Clio (substitute `clio-character.ts` and `clusters/<cluster_id>/clio.ts`).

### The cluster registry

`prompts/registry.ts` maps `cluster_id → ClusterModule`. Routes call `requireClusterModule(cluster_id)` rather than importing cluster files directly. Adding a cluster is one entry in the registry plus one new directory under `clusters/`. Removing a cluster is the inverse.

`DEFAULT_CLUSTER_ID` is exposed for Phase 0 routes that haven't yet been updated to read `cluster_id` from the request — a Phase 1 prerequisite captured in the testing guide.

### Backward compatibility — re-export shims

The four legacy paths still work:

- `@/lib/super-prompt` → forwards to `@/lib/prompts/platform/super-prompt`
- `@/lib/sage-prompt` → forwards to the new builder + character + cluster identity
- `@/lib/clio-prompt` → forwards to the new builder + welfare regex + dua review prompt
- `@/lib/share-prompts` → forwards to the new share-builder

Every existing route keeps working unchanged. New code should import from `@/lib/prompts/...` directly. A V3.13 follow-up will migrate routes off the shims and remove them.

### Files added (mvp)

Code:
- `src/lib/prompts/README.md`
- `src/lib/prompts/registry.ts`
- `src/lib/prompts/sage-builder.ts`
- `src/lib/prompts/clio-builder.ts`
- `src/lib/prompts/share-builder.ts`
- `src/lib/prompts/platform/super-prompt.ts`
- `src/lib/prompts/platform/sage-character.ts`
- `src/lib/prompts/platform/clio-character.ts`
- `src/lib/prompts/platform/share-mode.ts`
- `src/lib/prompts/cluster-types/types.ts`
- `src/lib/prompts/cluster-types/generic.ts`
- `src/lib/prompts/cluster-types/premium.ts`
- `src/lib/prompts/clusters/sisters_in_dua/identity.ts`
- `src/lib/prompts/clusters/sisters_in_dua/sage.ts`
- `src/lib/prompts/clusters/sisters_in_dua/clio.ts`
- `src/lib/prompts/clusters/sisters_in_dua/index.ts`
- `src/lib/prompts/clusters/sisters_in_dua/README.md`

Docs:
- `docs/PHASE_0_CLUSTERS.md` — Phase 0 cluster plan, types, where things live
- `docs/TESTING_GUIDE.md` — how to verify every visual + non-visual change from V3.8 → V3.12

### Files changed (mvp)

- `src/lib/super-prompt.ts` — now a re-export shim
- `src/lib/sage-prompt.ts` — now a re-export shim (preserves `SAGE_SYSTEM_PROMPT`, `SISTERS_IN_DUA`, `SAGE_SEED_POSTS`, `buildSageMessages`, all helpers)
- `src/lib/clio-prompt.ts` — now a re-export shim
- `src/lib/share-prompts.ts` — now a re-export shim

### Schema status

No schema migration in V3.12.

### Environment

No new environment variables. The cluster registry is in code; cluster_id remains the database identifier.

### Verification

- `npm run build` clean (32/32 routes), no new TypeScript or lint diagnostics across the new files.
- All four legacy import paths (`@/lib/super-prompt`, `@/lib/sage-prompt`, `@/lib/clio-prompt`, `@/lib/share-prompts`) continue to resolve via the shims.
- Sisters in Dua's `cluster_id` (`the_single_source`) is preserved exactly — DB writes from the Sage / Clio routes still target the same row.
- Inheritance order verified by code inspection: every Sage and Clio call now produces a 3-system-message stack (super-prompt + character + cluster) rather than a single combined block.

### What V3.12 deliberately does not include

- **Migrating routes off the shims.** The shims are a one-commit-each task per route; doing it inline would have made V3.12 a 15-file diff. V3.13 picks them up.
- **A second concrete cluster.** The structure is ready to receive one. Spinning up a generic test cluster is V3.13 scope, alongside the route migration.
- **Cluster-id reading from the request.** Routes still pass `DEFAULT_CLUSTER_ID` implicitly. Phase 1 prerequisite — every route accepts an explicit `cluster_id` and the default is removed.
- **Cluster-vocabulary parameterisation in agent prompts beyond what the builders already do.** The builders already use `cluster.identity.memberNoun` etc. when constructing user-context messages. Phase 1 work extends this to the embedded literal text inside cluster-specific Sage / Clio fragments.

### What stays the same

V3.4–V3.11 invariants are unchanged. Sage's behaviour, Clio's behaviour, the cadence dialogue, the introspection cycle, the link-alignment fold — none of these change in V3.12. The cluster registry resolves to the same module that was previously inlined; the LLM receives the same instructions.

The phrase "the platform's character has not changed; its rules now live in one place rather than 21" from V3.11 still applies — V3.12 just put those rules in well-organised drawers.

*Updated 2026-05-22 as part of V3.12 (multi-cluster prompt restructure). Previous revision: V3.11.*


---

## V3.14 — Senior-review follow-up: spec docs for slider, super-prompt intent, agent communication, real-time layer, runtime rename, agent sequencing, two dashboards

V3.13 reorganised docs/architecture into a clean Phase 0 / Phase 1 separation. V3.14 takes the four follow-up directives from the senior-UX/behavioural review and lands implementation-ready specifications for each, so a future build session has paper-ready instructions to start from.

This is **specification, not implementation.** Zero code changed. No schema changes. Seven new documents, all founder-approved, all implementation-ready.

### What V3.14 covers

**1. The slider — `docs/AGENT_INVOLVEMENT_SLIDER_SPEC.md`.**
Premium-cluster admin surface for the agent-involvement slider, with the senior-UX recommendation incorporated: a per-cluster `Recommended for this cluster` label + a 3-bullet behaviour preview that re-renders on slider movement + an immutable safety-floor footnote at every level. Reference content for every level transition is captured verbatim so the runtime renders strings, not improvises them. Generic clusters do not get the slider in Phase 0.

A new `cluster_config.domain_sensitivity` field (low/medium/high) drives the recommendation engine. One ALTER TABLE.

**2. The cosmology layer in the super-prompt — `docs/SUPERPROMPT_DESIGN_INTENT.md`.**
Founder decision recorded as architecturally binding. The cosmology layer (monotheism in Layer 3 of the super-prompt) stays. The "leak" the senior review flagged as a risk is reframed as design intent — the platform is not neutral about what makes a meaningful life, and the long-game purpose includes inviting member self-reflection at appropriate moments. Coding agents are forbidden from refactoring Layer 3 without explicit founder approval recorded in the document. Decision history table preserved.

**3. The inter-agent communication contract — `architecture/AGENT_COMMUNICATION_CONTRACT.md`.**
Consolidates inter-agent communication patterns scattered across per-agent AGENTS.md files into one normative contract. Five patterns named and scoped: brief-and-iterate (Sage↔Atlas), directed job (Clio→Scout), soft handoff (Sage→Clio), finding-and-approve (Observer→admin→target), tool proposal (downward through the agent hierarchy). Every inter-agent surface inherits the super-prompt safety floor, the dignity invariants, the observability layer, and the protocol-disclosure rule. Adding a new agent requires answering five classification questions before its spec is considered ready.

**4. The real-time engagement layer — `architecture/REALTIME_ENGAGEMENT_LAYER.md`.**
Names the four real-time signals already shipped (Presence, Composition, Arrival, Care reach-out) as a coherent layer, with channel ownership, sub-types, fallback contract, and privacy posture for each. The dignity ceiling is made explicit: composition is anonymous; care reach-outs are private to one user; Workshop dialogue is service-framed. New real-time signals require four answers before ship.

**5. Agent Runtime — `architecture/AGENT_RUNTIME.md`.**
Establishes the canonical name for the runtime layer (formerly "Yantra") and documents the BullMQ implementation that backs it in production. Four lanes (critical / high / medium / low) with SLA bands. Per-agent runtime profile schema. Idempotency keys. Failure-mode contract. New `runtime_events` table for the agent-runtime observability layer (separate from `llm_response_logs` and `behavioural_events`). Migration checklist for renaming "Yantra" references in Atlas/Scout/Observer/Clio/Sage AGENTS files. Documentation rename only — no code change required.

**6. Phase 0 agent sequencing — `docs/PHASE_0_AGENT_SEQUENCING.md`.**
Founder direction recorded: Atlas, Scout, and Observer are Phase 0 infrastructure, not Phase 1 deferrals. Wave order:

- **Wave 1 — Observer.** All 10 domains live. Read-only. Lowest external risk. ~3 weeks.
- **Wave 2 — Scout.** Both intelligence modes (live observation + LLM inference). Produces ≥3 actionable findings per 30 days. ~3 weeks.
- **Wave 3 — Atlas.** Full pipeline including curated source list, Sage iterative dialogue, synthesis-mode counter, Pulse cards. ~4 weeks.

Hard gates between waves: 14-day Wave 1 observation, 30-day Wave 2 observation. Total Phase 0 with all three live: ~17 weeks from V3.14.

Members never see Atlas/Scout/Observer named. Internal-only naming until ship; then "Pulse" framing for Atlas-content cards (the work, not the worker).

**7. Two dashboards — `docs/CLUSTER_ADMIN_CONSOLE_SPEC.md` and `docs/AGGILO_ADMIN_DASHBOARD_SPEC.md`.**
The customer-facing Cluster Admin Console (Founder + Manager) and the Aggilo team's Aggilo Admin Dashboard (`platform_admin`). Both implementation-ready. Each covers navigation, per-section detail, RLS, action triggers, and done-criteria checklists. The two surfaces co-exist; the Aggilo team can read both, cluster Founders/Managers see only their cluster's console.

The Aggilo Admin Dashboard's Findings tab is the single most-used surface — the Observer findings queue is where Aggilo-team work routes. The Cluster Admin Console's Care queue is the equivalent for cluster Founders.

Both specs are sized for one focused build session each (~3 weeks of dev work for the full surfaces; subset MVPs are smaller).

> *Renamed from `PLATFORM_ADMIN_DASHBOARD_SPEC.md` and `PREMIUM_CLUSTER_ADMIN_DASHBOARD_SPEC.md` in V3.15.*

### What V3.14 does NOT cover

- No code changes. The seven docs are paper-ready instructions; the build happens in subsequent sessions.
- No schema migrations. Two new fields are documented (`cluster_config.domain_sensitivity`, `runtime_events`); the migrations land alongside the implementation work.
- No agent ship. Atlas, Scout, Observer remain unimplemented per current state. The sequencing doc says when each ships; it does not ship them.
- No Yantra rename in code. The architecture rename is documentation-only; the migration checklist names the files to update in a separate ~2-hour session.

### Files added (docs)

- `docs/AGENT_INVOLVEMENT_SLIDER_SPEC.md`
- `docs/SUPERPROMPT_DESIGN_INTENT.md`
- `docs/PHASE_0_AGENT_SEQUENCING.md`
- `docs/CLUSTER_ADMIN_CONSOLE_SPEC.md` *(originally `PREMIUM_CLUSTER_ADMIN_DASHBOARD_SPEC.md`; renamed in V3.15)*
- `docs/AGGILO_ADMIN_DASHBOARD_SPEC.md` *(originally `PLATFORM_ADMIN_DASHBOARD_SPEC.md`; renamed in V3.15)*

### Files added (architecture)

- `architecture/AGENT_COMMUNICATION_CONTRACT.md`
- `architecture/REALTIME_ENGAGEMENT_LAYER.md`
- `architecture/AGENT_RUNTIME.md`

### Schema status

No migrations in V3.14. Two fields documented for future migrations:

- `cluster_config.domain_sensitivity` (VARCHAR(8) default 'medium')
- `runtime_events` table (full DDL in `architecture/AGENT_RUNTIME.md`)

### Verification

- All seven documents render correctly as Markdown.
- Cross-references resolve (each doc's predecessor / authority links point to existing files).
- No content contradicts the super-prompt, the soul, or platform rules.
- Founder decisions recorded with dates: cosmology layer (2026-05-22), Atlas/Scout/Observer as Phase 0 infrastructure (2026-05-22), slider design with recommendation engine (2026-05-22).

### What stays the same

V3.4–V3.13 invariants are unchanged. No prompt edits in V3.14. Cluster behaviour, Sage's framework, Clio's chat model, Workshop dialogue, ephemeral surface, the tour, the cluster UX polish — all carry forward without modification.

The platform's character has not changed. V3.14 documents *seven implementation paths* for capabilities the platform's character implies, so a future builder reads paper instead of guessing.

*Updated 2026-05-22 as part of V3.14 (senior-review follow-up: seven implementation-ready specs). Previous revision: V3.13.*


---

## V3.15 — Dashboard renaming, customer-facing presentation, wave-status surface, HTML reference page (current)

A targeted clarity pass on V3.14's dashboard specs and a couple of the
specs around them. Founder direction:

- *"Platform admin should be changed to Aggilo admin dashboard for
  better clarity."*
- *"Premium cluster admin dashboard will be for the customers, right?
  So it will have a different view."*
- *"Phase 0 agent sequencing needs to reflect in the Phase 0 admin
  dashboard."*
- *"Agent communication contract will need an HTML page for easy
  reference, so create a corresponding HTML with all details."*

All four directives addressed. Zero code, zero schema, no behavioural
change.

### Renamed dashboards

- **`PLATFORM_ADMIN_DASHBOARD_SPEC.md` → `AGGILO_ADMIN_DASHBOARD_SPEC.md`.** The dashboard for the Aggilo team, now named for clarity. The DB role identifier (`platform_admin`) is unchanged — only the user-facing name. Internal copy in the spec converted from "platform admin" to "Aggilo admin" / "the Aggilo team" throughout. Route prefix moves from `/admin/platform/*` to `/admin/aggilo/*` in the implementation pass.
- **`PREMIUM_CLUSTER_ADMIN_DASHBOARD_SPEC.md` → `CLUSTER_ADMIN_CONSOLE_SPEC.md`.** The customer-facing surface, now named "Cluster Admin Console" — a name that travels well with partners, isn't internal jargon, and signals the customer relationship clearly. Route prefix moves to `/admin/cluster/<slug>/*`.

### Cluster Admin Console — customer-facing presentation rules

The renamed Cluster Admin Console picks up an explicit customer-facing
presentation section:

- Cluster name + member count visible in the top-bar at all times (so a Founder running multiple clusters never loses track).
- No platform-internal jargon (e.g. "Aggilo team" replaces "platform_admin" in copy; "cadence-exchange" stays internal-only and becomes "the Workshop dialogue" customer-side).
- Brand voice consistent with cluster's persona for cluster-specific copy; Aggilo's voice for console chrome.
- No mention of agent-internal mechanics in customer-facing surfaces.

### Aggilo Admin Dashboard — Phase 0 wave-status surface

A new section appended to the Aggilo Admin Dashboard spec — `Phase 0 wave status` — rendered as a banner at the top of the Findings tab. Visible on landing. Reflects which agent waves are live per `docs/PHASE_0_AGENT_SEQUENCING.md`:

```
Wave 1 — Observer:  ✅ Live (since 2026-XX-XX)
Wave 2 — Scout:     🚧 In progress  (Wave 1 observed 8 of 14 days)
Wave 3 — Atlas:     ⏳ Not started
```

Wave-gated tabs (Demand, Pulse) render as "Coming in Wave N" until
their wave is live. Aggilo team advances waves from the Settings tab
once done-criteria pass and the observation gate clears. New
platform setting: `phase_0_wave_status` (JSON).

### HTML reference for the agent communication contract

`docs/AGENT_COMMUNICATION_CONTRACT.html` ships alongside the markdown
source. Single-file, inline CSS, zero JS dependencies. Renders:

- Agent hierarchy diagram inline (preformatted ASCII tree, monospaced).
- Sticky table of contents with anchor links to every section.
- Five communication patterns as collapsible `<details>` blocks (the first one open by default).
- The pairwise relationships table.
- The shared substrate every communication inherits.
- The five-question checklist for new agents.
- Aggilo-deep + amber + sage colour palette honouring the platform's six-accent budget.

Readable in any modern browser without a server. Useful for sharing
with partner engineers or as a quick-reference page during
architecture reviews.

### Updated cross-references

- `docs/PHASE_0_AGENT_SEQUENCING.md` updated with the new dashboard
  filename in two places.
- `docs/MASTER_INSTRUCTIONS.md` V3.14 entry updated to reflect the
  renamed dashboards.

### Folder placement decisions confirmed

Confirmed founder approval for:
- `architecture/AGENT_COMMUNICATION_CONTRACT.md` stays in `/architecture/` (production architecture, peer to parts 1–6).
- `architecture/AGENT_RUNTIME.md` stays in `/architecture/` (production architecture).
- `architecture/REALTIME_ENGAGEMENT_LAYER.md` stays in `/architecture/` (production architecture — the explicit founder directive).
- `docs/SUPERPROMPT_DESIGN_INTENT.md` stays. Records a binding founder decision; deleting it would re-open a closed architectural question on next review.

### Files renamed (docs)

- `docs/PLATFORM_ADMIN_DASHBOARD_SPEC.md` → `docs/AGGILO_ADMIN_DASHBOARD_SPEC.md`
- `docs/PREMIUM_CLUSTER_ADMIN_DASHBOARD_SPEC.md` → `docs/CLUSTER_ADMIN_CONSOLE_SPEC.md`

### Files added

- `docs/AGENT_COMMUNICATION_CONTRACT.html` — single-file HTML reference page

### Files changed

- `docs/AGGILO_ADMIN_DASHBOARD_SPEC.md` — heading + scope + body language, new Phase 0 wave-status section, navigation list updated
- `docs/CLUSTER_ADMIN_CONSOLE_SPEC.md` — heading + scope + customer-facing presentation rules + body language scrubbed of platform-internal terminology
- `docs/PHASE_0_AGENT_SEQUENCING.md` — cross-references updated
- `docs/MASTER_INSTRUCTIONS.md` — V3.14 entry updated, V3.15 changelog written

### Schema status

No migrations in V3.15. One new platform setting documented for the
wave-status surface (`phase_0_wave_status` JSON), to land alongside
the wave-1 implementation.

### What stays the same

V3.4–V3.14 invariants are unchanged. No prompt edits in V3.15. No
code changes. The platform's character has not changed; the renaming
makes its surfaces clearer to the people who will read them.

*Updated 2026-05-22 as part of V3.15 (dashboard renaming, customer-
facing presentation, wave-status surface, HTML reference page).
Previous revision: V3.14.*
