# Session B.5 — Public-Listing Admin Panel + Atlas Runtime

> **Mode:** Inward-facing tooling. Build the admin surfaces that Session B's schema demands, plus the Atlas worker process that turns Atlas from a registered capability into a running one.
>
> **Estimated duration:** 2.5–3 hours.
>
> **Predecessor:** [`SESSION_B_DISCOVERABILITY.md`](SESSION_B_DISCOVERABILITY.md). Schema must already be at v1.9 (verify in Supabase).
>
> **Successor:** [`SESSION_C_PROMPT_AUDIT.md`](SESSION_C_PROMPT_AUDIT.md). The audit benefits from Atlas being live so the Atlas-related prompts can be reviewed against real output.

---

## 1. Goal of this session

Session B shipped the schema, the public preview page, the OG image, the sitemap/robots, the share-line endpoint, the inbound landing flow, and the demand-signal capture. What it deliberately did *not* ship was the admin UI to control any of it, and the Atlas runtime that makes the contemporary-awareness layer real.

Session B.5 closes both:

1. **Per-cluster public-listing admin panel** — toggle `is_public_listed`, set `public_slug`, edit `public_meta` (display name, tagline, description, chips, accent, capabilities copy, anchor seed post selection), preview the page in a side-by-side viewer, and view AI-provider submission status per cluster.
2. **Atlas RSS curation panel** — add/remove/toggle feeds, validate feeds on save (HEAD + parse), see last-fetch status per feed.
3. **Pulse review queue** — every `atlas_pulses` row for the cluster, filterable by `sage_verdict`, with admin override + retraction.
4. **Atlas runtime worker** — Node.js BullMQ worker on Railway that ticks every 60 minutes per cluster: fetch RSS, dedupe, score with Atlas, hand approved candidates to Sage, surface live Pulses.
5. **Demand-signal admin view** — read-only list of `cluster_demand_signals` rows with status updates (`open` → `contacted` / `matched` / `archived`).

The session ends when a platform admin can: (a) flip a cluster public, (b) edit its public meta from the UI, (c) curate Atlas feeds and watch real Pulse candidates flow in, (d) approve/reject Pulses, and (e) see the public preview light up with the latest approved Pulse.

## 2. State of the project when you start

Session B complete. Schema at v1.9. `atlas_pulses`, `cluster_demand_signals`, `public_cluster_view`, expanded `cluster_config` all live. Sisters in Dua has `public_slug = 'sisters-in-dua'`, public meta seeded, but `is_public_listed = FALSE`.

Live URL: `mvp.aggilo.in`. The route `/c/sisters-in-dua` returns 404 today *only because* the cluster is not yet listed publicly. Flipping the flag manually in SQL renders the page with the seeded copy.

Existing assets that will be reused:
- The admin layout in `mvp/src/app/admin/layout.tsx`
- Existing admin pages (features, etc.) for visual consistency
- `cluster_admin_actions` for the audit trail — every B.5 admin action writes here
- `lib/llm-fetch.ts` for Atlas + Sage scoring calls (full observability)

## 3. Recommended agenda

### Step 1 — Cluster identity editor (`/admin/clusters/<slug>`) (~45 min)

New admin route. Reads `cluster_config` for the cluster; writes back via a dedicated `PATCH /api/admin/clusters/[slug]/identity` endpoint. The endpoint enforces the listing CHECK (slug required when listed) and writes a `cluster_admin_actions` row with `action_type='public_listing_toggled'` or `'public_meta_updated'`.

Form fields:
- `is_public_listed` (toggle)
- `public_slug` (text, validated as kebab-case, uniqueness check)
- `public_meta.display_name`, `tagline`, `description`
- `public_meta.demographic_chips` (add/remove rows of icon + label)
- `public_meta.accent_from`, `accent_to` (color pickers)
- `public_meta.capabilities_copy` (add/remove lines)
- `public_meta.anchor_seed_post_id` (post-picker — admin chooses which Sage seed post is the public-facing founding statement)

Side-by-side: a live iframe preview of `/c/<slug>` with `?preview=1` (bypasses ISR cache for the admin user via cookie).

### Step 2 — Atlas RSS curation panel (~30 min)

Section on the same admin page. Each feed row:
- `label` (text)
- `url` (text, validated on save by HEAD + lightweight parse-check)
- `active` (toggle)
- Last-fetch status (read from worker logs once Step 4 is live)

Feeds save into `cluster_config.atlas_rss_feeds`. Adding/removing/toggling each writes a `cluster_admin_actions` row.

### Step 3 — Pulse review queue (~30 min)

Read `atlas_pulses` for the cluster. Filter by `sage_verdict`. Each row:
- Source title + publisher + URL (open in new tab)
- Atlas relevance score
- Atlas reasoning
- Sage verdict + rationale
- Sage witness line (when present)
- Status (`draft` / `live` / `archived` / `retracted`)
- Override controls (platform admin only — overrides write `action_type='pulse_overridden'`)
- Retract control (live → retracted; immediate effect on the public preview)

### Step 4 — Atlas runtime worker (~45 min)

A Node.js script under `mvp/atlas/worker.ts` (or a new `atlas/` package — TBD). Reads cron schedule. For each cluster with `is_public_listed = TRUE` AND at least one active feed:

1. Read `atlas_rss_feeds`
2. For each feed, fetch + parse (use `rss-parser` or equivalent — RSS only, never browser)
3. Dedupe each item against `atlas_pulses.source_url` for the cluster
4. For each new item, run Atlas scoring (1 LLM call)
5. If `relevance >= 0.55`, hand the top-1 to Sage (1 LLM call)
6. Sage returns `approved` + witness line, or a `rejected_*` verdict
7. On approval: insert a Timeline post + flip `atlas_pulses.status='live', surfaced_at=NOW()`
8. Idempotent on every step

Daily ceiling per cluster: 12 candidates considered, max 1 approved.

Deployment: Railway worker service. Schedule: every 60 min via cron expression. Initially manual-trigger via a `POST /api/admin/atlas/tick` endpoint so the rest of B.5 can be tested without waiting for the cron.

### Step 5 — Demand-signal admin view (~20 min)

Read `cluster_demand_signals` filtered by `source_cluster_id` (or all if platform_admin). Status updates inline. Export-as-CSV button for outreach.

### Step 6 — AI-provider submission tracker (per cluster) (~20 min)

Stretch: move the markdown tracker from `docs/AI_PROVIDER_REGISTRATIONS.md` into a per-cluster admin section. Each cluster sees its own row of provider submission status. Underlying schema:

```sql
CREATE TABLE public.cluster_ai_provider_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id TEXT NOT NULL,
  provider VARCHAR(32) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'not_started',
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  notes TEXT,
  ...
);
```

If time runs short, defer to Session D — the Markdown tracker is enough for Phase 0 unless the platform admin actively wants per-cluster control.

## 4. Decisions needed before code

| ID | Question | Recommended default |
|---|---|---|
| BA1 | Worker hosting — Railway service vs Vercel cron + queue? | Railway (BullMQ + Redis already part of the architecture) |
| BA2 | Atlas LLM model — Llama 3 8B (Groq) vs Kimi K2.5 (NIM)? | Llama 3 8B for scoring (cheap), Kimi K2.5 for Sage's editorial pass (already configured) |
| BA3 | Default public-listing for new clusters going forward? | FALSE — explicit opt-in stays |
| BA4 | Pulse retraction — does it write to the Timeline as a "retracted" notice or silently disappear? | Silent retraction; the `cluster_admin_actions` row is the audit trail |
| BA5 | OG image refresh on `public_meta` save — explicit invalidate or wait for 1h cache? | Explicit invalidate via revalidatePath on save |

## 5. Files that will be touched

**New:**
- `mvp/src/app/admin/clusters/[slug]/page.tsx`
- `mvp/src/app/api/admin/clusters/[slug]/identity/route.ts`
- `mvp/src/app/api/admin/clusters/[slug]/feeds/route.ts`
- `mvp/src/app/api/admin/clusters/[slug]/pulses/route.ts`
- `mvp/src/app/api/admin/atlas/tick/route.ts` (manual-trigger for testing)
- `mvp/atlas/worker.ts`
- `mvp/src/components/admin/ClusterIdentityForm.tsx`
- `mvp/src/components/admin/AtlasFeedList.tsx`
- `mvp/src/components/admin/PulseReviewTable.tsx`

**Changed:**
- `docs/MASTER_INSTRUCTIONS.md` (V3.7 changelog)
- `docs/AI_PROVIDER_REGISTRATIONS.md` (status updates as submissions go out)
- `docs/sessions/README.md` (mark B.5 closed; cue C)

**Schema (only if BA6 yes):**
- `mvp/supabase/APPLY_NOW.sql` v2.0 — `cluster_ai_provider_submissions`

## 6. Done criteria

- [ ] Platform admin can flip Sisters in Dua public from the UI; the page goes live within seconds
- [ ] Editing `public_meta` updates the page (cache invalidated)
- [ ] At least one Atlas RSS feed configured for Sisters in Dua
- [ ] At least one Pulse candidate scored and reviewed end-to-end (manual `/admin/atlas/tick` is fine)
- [ ] Demand-signal view shows entries from Session B's inbound landing
- [ ] All admin actions in this session land in `cluster_admin_actions`
- [ ] V3.7 changelog written
- [ ] All committed and pushed

## 7. Out of scope for B.5

- Pulse Timeline card design polish (B.5 ships a minimum-viable card; visual refinement deferred)
- Multi-cluster Phase 1 platform build
- Per-Pulse member voting / feedback (`agent_feedback` already exists; wiring deferred to Session D unless trivial)
- Custom domains per cluster
