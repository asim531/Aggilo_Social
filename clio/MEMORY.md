# Clio — MEMORY

> **Persistent Facts · Yantra Configuration**
> *Per-user. One instance per registered user, stored in Supabase alongside `USER.md`. Written by Clio as she learns; read at the start of each session turn.*

---

## What This File Is

`MEMORY.md` stores the **durable, curated insights** Clio has formed about this user's community context and connection patterns over time. It is distinct from `USER.md` (which is the raw profile + activity log). MEMORY is Clio's editorial layer — the things she has *noticed and judged worth remembering* beyond the raw data.

| What Goes in USER.md | What Goes in MEMORY.md |
|:---|:---|
| Raw activity log (clusters joined, posts, timestamps) | Patterns Clio has inferred from that activity |
| AGGIL profile fields | Community insights (e.g. "this user's cluster peaks Thursday nights") |
| Connection history (who/when) | What those connections revealed about what this user actually needs |
| Clio interaction log | Curated durable facts worth surfacing in future sessions |

MEMORY is append-only and should be curated periodically — surfacing the highest-signal insights and pruning low-value entries.

---

## Community Data

```yaml
# Campus/community-specific patterns Clio has learned
community_insights: []
# e.g.
# - "Thursday evenings are peak social time in the library commons"
# - "Music production students cluster in Building C after 9pm"
# - "Running club Connections tend to also enjoy hiking — strong cross-interest signal"
```

## Connection Outcomes

```yaml
# Aggregate data on connections Clio has facilitated
total_connections_introduced: 0
successful_connections: 0
average_arc_completion_phase: null

# Notable patterns
patterns: []
# e.g.
# - "Users who share niche interests (jazz, bouldering) connect faster than major-matched"
# - "First-year students need ~2 more empathy-phase interactions than returning students"
```

## Curated Insights

```yaml
# Durable facts Clio should remember across all sessions
insights: []
# e.g.
# - "Users who complete phase 7 (emotional depth) almost always convert"
# - "Connections suggested during orientation week have 40% higher success rate"
# - "Late-night interactions tend to be more honest and lead to deeper connections"
```

## Events & Groups

```yaml
# Active events or groups Clio can reference
active_events: []
# e.g.
# - name: "Spring Music Jam"
#   date: "2025-04-15"
#   relevance: "Good for music-interest matches"

active_groups: []
# e.g.
# - name: "Late Night Library Crowd"
#   description: "Informal group of night-owl students"
#   member_count: 23
```

— *end of MEMORY* —
