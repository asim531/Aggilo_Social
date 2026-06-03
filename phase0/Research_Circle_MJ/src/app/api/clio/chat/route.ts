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
 * and responds in the Academic Momentum + research-cohort register.
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
      maxTokens: 120,
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
 * Research Circle MJ patterns:
 *   - untagged_document: shared a document/idea without topic tags — it will get lost
 *   - research_question_buried: asked "does anyone know..." instead of stating the actual research problem
 *   - high_level_no_doc: described work abstractly but didn't attach the draft or link
 *
 * The 48h no-post trigger is handled separately (not here — it fires
 * on a scheduled check, not on a FAB interaction).
 */
function detectTipPattern(
  content: string
): { trigger_type: string; text: string } | null {
  const lower = content.toLowerCase();

  // Untagged document — member shared a document, link, or substantial idea
  // but there's no topic reference. It will get lost in the scroll.
  // Signals: "here is", "attached", "shared", "uploaded", "draft", "PDF",
  // "paper", "document", "link", "this might be useful" — but no topic chip mentioned.
  const documentMarkers = [
    /\bhere (is|are)\b/i,
    /\battached\b/i,
    /\bshared\b/i,
    /\buploaded\b/i,
    /\bdraft\b/i,
    /\bpdf\b/i,
    /\bpaper\b/i,
    /\bdocument\b/i,
    /\bthis (link|article|paper)\b/i,
    /\bmight be useful\b/i,
  ];
  const topicMentioned = /\b(topic|tag|deep learning|machine learning|healthcare|signal processing|renewable|nanotech|biotech|cybersecurity|IoT|VLSI|communications|antenna|structural|thermal|fluid|composite|materials|energy|power|control|robotics|automation|data|cloud|blockchain|AI|ML)\b/i.test(content);
  if (documentMarkers.some((p) => p.test(content)) && !topicMentioned && content.length > 60) {
    return {
      trigger_type: "untagged_document",
      text: "That document won't be findable later without a topic tag. Tap the topic chips when you post — or Sage will suggest one.",
    };
  }

  // Research question buried — asking indirectly instead of stating the problem.
  // Signals: "does anyone know", "has anyone tried", "can someone explain",
  // "is there a way", "what's the best method for"
  const indirectQuestionPatterns = [
    /\bdoes anyone know\b/i,
    /\bhas anyone tried\b/i,
    /\bcan someone explain\b/i,
    /\bis there a way\b/i,
    /\bwhat's the best (method|approach|tool)\b/i,
    /\bhow do people usually\b/i,
  ];
  if (indirectQuestionPatterns.some((p) => p.test(content))) {
    return {
      trigger_type: "research_question_buried",
      text: "That question is hiding a real research problem. What are you actually trying to solve? That's the post people here can help with.",
    };
  }

  // High-level without substance — described work abstractly but didn't attach anything.
  // Signals: long post (>180 chars) with overview words but no concrete document/link/reference.
  const overviewMarkers = [
    /\bin general\b/i,
    /\boverview\b/i,
    /\bhigh level\b/i,
    /\bbroadly speaking\b/i,
    /\bthe field is moving\b/i,
    /\bcurrent trends\b/i,
    /\bresearch in this area\b/i,
  ];
  const hasConcreteReference = /\b(http|www\.|pdf|doc|docx|arxiv|researchgate|ieee|doi:|vol\.|no\.|pp\.|figure|table|dataset|code|github)\b/i.test(content);
  if (
    content.length > 180 &&
    overviewMarkers.some((p) => p.test(content)) &&
    !hasConcreteReference
  ) {
    return {
      trigger_type: "high_level_no_doc",
      text: "That's a useful framing — but this room works best when ideas are tied to actual documents or drafts. Got a paper, dataset, or draft to link it to?",
    };
  }

  return null;
}
