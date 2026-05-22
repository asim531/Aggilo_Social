# Aggilo — Session Documents

This folder contains scoped session briefs for the next three working sessions on the Aggilo platform. Each session brief is **self-contained** — it can be opened cold (by a new chat session, a fresh agent context, or you returning after a break) and executed without needing to re-read the wider architecture corpus first.

The split is deliberate: each session has a different *cognitive mode*, and mixing them in one session has historically diluted the work. Three sessions, three modes:

| # | Brief | Mode | When to do |
|---|---|---|---|
| **A** | [`SESSION_A_CONFIGURABILITY.md`](SESSION_A_CONFIGURABILITY.md) | **Closing & shipping.** Fix in-flight bugs, ship premium configurability schema, decide cluster-identity questions. | First — has live-product bugs that need fixing |
| **B** | [`SESSION_B_DISCOVERABILITY.md`](SESSION_B_DISCOVERABILITY.md) | **Outward-facing growth.** Public cluster cards, SEO, OG images, AI provider directory registration, share flow. Atlas registered as a live capability with schema in place. | Closed 2026-05-22 |
| **B.5** | [`SESSION_B5_PUBLIC_LISTING_ADMIN.md`](SESSION_B5_PUBLIC_LISTING_ADMIN.md) | **Inward-facing tooling.** Per-cluster admin panel for public listing, Atlas RSS curation, Pulse review queue, Atlas worker runtime. | Closed 2026-05-22 |
| **C** | [`SESSION_C_PROMPT_AUDIT.md`](SESSION_C_PROMPT_AUDIT.md) | **Deep work.** Comprehensive audit of all 21 prompts in the system against a consistent rubric. | After B.5 — Atlas-related prompts can be reviewed against real output |

## Reading order

If you're picking up this work cold:

1. Read [`AGGILO_SOUL.md`](../../AGGILO_SOUL.md) (philosophical foundation — 10 min)
2. Read [`AGGILO_PLATFORM_RULES.md`](../../AGGILO_PLATFORM_RULES.md) (operational rules — 15 min)
3. Read the session brief for the session you're about to do
4. Skim the relevant `architecture/system_implementation_prompt_partN.md` files referenced in the brief
5. Start

## What's already shipped (state at start of Session A)

- **Phase 0 MVP live at `mvp.aggilo.in`** — single premium cluster (Sisters in Dua)
- **V3.4 Room Workshop + two-track capability model** — code shipped, architecture docs updated
- **Seven AI-native principles** baked into architecture (V3.2)
- **Phase 0 stage definition** + vault-entry repetition protocol (V3.3)
- **Demographic chips invariant** + Clio FAB idle-breathing + portal context menu (V3.3.2)
- **Closed-loop telemetry** — `llm_response_logs`, `sage_decision_logs`, `agent_feedback`, `behavioural_events`

## What is *not* in any of these sessions

- Phase 1 generic-cluster platform build (post-MVP)
- BullMQ / Node-Fastify migration
- Razorpay / Premium pricing UI
- Push notifications (FCM)
- Mobile-native app

These remain on the roadmap but are out of scope for the next three sessions.

---

*Created 2026-05-22. Maintainer: rotate as sessions close.*
