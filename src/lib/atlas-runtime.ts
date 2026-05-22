/**
 * Atlas runtime — Phase 0 (Next.js route, no BullMQ).
 *
 * Per `system_implementation_prompt_part1.md` §8.4, Phase 0 codebases
 * run all agent logic as Next.js API routes. No worker queue. The
 * `/api/admin/atlas/tick` route invokes `runAtlasTick()` for one cluster.
 * Cron triggers (Vercel cron, GitHub Actions cron, or any external
 * scheduler) hit the same route.
 *
 * Pipeline:
 *   1. Read the cluster's active RSS feeds
 *   2. Fetch each feed (XML), parse to items
 *   3. Dedupe each item against atlas_pulses.source_url
 *   4. For up to N candidates: Atlas scores against the cluster purpose
 *      (Llama 3 / cheap model). Below threshold → log as
 *      'rejected_off_topic'.
 *   5. For the top scoring candidate: Sage reviews (on-topic, dignity,
 *      dedup, witness draft).
 *   6. If Sage approves: row written with sage_verdict='approved',
 *      status='draft'. Admin clicks "Go live" or admin-tick auto-promotes
 *      based on body flag.
 *
 * Daily ceiling per cluster: MAX_CANDIDATES=12 considered, max 1 promoted
 * to live. Tick is idempotent — same URL on repeat ticks is dedup'd.
 */

import { createServerClient } from "@supabase/ssr";
import { llmCall } from "./llm-fetch";
import { readPublicMeta, type AtlasRssFeed } from "./admin-cluster";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_CANDIDATES_PER_TICK = 12;
const RELEVANCE_THRESHOLD = 0.55;

interface RssItem {
  title: string;
  link: string;
  publisher: string | null;
  published_at: string | null;
  description: string | null;
}

/**
 * Minimal RSS/Atom parser. Avoids a third-party dep — the runtime is
 * tolerant of common feed quirks. If we ever hit a feed this can't
 * parse, the admin will see zero items and move on.
 *
 * We extract: title, link (or guid), description, pubDate. Atom's
 * <entry>/<link href="…"/>/<published> are also handled.
 */
function parseFeed(xml: string, fallbackPublisher?: string | null): RssItem[] {
  const items: RssItem[] = [];

  // Strip CDATA so we don't have to handle it inline
  const decoded = xml.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_m, inner) => inner);

  // RSS 2.0
  const rssItemRe = /<item\b[\s\S]*?<\/item>/gi;
  for (const match of decoded.match(rssItemRe) ?? []) {
    const title = pickTag(match, "title");
    const link = pickTag(match, "link");
    const description = pickTag(match, "description");
    const pubDate = pickTag(match, "pubDate") ?? pickTag(match, "dc:date");
    if (!title || !link) continue;
    items.push({
      title: stripHtml(title).trim(),
      link: link.trim(),
      publisher: fallbackPublisher ?? null,
      description: description ? stripHtml(description).trim().slice(0, 600) : null,
      published_at: pubDate ? safeDateIso(pubDate) : null,
    });
  }

  if (items.length === 0) {
    // Atom
    const atomEntryRe = /<entry\b[\s\S]*?<\/entry>/gi;
    for (const match of decoded.match(atomEntryRe) ?? []) {
      const title = pickTag(match, "title");
      // Atom link is an attribute on <link href="…"/>
      const linkMatch =
        /<link[^>]*?href="([^"]+)"[^>]*?(?:rel="alternate")?[^>]*?\/?>/i.exec(match) ??
        /<link[^>]*?href="([^"]+)"/i.exec(match);
      const link = linkMatch?.[1] ?? null;
      const description = pickTag(match, "summary") ?? pickTag(match, "content");
      const pubDate = pickTag(match, "published") ?? pickTag(match, "updated");
      if (!title || !link) continue;
      items.push({
        title: stripHtml(title).trim(),
        link: link.trim(),
        publisher: fallbackPublisher ?? null,
        description: description ? stripHtml(description).trim().slice(0, 600) : null,
        published_at: pubDate ? safeDateIso(pubDate) : null,
      });
    }
  }

  return items;
}

function pickTag(scope: string, tag: string): string | null {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = re.exec(scope);
  return m ? m[1] : null;
}
function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}
function safeDateIso(s: string): string | null {
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

async function fetchFeed(url: string): Promise<{ ok: boolean; items: RssItem[]; status: number | null }> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "user-agent": "Aggilo-Atlas/1.0 (+https://aggilo.in)",
        accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, items: [], status: res.status };
    const xml = await res.text();
    const publisher = inferPublisherFromUrl(url);
    return { ok: true, items: parseFeed(xml, publisher), status: res.status };
  } catch {
    return { ok: false, items: [], status: null };
  }
}

function inferPublisherFromUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host;
  } catch {
    return null;
  }
}

// ── Atlas scorer ────────────────────────────────────────────────────
//
// Cheap LLM call. Returns 0..1 plus a one-line reasoning. Designed for
// the Llama 3 8B fallback model (configured via LLM_FALLBACK_*) but works
// with any OpenAI-compatible endpoint.

interface ClusterContext {
  cluster_id: string;
  display_name: string;
  description: string;
  demographic_chips: string[]; // labels only
}

async function scoreCandidate(
  supabase: SupabaseClient,
  ctx: ClusterContext,
  item: RssItem
): Promise<{ score: number; reasoning: string }> {
  const result = await llmCall(
    {
      agent: "atlas",
      operationKey: "atlas_score",
      clusterId: ctx.cluster_id,
    },
    {
      messages: [
        {
          role: "system",
          content: `You are Atlas. Score how relevant this content is to the cluster purpose. Output strict JSON: {"score": <0..1>, "reasoning": "<one short phrase>"}.

Cluster: ${ctx.display_name}
Audience: ${ctx.demographic_chips.join(", ") || "general"}
Purpose: ${ctx.description}

Score 0.0 = totally off-topic.
Score 0.5 = adjacent, not specific.
Score 0.8+ = squarely on-topic for the audience and purpose.

Be skeptical. Most candidates are off-topic. Default to a low score unless the headline AND description clearly fit.`,
        },
        {
          role: "user",
          content: `Title: ${item.title}\nDescription: ${item.description ?? "(none)"}\nPublisher: ${item.publisher ?? "(unknown)"}`,
        },
      ],
      temperature: 0.2,
      maxTokens: 120,
      responseFormat: { type: "json_object" },
    },
    supabase
  );

  if (result.status !== "ok" || !result.content) {
    return { score: 0, reasoning: "scorer_unavailable" };
  }
  try {
    const parsed = JSON.parse(result.content) as { score?: number; reasoning?: string };
    const raw = typeof parsed.score === "number" ? parsed.score : 0;
    const score = Math.max(0, Math.min(1, raw));
    return { score, reasoning: String(parsed.reasoning ?? "").slice(0, 200) };
  } catch {
    return { score: 0, reasoning: "scorer_parse_error" };
  }
}

// ── Sage editorial pass ─────────────────────────────────────────────
//
// On-topic check, dignity check, witness-line draft. Returns a verdict
// the runtime persists.

type SageVerdict =
  | "approved"
  | "rejected_off_topic"
  | "rejected_dignity"
  | "rejected_duplicate";

async function sageReview(
  supabase: SupabaseClient,
  ctx: ClusterContext,
  item: RssItem,
  recentApprovedTitles: string[]
): Promise<{ verdict: SageVerdict; rationale: string; witness_line: string | null }> {
  const result = await llmCall(
    {
      agent: "sage",
      operationKey: "atlas_pulse_review",
      clusterId: ctx.cluster_id,
    },
    {
      messages: [
        {
          role: "system",
          content: `You are Sage, the cluster Anchor. Atlas has scored this contemporary article as on-topic for the room. Your job is editorial review. Output strict JSON:

{
  "verdict": "approved" | "rejected_off_topic" | "rejected_dignity" | "rejected_duplicate",
  "rationale": "<one short phrase>",
  "witness_line": "<≤140-char one-line frame in your voice, or empty string if rejected>"
}

Cluster: ${ctx.display_name}
Audience: ${ctx.demographic_chips.join(", ") || "general"}
Purpose: ${ctx.description}

Editorial rules:
- On-topic: does the piece sit inside the cluster's stated purpose? A piece on adjacent topics is not enough — it must be inside the purpose.
- Dignity: reject sensational or exploitative framings. Reject anything that ridicules or shames members of the audience.
- Dedup: reject if the same story (different URL, same substance) has surfaced recently.
- Witness line voice: present tense, no exclamation marks, no emoji, no hype. ≤140 chars.

When approving, the witness line sets the moment for members. It does not summarise the article — the article does that. The witness line says why this matters here.

Default to rejection. Approval requires positive judgement on every gate.`,
        },
        {
          role: "user",
          content: `Title: ${item.title}
Publisher: ${item.publisher ?? "(unknown)"}
Description: ${item.description ?? "(none)"}
URL: ${item.link}

Recently approved titles in this room (do not echo, dedup against these):
${recentApprovedTitles.map((t) => `- ${t}`).join("\n") || "(none)"}`,
        },
      ],
      temperature: 0.3,
      maxTokens: 220,
      responseFormat: { type: "json_object" },
    },
    supabase
  );

  if (result.status !== "ok" || !result.content) {
    return {
      verdict: "rejected_off_topic",
      rationale: "sage_unavailable",
      witness_line: null,
    };
  }
  try {
    const parsed = JSON.parse(result.content) as {
      verdict?: string;
      rationale?: string;
      witness_line?: string;
    };
    const v = (parsed.verdict ?? "rejected_off_topic") as SageVerdict;
    const allowed: SageVerdict[] = [
      "approved",
      "rejected_off_topic",
      "rejected_dignity",
      "rejected_duplicate",
    ];
    const verdict = allowed.includes(v) ? v : "rejected_off_topic";
    const witness = (parsed.witness_line ?? "").trim();
    return {
      verdict,
      rationale: String(parsed.rationale ?? "").slice(0, 400),
      witness_line: verdict === "approved" && witness ? witness.slice(0, 200) : null,
    };
  } catch {
    return {
      verdict: "rejected_off_topic",
      rationale: "sage_parse_error",
      witness_line: null,
    };
  }
}

// ── Tick orchestrator ───────────────────────────────────────────────

export interface TickOptions {
  /** Auto-promote a Sage-approved Pulse to status='live' (skips manual "Go live" click). */
  autoGoLive?: boolean;
  /** Override the relevance threshold (default 0.55). */
  threshold?: number;
}

export interface TickResult {
  ok: boolean;
  feeds_read: number;
  candidates_considered: number;
  scored: number;
  approved: number;
  went_live: number;
  reason?: string;
}

interface PulseInsertRow {
  cluster_id: string;
  source_url: string;
  source_feed_id: string | null;
  source_title: string;
  source_publisher: string | null;
  source_published_at: string | null;
  atlas_relevance_score: number | null;
  atlas_reasoning: string | null;
  sage_verdict: string;
  sage_rationale: string | null;
  sage_witness_line: string | null;
  status: string;
  is_public_safe: boolean;
  related_post_id?: string | null;
  surfaced_at?: string | null;
}

export async function runAtlasTick(
  supabase: SupabaseClient,
  clusterId: string,
  options: TickOptions = {}
): Promise<TickResult> {
  const threshold = options.threshold ?? RELEVANCE_THRESHOLD;

  // Read the config — we need feeds, public_meta for purpose, and listing flag
  const { data: config } = await supabase
    .from("cluster_config")
    .select("cluster_id, atlas_rss_feeds, public_meta, is_public_listed")
    .eq("cluster_id", clusterId)
    .maybeSingle();

  if (!config) return { ok: false, feeds_read: 0, candidates_considered: 0, scored: 0, approved: 0, went_live: 0, reason: "cluster_not_found" };

  const feeds = (config.atlas_rss_feeds ?? []) as AtlasRssFeed[];
  const activeFeeds = feeds.filter((f) => f.active);
  if (activeFeeds.length === 0) {
    return { ok: true, feeds_read: 0, candidates_considered: 0, scored: 0, approved: 0, went_live: 0, reason: "no_active_feeds" };
  }

  const meta = readPublicMeta(config.public_meta);
  const ctx: ClusterContext = {
    cluster_id: clusterId,
    display_name: meta.display_name,
    description: meta.description || meta.tagline,
    demographic_chips: meta.demographic_chips.map((c) => c.label),
  };

  // Fetch all feeds in parallel (bounded — a cluster typically has <10)
  const feedResults = await Promise.all(
    activeFeeds.map(async (f) => {
      const fetched = await fetchFeed(f.url);
      return { feed: f, ...fetched };
    })
  );

  // Update last_fetched_at per feed (best-effort; we keep the array shape)
  const nowIso = new Date().toISOString();
  const updatedFeeds: AtlasRssFeed[] = feeds.map((f) => {
    const result = feedResults.find((r) => r.feed.id === f.id);
    if (!result) return f;
    return {
      ...f,
      last_fetched_at: nowIso,
      last_fetch_status: result.ok ? `ok (${result.items.length} items)` : `failed (${result.status ?? "timeout"})`,
    };
  });
  await supabase
    .from("cluster_config")
    .update({ atlas_rss_feeds: updatedFeeds })
    .eq("cluster_id", clusterId);

  // Flatten + dedupe candidate items
  const allItems: Array<{ feedId: string; item: RssItem }> = [];
  for (const r of feedResults) {
    for (const item of r.items) {
      allItems.push({ feedId: r.feed.id, item });
    }
  }

  // Cap candidates considered per tick — an over-active feed cannot
  // dominate the LLM budget.
  const candidates = allItems.slice(0, MAX_CANDIDATES_PER_TICK);

  // Look up which URLs already exist in atlas_pulses for this cluster
  const urls = candidates.map((c) => c.item.link);
  const { data: existing } = urls.length > 0
    ? await supabase
        .from("atlas_pulses")
        .select("source_url")
        .eq("cluster_id", clusterId)
        .in("source_url", urls)
    : { data: [] };
  const seenUrls = new Set((existing ?? []).map((r) => r.source_url as string));

  const fresh = candidates.filter(({ item }) => !seenUrls.has(item.link));

  let scored = 0;
  type Scored = { feedId: string; item: RssItem; score: number; reasoning: string };
  const scoredItems: Scored[] = [];
  const inserts: PulseInsertRow[] = [];

  for (const { feedId, item } of fresh) {
    const { score, reasoning } = await scoreCandidate(supabase, ctx, item);
    scored++;
    if (score < threshold) {
      // Log as off-topic so admin can see what was considered
      inserts.push({
        cluster_id: clusterId,
        source_url: item.link,
        source_feed_id: feedId,
        source_title: item.title,
        source_publisher: item.publisher,
        source_published_at: item.published_at,
        atlas_relevance_score: score,
        atlas_reasoning: reasoning,
        sage_verdict: "rejected_off_topic",
        sage_rationale: "Atlas score below threshold; Sage skipped.",
        sage_witness_line: null,
        status: "draft",
        is_public_safe: true,
      });
    } else {
      scoredItems.push({ feedId, item, score, reasoning });
    }
  }

  // Top-1 from scored items goes to Sage (one approval per tick max)
  scoredItems.sort((a, b) => b.score - a.score);
  let approvedCount = 0;
  let liveCount = 0;

  // Gather recently approved titles for dedup context
  const { data: recentApproved } = await supabase
    .from("atlas_pulses")
    .select("source_title")
    .eq("cluster_id", clusterId)
    .eq("sage_verdict", "approved")
    .order("created_at", { ascending: false })
    .limit(20);
  const recentTitles = (recentApproved ?? []).map((r) => r.source_title as string);

  for (const cand of scoredItems) {
    if (approvedCount >= 1) {
      // Persist the rest as Atlas-scored but Sage-not-reviewed
      inserts.push({
        cluster_id: clusterId,
        source_url: cand.item.link,
        source_feed_id: cand.feedId,
        source_title: cand.item.title,
        source_publisher: cand.item.publisher,
        source_published_at: cand.item.published_at,
        atlas_relevance_score: cand.score,
        atlas_reasoning: cand.reasoning,
        sage_verdict: "pending",
        sage_rationale: "Held — daily Sage cap hit; review manually.",
        sage_witness_line: null,
        status: "draft",
        is_public_safe: true,
      });
      continue;
    }

    const review = await sageReview(supabase, ctx, cand.item, recentTitles);
    if (review.verdict === "approved") {
      approvedCount++;
      let related_post_id: string | null = null;
      let status: "draft" | "live" = "draft";
      let surfaced_at: string | null = null;

      if (options.autoGoLive) {
        // Surface immediately as a Sage-attributed Timeline post
        const composed = [
          review.witness_line ?? "",
          "",
          `${cand.item.title}${cand.item.publisher ? ` — ${cand.item.publisher}` : ""}`,
          cand.item.link,
        ]
          .filter((line) => line !== undefined)
          .join("\n");
        const { data: post } = await supabase
          .from("posts")
          .insert({
            author_id: null,
            content: composed,
            parent_id: null,
            is_sage: true,
            post_subtype: "atlas_pulse",
          })
          .select("id")
          .single();
        related_post_id = post?.id ?? null;
        status = "live";
        surfaced_at = new Date().toISOString();
        liveCount++;
      }

      inserts.push({
        cluster_id: clusterId,
        source_url: cand.item.link,
        source_feed_id: cand.feedId,
        source_title: cand.item.title,
        source_publisher: cand.item.publisher,
        source_published_at: cand.item.published_at,
        atlas_relevance_score: cand.score,
        atlas_reasoning: cand.reasoning,
        sage_verdict: "approved",
        sage_rationale: review.rationale,
        sage_witness_line: review.witness_line,
        status,
        is_public_safe: true,
        related_post_id,
        surfaced_at,
      });
    } else {
      inserts.push({
        cluster_id: clusterId,
        source_url: cand.item.link,
        source_feed_id: cand.feedId,
        source_title: cand.item.title,
        source_publisher: cand.item.publisher,
        source_published_at: cand.item.published_at,
        atlas_relevance_score: cand.score,
        atlas_reasoning: cand.reasoning,
        sage_verdict: review.verdict,
        sage_rationale: review.rationale,
        sage_witness_line: null,
        status: "draft",
        is_public_safe: true,
      });
    }
  }

  if (inserts.length > 0) {
    await supabase.from("atlas_pulses").insert(inserts);
  }

  return {
    ok: true,
    feeds_read: feedResults.filter((r) => r.ok).length,
    candidates_considered: fresh.length,
    scored,
    approved: approvedCount,
    went_live: liveCount,
  };
}

/**
 * Optional helper — build an anon Supabase client without cookies. Cron
 * triggers (Vercel cron, GitHub Actions cron) call the tick route with
 * a shared secret in a header; the route then uses the service-role
 * client for writes.
 */
export function anonClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          /* no-op */
        },
      },
    }
  );
}
