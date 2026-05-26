# AMA Cluster Creation Workflow + Founding Member Feedback

> **Status:** Main-product spec. Founding-member feedback applies to
> every cluster on the platform — Sisters in Dua, Long Conversation,
> and every cluster that follows. AMA cluster creation is the
> conversational on-ramp for any member who wants to start their
> own room.
>
> **Authority:** Subordinate to `clio/SOUL.md`,
> `clio/CLIO_CLUSTER_HOST_CONTEXT.md`, and the platform soul. Every
> behaviour specified here inherits the super-prompt's safety floor
> and voice baseline. Pattern 7 in
> `architecture/AGENT_COMMUNICATION_CONTRACT.md` is the upstream
> spec — this document is its closing surface for the founding member.
>
> **Implementation status:**
>   - **Long Conversation (`phase0/lc/`)** — Founding-member feedback
>     (Part 1) is shipped. AMA cluster creation (Part 2) is not yet
>     built.
>   - **Sisters in Dua (`phase0/mvp/`)** — Not yet shipped. Founding-
>     member feedback should be ported here next.
>   - **Production platform (Phase 1+)** — Both parts must be present
>     in the canonical cluster module per the inheritance contract in
>     `architecture/system_implementation_prompt_part6.md`. The
>     Phase 0 LC implementation is the reference.
>
> **Created:** 2026-05-25 in response to product review of the
> Long Conversation onboarding flow. Promoted from Phase 0 spec to
> main-product spec on 2026-05-26 because founding-member feedback
> is a property of every Source-A cluster, not just the pilot.

---

## Why this document exists

Two related Clio interactions emerged from the Long Conversation
build that don't fit cleanly inside any existing spec:

1. **Founding member feedback** — when a member arrives via a
   waitlist-form-derived cluster (Pattern 7, Source A), Clio should
   give them a moment to validate the cluster description before they
   enter the room. This closes the intake pipeline loop with the
   actual person whose request produced the cluster.

2. **AMA cluster creation tip + workflow** — any member of any cluster
   may want to start their own room. Clio should surface this
   capability proactively in the AMA, walk them through creation
   conversationally, and validate the result with them after the
   cluster is live.

Both interactions need a **flexible AMA chat window** — the standard
FAB panel is sized for short exchanges. Cluster creation is a multi-
turn creative process and needs more space.

---

## Part 1 — Founding Member Feedback

### When it fires

A member's first cluster session, when ALL of the following are true:

1. The member arrived via a Source A invite link (waitlist form →
   intake pipeline → cluster created → invite emailed). The intake
   signal id is in the invite link query string and gets resolved to
   a `cluster_intake_signals.id` server-side.
2. The member is the cluster's founding member (or otherwise the
   person whose request produced the cluster).
3. They have not yet been shown the founding feedback prompt
   (tracked in `profiles.founding_feedback_at` — null means not shown).

For Long Conversation specifically, this means Tas's first session
after she clicks her invite link. For Source B and Source C clusters
(Scout-detected demand or Clio-inferred patterns), there is no founding
member, so this interaction does not fire.

### What Clio shows

A single, gentle, non-blocking interaction in the FAB panel within the
member's first 30 seconds in the cluster. The pattern:

1. Clio surfaces the FAB with a soft pulse — not a notification badge,
   not a modal, not a forced takeover. Just her usual presence with
   one unread message.
2. When the member opens the FAB, they see a single message:

   > *"This room was built around what you described. Before you
   > settle in — does the way it's set up feel right? If something is
   > off, tell me. I can adjust the description, the seed questions,
   > or how Sage holds the space. Or just say it's good and I'll get
   > out of your way."*

3. The member responds in three possible ways:
   - **"It's right"** (or a positive equivalent) — Clio acknowledges
     in one sentence and steps back. The interaction is closed and
     `founding_feedback_at` is stamped.
   - **"It's mostly right but…"** — Clio engages, captures the
     specific feedback, and either applies an immediate refinement
     (cluster description copy, seed question wording) or queues a
     refinement for admin review (anything structural like AGGIL
     changes).
   - **No response within 24 hours** — Clio takes silence as
     "it's fine" and closes the interaction. `founding_feedback_at`
     is stamped with a `silent_close` flag.

### What Clio can adjust autonomously

| Field | Autonomous? | Reason |
|---|---|---|
| Cluster description (public-facing copy) | Yes (Tier 1) | Reversible, member-facing copy that should match founder intent |
| Seed questions | Yes (Tier 1) | Reversible, easily replaced |
| Sage's first-post acknowledgement text | Yes (Tier 1) | Reversible, low blast radius |
| Cluster name | No | Triggers the cluster name change protocol — admin-gated |
| AGGIL configuration (age, gender, geography, language) | No | Structural; affects who can see/join. Admin approval required (escalates as Pattern 4 finding) |
| Cluster type (generic ↔ premium) | No | Architectural decision — admin only |
| Sage persona register (formality, register name) | Yes (Tier 1) | Reversible, low blast radius |
| Tools active in the cluster | No | Tool proposal flow — Pattern 5 |

For changes Clio can apply autonomously, the standard Observer
stewardship pattern applies (30-minute admin veto window, full
versioning, rollback support). For changes she cannot apply, she
captures the feedback verbatim in `cluster_intake_drafts` as a v3
admin-edit candidate and tells the member: *"That's a structural
change — I'll pass it to admin and someone will reach out within 48
hours. The room is yours to use in the meantime."*

### What Clio never does in this interaction

- Asks a battery of questions. One open prompt, one response cycle.
- Pretends the feedback was logged when it wasn't. If the member
  describes something Clio cannot affect, she says so honestly.
- Treats silence as a problem. Silence is acceptance — stamp
  `silent_close` and move on.
- Returns to the topic later. This is a one-time interaction. If the
  member wants to revisit the cluster's setup later, they raise it
  in the AMA themselves.

### Database

```sql
alter table public.profiles
  add column if not exists founding_feedback_at timestamptz,
  add column if not exists founding_feedback_close_reason text;
-- 'accepted' | 'changes_applied' | 'changes_queued' | 'silent_close'

create table if not exists public.founding_feedback_log (
  id uuid primary key default gen_random_uuid(),
  cluster_id text not null,
  user_id uuid not null references auth.users(id),
  intake_signal_id uuid references public.cluster_intake_signals(id),
  feedback_text text,
  applied_changes jsonb,
  queued_for_admin jsonb,
  close_reason text not null,
  created_at timestamptz default now()
);
```

### Telemetry

```ts
track("founding_feedback_shown");
track("founding_feedback_responded", { close_reason: "accepted" | ... });
track("founding_feedback_changes_applied", { fields: [...] });
track("founding_feedback_changes_queued", { fields: [...] });
```

---

## Part 2 — AMA Cluster Creation Workflow

### What it is

Any member of any Aggilo cluster can ask Clio to help them create
their own room. The AMA is the surface for this — the FAB chat panel
expands into a flexible conversational workspace where Clio walks the
member through what they want to build.

### When the tip surfaces

Clio drops the tip proactively in three contexts:

1. **First-visit member, after onboarding completes** — once the
   member has been in the cluster for at least one session and has
   posted at least once, Clio surfaces the tip the next time they
   open the FAB. One time only. Tracked in
   `profiles.creation_tip_shown_at`.
2. **Member explicitly asks** — phrases like "can I make a room?",
   "how do I start something?", "I want to build a community" trigger
   the workflow regardless of tip-shown state.
3. **Repeat opt-in** — after the first tip, Clio does not nudge
   again. The capability is always available; the tip is a one-time
   surface.

### The tip itself

A single message in the FAB:

> *"If you ever want to start your own room, I can help you build it.
> What's the thing you'd want to gather people around?"*

Important: this is **the only framing**. No mention of generic vs
premium. No tier explanation. No price disclaimer. Clio asks an open
question and lets the member's answer route the conversation.

### The conversation flow

Clio leads a multi-turn dialogue. The shape is intentionally not a
form — it's a conversation that captures the same data a form would,
but feels like talking to someone who knows what they're doing.

**Turn 1 — What do you want to build?**

Member describes their idea. Clio asks one clarifying question if
needed. Most often this is enough to know whether it maps to generic
or premium.

**Turn 2 — Who is this for?**

Clio asks about the audience. The member's answer maps to AGGIL:
- "people in their 30s" → age range
- "women in tech" → gender + interest
- "Bangalore folks" → geography

If the member has an existing community (a WhatsApp group, an
Instagram following, a Discord server), Clio routes to the premium
path. Otherwise, generic.

**Turn 3 (premium path only) — The premium framing**

Only when premium has clearly surfaced. Clio explains what's
different without naming the tier:

> *"What you're describing — bringing your existing community here —
> works differently from starting fresh. There's a specific path for
> that. You'd hold admin authority in the room: you can remove people
> who don't fit, you can pin posts, you can set the language gate.
> And it's free right now — we're in beta. Once it hits 50 members
> and gets real traction, I'll check in about what comes next.
> That's a good problem to have. Want me to walk you through it?"*

If the member declines the premium path, Clio asks if they'd prefer
to start fresh (generic path) instead. No pressure either way.

**Turn 4 — The cluster's purpose in one sentence**

Clio asks: *"If you had to describe this room in one sentence, what
would you say?"* This becomes the cluster tagline. The member's
phrasing is preserved verbatim where possible.

**Turn 5 — Naming**

Clio offers 2–3 name candidates based on what the member has
described, with a brief rationale for each. The member picks one,
suggests their own, or asks Clio to try again. Naming is iterative —
Clio runs as many rounds as needed until the member is satisfied.

**Turn 6 — Description and seed questions**

Clio drafts the public description and 3–5 seed questions. She shows
them in the AMA window for the member to read. The member can request
changes; Clio applies them in real time.

**Turn 7 — Confirm and create**

Clio summarises the spec and asks: *"This is what I'll build. Sound
right?"* On confirmation, the cluster goes through Pattern 7's
intake pipeline (Intake Interpreter draft → Adversarial Reviewer →
admin approval → cluster creation). The member is told:

> *"I'll have admin take a look — usually within 48 hours. You'll get
> an email when the room is live."*

For Phase 0, admin review may be done manually by the platform admin.
In Phase 1, the intake pipeline runs autonomously and admin only
intervenes on flagged cases.

### Flexible AMA chat window

The standard FAB panel is approximately 360px × 480px. For cluster
creation, the panel expands to support the longer conversation:

- **Mobile:** full-screen takeover with a dismiss button. The panel
  becomes the dominant surface. The cluster Timeline is paused (still
  visible but blurred) until the conversation closes.
- **Desktop:** the panel expands to ~520px × 640px and anchors to the
  right edge of the viewport. The cluster Timeline remains visible
  alongside.
- **Trigger for expansion:** the moment Clio's intent classifier
  detects the conversation has entered cluster creation territory
  (member said "yes, help me build it" or equivalent). Before that,
  the panel stays at standard size.
- **Exit:** when the member confirms the spec at Turn 7, the panel
  collapses back to standard size with a final confirmation message.
  When the member closes mid-creation, Clio asks: *"Want me to save
  what we have so we can pick up later, or start fresh next time?"*
  Saved drafts persist for 7 days.

### What Clio never does in this workflow

- Names the generic/premium distinction unprompted.
- Mentions cluster type, AGGIL field names, or any platform mechanic
  the member doesn't need to know.
- Promises a timeline shorter than 48 hours for admin approval.
- Continues the workflow after the member explicitly says "let me
  think about it." She offers to save the draft and steps back.
- Surfaces the creation tip more than once. Capability is always
  available; the nudge is one-time.

### Premium pricing surface — full rules

The premium path's free-in-beta context is surfaced **only if** the
conversation has clearly entered premium territory. The exact framing:

> *"This is free right now — we're in beta. Once it hits 50 members
> and gets real traction, I'll check in about what comes next. That's
> a good problem to have."*

Rules for this surface:

| Rule | Detail |
|---|---|
| **Only when premium is in scope** | If the conversation routes to generic, this surface never appears. |
| **One-time mention** | Clio mentions it once per creation conversation. Not at the start (anxiety), not at the end (afterthought). At the moment the member is committing to the premium path. |
| **Frame it as a milestone, not a gate** | "50 members and real traction" reframes the threshold as a success signal. Never frame it as a billing trigger. |
| **No commitment about future pricing** | Clio does not say "it will cost X later" — she says "I'll check in about what comes next." Honest about uncertainty. |
| **Member can always ask for details** | If the member asks "what does check-in mean?" Clio answers honestly: "We're still figuring that out. The Aggilo team will reach out and you'll have the full picture before anything changes." |

### The post-creation feedback (mirrors Part 1)

For clusters created via the AMA workflow, the founding member
feedback (Part 1 of this document) fires automatically when the
member first enters their new cluster. Same interaction, same rules,
same database fields. The intake pipeline route is different (Source
D — "Clio AMA conversation") but the post-creation feedback
mechanism is unified.

A new signal source is added to the intake pipeline:

| Source | What arrives | How it enters |
|---|---|---|
| **D — Clio AMA conversation** | The full conversation transcript captured during the AMA cluster creation workflow. Already structured (purpose, audience, name, description, seed questions). The Intake Interpreter has less interpretive work to do because the member's intent was captured directly. | Clio worker writes a `clio_ama_conversations` row → triggers `ClusterIntakeJob` |

This source produces the same Draft v1 → Adversarial Reviewer → Draft
v2 → admin approval flow. The Adversarial Reviewer's role is reduced
because the source is already high-fidelity, but it still runs to
catch any drift between what the member said and what was recorded.

### Database

```sql
create table if not exists public.clio_ama_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  source_cluster_id text not null,
  -- The cluster the member was in when they started the creation flow
  conversation jsonb not null,
  -- Full turn-by-turn record: { turns: [{ role, content, intent, ... }] }
  status text not null default 'in_progress',
  -- 'in_progress' | 'submitted' | 'abandoned' | 'admin_review' | 'created'
  draft_spec jsonb,
  -- The structured cluster spec captured during the conversation.
  -- Becomes the seed for the Pattern 7 intake pipeline.
  intake_signal_id uuid references public.cluster_intake_signals(id),
  -- Populated when the conversation submits and the intake pipeline picks up
  expires_at timestamptz default (now() + interval '7 days'),
  -- Drafts persist 7 days for resume; abandoned ones are pruned
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_ama_conv_user_active
  on public.clio_ama_conversations(user_id, status)
  where status in ('in_progress', 'admin_review');
```

```sql
alter table public.profiles
  add column if not exists creation_tip_shown_at timestamptz;
```

### Telemetry

```ts
track("ama_creation_tip_shown");
track("ama_creation_started");
track("ama_creation_turn_completed", { turn_number: 1..7 });
track("ama_creation_premium_surfaced");
track("ama_creation_submitted");
track("ama_creation_abandoned", { last_turn: 1..7 });
track("ama_creation_resumed");
track("ama_creation_panel_expanded");
track("ama_creation_panel_collapsed");
```

---

## Implementation Phasing

Both interactions are out of scope for the immediate Long Conversation
shell build. They land in a later phase once the core cluster (Sage
worker, Timeline, post composer, FAB chat, private tip mechanic) is
live and stable.

### Phase 0 (Long Conversation goes live)

- Cluster shell, Sage worker, Clio FAB
- Private tip mechanic
- Founding member arrives via invite link
- **Founding feedback prompt** — shipped manually for Long Conversation:
  the platform admin reaches out to Tas after her first session and
  captures her feedback verbally. The full Clio-driven interaction is
  Phase 0a.

### Phase 0a (founding feedback automated)

- Clio's founding feedback interaction implemented per Part 1.
- Database fields added (`founding_feedback_at`,
  `founding_feedback_close_reason`, `founding_feedback_log`).
- Tier 1 stewardship integration so Clio can apply description /
  seed-question / Sage register changes autonomously.

### Phase 0b (AMA cluster creation MVP)

- Tip surfaces in the AMA per Part 2 (one-time, post-onboarding).
- Conversational creation flow (turns 1–7) implemented.
- Flexible AMA chat window (mobile takeover, desktop expand).
- Creation submits to admin queue — admin approves manually.
- Cluster goes live with founding feedback fired automatically per
  Part 1.

### Phase 1 (intake pipeline autonomous)

- Pattern 7 intake pipeline runs end-to-end without manual admin
  intervention except on flagged cases.
- Adversarial Reviewer ships.
- Source D (Clio AMA) integrated as a first-class intake source.

---

## Open questions for product review

1. **Saved-draft expiry (7 days)** — is this the right window? Too
   long and the platform accumulates stale drafts; too short and
   members lose work. 7 days matches the Observer outcome-tracking
   window, which is convenient for the data lifecycle.

2. **Premium pricing language** — "I'll check in about what comes
   next" is deliberately vague. Should we be more concrete once a
   pricing model is decided, or is the vagueness honest about the
   current uncertainty?

3. **Member who tries to create via AMA but the spec is rejected** —
   what does the post-rejection conversation look like? Clio explains
   why and offers to refine, or gracefully closes? This needs
   wording.

4. **Mobile takeover for AMA cluster creation** — does this conflict
   with the cluster Timeline being the primary surface? The
   conversation is creative work; the takeover is justified. But UX
   review should validate.

---

*AMA Cluster Creation + Founding Feedback · Design v1 · 2026-05-25*
*Subordinate to clio/SOUL.md and the platform soul.*
*To be implemented in Phase 0a / 0b / Phase 1 per the phasing above.*
