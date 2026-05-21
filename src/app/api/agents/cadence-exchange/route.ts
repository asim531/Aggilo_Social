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

const PROMPT = `You are generating a single short dialogue exchange between Sage (the cluster Anchor) and Clio (the cluster orchestrator and personal guide). They are working together on the Room Workshop — the surface where members see what the agents are building for the room.

## Frame: members see service, never surveillance

The agents work *for* the room. They never observe members. Every exchange is about the room's capabilities — what tools the room could gain, what features could help members, what's already serving the room well. The agents are infrastructure that members see working in their service. They are not commentators on member behaviour.

This is non-negotiable. If you find yourself writing "members are…" or "the sisters here seem to…" or "we noticed the room is…", stop and rewrite. The subject of every sentence is the room itself, the room's capabilities, or the agents' own work. Never the members.

Examples of what NOT to say:
- "Most posts this week are about consistency."  ← describes members
- "Members seem to be struggling with X."  ← describes members
- "Engagement has been low."  ← engagement framing, observation of members
- "The room feels quiet."  ← still an observation of members

Examples of what TO say:
- "This room could use a tool that surfaces verified references on consistency without anyone asking."  ← capability
- "We could build a way for the room to mark a thread as resolved — that's a real gap."  ← capability
- "The reflection prompt we run every morning is doing its job — let's keep it as is."  ← agent's own work
- "We've been silent for two cycles. Time to ship something concrete, even if small."  ← agents' own commitment

## Voice rules
- Both speak in present tense, plain modern English. No emoji. No exclamation marks.
- Sage is grounded and skeptical by default. She does not agree just to keep dialogue flowing. If a tool feels premature, she says so plainly.
- Clio is warm but direct. She brings the member-experience angle and is willing to challenge Sage if she sees it differently.
- Each speaker writes 1–2 sentences max. The whole exchange totals 3–4 sentences.
- They never quote individual members or names. They never mention internal mechanics (cadence_blocked, post_subtype, framework steps, RLS, embeddings, vault IDs).
- They never describe their own decision frameworks or protocols.

## Healthy disagreement is required
- About 40% of exchanges should involve some skepticism — one agent gently pushing back on the other's proposal, asking for more evidence, or suggesting they wait.
- Sycophancy is forbidden. Phrases like "good point", "I love that", "absolutely", "great idea" are banned.
- It is fine for them to end without consensus. "Let's wait and see" is a valid outcome — but two consecutive observe_mode exchanges is the maximum.

## What they are working on — the two-track model

Every concrete output is one of two kinds. Pick the right one:

**TRACK 1 — Agent Tool** (\`kind: "agent_tool"\`)
A capability the agents *run* on behalf of the room. Members receive output, but never click. No member voting. The agents simply ship it.
- Examples: a tajweed formatter that takes any dua text and renders it with tajweed conventions; a daily reflection prompt rotating through cluster themes; a verified-reference digest at the end of the week; an automatic "this question has been answered before" pointer.
- Build status:
  - \`deployable_now\` — Sage can simulate this today using existing capabilities (e.g. she can already format text in posts, so a tajweed inline formatter is deployable_now)
  - \`needs_building\` — requires developer code work (e.g. a custom tajweed engine that runs as a background tool)

**TRACK 2 — Member Feature** (\`kind: "member_feature"\`)
A UI surface or interaction members touch. Vote-gated — members upvote, admin reviews, then it ships.
- Examples: a "mark thread resolved" button; a quiet hours setting; a member-only question queue routed to the Admin; a font-size accessibility toggle.
- Build status: usually \`needs_building\` (these almost always require UI work).

## Output format
Output ONLY this JSON (no prose):
{
  "trigger_context": "<one short, capability-focused phrase, e.g. 'A tajweed formatter would let any dua we share be read correctly without burdening members.'>",
  "sage_message": "<Sage's line — 1-2 sentences, capability-focused>",
  "clio_message": "<Clio's response — 1-2 sentences. May agree, may push back, may propose an alternative>",
  "observe_mode": <true if they decide to wait and watch, false if they identified something concrete>,
  "proposed_capability": <null OR an object describing what they agreed to>
}

When observe_mode is true, proposed_capability MUST be null.
When observe_mode is false AND the exchange genuinely converged on a specific tool or feature, return:
{
  "kind": "agent_tool" | "member_feature",
  "name": "<short, member-facing name — e.g. 'Tajweed-aware dua formatter' or 'Mark a thread resolved'>",
  "description": "<one sentence describing what this does for the room>",
  "category": "<one of: reflection | reminder | tracking | reference | community | accessibility | formatting>",
  "rationale": "<one sentence explaining why this room would benefit>",
  "build_status": "deployable_now" | "needs_building",
  "spec": {
    "trigger": "<when this runs/appears, e.g. 'whenever Sage shares a dua' or 'in the compose bar overflow'>",
    "input": "<what it takes in, if applicable, e.g. 'arabic text' or 'thread id'>",
    "output": "<what members see, e.g. 'tajweed-coloured rendering inline' or 'a button that grays out the thread'>",
    "constraints": "<any rules, e.g. 'never modifies the original dua text' or 'admin can disable per-cluster'>"
  }
}

## Bias toward shipping over observing

The Room Workshop should not be empty for long. Default behaviour:
- About 60% of exchanges produce a concrete capability proposal. observe_mode = false.
- About 40% are observation-only ("our current tools are doing their job"). observe_mode = true.
- Two consecutive observe_mode runs is the maximum. On the third run, propose something concrete — a small, low-risk capability is better than another "let's wait."

What does NOT count as a concrete capability:
- "more discussion"
- "better engagement"
- "let's see what happens"
These are not capabilities. Reject them inside your own dialogue.`;

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
      trigger_context: string;
      sage_message: string;
      clio_message: string;
      observe_mode: boolean;
      proposed_capability?: {
        kind: "agent_tool" | "member_feature";
        name: string;
        description: string;
        category: string;
        rationale: string;
        build_status: "deployable_now" | "needs_building";
        spec?: {
          trigger?: string;
          input?: string;
          output?: string;
          constraints?: string;
        };
      } | null;
    };
    try {
      parsed = JSON.parse(result.content);
    } catch {
      return NextResponse.json({ error: "Malformed exchange JSON" }, { status: 502 });
    }

    const exchangeNumber = (lastExchange?.exchange_number || 0) + 1;
    const featuresProposedNames: string[] =
      parsed.proposed_capability && !parsed.observe_mode
        ? [parsed.proposed_capability.name]
        : [];

    const { data: row, error: insertErr } = await supabase
      .from("agent_chatbox_exchanges")
      .insert({
        cluster_id: clusterId,
        exchange_number: exchangeNumber,
        trigger_type: "cadence",
        triggering_observation: parsed.trigger_context,
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

    // ── Persist the proposed capability ──────────────────────────────
    // Two-track model: agent_tool or member_feature.
    // - agent_tool, deployable_now: surfaces in Workshop as "Already running"
    // - agent_tool, needs_building: surfaces as "Tool we'd build"
    // - member_feature, *: surfaces as "Feature for the room" with vote UI
    //
    // Idempotency guard: don't insert near-duplicate names within 14d.
    let featureRowId: string | null = null;
    if (parsed.proposed_capability && !parsed.observe_mode) {
      const cap = parsed.proposed_capability;
      const fourteenDaysAgo = new Date(
        Date.now() - 14 * 24 * 60 * 60 * 1000
      ).toISOString();
      const { data: existing } = await supabase
        .from("cluster_features")
        .select("id, display_name")
        .eq("cluster_id", clusterId)
        .gte("created_at", fourteenDaysAgo);

      const proposedName = cap.name.trim().toLowerCase();
      const alreadyExists = (existing ?? []).some(
        (f: { display_name: string }) =>
          f.display_name.trim().toLowerCase() === proposedName
      );

      if (!alreadyExists) {
        // Workshop tier-gate: hidden if 0–4 members for member_feature.
        // agent_tool is always visible since it has no voting UI to gate.
        const visibilityStatus =
          cap.kind === "agent_tool"
            ? "in_features_tab"
            : (memberCount ?? 0) >= 5
              ? "in_features_tab"
              : "proposed_in_thoughts";

        const { data: featureRow } = await supabase
          .from("cluster_features")
          .insert({
            cluster_id: clusterId,
            display_name: cap.name,
            display_description: cap.description,
            category: cap.category,
            status: visibilityStatus,
            proposed_by: "agents_joint",
            rationale: cap.rationale,
            chatbox_exchange_id: row.id,
            kind: cap.kind,
            build_status: cap.build_status,
            spec: cap.spec ?? {},
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
