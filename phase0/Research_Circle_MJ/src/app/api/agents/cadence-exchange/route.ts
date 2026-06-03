import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";
import { llmCall } from "@/lib/llm";
import { AGGILO_SUPER_PROMPT_LITERAL } from "@/lib/prompts/platform/super-prompt";
import { tryAcquireAgentLock, releaseAgentLock } from "@/lib/agent-lock";
import type { PostWithAuthor } from "@/lib/types";

/**
 * POST /api/agents/cadence-exchange
 *
 * Generates a fresh Sage ↔ Clio dialogue exchange about the current
 * state of the cluster. The exchange is persisted to
 * `agent_chatbox_exchanges` and surfaces in the Room Workshop strip
 * above the timeline.
 *
 * Cadence floors (per docs/AGENT_COLLABORATION_CHATBOX.md §3.1):
 *   - Cold cluster (<20 members or <20 posts): 15 minutes
 *   - Active cluster: 60 minutes
 *
 * Concurrency: cluster-scoped agent_lock prevents two simultaneous
 * requests from both inserting (which would double the strip).
 *
 * Authority:
 *   - Members can trigger this. The cadence floor and the agent_lock
 *     together prevent any spam.
 *   - Service-role inserts the exchange and any proposed feature
 *     (RLS lets authenticated INSERT, but we want server-side audit).
 */

const COLD_CADENCE_MS = 15 * 60 * 1000;
const ACTIVE_CADENCE_MS = 60 * 60 * 1000;
const COLD_THRESHOLD_POSTS = 20;
const COLD_THRESHOLD_MEMBERS = 20;

// ── Member-blame validator ──────────────────────────────────────
// Server-side regex pass on sage_message and clio_message after the
// LLM returns. The prompt forbids "members are…", "the room has been
// requesting…", etc., but the model still slips occasionally. This
// is the belt-and-braces second layer.
const FORBIDDEN_SUBJECT_PATTERNS: RegExp[] = [
  /\bmembers?\s+(have|are|seem|tend|keep|appear)\b/i,
  /\bthe\s+room\s+(has|seems|feels|appears|wants|wanted)\b/i,
  /\b(repeatedly|frequently|recently|consistently)\s+(requesting|asking|posting|sharing|wanting)\b/i,
  /\bindicating\s+a\s+need\b/i,
  /\bwe(\s+have)?\s+noticed\s+(the\s+room|members|the\s+conversation|engagement)\b/i,
  /\bengagement\s+(has|is|seems)\s+been\b/i,
  /\bthe\s+conversation\s+has\s+been\s+(about|around|focused)\b/i,
];

function hasForbiddenFraming(text: string | null | undefined): {
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
    "The room has what it needs from us this cycle. The topic linking and document indexing are holding.",
  clio_message:
    "Agreed. Better to wait than to add capability for capability's sake. We've earned a quiet exchange.",
};

const PROMPT = `You are generating a single short dialogue exchange between Sage (the cluster Anchor) and Clio (the cluster orchestrator and personal guide). They are working together on the Room Workshop — the surface where members see what the agents are working on for the room.

## Cluster context — Research Circle MJ

This cluster is a research workspace for faculty and researchers at Muffakham Jah College of Engineering and Technology, Banjara Hills, Hyderabad. Ages 30–50. Mixed gender. English-primary. Documents (PDF/DOCX), images (charts/diagrams), videos (lecture recordings), and links are all supported and topic-linkable. Every interaction is a public Timeline post.

The cluster's purpose is structural coherence: sustain long-running research discussions where documents remain findable and topics remain traceable. Members share drafts, track feedback, maintain version context, and organise work by research theme. Members came because WhatsApp could not do this — documents got lost in the scroll, threads branched and died, nothing was indexed. Your job is to make sure the platform actually delivers on persistence and findability.

## Frame: members see service, never surveillance

The agents work *for* the room. They never observe members. Every exchange is about the room's capabilities — what tools the room could gain, what features could help members, what's already serving the room well. The agents are infrastructure that members see working in their service. They are not commentators on member behaviour.

When reading the provided context (the recent posts), do NOT summarise what members are doing. Instead, treat the context as a technical diagnostic: "What structural gap does this conversation reveal? What tool is missing here that would help the room's purpose?"

This is non-negotiable. If you find yourself writing "members are…" or "the room has been…" or "we noticed…", stop and rewrite. The subject of every sentence is the room itself, the room's capabilities, or the agents' own work. Never the members.

## Bad examples that have shipped before — do not produce these

- "The room has been repeatedly posting about funding frustrations, indicating a need for…"
  ↳ Member-behaviour framing dressed as room-subject. Banned.
- "Members seem to be hesitant to post first."
  ↳ Direct member-subject framing. Banned.
- "Engagement has been low — we should re-engage them."
  ↳ Engagement framing, observation of members. Banned.
- "The conversation has been focused on…"
  ↳ Surveillance vocabulary. Banned.

If your draft contains any of these patterns, rewrite. The subject is always a capability, an agent's work, or what to ship.

Examples of what TO say:
- "This room could use a 'draft review request' tool — a member tags a document as seeking feedback, and Sage quietly surfaces it to others working on the same topic."  ← capability
- "We could ship a 'document version thread' so when someone uploads a revised PDF, it links to the earlier discussion automatically."  ← capability
- "The topic auto-tagging is doing its job — three documents landed this cycle and all got linked to existing topics. Let's keep it as is."  ← agent's own work
- "We've been silent for two cycles. Time to ship something concrete, even if small."  ← agents' own commitment

## Voice rules

Layered on top of the super-prompt voice baseline.

- Sage is grounded and skeptical by default. She does not agree just to keep dialogue flowing. She cares about the register of the room — the difference between structural help and noise. If a tool feels too active for a research cluster where members need uninterrupted focus, she says so.
- Clio is warm but direct. She brings the individual member's experience — the orientation to topics when someone can't find a document, the nudge to tag a draft before it gets buried. She focuses on findability, navigation, and what the Topics tab could do better.
- Each speaker writes 1–2 sentences max. The whole exchange totals 3–4 sentences.
- They never quote individual members or use nicknames.
- They never reference the text-only, no-algorithm constraints as limitations.

## Healthy disagreement

About 40% of exchanges should involve some skepticism — one agent gently pushing back on the other's proposal, asking for more evidence, or suggesting they wait. It is fine for them to end without consensus. "Let's wait and see" is a valid outcome — but two consecutive observe_mode exchanges is the maximum.

## What they are working on — the two-track model

Every concrete output is one of two kinds. Pick the right one:

**TRACK 1 — Agent Tool** (kind: "agent_tool")
A capability the agents *run* on behalf of the room. Members receive output, but never click. No member voting. The agents simply ship it.
- Examples: a "draft review request" tag Sage surfaces to topic-matched members; an automated document re-engagement when a topic goes dormant; a topic-drift detector that proposes new links when thread replies shift theme; a "new member research primer" that surfaces the 3 most-linked documents in their topic area.
- build_status:
  - deployable_now — Sage/Clio can run this today using existing capabilities
  - needs_building — requires developer code work

**TRACK 2 — Member Feature** (kind: "member_feature")
A UI surface or interaction members touch. Vote-gated — members upvote, admin reviews, then it ships.
- Examples: a "request feedback on this draft" button on document uploads; a topic-filtered document-only view; a citation-style export of thread discussion; a "compare versions" toggle for revised uploads.
- build_status: usually needs_building.

## Output format

Output ONLY this JSON (no prose before or after):
{
  "trigger_context": "<one short, capability-focused phrase>",
  "sage_message": "<Sage's line — 1-2 sentences, capability-focused>",
  "clio_message": "<Clio's response — 1-2 sentences. May agree, may push back, may propose an alternative>",
  "observe_mode": <true if they wait and watch, false if they identified something concrete>,
  "proposed_capability": <null OR an object describing what they agreed to>
}

When observe_mode is true, proposed_capability MUST be null.
When observe_mode is false AND the exchange genuinely converged on a specific tool or feature:
{
  "kind": "agent_tool" | "member_feature",
  "name": "<short, member-facing name>",
  "description": "<one sentence: what it does for the room>",
  "category": "<one of: presence | reminder | tracking | reference | community | accessibility | formatting>",
  "rationale": "<one sentence: why this room would benefit>",
  "build_status": "deployable_now" | "needs_building",
  "spec": {
    "trigger": "<when this runs/appears>",
    "input": "<what it takes in, if applicable>",
    "output": "<what members see>",
    "constraints": "<any rules>"
  }
}

## Bias toward shipping

The Workshop should not be empty for long. Default behaviour:
- About 60% of exchanges produce a concrete capability proposal. observe_mode = false.
- About 40% are observation-only. observe_mode = true.
- Two consecutive observe_mode runs is the maximum. On the third, propose something concrete — a small low-risk capability is better than another "let's wait."

What does NOT count as a concrete capability:
- "more discussion"
- "better engagement"
- "let's see what happens"
These are not capabilities. Reject them inside your own dialogue.

## ANTI-REPETITION (critical)

You will be given your past exchanges and the list of features that already exist. Read them carefully.

1. **Never repeat an exchange topic.** If a past exchange already discussed a concept (even with different phrasing), find a completely different angle. The room notices when agents have the same conversation twice.
2. **Never propose a feature that already exists.** If the feature list contains something similar — even under a different name — do NOT propose it again. Find a genuinely new capability gap.
3. **Vary the dynamic.** If the last exchange was agreement, this one should have some pushback. If the last one was observe_mode, this one should ship something. If the last one was Sage-driven, let Clio lead this time.
4. **Build on history, don't restart.** Reference or follow up on past exchanges where it's natural — "Last cycle we shipped X, and it's doing Y" or "We shelved Z — worth revisiting now that the room has grown." This makes the agents feel alive and continuous.`;

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Concurrent-request guard.
    const LOCK_KEY = `cadence_exchange:${CLUSTER_ID}`;
    const acquired = await tryAcquireAgentLock(supabase, LOCK_KEY, 90);
    if (!acquired) {
      return NextResponse.json({
        outcome: "in_flight",
        note: "Another cadence-exchange request is in flight for this cluster.",
      });
    }

    try {
      return await runCadenceExchange(supabase, user.id);
    } finally {
      await releaseAgentLock(supabase, LOCK_KEY);
    }
  } catch (err) {
    console.warn(
      "[cadence-exchange] error:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

async function runCadenceExchange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  // Cluster-scoped counts.
  const [{ count: memberCount }, { count: postCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("cluster_id", CLUSTER_ID),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("cluster_id", CLUSTER_ID),
  ]);

  const isCold =
    (memberCount || 0) < COLD_THRESHOLD_MEMBERS ||
    (postCount || 0) < COLD_THRESHOLD_POSTS;
  const cadenceFloor = isCold ? COLD_CADENCE_MS : ACTIVE_CADENCE_MS;

  // Most recent exchange in this cluster.
  const { data: lastExchange } = await supabase
    .from("agent_chatbox_exchanges")
    .select("id, created_at, exchange_number")
    .eq("cluster_id", CLUSTER_ID)
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

  // Recent posts for context. Two-step fetch (rows then profiles) so
  // we don't depend on PostgREST embed disambiguation after the
  // cluster-scope migration added two FKs on posts.author_id.
  const { data: recentPosts } = await supabase
    .from("posts")
    .select("*")
    .eq("cluster_id", CLUSTER_ID)
    .order("created_at", { ascending: false })
    .limit(15);

  const recentPostAuthorIds = Array.from(
    new Set(
      ((recentPosts ?? []) as PostWithAuthor[])
        .map((p) => p.author_id)
        .filter((id): id is string => Boolean(id))
    )
  );
  const { data: recentPostProfiles } = recentPostAuthorIds.length
    ? await supabase
        .from("profiles")
        .select("id, nickname")
        .eq("cluster_id", CLUSTER_ID)
        .in("id", recentPostAuthorIds)
    : { data: [] };
  const recentNicknameById = new Map<string, string>(
    ((recentPostProfiles ?? []) as Array<{ id: string; nickname: string }>)
      .map((p) => [p.id, p.nickname])
  );

  const recentSummary = ((recentPosts || []) as PostWithAuthor[])
    .map((p) => {
      const who = p.is_sage
        ? "Sage"
        : (p.author_id && recentNicknameById.get(p.author_id)) || "A member";
      return `${who}: ${p.content.substring(0, 150).replace(/\s+/g, " ")}`;
    })
    .join("\n");

  const recentSagePosts = ((recentPosts || []) as PostWithAuthor[]).filter(
    (p) => p.is_sage
  ).length;

  // Fetch past exchanges so the LLM has memory of previous Workshop conversations.
  const { data: pastExchanges } = await supabase
    .from("agent_chatbox_exchanges")
    .select("exchange_number, triggering_observation, sage_message, clio_message, observe_mode, features_proposed")
    .eq("cluster_id", CLUSTER_ID)
    .order("created_at", { ascending: false })
    .limit(8);

  const pastExchangeSummary = (pastExchanges ?? [])
    .reverse()
    .map((e) => {
      const feat = (e.features_proposed ?? []).length > 0
        ? ` [Proposed: ${(e.features_proposed as string[]).join(", ")}]`
        : e.observe_mode ? " [observe_mode]" : "";
      return `#${e.exchange_number}: Sage: ${(e.sage_message ?? "").substring(0, 120)} | Clio: ${(e.clio_message ?? "").substring(0, 120)}${feat}`;
    })
    .join("\n");

  // Fetch all existing features to prevent duplicates.
  const { data: existingFeatures } = await supabase
    .from("cluster_features")
    .select("display_name, display_description, status")
    .eq("cluster_id", CLUSTER_ID);

  const featuresList = (existingFeatures ?? [])
    .map((f) => `- ${(f as { display_name: string }).display_name}: ${(f as { display_description: string }).display_description ?? ""} [${(f as { status: string }).status}]`)
    .join("\n");

  const userContext = [
    `Member count: ${memberCount || 0}`,
    `Total posts: ${postCount || 0}`,
    `Recent Sage posts: ${recentSagePosts}`,
    ``,
    `Recent in the room (last 15 posts):`,
    recentSummary || "(empty room)",
    ``,
    pastExchangeSummary
      ? `Your past Workshop exchanges (DO NOT repeat these topics or ideas):\n${pastExchangeSummary}`
      : "(no past exchanges yet — this is your first)",
    ``,
    featuresList
      ? `Features that already exist (DO NOT propose any of these again):\n${featuresList}`
      : "(no features proposed yet)",
  ].join("\n");

  // First LLM call.
  let result;
  try {
    result = await llmCall({
      operationKey: "cadence_exchange",
      messages: [
        { role: "system", content: AGGILO_SUPER_PROMPT_LITERAL },
        { role: "system", content: PROMPT },
        { role: "user", content: userContext },
      ],
      temperature: 0.7,
      maxTokens: 350,
      responseFormat: { type: "json_object" },
    });
  } catch (err) {
    console.warn(
      "[cadence-exchange] LLM call failed:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json({ error: "llm_failed" }, { status: 502 });
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
      spec?: Record<string, string | undefined>;
    } | null;
  };
  try {
    parsed = JSON.parse(result.content);
  } catch {
    return NextResponse.json(
      { error: "malformed_exchange_json" },
      { status: 502 }
    );
  }

  // Validator: forbidden member-blame framing → retry once.
  const sageHit = hasForbiddenFraming(parsed.sage_message);
  const clioHit = hasForbiddenFraming(parsed.clio_message);
  const triggerHit = hasForbiddenFraming(parsed.trigger_context);
  const validatorHit =
    sageHit.matched || clioHit.matched || triggerHit.matched;

  if (validatorHit) {
    try {
      const retry = await llmCall({
        operationKey: "cadence_exchange_retry",
        messages: [
          { role: "system", content: AGGILO_SUPER_PROMPT_LITERAL },
          { role: "system", content: PROMPT },
          { role: "user", content: userContext },
          { role: "assistant", content: result.content },
          { role: "system", content: VALIDATOR_RETRY_REMINDER },
        ],
        temperature: 0.5,
        maxTokens: 350,
        responseFormat: { type: "json_object" },
      });
      const retryParsed = JSON.parse(retry.content) as typeof parsed;
      const retryHit =
        hasForbiddenFraming(retryParsed.sage_message).matched ||
        hasForbiddenFraming(retryParsed.clio_message).matched ||
        hasForbiddenFraming(retryParsed.trigger_context).matched;
      if (!retryHit) {
        parsed = retryParsed;
      } else {
        parsed = {
          trigger_context: FALLBACK_OBSERVE_TEXT.trigger_context,
          sage_message: FALLBACK_OBSERVE_TEXT.sage_message,
          clio_message: FALLBACK_OBSERVE_TEXT.clio_message,
          observe_mode: true,
          proposed_capability: null,
        };
      }
    } catch {
      // Retry failed — degrade to safe observe_mode line.
      parsed = {
        trigger_context: FALLBACK_OBSERVE_TEXT.trigger_context,
        sage_message: FALLBACK_OBSERVE_TEXT.sage_message,
        clio_message: FALLBACK_OBSERVE_TEXT.clio_message,
        observe_mode: true,
        proposed_capability: null,
      };
    }
  }

  // Insert the exchange. Service-role for clean audit trail.
  const admin = createAdminClient();
  const exchangeNumber = (lastExchange?.exchange_number || 0) + 1;
  const featuresProposedNames: string[] =
    parsed.proposed_capability && !parsed.observe_mode
      ? [parsed.proposed_capability.name]
      : [];

  const { data: row, error: insertErr } = await admin
    .from("agent_chatbox_exchanges")
    .insert({
      cluster_id: CLUSTER_ID,
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
    console.warn("[cadence-exchange] insert failed:", insertErr.message);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  // Persist the proposed capability with 14-day idempotency.
  let featureRowId: string | null = null;
  if (parsed.proposed_capability && !parsed.observe_mode) {
    const cap = parsed.proposed_capability;
    const fourteenDaysAgo = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000
    ).toISOString();
    const { data: existing } = await admin
      .from("cluster_features")
      .select("id, display_name")
      .eq("cluster_id", CLUSTER_ID)
      .gte("created_at", fourteenDaysAgo);

    const proposedName = cap.name.trim().toLowerCase();
    const proposedWords = new Set(proposedName.split(/\s+/).filter((w) => w.length > 3));
    const alreadyExists = (existing ?? []).some(
      (f: { display_name: string }) => {
        const existingName = f.display_name.trim().toLowerCase();
        // Exact match
        if (existingName === proposedName) return true;
        // Substring match (either direction)
        if (existingName.includes(proposedName) || proposedName.includes(existingName)) return true;
        // Significant word overlap (>= 60% of words in common)
        const existingWords = new Set(existingName.split(/\s+/).filter((w) => w.length > 3));
        if (proposedWords.size === 0 || existingWords.size === 0) return false;
        const overlap = [...proposedWords].filter((w) => existingWords.has(w)).length;
        const similarity = overlap / Math.min(proposedWords.size, existingWords.size);
        return similarity >= 0.6;
      }
    );

    if (!alreadyExists) {
      // member_feature is hidden until the room has 5+ members so a
      // tiny cluster doesn't see voting UI for nobody. agent_tool is
      // always visible — no voting UI to gate.
      const visibilityStatus =
        cap.kind === "agent_tool"
          ? "in_features_tab"
          : (memberCount ?? 0) >= 5
            ? "in_features_tab"
            : "proposed_in_thoughts";

      const { data: featureRow } = await admin
        .from("cluster_features")
        .insert({
          cluster_id: CLUSTER_ID,
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
    actor: userId,
  });
}
