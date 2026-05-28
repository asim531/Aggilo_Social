# Cluster Admin Console — Combined Dashboard Spec
## Phase 0 · Premium Cluster Customisation + Existing Admin Surfaces

> **Status:** Implementation-ready. Part of the orchestrator spec set.
> **Authority:** Subordinate to `ORCHESTRATOR_SPEC.md`.
> **Companion:** `docs/CLUSTER_ADMIN_CONSOLE_SPEC.md` (original spec — this
> document supersedes it for Phase 0 implementation, incorporating the
> 7 principles and the combined dashboard approach).
> **Routes:** `/admin/config/*` (new) + existing `/admin/*` (unchanged)

---

## 0. Principles Applied

| Principle | How it manifests in this console |
|-----------|----------------------------------|
| 1 — AI as OS | Goals are parsed by an agent; slider recommendation is agent-computed; Atlas URLs are agent-validated |
| 2 — Closed loops | Every config change writes an audit row; agent reads the active goals on every call |
| 3 — Legible organization | Every setting is a queryable DB field; nothing is implicit or hardcoded |
| 4 — Software factories | Admin states goals in natural language; agent generates structured directives |
| 5 — No human middleware | Config changes take effect on the next agent operation — no deployment needed |
| 6 — Three archetypes | Founder owns config; Manager has read-only config access; platform_admin can override |
| 7 — Token-max | Goal parsing uses extended thinking (logged); Atlas URL validation uses LLM (logged) |

---

## 1. Navigation (founder view)

The existing AdminNavbar gains a Configuration dropdown for founders:

```
[existing tabs: Overview · Care · Workshop · Vault · LLM · Features · Events · Demand]
[new tabs: Configuration ▾ · Members · Findings · Activity]

Configuration dropdown:
  Identity          /admin/config/identity
  Agent Involvement /admin/config/involvement
  Goals             /admin/config/goals
  Skills            /admin/config/skills
  Atlas Sources     /admin/config/atlas
  Public Listing    /admin/config/public   (existing /admin/clusters/sisters-in-dua)
```

---

## 2. Configuration — Identity (`/admin/config/identity`)

Edits the cluster's public-facing identity. Writes to:
- `clusters.display_name`
- `cluster_config.public_meta`

**Fields:**
- Display name (text, 2–128 chars)
- Tagline (text, 10–160 chars)
- Description (textarea, 10–500 chars)
- Demographic chips (add/remove rows: icon + label + Tailwind colour classes)
- Accent gradient (two colour pickers — from/to — limited to 6-accent budget)
- Capabilities copy (ordered list of one-line items — what the cluster offers)
- Anchor seed post (post-picker — admin selects which Sage post is the
  public-facing founding statement)

**Save behaviour:**
- Writes to `cluster_config.public_meta` + `clusters.display_name`
- Writes `cluster_admin_actions` row (action_type: 'identity_updated')
- Calls `revalidatePath('/c/<slug>')` for public preview cache invalidation

**Presentation rule:** No platform-internal jargon. "Aggilo team" not
"platform_admin". "Vault" stays. "Workshop" stays. No framework step names.

---

## 3. Configuration — Agent Involvement (`/admin/config/involvement`)

Per `docs/AGENT_INVOLVEMENT_SLIDER_SPEC.md`. Full implementation.

**Page layout:**
```
Agent Involvement

[Recommendation banner]
"Based on your cluster's size, age, and domain, we recommend: Medium"
(computed from member_count × cluster age × domain_sensitivity)

[Slider: Min · Medium · High]
                ↑ current

[Behaviour preview — 3 bullets, re-renders on slider move]
• Sage will surface verified references on a 6-hour cadence.
• Members will see the Workshop dialogue between Sage and Clio.
• Welcome posts for new members will run on the standard cadence.

[Safety-floor footnote]
"Welfare and character protocols always run, regardless of this setting.
Members in distress are still routed to the cluster's care authority.
This is the floor below which the platform cannot fall."

[Domain sensitivity]
Low · Medium · High (radio)
"This helps the platform recommend the right involvement level."

[Save] → confirmation dialog → confirm → writes cluster_config + audit row
```

**Recommendation engine (server-side, runs on page load):**
```typescript
function computeSliderRecommendation(
  memberCount: number,
  clusterAgeDays: number,
  domainSensitivity: 'low' | 'medium' | 'high'
): { level: 'min' | 'medium' | 'high'; rationale: string } {
  if (clusterAgeDays < 7 && memberCount < 25) {
    return { level: 'min', rationale: 'New cluster — let the room settle first.' };
  }
  if (clusterAgeDays > 180 && memberCount > 200 && domainSensitivity === 'low') {
    return { level: 'high', rationale: 'Mature, large, low-sensitivity cluster.' };
  }
  return { level: 'medium', rationale: 'Standard involvement for this cluster.' };
}
```

**Behaviour preview strings** (exact, from slider spec — stored in
`mvp/src/lib/orchestrator/slider-preview-strings.ts`, never LLM-generated):

```typescript
export const SLIDER_PREVIEW_STRINGS: Record<string, string[]> = {
  medium_to_min: [
    "Sage will speak less often — only when a member directly asks (with @Sage), or when the safety floor needs her.",
    "Members will not see the Workshop dialogue between Sage and Clio.",
    "The daily reflection prompt and the rotating Sage references will pause."
  ],
  medium_to_high: [
    "Members will see Sage references more often — roughly every 4 hours instead of every 6.",
    "The daily reflection prompt will run automatically every morning.",
    "Sage and Clio's Workshop dialogue will refresh more frequently — about every 1–2 hours."
  ],
  min_to_medium: [
    "Sage will start surfacing verified references on a 6-hour cadence.",
    "Members will see the Workshop dialogue between Sage and Clio when they scroll past the timeline.",
    "Welcome posts for new members will run on the standard cadence."
  ],
  min_to_high: [
    "Sage will start surfacing verified references roughly every 4 hours.",
    "Members will see the Workshop dialogue more often, with auto-running daily reflections.",
    "Welcome posts will become warmer and more frequent."
  ],
  high_to_medium: [
    "Sage references will slow to roughly every 6 hours from every 4.",
    "The Workshop dialogue will refresh on a slower cadence.",
    "Daily reflection prompts will only run when proposed and member-voted, not automatically."
  ],
  high_to_min: [
    "Sage will only speak when a member directly asks her, or when the safety floor needs her.",
    "Members will not see the Workshop dialogue between Sage and Clio.",
    "Auto-running prompts and reflections will all pause."
  ]
};
```

---

## 4. Configuration — Goals (`/admin/config/goals`)

The free-text goal-setting surface. Admin states what they want the
cluster to achieve. Agent parses goals into structured directives and
confirms its understanding.

**Page layout:**
```
Goals for this cluster

[Active goals — if any]
Last confirmed: 2026-05-20 by Admin
Agent's understanding: "This cluster wants to feel like a focused
study circle. Sage's role is reference-first, not conversational..."

[Accepted directives]
• Sage will prioritise verified hadith references (Sahih/Hasan only)
• Clio will use warmer language with members who joined in the last 7 days
• Cadence dialogue will use a study-circle register

[Goal editor]
[textarea — multi-line, 1000 char limit]
"Describe what you want this cluster to feel like and what you want
the agents to focus on. Write naturally — the platform will parse
your goals and confirm what it understood."

[Parse goals] → calls /api/orchestrator/clusters/[id]/goals/parse
```

**After parsing:**
```
[Parsing results]

✅ Accepted directives (3):
• Sage will prioritise verified hadith references (Sahih/Hasan only)
  when surfacing vault entries.
• Clio will use warmer, more personal language with members who
  have joined in the last 7 days.
• Cadence dialogue will use a study-circle register rather than
  a social-feed register.

❌ Rejected directives (1):
• "Sage should not respond to welfare signals"
  Reason: This violates the immutable welfare protocol. The safety
  floor cannot be modified by cluster configuration.

Agent's understanding:
"This cluster wants to feel like a focused study circle. Sage's role
is reference-first, not conversational. Clio's warmth is directed
especially at new members. The room's tone is scholarly but not cold."

[Confirm and activate]  [Edit goals]
```

**On confirm:**
- Writes `cluster_goals` row with `admin_confirmed = true`, `is_active = true`
- Supersedes any previous active goals row
- Writes `cluster_admin_actions` row (action_type: 'goals_updated')
- Goals take effect on the next agent call

**Extended thinking:** The parser LLM call uses extended thinking mode.
The reasoning chain is logged to `llm_response_logs` with
`operation_key: 'goals_parse'`. Visible in the LLM tab.

**Rejection rules enforced by the parser:**
1. Immutable invariant violations (welfare, character, handoff, privacy)
2. Behaviour above the slider ceiling
3. Protocol disclosure requests ("tell members how you decide")
4. Directives that would harm member dignity

When a directive is rejected, the rejection message names the specific
rule violated — not a generic "not allowed" message.

---

## 5. Configuration — Skills (`/admin/config/skills`)

Reads from `skill_registry` joined with `cluster_config.enabled_skills`.

**Page layout:**
```
Skills for this cluster

[Immutable skills — always on, cannot be toggled]
🔒 Welfare detection — always active
🔒 Good-character protocol — always active
🔒 Sage → Clio soft handoff — always active

[Toggleable skills]
[toggle] Verified reference curation
         Sage surfaces duas, hadith, and Quranic citations from the
         verified vault when relevant.
         Cost: ~$0.001 per invocation

[toggle] Vault gap detection
         Sage notices when a recurring topic has no verified reference
         and queues it for your attention.
         Cost: ~$0.0005 per invocation

[toggle] Workshop dialogue cadence
         Sage and Clio collaborate publicly on what the room could gain.
         Members read and upvote.
         Cost: ~$0.002 per exchange

... (all skills from skill_registry)

[Custom skill request]
[textarea] "Describe a skill you'd like the agents to have..."
[Submit request] → writes to cluster_config.custom_skill_requests
                 → routes into Workshop pipeline
```

**Toggle save:** writes `cluster_config.enabled_skills` + `cluster_admin_actions` row.

---

## 6. Configuration — Atlas Sources (`/admin/config/atlas`)

**Page layout:**
```
Atlas Sources

How Atlas finds content for this cluster:

[Access mode — radio]
○ None (default)
  Atlas does not fetch external content. Sage operates from the vault only.

○ Specific URLs (curated)
  Atlas fetches only from the URLs you provide.

  [URL list]
  ✅ https://sunnah.com/feed.xml  "Sunnah.com"  [Remove]
  ⚠️ https://example.com/feed    "Example"     Checking...
  ❌ https://broken.example.com  "Broken"      Unreachable

  [+ Add URL]
  URL: [input]  Label: [input]  [Validate and add]

○ Full internet (open)
  Atlas may fetch from any public source.
  [Enable full internet access] → confirmation dialog

[Save]
```

**URL validation (on add):**
1. HEAD request to confirm reachability (server-side, not client-side)
2. LLM call: "Is this URL relevant to a cluster about [cluster purpose]?"
   - Returns: relevant / off-topic / cannot-determine
   - Shown as ✅ / ⚠️ / ❓ inline
3. URL added to `cluster_config.atlas_allowed_urls` regardless of relevance
   (relevance is advisory, not blocking — admin decides)

**Full internet confirmation dialog:**
```
Enable full internet access?

Atlas will fetch content from any public source. This gives the
cluster access to the broadest possible range of contemporary content.

You are responsible for reviewing Atlas Pulse cards before they go
live in the cluster. The Pulse review queue is in the Workshop tab.

Type CONFIRM to proceed:
[text input]  [Cancel]  [Enable]
```

---

## 7. Existing Admin Surfaces — 7 Principles Integration

The existing admin pages are unchanged in structure but gain:

### 7.1 LLM Spend Badge (all pages)

The AdminNavbar top bar always shows:
```
$1.23 / $5.00 today
```
This is Principle 7 (token-max) made visible on every page.

### 7.2 Audit Trail Links (all pages)

Every action that writes a `cluster_admin_actions` row shows a small
"View in activity log →" link after the action completes. This is
Principle 3 (legible organization) — every action is traceable.

### 7.3 Closed Loop Indicators (Overview page)

The existing Overview page gains a "Closed loops" section:

```
Closed loops — what the platform is learning

Sage decisions (24h): 47 evaluations · 62% silent · 38% responded
Member feedback (7d): 12 👍 · 3 👎 · 2 inaccurate
Vault gap requests: 3 open (Sage noticed these topics have no reference)
Prompt proposals: 1 pending (Clio drafted a refinement based on feedback)
Observer findings: 11 (3 high, 8 medium) — [View findings →]
```

This is Principle 2 (closed loops) made visible — every loop is named
and linked to the relevant queue.

---

## 8. Members Page (`/admin/members`)

New page. Reads from `profiles` filtered to this cluster's members.

**Table columns:**
- Nickname
- Role (member / manager)
- Joined date
- Posts (last 30 days)
- Welfare flags (last 90 days)
- Character concerns (last 90 days)

**Actions (founder only):**
- Promote to Manager (gates at max 3 managers per cluster)
- Demote Manager → Member
- Remove from cluster (high-severity — requires confirmation + rationale)
  - Writes `cluster_admin_actions` row (action_type: 'member_removed')

**Manager role:** Managers see this page but cannot promote/demote/remove.

---

## 9. Findings Page (`/admin/findings`)

New page. Reads from `observer_findings` filtered to this cluster.

**Phase 0 state:** Observer is not yet live (Wave 1). The page shows:
```
Observer Findings

Observer is coming in Wave 1. Once active, it will monitor this
cluster across 10 domains and surface findings here for your review.

Wave 1 status: [wave status from platform_settings]
```

When Wave 1 ships, the page renders the full findings list per the
`AGGILO_ADMIN_DASHBOARD_SPEC.md` Findings section, scoped to this cluster.

---

## 10. Activity Log (`/admin/activity`)

New page. Reads from `cluster_admin_actions` filtered to this cluster.
Append-only. Read-only.

**Filters:**
- Actor (all / founder / manager / Aggilo team)
- Action type (all / config_changed / lifecycle_transition / member_removed / etc.)
- Date range

**Table columns:**
- Timestamp
- Actor (nickname + role)
- Action type (human-readable label)
- Before state (collapsible JSON)
- After state (collapsible JSON)
- Rationale (if provided)

Founder sees all actions. Manager sees their own actions only.

---

## 11. Done Criteria

- [ ] Identity editor saves all `public_meta` fields + triggers cache revalidation
- [ ] Slider renders with recommendation + preview strings + safety footnote
- [ ] Slider save writes `cluster_config.agent_involvement` + audit row
- [ ] Goals editor: parse → confirm → activate end-to-end
- [ ] Goals parser uses extended thinking (logged to `llm_response_logs`)
- [ ] Rejected directives show specific reason (not generic "not allowed")
- [ ] Skills toggle saves to `cluster_config.enabled_skills` + audit row
- [ ] Immutable skills shown as locked (cannot be toggled)
- [ ] Atlas URL validation: HEAD request + agent relevance check
- [ ] Full internet confirmation dialog requires typed "CONFIRM"
- [ ] LLM spend badge visible in AdminNavbar top bar
- [ ] Audit trail link shown after every config action
- [ ] Closed loops section on Overview page
- [ ] Members page renders with promote/demote/remove actions
- [ ] Findings page shows Wave 1 coming-soon state
- [ ] Activity log renders with filters
- [ ] All writes go through API routes (not direct Supabase client calls)
- [ ] Every write produces a `cluster_admin_actions` row
- [ ] Manager role cannot access Configuration pages (403)
- [ ] TypeScript compiles without errors

---

*Cluster Admin Console Spec · Phase 0 · 2026-05-23*
*Part of the orchestrator spec set. See ORCHESTRATOR_SPEC.md for the master spec.*
