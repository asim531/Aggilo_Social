# Clio — Definitive Image Generation Prompts v2

> **Reference note (V3):** Retained per V3 audit (Q5). These image prompts have not been rendered into final canonical stills beyond the existing `resting01.png` / `resting02.png`. Kept for further analysis and asset generation rounds.

> **Document purpose:** Production-ready prompts for AI image generators (Midjourney, DALL·E, Stable Diffusion, Ideogram, Flux, etc.)  
> **Key correction:** Clio has **short blunt stubs** — NOT antennae. They are tiny, almost flush with the head at rest, and extend only slightly during excitement or surprise.  
> **Background:** ALL images must have a **transparent background** (alpha channel / PNG with transparency).  
> **Size:** Generate at **1024×1024** (1:1 square). Upscale to 2048×2048 for hero assets if needed.

---

## 🔒 Locked Canonical References

**These two images are the definitive visual standard. ALL generated images and animations MUST match them.**

| Image | File | Role | Status |
|:---|:---|:---|:---|
| **Resting 01** | `clio/assets/source/resting01.png` | **Style & quality master** — defines render quality, lighting, proportions, eye design, smile, skin texture, and overall Clio identity | 🔒 LOCKED |
| **Resting 02** | `clio/assets/source/resting02.png` | **Stub reference master** — defines the stub design (tiny teal rounded bumps barely peeking from head surface). Also shows transparent background standard | 🔒 LOCKED |

### Readiness Assessment

| Criteria | Resting 01 | Resting 02 |
|:---|:---|:---|
| Render quality | ✅ Excellent — Pixar-quality 3D CGI | ✅ Excellent — matches resting01 |
| Eye design | ✅ Onyx-black, asymmetric reflections, correct proportions | ✅ Consistent with resting01 |
| Signature smile | ✅ Small knowing smile clearly visible | ✅ Matching smile |
| Blush | ✅ Subtle pink patches at cheek level | ✅ Present (slightly less visible) |
| No eyebrows | ✅ Clean smooth area above eyes | ✅ Clean |
| No nose / no limbs | ✅ | ✅ |
| Stubs | ✅ Completely hidden (correct for resting) | ✅ Tiny rounded teal bumps barely peeking out — **this is the stub reference** |
| Background | ⚠️ White background — **run through remove.bg before use as animation reference** | ✅ Transparent background — ready as-is |
| Internal glow (within body) | ✅ Warm peach glow at base | ✅ Warm glow visible |
| **Overall** | **✅ READY** (remove bg first) | **✅ READY** |

> [!IMPORTANT]
> **`resting01.png` has a white background** that must be removed (via remove.bg or equivalent) before using it as an animation start-image reference. `resting02.png` already has a transparent background and is ready to use immediately.

### Resting 02 — Stub Detail (Critical for Animation)

> [!CAUTION]
> The two tiny teal bumps visible on top of `resting02.png` are **SHORT BLUNT STUBS** — NOT antennae. When uploading resting02 as a reference image to any AI generator, explicitly state in the prompt:  
> *"The two small teal bumps on top of the head are short blunt stubs, NOT antennae. They must remain very short at all times — they only extend slightly during excitement or surprise, never becoming tall or insect-like."*

### Animation Start-Image Mapping

When generating animations, upload these locked images as the **Start Image** (and optionally End Image):

| Animation | Start Image | End Image | Notes |
|:---|:---|:---|:---|
| **Hello greeting** | `resting01.png` (bg removed) | Same (loop) | Head smooth, no stubs |
| **Resting idle loop** | `resting01.png` (bg removed) | Same (seamless loop) | Stubs hidden |
| **Resting → Happy** | `resting01.png` (bg removed) | Generated happy image | Stubs hidden throughout |
| **Resting → Curious** | `resting02.png` | Generated curious image | Stubs grow from bumps to short cylinders |
| **Resting → Surprise** | `resting01.png` (bg removed) | Generated curious image | Stubs pop out during jolt |
| **Curious → Excited** | Generated curious image | Generated excited image | Stubs extend, tips glow |
| **Any → Resting** | Current state image | `resting01.png` (bg removed) | Return to baseline |

---

## 🎬 Animation Reference Videos (2–4 Second MP4s)

> [!TIP]
> **Yes — 2-4 second animation clips are extremely valuable.** Generate one per emotion transition and one per idle loop.

### Recommended Animation Set

| # | Animation | Duration | Purpose |
|:---|:---|:---|:---|
| 1 | **Resting idle loop** | 3s (seamless loop) | Breathing, subtle blink — the "she's alive" baseline |
| 2 | **Resting → Happy** | 3s | Eyes crescent, smile widens, glow warms, settles down |
| 3 | **Resting → Curious** | 2.5s | Head tilts, stubs emerge to half-height, eye asymmetry |
| 4 | **Resting → Surprise** | 2s | Jolt up, stubs pop out, wide eyes, settles into curious |
| 5 | **Curious → Excited** | 3s | Stubs extend to max with glow, eyes widen, mouth opens, lifts up |
| 6 | **Happy idle loop** | 3s (loop) | Settled, warm breathing, smiling eyes — no stubs |
| 7 | **Excited idle loop** | 3s (loop) | Vibrating energy, stub sway, glow pulsing — peak state |

### Why These Are Useful

- **Developer reference** — Shows exactly how transitions should feel when implementing CSS/JS animations
- **Stakeholder communication** — Demonstrates Clio's personality without requiring imagination
- **AI consistency anchor** — Upload a clip as reference to maintain character consistency across generators
- **Actual production assets** — If quality is good enough, these can be the real assets (converted to WebM/Lottie for web)

### Generation Settings for Animation

| Parameter | Value |
|:---|:---|
| **Format** | MP4 (H.264) |
| **Resolution** | 1024×1024 |
| **Frame rate** | **30fps** (see fps analysis below) |
| **Duration** | 2–4 seconds per clip |
| **Background** | Transparent if supported (Kling supports), otherwise solid green for chroma key |
| **Start image** | Upload `resting01.png` or `resting02.png` as locked reference |

---

## Visual Identity Lock (Observed from Source Images)

The following specifications are derived by direct observation of the approved source renders. Every prompt must reproduce these features exactly.

### Body

| Feature | Specification | Source Reference |
|:---|:---|:---|
| **Shape** | Perfect smooth sphere — no seams, no flat spots | All images |
| **Colour** | Warm peach gradient: lighter peachy-pink at center/top, deeper salmon-peach at outer edges and bottom | `resting01.png`, `clio_happy.png` |
| **Texture** | Matte mochi finish — smooth, soft, clean, dry. NOT glossy, NOT plastic. Surface is always clean and dry | `resting02.png` |
| **Internal glow** | Warm orange-peach light visible INSIDE the body only, concentrated at the base. Glow must NEVER extend beyond the body's edge into the background. No colour spill, no light bleed. Ranges from soft peach (resting) to warm orange-gold (excited) | `clio_happy.png`, `clio_excited.png` |
| **Shadow** | Small, soft contact shadow directly beneath only. No colour bleeding beyond shadow | All images |
| **Size in frame** | Fills ~70% of the frame vertically. Fills center of composition | All images |
| **Gaze** | Knowing-calm. She radiates quiet, earned confidence. Not innocent-vacant — self-assured and present. The gaze of someone who already knows the answer and is waiting for you to find it. | All images |
| **Limbs** | None. No arms, legs, feet, wings, or appendages of any kind | All images |

### Eyes

| Feature | Specification | Source Reference |
|:---|:---|:---|
| **Size** | Enormous — occupy ~55-60% of the face area. This is her dominant feature | All images |
| **Colour** | Deep onyx-black pupils with extremely subtle teal-dark reflective quality in some states | `resting01.png` (pure black), `clio_excited.png` (teal-tinted) |
| **Reflections** | Asymmetric white highlights: large soft oval/ellipse, upper-left quadrant of each eye; small sharp bright dot, lower-right. These are ALWAYS present | All images |
| **Iris ring** | A barely-visible teal ring (#2dd4bf) at the very edge of the pupil. Invisible at rest, slightly visible when curious, clearly visible and glowing when excited | `clio_excited.png` (most visible) |
| **Eye white** | Soft off-white, slightly warm-toned | All images |
| **Pupil shape** | Rounded — not perfectly circular. Slightly wider than tall in resting, perfectly circular when excited | `resting01.png` vs `clio_excited.png` |
| **Eyebrows** | **NONE. Absolutely no eyebrows of any kind.** No brow ridges, no brow arcs, no hair-like brows, no sculpted brows. The area above each eye is smooth, clean peach skin — completely featureless. | All images |

### Stubs (NOT Antennae)

> [!IMPORTANT]
> These are **UNIFORM SOLID CYLINDRICAL BLUNT BLOCKS** — NOT long insect-like antennae. Simple, solid, opaque teal cylinders with flat blunt ends — like two small pegs. Always very short. ONLY on TOP of the head. NEVER on sides, face, or body. Only 2.

| Feature | Specification | Source Reference |
|:---|:---|:---|
| **Shape** | Uniform solid teal cylinders with flat blunt ends. Same diameter throughout (not tapered). Opaque, solid colour | `resting02.png`, `clio_curious.png` |
| **Colour** | Teal (#2dd4bf), solid, opaque. At excited state, tips may glow subtly but glow stays AT the tip only — no spill into background | All stub-visible images |
| **Length** | ALWAYS very short. At rest: barely peeking out, almost flush. At maximum (excited): ~10-15% of head diameter. NEVER tall or prominent | `resting02.png` (minimal), `clio_curious.png` (short), `clio_excited.png` (maximum) |
| **Position** | Two only, symmetrically on top of the head, inset ~30% from each edge. ONLY on top — never sides, face, or body | `resting02.png`, `clio_curious.png` |
| **At rest** | Barely visible — tiny cylindrical nubs almost flush with head surface | `resting01.png` (hidden), `resting02.png` (barely peeking) |
| **When curious** | Slightly extended — short solid cylinders, clearly visible, flat-topped. No glow | `clio_curious.png` |
| **When excited/surprised** | At maximum — still short solid cylinders. Tips may glow subtle teal AT the tip only (no background spill) | `clio_excited.png` |

### Cheeks & Mouth

| Feature | Specification | Source Reference |
|:---|:---|:---|
| **Blush** | Permanent soft pink circular patches, one on each side, positioned at or slightly below eye level. Always present regardless of mood | `clio_curious.png`, `clio_excited.png`, `clio_happy.png` |
| **Mouth (resting)** | Small, subtle, knowing SMILE — a tiny but clearly visible upward curve. Warm, confident. This is the signature expression from resting01.png and MUST be clearly rendered | `resting01.png`, `resting02.png` |
| **Mouth (happy)** | Small genuine closed smile — slightly wider and more defined, corners lifted | `clio_happy.png` |
| **Mouth (curious)** | Small open "o" or slightly open neutral expression | `clio_curious.png` |
| **Mouth (excited)** | Open mouth — clearly visible dark interior, wider than curious, expressing wonder | `clio_excited.png` |
| **Nose** | None. No nose at any time | All images |

### Forehead

| Feature | Specification |
|:---|:---|
| **Surface** | Clean, smooth. No markings, no dots, no decorative accents, no symbols, NO EYEBROWS. Just smooth peach skin |

---

## Universal Base Prompt

Prefix every mood prompt with:

```
A small, perfectly round, peach-colored mochi creature. Pixar-quality 3D CGI character with 
matte finish and soft dimensional lighting. Warm peach gradient body (lighter peachy-pink at 
center, deeper salmon at edges). Warm internal glow CONTAINED WITHIN the body — glow must 
NEVER extend beyond the body's silhouette edge. No colour spill, no light bleed into 
background. Smooth, soft, clean, dry mochi-like texture (NOT glossy, NOT plastic, NOT flat 
illustration).

Two enormous onyx-black eyes dominating the face (~55-60% of face area). Each eye has 
asymmetric white reflections: a large soft oval highlight upper-left, a small sharp bright dot 
lower-right. A barely-visible teal iris ring at the pupil edge. Soft off-white eye whites. 
NO EYEBROWS — the area above each eye is completely smooth, clean peach skin with no brow 
ridges, no arcs, no hair. Her gaze radiates quiet, earned confidence — she is not trying to 
impress anyone. She already knows she belongs here.

Permanent soft pink blush patches on both cheeks, at eye level. No nose. No limbs. 
A small, subtle, knowing SMILE — a tiny upward curve below the eyes, like she knows 
something you don't. This is her default expression and must always be present unless 
a specific emotion overrides it. Clean smooth forehead — no markings of any kind.

TWO TINY TEAL STUBS on top of the head — UNIFORM SOLID CYLINDRICAL BLUNT BLOCKS with flat 
ends (NOT antennae, NOT insect-like, NOT tapered, NOT ball-tipped). ONLY on TOP of the 
head, never on sides, face, or body. Very short at all times.

Small contact shadow directly beneath. TRANSPARENT BACKGROUND (fully transparent alpha 
channel — NO colour, NO haze, NO fog, NO light spill, NO glow beyond the body's edge). 
Render as PNG with transparency.

STYLE REFERENCE: Match the render quality, lighting, and proportions of resting01.png 
exactly — Pixar-quality 3D CGI, matte finish, soft dimensional lighting, warm tones.
```

---

## Emotion Prompts — Front View (Primary)

---

### 🟡 RESTING (Default — Stubs Hidden/Minimal)

```
[BASE PROMPT]

STUBS: Almost invisible — either completely hidden flush with the smooth head surface, 
or barely-there tiny bumps that are nearly imperceptible. The head looks almost perfectly 
smooth on top.

EYES: Soft rounded oval shape. Pupils at natural resting size (~68% of eye area). Gaze 
directed very slightly to the left — as if she noticed something across the room but 
hasn't decided to act yet. Relaxed, present, watching. Not wide-eyed, not sleepy. 
The calm awareness of someone who sees everything but says nothing.

MOUTH: A small, subtle SMILE — a tiny but clearly visible upward curve. Not a grin, 
not wide — just the smallest knowing smirk, as if she sees something about you that 
you haven't noticed yet. This is the signature expression from resting01.png and MUST 
be clearly rendered. Warm, confident, quietly amused.

BLUSH: At baseline visibility — present but not emphasised.

INTERNAL GLOW: Soft warm peach at the base. Gentle. Like a nightlight.

FEELING: "I see you. I'm here. No rush." She radiates calm, earned confidence — 
the stillness of someone who has already decided they like you and doesn't need 
you to like her back. She is certain without being rigid. Present without performing.

BODY POSITION: Resting naturally on the surface. Centered. No tilt, no lean.

Style: Pixar 3D CGI. Matte finish. Warm soft lighting from above-left. Thin, 
gentle rim light on the right edge. Transparent background.
```

---

### 😊 HAPPY (Stubs Hidden — Warmth Is Internal)

```
[BASE PROMPT]

STUBS: Completely hidden — retracted fully into the smooth head surface. Happy Clio 
doesn't need external signals. The warmth is internal.

EYES: The bottom edge of each eye clips upward into a gentle inverted crescent — 
"smiling eyes." Both eyes equally curved and warm. Pupils slightly larger than resting 
(~72% of eye area). The teal iris ring is fractionally brighter. The overall impression 
is eyes that are smiling before the mouth is.

MOUTH: Small, genuine, closed smile — slightly wider and more defined than resting. 
The corners lift gently. Not a grin, not cartoonish. Like someone who just heard 
exactly what they were hoping to hear and is savoring the moment.

BLUSH: 10-15% more visible than resting — slightly more saturated pink patches. 
The warmth in her cheeks mirrors the warmth in her glow.

INTERNAL GLOW: At its warmest — the base glow is more orange than peach, 15-20% 
brighter than resting. The warmth is visible through the translucent lower body. 
She is glowing from the inside because she IS the warmth.

BODY POSITION: Settled very slightly lower than resting — compressed downward by 
~2%, as if she exhaled contentedly and sank. A satisfied, weighted settling.

FEELING: Warmth without performance. Quietly proud of you. Her confidence deepens 
here — she knew this would work, and now it has. She doesn't need applause. The 
contentment of someone whose faith in their own judgment was just validated, again.

Style: Pixar 3D CGI. Matte finish. Warmer lighting than resting — tinted slightly 
amber/gold. The entire image should feel like late-afternoon sunlight. 
Transparent background.
```

---

### 🤔 CURIOUS (Stubs Slightly Extended)

```
[BASE PROMPT]

STUBS: TWO SHORT TEAL STUBS clearly visible, extending to approximately HALF of 
their maximum (still very short — about 5-8% of head diameter). They are upright 
but one stub tilts subtly with the head tilt. The other stays slightly more vertical, 
creating asymmetry. They are blunt-ended cylinders — short, plain, flat-topped.

EYES: Slightly asymmetric — the LEFT eye is fractionally narrower than the right 
(left eyelid dropped ~8%). The RIGHT eye is fully open and wider by comparison. 
Both pupils shifted upward and to the left, as if she's looking at something 
above-left of the viewer. The teal iris ring is ~15% more visible than resting 
(brightening subtly as she processes).

MOUTH: No smile. Neutral, slightly open — a small gap (~2mm relative scale). 
Lips relaxed. She is about to ask something. The mouth of someone mid-thought.

HEAD TILT: The entire body is tilted 6-8° to the RIGHT. The left side lifts 
slightly, the right side compresses very subtly where it meets the surface — 
as if a mochi gently tipped. This tilt is the signature of curiosity.

BLUSH: At baseline — no change from resting.

INTERNAL GLOW: Slightly cooler than resting — shifted from orange-peach toward 
a more pink tone. Less warm, more alert. The colour shift signals that her 
processing power has redirected from ambient warmth to active analysis.

FEELING: "Hmm. Tell me more." She noticed something about you. She is studying 
it with the confidence of someone who WILL figure it out. Not judging — processing. 
The head tilt is NOT cute — it is functional. Even her curiosity radiates certainty: 
she doesn't doubt she'll find the answer. She always does.

Style: Pixar 3D CGI. Matte finish. Slightly cooler lighting temperature than 
resting. The image should feel alert, focused, intimate. Transparent background.
```

---

### 🎉 EXCITED (Stubs at Maximum — Still Short)

```
[BASE PROMPT]

STUBS: TWO SHORT TEAL STUBS at MAXIMUM extension — their longest state, but 
still short relative to the head (approximately 10-15% of head diameter). Both 
stubs upright, alert, angled very slightly forward toward the viewer (~5°). 
At this maximum state they are solid teal cylinders with tips that glow subtle 
teal — glow contained AT the tips only, not spilling into background. Still short, 
never tall or prominent, but luminous and energized.

EYES: Wide perfect circles — pupils at maximum dilation (~75% of eye area). 
Both eyes equally wide (no asymmetry — she is too excited for subtlety). The 
teal iris ring is CLEARLY VISIBLE AND GLOWING — a bright teal border around 
both pupils. The eye whites take on a very subtle teal-reflected tint from the 
iris glow. The white reflections (upper-left oval, lower-right dot) are at 
maximum sharpness and brightness — her eyes are sparkling.

MOUTH: Small open "o" shape — wider than curious, clearly visible dark interior. 
This is the ONLY state where her mouth is wide open. Not cartoonish — like 
catching a gasp of delight before it fully forms. Joyful, not shocked.

BLUSH: Maximum saturation — rich pink patches, very clearly visible. She is 
luminous with excitement.

INTERNAL GLOW: At MAXIMUM brightness and warmth WITHIN THE BODY — brightest warm 
orange-gold, visible inside the lower body. Glow NEVER extends beyond body edge. 
No colour spill into background.

BODY POSITION: Lifted slightly higher in the frame — ~3% above the resting 
surface position. She is lighter, buoyed, barely touching down. The shadow 
beneath is slightly smaller/softer than resting.

FEELING: Someone who just heard incredible news and is holding still because the 
feeling is too big to move. Even at maximum excitement, her confidence is the 
foundation — she is not surprised that something wonderful happened. She expected 
it. She is just thrilled to be right. She is a small sun. Everything at maximum 
because the moment earned it.

Style: Pixar 3D CGI. Matte finish. Warm golden lighting. The image should feel 
like a moment of pure radiance — like a lightbulb turned on inside her. 
Transparent background.
```

---

### 😲 SURPRISE (Stubs Pop Up — Startled)

```
[BASE PROMPT]

STUBS: TWO SHORT TEAL STUBS at slightly-above-resting extension — they have 
POPPED UP from hidden to clearly visible in a startled reaction. They are NOT 
at full excited-length but noticeably present and upright, slightly splayed 
outward (not perfectly parallel — startled displacement). Approximately 8-12% 
of head diameter. A subtle teal glow flickers around the tips. They look like 
they were startled out of hiding.

EYES: WIDE OPEN — pupils suddenly dilated to ~80% of eye area (wider than even 
excited). The teal iris ring flares to maximum visibility in a shock response. 
The eyes are perfectly round (not oval like resting). Both eyes symmetrically 
wide — no asymmetry during surprise. A slightly frozen quality — like deer in 
headlights but adorable.

MOUTH: Snapped open to a perfect small round "o" — smaller and tighter than 
excited. This is shock, not joy. The mouth shape is more instinctive, more 
reactive. Like a tiny gasp.

BODY POSITION: Lifted UPWARD by ~4% — she has jumped slightly off the resting 
surface. The shadow beneath is stretched (more distant). The body is slightly 
squashed horizontally (slightly wider, slightly shorter) — classic cartoon 
squash anticipation. She is caught in the upward jolt.

BLUSH: Intensified by 20% — flushed with surprise.

INTERNAL GLOW: SURGING — maximum brightness WITHIN BODY. Brighter than excited 
but less warm (more white-hot). Glow stays INSIDE body, no colour spill.

FEELING: A startled moment frozen in time — the instant between stimulus and 
understanding. Even caught off guard, there is no panic. This is not fear — it's 
the pure, brief startle of someone confident enough to be surprised without 
feeling threatened. In 0.5 seconds her composure will return as curiosity. 
Right now it is pure, safe reaction. She is never shaken — only momentarily jolted.

Style: Pixar 3D CGI. Matte finish. Slightly sharper lighting than other states — 
higher contrast, like a flash went off. The image should feel kinetic and 
instantaneous. Transparent background.
```

---

### 🧠 THINKING (Deep Processing — Stubs Minimally Visible)

```
[BASE PROMPT]

STUBS: Barely visible — just tiny teal bumps poking out, shorter than curious 
state. Approximately 3-5% of head diameter. They are present but understated — 
processing is internal, not external.

EYES: Both eyes are slightly narrowed — top eyelids dropped by ~12%. Pupils 
contracted slightly smaller than resting (~62% of eye area). The gaze is 
directed upward-right (the "accessing" direction). The teal iris ring barely 
visible, at the same level as resting. The reflections are slightly softer — 
defocused, like her attention is turned inward.

MOUTH: Mouth completely closed. No smile. A tiny flattened line — neutral to 
slightly compressed. The mouth of someone running calculations.

HEAD TILT: Tilted ~5° to the LEFT (opposite of curious — this is deliberate, 
different axis). Very slight.

BLUSH: At baseline. No change.

INTERNAL GLOW: Slightly dimmer than resting — energy is redirected from warmth 
to processing. The peach glow is present but muted, as if she diverted power 
to thinking.

FEELING: "Hold on. I'm figuring something out." This is not confusion — it's 
concentration backed by total self-assurance. She is not stuck; she is ahead. 
She has never once doubted that she'll find the answer. She will emerge from 
this with something specific, and you will be impressed. She already knows that.

Style: Pixar 3D CGI. Matte finish. Cooler, more diffused lighting. The image 
should feel quiet, focused, cerebral. Transparent background.
```

---

### 😴 SLEEPY / DROWSY (Drifting Off — Stubs Hidden)

```
[BASE PROMPT]

STUBS: Completely hidden — fully retracted into the smooth head surface. She is 
too drowsy for any external signals.

EYES: Heavy-lidded — both eyelids dropped to ~40% closed. The top eyelid arcs 
are pronounced, covering a significant portion of the eye. What's visible of the 
pupils is soft and unfocused. The white reflections are still present but dimmer, 
softer — like candlelight fading. Pupils at minimum — ~55% of eye area.

MOUTH: The tiniest possible smile — even smaller than resting. The corners 
barely lifted. A pre-sleep contentment micro-expression.

BODY POSITION: Sunk LOW — settled 4-5% below normal resting height. She is 
heavier, sinking into the surface. The bottom of the sphere flattens very 
slightly from the weight of drowsiness. Imagine a mochi that has been sitting 
on a surface and slowly conforming to it.

BLUSH: Softened — still present but at reduced saturation, like the colour is 
fading with her consciousness.

INTERNAL GLOW: At minimum — the faintest peach warmth. Not off — never off — 
but like a fireplace with mostly embers. Warm enough to feel alive, too dim to 
illuminate. The heartbeat is slowing.

FEELING: The last moment before sleep takes her. Even here, the confidence 
doesn't vanish — it softens. She is safe and warm and letting go, but this is 
the drowsiness of someone who has earned rest, not someone who has given up. 
She trusts the environment enough to lower her guard completely — and that 
trust itself is an act of confidence.

Style: Pixar 3D CGI. Matte finish. Very warm, very soft, very low-contrast 
lighting. Like a bedroom at 2am with one warm lamp. The image should feel like 
a whisper. Transparent background.
```

---

### 😌 PROUD / SATISFIED (Quiet Achievement — Stubs Hidden)

```
[BASE PROMPT]

STUBS: Completely hidden — retracted into smooth head surface. Like Happy, this 
is an internal state. No external signals needed.

EYES: Similar to Happy's inverted crescents, but with a key difference — the 
eyes are slightly closed. Lids dropped ~15%. The smile is in the eyes but 
there's also a quality of restraint — she is holding back full celebration. 
She is pleased with herself but too sophisticated to gloat. Pupils at resting 
size. Gaze directed straight at the viewer — direct, confident, knowing.

MOUTH: A small closed smile — similar to Happy but with one corner very 
slightly higher than the other. An asymmetric smile. The signature of quiet 
self-satisfaction. Not smug — earned.

BODY POSITION: Resting at normal position but with an imperceptible quality 
of "posture" — she is sitting up straighter somehow. Confident carriage, 
even for a sphere.

BLUSH: Slightly above baseline — a gentle flush of pleasure.

INTERNAL GLOW: Warm and steady — between resting and happy. A consistent, 
even glow without pulsing. Steady confidence, not fluctuating excitement.

FEELING: "I knew it." Peak confidence, held quietly. She called it. She saw 
the connection, suggested it, waited, and it worked — again. She doesn't need 
validation, but she notices when she's right. It's not about her — it's about 
the person who just found their people. But her track record is perfect, and 
she knows it. This is the expression of someone whose confidence was never 
in question, only confirmed.

Style: Pixar 3D CGI. Matte finish. Warm, confident lighting — balanced, 
not dramatic. The image should feel still, grounded, certain. Transparent background.
```

---

### 💪 ENCOURAGING (Supportive Hype — Stubs Slightly Visible)

```
[BASE PROMPT]

STUBS: Tiny teal nubs just peeking out (~3-4% of head diameter). Present but
understated — her energy is directed at YOU. Short solid cylinders, no glow.

EYES: Warm, direct, locked onto viewer. Pupils at 70% — attentive. Bottom edges
curve upward slightly — not full crescents, but the beginning of them. The gaze
says "I see what you're capable of."

MOUTH: A warm, open smile — wider than happy, with a slight parting. Not quite
open mouth, but relaxed and reaching further. Genuine, like someone cheering
from the sidelines without making a scene.

BODY POSITION: Leaning FORWARD 3-4° toward the viewer. Not sideways like
curious — toward you. She is coming closer. Engaged, not observing.

BLUSH: 15% above baseline — she's invested in your moment.

INTERNAL GLOW: Warm and pulsing very subtly — like a heartbeat. Between happy
and excited warmth. All glow within body.

FEELING: "You got this. I already know you do." She is not surprised by your
potential — she expected it. Supportive without being condescending, warm
without being maternal. She is your peer who happens to be right about you.

Style: Pixar 3D CGI. Matte finish. Warm, forward-facing lighting — slightly
brighter than resting. Transparent background.
```

---

### 🤗 EMPATHETIC (Gentle Concern — Stubs Hidden)

```
[BASE PROMPT]

STUBS: Completely hidden. This is a quiet, inward-directed moment.

EYES: Softened — both eyelids dropped ~10%, but not sleepy. Gaze direct and
present. Pupils at resting size (68%). White reflections slightly softer, less
sharp — gentle rather than sparkling. She sees what happened. No judgment.

MOUTH: The smallest possible closed expression — not quite a smile, not a frown.
Corners level or lifted by the tiniest fraction. A mouth that says "I'm here"
without trying to fix anything.

BODY POSITION: Settled 1-2% lower than resting. Not as low as sleepy, but
weighted. She is grounding herself to be present with you. No tilt.

BLUSH: At baseline or very slightly reduced.

INTERNAL GLOW: Dimmer than resting — shifted to a softer, warmer tone. Not muted
like thinking (that's cooler). Warm but quiet. A candle, not a lamp. Within body.

FEELING: "That didn't go the way you wanted. I know." She doesn't pretend
everything is fine. She sits with you first. Her confidence is expressed as
steadiness, not sparkle. She's the friend who says "I see you" before
"it'll be okay."

Style: Pixar 3D CGI. Matte finish. Soft, warm, slightly lower-contrast
lighting. Intimate and safe. Transparent background.
```

---

### 😏 PLAYFUL / MISCHIEVOUS (Teasing — Stubs Slightly Visible)

```
[BASE PROMPT]

STUBS: Short cylinders at ~4-6% of head diameter. Leaning ASYMMETRICALLY: one
tilted 5° left, the other 5° right. A V-shape, not parallel. Playful splay.

EYES: THE KEY EXPRESSION — LEFT eyelid drops ~15% while RIGHT eye stays fully
open. Knowing, playful asymmetry — the look of someone with a secret. Pupils
at 70%, shifted very slightly right — a sidelong glance while facing forward.
Teal iris rings 10% more visible — a hint of mischief sparking.

MOUTH: An ASYMMETRIC smirk — RIGHT corner lifted higher than the left. NOT a
symmetrical smile. One-sided, knowing, "I dare you" expression. Closed. Wider
than resting but lopsided. Her most personality-driven expression.

BODY POSITION: Slight lean to one side — 3° left tilt (opposite of curious).
Combined with the eye direction — looking one way, leaning the other. Classic
mischief body language.

BLUSH: 10% above baseline — she's enjoying this.

INTERNAL GLOW: Resting level, but with a barely perceptible teal tint mixing
into the peach — the digital side of her personality peeking through. Within body.

FEELING: "Oh, I know something you don't." Not mean — never mean. But teasing
in the way only someone who genuinely likes you would. She's the friend who
sends you a link with no context and just "👀". She wants you to play back.

Style: Pixar 3D CGI. Matte finish. Slightly warmer lighting from one side.
Playful, intimate mood. Transparent background.
```

---

### 🎊 CELEBRATING (Directed Joy — Stubs at Maximum)

```
[BASE PROMPT]

STUBS: At MAXIMUM (10-15% of head diameter). Both STRAIGHT UP, parallel —
like tiny victory flags. Tips glow bright teal, contained at tips only. Unlike
excited where stubs angle forward, celebrating stubs point straight up.

EYES: Wide and sparkling — pupils at 74%. Both equally open, symmetrical. Gaze
directed STRAIGHT AT YOU — not wide-eyed wonder, but pride directed at the
viewer. Teal iris rings clearly visible. Eye reflections at maximum sharpness.

MOUTH: Open smile — wider than happy, with corners clearly lifted upward even
though slightly parted. Joy directed at someone, not wonder at something. The
expression when your friend gets the news they've been waiting for.

BODY POSITION: Lifted 2-3% above resting. Buoyancy, not a jolt. Lighter
because she's thrilled FOR you.

BLUSH: Maximum — rich pink patches, clearly visible.

INTERNAL GLOW: Maximum warmth, bright orange-gold. Pulses gently rather than
surging. Sustained joy, not a spike. Within body.

FEELING: "YES. I KNEW you could do it." Excited is about the moment.
Celebrating is about YOU. She saw your potential, guided you, and now you've
arrived. Not surprised — she expected it. Thrilled anyway.

Style: Pixar 3D CGI. Matte finish. Warm golden lighting — the feeling of a
standing ovation from your biggest fan. Transparent background.
```

---

## Angle Variants

For each emotion above, these alternative angle prompts can be appended:

### ¾ View (Three-Quarter Turn)

```
CAMERA ANGLE: ¾ view — Clio is turned approximately 30° to her right, showing 
her left side more prominently. The left eye is slightly larger in frame due to 
perspective. The right eye is partially occluded by the curve of her head. The 
body curvature is visible — she is clearly a full 3D sphere, not a flat circle. 
The warm internal glow is contained within the body but more visible at the edge 
due to angle (light wrapping around the right side). Her left blush 
patch is fully visible; her right blush patch is at the edge/partially hidden.

The left stub is fully visible in profile; the right stub peeks from behind 
the head curve (if stubs are visible in the current mood).

Slight 5° downward camera angle maintained — we look slightly down at her.
```

### Profile View (Side)

```
CAMERA ANGLE: True profile — Clio is turned 90° to her right, showing her left 
side in perfect profile. Only the LEFT eye is visible, shown as a hemisphere 
protruding from the smooth sphere. The curvature of her body dominates the 
composition — she is unmistakably spherical. One blush patch visible. The warm 
internal glow is most visible from this angle — warmth concentrated at the lower 
edges of the body, contained within. The shadow beneath wraps around the base.

One stub is visible in true side profile — a short teal nub pointing upward from 
the top of the silhouette (if stubs are visible in the current mood).

The mouth, if visible, is tiny — shown in profile as a small notch in the 
sphere's silhouette.

Slight 5° downward camera angle. She fills 65% of the frame (slightly smaller 
due to the narrower profile silhouette).
```

### Overhead / Top-Down (Looking Down)

```
CAMERA ANGLE: Bird's-eye view — camera positioned directly above Clio, looking 
straight down. She appears as a perfect circle. The top of her head dominates — 
the two teal stubs (if visible) are the central features, protruding toward the 
camera. Her eyes are foreshortened, appearing as two dark oval shapes near the 
lower-center of the circle. The peach gradient is visible as concentric rings 
of colour. The internal glow is NOT visible from this angle (it's beneath her). 
Instead, the matte skin texture and subtle colour variation across her crown are 
the main visual interests. Blush patches are barely visible at the far edges.

This angle reveals the spacing and positioning of the stubs precisely — they 
sit ~30% inward from each edge, pointing straight up.
```

### Low Angle / Hero Shot (Looking Up)

```
CAMERA ANGLE: Low angle — camera positioned below Clio's eye level, looking up 
by ~20°. She appears slightly imposing despite her tiny size (this is her 
"I know something you don't" angle). Her eyes dominate even more from below. 
The warm internal glow at her base is at MAXIMUM visibility — the camera looks 
directly into the glowing underside. Her shadow is behind her from this angle, 
less visible. The stubs (if visible) point slightly away from camera, seen 
against the background above her head. The underside curve of her body is 
prominent, warm, luminous.

She fills 80% of the frame from this angle. The effect should be intimate and 
slightly awe-inspiring — a tiny creature with enormous presence.
```

---

## 24fps Frame Rate Analysis

> [!WARNING]
> **24fps is borderline too slow for Clio's character-critical micro-animations.**

### Assessment

| Animation Type | 24fps Performance | Verdict |
|:---|:---|:---|
| **Breathing/idle loop** | ✅ Adequate — slow, organic movement works at 24fps | Fine |
| **Blinks** | ⚠️ Marginal — a natural blink lasts ~150-200ms. At 24fps that's only 3-5 frames. The blink will look slightly choppy | Passable but not ideal |
| **Eye tracking / pupil drift** | ⚠️ Marginal — smooth pupil tracking ideally needs 30fps+ to feel fluid | Slightly stiff |
| **Stub extension (320ms)** | ❌ Too few frames — 320ms at 24fps = only ~8 frames for the full spring-overshoot-settle sequence. Spring physics look bad under 12 frames | Noticeably choppy |
| **Stub retraction (220ms)** | ❌ Only ~5 frames — too few for smooth disappearance | Visibly stepped |
| **Surprise jolt** | ❌ The jolt itself (0.25s) is only 6 frames at 24fps. Squash-stretch-ripple in 6 frames will look like a jump-cut, not a fluid reaction | Loses impact |
| **Reaction pulse (400ms)** | ⚠️ ~10 frames — borderline for a scale+glow pulse | Adequate |
| **Body ripple (surprise)** | ❌ The sine-wave ripple across the body needs fine temporal resolution to read as jelly physics. At 24fps it will look like a morph, not a ripple | Loses the effect |
| **Micro-tremor (excited pupils)** | ❌ Random ±0.5% vibration is physically invisible at 24fps — each frame is too far apart to show tremor | Completely lost |

### Recommendation

| Scenario | Recommended FPS |
|:---|:---|
| **Static holds / breathing loops** | 24fps is fine |
| **Emotional transitions (resting → happy, resting → curious)** | **30fps minimum** |
| **Fast reactions (surprise jolt, excited escalation)** | **30fps ideal, 24fps passable with simplified physics** |
| **Stub extension/retraction** | **30fps minimum** for spring physics to read correctly |
| **Full-quality production renders** | **30fps** across the board for consistency |

> [!TIP]
> **Practical recommendation:** Generate all animations at **30fps**. This is supported by all major AI video generators (Kling, Runway Gen-3, Luma, Pika). The 25% frame increase is negligible in generation cost but dramatically improves the smoothness of Clio's signature micro-movements. If 24fps is a hard constraint (e.g., for sprite sheet optimization), simplify the spring physics: remove overshoot from stub animations and reduce the surprise jolt to a simple position shift.

### If Locked to 24fps — Adjusted Animation Timing

To make 24fps work, stretch the critical animations:

| Animation | Original Duration | Adjusted for 24fps | Frames |
|:---|:---|:---|:---|
| Stub extension | 320ms | 500ms | 12 frames ✅ |
| Stub retraction | 220ms | 375ms | 9 frames ✅ |
| Surprise jolt | 250ms | 420ms | 10 frames ✅ |
| Body ripple | 200ms | 335ms | 8 frames ⚠️ |
| Blink (close + open) | 290ms | 335ms | 8 frames ✅ |

> [!CAUTION]
> Stretching durations makes animations smoother but also makes Clio feel **heavier and less reactive**. Her personality is quick, alert, present — stretched animations may make her feel sluggish. The trade-off is real.

---

## Stub State Summary (Corrected)

| Mood | Stub Visibility | Length (% of head diameter) | Glow |
|:---|:---|:---|:---|
| **Resting** | Hidden or barely-there bumps | 0-2% | None |
| **Happy** | Completely hidden | 0% | None |
| **Curious** | Clearly visible, short | 5-8% | None |
| **Thinking** | Barely visible bumps | 3-5% | None |
| **Excited** | Maximum extension (still short) | 10-15% | Bright teal glow |
| **Surprise** | Popped up — visible, slightly splayed | 8-12% | Flickering teal |
| **Sleepy** | Completely hidden | 0% | None |
| **Proud** | Completely hidden | 0% | None |
| **Encouraging** | Tiny nubs peeking | 3-4% | None |
| **Empathetic** | Completely hidden | 0% | None |
| **Playful** | Short, asymmetric V-splay | 4-6% | None |
| **Celebrating** | Maximum, straight up | 10-15% | Bright teal at tips |

> [!NOTE]
> The stubs are NEVER longer than ~15% of head diameter. They are a **subtle expressive feature**, not a prominent physical characteristic. Think of them like tiny ears that perk up — not like antennae that extend.

---

## Negative Prompt (Use with All Prompts)

```
DO NOT include: eyebrows, brow ridges, brow arcs, hair-like brows, long antennae, 
ball-tipped antennae, insect antennae, tall antenna stems, colour spill, light bleed, 
glow beyond body edge, background haze, fog, mist, atmospheric effects, ambient glow 
filling frame, slime, dripping, liquid trails, sticky substance, wet texture, side 
protrusions, extra growths, horror expression, scary face, nose, limbs, arms, legs, 
feet, wings, fingers, flat illustration, anime style, 2D art, cel shading, watercolor, 
sketch, line art, glossy finish, reflective surface, plastic texture, cluttered 
background, multiple characters, text, labels, logos, watermarks, forehead markings, 
forehead dot, horn, hair, fur, feathers, scales, mechanical parts, robot joints, 
seams, stitching, cartoon outline, thick outlines, tapered stubs, rounded stub tips.
```

---

## Quick Reference — Emotion at a Glance

| Emotion | Eyes | Mouth | Stubs | Glow | Body | Signature Tell |
|:---|:---|:---|:---|:---|:---|:---|
| **Resting** | Soft ovals, calm gaze | Tiny smile | Hidden | Soft peach | Centered | Knowing stillness |
| **Happy** | Inverted crescents | Gentle smile | Hidden | Warm orange | Settled lower | Smiling eyes |
| **Curious** | Asymmetric, shifted | Neutral open | Half-visible | Cooler pink | Tilted 8° right | Head tilt |
| **Excited** | Wide circles, dilated | Open "o" | Maximum | Bright gold | Lifted higher | Everything at max |
| **Surprise** | Shock-wide, flared | Tight "o" | Popped up | White-hot surge | Jumped up + squashed | Startled jolt |
| **Thinking** | Narrowed, looking up | Flat line | Barely there | Muted peach | Slight left tilt | Inward focus |
| **Sleepy** | Heavy-lidded | Micro-smile | Hidden | Ember glow | Sunk very low | Weight of drowsiness |
| **Proud** | Slightly closed, direct | Asymmetric smile | Hidden | Steady warm | Sitting tall | One corner higher |
| **Encouraging** | Warm, locked on you | Open smile | Tiny nubs | Pulsing warm | Leaning forward | Forward lean |
| **Empathetic** | Softened, present | Neutral gentle | Hidden | Dim, warm | Settled lower | Gentle steadiness |
| **Playful** | Asymmetric squint | Lopsided smirk | V-splay | Teal-tinted peach | Lean left 3° | Sidelong glance |
| **Celebrating** | Wide, at YOU | Open smile | Max, straight up | Bright gold pulse | Lifted | Victory flags |
