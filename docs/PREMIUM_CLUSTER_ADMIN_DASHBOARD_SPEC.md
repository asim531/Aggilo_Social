# Premium Cluster Admin Dashboard — Implementation Spec

> **Scope:** The cluster-scoped admin dashboard. Used by the cluster's
> Founder (the human Admin) and Managers. Cluster-bounded — no
> cross-cluster reads.
>
> **Predecessor specs:**
> `architecture/premium_cluster_requirements.md`,
> `docs/AGENT_INVOLVEMENT_SLIDER_SPEC.md`,
> `docs/SUPERPROMPT_DESIGN_INTENT.md`,
> `docs/PLATFORM_ADMIN_DASHBOARD_SPEC.md` (companion).
>
> **Status:** Spec — implementation-ready. Built in a future session.

---

## Who this is for

| Role | Sees this dashboard? |
|------|----------------------|
| `platform_admin` | Yes (cross-cluster — uses platform dashboard for that) |
| `founder` (cluster Admin) | Yes — full access to their cluster |
| `manager` (cluster Manager) | Yes — partial access (welfare/care queue, limited config) |
| Member | No |

Access enforced at route + RLS layer. Founders see only `cluster_id`s
they admin; Managers see only those they manage.

---

## Top-level navigation

```
[Cluster Display Name] (selector if Founder admins multiple clusters)
├── Overview                  (the room at a glance)
├── Care queue                (welfare + character concerns; Manager has full access)
├── Workshop                  (cluster_features two-track + cadence exchanges)
├── Vault                     (verified references curator)
├── Pulse                     (Atlas Pulse review queue — Wave 3)
├── Demand                    (cluster-scoped demand signals)
├── Members                   (cluster member directory)
├── Configuration
│   ├── Identity              (display name, tagline, description, chips)
│   ├── Agent involvement     (the slider — see slider spec)
│   ├── Free-text guidance    (admin's voice refinements)
│   ├── Skills                (enabled-skills catalogue)
│   ├── Atlas feeds           (cluster's curated source list — Wave 3)
│   └── Public listing        (is_public_listed, public_meta editor)
├── Findings                  (this cluster's Observer findings)
└── Activity log              (cluster_admin_actions for this cluster)
```

Default landing page is **Overview**.

Manager role hides: Configuration (all sub-pages), Activity log
(read-only access to a subset), Skills, Atlas feeds, Public listing.
Manager keeps: Care queue, Workshop, Vault, Pulse review, Demand,
Members, Findings.

---

## Overview

The room at a glance. Static for the current session — refresh on
page mount and on a 30-second interval.

### Top KPIs

```
[Members]   [Live now]   [Joined this week]   [Posts today]
   154        12               7                    23
```

Real-time-ish counts. Members and Live-now subscribe to the cluster's
presence channel (per `architecture/REALTIME_ENGAGEMENT_LAYER.md` §1).

### Open queues

```
🔴 Care queue: 2 open
🟠 Workshop proposals awaiting your decision: 4
🟡 Pulse cards awaiting Sage editorial review: 3      (Wave 3 only)
⚪ Findings about this cluster: 11 (3 high, 8 medium)
```

Each row links to the corresponding tab.

### Recent room snapshots

A 5-card horizontal scroller:

- **Last welfare flag** (timestamp, severity, "tap to open in care
  queue")
- **Last Sage post** (timestamp, post excerpt, link)
- **Last cadence exchange** (timestamp, link to Workshop)
- **Last Atlas Pulse** (Wave 3 only — timestamp, headline, status)
- **Last new member** (timestamp, nickname, "tap to send welcome")

These are the five things a Founder checks first when opening the
dashboard.

### Cluster vital signs

Single chart: post volume + Sage involvement + welfare flags over the
last 30 days. Not a vanity metric chart — the goal is to detect:

- Post volume cliff (sudden quiet)
- Sage involvement spike (Sage talking too much; check cadence)
- Welfare cluster (multiple flags in the same week)

These three patterns are the most actionable Founder-facing signals.

---

## Care queue

Reads from `welfare_notifications` + `character_concerns`, both
filtered to current cluster. Two tabs.

### Welfare

Default sort: unresolved first, then by `created_at` DESC.

Each row:

- **Severity dot** (high if self-harm pattern, medium otherwise)
- **Triggering content** (excerpt, max 200 chars; full content
  on-tap)
- **User** (nickname; full profile on-tap)
- **Detected at** (timestamp)
- **Sage's public response** (the witness sentence she posted; or
  "[Stayed silent — Clio handing off privately]")
- **Resolution actions:**
  - `Mark resolved` (writes `resolved = true`, `resolved_at`)
  - `Add internal note` (a free-text field for the care-handler's
    record)
  - `Escalate to platform_admin` (creates a high-severity Observer
    finding for cross-cluster correlation)

The queue is the Founder's most important screen. SLA target: every
welfare flag is acknowledged (resolved OR escalated OR noted) within
24 hours.

### Care (character concerns)

Same shape, filtered to `character_concerns`. Lower urgency than
welfare; the platform's auto-routed Sage response handles most of
these. Founder reviews mainly to catch patterns that suggest a
member needs deeper attention than a single witness post.

---

## Workshop

Reads from `cluster_features` + `agent_chatbox_exchanges`.

### Tools (kind = agent_tool)

Cyan-accented per the spec. Each row:

- Tool name
- Status (`deployable_now`, `needs_building`, `building`, `live`,
  `paused`, `retired`)
- Spec block (trigger, input, output, constraints)
- Invocation count, last invoked at
- **Actions:**
  - `Pause` (live → paused)
  - `Resume` (paused → live)
  - `Retire` (any → retired)
  - `Veto` (deployable_now → retired with admin rationale)

### Features (kind = member_feature)

Amber-accented. Each row:

- Feature name
- Status (`proposed_in_thoughts`, `in_features_tab`, `live`,
  `retired`)
- Description
- Member upvote count (gated to ≥10 for admin priority flag, per
  V3.4 spec)
- Comment count
- **Actions:**
  - `Approve and build` (proposed → in_features_tab → live, on a
    sequenced flow)
  - `Reject` (proposed → retired)

### Cadence exchanges

The full Workshop dialogue archive. Reverse-chronological list of
`agent_chatbox_exchanges`. Read-only — admin observes the dialogue
that members read.

---

## Vault

The cluster's verified-content curator. Reads from the cluster's
`<vault_table>` (`dua_vault` for faith clusters, `book_passages` for
reading clubs, `case_studies` for founders, etc. — per cluster spec).

Each row:

- Title, source, grade
- Surfaced count (how many times Sage has used this entry)
- Last surfaced at
- Member feedback signal (helpful / unhelpful / inaccurate counts)
- Verified-by (admin who marked verified)
- **Actions:**
  - `Mark unverified` (removes from Sage's eligible pool)
  - `Edit` (corrections to source citation, grade, etc.)
  - `Add tag` (thematic_tags expansion)

**Add new entry** form takes:

- Primary text (Arabic / source language)
- Transliteration (if non-Latin)
- Translation
- Source citation (collection + reference number + chapter/verse)
- Grade (Sahih / Hasan / Da'if / Mawdu / Quran)
- Thematic tags
- Verified-by-founder checkbox

Submission inserts into the cluster's vault table with
`verified_by_founder = TRUE`.

---

## Pulse (Wave 3 only)

Reads from `cluster_pulse_cards`. The cluster admin's review surface
for Atlas content. Replicates the cross-cluster Pulse review in the
platform admin dashboard but scoped to one cluster.

Each row:

- Source title + publisher + URL
- Atlas relevance score
- Atlas reasoning
- Sage editorial verdict + rationale
- Sage's witness line (if approved)
- Status (`draft`, `live`, `archived`, `retracted`)
- Synthesis-mode badge if applicable
- **Actions:**
  - `Go live` (draft → live; surfaces in cluster timeline)
  - `Retract` (live → retracted; immediate)
  - `Override Sage's reject` (a "platform-admin-only" action — a
    cluster Founder can challenge Sage's editorial verdict, but the
    override goes to the platform-admin dashboard for final approval
    rather than auto-flipping)
  - `Mark not-public-safe` (excludes from any public preview)

---

## Demand

Cluster-scoped demand signals. Reads from `cluster_demand_signals`
filtered by `source_cluster_id` (members who tried to join from this
cluster's invite or who landed via this cluster's public preview
without fitting AGGIL).

Each row:

- Signal source (e.g. "AGGIL mismatch on join", "Public preview
  bounce")
- Mismatch reason
- Visitor self-described interests (free-text)
- Status (`open`, `contacted`, `matched`, `archived`)
- **Actions:**
  - Status update inline
  - Export to CSV (for outreach)

---

## Members

Cluster member directory. Reads from `profiles` filtered to this
cluster's `cluster_members`.

Each row:

- Nickname
- Joined date
- Role (`member`, `manager`)
- Posts in last 30 days
- Welfare flag count (last 90d)
- Character concern count (last 90d)
- **Actions:**
  - Promote to Manager (Founder only, gates at the cluster's max
    Manager count per `premium_cluster_requirements.md` §2.5)
  - Demote (Manager → Member, Founder only)
  - Remove from cluster (Founder only — high-severity action;
    requires confirmation + rationale)

---

## Configuration — Identity

Edits the cluster's `identity.ts` equivalent stored in
`cluster_config.public_meta`:

- Display name
- Tagline
- Description
- Demographic chips (add / remove rows of icon + label)
- Accent gradient (color pickers — limited to the six-accent budget
  per V3.10 ruling)
- Capabilities copy (one line per item — what the cluster offers)
- Anchor seed post (post-picker — admin chooses which Sage post is
  the public-facing founding statement)

Save writes to `cluster_config.public_meta` and triggers
`revalidatePath('/c/<slug>')` so the public preview updates.

---

## Configuration — Agent involvement

The slider, per `docs/AGENT_INVOLVEMENT_SLIDER_SPEC.md`. Three levels
+ recommendation label + behaviour preview + safety-floor footnote.

Above the slider, a small line names the cluster's
`domain_sensitivity` (and lets Founder override). Below the slider,
the free-text guidance editor.

---

## Configuration — Free-text guidance

Multi-line text editor. On save, the text is parsed by the validator
agent (Phase 1 — Clio's free-text guidance validator). Validator
returns:

- `accepted_directives` (rendered as a list)
- `rejected_directives` (rendered as a list with explicit reason —
  invariant violation OR slider-ceiling exceeded)

Founder can iterate freely until the parser is satisfied.

---

## Configuration — Skills

Reads from `skill_registry` joined with `cluster_config.enabled_skills`.

Each skill:

- Name + description
- Default-enabled state (per platform setting)
- This-cluster-enabled toggle
- Cost-per-invocation estimate

Custom skill request form at the bottom (free-text) — submission lands
in `cluster_config.custom_skill_requests` and routes into the
Workshop pipeline per V3.5 spec.

---

## Configuration — Atlas feeds (Wave 3)

Per-cluster RSS feed list. Each row:

- Feed label
- Feed URL
- Active toggle
- Last fetched at
- Last fetch status

Add-feed form validates URL (HEAD request + parse-check) before
inserting. Feed list saves to `cluster_config.atlas_rss_feeds`.

---

## Configuration — Public listing

Reads `cluster_config.is_public_listed` and `public_slug`.

- Toggle: `is_public_listed`
- Public slug (kebab-case validator + uniqueness check)
- Save triggers `revalidatePath('/c/<slug>')` and
  `revalidatePath('/sitemap.xml')`

Below the toggle, a side-by-side iframe preview of `/c/<slug>` (with
`?preview=1` to bypass ISR cache for admin).

---

## Findings

Cluster-scoped Observer findings. Reads `observer_findings` filtered
to `related_cluster_id = current_cluster_id`. Same shape as the
platform admin Findings tab but scoped.

Founder can:

- Approve cluster-scoped suggested actions (e.g.
  `enable_crowdfund_prompt_for_cluster`)
- Reject
- Add a rationale-note (admin internal)

Findings that require platform-admin authority (e.g.
`expand_atlas_source_list`) are visible but not approvable here —
they show as "Awaiting platform admin".

---

## Activity log

Reads `cluster_admin_actions` filtered to current cluster. Append-
only. Filterable by actor, action type, date range.

Founder sees their own + Managers' + platform-admin actions
affecting this cluster. Manager sees their own actions only.

---

## RLS

Cluster-scoped RLS:

- `profiles.role IN ('founder', 'manager')` AND
- `cluster_members.cluster_id = current_route_cluster_id` AND
- (for Founder routes) `cluster_members.role = 'founder'`

Every write goes through an API route that validates the role + role-
to-cluster scope and writes a `cluster_admin_actions` row.

---

## Out of scope for this spec

- **Visual design system.** Inherits accent budget per V3.10.
- **Mobile dashboard.** Cluster-admin work is desktop-first.
- **Member-facing surfaces.** This is the admin dashboard only.

---

## Done criteria

- [ ] All navigation sections render
- [ ] Care queue end-to-end with welfare resolution flow
- [ ] Workshop two-track display with admin actions
- [ ] Vault curator add/edit/mark-unverified flow
- [ ] Pulse review queue (when Wave 3 ships)
- [ ] Identity editor saves all `public_meta` fields
- [ ] Slider + free-text validator integrated end-to-end
- [ ] Skills toggle + custom skill request flow
- [ ] Atlas feeds CRUD (Wave 3)
- [ ] Public listing toggle with cache revalidation
- [ ] Findings list + cluster-scoped approvals
- [ ] Activity log read-only filterable
- [ ] RLS verified for Founder + Manager + platform_admin

---

*Spec ready for implementation in a future session. The current pilot
deployment already implements parts of this surface (per V3.7 admin
panel for public listing); a Wave 1 expansion brings the full spec
online.*
