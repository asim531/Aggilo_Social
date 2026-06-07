# docs/ — Operational & Behavioral Specifications

> **Purpose:** Cross-cluster agent behavioral specs, operational docs, help text, and session artifacts.
>
> **Authority:** Subordinate to `../AGGILO_SOUL.md`, `../AGGILO_PLATFORM_RULES.md`, and `../architecture/`.
>
> **For coding agents:** Read `../ARCHITECTURE.md` first, then `../architecture/` in order, then consult this directory for specific operational concerns.

---

## Start Here

| Document | What it covers | When to read |
|----------|---------------|--------------|
| `ADMIN_DASHBOARD_HELP.md` | Source-of-truth for all admin-facing help text, tooltips, UI copy | When implementing admin dashboard |
| `AGGILO_ONBOARDING_PLAYBOOK_V2.md` | Onboarding flow specification | When implementing auth/onboarding |
| `AGENT_COLLABORATION_CHATBOX.md` | Agent chatbox cadence, authority, real-time delivery | When implementing agent chatbox |
| `CLIO_SAGE_HANDOFF.md` | Handoff protocol between Clio and Sage | When implementing cluster join flow |
| `SOUL_INJECTION_MAP.md` | Which Soul tier loads into which agent layer | When implementing prompt builders |

## By Category

### Agent Behavioral Specs
- `AGENT_COLLABORATION_CHATBOX.md` — Chatbox mechanics
- `AGENT_INVOLVEMENT_SLIDER_SPEC.md` — Admin slider levels
- `AGENT_VOICES.md` — Agent voice registers and examples
- `CLIO_AMBIENT_PROTOCOL.md` — Clio's background presence
- `CLIO_SAGE_HANDOFF.md` — Join-flow handoff
- `CLUSTER_SKILL_DISCOVERY_PROTOCOL.md` — Cross-agent skill dialogue
- `SCOUT_CLIO_DISTRIBUTION_ENGINE.md` — Content distribution

### Operational & Help
- `ADMIN_DASHBOARD_HELP.md` — Master UI copy source
- `AGGILO_ADMIN_DASHBOARD_SPEC.md` — Dashboard layout and features
- `AGGILO_ONBOARDING_PLAYBOOK_V2.md` — User onboarding
- `CLUSTER_ADMIN_CONSOLE_SPEC.md` — Admin console
- `CLUSTER_FEATURES_TAB.md` — Workshop features UI
- `TESTING_GUIDE.md` — QA procedures

### Architecture Support
- `ATLAS_RUNTIME_DESIGN.md` — Atlas content pipeline
- `SOUL_INJECTION_MAP.md` — Prompt layer injection rules
- `SUPERPROMPT_DESIGN_INTENT.md` — Why the super-prompt is shaped this way
- `MASTER_INSTRUCTIONS.md` — Legacy master instructions (superseded by `architecture/`)

### Session Archives
- `sessions/` — Archived planning and review sessions
- `_archived/` — Superseded documents

## Phase0 Graduation Reference

Phase0 contains two pilot Next.js apps with real user data. Several features implemented in Phase0 are ready to graduate to the main product (`apps/web/` + `apps/api/`). This table maps each graduated feature to its architecture spec and Phase0 source files.

| Feature | Architecture Spec | Phase0 Source (Reference Implementation) | Priority |
|---------|-------------------|------------------------------------------|----------|
| **Demand Signals** | `docs/ADMIN_DASHBOARD_HELP.md` §4a, `architecture/system_implementation_prompt_part2.md` §Demand Signals Schema | `phase0/mvp/src/app/api/demand-signals/route.ts`, `phase0/mvp/src/components/admin/DemandSignalsTable.tsx` | High |
| **Sage Feedback** | `docs/ADMIN_DASHBOARD_HELP.md` §4c, `observer/OBSERVER_INTROSPECTION_ENGINE.md` §sage_post_feedback | `phase0/mvp/src/components/SageFeedback.tsx`, `phase0/mvp/src/app/api/feedback/route.ts` | High |
| **Public Cluster View** | `architecture/premium_cluster_requirements.md` §Public-Listing Controls, `AGGILO_PLATFORM_REPORT.md` §7 `/api/clusters/:id/preview` | `phase0/mvp/src/lib/public-cluster.ts`, `phase0/mvp/src/app/c/[slug]/page.tsx` | Medium |
| **Atlas Runtime / RSS** | `architecture/system_implementation_prompt_part1.md` §Data Acquisition Layer | `phase0/mvp/src/lib/atlas-runtime.ts` (606 lines), `phase0/mvp/src/app/api/admin/atlas/tick/route.ts` | Medium |
| **Clio Tour / Show Around** | `architecture/system_implementation_prompt_part1.md` §7.6a | `phase0/mvp/src/components/ClioTour.tsx`, `phase0/lc/src/components/ClioTour.tsx` | Medium |
| **Email Templates** | `architecture/system_implementation_prompt_part1.md` §Email | `phase0/lc/emails/`, `phase0/lc/src/lib/sendFounderInvite.ts` | Medium |
| **AuthForm with Founder Params** | `architecture/system_implementation_prompt_part3.md` §Phase 3 | `phase0/lc/src/components/AuthForm.tsx`, `phase0/mvp/src/components/AuthForm.tsx` | High |
| **Presence Context** | `architecture/REALTIME_ENGAGEMENT_LAYER.md` | `phase0/lc/src/lib/presence-context.tsx`, `phase0/mvp/src/lib/presence-context.tsx` | Medium |
| **Admin Cluster Management** | `architecture/AGGILO_ADMIN_DASHBOARD_SPEC.md` | `phase0/mvp/src/app/admin/clusters/[slug]/page.tsx`, `phase0/mvp/src/app/admin/clusters/page.tsx` | Medium |
| **Post Card / Feed / Composer** | `architecture/system_implementation_prompt_part3.md` §Phase 5 | `phase0/mvp/src/components/PostCard.tsx`, `phase0/lc/src/components/PostCard.tsx` | High |
| **Link Preview / URL Unfurling** | — (Quality-of-life, no architecture spec) | `phase0/lc/src/components/LinkPreviewCard.tsx`, `phase0/lc/src/lib/link-preview.ts` | Low |
| **Dua Progressive Reveal** | — (Pattern-level, abstractable to generic `ProgressiveReveal`) | `phase0/mvp/src/components/DuaProgressiveReveal.tsx` | Low |
| **Pinned Anchor** | `architecture/system_implementation_prompt_part1.md` §7.5 | `phase0/mvp/src/components/PinnedAnchor.tsx` | Low |
| **Typing Indicator** | `architecture/REALTIME_ENGAGEMENT_LAYER.md` | `phase0/mvp/src/components/TypingIndicator.tsx` | Low |

> **Porting rule:** When moving a feature from `phase0/` to `apps/`, read the architecture spec first, then use the Phase0 component as a behavioral reference — not a direct copy. Phase0 uses Next.js App Router patterns that may differ from the main product's React + Vite setup.

## Note on `orchestrator/`

The `orchestrator/` subdirectory contains agent orchestration specs that are being migrated to `../architecture/AGENT_RUNTIME.md` and `../observer/`. Consult `architecture/` first; `orchestrator/` is reference-only.
