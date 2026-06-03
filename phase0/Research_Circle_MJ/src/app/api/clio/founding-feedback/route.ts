import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";
import { llmCall } from "@/lib/llm";
import { buildClioFoundingFeedbackMessages } from "@/lib/prompts/clio-builder";
import {
  classifyFoundingFeedback,
  type FoundingFeedbackClassification,
} from "@/lib/prompts/platform/clio-founding-feedback";
import { detectWelfareSignal } from "@/lib/welfare";

/**
 * POST /api/clio/founding-feedback
 *
 * Single-shot endpoint that runs the founding-member feedback prompt
 * described in:
 *   docs/AMA_CLUSTER_CREATION_AND_FOUNDING_FEEDBACK.md Part 1
 *
 * Two distinct calls:
 *
 *   action=open   → Returns Clio's opening message. Records
 *                   founding_feedback_at if not already stamped.
 *                   No LLM call (the opening is verbatim per spec).
 *
 *   action=reply  → Sends the member's response to the LLM, returns
 *                   Clio's reply, classifies the close_reason, writes
 *                   the founding_feedback_log row, and stamps
 *                   founding_feedback_close_reason.
 *
 * The route is idempotent on close: if the prompt has already closed
 * for this member, both actions return 410 GONE.
 *
 * Security:
 *   - Caller must be authenticated.
 *   - Caller must be the founding member of this cluster.
 *   - Welfare regex pre-filter runs on every reply.
 */

interface OpenRequest {
  action: "open";
}

interface ReplyRequest {
  action: "reply";
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}

interface BadgeRequest {
  action: "badge";
  /** true = founder accepted the badge; false = declined */
  accept: boolean;
}

type FoundingFeedbackRequest = OpenRequest | ReplyRequest | BadgeRequest;

/**
 * Verbatim opening per the spec. NEVER paraphrase. NEVER add an
 * emoji. NEVER personalise by name. The exact wording is the
 * stewardship contract.
 */
const OPENING_MESSAGE =
  "This room was built around what you described. Before you settle in — does the way it's set up feel right? If something is off, tell me. I can adjust the description, the seed questions, or how Sage holds the space. Or just say it's good and I'll get out of your way.";

/**
 * Deterministic close acknowledgement when classification is
 * 'accepted'. Used to keep the close on-shape even if the LLM drifts.
 */
const ACCEPTED_CLOSE = "Then it's yours. I'll step back.";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FoundingFeedbackRequest;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // ── Verify founding-member status ─────────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "is_founding_member, founding_feedback_at, founding_feedback_close_reason, nickname"
      )
      .eq("id", user.id)
      .eq("cluster_id", CLUSTER_ID)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "no_profile" }, { status: 404 });
    }
    if (!profile.is_founding_member) {
      return NextResponse.json({ error: "not_founding_member" }, { status: 403 });
    }

    const admin = createAdminClient();

    // ── action=badge ──────────────────────────────────────────────
    // The client sends this after the founding-feedback interaction
    // closes, when the member responds to Clio's badge offer.
    // This must run even after close_reason is stamped, so it lives
    // above the 410 guard.
    if (body.action === "badge") {
      const accept = Boolean((body as BadgeRequest).accept);
      if (accept) {
        await admin
          .from("profiles")
          .update({ founding_badge_shown: true })
          .eq("id", user.id)
          .eq("cluster_id", CLUSTER_ID);
      }
      return NextResponse.json({ ok: true, badge_shown: accept });
    }

    // Already closed — idempotent 410.
    if (profile.founding_feedback_close_reason) {
      return NextResponse.json(
        { error: "already_closed", close_reason: profile.founding_feedback_close_reason },
        { status: 410 }
      );
    }

    // ── action=open ───────────────────────────────────────────────
    if (body.action === "open") {
      // Stamp founding_feedback_at on first open. The close_reason
      // remains NULL until the member responds (or 24h passes).
      if (!profile.founding_feedback_at) {
        await admin
          .from("profiles")
          .update({ founding_feedback_at: new Date().toISOString() })
          .eq("id", user.id)
          .eq("cluster_id", CLUSTER_ID);
      }
      return NextResponse.json({ reply: OPENING_MESSAGE });
    }

    // ── action=reply ──────────────────────────────────────────────
    if (body.action !== "reply") {
      return NextResponse.json({ error: "unknown_action" }, { status: 400 });
    }

    const message = (body.message ?? "").trim();
    if (!message) {
      return NextResponse.json({ error: "empty_message" }, { status: 400 });
    }

    // Welfare pre-filter — same shape as the standard FAB. The
    // founding-member is in their first session and the cluster's
    // subject matter is research collaboration + document persistence.
    // Welfare signals are unlikely here but the platform safety floor
    // still applies.
    if (detectWelfareSignal(message)) {
      // Log to welfare_notifications using the standard channel.
      await admin.from("welfare_notifications").insert({
        cluster_id: CLUSTER_ID,
        user_id: user.id,
        trigger_content: message.slice(0, 500),
        source: "clio_fab",
        resolved: false,
      });
      // Also close the founding-feedback session as silent_close so it
      // doesn't fire again. The welfare path takes priority.
      await admin
        .from("profiles")
        .update({ founding_feedback_close_reason: "silent_close" })
        .eq("id", user.id)
        .eq("cluster_id", CLUSTER_ID);
      await admin.from("founding_feedback_log").insert({
        cluster_id: CLUSTER_ID,
        user_id: user.id,
        feedback_text: message.slice(0, 2000),
        applied_changes: null,
        queued_for_admin: { reason: "welfare_signal_during_founding_feedback" },
        close_reason: "silent_close",
      });
      return NextResponse.json({
        reply:
          "What you're carrying is real, and it matters. Someone from this community will reach out to you.",
        close_reason: "silent_close",
      });
    }

    // Classify the response. The classifier is a hint, not a gate —
    // the LLM still produces the actual reply. The classification is
    // recorded in founding_feedback_log so admins can audit the
    // pattern matching's accuracy.
    const classification: FoundingFeedbackClassification =
      classifyFoundingFeedback(message);

    // Build messages with the founding-feedback frame. History
    // includes the verbatim opening so the LLM has the context it
    // needs to reply on-shape.
    const history = body.history ?? [];
    if (
      history.length === 0 ||
      history[0]?.content !== OPENING_MESSAGE
    ) {
      // Inject the opening as the first assistant turn so the LLM
      // sees the conversation it is continuing. Defensive — the
      // client should already include this.
      history.unshift({ role: "assistant", content: OPENING_MESSAGE });
    }

    const messages = buildClioFoundingFeedbackMessages({
      userMessage: message,
      history,
      founderNickname: (profile as { nickname?: string }).nickname ?? null,
    });

    let reply: string;
    try {
      const result = await llmCall({
        messages,
        operationKey: "clio_founding_feedback",
        // Lower temperature — the prompt is highly constrained and we
        // want predictable acknowledgement-shape output.
        temperature: 0.4,
        maxTokens: 240,
      });
      reply = result.content.trim();
    } catch {
      // LLM failure — fall back to deterministic acknowledgement so
      // the founding member doesn't see an error on this critical
      // first-impression interaction.
      reply = ACCEPTED_CLOSE;
    }

    // Decide the close_reason based on classifier result. Unclear →
    // accepted (the safest assumption — admin can review the log).
    const closeReason: NonNullable<typeof profile.founding_feedback_close_reason> =
      classification === "changes_applied"
        ? "changes_applied"
        : classification === "changes_queued"
          ? "changes_queued"
          : "accepted";

    // Stamp the close_reason. founding_feedback_at was stamped at
    // open. The session is now considered closed; further calls to
    // this endpoint will return 410.
    await admin
      .from("profiles")
      .update({ founding_feedback_close_reason: closeReason })
      .eq("id", user.id)
      .eq("cluster_id", CLUSTER_ID);

    // Log the interaction for admin audit.
    await admin.from("founding_feedback_log").insert({
      cluster_id: CLUSTER_ID,
      user_id: user.id,
      feedback_text: message.slice(0, 2000),
      applied_changes:
        classification === "changes_applied"
          ? { fields: ["see_feedback_text"], note: "Tier-1 stewardship change captured for admin to apply manually in Phase 0" }
          : null,
      queued_for_admin:
        classification === "changes_queued"
          ? { fields: ["see_feedback_text"], note: "Structural change requested — admin must follow up" }
          : null,
      close_reason: closeReason,
    });

    return NextResponse.json({
      reply,
      close_reason: closeReason,
      // After the interaction closes, the client shows a badge offer.
      // The badge_offer flag tells the client to surface it.
      badge_offer: true,
    });
  } catch (err) {
    console.warn(
      "[clio/founding-feedback] error:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json(
      { reply: "I'm having trouble right now. Try again in a moment." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/clio/founding-feedback
 *
 * Status check — used by the client to decide whether to surface the
 * prompt. Returns:
 *   { eligible: boolean, opened: boolean, closed: boolean }
 *
 * eligible: caller is the founding member of this cluster
 * opened:   founding_feedback_at is stamped (prompt has been shown)
 * closed:   founding_feedback_close_reason is set
 *
 * The client surfaces the prompt iff (eligible && !closed).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ eligible: false, opened: false, closed: false });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "is_founding_member, founding_feedback_at, founding_feedback_close_reason"
      )
      .eq("id", user.id)
      .eq("cluster_id", CLUSTER_ID)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ eligible: false, opened: false, closed: false });
    }

    return NextResponse.json({
      eligible: Boolean(profile.is_founding_member),
      opened: Boolean(profile.founding_feedback_at),
      closed: Boolean(profile.founding_feedback_close_reason),
    });
  } catch {
    return NextResponse.json({ eligible: false, opened: false, closed: false });
  }
}
