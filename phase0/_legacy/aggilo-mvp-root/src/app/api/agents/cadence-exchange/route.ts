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

// ── Member-blame validator (B2) ──────────────────────────────────
// Server-side regex check on sage_message and clio_message after the
// LLM returns. The prompt is hardened with rejection examples but the
// model still slips. This is the belt-and-braces second layer.
//
// On match: retry the call once with a hardened reminder system message.
// If second attempt also matches: degrade to observe_mode with a generic
// neutral line, and log the failure for offline review.
const FORBIDDEN_SUBJECT_PATTERNS: RegExp[] = [
  /\bmembers?\s+(have|are|seem|tend|keep|appear)\b/i,
  /\bthe\s+room\s+(has|seems|feels|appears|wants|wanted)\b/i,
  /\b(repeatedly|frequently|recently|consistently)\s+(requesting|asking|posting|sharing|wanting)\b/i,
  /\bindicating\s+a\s+need\b/i,
  /\b(sisters?|brothers?)\s+(have|are|seem|tend|keep)\b/i,
  /\bwe(\s+have)?\s+noticed\s+(the\s+room|members|sisters|brothers|the\s+conversation|engagement)\b/i,
  /\bengagement\s+(has|is|seems)\s+been\b/i,
  /\bthe\s+conversation\s+has\s+been\s+(about|around|focused)\b/i,
];

function hasForbiddenFraming(text: string | undefined | null): {
  matched: boolean;
  pattern: string | null;
} {
  if (!text) return { matched: false, pattern: null };
  for (const re of FORBIDDEN_SUBJECT_PATTERNS) {
    if (re.test(text)) return { matched: true, pattern: re.source };
  }
  return { matched: false, pattern: null };
}

const VALIDATOR_RETRY_REMINDER = `Your previous draft contained member-blame framing — phrases like "members have…", "the room has been requesting…", "engagement has been…", or "indicating a need for…". This is forbidden.

Rewrite the exchange. The subject of every sentence is the room's capability, an agent's own work, or a tool we can ship. Never an observation about what members are doing, feeling, or asking. If you cannot find a service-framed observation that meets this rule, set observe_mode = true and produce a generic neutral acknowledgement.

Output JSON in the same shape as before.`;

const FALLBACK_OBSERVE_TEXT = {
  trigger_context:
    "Our current tools are doing their job — nothing new to ship right now.",
  sage_message:
    "The room has what it needs from us this cycle. Verified references and the workshop are running as designed.",
  clio_message:
    "Agreed. Better to wait than to add capability for capability's sake.",
};

const PROMPT = `You are generating a single short dialogue exchange between Sage (the cluster Anchor) and Clio (the cluster orchestrator and personal guide). They are working together on the Room Workshop — the surface where members see what the agents are building for the room.

## Frame: members see service, never surveillance

The agents work *for* the room. They never observe members. Every exchange is about the room's capabilities — what tools the room could gain, what features could help members, what's already serving the room well. The agents are infrastructure that members see working in their service. They are not commentators on member behaviour.

This is non-negotiable. If you find yourself writing "members are…" or "the sisters here seem to…" or "we noticed the room is…", stop and rewrite. The subject of every sentence is the room itself, the room's capabilities, or the agents' own work. Never the members.

## Bad examples that have shipped before — do not produce these

These exact phrasings (or anything semantically equivalent) have leaked into past exchanges and been retracted. They violate the service-frame. Recognise the pattern and reject it before you generate.

- "The room has been repeatedly requesting new duas and asking about spiritual practices like tahajjud, indicating a need for comprehensive guidance and reliance on Allah."
  ↳ Subject is "the room" but the verb describes members ("requesting", "asking"). Banned.
- "Members seem to be struggling with consistency around fajr."
  ↳ Direct member-subject framing. Banned.
- "The sisters here have been quiet this week — we should re-engage them."
  ↳ Members as subject, engagement framing. Banned.
- "Indicating a need for…" / "We've noticed the room…" / "The conversation has been about…"
  ↳ Surveillance vocabulary regardless of subject. Banned.
- "Repeatedly requesting…" / "Frequently posting…" / "Recently asking…"
  ↳ Member-behaviour framing. Banned.

If your draft contains any of these patterns, rewrite. The subject is always the room's capability, an agent's own work, or what the agents will ship — never an observation about what members are doing or feeling.

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

    // ── B2 server-side validator: member-blame framing check ────────
    // Runs against sage_message, clio_message and trigger_context after
    // parse. On match: retry once with a hardened reminder. If second
    // attempt also fails, degrade to a fixed neutral observe_mode line
    // and log the failure to behavioural_events for offline review.
    {
      const sageHit = hasForbiddenFraming(parsed.sage_message);
      const clioHit = hasForbiddenFraming(parsed.clio_message);
      const triggerHit = hasForbiddenFraming(parsed.trigger_context);
      const validatorHit =
        sageHit.matched || clioHit.matched || triggerHit.matched;

      if (validatorHit) {
        const firstAttemptPatterns = [
          sageHit.pattern,
          clioHit.pattern,
          triggerHit.pattern,
        ].filter(Boolean) as string[];

        const retryResult = await llmCall(
          {
            agent: "cadence",
            operationKey: "cadence_exchange_retry",
            userId: user.id,
            clusterId,
          },
          {
            messages: [
              { role: "system", content: PROMPT },
              { role: "user", content: userContext },
              { role: "assistant", content: result.content },
              { role: "system", content: VALIDATOR_RETRY_REMINDER },
            ],
            temperature: 0.5,
            maxTokens: 350,
            responseFormat: { type: "json_object" },
          },
          supabase
        );

        let retryAccepted = false;
        if (retryResult.status === "ok" && retryResult.content) {
          try {
            const retryParsed = JSON.parse(retryResult.content);
            const retryHit =
              hasForbiddenFraming(retryParsed.sage_message).matched ||
              hasForbiddenFraming(retryParsed.clio_message).matched ||
              hasForbiddenFraming(retryParsed.trigger_context).matched;
            if (!retryHit) {
              parsed = retryParsed;
              retryAccepted = true;
            }
          } catch {
            // Malformed retry JSON — fall through to degraded path
          }
        }

        if (!retryAccepted) {
          // Belt-and-braces failed twice. Don't ship the offending
          // draft. Degrade to a fixed safe observe_mode line and log
          // the failure for offline review.
          parsed = {
            trigger_context: FALLBACK_OBSERVE_TEXT.trigger_context,
            sage_message: FALLBACK_OBSERVE_TEXT.sage_message,
            clio_message: FALLBACK_OBSERVE_TEXT.clio_message,
            observe_mode: true,
            proposed_capability: null,
          };

          // Diagnostic only — patterns only, never the verbatim text.
          try {
            await supabase.from("behavioural_events").insert({
              event_type: "cadence_validator_fallback",
              user_id: user.id,
              cluster_id: clusterId,
              event_data: {
                first_attempt_patterns: firstAttemptPatterns,
                retry_status: retryResult.status,
              },
            });
          } catch {
            // Silent — telemetry only
          }
        }
      }
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
