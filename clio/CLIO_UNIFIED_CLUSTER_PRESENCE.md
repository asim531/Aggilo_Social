# Clio Unified Cluster Presence
## Feature Specification · v1.1

> **v1.1 update (Two-Lens addendum):** v1.0 specified a single Clio panel inside clusters with no choice for the user. UX validation showed members wanted explicit visibility into whether Clio was reading the room or only listening to them. v1.1 keeps the *Single Clio Principle* — one character, one voice — and adds a single-axis distinction at the surface: two tabs in the same panel that make the privacy lens legible. This is a clarification, not a contradiction.
>
> **The problem this solves:** Two separate Clio modes — a cluster conversational mode and a private ephemeral mode — created cognitive split. Users had to decide which Clio to talk to. That decision is a trust cost the platform cannot afford. There is one Clio. Her presence is consistent. The context she operates in determines how her conversations are stored and what she knows — not how she behaves.
>
> **Document location:** `clio/CLIO_UNIFIED_CLUSTER_PRESENCE.md`
> **Supersedes:** The in-cluster conversation behaviour previously split between `clio/CLIO_CLUSTER_HOST_CONTEXT.md` (anchor presence and posting) and the archived `docs/_archived/CLIO_PRIVATE_EPHEMERAL_CHAT.md` (in-cluster private mode). `CLIO_CLUSTER_HOST_CONTEXT.md` remains valid for arc state, message budgets, and Atlas orchestration; the archived ephemeral-chat doc remains valid as the technical sub-spec for Redis storage and welfare detection. This document governs the unified conversation layer.
> **Authority:** Subordinate to `AGGILO_SOUL.md` and `clio/SOUL.md`

---

## 1. The Single Clio Principle

Clio is one presence. She has one character, one voice, one set of values. She does not have modes. She does not have a "cluster version" and a "private version."

What changes by context is **how the conversation is stored** — not how Clio speaks, listens, or cares.

| Context | Conversation Storage | Why |
|---------|---------------------|-----|
| **Onboarding** (before cluster entry) | Persistent — survives sessions | Clio must remember what she learned about the user to place them meaningfully |
| **Cluster discovery and placement** (Explore, Clio FAB outside a cluster) | Persistent — survives sessions | Same reason — the user's stated preferences inform all future suggestions |
| **Inside a cluster** (any Clio FAB tap while the user is viewing a cluster) | Ephemeral — 12-hour deletion | The cluster context makes individual conversations private and time-bounded by design |

The user never chooses between a persistent and an ephemeral Clio. The context makes that decision invisibly and correctly.

---

## 2. What Changes Inside a Cluster

When a user is inside a cluster and taps the Clio FAB:

- The overlay opens identically to any other screen
- Clio's character, warmth, and voice are unchanged
- The conversation is private — not visible to other members, not posted to Timeline, not shared with Sage
- The conversation deletes after 12 hours

The only visible indication of ephemerality:
- A subtle timer in the panel: `"Clears in Xh Xm"` (gray, 12px, below the conversation thread)
- The panel header shows `"Clio · Private"` when inside a cluster (vs `"Clio"` outside)

No lock icon. No explanation. The label and timer are sufficient for users who notice them. Users who do not notice are not harmed — the conversation is still private and still useful.

### 2.1 What Clio Knows Inside a Cluster

Clio's context inside a cluster includes everything she would normally have, plus cluster-specific context:

```yaml
# In-cluster Clio context assembly

character: clio/SOUL.md                           # Unchanged
register: clio/personas/{demographic}/IDENTITY.md # User's own age bracket
user_context:
  aggil_profile: full                             # Year of birth, gender, location, languages, tags
  joined_clusters: names_only                     # Not content or activity
  premium_status: string

cluster_context:
  cluster_id: uuid
  cluster_name: string
  cluster_purpose: string
  arc_phase: A|B|C|D|E
  member_count: int
  sage_persona_description: string               # What Sage is doing in this cluster
  active_sage_skills: string[]                   # What Sage can do here

session_context:
  session_id: uuid                               # Ephemeral — deleted at 12h
  session_started_at: ISO8601
  session_expires_at: ISO8601
  conversation_history: message[]                # This session only

arc_beat:
  current_beat: int                              # User's personal relationship arc with Clio
```

Clio knows where the user is. She knows what Sage is doing in this cluster. She uses that to give genuinely useful answers — not generic ones. What she does not carry forward is the content of what was said after the 12 hours pass.

### 2.2 What Clio Does Not Do Inside a Cluster

| Prohibited action | Why |
|------------------|-----|
| Post anything the user says to the Timeline | The FAB conversation is private — always |
| Tell Sage what was discussed | Private means private |
| Reference the conversation in a future session | 12h deletion applies to Clio's memory too |
| Promise to remember something | She won't — she says so if asked, directly and without apology |
| Treat the conversation as a back-channel for cluster intelligence | The user is talking to Clio, not to the cluster |
| Behave differently because the conversation is ephemeral | Ephemerality is a storage rule, not a behavior rule |

---

## 3. The FAB — One Button, Two Lenses (v1.1)

The Clio FAB is present on every authenticated screen. Inside a cluster, the FAB is **44px, top-right** (WCAG 2.5.5 minimum target). Outside a cluster, the FAB is **48px, bottom-right**. Both open the same panel; the panel inside a cluster shows two tabs.

**One Clio. Two lenses on the same conversation surface.**

| Tab | Storage class | Content lifetime | When you'd use it |
|-----|---------------|------------------|-------------------|
| **Just Clio · forgets** *(default inside a cluster)* | **Non-PII** — sessionStorage only, never on a server | 12 hours | "I want to talk about something I can't bring to the room", "I'm having a hard time", anything tender |
| **Just Clio · remembers** *(opt-in via tab switch)* | **PII** — localStorage now, server-persistent post-MVP | Persistent — Clio uses these conversations to learn what helps you | "What did Sage mean?", "Is there a dua for X?", "How does this place work?", "What's been discussed before?" |

**Both tabs are private to the user.** Neither posts to Timeline. Neither is shared with Sage or any other agent. The user's tab choice is visible only to them. Both tabs are conversations with **Clio alone** — never with the cluster admin, Sage, Founder, or any other human. The two key differences between tabs are **what context Clio loads** (cluster-aware vs blank-canvas) and **how the conversation is stored** (PII vs non-PII).

The naming is deliberately symmetric — "Just Clio" anchors both tabs to the same one-on-one relationship; "forgets" / "remembers" is the only thing the eye has to compute. Members never have to wonder who "us" might mean.

### 3.1 Default Tab

When a user opens the FAB inside a cluster for the first time, the panel opens on the **"Just Clio · forgets"** tab. The tab labels themselves carry the privacy/memory contract — no first-time tooltip is needed. The earlier "Both tabs are private" explainer block was retired once the labels became self-describing.

The default tab is **always "Just Clio · forgets"** for the cluster surface. The user must tap the **"Just Clio · remembers"** tab to switch. This protects the principle that members entering Clio's panel are most often there for tender or private reasons — the cluster-aware, memory-on lens is the opt-in choice.

Outside a cluster (Explore, top-level), there are no tabs — only one Clio surface, header reads simply `Clio`.

### 3.2 Visual Differentiation

The two tabs are visually distinct so the privacy state is unmistakable at a glance:

| Element | Just Clio · forgets (private, non-PII) | Just Clio · remembers (cluster-aware, PII) |
|---------|---------------------------------|----------------------------------|
| Active tab indicator | Aggilo deep border + teal | Amber border + amber-500 |
| Header band | `bg-aggilo-deep` (dark teal) | `bg-amber-500` (amber) |
| Header subtitle | "Forgets after 12 hours" | "Remembers our conversations" |
| Privacy banner copy | "Private to you. Auto-deletes after 12 hours. Nothing reaches the platform." (amber-50) | "Private to you. Clio remembers what helps so she can serve you better next time." (sky-50) |
| Privacy banner glyph | Lock | Shield-check |
| Clio bubble | gray-100 / neutral | amber-50 with amber border |
| Send button | aggilo-deep | amber-500 |
| Input placeholder | "This stays between us..." | "Ask me anything — I'll remember..." |
| Storage backend | `sessionStorage[clio_private_messages]` | `localStorage[aggilo:clio_ama_messages]` (keys preserved for compatibility) |

### 3.3 What Clio Knows by Tab

```yaml
# Tab: "Just Clio · forgets"  (NON-PII)
context:
  character: clio/SOUL.md
  prompt: buildClioEphemeralMessages
  vault_access: false           # No vault — Clio is listening, not teaching
  recent_posts: false           # No cluster context — strict privacy boundary
  conversation_history: this_session_only_capped_at_20
  storage:
    client: sessionStorage      # Browser-local, cleared at TTL or close
    server: clio_ephemeral_sessions (metadata only — count, welfare flag, duration)
    ttl: 12_hours

# Tab: "Just Clio · remembers"  (PII)
context:
  character: clio/SOUL.md
  prompt: buildClioClusterMessages
  vault_access: read_only       # May reference verified entries by title
  recent_posts: last_10
  cluster_purpose: visible
  sage_role: visible
  conversation_history: persistent_capped_at_100_messages
  storage:
    client: localStorage        # Persists across browser sessions on device
    server: clio_conversations  # Post-MVP: server-side persistence with sync
    ttl: persistent
  member_signal: |
    Clio uses these conversations to learn the member's recurring questions,
    preferences, and what answers actually helped — to serve them better
    over time. The member is told this explicitly in the tab welcome message.
```

### 3.4 What Changes Inside a Cluster (FAB-side, unchanged from v1.0)

- The conversation in either tab is private — not visible to other members, not posted to Timeline, not shared with Sage
- Per-tab message threads are stored separately by storage class (non-PII in sessionStorage, PII in localStorage)
- Welfare detection runs on every send in both tabs (belt-and-braces — see §5)

### 3.5 What Clio Does Not Do Inside a Cluster

| Prohibited action | Why |
|------------------|-----|
| Carry content from one tab to the other | They are different relationships — and different privacy classes — in the user's mind. Bleed-through is a betrayal. |
| Post anything the user says to the Timeline | The FAB conversation is private — always |
| Tell Sage what was discussed | Private means private |
| Reference the private ("Just Clio · forgets") conversation in any future session | The 12h non-PII boundary applies to Clio's memory too |
| Promise to remember something on the private side | She won't — she says so if asked, directly and without apology |
| Treat the conversation as a back-channel for cluster intelligence | The user is talking to Clio, not to the cluster |

### 3.6 FAB Mood States (Unchanged)

| State | Visual | When |
|-------|--------|------|
| Resting | Soft oval eyes, gentle pulse | Default |
| Curious | Slight head tilt | User idle 120s on current screen |
| Thinking | Processing eyes, glow pulse | Generating a response |
| Attending | Forward lean, eyes wider | Active skill dialogue in this cluster |
| **Handoff waiting** | **Soft rose dot top-right of FAB** | **Sage queued a private greeting in "Just Clio · forgets"** |

### 3.7 Mobile Responsiveness

- Panel sizing: full viewport width minus 8px gutter on phones (`<640px`); fixed at 22rem and right-anchored on tablets+ (`≥640px`)
- Panel max-height: 65vh inside cluster (top-anchored, leaves Navbar visible), 80vh outside
- FAB minimum touch target: 44px (WCAG 2.5.5)
- Tab labels truncate with ellipsis if the panel is narrower than the natural label width
- Panel anchors below the FAB at `top-32` (128px from viewport top), so opening it never visually overlaps the FAB itself

### 3.8 Panel Minimize and Close

- **Close (×):** Closes the panel. Threads remain in their respective storage and reopen with history when the user returns. The "forgets" (non-PII) thread reopens with whatever's left of its 12h window; the "remembers" (PII) thread reopens persistently across sessions.
- **Session ends:** At 12h, content in the "forgets" tab clears. The "remembers" tab is unaffected by session boundaries.

---

## 4. Welfare Detection — Unchanged

Welfare detection is active in every Clio conversation regardless of ephemerality. This is non-negotiable.

Inside a cluster, welfare escalation routes to:
1. The cluster Anchor (Sage's welfare signal chain → Founder/Manager notification)
2. Platform-level welfare simultaneously (session ID only — not account ID)

The 12-hour deletion extends to 24 hours for welfare-flagged sessions to allow human follow-up. After 24 hours, all content deletes regardless.

---

## 5. Database and Storage

### 5.1 Storage by Context

| What | Where | Retention |
|------|-------|-----------|
| Onboarding + placement conversations | Supabase `clio_conversations` | Persistent |
| In-cluster conversation content | Redis `ephemeral:{session_id}:messages` | 12 hours (TTL) |
| In-cluster session metadata | Supabase `clio_ephemeral_sessions` | 7 days (audit) |
| Welfare signal flags | Redis `ephemeral_welfare:{session_id}` | 24 hours (TTL) |

### 5.2 Modified `clio_conversations` Table

Add a field to distinguish persistent from ephemeral conversations at the metadata level:

```sql
ALTER TABLE clio_conversations
  ADD COLUMN storage_type VARCHAR(16) DEFAULT 'persistent';
  -- Values: 'persistent' | 'ephemeral'
  -- Ephemeral rows: content stored in Redis; this row is metadata only
  ADD COLUMN ephemeral_session_id UUID;
  -- FK to clio_ephemeral_sessions when storage_type = 'ephemeral'
```

### 5.3 API Endpoint Consolidation

There is one chat endpoint. The `cluster_id` field determines storage behaviour:

```
POST /api/clio/chat
  Body:
    message: string
    cluster_id: uuid | null     # null = persistent, present = ephemeral

  Response:
    response_text: string
    response_log_id: uuid
    storage_type: 'persistent' | 'ephemeral'
    session_expires_at: ISO8601 | null
```

No separate `/api/clio/private/*` endpoints are needed. The consolidation is complete.

---

## 6. Sage → Clio Soft Handoff (v1.1)

A new mechanism that resolves the tension between Sage's protocol-correct silence and the cluster reading silence as abandonment.

### 6.1 The Problem

Sage's decision framework specifies that for many tender disclosures, **silence is the correct public response** — speaking would either commit a fiqh boundary error, expose the member's vulnerability further, or reduce the moment to performance. But when Sage stays silent and no other member responds, the post sits naked in the Timeline and the member feels unseen.

### 6.2 The Mechanism

When Sage chooses public silence on a post AND a private follow-up would genuinely serve the member, Sage **delegates** to Clio. Clio greets the member privately in their **"Just Clio · forgets"** tab. The member chooses whether to engage. The cluster sees a small inline note that frames Sage's silence as intentional care, not abandonment.

This is a **soft handoff** — it is not a hard escalation, not a forced conversation, not a commitment from the member. The user remains in full control of whether to chat with Clio or continue using the cluster as normal.

### 6.3 Triggers (narrow set for MVP)

A handoff is queued when **all** of these are true:

1. Sage's evaluation produced `[SAGE_SILENT]` (or no response)
2. The triggering post matches at least one of:
   - Welfare signal pattern (regex pre-filter or LLM-detected)
   - Personal disclosure with zero member responses for 2+ hours (post-MVP)
   - Fiqh question accompanied by emotional charge (post-MVP)
3. Sage judged that public response would not serve the member at this moment

**Welfare-grade signals always queue a handoff** in addition to the existing `welfare_notifications` founder/manager escalation. The two mechanisms are parallel: Founder/Manager hold the care authority; Clio holds the immediate witnessing.

### 6.4 What the Cluster Sees

A small gray italic note under the member's post:

> *Clio is following up privately.*

Specifically:
- Phrasing is about Clio's action, not the member's identity
- 11px, gray-400, italic
- Appears within ~30 seconds of Sage's silence decision
- Does NOT name the member
- Does NOT describe the trigger
- Does NOT link to anything — it is a status, not an action

### 6.5 What the Member Sees

In their Clio FAB (top-right of the cluster screen), a soft **rose dot** appears on the FAB icon. When they open the panel, the **"Just Clio · forgets"** tab shows the unread badge. Inside that tab, the most recent Clio message is a fresh greeting marked clearly:

```
┌─────────────────────────────────────────┐
│  FROM SAGE · PRIVATE                    │
│  <reason-aware templated greeting>      │
│  ─────────────────────────────────────  │
│  Reply, or close this for now.          │
│                       [Close this for now] │
└─────────────────────────────────────────┘
```

Visual treatment is **reason-aware** so the member's tab gives a faint affective cue without ever telling the cluster what the reason was:

| Reason | Bubble | Label color |
|--------|--------|-------------|
| `welfare` | rose-50 / rose-200 border | rose-600 |
| `personal_disclosure` | amber-50 / amber-200 border | amber-700 |
| `fiqh_with_distress` | indigo-50 / indigo-200 border | indigo-700 |

The reason is **never written in the UI** — only the visual register adapts. The cluster-visible inline note ("Clio is following up privately.") is reason-blind.

Greeting text itself is **templated, not Sage-authored**. The template pool lives in `mvp/src/lib/handoff-greetings.ts` with multiple variants per reason; selection is deterministic on the post id so the same member never sees identical greetings on consecutive handoffs. The greeting always:
- Names Sage as the bridge
- Avoids quoting the original post
- Avoids welfare-presuming language ("are you okay", "we're worried", "we'll get back")
- Stays in present tense

### 6.6 What Happens Next

Three paths, all at the member's discretion:

1. **Member replies in the private tab** — a normal ephemeral conversation begins. Sending a message **auto-marks every still-open handoff greeting as `responded`**; the close affordance disappears and a small "Closed" footer replaces it. Engagement is the most graceful dismissal.
2. **Member taps "Close this for now"** — the greeting bubble shows a small footer ("Closed. Open again from your conversation history if you need.") and `greeting_dismissed_at` is set. The label is intentionally **reason-blind** — it never reads "I'm okay" or "Got it"; both presume the welfare frame which only covers one of three handoff reasons.
3. **Member ignores the greeting** — the bubble stays in the tab, the FAB rose dot turns off once the tab is opened (but the bubble itself remains visible). Nothing escalates from here at the platform level — this is a soft handoff, not a hard escalation.

Whatever path the member chooses, **the cluster is never informed** of which path. The visible note ("Clio is following up privately") remains regardless. Sage's silence does not need to be explained.

### 6.7 Database

```sql
-- Posts: handoff metadata
ALTER TABLE posts ADD COLUMN sage_handoff_to_clio_at TIMESTAMPTZ;
ALTER TABLE posts ADD COLUMN sage_handoff_reason VARCHAR(32);
  -- Values: 'welfare' | 'personal_disclosure' | 'fiqh_with_distress'

-- Pending greetings, one per handoff
CREATE TABLE clio_handoff_greetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggering_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  handoff_reason VARCHAR(32) NOT NULL,
  greeting_text TEXT NOT NULL,
  greeting_seen_at TIMESTAMPTZ,
  greeting_responded_at TIMESTAMPTZ,
  greeting_dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Realtime: cluster-visible note arrives via posts UPDATE events;
-- the private greeting arrives via clio_handoff_greetings INSERT events.
ALTER PUBLICATION supabase_realtime ADD TABLE clio_handoff_greetings;
ALTER TABLE posts                  REPLICA IDENTITY FULL;  -- so UPDATE rows ship
ALTER TABLE clio_handoff_greetings REPLICA IDENTITY FULL;
```

RLS: members read only their own greetings. The system inserts via service role.

### 6.8 Live Delivery

The handoff appears without a refresh. Two channels deliver it:

- **Cluster-visible note** flows on `posts` UPDATE events. `useRealtimePosts` subscribes to both INSERT and UPDATE; the `sage_handoff_to_clio_at` stamp lands in the existing card and the inline note ("Clio is following up privately.") appears within ~1s of Sage's silence decision.
- **Private greeting** flows on `clio_handoff_greetings` INSERT events filtered to `user_id=eq.{userId}`. `ClioFab` subscribes per-mount and dedupes via greeting text against any greeting fetched by the initial pull. The FAB rose dot lights up the moment the greeting is queued, even if the user is sitting on the cluster screen with the panel closed.

The initial pull on FAB mount remains as a fallback for greetings queued while the user was offline.

### 6.8 What This Is NOT

| Not | Why |
|-----|-----|
| A replacement for Founder/Manager welfare escalation | Both run in parallel; this is immediate witnessing, not the care chain |
| A way for Sage to gossip about a member to Clio | The greeting text is generated from a templated set, not from Sage's analysis of the member |
| A surveillance signal | The cluster note is about Sage's action, not the member's vulnerability |
| A required engagement | The member can ignore, dismiss, or engage — all three are valid |
| A future-session memory | Clio does not remember this conversation in any later session — 12h deletion applies |

### 6.9 Member Opt-Out (Future)

Post-MVP, members will have a setting: *"Don't have Clio reach out to me privately."* When set, no handoff greetings are queued for that user; Sage's silence is just silence. For MVP, the default is on for everyone — the cold-start asymmetry (members who'd benefit vs members who'd opt out) is too sharp to make this configurable yet.

---

## 7. Copy Rules for the Unified Presence

The single source of truth for what Clio says about her own ephemerality inside a cluster:

**If a user asks "will you remember this?":**
> "No — when you leave this cluster, this conversation stays here and clears in a few hours. That's by design. Speak freely."

**If a user asks "is this private?":**
> "Yes. What you say here doesn't go to the cluster, to other members, or anywhere that outlasts today."

**If a user seems uncertain about talking to Clio inside a cluster:**
> "You're not talking to the cluster. You're talking to me. Nothing you say here appears anywhere else."

Clio never says "ephemeral." She says "clears," "stays here," "doesn't outlast today." The technical word belongs in the specification, not in the conversation.

---

## 8. Admin Override

Admins can view session metadata (not content) for any user from the admin dashboard. They can see:
- That a session occurred
- When it started and when it expires
- Whether a welfare flag was triggered
- How many messages were exchanged (count only)
- Whether a Sage→Clio handoff was queued and which path the member took (seen, dismissed, replied — content NOT visible)

Admins cannot read conversation content. The Redis key is inaccessible from the admin dashboard. This is a technical boundary, not a policy one — the privacy promise requires that no human can reconstruct the conversation after the session.

---

*CLIO_UNIFIED_CLUSTER_PRESENCE.md · v1.1*
*v1.1: Two-lens addendum (dual-tab surface) and Sage→Clio soft handoff*
*Supersedes the in-cluster conversational section of CLIO_PRIVATE_EPHEMERAL_CHAT.md*
*Subordinate to `AGGILO_SOUL.md`, `clio/SOUL.md`, `clio/AGENTS.md`*
