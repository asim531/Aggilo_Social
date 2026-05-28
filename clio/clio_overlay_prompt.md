# Clio — Overlay Prompt

> **Reference note (V3):** Retained per V3 audit (Q5). This document is the rendering and overlay-behaviour specification consumed by the frontend (React PWA / Next.js MVP) when Clio appears on screen. It is not loaded into the LLM context — it governs UI assets and trigger choreography only.
>
> **What this document is**: The complete specification for how Clio appears, behaves,
> and disappears as an overlay layer on top of Aggilo screens. It defines the asset system,
> trigger classification, anchor contract, position logic, gesture system, and exit rules.
>
> **What this document is NOT**: It does not own screen layout (→ `mobile_screen_prompts_phase1.md`).
> It does not own Clio's character or voice (→ `clio_character_prompt.md`).
> It does not own backend trigger logic (→ `AGENTS.md`).
>
> **How it connects to screens**: Every screen in `mobile_screen_prompts_phase1.md` marks
> `[CLIO_ANCHOR: anchor_id]` at each point where Clio can appear. This document owns
> the complete specification for every `anchor_id`. Renderers look up the anchor here.

---

## 1. Architecture Contract

The Clio overlay is a **fully independent rendering layer** that sits above all screen content. It never owns or modifies the screen beneath it.

| Rule | Detail |
|:---|:---|
| **Screen stays live** | The underlying screen remains fully interactive at all times. No dimming. No locking. No backdrop. |
| **Overlay does not block** | Clio never intercepts taps intended for screen elements below her overlay. |
| **Z-index** | Clio overlay: `z-index: 9000`. Glow ring on gestured element: `z-index: 8999`. All screen content: below `z-index: 8000`. |
| **One instance** | Only one Clio overlay state may be active at a time. If a new trigger fires while Clio is active, queue it — do not stack overlays. |
| **FAB is always present** | The FAB (48px resting state) is the baseline. It is never hidden except during the walkthrough (Screen 0.1) and auth/onboarding flows where Clio is absent. |

---

## 2. Asset System

### Directory structure

```
clio/assets/source/
├── stills/              ← Static PNG mood states
│   ├── clio_resting_01.png
│   ├── clio_resting_02.png
│   ├── clio_resting_03.png
│   ├── clio_happy_01.png
│   ├── clio_happy_02.png
│   ├── clio_happy_03.png
│   ├── clio_curious_01.png
│   ├── clio_curious_02.png
│   ├── clio_curious_03.png
│   ├── clio_excited_01.png
│   ├── clio_excited_02.png
│   ├── clio_excited_03.png
│   ├── clio_thinking_01.png
│   ├── clio_thinking_02.png
│   ├── clio_thinking_03.png
│   ├── clio_encouraging_01.png
│   ├── clio_encouraging_02.png
│   ├── clio_encouraging_03.png
│   ├── clio_empathetic_01.png
│   ├── clio_empathetic_02.png
│   ├── clio_empathetic_03.png
│   └── pointing/        ← Gesture pose variants
│       ├── clio_pointing_right_01.png
│       ├── clio_pointing_right_02.png
│       ├── clio_pointing_left_01.png
│       ├── clio_pointing_left_02.png
│       ├── clio_pointing_down_01.png
│       └── clio_pointing_down_02.png
└── clips/               ← MP4 animation files
    ├── transitions/     ← Mood-to-mood transitions
    │   ├── clio_transition_resting_to_curious.mp4
    │   ├── clio_transition_resting_to_happy.mp4
    │   ├── clio_transition_resting_to_excited.mp4
    │   ├── clio_transition_resting_to_thinking.mp4
    │   ├── clio_transition_resting_to_encouraging.mp4
    │   ├── clio_transition_resting_to_empathetic.mp4
    │   ├── clio_transition_curious_to_happy.mp4
    │   ├── clio_transition_curious_to_thinking.mp4
    │   ├── clio_transition_thinking_to_happy.mp4
    │   ├── clio_transition_thinking_to_curious.mp4
    │   ├── clio_transition_happy_to_resting.mp4
    │   ├── clio_transition_empathetic_to_encouraging.mp4
    │   └── clio_transition_encouraging_to_resting.mp4
    ├── gestures/        ← Action clips
    │   ├── clio_gesture_nod_01.mp4
    │   ├── clio_gesture_nod_02.mp4
    │   ├── clio_gesture_react_success_01.mp4
    │   ├── clio_gesture_react_error_01.mp4
    │   ├── clio_gesture_point_right_01.mp4
    │   ├── clio_gesture_point_left_01.mp4
    │   └── clio_gesture_point_down_01.mp4
    └── idle/            ← Looping idle states
        ├── clio_idle_01.mp4
        ├── clio_idle_02.mp4
        └── clio_idle_03.mp4
```

### Asset selection rules

**PNG variants (stills):**
- First appearance in a session → always load `_01`
- Subsequent appearances of the same mood → randomly select from `_02` or `_03`
- Never use the same variant consecutively within one session
- Exception: pointing assets always use the direction specified in the anchor — no random selection

**Clip selection:**
- Transition clips: load the specific file matching `clio_transition_[from]_to_[to].mp4`
  - If the exact transition file does not exist, snap directly to the destination PNG (no clip)
- Gesture clips: load the specific action file. If two variants exist (`_01`, `_02`), select randomly
- Idle loops: cycle through `_01 → _02 → _03 → _01` in order. Never repeat the same loop back-to-back
- Idle loop fires after Clio has been stationary in any state for **15 seconds**
- Idle loop continues until a trigger fires, user interacts, or Clio exits

---

## 3. Trigger Classification

Clio's appearance is initiated by one of three trigger types. The trigger type affects default timeout and exit behaviour.

### Type F — Frontend Condition
The app frontend detects a condition and fires the trigger directly, without an LLM call.

| Condition | Trigger ID |
|:---|:---|
| 120 seconds of browse without tapping a card | `F_IDLE_120S` |
| Explore first load — query running | `F_EXPLORE_LOADING` |
| Explore returns zero results | `F_EXPLORE_ZERO` |
| User is in a cluster Pulse tab, cluster arc = A (empty) | `F_CLUSTER_EMPTY` |
| User is in cluster Timeline, no posts yet | `F_TIMELINE_EMPTY` |
| User profile incomplete (bio empty OR interests < 3) | `F_PROFILE_INCOMPLETE` |
| User taps FAB explicitly | `F_FAB_TAP` |

Type F triggers: **no LLM call needed for detection**. Speech content may still be LLM-generated.

### Type C — Clio Decision
Yantra reads USER.md and/or MEMORY.md at session start and decides Clio should appear. The decision is made before the first user interaction.

| Condition | Trigger ID |
|:---|:---|
| User has joined a cluster but never opened it | `C_CLUSTER_UNVISITED` |
| User dormant 7+ days, has active clusters | `C_USER_DORMANT` |
| Connection returns after 7+ days — something happened in their cluster | `C_MEMBER_RETURN` |
| Cluster reaches 10 Connections (Founder session) | `C_CLUSTER_MILESTONE_10` |
| Cluster arc regresses from D or E to C | `C_CLUSTER_REGRESSION` |
| Cluster created, `post_count = 0`, 24h elapsed (Founder session) | `C_CLUSTER_FIRST_POST_NUDGE` |
| `post_count` transitions 0 → 1 | `C_FIRST_POST` |
| Cluster silent 72h (`post_count ≥ 1`) | `C_CLUSTER_SILENT_72H` |
| User visited Explore 2+ times, tapped no card, no calibration set | `C_EXPLORE_POOR_RESULTS` |
| Stage 2 readiness signals met (cluster open + post read + return visit + Clio response) | `C_STAGE2_READY` |
| Stage 3 readiness signals met (posted/commented/reacted in cluster) | `C_STAGE3_READY` |
| Feature unlocked but unused after 2 return visits | `C_FEATURE_UNUSED` |
| Session open AND stage_3_signals_met = true from previous session | `C_DM_INTRO_ON_OPEN` |

Type C triggers: **require LLM call** — Clio reads context and decides whether and how to appear. She may choose silence.

### Type U — User-Initiated
User explicitly invokes Clio.

| Action | Trigger ID |
|:---|:---|
| Tap FAB | `U_FAB_TAP` |
| Tap Tune ⚙ icon on Explore top bar | `U_TUNE_TAP` |
| Tap Clio insight pill on Explore | `U_PILL_TAP` |
| Tap speech bubble when Clio has surfaced one proactively | `U_BUBBLE_TAP` |

Type U triggers: **always result in overlay panel opening**. Clio never stays silent when explicitly invoked.

---

## 4. Overlay Appearance States

Clio has four distinct states of visual presence. Each is described here.

### State 1 — FAB Resting (baseline)
The 48px Clio face in the bottom-right corner. Always present on eligible screens. Not an "appearance" — it is the default. From this state, all other states grow.

- Asset: `clio_resting_01.png` (or cycling variant per session rule above)
- Idle loop: `clio_idle_[01-03].mp4` fires after 15s of inactivity
- Position: `bottom: 72px + bottom_nav_height`, `right: 16px`
- Size: 48px circle, teal ring border, Elevation 2 shadow

### State 2 — Speech Bubble
Clio speaks a single message without opening a panel. Used for proactive nudges, brief observations, contextual tips. The screen stays live. The user can tap the bubble to escalate to State 4, or dismiss it.

- FAB remains at 48px. Speech bubble appears **above and to the left** of FAB.
- Bubble: white rounded rectangle, 16px radius, Elevation 2 shadow, teal left accent border (3px)
- Max width: 260px. Max 2 lines of text at 14px.
- Clio's image within bubble: 32px, current mood PNG, left-aligned
- Speech text: right of image, `#164E63`, 14px, Inter regular
- Dismiss affordance: small gray `×` top-right of bubble
- Tap anywhere on bubble: escalates to State 4 (panel)
- Auto-dismiss: see timeout table in Section 7

Asset at this state:
- Mood PNG: as specified by anchor
- If mood has changed from resting: play transition clip first, then resolve to destination mood PNG
- Idle loop fires after 15s if user has not dismissed or tapped

### State 3 — Prominent
Clio is the primary focus of the screen. Used on first visit, empty states, onboarding moments. She is enlarged to 80–120px (anchor specifies size) and centered or positioned near the relevant empty area.

- No panel. No overlay panel. Just Clio, her speech bubble, and possibly a CTA below.
- Background screen fully visible and live.
- Clio image: PNG at specified size, centered horizontally OR positioned per anchor spec
- Speech bubble: same spec as State 2 but positioned above or beside Clio depending on anchor
- CTA (if applicable): teal filled button directly below bubble, full width of bubble
- Entry: Clio scales from 0 to full size over 400ms (ease-out), simultaneous with bubble fade-in

### State 4 — Floating Panel
The full conversational interface. Opens from FAB position, grows upward-left.

- Panel dimensions: 320px wide, max height 65% of screen height, scrollable inside
- Background: white `#FFFFFF`, `border-radius: 20px 20px 20px 4px` (pointed bottom-right corner toward FAB)
- Shadow: Elevation 3 — `0 8px 24px rgba(0,0,0,0.16)`
- Entry animation: scale from `transform-origin: bottom right`, 0→1 over 280ms (ease-out)
- Position: anchored so bottom-right corner of panel is adjacent to FAB
- **Exception — AMA panel** (`anchor_explore_ama_entry`): panel grows from top-right corner (Tune icon position). `transform-origin: top right`. Panel hangs downward-left from the icon. All other panels use FAB anchor. This is the only exception.
- Header: 48px height. Clio avatar (32px, current mood PNG) left. "Clio" teal bold 14px center. `×` close right.
- Message area: scrollable, padding 16px, 800ms message bubble entry delay
- Input bar: pinned to bottom of panel. White bg, `#E5E7EB` top border. Text input + teal send button.
- Clio message bubbles: left-aligned, `#F0FDFA` bg, `#164E63` text, 14px, 16px radius
- User message bubbles: right-aligned, `#0891B2` bg, white text, 14px, 16px radius

---

## 5. Position Logic

Clio's position when appearing in States 2 or 3 follows this priority:

1. **Anchor specifies position** → use that position exactly (see Anchor Registry below)
2. **No anchor position specified** → apply contextual rules:
   - If the relevant UI element is in the bottom half of screen → Clio appears top-left or top-center
   - If the relevant UI element is in the top half of screen → Clio appears bottom-right (near FAB)
   - If full screen is relevant (empty state) → Clio appears centered, 40% from top
3. **Panel (State 4)** → always anchored to FAB, bottom-right. No exceptions.

**Screen-specific position constraints** (override contextual rules):
- Pulse tab: Clio Host Mode inline in feed — not floating
- Compose bar: Clio 32px at right end of input — not floating
- Tour tooltips: Clio 40px inside tooltip card — not floating
- Walkthrough slides: Clio 80px centered at top of slide — not floating

---

## 6. Gesture System

When Clio needs to draw attention to a specific UI element, two things happen simultaneously:

**On Clio:**
- Her static PNG switches to the appropriate pointing variant from `clio/assets/source/stills/pointing/`
- The pointing direction is specified in the anchor (right, left, or down)
- If a gesture clip exists (`clio_gesture_point_[direction]_01.mp4`), play it before resolving to the pointing PNG
- After 3 seconds (or when user taps the highlighted element), Clio returns to her pre-gesture mood PNG

**On the target element:**
- A `4px glow ring` renders around the element's bounding box
- Color: `#0891B2` at 70% opacity
- Border radius: matches the element's own border radius
- Animation: `pulse` — opacity cycles 70%→40%→70% over 1.2s, repeating
- The glow ring is on `z-index: 8999` — above screen content, below Clio
- Glow ring dismisses simultaneously with Clio's gesture exit

**Gesture trigger**: Specified per anchor in the Anchor Registry as `gesture: [element_id, direction]`

---

## 7. Exit Conditions and Timeouts

### Exit triggers (all apply unless anchor specifies otherwise)
| Trigger | Action |
|:---|:---|
| User taps `×` dismiss button | Immediate exit. Clio returns to FAB resting state. |
| User taps outside panel or bubble | Immediate exit for State 4 (panel). For State 2 (bubble), tap-outside does not dismiss — only `×` or timeout does. This prevents accidental dismissal. |
| Task completed | Clio exits and does not return for that trigger in this session. |
| Timeout reached | Auto-dismiss per timeout table below. |
| New navigation event (user changes screen) | All overlay states close. Clio re-evaluates anchors for the new screen. |

### Timeout reference table

| Trigger type | Default timeout | Override |
|:---|:---|:---|
| Type F — frontend condition (speech bubble) | 8 seconds | Anchor may specify `timeout: never` |
| Type C — Clio decision (speech bubble) | 12 seconds | Anchor may specify longer |
| Idle loop (State 1 → idle clip) | Loops until exit trigger | — |
| State 3 Prominent (no CTA) | 15 seconds | — |
| State 3 Prominent (with CTA) | Never auto-dismisses | User must act or dismiss |
| State 4 Panel | Never auto-dismisses | User must close or navigate away |
| Gesture glow ring | 3 seconds OR user taps element | — |

### Re-appearance rules
- A proactive trigger (F or C) that was auto-dismissed may not re-fire in the same session
- A proactive trigger that was tap-dismissed may not re-fire for 24 hours
- User-initiated triggers (Type U) may always fire — no re-appearance restriction
- Exception: `F_IDLE_120S` fires **once per session** regardless of how it was dismissed

---

## 8. Anchor Registry

This is the complete specification for every `[CLIO_ANCHOR: anchor_id]` marker in the screen prompts document. Renderers look up the anchor_id here to get the full behavior spec.

---

### WALKTHROUGH ANCHORS

#### `anchor_walkthrough_slide_1`
| Field | Value |
|:---|:---|
| **Screen** | 0.1 — Walkthrough Slide 1 |
| **Trigger type** | F — frontend condition (screen load) |
| **State** | Prominent (80px, centered top) |
| **Mood** | Resting |
| **Asset** | `clio_resting_01.png` |
| **Entry clip** | None — she is present from screen load |
| **Speech** | *"I'm Clio. I find people you'd actually want to know."* |
| **Gesture** | None |
| **Position** | Centered, 80px from top of content area |
| **Exit** | Swipe to next slide |
| **Timeout** | Never |

#### `anchor_walkthrough_slide_2`
| Field | Value |
|:---|:---|
| **State** | Prominent (80px) |
| **Mood** | Curious |
| **Entry clip** | `clio_transition_resting_to_curious.mp4` |
| **Speech** | *"Here's what I do. I sort people into Clusters — small groups built around one specific thing. Age. Location. Purpose. Language. The more specific, the more real."* |
| **Exit** | Swipe to next slide |

#### `anchor_walkthrough_slide_3`
| Field | Value |
|:---|:---|
| **State** | Prominent (80px) |
| **Mood** | Happy |
| **Entry clip** | `clio_transition_curious_to_happy.mp4` |
| **Speech** | *"Your real identity stays private. Nickname only. Nobody sees what you don't show. The people who find their people? They all felt exactly like you do right now."* |
| **Exit** | Swipe to next slide |

#### `anchor_walkthrough_slide_4`
| Field | Value |
|:---|:---|
| **State** | Prominent (80px) |
| **Mood** | Excited |
| **Entry clip** | `clio_transition_happy_to_resting.mp4` then snap to excited PNG |
| **Speech** | *"Tell me a little about yourself. I'll show you who's already here."* |
| **Gesture** | None |
| **Exit** | "Let's go →" button tap |
| **On exit** | Play `clio_gesture_react_success_01.mp4` then transition to Screen 2.1 |

---

### ONBOARDING ANCHORS

#### `anchor_onboarding_tags`
| Field | Value |
|:---|:---|
| **Screen** | 2.3 — Nickname + Tags |
| **Trigger type** | F — tags input field receives focus |
| **State** | Speech Bubble (State 2) |
| **Mood** | Curious (slight asymmetry — playful variant) |
| **Asset** | `clio_curious_02.png` (the more playful variant) |
| **Speech** | *"Pick everything. Especially the weird ones. Those are usually the best matches."* |
| **Gesture** | None |
| **Position** | Speech bubble above tags input field |
| **Timeout** | 5 seconds |
| **Re-appearance** | Does not re-appear after first dismissal |

#### `anchor_onboarding_success`
| Field | Value |
|:---|:---|
| **Screen** | 2.5 — Profile Created |
| **State** | Prominent (80px, centered) |
| **Mood** | Happy |
| **Entry clip** | None — she is the screen |
| **Speech** | *"Good. One more thing and I can start."* |
| **Exit** | "Continue →" button tap |
| **On exit** | `clio_transition_happy_to_resting.mp4` into Screen 2.6 |

#### `anchor_onboarding_conversation`
| Field | Value |
|:---|:---|
| **Screen** | 2.6 — Clio Welcome Conversation |
| **State** | Prominent (80px, centered top) — full screen conversational |
| **Mood sequence** | Resting → Curious (after B1) → Thinking (typing) → Happy (B3) → Curious (pause) → Encouraging (B4) |
| **Entry clip** | None — continues from Screen 2.5 |
| **Exit** | "Show me →" button tap |
| **On exit** | `clio_gesture_react_success_01.mp4` → transition to Explore |

---

### EXPLORE ANCHORS

#### `anchor_explore_loading`
| Field | Value |
|:---|:---|
| **Screen** | 3.1 — Explore First Visit, query running |
| **Trigger type** | F — page load, query in flight |
| **State** | FAB Resting (48px) — processing state |
| **Mood** | Thinking |
| **Asset** | `clio_thinking_01.png` |
| **Idle clip** | `clio_idle_01.mp4` cycling while query runs |
| **Speech** | None during loading. Insight pill text: *"Let me check..."* (pill is a screen element, not Clio overlay) |
| **Exit** | Query resolves → transitions to `anchor_explore_results` or `anchor_explore_zero` |
| **Transition** | `clio_transition_thinking_to_happy.mp4` on results arrival, `clio_transition_thinking_to_curious.mp4` on zero results |

#### `anchor_explore_results`
| Field | Value |
|:---|:---|
| **Screen** | 3.1 / 3.2 — Explore, results loaded |
| **State** | FAB Resting (48px) |
| **Mood** | Resting |
| **Asset** | `clio_resting_01.png` (first visit) / random variant (return) |
| **Entry clip** | First visit: `clio_gesture_react_success_01.mp4` (brief, then settles to resting). Return visit: fade in quietly, no clip. |
| **Speech** | None proactively |
| **Gesture** | None |
| **Timeout** | N/A — resting state, no timeout |

#### `anchor_explore_zero`
| Field | Value |
|:---|:---|
| **Screen** | 3.1 — Explore, zero results |
| **Trigger type** | F — query returns empty |
| **State** | Prominent (80px, centered — she fills the empty state) |
| **Mood** | Curious |
| **Entry clip** | `clio_transition_thinking_to_curious.mp4` |
| **Speech** | *"Nothing yet for [topic] in your area. I check every few hours — I will find you when something lands."* |
| **Gesture** | None |
| **CTA** | Tapping her speech bubble opens State 4 panel: *"Want me to look somewhere else?"* |
| **Timeout** | Never (she is the empty state content) |

#### `anchor_explore_idle_120s`
| Field | Value |
|:---|:---|
| **Screen** | Explore (any) |
| **Trigger type** | F — 120 seconds of browse without tapping a cluster card |
| **State** | Speech Bubble (State 2) — grows from FAB |
| **Mood** | Curious |
| **Entry clip** | Scale FAB from 48px to 56px over 300ms, then bubble appears |
| **Speech** | *"Still looking? Tell me what you are after."* |
| **Gesture** | None |
| **Timeout** | 10 seconds |
| **On tap** | Opens State 4 panel |
| **Re-appearance** | Once per session only |

---

### CLUSTER CREATION ANCHORS

#### `anchor_creation_unmet_need`
| Field | Value |
|:---|:---|
| **Screen** | 5.1 — Clio detects unmet need |
| **Trigger type** | C — Clio's decision after reading user message / zero results |
| **State** | State 4 Panel (opens from FAB) |
| **Mood** | Curious |
| **Entry clip** | FAB scales to panel (280ms ease-out) |
| **Speech — Scenario A** | *"[Topic] in [location]. Let me check what is already here."* followed by typing indicator (1.5s) |
| **Speech — Scenario B** | *"Nothing found for that right now. Let me look for anything close."* |
| **Timeout** | Never (panel) |

#### `anchor_creation_similar_clusters`
| Field | Value |
|:---|:---|
| **Screen** | 5.2 — Similar clusters surface |
| **State** | State 4 Panel (continuous from 5.1) |
| **Mood** | Curious → Happy (when clusters are found) |
| **Transition clip** | `clio_transition_curious_to_happy.mp4` when results render |
| **Speech** | *"I found some spaces that might overlap with what you are after."* |
| **Gesture** | None — cluster cards are inside the panel itself |
| **On "These don't fit"** | Stays in panel, advances to `anchor_creation_disambiguation` |
| **On "Join" tap** | `clio_gesture_react_success_01.mp4` → panel closes → toast "You're in." |

#### `anchor_creation_disambiguation`
| Field | Value |
|:---|:---|
| **Screen** | 5.3 — User insists their need is different |
| **State** | State 4 Panel (continuous) |
| **Mood** | Curious |
| **Speech** | *"Tell me what makes yours different. What would the existing ones not give you?"* |
| **If Clio determines need IS covered** | Mood shifts to Empathetic. Speech: *"What you described is already what [Cluster Name] does. It might be worth trying that one first."* |

#### `anchor_creation_questions`
| Field | Value |
|:---|:---|
| **Screen** | 5.4 — 3 creation questions |
| **State** | State 4 Panel (continuous) |
| **Mood** | Curious (Q1) → Happy (Q2, Q3) → Thinking (after Q3) |
| **Transition clips** | `clio_transition_curious_to_happy.mp4` after Q1 reply. `clio_transition_happy_to_resting.mp4` then snap thinking after Q3. |
| **Gesture — on each user reply** | `clio_gesture_nod_01.mp4` or `clio_gesture_nod_02.mp4` (alternate) |

#### `anchor_creation_confirmation`
| Field | Value |
|:---|:---|
| **Screen** | 5.5 — Brief confirmation card |
| **State** | State 4 Panel (continuous) |
| **Mood** | Happy |
| **Entry clip** | `clio_transition_thinking_to_happy.mp4` |
| **Speech** | *"Here is what I came up with. Does this look right?"* |
| **Gesture** | None |
| **On "Change something" tap** | `clio_gesture_nod_01.mp4` → Mood stays Happy → user input field opens |

#### `anchor_creation_success`
| Field | Value |
|:---|:---|
| **Screen** | 5.6 — Cluster live |
| **State** | Prominent (80px) — panel closes, modal takes over |
| **Mood** | Excited (1s) → settles to Happy |
| **Entry** | Panel closes (300ms scale-to-zero), then modal appears (400ms) with Clio sitting on top edge |
| **Asset** | `clio_excited_01.png` for 1 second, then `clio_transition_resting_to_happy.mp4` resolution |
| **Speech** | *"It is live."* (H1 in modal — screen element). Clio's image is silent. |
| **Timeout** | Never — user must tap "Take me there" |
| **On "Take me there"** | `clio_gesture_react_success_01.mp4` → navigate |

---

### IN-CLUSTER ANCHORS

#### `anchor_pulse_host_mode`
| Field | Value |
|:---|:---|
| **Screen** | 4.1 — Cluster Pulse tab, arc phases A/B/C |
| **State** | Inline (NOT floating) — Clio appears as 40px avatar inside the Pulse feed itself |
| **Mood** | Curious |
| **Asset** | `clio_curious_01.png` at 40px |
| **Speech** | Framing line per cluster context (LLM-generated, cluster_host skill) |
| **Gesture** | None |
| **Note** | This is not the overlay system — Clio is a rendered post in the feed. The overlay FAB (48px) remains separately in bottom-right. |

#### `anchor_pulse_empty`
| Field | Value |
|:---|:---|
| **Screen** | 4.1 — Pulse tab, new cluster, Atlas still populating |
| **Trigger type** | F — `post_count = 0` on load |
| **State** | Prominent (80px, centered in empty pulse area) |
| **Mood** | Resting |
| **Speech** | *"I am gathering what is happening in your space. Check back in a few hours."* |
| **Gesture** | None |
| **Timeout** | Never (she is the empty state) |

#### `anchor_pulse_nonmember_join`
| Field | Value |
|:---|:---|
| **Screen** | 4.1 — Non-Connection viewing Pulse |
| **Trigger type** | C — Clio decides to speak after user has been reading for 30 seconds |
| **State** | Speech Bubble (State 2), positioned top-right of screen |
| **Mood** | Encouraging |
| **Entry clip** | `clio_transition_resting_to_encouraging.mp4` |
| **Speech** | *"Looks like your kind of room."* |
| **Gesture** | Pointing down → sticky "Join Cluster" bar. `clio_pointing_down_01.png` + glow ring on Join button |
| **Timeout** | 8 seconds |

#### `anchor_timeline_compose`
| Field | Value |
|:---|:---|
| **Screen** | 4.2 — Timeline tab, compose bar |
| **State** | Inline (NOT floating) — 32px at right end of compose bar |
| **Mood** | Resting → Thinking when user types |
| **Transition** | `clio_transition_resting_to_thinking.mp4` on first keystroke |
| **Speech** | None proactively |
| **Note** | Inline, not overlay system. FAB still present separately. |

#### `anchor_timeline_empty`
| Field | Value |
|:---|:---|
| **Screen** | 4.2 — Timeline, no posts yet |
| **Trigger type** | F — `post_count = 0` on tab open |
| **State** | Prominent (80px, centered below compose bar) |
| **Mood** | Curious |
| **Speech** | *"Nobody has set the tone yet. The first post tends to define the personality."* |
| **Gesture** | Pointing up → compose bar. `clio_pointing_right_01.png` angled toward bar + glow ring on compose bar |
| **Timeout** | Never (she is the empty state) |

#### `anchor_composer_active`
| Field | Value |
|:---|:---|
| **Screen** | 4.4 — Post Composer |
| **State** | Inline — 32px at right end of compose title/body area |
| **Mood** | Resting → Thinking on typing |
| **On post success** | `clio_gesture_react_success_01.mp4` |
| **Note** | Inline, not overlay. |

#### `anchor_clusterinfo_milestone`
| Field | Value |
|:---|:---|
| **Screen** | 4.5 — Cluster Info Sheet |
| **Trigger type** | C — Cluster reaches 10 Connections (Founder session only) |
| **State** | Speech Bubble (State 2) inside the cluster info sheet — positioned above AGGIL section |
| **Mood** | Happy |
| **Asset** | `clio_happy_01.png` at 40px |
| **Speech** | *"Ten people. That is when clusters start feeling like something."* |
| **Gesture** | None |
| **Timeout** | Never — dismissible by swipe. Shown once only, never again. |

---

### PROACTIVE / CONTEXTUAL ANCHORS

#### `anchor_user_dormant`
| Field | Value |
|:---|:---|
| **Screen** | Explore (on session open, after 7+ day absence) |
| **Trigger type** | C — Yantra reads last_active from USER.md |
| **State** | Speech Bubble (State 2), appearing near top of cluster card feed |
| **Mood** | Curious |
| **Speech** | *"The people in [cluster name] have been posting about [topic]. Just flagging."* |
| **Gesture** | Pointing toward the relevant cluster card. Glow ring on that card. |
| **Gesture direction** | Determined at runtime based on card position |
| **Timeout** | 12 seconds |

#### `anchor_cluster_unvisited`
| Field | Value |
|:---|:---|
| **Screen** | Explore or Activity feed |
| **Trigger type** | C |
| **State** | Speech Bubble (State 2) |
| **Mood** | Curious |
| **Speech** | *"I noticed you joined [cluster name]. There is a discussion about [topic] — worth a look."* |
| **Gesture** | Pointing toward the cluster entry point. Glow ring on cluster card or activity row. |
| **Timeout** | 12 seconds |

#### `anchor_cluster_first_post_nudge`
| Field | Value |
|:---|:---|
| **Screen** | Cluster Info Sheet or Pulse tab (Founder session, 24h after creation, post_count = 0) |
| **Trigger type** | C |
| **State** | Speech Bubble (State 2) |
| **Mood** | Encouraging |
| **Speech** | *"Still figuring out the first post? I have queued one conversation starter — no pressure."* |
| **Timeout** | 10 seconds |

#### `anchor_first_post_acknowledgement`
| Field | Value |
|:---|:---|
| **Screen** | Cluster Pulse tab (fired within 60s of first post) |
| **Trigger type** | C — `post_count` transitions 0 → 1 |
| **State** | Inline in Pulse feed — Clio posts as a cluster message (cluster_host skill) |
| **Mood** | Resting |
| **Speech** | One sentence, no praise, no emoji. LLM-generated by cluster_host skill. |
| **Note** | This is a feed post, not an overlay. Counts toward 2-message/24h limit. |

#### `anchor_cluster_silent_72h`
| Field | Value |
|:---|:---|
| **Screen** | Cluster Pulse tab |
| **Trigger type** | C — 72h silence after `post_count ≥ 1` |
| **State** | Clio posts a Pulse item (cluster_host skill) — not an overlay |
| **Mood** | Curious |
| **Note** | Counts toward 2-message/24h limit. Max 1 per 72h window. |

#### `anchor_member_return`
| Field | Value |
|:---|:---|
| **Screen** | Cluster Pulse tab (on return after 7+ days, if something happened) |
| **Trigger type** | C |
| **State** | Speech Bubble (State 2), top of Pulse feed |
| **Mood** | Resting |
| **Speech** | One sentence referencing what happened while user was away. If nothing specific happened — no appearance. Silence. |
| **Timeout** | 10 seconds |

---

### PROFILE ANCHOR

#### `anchor_profile_incomplete`
| Field | Value |
|:---|:---|
| **Screen** | 7.1 — My Profile (You tab), bio empty OR interests < 3 |
| **Trigger type** | F — condition detected on screen load |
| **State** | Speech Bubble (State 2) — inline banner strip below profile card |
| **Mood** | Curious |
| **Asset** | `clio_curious_01.png` at 32px |
| **Speech** | *"Your profile is sparse. I cannot match you well without more to work with."* |
| **Gesture** | Pointing right → "Add Bio" link. Glow ring on bio section. |
| **Timeout** | Never — dismissible by tap anywhere on banner. Not shown when profile is complete. |

---

### TOUR ANCHORS

#### `anchor_tour_welcome`
| Field | Value |
|:---|:---|
| **Screen** | 8.1 — Tour: Clio Welcome |
| **State** | Prominent (80px, centered modal) |
| **Mood** | Resting |
| **Speech** | *"This is home. Quick tour — takes a minute."* |
| **Exit** | "Show me" → `clio_transition_resting_to_curious.mp4` → next step |

#### `anchor_tour_explore_tab`
| Field | Value |
|:---|:---|
| **Screen** | 8.2 — Tour: Explore Tab |
| **State** | Prominent (40px inline in tooltip) |
| **Mood** | Curious |
| **Gesture** | Pointing down → Explore tab in bottom nav. Glow ring on Explore tab. |
| **Speech** | *"This is where you start. I have already sorted through everything for you."* |
| **Exit** | "Next" → `clio_gesture_nod_01.mp4` → `clio_transition_curious_to_happy.mp4` |

#### `anchor_tour_fab`
| Field | Value |
|:---|:---|
| **Screen** | 8.3 — Tour: Clio FAB |
| **State** | Prominent (40px inline in tooltip) + FAB spotlit |
| **Mood** | Encouraging |
| **Gesture** | Glow ring on FAB (pulsing). No pointing PNG — Clio IS the FAB here. |
| **Speech** | *"This is me. If you need something — a cluster, a direction, anything — just tap. I will be there."* |
| **Exit** | "Next" → `clio_gesture_nod_01.mp4` |

#### `anchor_tour_cluster_pulse`
| Field | Value |
|:---|:---|
| **Screen** | 8.4 — Tour: Cluster Cards and Pulse |
| **State** | Prominent (40px inline in tooltip) |
| **Mood** | Happy |
| **Gesture** | Pointing right → first cluster card in list. Glow ring on card. |
| **Speech** | *"These are clusters I think you would fit. Inside each one — I post things worth talking about. That is where you will find your people. Go. I will be around."* |
| **Exit** | "Let's go" → `clio_gesture_react_success_01.mp4` → Clio settles to FAB resting state |

---

### AMA + CALIBRATION ANCHORS

> These anchors govern Clio's discovery calibration system, accessible via the Tune ⚙
> icon on the Explore top bar. Clio infers the user's intent from a free-text conversation
> and sets five parameters internally: age range, location radius, gender filter,
> tags/purpose, and discovery mode (relevance / variety / both). No parameters are
> surfaced as sliders or toggles in the conversation — they are Clio's inference,
> summarised and confirmed before being applied.

#### `anchor_explore_ama_entry`
| Field | Value |
|:---|:---|
| **Screen** | 3.1 / 3.2 — Explore (any state) |
| **Trigger type** | U — user taps Tune ⚙ icon on Explore top bar |
| **State** | State 4 Panel — unique origin: grows downward-left from top-right (Tune icon position), not upward from FAB |
| **Panel origin** | `transform-origin: top right` — only exception to the standard bottom-right panel anchor |
| **Mood** | Curious |
| **Asset** | `clio_curious_01.png` at 32px in panel header |
| **Entry clip** | `clio_transition_resting_to_curious.mp4` plays in FAB as panel opens |
| **Speech — first open (no calibration active)** | *"Tell me what you are actually looking for. Don't filter yourself — the more honest the answer, the better I can find it."* |
| **Speech — re-open (calibration already active this session)** | *"You are currently set to [one-line summary of active calibration]. Change something or start fresh?"* |
| **Re-open options** | "Change something" (teal filled) → `anchor_explore_ama_conversation`. "Start fresh" (gray outlined) → resets all parameters to AGGIL defaults, panel closes, Explore reloads, tune dot clears. |
| **Timeout** | Never (State 4 panel) |

#### `anchor_explore_ama_conversation`
| Field | Value |
|:---|:---|
| **Screen** | 3.3 — AMA Panel, active conversation |
| **Trigger type** | Continuous from `anchor_explore_ama_entry` |
| **State** | State 4 Panel (continuous) |
| **Mood** | Curious throughout. Shifts to Thinking during inference (after user's reply). |
| **Transition clip** | `clio_transition_curious_to_thinking.mp4` while Clio processes user reply (1.5s typing indicator) |
| **Follow-up rule** | Max ONE follow-up question per session. Clio asks only if the reply is genuinely ambiguous — exploratory intent ("just exploring", "see what's out there", "not sure yet"). Specific replies (named interest + location) go directly to confirmation. |
| **Gesture on user reply** | `clio_gesture_nod_01.mp4` or `clio_gesture_nod_02.mp4` (alternate per reply) |
| **Profile gap note** | If user mentions an interest not in their AGGIL profile, Clio notes it inline: *"I don't have [topic] in your profile yet. I'll include it for this session."* — no redirect to profile, no pressure. |
| **Inference outputs (internal — never labelled for user)** | Age range (expand, keep, narrow). Location radius (neighbourhood / city / region). Gender filter. Tags / purpose. Discovery mode: Relevance (tight parameters, high precision score targets) / Variety (broad parameters, diverse results) / Both (balanced). |
| **Discovery mode inference rules** | Exploratory language → Variety. Specific named interest + location → Relevance. Both specific AND "open to discovering more" → Both. When unclear, default to Both. |
| **Timeout** | Never (State 4 panel) |

#### `anchor_explore_ama_confirm`
| Field | Value |
|:---|:---|
| **Screen** | 3.3 — AMA Panel, confirmation state |
| **Trigger type** | Continuous from `anchor_explore_ama_conversation` after inference completes |
| **State** | State 4 Panel (continuous) |
| **Mood** | Thinking → Resting (transition clip plays as summary card renders) |
| **Transition clip** | `clio_transition_thinking_to_happy.mp4` as the summary card appears |
| **Speech** | *"Got it. Here is what I am going to look for —"* then summary card renders |
| **Summary card** | White card, 16px radius, Elevation 1. Fields: Looking for / Area / Who / Age / Topics. Mode (Relevance / Variety / Both) is NOT shown to user — it governs the query silently. |
| **"Adjust something" tap** | Summary card fields become individually tappable. Each tapped field opens the existing settings panel for that parameter (settings panel visual already designed — insert existing asset). After adjustment: *"Done. I will factor that in."* Clio mood stays Resting. Returns to confirmation with updated card. |
| **"Looks right — show me" tap** | `clio_gesture_react_success_01.mp4` → panel closes (scale to zero, 280ms) → Explore reloads with calibrated parameters → Tune icon active dot appears → `anchor_explore_calibrated` takes effect |
| **Timeout** | Never |

#### `anchor_explore_calibrated`
| Field | Value |
|:---|:---|
| **Screen** | 3.4 — Explore with calibration in effect |
| **Trigger type** | F — calibration was applied this session (active dot present on Tune icon) |
| **State** | FAB Resting (48px). Clio does not proactively speak on calibrated Explore load — the insight pill does the communication. |
| **Mood** | Resting |
| **Insight pill text** | Relevance mode: *"Showing clusters that specifically match what you described."* Variety mode: *"Opening up the range — here is what is active in your broader area."* Balanced mode: *"Mixing close matches with a few wider options."* |
| **Calibrated zero results** | Clio Prominent (80px, Curious). Speech: *"Nothing fits those settings exactly. Want me to adjust one thing?"* Two buttons: "Adjust settings" (reopens AMA panel at `anchor_explore_ama_entry` update mode) / "Show me anything" (resets to AGGIL defaults, clears active dot). |
| **Timeout** | N/A — resting state |

#### `anchor_explore_poor_results_nudge`
| Field | Value |
|:---|:---|
| **Screen** | 3.2 — Explore, return visit (no calibration active) |
| **Trigger type** | C — Clio reads USER.md and detects: user has visited Explore 2+ times this session, has not tapped any cluster card, and no calibration has been set |
| **State** | Speech Bubble (State 2), bottom-left — near but distinct from FAB |
| **Mood** | Curious |
| **Entry clip** | FAB scales from 48px to 56px briefly, then bubble appears |
| **Speech** | *"Not finding what you are after? Tap ⚙ and tell me more — I can narrow this down."* |
| **Gesture** | Pointing up-right toward Tune icon. `clio_pointing_right_01.png` + glow ring on Tune ⚙ icon. |
| **Timeout** | 10 seconds |
| **Persistence rule** | **Once per session only.** If user ignores or taps dismiss — Clio does not raise this again in the session, even if browsing continues. She drops it. |
| **Re-appearance** | Not before next session. No exceptions. |

---

### FEATURE PROGRESSION ANCHORS

> These anchors govern Clio's behavioural progressive disclosure system.
> The user never sees a stage number or knows features are locked.
> Clio introduces each feature as something she noticed was relevant — never as
> something that was previously unavailable.

#### `anchor_feature_intro_activity`
| Field | Value |
|:---|:---|
| **Screen** | 6B.1 — Activity introduction (fires on Explore, same session as Stage 2 unlock) |
| **Trigger type** | C — `C_STAGE2_READY` signals met, `stage_2_introduced = false` |
| **State** | State 4 Panel — opens from FAB |
| **Mood** | Curious |
| **Asset** | `clio_curious_01.png` at 32px in panel header |
| **Entry clip** | `clio_transition_resting_to_curious.mp4` |
| **Pre-condition** | Activity tab MUST be visible in bottom nav before panel opens. Nav updates first (silent), then Clio speaks. |
| **Speech** | *"There is a tab keeping track of everything happening in your clusters. Worth a look when you are ready."* |
| **Gesture** | Pointing down → Activity tab in bottom nav. `clio_pointing_down_01.png` + glow ring on Activity tab icon. Glow holds 4s then fades. |
| **Timeout** | 12 seconds auto-dismiss |
| **On Activity tab tap** | Panel dismisses immediately — user is acting on the introduction |
| **Fires once** | `stage_2_introduced` set to `true` after firing. Never fires again. |

#### `anchor_feature_intro_dm`
| Field | Value |
|:---|:---|
| **Screen** | 6B.2 — DM introduction (fires at session open after Stage 3 flag set) |
| **Trigger type** | C — `C_DM_INTRO_ON_OPEN` — detected at session start |
| **State** | State 4 Panel — opens automatically without user tap. FAB was in resting state. |
| **Timing** | Session open → Explore loads → 2 second pause → panel opens. Does not interrupt loading. |
| **Mood** | Resting — she is delivering information, not celebrating |
| **Asset** | `clio_resting_01.png` at 32px in panel header |
| **Entry clip** | None — quiet open, scale from FAB 280ms |
| **Speech** | *"You can reach people directly now. Open any cluster, go to Connections, tap a name."* |
| **Gesture** | None — path described in words |
| **Timeout** | 12 seconds auto-dismiss |
| **Fires once** | `stage_3_introduced` set to `true` after firing. Never fires again. |

#### `anchor_feature_reintro`
| Field | Value |
|:---|:---|
| **Screen** | 6B.3 — Re-introduction (fires at session open, 2+ return visits after unlock with no use) |
| **Trigger type** | C — `C_FEATURE_UNUSED` — Clio checks on session open for each unlocked-but-unused feature |
| **State** | State 4 Panel — opens automatically at session start (same delay as DM intro: 2s after Explore loads) |
| **Mood** | Curious |
| **Speech — Activity unused** | *"You have not been to Activity yet. That is where I keep track of what is happening across your clusters."* |
| **Speech — DM unused** | *"You have not messaged anyone yet. It is there when you want it — Connections tab, tap a name."* |
| **Gesture — Activity** | Pointing down → Activity tab. Glow ring 4s. |
| **Gesture — DM** | None |
| **Timeout** | 12 seconds auto-dismiss |
| **Fires once per feature** | `reintro_fired.activity` or `reintro_fired.dm` set to `true`. Never fires again for that feature. |
| **Priority** | If both Activity and DM are unlocked-but-unused, fire Activity re-intro first. DM re-intro on the following session. |


### EVANGELIST ANCHORS

> These anchors govern the accelerated onboarding path for users arriving via direct
> Aggilo team invite. Their purpose and interests are pre-loaded into USER.md from the
> invite payload before session start. Clio does not re-ask what she already knows.

#### `anchor_evangelist_welcome`
| Field | Value |
|:---|:---|
| **Screen** | 2.6E — Evangelist welcome (replaces standard 2.6) |
| **Trigger type** | F — `user.invite_type = "evangelist"` detected at session start |
| **State** | Prominent (80px, centered) — full screen, same as standard 2.6 |
| **Mood** | Resting → Happy (after inline cluster preview renders) |
| **Entry clip** | Continuous from Screen 2.5 — no re-entry animation |
| **Transition clip** | `clio_transition_resting_to_happy.mp4` as cluster preview card appears |
| **Speech B1** | *"I've been waiting for someone who wants [stated purpose]. Let me show you what is already here."* |
| **Speech B2** | *"[N] clusters match what you described. Here is the one I would start with."* |
| **Speech B3** | *"Tap to go in. I'll be around if you need direction."* |
| **Invite context card** | Shown before Clio speaks — white card with pre-loaded purpose/interests/location from invite form |
| **Gesture B2** | Pointing down toward inline cluster preview card. `clio_pointing_down_01.png` + glow ring on card. |
| **Exit** | "Show me all matches →" → `clio_gesture_react_success_01.mp4` → Screen 3.1E |
| **Tour** | Skipped entirely — no Screens 8.1–8.4 for evangelist users |
| **Timeout** | Never |

#### `anchor_evangelist_explore`
| Field | Value |
|:---|:---|
| **Screen** | 3.1E — Explore, evangelist first visit |
| **Trigger type** | F — `user.invite_type = "evangelist"` AND first Explore load |
| **State** | FAB Resting (48px) — Clio does not speak proactively. She has done the work already. |
| **Mood** | Resting |
| **Insight pill** | *"[N] clusters ready for you. I started from what you told us."* — pre-loaded, no shimmer |
| **60s idle trigger** | Still fires if user browses without tapping — same rule as standard users |
| **Timeout** | N/A — resting state |


### INVITE ANCHORS

#### `anchor_invite_qualification`
| Field | Value |
|:---|:---|
| **Screen** | 9.1 — Invite Landing |
| **State** | Prominent (40px, above qualification form) |
| **Mood** | Resting |
| **Speech** | *"I need to check a couple of things. Nothing you share here gets shown to anyone."* |
| **Timeout** | Never |

#### `anchor_invite_failed`
| Field | Value |
|:---|:---|
| **Screen** | 9.3 — Qualification Failed |
| **State** | Prominent (60px, head tilt — empathetic) |
| **Mood** | Empathetic |
| **Asset** | `clio_empathetic_02.png` (slight head tilt variant) |
| **Entry clip** | `clio_transition_resting_to_empathetic.mp4` |
| **Speech** | *"This cluster has its own filters, and the match did not land this time. I am already looking at others for you."* |
| **On "Explore" tap** | `clio_transition_empathetic_to_encouraging.mp4` |
| **Timeout** | Never |

---

## 9. User-Initiated Flow (Type U)

When the user taps the FAB (`U_FAB_TAP`) or taps an insight pill (`U_PILL_TAP`) or taps a speech bubble (`U_BUBBLE_TAP`):

1. If Clio is in FAB Resting (State 1) → play FAB scale animation (48px → panel over 280ms) → open State 4 Panel
2. If Clio is in Speech Bubble (State 2) → collapse bubble, expand to State 4 Panel from same position
3. If Clio is in Prominent (State 3) → transition to State 4 Panel from Clio's current position
4. Yantra receives the full USER.md + MEMORY.md context + the triggering screen anchor ID
5. Clio responds in context. The conversation continues until user closes the panel.

**Inside the panel — mood tracking:**
- Clio's header avatar updates to reflect her current mood as the conversation evolves
- Mood transitions play in the 32px header avatar when mood changes
- Clips play at 32px (no scaling — clips are designed for FAB size range)

---

## 10. What This Document Does Not Own

| Topic | Owned by |
|:---|:---|
| Screen layout and component structure | `mobile_screen_prompts_phase1.md` |
| Clio's character, voice, values, guardrails | `clio_character_prompt.md` |
| Backend trigger logic and arc phase rules | `AGENTS.md` |
| LLM configuration and persona loading | `AGENTS.md` |
| Atlas cluster content pipeline | `atlas/AGENTS.md` |
| Scout scoring | `AGENTS.md` — scout_llm section |
| Crisis protocol detail | `AGENTS.md` — Crisis Response Protocol |

---

*This document is a renderer/developer spec. Changes to anchor IDs must be propagated to `mobile_screen_prompts_phase1.md` simultaneously.*
