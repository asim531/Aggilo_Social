# Atlas Runtime — Design (Session B → B.5)

> **Status:** schema landed in Session B (v1.9). Runtime worker, admin RSS panel, and Sage editorial integration ship in Session B.5.
>
> **Authority:** subordinate to [`AGGILO_SOUL.md`](../AGGILO_SOUL.md), [`atlas/SOUL.md`](../atlas/SOUL.md), and [`AGGILO_PLATFORM_RULES.md`](../AGGILO_PLATFORM_RULES.md). Nothing here may override those.

---

## 1. What Atlas does in one paragraph

Atlas is the cluster's contemporary-awareness layer. He reads admin-curated RSS feeds for each cluster, scores each item for relevance against the cluster's purpose, and hands the most promising candidate to Sage as a content brief. Sage decides whether to surface it. When she does, the result lands in the Timeline as a Pulse card and on the public preview page as the "what's the room engaging with right now" signal. Atlas is silent for days when nothing fits — the same discipline Sage holds.

Per AGGILO_PLATFORM_RULES.md §AI Agent Rules, direct scraping with Puppeteer/Playwright is prohibited. Atlas reads RSS and only RSS in Session B.5. Any future expansion to managed APIs must come through the same governance.

---

## 2. Data model (already in v1.9)

### `cluster_config.atlas_rss_feeds` (JSONB array)

Per-cluster, admin-curated. Each item:

```json
{
  "id": "uuid",
  "url": "https://example.com/feed.xml",
  "label": "Al Jazeera Women",
  "active": true,
  "added_at": "2026-05-22T10:00:00Z",
  "added_by": "uuid"
}
```

Admin panel (B.5) lets the founder add/remove/toggle feeds. No platform-default feeds — Atlas is silent until the cluster's admin has curated at least one.

### `atlas_pulses`

Every candidate Atlas considers gets a row, including ones Sage rejects. This gives the admin dashboard full visibility into what was offered and why it didn't surface.

| Column | Purpose |
|---|---|
| `cluster_id` | Which cluster this candidate is for |
| `source_url`, `source_title`, `source_publisher`, `source_published_at` | The RSS item |
| `source_feed_id` | Which entry in `atlas_rss_feeds` it came from |
| `atlas_relevance_score`, `atlas_reasoning` | Atlas's score (0..1) and short reasoning. Debug only. |
| `sage_verdict` | `pending` → `approved` / `rejected_off_topic` / `rejected_dignity` / `rejected_duplicate` |
| `sage_rationale` | Sage's editorial note, kept for the admin trail |
| `sage_witness_line` | One-line frame Sage adds when approving |
| `status` | `draft` → `live` → `archived`/`retracted` |
| `related_post_id` | When a Timeline Pulse card was published |
| `is_public_safe` | If false, the public preview never shows this Pulse, even when live |
| `surfaced_at` | When status became `live` |

The public preview page (`/c/<slug>`) reads the most recent `live + is_public_safe` row via `public_cluster_view.latest_pulse_*`.

---

## 3. Runtime architecture (B.5)

```
                ┌─────────────────────────┐
                │  cron (railway worker)  │  every 60 min
                └─────────────┬───────────┘
                              ▼
                ┌─────────────────────────┐
                │ atlas_dispatch          │  for each public-listed cluster
                │  - read atlas_rss_feeds │  with at least one active feed
                │  - fetch each feed      │  (RSS only — never browser)
                │  - dedupe on source_url │  against atlas_pulses
                └─────────────┬───────────┘
                              ▼
                ┌─────────────────────────┐
                │ atlas_score             │  LLM call per item
                │  - cluster purpose      │   (Llama 3 8B / Groq, fast)
                │  - chips, recent vault  │
                │  - dignity guardrail    │
                └─────────────┬───────────┘
                              ▼
              ┌───────────────┴───────────────┐
              ▼                               ▼
       relevance < 0.55              relevance ≥ 0.55
              │                               │
        write 'rejected_off_topic'     hand top-1 to Sage
                                              │
                                              ▼
                                  ┌───────────────────────┐
                                  │ sage_review_pulse     │  LLM call
                                  │  - on-topic check     │
                                  │  - dignity check      │
                                  │  - dedup check        │
                                  │  - witness line draft │
                                  └───────────┬───────────┘
                                              ▼
                              ┌───────────────┴───────────────┐
                              ▼                               ▼
                      'rejected_*'                      'approved'
                              │                               │
                       row stays draft                 status='live'
                                                      surface as Pulse
                                                      card in Timeline +
                                                      public preview
```

### Cadence

- Worker tick: every 60 minutes per cluster.
- Sage review per candidate: ≤1 LLM call.
- Atlas scoring per candidate: ≤1 LLM call (Llama 3 8B is cheap).
- Daily ceiling per cluster: max 12 candidates considered, max 1 surfaced.
- Genuine on-topic surfacing is rare. Most days, no Pulse. That is correct.

### Idempotency

- `dedupe_key = sha256(source_url)` is checked against `atlas_pulses` for the cluster before any LLM call.
- The same URL reappearing in feeds on consecutive ticks costs zero tokens.

---

## 4. Sage's editorial pass — what she checks

Sage runs the candidate through these gates in order. First failure stops further evaluation and writes the appropriate `sage_verdict`.

1. **On-topic**: does the piece sit inside the cluster's stated purpose? A piece about Muslim women in India fits Sisters in Dua; a piece about a celebrity wedding does not — even if both involve Muslim women.
2. **Dignity**: is the framing dignified? Sage rejects sensational headlines, exploitative photography, content that ridicules members of any group, content that could harm or shame a member who reads it.
3. **Dedup**: has Sage surfaced the same story (different URL, same substance) recently? Use the same Jaccard repetition guard already shipped in `sage-prompt.ts`.
4. **Verifiability**: is the source named, traceable, and not anonymous content marketing? Sage reads the publisher field and rejects unattributable content.
5. **Witness draft**: when 1–4 pass, Sage drafts a one-line frame for the Pulse card. Voice rules per `sage-prompt.ts` (no emoji, no exclamation, present tense, ≤140 chars).

Sage never publishes a Pulse on a topic she would dismiss as off-topic in the rest of the room.

---

## 5. What members and the public see

### Members (inside the cluster)

A new Pulse card appears in the Timeline, attributed `Sage · Anchor`, with:
- The witness line (Sage's voice).
- The article title and publisher.
- A link out (target=_blank, rel=nofollow noopener).
- A small `sage_feedback` row (👍/👎) so the loop closes back into `agent_feedback`.

### Public preview page

`/c/<slug>` reads `latest_pulse_*` from `public_cluster_view`. When a live, public-safe Pulse exists, the page renders the "What the room's engaging with right now" section. When none exists, the section is hidden — the page does not show "no recent activity", which would read as a failure rather than the deliberate silence it represents.

### When Atlas is silent for days

This is correct behaviour, not a bug. Treat it the way Sage's silence is treated: the room is being held by what's already there, and nothing genuine has surfaced. The public preview gracefully hides the Pulse section; no fallback copy.

---

## 6. Admin controls (Session B.5)

Admin panel adds:

| Surface | Purpose |
|---|---|
| RSS feed list | Add/edit/remove feeds for the cluster. Each feed validated on save (HEAD request, parse check). |
| Pulse review queue | All `atlas_pulses` rows for the cluster, filterable by `sage_verdict`. Admin can override Sage's verdict (audit-logged). |
| Pulse retraction | One-click `status = retracted` on any live Pulse. Public preview falls back to no-Pulse state immediately. |
| Discoverability toggle | The same panel where admin flips `is_public_listed` and sets `public_slug` (Session B.5 — schema lands in Session B). |

All admin actions write rows to `cluster_admin_actions` with `action_type IN ('atlas_feed_added', 'atlas_feed_removed', 'pulse_overridden', 'pulse_retracted', 'public_listing_toggled', 'public_slug_changed')`.

---

## 7. Failure modes and recovery

| Failure | Detection | Recovery |
|---|---|---|
| RSS feed 5xx or timeout | Worker logs to `llm_response_logs` with `decision_summary='rss_fetch_failed'` | Skip feed for this tick. Three consecutive failures auto-disable the feed and notify admin. |
| RSS feed parse error | Same | Skip; admin sees flag in feed list |
| Atlas LLM unavailable | `llmCall()` returns `status='error'` | Skip the tick; rows not written |
| Sage LLM unavailable | Same | Candidate stays at `sage_verdict='pending'` until next tick |
| Daily LLM budget exceeded | `llmCall()` returns `budget_exceeded` | Sage gracefully steps back; no Pulses for the rest of the day |
| Duplicate URL after Sage approval | Caught in step 4.3 | Verdict written as `rejected_duplicate`; admin sees both rows |

---

## 8. What we deliberately did not build in Session B

- The actual worker process (Node.js BullMQ worker on Railway). Schema only.
- The admin RSS panel UI.
- The Pulse card Timeline component.
- Any default RSS feed list. Atlas stays silent on every cluster until the admin curates at least one feed — by design.

These are the Session B.5 deliverables.

---

## 9. Open questions for B.5

| ID | Question | Default if not answered |
|---|---|---|
| A1 | Should Atlas ever consider feeds that aren't in `atlas_rss_feeds` (e.g. a small set of platform-curated defaults)? | No — admin curation only. The platform never injects sources into a cluster without the founder asking for them. |
| A2 | Should the public preview show a sample of the *last 3* Pulses or just the latest? | Just the latest. More than that risks turning the public page into a feed. |
| A3 | When Sage rejects a Pulse for dignity reasons, should the admin be notified individually? | Aggregate weekly report — individual notifications would create noise. |
| A4 | Should `atlas_pulses.is_public_safe` ever default to `false`? | No — default true. Admin can toggle per-Pulse if a story is internally relevant but not for the public surface. |

These get resolved before B.5 begins.
