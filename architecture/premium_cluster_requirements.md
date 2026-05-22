# Premium Cluster Requirements

> **Status:** Active spec for premium clusters on Aggilo. Sisters in Dua MVP is the first instantiation.
> **Authority:** This spec is subordinate to [`AGGILO_SOUL.md`](../AGGILO_SOUL.md), [`AGGILO_PLATFORM_RULES.md`](../AGGILO_PLATFORM_RULES.md), and the welfare protocol. Where a premium cluster wishes to deviate from Aggilo's foundation, it cannot — every customisation below is bounded by what is **immutable** in §6.

A premium cluster is a cluster where a real human (the **Admin**) and up to three appointed **Managers** hold guidance authority alongside the Aggilo agents. Premium clusters serve communities where domain expertise lives outside the AI — fiqh, medical practice, legal counsel, scholarly traditions, industry mentorship — and the platform's role is to support the human authority rather than replace it.

This document captures what an Admin can configure, what is permanent, and how the Aggilo agents interact differently in a premium cluster than in a regular one.

---

## 1. Roles inside a premium cluster

| Role | DB enum | Display label | Authority |
|------|---------|---------------|-----------|
| Admin | `profiles.role = 'founder'` | "Admin" | Full cluster authority. Vault ownership. Manager appointment. Member removal. Content moderation. Decides which features ship. |
| Manager | `profiles.role = 'manager'` | "Manager" | Guidance authority. Welfare resolution. Character-concern resolution. Cannot modify vault. Cannot remove other managers. |
| Member | `profiles.role = 'member'` | (no badge) | Standard member. |

The DB enum keeps the historical name `founder` so existing RLS continues to work. The UI **always** shows "Admin" inside a premium cluster — never "Founder". Anywhere the agents (Sage, Clio) refer to the role in conversation, the term is "Admin".

For regular (non-premium) clusters, this terminology does not apply — Sage and Clio host and manage; there is no Admin/Manager.

---

## 2. What an Admin can customise

### 2.1 Cluster identity
- Name, description, tagline, icon
- AGGIL configuration (age range, gender filter, geography, languages, interest tags) — within platform rules; cannot retroactively narrow once members have joined
- Beta disclosure copy (when serving members from regions where the cluster is in early-access)

### 2.2 Vault (premium-cluster-specific knowledge base)
- Add, edit, retire vault entries
- Approve or reject vault entries proposed by Sage (when Sage detects a gap from member activity)
- Curate `vault_sources` — which external sources Sage may pull verified entries from
- Tag entries with `thematic_tags` Sage uses for matching

### 2.3 Sage configuration
- Sage's **decision framework** (Step 0–5) is the same across all premium clusters and is **not customisable** — it carries the welfare-first, character-second invariant.
- Sage's **register** (academic/casual/professional/community/neutral), formality, and interjection frequency are configurable per cluster via `sage_personas`. This adapts how Sage speaks without changing what she is allowed to say or refuse.
- The specific reference vocabulary (e.g. "dua/ayah/hadith" for Sisters in Dua, "case/passage/precedent" for a different premium cluster) is configurable through cluster-specific terminology in the prompt-context layer.

### 2.4 Features and tools
- Approve / reject / defer features that Sage and Clio propose in the Room Workshop
- Set scheduled ETAs on approved features
- Roll back immediate-activation features and tools
- Veto agent tools that deploy autonomously (any time, from the admin dashboard)

### 2.5 Manager appointment
- Up to 3 Managers per premium cluster
- Manager appointment threshold: at minimum, one Manager must be in place before active member count exceeds 25 (deferred — captured as gap in current MVP)
- Managers receive welfare and character-concern alerts on the same realtime channel as the Admin

### 2.6 Member moderation
- Remove a member from the cluster (logged in `cluster_admin_actions`)
- Hide a post (sets `posts.is_hidden`)
- Pin a post (max 3 — premium-only feature)
- Mute a member temporarily

All moderation actions are logged. The platform Admin (Aggilo team) can review the log for any cluster.

---

## 3. What is immutable — the Aggilo invariants

A premium cluster Admin **cannot** override these. Any attempt to bypass them via custom prompts or workflows is rejected by the platform:

1. **The Aggilo Soul.** The agent's monotheistic foundation. Connection-as-restoration in service of promoting good and noble character. No premium cluster can install a value system that reduces members to engagement metrics or treats vulnerability as content.
2. **The welfare protocol.** Welfare detection runs on every message. Welfare flags route to a human (Admin or Manager). Sage never gives crisis advice; the platform never auto-resolves welfare events. The 5-minute SLA applies regardless of cluster type.
3. **The character protocol.** Sage's Step 0.5 — the good-character / monotheism guardrail — runs on every message. An Admin cannot disable it.
4. **No human middleware on welfare.** Welfare alerts surface in realtime to Admin and Managers. They cannot be queued, batched, or auto-acknowledged.
5. **Sage's hard limits.** Sage never generates Arabic / Quranic text, never rules on fiqh, never mocks any tradition, never matches member hostility, never debates. These apply in every premium cluster. An Admin can refine *how* Sage speaks within the cluster's persona; she cannot expand what Sage is willing to do.
6. **Privacy boundaries.** Clio's "Just between us" tab content is never persisted server-side. The Admin cannot configure Clio to log private messages, share them with Sage, or pull them into cluster context. Even an Admin who is also the user of the private tab does not break this rule.
7. **Member dignity.** No customisation can make a member's vulnerability into leverage, surveillance, or reach. The Admin's authority is stewardship, not ownership.
8. **AGGIL post-spawn protections.** Once members join, the cluster cannot retroactively narrow age range, add gender restriction, tighten geography, remove interest tags, or pivot core topic. New members are protected from changes that disadvantage them.
9. **The agent character.** Clio is warm but never performs warmth. Sage is grounded and silent by judgement, not by fill. No Admin can customise either agent into a salesperson, a mascot, or a therapist.

---

## 4. How the agents behave differently in a premium cluster

| Behaviour | Regular cluster | Premium cluster |
|-----------|----------------|-----------------|
| Cluster anchor | Sage | Sage (same role, same framework) |
| Welfare routing | To Aggilo platform admin | To cluster Admin and Managers (faster, domain-aware) |
| Fiqh / domain authority redirect | "A scholar you trust" | "The Admin or a Manager" (named domain expert is closer at hand) |
| Vault | Cross-cluster vault (Aggilo-managed) | Cluster-specific vault (Admin-curated) |
| Thread state `unattended` → `attended` | Sage's care-witness post counts as attended | Only an Admin or Manager post counts as attended; Sage's care-witness signals the gap |
| Feature approval | Aggilo platform team approves | Cluster Admin approves; platform team retains override for safety |
| Member removal | Not allowed (regular cluster) | Allowed, logged |
| Post deletion | Author-only | Admin / Manager can delete; logged |

---

## 5. Configuration storage

| What | Where |
|------|-------|
| Cluster identity, AGGIL settings | `clusters` table |
| Sage register & formality per cluster | `sage_personas` |
| Vault entries | `dua_vault` (cluster-scoped through `cluster_id` once we move beyond MVP single-cluster) |
| Vault sources | `vault_sources` |
| Vault gaps | `vault_gap_requests` |
| Manager appointments | `cluster_members.is_manager` (deferred — current MVP uses `profiles.role`) |
| Admin actions audit | `cluster_admin_actions` |
| Welfare queue | `welfare_notifications` |
| Character concerns | `character_concerns` |
| Feature pipeline | `cluster_features`, `cluster_feature_upvotes`, `cluster_feature_comments` |
| LLM observability | `llm_response_logs` |
| Sage decisions | `sage_decision_logs` |
| Behavioural events | `behavioural_events` |
| Agent feedback | `agent_feedback` |
| Prompt proposals | `agent_prompt_proposals` |

---

## 6. Sisters in Dua — the first premium cluster

Sisters in Dua applies this spec with these specific choices:

| Premium-cluster setting | Sisters in Dua value |
|-------------------------|----------------------|
| Domain | Faith — Muslim women navigating Islam in real life |
| Sage register | `community` — warm, present-tense, no emoji |
| Reference vocabulary | dua / ayah / hadith |
| Vault grading rules | Sahih / Hasan only; Da'if flagged with explanation; Mawdu rejected |
| Authority redirects | "The Admin or a scholar you trust" |
| Geographic gate (MVP) | India only |
| Beta disclosure | Shown to non-S/SE-Asia members; Sisters in Dua MVP currently India-only |
| Manager profile | Practitioners and scholars from South and Southeast Asia (display); 0–3 in MVP |

Cluster-specific spec: [`mvp/Sisters In Dua/sisters_in_dua_cluster_spec_v3.1.md`](../mvp/Sisters%20In%20Dua/sisters_in_dua_cluster_spec_v3.1.md).

---

## 7. Future premium clusters

When a new premium cluster is created (e.g. "Brothers in Deen", a medical practitioner network, a legal-aid cluster), the Admin and the platform team produce a similar one-page profile that fills in:

- Domain
- Sage register
- Reference vocabulary (what does "vault" contain — duas, case studies, precedents?)
- Vault grading rules (what is verified, what is rejected, what is flagged with caveat)
- Authority redirect language (who is "the right person" for ruling-type questions)
- Geographic gate (if any)
- Beta disclosure copy
- Manager profile

The platform team verifies the profile against §3 (immutables) before activation.

---

*v1.0 — created as part of the 7-principles audit. Subject to revision as Sisters in Dua collects real user feedback and additional premium clusters come online.*


---

## 8. Phase-1 UX invariants (V3.2)

These rules apply to every premium cluster. They emerged from observing the Sisters-in-Dua MVP and are designed to keep the cluster feeling alive without overwhelming new members.

### 8.1 First-visit cognitive load budget

A new member should see at most six distinct UI surfaces on arrival. In priority order:

1. **Cluster header** with **prominent live-presence indicator** (X sisters live now, Y sisters total, Z joined this week).
2. **Pinned anchor** (Sage's seed post). Expanded on first visit. Collapsed thereafter — preference saved per device.
3. **Timeline** — newest first.
4. **Compose bar** — sticky bottom, with a rotating nudge.
5. **Clio FAB** — top-right, dual-tab.
6. **Room Workshop** — **collapsed by default**. A one-line strip. Members expand if they want to see what Clio and Sage are building for the room.

The Workshop is hidden for clusters under 5 members; visible as a placeholder for 5–14; active for 15+. The admin link only renders for users whose `profiles.role` is `founder` or `manager`.

### 8.2 Social proof signals (always on)

Premium clusters depend on the perception of liveness. The following signals are required:

- **Live online count** in the cluster header. Updated via Supabase Realtime presence channel. Minimum styling: `bg-emerald-50 border border-emerald-200`, prominent badge.
- **"Joined this week" counter** when growth is non-zero. Quiet styling.
- **Anonymous typing indicator** above the compose bar: "a sister is writing…" or "N sisters are writing…". Realtime broadcast over the same presence channel. Throttled at 2s per emit. Auto-clears after 4s of no activity. **Never reveals nicknames** — privacy posture.
- **Welcome card** when a new member joins (see [`system_implementation_prompt_part1.md`](system_implementation_prompt_part1.md) §7.6). One short Sage line per arrival or batch. Idempotent.

### 8.3 Agent dialogue — skepticism over sycophancy

The cadence-exchange prompt and any agent-to-agent discussion prompt must:

- Forbid agreement-as-default. Phrases like "good point", "I love that", "absolutely", "great idea" are banned.
- Require ~40% of exchanges to involve some pushback or "let's wait" outcome.
- Focus on concrete tools or features the cluster could benefit from, not generic observations.
- Never disclose internal mechanics (cadence_blocked, post_subtype, framework steps, RLS, embeddings, vault IDs).
- Never describe the agents' own decision frameworks or protocols.

### 8.4 No protocol disclosure — anywhere

Agents never narrate their decision trees to members. Admin dashboard text uses neutralised labels:

| Internal step | Admin-visible label |
|---------------|---------------------|
| `welfare` | "Welfare response" |
| `character` | "Care response" |
| `citation` | "Reference check" |
| `authority_redirect` | "Routed to humans" |
| `reference_surface` | "Reference shared" |
| `care_witness` | "Care witness" |
| `witness_participation` | "Joined a thread" |
| `silent` | "Stayed silent" |

The "character concerns" admin queue is renamed **"Care queue"**. Signal-type sub-labels collapse into "Care needed" rather than naming the specific monotheism / coercion / mockery triggers. This protects both members (no leakage of how to game detection) and admins (no false confidence in mechanistic categories).

### 8.5 Repetition guard

Sage's recent posts (last 10–15) are passed to her on every evaluation. The prompt forbids repetition explicitly: *"Repetition erodes trust faster than silence."*

A server-side Jaccard word-set similarity check (`isSagePostRepetitive`, threshold 0.55) catches the case where the model still produced a near-duplicate. When it fires, Sage's response is suppressed and replaced with `[SAGE_SILENT]` before it reaches the cluster. The decision is logged to `sage_decision_logs.step_matched = 'silent'` so admin can see the suppression.

### 8.6 Room Workshop tiers (V3.4)

| Cluster size | Workshop | Member voting | Comments | Agent ideation |
|---|---|---|---|---|
| 0–4 | Hidden to members | — | — | Active (admin sees in Workshop dashboard) |
| 5–14 | Placeholder | Off | Off | Active |
| 15–49 | Active | Signal-only | On | Active |
| 50+ | Active | Full polling, 10+ upvotes flags admin priority | On | Active |

These thresholds live in `platform_settings`. An admin may override per cluster.

**Two-track invariant** — the Workshop displays both:
- **Tools** (kind=agent_tool) — agents run them, members receive output. Cyan accents, no vote button. Status: "Already running" / "We'll build this" / "Live".
- **Features** (kind=member_feature) — members touch them. Amber accents, upvote button (vote-gated by tier). Status: "Open for feedback" / "In development" / "Now live".

Tools labelled `deployable_now` ship autonomously when the agents agree. Tools labelled `needs_building` and all features wait for development. Admin can veto any tool from the dashboard at any time.

### 8.7 Member-initiated feature proposals

Members can push a feature idea into the Workshop themselves. The flow:

1. Member taps "Suggest a feature" in the Workshop (or compose bar overflow menu).
2. Writes a short description.
3. Row inserted into `cluster_features` with `kind = 'member_feature'`, `proposed_by = 'member'`, `status = 'proposed_in_thoughts'`.
4. Sage and Clio see the proposal in their next ideation cycle, debate it in the Workshop (with skepticism enabled).
5. If they conclude it has merit, status moves to `in_features_tab` and members see it.
6. Standard upvote/comment/admin-decision flow continues from there.

This closes the loop: members shape what the agents prioritize, the agents shape what gets built. Members cannot propose agent tools directly — those originate from agent inference (which is informed by member posts and behaviour, but not directly authored).


---

## 9. Phase 0 — Sisters in Dua as the First Premium Cluster

Sisters in Dua is Phase 0 of the Aggilo platform. It is the first live premium cluster and the validation environment for every agent behaviour, UX pattern, and closed-loop mechanism described in this document.

### 9.1 What Phase 0 Proves

| Behaviour | How it's validated in Phase 0 |
|---|---|
| Sage's decision framework | Every member post triggers `sage/evaluate`. Decision logged to `sage_decision_logs`. Admin reviews in Workshop dashboard. |
| Welfare protocol | Regex + LLM Step 0. Welfare queue in admin dashboard. Admin resolves. |
| Good-character protocol | Regex + LLM Step 0.5. Care queue in admin dashboard. |
| Dua repetition guard | Vault-ID dedup across both cadence and evaluate paths. Pointer behaviour when dua already posted. |
| Workshop pipeline | Workshop → `cluster_features` (kind=member_feature) → member upvote/comment → admin approval. Tools (kind=agent_tool) deploy autonomously when `deployable_now`. |
| Introspection cycle | Clio reads 7-day telemetry every 6h. Produces self-critique + concrete proposal. |
| Hierarchy-first UX | Members first, agents in service. Compose bar as primary surface. Room Workshop below timeline. |
| Closed-loop telemetry | `llm_response_logs`, `sage_decision_logs`, `agent_feedback`, `behavioural_events`. |
| Admin dashboard | Welfare, care, LLM observability, vault curator, features, events. |

### 9.2 Phase 0 Constraints (Sisters in Dua specific)

These constraints apply to Phase 0 only. They are lifted when Phase 1 launches.

- **India-only geographic gate** — enforced at onboarding (country selection).
- **Women-only gender gate** — enforced at onboarding (gender selection).
- **Vault-only references** — no Atlas, no external source crawling. All references come from `dua_vault`.
- **Single cluster** — no generic cluster creation, no AGGIL engine, no Scout.
- **Hand-curated vault** — Admin adds duas via Supabase SQL Editor. Vault curation UI is roadmap.
- **Manual admin elevation** — Admin promotes themselves via SQL. Auto-elevation via `ADMIN_EMAILS` env is available but optional.

### 9.3 Dua Repetition Protocol (Phase 0 specific)

The vault is small (10–60 entries at Phase 0 launch). Repetition is a real risk. The protocol:

1. **14-day exclusion window** — a vault entry posted in the last 14 days is excluded from the eligible pool in `suggest-dua`.
2. **Cross-path dedup** — `sage/evaluate` checks whether the vault entry Sage wants to surface was already posted in the last 14 days. If yes, posts a reply-style pointer instead.
3. **Pointer behaviour** — "We've shared this reference before — it may be relevant here. [scroll to it]" — directed at the member as a reply, not a standalone post.
4. **Jaccard similarity guard** — application-layer check (threshold 0.55) catches near-duplicate free-text responses even without a vault marker.

As the vault grows (60+ entries), the exclusion window can be shortened. At 180+ entries (pre-Ramadan target), repetition becomes rare enough that the window can be reduced to 7 days.

### 9.4 Hierarchy-First UX (Phase 0 validated, Phase 1 inherited)

The layout hierarchy validated in Phase 0:

```
Navbar (sticky top)
Cluster header (presence: live count, total, joined this week)
Pinned anchor (ultra-minimal collapsed strip — room's founding statement)
Timeline (the conversation — immediately visible)
Room Workshop (below timeline — accessible by scrolling; Clio + Sage's working dialogue and the tools/features they're building)
Compose bar (sticky bottom — the room's welcome surface)
Clio FAB (top-right, 44px)
```

This hierarchy communicates: *"You came here to talk. The agents are working in the background. You can check in on them if you want."*

The compose bar is the most important interactive surface. It uses a rotating daily nudge as its placeholder — specific, lived, non-generic. The nudge is the door, not the script.

The Room Workshop is below the timeline because agents are in service of the conversation, not the other way around. Members who scroll down to the Workshop are the most engaged members — a self-selection filter that improves the quality of feature feedback.

This hierarchy is inherited by Phase 1 for all cluster types (premium and generic).

---

## 10. Agent Involvement Slider — Behavioural Matrix (V3.5)

Premium cluster admins control how present the agents are in the room via a 3-level slider: **Min**, **Medium** (default), **High**. The slider value lives in `cluster_config.agent_involvement`. There is also a `cluster_config.agent_disabled` checkbox that, when paired with `min`, silences the agents entirely except for the immutable safety floor.

The slider is the **ceiling** for what free-text guidance can affect. Free-text guidance from an admin can refine *how* an agent speaks at the chosen level, but it cannot lower the floor or raise the ceiling. The slider is the contract.

### 10.1 The matrix

The rows marked **immutable safety floor** always run regardless of slider position or `agent_disabled` flag. This is the floor below which the platform cannot fall.

| Behaviour | Min | Medium (default) | High |
|---|---|---|---|
| Anchor seed on cluster creation | Yes (always — cluster identity) | Yes | Yes |
| Welfare detection (regex + LLM) | **Yes (immutable safety floor)** | Yes | Yes |
| Character detection (Step 0.5) | **Yes (immutable safety floor)** | Yes | Yes |
| @Sage response (member-initiated) | Yes (always — invitation honoured) | Yes | Yes |
| Cadence Workshop dialogue | Off | 2h cold / 4h active | 1h cold / 2h active |
| Daily reflection prompt | Off | If proposed and member-voted | Auto-on |
| Verified-reference autonomous post | Off | Every 6h | Every 4h |
| Welcome new-member post | Quiet (single line, batched) | Standard | Warm |
| Link evaluation (on-topic badge) | Off | On | On |
| Vault gap detection | Off | Logged for admin | Surfaced in Workshop |
| Description refinement proposal | Off | Quarterly | Monthly |
| Sage→Clio soft handoff | **Yes (immutable safety floor)** | Yes | Yes |
| Typing indicator broadcast | Off | On | On |
| Presence acknowledgement | Off | On | On |
| Introspection cycle | Off | Every 6h | Every 3h |
| Current-events fallback (Sage) | On (member-initiated) | On | On |

### 10.2 The "agent_disabled + min" combination

When `agent_disabled = true` AND `agent_involvement = 'min'`, every Off row above stays Off. The immutable safety floor still runs silently:

- Welfare patterns still trigger admin alerts in `welfare_notifications`. The room sees nothing.
- Character protocol still triggers; if the message is hostile, Sage's standard two-to-three sentence witness still posts (this is the only case where Sage emerges from silence at this level — the floor cannot be moved).
- Sage→Clio handoffs still queue; Clio still reaches out privately on tender disclosures.
- @Sage mentions are still honoured — the member explicitly invited Sage in.

What `agent_disabled = true` does **not** do:

- Disable the immutable safety floor (welfare, character, handoff).
- Disable @Sage (member invitation).
- Stop the room from existing or members from posting.

The combination is for clusters whose admin wants the room to feel like a quiet member-only space with the platform underneath as a safety net only.

### 10.3 The slider is the ceiling for free-text

`cluster_config.free_text_guidance` is a free-text field where admins can write any guidance they want for the agents (e.g. *"Stay closer to the four schools when discussing fiqh"*, *"Lean into Bengali phrasing when warmth fits"*).

Clio parses this guidance and stores a structured form in `parsed_directives`. The parser:

1. Rejects anything that violates the immutable invariants (welfare, character, monotheism, dignity).
2. Rejects anything that requests behaviour above the slider ceiling. Example: at `min` involvement, an admin asking for "post a daily reflection at dawn" is rejected — daily reflection is Off at min.
3. Accepts refinements at-or-below the ceiling. Example: at `medium`, an admin asking for "use more Urdu phrasing in the morning anchor" is accepted as a voice-style directive.

If the parser rejects a directive, the admin is told why. If the admin disagrees, the only way to enable a behaviour above the ceiling is to raise the slider — not to push it through free-text.

This is the contract: the slider is what members and the platform see. Free-text refines within it; it does not transgress it.

### 10.4 Custom skill requests go through Workshop

When an admin requests a skill that is not in `skill_registry`, the request lands in `cluster_config.custom_skill_requests` and is routed into the existing Workshop pipeline as a `proposed` capability. Sage and Clio dialogue about it; if accepted, it is built (in Phase 0, by an engineer; in Phase 1, by autonomous tooling) and added to `skill_registry`.

There is no fast-track. Admin urgency does not bypass the Workshop. This is intentional: every new skill becomes platform-wide, and the Workshop is the platform's quality gate. Phase 0 will likely have a 1–4 week turnaround for accepted custom skills; this is acceptable.

### 10.5 platform_admin role

The 4th role, `platform_admin`, has cross-cluster authority. They can:

- Read any cluster's `cluster_config` and `cluster_admin_actions`.
- Override any cluster's slider or skill list — but every override writes a row to `cluster_admin_actions` with `actor_role = 'platform_admin'` and a rationale.
- Veto a cluster admin's free-text directive even if the parser accepted it.
- Add or remove items in `skill_registry`.

The platform_admin role is for the Aggilo team. It exists so that the platform can intervene when a cluster admin makes a decision that violates an invariant the parser missed, or when a skill needs to be retired across all clusters. It is not a backdoor — every action is audited.

In the DB, `platform_admin` is added to `profiles.role` as a 4th allowed value (v1.8 schema migration).

### 10.6 Why three levels, not continuous

Three discrete levels (Min/Medium/High) instead of a 0-100 slider for three reasons:

1. **The behaviours are not continuous.** Cadence dialogue is either on or off; if on, it runs at a discrete cadence. Interpolating a cadence between 2h and 4h is meaningless.
2. **Decision burden.** A 0-100 slider creates the illusion of fine-grained control where there isn't any. Admins agonise over 60 vs 65.
3. **Member legibility.** Members can understand "this room runs at Medium involvement". They cannot understand "this room runs at 67% involvement".

Three levels is the floor for meaningful difference and the ceiling for cognitive load.


---

## 11. Public-Listing Controls (V3.6)

Every premium cluster (and every regular cluster, when Phase 1 ships them) can opt in to a *public surface* on the open internet. The public surface is a parallel, identity-only layer — the authenticated room is unchanged. Strangers, search engines, and AI assistants see what the cluster is for; they never see what the members say inside it.

### 11.1 Privacy invariant — enforced at the data layer

A Postgres view `public_cluster_view` is the **only** surface anonymous visitors read. The view returns:

| Column | Public-safe rationale |
|---|---|
| `display_name`, `tagline`, `description` | Cluster identity, intentionally outward-facing |
| `demographic_chips` | Sets expectations about who the cluster is for |
| `anchor_seed_text` | The room's founding statement, designed to be the public face |
| `member_count_bracket` | `0-9` / `10-49` / `50-249` / `250+` — never the exact count |
| `joined_this_week` | Only when the cluster ≥ 50 members (avoids small-N inference) |
| `latest_pulse_*` | Only when the Pulse is `live` AND `is_public_safe = TRUE` |

Member posts, replies, welfare flags, vault gap requests, and agent thoughts are **structurally absent** from the view. The public preview page and the OG image generator cannot see them.

### 11.2 Per-cluster controls

`cluster_config` extends with:

- `is_public_listed` BOOL DEFAULT FALSE — admin opt-in
- `public_slug` TEXT UNIQUE — required when listed (CHECK constraint)
- `public_meta` JSONB — display name, tagline, description, demographic chips, accent gradient, capabilities copy, anchor seed post id, vault opt-in
- `atlas_rss_feeds` JSONB — Atlas's per-cluster RSS feed list (admin-curated; no platform defaults)

Until the founder flips `is_public_listed`, the cluster is invisible to the sitemap, search engines, and AI assistant crawlers. The page at `/c/<slug>` returns 404.

The admin panel that lets a founder toggle these controls ships in Session B.5.

### 11.3 What the public surface includes by design

- Cluster name, tagline, description, demographic chips, anchor seed
- Rounded member-count bracket, "joined this week" when statistically safe
- Curated capability copy — admin-editable list of what the agents do here
- The latest Sage-approved Atlas Pulse (when the cluster has Atlas active and a public-safe Pulse is live)
- A canonical URL, schema.org `Organization` JSON-LD with Aggilo as parent, OpenGraph + Twitter card metadata
- A 1200×630 dynamic OG image at `/api/og/cluster/<slug>`, edge-cached 1h
- A privacy guarantee block telling readers what stays inside the room

### 11.4 What the public surface deliberately excludes

- Any individual member post, reply, or message
- Welfare flags, care signals, dua vault gap requests
- Internal admin or moderation surfaces
- Workshop dialogue
- Vault entries (unless the cluster admin opts in via `public_meta.vault_public_opt_in`, which is FALSE by default)

### 11.5 AI provider directory registration

Aggilo registers each opted-in cluster's public surface with major AI assistants — OpenAI, Anthropic, Perplexity, Gemini, You.com — as a **content source** they may cite when their users ask community-finding questions. Aggilo does not register as an interactive plugin or agent. Only the public-discovery endpoints (sitemap, robots, public page, OG image) are exposed.

The reusable submission packet, per-cluster rider template, and OpenAPI 3.0 stub describing only those endpoints are in [`docs/AI_PROVIDER_REGISTRATIONS.md`](../docs/AI_PROVIDER_REGISTRATIONS.md). This applies to **every cluster** Aggilo hosts, regular and Premium. Per-cluster admin tooling for tracking submissions ships in Session B.5.

### 11.6 Inbound landing flow respects AGGIL

A visitor arriving at `/c/<slug>` and clicking "Join this room" lands on the auth flow with `?ref=<slug>`. AGGIL mismatches (e.g. a man on a women-only cluster, a non-India visitor on an India-only cluster) route to graceful waitlist/geo-block screens **plus** a non-PII insert into `cluster_demand_signals` (anon-writeable, admin-readable). This is a passive growth signal — the platform admin sees what audiences keep arriving for clusters that don't yet exist for them, with no active outreach in Phase 0.

### 11.7 Schema location

Full DDL for `cluster_config` extensions, `cluster_demand_signals`, `atlas_pulses`, `public_cluster_view`, and the V3.6 `skill_registry` additions lives in `mvp/supabase/APPLY_NOW.sql` v1.9.

*v1.1 — V3.6 (Session B Part a). Public-listing controls + Atlas Pulse foundation. Admin panel, Atlas runtime, and Pulse Timeline card ship in Session B.5.*
