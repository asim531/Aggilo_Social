# Clio — USER

> **Per-User Context Template · Yantra Configuration**
> *One instance per registered user. Created at account registration. Populated and updated continuously by the Laravel backend + Yantra across all sessions.*

---

## What This File Is

`USER.md` is the complete context record for a single registered Aggilo user. It contains:
- Their full AGGIL profile (age, gender, geography, interests, languages)
- All platform activity with timestamps (clusters joined/created, posts, DMs, Clio interactions)
- Clio's accumulated observations about this person
- The connection history Clio has facilitated for them

It is **read** by Yantra at the start of every Clio session turn and **written back** at completion (via Supabase). Yantra itself holds no in-memory state between turns.

## Lifecycle

| Event | Action |
|:---|:---|
| User completes registration | Record created. AGGIL fields populated from onboarding inputs. `arc_phase: 1`. |
| Each Clio session turn | Full record read from Supabase → injected into context → Clio responds → updated record written back |
| User joins / creates cluster | Cluster IDs appended to activity log with timestamp |
| User ages into a new bracket | `demographic` field updated → new persona's `IDENTITY.md` loaded at next session. All prior data unchanged. Clio's register shifts; her memory of the person does not. |
| Premium upgrade | `subscription_tier` flipped to `premium`; persistent memory and people-matching features activate |

---

## User Profile

```yaml
user_id: null
demographic: null          # e.g. "campus_18_24", "momentum_25_35"
active_persona: null       # resolved from demographic → personas/<demographic>/IDENTITY.md
subscription_tier: free    # "free" or "premium" — drives AGENTS.md tier logic
languages:
  primary: null            # e.g. "English"
  secondary: null          # e.g. "Telugu" — core AGGIL dimension, injected into every Clio response
location: null             # city/area/building — AGGIL geography dimension
```

## Personal Context

```yaml
# Persona-adaptive fields — populated based on the active IDENTITY.md
# Campus (18-24): year, major, campus_name
# Momentum (25-35): role, industry, career_stage
# Anchor (36-50+): expertise, sector, mentorship_interest
# Explorer (13-17): school_level, hobbies, parental_consent
context_fields: {}
interests: []
looking_for: null          # What the user said they want
optional_note: null        # Free-text the user shared directly with Clio
```

## Relationship Arc State

```yaml
arc_phase: 1               # Current phase (1-10), see AGENTS.md for advancement rules
last_phase_change: null
phase_history: []           # Timestamped log of phase transitions
```

## Personality Signals

```yaml
# Observations Clio has made about this user during interactions
signals: []
# e.g.
# - "Prefers late-night interactions"
# - "Responds well to humour"
# - "Cautious about meeting new people — needs more empathy phase time"
```

## Connection History

```yaml
# People Clio has introduced this user to
connections:
  # - matched_user_id: "xxx"
  #   introduced_at: "2025-XX-XX"
  #   outcome: "connected" | "no_response" | "declined"
  #   clio_confidence: 0.0-1.0
```

## Interaction Log

```yaml
# Summary of key interaction moments (not raw messages)
interactions:
  # - date: "2025-XX-XX"
  #   phase: 3
  #   note: "User opened up about feeling isolated — advanced to empathy phase"
```

— *end of USER template* —
