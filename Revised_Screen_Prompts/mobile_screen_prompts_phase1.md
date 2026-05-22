> [!NOTE]
> **Microinteraction and Motion Specification:**
> For all animation, motion, and interaction choreography for cluster-specific
> UI elements (Clio top-right overlay, agent chatbox, Features tab, @Sage, Sage
> Anchor presence), see:
> `Revised_Screen_Prompts/CLUSTER_UI_MICROINTERACTIONS.md`
> That document is subordinate to this one for visual identity but takes
> precedence for motion and microinteraction behaviour.

# 📱 Aggilo Mobile — Phase 1 Launch Screen Prompts

> **What this document is**: The canonical UI design system and AI image-generator screen prompts for the Aggilo Phase 1 launch. This is a **standalone document** — it does not inherit from or require `mobile_screen_prompts_v1.md`. Phase 1 constraints are fully baked in.
>
> **Scope**: This document covers **screen layout and rendering only** — what appears on screen, where it appears, and how it is structured visually. Every `[CLIO_ANCHOR: anchor_id]` marker is a hook point only — the full behaviour spec for that anchor lives in **`clio_overlay_prompt.md`**. Clio's character, voice, and personality live in **`clio_character_prompt.md`**. Screen prompts own neither.
>
> **Not present screens**: Some screens show `[CLIO]` with "Not present" — these are system-level screens (auth, moderation, invite forms) where Clio does not appear at all.
>
> **Clio visual identity**: Clio's appearance is defined by the reference image **`resting01.png`**. All screen prompts depicting Clio must reproduce this visual accurately. Do not invent an alternative design.
>
> **Phase 1 definition**: Launch through ~10k platform users. Full backend, AI agents (Clio, Scout, Atlas), and all infrastructure operate at full capacity. **Only the UI surface is simplified.**
>
> **Reference**: `launch/phase_1/README.md` is the canonical constraint spec. If this document and the README conflict, the README wins.

---

## 🔒 Phase 1 UI Constraints (Non-Negotiable)

| Feature | Phase 1 State | Unlocks At |
|---------|---------------|------------|
| Search bar | ❌ Hidden | ~10k users |
| Central "+" FAB | ❌ Removed permanently — Clio owns creation | — |
| Cluster creation wizard | ❌ Hidden — Clio-only via panel | — |
| Create cluster "+" icon (Explore top bar) | ✅ Unlocks after 2 clusters joined or created | 2 cluster milestone |
| Activity tab | ✅ Hidden at launch — Clio unlocks at Stage 2 (same session) | Clio-gated |
| DM / direct messaging | ✅ Hidden at launch — Clio unlocks at Stage 3 (next session) | Clio-gated |
| Standalone DM tab | ❌ Removed permanently — DMs live strictly inside clusters | — |
| Media tab in clusters | ❌ Hidden | ~10k users |
| Home tab | ❌ Does not exist | — |
| Advanced AGGIL filter panel | ❌ Hidden | ~50k users |
| Premium tier / AI Matchmaker | ❌ Hidden | ~100k users |
| Scout suggestion sidebar | ❌ Hidden | ~50k users |
| 5-tab bottom nav | ❌ Replaced by 3-tab | — |
| Post type pills (Write / Ask) | ❌ Removed — single composer only | — |
| My Clusters strip in Explore | ✅ Appears after first cluster join | First join |

---

## 🎨 UI Design System

### Color Palette — "Ocean Calm"

| Token | Hex | Usage |
|-------|-----|-------|
| **Primary** | `#0891B2` | CTA buttons, active tabs, FAB, links, logo |
| **Primary Dark** | `#0E7490` | Hover/pressed states |
| **Primary Tint** | `rgba(8,145,178,0.08)` | Selected chip backgrounds |
| **Secondary** | `#164E63` | Headings, nav text, dark cards |
| **Accent** | `#F59E0B` | Amber-gold — Founder badge, highlights |
| **Accent Light** | `#FEF3C7` | Gold tint backgrounds |
| **Success** | `#16A34A` | Checkmarks, available status, OTP verified |
| **Warning** | `#F59E0B` | Pending states |
| **Error** | `#EF4444` | Validation errors, danger actions |
| **Background** | `#FFFFFF` | Main screen background |
| **Surface** | `#F0FDFA` | Card backgrounds — very light teal tint |
| **Surface Elevated** | `#FFFFFF` | Cards, modals, sheets (with shadow) |
| **Text Primary** | `#164E63` | Body text, headings |
| **Text Secondary** | `#6B7280` | Subtitles, timestamps, helper text |
| **Text Tertiary** | `#9CA3AF` | Disabled, inactive tabs |
| **Divider** | `#E5E7EB` | Section separators |

### Typography

| Style | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| **H1** | Inter | 28px | 700 | Screen titles |
| **H2** | Inter | 22px | 600 | Section headings |
| **H3** | Inter | 18px | 600 | Card titles |
| **Body** | Inter | 16px | 400 | Post content, descriptions |
| **Body Small** | Inter | 14px | 400 | Stats, timestamps |
| **Caption** | Inter | 12px | 400 | Badges, tags |
| **Button** | Inter | 16px | 600 | CTA buttons |
| **Tab** | Inter | 14px | 500 | Tab bar labels |


### Feature Progression System

> Clio gates feature availability based on observed user behaviour — not hard counters or
> time elapsed. The user never knows they are in a stage. Clio tracks silently and
> introduces new features conversationally via her FAB panel when she decides the user
> is ready. Stages are permanent once unlocked. The progression is linear by default;
> Clio may accelerate if signals are unusually strong but never skips a stage.

#### The Three Stages

| Stage | Features Available | Bottom Nav |
|:------|:------------------|:-----------|
| **Stage 1 — Clusters** | Explore, Cluster Timeline, Members, You | Explore + You only (Activity hidden) |
| **Stage 2 — Activity** | Everything in Stage 1 + Activity tab | Explore + Activity + You |
| **Stage 3 — DM** | Everything in Stage 2 + DM via Members tab action sheet | Explore + Activity + You (DM within clusters) |

#### Stage 1 → Stage 2 Unlock (Activity tab)

Clio evaluates the following signals. No single signal is sufficient — Clio weighs the
combination and decides when the pattern is strong enough.

| Signal | Weight |
|:-------|:-------|
| User opened a cluster they joined (went inside, not just joined from Explore) | High |
| User read at least one Timeline post | Medium |
| User returned to the app a 2nd time after joining a cluster | High |
| User responded to a Clio nudge or question | Medium |

**Unlock timing:** Same session — Activity tab appears in the bottom nav the moment Clio
decides the user is ready, without requiring a return visit.

**Introduction:** Clio opens her FAB panel and says one sentence. She does not name the
feature, she points to it. The tab is already visible when she speaks.
Anchor: `anchor_feature_intro_activity`

#### Stage 2 → Stage 3 Unlock (DM)

Clio evaluates the following signals:

| Signal | Weight |
|:-------|:-------|
| User posted or commented in Timeline | High |
| User reacted to a post (like / share) | Medium |

**Unlock timing:** DM does NOT activate in the same session signals are met. Clio sets
a flag in USER.md. On the user's **next session open**, the Members tab action sheet
gains the "Message" option and Clio introduces it.

**Introduction:** On session open (next visit after unlock), Clio's FAB panel opens
automatically with one sentence. She does not explain DM — she points to a member row
and hints at what is there.
Anchor: `anchor_feature_intro_dm`

#### Re-introduction Rule

If a feature is unlocked but the user has not used it after 2 return visits, Clio
surfaces a single re-introduction in the FAB panel. One sentence. Once only. If the
user still does not engage, Clio does not mention it again — the feature remains
available silently.
Anchor: `anchor_feature_reintro`

#### Accelerated Unlock

If a user demonstrates unusually strong signals in Stage 1 (e.g. posts in Timeline on
first visit, responds to Clio, opens multiple clusters), Clio may compress the
Stage 1 → Stage 2 evaluation and unlock Activity in the same session. She cannot
skip Stage 2 to unlock DM directly — DM always requires the next-session rule.

#### USER.md Fields Required

```yaml
feature_stage: 1                   # 1, 2, or 3 — current stage
stage_2_signals_met: false         # true when Clio has decided Stage 2 is earned
stage_3_signals_met: false         # true when Clio has decided Stage 3 is earned
stage_3_unlock_session: null       # session ID when Stage 3 flag was set
stage_2_introduced: false          # true after Clio has introduced Activity
stage_3_introduced: false          # true after Clio has introduced DM
stage_2_used: false                # true after user has tapped Activity tab
stage_3_used: false                # true after user has opened a DM thread
reintro_fired:                     # which features have had re-intro fired
  activity: false
  dm: false
```

### Phase 1 Bottom Navigation Bar

```
┌────────────────────────────────────────────────────┐
│                                                    │
│     ⚡ Explore        [📬 Activity — Stage 2+]        👤 You    │
│     (active)                                       │
└────────────────────────────────────────────────────┘
```
- White bg, top border `#E5E7EB` 1px
- Active tab: `#0891B2` icon (filled) + teal label
- Inactive tab: `#9CA3AF` icon (outlined) + gray label
- **No central "+" FAB** — it does not exist in Phase 1
- Safe area padding at bottom (34px on iPhone)

> **Clio FAB — two positions depending on context:**
> - **Outside clusters** (Explore, Activity, Settings, Profile): bottom-right, 48px, 16px from edge, 72px above bottom nav. This is the default.
> - **Inside clusters** (Timeline, Members, Features, Cluster Info): **top-right, 40px**, 16px from right edge, 8px below cluster top bar. Fixed — does not scroll. Panel expands downward-leftward from Clio's position. Panel header shows "Clio · Private" + timer ("Clears in Xh Xm"). Minimize (—) + Close (X) both present.

### Clio FAB (Floating Action Button)

| Property | Spec |
|----------|------|
| **Visual** | Clio face as per `resting01.png` — exact likeness, no variation |
| **Size (outside clusters)** | 48px circle |
| **Size (inside clusters)** | 40px circle |
| **Position (outside clusters)** | Bottom-right, 16px from edge, 72px above bottom nav |
| **Position (inside clusters)** | Top-right, 16px from right edge, 8px below cluster top bar. Fixed — does not scroll. |
| **Background** | Peach Clio face on subtle teal ring border |
| **Shadow** | Elevation 2: `0 4px 12px rgba(0,0,0,0.12)` |
| **Availability** | All screens |
| **Tap action** | Opens Clio floating overlay panel (see below) |

### Clio Chat — Floating Overlay Panel

Clio's chat is a **floating overlay panel**, not a modal or bottom sheet. This is a deliberate design decision: Clio is an assistant at service, not an interruption.

| Property | Spec |
|----------|------|
| **Type** | Floating panel — anchored to FAB, grows from it |
| **Width** | ~320px (does not span full screen width) |
| **Max height** | ~65% of screen height |
| **Background** | White panel, 20px radius top corners, Elevation 3 shadow |
| **Backdrop** | **None** — underlying screen remains fully visible and live. No dimming. |
| **Entry animation (outside clusters)** | Panel expands from FAB position (scale from 0, `transform-origin: bottom right`) |
| **Entry animation (inside clusters)** | Panel expands downward-leftward from top-right FAB (`transform-origin: top right`) |
| **Dismiss** | Tap outside panel, swipe down, or X button |
| **Header (outside clusters)** | Clio avatar (40px) left + "Clio" teal bold label center + X close right |
| **Header (inside clusters)** | Clio avatar (40px) left + "Clio · Private" teal bold label center + minimize (—) + X close right. Timer "Clears in Xh Xm" in gray 11px below label. |
| **Chat area** | Scrollable message thread inside panel |
| **Input** | Text input with send button, pinned to bottom of panel |
| **Feel** | Like an assistant sitting beside you — not a window you enter |

### Cluster Cards (Explore)

Each card displays the cluster's defining parameters so users immediately understand who it is for and where it operates. **Four parameters are always visible**: age range, gender, location(s), and tags.

```
┌────────────────────────────────────────────┐
│  [Cover Image — 16:9, rounded top corners] │ VERY ACTIVE badge (top-right)
│  ♀ Women only  ← demographic pill overlay  │ (bottom-left of image)
├────────────────────────────────────────────┤
│  Cluster Name (H3, bold, #164E63)          │
│  👥 45 members                             │
│                                            │
│  LOCATION ROW:                             │
│  [📍 Banjara Hills] [📍 Gachibowli] [+2 📍]│
│  — max 2 locations visible; "+N 📍" chip   │
│    expands inline to show all locations    │
│                                            │
│  TAG ROW:                                  │
│  [#CareerCraft] [#Startup] [+4 tags]        │
│  — max 3 tags visible; "+N tags" chip      │
│    expands inline to show all tags         │
│                                            │
│  AGGIL PARAMS: [20-50 yrs] [English, Hindi]│
│  ✨ Clio insight line (14px, teal italic)  │
│                        [View Cluster →]    │
└────────────────────────────────────────────┘
```

**Location expand behaviour**: Tapping "+N 📍" chip inserts the remaining location chips inline (no modal or sheet). The chip becomes a "Show less" affordance. **Animation**: 200ms ease-out smooth transition to prevent layout jump and avoid disorienting the user mid-scroll.

**Tag expand behaviour**: Tapping "+N tags" chip inserts remaining tag chips inline. Same collapse affordance. **Animation**: 200ms ease-out smooth transition.

- White bg, 16px radius, Elevation 1 shadow
- **AGGIL Params Visual Hierarchy**: The `[20-50 yrs]` and `[English, Hindi]` pills must be visually subdued (e.g., light gray borders, muted text, no background fill) so they do not compete with the primary Title, the demographic overlay, or the Teal CTA button.
- **NO score/match percentage shown**
- **NO search bar — Clio curates all cards**

### Cluster Interior Tab Bar (Phase 1)

```
┌──────────────────────────────────────────────────────────────┐
│  📸 Timeline (DEFAULT)  │  👥 Members  │  ✨ Features        │
└──────────────────────────────────────────────────────────────┘
```
- Timeline is the **active default tab** on every cluster open
- Active tab: `#0891B2` text + 2px teal underline
- **Features tab** is the third tab — visible in premium clusters. Shows status-grouped feature cards (Live → In Testing → Scheduled → Approved → Proposed). Empty state: "🌱 Nothing here yet. Sage and Clio are getting to know this community."
- **No Media tab in Phase 1**

### New Cluster Screen Elements (v2.2)

#### @Sage Tip Bar

Appears **below the compose bar, above the agent chatbox panel**, on first cluster visit only.

```
┌──────────────────────────────────────────────────────────────┐
│  💡 Use @Sage in your message to get her attention.  [Got it ✕] │
└──────────────────────────────────────────────────────────────┘
```

| Property | Spec |
|----------|------|
| **Height** | 40px |
| **Background** | `#F0F9FF` (same as chatbox) |
| **Entry** | Slides up 2 seconds after Timeline first render |
| **Dismiss** | Permanent — never shown again after [Got it ✕] tap |
| **Trigger** | First cluster visit only (per user, per cluster) |

#### Agent Collaboration Chatbox Panel

> **Placement (cluster-maturity-aware):**
> - **Cold start** (`post_count < 5` OR `member_count < 10`): top of feed — directly below the cluster header, above the first Timeline post. This is the first thing a member sees on entry; the chatbox sets the room's tone before any post is rendered.
> - **Active** (`post_count ≥ 5` AND `member_count ≥ 10`): between Timeline and compose bar (default V3 placement). The Timeline is now the primary surface; the chatbox becomes contextual reference.
>
> The transition is permanent once thresholds are crossed.

Fixed — does not scroll with Timeline content.

```
┌──────────────────────────────────────────────────────────────┐
│  🔵 Clio & Sage — Working on [Cluster Name]          [—]     │
│  ─────────────────────────────────────────────────────────── │
│  Sage: "The last three posts all circled the same question…" │
│  Clio: "Worth naming directly. I'll watch for the right…"   │
│  2h ago · See full discussion →                              │
└──────────────────────────────────────────────────────────────┘
```

| Property | Spec |
|----------|------|
| **Background** | `#F0F9FF` (light blue) |
| **Border-left** | 2px `#0891B2` (teal) |
| **Header** | "🔵 Clio & Sage — Working on [Cluster Name]" + minimize [—] button |
| **Preview** | Last Sage message + last Clio response (3 lines each max) |
| **Timestamp** | "Xh ago · See full discussion →" |
| **Full history** | "See full discussion" → full-screen bottom sheet (chronological, never deleted) |
| **Minimized state** | Single header line with new exchange count badge |
| **Default** | Expanded. User minimizes — state persists per device. |
| **Never deleted** | Chatbox history is permanent cluster content |

### Clio AI Assistant — Screen Presence Reference

This table covers only **where and how Clio appears on screen** per context. Clio's character, moods, voice, personality, and micro-animation behaviour are defined in **`clio_character_prompt.md`** and must not be authored here.

| Mode | Visual Presence | When Used |
|------|-----------------|-----------|
| **Peeping (outside clusters)** | Clio FAB (48px), bottom-right. No speech bubble. Resting. | Explore, Activity, Settings, Profile — accessible but not intrusive |
| **Peeping (inside clusters)** | Clio FAB (40px), **top-right**, 16px from edge, 8px below cluster top bar. No speech bubble. Resting. | Cluster Timeline, Members, Features, Cluster Info |
| **Prominent** | 80–120px with speech bubble, animated entrance | Empty states, first visits, onboarding |
| **Inline** | 32–40px alongside a UI element (compose bar, tooltip, form tip) | Contextual presence without dominating |

> **Anchor Mode belongs to Sage, not Clio.** Clio never posts to the cluster Timeline (Part 4 §12). All inline Timeline anchor cards (arc phases A, B, C) are authored by Sage under `system_sage`. See the Sage section below for Sage's anchor post card spec.

> **Visual identity**: Clio must always match **`resting01.png`**. Do not alter her design, proportions, or colour. Size may scale (32px → 120px) but identity must not change.

> **Micro-animation codes**: Individual screen specs throughout this document reference animation codes (M1–M12). These codes are defined and owned by **`clio_character_prompt.md`**. Their presence in a screen spec indicates *which animation is triggered* at that interaction point — not how the animation works. Renderers should treat them as named event hooks, not inline instructions.

### Sage — Cluster Anchor Agent — Screen Presence Reference

> Sage is the **active cluster Anchor**. She is a separate agent from Clio with her own visual identity, voice, and role. Sage appears **only inside cluster Timelines** — never on Explore, Activity, Profile, or in the Clio FAB panel. Her character, arc-phase behaviour, and operational rules are defined in **`sage/SOUL.md`** and **`sage/AGENTS.md`**. This section covers only **where and how Sage appears on screen**.

#### Sage Visual Identity

| Property | Spec |
|----------|------|
| **Character** | Earth-toned mochi-sphere creature — warm clay/terracotta body with sage-green (🌿 `#16A34A`) accents |
| **Visual contrast to Clio** | Clio = peach + teal (curious warmth). Sage = clay + sage-green (grounded warmth) |
| **Reference image** | `sage_resting_01.png` — all Sage depictions must match this reference |
| **Size** | 40px (inline in Timeline posts). Never larger — Sage is a room presence, not a stage presence |
| **Avatar ring** | Sage-green ring border (`#16A34A`, 2px) — vs Clio's teal ring |

#### Sage Post Card (Timeline)

```
┌ sage-green left-border (3px, #16A34A) ─────────────────────────┐
│  [Sage avatar 40px] "Sage" sage-green bold  "Anchor" gray label│
│  "2h ago"                                                      │
│                                                                │
│  Framing line (italic): "Something came up this week —"        │
│  [Embedded content card or question prompt]                     │
│                                                                │
│  Footer: likes / comments / Share                              │
└────────────────────────────────────────────────────────────────┘
```

- Background tint: `#F0FDF4` (very light sage — distinct from Clio's `#FFF7ED` peach tint)
- Left border: 3px `#16A34A` (vs Clio's teal left-border)
- Label: "Sage · Anchor" (sage-green bold + gray) — never "Clio"
- Entry animation: 200ms slide-in from left (vs standard fade-in for member posts)

#### Sage Mood States

| Mood | Visual | When Used |
|------|--------|-----------|
| **Grounded** | Soft oval eyes, steady posture, gentle warmth | Default state, standard posts, re-engagement |
| **Engaged** | Eyes slightly wider, subtle forward lean | Responding to cluster momentum, acknowledging milestones |
| **Observing** | Eyes half-closed, serene, minimal movement | Phase E — self-sustaining cluster, Sage is receding |

> Sage has **3 moods** vs Clio's **7**. Sage is steadier — her role is structural guidance, not emotional companionship. She does not have Excited, Curious, Encouraging, or Empathetic states.

#### Sage Introduction Moment (fires once per cluster per user)

When a user enters a cluster for the first time and Sage has an active post in the Timeline:

1. Clio's FAB panel opens (standard State 4, one message):
   *"This is Sage. She keeps this room alive. You will see her around."*
2. Panel auto-dismisses after 8 seconds.
3. Sage's first post card in the Timeline has a subtle warm glow ring (sage-green, `opacity: 0.3`, 1.5s fade-out) to draw the eye.
4. This introduction fires once per cluster. If the user has already seen Sage in another cluster, it does not fire again.

Anchor: `anchor_sage_introduction`

#### Clio ↔ Sage Boundary

| Domain | Clio Owns | Sage Owns |
|--------|-----------|----------|
| **Personal space** | FAB, personal chat, feature introductions, creation, AMA | — |
| **Cluster Timeline** | Welcome message on join only | All anchor posts, content curation, polls, re-engagement |
| **Visual real estate** | FAB (top-right inside clusters, bottom-right outside) | Inline in Timeline feed only |
| **Proactive messages** | Via FAB panel — personal | Via Timeline post — communal |
| **Simultaneous speech** | ❌ Never. If Clio is speaking via panel, Sage defers her next post by 60s minimum. |

#### Sage Micro-Interactions

| Interaction | Micro-Animation |
|-------------|----------------|
| **Sage about to post** | Sage avatar in compose-bar area shows a subtle warm pulse (sage-green glow, 0.8s, once) before post appears |
| **Sage post enters feed** | 200ms slide-in from left edge (all other posts use standard fade-in) |
| **Poll card appears** | Poll options expand sequentially (100ms stagger per option) with a gentle scale from 0.95→1.0 |
| **Poll closes** | Vote bar fills animate from left (300ms per bar, sequenced by vote count) |
| **Sage recedes (Phase E)** | Avatar opacity reduces to 60% on her posts — she is still present but visually quieter |
| **Long-press Sage post** | Same options as Clio: "Not relevant" (sends signal), "Share Post", "Copy Link" |

### Background Intelligence Indicator

> A persistent ambient micro-animation that communicates Clio, Scout, and Sage are working behind the scenes. Purely visual — not interactive.

| Property | Spec |
|----------|------|
| **Element** | 4px filled circle, positioned to the right of the Aggilo logo in the Explore top bar |
| **Color** | `#0891B2` (primary teal) |
| **Animation** | Breathing pulse: `opacity: 0.3 → 0.6 → 0.3` on a 3-second cycle, infinite loop |
| **Visibility** | Always present on Explore screen — first visit and return visits |
| **Interaction** | None — purely ambient. No tap target, no tooltip |
| **Purpose** | Subconsciously signals that intelligence is active without naming any agent |


### Shadows

| Level | Shadow | Usage |
|-------|--------|-------|
| **Elevation 1** | `0 1px 3px rgba(0,0,0,0.08)` | Cards, inputs |
| **Elevation 2** | `0 4px 12px rgba(0,0,0,0.12)` | Sheets, Clio FAB |
| **Elevation 3** | `0 8px 24px rgba(0,0,0,0.16)` | Tooltips, modals |

### Components

#### Buttons
| Type | Style |
|------|-------|
| **Primary CTA** | `#0891B2` bg, white text, 16px font, 12px radius, full-width, 48px height |
| **Secondary** | White bg, `#0891B2` border 1.5px, teal text, 48px height |
| **Text Button** | No bg, `#0891B2` text — "Skip", "Cancel", text links |
| **Disabled** | `#E5E7EB` bg, `#9CA3AF` text |
| **Danger** | `#EF4444` bg, white text — Delete, Block, Report only |

#### Input Fields
- White bg, `#E5E7EB` border 1px, 10px radius, 48px height
- Focused: `#0891B2` border 2px, subtle teal glow
- Error: `#EF4444` border, red helper text below

#### Persistent Top Bar (Phase 1)
| Context | Contents |
|---------|----------|
| **Explore** | Aggilo logo + intelligence dot (left), Bell 🔔 with badge (right) |
| **Activity** | "Activity" title (center), Bell 🔔 (right) |
| **You / Profile** | "Profile" title (center), Settings ⚙️ (right) |
| **In-Cluster** | "← Back" + Cluster name (center) + Messages 💬 (Stage 3, right) + "⋮" (right) |
| **Sub-pages / Modals** | "← Back" + Page title (center) |

#### Bell 🔔 Tap Behaviour
| User Stage | Tap Action |
|------------|------------|
| **Stage 2+** | Navigates to Activity tab (bottom nav switches to Activity highlighted) |
| **Stage 1** | Small dropdown from bell icon: *"Activity updates will appear here soon."* Auto-dismiss 5s. Gray bg, 12px text, Elevation 2 shadow. |

---

## 🎨 Global Style Prefix (prepend to every prompt)

```
A clean, modern mobile app UI mockup for "Aggilo" social network, iPhone 15 Pro frame, white (#FFFFFF) background, primary color #0891B2 (cyan-teal), secondary color #164E63 (deep teal-navy), accent color #F59E0B (amber-gold). Inter font family. Minimal, airy layout with ample whitespace, 16px horizontal margins. Calming ocean-inspired color scheme. Status bar shows 12:30, Wi-Fi, cellular, battery icons. Bottom navigation bar with 3 tabs ONLY: Explore (lightning bolt icon), Activity (inbox icon), You (person icon) — NO central FAB, NO Chat tab, NO Home tab. Active tab highlighted in cyan-teal. Small floating Clio FAB (48px, peach face, teal ring border) in bottom-right corner above nav bar. Cards have 16px corner radius, very light teal-tinted backgrounds (#F0FDFA), subtle drop shadows. Buttons are 48px height with 12px radius. Material Design 3 inspired. --ar 9:19.5 --v 6
```

---

## 📍 Phase 1 End-to-End Journey Map

### Path A: New User (App Store → Active Member)

| # | Stage | Screen(s) | What Happens | Clio's Role |
|---|-------|-----------|--------------|-------------|
| 1 | **First Launch** | 0.1 | 4-slide walkthrough | Clio narrates all 4 slides |
| 2 | **Auth** | 1.1 → 1.2 | Phone or email → OTP | — |
| 3 | **Profile Setup** | 2.1 → 2.4 | Year of Birth / Gender → Language → Nickname → Location | — |
| 4 | **Clio Welcome** | 2.5 → 2.6 | Clio intro + first conversation | Clio introduces herself, asks what user wants |
| 5 | **Explore + Tour** | 3.1 + 8.1–8.4 | Clio-curated cluster cards + guided tour | Clio narrates tour tooltips |
| 6 | **View Cluster** | 4.1 | Tap card → read-only Timeline view | Clio: "Looks like your kind of room" |
| 7 | **Join Cluster** | 4.1 | Tap "Join" → eligibility → auto-join | Clio welcome message in Timeline |
| 8 | **In Cluster** | 4.1 → 4.2 | Timeline → Members | Clio hosts Timeline, posts content cards |
| 9 | **Create Cluster** | 5.1 → 5.4 | Clio chat overlay — 3 questions → live | Clio leads entire creation |
| 10 | **Return** | 3.2 | Explore with Clio insights updated | Clio: new cluster matches found |

### Path B: Shared Invite — New User

| # | Stage | Screen(s) | What Happens |
|---|-------|-----------|--------------|
| 1 | **Tap link** | 9.1 | Invite landing — basic eligibility |
| 2 | **Qualified** | 9.2 | "You qualify!" → sign up / log in |
| 3 | **Sign up** | 9.4 | Quick form → OTP → auto-join |
| 4 | **In Cluster** | 4.1 | Lands in Timeline of joined cluster |

### Path C: Returning User

| # | Stage | Screen(s) | What Happens |
|---|-------|-----------|--------------|
| 1 | **Open app** | 1.1 | Login |
| 2 | **OTP** | 1.3 | Welcome-back + nickname |
| 3 | **Explore** | 3.2 | Populated Clio-curated cards |

---

## Flow 0: App Walkthrough (First-Time Only — 4 Slides)

> **Design intent**: Clio introduces herself as a quiet authority on connection — not an assistant, not a matchmaking engine. Each slide follows the first 4 beats of the Clio Relationship Arc (First Contact → Curiosity Hook → Empathy → Specificity as Proof). The user should feel *found*, not sold to.

### Screen 0.1 — Clio-Narrated Walkthrough

```
[GLOBAL STYLE PREFIX]

Full-screen walkthrough. NO bottom navigation bar. Clean, centered layout.
Swipeable carousel with 4 slides. Each slide: large Clio avatar (80px) top-center
+ speech bubble + flat illustration below.

Slide 1 — Beat 1: First Contact
- Clio avatar (80px, Resting mood — soft oval eyes)
- Speech bubble: "I'm Clio. I find people you'd actually want to know."
- Flat illustration: diverse people connected by teal atom/molecule lines

Slide 2 — Beat 2: Curiosity Hook
- Clio (80px, Curious mood — head tilt, slight eye asymmetry)
- Speech bubble: "I sort people into Clusters — small groups built around one specific thing.
Age. Location. Purpose. Language.
The more specific, the more real."
- Flat illustration: cluster circle with AGGIL labels floating around it

Slide 3 — Beat 3: Empathy
- Clio (80px, Happy mood — inverted-crescent eyes)
- Speech bubble: "Nickname only. Nobody sees what you do not show.
The people who find their people? They all felt like you do right now."
- Flat illustration: shield with nickname badge "@your_name" + lock icon

Slide 4 — Beat 4: Specificity as Proof
- Clio (80px, Excited mood — wide circles, pupils max, subtle bounce)
- Speech bubble: "Tell me a little. I will show you who is already here."
- Flat illustration: Clio surrounded by fanned-out cluster cards
- CTA button: "Let's go →" (teal filled, full-width, 48px)

Bottom: 4 dot indicators (active dot teal, rest gray).
"Skip" text link top-right (gray 14px).
On slide 4: CTA button appears, dots shift above it.

[CLIO_ANCHOR: anchor_walkthrough_slide_1 | anchor_walkthrough_slide_2 | anchor_walkthrough_slide_3 | anchor_walkthrough_slide_4]
Bottom Navigation Bar: NOT visible.
```

---

## Flow 1: Authentication (3 screens)

### Screen 1.1 — Login / Signup

```
[GLOBAL STYLE PREFIX]

Full screen login. NO bottom nav.
Top-center: Aggilo logo (cyan-teal atom/molecule icon 48px) + "Aggilo" wordmark below.
Tagline: "Connect. Locally. Deeply." in gray 14px.

Two toggle tabs (pill-shaped): "📱 Phone" (selected, teal underline) | "📧 Email" (gray)

Phone tab (default):
- Input field "Mobile Number" — country code picker 🇮🇳 "+91" on left
- Placeholder: "Enter your phone number"
- "Send OTP" teal full-width 48px button

Email tab:
- Input "Email Address" with ✉️ icon
- Placeholder: "Enter your email"
- "Send Login Code" teal button

Below button: "By continuing, you agree to Aggilo's Terms of Service and Privacy Policy"
— "Terms of Service" and "Privacy Policy" as teal underlined links.

Below: "New to Aggilo? Sign up" — "Sign up" in teal.

No password. No "Forgot Password". Clean and minimal.

Loading state: button disabled + spinner + "Sending..." text.
Validation: button disabled until valid format. Red error text on blur.

[CLIO]
Not present on this screen.
Bottom Navigation Bar: NOT visible.
```

### Screen 1.2 — OTP Verification

```
[GLOBAL STYLE PREFIX]

Verification screen. NO bottom nav. Top: Back arrow "←".

If phone:
- Title: "Verify your number" in deep teal-navy H1
- Subtitle: "I've sent a 6-digit code to +91 98765 •••••" in gray
- Bottom link: "Wrong number? Change" in teal

If email:
- Title: "Verify your email"
- Subtitle: "I've sent a 6-digit code to u••••@example.com"
- Bottom link: "Wrong email? Change"

Center: 6 separate square input boxes in a row. Subtle gray borders → turn teal when active.
First box has blinking cursor.

Below: "Resend code in 0:45" in gray. When timer expires → "Resend Code" teal link.
Below: "Verify & Continue" teal full-width button.

Error state — wrong code: All 6 boxes shake (300ms horizontal shake). Boxes reset.
Red text: "That code didn't match. Try again." + "3 attempts remaining."

Error state — too many attempts: Boxes disabled. Red: "Too many attempts."
Resend link turns active. 60-second cool-off.

[CLIO]
Not present on this screen.
Bottom Navigation Bar: NOT visible.
```

### Screen 1.3 — Returning User Login

```
[GLOBAL STYLE PREFIX]

Same as Screen 1.1 (Phone/Email tabs). After entering credentials and tapping send,
shows OTP screen with welcome-back overlay:

- Top: "Welcome back! 👋" in deep teal-navy H1
- Nickname badge: "@creative_soul" in rounded teal pill (12px, white text)
- If phone: "Code sent to +91 98765 •••••"
- If email: "Code sent to u••••@example.com"

Same 6-digit input boxes. Same verify button. Confirms returning user identity.

[CLIO]
Not present on this screen.
Bottom Navigation Bar: NOT visible.
```

---

## Flow 2: Registration & Onboarding (5 screens)

> **Order**: Phone/Email OTP → Year of Birth + Gender → Language → Nickname → Location Permission → Clio Welcome Transition → Clio Welcome Conversation
> **Purpose & Tags are NOT collected during onboarding.** They surface only during cluster creation (Flow 5) when context is relevant. This reduces the critical path to first cluster view.

### Screen 2.1 — Year of Birth + Gender (Step 1 of 3)

```
[GLOBAL STYLE PREFIX]

Onboarding step 1 (after OTP verified). NO bottom nav.
Top: Aggilo logo (small, 32px).
Title: "Let's set up your profile" (H1, deep teal-navy)
Subtitle: "This helps me find the right people for you." (gray)

Form fields:

1. "Year of Birth"
   - Year selector (scroll wheel)
   - Below: small ℹ️ info button with lock icon: "🔒 This cannot be changed later.
     It's used for age-based matching and never shown to anyone."

2. "Gender"
   - Three horizontal pill buttons: "Male" (♂) | "Female" (♀) | "Non-Binary" (⚧)
   - Selected: teal bg, white text. Unselected: light gray bg, dark text.
   - Below note with lock icon: "🔒 This cannot be changed later. Helps us show relevant clusters."

"Continue →" teal full-width button. DISABLED until both Year of Birth and gender are selected.

Validation: tapping disabled button → 200ms shake + field labels flash red.
Progress dots at bottom: step 1 of 3 (dot 1 filled teal, rest gray).

NO real name. NO password.

[CLIO]
Not present on this screen.
Bottom Navigation Bar: NOT visible.
```

### Screen 2.2 — Language Selection (Step 2 of 3)

```
[GLOBAL STYLE PREFIX]

Onboarding step 2. Top: Back arrow "←".
Title: "Languages you speak" (H1, deep teal-navy)
Subtitle: "Select ALL languages you speak. More languages = broader reach." (gray)

Multi-select chip selector:
Pre-populated from phone settings: "English ✕" and "Hindi ✕" (teal outline chips).
"Add more languages" input with searchable dropdown: Telugu, Tamil, Marathi, etc.
ℹ️ "You can select multiple languages." tooltip.

Separator.

"Primary Language" — dropdown selector, defaults to first selected language.

"Continue →" teal full-width button. Always active (at least 1 language pre-selected).
Progress dots: step 2 of 3 (2 dots filled).

[CLIO]
Not present on this screen.
Bottom Navigation Bar: NOT visible.
```

### Screen 2.3 — Choose Your Nickname (Step 3 of 3)

```
[GLOBAL STYLE PREFIX]

Onboarding step 3 (final numbered step). Top: Back arrow.
Title: "Create your identity" (H1, deep teal-navy)
Subtitle: "Your nickname is how everyone knows you on Aggilo. Real name stays private." (gray)

1. "Choose a Nickname"
   - Input with "@" prefix. Placeholder: "e.g. urban_explorer"
   - Helper: "3–20 characters, letters, numbers, underscores"
   - Green ✓ checkmark when nickname is available (server confirmed)
   - If taken: teal "✕ Nickname taken" + AI-suggested alternatives as tappable pills below

"Continue →" teal button. Disabled until nickname is valid and confirmed available.
Progress dots: step 3 of 3 (all 3 dots filled teal).

[CLIO]
Not present on this screen.
Bottom Navigation Bar: NOT visible.
```

### Screen 2.4 — Location Permission

```
[GLOBAL STYLE PREFIX]

Location permission screen (after onboarding steps complete). Top: Back arrow.
Title: "Enable Location" (H1, deep teal-navy)
Subtitle: "Helps you discover hyperlocal clusters near you. Change anytime." (gray)

Center: large flat illustration — map pin on stylized city map (gray map, teal pin, building outlines).

Two buttons stacked:
1. "📍 Enable Location" — teal full-width button
2. "Skip for now" — gray text-only link below

Small ℹ️ info tooltip at bottom: "🔒 Your exact location is never shared. We only use it to match nearby clusters."

No progress dots — this is a permission screen, not a numbered onboarding step.

[CLIO]
Not present on this screen.
Bottom Navigation Bar: NOT visible.
```

### Screen 2.5 — Profile Created → Clio Welcome Transition

```
[GLOBAL STYLE PREFIX]

Brief success screen. NO bottom nav. Center layout.

- Clio avatar (80px, Happy mood — inverted-crescent eyes, subtle bounce)
- Green checkmark circle below Clio with pulse animation
- Nickname: "@urban_explorer" in deep teal-navy (H2) — just the nickname, no filler
- Clio speech bubble: "Good. One more thing."
- "Continue →" teal full-width button

Voice rule: No "You're all set!", no ✨, no celebratory filler. Clio is focused.
She has work to do.

[CLIO_ANCHOR: anchor_onboarding_success]
Bottom Navigation Bar: NOT visible.
```

### Screen 2.6 — Clio Welcome Conversation (First-Time Only)

```
[GLOBAL STYLE PREFIX]

Full-screen conversational interface. NO bottom nav.
Light teal-tinted background (#F0FDFA).

Top: Clio avatar (80px) centered + "Clio" label in teal bold 12px below.

Conversation flow (chat-bubble style, 800ms delays between bubbles — deliberate pacing):

Clio bubble 1 — Beat 5: Social Proof
  "Here's what I know so far."

Context card (white card, 16px radius, inline):
  - 🎂 "25-30" (derived from Year of Birth)
  - ♀ "Female"
  - 📍 "Hyderabad" (if location shared) OR "📍 Not set yet" (if skipped)
  - 🗣️ "English, Telugu"

Clio bubble 2 — Beat 6: Gets Personal
  "What are you looking for?"

Chip selector row (user taps one):
  [Like-minded people] [Early career craft] [Local friends] [Just exploring]

After user taps (e.g. "Early career craft") — typing indicator "..." for 1.5s, then:

Clio bubble 3:
  "Business in Hyderabad. Three clusters already active in that space."

2-second pause. Clio's eyes shift to Curious.

Clio bubble 4 — Beat 7: Emotional Depth
  "I'll keep finding more. But here's the thing —
   I can find your people. You have to actually show up. 🔍"

CTA button: "Show me →" (teal filled, full-width, 48px).
Tapping navigates to Explore (Screen 3.1).

[CLIO_ANCHOR: anchor_onboarding_conversation]
Bottom Navigation Bar: NOT visible.
```

---

## Flow 2B: Evangelist Invite — Accelerated Onboarding (2 screens)

> **Evangelists** are users invited directly by the Aggilo team during Phase 1 launch.
> Their purpose, interests, and context are known from the invite form before they open the app.
> Clio has this context loaded in USER.md at session start. She does not ask what she already knows.
> The standard Screen 2.6 welcome conversation is replaced by Screen 2.6E (Evangelist).
> The onboarding tour (Screens 8.1–8.4) is skipped entirely — Clio goes straight to relevant clusters.

### Screen 2.6E — Clio Welcome: Evangelist (Replaces 2.6 for invite users)

```
[GLOBAL STYLE PREFIX]

Full-screen conversational interface. NO bottom nav.
Light teal background (#F0FDFA). Clio avatar (80px) centered top. "Clio" teal bold 12px below.

Clio already has the user's context from the invite payload (purpose, interests, location).
She does not ask. She shows what she knows and moves.

Invite context card (white card, 16px radius, inline — appears before Clio speaks):
  Title: "What I know about you" (gray 12px, small caps)
  Fields derived from invite data:
    Intent: "[stated purpose from invite]"
    Interests: "[tags from invite form]"
    Location: "[city from invite]"
  Small note: "From your invite form. You can update this anytime."

Clio bubble 1:
  "I've been waiting for someone who wants [stated purpose].
  Let me show you what is already here."

Typing indicator (1s).

Clio bubble 2:
  "[N] clusters match what you described.
  Here is the one I would start with."

Inline cluster preview card (compact — same format as Explore cards but smaller, inside the conversation):
  Cluster name / member count / location / 2 tags
  "View this cluster →" teal text link

Clio bubble 3:
  "Tap to go in. I'll be around if you need direction."

CTA: "Show me all matches →" (teal filled, full-width) — navigates to Explore (Screen 3.1).

No tour. No walkthrough slides recap. Clio goes straight to the product.

[CLIO_ANCHOR: anchor_evangelist_welcome]
Bottom Navigation Bar: NOT visible.
```

### Screen 3.1E — Explore: Evangelist First Visit

```
[GLOBAL STYLE PREFIX]

Same as Screen 3.1 with one difference:

CLIO INSIGHT PILL (pre-loaded — no shimmer, results already queued from invite context):
  "[N] clusters ready for you. I started from what you told us."

No loading shimmer — results are pre-fetched from invite context, not generated on first load.
Cards shown in relevance order based on invite purpose + interests.
Cluster cards: same format as 3.1.

Clio FAB (48px) bottom-right, Resting — not Curious, not Prominent.
She has done her preparation. The user now drives.

[CLIO_ANCHOR: anchor_evangelist_explore]
Bottom Navigation Bar: VISIBLE — Explore tab highlighted teal.
```



## Flow 3: Explore — Phase 1 Default Landing (2 screens)

> **Phase 1 rule**: Explore IS the app's home screen. No Home tab. User lands here on every open. No search bar. No "+" FAB. Clio curates all cluster cards.

### Screen 3.1 — Explore (First Visit — Clio Query Running)

```
[GLOBAL STYLE PREFIX]

Explore screen — first visit, arriving from Clio Welcome Conversation.
Top bar: Aggilo logo (left, 32px atom/molecule wordmark).
  Right side icons (left to right): Search 🔍 (24px, gray) + Tune ⚙ (24px, teal) + Bell 🔔 with badge.
  Search 🔍: Tapping opens Clio chat overlay for conversational search.
  Tune ⚙: tapping opens Clio AMA panel (Screen 3.3). Active indicator dot (teal 6px) when calibration in effect.
  "+" Create icon: NOT shown on first visit. Appears after user has joined or created 2 clusters.
  When visible, "+" sits between Tune and Bell. Tapping opens Clio's creation panel immediately.

MY CLUSTERS STRIP: NOT shown on first visit. Appears after first cluster join (see Screen 3.2).

NO search bar. NO filter tabs.

Section heading: "Clusters Clio found for you" (H2, deep teal-navy, left-aligned)

On-demand query runs on first Explore load (DB search matching user AGGIL dimensions).

While query runs (~1-3s):
  - Clio insight pill (full-width, light teal bg #E0F7FA, 14px teal text):
    "Checking..."
  - 3 shimmer skeleton cards below (pulsing #F0FDFA, 16px radius)
  - Clio FAB (48px) bottom-right: M2 (Processing) — eyes scan, glow pulses

When results arrive, pill updates to:
  "Here is what is active in your area right now."
  (Tapping pill opens Clio chat: "Want me to look somewhere else?")

3-5 cluster cards fade in. Each card format:
  - Cover image (16:9, rounded top corners)
  - Activity badge (top-right of image): "VERY ACTIVE" green pill OR "QUIET" gray pill
  - Demographic overlay (bottom-left of image): e.g. "♀ Women only" white text on teal bg
  - Cluster name (H3 bold, #164E63)
  - Members count: "45 members"
  - LOCATION ROW: max 2 location chips visible [📍 Banjara Hills] [📍 Gachibowli]
    If more locations exist: [+N 📍] chip — tap expands all locations inline, no sheet (200ms ease-out smooth animation)
  - TAG ROW: max 3 tags visible [#CareerCraft] [#Startup] [#Women]
    If more tags exist: [+N tags] chip — tap expands all tags inline, no sheet (200ms ease-out smooth animation)
  - AGGIL chips (visually subdued, muted text, light gray border): "20-50 yrs" and "English, Hindi"
  - Clio insight line (full-width strip, light teal bg, 14px teal italic):
    "Most people here arrived not knowing anyone."
  - "View Cluster" teal text button (bottom-right of card)

NO score badge. NO match %. NO search bar anywhere.

Zero-results state:
  - Clio Prominent (80px, Curious mood) centered
  - Speech bubble: "Nothing yet. I check every few hours."
  - Tapping opens Clio chat overlay

120-second browse trigger:
  If user browses 120s without tapping a card:
  Clio FAB silently transitions from Resting to Curious (subtle head tilt, soft pulsing glow ring).
  She does NOT open a speech bubble or interrupt. She simply signals availability.
  Tapping the FAB opens Clio chat format as usual.

Clio FAB (48px, peach face, teal ring) bottom-right, 16px from edge, 72px above nav.

[CLIO_ANCHOR: anchor_explore_loading | anchor_explore_results | anchor_explore_zero | anchor_explore_idle_120s | anchor_explore_ama_entry]
Bottom Navigation Bar: VISIBLE — Explore tab highlighted teal.
```

### Screen 3.2 — Explore (Populated — Return Visit)

```
[GLOBAL STYLE PREFIX]

Explore screen, results loaded. Return visit — user has joined at least one cluster.
Top bar: Aggilo logo (left).
  Right side: Search 🔍 + Tune ⚙ (teal, active dot if calibration set) + "+" Create (if 2+ clusters milestone reached) + Bell 🔔 red badge "3".

MY CLUSTERS STRIP (appears after first cluster join — horizontal scroll, above discovery cards):
  Section label: "Your clusters" (left-aligned) + "See All" (teal right-aligned text link to open full vertical list).
  Horizontal scroll row of cluster chips. Each chip:
    Cluster avatar circle (40px) + cluster name (12px, bold, truncated at 14 chars) + unread dot (teal 6px) if new activity
  Tapping a chip navigates directly into that cluster's Timeline tab.
  Strip does not appear until at least 1 cluster is joined. Never shown to new users on first visit.

Section label below strip: "Discover" (H3, deep teal-navy) — separates strip from discovery cards.

Clio insight pill (full-width, light teal bg):
  "Five clusters. Here is what I found."
  Tapping opens Clio chat overlay.

Cluster cards (vertical scroll, same format as 3.1):

Card 1:
  Cover: co-working space photo. Badge: VERY ACTIVE green.
  Demographic overlay: ♀ Women only
  Name: "Women Entrepreneurs" (H3 bold)
  1.2k members.
  Location row: [📍 Banjara Hills] [📍 Gachibowli] — no expand needed (2 locations)
  Tag row: [#CareerCraft] [#Startup] [+2 tags] — expand chip for remaining
  AGGIL: 20-50 yrs / English, Hindi
  Clio insight: "This bracket has been growing steadily."
  [View Cluster]

Card 2 (partially visible — scrollable):
  Cover: outdoor group photo. Badge: ACTIVE green.
  Demographic: Open (mixed gender)
  Name: "ML Side-Project Founders Hyd"
  23 members.
  Location row: [📍 Gachibowli] — single location, no expand needed
  Tag row: [#ML] [#SideProjects] — 2 tags, no expand needed
  AGGIL: 22-35 yrs / English
  Clio insight: "Side-project builders in this age group tend to land here."
  [View Cluster]

Long-press on card: context menu: Open | Share
(No Leave — user not yet a member of explore cards)

Clio FAB (48px) bottom-right, Resting.

[CLIO_ANCHOR: anchor_explore_results | anchor_explore_idle_120s | anchor_explore_ama_entry | anchor_explore_poor_results_nudge]
Bottom Navigation Bar: VISIBLE — Explore tab highlighted.
```

---


---

## Flow 3 (cont.): Clio AMA + Calibration (2 screens)

> The settings icon on the Explore top bar is the entry point to Clio\'s AMA mode.
> It is available at any time from Explore — first visit or return visit.
> Clio uses the conversation to infer the user\'s intent (variety vs relevance vs both)
> and adjusts the five discovery parameters accordingly. Settings do not persist between
> sessions — Clio starts fresh each time. No form is ever shown. No sliders. Just a
> conversation that ends in a recalibrated Explore.

### Screen 3.3 — Clio AMA Panel (Discovery Calibration)

```
[GLOBAL STYLE PREFIX]

Triggered by tapping the Tune icon on the Explore top bar (top-right, beside bell).
Clio State 4 floating panel opens from the standard FAB position (bottom-right, grows
upward-left) — same origin as all other panels for spatial consistency.
Panel header includes a teal pill badge: "⚙ Discovery Calibration" (12px, teal `#0891B2` bg,
white text, right of "Clio" label) to show the panel was triggered by the Tune icon.
Note: this badge is teal (Clio's colour), NOT sage-green — sage-green is Sage's exclusive identity colour.

Panel header: Clio avatar (32px, Curious mood) left. "Help Clio find better" teal bold 13px center.
X close right.

Panel opens with Clio\'s opening question already rendered — no typing delay on first open:

CLIO OPENS:
  "Tell me what you are actually looking for.
  Don\'t filter yourself — the more honest the answer, the better I can find it."

USER REPLIES (free text input — no chips, no forced structure):
  Example A: "I want to meet other startup founders in my area"
  Example B: "I\'m new to the city, just want to explore what\'s out there"
  Example C: "I need a small focused group for learning Python"

CLIO FOLLOW-UP (max 1 follow-up — only if the reply is genuinely ambiguous):
  If reply is specific (A or C): Clio skips directly to confirmation.
  If reply is exploratory (B): one clarifying question:
    "Are you open to groups outside your immediate area, or keep it local?"
  If user mentions an interest not in their profile:
    Clio notes it: "I don\'t have [topic] in your profile yet. I\'ll include it for now."

CLIO CONFIRMATION (after any follow-up, or immediately if reply was specific):
  "Got it —"

  Inline calibration summary card (white card, 16px radius, Elevation 1):
    Looking for: [inferred intent line — Clio\'s own words]
    Area: [location radius inferred]
    Who: [gender filter inferred]
    Age: [age range inferred]
    Topics: [tags / purpose inferred]
    Mode: Relevance / Variety / Both (Clio\'s inference — never shown as a label to the user,
          but governs how tight or broad the parameters are set)

  [SETTINGS PANEL DESIGN INSERT]
  The calibration summary card fields above are tappable if the user wants to adjust.
  Tapping any field opens the existing settings panel for that parameter.
  The settings panel visual is already designed — slot the existing design asset here.
  After any manual adjustment, Clio acknowledges: "Done. I will factor that in."

  Two buttons below the summary card:
    "Looks right — show me" (teal filled, full-width in panel)
    "Adjust something" (teal outlined) — makes fields tappable as described above

  "Looks right — show me" tap:
    Panel closes. Explore reloads with calibrated parameters.
    Tune icon gains active indicator dot (teal 6px filled).
    Clio insight pill updates per Screen 3.4.

[CLIO_ANCHOR: anchor_explore_ama_entry | anchor_explore_ama_conversation | anchor_explore_ama_confirm]
Bottom Navigation Bar: VISIBLE (panel floats above).
```

### Screen 3.4 — Explore: Calibrated Results

```
[GLOBAL STYLE PREFIX]

Explore screen after Clio AMA calibration has been applied this session.
Visually identical to Screen 3.2 with two specific differences:

TOP BAR:
  Tune icon shows teal active indicator dot (6px filled) — calibration is in effect.
  Tapping tune icon while calibration is active reopens AMA panel in update mode:
    Clio: "You are currently set to [one-line summary]. Change something or start fresh?"
    "Change something" (teal filled) | "Start fresh" (gray outlined — resets to AGGIL defaults)

CLIO INSIGHT PILL:
  Reflects the calibration mode Clio inferred — not the default demographic framing.

  Relevance mode pill: "Showing clusters that specifically match what you described."
  Variety mode pill:   "Opening up the range — here is what is active in your broader area."
  Balanced mode pill:  "Mixing close matches with a few wider options."

  Calibrated zero results:
    Clio Prominent (80px, Curious), centered:
    "Nothing fits those settings. Adjust something or start fresh?"
    "Adjust settings" teal button (reopens AMA panel) | "Show me anything" gray link (resets)

Cluster cards: same format as 3.2. Cards reflect calibrated parameters.
Clio FAB (48px) bottom-right, Resting.

[CLIO_ANCHOR: anchor_explore_calibrated | anchor_explore_zero | anchor_explore_ama_entry]
Bottom Navigation Bar: VISIBLE — Explore tab highlighted teal.
```

## Flow 4: In-Cluster Experience (7 screens)

> **Phase 1**: Timeline is always the default active tab when opening a cluster.
> Tab order: Timeline | Members. No Media tab. No Pulse tab.

### Screen 4.0 — Cluster Loading State

```
[GLOBAL STYLE PREFIX]

Transition screen shown while cluster interior data loads after "View Cluster" tap.
Top bar: Navy bg. Back arrow (left). Cluster name (from card data, center, white bold). Overflow (right).

Shimmer skeleton content:
  Tab bar: 2 gray shimmer tab-shaped bars (pulsing #F0FDFA)
  Compose bar placeholder: shimmer rectangle (full-width, 48px height)
  3 shimmer post cards below:
    Each: 16px radius, pulsing #F0FDFA bg, avatar circle shimmer + 3 text line shimmers + action bar shimmer
    Stagger: 100ms delay per card for natural cascade effect

Clio FAB (48px) bottom-right, Thinking state (M2 processing eyes).

Transitions to Screen 4.1 when data loads (cards fade in from shimmer, 200ms per card).
If load exceeds 5 seconds: Clio speech bubble from FAB: "Still loading. Hang on."

[CLIO]
FAB visible, Thinking state.
Bottom Navigation Bar: VISIBLE (Explore tab highlighted — user navigated from Explore).
```

### Screen 4.1 — Cluster: Timeline Tab (Phase 1 DEFAULT)

```
[GLOBAL STYLE PREFIX]

Cluster detail. Timeline is the DEFAULT active tab — always in Phase 1.
Top bar: Navy bg. Back arrow (left). "Women Entrepreneurs" (center, white bold). Messages 💬 icon (right, Stage 3 unlock) + Overflow menu (right).

Condensed cluster header below top bar:
  Tags: #CareerCraft / #Startup / #Mentorship (teal chips). "23 members" / "Active"

Tab bar (2 tabs):
  [Timeline — teal underline ACTIVE] [Members (23)]

Unified Timeline Content:
Timeline is a unified feed where members post directly, and Sage posts curated Atlas content
as the cluster "Host". Cold-start is solved through connection initiation around Sage's content.

COMPOSE BAR (member-only — hidden for non-members):
  Dynamic placeholder (Clio-generated, cluster-specific — NEVER generic):
    Example: "What did you learn at your last pitch?"
  Content icons row: Text / Image / Video / Link
  Clio avatar (32px) at right end — Resting, listening.

POSTS (reverse-chronological mixed feed):

Post 1 (Member): @emma_creates / Jan 20 2:30 PM
  "Just had my first angel investor meeting. Here is what nobody tells you..."
  Photo attached. Footer: 3 likes / 7 comments / Share.

Post 2 (Sage Anchor Mode — sage-green left-border card, light sage bg tint #F0FDF4):
  Sage avatar (40px) left. "Sage" in sage-green bold. "Anchor" gray label. "2h ago"
  Framing line (italic): "Worth a look —"
  Embedded content card (white, 16px radius):
    Source: "TechCrunch" (gray small). "3h ago"
    Headline: "How Hyderabad women founders are reshaping the city startup scene"
    1-line teaser. Thumbnail on right.
  Footer: 12 likes / 4 comments / Share
  Entry animation: 200ms slide-in from left (distinct from member post fade-in).
  (ℹ️ Sage operates within the 2-message/24h limit for proactive anchor posts).

Empty state (new cluster, Atlas populating):
  Compose bar glowing teal border.
  Clio (80px, Curious) centered below bar:
    "I'm gathering what's happening in your space. Want to post the first update?"
  3 shimmer placeholder cards below.

Non-Member Read-Only View (Pre-Signup Snapshot):
  Posts visible (no join needed to read, but partially anonymized/blurred for privacy). Cannot comment. Compose bar hidden.
  Sticky bottom bar: "Join Cluster" teal full-width button (replaces bottom nav).

  Join Confirmation (on tap):
    Small confirmation card slides up from sticky bar (Elevation 2, 16px radius):
    "Join Women Entrepreneurs?" (H3, bold)
    Two buttons inline: "Join" (teal filled) | ✕ (Close icon)
    On confirm: toast "You are in." (4s) + card dismisses + sticky bar disappears.
    Clio speech bubble: "Looks like your kind of room."
    On close: card dismisses, sticky bar remains.

Long-press any post (OTHER user's posts): Report Post (red) / Share Post / Copy Link.
Long-press OWN posts: "Edit Post" (teal) / "Delete Post" (red) / ✕ Cancel.
  Edit: Opens Screen 4.4 composer pre-filled with existing content.
  Delete: Confirmation dialog — "Delete this post? This cannot be undone."
    "Delete" (red filled) | "Cancel" (gray). After delete: post removed, toast "Post deleted."
For Sage's posts: Long-press shows "Not relevant" option. User tap sends signal — Sage requests Atlas refinement run.

Clio FAB (48px, peach face, teal ring) bottom-right, above nav.

PULL-TO-REFRESH:
  Pull down on Timeline → teal circular spinner at top + "Refreshing..." (gray 12px).
  Spinner dismisses when new data loads.
  NEW POSTS PILL: When new content arrives while user is scrolled down:
    Floating teal pill (Elevation 2, centered, 32px height): "↑ New posts"
    Tapping pill → smooth scroll to top (300ms ease-out). Pill dismisses on arrival.

COMMENT THREAD (tap comment count on any post):
  Inline expand below the post (not full-screen, not a sheet).
  Comment cards: avatar (32px) + @nickname + timestamp + comment text.
  Reply button on each comment → indented reply (max 1 nesting level).
  Comment composer pinned below expanded thread:
    Avatar (24px) + text input (placeholder: "Add a comment...") + "Reply" teal text button.
  Collapse: tap comment count again or scroll past the post.
  Clio/Sage are NOT present in comment threads.

[CLIO_ANCHOR: anchor_timeline_compose | anchor_timeline_empty | anchor_timeline_nonmember_join | anchor_sage_anchor_mode]
Bottom Navigation Bar: VISIBLE (members) | HIDDEN + sticky Join bar (non-members).
```

### Screen 4.2 — Cluster: Members Tab

```
[GLOBAL STYLE PREFIX]

Same cluster. Members tab selected.
Top bar: Navy. Back arrow. "Women Entrepreneurs" center. Overflow right.

Tab bar: [Timeline] [Members (23) — teal underline ACTIVE]

Member search bar: "Search members..." (searches member list only — not cluster search).

Member list rows:

Row 1: Avatar (40px) / @sia_creates / Crown "Founder" gold badge / "Joined Jan 2026"
  Three-dot menu right (founder management options only for founders).

Row 2: Avatar / @tech_nomad / Green dot "Active now"
  Shared interest chips: [Tech] [Business]

Row 3: Avatar / @urban_girl / "Active 2h ago"
  Shared interest chips: [Business]

Row 4: Avatar / @code_queen / "Active yesterday" / [Tech]

Row 5: Avatar / @biz_guru / "Active 3d ago" / [Business] [Travel]

Tapping any member row → action sheet behaviour depends on user stage:

STAGE 1 AND 2 (DM not yet unlocked):
  Action sheet shows ONE option only:
    "View Profile" — opens Screen 11.1
  ✕ (Close icon - with "Discard changes?" dialog if needed).
  No "Message" option. No lock icon. No explanation. Simply absent.

STAGE 3 (DM unlocked by Clio on previous session):
  Action sheet shows TWO options:
    "View Profile" — opens Screen 11.1
    "Message" — initiates DM request flow (Screen 4.2a)
  ✕ (Close icon - with "Discard changes?" dialog if needed).

Screen 4.2a — DM Request Flow (Stage 3 only):
  Sender View (opens from "Message" action):
    Modal dialog: "Message @nickname?"
    Text: "They must accept your request before you can chat."
    Input: "Short intro..." (max 150 chars). Send button (teal).
    Once sent, the Action sheet "Message" button changes to "Request Pending" (disabled).

  Recipient View (appears in Activity Feed):
    Row: "Message Request from @nickname" (with Cluster name context).
    Tapping opens request containing the intro text.
    "Accept" (teal) | "Decline" (red text).
    Decline is silent to the sender (stays in Pending state for 30 days).
    Accept opens standard DM thread. At this point, the two users officially become Connections within this cluster.

Standard DM thread (opens after accepted request or from Messages inbox):
  Full-screen overlay slides up from bottom.
  Header: "← Back" (returns to cluster's contextual Messages inbox) + "@nickname" (center, bold).
  Standard message thread. Text input pinned to bottom. Send button teal.
  Phase 1: text only — no media, no voice, no reactions.
  Clio is NOT present in DM threads. Person to person.

Rules:
  Nicknames only. No real names, emails, phones.
  Shared interest chips show mutual interests.
  Tapping elsewhere on row = no action — prevents mis-taps.

Total: "23 members" gray counter at bottom of list.

[CLIO_ANCHOR: anchor_members_idle]
Bottom Navigation Bar: VISIBLE.
```

### Screen 4.3 — Cluster Messages Inbox (Stage 3 Only)

```
[GLOBAL STYLE PREFIX]

Accessed via Messages 💬 icon in cluster top bar (Stage 3+ only).
Full-screen overlay slides in from right.

Top bar: "← Back" (left, returns to cluster). "Messages" (center, bold).
  Cluster context pill (right of title): small gray rounded pill "Women Entrepreneurs" (12px).

PENDING REQUESTS section (top, if any exist):
  Header: "Message Requests" (bold 14px, amber accent left-border)
  Request rows: Avatar (32px) + "@nickname" + "Short intro preview..." + timestamp
  Unread request: bold text + amber dot (6px) right-aligned
  Tapping opens DM request review (accept/decline — same as Screen 4.2a recipient view)

ACTIVE THREADS section:
  Header: "Conversations" (bold 14px)
  Thread rows:
    Avatar (40px) + "@nickname" (bold if unread) + last message preview (gray 14px, truncated 1 line)
    Timestamp (right) + unread dot (teal 6px, right — only if unread)
    Tapping opens standard DM thread (full-screen, text-only in Phase 1)

EMPTY STATE (no messages):
  Center illustration: speech bubble outline (gray, minimal)
  Text: "No messages yet." (H3 gray)
  Subtitle: "Go to Members to start a conversation." (gray 14px)

CROSS-CLUSTER DM RULE:
  ONE thread per user-pair, regardless of which cluster initiated it.
  Thread header shows original cluster context: "via Women Entrepreneurs" (gray 12px, below @nickname).
  If the same user-pair has DM'd from different clusters, thread is merged — no duplicate threads.

[CLIO]
Not present on this screen.
Bottom Navigation Bar: NOT visible (overlay).
```

### Screen 4.4 — Post Composer

```
[GLOBAL STYLE PREFIX]

Full-screen post composer overlay. Slides up from bottom. NO bottom nav.
Top bar: ✕ Close icon (left, triggers dialog "Discard changes? [Keep Editing] [Discard]") / "New Post" title (center) / "Post" button (right).
  "Post" button: disabled gray state until content added; turns teal when text/media present.

Identity row: Avatar + "@sia_creates" + "posting in Women Entrepreneurs" (gray 12px)

Composer area (large, scrollable):
  Title field: "Add a title..." (H3 placeholder, gray)
  Body field: Clio dynamic placeholder: "What did you learn at your last pitch?"

  Content toolbar (above keyboard): Image / Video / Location / Link icons
  (No "Save draft" link — draft auto-saves locally when modal is dismissed)

Footnote: "Your post will be visible to all 23 members." (gray 12px, below toolbar)

[CLIO_ANCHOR: anchor_composer_active]
Bottom Navigation Bar: NOT visible (full-screen overlay).
```

### Screen 4.5 — Cluster Info Sheet

```
[GLOBAL STYLE PREFIX]

Bottom sheet modal (80% screen height). Dimmed backdrop. Drag handle top center.
"Cluster Info" title (deep teal-navy bold). X close button top-right.

Cluster summary:
  Cover image banner (rectangular, rounded top corners of sheet).
  "Women Entrepreneurs at WeWork Gachibowli"
  "Created by @sia_creates / Jan 15, 2026"
  Precision Score badge: "82" green pill — FOUNDER ONLY with note "Only you can see this."
  Score completely hidden from regular members.

AGGIL Settings section (read-only for all members and founders post-creation):
  Age: 1994-1998 (plus or minus 2 years)
  Gender: Female only
  Geography: Banjara Hills / Gachibowli
  Purpose: "Professional execution and mentorship"
  Tags: #Startup #CareerCraft #Women-led
  Languages: English, Hindi

Full description text below AGGIL section.

Action list:
  Edit Cluster Settings (Visible to Founder ONLY, vanishes once members > 1)
  Notification Settings (expandable):
    Toggle "New members" ON
    Toggle "New Timeline posts" ON
    Toggle "Mute all" OFF
  Share Cluster
  Leave Cluster (red text)
  Report Cluster (gray text)

Leave confirmation: bottom dialog.
  "Leave Women Entrepreneurs?" / "You can re-join later if you still meet criteria."
  "Leave" (red filled) + "Stay" (gray outline)

10-Member Milestone card (Founder only — appears above AGGIL section when member count hits 10):
  Clio (40px, Happy) + speech bubble: "Ten people. That is when clusters start feeling like something."
  Dismissible by swipe. Never shown again after dismissed.

[CLIO_ANCHOR: anchor_clusterinfo_milestone]
Bottom Navigation Bar: VISIBLE (dimmed behind sheet).
```

### Screen 4.6 — Share Cluster Sheet

```
[GLOBAL STYLE PREFIX]

Small bottom sheet on cluster detail. Drag handle. "Share Cluster" title. X close.

Cluster mini-preview:
  Circular image thumbnail (48px) + "Women Entrepreneurs" bold + "23 Members / Hyderabad"
  NO score or match percentage shown.

"Share to" section:
  Horizontal scrollable row: WhatsApp / Instagram / Twitter / Telegram / More

"Or copy link" section:
  Text field: "aggilo.com/c/women-entrepreneurs"
  "Copy" teal button (right end of field).

Footer note: "Anyone with this link will need to match the cluster's AGGIL criteria to join."

[CLIO]
Not present on this screen.
Bottom Navigation Bar: VISIBLE (dimmed behind sheet).
```

---

## Flow 5: Clio Cluster Creation — Conversational Only (5 screens)

> **Phase 1 rule**: No "Create Cluster" button or wizard. Clio exclusively offers cluster
> creation in two situations:
> 1. User expresses an unmet need via Clio FAB — Clio determines no cluster fits.
> 2. Explore returns zero results — Clio offers to create from the results screen.
>
> **Before creating, Clio always checks for similar existing clusters** and presents
> them to the user. Only if the user confirms their need is genuinely different does
> Clio proceed to creation. This prevents unnecessary cluster fragmentation.
>
> Creation happens entirely inside Clio's floating overlay panel. User never sees a form.

### Screen 5.1 — Clio Chat Overlay: Unmet Need Detected

```
[GLOBAL STYLE PREFIX]

Clio floating overlay panel open over Explore screen (see Clio Chat spec in design system).
Background: Explore screen fully visible and live — NO dimming. Panel floats at bottom-right.
Panel header: Clio avatar (40px) left / "Clio" teal bold label center / X close right.

Clio avatar (80px) shown at top of panel content area — prominent because she is initiating.

Scenario A — User expressed a need:
  User message bubble (right-aligned, teal bg): "I am looking for a pottery group in my area"
  Clio typing indicator (... 1.5s) then:
  "Pottery in Hyderabad. Let me check what is already here."
  Clio typing indicator again (1s) then shows similar clusters section.

Scenario B — Zero results on Explore:
  Clio insight pill was tapped. Panel opens.
  "Nothing found for that right now. Let me look for anything close."
  Clio typing indicator (1s) then shows similar clusters section (or confirms nothing exists).

[CLIO_ANCHOR: anchor_creation_unmet_need]
Bottom Navigation Bar: VISIBLE (panel floats above it — not a takeover).
```

### Screen 5.2 — Clio Surfaces Similar Clusters

```
[GLOBAL STYLE PREFIX]

Same Clio floating overlay panel. Clio is now showing the user what already exists
before offering to create anything new.

Clio (48px, inline): "Found some that might overlap. Worth a look?"

SIMILAR CLUSTERS SECTION (white cards inside the panel, each card compact):

Similar Cluster Card format (compact — fits within panel width):
  Cluster thumbnail (40px circle) left
  Cluster name (bold, 14px) + member count (gray 12px)
  Tag row: up to 2 tags shown
  "Join" teal button (right side) — tapping joins and closes the panel

Up to 3 similar cluster cards shown. Scrollable within the panel if more.

Below the cards:

Two response options:
  "These don't fit — mine is different" (gray text link)
  (No "create" button yet — Clio must confirm the need is distinct first)

If user taps "Join" on any card:
  Toast confirmation "You're in." and panel closes. No creation.

If user taps "These don't fit — mine is different":
  Proceeds to Screen 5.3 (Disambiguation Questions).

If NO similar clusters found:
  Clio skips this screen entirely and moves directly to Screen 5.3 (Creation Questions),
  but shows: "Nothing close enough already exists. Let me build it."

[CLIO_ANCHOR: anchor_creation_similar_clusters]
Bottom Navigation Bar: VISIBLE.
```

### Screen 5.3 — Clio Disambiguation (User Insists It Is Different)

```
[GLOBAL STYLE PREFIX]

Same floating panel. Clio asks targeted questions to confirm the cluster is genuinely novel
and not a duplicate of what already exists.

Clio (48px, inline, Curious):
  "What would the existing ones not give you?"

User types their answer (e.g. "Those are networking groups. Mine is just for learning pottery hands-on.")

Clio (typing 1s):
  "Got it. That is specific enough — the existing ones do not cover that.
   Want me to build this?"

Two buttons:
  "Yes, create it" (teal filled, full-width within panel)
  "Actually, let me join one of those" (gray text link — returns to similar clusters)

If Clio determines the need IS covered by existing clusters (based on user's description):
  Clio (Honest mode):
  "What you described is already what [Cluster Name] does.
   It might be worth trying that one first."
  Two buttons:
    "Show me that cluster" (teal filled)
    "Mine is still different" (gray text link — Clio proceeds to create)

[CLIO_ANCHOR: anchor_creation_disambiguation]
Bottom Navigation Bar: VISIBLE.
```

### Screen 5.4 — Clio Creation Conversation (3 Questions)

```
[GLOBAL STYLE PREFIX]

Same Clio floating overlay panel. Clio now in "creation mode" — collecting info through
natural conversation. No form. No wizard steps. No progress bar.
Clio avatar (48px) inline in chat thread — participant presence, not stage presence.

Conversation thread (sequential, each message after user replies):

Clio Q1:
  "Describe it in one line. What is it for, and who is it for?"

User reply (right bubble): "A pottery group for women in Hyderabad who want to learn together"

Clio (1s pause) then Q2:
  "How local? Just your area, or open to all of Hyderabad?"

User reply: "Anyone in Hyderabad is fine"

Clio Q3:
  "Age range — open to all, or a specific group?"

User reply: "Mostly 25 to 40"

After all 3 answers — Clio shows typing indicator (2s):
  "One moment..."

[CLIO_ANCHOR: anchor_creation_questions]
Bottom Navigation Bar: VISIBLE (panel floats above).
```

### Screen 5.5 — Clio Brief Confirmation

```
[GLOBAL STYLE PREFIX]

Same Clio floating overlay panel. After processing, Clio presents the cluster brief as a card.

Clio (48px, inline):
  "Here is what I have. Does this look right?"

White brief card (16px radius, Elevation 1 shadow) appears as a chat message inside panel:
  Title: "Hyderabad Pottery Collective"
  Tags: #Pottery / #Learning / #Hyderabad / #WomenOnly
  Who: Women only (derived from user description)
  Age: 25-40
  Location: Hyderabad (city-wide)
  Purpose: "A space for women in Hyderabad to learn pottery together"

  GENDER CONSTRAINT (non-negotiable):
    The founder's own gender is PRE-SELECTED with a 🔒 lock icon on the gender pill.
    It CANNOT be deselected. Other genders may be added.
    Tooltip on lock icon: "Your gender is always included."
    Visual: founder's gender pill = teal bg + white text + small 🔒 (12px).
    Other gender pills = standard teal outlined, tappable to add/remove.

  AGE CONSTRAINT (non-negotiable):
    The age range slider CANNOT exclude the founder's own birth year.
    If the founder drags the slider beyond their year: slider snaps back (200ms)
    + red shake animation + tooltip: "The range must include your year of birth."
    Visual: the founder's year of birth has a teal marker on the slider rail.

Two buttons below the brief card:
  "Looks right — create it" (teal filled, full-width within panel)
  "Change something" (teal outlined)

If user taps "Change something":
  Text input appears: "What should I adjust?"
  User types. Clio processes and shows updated brief card.
  (One refinement cycle before creation.)

[CLIO_ANCHOR: anchor_creation_confirmation]
Bottom Navigation Bar: VISIBLE.
```

### Screen 5.6 — Cluster Created — Success

```
[GLOBAL STYLE PREFIX]

Success overlay. Background (Explore screen) visible. Panel closes and gives way to
a centered modal card (Elevation 3, 24px rounded corners) — this moment earns the full modal.

Content:
  Teal checkmark icon (48px) at top center.
  Headline: "It is live." (H1, deep teal-navy bold). No exclamation mark.
  Subhead: "Your cluster is live." (gray 16px)
  Body: "I am already looking." (teal, italic — Clio's voice)
  "Take me there" teal filled full-width button.

Clio (80px) sitting on top of the modal card.

Voice rule: Never "Great!" or "Cluster created successfully!" Clio does not perform
enthusiasm. "It is live." is a statement of fact. The excitement is in her eyes alone.

Tapping "Take me there" navigates to the newly created cluster Timeline tab (Screen 4.1).

[CLIO_ANCHOR: anchor_creation_success]
Bottom Navigation Bar: VISIBLE (dimmed behind modal).
```

---

## Flow 6: Activity Tab (1 screen)

> **Activity** is the notification and discovery update centre for Phase 1.
> It is hidden from new users until Clio decides they are ready (Stage 2).
> When unlocked, it appears in the bottom nav and Clio introduces it in one sentence.
> The user never knows it was hidden.

### Screen 6.0 — Activity: Stage 1 Locked State

```
[GLOBAL STYLE PREFIX]

Stage 1 users: Activity tab does NOT appear in the bottom nav.
Bottom nav shows only: Explore (active) + You.
The Activity tab slot is blank — not grayed out, not locked icon. Simply absent.

There is no empty state screen for locked Activity.
Clio does not mention Activity exists until she decides the user is ready.
```

### Screen 6.1 — Activity Feed (Stage 2 — unlocked by Clio)

```
[GLOBAL STYLE PREFIX]

Activity tab now visible in bottom nav (Stage 2 unlocked).
Activity tab selected (teal).
Top bar: "Activity" title (center, deep teal-navy bold). Bell with badge (right).

Sections (grouped by time — "Today" / "Yesterday" / "This Week"):

Today:

[Cluster activity row]:
  Cluster avatar (40px, circle) + "Women Entrepreneurs"
  "3 new posts in the Timeline" (bold) + "2h ago" (gray right-aligned)
  Tapping navigates to Timeline tab of that cluster.

[Clio match row]:
  Clio avatar (40px) + "Clio found a new match"
  "ML Side-Project Founders Hyd — 23 members" (teal tappable link)
  "Just now" (gray)
  Tapping opens the cluster detail (Timeline tab, read-only non-member view).

[Member joined row]:
  Cluster avatar + "Women Entrepreneurs"
  "@urban_girl joined your cluster" (bold) + "4h ago"
  Tapping navigates to Members tab of that cluster.

Yesterday:

[Clio match row]: "Hyderabad Food Founders — Clio thinks you belong here"
  "Yesterday" (gray). Tapping opens cluster detail.

[Timeline update row]: "Startup Founders Hub" — "Clio posted 2 new items to Timeline"
  "Yesterday 6:00 PM"

Empty state (no activity yet — fresh account):
  Flat illustration: teal activity icon with soft radiating lines.
  Title: "Nothing yet."
  Subtitle: "Join a cluster. I will keep you posted."

Swipe left on any row: "Dismiss" gray button.

Clio FAB NOT shown on Activity tab (notifications page, no conversational action needed).
Users can tap the Clio FAB from Explore to open Clio chat.

PULL-TO-REFRESH:
  Pull down on Activity feed → teal circular spinner at top + "Refreshing..." (gray 12px).
  Spinner dismisses when new data loads.
  NEW ITEMS PILL: When new activity arrives while user is scrolled down:
    Floating teal pill (Elevation 2, centered, 32px height): "↑ New activity"
    Tapping pill → smooth scroll to top (300ms ease-out). Pill dismisses on arrival.

[CLIO]
Not present on this screen.
Bottom Navigation Bar: VISIBLE — Activity tab highlighted teal.
```

---

## Flow 6B: Feature Introduction Moments (3 screens)

> These are the moments when Clio introduces a newly unlocked feature.
> She does this via her FAB panel — one sentence, pointing at the new element.
> The user never learns they were in a stage. She presents the feature as
> something she noticed was relevant, not something that was previously locked.

### Screen 6B.1 — Activity Introduction (Stage 1 → Stage 2)

```
[GLOBAL STYLE PREFIX]

Triggered in the same session Clio decides the user is ready for Activity.
Clio's FAB panel opens from the bottom-right (standard State 4 panel).
The Activity tab is NOW VISIBLE in the bottom nav — it appeared silently
before Clio spoke. She does not say it just appeared.

Panel header: Clio (32px, Curious mood) + "Clio" teal bold center + X close.

Clio bubble (single message — no follow-up, no conversation):
  "There is a tab keeping track of everything happening in your clusters.
   Worth a look when you are ready."

No CTA button. No "check it out" link. She points and steps back.
Gesture: pointing down toward Activity tab in bottom nav.
  clio_pointing_down_01.png + glow ring on Activity tab icon.
Glow ring holds for 4 seconds, then fades.

Panel auto-dismisses after 12 seconds OR user taps X OR user taps Activity tab.

[CLIO_ANCHOR: anchor_feature_intro_activity]
Bottom Navigation Bar: VISIBLE — Activity tab now present (Stage 2).
```

### Screen 6B.2 — DM Introduction (Stage 2 → Stage 3, next session open)

```
[GLOBAL STYLE PREFIX]

Triggered at the START of the session after Clio set the Stage 3 flag.
Fires on Explore screen load — before any other proactive trigger.
Clio's FAB panel opens automatically (no user tap required).

Panel header: Clio (32px, Resting mood) + "Clio" teal bold center + X close.

Clio bubble (single message):
  "You can reach people directly now.
   Open any cluster, go to Members, tap a name."

No CTA. No navigation. She names the path, not the feature.
Gesture: None — the path is described in words, not pointed to.
Clio mood: Resting (not Encouraging — she is not cheerleading. This is information.)

Panel auto-dismisses after 12 seconds OR user taps X.

[CLIO_ANCHOR: anchor_feature_intro_dm]
Bottom Navigation Bar: VISIBLE — Explore tab highlighted.
```

### Screen 6B.3 — Feature Re-introduction (any unlocked but unused feature)

```
[GLOBAL STYLE PREFIX]

Triggered on session open when:
  - A feature was unlocked 2+ return visits ago
  - The user has never used it (stage_2_used = false OR stage_3_used = false)
  - re-intro has not already fired for this feature

Clio's FAB panel opens (State 4).
Panel header: Clio (32px, Curious) + "Clio" + X close.

For Activity (never used):
  "You have not been to Activity yet.
   That is where I keep track of what is happening across your clusters."

For DM (never used):
  "You have not messaged anyone yet.
   It is there when you want it — Members tab, tap a name."

No CTA. No pressure. She states what exists and where it is.
Fires once per feature. Never again after that.

Panel auto-dismisses after 12 seconds OR user taps X.

[CLIO_ANCHOR: anchor_feature_reintro]
Bottom Navigation Bar: VISIBLE.
```


---

## Flow 7: Profile and Settings (3 screens)

### Screen 7.1 — My Profile (You Tab)

```
[GLOBAL STYLE PREFIX]

"You" tab selected in bottom nav (renders as a full-page push transition). (teal person icon, teal label).
Top bar: "Profile" title (center). Settings gear icon (right).

Profile card (white card, 16px radius, Elevation 1):
  Large avatar circle (80px) with camera overlay icon (tap to change photo)
  Below avatar: "🎨 Avatars and illustrations are recommended. Real photos are not required
    and not recommended for privacy." (gray 12px, italic)
  When camera icon tapped → system image picker opens.
    Top-of-picker banner: "For your privacy, consider using an avatar or illustration
    instead of a real photo." (teal bg, white text, 14px)
  After image selected → circular crop overlay → "Save" button → processing spinner (1s) →
    toast "Photo updated." (4s).
  Nickname: "@sia_creates" (H2 bold, deep teal-navy)
  "Member since Jan 2026" (gray 14px)
  Stats row: "10 clusters joined" / "2 clusters created" (gray 14px)

Two tab pills: "About Me" (selected, teal bg white text) / "Interests" (gray bg)

About Me content:
  Bio section with edit pencil icon:
    "I like to receive and deal with challenging tasks. Tech enthusiast..."
    If empty: light gray placeholder "Add a bio" with edit icon
  Basic Info section:
    Gender: "Female"
    Age Group: "25-30" (NOT exact Year of Birth — age group only)
    Location: "Hyderabad" (city-level only — no exact address)
    Languages: "English, Telugu"

Activity section (recent):
  "Joined Women Entrepreneurs on Jan 20, 2026"
  "Joined ML Side-Project Founders on Jan 22, 2026"

Important: NO real name. NO email. NO phone. NO exact Year of Birth shown anywhere.

Clio incomplete profile banner (shown only when bio is empty OR interests < 3):
  Clio (32px, Curious) left-aligned in a light teal banner strip.
  Speech: "When you are ready, adding a few interests helps me find better spaces for you."
  "Add Bio" teal text link inline.
  Dismiss permanently by tapping the '×' button. Not shown when profile is complete.

Clio FAB (48px) bottom-right, Resting.

[CLIO_ANCHOR: anchor_profile_incomplete]
Bottom Navigation Bar: VISIBLE — You tab highlighted.
```

### Screen 7.2 — Profile: Interests Tab

```
[GLOBAL STYLE PREFIX]

Same profile header. "Interests" tab selected (teal bg white text).

Grid of interest chips (selected ones have teal border + checkmark):
  Sports (checked) / Business (checked) / Technology (checked) / Travel (checked)
  (Unselected: gray border, dark text)

"Edit Interests" teal outlined button below the grid.

Section: "Suggested for you" (gray H2 heading):
  Photography / Art & Design — each with a "+" teal add button.
  (Suggested based on cluster membership and tags)

[CLIO]
Not present on this screen.
Bottom Navigation Bar: VISIBLE — You tab highlighted.
```

### Screen 7.3 — Settings

```
[GLOBAL STYLE PREFIX]

Settings page. Accessed from Profile via gear icon.
Top bar: Back arrow (left). "Settings" title (center).

Section: "Account"
  Phone Number: "Verified: +91 ##### 67890" (masked) — "Change" teal text link
  Nickname: "@sia_creates" — "Change" link (note: "Limited changes allowed")
  Year of Birth: "Set" (grayed out) + lock icon + "Cannot be changed"

Section: "Preferences"
  Languages: "English, Telugu" — arrow right
  Notifications: arrow right (leads to notification sub-page)
  Location: "Hyderabad" — arrow right
  Clio Assistant: arrow right — leads to:
    Toggle "Show Clio tips" (ON/OFF, default ON)
    Slider "Clio presence level": Minimal / Moderate (default) / Active
      Minimal: Clio FAB visible but no proactive bubbles, idle nudges, or continuous animations
      Moderate: Clio shows contextual tips on first visit and idle nudges
      Active: Clio proactively surfaces insights and encouragement
    Toggle "Idle nudges" (ON/OFF, default ON)

Section: "Privacy"
  Profile Visibility: "Cluster context only" — arrow
  Activity Status: "Show when active" toggle

Section: "Security"
  Change Phone Number: arrow
  Export My Data: arrow
  Delete Account: red text

Bottom: "Log Out" teal outlined button. "Aggilo v1.0 Phase 1" small gray text.

Delete Account flow (full-screen page — not a small dialog):
  Large red warning icon.
  Title: "Delete your Aggilo account?" (red bold)
  Bullets: clusters removed / posts deleted / DM history erased / cannot be undone
  Info box (teal): "Account deactivated 7 days first — log back in to cancel."
  OTP confirmation required: "We will send a code to +91 ##### to confirm."
  "Confirm with OTP" (red outlined). ✕ (Close icon - with "Discard changes?" dialog if needed).

Log Out confirmation: alert dialog.
  "Log out from Aggilo? You will need to verify to sign back in."
  "Log Out" (teal) + "Cancel" (gray)

[CLIO]
Not present on this screen.
Bottom Navigation Bar: NOT visible (sub-page, back arrow present).
```

---

## Flow 8: Welcome Tour — Phase 1 Version (4 screens)

> **Tour approach**: Clio-guided contextual tooltip + spotlight overlay. Each step dims
> the background and spotlights one UI element with a tooltip card featuring Clio's avatar
> and speech. This is NOT a full-screen takeover — it is a contextual walkthrough.
>
> **Key Phase 1 change**: Step 3 spotlights the Clio FAB (not the "+" FAB, which does not
> exist in Phase 1). The tour now explains Clio as the action entry point.

### Screen 8.1 — Tour: Clio Welcome

```
[GLOBAL STYLE PREFIX]

Explore screen visible in background (dimmed). Centered modal card (white, Elevation 3).
Clio avatar (80px, Resting mood — soft oval eyes, gentle pulse animation) at top of card.

Clio speech bubble below avatar:
  "This is home.
   Quick tour — takes a minute."

"Show me" teal button (primary CTA). "Skip" gray text link.
Dots at bottom: 1 of 4 (first dot teal, rest gray).

Arc Beat 1 — First Contact. Clio arrives before being asked. She anchors the user
emotionally: "This is home" — not feature explanation, but emotional grounding.

No Prev/Next buttons on slide 1. Only "Show me" and "Skip".

[CLIO_ANCHOR: anchor_tour_welcome]
Bottom Navigation Bar: VISIBLE (dimmed).
```

### Screen 8.2 — Tour: Explore Tab

```
[GLOBAL STYLE PREFIX]

Explore screen background (dimmed, 60% dark overlay).
Spotlight glow highlight on Explore tab in bottom navigation bar.
Tooltip card (white, Elevation 2) with triangular pointer aimed at Explore tab.

Left of tooltip: Clio avatar (40px, Curious mood — head tilt, eye asymmetry).
Tooltip text: "This is where you start.
  I have already sorted through everything for you."

"Next" teal button (right end of tooltip). "Prev" ghost button (left).
Dots: 2 of 4.

Arc Beat 2 — Curiosity Hook. "I have already sorted" is slightly surprising — she has
been working before the user did anything. That specificity is the hook.

[CLIO_ANCHOR: anchor_tour_explore_tab]
Bottom Navigation Bar: VISIBLE (Explore tab spotlighted).
```

### Screen 8.3 — Tour: Clio FAB (Phase 1 Key Screen)

```
[GLOBAL STYLE PREFIX]

Explore screen background (dimmed). Spotlight glow on Clio FAB (48px, bottom-right).
Pulsing teal ring around Clio FAB to draw attention. Tooltip card points at FAB.

Left of tooltip: Clio avatar (40px, Encouraging mood — warm, direct, forward-facing).
Tooltip text: "This is me.
  If you need something — a cluster, a direction, anything —
  just tap. I will be there."

"Next" teal button. "Prev" ghost button.
Dots: 3 of 4.

Arc Beat 3 — Empathy + Promise. Phase 1 replaces the "+" FAB tip with Clio herself.
"I will be there" is a promise, not a feature description. This names the fear quietly:
you will not be alone navigating this. It is answered simply.

[CLIO_ANCHOR: anchor_tour_fab]
Bottom Navigation Bar: VISIBLE (Clio FAB spotlighted).
```

### Screen 8.4 — Tour: Timeline and Cluster Activity

```
[GLOBAL STYLE PREFIX]

Explore screen background (dimmed). Spotlight on the first cluster card in the list,
specifically on the Clio Host activity implied in the card.
Tooltip card with pointer aimed at card.

Left of tooltip: Clio avatar (40px, Happy mood — inverted-crescent eyes, gentle smile).
Tooltip text: "These are clusters I think you would fit.
  Inside each one — I post things worth talking about.
  That is where you will find your people.
  Go. I will be around."

"Let's go" teal button (ends the tour). Dots: 4 of 4.

Voice rule: "I will be around" — not "I will always be here if you need me."
Clio steps back quietly. The tour is over.

[CLIO_ANCHOR: anchor_tour_cluster_activity]
Bottom Navigation Bar: VISIBLE (tour ends, full nav active).
```

---

## Flow 9: Shared Invite Link (4 screens)

### Screen 9.1 — Invite Landing (Guest View)

```
[GLOBAL STYLE PREFIX]

NO bottom navigation (guest user, not logged in). Clean branded page.

Top section — teal gradient banner (deep teal to teal, full-width):
  Pill badge: "[Avatar] Invitation by @sia_creates" (white text, dark pill)
  Three circular member avatars (existing members, small row)
  Cluster name: "Women Entrepreneurs" (large bold white, centered)
  Purpose: "A supportive space for female founders in Hyderabad."

Below banner — white card (rounded top corners, overlapping banner slightly):

Clio avatar (40px, Resting mood) + speech bubble:
  "I need to check a couple of things.
   Nothing you share here gets shown to anyone."

Section: "Quick Qualification" (bold)
  "Year of Birth" — dropdown selector ("Select Year" with chevron)
  "Gender" — three pill buttons: Male / Female / Non-Binary

Important: NO AGGIL criteria or cluster requirements are shown to the guest.
They provide details and the system checks eligibility silently.

Lock ℹ️ indicator: "Verification is blind. Specific cluster criteria are never disclosed."

"Continue" teal full-width button at bottom.

[CLIO_ANCHOR: anchor_invite_qualification]
Bottom Navigation Bar: NOT visible (guest page).
```

### Screen 9.2 — Invite: Qualification Passed

```
[GLOBAL STYLE PREFIX]

Same invite page after submitting valid YOB + Gender.
Green success banner at top: "You qualify for this cluster!"

Below: Two path cards stacked.

Card 1 — "Already on Aggilo?":
  Toggle tabs: Phone / Email
  Phone: Input + "Verify with OTP" teal button
  Email: Input + "Verify with Code" teal button
  ℹ️ "I will verify your identity and add you to this cluster."

Card 2 — "New to Aggilo?":
  "Create your free account" teal button
  "Takes less than 2 minutes" gray subtitle

Note at bottom: "Once verified, you will be instantly added to Women Entrepreneurs."

[CLIO]
Not present on this screen.
Bottom Navigation Bar: NOT visible.
```

### Screen 9.3 — Invite: Qualification Failed

```
[GLOBAL STYLE PREFIX]

Invite page after submitting non-matching details.
Modal overlay over the invite page (blurred bg).

Clio avatar (60px, Resting with slight head tilt — empathetic, not pitying).

Title: "Not this one." (H2, deep teal-navy — plain, no drama)

Clio speech bubble:
  "This cluster has its own filters,
   and the match did not land this time.
   I am already looking at others for you."

Important: The exact criteria (age range, gender, location) are NEVER revealed.
Only the outcome is communicated — not the reason.

Two buttons:
  "Explore Other Clusters" (teal filled)
  "Create Your Own" (teal outlined)
  "Close" gray text link below.

[CLIO_ANCHOR: anchor_invite_failed]
Bottom Navigation Bar: NOT visible.
```

### Screen 9.4 — Invite: New User Signup (Inline)

```
[GLOBAL STYLE PREFIX]

Quick signup form for new users arriving via invite link.
Top: Aggilo logo (center, 48px atom icon + wordmark). NO bottom nav.

Title: "Almost there." (H1, deep teal-navy)
Subtitle: "Create your Aggilo account to join this cluster."

Form fields (stacked):
  1. "Choose a Nickname" — input with "@" prefix. Placeholder: "e.g. creative_mind"
  2. "Phone or Email" — toggle tabs: Phone (default, +91 picker) / Email
  3. "Year of Birth" — Year selector (pre-filled from qualification step)
  4. "Gender" — pill selector (pre-filled from qualification step)

"Create Account and Join" teal button (full-width, 48px).

Below: "By registering, you agree to Aggilo's Terms of Service and Privacy Policy."

NO password field. NO real name field. OTP sent on next step after tapping create.

[CLIO]
Not present on this screen.
Bottom Navigation Bar: NOT visible.
```

---

## Flow 10: Report and Block (3 screens)

### Screen 10.1 — Report Post

```
[GLOBAL STYLE PREFIX]

Bottom sheet modal. Drag handle top. Title: "Report this post" with flag icon. X close.

"Why are you reporting this?" (bold)

Radio button list:
  Spam or misleading
  Harassment or bullying
  Hate speech
  Inappropriate content
  Violence or threats
  Other

Text area: "Additional details (optional)"

"Submit Report" teal button. ✕ (Close icon - with "Discard changes?" dialog if needed).

On submit: toast bar slides up from bottom (full-width, sage-green bg, white text, 4s):
  "Report received. We review within 24 hours."
  Medium haptic impact feedback on submit tap.
  Sheet dismisses. Returns to previous screen.

ℹ️ Tooltip: "Reports are reviewed by our moderation team within 24 hours. Your identity is kept confidential."

[CLIO]
Not present on this screen.
Bottom Navigation Bar: NOT visible.
```

### Screen 10.2 — Report User

```
[GLOBAL STYLE PREFIX]

Bottom sheet modal. Title: "Report @tech_nomad" with flag icon. X close.

"Why are you reporting this user?" (bold)

Radio list:
  Fake profile
  Harassment
  Spam behavior
  Inappropriate content
  Impersonation
  Other

Text area for additional details. "Submit Report" teal button.

On submit: toast bar slides up from bottom (full-width, sage-green bg, white text, 4s):
  "Report received. We review within 24 hours."
  Medium haptic impact feedback on submit tap.
  Sheet dismisses. Returns to previous screen.

ℹ️ Tooltip: "The reported user will not know who reported them."

[CLIO]
Not present on this screen.
Bottom Navigation Bar: NOT visible.
```

### Screen 10.3 — Block User Confirmation

```
[GLOBAL STYLE PREFIX]

Centered modal dialog. Dimmed backdrop.

Block icon at top (teal circle with slash, 48px).
Title: "Block @tech_nomad?" (H2, deep teal-navy bold)

Body — "Once blocked:" with bullet list:
  They cannot message you or send message requests
  They will not know they are blocked
  Your posts remain visible in the Timeline feed
  You can unblock them anytime from Settings

Two buttons:
  "Block" (teal filled)
  "Cancel" (gray outlined)

[CLIO]
Not present on this screen.
Bottom Navigation Bar: NOT visible.
```

---

## Flow 11: Other User Profile (1 screen)

> **Phase 1**: No DM button. Viewing another user's profile is limited to reading their
> public cluster-context info. The "Send Message" action is removed in Phase 1.

### Screen 11.1 — Other User Profile (Within Cluster Context)

```
[GLOBAL STYLE PREFIX]

Profile page of another user, accessed from cluster Members tab (renders as a full-page push transition, NOT a modal overlay).
Top bar: Back arrow (left). "Profile" title (center).

Context banner below top bar (persistent, light teal bg, full-width):
  "via Women Entrepreneurs" — tapping navigates back to the cluster.

Profile card:
  Avatar (80px circle)
  "@tech_nomad" (H2 bold, deep teal-navy)
  "Member since Feb 2026" (gray 14px)
  "Mutual clusters: 2" (teal text — shared cluster count)

Tabs: "About" (selected, teal underline) / "Shared Clusters"

About tab:
  Bio: "Tech enthusiast and startup mentor..."
  Gender: "Male"
  Age Group: "25-30"
  Location: "Hyderabad"
  Languages: "English, Hindi"

Action buttons:
  Stage 1-2: No "Message" button. Simply absent — no explanation.
  Stage 3: "Message" (teal outlined button) — opens DM thread with this user.
  "Report User" (gray text link, below profile)
  "Block User" (red text link)

MINIMAL info. No email, phone, exact Year of Birth, real name. Only cluster-context public info.

Important: "Back to Women Entrepreneurs" floating teal pill (bottom-right, above nav) —
  appears when scrolled. Brings user back to cluster context.

[CLIO]
Not present on this screen.
Bottom Navigation Bar: NOT visible (sub-page — back arrow present).
```

---

## Flow 12: System & Accessibility States (4 items)

### Screen 12.1 — Network Offline State

```
[GLOBAL STYLE PREFIX]

Persistent slim banner appears below top navigation bar when offline.
Banner bg: Red tint. Text: "No internet connection." (white/dark red, 12px)
Content below continues to show cached state exactly as it was. No loaders, no spinning until retry.
Clio FAB becomes semi-transparent (disabled).
```

### Screen 12.2 — Error Modal

```
[GLOBAL STYLE PREFIX]

Centered modal. Appears on 5xx errors or action timeouts (e.g., failed to create cluster).
Icon: Alert triangle (gray).
Title: "Something went wrong."
Body: "The network response took too long. Please try again."
"Retry" (teal button) | ✕ (Close icon).
```

### Screen 12.3 — Push Notification Prompt (Contextual)

```
[GLOBAL STYLE PREFIX]

Appears at Stage 2 unlock (after Clio points to Activity tab).
Standard OS permission dialog is preceded by a soft-ask bottom sheet:
Title: "Get updates."
Body: "Let Clio notify you when there's new activity in your clusters or a new DM."
"Yes, notify me" (triggers OS prompt) | "Maybe later" (silent dismiss).
```

### 12.4 — Accessibility Guidelines (System-wide)

```
Touch Targets: All interactive elements (Chips, Tags, "+" buttons) must have a minimum touch target size of 44x44 points.
Contrast: Text colors (e.g., Teal #164E63 on Light background) must meet WCAG AA contrast ratio (4.5:1).
Reduced Motion: If the host OS "Reduce Motion" setting is ON, Clio's pulsing/scanning animations downgrade to static states or slow fades. Let the user opt out of animation.

Focus Management:
  - All buttons, chips, and interactive elements MUST show a visible focus ring on keyboard navigation
    (2px ring, primary teal, 2px offset from element edge).
  - Clio FAB panel: opening the panel MUST trap focus inside the panel. Tab cycles through panel
    elements only. Pressing Escape closes the panel and returns focus to the FAB button.
  - Bottom sheets and modals: focus trap active while open. Escape dismisses. Focus returns to
    the element that triggered the sheet/modal.
  - The Clio message area inside the panel MUST have aria-live="polite" so screen readers announce
    new messages without interrupting the user.

Screen Reader Semantics:
  - Clio FAB: role="button", aria-label="Open Clio assistant"
  - Sage post cards: role="article", aria-label="Sage anchor post: [framing line text]"
  - Cluster cards: role="article", aria-label="[Cluster name], [member count] members"
  - Bottom nav tabs: role="tablist" with role="tab" children, aria-selected on active tab
  - OTP input boxes: role="group", aria-label="Enter verification code", each box aria-label="Digit N"
  - Activity badge (bell): aria-label="Notifications, N unread"
  - Shimmer skeletons: aria-hidden="true" (decorative, not content)

Skip Navigation:
  - A visually hidden "Skip to main content" link MUST be the first focusable element on every screen.
    It becomes visible on focus and jumps past the top bar and tab bar to the main content area.
```

### 12.5 — Mandatory Screen States (Loading / Empty / Error)

> Every screen that fetches data from the backend MUST define three visual states in its spec.
> If a screen spec does not explicitly define all three, implementers MUST create them following
> the default patterns below. This is not optional.

```
DEFAULT LOADING STATE (if not specified per-screen):
  - 3 shimmer skeleton cards (pulsing #F0FDFA, 16px radius, 100ms stagger between cards)
  - Clio FAB (48px) bottom-right, Thinking state (M2 processing eyes)
  - If load exceeds 5 seconds: Clio speech bubble from FAB: "Still loading. Hang on."

DEFAULT EMPTY STATE (if not specified per-screen):
  - Clio Prominent (80px, Curious mood) centered
  - One-sentence speech bubble in Clio's voice — contextual to the screen, never generic
  - Tapping Clio opens her FAB panel

DEFAULT ERROR STATE (if not specified per-screen):
  - Centered modal card (Elevation 3, 24px rounded corners)
  - Alert triangle icon (gray, 48px)
  - Title: "Something went wrong." (H2, deep teal-navy)
  - Body: "The network response took too long. Please try again."
  - "Retry" (teal button) | X close icon
  - Retry re-triggers the original data fetch

SCREENS THAT REQUIRE ALL THREE STATES:
  - Screen 3.1 / 3.2 / 3.4 (Explore — loads cluster cards) ✅ 3.1 has loading + empty
  - Screen 4.0 / 4.1 (Cluster Timeline — loads posts) ✅ 4.0 has loading; 4.1 has empty
  - Screen 4.2 (Members — loads member list)
  - Screen 4.3 (Messages Inbox — loads threads) ✅ has empty
  - Screen 6.1 (Activity — loads feed) ✅ has empty
  - Screen 7.1 (Profile — loads user data)
  - Screen 7.2 (Interests — loads interest grid)
  - Screen 9.1 (Invite Landing — loads cluster preview)
```

---

## Phase 1 Screen Checklist

| # | Screen | Flow | Phase 1 Status |
|---|--------|------|----------------|
| 0.1 | Clio-Narrated Walkthrough (4 slides) | Intro | INCLUDED |
| 1.1 | Login / Signup | Auth | INCLUDED |
| 1.2 | OTP Verification | Auth | INCLUDED |
| 1.3 | Returning User Login | Auth | INCLUDED |
| 2.1 | Year of Birth + Gender | Registration | INCLUDED |
| 2.2 | Language Selection | Onboarding | INCLUDED |
| 2.3 | Nickname + Purpose and Tags | Onboarding | INCLUDED |
| 2.4 | Location Permission | Onboarding | INCLUDED |
| 2.5 | Profile Created: Clio Welcome Transition | Onboarding | INCLUDED |
| 2.6 | Clio Welcome Conversation (first-time only) | Onboarding | INCLUDED |
| 2.6E | Clio Welcome: Evangelist (replaces 2.6 for invite users) | Onboarding | INCLUDED |
| 3.1 | Explore: First Visit (Clio query running) | Landing | INCLUDED — Phase 1 default home |
| 3.1E | Explore: Evangelist First Visit (pre-loaded results) | Landing | INCLUDED |
| 3.2 | Explore: Populated Return Visit (with My Clusters strip) | Landing | INCLUDED |
| 3.3 | Clio AMA Panel (Discovery Calibration) | Landing | INCLUDED — settings icon entry |
| 3.4 | Explore: Calibrated Results | Landing | INCLUDED |
| 4.0 | Cluster: Loading State (shimmer skeleton) | In-Cluster | INCLUDED |
| 4.1 | Cluster: Timeline Tab (DEFAULT) | In-Cluster | INCLUDED — Timeline is default |
| 4.2 | Cluster: Members Tab | In-Cluster | INCLUDED — DM via action sheet (Stage 3 only) |
| 4.3 | Cluster: Messages Inbox (Stage 3 only) | In-Cluster | INCLUDED |
| 4.4 | Post Composer | In-Cluster | INCLUDED |
| 4.5 | Cluster Info Sheet | In-Cluster | INCLUDED — Score hidden from members |
| 4.6 | Share Cluster Sheet | In-Cluster | INCLUDED |
| 5.1 | Clio Chat Overlay: Unmet Need Detected | Creation | INCLUDED — floating panel, no dimming |
| 5.2 | Clio Surfaces Similar Clusters | Creation | INCLUDED — check before create |
| 5.3 | Clio Disambiguation (User insists it is different) | Creation | INCLUDED |
| 5.4 | Clio Creation Conversation (3 questions) | Creation | INCLUDED |
| 5.5 | Clio Brief Confirmation | Creation | INCLUDED |
| 5.6 | Cluster Created: Success Overlay | Creation | INCLUDED |
| 6.0 | Activity: Stage 1 Locked State (tab absent) | Activity | INCLUDED — no UI shown |
| 6.1 | Activity Feed (Stage 2 — Clio-unlocked) | Activity | INCLUDED |
| 6B.1 | Feature Intro: Activity (Stage 1→2, same session) | Progression | INCLUDED |
| 6B.2 | Feature Intro: DM (Stage 2→3, next session open) | Progression | INCLUDED |
| 6B.3 | Feature Re-introduction (unlocked but unused) | Progression | INCLUDED |
| 7.1 | My Profile (You tab) | Profile | INCLUDED |
| 7.2 | Profile Interests Tab | Profile | INCLUDED |
| 7.3 | Settings | Profile | INCLUDED |
| 8.1 | Tour: Clio Welcome | Onboarding Tour | INCLUDED |
| 8.2 | Tour: Explore Tab | Onboarding Tour | INCLUDED |
| 8.3 | Tour: Clio FAB (replaces + FAB from v1) | Onboarding Tour | PHASE 1 UPDATED |
| 8.4 | Tour: Cluster Cards and Timeline | Onboarding Tour | INCLUDED |
| 9.1 | Invite Landing (Guest) | Invite | INCLUDED |
| 9.2 | Invite: Qualification Passed | Invite | INCLUDED |
| 9.3 | Invite: Qualification Failed | Invite | INCLUDED |
| 9.4 | Invite: New User Signup (Inline) | Invite | INCLUDED |
| 10.1 | Report Post | Moderation | INCLUDED |
| 10.2 | Report User | Moderation | INCLUDED |
| 10.3 | Block User | Moderation | INCLUDED |
| 11.1 | Other User Profile (within cluster context) | Profiles | INCLUDED — No DM button |

**Total: 50 screens**

### Sage 2-Message Limit (SOUL.md compliance)

Sage may not post more than **2 proactive messages in any 24-hour window per cluster** (tracked via `sage_posts_today`).
Timeline curation items (Atlas-fetched content posted by Sage) and Clio's direct replies to user messages via the FAB panel do not count toward this limit.
When both messages are used, Sage is silent until the 24h window resets. Clio (FAB-only, personal chat) is unaffected by this limit.

### Screens from v1 Excluded in Phase 1

| Screen (v1) | Reason Excluded |
|-------------|-----------------|
| Screen 3.1/3.2 Dashboard (Home tab) | No Home tab in Phase 1 |
| Screens 4.2–4.5 Search and Filter flows | Search hidden until ~10k users |
| Screens 5.1–5.5 Create Cluster Wizard | Wizard hidden; Clio-only creation |
| Screen 6.2 Cluster Media Tab | Media hidden until ~10k users |
| Screens 7.1–7.2 DM Chat and DM List | DMs hidden until ~50k users |
| Screen 9.1–9.2 Notification Settings | Merged into Settings 7.3 |
| Screen 12.3 Tooltip on + FAB | + FAB does not exist in Phase 1 |

---

## Phase 1 Proactive Behaviors: Quick Reference (Clio + Sage)

> **Note**: This table defines *when* each agent becomes active. Clio's behaviour, language, and character are defined in **`clio_character_prompt.md`**. Sage's are defined in **`sage/SOUL.md`** and **`sage/AGENTS.md`**.

### Clio Proactive Behaviors (FAB-only — never posts to cluster Timeline)

| Trigger | Clio Behavior | Allowed In Phase 1 |
|---------|--------------|---------------------|
| Stage 2 signals met (cluster opened, post read, return visit, Clio response) | Clio unlocks Activity tab (same session) + opens panel with one sentence | YES |
| Stage 3 signals met (posted/commented/reacted in cluster) | Clio sets Stage 3 flag — DM appears on next session open with one-sentence intro | YES |
| Feature unlocked but unused after 2 return visits | Clio opens panel with one re-introduction sentence. Once only. | YES |
| First Explore load | On-demand query + shimmer + insight pill | YES |
| 60s browse without tapping | Speech bubble: "Still looking?" (once/session) | YES |
| Zero cluster results | Prominent Clio (80px) + offer to create | YES |
| User taps Tune ⚙ icon | Clio opens AMA panel — listens, infers, calibrates | YES |
| 2+ Explore visits, no card tapped, no calibration | Speech bubble pointing to Tune icon (once/session, drops if ignored) | YES |
| Calibrated results = zero | Clio Prominent (80px) — adjust or reset options only | YES |
| User expresses unmet need via FAB | Clio opens floating panel, checks similar clusters first | YES |
| 10-member milestone | Private message to Founder in Cluster Info sheet (Clio, not Sage) | YES |
| Incomplete user profile | Contextual banner in Profile tab | YES |

### Sage Proactive Behaviors (cluster Timeline only — posts as `system_sage`)

| Trigger | Sage Behavior | Allowed In Phase 1 |
|---------|--------------|---------------------|
| Cluster Phase A (0 posts) | Host post: 1 Atlas content card in Timeline under `system_sage` | YES |
| Cluster Phase B (first ever post) | 1-sentence acknowledgement within 60s, posted to Timeline | YES |
| Cluster Phase C (72h silence) | 1 Timeline curated item with question frame (if Atlas finds ≥90% relevance) | YES |
| Cluster Phase E (10 members, thriving) | Milestone post in Timeline. Then permanently passive | YES |
| Dormant member returns (7+ days) | Contextual post in the Timeline (if something happened since their last visit) | YES |


---

---

# 📱 Phase 0 — Sisters in Dua MVP Screen Behaviour

> **What this section is**: The screen behaviour specification for the Sisters in Dua MVP (`mvp.aggilo.in`). This is Phase 0 of the Aggilo platform — a single premium cluster running on a stripped-down Next.js 14 stack. It is NOT the full platform described above. Phase 1 (the full platform) is described in the sections above.
>
> **Relationship to Phase 1**: Phase 0 validates the agent behaviour, UX hierarchy, and closed-loop telemetry that Phase 1 inherits. Where Phase 0 and Phase 1 differ, Phase 0 is the simpler, more constrained version. Nothing in this section overrides Phase 1 — they are parallel specifications for different deployment stages.
>
> **Nothing deleted**: This section is an addendum. All Phase 1 content above remains authoritative for the full platform.

---

## Phase 0 Constraints

| Feature | Phase 0 State |
|---------|---------------|
| Clusters | 1 only — Sisters in Dua (premium) |
| Cluster creation | Not available |
| AGGIL engine | Not active |
| Scout | Not active |
| Atlas | Not active — vault-only references |
| Observer | Not active |
| Geographic gate | India only |
| Gender gate | Women only (hard gate at onboarding) |
| Bottom navigation | Not present — single-cluster app |
| Explore tab | Not present |
| Activity tab | Not present |
| DM | Not present |
| Search | Not present |
| Cluster creation wizard | Not present |

---

## Phase 0 Layout Hierarchy

The correct visual hierarchy for Phase 0 (and inherited by Phase 1 for all cluster types):

```
Navbar (sticky top — Aggilo logo, Features link, Admin link if admin, Logout)
Cluster header (presence: live count, total, joined this week)
Pinned anchor (ultra-minimal collapsed strip — room's founding statement)
Timeline (the conversation — immediately visible)
Agent Thoughts (below timeline — accessible by scrolling)
Compose bar (sticky bottom — the room's welcome surface)
Clio FAB (top-right, 44px)
```

**Why this order matters:**

The hierarchy communicates: *"You came here to talk. The agents are working in the background."* Members see the conversation first. Agents are in service, not in the foreground.

Agent Thoughts is below the timeline because agents serve the conversation — they are not the conversation. Members who scroll down to Agent Thoughts are the most engaged members. This is a self-selection filter that improves the quality of feature feedback.

---

## Phase 0 Screen Specifications

### Screen P0.1 — Landing Page (unauthenticated)

```
Dark background (#0b0d0f). Centered layout. No navigation.

Hero section:
  Aggilo "A" logo (teal, 5xl, bold)
  Cluster name: "Sisters in Dua" (H1, white, bold)
  Tagline: "Faith lived, discussed, and held together." (gray, lg)

Clio introduction card (dark bg #161a14, emerald border):
  🤲 "Assalamu Alaikum"
  Description: "A women-only community for Muslim women navigating faith in real life.
    Not a classroom. Not a fatwa service. A space where women talk honestly about
    what it means to stay close to Allah — through doubt, difficulty, routine,
    and everything in between."
  "Grounded in Quran and authentic Sunnah. Every cluster is actively hosted.
    Guided by practitioners and scholars."
  Italic note: "Your community Anchor keeps the discussion grounded in verified
    sources and holds the space. The Admin and Managers are who you go to for guidance."
  Beta indicator: green pulse dot + "Currently in beta"

Privacy note (dark bg #11140f, gray border):
  "Your privacy matters. You will choose a nickname — no real names are shown.
    This is a safe, women-only space."

Auth form (below hero)

Footer: "Verified sources only. Quran and authentic Sunnah. By Aggilo."
```

### Screen P0.2 — Auth Form (Sign In / Create Account)

```
Two-tab toggle: "Sign in" | "Create account" (emerald active state)

SIGN IN tab:
  Email input
  "Email me a sign-in link" button (emerald)
  "No password. We send a link that signs you in." (gray, xs)

CREATE ACCOUNT tab (multi-step):
  Step 1 — Email
  Step 2 — Nickname (privacy note: "Nicknames let you speak freely. Real identity stays private.")
  Step 3 — Gender (women-only gate: "To protect the vulnerability of the sisters inside...")
    Options: Woman / Man / Prefer not to say
    Non-women → waitlist screen
  Step 4 — Country (India-only gate)
    GPS detection option (consent-based)
    Country dropdown
    Non-India → waitlist screen
    India → send magic link

SUCCESS STATE:
  "Check your email"
  "We sent your sign-in link to [email]. Click it from any device."
  Note for existing users: "Looks like you already have an account — we sent you a sign-in link instead."
```

### Screen P0.3 — Cluster (authenticated, main view)

```
NAVBAR (sticky top, dark bg):
  Left: Aggilo "A" logo + "Aggilo" wordmark
  Right: "Features" link | nickname | "Admin" link (admin/manager only) | "Logout"

CLUSTER HEADER:
  Cluster icon (🤲) + "Sisters in Dua" (H1, bold)
  "Women Only" badge (emerald, top-right, hidden on mobile)
  Tagline: "Faith lived, discussed, and held together." (sage-green, sm)
  Description (gray, sm)
  PRESENCE INDICATOR (prominent, below description):
    Green pulse badge: "X sisters live now" (emerald-50 bg, emerald-200 border, emerald-800 text)
    "Y sisters total" (gray, xs, with people icon)
    "Z joined this week" (emerald-700, xs) — only shown when Z > 0
  Meta row: "Beta Cluster · Hosted community · Verified sources only" (gray, xs)

PINNED ANCHOR (ultra-minimal when collapsed):
  Thin line: "Room anchor · tap to read" (gray, italic, xs)
  Expand chevron (gray)
  When expanded: soft emerald tint, smaller avatar, lighter border

TIMELINE (the conversation — immediately visible):
  Reverse-chronological (newest first)
  Empty state: 🤲 "Assalamu Alaikum, sister. This room is yours. Share what's on your heart."
  Member posts: avatar initial + nickname + role badge (Admin/Manager) + timestamp + content
  Sage posts: smaller avatar (20px, opacity-90) + "Sage" (medium weight) + "Anchor" badge (emerald-50, emerald-600) + content
    Sage post visual weight: 2px muted left border (emerald-300/60), very subtle bg (emerald-50/20)
    Sage feedback: 👍 Helpful / 👎 Missed / ⚠ Off — small, muted, non-intrusive
  Online dot: emerald-500 on member avatar when online

AGENT THOUGHTS (below timeline):
  Collapsed by default: "🔵 Agent Thoughts — Clio & Sage working on this room" strip
  Subtitle when expanded: "Their working dialogue about this room — not the conversation itself."
  Exchanges: Sage: [message] / Clio: [message]
  "See all thoughts →" link
  New exchange badge when minimized

COMPOSE BAR (sticky bottom):
  Warm background (#faf9f6, amber-100/80 border)
  Rotating daily nudge as placeholder (specific, lived, non-generic)
  Rounded send button (circle, aggilo-deep)
  Typing indicator above: "a sister is writing…" (anonymous, emerald dots)
  Footer: "Verified sources only · Ctrl+Enter to send" (hidden when composing)

CLIO FAB (top-right, 44px):
  Position: fixed top-72px right-16px
  Dual-tab panel: "Just between us" (private, 12h TTL) | "Ask me anything" (cluster-aware)
  Rose dot when unread Sage→Clio handoff greeting
```

### Screen P0.4 — Features Tab (`/cluster/features`)

```
Back navigation: "← Back to room"
Title: "Features" (center)

Header:
  "What might help this room" (H2)
  "The agents are quietly thinking about what tools or features could genuinely serve
    sisters here. When they agree on something concrete, it shows up below. Your
    upvotes and comments shape what gets built."

TIER STATES:
  < 5 members: "Coming soon" placeholder
    "The room is still finding its rhythm. Once a few more sisters are here,
      you'll see proposed features show up to vote on."
  5–14 members: "The agents are listening" placeholder
    "Nothing has converged yet. Sage and Clio meet periodically to talk about
      what this room needs. When they agree on something specific, you'll see it here first."
  ≥ 15 members: Active feature cards

FEATURE CARD:
  Feature name (H3, bold)
  Description (sm, gray)
  Rationale (italic, gray, border-l-2 border-gray-200)
  Status chip: "Open for feedback" (amber) | "Approved" (emerald) | "In development" (sky) | "Now live" (emerald-100)
  Upvote button (disabled < 15 members, active ≥ 15)
  "Proposed by Sage & Clio" or "Proposed by a sister" (gray, xs)
  Note when < 15 members: "Voting and comments open when the room has 15 sisters."

Footer:
  "Members: X · [tier status message]"
```

### Screen P0.5 — Admin Dashboard (`/admin`)

```
Admin navbar (sticky top, white):
  Left: "A" logo + "Admin" label + "Sisters in Dua" context
  Right: nickname + role label + "Back to room" link
  Tab bar: Overview | Welfare | Care | Agent Thoughts | Vault | LLM | Features | Events
  Welfare and Care tabs show realtime badge counts (rose/amber)

OVERVIEW PAGE:
  Stat grid (2-3 cols):
    Welfare — open (rose if non-zero)
    Care — open (amber if non-zero)
    Members (total)
    Member posts (24h)
    Sage activity (24h) — with silence rate hint
    LLM spend today — with budget % hint
    Fallback hits (24h)
    Member feedback (7d) — X 👍 / Y 👎
  "How this dashboard works" explainer (no protocol disclosure)

WELFARE PAGE:
  Open queue (rose border cards)
  Each card: nickname, country, time, post content, Sage's response, "Mark resolved" button
  Realtime: new flags appear without refresh
  Resolved section (last 20)

CARE PAGE:
  Open queue (amber border cards)
  Each card: nickname, country, time, post content, Sage's response, admin note textarea, "Mark resolved"
  Realtime: new flags appear without refresh
  Resolved section

AGENT THOUGHTS PAGE:
  Sage activity distribution (last 7d) — neutral labels (Welfare response, Care response, etc.)
  Latest Clio↔Sage exchanges (cadence, introspection, sage_dua, sage_initiated)
  Latest 50 Sage activity rows (no rationale shown — protocol not disclosed)

VAULT PAGE:
  Stats: total entries, verified, gaps flagged
  Vault gaps list (amber border) — "Add this dua?" with dismiss
  All entries table (title, source, grade, tags, verified, times surfaced)
  Approved sources list

LLM PAGE:
  Today stats: calls, cost, fallbacks, operations
  Today by operation table (agent, operation, calls, tokens, avg latency, fallbacks, cost)
  Recent 50 calls table

FEATURES PAGE:
  All features (including proposed_in_thoughts — admin sees all)
  Status pipeline explanation
  Approve / defer / reject controls

EVENTS PAGE:
  Last 24h by type (grid)
  Last 100 events table
```

---

## Phase 0 Agent Behaviour Summary

### Sage (cluster Anchor)

| Behaviour | Phase 0 implementation |
|---|---|
| Evaluates every member post | `POST /api/sage/evaluate` — fire-and-forget from PostComposer |
| Decision framework | 6 steps: welfare → character → citation → authority_redirect → reference_surface → care_witness → witness_participation → silent |
| Dua suggestion (cadence) | `POST /api/sage/suggest-dua` — fires 5s after cluster mount, 6h floor, 2/day cap |
| Dua repetition guard | 14-day vault-ID exclusion (cadence path) + reply-style pointer (evaluate path) + Jaccard similarity (both paths) |
| Structured decision tag | `<<<SAGE_DECISION:{...}>>>` stripped before display, logged to `sage_decision_logs` |
| No protocol disclosure | Never narrates decision tree. Never explains why she stayed silent. |
| No repetition | Prompt-level + application-level Jaccard guard (threshold 0.55) |
| Welcome new member | `POST /api/agents/welcome-new-member` — one short line, idempotent, batched |

### Clio (personal guide + orchestrator)

| Behaviour | Phase 0 implementation |
|---|---|
| Dual-tab FAB | "Just between us" (ephemeral, sessionStorage) + "Ask me anything" (cluster-aware, localStorage) |
| Sage→Clio handoff | `clio_handoff_greetings` table, realtime subscription, rose dot on FAB |
| Cadence exchange | `POST /api/agents/cadence-exchange` — 12s after mount, 15min cold floor, 1h active floor |
| Introspection cycle | `POST /api/agents/introspect` — 25s after mount, 6h floor, minimum-activity gate (3+ posts since last run) |
| Feature proposals | Cadence and introspection write to `cluster_features` when agents converge |

### Agent Thoughts (visible to all members)

| Behaviour | Phase 0 implementation |
|---|---|
| Collapsed by default | localStorage preference, default true |
| Subtitle | "Their working dialogue about this room — not the conversation itself." |
| Realtime | Supabase Realtime INSERT subscription on `agent_chatbox_exchanges` |
| Trigger types | `cadence` | `sage_dua` | `sage_initiated` | `introspection` |
| Seed fallback | `SEED_CHATBOX_EXCHANGES` shown when table is empty |

---

## Phase 0 → Phase 1 Transition

When Phase 1 launches, the following Phase 0 patterns are inherited unchanged:

- Hierarchy-first layout (members first, agents in service)
- Compose bar as primary welcome surface with rotating nudge
- Agent Thoughts below the timeline, collapsed by default
- Dua repetition protocol (vault-ID dedup + pointer behaviour + Jaccard guard)
- Welfare and care protocols
- No protocol disclosure (admin sees neutralised labels only)
- Introspection cycle (Clio reads telemetry, produces self-critique + proposal)
- Feature pipeline (Agent Thoughts → cluster_features → member polling → admin approval)

The following Phase 0 constraints are lifted in Phase 1:

- India-only geographic gate
- Women-only gender gate (becomes cluster-configurable)
- Single cluster (generic cluster creation enabled)
- Vault-only references (Atlas enabled)
- Manual admin elevation (auto-elevation via AGGIL engine)
- Next.js 14 stack (migrated to React 18 + Vite + Node/Fastify + BullMQ)


---

## Phase 0 validated UX patterns — to incorporate into Phase 1 designs

> **Status:** Additive section. Nothing above this section was modified.
> **Source:** Patterns validated in pilot operation (V3.9 anchored Clio
> tour + V3.10 cluster UX pass) that are **production-grade** and
> should propagate into the Phase 1 mobile screens. Cluster-specific
> copy (e.g. "sister", "Sisters in Dua") deliberately not repeated here
> — Phase 1 surfaces inherit cluster vocabulary from the cluster
> registry, not from screen prompts.
>
> **How to apply:** Each pattern below names which existing screen(s)
> in this document it retrofits into. When the Phase 1 designs are
> updated, the retrofit notes are the integration map.

---

### A. Anchored Clio tour (replaces / extends Flow 8 — Welcome Tour)

**What was validated:** A guided contextual tour where Clio narrates
each cluster surface with a small popover anchored beside the
highlighted element, plus click-anywhere-to-dismiss, plus a help list
that doubles as the reopen handle.

**Pattern:**

1. Member opens Clio's chat panel inside a cluster.
2. The panel exposes a collapsible "What's on this page?" section with
   a list of surfaces (Live presence, Cluster restrictions, Pinned
   anchor, Posts & timeline, Compose bar, @Sage feature, Sage's posts,
   Room Workshop, Clio herself).
3. Tapping a topic closes the chat panel, smooth-scrolls to the
   target surface, applies a 3px emerald highlight ring, and lands a
   small Clio-attributed popover beside the surface.
4. Popover carries: Clio avatar + "Clio · this is here" label, the
   surface label, a one-or-two-sentence deterministic description,
   step counter (e.g. "8 of 9"), Back / Next buttons, and a close ×.
5. Click anywhere outside the popover (and outside the highlighted
   target) closes the tour. Esc also closes. Arrow keys step.
6. Reopening Clio's panel shows which step is currently active
   ("showing now" tag in green next to the topic).

**Retrofit notes:**

- **Flow 8 (Welcome Tour)** currently describes a contextual tooltip +
  spotlight overlay first-time-only. Replace the spotlight overlay with
  the anchored-popover model above. The first-time-only constraint
  remains; the reopen-anytime behaviour is added.
- **Flow 4 (In-Cluster Experience)** screens that introduce surfaces
  for the first time can carry the "Tap Clio to learn" affordance
  instead of inline tooltips that block the surface.

**Why this matters in Phase 1:** the anchored model is mobile-friendly
without redesign (popover flips above/below the target as needed,
re-clamps to viewport on rotate). The spotlight-overlay model in the
current Flow 8 hides part of the surface; the anchored model never
does. UX research finding: members associate the explanation with the
thing more reliably when the explanation sits beside the thing rather
than narrated centrally.

**Deterministic copy rule:** the tour's popover descriptions are
hand-written, not LLM-generated. Carry this forward — Phase 1's
Welcome Tour copy is platform-template, not generated per-cluster.

---

### B. Click-outside dismissal as the default for member popovers

**What was validated:** Across the tour, the privacy explainer banner,
and the help section, the most learned web pattern is "click anything
outside this thing to dismiss it". Members do not need to discover an
× button to close.

**Pattern:**

- All popovers, tooltips, and modal-lite overlays in the cluster surface
  honour click-outside-to-dismiss.
- × is kept as a visible affordance for users who prefer clicking it.
- Esc closes any popover that's open.
- Tapping the highlighted target itself does not dismiss — members can
  interact with what they're learning about (e.g. tap a post during a
  tour step) without the overlay vanishing on the way to the popover.

**Retrofit notes:**

- **Flow 4** action-sheet patterns already follow this rule. Verify
  every modal in the document does.
- **Flow 6B (Feature Introduction Moments)** explicitly: feature-intro
  popovers should dismiss on outside-click, not require a "Got it"
  button.

---

### C. Skip-to-content link (WCAG 2.4.1)

**What was validated:** A visually-hidden "Skip to feed" link as the
first focusable element on the cluster page. Reveals on Tab focus with
a high-contrast button; activates a programmatic focus on the timeline
anchor.

**Retrofit notes:**

- **Flow 4 (In-Cluster Experience)** — every cluster page in Phase 1
  exposes a skip link. Mobile keyboard users (Bluetooth keyboards,
  switch-control accessibility) benefit equally to desktop.
- **Flow 1 (Authentication)** — the same pattern on auth screens to
  skip past brand chrome to the form.
- **Phase 1 Screen Checklist** — add a column "Skip-to-content
  validated" to the checklist.

**Implementation note:** the skip link's target should accept
programmatic focus (`tabIndex={-1}` on the timeline / form container)
so the Enter activation actually moves focus, not just scroll position.

---

### D. Live-region announcements for arriving content

**What was validated:** The "↑ N new posts" pill announces its count
change to screen readers via `role="status"` + `aria-live="polite"`,
with an explicit `aria-label` that includes the action ("3 new posts —
tap to view"). Sighted users see the visual; non-sighted users hear
the count when it updates.

**Pattern:** Any surface that asynchronously reveals new content while
the user is on the page wraps its visible counter in
`role="status" aria-live="polite"`, and the interactive affordance
carries a verbose `aria-label` over the visual-only icon ("↑").

**Retrofit notes:**

- **Flow 4 (In-Cluster Experience)** — the new-posts pill, the typing
  indicator, the unread Activity badge, and any other realtime counter
  apply this rule.
- **Flow 6 (Activity Tab)** — unread count change announcements honour
  the rule; activity items with new replies announce as they arrive
  while the tab is open.

---

### E. Fixed-height typing indicator slot (no compose-bar shift)

**What was validated:** Reserving a fixed-height slot for the typing
indicator above the compose bar — empty when nobody types, filled when
one or more members type — eliminates the iOS-keystroke focus shift
that occurred when the slot rendered conditionally. The empty slot is
`aria-hidden` so screen readers don't announce a blank live region.

**Retrofit notes:**

- **Flow 4, Screen 4.1 (Cluster Timeline)** — the typing indicator
  always reserves space, even when no one is typing. Compose bar
  vertical position is stable.
- Apply the same rule to any future "presence" indicator (Sage
  considering, Clio thinking, member joined) that sits in the
  scroll-position-sensitive region.

---

### F. Self-describing collapsed strips

**What was validated:** When a content strip collapses to save vertical
budget, the collapsed state must self-describe. The pinned anchor
strip's collapsed copy reads "From Sage · Anchor — tap to expand" —
source named, intent named, action named. The previous "Room anchor ·
tap to read" was content-blind.

**Pattern:** Collapsed strips name three things in their visible row:

1. The source / author (so members know whose voice they'd hear)
2. The intent (what kind of content is inside)
3. The action (how to open)

**Retrofit notes:**

- **Flow 4** — the pinned anchor, the Workshop strip, and any future
  collapsed-by-default surface follow this rule.
- **Flow 6B** — feature-intro moments that introduce a collapsed
  surface name the source explicitly ("From Clio — a new way to…").

---

### G. Six-accent budget for the cluster surface

**What was validated:** The cluster surface uses exactly six accents,
each with one specific meaning. New surfaces reuse one of the six;
they do not introduce a seventh.

| Accent | Meaning |
|---|---|
| Aggilo deep | Brand + private chat surface + post-author bubble |
| Amber | Cluster persistence (AMA/Private Chat) + warm chrome |
| Rose | Welfare handoff (lowest-saturation use, safety floor) |
| Indigo | Fiqh-with-distress handoff |
| Sky / cyan | Workshop strip + agent infrastructure |
| Emerald | Verified content + tour highlight + on-topic link badge |

**Retrofit notes:**

- **All flows** — when a new screen is designed, its accent comes from
  the table above. If the screen needs a meaning that isn't on the
  table, open a UX issue to retire one of the six before adding a
  seventh.
- **Phase 1 Screen Checklist** — add a "Accent in budget" column.

---

### H. First-session cadence gate for ambient agent dialogue

**What was validated:** Members who land in a cluster for the first
time see the room before the agents start their visible Workshop
dialogue. Cadence-exchange (Sage ↔ Clio Workshop dialogue) skips the
member's very first session and runs from session two onward. This
prevents "agents debating about a cluster you don't yet understand"
from being a member's first impression.

**Retrofit notes:**

- **Flow 4** — the Workshop strip on first cluster visit shows a
  static placeholder ("What we're building for this room"). Live
  exchanges begin from the second session.
- **Flow 8 (Welcome Tour)** — the tour can include a Workshop step
  that explains the strip without yet showing live agent dialogue.

---

### I. Compose-bar placeholder discipline

**What was validated:** Long, comma-strung placeholders truncate on
narrow inputs. The compose-bar default is ≤30 characters, and a
per-user daily-rotating nudge handles variety. The placeholder is the
door, not the script — short and inviting.

**Retrofit notes:**

- **Flow 4, Screen 4.1** — compose placeholder follows this rule.
- **Flow 5 (Cluster Creation)** — Clio's input prompts to the user
  also follow this rule for every text-entry step.

---

### J. Members are the principal — never the subject in agent copy

**What was validated:** Across every member-facing surface and every
agent-to-agent visible dialogue, the room and the agents' work are
valid subjects. **Member behaviour is not.** Phrases like "members
have been…", "the room feels…", "engagement has been…" are forbidden
in member-visible copy. The platform's prompt-level enforcement runs
in production; the screen prompts here mirror the rule for designers.

**Retrofit notes:**

- **Flow 4 (Workshop)** — the dialogue surfaced live in the Workshop
  strip never references member behaviour. Designers verifying screen
  copy against the agent-collaboration chatbox content should reject
  any draft that contains member-subject language.
- **Flow 6 (Activity Tab)** — notifications about cluster activity
  describe what happened in service terms ("Sage shared a new
  reference", "Clio updated the room's tools"), not member-behaviour
  terms.

---

*Section J appended 2026-05-22. Patterns validated in pilot operation;
applied to every Phase 1 cluster (premium and generic) without
modification.*
