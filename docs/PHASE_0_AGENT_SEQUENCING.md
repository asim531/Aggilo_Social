# Phase 0 Agent Sequencing — Atlas, Scout, Observer

> **Status:** Sequencing plan for Phase 0. Authoritative.
>
> **Authority:** Founder direction (2026-05-22) — Atlas, Scout, and
> Observer are Phase 0 infrastructure, not Phase 1 deferrals. Their
> roles are platform-wide (premium AND generic clusters), not pilot-
> specific.
>
> **Predecessors:** `atlas/AGENTS.md`, `scout/AGENTS.md`,
> `observer/AGGILO_OBSERVER_AGENTS.md`,
> `architecture/AGENT_COMMUNICATION_CONTRACT.md`,
> `architecture/AGENT_RUNTIME.md`.

---

## What this document supersedes

A senior-UX/behavioural review proposed mothballing Atlas, Scout, and
Observer until later phases. The founder rejected the proposal:

> *"Scout was supposed to be the eyes and ears of Clio and Atlas was
> supposed to be the same for Sage … these are essential for
> contemporary content, discussions and real-time engagement. Currently
> I may need Scout to do its work so that I may discover more niche
> cluster types for Phase 0 and I need Atlas to make the discussions in
> the cluster contemporary and meaningful."*

And on Observer:

> *"As per the 7 principles all user moves are supposed to be captured
> and this is what Observer was meant to do."*

**Confirmed:** Observer is Principle 2 (closed loops) made into a
runtime agent. It is foundational, not optional.

This document sequences the three for Phase 0 ship. The agents'
internal AGENTS.md files remain the source of truth for behaviour;
this document is the calendar.

---

## The sequencing rule

Ship in this order, with no agent advancing until the previous one is
running on production data:

```
Wave 1: Observer (read-only, lowest external risk)
    ↓
Wave 2: Scout (intelligence reads from public communities)
    ↓
Wave 3: Atlas (content fetch from external sources)
```

**Why this order:**

- **Observer first** — reads existing platform data only; zero
  external dependencies; produces the dashboard you use to evaluate
  every later agent's performance.
- **Scout second** — adds external reads (Reddit, LinkedIn, Twitter)
  but does not act; produces intelligence reports that Clio uses to
  inform cluster recommendations and that the platform team uses to
  decide which generic cluster to spin up next.
- **Atlas third** — most external dependencies (RSS feeds, scraping
  proxies, content-source curation); ships after the runtime layer is
  proven by Wave 1 and Wave 2.

---

## Wave 1 — Observer

### Scope

All 10 domains shipped to the admin dashboard:

1. Cluster Health
2. User Growth, Retention, and Churn
3. Monetisation Gaps
4. Crowdfund Opportunities
5. Agent Performance
6. Content Gaps
7. Underserved Demographics
8. Abuse, Fraud, and Safety
9. Scout Prospect Pipeline (will be empty until Wave 2 ships)
10. Tool Analysis Triggers (will be partially active — Atlas/Scout
    triggers wait for Waves 2/3)

### Done criteria

- [ ] `observer_findings` table live with schema per
      `observer/AGGILO_OBSERVER_AGENTS.md`
- [ ] `tool_proposals` table live
- [ ] `runtime_events` table live (per `architecture/AGENT_RUNTIME.md`)
- [ ] All 10 Observer jobs scheduled per the AGENTS.md cadence table
- [ ] Findings surface in the platform admin dashboard (per
      `docs/PLATFORM_ADMIN_DASHBOARD_SPEC.md`)
- [ ] Daily digest job produces a single summary email/notification at
      07:00
- [ ] Approval flow works end-to-end for at least one finding type per
      domain (smoke test)

### Behavioural validation

After Wave 1 ships, observe for 14 days before advancing to Wave 2:

- Are findings landing at expected severity distribution?
- Is the admin clearing the queue at a sustainable rate?
- Are `runtime_events` showing the full lifecycle of every job?
- Is `llm_response_logs` agent_performance signal feeding Domain 5
  cleanly?

If any answer is "no", fix in Wave 1 before Wave 2.

---

## Wave 2 — Scout

### Scope

Both modes shipped:

- **Mode A (Internet Signal Observation):** Reddit, LinkedIn, Twitter
  reads via the Data Acquisition Layer (per `system_implementation_prompt_part1.md` §2.5).
- **Mode B (LLM Inference):** runs alongside Mode A; confidence
  ceiling 0.70 enforced for inference-only findings.

### Done criteria

- [ ] `scout_intelligence_reports` table live with schema per
      `scout/AGENTS.md`
- [ ] `scout_calibration_history` table live
- [ ] `ScoutDiscoveryJob` runs weekly (Monday 03:00, low lane)
- [ ] `ScoutDirectedJob` accepts Clio-triggered requests
- [ ] `ScoutAccuracyCalibrationJob` runs monthly
- [ ] PII test passes on every report (paraphrased pattern, no
      attributable individuals)
- [ ] 20-post rule enforced — communities below threshold marked
      `insufficient_data`
- [ ] Reports surface in the admin dashboard (Demand Signals tab — see
      `docs/PLATFORM_ADMIN_DASHBOARD_SPEC.md`)
- [ ] Observer Domain 9 (Scout Prospect Pipeline) starts producing
      findings

### What Wave 2 produces for Phase 0

Per founder direction: *"I may need Scout to do its work so that I may
discover more niche cluster types for Phase 0."*

The first Scout discovery cycle — running against the platform's
current cluster inventory plus the geographic/interest scopes the
platform team specifies — should produce ≥3 actionable findings within
the first 30 days. Each finding becomes a candidate for the next
generic test cluster (`_test_generic_v2`, etc).

### Behavioural validation

After Wave 2 ships, observe for 30 days before advancing to Wave 3:

- Are reports passing the PII test consistently?
- Is the calibration job adjusting confidence in the expected
  direction?
- Has at least one Scout finding been actioned by the platform team?

---

## Wave 3 — Atlas

### Scope

All four content steps shipped:

1. Receive content brief from Sage
2. Determine optimal content format
3. Fetch existing real-world content from curated source list
4. Return scored card batch to Sage (or synthesis-mode fallback)

Iterative dialogue with Sage (max 3 rounds) live. Synthesis-mode
counter live. Tool-proposal trigger chain via Observer Domain 6 / 10
live.

### Done criteria

- [ ] All Atlas DB fields live (`cluster_pulse_cards`, `clusters`
      runtime fields, `cluster_polls.synthesis_feedback`)
- [ ] Atlas source list curated (initial set per `atlas/AGENTS.md` Crawl
      Sources table)
- [ ] Data Acquisition Layer wired (no direct HTTP / Puppeteer from
      Atlas)
- [ ] Shared crawl cache live (Redis-backed, 1h TTL)
- [ ] All four queue jobs scheduled per `atlas/AGENTS.md`
- [ ] LLM budget reservation enforced (30% of NIM, overflow to Groq)
- [ ] Pulse Timeline card surfaces in cluster shell when Sage approves
      with `autoGoLive=true`
- [ ] Pulse review queue surfaces in admin dashboard (per cluster)

### What Wave 3 produces for Phase 0

Per founder direction: *"I need Atlas to make the discussions in the
cluster contemporary and meaningful."*

Atlas turns Sage's Step 6 current-events fallback from a graceful-
failure pattern into a working capability. After Wave 3, when a
member asks Sage about current events, Sage has Atlas-fetched content
to ground a real reply (or synthesis-mode-flagged content with member
transparency).

### Behavioural validation

After Wave 3 ships, observe for 60 days:

- Atlas synthesis_mode rate (target <20%; Observer Domain 6 surfaces
  if it sustains higher)
- Sage editorial acceptance rate of Atlas batches (target >70% in
  round 1; iterations should improve, not degrade)
- Member feedback on Atlas-grounded posts (`agent_feedback.signal`)

---

## Cross-wave: when do agents become member-named?

Per founder direction earlier in the senior-UX review thread, agents
should be named to members **only when they ship**. Until each wave
lands:

- **Observer** — never named to members (it has no member-facing
  output; admin-only).
- **Scout** — never named to members (intelligence is internal; if
  Clio surfaces a recommendation derived from a Scout finding, the
  recommendation is in Clio's voice, not "Scout suggests…").
- **Atlas** — named to members only via "Pulse" framing (Atlas Pulse
  cards on the timeline). The agent itself is not named ("From Atlas:
  …"); the content is named ("From Sage" with Pulse styling).

When a wave ships, the agent's name appears in:

- Admin dashboard sections (where it's accurate)
- `runtime_events.agent` field (machine-only)
- Internal architecture docs (always)

---

## Dependencies between waves

| Wave | Hard dependencies | Soft dependencies |
|------|-------------------|-------------------|
| 1 (Observer) | Agent Runtime layer; `llm_response_logs`; `behavioural_events` | None |
| 2 (Scout) | Wave 1 (for Domain 9 feedback); Data Acquisition Layer | Multi-cluster registry (Wave 2 reports can target multi-cluster) |
| 3 (Atlas) | Wave 1 (for Domain 6 content gaps); Wave 2 (for Sage tool proposals via Observer Domain 10); Data Acquisition Layer; Shared crawl cache | None |

Hard dependencies are blocking. Soft dependencies are nice-to-have but
the wave ships without them.

---

## What Phase 0 looks like with all three live

```
Members in Sisters in Dua + 1+ generic test clusters
  ↓ post / interact / read
Sage / Clio operate live in each cluster
  ↓ all events
Observer reads every signal across all 10 domains
  ↓ findings
Admin dashboard shows live findings
  ↓ approves / rejects
Sage briefs Atlas for contemporary content (Wave 3)
Clio reads Scout intelligence for cluster recommendations (Wave 2)
  ↓ Pulse cards land in clusters / Clio recommends new cluster types to admin
Member experience deepens; platform team learns where to invest next
```

This is what Phase 0 looks like complete. From here, Phase 1's job is
generic-cluster self-serve, the Node/Fastify/BullMQ migration, and
the second premium partner cluster.

---

## Done-criteria summary

| Wave | Ship gate | Estimated duration |
|------|-----------|--------------------|
| Pre-Wave 1 | Agent Runtime canonical-named (V3.14 rename); BullMQ infra in dev | 1 week |
| Wave 1 (Observer) | All 10 domains live; admin dashboard surfaces findings | 3 weeks |
| Wave 1 → Wave 2 gate | 14 days of Observer data observed cleanly | 2 weeks |
| Wave 2 (Scout) | Both modes live; first directed job served; PII test passes | 3 weeks |
| Wave 2 → Wave 3 gate | 30 days of Scout findings; calibration job functioning | 4 weeks |
| Wave 3 (Atlas) | Full pipeline; first Atlas Pulse posted; admin queue live | 4 weeks |
| Phase 0 complete | All three running; ≥1 generic test cluster active | — |

Total: ~17 weeks from V3.14 to Phase 0 complete with all three
agents.

This is the realistic shape, not an aggressive estimate.

---

*Phase 0 sequencing record · 2026-05-22 · Maintained alongside Wave
ship dates. Update each Wave's done-criteria as work progresses.*
