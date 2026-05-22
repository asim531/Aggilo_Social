# Cluster UI — Microinteraction and Motion Specification
## UX Review · v1.0

> **Scope:** This document governs microanimations, motion, spatial behaviour, and interaction choreography for all cluster-facing UI elements introduced in the new agent architecture — Clio's top-right overlay, the agent chatbox panel, the Features tab, @Sage interactions, and Sage's Anchor presence. The colour system and base typography are already specified in `mobile_screen_prompts_phase1.md`. This document adds motion and behaviour.
>
> **Document location:** `Revised_Screen_Prompts/CLUSTER_UI_MICROINTERACTIONS.md`
> **Authority:** Subordinate to `mobile_screen_prompts_phase1.md` for visual identity. Takes precedence for motion and microinteraction behaviour.

---

## 1. Core Motion Principles

Before any specific animation is specified, three principles govern every motion decision in this system. Anything that violates these principles should be revised before shipping.

### 1.1 Motion Communicates State, Not Delight

Every animation in this system has a job. The job is to communicate that something changed, is changing, or is ready. Animations that exist purely for aesthetic pleasure are removed — they compete with the content members came to the cluster for.

**Test:** Can you explain in one sentence what this animation communicates? If not, remove it.

### 1.2 Agents Move Differently From the Interface

Clio and Sage are alive in a way the interface is not. Their animations are organic — slight, breathing, responsive. The interface animates mechanically — precise, purposeful, resolved. This difference is subtle but real. Users should unconsciously feel that the agents are present, not just displayed.

### 1.3 Speed Hierarchy

| Element | Speed | Easing |
|---------|-------|--------|
| Interface state changes (tab switches, panel open/close) | 200ms | ease-out |
| Content appearing (posts, messages, cards) | 150ms | ease-in-out |
| Agent presence changes (mood, attention shifts) | 600-800ms | ease-in-out (organic, not snappy) |
| Notifications and badges | 250ms | ease-out |
| Loading states | Continuous loop | linear |

---

## 2. Clio — Top Right Corner Position

### 2.1 Position Decision

Moving Clio from bottom-right to top-right is correct for cluster screens. Here is the reasoning:

The bottom-right FAB position was designed for Explore and profile screens — contexts where the primary action (compose, create) is also bottom-right, and Clio lives beside it without competing. Inside a cluster, the primary actions (Timeline compose bar, post button) are also bottom-right. Two interactive presences in the same corner create visual competition and increase mis-tap risk.

Top-right is better because:
- It is distinct from all interactive timeline elements
- It sits in a persistent location the user returns to naturally (navigation bar is typically top)
- It does not overlap any content during scroll
- It creates a clear "agent space" vs "community space" separation

### 2.2 Clio Top-Right Specification

```
Position:   Top-right of cluster screen interior
            (below the cluster top bar, not inside it)
            16px from right edge
            8px below the cluster top bar bottom edge

Size:       40px circle (slightly smaller than the 48px Explore FAB
            — cluster interior is more content-dense)

Visual:     Peach face, teal ring border (unchanged)
            At 40px the face detail is still legible

Clearance:  Never overlaps:
            - Cluster top bar (name, back arrow, messages icon)
            - Tab bar (Timeline / Members / Features)
            - Any post content during scroll

Scroll:     Clio is FIXED — she does not scroll with content
            She stays top-right regardless of scroll position
            This is what makes her always accessible without searching
```

### 2.3 Clio Tap → Chat Panel Opens

When the user taps Clio in the top-right:

**Panel origin:** Expands from Clio's position downward and leftward. The panel grows from the top-right corner toward the bottom-left of the screen — this is the natural spatial continuation of where the user's attention already is.

**Panel dimensions:**
- Width: 320px (same as Explore Clio panel)
- Max height: 60% of screen height
- Does not cover the cluster top bar
- Does not cover the bottom navigation bar
- Covers Timeline content — this is acceptable and expected (user has chosen to open chat)

**Animation — panel open:**
```css
/* Panel expand from Clio's top-right position */
@keyframes clioClusterOpen {
  from {
    transform-origin: top right;
    transform: scale(0.1);
    opacity: 0;
    border-radius: 50%;  /* Starts as the Clio circle */
  }
  to {
    transform: scale(1);
    opacity: 1;
    border-radius: 16px;  /* Resolves to panel shape */
  }
}
duration: 220ms
easing: cubic-bezier(0.34, 1.56, 0.64, 1)
/* The slight overshoot (1.56) gives it organic feel without being bouncy */
```

**Panel header — in-cluster:**
- Clio avatar (32px) left
- "Clio · Private" center — teal bold "Clio", gray regular "· Private"
- Minimize (—) and Close (X) right — both present, 32px tap targets
- Timer: "Clears in Xh Xm" — gray 11px, below the header, right-aligned

### 2.4 Minimize Behaviour

Tap minimize (—):

**Animation — panel to minimized state:**
```css
@keyframes clioMinimize {
  from { transform: scale(1); opacity: 1; }
  to   { transform: scale(0.1) translateX(80px) translateY(-60px); opacity: 0; }
}
/* Panel shrinks back toward Clio's circle position */
duration: 180ms
easing: ease-in
```

After animation: Clio icon remains in top-right. A small teal dot appears at Clio's 2 o'clock position — indicates an open conversation. Dot pulses once (600ms, opacity 1 → 0.6 → 1) to draw attention, then settles.

**Restoring from minimized:**
Tap Clio icon again — panel re-opens with same animation as initial open. Conversation is preserved exactly where it was.

### 2.5 Close Behaviour

Tap close (X):

Inline confirmation appears inside the panel (not a modal — the user chose to close from inside the panel, so the response belongs inside it):

```
┌────────────────────────────────────────┐
│  Close this conversation?              │
│  Still here for [Xh Xm]               │
│                                        │
│  [Keep open]  ·  [Close]              │
└────────────────────────────────────────┘
```

"Keep open" is the default-looking option (teal text). "Close" is gray — it requires deliberate selection. This micro-decision reduces accidental closes without being obstructive.

If Close is confirmed:
```css
@keyframes clioClose {
  to { transform: scale(0.05) translateX(80px) translateY(-60px); opacity: 0; }
}
duration: 200ms
easing: ease-in
```

Clio icon returns to default Resting state. Teal dot is gone.

### 2.6 Clio Mood States — In Cluster (Top-Right Position)

At 40px, Clio's mood animations must be legible at small scale:

| State | Animation at 40px |
|-------|------------------|
| **Resting** | Soft pulse: scale 1.0 → 1.03 → 1.0, 3s loop, opacity 0.9 → 1.0. Barely noticeable — communicates aliveness |
| **Curious** | Slight tilt: rotate -5deg → 0deg → 5deg → 0deg, 2s, triggered after 120s user idle on cluster screen |
| **Thinking** | Ring glow: teal border animates from 2px → 4px → 2px, 800ms loop. Communicates generation in progress. |
| **Attending** | Forward pulse: scale 1.0 → 1.06 → 1.0, faster 1.2s loop. Fires when agent chatbox has a new exchange. |

**Critical:** Mood states never fire simultaneously. They queue and the most recent state wins. No stacked animations.

---

## 3. Agent Collaboration Chatbox — Motion Specification

### 3.1 Panel Position and Persistence

The chatbox is fixed in the cluster layout — it does not scroll. On mobile (primary target), it sits between the compose bar and the Timeline posts. On wider screens it moves to a right sidebar.

```
Mobile layout (375px viewport):
┌──────────────────────────────────────────┐
│  TOP BAR: ← Cluster Name   💬  [Clio 40px]│  ← Clio top-right, fixed
├──────────────────────────────────────────┤
│  [ Timeline ] [ Members ] [ Features ]   │  ← Tab bar
├──────────────────────────────────────────┤
│  Compose bar                    [Post]   │
├──────────────────────────────────────────┤
│ ┌── 🔵 Clio & Sage  ──────────── [—] ┐  │  ← Chatbox FIXED
│ │  [Exchange content]             │  │  │
│ │  2h ago · [See full discussion] │  │  │
│ └──────────────────────────────────┘  │
├──────────────────────────────────────────┤
│  [Timeline posts — scrollable]           │
│  [Post card 1]                           │
│  [Post card 2]                           │
│  ...                                     │
└──────────────────────────────────────────┘
```

### 3.2 New Exchange Arrival Animation

When a new agent exchange is posted (Sage or Clio adds a message to the chatbox):

**Step 1 — Clio icon Attending state fires** (top-right, 1.2s loop, 3 pulses, then settles)

**Step 2 — Chatbox header update:**
```css
@keyframes chatboxNewContent {
  0%   { background-color: #F0F9FF; }   /* Default light blue */
  30%  { background-color: #BAE6FD; }   /* Pulse to brighter blue */
  100% { background-color: #F0F9FF; }   /* Return to default */
}
duration: 1000ms
easing: ease-out
```

**Step 3 — New message slides in:**
```css
@keyframes agentMessageSlideIn {
  from {
    transform: translateY(-8px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
duration: 250ms
easing: ease-out
/* Slides from slightly above — Sage messages from left origin, Clio from right */
```

**Step 4 — Unread indicator on header:**
A blue dot (6px) appears at the end of the chatbox header text. It stays until the user scrolls the chatbox or taps "See full discussion."

### 3.3 Minimizing the Chatbox

Tap minimize (—):

```css
@keyframes chatboxMinimize {
  from { height: [current height]; opacity: 1; }
  to   { height: 40px; opacity: 1; }   /* Collapses to header only */
}
duration: 200ms
easing: ease-in-out
```

The minimized state shows only the header bar:
```
🔵 Clio & Sage — 3 new exchanges ──────────── [+]
```

The member count of "new exchanges since last view" persists. Tapping [+] expands with the reverse animation.

### 3.4 "Typing" State — When an Agent Is Generating

If the chatbox is visible during a scheduled exchange generation, a typing indicator appears:

```
┌─────────────────────────────────────────┐
│  SAGE                                   │
│  ● ● ●  (three dots, staggered pulse)  │
└─────────────────────────────────────────┘
```

```css
@keyframes agentTypingDot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40%           { transform: scale(1.0); opacity: 1.0; }
}
/* Each dot: 600ms, stagger: dot1=0ms, dot2=200ms, dot3=400ms */
```

Sage dots: sage-green. Clio dots: teal. The colour communicates which agent is generating before the message arrives.

---

## 4. Features Tab — UI Specification

### 4.1 Decision: No Link to Agent Conversation

After evaluation, the link to the agent conversation is **removed from the member-facing Features tab**.

The reasoning: the agent chatbox is the cluster's working space. It sets tone and shows effort. But linking a feature card directly into a specific chatbox exchange creates two problems:

First, it makes the chatbox feel like it exists to justify features rather than to serve the community — the chatbox becomes footnotes, not conversation. Second, members clicking through to a chatbox exchange mid-thread will often land without context and feel confused.

**What replaces it:** The "Source" field on each feature card says clearly where the feature came from — "Identified by Sage," "Suggested by 3 members," "Initiated by Clio." That is sufficient attribution without the navigation complexity.

Admins can still navigate from any feature to the chatbox exchange that produced it — that link lives in the admin dashboard view only.

### 4.2 Feature Card Microinteractions

**Card entry animation (new feature appears in tab):**
```css
@keyframes featureCardEnter {
  from {
    transform: translateX(-12px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
duration: 200ms
easing: ease-out
/* New proposed features slide in from the left — like they arrived */
```

**Status change animation (e.g., Proposed → Live):**
```css
@keyframes featureStatusUpdate {
  0%   { background-color: #FFFFFF; }
  25%  { background-color: #DCFCE7; }   /* Brief green flash — success */
  100% { background-color: #FFFFFF; }
}
duration: 1200ms
easing: ease-out
```
The card's status badge also transitions:
```css
/* Status badge: text fades out, new status text fades in */
duration: 300ms
easing: ease-in-out
```

**Upvote microinteraction:**

When a member taps 👍:

```css
/* The icon springs up briefly */
@keyframes upvoteSpring {
  0%   { transform: scale(1.0); }
  40%  { transform: scale(1.4) translateY(-4px); }
  70%  { transform: scale(0.95); }
  100% { transform: scale(1.0); }
}
duration: 400ms
easing: cubic-bezier(0.34, 1.56, 0.64, 1)
```

The upvote count increments immediately (optimistic update). If the server fails, it reverts with a brief shake:
```css
@keyframes upvoteRevert {
  0%, 100% { transform: translateX(0); }
  25%      { transform: translateX(-3px); }
  75%      { transform: translateX(3px); }
}
duration: 300ms
```

**Comment section expand:**
```css
@keyframes commentExpand {
  from { height: 0; opacity: 0; }
  to   { height: auto; opacity: 1; }
}
duration: 200ms
easing: ease-out
```

### 4.3 Feature Status Labels — Visual Spec

Each status has a specific badge appearance. No icons — only the label and colour:

| Status | Badge background | Badge text | Text colour |
|--------|-----------------|-----------|-------------|
| Proposed | `#EFF6FF` | "Proposed" | `#3B82F6` (blue) |
| Approved | `#F0FDF4` | "Approved" | `#16A34A` (sage-green) |
| Scheduled | `#FFFBEB` | "Scheduled" | `#D97706` (amber) |
| In Testing | `#FEF3C7` | "In Testing" | `#B45309` (dark amber) |
| Live | `#F0FDF4` | "Live" | `#15803D` (deeper green) |

No emojis in the badge. The ✅ and 💡 appear only in the card itself, not in the badge. This keeps the status system scannable.

### 4.4 Empty Features Tab State

```
🌱  Nothing here yet.

Sage and Clio are getting to know this community.
When they identify something worth building,
it will appear here first.
```

Text: H3 center, gray `#6B7280`. The 🌱 emoji is the one piece of expressive content on this screen — it is earned because the screen is otherwise very quiet.

---

## 5. @Sage Interaction — UI and Motion

### 5.1 The @Sage Tip Bar

Displayed at the bottom of the Timeline, above the compose bar, for first-time cluster visitors:

```
┌─────────────────────────────────────────────────────┐
│ 💡 Use @Sage in your message to get her attention.  │
│                                          [Got it ✕] │
└─────────────────────────────────────────────────────┘
```

**Background:** `#F0F9FF` (same light blue as chatbox — associates with the agent presence)
**Border:** none — it should feel like part of the interface, not an interruption
**Height:** 40px
**Animation — entry:**
```css
@keyframes tipSlideUp {
  from { transform: translateY(40px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}
duration: 250ms
easing: ease-out
/* Fires 2 seconds after first Timeline view — not immediately */
```

**Dismiss animation:**
```css
@keyframes tipDismiss {
  to { height: 0; opacity: 0; padding: 0; margin: 0; }
}
duration: 200ms
easing: ease-in
```

After dismiss: the space collapses cleanly. No gap remains.

### 5.2 @Sage in Compose Bar — Autocomplete

When a member types `@` in the compose bar, a single suggestion chip appears above the keyboard:

```
[@Sage]
```

This is the only @mention suggestion in Phase 1 — there are no user @mentions in the cluster compose bar (DMs handle direct communication). The chip is:
- `#F0FDF4` background, sage-green border, "Sage" sage-green text
- Tapping it inserts `@Sage ` (with trailing space) into the compose field
- Entry animation: 150ms fade-in from bottom

### 5.3 @Sage Post — Visual Treatment in Timeline

A post containing `@Sage` gets a subtle visual distinction when it appears in the Timeline — before Sage has responded:

```
┌─────────────────────────────────────────────────┐
│ @member_name                          Just now   │
│                                                  │
│ @Sage — can you recommend...                     │
│                                                  │
│  ● ● ●  Sage is considering this.               │
└─────────────────────────────────────────────────┘
```

The "● ● ● Sage is considering this." line:
- Appears 2 seconds after the post is submitted (to avoid flashing if Sage responds quickly from cache)
- Is sage-green text, 12px, italic
- Uses the same three-dot animation as the chatbox typing indicator but smaller (4px dots)
- Disappears when Sage's response post appears in the Timeline

This is the only "server thinking" feedback visible to members for Sage responses. It is calm, specific, and honest. Not "Please wait..." — "Sage is considering this." carries the agent's character.

---

## 6. Sage Anchor Presence — Visual Specification

### 6.1 Sage Posts in Timeline

Sage's posts are distinguishable from member posts and Clio posts by:

| Element | Sage | Clio | Member |
|---------|------|------|--------|
| Avatar | 40px, clay/terracotta | 40px, peach | User avatar |
| Avatar ring | 2px sage-green `#16A34A` | 2px teal `#0891B2` | None |
| Label | "Sage · Anchor" | "Clio" | @nickname |
| Left border | 3px sage-green | 3px teal | None |
| Background tint | `#F0FDF4` | `#FFF7ED` | White |
| Entry animation | 200ms slide from left | 150ms fade | 150ms fade |

"Sage · Anchor" label: "Sage" in sage-green semi-bold, "· Anchor" in gray regular. Small, below the avatar. The title is present but not prominent — it is information for those who want it, not a banner.

### 6.2 Sage Bridge Message — Visual Treatment

When Sage sends a bridge message (human delayed response), it has a slightly different visual to distinguish it from Sage's standard contributions — not dramatically, but enough that Sage herself can recognise the type when reviewing:

The bridge message card has a subtle amber left-border (2px `#D97706`) in place of the standard sage-green. This is the only visual change. The amber communicates "this is a holding message" without alarming the member. No label change — it still says "Sage · Anchor."

In the admin view, bridge messages are tagged with an amber dot in the Sage intervention log.

---

## 7. Agent Chatbox — "See Full Discussion" Modal

When a member taps "See full discussion" in the minimized chatbox preview:

A full-screen overlay slides up from the bottom (standard bottom sheet pattern). It shows the complete chronological history of all agent chatbox exchanges for this cluster.

```css
@keyframes chatboxFullOpen {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
duration: 300ms
easing: cubic-bezier(0.25, 0.46, 0.45, 0.94)
```

**Contents:**
- Chronological exchange history (oldest at top)
- Each exchange shows: Sage message + Clio response + timestamp + any feature proposals that came from this exchange (as small linked chips, not deep links — just the feature name and its current status)
- The feature chips in the history are the only cross-reference to the Features tab — they are in the history view, not in the cluster-level feature card
- Members can scroll freely through the entire history

**This history is never deleted.** It is the cluster's founding record — the visible evidence of what the agents have done and are doing for this community. Long-running clusters will have rich histories that function as an archive of the community's evolution.

**Close:** Swipe down or tap X. Reverse of the open animation.

---

## 8. Accessibility Notes

| Element | Requirement |
|---------|------------|
| Clio top-right (40px) | Minimum 44×44px tap target — add 2px invisible padding around the 40px circle |
| Chatbox minimize button | Minimum 44×44px tap target — the — icon is small; the tap target extends beyond it |
| @Sage tip dismiss button | Minimum 44×44px — the full right section of the tip bar should be the tap target |
| Feature upvote | Minimum 44×44px — the 👍 and count together should form the tap target |
| All status badges | Sufficient contrast — all specified colours meet WCAG AA at their respective background combinations |
| Sage typing indicator | Provide aria-label: "Sage is composing a response" for screen readers |
| Agent chatbox new content | Provide aria-live="polite" so new exchanges are announced to screen readers |
| Clio mood animations | Respect prefers-reduced-motion: replace all animations with instant state changes when set |

---

*CLUSTER_UI_MICROINTERACTIONS.md · v1.0*
*Subordinate to `mobile_screen_prompts_phase1.md`*
*Applies to all premium clusters. Screen prompts must be updated to reflect Clio's top-right position.*


---

## 9. Pilot-validated microinteractions (additive)

> **Status:** Additive. Nothing in §1–§8 was modified. The patterns
> below are microinteractions validated in pilot operation that
> belong on every cluster (premium and generic) in production.

### 9.1 Anchored popover dismissal

When a popover (tour step, feature-intro, contextual help) is anchored
to a target element, dismissal is governed by:

| Action | Effect |
|---|---|
| Click outside popover and outside the highlighted target | Close the popover |
| Click the highlighted target itself | Do **not** close — the member is interacting with what they're learning about |
| Click the explicit × button | Close |
| Press Esc | Close |
| Press → / ← (in a multi-step popover) | Step Next / Back, gated by step bounds |

Implementation: capture-phase pointerdown listener so the dismissal
wins over inner click handlers. Popover root carries a stable
data-attribute the listener checks for ancestry.

### 9.2 Held highlight, not flashed

The pattern from §1's "Quiet, Layered Motion" extends to highlights on
contextual help: the target surface gets a held 3px ring while the
popover is open, not a flash. Flash highlights teach members "look at
this for one second" — not what we want when the explanation lives
beside the surface and members may take longer than a second to read.

The ring is released and the previous `box-shadow` restored on step
change or close. Transition: 200ms ease.

### 9.3 Fixed-height presence slots

Presence-state surfaces (typing indicator, "Sage is considering",
"Clio is thinking") reserve a fixed-height row even when empty. Empty
state carries `aria-hidden`. Filled state carries `role="status"
aria-live="polite"`. Compose-bar position never shifts on iOS
keystroke because the slot is always there.

Slot height: 24px (`h-6`). Inner content is vertically centred.

### 9.4 Click-anywhere-dismiss preference order

For overlays that can be dismissed multiple ways, prefer:

1. Click-anywhere-outside (learned web pattern)
2. Esc key
3. Visible × button as fallback affordance

Avoid adding a "Done" button when click-outside already dismisses —
redundant affordances communicate "this thing is special and needs
explicit closing", which is the opposite of what you want for
non-modal contextual help.

### 9.5 Live-region announcement convention

| Element | Pattern |
|---|---|
| New-posts arrival pill | `role="status" aria-live="polite"` on the container; explicit `aria-label` on the button names the action ("3 new posts — tap to view") |
| Typing indicator | `role="status" aria-live="polite"` when filled; `aria-hidden` when empty |
| Activity badge count change | `aria-live="polite"` on the count container |
| Sage considering indicator | `aria-label="Sage is considering this post"` (already in §8 — repeated here for grouping) |
| Workshop strip new exchange | `aria-live="polite"` on the exchange container |

### 9.6 Skip-to-content link

Every cluster surface and every authenticated screen exposes a
visually-hidden skip link as the first focusable element:

- Tab focus reveals the link as a high-contrast button at top-left
  (8px from edge, z-index above sticky chrome)
- Activation moves focus to the page's primary content anchor (e.g.
  the timeline)
- The target anchor accepts programmatic focus via `tabIndex={-1}`

Mobile-keyboard users (Bluetooth keyboards, switch-control accessibility
input) benefit equally to desktop. WCAG 2.4.1.

### 9.7 Six-accent budget enforcement

The platform's six-accent vocabulary is fixed:

| Accent | Meaning |
|---|---|
| Aggilo deep | Brand + private chat surface + post-author bubble |
| Amber | Cluster persistence (AMA / Private Chat) + warm chrome |
| Rose | Welfare handoff (lowest-saturation; safety floor) |
| Indigo | Fiqh-with-distress handoff |
| Sky / cyan | Workshop strip + agent infrastructure |
| Emerald | Verified content + tour highlight + on-topic link badge |

When designing a new microinteraction, the highlight / accent / state
colour comes from this table. Adding a seventh requires retiring one
first.

---

*§9 appended — pilot-validated microinteractions, additive to §1–§8.*
