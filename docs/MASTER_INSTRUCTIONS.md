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

