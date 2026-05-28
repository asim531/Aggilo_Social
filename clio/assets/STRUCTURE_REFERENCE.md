# Aggilo Asset Structure Reference

> **Canonical media folder structure for Clio and Sage.**
> *Preserved for reference even if some files do not yet exist.*

## Clio Asset Structure

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
│           ├── clio_idle_resting_01.mp4
│           └── clio_idle_happy_01.mp4
│
├── app/                               ← Mobile exports (pre-sized PNGs)
│   ├── 32/                            ← FAB compose-bar inline
│   ├── 48/                            ← FAB resting
│   ├── 80/                            ← Prominent mode
│   └── 120/                           ← Walkthrough slides
│
└── web/                               ← WebP/optimised for landing pages
```

## Sage Asset Structure

```
sage/assets/
├── README.md                          ← Rules, mood→file mapping
│
├── source/                            ← Full-res masters (1024×1024)
│   ├── stills/                        ← Static PNG mood states
│   │   ├── sage_grounded_01.png       ← Default (Arc A-C)
│   │   ├── sage_engaged_01.png        ← Arc B-D
│   │   └── sage_observing_01.png      ← Arc E
│   │
│   └── clips/                         ← MP4/WebM animations
│       ├── sage_idle_grounded_01.mp4  ← 3s breathing loop
│       ├── sage_transition_grounded_to_engaged.mp4
│       └── sage_transition_engaged_to_observing.mp4
│
└── app/                               ← Mobile exports
    └── 40/                            ← Sage's only render size
```

## Naming Convention

All generated media MUST follow this convention to avoid 404s at runtime:

```
{agent}_{type}_{variant}.{ext}

agent:   clio | sage
type:    resting | happy | curious | excited | thinking | encouraging | empathetic
         grounded | engaged | observing (Sage only)
         transition_{from}_to_{to}
         gesture_{action}
         idle_{mood}
         pointing_{direction}
variant: 01 | 02 | 03
ext:     png (stills) | mp4 (clips)
```

**All lowercase. Underscores only. No spaces, no capitals.**
