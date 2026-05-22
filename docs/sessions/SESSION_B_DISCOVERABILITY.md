# Session B — External Discoverability + AI Provider Distribution

> **Status:** Closed (Part a) on 2026-05-22. V3.6 changelog in [`docs/MASTER_INSTRUCTIONS.md`](../MASTER_INSTRUCTIONS.md).
>
> Atlas runtime, admin panel, and Pulse Timeline card moved to [`SESSION_B5_PUBLIC_LISTING_ADMIN.md`](SESSION_B5_PUBLIC_LISTING_ADMIN.md).
>
> **Mode:** Outward-facing growth. Make Aggilo's clusters discoverable on the public internet, on social platforms, and within AI provider directories.
>
> **Estimated duration:** 2.5–3 hours.
>
> **Predecessor:** [`SESSION_A_CONFIGURABILITY.md`](SESSION_A_CONFIGURABILITY.md). Cluster identity decisions must be settled before this session.
>
> **Successor:** [`SESSION_C_PROMPT_AUDIT.md`](SESSION_C_PROMPT_AUDIT.md).

---

## 1. Goal of this session

Today the Aggilo MVP is invisible to the open internet. Sisters in Dua does not appear in Google, cannot be shared on WhatsApp/Twitter without manual screenshot, and is not discoverable by anyone asking an AI assistant *"is there a community of Muslim women in India for faith and contemporary issues?"*

This session ships the discoverability layer:

1. **Public cluster preview pages** — server-rendered, indexable, shareable
2. **Privacy-safe content surfacing** — no member content leaks; only cluster identity, anchor seed, and aggregate signals
3. **OpenGraph + structured data** — rich preview cards on all major social platforms
4. **SEO foundation** — sitemap, robots.txt, schema.org markup
5. **Outbound social posting** — Sage drafts a shareable line + image; admin reviews + posts (Phase 0 manual; Phase 1 automated)
6. **AI provider directory registration** — submit Aggilo to OpenAI GPT Store, Anthropic apps, Perplexity, Gemini, You.com so AI assistants can recommend clusters when relevant

The session ends when a user can paste `aggilo.in/c/sisters-in-dua` into WhatsApp and get a rich preview card, search Google for "muslim women community india" and see Aggilo in the results within ~30 days, and ask Perplexity/ChatGPT about communities in this niche and have a chance of being told about Aggilo.

## 2. State of the project when you start

Session A complete. Cluster name confirmed (default: kept as "Sisters in Dua"). Premium configurability schema applied. Bugs fixed.

Live URL: `mvp.aggilo.in`. Landing: `aggilo.in`. No public cluster URLs exist.

Existing assets that will be reused:
- Cluster's `tagline` and `description` from `lib/sage-prompt.ts` (or eventually from `clusters` table)
- Cluster's demographic chips
- Pinned anchor (Sage's seed post) — already designed to be the room's "founding statement", well-suited as a public preview
- Member count, "joined this week" count
- Live presence count (do NOT include in static OG images — will look broken when stale)

## 3. Recommended agenda

### Step 1 — Public-safe content filter (architecture, ~20 min)

Before any public surface ships, decide *what is public-safe*. Rule:

| Surface | Public-safe? |
|---|---|
| Cluster name, tagline, description | ✅ Public |
| Demographic restriction chips | ✅ Public |
| Anchor seed (Sage's first post / founding statement) | ✅ Public |
| Member count (rounded) | ✅ Public |
| "X joined this week" counter | ✅ Public |
| Sage's verified-reference posts (vault entries) | ✅ Public if cluster admin opts-in |
| Any individual member post | ❌ Never public |
| Any reply or comment | ❌ Never public |
| Aggregate counts (e.g. "12 conversations this week") | ✅ Public if cluster ≥ 50 members (avoids small-N inference) |
| Welfare flags / care signals | ❌ Never public, never aggregated |
| Vault gap requests | ❌ Never public |
| Workshop dialogue | ❌ Never public |
| Cluster-tools running | ✅ Public (advertises capabilities) |
| Member features in development | ✅ Public |

This must be enforced at the *data layer*, not the prompt layer. Add a Postgres view `public_cluster_view` with RLS that returns only public-safe columns. Public preview pages query this view, not `clusters` directly.

```sql
CREATE OR REPLACE VIEW public.public_cluster_view AS
SELECT
  cluster_id,
  display_name,
  tagline,
  description,
  -- aggil chips
  -- cluster_size_bracket: '0-9' | '10-49' | '50-249' | '250+' for privacy
  -- anchor_seed: pinned Sage post content
  -- joined_this_week_count
FROM public.clusters
JOIN ...
WHERE is_public_listed = TRUE;

GRANT SELECT ON public.public_cluster_view TO anon;
```

### Step 2 — Public cluster preview page (`/c/[slug]`) (~45 min)

New Next.js route in the MVP app: `mvp/src/app/c/[slug]/page.tsx`.

Server-rendered (no auth). Reads from `public_cluster_view`. Renders:

1. **Hero section** — cluster name, tagline, demographic chips
2. **The room's founding statement** — the anchor seed post, presented prominently as a quote
3. **Who's here** — rounded member count, "X joined this week"
4. **Capabilities** — a curated subset of agent tools running (e.g. "Sage curates verified references", "Sage anchors the room")
5. **Identity guarantee** — "Conversations stay between members. Member content is never indexed, scraped, or shared."
6. **CTA** — "Join this room" → routes to onboarding flow with cluster pre-selected

Server-side meta tags:

```html
<title>{cluster.name} — {cluster.tagline} | Aggilo</title>
<meta name="description" content="{cluster.description}" />
<link rel="canonical" href="https://aggilo.in/c/{slug}" />

<!-- OpenGraph -->
<meta property="og:title" content="{name}" />
<meta property="og:description" content="{tagline}" />
<meta property="og:image" content="https://aggilo.in/api/og/cluster/{slug}" />
<meta property="og:url" content="https://aggilo.in/c/{slug}" />
<meta property="og:type" content="website" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />

<!-- Schema.org — Community / Organization -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{name}",
  "description": "{tagline}",
  "url": "https://aggilo.in/c/{slug}",
  "memberOf": { "@type": "Organization", "name": "Aggilo" }
}
</script>
```

### Step 3 — Dynamic OG image generator (~30 min)

Use Next.js `ImageResponse` API at `mvp/src/app/api/og/cluster/[slug]/route.ts`. Generates a 1200×630 JPEG on the fly:

- Background: cluster's accent gradient
- Cluster name (large)
- Tagline (smaller)
- Demographic chips (with emojis — 🇮🇳 India · ♀ Women etc.)
- Member count (rounded)
- Aggilo logo bottom-right
- Sage's "From: Sage · Anchor" attribution if anchor seed is featured

Cache on the edge (`cache-control: public, max-age=3600`).

### Step 4 — Sitemap and robots (~15 min)

`mvp/src/app/sitemap.ts`:

```ts
export default async function sitemap() {
  const supabase = await createClient();
  const { data: clusters } = await supabase
    .from('public_cluster_view')
    .select('cluster_id, updated_at');
  return [
    { url: 'https://aggilo.in', lastModified: new Date() },
    ...clusters.map(c => ({
      url: `https://aggilo.in/c/${c.cluster_id}`,
      lastModified: c.updated_at,
      changeFrequency: 'daily',
      priority: 0.8,
    })),
  ];
}
```

`mvp/src/app/robots.ts`:

```ts
export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/c/', disallow: ['/cluster', '/admin', '/api/'] },
    ],
    sitemap: 'https://aggilo.in/sitemap.xml',
  };
}
```

This deliberately allows `/c/[slug]` (public previews) and disallows `/cluster` (the authenticated room) so search engines never accidentally index member content.

### Step 5 — Outbound social-share content prompts (~30 min)

Two new prompts. Both Sage-voiced.

**5a. Cluster card share line** — when a cluster is created or hits a milestone (10, 50, 100 members), Sage drafts a shareable line:

```
You are Sage. Draft ONE short shareable line about [cluster] suitable for posting to social media. The line should:
- Speak to outsiders, not members
- Communicate what the cluster is for, in one sentence
- Avoid hype, exclamation marks, or marketing voice
- Mention what makes it specific (the demographic, the focus)
- Be ≤180 characters

Cluster: {cluster_name}
Tagline: {tagline}
Description: {description}
Demographic chips: {chips}
Recent activity tone: {sample of recent topics, anonymised}
```

Output is a single string. Admin reviews before posting. No autonomous posting in Phase 0.

**5b. Cluster invite line** — when a member taps "Share this room", a one-line invite for messaging apps:

```
You are Sage. Generate ONE invite line a member could paste into WhatsApp/Telegram to invite a friend to {cluster}. The line should:
- Sound like a friend recommending a place, not marketing
- Be in the cluster's primary language (or English if none specified)
- Not promise anything beyond what's true
- Include the URL: https://aggilo.in/c/{slug}
- Be ≤120 characters
```

### Step 6 — Inbound landing flow (~30 min)

When a visitor arrives at `/c/sisters-in-dua` and clicks "Join this room":

1. Onboarding starts with cluster pre-selected
2. Onboarding asks: year of birth, gender, language, location (text), interests
3. AGGIL filter check: if visitor doesn't fit (e.g. male visitor for women-only cluster), Clio explains gracefully:
   > "This room is for women in India. It's not the right fit for you, but I can suggest other rooms or help you create one."
4. If visitor fits AGGIL: standard email magic-link sign-up, auto-joined to cluster
5. If visitor doesn't fit AND no alternative cluster exists: collect interest signal → "I'll let you know when a room like this opens." → write to `cluster_demand_signals` table

This is a real flow — needs care. Bad fit handling is critical. Don't make people feel rejected; route them somewhere useful.

### Step 7 — AI provider directory registration (~30 min, mostly form-filling)

Submit Aggilo to:

| Provider | Programme | Application URL | Approval time |
|---|---|---|---|
| OpenAI | GPT Store / Apps | https://platform.openai.com/docs/gpts | 1-3 weeks |
| Anthropic | Apps / Connectors | https://docs.anthropic.com/en/api/openapi-spec | Email |
| Perplexity | Sources | https://docs.perplexity.ai/ | 1-2 weeks |
| Gemini | Extensions | https://ai.google.dev/extensions | Form |
| You.com | Sources | https://you.com/api | Email |
| Meta AI | n/a | None public | — |

**Common requirements:**
- OpenAPI 3.0 spec for any agent endpoints we expose (we don't have public ones today — likely just the `/c/[slug]` discovery endpoint)
- Privacy policy URL (exists at `aggilo.in/privacy.html`)
- Terms of service URL (`aggilo.in/terms.html`)
- Description of legitimate use case
- Sample queries / responses

For the MVP, the simplest approach is: register Aggilo as a *content source* that AI assistants can cite when users ask community-finding questions, not as an *interactive plugin*. This requires only the public-cluster pages + sitemap + a clean robots.txt — all of which steps 1-4 ship.

### Step 8 — Optional: cluster spawn social outreach (~30 min)

When Phase 1 launches with multi-cluster support, Sage drafts a weekly tweet/post about the most active rooms (with admin opt-in). Phase 0: just document the design; don't build.

## 4. Decisions needed before code

| ID | Question | Recommended default |
|---|---|---|
| DB1 | Public preview opt-in by cluster admin, or all public by default? | **Opt-in (admin sets `is_public_listed`)**; default false until admin agrees |
| DB2 | Member-feature/tool capabilities in the public preview — show them? | **Yes** — they advertise capability without leaking content |
| DB3 | Sage's vault entries — public if admin opts-in? | **Yes, opt-in** — these are verified references, public domain anyway |
| DB4 | Cluster join flow for AGGIL-mismatched visitors — "create your own cluster" link? | **Phase 1** (no cluster creation in Phase 0); Phase 0 just collects demand signal |
| DB5 | Custom domain support per premium cluster (e.g. `sistersindua.com` → `aggilo.in/c/sisters-in-dua`)? | **Phase 1+** — too much for Session B |
| DB6 | OG image refresh interval (server cache TTL)? | **1 hour** — balance between freshness and edge cache hit rate |
| DB7 | Sitemap inclusion of all clusters or just admin-listed ones? | **Admin-listed only** — respects opt-in |

## 5. Files that will be touched

**New files:**
- `mvp/src/app/c/[slug]/page.tsx` (public preview page)
- `mvp/src/app/api/og/cluster/[slug]/route.ts` (OG image generator)
- `mvp/src/app/sitemap.ts`
- `mvp/src/app/robots.ts`
- `mvp/src/lib/share-prompts.ts` (new prompts for social share lines)
- `mvp/src/app/api/clusters/[slug]/share/route.ts` (admin-triggered share-line generator)
- `docs/AI_PROVIDER_REGISTRATIONS.md` (tracking submissions)

**Schema:**
- `mvp/supabase/APPLY_NOW.sql` v1.9: `is_public_listed` flag on clusters (or cluster_config), `cluster_demand_signals` table, `public_cluster_view`

**Architecture docs:**
- `architecture/system_implementation_prompt_part1.md` §7.10 (new) — public-discovery layer
- `architecture/premium_cluster_requirements.md` §12 (new) — public-listing controls
- `docs/MASTER_INSTRUCTIONS.md` (V3.6 changelog)

## 6. Out of scope for Session B

- Multi-cluster Phase 1 platform build
- Custom domains per cluster
- Mobile app deep-linking
- Email digest of new clusters to existing members
- Comprehensive prompt audit (Session C)

## 7. Done criteria

- [ ] Public preview page live at `aggilo.in/c/sisters-in-dua` (admin opted in)
- [ ] OG image generates correctly (test with WhatsApp, Twitter, LinkedIn share previews)
- [ ] Sitemap.xml accessible at `aggilo.in/sitemap.xml`
- [ ] Robots.txt allows `/c/` and disallows `/cluster`, `/admin`, `/api/`
- [ ] Schema.org JSON-LD validates (test with Google Rich Results Test)
- [ ] Sage-voiced share-line prompt produces good output for 5 test cases
- [ ] Inbound landing flow works for AGGIL-fitting and AGGIL-mismatched visitors
- [ ] AI provider applications submitted (or scheduled) for at least Perplexity, You.com, OpenAI
- [ ] Privacy policy + ToS reflect the public-listing opt-in
- [ ] V3.6 changelog written
- [ ] All committed and pushed

## 8. Notes for picking this up cold

- Verify Session A is complete first (run `git log --oneline -20` and confirm V3.5 changelog exists)
- The cluster `is_public_listed` flag must be set to TRUE for Sisters in Dua before testing public preview
- Test OG image with `https://www.opengraph.xyz/url/https%3A%2F%2Faggilo.in%2Fc%2Fsisters-in-dua` after deploy
- Test schema.org with Google's Rich Results test tool
- AI provider applications usually require a video demo or screencast — keep one ready
