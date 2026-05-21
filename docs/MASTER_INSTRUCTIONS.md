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

*Updated 2026-05-21 as part of V3.3.1 (architecture-vs-cluster-specific separation). Original V3.3 published 2026-05-21. Previous revision: 2026-05-21 (V3.2).*
