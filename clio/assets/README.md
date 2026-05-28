# Clio — Visual Assets

> Canonical visual identity for Clio. All implementations (landing page, app, marketing) MUST reference these assets.

## Directory Structure

```
source/     ← Full-res master PNGs (transparent background)
web/        ← Optimised WebP for landing page
app/        ← Sized PNGs for mobile app (32, 48, 80, 120px)
```

## Moods

| Mood | Filename | Eye Shape | Ears | Screen Effect |
|---|---|---|---|---|
| Resting | `clio_resting.*` | Soft oval, tracking | Relaxed | None |
| Happy | `clio_happy.*` | Inverted crescent (smiling) | Soft, outward | Warm peach tint (0.04 opacity, 3s) |
| Excited | `clio_excited.*` | Wide circles, dilated pupils | Perked upward, teal glow bright | Teal pulse ring + wash (2s) |
| Curious | `clio_curious.*` | Asymmetric, one narrower | One tilted, one upright | Vignette (edges darken 3-5%) |

## Rules

1. **Always use transparent-background versions** — never bake in a background
2. **Never stretch or skew** — use the nearest pre-exported size
3. **Mood swaps use crossfade** — 200ms opacity transition, never instant swap
4. **Resting is default** — load Resting first, swap to other moods as needed
5. **Screen effects respect `prefers-reduced-motion`** — see implementation plan
