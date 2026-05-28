# Asset Structure & Persona Review

> **Deep dive into Clio and Sage visual assets + persona architecture**
> 2026-05-05

---

## Part 1 — Asset Structure

### Current State: Clio

```
clio/assets/
├── README.md                          ← Good: documents mood→file mapping
├── source/                            ← Master files (mixed naming, stale file)
│   ├── resting01.png                  ⚠️ Doesn't match spec naming
│   ├── resting01.mp4
│   ├── resting02.mp4
│   ├── resting02_final_fixed.png      ⚠️ Non-canonical name
│   ├── Curious.mp4                    ⚠️ Capital C, no variant number
│   ├── Happy.mp4                      ⚠️ Capital H
│   ├── Happy_and_Satisfied.mp4        ⚠️ Ambiguous mood name
│   ├── Listening.mp4                  ⚠️ Not a defined mood
│   ├── Resting_to_Encouraging.mp4     ⚠️ Capitals, no variant
│   ├── Resting_to_Encouraging_2.mp4   ⚠️ Inconsistent variant suffix
│   ├── Resting_to_empathy.mp4         ⚠️ Mixed case
│   ├── aggilo-soul.html               ❌ Wrong location entirely
│   └── .gitkeep
├── app/                               ← Sized for mobile (all empty)
│   ├── 32/  .gitkeep
│   ├── 48/  .gitkeep
│   ├── 80/  .gitkeep
│   └── 120/ .gitkeep
└── web/                               ← Optimised for web (empty)
    └── .gitkeep
```

**Problems:**
1. **Naming doesn't match the spec.** `clio_overlay_prompt.md` specifies `clio_resting_01.png`, `clio_curious_02.png` etc. Actual files use `resting01.png`, `Curious.mp4`, `Happy_and_Satisfied.mp4`
2. **No stills/ vs clips/ separation.** The spec defines `source/stills/` and `source/clips/` — the actual folder has everything flat in `source/`
3. **Stale / misplaced files.** `aggilo-soul.html` is a rendered HTML doc, not an asset. `resting02_final_fixed.png` is a WIP name
4. **app/ and web/ are empty.** No exported assets at any size yet
5. **No pointing/ subfolder.** Spec defines `source/stills/pointing/` — doesn't exist

### Current State: Sage

```
sage/
├── SOUL.md
├── AGENTS.md
├── SAGE_SKILLS.md
├── sage_image_prompts.md              ← Defines asset structure but...
└── skills/
    └── ...

NO assets/ folder exists at all.
```

**Problem:** `sage_image_prompts.md` (line 14) references `sage/assets/sage_resting_01.png` and defines a full asset structure — but the folder doesn't exist yet.

---

### Proposed Clean Asset Structure

#### Clio

```
clio/assets/
├── README.md                          ← Rules, mood→file mapping
│
├── source/                            ← Full-res masters (1024×1024)
│   ├── stills/                        ← Static PNG mood states
│   │   ├── clio_resting_01.png
│   │   ├── clio_resting_02.png
│   │   ├── clio_resting_03.png
│   │   ├── clio_happy_01.png
│   │   ├── clio_curious_01.png
│   │   ├── clio_excited_01.png
│   │   ├── clio_thinking_01.png
│   │   ├── clio_encouraging_01.png
│   │   ├── clio_empathetic_01.png
│   │   └── pointing/                 ← Gesture variants
│   │       ├── clio_pointing_right_01.png
│   │       ├── clio_pointing_left_01.png
│   │       └── clio_pointing_down_01.png
│   │
│   └── clips/                         ← MP4/WebM animations
│       ├── transitions/               ← Mood-to-mood
│       │   ├── clio_transition_resting_to_curious.mp4
│       │   ├── clio_transition_resting_to_happy.mp4
│       │   └── ... (per overlay spec)
│       ├── gestures/                  ← Action clips
│       │   ├── clio_gesture_nod_01.mp4
│       │   ├── clio_gesture_react_success_01.mp4
│       │   └── clio_gesture_point_right_01.mp4
│       └── idle/                      ← Looping idle states
│           ├── clio_idle_01.mp4
│           └── clio_idle_02.mp4
│
├── app/                               ← Mobile exports (pre-sized PNGs)
│   ├── 32/                            ← FAB compose-bar inline
│   ├── 48/                            ← FAB resting
│   ├── 80/                            ← Prominent mode
│   └── 120/                           ← Walkthrough slides
│
└── web/                               ← WebP/optimised for landing pages
```

#### Sage (New — create this)

```
sage/assets/
├── README.md                          ← Same structure as Clio's
│
├── source/
│   ├── stills/
│   │   ├── sage_grounded_01.png       ← Default (Arc A-C)
│   │   ├── sage_engaged_01.png        ← Arc B-D
│   │   └── sage_observing_01.png      ← Arc E
│   │
│   └── clips/
│       ├── sage_idle_grounded_01.mp4  ← 3s breathing loop
│       ├── sage_transition_grounded_to_engaged.mp4
│       └── sage_transition_engaged_to_observing.mp4
│
└── app/
    └── 40/                            ← Sage's only render size
```

> [!IMPORTANT]
> Sage has **only 3 moods** (Grounded, Engaged, Observing) and **only 1 size** (40px). Her asset folder is much smaller than Clio's. This is correct and intentional — she is a room presence, not a stage presence.

---

### Naming Convention (Both Agents)

```
{agent}_{type}_{variant}.{ext}

agent:   clio | sage
type:    resting | happy | curious | excited | thinking | encouraging | empathetic
         grounded | engaged | observing (Sage only)
         transition_{from}_to_{to}
         gesture_{action}
         idle
         pointing_{direction}
variant: 01 | 02 | 03
ext:     png (stills) | mp4 (clips)
```

**All lowercase. Underscores only. No spaces, no capitals, no `_final_fixed`.**

---

### Cleanup Actions Needed

| Action | File | What To Do |
|---|---|---|
| **Rename** | `resting01.png` | → `clio_resting_01.png`, move to `source/stills/` |
| **Rename** | `resting02_final_fixed.png` | → `clio_resting_02.png`, move to `source/stills/` |
| **Rename** | `Curious.mp4` | → `clio_transition_resting_to_curious.mp4` or `clio_curious_idle.mp4` (verify intent), move to `source/clips/` |
| **Rename** | `Happy.mp4` | → classify and rename per convention |
| **Rename** | `Happy_and_Satisfied.mp4` | → `clio_happy_idle_01.mp4` or `clio_proud_01.mp4` — decide which mood |
| **Rename** | `Listening.mp4` | → Map to closest mood (Empathetic? Thinking?), rename |
| **Rename** | `Resting_to_Encouraging.mp4` | → `clio_transition_resting_to_encouraging.mp4`, move to `source/clips/transitions/` |
| **Rename** | `Resting_to_Encouraging_2.mp4` | → `clio_transition_resting_to_encouraging_02.mp4` |
| **Rename** | `Resting_to_empathy.mp4` | → `clio_transition_resting_to_empathetic.mp4` |
| **Remove** | `aggilo-soul.html` | Move to `docs/_archived/` — not an asset |
| **Create** | `sage/assets/` | Create entire folder structure per Sage spec |

---

## Part 2 — Persona Architecture

### How The System Works Today

```
┌──────────────────────────────────────────────────────────────────┐
│                     CLIO'S PERSONA                               │
│                                                                  │
│  Scope: PER USER (demographic-based)                            │
│  Source: clio/personas/{demographic}/IDENTITY.md                 │
│  Selection: User age bracket from AGGIL profile → persona       │
│  Loading: Yantra soul_loader reads IDENTITY.md at dispatch      │
│  Effect: Changes Clio's vocabulary, tone, emoji, cultural refs  │
│  Does NOT change: SOUL.md core character, beliefs, boundaries   │
│                                                                  │
│  4 Personas defined:                                             │
│  ├── Explorer (13-17)     [draft]                               │
│  ├── Campus (18-24)       [active] ← only one live              │
│  ├── Momentum (25-35)     [draft]                               │
│  └── Anchor (36-50+)      [draft] ← also the fallback          │
│                                                                  │
│  Clio speaks to User A (age 20) in Campus register              │
│  Clio speaks to User B (age 34) in Anchor register (fallback)   │
│  Both users may be in the same cluster                           │
└──────────────────────────────────────────────────────────────────┘
          │
          │ Clio introduces Sage, passes handoff packet
          │ (includes aggregate tone_signals across cluster members)
          ▼
┌──────────────────────────────────────────────────────────────────┐
│                     SAGE'S PERSONA                               │
│                                                                  │
│  Scope: PER CLUSTER (cluster-global, NOT per user)              │
│  Source: 3 options (priority order):                             │
│    1. Clio aggregate tone_signals across members → top 2 adopt  │
│    2. Cluster purpose → default register table                  │
│    3. Observe-and-create (neutral for 14 days, then formalize)  │
│  Storage: sage_personas table (1 row per cluster)               │
│  Effect: Changes Sage's register, formality, interjection freq  │
│  Does NOT change: SOUL.md principles, name, cluster scope       │
│                                                                  │
│  Key distinction:                                                │
│  - Clio has 1 persona per USER → different users get different  │
│    Clio voices in the same cluster                               │
│  - Sage has 1 persona per CLUSTER → all users in a cluster     │
│    see the EXACT same Sage                                       │
└──────────────────────────────────────────────────────────────────┘
```

### The Handoff: Clio → Sage Persona Signal

1. **Clio completes handoff** — passes `cluster_purpose` and aggregate `tone_signals`
2. **Sage resolves persona** — from aggregate tone or purpose table
3. **Sage sends `persona_confirmed` signal back to Clio** — includes `persona_description`, `cluster_current_activity`, `suggested_intro_framing`
4. **Clio uses signal to write introduction** — in Clio's voice, 3 sentences max, names what Sage does
5. **For new members joining later** — if persona has evolved, Sage re-sends signal to keep Clio's introduction current

### The Key Question: Does Sage Need Demographic Personas Like Clio?

**Currently: No.** Sage's persona is cluster-global — derived from the cluster's tone and purpose, not from individual user demographics. This is a deliberate design choice documented in `SAGE_SKILLS.md`:

> *"Sage does not adapt her persona based on who she is talking to in any given moment. She adapts based on how the **cluster as a whole** is evolving."*

**Should she? Also no.** Here's why:

| Reason | Explanation |
|---|---|
| **Sage posts are public** | Every member sees the same post. Per-user voice would be visible inconsistency. |
| **Clusters are AGGIL-gated** | Clusters already filter by age, so a cluster's demographic is relatively homogeneous. The cluster-level persona captures the dominant register naturally. |
| **Clio already handles individual adaptation** | Clio speaks to each user privately with the right demographic persona. Sage speaks to the group. Different domains. |
| **Persona evolution covers drift** | As cluster composition shifts over months, Sage's persona evolves along formality/specificity/frequency axes. |

---

### Gaps Identified

#### Gap 1: Sage Has No Asset Folder

`sage_image_prompts.md` defines the visual identity and references `sage/assets/sage_resting_01.png` — but the folder doesn't exist. This blocks visual implementation.

> **Fix:** Create `sage/assets/` with the structure proposed above. Generate `sage_grounded_01.png` using the Universal Base Prompt from `sage_image_prompts.md`.

#### Gap 2: Clio Source Files Don't Follow Spec Naming

The overlay spec (`clio_overlay_prompt.md`) references files like `clio_resting_01.png` — actual files are `resting01.png`, `Curious.mp4`, etc. This will cause 404s at implementation time.

> **Fix:** Rename all files per the naming convention above, reorganize into `stills/` and `clips/` subdirectories.

#### Gap 3: `aggilo-soul.html` Is Misplaced

A rendered HTML file is sitting inside `clio/assets/source/` — it's not a visual asset.

> **Fix:** Move to `docs/_archived/` or `yantra/guides/`.

#### Gap 4: Clio's Persona Registry Has Only 1 Active Persona

3 of 4 personas are `draft`. Only Campus (18-24) is active. Users outside the 18-24 bracket will all fall back to the Anchor register — which itself is also in draft.

> **Fix (pre-launch):** Finalize and activate at least Anchor (36-50+) as the safe fallback. Momentum (25-35) should be next priority given the target demographic is "urban 18-35 year-olds."

---

## Decisions Needed

1. **Create `sage/assets/` folder structure now?** (Prepares for visual generation)
2. **Rename and reorganize Clio source files now?** (The raw clips in `source/` are production masters — renaming is safe but should be confirmed before other tools depend on current names)
3. **Move `aggilo-soul.html` out of assets?**
4. **Prioritize Momentum persona activation?** (25-35 is core target)
