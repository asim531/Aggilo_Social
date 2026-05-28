# 📱 Aggilo Mobile v1 — UI Design System & Screen Prompts

> **Purpose**: Comprehensive design system + prompts for AI image generators (Midjourney / DALL-E / Ideogram)  
> **Device frame**: iPhone 15 Pro — 6.1" screen, Dynamic Island notch, thin bezels  
> **Design Language**: Material Design 3 inspired, clean & premium  

---

## 🎨 UI Design System

### Color Palette — "Ocean Calm"

| Token | Hex | Usage |
|-------|-----|-------|
| **Primary** | `#0891B2` | CTA buttons, selected tabs, FAB, links, logo |
| **Primary Dark** | `#0E7490` | Hover/pressed states on primary buttons |
| **Primary Tint** | `rgba(8,145,178,0.08)` | Selected chip backgrounds, light button fills |
| **Secondary** | `#164E63` | Headings, titles, nav bar text, dark cards (AGGIL suggestion) |
| **Accent** | `#F59E0B` | Amber-gold — score rewards, "Ask" badge, highlights, Founder badge |
| **Accent Light** | `#FEF3C7` | Score reward banners, gold tint backgrounds |
| **Success** | `#16A34A` | Checkmarks, "available" status, OTP verified, score green zone (70-100%) |
| **Warning** | `#F59E0B` | Same as accent — score yellow zone (40-70%), pending states |
| **Error** | `#EF4444` | Validation errors, danger actions (Block, Delete, Report) |
| **Background** | `#FFFFFF` | Main screen background |
| **Surface** | `#F0FDFA` | Card backgrounds, input fields — very light teal tint |
| **Surface Elevated** | `#FFFFFF` | Cards, modals, bottom sheets (with shadow) |
| **Text Primary** | `#164E63` | Body text, headings (matches secondary) |
| **Text Secondary** | `#6B7280` | Subtitles, timestamps, helper text, placeholders |
| **Text Tertiary** | `#9CA3AF` | Disabled text, inactive tabs |
| **Divider** | `#E5E7EB` | Horizontal rules, section separators |
| **Overlay** | `rgba(0,0,0,0.5)` | Modal/tooltip backdrop dimming |

### Score Color Scale

| Range | Color | Hex | Note |
|-------|-------|-----|------|
| 0–40% | Red | `#EF4444` | Poor precision |
| 41–70% | Amber-Gold | `#F59E0B` | Moderate precision |
| 71–79% | Green | `#16A34A` | Good precision |
| 80–100% | Green | `#16A34A` | Excellent precision |

> **Note**: The 🔥 flame icon is used **only** inside the creation wizard's Live Precision Score display and the Founder-only Cluster Info sheet — never on cluster cards.

### Typography

| Style | Font | Size | Weight | Line Height | Usage |
|-------|------|------|--------|-------------|-------|
| **H1** | Inter | 28px | Bold (700) | 34px | Screen titles (Welcome, Create Cluster) |
| **H2** | Inter | 22px | SemiBold (600) | 28px | Section headings (AGGIL Suggestions, Your Clusters) |
| **H3** | Inter | 18px | SemiBold (600) | 24px | Card titles, cluster names |
| **Body** | Inter | 16px | Regular (400) | 22px | Post content, descriptions, form labels |
| **Body Small** | Inter | 14px | Regular (400) | 20px | Stats, timestamps, helper text |
| **Caption** | Inter | 12px | Regular (400) | 16px | Badges, tags, footnotes |
| **Button** | Inter | 16px | SemiBold (600) | 20px | CTA buttons |
| **Tab** | Inter | 14px | Medium (500) | 18px | Tab bar labels |
| **Input** | Inter | 16px | Regular (400) | 22px | Form field text |

> **Note**: Use **Poppins** as fallback if Inter is unavailable in the image generator.

### Spacing System (4px Grid)

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Icon-to-text gaps, chip internal padding |
| `sm` | 8px | Between chips, inline element spacing |
| `md` | 12px | Card internal padding, between form fields |
| `base` | 16px | Screen horizontal margins, section gaps |
| `lg` | 20px | Between cards, section titles to content |
| `xl` | 24px | Between major sections |
| `2xl` | 32px | Top/bottom screen padding, modal margins |
| `3xl` | 48px | Modal top padding, large illustration spacing |

### Corner Radius

| Element | Radius |
|---------|--------|
| Buttons (primary/secondary) | 12px (fully rounded on short buttons) |
| Cards | 16px |
| Input fields | 10px |
| Chips / Tags | 20px (pill shape) |
| Modals / Bottom sheets | 24px (top corners only for sheets) |
| Avatars | 50% (circle) |
| Activity badge | Pill shape, 20px radius |
| FAB | 50% (circle, 56px diameter) |

### Shadows

| Level | Shadow | Usage |
|-------|--------|-------|
| **Elevation 1** | `0 1px 3px rgba(0,0,0,0.08)` | Cards, input fields |
| **Elevation 2** | `0 4px 12px rgba(0,0,0,0.12)` | Bottom sheets, modals, FAB |
| **Elevation 3** | `0 8px 24px rgba(0,0,0,0.16)` | Tooltips, overlays |

### Icon System

| Context | Style | Size | Source |
|---------|-------|------|--------|
| Bottom nav | Outlined (inactive), Filled (active) | 24px | Material Symbols |
| In-card actions | Outlined | 20px | Material Symbols |
| AGGIL labels | Emoji-style | 16px | Unicode emoji |
| Status indicators | Filled dots | 8px | Custom |
| Score flame (creation wizard only) | Emoji | 14px | 🔥 Unicode |
| Accent award | Emoji | 14px | ⭐ Unicode (gold for score rewards) |
| Clio avatar | Custom SVG | 40px / 48px | Clio brand asset |
| Clio presence dot | Filled circle | 12px | Custom (#0891B2) |

### Clio AI Assistant — Screen Reference & Canonical Pointers

> **Clio** is the user-facing AI assistant **powered by [Yantra](https://Yantra.ai)** — an open-source AI agent framework providing autonomous operation, persistent memory, and multi-channel messaging. Clio should feel like a **friendly, named companion** — not a generic chatbot. Every screen where Clio appears should reinforce that the user has a personal AI working for them.

> **🔒 Canonical Sources (single source of truth — never duplicate here):**
>
> | Source | File | Contains |
> |:---|:---|:---|
> | **Character & Personality** | `clio/SOUL.md` | Yantra agent config. Who Clio is, personality, relationship arc, cluster presence protocols, anti-patterns, emoji rules, 2-message limit. **Immutable.** |
> | **Visual Identity** | `clio/clio_image_prompts_v2.md` | Per-emotion image prompts. Body (peach mochi sphere), eyes, teal stubs, situational mouth, blush, internal orange-peach glow. |
> | **Animation** | `clio/clio_animation_prompts_v2.md` | Emotion transitions (1–10), micro-animations (M1–M12), entry/exit/mode transitions. |
>
> **Rule**: If this file and a canonical source disagree, the canonical source wins. Screen prompts specify *where, when, and how* Clio appears — not *who she is*.

#### Yantra-Powered Capabilities

| Yantra Feature | How Clio Uses It in Aggilo |
|-----------------|---------------------------|
| **Persistent memory** | Remembers user preferences, past searches, clusters visited, and conversation history across sessions — personalizes suggestions over time |
| **Autonomous heartbeat** | Proactively checks for new clusters matching user's interests (every 6h via Scout) and queues notifications even when user is offline |
| **Multi-channel messaging** | Can send cluster updates via WhatsApp/Telegram/SMS if user connects their account (premium feature) |
| **Browser automation** | Powers Scout agent to crawl trending topics, news, and discussions — feeds fresh content into cluster suggestions |
| **Media handling** | Processes images/docs shared in cluster chat for contextual understanding and content moderation |
| **Modular skills** | Extensible — new Clio capabilities (translation, summarization, content creation) can be added as skill modules without core changes |
| **Model flexibility** | Uses Claude for user-facing conversations (quality) and Llama/NIM for background batch processing (cost efficiency) |

#### Mood Quick-Reference

> Full visual specs per mood → `clio_image_prompts_v2.md`. Full animation specs → `clio_animation_prompts_v2.md`. This table is for quick reference when reading `[CLIO]` blocks in screen prompts below.

| Mood | Eyes | Stubs | Mouth | When |
|:---|:---|:---|:---|:---|
| **Resting** | Soft oval, tracking user | Hidden/flush | Small knowing smile | Default — present, not intrusive |
| **Happy** | Inverted crescents (smiling eyes) | Hidden | Gentle closed smile | Warm news, connection moments |
| **Curious** | Slight asymmetry, head tilted | Half-extended, no glow | Neutral, slightly open | Working something out |
| **Excited** | Wide circles, pupils max, iris ring glows | Maximum, tips glow teal | Small open "o" | Breakthrough moment |
| **Surprise** | Wide open, pupils 80%, frozen | Popped up, splayed | Tight round "o" | Startled — settles into Curious |
| **Thinking** | Narrowed, gaze upward-right | Barely visible bumps | Closed flat line | Deep processing |
| **Sleepy** | Heavy-lidded, 40% closed | Hidden | Tiniest smile | Drowsy, safe, content |
| **Proud** | Crescents + slightly closed | Hidden | Asymmetric smile | Quiet self-satisfaction |
| **Encouraging** | Warm, direct, pupils 70% | Tiny nubs | Warm open smile | "You got this" |
| **Empathetic** | Softened, direct, gentle | Hidden | Neutral — "I'm here" | Steady presence, bad moments |
| **Playful** | One eye squints, sidelong glance | Splayed V-shape | Asymmetric smirk | "I know something you don't" |
| **Celebrating** | Wide, sparkling, straight at user | Maximum, straight up, tips glow | Open smile, corners lifted | Pride directed AT you |

> **Character design summary** (see `clio_image_prompts_v2.md` for full spec): Clio is a small, round, **peach-coloured mochi creature** with enormous expressive eyes, two retractable **teal stubs** (short cylindrical blocks on top of head), a situational **mouth** (knowing smile default), permanent **cheek blush**, and a warm **orange-peach internal glow** (never extends beyond body edge). No limbs. Pixar-quality 3D CGI.

#### Micro-Animation Index

> Full specs → `clio_animation_prompts_v2.md` §Micro-Animations and §Entry/Exit. Referenced by **M-code** in `[CLIO]` blocks throughout this document.

| Code | Name | Duration | What Happens |
|:---|:---|:---|:---|
| **M1** | Listening | Loop | User typing — breathing pauses, eyes track text |
| **M2** | Processing | 1–3s loop | Fetching results — eyes scan, glow pulses faster |
| **M3** | Nod | 0.5s | User confirms choice — body dips 1.5%, glow pulse |
| **M4** | Success Flash | 0.8s | Action completed — eyes widen, glow flares, body lifts |
| **M5** | Error Softening | 0.6s | Something wrong — eyes soften, body micro-sag |
| **M6** | First Entry | 0.5s | First screen visit — FAB slides from right with bounce |
| **M7** | Return Entry | 0.3s | Return visit — FAB fades in quietly |
| **M8** | Screen Exit | 0.2s | Navigating away — FAB fades out |
| **M9** | Peeping → Prominent | 0.4s | FAB tapped or speech triggered — scales 48→80px |
| **M10** | Prominent → Peeping | 0.5s | Conversation ends — shrinks back, breathe resumes |
| **M11** | App Foreground | 0.6s | App returns — blink-awake, glow resumes |
| **M12** | Host Mode Card | 0.4s / 0.3s | Inline cluster feed card entry / exit |

#### Clio Avatar Sizes

| Context | Size |
|:---|:---|
| Profile badge / inline banner | 32px |
| Speech bubbles / inline | 40px |
| FAB (Floating Action Button) | 48px |
| Walkthrough / welcome / prominent | 80px |
| Full-screen empty states | 120px |

#### Clio Visibility Modes

Every screen spec in this document uses one of three visibility modes. The mode is always stated explicitly at the end of each screen prompt block.

| Mode | Visual Presence | When Used |
|------|-----------------|----------|
| **Peeping** | Clio FAB (48px) sits in the bottom-left corner. No speech bubble. Resting mood. Breathe effect active (scale 1.0→1.03→1.0, 3s loop). | Active clusters (Phase D/E), sub-pages, forms, settings — anywhere she should be accessible but not intrusive. |
| **Prominent** | Clio expands to 80–120px with a speech bubble, animated entrance (peek-in or bounce), and mood-matched expression. She may narrate or hold center stage. | Empty states, first visits, onboarding, post-creation celebration, walkthrough slides. |
| **Host Mode** | Clio appears as an **inline card inside the cluster feed** — not as a FAB. Peach bg card, 40px Clio avatar left-aligned, 1-sentence mood-matched message, no CTA button. Deletable by Founder only. | Cluster Arc Phases A (empty room), B (first post acknowledgement), C (low-activity re-engagement). |

> **AGGIL Confirmation UI (not a visibility mode):** When Clio deduces AGGIL parameters conversationally, she presents them inline in her chat overlay as a confirmation chip row: `Confirm: 🎂 20-30 | ♀ | 📍 Hyd | #Pottery. Ready to proceed? [Take this →] [Discuss 💬]`. This is a UI pattern within the chat overlay, not a separate visibility mode.

#### Clio FAB (Floating Action Button)
| Property | Spec |
|----------|------|
| **Size** | 48px circle (upgraded from previous 32px) |
| **Position** | Bottom-left, 16px from edge, 72px above bottom nav (spatially separated from main "+" FAB on right) |
| **Background** | Peach Clio face on subtle teal ring border (not a solid teal fill — Clio's peach identity must be visible even at 48px) |
| **Icon** | Clio creature face (matches avatar — wide eyes visible even at 48px) |
| **Shadow** | Elevation 2 |
| **Availability** | Dashboard, Explore, Create Cluster wizard steps, Search Results, Cluster Timeline |
| **Tap action** | Opens Clio conversational overlay (bottom sheet, 70% screen height) |

#### Clio Speech Bubble
| Property | Spec |
|----------|------|
| **Background** | White (`#FFFFFF`) |
| **Border** | 2px left border in teal (`#0891B2`) |
| **Radius** | 12px (top-right, bottom-right, bottom-left), 0px (top-left) |
| **Shadow** | Elevation 1 |
| **Max width** | 280px |
| **Typography** | Body Small (14px), `Text Primary` color |
| **Clio label** | "Clio" in teal bold 12px, top-left of bubble |
| **Auto-dismiss** | 5 seconds with fade-out (200ms), or tap to dismiss |
| **Position** | Adjacent to Clio FAB, or inline in content area |

#### Clio Chat Overlay (Bottom Sheet)

> The Clio chat overlay is the primary interface for user-Clio conversation. It opens when the user taps the Clio FAB on any Clio-enabled screen. In Phase 1, this is also the **only cluster creation path** (Path 2: Conversational Creation per PRD 02).

| Property | Spec |
|----------|------|
| **Type** | Bottom sheet modal |
| **Height** | 70% screen height |
| **Background** | Light teal-tinted (`#F0FDFA`) |
| **Top bar** | Clio avatar (40px, mood-matched) + "Clio" label in teal bold 14px + "✕" close button (right) |
| **Message layout** | Clio messages: left-aligned, white bg, teal left border (same as Speech Bubble). User messages: right-aligned, teal bg, white text |
| **Input** | Text input bar at bottom with "Ask Clio..." placeholder + Send button (teal arrow) |
| **Action chips** | When Clio offers choices, tappable chips appear below her message (same style as interest chips) |
| **AGGIL confirmation** | When Clio deduces cluster parameters, inline confirmation chip row appears: `Confirm: 🎂 20-30 | ♀ | 📍 Hyd | #Pottery. [Take this →] [Discuss 💬]` |
| **Dismiss** | Drag-down gesture or ✕ button. Conversation context is preserved within session |
| **Shadow** | Elevation 2 on sheet edge |
| **Radius** | 24px (top corners only) |

#### Clio Micro-Animations

> See **Micro-Animation Index** table above (M1–M12) for the complete list with durations and triggers. Full engineering specs → `clio_animation_prompts_v2.md` §Micro-Animations.

#### Clio Presence Indicator
- A small **12px teal dot** appears on relevant screens near the Clio FAB to signal "Clio is available here"
- Dot uses a subtle fade-in (200ms) when entering a Clio-enabled screen
- Dot is NOT shown if the user has set Clio presence to "Minimal" in Settings

#### Clio Emoji & Voice Rules

> Full emoji guidelines, anti-patterns, and voice register → `SOUL.md` §03–§05 and `personas/*/IDENTITY.md`. **Key rule**: Maximum 1 emoji per message, at end, matching emotional register. Never 🎉🚀💪🙌👏.

#### Clio Silence Design (per Character Bible)

> *"Knowing when not to say something is the advanced version of this character."* — Clio Bible

| Context | Clio Behaviour |
|---------|---------------|
| **After a powerful message** | Clio's speech bubble disappears. Her avatar enters Rest mode. Silence for 3-5 seconds. *Then* — if needed — she returns with something brief: two or three words. |
| **When user is actively typing/composing** | Clio FAB dims to 40% opacity. No pulse. No nudge. She is *listening*. |
| **In DM conversations** | Clio has **no active role** inside DMs. She does not comment, suggest, or interrupt. DMs are human-only space. |
| **After a user ignores Clio's tip** | She does NOT repeat. She does NOT escalate. The tip was offered once. That's it. |
| **When user sets presence to Minimal** | Clio FAB visible but completely still. No bubbles, no nudges, no insights. She is there if called, but she will not speak first. |
| **Post-onboarding first 30 seconds on dashboard** | After the welcome conversation, Clio steps back. Let the user explore. Her first dashboard insight appears only after 30 seconds, not immediately. |

#### Clio Voice & Relationship Arc

> Full voice library, register examples, and the 10-beat relationship arc → `SOUL.md` §03–§04 and `personas/*/IDENTITY.md`.
>
> **Key rules**: She never repeats the same line. She says each thing once. She never manufactures urgency. Specificity > warmth.
>
> **Arc beats in screens**: Beats 1–4 → Walkthrough (0.1). Beats 5–7 → Welcome Conversation (2.6). Beats 8–10 → Milestone-triggered (see Proactive Behaviors table below). After Beat 10, Clio enters permanent "trusted companion" mode.

#### Clio 2-Message Limit (per SOUL.md §11)

> Clio may not post more than **2 messages in any 24-hour window** per cluster. Pulse curation items and direct-conversation responses don't count. When both messages are used, she is silent until reset.

### Component Specs

#### Buttons

| Type | Style |
|------|-------|
| **Primary CTA** | `#0891B2` bg, white text, 16px font, 12px radius, full-width, 48px height, subtle shadow |
| **Secondary** | White bg, `#0891B2` border (1.5px), teal text, 12px radius, 48px height |
| **Text Button** | No bg, `#0891B2` text, no border. For "Skip", "Cancel", links |
| **Disabled** | `#E5E7EB` bg, `#9CA3AF` text, no shadow |
| **Danger** | `#EF4444` bg, white text — contextual only (Delete, Block, Report) |

#### Cluster Cards (Explore / Search / Dashboard)

```
┌────────────────────────────────────────────┐
│  [Avatar 48px]  Cluster Name (H3, bold)    │
│                 Interest · Tags            │  Activity badge
│                 👥 45 · 💬 23              │  [VERY ACTIVE]
│  AGGIL chips: [20-50] [♀] [T-Hub] [Tech] [EN] │
│                              [Join] button │
└────────────────────────────────────────────┘
```
- White bg, 16px radius, Elevation 1 shadow
- 16px internal padding, 12px gap between cards
- Activity badge: top-right corner, green pill for "VERY ACTIVE" / gray for "QUIET"
- **AGGIL chip display is Clio-governed** (2-3 most differentiating dimensions per card):
  - **Open/global clusters**: Show Interest + Location + Language (the discovery-relevant signals)
  - **Narrow/privacy-constrained clusters**: Show Interest + Language only. Age range, gender restriction, and GPS location are **never surfaced on cards** for narrow clusters — these are privacy gates, not discovery signals. Clio may provide a narrative insight line instead (e.g., *"A tight-knit group in your neighbourhood"*)
  - **Full AGGIL details**: Only visible on the Cluster Info page (Screen 6.6) to the Founder, and inline during the creation wizard
  - This follows PRD 03's **Blind Qualification Gate** principle: cluster eligibility criteria are never disclosed externally. Clio decides which chips to surface on the fly based on the cluster's scope and privacy constraints. Exact phrasing is register-calibrated per `clio/personas/*/IDENTITY.md`.
- **NO score/match percentage shown** — score is an internal metric used for ranking only

#### Chips / Tags

| Type | Style |
|------|-------|
| **AGGIL filter (active)** | `Primary Tint` bg, `#0891B2` text, 20px radius, "✕" dismiss |
| **AGGIL filter (inactive)** | `#F0FDFA` bg, `#6B7280` text |
| **Interest tag** | `#F0FDFA` bg, `#164E63` text, 20px radius |
| **Interest selected** | `#0891B2` border (1.5px), `Primary Tint` bg, teal checkmark |
| **Badge (Founder)** | Gold `#F59E0B` bg, dark text, 12px radius |
| **Badge (activity)** | Green `#16A34A` bg for "VERY ACTIVE", gray `#9CA3AF` bg for "QUIET", white text, pill shape |

#### Cluster & Content Limits

> **Cluster membership model**: Like subscribing to YouTube channels and creating YouTube videos — **no limits**. Users can join and create as many clusters as they like. This maximises reach and network density.

| Limit | Value | Notes |
|-------|-------|-------|
| Clusters joined | **Unlimited** | No cap |
| Clusters created | **Unlimited** | No cap |
| Members per cluster | No MVP cap | May be revisited post-MVP if performance degrades |
| Cluster name length | 60 characters | Truncated with `...` beyond 2 lines on cards |
| Cluster description | 500 characters | Live counter shown in wizard |
| Vibrant tags | 10 per cluster | Auto-deduplicated |
| Posts per cluster | Unlimited | Paginated, 20 per page |
| DMs | Unlimited | One thread per member pair per cluster context |

#### Input Fields

- White bg with `#E5E7EB` border (1px), 10px radius, 48px height
- Focused: `#0891B2` border (2px), subtle teal glow
- Error: `#EF4444` border, red helper text below
- Label above input in `Text Secondary`, 14px

#### Bottom Navigation Bar

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  🏠 Home    🧭 Explore    [+]    💬 Messages    👤 Profile │
│  (active)                (FAB)                           │
└──────────────────────────────────────────────────────────┘
```
- White bg, top border `#E5E7EB` 1px
- Active tab: `#0891B2` icon (filled) + label
- Inactive tab: `#9CA3AF` icon (outlined) + label
- FAB: `#0891B2` bg, white "+" icon, 56px circle, Elevation 2, centered between tabs
- Safe area padding at bottom (34px on iPhone)

#### Tab Bars (In-Cluster, Profile)

- Full-width, equally distributed tabs
- Active: `#0891B2` text + 2px teal underline
- Inactive: `#6B7280` text, no underline

### Animation Guidelines (for developer reference)

| Interaction | Animation | Duration |
|-------------|-----------|----------|
| Screen transition | Slide from right | 300ms ease-out |
| Modal entry | Fade in + slide up | 250ms ease-out |
| Bottom sheet | Slide up from bottom | 300ms ease-out |
| Score bar fill | Animated progress fill | 600ms ease-in-out |
| Button press | Scale down to 0.97 | 100ms |
| Tab switch | Underline slide | 200ms ease |
| Toast/snackbar | Slide up, auto-dismiss | 3000ms |
| Confetti (cluster created) | Particle burst | 2000ms |
| Score sparkle ✨ | Pulse + fade | 400ms |
| Tooltip appear | Fade in | 200ms |
| **Clio breathe effect** | Continuous slow scale oscillation (1.0→1.03→1.0) | **3s loop**, ease-in-out |
| **Haptic feedback** | Button press: light impact. Long-press trigger: medium impact. Destructive confirm: warning notification. Join/create success: success notification. Pull-to-refresh release: light impact. | iOS: UIImpactFeedbackGenerator / UINotificationFeedbackGenerator. Android: VibrationEffect (SDK 26+). |

### Accessibility

| Rule | Spec |
|------|------|
| Contrast ratio | ≥4.5:1 for all text on backgrounds |
| Touch targets | Minimum 44×44px |
| Font scaling | Supports system dynamic type (1.0x – 2.0x) |
| Color not sole indicator | All status uses icon + color + text. **Score gauge must show both color AND text label**: "Poor" (red, 0-40%), "Fair" (amber, 41-70%), "Good" (green, 71-79%), "Excellent" (green, 80-100%). |
| Screen reader | All interactive elements have `accessibilityLabel` |

**`accessibilityLabel` Examples (required on all interactive elements):**

| Element | accessibilityLabel |
|---------|--------------------|
| Clio FAB | "Chat with Clio" |
| Join button (cluster card) | "Join [Cluster Name] cluster" |
| Score gauge | "Cluster precision score: 82 percent, Good" |
| "Send OTP" button | "Send one-time password to [phone/email]" |
| Back arrow | "Go back to previous screen" |
| Report button | "Report this post or user" |

### UX Navigation & Orientation

> **Principle**: Users should always know **where they are**, **how to go back**, and **what actions are available**. Every screen must provide clear visual orientation cues.

#### Persistent Top Bar
| Context | Top Bar Contents |
|---------|-----------------|
| **Dashboard / Home** | Aggilo logo (left), Search 🔍, Bell 🔔 with badge, Avatar (right) |
| **Explore** | "Explore Clusters" title (left), Bell 🔔 (right) |
| **In-Cluster** | "← Back" arrow + Cluster name (center) + "⋮" overflow menu (right) |
| **Settings / Sub-pages** | "← Back" arrow + Page title (center) |
| **Full-screen modals** | "✕ Close" or "Cancel" (left) + Modal title (center) + Action button (right) |

#### Back Navigation
- Every sub-page must have a **"← Back" arrow** in the top-left corner
- Tapping "← Back" always returns to the previous screen (stack-based navigation)
- Swipe-from-left gesture also supported (iOS standard)
- Android: Back button / gesture navigation returns to previous screen — **never exits the app unexpectedly**

#### Keyboard Behaviour Guide

| Input Type | Keyboard | Return Key | Additional |
|------------|----------|------------|------------|
| Phone number | Numeric keypad | Submits form | Country code picker opens on flag tap |
| Email address | Email keyboard (`.com` shortcut visible) | Submits form | — |
| Nickname / text fields | Default | "Next" (moves focus to next field) | Auto-caps OFF |
| Multi-line text area | Default | Newline (does not submit) | Character counter shown |
| Search bar | Default | "Search" / submits | Dismisses on scroll down |
| OTP digit boxes | Numeric keypad | Advances to next box | Auto-advances on each digit; auto-submits on 6th digit |

> **Universal rule**: Tapping outside any input field dismisses the keyboard. Scrollable screens adjust to keep the active input visible above the keyboard (handling virtual keyboard overlap appropriately for a PWA).

#### Section Headings & Dividers
- Each section on a scrollable page has a **bold H2 heading** with optional action link (e.g., "See All →")
- Sections are separated by **24px vertical spacing** and a subtle `#E5E7EB` divider line
- Active section headers use `Text Primary` (#164E63), non-active use `Text Secondary` (#6B7280)

#### Tab State Indicators
- Active tab: **teal text (#0891B2)** + **2px teal underline** (content tabs) or **teal bg white text** (pill tabs)
- Inactive tab: **gray text (#6B7280)**, no underline
- Tab badges: small red dot or number badge for unread counts (e.g., "Members (23)" or "Chat 🔴")

> **Tab State Memory (dev note)**: When navigating away from a cluster (e.g., tapping a member profile) and returning via back, restore the last-active tab (Posts, Pulse, Members, or Media). Store per-cluster tab state in component memory — not persisted across app restarts.

> **⚠️ MANDATORY RULE — Navigation Context in Every Screen Prompt:**
> Every screen prompt MUST explicitly state:
> 1. **Which bottom nav tab is active** (e.g., "Bottom nav: Home tab highlighted in teal") — OR
> 2. **That bottom nav is hidden** (e.g., "Bottom nav: NOT visible") — for cluster detail, full-screen modals, DMs, auth/onboarding
---
> 3. **The full top bar contents** — never abbreviate with "same as X"; always restate: back arrow, title, and action icons
> 4. **Cluster context** — on any screen accessed from within a cluster (DMs, member profiles), show the originating cluster name in the top bar or a context banner
> 5. **Clio Visibility** — every screen MUST show Clio. State if she is "Prominent" (taking center stage/FAB) or "Peeping" (partially visible in the background or corner). Prominent Clio has a **"breathe effect"** micro-animation: a continuous, slow scale oscillation (1.0→1.03→1.0, 3s loop, ease-in-out) giving her a living, breathing presence.

#### Contextual Banners
| Banner Type | Usage | Style |
|-------------|-------|-------|
| **Info banner** | Additional context (e.g., "💬 You connected via Women Entrepreneurs") | Light teal bg, teal text, full-width |
| **Success banner** | Confirmation (e.g., "✅ You qualify for this cluster!") | Light green bg, green text |
| **Warning banner** | Caution (e.g., "⚠️ This cluster is private") | Light amber bg, amber text |
| **Error banner** | Failure (e.g., "❌ Your profile doesn't match") | Light red bg, red text |

#### Empty States
- Every list/feed screen must have a **meaningful empty state** with:
  - Flat illustration (themed to the context)
  - Title explaining the empty state (e.g., "No clusters yet")
  - Subtitle with guidance (e.g., "Create your first cluster or explore existing ones!")
  - **Primary CTA button** guiding the next action (e.g., "Create Cluster" or "Explore")
  - Never leave a screen blank — always show helpful guidance

#### "Where Am I?" Context
- **In-Cluster screens**: Always show a condensed cluster header (name + AGGIL chips) at top so the user knows which cluster they're in
- **DM screens**: Always show the "via [Cluster Name]" context so users know where the DM originated
- **Sub-pages**: Always show the parent context in the top bar or breadcrumb
- **Modals / Bottom sheets**: Always include a visible close button (✕) and handle bar for sheets

#### Clio Help Access & Proactive Behaviors

> **Principle**: Clio should feel like a helpful companion, not a pop-up ad. Behaviors are **moderate by default** and **user-controllable** from Settings (Screen 9.1).

Clio FAB (48px, Clio creature face) is available on:
- Dashboard, Explore, Create Cluster wizard steps, Search Results, Cluster Timeline
- Tapping opens a conversational overlay (bottom sheet, 70% screen height)

**Clio Proactive Behaviors (Stuck Moments)**

| Stuck Moment | Clio Behavior | Type |
|-------------|--------------|------|
| Empty dashboard (no clusters joined) | **On-demand query triggered** (lightweight DB search for matching clusters by AGGIL dimensions). While query runs (~1-3s): Clio speech bubble with shimmer cards: "Let me check..." Once results arrive: "I looked across [Neighbourhood A], [Neighbourhood B], and [Neighbourhood C] for people who mentioned [Topic]. Here's what I found." If zero results: "Nothing yet for [Topic] in your area. I check every few hours — I'll find you when something lands." <br>**Refinement feature:** This message is an interactive pill. Tapping it opens Clio's chat overlay so the user can immediately refine or pivot the search criteria. | Auto |
| Zero search results | Clio avatar (80px) + scanning/radar animation. Encouragement: "Very specific search. I'm looking. This takes time because I won't put you in a room you don't belong in." | Auto |
| Cluster creation paused >30s on a step | Clio idle nudge (gentle bounce) + speech: "Need help with this step?" | Idle |
| First visit to Explore | Clio peek-in animation + speech: "Need help finding the right cluster?" | Auto (once) |
| 120s browsing Explore without joining OR scrolled past 5+ cards without interaction | Clio speech bubble (bottom-left, Curious mood). Speech is register-calibrated per `clio/personas/*/IDENTITY.md`. → taps open Clio chat | Auto (once per session) |
| First visit to any cluster | Clio summary banner: "X new posts since last visit" | Auto |
| Duplicate detected (creation) | "I found a similar cluster! What makes yours different?" | Intercept |
| User idle >15s on any Clio-enabled screen | Clio gentle bounce (idle nudge animation) | Idle |
| After creating a cluster (success) | Clio celebrate animation + congratulatory speech bubble | Auto |
| New matching clusters found (heartbeat) | Push notification: "I found 3 new clusters matching your interests!" + Clio insight pill on dashboard | Background (via Yantra heartbeat scheduler) |
| **[Cluster Arc] Phase A: Cluster has 0 posts** | Clio (Host Mode): 1 Pulse item surfaced to cluster feed + context-specific compose bar placeholder. No speech bubble — she holds the space. | `cluster_host` skill |
| **[Cluster Arc] Phase B: First post ever** | Clio posts 1-sentence acknowledgement within 60s (register-calibrated). Then silent 24h. | `cluster_host` skill |
| **[Cluster Arc] Phase C: 72h silence** | Clio surfaces 1 Pulse item with question frame. Max 1 per 72h. | `cluster_host` skill |
| **[Cluster Arc] Phase E: 10th member joins** | Private message to Founder only: *"Ten people. That's when clusters start feeling like something."* | `cluster_host` skill |
| **Dormant member returns (7+ days away)** | Clio contextual banner: references something specific that happened. If nothing — silent. | Proactive |

**User Controls (Settings > 🤖 Clio Assistant)**

| Presence Level | Behavior |
|---------------|----------|
| **Minimal** | Clio FAB visible but no proactive bubbles or idle nudges |
| **Moderate** (default) | Clio shows contextual tips on first visit + idle nudges |
| **Active** | Clio proactively surfaces insights, summaries, and encouragement |

> **Cluster-embedded triggers (Phase A/B/C/E)** respect the user's Presence Level but are **never fully suppressed** — they are part of the community experience, not personal notifications. A user on "Minimal" will still see Clio's cluster-host messages; they simply won't receive proactive bubbles outside of clusters.

**Three Clio Visibility Modes (used in all screen specs below)**

| Mode | Description | When Used |
|------|-------------|----------|
| **Peeping** | Small Clio FAB (48px) visible in bottom-left corner. No speech bubble. Resting mood. | Active clusters (Phase D/E), sub-pages, forms |
| **Prominent** | Larger Clio (80px) with speech bubble / modal card. Animated entrance. | Empty states, first visits, onboarding, post-creation celebration |
| **Host Mode** | Clio appears as an inline card or contextual banner **inside** the cluster feed — not as a FAB. Peach bg, Clio avatar 40px left, 1-sentence message, mood-matched. | Cluster Arc Phases A, B, C (empty room, first post, low activity) |

### Logo

- **Symbol**: Atom/molecule icon — 3 orbital rings intersecting at center, cyan-teal (#0891B2)
- **Wordmark**: "Aggilo" in Inter Bold, deep teal-navy (#164E63)
- **Minimum clear space**: 8px around logo
- **Sizes**: 32px (nav bar), 48px (login), 24px (splash/watermark)

---

## 🎨 Global Style Prefix (prepend to every prompt)

```
A clean, modern mobile app UI mockup for "Aggilo" social network, iPhone 15 Pro frame, white (#FFFFFF) background, primary color #0891B2 (cyan-teal), secondary color #164E63 (deep teal-navy), accent color #F59E0B (amber-gold), error red #EF4444. Inter font family. Minimal, airy layout with ample whitespace, 16px horizontal margins, 4px spacing grid. Calming ocean-inspired color scheme. Status bar shows 12:30, Wi-Fi, cellular, battery icons. Bottom navigation bar with 5 tabs: Home (house icon), Explore (compass icon), [+] FAB (floating action button), Messages (message bubble icon), Profile (person icon), with a floating cyan-teal circular "+" button (56px, elevated shadow) in the center. Cards have 16px corner radius with very light teal-tinted backgrounds (#F0FDFA) and subtle drop shadows. Buttons are 48px height with 12px radius. Flat design, no 3D effects, Material Design 3 inspired. --ar 9:19.5 --v 6
```

---

## 📍 End-to-End User Journey Map

> **Purpose**: A bird's-eye view of the complete user experience from first touch to daily use. For each stage: what the user sees, what happens, and how Clio helps. All screen numbers reference the detailed specs below.

### Path A: Organic New User (App Store → Daily Use)

| # | Stage | Screen(s) | What Happens | Clio's Role |
|---|-------|-----------|--------------|-------------|
| 1 | **First Launch** | 0.1 (Walkthrough) | 4 swipeable slides introduce Aggilo + Clio | Clio narrates each slide via speech bubbles |
| 2 | **Authentication** | 1.1 → 1.2 | User enters phone or email → verifies OTP | — |
| 3 | **Profile Setup** | 2.1 → 2.4 | DOB/Gender → Language → Nickname/Interests → Location | — |
| 4 | **Clio Welcome** | 2.5 → 2.6 | Profile success → First conversation with Clio | Clio introduces itself, shows what it knows, asks what user wants |
| 5 | **Dashboard + Tour** | 3.1 + 12.1-12.4 | Empty dashboard with Clio shimmer + guided tooltip tour | Clio narrates tooltips, explains each section |
| 6 | **Explore** | 4.1 | Browse trending/recommended clusters | Clio insight line on each card ("Popular with your age group") |
| 7 | **Search** | 4.2 → 4.3 | Search by keyword → filter results | Clio recommendation one-liners on result cards |
| 8 | **Join Cluster** | 4.1 (tap card) | Tap cluster → view info → "Join" button | Clio insight on cluster info ("People in your age range + location") |
| 9 | **In-Cluster** | 6.1-6.7 | Timeline, Members, Media tabs + Cluster Info | Clio activity summary banner on Timeline |
| 10 | **Direct Message** | 7.1 → 7.2 | Tap member → DM from within cluster context | No Clio in DMs |
| 11 | **Create Cluster** | 5.1 → 5.5 | 4-step wizard: Interest → Audience → Details → Review | Clio contextual bubbles + "Chat with Clio" panel on each step |
| 12 | **Profile & Settings** | 8.1, 9.1 | View/edit profile, adjust Clio presence level | — |
| 13 | **Exit & Re-entry** | — | Close app → re-open → Dashboard (3.2) with populated state | Clio insight pill: "5 new clusters matching your interests" |

> **Dead ends & recovery**: 
> - No Results (4.3) → Clio encourages + offers to set up watch
> - Cluster full / age mismatch → Clio suggests similar clusters
> - Empty dashboard → Clio triggers on-demand query + shimmer cards + "Let me check..."

### Path B: Shared Link — New User

| # | Stage | Screen(s) | What Happens | Clio's Role |
|---|-------|-----------|--------------|-------------|
| 1 | **Tap shared link** | 10.1 | Invite landing: cluster info + eligibility check (YOB/Gender) | — |
| 2 | **Eligibility passed** | 10.2 | "You qualify!" → "New to Aggilo?" option | — |
| 3 | **Inline signup** | 10.4 | Quick registration form (nickname, phone/email, DOB, gender) | — |
| 4 | **Clio Welcome** | 2.5 → 2.6 | Clio intro + first conversation | Clio celebrates: "You're joining [Cluster Name]!" |
| 5 | **Auto-join + Dashboard** | 3.2 | Dashboard with the joined cluster already showing | Clio: "I added you to [Cluster Name]. Here's what's happening!" |
| 6 | **Continue to Path A** | Steps 6-13 | Full app experience from here | Same as organic |

> **Dead end**: Eligibility failed (10.3) → Clio suggests exploring other clusters or creating their own

### Path C: Shared Link — Existing User

| # | Stage | Screen(s) | What Happens | Clio's Role |
|---|-------|-----------|--------------|-------------|
| 1 | **Tap shared link** | 10.1 | Invite landing + eligibility check | — |
| 2 | **Eligibility passed** | 10.2 | "Already on Aggilo?" → phone/email OTP verify | — |
| 3 | **OTP verify** | 1.2 | Verify identity | — |
| 4 | **Auto-join** | 6.1 | Lands directly in cluster Timeline | Clio welcome banner: "You just joined [Cluster Name]. Welcome in." |

### Path D: Returning User

| # | Stage | Screen(s) | What Happens | Clio's Role |
|---|-------|-----------|--------------|-------------|
| 1 | **Open app** | 1.1 | Login screen (phone or email) | — |
| 2 | **OTP verify** | 1.3 | Welcome-back greeting with nickname | — |
| 3 | **Dashboard** | 3.2 | Populated dashboard with clusters + Clio insight pill | Clio insight: "12 new posts across 3 clusters since yesterday" |

### Navigation Context Rules (Persistent Throughout)

These context indicators are **always visible** to prevent users from getting lost:

| Context Element | Where It Appears | What It Shows |
|----------------|------------------|---------------|
| **Bottom navigation bar** | Every main screen | 5 tabs: Home, Explore, [+] FAB, Chat, Profile — active tab always teal-highlighted |
| **Cluster context header** | DM chat (7.2) | "[Cluster icon] Women Entrepreneurs • @member_name" sticky at top |
| **Search context bar** | Search results (4.2) | "🔍 Results for 'T-Hub' or 'badminton'" persistent below search input |
| **Breadcrumb subtitle** | Member profile (8.3), Cluster Info (6.6) | Gray subtitle: "via Women Entrepreneurs" or "from Explore" |
| **"Back to cluster" pill** | Member profile, DM, report screens | Floating teal pill: "← Back to Women Entrepreneurs" |
| **Tab state memory** | Return to cluster after navigating away | Returns to last-viewed tab (Timeline/Chat/Members/Media) |
| **Clio FAB** | All main screens (configurable) | 48px floating Clio avatar — always accessible, user-controllable visibility |

---

## Flow 0: App Walkthrough (First-Time Only — 1 screen with 4 Clio-narrated slides)

> **Design intent**: Clio introduces herself as a **quiet authority on connection** — not an assistant, not a matchmaking savant. She's someone who has been doing this a while and genuinely cares if it works. Each slide follows the **first 4 beats of the Clio Relationship Arc** (First Contact → Curiosity Hook → Empathy → Specificity as Proof). The user should feel *found*, not sold to.

### Screen 0.1 — Clio-Narrated Walkthrough (4 swipeable slides)

```
[GLOBAL STYLE PREFIX]

Full-screen walkthrough screen, NO bottom navigation bar. Clean, centered layout.

A swipeable carousel with 4 slides. Each slide has TWO layers:
- TOP: A large Clio avatar (80px) with a speech bubble containing Clio's narration
- BOTTOM: A flat illustration reinforcing the concept visually

Slide 1 (active) — **Beat 1: First Contact**
- Clio avatar (80px, Resting mood — soft oval eyes, watching gently) positioned top-center
- Clio speech bubble below avatar:
  "I'm Clio.
   I find people you'd actually want to know."
- Below speech bubble: Flat illustration of diverse people connected by teal lines (atom/molecule style), representing human connections
- **Clio mood**: Resting → eyes track user's touch slowly

Slide 2 (dot indicator shows position) — **Beat 2: Curiosity Hook**
- Clio creature avatar (80px) top-center, **Curious mood** — slight eye asymmetry, head tilted
- Clio speech bubble:
  "Here's what I do.
   I sort people into Clusters — small groups
   built around one specific thing.
   Age. Location. Purpose. Language.
   The more specific, the more real."
- Below speech bubble: Flat illustration of a cluster concept — a circle of people icons grouped together, with AGGIL labels (🎂 Age, ♀♂ Gender, 📍 Location, 📂 Purpose, 🗣️ Language) floating around the group

Slide 3 — **Beat 3: Empathy**
- Clio creature avatar (80px) top-center, **Happy mood** — bottom of eyes clip into inverted crescents
- Clio speech bubble:
  "Your real identity stays private.
   Nickname only. Nobody sees what you don't show.
   I've been doing this a while —
   the people who find their people?
   They all felt exactly like you do right now."
- Below: Flat illustration of a shield with a nickname badge ("@your_name") in front, with a lock icon and privacy sparkle effect

Slide 4 — **Beat 4: Specificity as Proof**
- Clio creature avatar (80px, **Excited mood** — wide circles, pupils dilated, iris ring brightens, subtle bounce animation) top-center
- Clio speech bubble:
  "Tell me a little about yourself.
   I'll show you who's already here. 🔍"
- Below: Flat illustration of Clio surrounded by small cluster cards fanning out
- CTA button: "Let's go →" (teal filled, full-width, 48px height)

Bottom: 4 dot indicators (first dot teal, rest gray). "Skip" text link on top-right (gray, 14px). On slide 4: the CTA button appears and dots shift above it.

> **Voice rule**: Each slide should feel like Clio is speaking naturally, not presenting. Sentence fragments. Trailing off. No exclamation marks except one — on the very last slide, one emoji, placed for emotional register.

[CLIO]
• Visibility: Prominent (80px, center of each slide)
• Entry: Prominent from start — no FAB, no peek-in. She IS the walkthrough.
• Moods per slide: Slide 1 = Resting → Slide 2 = Curious → Slide 3 = Happy → Slide 4 = Excited
• Speech: Per-slide narration (defined above). 800ms inter-bubble pacing.
• Micro-animations:
  - User swipes to next slide → mood transition (see animation prompts §3–§6)
  - Slide 4 "Let's go" tap → M4 (Success Flash)
• Exit: Fade-out on transition to Screen 1.1
• Bottom Navigation Bar: NOT visible.
```

---

## Flow 1: Authentication (3 screens)

### Screen 1.1 — Login / Signup

```
[GLOBAL STYLE PREFIX]

Full screen login page. Top: Aggilo logo (cyan-teal atom/molecule icon) with "Aggilo" text below in deep teal-navy. Tagline: "Connect. Locally. Deeply."

Center: Two toggle tabs side by side — "📱 Phone" (selected by default, teal underline) and "📧 Email" (gray). Tabs are pill-shaped, 14px text.

**Phone tab (default):**
- Input field labeled "Mobile Number" with country code picker showing 🇮🇳 "+91" on left
- Placeholder: "Enter your phone number"
- Below: Large teal rounded button "Send OTP" (full width)

**Email tab (when selected):**
- Input field labeled "Email Address" with ✉️ icon on left
- Placeholder: "Enter your email"
- Below: Large teal rounded button "Send Login Code" (full width)

Below the button (both tabs): Small text "By continuing, you agree to Aggilo's Terms of Service and Privacy Policy" with "Terms of Service" and "Privacy Policy" as underlined teal links.

At the very bottom: Text "New to Aggilo? Sign up" with "Sign up" in teal.

No password field. No "Keep me logged in" checkbox. No "Forgot Password" link. Clean and minimal.

**Loading state**: After tapping "Send OTP" / "Send Login Code" — button becomes disabled + shows inline spinner + text changes to "Sending...". Phone/email input also disabled. If request fails — inline red error below button: "Couldn't send the code. Check your connection and try again." + button resets to active.

**Validation**: "Send OTP" button is disabled until:
- Phone tab: number is ≥10 digits (format: 10-digit numeric after country code)
- Email tab: address matches valid email format (contains @ and TLD)
- Inline error text appears in red below input on blur: "Enter a valid 10-digit number" or "Enter a valid email address". Input border turns red.

[CLIO]
• Visibility: Not present — auth screens are system-level, Clio enters after identity is established.
• Bottom Navigation Bar: NOT visible.
```

### Screen 1.2 — OTP / Code Verification

```
[GLOBAL STYLE PREFIX]

Verification screen. Top: Back arrow (←).

**If phone was used:**
- Title: "Verify your number" in deep teal-navy
- Subtitle: "I've sent a 6-digit code to +91 98765 •••••" in gray text
- Bottom link: "Wrong number? Change"

**If email was used:**
- Title: "Verify your email" in deep teal-navy
- Subtitle: "I've sent a 6-digit code to u••••@example.com" in gray text
- Bottom link: "Wrong email? Change"

Center (both): 6 separate square input boxes in a row for OTP/code digits, each with a bottom border. First box has a blinking cursor. Boxes have subtle gray borders that turn teal when active.

Below: Timer text "Resend code in 0:45" in gray. When timer expires → tappable teal link "Resend Code".

Below: Teal full-width rounded button "Verify & Continue".

**Error state — wrong code**: All 6 boxes shake (300ms horizontal shake animation). Boxes reset to empty. Red text below boxes: "That code didn't match. Try again." + gray attempt counter: "3 attempts remaining."

**Error state — too many attempts**: After 3 failed attempts — all 6 boxes are disabled (gray). Red text: "Too many attempts." Resend link becomes active: "Resend a new code" (teal). 60-second cool-off before another attempt is allowed.

[CLIO]
• Visibility: Not present.
• Bottom Navigation Bar: NOT visible.
```

### Screen 1.3 — Returning User Login

```
[GLOBAL STYLE PREFIX]

Same as Screen 1.1 (Phone/Email tabs) but after entering phone or email and tapping "Send OTP" / "Send Login Code", shows the OTP screen with a welcome-back greeting:

- Top: "Welcome back! 👋" in deep teal-navy
- Nickname badge: "@creative_soul" in a rounded teal pill
- If phone: "Code sent to +91 98765 •••••"
- If email: "Code sent to u••••@example.com"

Same 6-digit input boxes. Same verify button. This screen confirms returning user flow (no registration needed).

[CLIO]
• Visibility: Not present.
• Bottom Navigation Bar: NOT visible.
```

---

## Flow 2: Registration & Onboarding (5 screens)

> **PRD Registration Order**: Phone/Email OTP → DOB + Gender → Language → Nickname + Interests → Dashboard

### Screen 2.1 — DOB + Gender (Step 1)

```
[GLOBAL STYLE PREFIX]

Onboarding step 1 (after phone OTP verified). Top: Aggilo logo small. Title: "Let's set up your profile" in deep teal-navy. Subtitle: "This helps me find the right people for you." in gray.

Form fields stacked vertically:

1. "Year of Birth" — a single year dropdown selector (YYYY only, range 1944–2011). Below it a small note: "🔒 This cannot be changed later. It's used for age-based matching and is never shown to anyone."

2. "Gender" — Three horizontal pill buttons: "Male" (with ♂ icon), "Female" (with ♀ icon), "Other" (with ⚧ icon). The selected one has a teal background with white text, unselected ones have a light gray background with dark text. Below: small note "This helps us show you relevant clusters. You can change this later."

Below: Large teal full-width rounded button "Continue →".

> **Validation**: "Continue →" is DISABLED (gray) until:
> - A Year of Birth is selected
> - A gender pill is selected
> If user taps disabled button — brief shake animation (200ms) + field labels flash red. Helper text in red below each empty field: "Required".

Bottom: Progress indicator showing step 1 of 4 as small dots (first dot filled teal, rest gray).

NO real name field. NO password field. (Email already captured at auth step if used.)

[CLIO]
• Visibility: Not present — data collection step, Clio arrives after profile is built.
• Bottom Navigation Bar: NOT visible.
```

### Screen 2.2 — Language Selection (Step 2)

```
[GLOBAL STYLE PREFIX]

Onboarding step 2. Top: Back arrow. Title: "Languages you speak" in deep teal-navy. Subtitle: "Select ALL languages you speak. This determines which clusters and content are surfaced for you — the more languages, the broader your reach." in gray.

A multi-select chip selector. Two chips already pre-populated from phone settings: "English ✕" and "Hindi ✕" in teal outline style. Below, an input labeled "Add more languages" with a searchable dropdown showing options like "Telugu", "Tamil", "Marathi", etc. Note: "You can select multiple languages."

Separator.

"Primary Language" — dropdown selector, defaulting to the first selected language.

Below: Large teal full-width button "Continue →".

Bottom: Progress dots showing step 2 of 4 (two dots filled).

[CLIO]
• Visibility: Not present.
• Bottom Navigation Bar: NOT visible.
```

### Screen 2.3 — Nickname + Purpose & Tags (Step 3)

```
[GLOBAL STYLE PREFIX]

Onboarding step 3. Top: Back arrow. Title: "Create your identity" in deep teal-navy. Subtitle: "Your nickname is how everyone will know you on Aggilo. Your real name stays private, always." in gray.

1. "Choose a Nickname" — input field with "@" prefix, placeholder "e.g. urban_explorer". Below it a small helper: "3-20 characters, letters, numbers, underscores". A small green checkmark icon appears when the nickname is available. If taken, a teal "✕ Nickname taken" message appears with AI-suggested alternatives shown as tappable pills below.

Separator.

Title: "What's the Purpose of your connection?" — Subtitle: "Tell Clio what you're looking for, or add vibrant tags (Hooks) to help others find you."

1. Input: "Primary Purpose" (Placeholder: "e.g. Finding local tennis partners").
2. "Add Vibrant Tags" (Placeholder: "#NewCitySunday #TennisBuddy #FitnessMotivation").

> **Nickname live validation**: As user types — if characters outside a–z, 0–9, underscore, hyphen — red helper: "Only letters, numbers, underscores, and hyphens." If < 3 chars — gray helper: "At least 3 characters." Green ✓ checkmark appears only when format is valid AND server confirms nickname is available.

> **Tags auto-format**: Typing a space or comma after a word creates a teal chip. "#" prefix auto-added if not present. Max 10 tags. Tags > 30 chars are truncated. Duplicates are silently merged. Add-tags input remains active after each chip is created.

Small Clio speech bubble (auto-dismiss): "Pick everything. Especially the weird ones. Those are usually the best matches."

Progress dots: step 3 of 4.

[CLIO]
• Visibility: Peeping → speech bubble only (no FAB yet — onboarding).
• Entry: Speech bubble auto-appears (250ms ease-out) after tags input is focused.
• Mood: Playful (one eye squints, asymmetric smirk).
• Speech: "Pick everything. Especially the weird ones. Those are usually the best matches." (auto-dismiss 5s)
• Micro-animations:
  - User creates a tag chip → M3 (Nod)
  - Nickname confirmed available (✓) → M4 (Success Flash)
  - Nickname taken (✗) → M5 (Error Softening)
• Exit: Speech bubble dismisses; no persistent Clio on this screen.
• Bottom Navigation Bar: NOT visible.
```

### Screen 2.4 — Location Permission (Step 4 — Optional)

```
[GLOBAL STYLE PREFIX]

Onboarding step 4. Top: Back arrow. Title: "Enable Location" in deep teal-navy. Subtitle: "This helps you discover hyperlocal clusters near you. You can always change this later." in gray.

Center: A large illustration of a map pin on a stylized city map (simple flat illustration, red pin on a light gray map with building outlines).

Below the illustration: Two buttons stacked:
1. Teal full-width button: "📍 Enable Location"
2. Below it, a text-only link: "Skip for now" in gray.

Small note at bottom: "🔒 Your exact location is never shared. We only use it to match nearby clusters."

Progress dots: step 4 of 4.

[CLIO]
• Visibility: Not present.
• Bottom Navigation Bar: NOT visible.
```

### Screen 2.5 — Profile Created → Clio Welcome Transition

```
[GLOBAL STYLE PREFIX]

Brief success screen with Clio introduction. Center of screen:

- Clio creature avatar (80px) at top, **Happy mood** (eyes in inverted crescents, subtle bounce animation)
- Green checkmark circle below Clio avatar with subtle pulse animation
- Title: "@urban_explorer" in deep teal-navy (just the nickname, no filler)
- Clio speech bubble below title:
  "Good. One more thing and I can start."
- "Continue →" teal button

This screen transitions to Screen 2.6 (Clio Welcome Conversation) when the user taps Continue.

> **Voice note**: No "You're all set!", no "✨", no celebratory filler. Clio is focused. She has work to do.

[CLIO]
• Visibility: Prominent (80px, center).
• Entry: Fade-in (300ms) — first time user sees Clio as a character, not just a speech bubble.
• Mood: Happy (inverted crescent eyes, gentle closed smile).
• Speech: "Good. One more thing and I can start."
• Micro-animations:
  - Checkmark pulse → Clio does M4 (Success Flash) simultaneously.
  - User taps "Continue" → Clio transitions Happy → Curious as she prepares for the welcome conversation.
• Exit: Carries into Screen 2.6 (no exit, continuous presence).
• Bottom Navigation Bar: NOT visible.
```

### Screen 2.6 — Clio Welcome Conversation (First-Time Only)

> **Purpose**: The "aha moment" — **Beats 5-7 of the Clio Relationship Arc** (Social Proof → Gets Personal → Emotional Depth). The user realizes this app is different because Clio already *knows something specific* about them. Not skippable on first use (30-second experience). This is where trust is built.

```
[GLOBAL STYLE PREFIX]

Full-screen conversational interface, NO bottom navigation bar. Light teal-tinted background (#F0FDFA).

Top: Clio avatar (80px) centered with "Clio" name label below in teal bold.

Conversation flow (chat-bubble style, Clio speech bubbles appear sequentially with 800ms delays — slower than usual chat, deliberate pacing):

Clio bubble 1 — **Beat 5: Social Proof**
  "Here's what I know so far."

Context card (white card, 16px radius, inside the conversation):
  - 🎂 "25-30" (derived from DOB)
  - ♀ "Female"
  - 📍 "Hyderabad" (if location was shared) OR "📍 Not set yet" (if skipped)
  - 🗣️ "English, Telugu"

Clio bubble 2 — **Beat 6: Gets Personal**
  "What are you actually looking for?"

Chip selector row (user taps one):
  [Like-minded people] [Early career craft] [Local friends] [Just exploring]

After user taps a chip (e.g., "Early career craft"):

Clio bubble 3 (appears with typing indicator "..." for 1.5 seconds — she's thinking, not performing):
  "Business in Hyderabad. Here's what I've put together for you.
   These get sharper as you explore. 🔍"

> **Note (internal)**: Clio presents *cluster suggestions* — not confirmed existing clusters. These suggestions are seeded from AGGIL matching and Clio's learning loop. Every interaction (joins, searches, browsing) refines future suggestions per user and demographic. This self-learning signal is handled entirely at the backend — never exposed to the user as a system label.

*Pause. 2 seconds of silence. Clio's eyes shift to Curious mood.*

Clio bubble 4 — **Beat 7: Emotional Depth** (the Bible's "shadow side")
  "I'll keep finding more. But here's the thing —
   I can find your people. You have to actually show up. 🔍"

CTA button at bottom: "Show me →" (teal filled, full-width)

Tapping "Show me →" transitions to Dashboard (Screen 3.1).

> **Voice rule**: Bubble 4 is Clio's first moment of real challenge. It's warm but not soft. It says: I take this seriously, and you should too. This is the Bible's "shadow side" — the thing that makes everything else Clio says feel earned.

[CLIO]
• Visibility: Prominent (80px, centered). Full-screen Clio takeover.
• Entry: Continuous from Screen 2.5 — already present.
• Moods: Resting (Bubble 1) → Curious (Bubble 2, waiting for chip) → Thinking (typing indicator) → Happy (Bubble 3) → Curious (2s pause) → Encouraging (Bubble 4).
• Speech: 4 sequential bubbles with 800ms delays. Typing indicator before Bubble 3 (1.5s).
• Micro-animations:
  - User considers chips → M1 (Listening)
  - User taps chip → M3 (Nod) + typing indicator appears
  - 2s deliberate silence before Bubble 4 — Clio shifts to Curious, no movement
  - User taps "Show me" → M4 (Success Flash) + transition to dashboard
• Exit: Fade-out as dashboard loads.
• Bottom Navigation Bar: NOT visible.
```

---

## Flow 3: Dashboard / Home (3 screens)

### Screen 3.1 — Dashboard (First Visit — Clio-Powered Empty State)

```
[GLOBAL STYLE PREFIX]

Dashboard home screen. 
Top bar: Aggilo logo (left), Search icon 🔍, Notification bell 🔔 with a red badge "2", Profile avatar circle (right).

Section 1 — "AGGIL Suggestions": 
Horizontal scroll card (Deep teal-navy bg). AGGIL chips: "20-25 yrs", "♂♀⚧", "Hyderabad", "Food Tech", "English". 
Clio: "Confirm: 🎂 20-25 | ♀ | 📍 Hyd | #FoodTech. Ready to proceed? [Take this →] [Discuss 💬]"

Section 2 — "Cluster Suggestions":
**On-demand query triggered** on first dashboard load (lightweight DB search for clusters matching user's AGGIL dimensions). While running (~1-3s): Clio insight pill shows "🔍 Let me check..." + 3 shimmer skeleton cards.
**When results arrive:** Pill updates to: "🔍 I looked across Banjara Hills, Gachibowli, and Hitech City for people who mentioned [User's stated interest]. Here's what I found."
**If zero results:** Pill shows: "Nothing yet for [Topic] in your area. I check every few hours — I'll find you when something lands."
**Tap behaviour:** Tapping this pill opens Clio's chat overlay (70% bottom sheet) so the user can immediately refine or pivot the search criteria. Clio's first message in the overlay: *"Want me to look somewhere else? Or change what I'm looking for?"*

Section 3 — "Your Clusters":
Clio-powered empty state. Large **Peach Clio** character (120px, **Curious mood** — slight eye asymmetry, head tilt) in center. Speech bubble: "I keep finding more. Your city's bigger than you think."
**Design note**: neighbourhood names shown in the pill above must use the user's real detected neighbourhood (from the AGGIL Geography dimension), not generic placeholders. If location is not available, use the user's city split into recognisable districts.
Three shimmer cards below Clio.
Two CTA buttons (appear after shimmer): "Create a Cluster" (Teal filled) and "Explore Clusters" (Teal outlined).
Note: AGGIL suggestions marked "Take this" are suggestions to **create or edit and create** a cluster via Clio's conversational flow.

**Bottom Navigation Bar**: Home tab active. Regular FAB "+" in center.

[CLIO]
• Visibility: Prominent (120px, center of "Your Clusters" empty state).
• Entry: M6 (first entry, 0.5s) from right edge. Settles into center of empty state.
• Mood: Curious (slight eye asymmetry, head tilt). Shifts to Happy when results arrive.
• Speech: Insight pill: "I looked across [Neighbourhood1], [Neighbourhood2]... Here's what I found." + Empty state bubble: "I keep finding more. Your city's bigger than you think."
• Micro-animations:
  - Dashboard first loads → M2 (Processing) during shimmer search
  - Results arrive → Curious → Happy transition, M4 (Success Flash)
  - Zero results → M5 (Error Softening), mood stays Curious
  - 30-second post-onboarding silence before first insight (per Silence Design)
• Exit: M10 (Prominent → Peeping) after user interacts with a card.
```

### Screen 3.2 — Dashboard (Populated)

```
[GLOBAL STYLE PREFIX]

Dashboard home screen, populated with data. Top bar: Aggilo logo, Search 🔍, Bell 🔔 with badge "5", user avatar.

Welcome text: "Welcome back, @sia_creates" in deep teal-navy bold. Below: "Here's what's happening in your network." in gray.

Section 1 — "AGGIL Suggestions" with info ⓘ icon beside heading:
A horizontal scrollable card with deep teal-navy background. Header text on card: "Tailored for you" with sparkle ✨ icon. Subtitle: "Based on your recent activity". AGGIL parameter chips on the card: "20-25 yrs", [📍 Hyderabad], #Tech #CareerCraft, "♀", "English". Two action buttons: "Take this →" (white rounded button) and "Discuss with Clio 💬" (white text link). Swipe indicator dots below the card show more suggestions available.

Section 2 — "Cluster Suggestions" with "See All →" link in teal:
Clio insight pill banner (light teal bg, full-width — prefixed with 16px Clio avatar icon, not emoji): "I found 5 clusters matching your profile"
A horizontal scrollable row of cluster suggestion cards. Each card has:
- Cluster image thumbnail (circular or rectangular cover)
- Cluster name in bold (e.g., "Hyderabad Hikers")
- 👥 "1.2k members"
- **Demographic**: "♀ Women only" or "♂ Men only" (if restricted) in a small semi-transparent pill on top of image.
- **Purpose & Tags**: Row of small chips: [📍 Hyderabad] [📍 Secunderabad] [#Hiking] [#Outdoors]
- AGGIL chips: small pills showing key properties ("20-30 yrs", "English")
- "View" outlined teal button
- NO percentage match badge displayed

Section 3 — "Your Clusters" heading:
Three tab pills: "All" (selected, teal bg white text), "Created" (gray), "Joined" (gray).
Vertical list of cluster cards the user has created or joined, each showing:
- Cluster name, activity badge ("ACTIVE" green or "3 new posts" teal badge), AGGIL chips
- NO percentage match badge

Clio FAB (48px, peach face, teal ring) in bottom-left, above main "+" FAB.

Bottom nav: Home highlighted. Teal FAB "+" in center.

[CLIO]
• Visibility: Peeping (FAB 48px, bottom-left).
• Entry: M7 (return entry, fade-in 0.3s).
• Mood: Resting.
• Speech: Insight pill banner (UI element, not speech bubble — prefixed with 16px Clio avatar icon): "I found 5 clusters matching your profile"
• Micro-animations:
  - User taps a cluster card → M3 (Nod)
  - User taps FAB → M9 (Peeping → Prominent), opens chat overlay
• Exit: M8 (fade-out) on navigation away.
```

### Screen 3.3 — Dashboard — AGGIL Suggestion Tour Tooltip

```
[GLOBAL STYLE PREFIX]

Same as Screen 3.2 but with a tooltip bubble pointing at the AGGIL Suggestions card. The tooltip has a white background, rounded corners, and a small triangular pointer:
- Title: "AGGIL Suggestions" in bold
- Body: "I generate personalized cluster suggestions based on your Age, Gender, Geography, Interest, and Language. Tap 'Take this' to start a cluster, 'Discuss with Clio' to refine the settings, or swipe for more."
- "Tip: More specific settings = higher cluster score = better connections! 🎯"
- "Next →" link in teal

Background behind the tooltip is slightly dimmed.

**Clio Visibility**: Not applicable — Clio is narrating the tour overlay (see Flow 12).

[CLIO]
• Visibility: Tour overlay — see Flow 12 for Clio-guided tooltip specs.
• Bottom Navigation Bar: VISIBLE (dimmed behind overlay).
```

---

## Flow 4: Explore & Search (5 screens)

### Screen 4.1 — Explore Page

```
[GLOBAL STYLE PREFIX]

Explore page. Top: "Explore Clusters" title in deep teal-navy, notification bell 🔔 icon on right.

Below title: Search bar with placeholder "Search clusters, interests..." and a filter icon (funnel) button on the right side of the search bar.

Below: Three horizontal tab pills: "Trending" (selected, teal background white text), "Near You" (gray), "New" (gray).

Section heading: "TOP MATCHES" with "See All" teal link on right.

Cluster card list (vertical scroll):
Each cluster card is a white rounded rectangle (16px radius) with subtle shadow containing:
- Top: Rectangular cluster cover image (16:9 ratio, rounded top corners)
- Activity badge: top-right corner of image, pill showing "VERY ACTIVE" in green text
- **Demographic Badge**: "♀ Women only" pill overlay on bottom-right of image.
- Title below image: "Women Entrepreneurs" in bold deep teal-navy
- Stats row: "👥 1.2k Members"
- **Purpose & Tags**: Row of chips: [📍 Banjara Hills] [📍 Gachibowli] [#CareerCraft] [#Startup]
- AGGIL chips row: small pills showing dimensions: "20-50 yrs", "English, Hindi"
- **Clio insight line** (light teal bg, 14px, teal text — prefixed with 16px Clio avatar icon, not emoji): "They moved here not knowing anyone either."
- "View Cluster →" teal text button at bottom
- **NO score percentage or match badge visible**

> **Tap → "View Cluster"**: Navigates to Screen 6.1 (Cluster Detail — Posts Tab) in **non-member read-only mode** (see Screen 6.1 Non-Member View spec). Compose bar is hidden; sticky "Join Cluster" button appears at bottom.

> **Long-press on cluster card** → context menu:
> - "Open" (navigates to cluster detail)
> - "Share" (opens share sheet)
> (No "Leave" or "Mute" — user is not yet a member)

> **Long-press on cluster card (joined cluster, Dashboard)** → context menu:
> - "Open"
> - "Share"
> - "Mute Notifications"
> - "Leave Cluster" (triggers Leave Cluster confirmation dialog — see Screen 6.6)

Show 2 cluster cards. Second card partially visible at bottom, showing cover image with activity badge.

Clio FAB (48px, peach face, teal ring) in bottom-left, above main FAB.

> **120-second browse trigger**: If the user browses the Explore page for 120 seconds without tapping "View Cluster" or joining any cluster — OR scrolls past 5+ cluster cards without interacting: Clio speech bubble animates in from bottom-left (Curious mood). Speech is register-calibrated per `clio/personas/*/IDENTITY.md`. Tapping the bubble opens Clio chat. Triggered once per session.

Bottom nav: Explore tab highlighted in teal. Teal FAB "+" in center.

[CLIO]
• Visibility: Peeping (FAB 48px, bottom-left).
• Entry: M6 (first visit) | M7 (return visit).
• Mood: Resting. Shifts to Curious after 120s browse trigger (or 5+ cards scrolled without interaction).
• Speech: 120s trigger → Register-calibrated line per `clio/personas/*/IDENTITY.md` (tapping opens chat overlay)
• Micro-animations:
  - User scrolls past 3rd card → Clio insight lines appear on cards (UI, not Clio speech)
  - 120s idle or 5+ cards scrolled → M9 (Peeping → Prominent) + Curious mood + speech bubble
  - User taps "View Cluster" → M3 (Nod)
• Exit: M8 on navigation away.
• Bottom Navigation Bar: VISIBLE.
```

### Screen 4.2 — Explore — Location Popup

```
[GLOBAL STYLE PREFIX]

Same Explore page but with a bottom sheet modal sliding up from the bottom. The modal has:
- Handle bar at top (gray pill shape for dragging)
- Title: "Filter by Location" in deep teal-navy
- Three location mode options as cards:

  1. 📍 **GPS / Hyperlocal** — card with GPS icon. Toggle "Restrict to this location" (only shown if qualified).
  
  2. 🏙️ **Cities** — Multi-select chip selector: "Hyderabad ✕", "Mumbai ✕", with "Add city..." input. 
  
  3. 📍 **Landmark** — Search for a specific landmark + Radius slider (e.g., "Banjara Hills" + 5km).

Bottom of modal: "Apply" teal button and "Reset" gray outlined button.

[CLIO]
• Visibility: Peeping (FAB behind filter panel, dimmed).
• Mood: Resting.
• Micro-animations: None — filter panel is system UI.
• Bottom Navigation Bar: NOT visible (full-screen filter overlay).
```

### Screen 4.3 — Search Results

```
[GLOBAL STYLE PREFIX]

Search screen. Top: Search bar with text "Women Business" typed, with a clear "✕" button and the filter funnel icon.

Below search bar: Active AGGIL filter chips: "20-50 yrs ✕", "♀ ✕", "Hyderabad ✕", "English ✕".

Results header: "3 clusters found" in gray.

Cluster result cards (same card format as Explore — cover image, title, location tags, demographic, activity badge):
1. "Women Entrepreneurs" — "👥 45 members" — [📍 Pune] [📍 Mumbai] — "♀ Women only" — AGGIL: "20-50 yrs", "EN/HI" — activity: "VERY ACTIVE"
   **Clio insight**: "14 people you already cluster with are here."
   **Purpose**: "Connecting to build tech empires"
2. "Business Women Network" — "👥 12 members" — [📍 Hyderabad] [📍 Banjara Hills] — "♀ Women only" — AGGIL: "25-40 yrs", "EN/TE"
   **Clio insight**: "Small group. They switch between English and Telugu — your kind of room."
3. "Women in Tech" — "👥 67 members" — [📍 Bangalore] [📍 Whitefield] — "♀ Women only" — AGGIL: "20-35 yrs", "EN"
   **Clio insight**: "23 new conversations this week. Something's happening here."

Each card has a "View Cluster →" button. **NO score percentage visible on any card.**

Clio FAB (48px, peach face, teal ring) in bottom-left.

Bottom nav: Explore tab highlighted in teal. Teal FAB "+" in center.

[CLIO]
• Visibility: Peeping (FAB 48px).
• Entry: M7 (return entry).
• Mood: Resting.
• Speech: None — Clio insight lines appear inline on each card as UI elements (prefixed with 16px Clio avatar icon, not speech bubbles).
• Micro-animations:
  - User taps "View Cluster" → M3 (Nod)
• Exit: M8 on navigation.
• Bottom Navigation Bar: VISIBLE.
```

### Screen 4.4 — Search — No Results → Clio Encouragement + Convert to Cluster

```
[GLOBAL STYLE PREFIX]

Search screen. Top: Search bar with "Origami Art Hyderabad" typed.

Below: Active AGGIL filter chips.

Center: Clio avatar (80px, **Curious mood** — slight eye asymmetry) with speech bubble below:
  "Origami Art in Hyderabad.
   Nobody's made that space yet.
   I'll keep looking — you might be the first to call it into existence."

Below Clio speech bubble: A prominent card with a teal gradient border:
- Title: "In the meantime, want to create this cluster?"
- Body: "Create 'Origami Art Hyderabad' and be the first to connect with others who share this interest."
- Two buttons: "Create Cluster →" (teal filled) and "Chat with Clio 💬" (teal outlined)

Below the card: "Modify Search" gray text link.

Bottom nav: Explore tab highlighted in teal. Teal FAB "+" in center.

[CLIO]
• Visibility: Prominent (80px, center).
• Entry: M9 (Peeping → Prominent) when zero results detected.
• Mood: Curious (slight eye asymmetry) → stays Curious throughout.
• Speech: "Origami Art in Hyderabad. Nobody's made that space yet. I'll keep looking — you might be the first to call it into existence."
• Micro-animations:
  - User taps "Create Cluster" → M4 (Success Flash) + transition to wizard
  - User taps "Chat with Clio" → M9 stays Prominent, opens chat overlay
• Exit: M10 if user dismisses; carries to wizard if creating.
• Bottom Navigation Bar: VISIBLE.
```

### Screen 4.5 — Advanced AGGIL Filter Panel

```
[GLOBAL STYLE PREFIX]

Full-screen filter panel sliding in from the right (or as a modal). Top: "← AGGIL Filter" title and "Reset All" red text link on the right.

Tabbed sections across the top: "Age" (selected, teal underline), "Gender", "Geography", "Purpose", "Language".

Age tab content:
- Title: "Age Range"
- A dual-handle range slider from age 13 to 80. The selected range (25-35) highlighted in teal between the two handles.
- Below the slider: "25 years — 35 years" displayed
- Quick-select pills: "Same Year (1996)", "±2 years", "±5 years", "±10 years", "Any age"
- The "Same Year" pill has a small star ⭐ icon and tooltip: "Highest precision score"

Bottom: "Apply Filters" teal full-width button with a preview: "Showing ~23 clusters"

**Clio Visibility**: Peeping. Clio FAB (48px) visible behind filter panel, Resting mood.

[CLIO]
• Visibility: Peeping (FAB behind panel).
• Mood: Resting.
• Micro-animations:
  - User adjusts slider → M3 (Nod) on release
  - User taps "Apply Filters" → M4 (Success Flash)
• Bottom Navigation Bar: NOT visible (full-screen overlay).
```

---

## Flow 5: Create Cluster Wizard (5 screens)

### Screen 5.1 — Step 1: Interest & Tags

```
[GLOBAL STYLE PREFIX]

Create Cluster Wizard. White background.
Top Header: Dark Navy bar with "Create Cluster" title and "Cancel" button.

Sub-Header (Progress):
Horizontal line. Four numbered circles:
(1) Purpose [Teal filled, active]

> **Cancel behaviour**: Tapping "Cancel" in the top header triggers a confirmation dialog:
> - "Discard this cluster?" + "Your progress won't be saved."
> - "Discard" (red filled) + "Keep editing" (gray outline).
> - **Exception**: If the user has not entered any data yet (Step 1, empty form) — navigate back directly without showing the dialog.
(2) Audience [Gray outline]
(3) Details [Gray outline]
(4) Review [Gray outline]

Main Content Area:
Top-Right: Circular "Score" gauge (donut). Reads "0%" in center. Label: "Precision Score".

Form Fields:
1. Headline: "Hook Purpose & Vibrant Tags" (Bold Navy). 
2. Subtext: "Give your cluster an emotional hook and multiple tags."
3. Input: "Headline Purpose *" (Placeholder: "e.g. Conquer the weekend peaks together").
4. Input: "Add Vibrant Tags" (Placeholder: "e.g. #HikingLover #SundayHigh #PeakAdventure").

Bottom Action: "Next Step" button (Teal filled, full width).
Peach Clio Avatar: Small version peeking over the top of the form, **Curious mood**. **Speech bubble**: Register-calibrated per `clio/personas/*/IDENTITY.md`. Example (Momentum register): *"Hiking's trending in your city. I pre-filled some of the next section — worth a look."*

[CLIO]
• Visibility: Peeping → Prominent (speech bubble).
• Entry: M6 (first visit to wizard).
• Mood: Curious.
• Speech: Register-calibrated per `clio/personas/*/IDENTITY.md`. Example: *"Hiking's trending in your city. I pre-filled some of the next section — worth a look."*
• Micro-animations:
  - User fills headline → M3 (Nod)
  - User creates tag chip → M3 (Nod)
  - User taps "Next Step" → M4 (Success Flash)
• Exit: Carries to Step 2 (continuous wizard presence).
• Bottom Navigation Bar: HIDDEN during wizard.
```

### Screen 5.2 — Step 2: Audience (The Slider Layout)

```
[GLOBAL STYLE PREFIX]

Create Cluster Wizard. Top Header: Dark Navy bar.
Progress Circles: (1) Teal check —— (2) Audience [Teal filled, active] —— (3) [Gray] —— (4) [Gray].

Main Content Area:
Top-Right: Circular Score gauge. Reads "45%" in Amber. Ring is 45% filled.

Form Fields:
1. Headline: "Who can join?"
2. Age Group: Dual-handle slider (Range 13–80). Selected: 25-35 (Teal). "All ages" checkbox [ ].
   > **Age self-inclusion enforced in real time**: Neither slider handle can move to exclude the creator's own birth year. An inline indicator shows the creator's year highlighted on the slider track.
3. Gender: Dropdown ("Female" selected). Radio buttons below: [x] Female (Teal), [ ] Male, [ ] Other (⚧).
4. Geography:
   - Mode Selector: [Broad / Multi-City] [Landmark + Range] [Hyperlocal (GPS)]
   - **Broad Mode**: Multi-select chip input (e.g., "Hyderabad ✕", "Mumbai ✕") + "Add city...".
   - **Landmark Mode**: Landmark input (e.g., "Charminar") + Range slider (500m to 50km).
   - **Hyperlocal Mode**: "Find my building" GPS button. Includes building/place name (e.g., "WeWork Gachibowli"). 
   - **Restriction Toggle**: "Restrict participation to this GPS location only" (Available in Hyperlocal/Landmark modes). Note: "If enabled, only users who share GPS **and are within range of this landmark** can see and join this cluster."
   - Map placeholder below showing selected area(s).

Bottom Action: "Next Step" button (Teal filled).
Peach Clio Avatar: Floating joyfully near the score gauge. Prominent.

[CLIO]
• Visibility: Prominent (near score gauge).
• Mood: Happy (watching score rise). Shifts to Excited if score crosses 70%.
• Speech: None — she watches silently, letting the score speak.
• Micro-animations:
  - User adjusts slider → M3 (Nod) on release
  - Score crosses 70% (green) → M4 (Success Flash) + Happy → Excited transition
  - User taps "Next Step" → M4 (Success Flash)
• Exit: Carries to Step 3.
• Bottom Navigation Bar: HIDDEN.
```

### Screen 5.3 — Step 3: Details (About)

```
[GLOBAL STYLE PREFIX]

Create Cluster Wizard. Top Header: Dark Navy bar.
Progress: (1)-(2) done —— (3) Details [Teal filled, active] —— (4).

Main Content Area:
Top-Right: Circular Score gauge. Reads "82%" in Green. Ring is 82% filled.

Form Fields:
1. Headline: "About Cluster"
2. Input: "Cluster Name *" (Auto-filled by Clio: "Women Entrepreneurs"). User can tap to edit.
3. Checkbox: [x] Publish.
4. Input: "Description *" (Multi-line text area). **Proactively filled by Clio**: "A supportive space for female founders in Hyderabad to network, share resources, and grow together." User can edit or clear.
5. Languages: Checkboxes: [ ] Spanish, [x] Telugu (Teal), [ ] Hindi. (Auto-selected based on profile).

Bottom Action: "Next Step" button (Teal).
**Clio Visibility**: Peeping. Clio peeks from the top-right corner, **Happy mood**. **Speech bubble**: Register-calibrated per `clio/personas/*/IDENTITY.md`. Example (Momentum register): *"I drafted this based on what works in clusters like yours. See if it sounds right."*

[CLIO]
• Visibility: Peeping → speech bubble.
• Mood: Happy.
• Speech: Register-calibrated per `clio/personas/*/IDENTITY.md`. Example: *"I drafted this based on what works in clusters like yours. See if it sounds right."*
• Micro-animations:
  - User edits Clio's pre-filled text → M1 (Listening)
  - User taps "Next Step" → M4 (Success Flash)
• Exit: Carries to Step 4.
• Bottom Navigation Bar: HIDDEN.
```

### Screen 5.4 — Step 4: Confirmation (Preview Card)

```
[GLOBAL STYLE PREFIX]

Create Cluster Wizard. Top Header: Dark Navy bar.
Progress: All steps (1)-(2)-(3) connected with Teal lines —— (4) Confirm [Teal active].

Main Content:
Headline: "Confirmation". Subtext: "Are you sure you want to create this cluster?"

Center Card (The Preview):
White card (Elevation 2).
- Purpose & Tags: #Entrepreneurship #CareerCraft #Mentorship (Teal text)
- Title: "Women Entrepreneurs" (Bold Navy)
- **Demographic**: "♀ Women only" pill overlay on image thumbnail.
- **Location Tags**: [📍 Banjara Hills] [📍 Gachibowli]
- User: Avatar + "@emma_creates" + "1 day ago"
- Purpose: "A supportive space for female founders in Hyderabad..."

Bottom Action: "Edit Cluster" (Gray) and "Looks good, Confirm" (Teal).
Score Gauge (Top-Right): "95%" (Green, pulsing).

[CLIO]
• Visibility: Peeping (behind review card).
• Mood: Proud (asymmetric smile, restrained celebration).
• Speech: None — the preview speaks for itself.
• Micro-animations:
  - User taps "Looks good, Confirm" → M4 (Success Flash) + Proud → Excited transition + navigate to 5.5
  - User taps "Edit Cluster" → M3 (Nod) + navigate back
• Exit: Carries to success overlay.
• Bottom Navigation Bar: HIDDEN.
```

### Screen 5.5 — Success Overlay

```
[GLOBAL STYLE PREFIX]

Success Overlay. Dashboard background is visible but dimmed/blurred.
Large white modal card (Elevation 3, rounded corners).

Content:
1. Teal Checkmark (Success icon) at top.
2. Headline: "It's live." in deep teal-navy. Subhead: "Your cluster is out there now."
3. Body: "I'm already looking for the right people."
4. Button: "Take me there →" (Teal filled).

**Peach Clio**: Sitting on top of the modal, **Excited mood** (wide circles, pupils dilated, iris ring brightens, subtle spring-settle bounce). **No cheering animation** — Clio is excited but contained. One beat of silence, then the eyes settle into Happy mood.

**Bottom Navigation Bar**: Visible in background (dimmed).

> **Voice note**: Never "Great!". Never "Cluster created successfully!". Bible rule: she does not perform enthusiasm. "It's live." is a statement of fact. The excitement is in her eyes.

[CLIO]
• Visibility: Prominent (sitting on top of modal).
• Entry: Appears with modal (bounce-settle, 400ms).
• Mood: Excited (wide circles, pupils dilated, iris ring glows) → settles to Happy after 1s.
• Speech: "It's live." + "I'm already looking for the right people." (inline, not speech bubble).
• Micro-animations:
  - Modal appears → Celebrate animation (see animation prompts §10)
  - 1 beat of silence → Excited → Happy settle
  - User taps "Take me there" → M4 (Success Flash) + navigate to cluster
• Exit: Fade-out as cluster timeline loads.
• Bottom Navigation Bar: VISIBLE (dimmed behind modal).
```

---

### Screen 5.4.b — Duplicate Interception (Clio Challenge)

```
[GLOBAL STYLE PREFIX]

Create Cluster Wizard. Top Header: Dark Navy bar with "Possible Match" title.

Clio creature avatar (80px), **Curious mood** — slight eye asymmetry, one eye fractionally narrower, upward gaze as if working something out. 
Large speech bubble: 
  "Hold on — I found a cluster called 'Women in Business Hyd'
   with 45 members and overlapping tags.
   I need to understand: what makes yours different?
   If you have a unique angle, tell me. I'll run feasibility."

Input Field: "Describe your unique differentiator to Clio..." (Multi-line text area).

Two Buttons:
- "Check Feasibility with Clio →" (Teal filled)
- "Join existing cluster instead" (Teal outlined)

Score Gauge (Top-Right): 95% (Green, static).

[CLIO]
• Visibility: Prominent (80px, top of screen).
• Mood: Curious (working something out about your cluster vs the existing one).
• Speech: "Hold on — I found a cluster called 'Women in Business Hyd'..."
• Micro-animations:
  - User types differentiator → M1 (Listening)
  - User taps "Check Feasibility" → M2 (Processing) while Clio evaluates
  - Feasibility passes → M4 (Success Flash) + Curious → Happy
  - Feasibility fails → M5 (Error Softening) + Empathetic mood
• Exit: Navigate to next wizard step or existing cluster.
• Bottom Navigation Bar: HIDDEN.
```

---

## Flow 6: In-Cluster Experience (7 screens)

### Screen 6.1 — Cluster Detail — Posts Tab (Member view)

```
[GLOBAL STYLE PREFIX]

Cluster Detail Screen. 
Top Bar: Navy background. Title "Women Entrepreneurs". Back arrow. Overflow "⋮" (right).

Header Card:
- Cluster Image placeholder (banner-style, 120px height).
- Title: "Women Entrepreneurs".
- Subtitle: "Purpose: Professional Execution & Support".
- Tags: #CareerCraft, #Startup, #Mentorship (tappable teal chips).
- Stats: "👥 23 members", "💬 3 posts" (Teal icons).

Tabs: "Posts" (Teal underline, active), "Pulse", "Members (23)", "Media".

> **Tab naming note**: "Posts" = member-generated content. "Pulse" = Clio/Scout-curated external internet content matching the cluster's interests.

Posts Content (Member view — user is a member):
- **Compose bar** (top of Posts tab, always visible for members):
  - **Dynamic Placeholder (CRITICAL):** The compose bar must NEVER say "Share something with the group..." or "What's on your mind?". The placeholder text is dynamically derived from the cluster's purpose and tags. Examples: for a cluster tagged #HyderabadHikers it says *"What's the best trail near Ananthagiri?"*; for #WomenEntrepreneurs it says *"What did you learn at your last pitch?"*. The placeholder is generated by Clio using the `cluster_host` skill at cluster creation and cached.
  - Row of 6 content-type icons below input: 📝 Text, 📸 Image, 🎬 Video, 🔗 Link, 📊 Poll, 🎤 Voice.
  - Tapping an icon opens the corresponding composer (camera/gallery for image, URL input for link, hold-to-record for voice, etc.).
  - Peach Clio icon floats at the right end of the compose bar.
  - **MVP Note**: All 6 content types are supported for cluster Posts. (DMs are text-only for MVP — see Flow 7.)
- Post card: "@emma_creates" · **"Jan 20, 2:30 PM"** (subtle gray), text + image gallery, footer: ❤️ 3, 💬 7, 📤 Share.
- Post card: "@tech_nomad" · **"Yesterday, 10:15 AM"**, link preview (rich card with thumbnail, title, domain), footer: ❤️ 12, 💬 4, 📤 Share.
- Post card: "@urban_girl" · **"2 days ago"**, 📊 Poll: "Best co-working space?" with 3 options and live result bars. 14 votes. Expiry: "2 days left".
- **External Public Link**: `aggilo.com/c/women-entrepreneurs` (shareable cluster link, in overflow menu ⋮).

**Pull-to-Refresh**: Supported. Teal circular progress indicator at top. New posts fade in from top with a pill notification: "3 new posts ↑" (teal, tappable to scroll up).

**Interaction Rule**: Each post supports:
- **Tap**: Opens full post view / expand
- **Long-press**: Context menu — "Report Post" (red), "Share Post", "Copy Link"
- **Three-dot ⋮ menu**: Same options as long-press

**🟡 Empty Posts State** (when no member has posted yet — a new cluster):
- Compose bar visible and highlighted with a gentle teal glow border.
- Clio avatar (80px, Curious mood) centered below compose bar.
- Speech bubble: "Nobody's set the tone yet."
- No skeleton cards — just Clio and the highlighted compose bar.

**⚠️ Non-Member View** (logged-in Aggilo user views cluster from Explore before joining):
- Same header card.
- Tab bar visible but compose bar is HIDDEN.
- Posts tab shows a scrollable read-only feed (posts are visible but interaction icons are disabled).
- Pulse tab: fully visible (no join required to see external content).
- Members tab: shows count only ("23 members"), no nicknames visible.
- Media tab: visible, read-only.
- **Sticky bottom bar** (replaces Bottom Nav): full-width teal button "Join Cluster" (48px height).
  - Tapping "Join Cluster" -> eligibility check runs silently -> if passes: user joins, compose bar appears, sticky bar disappears, success toast: "You're in."
  - Clio speech bubble appears on first scroll: "Looks like your kind of room."
- **Non-Member Empty Posts State** (cluster has 0 posts, non-member is viewing): Compose bar hidden. Clio avatar (80px, Resting mood) centered. Speech bubble: "This cluster is just getting started." Sticky "Join Cluster" bar remains at bottom.

**Score Gauge Note**: The Precision Score gauge is visible **only** to the cluster Founder in the Cluster Info sheet (Screen 6.6). It is **never** shown on Explore, Search, or Dashboard cluster cards, or in this Posts tab.

**Clio Visibility**: Peeping. Clio FAB (48px) sits in the bottom-left corner, behind the Posts content.

[CLIO]
• Visibility: Peeping (FAB 48px, bottom-left) for active clusters. Host Mode (inline card) for Phase A/B/C.
• Entry: M7 (return entry) for Peeping | M12 (Host Mode card) for Phases A/B/C.
• Mood: Resting (active cluster). Curious (empty state — waiting for first post).
• Speech (Host Mode, empty cluster): "Nobody's set the tone yet."
• Speech (Non-member scroll): "Looks like your kind of room."
• Micro-animations:
  - User starts composing → M1 (Listening), Clio dims to background
  - User publishes post → M4 (Success Flash)
  - Non-member taps "Join Cluster" → M4 (Success Flash) + Resting → Happy
• Silence: Clio steps back when cluster has >3 active posters per day (per SOUL.md §10).
• Exit: M8 on navigation away.
• Bottom Navigation Bar: VISIBLE (members) | HIDDEN + sticky Join (non-members).
```

### Screen 6.2 — Cluster Detail — Pulse Tab (Clio-Curated External Content)

```
[GLOBAL STYLE PREFIX]

Cluster Detail Screen. Same header card as 6.1.
Top Bar: Navy background. Title "Women Entrepreneurs". Back arrow. Overflow "⋮" (right).

Tabs: "Posts", "Pulse" (Teal underline, active), "Members (23)", "Media".

Pulse Content:
- **What is Pulse?** Clio / Yantra Scout automatically surfaces relevant content from across the internet — articles, discussions, social posts, news, events — that matches this cluster's AGGIL parameters, description, and vibrant tags. Published externally; curated specifically for this cluster. Updated regularly — frequency scales with cluster size.
- **Purpose**: Solves the cold-start problem for new clusters. Even with 0 member posts, the cluster has a living, breathing content stream from day one.

Pulse Feed Layout (scrollable, newest first):
- **Pulse card** (each item):
  - Source logo + source name (e.g., "TechCrunch" or "Reddit /r/startups") in gray small text.
  - Article/discussion headline in H3 (18px bold).
  - 1-line summary teaser.
  - Thumbnail image (if available) on the right.
  - Published timestamp (e.g., "4h ago").
  - **💬 Comment** button (teal text, shows existing comment count) + **📤 Share** icon.
  - Tapping "Comment" opens a comment sheet below the card — members can discuss the link within the cluster context.

Sample Pulse items for "Women Entrepreneurs" cluster:
1. 📰 "How Hyderabad women founders are reshaping the city's startup scene" — Times of India, 3h ago. [Comment 💬 2] [Share]
2. 📰 "Grants for women-led businesses in Telangana 2026 — full list" — YourStory, Yesterday. [Comment 💬 0] [Share]
3. 💬 "Weekly discussion: What's one investor meeting mistake you made early on?" — Pulse generated, 2d ago. [Comment 💬 7] [Share]
4. 🎥 Video: "Funding your first startup as a woman founder" — YouTube, via Clio Scout, 4d ago. [Comment 💬 1] [Share]

At the top of the feed, a small Clio appearance (40px, Curious mood):
- Speech bubble (auto-dismiss 8s): "These are happening in your space right now."
- Small "How does Pulse work?" teal text link — opens an info sheet explaining Scout curation.

**Pulse Empty State** (cluster newly created, Clio still populating):
- Clio avatar (80px, Resting mood) centered.
- Speech bubble: "I'm gathering what's happening in your space. Check back in a few hours."
- Subtle shimmer placeholder cards (3) below.

**Pulse Feedback**: If a member finds an item irrelevant, they can tap "⋮" on a card — "Not relevant" option sends a signal to Clio to refine future curation.

**Clio Visibility**: Prominent. Clio appears inline at top of Pulse feed. FAB (48px) also visible, Resting mood.

[CLIO]
• Visibility: Prominent (40px inline at top of feed) + Peeping (FAB 48px).
• Mood: Curious (scanning what's relevant for this cluster).
• Speech: "These are happening in your space right now." (auto-dismiss 8s)
• Speech (empty state): "I'm gathering what's happening in your space. Check back in a few hours."
• Micro-animations:
  - User taps "Not relevant" on a card → M3 (Nod) + quiet acknowledge
  - User taps "Comment" → M1 (Listening)
• Exit: Inline Clio stays; FAB exits via M8 on navigation.
• Bottom Navigation Bar: VISIBLE.
```

### Screen 6.3 — Cluster Detail — Members Tab

```
[GLOBAL STYLE PREFIX]

Same cluster detail page. Top bar: "←" back arrow, Cluster name "Women Entrepreneurs" (center), overflow "⋮" (right). Cluster header card condensed.

Tab bar: "Posts", "Pulse", "Members (23)" (selected, teal underline), "Media".

Search bar: "Search members..." with small filter icon.

Members list, each row:
1. Avatar circle + "@sia_creates" + "👑 Founder" badge (gold) + "Joined Jan 2026" — three-dot menu on right
2. Avatar circle + "@tech_nomad" + "Active now" green dot + shared interest chips: [💻 Tech] [💼 Business] — DM icon 💬 on right
3. Avatar circle + "@urban_girl" + "Active 2h ago" + shared interest chips: [💼 Business] — DM icon on right
4. Avatar circle + "@code_queen" + "Active yesterday" + shared interest chips: [💻 Tech] — DM icon on right
5. Avatar circle + "@biz_guru" + "Active 3d ago" + shared interest chips: [💼 Business] [✈️ Travel] — DM icon on right

All entries show ONLY nicknames. No real names. No emails.
Shared interest chips are small (10px font, rounded pills) showing interests that the viewing user has in common with that member.

Tapping the DM icon opens a direct message **within the cluster context** ("💬 You connected via [Cluster Name]" banner will appear in the DM).
Tapping the nickname shows the limited profile (within cluster context only).

Note: DMs can ONLY be initiated from this member list (within cluster context). There is no standalone "find people to message" feature.

Bottom: Total counter "23 members" in gray.

**Clio Visibility**: Peeping. Clio FAB (48px) in bottom-left corner, Resting mood.

[CLIO]
• Visibility: Peeping (FAB 48px).
• Mood: Resting.
• Speech: None.
• Micro-animations:
  - User taps DM icon on a member → M3 (Nod)
• Exit: M8.
• Bottom Navigation Bar: VISIBLE.
```

### Screen 6.4 — Cluster Detail — Media Tab

```
[GLOBAL STYLE PREFIX]

Same cluster detail page. Top bar: "←" back arrow, Cluster name "Women Entrepreneurs" (center), overflow "⋮" (right). Cluster header card condensed.

Tab bar: "Posts", "Pulse", "Members (23)", "Media" (selected, teal underline).

A grid layout (3 columns) of media thumbnails, Instagram-style:
- Mix of photos and video thumbnails (video ones have a small ▶️ play icon overlay)
- Thumbnails are square, edge-to-edge with 2px gap between them
- First row: 3 photos (whiteboard, team photo, laptop screen)
- Second row: 1 video thumbnail, 2 photos
- Third row: 3 photos

Tapping any thumbnail opens it full-screen. 

If empty: Clio avatar (80px, Resting mood) with speech bubble: *"No images or videos yet. If something's worth remembering from this cluster, share it here."* — **NOT** a generic "Be the first!" CTA.

**Clio Visibility**: Peeping. Clio FAB (48px) in bottom-left corner, Resting mood.

[CLIO]
• Visibility: Peeping (FAB 48px). Empty state: Prominent (80px, Resting).
• Mood: Resting.
• Speech (empty): "No images or videos yet. If something's worth remembering from this cluster, share it here."
• Exit: M8.
• Bottom Navigation Bar: VISIBLE.
```

### Screen 6.5 — Post Composer

```
[GLOBAL STYLE PREFIX]

Full-screen post composer overlay. Top bar: "Cancel" (gray text left), "New Post" title center, disabled "Post" button right (turns teal when content is added).

Post composer area (no post-type selector — single unified compose mode).

User identity row: Small avatar + "@sia_creates" + "posting in Women Entrepreneurs"

Composer area:
- Title input: "Add a title..." placeholder in large font
- Body input: "Share your thoughts with the cluster..." placeholder in regular font
- User has typed some content, making the "Post" button active (teal).

Bottom toolbar (above keyboard):
- 📷 Image icon
- 🎥 Video icon  
- 📍 Location icon
- 📎 Document icon
- "💾 Save as draft" text link on the right

Below toolbar: Small text "Your post will be visible to all 23 members of this cluster."

**Clio Visibility**: Peeping. Small Clio icon (40px) at right end of compose bar, Resting mood. No speech bubble — she is listening.

[CLIO]
• Visibility: Peeping (40px, right end of compose bar).
• Mood: Resting → M1 (Listening) while user types.
• Speech: None.
• Micro-animations:
  - User starts typing → M1 (Listening)
  - User taps "Post" → M4 (Success Flash)
• Exit: Returns to cluster timeline on post.
• Bottom Navigation Bar: NOT visible (full-screen overlay).
```

### Screen 6.6 — Cluster Info / Settings (Modal Drawer)

```
[GLOBAL STYLE PREFIX]

A bottom sheet modal drawer sliding up, covering 80% of the screen. Dimmed backdrop. Handle bar at top.

Title: "Cluster Info" in deep teal-navy. "✕" close button top-right.

Cluster details:
- Image (banner)
- "Women Entrepreneurs @ WeWork Gachibowli"
- Created by @sia_creates · "Jan 15, 2026"
- Score: "🎯 Precision Score: 82%" green badge (visible to founder only, with note "Only you can see this")

AGGIL Settings section (read-only for non-founders):
- Age: "1994-1998 (±2 years)"
- Gender: "Female only ♀"
- Geography: "📍 Banjara Hills, 📍 Gachibowli"
- Purpose: "Professional execution and mentorship"
- Tags: "#Startup #CareerCraft #Women-led"
- Languages: "English, Hindi"

Description: Full text visible.

Action buttons:
- "🔔 Notification Settings" → expandable:
  - Toggle: "New posts" (ON)
  - Toggle: "New members" (ON)
  - Toggle: "Chat messages" (ON)
  - Toggle: "Mute all" (OFF)
- "📤 Share Cluster" 
- "🚪 Leave Cluster" (red text)
- "🚩 Report Cluster" (gray text)

**Leave Cluster confirmation**: Tapping "Leave Cluster" — triggers a native bottom dialog:
- Title: "Leave Women Entrepreneurs?"
- Body: "You can re-join later if you still meet this cluster's criteria."
- Buttons: "Leave" (red filled) + "Stay" (gray outline).

> **Founder leaving**: No special prompt is shown to Founders. Leaving works identically to member leaving. The cluster persists with no owner — Clio holds the space. Any future member can claim Founder status. Nothing is orphaned; Clio is always the room's presence.

**🏆 10-Member Milestone (Founder only)**: When this cluster's member count reaches 10, a Clio Host Mode card appears at the top of the Cluster Info sheet (before the AGGIL Settings section), visible only to the Founder:
- Clio avatar (40px, **Happy mood** — inverted-crescent eyes)
- Speech bubble: *"Ten people. That's when clusters start feeling like something."*
- Dismissible with a gentle swipe-up. Not re-shown after dismissed.

**Clio Visibility**: Peeping. Clio FAB visible behind the bottom sheet (dimmed), Resting mood.

[CLIO]
• Visibility: Peeping (FAB, dimmed behind sheet). 10-member milestone: Host Mode card (M12, founder only).
• Mood: Resting. Happy for 10-member milestone.
• Speech (10-member milestone, founder only): "Ten people. That's when clusters start feeling like something."
• Micro-animations:
  - User taps "Leave Cluster" → M5 (Error Softening)
  - User taps "Share Cluster" → M3 (Nod)
• Bottom Navigation Bar: VISIBLE (dimmed behind sheet).
```

### Screen 6.7 — Share Cluster Sheet

```
[GLOBAL STYLE PREFIX]

A small bottom sheet overlay on the cluster detail page. Title: "Share Cluster" with "✕".

Cluster mini-preview card: Cluster image thumbnail (circular), Name "Women Entrepreneurs", "23 Members · Hyderabad". NO match score or percentage shown.

Section: "Share to"
Share target icons in a horizontal scrollable row:
- WhatsApp (green circle)
- Instagram (gradient circle)
- X / Twitter (black circle)
- Messenger (blue circle)
- Telegram (blue circle)
- More... (gray circle)

Section: "Or copy link"
A copyable link field: "aggilo.com/c/women..." with a "Copy" teal button.

Note at bottom: "Anyone with this link will need to match the cluster's AGGIL criteria to join."

**Clio Visibility**: Peeping. Clio FAB visible behind the bottom sheet (dimmed), Resting mood.

[CLIO]
• Visibility: Peeping (FAB, dimmed behind sheet).
• Mood: Resting.
• Speech: None.
• Exit: Sheet dismisses.
• Bottom Navigation Bar: VISIBLE (dimmed).
```

---

## Flow 7: Direct Messaging (2 screens)

> **Design rule**: DMs are initiated ONLY from within a cluster's member list (Screen 6.3). There is no standalone "find people" or "browse users" feature. This reinforces the cluster-as-context model. **Clio has no active role inside DM conversations**. DMs are **text only** for MVP (image/video/doc icons HIDDEN).

### Screen 7.1 — DM Conversation List

```
[GLOBAL STYLE PREFIX]

Messages tab from bottom navigation (selected in teal). Title: "Messages" in deep teal-navy. Search icon 🔍 on right.

Conversation list (WhatsApp-style):
1. Avatar circle + "@tech_nomad" + "Active now" green dot
   Last message: "Sure, let's meet at 12:30!" + "2:16 PM" + **unread badge "2"** (teal circle, bold count)
   Context: "via Women Entrepreneurs" in small gray text
   (Unread rows have a slightly bolder font weight and a light teal-tinted background)

2. Avatar + "@code_queen" + "Active 2h ago"
   Last message: "Check out this article on funding..." + "Yesterday"
   Context: "via Women in Tech"
   (Read rows have normal font weight and white background)

3. Avatar + "@biz_guru" + "Active 3d ago"
   Last message: "Thanks for the recommendation!" + "Mon"
   Context: "via Startup Founders Hub"

Each row shows ONLY nicknames. The "via [Cluster Name]" context shows where the DM originated.
Visual read/unread differentiation: unread rows have bolder text + teal-tinted bg + unread count badge.

Empty state (if no DMs): Illustration of two chat bubbles, text "No messages yet. Start a conversation from a cluster's member list!"

**Swipe Gestures on DM rows:**
- **iOS**: Swipe left → reveals "Delete" (red) action button. Swipe right → pins conversation (teal pin icon appears left of avatar).
- **Android**: Swipe left → reveals "Delete" (red). Long-press → context menu with "Delete", "Mark as read/unread".
- **Delete confirmation**: Bottom dialog — "Delete this conversation? Messages will be deleted for you only. The other person keeps their copy." — "Delete" (red filled) + "Cancel" (gray outline).

Bottom nav: Messages tab highlighted.

[CLIO]
• Visibility: Not present — DMs are human-only space (SOUL.md §10).
• Bottom Navigation Bar: VISIBLE.
```

### Screen 7.2 — DM Chat Screen

```
[GLOBAL STYLE PREFIX]

Full-screen DM interface. Top bar: "←" back arrow, "[🔵 cluster icon] Women Entrepreneurs" subtitle (12px gray, above name), Avatar + "@tech_nomad" + "Active now" green dot.

Context banner below top bar (persistent, light teal bg, full-width): "💬 You connected via Women Entrepreneurs" — tapping the cluster name navigates back to the cluster.

Floating teal pill at bottom-right (above message input): "← Back to Women Entrepreneurs" — appears when scrolled up, fades when typing.

Chat bubbles (same style as cluster chat but 1:1):
Right bubble (teal): "Hey! Are you going to the founder event next week?"
Left bubble (gray): "Yes! I've already registered. Should be great!"
Right bubble: "Perfect, let's coordinate. I'll share the details."
Left bubble (gray): "See you there!"

**Interaction Rule**: Long-press on any chat bubble opens a context menu with: "Report Message" (Red), "Copy Text", "Reply".

All identity shown as nickname only. No phone number, no email visible anywhere.

[CLIO]
• Visibility: Not present — Clio has no active role inside DMs (SOUL.md §10).
• Bottom Navigation Bar: NOT visible (full-screen DM).
```

---

## Flow 8: User Profile (3 screens)

### Screen 8.1 — My Profile

```
[GLOBAL STYLE PREFIX]

Profile tab selected in bottom nav (teal). Top bar: "Profile" title center. Settings ⚙️ gear icon on right.

Profile card:
- Large avatar circle (80px) with a camera icon overlay for changing photo
- Nickname: "@sia_creates" in bold deep teal-navy (large font)
- "Member since Jan 2026" in gray
- Stats row: "10 clusters created" · "3 clusters joined"

Two tab pills below stats: "About Me" (selected, teal underline), "Interests"

About Me tab content:
- Bio section with edit ✏️ icon: "I like to receive and deal with challenging tasks. I am a very enthusiastic student..."
- "Basic Info" section:
  - Gender: "Female ♀"
  - Age Group: "25-30" (NOT showing exact year or DOB)
  - Location: "Hyderabad" (city-level only, not exact address)
  - Languages: "English, Telugu"

Activity section:
- "Created a sports for women cluster on 15 Jan, 2026"
- "Joined an entrepreneurship cluster on 15 Jan, 2026"

Important: NO real name shown anywhere. NO email shown. NO phone number. NO exact DOB. Only nickname + age group + city-level location.

**Clio Profile Observation**: When the profile is opened and has an incomplete bio (bio is empty OR interests < 3 selected), Clio appears as a small contextual banner at the top of the About Me tab:
- Clio avatar (32px, Curious mood)
- Speech: *"Your profile is pretty sparse. I can't match you properly without more to work with."*
- "Add Bio" teal text link inline. Dismissed by tapping anywhere on the banner.
- Not shown when bio is filled AND interests ≥ 3.

**Clio Visibility**: Peeping. Clio FAB (48px) in bottom-left, Resting mood.

[CLIO]
• Visibility: Peeping (FAB 48px). Contextual banner (32px, Curious) if profile incomplete.
• Mood: Resting. Curious for incomplete profile banner.
• Speech (incomplete profile only): "Your profile is pretty sparse. I can't match you properly without more to work with."
• Micro-animations:
  - User taps "Add Bio" → M3 (Nod)
  - User saves bio edit → M4 (Success Flash)
• Exit: M8.
• Bottom Navigation Bar: VISIBLE — Profile tab highlighted.
```

### Screen 8.2 — My Profile — Interests Tab

```
[GLOBAL STYLE PREFIX]

Same profile header. "Interests" tab selected.

Grid of interest chips (same style as onboarding):
Selected interests shown as red-bordered cards with checkmarks:
"🏏 Sports ✓", "💼 Business ✓", "💻 Technology ✓", "✈️ Travel ✓"

Below: "Edit Interests" teal outlined button.

Section: "Suggested for you" — gray section showing interests the user might like based on their clusters:
"📷 Photography", "🎨 Art & Design" — each with a "+" add button.

**Clio Visibility**: Peeping. Clio FAB (48px) in bottom-left, Resting mood.

[CLIO]
• Visibility: Peeping (FAB 48px).
• Mood: Resting.
• Micro-animations:
  - User adds a suggested interest → M3 (Nod)
• Exit: M8.
• Bottom Navigation Bar: VISIBLE — Profile tab highlighted.
```

### Screen 8.3 — Other User's Profile (Within Cluster Context)

```
[GLOBAL STYLE PREFIX]

Viewing another user's profile from within a cluster. Top bar: "←" back, title "Profile", gray subtitle "via Women Entrepreneurs" — cluster context visible throughout sub-page.

Profile card:
- Avatar circle (80px)
- "@tech_nomad" in bold
- "Member since Feb 2026"
- "Mutual clusters: 2" in teal text

Tabs: "About" (selected), "Shared Clusters"

About tab:
- Bio: "Tech enthusiast and startup mentor..."
- Gender: "Male ♂"
- Age Group: "25-30"
- Location: "Hyderabad"
- Languages: "English, Hindi"

Action buttons:
- "💬 Send Message" (teal filled button)
- "🚩 Report User" (gray text link)
- "🚫 Block User" (red text link)

Important: MINIMAL info shown. No email, no phone, no exact DOB, no real name. Only what's needed for cluster context.

**Clio Visibility**: Peeping. Clio FAB (48px) in bottom-left, Resting mood.

[CLIO]
• Visibility: Peeping (FAB 48px).
• Mood: Resting.
• Speech: None.
• Micro-animations:
  - User taps "Send Message" → M3 (Nod)
• Exit: M8.
• Bottom Navigation Bar: NOT visible (sub-page).
```

---

## Flow 9: Settings (2 screens)

### Screen 9.1 — Settings Main

```
[GLOBAL STYLE PREFIX]

Settings page. Top bar: "←" back, "Settings" title.

Settings sections as grouped list items:

Section: "Account"
- "📱 Phone Number" → "Verified: +91 •••••67890" (masked) — "Change" link
- "@  Nickname" → "@sia_creates" — "Change" link (with note "Limited changes allowed")
- "🎂 Date of Birth" → "Set" (grayed out) with lock icon and note "Cannot be changed"

Section: "Preferences"
- "🌐 Languages" → "English, Telugu" — arrow →
- "🔔 Notifications" → arrow → (leads to detailed notification settings)
- "📍 Location" → "Hyderabad" — arrow →
- "🤖 Clio Assistant" → arrow → (leads to Clio preferences sub-page):
  - Toggle: "Show Clio tips" (ON/OFF, default ON)
  - Slider: "Clio presence level" with 3 stops: "Minimal" / "Moderate" (default) / "Active"
    - Minimal: Clio FAB visible but no proactive bubbles or idle nudges
    - Moderate: Clio shows contextual tips on first visit + idle nudges
    - Active: Clio proactively surfaces insights, summaries, and encouragement
  - Toggle: "Idle nudges" (ON/OFF, default ON) — Clio gently bounces after inactivity

Section: "Privacy"
- "👁️ Profile Visibility" → "Cluster context only" — arrow →
- "💬 DM Requests" → "From cluster members" toggle
- "📊 Activity Status" → "Show when active" toggle

Section: "Security"
- "🔐 Change Phone Number" → arrow →
- "📤 Export My Data" → arrow → (navigates to a confirmation screen: "We'll send a copy of your personal data to your registered phone/email within 48 hours, as required by DPDPA. Your data only — no cluster metadata.")
- "🗑️ Delete Account" → red text

Bottom: "Log Out" teal outlined button. App version "Aggilo v1.0.0" in small gray text.

**Delete Account confirmation flow**: Tapping "Delete Account" navigates to a full-screen confirmation page (NOT a small dialog — this is serious):
- Large red warning icon at top.
- Title: "Delete your Aggilo account?" in bold red.
- Bullet list of consequences:
  - "Your clusters will be removed or handed to another member"
  - "All your posts and media will be permanently deleted"
  - "Your DM history will be erased"
  - "This cannot be undone"
- Teal info box: "Your account will be deactivated for 7 days first. Log back in within 7 days to cancel deletion."
- OTP verification required: "For security, we'll send a code to +91 98765 ••••• to confirm."
- "Confirm with OTP" button (red outlined).
- "Cancel" gray text link below.

**Log Out confirmation**: Tapping "Log Out" — simple alert dialog: "Log out from Aggilo? You'll need to verify your number to sign back in." — "Log Out" (teal) + "Cancel" (gray).

**Clio Visibility**: Peeping. Clio FAB (48px) in bottom-left, Resting mood.

[CLIO]
• Visibility: Peeping (FAB 48px).
• Mood: Resting.
• Speech: None.
• Micro-animations:
  - User adjusts Clio presence level slider → M3 (Nod)
  - User taps "Delete Account" → M5 (Error Softening)
• Exit: M8.
• Bottom Navigation Bar: NOT visible (sub-page).
```

### Screen 9.2 — Notification Settings

```
[GLOBAL STYLE PREFIX]

Notification settings page. Top: "← Notification Settings".

Section: "Push Notifications"
- Toggle: "Enable push notifications" (ON, teal toggle)

Section: "Notification Types"
- "📝 New posts in my clusters" — Toggle ON
- "💬 Chat messages" — Toggle ON
- "👥 New members" — Toggle ON
- "🎯 Cluster suggestions" — Toggle ON
- "🤖 AGGIL trending topics" — Toggle ON

Section: "Quiet Hours"
- Toggle: "Enable quiet hours" (ON)
- Time pickers: "From: 11:00 PM" — "To: 7:00 AM"

Section: "Per-Cluster Settings"
- "Manage notification preferences for individual clusters →" link in teal

Bottom: "Save" teal button.

**Clio Visibility**: Peeping. Clio FAB (48px) in bottom-left, Resting mood.

[CLIO]
• Visibility: Peeping (FAB 48px).
• Mood: Resting.
• Micro-animations:
  - User taps "Save" → M4 (Success Flash)
• Exit: M8.
• Bottom Navigation Bar: NOT visible (sub-page).
```

---

## Flow 10: Shared Invite Link Join (4 screens)

### Screen 10.1 — Invite Landing (Guest View)

```
[GLOBAL STYLE PREFIX]

NO bottom navigation (guest user, not logged in). Clean branded page.

Top section — Teal gradient banner (deep teal to teal, full-width):
- Pill badge at top: avatar circle + "Invitation by @sia_creates" in white text on dark teal pill
- Three circular member avatar thumbnails in a row (representing existing members)
- Cluster name: "Women Entrepreneurs" in large bold white text, centered
- **Purpose**: "A supportive space for female founders in Hyderabad to network, share resources, and grow together."
- Subtitle: "Shareable link: aggilo.com/c/women-founders" (under banner)

Below banner — White card with rounded top corners (overlapping banner):

Clio creature avatar (40px, **Resting mood**) with speech bubble:
  "I need to check a couple of things.
   Nothing you share here gets shown to anyone."

Section: "Quick Qualification" in bold.
- "Year of Birth" — dropdown selector labeled "Select Year" with chevron
- "Gender" — three pill buttons: Male (♂), Female (♀), Other (⚧)
- Small lock 🔒 note: "Verification is blind. Specific cluster criteria (Age/Gender) are never disclosed to maintain community integrity."

**Important: NO AGGIL criteria, parameter ranges, or cluster requirements are shown to the user.** The user simply provides their details and the system checks eligibility silently.

"Let's Go! →" teal full-width button at bottom.

**Clio Visibility**: Prominent. Clio creature avatar (40px) visible with speech bubble above the qualification form.

[CLIO]
• Visibility: Prominent (40px, above form).
• Mood: Resting.
• Speech: "I need to check a couple of things. Nothing you share here gets shown to anyone."
• Micro-animations:
  - User selects gender pill → M3 (Nod)
  - User taps "Let's Go!" → M2 (Processing) while qualification runs
• Exit: Fade-out on result.
• Bottom Navigation Bar: NOT visible (guest page).
```

### Screen 10.2 — Invite — Qualification Passed (Existing User)

```
[GLOBAL STYLE PREFIX]

Same page after submitting valid YOB + Gender. A green success banner at top:
- "✅ You qualify for this cluster!"

Below: Two paths:
Card 1: "Already on Aggilo?"
- Two toggle tabs: "📱 Phone" / "📧 Email"
- Phone: Phone number input + "Verify with OTP" button
- Email: Email input + "Verify with Code" button
- "I'll verify your identity and add you to this cluster."

Card 2: "New to Aggilo?"  
- "Create your free account" button (teal)
- "Takes less than 2 minutes"

Note: "Once verified, you'll be instantly added to Women Entrepreneurs @ WeWork Gachibowli."

**Clio Visibility**: Not present — this is a system verification screen.

[CLIO]
• Visibility: Not present.
• Bottom Navigation Bar: NOT visible (guest page).
```

### Screen 10.3 — Invite — Qualification Failed

```
[GLOBAL STYLE PREFIX]

Same invite page but after submitting non-matching details. A modal overlay with warm background:

Clio creature avatar (60px, **Resting mood** with slight head tilt — empathetic but not pitying).

Title: "Not this one."

Clio speech bubble:
  "This cluster has its own filters,
   and the match didn't land this time.
   I'm already looking at others for you."

**Important: The exact criteria (age range, gender restriction, location) are NOT revealed to the user.** The system only tells them it didn't match — not why or what the specific parameters are.

Two buttons:
- "Explore Other Clusters" (teal filled)
- "Create Your Own" (teal outlined)
- "Close" text link below

[CLIO]
• Visibility: Prominent (60px, empathetic head tilt).
• Mood: Empathetic (softened eyes, neutral mouth).
• Speech: "This cluster has its own filters, and the match didn't land this time. I'm already looking at others for you."
• Micro-animations:
  - User taps "Explore Other Clusters" → M4 (Success Flash) + mood shifts Empathetic → Curious
  - User taps "Create Your Own" → M3 (Nod) + mood shifts to Encouraging
• Exit: Fade-out on navigation.
• Bottom Navigation Bar: NOT visible.
```

### Screen 10.4 — Invite — New User Signup (Inline)

```
[GLOBAL STYLE PREFIX]

Signup form for new users coming from an invite link. Top: Aggilo logo.

Title: "Almost there."
Subtitle: "Create your Aggilo account to join this cluster."

Form fields:
1. "Choose a Nickname" — input with "@" prefix, placeholder "e.g. creative_mind"
2. "Phone or Email" — toggle tabs: "📱 Phone" (default, 🇮🇳 +91 picker) / "📧 Email" (email input)
3. "Date of Birth" — DD/MM/YYYY pickers (pre-filled from qualification step if provided)
4. "Gender" — pill selector (pre-filled from qualification step)

"Create Account & Join →" teal button.

Below: "By registering, you agree to Aggilo's Terms of Service and Privacy Policy."

Note: NO password field. NO real name field. OTP/Code will be sent on the next step.

**Clio Visibility**: Not present — this is a registration form.

[CLIO]
• Visibility: Not present.
• Bottom Navigation Bar: NOT visible (guest page).
```

---

## Flow 11: Report & Block (3 screens)

### Screen 11.1 — Report Content/Post

```
[GLOBAL STYLE PREFIX]

A bottom sheet modal. Title: "🚩 Report this post" with "✕" close.

"Why are you reporting this?" 

Radio button list:
- "Spam or misleading"
- "Harassment or bullying"
- "Hate speech"
- "Inappropriate content"
- "Violence or threats"
- "Other"

Below: "Additional details (optional)" — text area input.

"Submit Report" teal button. "Cancel" gray text.

Note: "Reports are reviewed by our moderation team within 24 hours. Your identity is kept confidential."

[CLIO]
• Visibility: Not present — moderation UIs are system-level.
• Bottom Navigation Bar: NOT visible.
```

### Screen 11.2 — Report User

```
[GLOBAL STYLE PREFIX]

Similar bottom sheet. Title: "🚩 Report @tech_nomad".

"Why are you reporting this user?"

Radio button list:
- "Fake profile"
- "Harassment"
- "Spam behavior"
- "Inappropriate content"
- "Impersonation"
- "Other"

Text area for details. "Submit Report" teal button. 

Note: "The reported user will not know who reported them."

> **Moderation model**: Reports are evaluated by our moderation system (AI-assisted review with human oversight). After evaluation, the reporter is notified of the outcome via in-app notification. Unblocking requires admin panel intervention — there is no self-service unblock for users.

[CLIO]
• Visibility: Not present on screen (evaluation happens in the background, asynchronously).
• Bottom Navigation Bar: NOT visible.
```

### Screen 11.3 — Block Request Submitted (Clio Evaluates)

```
[GLOBAL STYLE PREFIX]

A centered modal overlay (70% of screen height, bottom sheet style).

Clio avatar (40px, **Empathetic mood** — softened eyes, quiet presence) centered at top.

Title: "We've got this." (16px bold, deep navy)

Clio speech bubble:
  "We've received your report about @tech_nomad.
   Our team will review this carefully and let you know what we decide.
   For now, their activity is hidden from your view."

Dismiss button: "Back" (gray outlined, full-width) — taps close the overlay and return to the previous screen.

> **Interim state**: When a user submits a block request, @tech_nomad's posts are immediately hidden from the user's feed pending review. The reporter is notified of the outcome via in-app notification.
> **Report accepted**: "We reviewed this and took action. @tech_nomad will no longer reach you."
> **Report declined**: "We reviewed this carefully. We couldn't confirm a violation. If the behavior continues, report again — we'll look again."
> **Unblocking**: Requires admin panel intervention only. No self-service unblock. No "Blocked Users" list is shown to regular users in Settings.

---

## Flow 12: Welcome Tour Overlays (4 Clio-guided screens)

> **Tour approach**: Clio-guided contextual tooltip + spotlight highlight. Each step dims the background and spotlights one specific UI element with a tooltip card featuring **Clio's avatar and speech**. This is NOT a full-screen overlay but a contextual walkthrough narrated by Clio.

> **Arc beat mapping**: The 4 tour screens explicitly map to **Arc Beats 1–3** of Clio's 10-beat relationship arc. Beat 1 (First Contact) → Screen 12.1. Beat 2 (Curiosity Hook) → Screen 12.2. Beat 3 (Empathy) → Screen 12.3. Screen 12.4 is Clio's soft exit from the arc.
> The arc continues naturally through product use — the tour is the beginning, not the whole relationship.

### Screen 12.1 — Tour: Clio Welcome

```
[GLOBAL STYLE PREFIX]

Dashboard visible in background (dimmed). A centered modal card:
- Clio creature avatar (80px, **Resting mood** — soft oval eyes, steady gaze) at top center with gentle pulse animation
- Clio speech bubble below avatar:
  "This is home.
   Quick tour — takes a minute."
- "Show me →" teal button (this is the primary CTA; no Prev/Next buttons on slide 1)
- "Skip" gray text link

Dots at bottom: 1 of 4 (first dot teal, rest gray).

> **Arc Beat 1 — First Contact**: Clio introduces herself without asking for anything. "This is home." doesn't explain features — it anchors the user emotionally. She arrives before being invited.

> **Navigation rule**: Prev/Next buttons appear from **slide 2 onwards**. Slide 1 uses only "Show me →" and "Skip" for clarity.

> **Voice note**: No "I find connections others miss" — don't tell the user what you do, show them. The tour *is* the proof.

[CLIO]
• Visibility: Prominent (80px, centered modal).
• Mood: Resting (soft oval eyes, steady gaze, gentle pulse).
• Speech: "This is home. Quick tour — takes a minute."
• Arc Beat: 1 (First Contact).
• Micro-animations:
  - User taps "Show me" → M4 (Success Flash) + Resting → Curious transition
  - User taps "Skip" → M5 (Error Softening, subtle) + fade-out
• Exit: Transition to 12.2.
• Bottom Navigation Bar: VISIBLE (dimmed).
```

### Screen 12.2 — Tour Tooltip

```
[GLOBAL STYLE PREFIX]

Dashboard screen visible but dimmed (60% dark overlay).
A spotlight (glow effect) highlight on the **"Explore" tab** in the Bottom Navigation Bar.

Tooltip Card (pointing at the spotlight):
- White background, sharp corner pointer. 
- **Peach Clio** avatar on the left, **Curious mood**.
- Text: "This is where you browse. I've already sorted it for you."
- Button: "Next" (Teal).

> **Arc Beat 2 — Curiosity Hook**: "I've already sorted it for you" is specific and slightly surprising — she's been working before the user did anything. That's the hook.

**Bottom Navigation Bar**: Visible, with Explore tab spotlighted.

[CLIO]
• Visibility: Prominent (40px inline in tooltip).
• Mood: Curious (head tilt, eye asymmetry).
• Speech: "This is where you browse. I've already sorted it for you."
• Arc Beat: 2 (Curiosity Hook).
• Micro-animations:
  - User taps "Next" → M3 (Nod) + Curious → Happy transition
• Exit: Transition to 12.3.
• Bottom Navigation Bar: VISIBLE (Explore tab spotlighted).
```

### Screen 12.3 — Tour: Create Cluster

```
[GLOBAL STYLE PREFIX]

Dashboard visible. Spotlight highlight + teal border glow on the teal FAB "+" button (rest dimmed). White tooltip card with triangular pointer pointing at the FAB:

Clio avatar (40px) in top-left of tooltip card.
Clio speech:
  "If nothing fits — build your own.
   I'll be on every step."

> **Arc Beat 3 — Empathy**: "If nothing fits" names the fear before the user can. It says: *I know why you're still here looking.* "I'll be on every step" is a promise, not a feature. The fear of being alone in a new thing is named quietly and answered simply.

Dots: 3 of 4. Navigation: "Prev" and "Next Step →" buttons.
"Skip Tour" gray text link.

[CLIO]
• Visibility: Prominent (40px inline in tooltip).
• Mood: Encouraging (warm, forward-facing).
• Speech: "If nothing fits — build your own. I'll be on every step."
• Arc Beat: 3 (Empathy).
• Micro-animations:
  - User taps "Next Step" → M3 (Nod) + Encouraging → Happy transition
• Exit: Transition to 12.4.
• Bottom Navigation Bar: VISIBLE (dimmed).
```

### Screen 12.4 — Tour: Cluster Suggestions

```
[GLOBAL STYLE PREFIX]

Dashboard visible. Spotlight highlight + teal border glow on the "Cluster Suggestions" section (rest dimmed). White tooltip card with triangular pointer:

Clio avatar (40px) in top-left of tooltip card.
Clio speech:
  "These are clusters I think you'd actually fit in.
   I put the strongest ones first.
   Go. I'll be around."

"Let's go →" teal button (ending the tour).

> **Voice note**: "I'll be around" — not "I'll always be here if you need me!" The Bible says: *knowing when not to say something is the advanced version of this character*. Clio steps back.

Dots: 4 of 4.

[CLIO]
• Visibility: Prominent (40px inline in tooltip).
• Mood: Happy (inverted crescents, gentle smile — she's done her part).
• Speech: "These are clusters I think you'd actually fit in. I put the strongest ones first. Go. I'll be around."
• Micro-animations:
  - User taps "Let's go" → M4 (Success Flash) + Clio settles to Resting + tour overlay dismisses
• Exit: Fade-out. Clio transitions to Dashboard FAB (Peeping mode).
• Bottom Navigation Bar: VISIBLE (touring ends, nav fully active).
```

---

## 📋 Complete Screen Checklist

| # | Screen | Flow | Status |
|---|--------|------|--------|
| 0.1 | Clio-Narrated Walkthrough (4 slides) | Intro | REDESIGNED |
| 1.1 | Login / Signup (Phone + Email) | Auth | REDESIGNED |
| 1.2 | OTP / Code Verification | Auth | REDESIGNED |
| 1.3 | Returning User Login | Auth | NEW |
| 2.1 | DOB + Gender | Registration | NEW |
| 2.2 | Language Selection | Onboarding | REDESIGNED |
| 2.3 | Nickname + Purpose & Tags | Onboarding | REDESIGNED |
| 2.4 | Location Permission | Onboarding | NEW |
| 2.5 | Profile Created → Clio Welcome Transition | Onboarding | REDESIGNED |
| 2.6 | **Clio Welcome Conversation** | Onboarding | **NEW** |
| 3.1 | Dashboard (Clio-Powered Empty State) | Home | REDESIGNED |
| 3.2 | Dashboard Populated (+ Clio insight) | Home | REDESIGNED |
| 3.3 | AGGIL Tour Tooltip | Home | REDESIGNED |
| 4.1 | Explore Page (+ Clio insights) | Discovery | REDESIGNED |
| 4.2 | Location Filter | Discovery | MINOR FIX |
| 4.3 | Search Results (+ Clio recommendations) | Discovery | REDESIGNED |
| 4.4 | No Results → Clio Encouragement | Discovery | REDESIGNED |
| 4.5 | AGGIL Filter Panel | Discovery | MINOR FIX |
| 5.1 | Create — Purpose (+ Chat with Clio) | Creation | REDESIGNED |
| 5.2 | Create — AGGIL Params (+ Chat with Clio) | Creation | REDESIGNED |
| 5.3 | Create — About (+ Chat with Clio) | Creation | REDESIGNED |
| 5.4 | Create — Review (+ Clio) | Creation | REDESIGNED |
| 5.5 | Cluster Created (+ Clio celebrate) | Creation | REDESIGNED |
| 6.1 | Cluster Timeline (+ Clio summary) | In-Cluster | REDESIGNED |
| 6.2 | [DELETED] Cluster Chat | In-Cluster | - |
| 6.3 | Cluster Members (+ shared tags) | In-Cluster | REDESIGNED |
| 6.4 | Cluster Media | In-Cluster | NEW |
| 6.5 | Post Composer | In-Cluster | REDESIGNED |
| 6.6 | Cluster Info Sheet | In-Cluster | NEW |
| 6.7 | Share Cluster | In-Cluster | MINOR FIX |
| 7.1 | DM List (+ read/unread styling) | Messaging | NEW |
| 7.2 | DM Chat | Messaging | REDESIGNED |
| 8.1 | My Profile | Profile | REDESIGNED |
| 8.2 | Interests Tab | Profile | REDESIGNED |
| 8.3 | Other User Profile | Profile | REDESIGNED |
| 9.1 | Settings Main (+ Clio preferences) | Settings | REDESIGNED |
| 9.2 | Notification Settings | Settings | NEW |
| 10.1 | Invite Landing | Invite | REDESIGNED |
| 10.2 | Invite — Qualified | Invite | NEW |
| 10.3 | Invite — Failed | Invite | REDESIGNED |
| 10.4 | Invite — Signup | Invite | REDESIGNED |
| 11.1 | Report Post | Moderation | NEW |
| 11.2 | Report User | Moderation | NEW |
| 11.3 | Block User | Moderation | NEW |
| 12.1 | Tour: Clio Welcome | Onboarding | REDESIGNED |
| 12.2 | Tour: Explore Tab (Clio-guided) | Onboarding | REDESIGNED |
| 12.3 | Tour: Create (Clio-guided) | Onboarding | REDESIGNED |
| 12.4 | Tour: Suggestions (Clio-guided) | Onboarding | REDESIGNED |

**Total: 47 screens** (14 NEW, 30 REDESIGNED, 3 MINOR FIX)

---

## 🎯 Cluster Score Rules (Summary for Reference)

| Factor | Weight | 100% Score | 0% Score |
|--------|--------|------------|----------|
| Purpose & Vibrant Tags | **25%** | Clear purpose + 3+ specific tags | Vague/no purpose or tags |
| Location Precision | **20%** | GPS Restricted / Landmark (<1km) | Global / Broad Region |
| Age Range Width | **20%** | Narrow precise range (same year) | 50+ year span |
| Name & Description Quality | **15%** | Specific name + full description | Generic name / no description |
| Estimated Audience Size | **20%** | Optimal segment size (not too wide, not too narrow) | Extreme ends (hyper-niche or global) |

> ⚠️ **Source of truth**: These weights are defined in `AGGILO_PLATFORM_RULES.md §Cluster Score`. Do not maintain a separate live copy — reference the rules file directly.

**Rules:**
- Maximum possible score: 100 (all factors at maximum)
- Score is **visible during creation** (Live Precision Score card with animated count-up number + progress bar)
- Score **visible to founder** on Cluster Info sheet (with "Only you can see this" note)
- Score is **NOT visible** on cluster cards in Explore/Search/Dashboard — it is used internally for ranking and suggestions
- Higher-scored clusters rank higher in search results and suggestions
- Tip shown during creation: "💡 Higher precision score = the better Clio can match and serve you."
- Score displayed with color coding: 🔴 0-40 | 🟡 40-70 | 🟢 70-100
- Scores ≥80 get a 🔥 flame icon **only in the creation wizard** Live Precision Score display and Founder-only Cluster Info sheet — never on cluster cards
- Score number animates (count up/down) when parameters change during creation

**Global Rule — Age Self-Inclusion:**
- Creators MUST include their own age in the cluster's age range
- The age slider defaults to the creator's own birth year
- Users cannot see, search, or join clusters outside their age range
- **Geography Restriction**: Only clusters marked as "GPS Restricted" enforce a join gate based on current location. Multi-city or Broad clusters do not restrict joining based on location (though they use it for scoring).
- Shared invite links enforce age/gender verification, and GPS location if the cluster is Hyperlocal-restricted.
