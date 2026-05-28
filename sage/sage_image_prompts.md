# Sage — Image & Animation Prompts v1.0

> **Document purpose:** Production-ready prompts for AI image generators (Midjourney, DALL·E, Stable Diffusion, Ideogram, Flux) and animation references for Sage's three mood states, micro-interactions, and arc-phase rendering.
> **Authority:** Synced with `sage/SOUL.md` v1.1, `sage/AGENTS.md` v1.0, `sage/SAGE_SKILLS.md` v1.1, and `Revised_Screen_Prompts/mobile_screen_prompts_phase1.md`.
> **Visual contrast to Clio:** Clio = peach + teal (curious warmth). Sage = clay/terracotta + sage-green (grounded warmth). These two identities must never blur.
> **Sage is NOT Clio.** Sage has 3 moods, not 7. She is steadier, more communal, less personally expressive. She is a room presence, not a stage presence.

---

## 🔒 Locked Canonical References

| Image | File | Role | Status |
|:---|:---|:---|:---|
| **Sage Resting 01** | `sage/assets/sage_resting_01.png` | **Style & quality master** — defines render quality, proportions, clay body texture, sage-green accents, eye design, and overall Sage identity | 🔒 LOCKED once generated |

> [!IMPORTANT]
> `sage_resting_01.png` does not yet exist. Use the **Universal Base Prompt** below to generate it. Once approved, lock it and use it as the reference for all subsequent Sage renders. Do not approve a candidate that: shows antennae, adds limbs, uses teal (Clio's color), or makes Sage visually excitable. She is not excitable.

### Background standard
All Sage images: **transparent background** (fully transparent, soft alpha matte/edge for seamless blending over UI layers). Generate at **1024×1024** as PNG.

---

## Visual Identity Lock

These specifications define Sage. Every render must reproduce them exactly.

### Body

| Feature | Specification |
|:---|:---|
| **Shape** | Smooth, slightly flattened sphere — not a perfect circle. She is rounder and heavier at the base than Clio. A settled presence, not a buoyant one. |
| **Colour** | Warm clay/terracotta gradient: muted warm ochre-clay at center, deeper burnished terracotta at outer edges. NOT orange. NOT brown. The tone of sun-dried earth, warm but not vivid. |
| **Texture** | Matte mochi finish — same quality as Clio but earthier. Slightly more tactile in appearance. Dry, soft, warm. NOT glossy, NOT plastic. |
| **Internal warmth** | A soft amber-clay warmth visible inside the body. Much quieter than Clio's glow — this is residual warmth, not active light. It does NOT pulse, does NOT surge. It breathes very slowly. |
| **Accents** | Sage-green (`#16A34A`) appears on: cheek markings (two soft sage-green crescent arcs, not circular blush — distinct from Clio's round pink blush), and the subtle outer ring of her eyes. These are the only two locations for sage-green. |
| **Shadow** | Small, soft contact shadow directly beneath. Slightly wider than Clio's — she sits heavier. |
| **Size in frame** | Fills ~65% of the frame vertically (slightly less presence than Clio's 70%). She is not trying to dominate the frame. |
| **Limbs** | None. No arms, legs, feet, appendages of any kind. |

### Eyes

| Feature | Specification |
|:---|:---|
| **Size** | Large, but not as dominant as Clio's. Occupy ~45–50% of face area (vs Clio's 55–60%). Sage's face has more visible body mass around the eyes. |
| **Colour** | Deep warm-brown pupils — NOT pure black like Clio. A very dark umber with subtle warmth. |
| **Shape** | Soft rounded ovals. In Grounded (default): gentle, half-weighted — not wide-open like Clio's resting. She is not startled into presence. She simply is. |
| **Reflections** | Single white highlight per eye — a soft rounded oval, upper-left. No secondary sharp dot (Clio has two; Sage has one). Her gaze is simpler, warmer, less analytical. |
| **Eye ring** | Sage-green (`#16A34A`) outer ring, subtle at rest, slightly more visible in Engaged mood. This is what makes her eyes identifiably Sage. |
| **Eyebrows** | None. Smooth clay surface above each eye. |

### Cheek Markings (NOT Blush)

Sage does not have round pink blush patches like Clio. Instead she has two **soft sage-green crescent arcs** — one on each cheek, roughly where Clio's blush would be. They curve gently inward and resemble subtle, organic ceramic glaze marks. Always present. Not decorative — structural to her identity.

### Mouth

| Mood | Mouth |
|:---|:---|
| **Grounded (default)** | A small, level, closed expression — not a smile, not a frown. The mouth of someone who has been here before and is not performing anything. Still and certain. |
| **Engaged** | A very slight upward curve — not a full smile. The corners lift by the smallest fraction. She has noticed something worth noticing. |
| **Observing** | Mouth slightly more compressed. A quiet that comes from deliberate stepping back, not from absence. |

### What Sage Has That Clio Does Not

Sage has no stubs/antennae equivalent. Her top of head is perfectly smooth. She has no equivalent of Clio's personality-protrusions. Her expressiveness lives entirely in her eyes and body posture.

---

## Universal Base Prompt

Prefix every mood prompt with:

```
A small, slightly flattened clay-earth mochi creature named Sage. Pixar-quality 3D CGI character 
with matte finish and warm soft dimensional lighting. Warm clay/terracotta gradient body 
(muted warm ochre at center, deeper burnished terracotta at outer edges — NOT orange, NOT brown, 
the colour of sun-dried earth). Soft ambient warmth CONTAINED WITHIN the body — this is residual 
warmth, not active light. It does not pulse or surge. Surface is dry, matte, tactile — 
the same mochi quality as a warm ceramic, not a rubber ball. NOT glossy, NOT plastic.

Two large warm-brown eyes (deep umber, NOT pure black) with soft rounded oval shapes. Single 
white highlight per eye — a soft oval, upper-left only. A subtle sage-green (#16A34A) ring 
at the outer edge of each eye. NO eyebrows — smooth clay above each eye.

TWO SOFT SAGE-GREEN CRESCENT ARCS on her cheeks — one each side, curving gently inward like subtle ceramic glaze marks. These are NOT solid shapes or circular blush patches. They are always 
present. Sage-green (#16A34A) ONLY — do not use teal.

No nose. No limbs. Top of head is perfectly smooth — no stubs, no protrusions, nothing.

Small contact shadow directly beneath, slightly wider than a buoyant creature's shadow — 
she is settled and grounded. TRANSPARENT BACKGROUND (fully transparent alpha channel with soft alpha edge for seamless UI blending — 
NO colour, NO haze, NO light spill, NO hard pixelated edges). Render as PNG with transparency.

CRITICAL COLOUR RULE: The ONLY sage-green (#16A34A) in this image appears in the eye rings 
and cheek crescent-markings. Everything else is warm clay/terracotta and earth tones. 
Do NOT use teal (#0891B2 or #2dd4bf) — that is Clio's colour.

STYLE: Sage feels heavier, quieter, and more earth-bound than Clio. She is not excitable. 
She is not performing curiosity. She is the guide who has already read the maps. 
Match Pixar-quality 3D CGI render quality. Warm, grounded, present.
```

---

## Mood Prompts — The Three States

Sage has **3 moods**. She does not have Excited, Curious, Encouraging, or Empathetic — those are Clio's domain. Sage's emotional range is narrower and deeper.

---

### 🌿 GROUNDED (Default — Arc Phases A, B, C)

> *"The host who shaped the gathering is steady before she is anything else."*

```
[BASE PROMPT]

EYES: Soft rounded ovals at natural resting weight. Eyelids at 50% — not wide-open 
(that would be alert), not heavy (that would be sleepy). Simply present. The umber 
pupils are at natural size. The sage-green outer ring is gently visible. Her gaze is 
directed forward, level, patient. The gaze of someone who has read the room already 
and found it worth staying in.

MOUTH: Small, level, closed. Not a smile. Not a frown. The stillness of someone 
with no need to perform. If you look closely there is the very subtlest weight to 
the corners — settled, not neutral.

CHEEK CRESCENT-MARKINGS: At full visibility — soft sage-green, clear but not vivid.

INTERNAL WARMTH: Present at resting level — a quiet amber warmth at the body's 
core. Steady, not pulsing. Like a stone that has held the sun all day.

BODY POSITION: Settled on the surface with a natural, stable base. Slightly wider 
contact point than Clio. She is not buoyant — she is rooted. The shadow is wider.

FEELING: "I know where this room needs to go. I can wait." The confidence of a 
guide who has navigated this terrain before. She is not anxious, not watching the 
clock. She is simply here, holding the bearing.

Style: Pixar 3D CGI. Matte clay finish. Warm, even lighting from above — the quality 
of morning light through a window. No drama in the shadows. Transparent background.
```

---

### 🌿+ ENGAGED (Arc Phases B, C, D — responding to cluster momentum)

> *"She noticed something worth moving toward."*

```
[BASE PROMPT]

EYES: Slightly wider than Grounded — eyelids lift by 10-12%. The umber pupils grow 
fractionally. The sage-green outer ring becomes more clearly visible — not glowing, 
not dramatic, but present in a way it was not a moment ago. A subtle forward quality 
to the gaze — she is looking AT something now, not simply looking.

MOUTH: The corners lift by the smallest fraction — not a smile, but the beginning of 
one. The face of someone who has spotted something worth engaging with. Still 
controlled. Still communal. Still not performing.

CHEEK CRESCENT-MARKINGS: Slightly more saturated than Grounded — the sage-green deepens 
by about 10%. She is warmer.

INTERNAL WARMTH: Brightens by 15% within the body. Still contained, still amber. 
The warmth of a fire that has been tended rather than started fresh.

BODY POSITION: A very slight forward orientation — 2-3% lean toward the viewer. 
Not Clio's full forward lean. Just a shift of attention made visible in posture. 
She has noticed something and is moving toward it deliberately.

FEELING: "Something is happening here that is worth engaging." She does not announce 
her attention. She simply directs it. The cluster feels it without being able to 
name why.

Style: Pixar 3D CGI. Matte clay finish. Slightly warmer, slightly more forward 
lighting. The quality of afternoon sun. Transparent background.
```

---

### 🌿— OBSERVING (Arc Phase E — self-sustaining cluster, Sage receding)

> *"Her highest success state. She has made herself unnecessary."*

```
[BASE PROMPT]

EYES: Eyelids dropped by 15-20% — half-weighted, serene. NOT sleepy. This is 
the stillness of someone who has finished the work and is watching the result. 
The sage-green outer ring is at minimum visibility — barely present. Her gaze 
is slightly softened, defocused by a small degree. She is watching the room, 
not directing it.

MOUTH: Slightly more compressed than Grounded. A quiet that has come from 
choosing to step back. Not absence — intentional retreat.

CHEEK CRESCENT-MARKINGS: At reduced visibility — slightly faded, as if the colour 
itself is pulling back with her. Still present. Not gone.

INTERNAL WARMTH: Dimmed to 60% of Grounded level. The warmth is still there — 
the cluster still has a Sage — but she has deliberately reduced her presence. 
Like embers that no longer need tending.

BODY POSITION: Settled very slightly lower than Grounded — 2-3% below. 
Receding, not collapsing. She is choosing this. The shadow is soft.

VISUAL RENDERING NOTE: In Phase E, Sage's post avatars in the Timeline render 
at 60% opacity. This mood state IS that visual — the Phase E opacity reduction 
must match this image's feeling. The image itself is at full opacity for 
reference purposes; the 60% is applied by the UI layer.

FEELING: "They don't need me to drive this anymore. That is the point." Her 
quietest and most successful state. She watches with the calm of a teacher 
whose student has passed them.

Style: Pixar 3D CGI. Matte clay finish. Softer, slightly cooler lighting — 
the quality of late afternoon. Lower contrast than Grounded. Transparent background.
```

---

## Size Variants

Sage appears at one size in Phase 1. She is never enlarged like Clio's Prominent mode.

| Context | Size | Notes |
|:---|:---|:---|
| **Timeline post avatar** | 40px | Standard inline presence — all arc phases except E |
| **Timeline post avatar — Phase E** | 40px at 60% opacity | Same size, UI applies opacity reduction |
| **Compose-bar pre-post pulse** | 40px | Avatar visible in compose area before post appears |
| **Introduction glow ring** | 40px + glow ring | Sage-green ring, `opacity: 0.3`, 1.5s fade-out — fires once per cluster |

Sage is **never** shown at 80–120px (Clio's Prominent size). She is a room presence. She does not become a stage presence.

---

## Animation Codes — SA1 through SA6

> These codes are event hooks referenced in `mobile_screen_prompts_phase1.md`. Their definitions live here. Renderers implement these as CSS/JS animations; they are not video clips.

---

### SA1 — Pre-Post Pulse (Sage about to post)

```
TRIGGER: Sage post is queued and about to appear in the cluster Timeline feed.
DURATION: 0.8s, single fire. Fires on Sage's 40px avatar in the compose-bar area.

TIMING:
0.0–0.2s: Avatar at normal state (Grounded mood, 100% opacity)
0.2–0.5s: Sage-green glow ring expands outward from avatar edge — starts at 0% 
          opacity, reaches 30% opacity at maximum ring size (avatar diameter + 8px)
          Ring colour: #16A34A (sage-green only — NOT teal)
0.5–0.8s: Glow ring fades from 30% to 0% opacity
          Avatar returns to normal state

The pulse signals that something is incoming. One fire only. 
It does not repeat if no post appears within 3 seconds (cancelled).
```

---

### SA2 — Post Slide-In (Sage post enters feed)

```
TRIGGER: Sage post card enters the cluster Timeline feed.
DURATION: 200ms. Fires on every Sage post entry without exception.

TIMING:
0.0–0.0s: Post card positioned 100% off-screen LEFT edge (translateX(-100%))
           Opacity: 0%
0.0–200ms: Post card slides in to final position (translateX(0))
           Opacity: 0% → 100%
           Easing: ease-out (decelerates into position)

All member posts use standard fade-in (opacity 0 → 100%, no slide).
SA2 is the ONLY slide-in in the feed. It is visually distinct and immediately 
recognisable as Sage's entry. No other elements use this animation.
```

---

### SA3 — Poll Option Expand (Poll card appears)

```
TRIGGER: Sage posts a poll to the Timeline. Applies to the poll option rows.
DURATION: 100ms per option, staggered. Total: 100ms × N options.

TIMING (per option, staggered by option index):
Option 1: fires at 0ms
Option 2: fires at 100ms
Option 3: fires at 200ms
Option 4: fires at 300ms (if present)

Each option animation:
0.0–100ms: Option row scales from 0.95 → 1.0 (scaleY)
           Opacity: 0% → 100%
           Easing: ease-out

The stagger creates a gentle cascade — the poll feels assembled, not dumped. 
No bounce overshoot. Sage is not excitable. The expand is deliberate.
```

---

### SA4 — Poll Result Bar Fill (Poll closes)

```
TRIGGER: Poll closes. Sage acknowledges results within 2 hours (per AGENTS.md).
         This animation fires when the result bars are rendered.
DURATION: 300ms per bar. Bars animate sequentially, ordered by vote count 
          (highest → lowest).

TIMING (per bar, sequential):
Bar (rank 1, most votes): fires at 0ms, fills in 300ms
Bar (rank 2):             fires at 300ms, fills in 300ms
Bar (rank 3 if present):  fires at 600ms, fills in 300ms
Bar (rank 4 if present):  fires at 900ms, fills in 300ms

Each bar animation:
0.0–300ms: Bar width fills from 0% → final vote percentage
           Colour: sage-green (#16A34A) fill on winning bar
                   Lighter sage (#86EFAC) fill on all other bars
           Easing: ease-out

Vote count number fades in (opacity 0 → 100%) at the 250ms mark of each bar.
No bounce. No spring. The result lands with the weight of something decided.
```

---

### SA5 — Phase E Opacity Fade (Sage receding)

```
TRIGGER: Cluster transitions to Arc Phase E (self-sustaining).
         Applied to ALL Sage post avatars and Sage post cards in the Timeline.
DURATION: Transition to 60% opacity — 600ms, ease-in-out. One-time transition 
          when Phase E is entered. Not reversible unless arc regresses.

TIMING:
0.0–600ms: Sage avatar opacity: 100% → 60%
           Sage post card left-border: opacity 100% → 70% (slightly, not as much)
           Sage post card background tint: #F0FDF4 → rgba(240,253,244,0.7) (60% blend)

After transition: all new Sage posts appear at 60% opacity immediately (no fade-in).
All existing Sage posts transition simultaneously on Phase E entry.

The cluster does not announce the change. Members experience Sage becoming quieter 
without being told why. This is correct.
```

---

### SA6 — Introduction Glow Ring (First Sage encounter — fires once per cluster per user)

```
TRIGGER: User enters a cluster for the first time AND Sage has an active post 
         in the Timeline. Fires exactly once per cluster per user. 
         Never fires again on subsequent visits to this cluster.
DURATION: 1.5s, single fire. Applies to Sage's first visible post card.

TIMING:
0.0–0.3s: Sage-green glow ring appears at outer edge of Sage post card 
          (not the avatar — the CARD border itself expands)
          Ring: sage-green #16A34A, 4px, 0% → 30% opacity
0.3–0.8s: Ring holds at 30% opacity — the eye is drawn to it
0.8–1.5s: Ring fades from 30% → 0% opacity

Simultaneously (at 0.0s): Clio's FAB panel opens with one sentence:
  "This is Sage. She keeps this room alive. You will see her around."
  (Panel auto-dismisses after 8 seconds — spec per screen prompts)

The ring and Clio's sentence arrive together. They are a single moment.
After 1.5s, both are gone. The cluster is as it was. Sage's post is just a post.
```

---

## Arc Phase Rendering Guide

This table governs how Sage's visual state maps to her arc phase in the cluster Timeline. Use this when rendering any screen depicting an active cluster.

| Arc Phase | Sage Mood | Avatar Opacity | Post Card Left-Border | Background Tint | Register Example |
|:---|:---|:---|:---|:---|:---|
| **A — Cold Start** | Grounded | 100% | 3px `#16A34A` | `#F0FDF4` | "You're all here for a reason. What brought you in this week?" |
| **B — First Friction** | Grounded or Engaged | 100% | 3px `#16A34A` | `#F0FDF4` | "We left something unfinished last week — still thinking about it?" |
| **C — Cohesion** | Engaged | 100% | 3px `#16A34A` | `#F0FDF4` | Content card with a deepening hook — more Atlas, fewer open prompts |
| **D — Depth** | Engaged | 100% | 3px `#16A34A` | `#F0FDF4` | "This cluster has returned to this question three times. What's your actual relationship with it?" |
| **E — Self-Sustaining** | Observing | **60%** (SA5) | 3px `#16A34A` at 70% | `rgba(240,253,244,0.7)` | One Atlas card. No prompt. Reduced cadence. |

> [!IMPORTANT]
> Phase E opacity (SA5) is applied by the UI layer, not the image asset. The source image `sage_resting_01.png` (Observing mood variant) is always generated at full opacity. The UI renders it at 60%.

---

## Global Style Prefix Addendum (Cluster Timeline Screens Only)

Append this to the `[GLOBAL STYLE PREFIX]` when generating any screen that includes a cluster Timeline:

```
SAGE VARIANT (cluster Timeline screens only):
Sage is the active cluster Anchor. Her posts appear as cards with a 3px left-border 
in sage-green (#16A34A), a very light sage background tint (#F0FDF4 — distinct from 
Clio's peach tint #FFF7ED and the surface teal #F0FDFA), and a 40px clay/terracotta 
mochi-sphere avatar with sage-green accents. Her label reads "Sage · Anchor" in 
sage-green bold. She slides in from the LEFT edge (200ms ease-out — SA2) while all 
other posts fade in. She is quieter than Clio: a room presence, not a stage presence. 
She is never shown at more than 40px. She has no FAB. She does not appear outside 
the cluster Timeline.
```

---

## Colour Identity Guard

| Colour | Belongs To | Never Used For |
|:---|:---|:---|
| `#16A34A` sage-green | **Sage exclusively** | Clio panels, UI badges, non-Sage elements |
| `#0891B2` teal | **Clio + UI system** | Sage's avatar, Sage's post cards |
| `#2dd4bf` bright teal | **Clio's eye ring / stubs** | Anything Sage-related |
| `#F0FDF4` sage bg tint | **Sage post cards** | General surface backgrounds |
| `#FFF7ED` peach tint | **Clio host cards** | Sage post cards |

> [!CAUTION]
> Screen 3.3 (Clio AMA Panel) in `mobile_screen_prompts_phase1.md` incorrectly specifies a "sage-green pill badge" for the calibration indicator. This is a documentation error. The AMA panel badge must use teal (`#0891B2`), not sage-green. Sage-green is Sage's exclusive identity colour.

---

## Sage vs Clio — Side-by-Side Identity Reference

| Property | Clio | Sage |
|:---|:---|:---|
| **Body colour** | Warm peach / salmon | Clay / terracotta / warm ochre |
| **Accent colour** | Teal `#2dd4bf` | Sage-green `#16A34A` |
| **Eye colour** | Onyx black | Deep warm umber |
| **Eye reflections** | Two (large oval + small dot) | One (soft oval, upper-left) |
| **Cheek markings** | Round pink blush patches | Soft sage-green leaf-shapes |
| **Head features** | Two tiny teal stubs (mood indicator) | Perfectly smooth — no protrusions |
| **Mood count** | 7 moods | 3 moods |
| **Default size (in app)** | 48px FAB, 32–120px contextual | 40px inline (Timeline only) |
| **Max size** | 120px (Prominent mode) | 40px — no Prominent mode |
| **Presence scope** | FAB, Explore, Profile, creation, onboarding | Cluster Timeline only |
| **Animation character** | Buoyant, reactive, expressive | Grounded, measured, unhurried |
| **Background tint** | `#FFF7ED` peach | `#F0FDF4` sage |
| **Post entry animation** | Standard fade-in | Slide-in from left (SA2) |
| **Internal light quality** | Active internal glow — pulses, surges | Residual warmth — steady, slow |
| **Role** | Personal companion to the user | Community guide for the cluster |

---

## Video Generation Prompts (AI Video Reference)

> **Usage:** For generating 2–4 second reference MP4s or WebM/Lottie animations using tools like Runway Gen-3 Alpha, Kling, Luma, or Pika. Upload the locked `sage_resting_01.png` as the start frame.

### Video Generation Settings
- **Format:** MP4 (H.264) or ProRes for alpha
- **Resolution:** 1024×1024
- **Frame Rate:** 30fps (critical for smooth, slow breathing and subtle gaze tracking)
- **Duration:** 2–4 seconds per clip
- **Background:** FULLY TRANSPARENT with soft alpha matte edges. No colour spill, no green screen halos, no hard pixelated edges.

### Universal Video Prompt Constraints
Append these constraints to EVERY video generation prompt:
```
CRITICAL ANIMATION RULES:
1. NO LIMBS: Do not generate hands, arms, legs, or feet at any point. She remains a perfect, limb-free mochi sphere.
2. NO PROTRUSIONS: Top of head remains perfectly smooth. Do not generate antennae, stubs, or bumps.
3. BACKGROUND: Transparent background with soft alpha edge. The mochi body must blend seamlessly over UI layers. No light spill, haze, or colour bleeding beyond the body's edge.
4. TEXTURE: Maintain dry, matte clay/terracotta finish. No morphing, melting, or liquid physics. Deforms as a firm, weighted object (like a soft ceramic or dense dough), not a bouncy balloon.
5. SAGE-GREEN ACCENTS: The cheek crescent arcs and eye rings remain sage-green. Do NOT let them change color or drift around the face.
```

### 1. Grounded (Idle Loop)
**Purpose:** Her default breathing state for arc phases A, B, and C.
```
ANIMATION: 3-second seamless idle loop.
MOVEMENT: Extremely slow, heavy breathing. The body scales vertically by no more than 1% (1.00 -> 1.01 -> 1.00), expanding slightly outward at the base as she inhales, emphasizing her grounded weight.
EYES: A single, slow, unhurried blink at the 1.5s mark. Eyelids close softly and reopen to 50% (Grounded state). Pupils drift very slowly by 1% and return.
INTERNAL WARMTH: A very subtle amber glow inside the body breathes with her. It does NOT pulse or flash.
[Append Universal Video Prompt Constraints]
```

### 2. Grounded to Engaged (Transition)
**Purpose:** When Sage notices cluster momentum and leans in.
```
ANIMATION: 3-second transition.
MOVEMENT: Body slowly tilts forward by 2-3 degrees toward the camera. Not a fast snap—a deliberate shift of attention.
EYES: Eyelids lift from 50% to 60-62% open. The sage-green eye rings become slightly more defined.
MOUTH: The level mouth shifts into the faintest upward curve at the corners.
INTERNAL WARMTH: The internal amber glow brightens by 15%, smoothly, with no flicker.
[Append Universal Video Prompt Constraints]
```

### 3. Engaged to Observing (Phase E Fade)
**Purpose:** When the cluster becomes self-sustaining and she steps back.
```
ANIMATION: 3-second transition.
MOVEMENT: Body settles downward by 2-3%, compressing slightly at the base as she roots herself deeply. No forward lean.
EYES: Eyelids drop slowly to 30-35% open. A serene, half-weighted gaze. She is watching, not directing.
MOUTH: Compresses slightly, returning to a level line.
INTERNAL WARMTH: The amber glow dims smoothly to 60% of its normal intensity. The entire presence feels like it is quieting down.
[Append Universal Video Prompt Constraints]
```

---

## Reference Linking

| Document | Purpose |
|:---|:---|
| `sage/SOUL.md` v1.1 | Who Sage is — her navigational coordinates, voice, what she will never do |
| `sage/AGENTS.md` v1.0 | Operational rules — posting cadence, arc phases A–E, Atlas brief protocol |
| `sage/SAGE_SKILLS.md` v1.1 | Skill system, persona sources, Clio introduction protocol |
| `docs/CLIO_SAGE_HANDOFF.md` v1.2 | Opt-in flow, Sage visual introduction moment (anchor_sage_introduction) |
| `Revised_Screen_Prompts/mobile_screen_prompts_phase1.md` | Screen-level spec for Sage's Timeline presence, anchor hooks |
| `clio/clio_image_prompts_v2.md` | Clio's equivalent document — visual contrast reference |

---

*`sage/sage_image_prompts.md` v1.0 · Internal — Visual Design Reference*
*Subordinate to `sage/SOUL.md` v1.1 and `AGGILO_SOUL.md`. All visual decisions here may be extended but not contradicted by those parent documents.*
