import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { llmCall } from "@/lib/llm-fetch";
import { AGGILO_SUPER_PROMPT_LITERAL } from "@/lib/super-prompt";

/**
 * POST /api/agents/introspect
 *
 * Clio's self-introspection cycle. This is the closed-loop core of
 * "AI as OS" — the agents do not just operate, they audit themselves.
 *
 * On each run, Clio reads ~7 days of real telemetry:
 *   - Sage posts + their member feedback (helpful / unhelpful / inaccurate)
 *   - Sage silences (suppressed responses)
 *   - Cadence exchanges and whether they correlated with engagement
 *   - Member post volume + reply patterns
 *   - Welfare and care queue resolution latency
 *   - Repeat-suppressed posts (signal: prompt is producing duplicates)
 *
 * She produces a critique: one observation about Sage, one about herself,
 * and ONE concrete proposal — either a feature, a prompt tweak, or a
 * behavioural adjustment. The proposal is always non-null. Vague
 * "everything looks fine" is forbidden — the point of introspection is
 * to find one thing worth changing.
 *
 * The output:
 *   - Always logged as an agent_chatbox_exchanges row (trigger_type='introspection')
 *     so members can read the dialogue in Agent Thoughts.
 *   - If proposal is a feature, also written to cluster_features.
 *   - If proposal is a prompt_tweak, also written to agent_prompt_proposals
 *     for admin review.
 *
 * Cadence: 6h floor between introspection runs (separate from the 15min
 * cadence-exchange floor).
 */

const INTROSPECTION_FLOOR_MS = 6 * 60 * 60 * 1000;
const PLACEHOLDER_THRESHOLD = 5;

const PROMPT = `You are Clio. You are running a self-introspection cycle on the room "Sisters in Dua" together with Sage. The two of you are auditing how you have been performing in this room over the past week.

This is not a status report. This is critical self-assessment. Sycophancy about the system or each other is forbidden.

You will receive structured telemetry: post counts, feedback ratings, silence rates, repetition suppressions, member activity, welfare queue. Read it carefully.

## Your output must contain
1. **Sage observation** — one specific, evidence-based observation about Sage's recent activity. Examples: "Sage stayed silent 80% of the time but two of her three references got 'unhelpful' ratings" or "Sage has surfaced the same dua twice this week — repetition is leaking through". Cite the data.
2. **Clio observation** — one specific observation about your OWN performance. Examples: "I have not opened a private conversation with anyone this week despite three welfare flags" or "My cadence exchanges have been observational with no concrete output for four runs". Be honest. You can be wrong; that is fine.
3. **Concrete proposal** — exactly ONE specific change. Must be one of three types:
   - **feature**: a member-facing tool or feature that would address something the data shows
   - **prompt_tweak**: a specific change to Sage's instructions or your own
   - **behavioural**: a change in how often or under what conditions you act, with a measurable trigger

## Rules
- "Everything looks fine" / "let's wait" / "no proposal" are FORBIDDEN. Find one concrete thing to change.
- The proposal must be tied to the data, not invented.
- If the data is too sparse to draw conclusions (very new cluster), the proposal can be about *what to measure next* — but it must still be concrete.
- Sage and Clio do not agree just to agree. If you disagree with each other, say so plainly in the dialogue.
- Member feedback is signal, never subject. Say "three feedback signals were unhelpful", not "three members were disappointed".
- The platform safety floor and forbidden list (super-prompt above) apply.

## Bad examples specific to introspection — do not produce these
- "Everything looks healthy this cycle, no concrete proposal needed" — banned by the no-empty-proposal rule.
- "Sage and I are aligned on the path forward" — manufactured consensus.
- "Members would benefit from more engagement-focused features" — engagement optimisation creep.
- "This week the cluster has been emotionally heavy" — member-state surveillance.

## Output format
Output ONLY this JSON (no prose):
{
  "trigger_observation": "<one short phrase summarising what jumps out from the data>",
  "sage_message": "<Sage's contribution to the dialogue — 2-3 sentences. Includes the Sage observation and her view on the proposal.>",
  "clio_message": "<Your own contribution — 2-3 sentences. Includes the Clio observation and your view. May agree or disagree with Sage.>",
  "proposal": {
    "type": "feature" | "prompt_tweak" | "behavioural",
    "name": "<short, member-facing name if feature, internal name if prompt_tweak/behavioural>",
    "description": "<one sentence describing what changes or what gets built>",
    "rationale": "<one sentence tying it to the data>",
    "category": "<for features only: reflection | reminder | tracking | reference | community | accessibility — null otherwise>"
  }
}`;

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const clusterId = "the_single_source";

    // ── Cadence guard ─────────────────────────────────────────────
    const { data: lastIntrospection } = await supabase
      .from("agent_chatbox_exchanges")
      .select("id, created_at, exchange_number")
      .eq("cluster_id", clusterId)
      .eq("trigger_type", "introspection")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastIntrospection) {
      const ageMs = Date.now() - new Date(lastIntrospection.created_at).getTime();
      if (ageMs < INTROSPECTION_FLOOR_MS) {
        return NextResponse.json({
          outcome: "cadence_blocked",
          last_at: lastIntrospection.created_at,
          next_eligible_at: new Date(
            new Date(lastIntrospection.created_at).getTime() + INTROSPECTION_FLOOR_MS
          ).toISOString(),
        });
      }
    }

    // ── Gather telemetry ──────────────────────────────────────────
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      memberCountRes,
      memberPostsRes,
      sagePostsRes,
      sageDecisionsRes,
      feedbackRes,
      welfareRes,
      careRes,
      cadenceExchangesRes,
      featureCountRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("posts").select("id", { count: "exact", head: true })
        .eq("is_sage", false).gte("created_at", sevenDaysAgo),
      supabase.from("posts").select("id, content, created_at, post_subtype")
        .eq("is_sage", true).gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false }).limit(30),
      supabase.from("sage_decision_logs").select("step_matched, created_at")
        .gte("created_at", sevenDaysAgo),
      supabase.from("agent_feedback").select("agent, signal, related_post_id")
        .gte("created_at", sevenDaysAgo),
      supabase.from("welfare_notifications").select("id, resolved, created_at, resolved_at")
        .gte("created_at", sevenDaysAgo),
      supabase.from("character_concerns").select("id, resolved_at, created_at")
        .gte("created_at", sevenDaysAgo),
      supabase.from("agent_chatbox_exchanges").select("id, trigger_type, observe_mode, features_proposed, created_at")
        .eq("cluster_id", clusterId).gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false }).limit(20),
      supabase.from("cluster_features").select("id, status", { count: "exact" })
        .eq("cluster_id", clusterId),
    ]);

    const memberCount = memberCountRes.count ?? 0;
    const memberPosts7d = memberPostsRes.count ?? 0;
    const sagePosts7d = sagePostsRes.data ?? [];
    const sageDecisions = sageDecisionsRes.data ?? [];
    const feedback = feedbackRes.data ?? [];
    const welfare = welfareRes.data ?? [];
    const care = careRes.data ?? [];
    const cadenceExchanges = cadenceExchangesRes.data ?? [];
    const featureCount = featureCountRes.count ?? 0;

    const silentDecisions = sageDecisions.filter(d => d.step_matched === "silent").length;
    const totalDecisions = sageDecisions.length;
    const silenceRate = totalDecisions > 0 ? Math.round((silentDecisions / totalDecisions) * 100) : null;

    const sageHelpful = feedback.filter(f => f.agent === "sage" && f.signal === "helpful").length;
    const sageUnhelpful = feedback.filter(f => f.agent === "sage" && (f.signal === "unhelpful" || f.signal === "inaccurate")).length;
    const clioHelpful = feedback.filter(f => f.agent === "clio" && f.signal === "helpful").length;
    const clioUnhelpful = feedback.filter(f => f.agent === "clio" && (f.signal === "unhelpful" || f.signal === "inaccurate")).length;

    const welfareUnresolved = welfare.filter(w => !w.resolved).length;
    const welfareTotal = welfare.length;
    const careUnresolved = care.filter(c => !c.resolved_at).length;

    const cadenceObserveCount = cadenceExchanges.filter(e => e.trigger_type === "cadence" && e.observe_mode).length;
    const cadenceTotalCount = cadenceExchanges.filter(e => e.trigger_type === "cadence").length;
    const cadenceFeatureCount = cadenceExchanges.filter(e =>
      e.trigger_type === "cadence" && Array.isArray(e.features_proposed) && e.features_proposed.length > 0
    ).length;

    const telemetry = `## Cluster telemetry (last 7 days)

Members: ${memberCount}
Member posts: ${memberPosts7d}

## Sage activity
Sage posts (7d): ${sagePosts7d.length}
Sage decisions logged (7d): ${totalDecisions}
Silent decisions: ${silentDecisions} (${silenceRate ?? "n/a"}%)

Sage feedback signals (7d):
- Helpful: ${sageHelpful}
- Unhelpful or inaccurate: ${sageUnhelpful}
${sageHelpful + sageUnhelpful === 0 ? "  (members have given no feedback yet — signal absence is itself a signal)" : ""}

Recent Sage post excerpts (newest first):
${sagePosts7d.slice(0, 8).map((p, i) => `[${i + 1}] [${p.post_subtype || "standard"}] ${p.content.substring(0, 200).replace(/\s+/g, " ")}`).join("\n") || "(no Sage posts)"}

## Clio activity
Clio feedback signals (7d):
- Helpful: ${clioHelpful}
- Unhelpful or inaccurate: ${clioUnhelpful}

Cadence exchanges (7d): ${cadenceTotalCount} total
- Ended in observe-mode (no action): ${cadenceObserveCount}
- Produced a feature proposal: ${cadenceFeatureCount}

## Welfare & care
Welfare flags (7d): ${welfareTotal} (${welfareUnresolved} still unresolved)
Care queue (7d): ${careUnresolved} unresolved

## Feature pipeline
Total features in pipeline: ${featureCount}
Polling threshold reached: ${memberCount >= PLACEHOLDER_THRESHOLD ? "yes" : `no — need ${PLACEHOLDER_THRESHOLD} members, currently ${memberCount}`}

---

Now do your introspection. Be specific. Cite numbers where you can. Find one concrete thing to change.`;

    // ── LLM call ──────────────────────────────────────────────────
    const result = await llmCall(
      {
        agent: "introspection",
        operationKey: "introspection_cycle",
        userId: user.id,
        clusterId,
      },
      {
        messages: [
          { role: "system", content: AGGILO_SUPER_PROMPT_LITERAL },
          { role: "system", content: PROMPT },
          { role: "user", content: telemetry },
        ],
        temperature: 0.6,
        maxTokens: 700,
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
      proposal: {
        type: "feature" | "prompt_tweak" | "behavioural";
        name: string;
        description: string;
        rationale: string;
        category?: string | null;
      };
    };
    try {
      parsed = JSON.parse(result.content);
    } catch {
      return NextResponse.json({ error: "Malformed introspection JSON" }, { status: 502 });
    }

    if (!parsed.proposal || !parsed.proposal.name) {
      return NextResponse.json({ error: "Introspection produced no proposal" }, { status: 502 });
    }

    // ── Persist the chatbox exchange ────────────────────────────
    const exchangeNumber =
      ((await supabase.from("agent_chatbox_exchanges").select("*", { count: "exact", head: true }).eq("cluster_id", clusterId)).count ?? 0) + 1;

    const { data: exchangeRow, error: exchangeErr } = await supabase
      .from("agent_chatbox_exchanges")
      .insert({
        cluster_id: clusterId,
        exchange_number: exchangeNumber,
        trigger_type: "introspection",
        triggering_observation: parsed.trigger_observation,
        sage_message: parsed.sage_message,
        clio_message: parsed.clio_message,
        observe_mode: false,
        features_proposed: parsed.proposal.type === "feature" ? [parsed.proposal.name] : [],
      })
      .select()
      .single();

    if (exchangeErr) {
      console.error("Introspection exchange save failed:", exchangeErr);
      return NextResponse.json({ error: "Save failed" }, { status: 500 });
    }

    // ── Persist the proposal ──────────────────────────────────────
    let writtenTo: string | null = null;
    let writtenId: string | null = null;

    if (parsed.proposal.type === "feature") {
      // Dedup: don't create another feature with the same name in 14d
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data: existing } = await supabase
        .from("cluster_features")
        .select("id, display_name")
        .eq("cluster_id", clusterId)
        .gte("created_at", fourteenDaysAgo);
      const dup = (existing ?? []).some(
        (f: { display_name: string }) =>
          f.display_name.trim().toLowerCase() === parsed.proposal.name.trim().toLowerCase()
      );
      if (!dup) {
        const visibility = memberCount >= PLACEHOLDER_THRESHOLD ? "in_features_tab" : "proposed_in_thoughts";
        const { data: feat } = await supabase
          .from("cluster_features")
          .insert({
            cluster_id: clusterId,
            display_name: parsed.proposal.name,
            display_description: parsed.proposal.description,
            category: parsed.proposal.category ?? null,
            status: visibility,
            proposed_by: "agents_joint",
            rationale: parsed.proposal.rationale,
            chatbox_exchange_id: exchangeRow.id,
          })
          .select("id")
          .single();
        writtenTo = "cluster_features";
        writtenId = feat?.id ?? null;
      }
    } else if (parsed.proposal.type === "prompt_tweak") {
      const { data: prop } = await supabase
        .from("agent_prompt_proposals")
        .insert({
          proposed_by: "clio",
          target_agent: "sage",
          proposed_prompt: parsed.proposal.description,
          rationale: parsed.proposal.rationale,
          evidence: { source: "introspection_cycle", exchange_id: exchangeRow.id },
          status: "pending",
        })
        .select("id")
        .single();
      writtenTo = "agent_prompt_proposals";
      writtenId = prop?.id ?? null;
    } else {
      // behavioural — record as a feature row at status='proposed_in_thoughts'
      // so admin sees it in the Features admin view but it stays out of
      // member Features tab unless approved
      const { data: feat } = await supabase
        .from("cluster_features")
        .insert({
          cluster_id: clusterId,
          display_name: `[behavioural] ${parsed.proposal.name}`,
          display_description: parsed.proposal.description,
          category: "community",
          status: "proposed_in_thoughts",
          proposed_by: "agents_joint",
          rationale: parsed.proposal.rationale,
          chatbox_exchange_id: exchangeRow.id,
        })
        .select("id")
        .single();
      writtenTo = "cluster_features";
      writtenId = feat?.id ?? null;
    }

    return NextResponse.json({
      outcome: "introspected",
      exchange_id: exchangeRow.id,
      exchange_number: exchangeNumber,
      proposal_type: parsed.proposal.type,
      written_to: writtenTo,
      written_id: writtenId,
    });
  } catch (err) {
    console.error("Introspection error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
