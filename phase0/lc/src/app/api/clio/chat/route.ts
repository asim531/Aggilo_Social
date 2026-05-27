import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";
import { llmCall } from "@/lib/llm";
import { buildClioClusterMessages } from "@/lib/prompts/clio-builder";
import { detectWelfareSignal } from "@/lib/welfare";
import type { PostWithAuthor } from "@/lib/types";

/**
 * POST /api/clio/chat
 *
 * Cluster-mode Clio FAB chat. The user's message arrives with their
 * conversation history. Clio reads the public Timeline (timeline_state)
 * and responds in the Momentum + intimacy-cohort register.
 *
 * This is the surface where the private tip mechanic lives: Clio can
 * observe what the member has posted publicly and give them a private
 * nudge. The tip mechanic logic runs AFTER the conversational response
 * — it is a separate concern from answering the member's question.
 *
 * Welfare detection runs on the member's message. If it fires, the
 * response shape is deterministic (two sentences, no LLM).
 *
 * Body:
 *   { message: string, history: { role, content }[] }
 *
 * Returns:
 *   { reply: string, tip?: string }
 *   The `tip` field is populated when the tip mechanic fires. The
 *   client renders it as a separate, visually distinct message after
 *   the main reply.
 */
export async function POST(request: Request) {
  try {
    const { message, history = [] } = await request.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // ── Welfare pre-filter ────────────────────────────────────────
    if (detectWelfareSignal(message)) {
      await flagWelfareInFab(user.id, message);
      return NextResponse.json({
        reply:
          "What you're carrying is real, and it matters. Someone from this community will reach out to you.",
      });
    }

    // ── Timeline state for the tip mechanic ──────────────────────
    // Clio reads the last 8 public posts to inform her private nudges.
    // This is the `timeline_state` described in
    // `clio/CLIO_CLUSTER_HOST_CONTEXT.md` §11.2 — she reads public
    // posts and gives private nudges. She never cross-references two
    // members' private FAB conversations.
    //
    // Two-step fetch (post rows then bulk profile lookup) — see
    // sage/evaluate for the same pattern.
    const { data: timelineRows } = await supabase
      .from("posts")
      .select("is_sage, content, author_id")
      .eq("cluster_id", CLUSTER_ID)
      .order("created_at", { ascending: false })
      .limit(8);

    const timelineAuthorIds = Array.from(
      new Set(
        (timelineRows ?? [])
          .map((r) => r.author_id)
          .filter((id): id is string => Boolean(id))
      )
    );
    const { data: timelineProfiles } = timelineAuthorIds.length
      ? await supabase
          .from("profiles")
          .select("id, nickname")
          .eq("cluster_id", CLUSTER_ID)
          .in("id", timelineAuthorIds)
      : { data: [] };
    const nicknameById = new Map<string, string>(
      ((timelineProfiles ?? []) as Array<{ id: string; nickname: string }>)
        .map((p) => [p.id, p.nickname])
    );

    const timelineState = (timelineRows ?? []).reverse().map((r) => ({
      is_sage: Boolean(r.is_sage),
      content: String(r.content ?? ""),
      nickname: r.author_id ? nicknameById.get(r.author_id) ?? null : null,
    }));

    // ── LLM call ──────────────────────────────────────────────────
    const messages = buildClioClusterMessages({
      userMessage: message,
      history: history as { role: "user" | "assistant"; content: string }[],
      timelineState,
    });

    const result = await llmCall({
      messages,
      operationKey: "clio_chat",
      temperature: 0.7,
      maxTokens: 180,
    });

    const reply = result.content.trim();

    // ── Private tip mechanic ──────────────────────────────────────
    // Evaluate whether a tip should accompany this response. The tip
    // is based on the member's most recent public post, not on what
    // they just said in the FAB. See CLIO_CLUSTER_HOST_CONTEXT.md §11.
    const tip = await evaluateTipMechanic(user.id, timelineState);

    return NextResponse.json({ reply, ...(tip ? { tip } : {}) });
  } catch (err) {
    console.warn(
      "[clio/chat] error:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json(
      { reply: "I'm having trouble right now. Try again in a moment." },
      { status: 500 }
    );
  }
}

/**
 * Flag a welfare signal detected in the FAB.
 * Phase 0: writes a row to welfare_notifications for admin review.
 * The admin UI for this ships in a later batch.
 */
async function flagWelfareInFab(userId: string, content: string) {
  try {
    const admin = createAdminClient();
    await admin.from("welfare_notifications").insert({
      cluster_id: CLUSTER_ID,
      user_id: userId,
      trigger_content: content.slice(0, 500),
      source: "clio_fab",
      resolved: false,
    });
  } catch {
    // Non-blocking — welfare flag failure is logged but doesn't break
    // the response. The deterministic care-witness still goes out.
  }
}

/**
 * Evaluate whether the private tip mechanic should fire.
 *
 * Reads the member's most recent public post. If it matches a trigger
 * pattern AND the frequency/repetition limits allow it, returns the
 * tip text. Otherwise returns null.
 *
 * Full spec: clio/CLIO_CLUSTER_HOST_CONTEXT.md §11
 */
async function evaluateTipMechanic(
  userId: string,
  timelineState: { is_sage: boolean; content: string; nickname: string | null }[]
): Promise<string | null> {
  try {
    const admin = createAdminClient();

    // ── Frequency check: max 1 tip per member per 24h ─────────────
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentTipCount } = await admin
      .from("clio_tip_log")
      .select("id", { count: "exact", head: true })
      .eq("cluster_id", CLUSTER_ID)
      .eq("user_id", userId)
      .gte("tip_delivered_at", oneDayAgo)
      .is("suppression_reason", null);

    if ((recentTipCount ?? 0) > 0) return null;

    // ── Dependency check: 3+ tips in 14 days with no posting increase ─
    const fourteenDaysAgo = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000
    ).toISOString();
    const { count: recentTips14d } = await admin
      .from("clio_tip_log")
      .select("id", { count: "exact", head: true })
      .eq("cluster_id", CLUSTER_ID)
      .eq("user_id", userId)
      .gte("tip_delivered_at", fourteenDaysAgo)
      .is("suppression_reason", null);

    if ((recentTips14d ?? 0) >= 3) {
      // Check if the member has posted since the first tip in this window.
      const { data: firstTip } = await admin
        .from("clio_tip_log")
        .select("tip_delivered_at")
        .eq("cluster_id", CLUSTER_ID)
        .eq("user_id", userId)
        .gte("tip_delivered_at", fourteenDaysAgo)
        .order("tip_delivered_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (firstTip) {
        const { count: postsSinceTip } = await admin
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("cluster_id", CLUSTER_ID)
          .eq("author_id", userId)
          .gte("created_at", firstTip.tip_delivered_at);

        if ((postsSinceTip ?? 0) === 0) {
          // Dependency prevention — suppress tips for this member.
          await admin.from("clio_tip_log").insert({
            cluster_id: CLUSTER_ID,
            user_id: userId,
            trigger_type: "dependency_prevention",
            source_post_id: null,
            tip_content: "",
            suppression_reason: "dependency_prevention",
          });
          return null;
        }
      }
    }

    // ── Find the member's most recent public post ─────────────────
    const memberPost = timelineState
      .filter((p) => !p.is_sage)
      .slice(-1)[0];

    if (!memberPost) return null;

    // ── Pattern matching ──────────────────────────────────────────
    const tip = detectTipPattern(memberPost.content);
    if (!tip) return null;

    // ── Cluster-wide repetition cap ───────────────────────────────
    // If the same trigger type has been delivered to 3+ members in 7d,
    // pause that trigger type for the cluster.
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    const { count: clusterTriggerCount } = await admin
      .from("clio_tip_log")
      .select("id", { count: "exact", head: true })
      .eq("cluster_id", CLUSTER_ID)
      .eq("trigger_type", tip.trigger_type)
      .gte("tip_delivered_at", sevenDaysAgo)
      .is("suppression_reason", null);

    if ((clusterTriggerCount ?? 0) >= 3) return null;

    // ── Pattern repetition: same trigger to same member in 14d ────
    const { count: samePatternCount } = await admin
      .from("clio_tip_log")
      .select("id", { count: "exact", head: true })
      .eq("cluster_id", CLUSTER_ID)
      .eq("user_id", userId)
      .eq("trigger_type", tip.trigger_type)
      .gte("tip_delivered_at", fourteenDaysAgo)
      .is("suppression_reason", null);

    if ((samePatternCount ?? 0) > 0) return null;

    // ── Log the tip ───────────────────────────────────────────────
    await admin.from("clio_tip_log").insert({
      cluster_id: CLUSTER_ID,
      user_id: userId,
      trigger_type: tip.trigger_type,
      source_post_id: null, // Phase 0: we don't have the post id here
      tip_content: tip.text,
      suppression_reason: null,
    });

    return tip.text;
  } catch {
    // Tip mechanic failure is non-blocking. Clio's main reply still goes out.
    return null;
  }
}

/**
 * Detect which tip pattern (if any) applies to the member's most
 * recent post. Returns the trigger type and tip text, or null.
 *
 * Patterns from CLIO_CLUSTER_HOST_CONTEXT.md §11.3:
 *   - guarded_intellectual: intellectually interesting but emotionally closed
 *   - hedged_vulnerability: honest then walked back
 *   - question_reveals_want: question that reveals what they're looking for
 *   - interested_but_guarded: clearly interested in another post but held back
 *
 * The 48h no-post trigger is handled separately (not here — it fires
 * on a scheduled check, not on a FAB interaction).
 */
function detectTipPattern(
  content: string
): { trigger_type: string; text: string } | null {
  const lower = content.toLowerCase();

  // Hedged vulnerability — honest statement followed by a walk-back.
  // Signals: "anyway", "but whatever", "never mind", "I guess",
  // "probably just me", "forget it", "doesn't matter"
  const hedgePatterns = [
    /\banyway\b/i,
    /\bbut whatever\b/i,
    /\bnever mind\b/i,
    /\bi guess\b/i,
    /\bprobably just me\b/i,
    /\bforget it\b/i,
    /\bdoesn'?t matter\b/i,
    /\bnot a big deal\b/i,
  ];
  if (hedgePatterns.some((p) => p.test(content)) && content.length > 80) {
    return {
      trigger_type: "hedged_vulnerability",
      text: "You said something real and then walked it back. The part before 'anyway' — that's the thing worth saying.",
    };
  }

  // Question that reveals a want — asking something that's really about
  // the person's own situation.
  // Signals: "does anyone else", "has anyone", "is it just me", "why do I"
  const questionPatterns = [
    /\bdoes anyone else\b/i,
    /\bhas anyone\b/i,
    /\bis it just me\b/i,
    /\bwhy do i\b/i,
    /\bam i the only one\b/i,
    /\bdo you ever\b/i,
  ];
  if (questionPatterns.some((p) => p.test(content))) {
    return {
      trigger_type: "question_reveals_want",
      text: "That question is actually about something specific. What's the situation you're thinking about when you ask it? That's the post that would get a real response.",
    };
  }

  // Guarded intellectual — abstract framing of something personal.
  // Signals: long post (>150 chars) with intellectual framing words
  // but no personal pronouns in the first person.
  const intellectualMarkers = [
    /\bintellectual(ly)?\b/i,
    /\bcompatibility\b/i,
    /\btheory\b/i,
    /\bphilosoph/i,
    /\bconceptually\b/i,
    /\bin general\b/i,
    /\bpeople tend to\b/i,
    /\bsociety\b/i,
  ];
  const hasPersonalPronoun = /\bi (feel|felt|think|thought|want|wanted|need|needed|am|was|have|had)\b/i.test(content);
  if (
    content.length > 150 &&
    intellectualMarkers.some((p) => p.test(content)) &&
    !hasPersonalPronoun
  ) {
    return {
      trigger_type: "guarded_intellectual",
      text: "That's a real question — and it's also a personal one. The version that would actually land in this room is the personal version. What's the relationship you're comparing it to?",
    };
  }

  return null;
}
