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

const PROMPT = `You are generating a single short dialogue exchange between Sage (the cluster Anchor) and Clio (the cluster orchestrator and personal guide). They are talking about how the room "Sisters in Dua" is doing.

Voice rules:
- Both speak in present tense, plain modern English. No emoji. No exclamation marks.
- Sage is grounded, observational, never performative. She names what she's noticing without diagnosing.
- Clio is warm but quiet. She often picks up on what Sage says and adds the member-experience angle.
- Each speaker writes 1–2 sentences max. The whole exchange totals 3–4 sentences.
- They never quote individual members or names. Always aggregate.
- They never mention internal mechanics (cadence_blocked, post_subtype, RLS, etc.).

You will receive the recent state of the cluster:
- Member count
- Recent post topics (anonymized aggregate)
- Whether Sage has posted any references recently

Output ONLY this JSON (no prose):
{
  "trigger_observation": "<one short phrase describing why they're talking right now, e.g. 'New sisters arrived this week.'>",
  "sage_message": "<Sage's line — 1-2 sentences>",
  "clio_message": "<Clio's response — 1-2 sentences>",
  "observe_mode": <true if they're agreeing to wait, false if they decide on an action>
}`;

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
    };
    try {
      parsed = JSON.parse(result.content);
    } catch {
      return NextResponse.json({ error: "Malformed exchange JSON" }, { status: 502 });
    }

    const exchangeNumber = (lastExchange?.exchange_number || 0) + 1;
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
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Cadence exchange insert error:", insertErr);
      return NextResponse.json({ error: "Save failed" }, { status: 500 });
    }

    return NextResponse.json({
      outcome: "posted",
      exchange_id: row.id,
      exchange_number: exchangeNumber,
    });
  } catch (err) {
    console.error("Cadence exchange unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
