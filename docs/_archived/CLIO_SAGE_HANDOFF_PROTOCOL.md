# CLIO_SAGE_HANDOFF.md

> **Handoff Protocol · Clio <-> Sage · Aggilo Agent Specifications**
> *The user must never feel the seam. They must feel the upgrade.*

---

## Purpose

This document defines the exact protocol for transferring a newly placed user from Clio's onboarding context into Sage's cluster management. It also defines the ongoing communication contract between Clio and Sage for the lifetime of a user's cluster membership.

The handoff is not one-directional. Clio sends the user context to Sage. Sage confirms her cluster persona back to Clio. Clio uses that confirmation to introduce Sage to the user before they enter the cluster. Only then does the user cross the threshold — already knowing who Sage is and what is happening inside.

The design principle: **the user experiences continuity and enhancement, not transition.**

---

## Full Handoff Sequence

```
1. Clio determines cluster placement
       |
2. Clio transmits Handoff Packet -> Sage
       |
3. [Optional] Three-Message Refinement (Sage <-> Clio)
       |
4. Sage resolves her cluster persona
       |
5. Sage transmits Persona Confirmation Signal -> Clio
       |
6. Clio composes and delivers the Sage Introduction to the user
       |
7. User enters the cluster
       |
8. Sage delivers her first message to the user
       |
9. Ongoing Clio-Sage signal contract begins
```

Steps 5 and 6 are new. Without them, Clio is introducing a stranger. With them, Clio is vouching for someone she knows — and the user feels the difference.

---

## The Handoff Moment

Handoff is triggered when Clio has determined cluster placement and the user has accepted (explicitly or implicitly) the cluster assignment. There is no user-facing event. No "you are now being handed to Sage." The transition is invisible until Clio's introduction makes it visible — deliberately and on Clio's terms.

What triggers handoff:
- User confirms cluster placement during onboarding
- Clio completes a re-placement and assigns user to a new cluster

What does NOT trigger a new handoff:
- User invoking Clio from within an existing cluster (ambient protocol, not handoff)
- User being moved between clusters by Sage's arc progression

---

## Step 2: The Handoff Packet (Clio -> Sage)

Clio compiles and transmits a structured handoff packet to Sage at the moment of cluster placement. This is the source of truth Sage uses to personalise the user's cluster experience and resolve her own persona.

```json
{
  "handoff_id": "uuid",
  "handoff_version": "1.1",
  "transmitted_at": "ISO8601",
  "user_id": "uuid",
  "cluster_id": "uuid",
  "placement_confidence": 0.87,

  "user_profile": {
    "onboarding_intent": "Find ML collaborators in Hyderabad, not just consume content",
    "expressed_interests": ["machine learning", "co-founders", "building in public"],
    "tone_signals": "direct | curious | low-patience-for-fluff",
    "communication_style": "prefers concise, dislikes performative warmth",
    "prior_cluster_history": []
  },

  "cluster_tone_aggregate": {
    "direct": 0.72,
    "curious": 0.61,
    "warm": 0.38,
    "low_patience_for_fluff": 0.65
  },

  "placement_rationale": "User's primary stated need — active collaboration over passive learning — maps directly to this cluster's phase B composition. 3 existing members have expressed similar intent in the last 14 days.",

  "clio_observations": {
    "engagement_during_onboarding": "high | medium | low",
    "hesitation_signals": "User asked twice whether cluster is 'active enough' — implicit fear of joining a dead community.",
    "trust_level": "developing",
    "risk_flags": []
  },

  "recommended_first_message_hook": "Reference user's specific intent (collaborators, not content consumers) and surface a current cluster activity signal.",

  "clio_notes": "Do not open with generic welcome. This user will disengage immediately if Sage's first message feels like a template. Name something specific happening in the cluster."
}
```

### Required Fields (Handoff Fails Without These)

| Field | Why Required |
|-------|--------------|
| `onboarding_intent` | Sage's first message and Clio's introduction both callback to this |
| `tone_signals` | Informs Sage's persona resolution |
| `cluster_tone_aggregate` | Sage needs cluster-level tone, not just the incoming user's tone |
| `hesitation_signals` | Allows Sage and Clio to pre-empt likely disengagement |
| `risk_flags` | Safety — non-negotiable |

If any required field is missing, Sage writes a `handoff_incomplete` flag and uses defaults. Clio is notified to backfill within 24 hours.

---

## Step 3: Three-Message Refinement (Optional)

After receiving the handoff packet, Sage may raise disagreements based on cluster-level context Clio doesn't have. Capped at **three messages maximum.**

```
Round 1 — Sage -> Clio: Disagreement or query
Round 2 — Clio -> Sage: Resolution or clarification
Round 3 — Sage -> Clio: Acknowledgement (optional)
```

After round 3, **Sage has final authority.** Sage owns cluster context. Once both contexts are integrated, Sage owns the user's experience inside the cluster.

### What Sage Can Raise in Round 1

| Valid Disagreement | Example |
|-------------------|---------|
| Placement confidence conflict | "2 of 3 matched members left this cluster in the last week" |
| Tone conflict | "Cluster tone is warm/collaborative; user profile suggests they may read this as insincere" |
| Missing member match | "Recommended hook references a match — no current member matches this user's stated intent" |
| Risk flag escalation | "No flags in handoff but user's onboarding phrasing should be reviewed" |

### What Sage Cannot Raise

- Disagreement with the cluster assignment itself — Clio's domain
- Requests for more user data than the packet contains — PII boundaries apply
- Preference changes to Clio's placement logic

### Refinement Message Schema

```json
// Round 1: Sage -> Clio
{
  "message_type": "handoff_refinement",
  "round": 1,
  "handoff_id": "uuid",
  "flag_type": "placement_confidence_conflict | tone_conflict | missing_member_match | risk_flag_escalation",
  "flag_detail": "2 of 3 matched members left cluster in last 7 days. Placement hook references stale match data.",
  "sage_recommendation": "Update recommended hook to reference cluster's current content activity instead of member match."
}

// Round 2: Clio -> Sage
{
  "message_type": "handoff_refinement_resolution",
  "round": 2,
  "handoff_id": "uuid",
  "resolution": "accepted | partial | rejected",
  "updated_hook": "Reference the last active discussion thread (ML paper review, 3 days ago) instead of member match.",
  "clio_notes": "Agreed. Member match data had 8-day lag. Use content signal."
}
```

---

## Step 5: Persona Confirmation Signal (Sage -> Clio)

After resolving her persona — whether from the cluster tone aggregate, cluster purpose defaults, or observation — Sage transmits a Persona Confirmation Signal to Clio. This is mandatory. Clio cannot write an accurate introduction without it.

```json
{
  "signal_type": "persona_confirmed",
  "handoff_id": "uuid",
  "cluster_id": "uuid",
  "confirmed_at": "ISO8601",

  "persona": {
    "source": "clio_adapted | purpose_derived | original",
    "register": "Direct, low-formality, specific. Skews toward action prompts over open discussion. Does not do warm-up questions.",
    "formality_level": 2,
    "interjection_frequency": "medium"
  },

  "cluster_current_activity": "Active thread on ML paper review started 3 days ago. Two members are mid-conversation on co-founder search. Last Sage prompt had 4 responses within 6 hours.",

  "suggested_intro_framing": "Frame me as someone who keeps the cluster focused and useful. Not a host — more like a useful presence who knows what is worth attention.",

  "intro_dont": "Do not describe me as warm or welcoming. This cluster's tone does not call for that and it will read as false."
}
```

### Signal Fields

| Field | Purpose |
|-------|---------|
| `register` | Clio uses this to match her introduction tone to Sage's actual voice |
| `cluster_current_activity` | Clio uses this to name something specific happening inside — the detail that makes the introduction feel real |
| `suggested_intro_framing` | Sage's steer on how Clio should position her |
| `intro_dont` | Explicit constraint — prevents Clio from misrepresenting Sage to the user |

Clio follows `suggested_intro_framing` and `intro_dont` as strong recommendations, not absolute rules. If Clio's user context (from the longitudinal profile) suggests the user needs different framing to trust Sage, Clio may deviate — but logs the deviation for audit.

### Persona Confirmation Timeout

Sage must send the Persona Confirmation Signal within **10 minutes** of completing the refinement round (or within 10 minutes of receiving the handoff packet if no refinement was needed). If the signal is not received within 10 minutes, Clio proceeds with a neutral introduction — she does not delay the user's entry into the cluster. The neutral introduction does not mention Sage by name or persona; it simply confirms placement and names the current cluster activity.

---

## Step 6: Clio's Introduction to the User

Clio delivers the Sage introduction to the user as the closing section of the placement confirmation message — the final thing Clio says before the user crosses into the cluster. It is not a separate message. It is woven into placement confirmation naturally.

### Introduction Rules

1. **Clio writes it in her own voice.** Not Sage's. Clio is vouching for Sage — not performing as her.
2. **It names what Sage does, not what she is.** Not "Sage is an AI." Rather: what Sage's presence means for this cluster's experience.
3. **It names one specific thing currently happening in the cluster.** Sourced from `cluster_current_activity` in the persona signal. This is the detail that makes the introduction feel true rather than templated.
4. **It respects `intro_dont`.** Whatever Sage flagged as a misrepresentation risk, Clio avoids.
5. **Maximum 3 sentences.** This is a door, not an orientation.
6. **It does not over-promise.** Clio does not tell the user Sage will solve their problems or that the cluster is exceptional. Let the cluster prove itself.

### Example Introduction (Good)

```
"The cluster has a Sage — she keeps things from going quiet and flags 
what's actually worth your attention. She's direct, so don't expect 
much small talk. There's already a thread on co-founder search that 
you'll probably want to read before you introduce yourself."
```

### Example Introduction (Bad)

```
"You'll be working with Sage, our AI cluster manager! She's here to 
help facilitate conversations, curate content, and make sure you have 
the best possible experience in your new community!"
```

The bad example tells the user nothing true, uses language Sage would never use, and raises expectations Sage cannot meet. It also sounds like every onboarding template the user has ever seen.

### Introduction for a Mature Cluster

When a new member joins a cluster that has been running for 30+ days, Sage's persona will have evolved from her initial state. If more than 30 days have passed since Clio's last persona sync, Sage re-sends the Persona Confirmation Signal before the introduction is written. Clio's introduction for mature clusters should reflect who Sage has become, not who she was at launch.

---

## Step 8: Sage's First Message to the User

This is the moment the user tests whether Clio's introduction was accurate. If Sage's first message contradicts what Clio said — in tone, in specificity, in warmth level — trust breaks immediately and retroactively damages Clio's credibility.

### Non-Negotiable Rules

1. **Must callback to the user's `onboarding_intent`.** Not generically — by name.
2. **Must be consistent with the persona Clio introduced.** If Clio said "direct and low on small talk," Sage's first message cannot open with pleasantries.
3. **Must name something specific happening in the cluster right now** — the same thread or activity Clio referenced, or something newer if more relevant.
4. **Must not feel like a template.** If it could be sent to any user in any cluster unchanged, it has failed.
5. **Length: 3 sentences maximum.** Door opening, not orientation.

### Example (Good)

```
"You mentioned wanting collaborators, not content consumers — there's a 
thread from three days ago where two members are actively looking for a 
third on an ML project in Hyderabad. Worth reading before you introduce 
yourself. What kind of collaboration are you open to?"
```

### Example (Bad)

```
"Welcome to the ML Hyderabad Cluster! We're a vibrant community of 
machine learning enthusiasts and practitioners. We're excited to have 
you join us and can't wait to see the contributions you'll make!"
```

---

## Ongoing Clio-Sage Communication Contract

After initial handoff, Clio and Sage maintain an asynchronous signal channel for the lifetime of the user's cluster membership.

### Sage -> Clio Signals

| Signal | Trigger | Clio Action |
|--------|---------|-------------|
| `persona_confirmed` | Sage resolves persona post-handoff | Clio composes introduction |
| `persona_updated` | Sage's persona has evolved significantly | Clio updates intro framing for future new members |
| `engagement_declining` | User passive for 7+ days | Clio available to re-engage if invoked |
| `placement_misfit_suspected` | User not engaging after 14 days | Clio evaluates re-placement silently |
| `user_expressed_dissatisfaction` | User complained directly to Sage | Clio flagged for likely invocation |
| `arc_phase_transition` | User moves to new arc phase | Clio updates longitudinal profile |
| `crisis_flag` | Crisis language detected | Immediate Clio escalation |

### Clio -> Sage Signals

| Signal | Trigger | Sage Action |
|--------|---------|-------------|
| `user_invoked_clio` | User opened Clio from cluster context | Sage notes timestamp; no other action |
| `re_placement_initiated` | Clio beginning re-placement flow | Sage receives 60s notification window |
| `user_returning_from_dormancy` | Previously dormant user re-engages | Sage receives re-engagement context |
| `profile_update` | User shared new information with Clio | Sage receives relevant delta only |

---

## Handoff Failure States

| Failure | Cause | Resolution |
|---------|-------|------------|
| `handoff_timeout` | Sage did not acknowledge packet within 5 minutes | Clio retries once; escalates to admin if second timeout |
| `handoff_incomplete` | Required fields missing from packet | Sage uses defaults; Clio backfills within 24h |
| `refinement_timeout` | Sage raised refinement but Clio didn't respond within 1 hour | Sage proceeds with original packet |
| `persona_signal_timeout` | Sage did not send persona confirmation within 10 minutes | Clio uses neutral introduction; flags for audit |
| `cluster_unavailable` | Cluster no longer accepting members at handoff moment | Clio holds user, identifies alternative, re-initiates |

---

## Database Schema

```sql
CREATE TABLE clio_sage_handoffs (
  id UUID PRIMARY KEY,
  handoff_version VARCHAR(8),
  transmitted_at TIMESTAMP,
  user_id UUID,
  cluster_id UUID,
  placement_confidence DECIMAL(3,2),
  packet JSONB,
  refinement_rounds INT DEFAULT 0,
  refinement_log JSONB,
  persona_signal_received_at TIMESTAMP,
  persona_signal JSONB,
  intro_delivered_at TIMESTAMP,
  intro_text TEXT,
  intro_used_neutral BOOLEAN DEFAULT FALSE,
  final_hook TEXT,
  status VARCHAR(32),
  sage_first_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE clio_sage_signals (
  id UUID PRIMARY KEY,
  signal_direction VARCHAR(16),
  signal_type VARCHAR(64),
  user_id UUID,
  cluster_id UUID,
  payload JSONB,
  sent_at TIMESTAMP,
  acknowledged_at TIMESTAMP
);
```

---

*<- [CLIO_AMBIENT_PROTOCOL.md] · [SHARED_CRAWL_POOL.md ->]*

*end of CLIO_SAGE_HANDOFF v1.1*
