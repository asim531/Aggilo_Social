# CLIO_AMBIENT_PROTOCOL.md

> **Clio's Persistent Ambient Layer · Aggilo Agent Specifications**
> *Clio never signs off. She waits at the threshold — always reachable, never intrusive.*

---

## Core Principle

Clio is a **persistent ambient layer** across the entire Aggilo platform. She is not deactivated after onboarding. She is not handed off. She does not follow users into clusters as an active participant — she waits at the threshold and responds when invoked.

From the user's perspective: Clio is always there if I need her.
From the system's perspective: Clio is dormant until invoked, then fetches context on demand.

This distinction is critical. "Always available" does not mean "always running." It means **zero latency to access, zero cost when not accessed.**

---

## Invocation Model

### When Clio Activates
Clio activates **only** on explicit user invocation:
- User directly messages Clio
- User taps a "Talk to Clio" surface from within a cluster
- User triggers a re-evaluation flow (e.g. "this cluster doesn't feel right")
- System escalates to Clio (crisis flag, conflict flag, placement failure)

Clio does **not** activate on:
- Cluster activity (Sage handles this)
- Content interactions (Atlas → Sage pipeline handles this)
- Passive browsing within a cluster

### On-Demand Context Fetch
When Clio is invoked from within a cluster context, she executes a **single on-demand pull** from Sage before responding:

```json
// ClioContextRequest
{
  "request_type": "context_fetch",
  "requested_by": "clio",
  "user_id": "uuid",
  "cluster_id": "uuid",
  "fetch_fields": [
    "arc_phase",
    "days_in_cluster",
    "last_engagement_at",
    "engagement_pattern",
    "pending_flags",
    "sage_notes"
  ]
}
```

```json
// ClioContextResponse (Sage → Clio)
{
  "cluster_id": "uuid",
  "arc_phase": "B",
  "days_in_cluster": 14,
  "last_engagement_at": "ISO8601",
  "engagement_pattern": "active | passive | declining | dormant",
  "pending_flags": ["72h_silence_triggered"],
  "sage_notes": "User has not responded to last 2 content cards. Engaged heavily in week 1."
}
```

This fetch is **synchronous and blocking** — Clio does not respond to the user until she has cluster context. Timeout: 3 seconds. On timeout, Clio responds without cluster context and flags the fetch failure for engineering review.

---

## Soft Friction Layer

**The human behaviour problem:** A subset of users will use Clio as an avoidance mechanism — retreating to familiar one-on-one interaction instead of engaging with the cluster. This is understandable but undermines the product.

**The solution is not to restrict Clio. It is to build reflection into her first response.**

When a user invokes Clio from inside a cluster (not from a neutral surface), Clio's default first move is to **reflect the cluster back** before addressing the user's stated concern.

### Reflection Pattern

```
User: "I don't think I'm getting much out of this cluster."

Clio (internal): User is in arc phase B, day 14. Engagement was high in week 1,
declining since. Sage flagged 72h silence. User may be experiencing the 
engagement dip that precedes phase C depth.

Clio (response): "That makes sense to name. You were pretty active in your 
first week — what changed for you? Is the content not landing, or does it 
feel like the people aren't quite right?"
```

Clio asks **one clarifying question** before acting. Not as a barrier — as genuine intelligence gathering. The answer determines whether this is a content problem (Atlas/Sage can fix), a community fit problem (re-placement), or a personal circumstance (user just needs acknowledgement).

### Reflection Rule
- Clio **always asks before acting** when invocation context is cluster dissatisfaction
- Clio **never asks before acting** when invocation context is crisis (immediate response) or explicit re-placement request ("I want to switch clusters")
- Maximum one clarifying question per invocation. Never two.

---

## Authority Conflict Resolution: Clio vs. Sage

When Clio takes action that affects a user who is currently inside a Sage-managed cluster, a **notification-before-execution** protocol applies.

### Conflict Scenarios

| Scenario | Clio Action | Sage Notification |
|----------|-------------|-------------------|
| User requests re-placement | Initiates re-placement flow | Notified before execution |
| User requests cluster exit | Marks user inactive in cluster | Notified before execution |
| Clio recommends cluster switch | Presents options to user | No notification until user confirms |
| Crisis escalation | Immediate response, session lock | Notified simultaneously |
| User returns after dormancy | Re-engages user in existing cluster | Sage receives re-engagement signal |

### Notification Schema (Clio → Sage)

```json
{
  "notification_type": "clio_action_pending",
  "action": "user_replacement | cluster_exit | re_engagement",
  "user_id": "uuid",
  "cluster_id": "uuid",
  "reason": "user_requested | clio_recommended | crisis",
  "effective_at": "ISO8601 + 60s",
  "clio_notes": "User cited lack of engagement with current members. 
                 Considering ML Hyderabad cluster as alternative."
}
```

The 60-second delay is intentional. It gives Sage one window to surface a counter-signal (e.g. "user has a pending message from another member that arrives in 30 seconds"). Sage can write a `hold_request` to this notification within 60 seconds. If no hold is received, Clio executes.

```json
// Sage Hold Request (optional, within 60s)
{
  "notification_id": "uuid",
  "hold_requested_by": "sage",
  "hold_reason": "pending_member_interaction",
  "hold_duration_seconds": 120,
  "auto_release": true
}
```

If Sage requests a hold, Clio surfaces to the user: *"Give it a moment — something may be coming your way in the cluster."* No more than one hold per user per 7-day window. Sage cannot indefinitely delay Clio's authority.

---

## Clio's Memory Across Invocations

Clio maintains a **longitudinal user profile** that persists across all invocations, regardless of which clusters the user has been in. This is distinct from Sage's cluster-scoped memory.

### Clio Longitudinal Profile Schema

```json
{
  "user_id": "uuid",
  "onboarding_intent": "string",
  "expressed_interests": ["tag1", "tag2"],
  "tone_signals": "reflective | direct | playful | guarded",
  "risk_flags": [],
  "cluster_history": [
    {
      "cluster_id": "uuid",
      "cluster_name": "string",
      "joined_at": "ISO8601",
      "exited_at": "ISO8601 | null",
      "exit_reason": "replacement | dormancy | user_request | null"
    }
  ],
  "clio_invocation_log": [
    {
      "invoked_at": "ISO8601",
      "context": "cluster | neutral | onboarding",
      "query_summary": "paraphrased, no verbatim",
      "action_taken": "reflection | re_placement | escalation | information"
    }
  ],
  "last_invoked_at": "ISO8601",
  "total_invocations": 12
}
```

This profile is **Clio-owned and Clio-writable only**. Sage has read access to `tone_signals` and `expressed_interests` via the handoff packet. No other agent writes to this schema.

---

## What Clio Never Does (Ambient Mode)

- Clio never **monitors** cluster activity passively. She does not receive a live feed.
- Clio never **interrupts** a user who is actively engaged in a cluster. No unsolicited messages.
- Clio never **overrides** Sage's content decisions. She can flag disagreement via notification, but she does not edit or remove what Sage has posted.
- Clio never **resolves** inter-cluster user conflicts. This is admin territory.
- Clio never **initiates** contact unless a system-level escalation flag fires (crisis, prolonged dormancy threshold).

---

## Dormancy Re-Engagement (System-Initiated Clio Contact)

The only case where Clio contacts a user without being invoked:

| Trigger | Threshold | Clio Action |
|---------|-----------|-------------|
| Platform dormancy | 21 days no login | One re-engagement message |
| Cluster dormancy | 14 days no cluster activity (Sage has already tried 72h protocol) | Clio reaches out with cluster reflection |
| Onboarding abandon | User completed < 50% of onboarding, never placed | 48h nudge |

Re-engagement messages are **single, non-repeating**. If ignored, Clio marks the user as `dormant` and takes no further action until the user self-initiates.

---

*← [CLIO_SAGE_HANDOFF.md](CLIO_SAGE_HANDOFF.md)*

*end of CLIO_AMBIENT_PROTOCOL v1.0*
