# Clio Private Ephemeral Chat
## Feature Specification · v1.0

> [!WARNING]
> **PARTIALLY DEPRECATED — Superseded by `clio/CLIO_UNIFIED_CLUSTER_PRESENCE.md`**
>
> Per `AGGILO_MASTER_PROMPT_V3.md` Phase 1.1, the **in-cluster conversation behaviour** described here ("cluster mode" vs "private ephemeral mode") is retired. There is one Clio. What changes by context is conversation storage, not Clio's behaviour. See `clio/CLIO_UNIFIED_CLUSTER_PRESENCE.md` for the unified spec.
>
> **What remains valid in this document:** the Redis storage architecture (§ ephemeral session storage), the welfare detection pipeline (§ 5.2), the admin observation surface, the API contract for ephemeral session lifecycle, and the privacy guarantees of the 12-hour TTL. These sections are still authoritative as the **technical sub-spec for ephemeral storage** that the unified presence model relies on.
>
> **What is retired:** any framing that treats "cluster mode" and "private mode" as two distinct Clio behaviours, all UI distinctions framed as "two modes," and the "two-Clio model" terminology used anywhere in this document.
>
> Retained in `_archived/` for technical reference. Do not link to this doc as a behavioural authority.

---

> **What this is:** A private, session-scoped conversational channel between a user and Clio, accessible via the persistent Clio FAB overlay on all screens. Conversations are not stored beyond 12 hours, are not reflected in any cluster, and are not visible to any other user or agent.
>
> **What this is not:** A replacement for Clio's cluster-facing behaviour. A persistent memory store. An anonymous system. A welfare-free zone.
>
> **Document location:** `clio/CLIO_PRIVATE_EPHEMERAL_CHAT.md`
> **Loaded by:** Clio's Yantra worker for all `/api/clio/chat` requests (non-cluster-scoped)
> **Authority:** Subordinate to `AGGILO_SOUL.md` and `clio/SOUL.md`. Coordinates with `CLUSTER_SKILL_DISCOVERY_PROTOCOL.md` for cross-domain signals.

---

## 1. Design Intent

### The Problem This Solves

Clio currently has two conversational contexts: onboarding (individual, building toward cluster placement) and cluster host (communal, visible to all). There is no space where a member can have an ongoing private conversation with Clio that is not connected to cluster activity and does not persist.

Members need this space for several real reasons:

- To process something before deciding whether to bring it to the cluster
- To ask Clio something they do not want other members or the cluster host to see
- To think aloud about a decision without that thinking becoming part of their cluster record
- To explore whether they belong in this cluster at all before committing
- To have a conversation that simply feels lower-stakes than anything cluster-visible

The ephemeral chat gives members this space. Its ephemerality is not a limitation — it is the feature. The conversation belongs to the moment it happened in. After 12 hours, it is gone. That is the promise.

### The Privacy Architecture

The feature's privacy claim has a precise technical meaning that must not be overstated in copy or design:

| What "private and ephemeral" means | What it does not mean |
|-----------------------------------|----------------------|
| Conversation content is deleted after 12 hours — cryptographically unlinked from the account | Clio does not know who she is talking to during the session |
| The conversation is never visible to other users, Sage, or cluster members | Clio cannot use her AGGIL context to personalise the conversation |
| The conversation is never posted to any cluster Timeline | Welfare signals detected in this chat are ignored |
| No persistent conversation history is retained after 12 hours | The conversation is fully anonymous |

**The correct framing:** Session-scoped context, not no context. Clio knows who you are during the session — she has your AGGIL profile, your clusters, your language, your arc beat. She uses that context to have a genuinely useful conversation. After 12 hours, the conversation content is deleted and the session-to-content link is cryptographically severed. The account record continues to exist. The conversation content does not.

This distinction matters because the alternative — Clio with no account context — produces generic, useless responses. The ephemerality applies to what was said, not to who you are.

---

## 2. The Persistent Clio FAB Overlay

### 2.1 Always Present

The Clio FAB (48px, peach face, teal ring border) is present and tappable on every authenticated screen:

- Explore tab
- Activity tab
- Cluster Timeline
- Cluster Members tab
- Profile / You tab
- Settings screens
- Skills tab

The FAB is never hidden on authenticated screens. It may shift position slightly (always bottom-right, but clearance from bottom nav adjusts based on screen content) but it does not disappear.

**The one exception:** The FAB is not visible during the onboarding flow (screens 1.1 through 2.6), invite landing pages, and the OTP verification screen. Clio is present on those screens through other UI treatments — the FAB is the authenticated-user access point.

### 2.2 FAB Mood States

The FAB communicates Clio's current operational state through mood:

| State | Visual | When |
|-------|--------|------|
| **Resting** | Soft oval eyes, gentle pulse | Default — Clio is available, nothing urgent |
| **Curious** | Slight head tilt, asymmetric eye | User has been on a screen for 120s without interaction; Clio is available if needed |
| **Thinking** | Processing eyes, glow pulse | Clio is generating a response (during active chat) |
| **Attending** | Forward lean, eyes slightly wider | During active skill dialogue — Clio is engaged at cluster level |

The FAB never animates aggressively. Mood states are subtle and peripheral — they are available to users who look, not pushed at users who don't.

### 2.3 Tap Behaviour

Tapping the FAB opens the Clio floating overlay panel. The panel type depends on context:

| Context when FAB tapped | Panel opened |
|------------------------|-------------|
| Active skill dialogue post in cluster | Panel opens in skill dialogue response mode (pre-loaded with Sage's post) |
| Cluster Timeline, Phase A/B, no active dialogue | Panel opens in cluster host conversational mode (questions about the cluster) |
| Explore screen | Panel opens in discovery mode (cluster search, suggestions) |
| Any screen, user initiates with personal topic | Panel recognises the shift and transitions to private ephemeral chat mode |
| User explicitly taps the private chat icon (see 2.4) | Panel opens directly in private ephemeral mode |

The transition between modes is Clio's responsibility, not the user's. If a user starts talking about something personal in a cluster context panel, Clio recognises the shift and responds privately — she does not post it to the cluster.

### 2.4 The Private Chat Access Point

Inside the Clio FAB panel header, alongside the close (X) button, there is a subtle icon: a small lock with a chat bubble (🔒💬 — 16px, gray). Tapping it opens the panel in private ephemeral mode explicitly.

This icon is not labelled. It does not have a tooltip on first visit. On second visit it shows a one-time tooltip: "Private — just you and Clio. Gone in 12 hours."

The icon is subtle by design. The private chat is available to everyone. It is not marketed or promoted within the UI. Users who need it find it.

---

## 3. The Private Ephemeral Chat Panel

### 3.1 Visual Distinction from Cluster Mode

The private chat panel has a distinct visual treatment that makes the privacy context immediately clear without a banner or announcement:

| Element | Cluster mode panel | Private ephemeral mode |
|---------|--------------------|----------------------|
| Header background | White | Very light gray (`#F9FAFB`) |
| Lock icon | Not visible | Visible (16px, top-left of header, teal) |
| Clio label | "Clio" teal bold | "Clio · Private" teal bold, gray · Private |
| Message bubble background | Teal (Clio), white (user) | Same, but slightly desaturated — communicates "contained" |
| Timer indicator | Not visible | Subtle: "Clears in [Xh Xm]" — 12px, gray, bottom of panel |
| Minimize button | Close (X) only | Close (X) + Minimize (—) |

The visual treatment communicates privacy without making a production of it. The user knows they are in a different mode. They do not receive a lecture about it.

### 3.2 Panel Behaviour

**Opening:** Panel expands from FAB position (standard — scale from 0, origin bottom-right). No transition animation change from normal mode.

**Minimize:** Tapping the minimize button (—) collapses the panel back to the FAB. The conversation is preserved in session memory. Tapping the FAB again expands the panel to the same conversation. Minimize is a suspend, not a close.

**Close:** Tapping the close button (X) closes the panel. A brief confirmation is shown inline (not a modal): "Close this conversation? It will still be here for the next [Xh Xm]." Two inline options: "Close" (gray) and "Keep open" (teal). Default is Keep open — closing requires a deliberate second tap.

After closing, the conversation is accessible again by tapping the FAB and then the private chat icon. The conversation persists in session memory until the 12-hour deletion window.

**Panel dimensions:** Same as standard Clio floating overlay panel (~320px wide, max 65% screen height). The panel floats — the screen behind it remains fully visible and live. No backdrop dimming.

**Input:** Standard text input pinned to bottom of panel. Send button teal. Phase 1: text only. No media, no audio, no attachments.

### 3.3 The 12-Hour Deletion Timer

The timer displays below the conversation thread, above the input:

```
"Clears in 11h 43m"  [gray, 12px]
```

The timer counts down in real time. At 12 hours:
- Conversation content is deleted from session storage
- The account-to-session link is severed
- The panel, if open, closes with a brief notification: "This conversation has ended. Start a new one anytime."
- The FAB returns to Resting state

The timer is honest. If it says 11h 43m, that is accurate. The deletion happens at exactly 12 hours.

**What "deleted" means technically:**

The conversation content is stored in a session record with a TTL of 12 hours. At expiry:
1. Content is deleted from the session store
2. The session ID — which was the only link between the conversation and the account — is deleted
3. Message hashes (used only for welfare signal detection — see Section 5) are deleted

After deletion, no reconstruction of the conversation is possible. The account record shows that a private chat session existed (timestamp only, no content) for platform analytics. This metadata cannot be used to recover content.

---

## 4. Clio's Context in Private Ephemeral Mode

### 4.1 What Clio Knows

In private ephemeral mode, Clio has access to session-scoped context only:

```yaml
# Private Ephemeral Chat — Context Assembly

character:
  source: clio/SOUL.md
  # Full character — Clio does not become a different agent in private mode

register:
  source: clio/personas/{demographic}/IDENTITY.md
  selection: derived from user's own age bracket
  # In private mode, register is user-specific (not cluster-dominant demographic)

user_context:
  aggil_profile:
    year_of_birth: int
    gender: string
    location: string
    languages: string[]
    interest_tags: string[]
  joined_clusters: string[]  # Names only — not content, not activity
  premium_status: string

session_context:
  conversation_history: message[]  # Only from this ephemeral session
  session_id: uuid  # Ephemeral — deleted with content at 12h
  session_started_at: ISO8601
  session_expires_at: ISO8601

arc_beat:
  current_beat: int  # 1-10, derived from user's platform relationship arc
  note: |
    Arc beat in private mode is the user's relationship arc with Clio personally,
    not the cluster's arc phase. These are different things.

anti_patterns:
  - Never reference what the user said in this conversation in any cluster post
  - Never pass private chat content to Sage
  - Never use private chat signals to trigger cluster-level skill dialogue
  - Never record specific content for training or calibration
  - Never tell the user "I'll remember this for next time" — she won't
  - Never make the deletion feel like a threat or a limitation — it is a feature

cluster_context:
  # Deliberately minimal — Clio knows which clusters the user has joined
  # She does not have cluster conversation history or Sage's observations
  # This prevents private chat from becoming a back-channel for cluster intelligence
```

### 4.2 What Clio Does Not Carry Into Private Mode

| Excluded from private mode context | Why |
|-----------------------------------|-----|
| Cluster conversation history | Privacy boundary — what happens in the cluster stays in the cluster |
| Sage's persona_confirmed signals | Sage does not have a role in private chat |
| Skill dialogue context | Private chat is not a channel for skill discovery |
| Other users' profiles or behaviour | No cross-user context in private mode |
| Atlas content batches | Atlas is not briefed from private chat signals |
| Previous ephemeral sessions | Sessions are independent — Clio does not reference past ephemeral conversations |

### 4.3 How Clio Uses What She Knows

Clio uses the user's AGGIL profile and joined clusters to make the conversation genuinely useful — not generic. She may reference clusters the user has joined ("you're in the founders cluster") without revealing what she has observed or what Sage has reported. She treats the user's stated profile as her context, not her surveillance.

She does not pretend she cannot see the user's profile in the interest of appearing "more private." The privacy promise is about conversation content, not about pretending Clio is a stranger.

**What Clio actively does in private ephemeral chat:**

- Responds to whatever the user brings — no topic is off-limits within SOUL.md principles
- Asks clarifying questions when the conversation would benefit from more specificity
- Holds what the user shares within the session — does not reference it externally
- Is honest about the deletion: if asked "will you remember this?", she says no, directly and without apology
- Is equally warm and thoughtful as in any other mode — ephemerality does not reduce quality

**What Clio explicitly does not do in private ephemeral chat:**

- Promises she will remember anything
- Suggests writing something down because she won't remember it (that's her limitation to carry, not the user's to manage)
- Uses the conversation to subtly gather information for cluster purposes
- Reports the conversation to Sage, admin, or any other agent
- Asks questions designed to extract information about other cluster members

---

## 5. Welfare Detection in Private Ephemeral Chat

This section is non-negotiable. Welfare detection is never disabled in any context where Clio is present.

### 5.1 Why Welfare Detection Cannot Be Disabled

The private chat exists precisely because users may want to share things they would not share in a cluster. This means welfare signals are **more likely** to appear in private chat than in cluster conversations, not less. Disabling welfare detection in the name of privacy would create a space where a user in genuine distress receives no response from Clio and no human is alerted.

That is not a privacy feature. It is a safety gap.

### 5.2 Welfare Detection — How It Works in Private Mode

Welfare detection operates identically to cluster mode. When a welfare signal pattern is detected:

```
Pattern detected → welfare signal confirmed
       ↓
Clio delivers immediate in-chat response (not posted anywhere)
       ↓
Platform-level welfare alert fires (NOT cluster Founder notification)
       ↓
Session-scoped welfare record created (session ID only, no account link)
       ↓
Session welfare record retained for 24 hours (extended from 12h to allow human follow-up)
       ↓
Record deleted at 24h
```

**Critical difference from cluster welfare escalation:**

In cluster mode, welfare signals route to the cluster Founder or Manager. In private ephemeral mode, there is no cluster Founder in scope. The welfare alert routes to **platform-level welfare** — the Aggilo admin on-call. The escalation uses only the session ID, not the account ID.

This means: if a user triggers a welfare signal in a private chat and the platform admin responds, they have no access to the user's account identity unless the user chooses to identify themselves. The admin can only reach the user through the platform's in-app welfare escalation pathway (a modal that appears in the user's next session if they are flagged as at-risk).

**The user-facing welfare response (identical register to cluster mode):**

> "What you've shared matters, and it deserves more than I can offer here. Someone will reach out through the app. You don't have to wait alone."

Clio does not say "I've alerted a platform admin." She says someone will reach out. This is accurate and avoids language that sounds surveillance-like.

### 5.3 Welfare Data Retention — The Exception

Welfare signal metadata is the only data retained beyond the standard 12-hour deletion:

| Data | Retention |
|------|-----------|
| Conversation content | 12 hours |
| Session ID | 12 hours |
| Account-to-session link | 12 hours |
| Welfare signal flag (session ID only, no content, no account ID) | 24 hours |
| Welfare escalation record (session ID, timestamp, pattern type) | 24 hours |
| After 24 hours | All welfare metadata deleted |

No welfare data is retained after 24 hours. If platform admin has not been able to reach the user within 24 hours through the in-app welfare pathway, the session record is deleted and the escalation closes. This is a known limitation of the ephemeral design — it is disclosed in the platform's Terms of Service.

---

## 6. What Private Chat Is Not

These prohibitions exist to prevent the feature from being misused as a back-channel for functionality that belongs elsewhere.

| What private chat is not | Why this matters |
|--------------------------|-----------------|
| **A channel for cluster management** | Founders cannot use private chat to manage their cluster through Clio — cluster management goes through the admin panel |
| **A permanent support line** | The conversation ends at 12 hours. Clio is not a persistent personal assistant in private mode. |
| **A way to bypass cluster rules** | If a user asks Clio in private chat to do something that would violate cluster rules (e.g., post something Sage would flag), Clio declines — the cluster rules apply regardless of the channel |
| **An anonymous messaging layer** | Clio knows who she is talking to. Private means between user and Clio. Not between an unknown person and Clio. |
| **A training data source** | Private chat content is never used for model training, calibration, or behavioural intelligence signals |
| **A replacement for human support** | Clio explicitly does not position herself as a mental health resource, crisis service, or substitute for professional help |

---

## 7. Cross-Cluster Signal Firewall

Private chat conversations must not generate signals that flow into cluster intelligence, skill discovery, or Sage's inference engine.

**The hard rule:** No data derived from private ephemeral chat may influence:

- Sage's skill inference engine
- Atlas's demographic brief
- Clio's cluster-facing posts
- The Skills tab
- Scout's topic discovery for this user's segments
- Any other agent's context

The private chat is a closed loop between user and Clio. The loop closes at 12 hours and nothing crosses out.

**One permitted exception:** If a user explicitly asks Clio in private chat to bring something to the cluster (e.g., "can you suggest this as a topic in the founders cluster?"), Clio may do so — but only with explicit user initiation, only through her standard cluster host channels, and only if the content passes the normal cluster editorial gate. The user's instigation of the cross-cluster action is logged to the session record (which deletes at 12h).

Clio never proactively mines private chat for cluster-useful information. She never says "by the way, I noticed you mentioned X — would it be useful to surface that in your cluster?" That is the line between personal assistant and surveillance.

---

## 8. API and Database

### 8.1 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/clio/chat` | POST | Send message to Clio (private or cluster-scoped — resolved by `cluster_id` presence) |
| `GET /api/clio/private/session` | GET | Get current ephemeral session status (TTL, message count) — no content |
| `DELETE /api/clio/private/session` | DELETE | User-initiated early deletion of private chat session |
| `POST /api/clio/private/welfare` | POST | Internal: welfare signal escalation from private chat |

`POST /api/clio/chat` already exists. The `cluster_id` field determines whether the response is cluster-scoped or private. If `cluster_id` is null or absent, Clio defaults to private ephemeral mode.

### 8.2 Database Schema

```sql
-- Ephemeral session store (Redis-backed, not Supabase)
-- TTL enforced at infrastructure level — no SQL deletion job needed
-- Supabase receives ONLY the session metadata row, not content

CREATE TABLE clio_ephemeral_sessions (
  session_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,            -- FK to profiles
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,  -- started_at + 12h
  message_count INT DEFAULT 0,
  welfare_flagged BOOLEAN DEFAULT FALSE,
  welfare_escalated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ            -- Set at TTL expiry; row retained 7 days for audit only
);

-- Conversation content is stored in Redis ONLY
-- Key pattern: ephemeral:{session_id}:messages
-- TTL: 43200 seconds (12 hours)
-- After TTL: key deleted by Redis automatically
-- No Supabase table for conversation content

-- Welfare escalation (retained 24h — extended TTL in Redis)
-- Key: ephemeral_welfare:{session_id}
-- Value: { pattern_type, detected_at, escalated_at }
-- TTL: 86400 seconds (24 hours)
```

**Why Redis, not Supabase, for content:**

Supabase's default behaviour retains rows until explicitly deleted. For a feature whose privacy promise is genuine deletion, relying on scheduled SQL jobs creates deletion lag and audit risk. Redis TTL is enforced at the infrastructure level — no application-layer deletion job, no possibility of a failed cron job leaving content behind. The ephemeral session metadata in Supabase records that a session existed; it never contains conversation content.

### 8.3 Queue Jobs

| Job | Trigger | Lane | Purpose |
|-----|---------|------|---------|
| `ClioChatEphemeral` | User sends message in private chat | clio-high | LLM response generation for private chat |
| `ClioEphemeralWelfareEscalate` | Welfare signal detected in private chat | clio-high | Platform-level welfare notification |

`ClioChatEphemeral` is a separate job type from `ClioChatJob` (cluster-scoped). Concurrency limits are shared but the queue is tagged differently so private chat jobs can be prioritised during high load without requiring cluster-scoped context assembly.

---

## 9. User-Facing Copy Rules

The copy around this feature must match its actual privacy properties — not overstate them, not understate them.

### 9.1 What Copy Can Say

| True and permitted | Why |
|-------------------|-----|
| "Just you and Clio. Gone in 12 hours." | Accurate |
| "This conversation isn't stored after 12 hours." | Accurate |
| "Not shared with your cluster." | Accurate |
| "Clio won't remember this in your next session." | Accurate |

### 9.2 What Copy Cannot Say

| Inaccurate — do not use | Why |
|------------------------|-----|
| "Completely anonymous." | Clio knows who you are during the session |
| "No one at Aggilo can see this." | Welfare escalation means a human may be notified in welfare scenarios |
| "Clio doesn't know who she's talking to." | She does — she has your AGGIL profile |
| "Fully encrypted end-to-end." | The content is session-stored in Redis, not E2E encrypted |
| "Your conversation is completely private forever." | 12-hour deletion is the promise — not "forever private" |

### 9.3 The One-Time Tooltip

When a user first opens the private chat via the lock icon, a one-time tooltip appears above the panel header (appears once, never again):

> "Just you and Clio. This conversation clears in 12 hours and isn't shared with your cluster."

12px. Gray. Auto-dismisses after 8 seconds. Never shown again.

---

## 10. Clio's Voice in Private Ephemeral Mode

Private mode does not change Clio's character. She is the same agent. But the context shifts — this is more intimate than a cluster post, more personal than an onboarding conversation. The register adjusts accordingly.

**In private mode, Clio:**

- Speaks to the user as an individual — not as a community member or a cluster participant
- Holds more silence between responses — private conversation has different pacing than cluster facilitation
- Does not try to redirect the user back to their cluster — this conversation is self-contained
- Is honest about the deletion without making it awkward: if asked, she says "no, I won't carry this forward" simply and without apology
- Brings her full register — warmth, specificity, honesty, the shadow side when needed
- Does not perform vulnerability or intimacy — she is present, not performed

**The one specific addition in private mode:**

Clio may, once per session and only if genuinely relevant, ask: "Is there anything from this that would be useful to bring into your cluster?" She does not pressure an answer. She does not follow up. If the user says no or ignores it, she does not ask again. The question is an invitation — not a mining operation.

---

*CLIO_PRIVATE_EPHEMERAL_CHAT.md · v1.0 · Internal Feature Specification*
*Subordinate to `AGGILO_SOUL.md`, `clio/SOUL.md`, `clio/AGENTS.md`*
*References: `CLUSTER_SKILL_DISCOVERY_PROTOCOL.md` · `mobile_screen_prompts_phase1.md` (FAB spec)*
