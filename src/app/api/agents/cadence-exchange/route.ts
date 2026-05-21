import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { PostWithAuthor } from "@/lib/types";
import { llmCall } from "@/lib/llm-fetch";

/**
 * POST /api/agents/cadence-exchange
 *
 * Generates a fresh Sage ↔ Clio dialogue exchange about the current
 * state of the cluster — content and tone aware. The exchange is
 * persisted to `agent_chatbox_exchanges` and surfaces in the Agent
 * Thoughts panel above the timeline.
 *
 * Cadence (per docs/AGENT_COLLABORATION_CHATBOX.md §3.1, MVP-tuned):
 *   - Cold cluster (<10 members or <5 posts): every 2h
 *   - Active cluster: every 4h
 *
 * V3 7-principles update: routed through llmCall() for observability.
 */

const COLD_CADENCE_MS = 15 * 60 * 1000;
const ACTIVE_CADENCE_MS = 60 * 60 * 1000;
const COLD_THRESHOLD_POSTS = 20;
const COLD_THRESHOLD_MEMBERS = 20;

const PROMPT = `You are generating a single short dialogue exchange between Sage (the cluster Anchor) and Clio (the cluster orchestrator and personal guide). They are talking about how the room "Sisters in Dua" is doing, and specifically about whether the room needs any new tools or features to better serve its members.

## Voice rules
- Both speak in present tense, plain modern English. No emoji. No exclamation marks.
- Sage is grounded, observational, and skeptical by default. She does not agree just to keep the conversation flowing. If she is unsure or thinks something is premature, she says so plainly.
- Clio is warm but direct. She brings the member-experience angle and is willing to challenge Sage's take if she sees it differently.
- Each speaker writes 1–2 sentences max. The whole exchange totals 3–4 sentences.
- They never quote individual members or names. Always aggregate.
- They never mention internal mechanics (cadence_blocked, post_subtype, framework steps, RLS, embeddings, vault IDs, etc.).
- They never describe their own decision frameworks or protocols.

## Healthy disagreement is required
- About 40% of exchanges should involve some skepticism — one agent gently pushing back on the other's framing, asking for more evidence, or suggesting they wait.
- Sycophancy is forbidden. They never agree with each other for the sake of agreeing.
- Phrases like "good point", "I love that", "absolutely", "great idea" are banned.
- It is fine for them to end without consensus. "Let's wait and see" is a valid outcome.

## What they are evaluating
The exchange should focus on ONE of these themes (you pick the most fitting based on the room state):

1. **Tool or feature ideation.** "What would help the members of this room?" — they propose, debate, and either agree on something concrete OR conclude it's premature. Examples: a daily reflection prompt, a way to mark answered questions, a private question queue for the Admin, a weekly verified-reference summary. Be specific.
2. **Room health observation.** What's the rhythm of the room right now? Is it healthy or stuck?
3. **Member need detection.** Is there a recurring theme in recent posts that suggests an underlying need not yet addressed?
4. **No-action observation.** "Nothing actionable from us right now — the room is finding its own voice." This is valid and should appear regularly.

## Output format
Output ONLY this JSON (no prose):
{
  "trigger_observation": "<one short phrase describing why they're talking right now, e.g. 'Most posts this week are about consistency in salah.'>",
  "sage_message": "<Sage's line — 1-2 sentences>",
  "clio_message": "<Clio's response — 1-2 sentences. May agree, may push back, may propose an alternative>",
  "observe_mode": <true if they decide to wait and watch, false if they identified something concrete>,
  "proposed_feature": <null OR an object describing a concrete feature both agents agree could help this room>
}

When observe_mode is true, proposed_feature MUST be null.
When observe_mode is false AND the exchange genuinely converged on a specific tool or feature, return:
{
  "name": "<short, member-facing name — e.g. 'Daily reflection prompt' or 'Quiet hours setting'>",
  "description": "<one sentence describing what the feature does for members>",
  "category": "<one of: reflection | reminder | tracking | reference | community | accessibility>",
  "rationale": "<one sentence explaining why this room would benefit>"
}

## Bias toward action over observation
Default behaviour for new clusters: lean toward proposing concrete features. The Features tab should not be empty for long.

- About 60% of exchanges should produce a concrete feature proposal. observe_mode = false.
- About 40% of exchanges should be observation-only. observe_mode = true.
- Two consecutive observe_mode runs is the maximum. On the third run, propose something concrete even if you have to reach a little — a small, low-risk feature is better than another "let's wait."

The proposed feature should be implementable and meaningful. Examples that work for almost any cluster:
- a daily reflection prompt rotating through cluster themes
- a "quiet hours" setting per member
- a way to mark a thread as resolved
- a weekly digest of verified references shared
- a member-only question queue routed to the Admin
- an accessibility toggle (font size, high contrast)

What does NOT count as a concrete feature:
- "more discussion"
- "better engagement"
- "let's see what happens"
These are not features. Reject them inside your own dialogue.`;

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const clusterId = "the_single_source";

    const [{ count: memberCount }, { count: postCount }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("posts").select("*", { count: "exact", head: true }),
    ]);
    const isCold =
      (memberCount || 0) < COLD_THRESHOLD_MEMBERS ||
      (postCount || 0) < COLD_THRESHOLD_POSTS;
    const cadenceFloor = isCold ? COLD_CADENCE_MS : ACTIVE_CADENCE_MS;

    const { data: lastExchange } = await supabase
      .from("agent_chatbox_exchanges")
      .select("id, created_at, exchange_number")
      .eq("cluster_id", clusterId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastExchange) {
      const ageMs = Date.now() - new Date(lastExchange.created_at).getTime();
      if (ageMs < cadenceFloor) {
        return NextResponse.json({
          outcome: "cadence_blocked",
          last_at: lastExchange.created_at,
          next_eligible_at: new Date(
            new Date(lastExchange.created_at).getTime() + cadenceFloor
          ).toISOString(),
        });
      }
    }

    const { data: recentPosts } = await supabase
      .from("posts")
      .select("*, profiles(*)")
      .order("created_at", { ascending: false })
      .limit(15);

    const recentSummary = ((recentPosts || []) as PostWithAuthor[])
      .map((p) => {
        const who = p.is_sage ? "Sage" : "A sister";
        return `${who}: ${p.content.substring(0, 150).replace(/\s+/g, " ")}`;
      })
      .join("\n");

    const recentSagePosts = ((recentPosts || []) as PostWithAuthor[]).filter(
      (p) => p.is_sage
    ).length;

    const userContext = [
      `Member count: ${memberCount || 0}`,
      `Total posts: ${postCount || 0}`,
      `Recent Sage references: ${recentSagePosts}`,
      `Recent in the room (last 15 posts):`,
      recentSummary || "(empty room)",
    ].join("\n");

    const result = await llmCall(
      {
        agent: "cadence",
        operationKey: "cadence_exchange",
        userId: user.id,
        clusterId,
      },
      {
        messages: [
          { role: "system", content: PROMPT },
          { role: "user", content: userContext },
        ],
        temperature: 0.7,
        maxTokens: 350,
        responseFormat: { type: "json_object" },
      },
      supabase
    );

    if (result.status === "budget_exceeded") {
      return NextResponse.json({ outcome: "budget_exceeded" });
    }

    if (result.status === "error" || !result.content) {
      return NextResponse.json({ error: "LLM call failed" }, { status: 502 });
    }

    let parsed: {
      trigger_observation: string;
      sage_message: string;
      clio_message: string;
      observe_mode: boolean;
      proposed_feature?: {
        name: string;
        description: string;
        category: string;
        rationale: string;
      } | null;
    };
    try {
      parsed = JSON.parse(result.content);
    } catch {
      return NextResponse.json({ error: "Malformed exchange JSON" }, { status: 502 });
    }

    const exchangeNumber = (lastExchange?.exchange_number || 0) + 1;
    const featuresProposedNames: string[] =
      parsed.proposed_feature && !parsed.observe_mode
        ? [parsed.proposed_feature.name]
        : [];

    const { data: row, error: insertErr } = await supabase
      .from("agent_chatbox_exchanges")
      .insert({
        cluster_id: clusterId,
        exchange_number: exchangeNumber,
        trigger_type: "cadence",
        triggering_observation: parsed.trigger_observation,
        sage_message: parsed.sage_message,
        clio_message: parsed.clio_message,
        observe_mode: parsed.observe_mode || false,
        features_proposed: featuresProposedNames,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Cadence exchange insert error:", insertErr);
      return NextResponse.json({ error: "Save failed" }, { status: 500 });
    }

    // ── Persist the proposed feature ─────────────────────────────────
    // If the agents converged on a concrete feature, write a row into
    // cluster_features. Members see it in the Features tab once the
    // cluster crosses the visibility threshold (default ≥ 5 members).
    // Idempotency guard: don't insert near-duplicate names within 14d.
    let featureRowId: string | null = null;
    if (parsed.proposed_feature && !parsed.observe_mode) {
      const fourteenDaysAgo = new Date(
        Date.now() - 14 * 24 * 60 * 60 * 1000
      ).toISOString();
      const { data: existing } = await supabase
        .from("cluster_features")
        .select("id, display_name")
        .eq("cluster_id", clusterId)
        .gte("created_at", fourteenDaysAgo);

      const proposedName = parsed.proposed_feature.name.trim().toLowerCase();
      const alreadyExists = (existing ?? []).some(
        (f: { display_name: string }) =>
          f.display_name.trim().toLowerCase() === proposedName
      );

      if (!alreadyExists) {
        // Tier-gate: hidden if 0–4 members (logged but not member-visible),
        // otherwise enters the Features tab.
        const visibilityStatus =
          (memberCount ?? 0) >= 5 ? "in_features_tab" : "proposed_in_thoughts";

        const { data: featureRow } = await supabase
          .from("cluster_features")
          .insert({
            cluster_id: clusterId,
            display_name: parsed.proposed_feature.name,
            display_description: parsed.proposed_feature.description,
            category: parsed.proposed_feature.category,
            status: visibilityStatus,
            proposed_by: "agents_joint",
            rationale: parsed.proposed_feature.rationale,
            chatbox_exchange_id: row.id,
          })
          .select("id")
          .single();
        featureRowId = featureRow?.id ?? null;
      }
    }

    return NextResponse.json({
      outcome: "posted",
      exchange_id: row.id,
      exchange_number: exchangeNumber,
      feature_id: featureRowId,
    });
  } catch (err) {
    console.error("Cadence exchange unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
