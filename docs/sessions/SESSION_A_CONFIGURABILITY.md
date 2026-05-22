# Session A — Bug Fixes + Premium Configurability + Cluster Identity Decisions

> **Mode:** Closing & shipping. Fix in-flight bugs, ship premium configurability schema, settle outstanding cluster-identity questions.
>
> **Estimated duration:** 2–2.5 hours of focused work.
>
> **Predecessor:** Session ending 2026-05-22 (V3.4 Room Workshop shipped, configurability discussions had).
>
> **Successor:** [`SESSION_B_DISCOVERABILITY.md`](SESSION_B_DISCOVERABILITY.md).

---

## 1. Goal of this session

Three deliverables, in order:

1. **Resolve in-flight bugs and UX gaps** affecting the live product right now. Five small fixes, each ~15-30 min.
2. **Resolve cluster-identity strategic questions** — Atlas activation (yes/now or defer), cluster name change (yes or no), Sage prompt expansion for current-events queries.
3. **Ship the premium configurability schema** — DDL for the slider, free-text guidance, agent-skill catalogue, platform_admin role, audit trail.

The session ends when (a) all five bugs are fixed and pushed, (b) the strategic decisions are recorded in architecture docs, (c) the schema is in `APPLY_NOW.sql` ready to apply, and (d) any UI work needed for the slider is at-least stubbed.

## 2. State of the project when you start

Code state: V3.4 Room Workshop shipped. Architecture docs updated to V3.4. Schema migration v1.7 (cluster_features two-track columns + cluster_tool_invocations table) committed but **not yet confirmed applied** in Supabase by the user.

Live MVP behaviours validated: hierarchy-first UX, demographic chips, Clio FAB idle-halo breathing, portal-rendered context menu (own posts: Delete only; others: Copy/Share/Report), Workshop minimised by default, posts delete with optimistic removal.

Known broken/missing as of session start:

| # | Symptom | Suspected cause |
|---|---|---|
| **B1** | `@Sage can you update me of the latest developments concerning Muslim women in India?` posted ~7:35 AM (date specified by user) — Sage did not respond. | Likely: Sage's prompt biases hard toward verified vault references; she has no source for "current developments." Defaults to silence rather than admit limitation. |
| **B2** | Cadence-exchange dialogue includes member-blame language: *"The room has been repeatedly requesting new duas and asking about spiritual practices like tahajjud, indicating a need for comprehensive guidance and reliance on Allah."* | The V3.4 prompt forbids this style ("never about members"), but the model still produces it. No server-side validator catches it. Two failures: prompt too soft + no validation. |
| **B3** | When Sage is processing a member post in the background (after optimistic post commit), there is no visual indicator. The "Sage is considering this" indicator only fires on *optimistic* posts. | `SageConsideringIndicator` placement logic is incomplete — it should fire whenever a post mentions @Sage and Sage hasn't replied yet, irrespective of optimistic state. |
| **B4** | Clio FAB privacy banners are misleading: *"Just between us"* tab is labelled as private; the AMA tab is labelled *"Ask me anything"* with a banner that suggests less privacy. **Both tabs are private to the user.** Difference is storage class (ephemeral vs persistent), not privacy class. | Banner copy is wrong. Labels need correcting. |
| **B5** | Clio AMA tab has no help section. Members new to a cluster have no guided way to learn what each surface does (Workshop, Sage, posts, presence header, chips). | Feature missing entirely. |

## 3. Recommended agenda

### Step 1 — Diagnose B1 (5 min, you run SQL)

Open Supabase SQL Editor. Run this query, paste result back:

```sql
-- Find the @Sage post and trace what happened.
WITH the_post AS (
  SELECT id, content, author_id, created_at, thread_state
  FROM public.posts
  WHERE content ILIKE '%@sage%'
    AND content ILIKE '%muslim women%'
    AND created_at > NOW() - INTERVAL '48 hours'
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT
  tp.id AS post_id,
  tp.content AS post_content,
  tp.created_at AS post_created_at,
  tp.thread_state,
  sdl.step_matched,
  sdl.rationale,
  sdl.would_post,
  sdl.suppressed,
  sdl.suppression_reason,
  sdl.created_at AS sage_decision_at,
  llm.provider,
  llm.model,
  llm.status,
  llm.error_message,
  llm.cost_estimate_usd,
  llm.latency_ms,
  LEFT(llm.response_content, 500) AS response_preview
FROM the_post tp
LEFT JOIN public.sage_decision_logs sdl ON sdl.post_id = tp.id
LEFT JOIN public.llm_response_logs llm ON llm.id = sdl.llm_log_id
ORDER BY sdl.created_at DESC
LIMIT 5;
```

**Possible outcomes:**
- *Step matched=`silent`, rationale=`out_of_vault_scope`*: Sage knew she had nothing to say. Confirms the "vault-bound" hypothesis.
- *Step matched=`welfare`*: Welfare regex pre-filter false-positive (likely "concerning" + "women").
- *No row*: Request never reached evaluate route. Check welfare flag on post itself, check budget cap.
- *Status=`budget_exceeded`*: Daily LLM budget cap hit.

### Step 2 — Fix B2: cadence prompt validator (~30 min)

Two layers of fix:

**2a. Prompt hardening.** Rewrite the V3.4 cadence prompt to use *rejection examples* directly. Add an explicit "**bad examples that have shipped before — do not produce these**" block listing the exact phrasing that slipped through ("the room has been requesting…", "members seem to…", "indicating a need for…"). Models are far better at recognising "do not be like this" with concrete examples than at following abstract rules.

**2b. Server-side validator.** In `cadence-exchange/route.ts`, after the LLM returns, run a regex check on `sage_message` and `clio_message` for forbidden subject patterns:

```ts
const FORBIDDEN_SUBJECT_PATTERNS = [
  /\bmembers?\s+(have|are|seem|tend|keep|appear)\b/i,
  /\bthe room (has|seems|feels|appears)\b/i,
  /\b(repeatedly|frequently|recently)\s+(requesting|asking|posting|sharing)\b/i,
  /\bindicating a need\b/i,
  /\b(sisters?|brothers?)\s+(have|are|seem|tend)\b/i,
];

function hasForbiddenFraming(text: string): boolean {
  return FORBIDDEN_SUBJECT_PATTERNS.some((re) => re.test(text));
}
```

If the validator fires on either message, **retry once** with an even harder system message reminding the rules. If second attempt also fails, mark the exchange `observe_mode=true` with a generic line ("Our current tools are doing their job — nothing new to ship right now.") and log the failure to `behavioural_events` for offline review.

This is belt-and-braces: prompt + runtime check. Both will keep slipping if either is missing.

### Step 3 — Fix B3: in-flight Sage indicator (~20 min)

Update `PostCard.tsx`. Currently:

```ts
const showSageConsidering =
  (mentionsSage && !hasSageReply && isOptimistic) || (isSage && isOptimistic);
```

Change to also fire when a non-optimistic member post mentions @Sage but Sage hasn't replied AND the post is recent (last 60 seconds). Need a clock effect to recompute "is recent" so it disappears after 60s if Sage stays silent (genuine silence is valid).

```ts
const POST_AGE_MS = Date.now() - new Date(post.created_at).getTime();
const isRecentEnoughToWaitForSage = POST_AGE_MS < 60_000;
const showSageConsidering =
  (mentionsSage && !hasSageReply && (isOptimistic || isRecentEnoughToWaitForSage)) ||
  (isSage && isOptimistic);
```

Plus a `useEffect` with `setInterval` to re-render every 5s while the indicator is showing, so it disappears at the 60s mark naturally.

### Step 4 — Fix B4: Clio FAB privacy labels (~15 min)

In `ClioFab.tsx`:

- Tab labels: keep `"Just between us"` for ephemeral; rename `"Ask me anything"` to `"Private Chat"` (per user's preference)
- Privacy banners: rewrite to make clear **both tabs are private to the user**. Difference is *what the platform remembers*, not *who else can see*.

| Tab | Old banner | New banner |
|---|---|---|
| Just between us (ephemeral) | "Private. Words stay in your browser, clear in 12h. Platform sees that we spoke, never what." | "Private. Words stay in your browser only — they clear in 12h. Nothing saved." |
| Private Chat (persistent) | "Private to you. I'll remember this to help you better next time." | "Private to you. I remember our conversations so I can serve you better next time." |

Tab tooltip on first open should explain: *"Both tabs are private to you. The first forgets after 12 hours; the second remembers."*

### Step 5 — Fix B5: Help section in Private Chat tab (~30 min)

A collapsible help section inside Private Chat. Implementation:

- A new `<details>` element near the top of the chat scroll area, collapsed by default. Header: "What's on this page?"
- Inside, a list of buttons. Each button:
  - Label (e.g. "Room Workshop")
  - On click: scroll to the corresponding element on the page (use `scrollIntoView({ behavior: 'smooth', block: 'center' })` and add a brief flash highlight)
  - Tooltip text describing what the element does

Buttons to include in V1 (platform-baseline, not Workshop-driven):

| Button | Element to scroll to | Description |
|---|---|---|
| Live presence | `.cluster-presence-indicator` (header) | Who's online now and how many members have joined this week |
| Cluster restrictions | The demographic chips | Who this room is for — age, gender, location, language |
| Pinned anchor | The collapsible Sage seed at top | The room's founding statement |
| Posts & timeline | The first post in the timeline | The conversation. Tap any post to react or reply |
| Compose bar | The bottom sticky input | Where you share what's on your heart |
| @Sage feature | The compose bar | Type `@Sage` and ask a question — she'll respond when she has something verified |
| Sage's posts | First Sage post visible | Sage anchors the room and shares verified references |
| Room Workshop | Workshop strip below timeline | What Clio and I are building for this room |
| Myself (Clio) | The FAB itself | I'm always here. Tap to chat anytime |

Implementation note: this is **not** a Workshop entry. It's part of the platform baseline — every cluster gets it.

### Step 6 — Strategic decisions block (~30 min discussion)

Three decisions to record in architecture docs:

**Decision 6a — Atlas activation.** My recommendation: **defer Atlas to Phase 1**. Phase 0 cost of building Atlas (data acquisition layer + worker infrastructure + Atlas prompt) is ~1 week of work; honest fallback in Sage's prompt is ~30 min. Decision criterion: do you accept a Sage that says "I don't track current events, share what you've heard and we can talk" instead of one that pulls live news? If yes → defer. If no → expand Session A scope significantly.

**Decision 6b — Cluster name change.** My recommendation: **keep "Sisters in Dua" as the formal name; expand Sage's prompt vocabulary and the cluster description**. The name is a poetic seed, not a content gate. Renaming costs SEO and member identity. Vocabulary expansion in Sage's prompt costs a paragraph.

**Decision 6c — Sage prompt expansion.** Add a new step to Sage's framework — a *current-events fallback branch*:

> *"When a member asks about current developments, news, or events — topics outside the verified vault scope — Sage acknowledges the limit honestly: she does not track live news. She invites the member to share what they've heard or seen, and offers to think through it together. She never speculates. She never pretends to know. This is dignity, not deflection."*

This is a structural addition to Sage's prompt, not just a vocabulary tweak.

### Step 7 — Premium configurability schema (~30 min)

Drop into `mvp/supabase/APPLY_NOW.sql` as v1.8:

```sql
-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  v1.8 — Premium Cluster Configurability                          ║
-- ║                                                                  ║
-- ║  Adds: agent involvement slider, free-text admin guidance,       ║
-- ║  agent skill registry, platform_admin role, audit trail.         ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1) Extend role enum: platform_admin (cross-cluster authority)
-- (profiles.role is currently TEXT not enum, so just a comment + RLS)

-- 2) cluster_config — per-cluster admin settings
CREATE TABLE IF NOT EXISTS public.cluster_config (
  cluster_id TEXT PRIMARY KEY,
  agent_involvement VARCHAR(8) DEFAULT 'medium',  -- 'min' | 'medium' | 'high'
  agent_disabled BOOLEAN DEFAULT FALSE,           -- min + checkbox
  free_text_guidance TEXT,                        -- raw admin input
  parsed_directives JSONB DEFAULT '{}',           -- Clio-validated structured form
  enabled_skills JSONB DEFAULT '[]',              -- skill IDs from registry
  custom_skill_requests JSONB DEFAULT '[]',       -- free-text skill descriptions awaiting Workshop debate
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- 3) cluster_admin_actions — audit trail for platform_admin overrides
CREATE TABLE IF NOT EXISTS public.cluster_admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES public.profiles(id),
  actor_role VARCHAR(16) NOT NULL,                -- 'founder' | 'manager' | 'platform_admin'
  action_type VARCHAR(48) NOT NULL,               -- 'config_changed' | 'platform_override' | 'tool_vetoed' | etc.
  before_state JSONB,
  after_state JSONB,
  rationale TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4) skill_registry — platform-wide catalog of available agent skills
CREATE TABLE IF NOT EXISTS public.skill_registry (
  id VARCHAR(64) PRIMARY KEY,                     -- e.g. 'verified-reference-curation'
  display_name VARCHAR(128) NOT NULL,
  description TEXT NOT NULL,
  agent VARCHAR(16) NOT NULL,                     -- 'sage' | 'clio' | 'atlas' | 'scout' | 'observer'
  default_enabled BOOLEAN DEFAULT TRUE,
  premium_only BOOLEAN DEFAULT FALSE,
  cost_per_invocation_estimate NUMERIC(10, 6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: cluster_config readable by all members of cluster, writable by founder/manager;
--      platform_admin can read/write any.
-- (full RLS in the actual migration)

-- Backfill MVP cluster
INSERT INTO public.cluster_config (cluster_id, agent_involvement)
VALUES ('the_single_source', 'medium')
ON CONFLICT (cluster_id) DO NOTHING;
```

The user runs this when ready.

### Step 8 — Slider behavioural matrix (recorded in architecture, not built yet)

Record in `architecture/premium_cluster_requirements.md` §10 (new):

| Behaviour | Min | Medium (default) | High |
|---|---|---|---|
| Anchor seed on cluster creation | Yes (always — cluster identity) | Yes | Yes |
| Welfare detection (regex + LLM) | **Yes (immutable safety floor)** | Yes | Yes |
| Character detection (Step 0.5) | **Yes (immutable safety floor)** | Yes | Yes |
| @Sage response | Yes (always — member-initiated) | Yes | Yes |
| Cadence Workshop dialogue | Off | 2h cold / 4h active | 1h cold / 2h active |
| Daily reflection prompt | Off | If proposed and member-voted | Auto-on |
| Verified-reference autonomous post | Off | Every 6h | Every 4h |
| Welcome new-member post | Quiet (single line, batched) | Standard | Warm |
| Link evaluation (on-topic badge) | Off | On | On |
| Vault gap detection | Off | Logged for admin | Surfaced in Workshop |
| Description refinement proposal | Off | Quarterly | Monthly |
| Soft Sage→Clio handoff | **Yes (immutable safety)** | Yes | Yes |
| Typing indicator broadcast | Off | On | On |
| Presence ack | Off | On | On |
| Introspection cycle | Off | Every 6h | Every 3h |

The "**immutable safety floor**" rows make the architectural distinction explicit: even at Min/disabled, welfare and character protocols always run. This is the floor below which the platform cannot fall.

If `agent_disabled=true` AND `agent_involvement='min'`, all rows above marked "Off" stay off. The safety floor still runs silently — admin gets the welfare alert, Clio still soft-handoffs, but Sage produces no content posts.

## 4. Decisions needed before code

| ID | Question | Recommended default | Need answer? |
|---|---|---|---|
| D1 | Defer Atlas to Phase 1? | **Yes** | Confirm |
| D2 | Keep cluster name "Sisters in Dua"? | **Yes** | Confirm |
| D3 | Add `platform_admin` as a 4th role? | **Yes** | Confirm |
| D4 | Slider is the ceiling for free-text? | **Yes** | Confirm |
| D5 | Admin-requested skills go through Workshop pipeline (no fast-track)? | **Yes** | Confirm |
| D6 | Slider granularity: 3 levels (Min/Med/High) vs continuous 0–100? | **3 levels** | Confirm |
| D7 | Free-text guidance language: English-only for V1? | **Yes** | Confirm |
| D8 | Skill catalogue auto-apply to existing premium clusters when new skills ship? | **Opt-in (notified at next admin visit)** | Confirm |
| D9 | Hard language gate for premium clusters in Phase 0? | **Defer to Phase 1** | Confirm |

## 5. Files that will be touched

**Code:**
- `mvp/src/app/api/agents/cadence-exchange/route.ts` (B2 fix)
- `mvp/src/components/PostCard.tsx` (B3 fix)
- `mvp/src/components/ClioFab.tsx` (B4, B5 fixes)
- `mvp/src/lib/sage-prompt.ts` (Sage prompt expansion 6c)
- `mvp/supabase/APPLY_NOW.sql` (v1.8 schema)

**Docs:**
- `architecture/premium_cluster_requirements.md` (§10 slider matrix, §11 admin guidance flow)
- `architecture/system_implementation_prompt_part1.md` (§7.9 platform_admin role)
- `docs/MASTER_INSTRUCTIONS.md` (V3.5 changelog section)

## 6. Out of scope for Session A

- Cluster discoverability work (public preview page, OG images, SEO) → Session B
- AI provider directory registration → Session B
- Comprehensive prompt audit → Session C
- Atlas activation (per decision D1)
- Phase 1 generic-cluster platform work
- Cluster-analyst admin page (deferred — needs Scout, which needs Phase 1 infrastructure)

## 7. Done criteria

Session A is complete when:

- [ ] B1 diagnosed; root cause known; Sage prompt expanded with current-events fallback (6c)
- [ ] B2 fixed: cadence prompt hardened with rejection examples + server-side validator deployed
- [ ] B3 fixed: in-flight Sage indicator fires for non-optimistic posts
- [ ] B4 fixed: Clio FAB labels and banners corrected
- [ ] B5 shipped: help section live in Private Chat tab
- [ ] D1–D9 decisions recorded in architecture docs
- [ ] v1.8 schema in `APPLY_NOW.sql` ready to apply
- [ ] Slider behavioural matrix recorded in `premium_cluster_requirements.md` §10
- [ ] V3.5 changelog written in `MASTER_INSTRUCTIONS.md`
- [ ] All changes committed and pushed to both repos
- [ ] User has run v1.7 + v1.8 SQL migrations in Supabase

## 8. Notes for picking this up cold

**If you (the user) are starting this session in a new chat:** paste this whole brief in. The agent should read it + the soul + platform rules first, then ask you the D1–D9 questions if not answered, then proceed.

**If a fresh agent is starting:** the codebase has been clean as of the last commit. Run `npm run build` from `d:\Aggilo_Social\mvp` to confirm 27 routes pass. Run `git status` from `d:\Aggilo_Social\mvp` and `d:\Aggilo_Social` to confirm working trees are clean.

**Common pitfall:** the outer repo treats `mvp/` as a submodule. Code changes commit to `d:\Aggilo_Social\mvp` (push to `origin/main`). Doc changes commit to `d:\Aggilo_Social` (push to `origin/main` via `master:main` mapping). Don't try to add `mvp/` files from the outer repo.
