# Real-Time Engagement Layer — Architecture

> **Status:** Architectural spec. Consolidates real-time signals
> already shipped across cluster surfaces and names the contract
> they collectively form.
>
> **Authority:** Subordinate to `architecture/system_implementation_prompt_part1..6.md`
> and to `AGGILO_PLATFORM_RULES.md`. Adds an explicit contract layer
> for runtime member-to-member and agent-to-member presence signals.

---

## Why this document exists

Real-time engagement was named as a platform goal but spread across:

- `ClusterPresence` (cluster header — live count, total, joined this week)
- `TypingIndicator` (anonymised "a sister is writing…")
- `useRealtimePosts` (timeline live updates)
- `agent_chatbox_exchanges` realtime subscription (Workshop dialogue)
- `clio_handoff_greetings` realtime INSERT (Clio handoff arrival)
- `posts.sage_handoff_to_clio_at` UPDATE (cluster-visible inline note)
- The "↑ N new posts" pill (V3.10 dynamic threshold)

Each works in code. None of them was the *layer* — there was no single
doc that said "this is how the platform feels live."

This document names the layer. It captures the contract every
real-time signal honours, the channels it flows through, the fallback
when realtime drops, and the privacy posture that governs all of them.

---

## The four real-time signals

| # | Signal | What members feel | Source |
|---|---|---|---|
| 1 | **Presence** | "Members are here right now" | Supabase Realtime presence channel |
| 2 | **Composition** | "Someone is writing" | Presence broadcast event |
| 3 | **Arrival** | "New content has appeared" | Postgres CDC (INSERT/UPDATE) on `posts`, `agent_chatbox_exchanges`, `clio_handoff_greetings` |
| 4 | **Care reach-out** | "Clio is reaching out privately" | Postgres CDC INSERT on `clio_handoff_greetings` filtered to `user_id` |

Each signal has a single code owner, a single cluster-broadcast
channel, and a single privacy posture.

### Signal 1 — Presence

**Channel:** `cluster:{cluster_id}:presence` (Supabase Realtime
presence)

**Owner:** `PresenceProvider` (React context at the cluster shell)

**Tracks:** `{user_id, nickname, online_at}`

**Consumers:**

- `ClusterPresence` (header, total + live count)
- `PostCard` (small green dot next to a member's nickname when online)

**Privacy posture:** Member's `nickname` is visible to other members
in the cluster. Member's `user_id` is NEVER broadcast in member-
visible UI; it is consumed only by the local browser to dedup and to
match presence to PostCard rendering. Centralising the channel through
a single `PresenceProvider` prevents duplicate subscriptions (which
double-count the local user).

**Cross-cluster scoping (multi-cluster):** the channel name carries
the `cluster_id`, so a member in two clusters is counted in each one
independently. A `cluster_members` join table scopes the count when
the platform shifts off pilot's single-tenant assumption.

### Signal 2 — Composition

**Channel:** Same presence channel as Signal 1 (broadcast events).

**Event name:** `typing`

**Throttle:** 2s per emit per member. Auto-clears after 4s of no
activity.

**Privacy posture:** **Composition is anonymous to other members.**
The receiver hears "a sister is writing…" or "N sisters are writing…"
but never the nickname. This is a deliberate dignity choice — being
*about to speak* should not be a surveillance surface.

**Display:** Fixed-height 24px slot above the compose bar (V3.10
microinteraction). Empty when no one types; filled when one or more
members write. Compose bar position never shifts.

### Signal 3 — Arrival

Three sub-types, each with its own CDC subscription:

#### 3a. Member-post arrival
- **Subscription:** Postgres INSERT on `posts` filtered to current cluster.
- **Owner:** `useRealtimePosts` hook.
- **Display:** `↑ N new posts` pill when feed-top is above viewport with 32px tolerance (V3.10 dynamic threshold).
- **Accessibility:** `role="status"` + `aria-live="polite"`; explicit `aria-label` includes the action.

#### 3b. Sage handoff inline note
- **Subscription:** Postgres UPDATE on `posts` filtered to current cluster, watching `sage_handoff_to_clio_at`.
- **Owner:** `useRealtimePosts` hook (same subscription, UPDATE event).
- **Display:** "Clio is following up privately." inline note on the originating post.
- **Privacy posture:** Cluster-visible note never names the reason. Reason is internal-only and drives the bubble tone (rose / amber / indigo) in the receiver's private FAB.

#### 3c. Workshop exchange arrival
- **Subscription:** Postgres INSERT on `agent_chatbox_exchanges` filtered to `cluster_id`.
- **Owner:** `AgentChatbox` component.
- **Display:** New exchange replaces the seed fallback if the table was empty; otherwise appends to the visible preview list (capped at 3) and refreshes the unread badge.
- **Privacy posture:** Workshop dialogue is cluster-visible. Service framing only — never references member behaviour.

### Signal 4 — Care reach-out

**Channel:** Postgres INSERT on `clio_handoff_greetings` filtered to
`user_id=eq.{userId}`.

**Owner:** `ClioFab`.

**Display:** Greeting lands in the "Just Clio · forgets" tab as the most-
recent Clio message. FAB icon shows a soft rose dot for unread.

**Privacy posture:** This is the most weight-bearing realtime signal.
The greeting:

- Lands only for the user it was queued for.
- Carries `handoff_reason` which drives bubble tone but is never
  surfaced in copy.
- Uses **deterministic templates** (no LLM) so the greeting cannot
  drift on a high-stakes moment.
- Is not visible in the cluster timeline.

---

## The fallback contract

Realtime drops happen — Supabase reconnect cycles, browser tab
suspension, network instability. The platform handles each signal
with a tiered fallback:

| Signal | Online (live) | Reconnecting | Fully offline |
|--------|---------------|--------------|---------------|
| Presence | Live count | Last-known count, 30s stale-marker | Hidden |
| Composition | Live indicator | Hidden (no false signals) | Hidden |
| Arrival (member posts) | Pill + auto-refresh | On-reconnect-fetch (initial pull on mount) | Pull-to-refresh on user gesture |
| Arrival (handoff inline note) | Live update | On-reconnect-fetch | Visible on next page load |
| Arrival (Workshop) | Live update | Initial pull on next mount | Visible on next page load |
| Care reach-out | Realtime INSERT | Initial pull on mount (covers handoffs queued while offline) | Visible on next FAB open |

**Initial pull on mount** is the load-bearing fallback. Every realtime
consumer also runs a one-time fetch on mount to catch anything queued
while the user was away. This is the "you missed nothing" guarantee.

---

## The privacy ceiling

Across every real-time signal, three rules are non-negotiable:

1. **Composition is anonymous.** Members feel the room writing without
   surveilling who.
2. **Care reach-outs are private to one user.** The cluster sees the
   inline note ("Clio is following up privately") without seeing
   reason or recipient.
3. **Workshop dialogue is service-framed.** Subjects are the room and
   the agents; never member behaviour.

These three rules constitute the platform's real-time-engagement
character. Any new real-time signal added in the future is reviewed
against them before ship.

---

## Adding a new real-time signal

When a new signal is proposed (e.g. "Sage is considering this post"
indicator, "member joined" splash, Atlas Pulse arrival animation),
the proposer answers four questions:

1. **What does the member feel?** Plain language, member perspective.
2. **What channel does it flow through?** Reuse an existing channel
   if possible; new channels add subscription overhead.
3. **What is the privacy posture?** Is it scoped to one user, scoped
   to the cluster, or scoped globally? Does it expose anything about
   any individual member?
4. **What is the fallback when realtime drops?** Initial-pull, on-
   reconnect-fetch, hidden, or visible-on-next-load.

If any of the four cannot be answered cleanly, the signal does not
ship until it can.

---

## Phase 0 / Phase 1 boundary

This layer ships in pilot already. The Phase 1 prerequisites:

- **Multi-cluster presence channel scoping** verified end-to-end with
  a generic test cluster (currently single-cluster by assumption in
  the pilot).
- **Workshop arrival signal** scoped per `cluster_id` correctly when
  multiple clusters are active in one session.
- **Care reach-out filter** verified across multi-cluster (already
  filtered on `user_id`, but cross-cluster reach-out behaviour needs
  validation).

---

## Implementation references

| Signal | Code path |
|--------|-----------|
| 1. Presence | `src/lib/presence-context.tsx`, `src/components/ClusterPresence.tsx` |
| 2. Composition | `src/components/TypingIndicator.tsx` (consumer); `src/lib/presence-context.tsx` (broadcast) |
| 3a. Member-post arrival | `src/hooks/useRealtimePosts.ts`, `src/components/ClusterFeed.tsx` |
| 3b. Handoff inline note | `src/hooks/useRealtimePosts.ts` (UPDATE event), `src/components/PostCard.tsx` |
| 3c. Workshop arrival | `src/components/AgentChatbox.tsx` |
| 4. Care reach-out | `src/components/ClioFab.tsx` |

These paths apply to the current pilot deployment. Production
implementations (BullMQ + Redis + Fastify) reproduce the same
contracts against the equivalent runtime.

---

*Architecture · 2026-05-22 · Authoritative for real-time engagement
across all clusters (premium and generic).*
