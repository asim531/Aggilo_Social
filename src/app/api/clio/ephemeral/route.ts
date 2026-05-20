import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { buildClioEphemeralMessages, detectWelfareSignal } from "@/lib/clio-prompt";
import { llmCall } from "@/lib/llm-fetch";

/**
 * POST /api/clio/ephemeral
 *
 * Private ephemeral Clio. The session content is NOT stored on any server
 * (the MVP keeps it in browser sessionStorage; the production architecture
 * uses Redis with 12h TTL — see clio_ephemeral_sessions table for metadata).
 *
 * V3 7-principles update: every LLM call now flows through llmCall(), so
 * cost, latency, and decision summary are recorded to llm_response_logs.
 * Even ephemeral sessions are observable at the metadata level. Content
 * itself is NEVER written to llm_response_logs — only token counts and
 * outcome.
 */
export async function POST(request: Request) {
  try {
    const { message, conversationContext } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const isWelfare = detectWelfareSignal(message);
    if (isWelfare) {
      try {
        await supabase.from("welfare_notifications").insert({
          post_id: null,
          user_id: user.id,
          trigger_content: `[CLIO_EPHEMERAL] ${message.substring(0, 500)}`,
          sage_response: null,
          resolved: false,
        });
      } catch {
        // Table may not exist (pre-migration) — fail silent.
      }

      try {
        await supabase
          .from("clio_ephemeral_sessions")
          .update({
            welfare_flagged: true,
            welfare_escalated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .order("started_at", { ascending: false })
          .limit(1);
      } catch {
        // Same as above
      }
    }

    const messages = buildClioEphemeralMessages({
      userMessage: message,
      conversationHistory: conversationContext || [],
    });

    const result = await llmCall(
      {
        agent: "clio",
        operationKey: "clio_ephemeral",
        userId: user.id,
      },
      {
        messages,
        temperature: 0.6,
        maxTokens: 400,
      },
      supabase
    );

    if (result.status === "budget_exceeded") {
      return NextResponse.json({
        content: result.content,
        welfare_flagged: isWelfare,
        budget_exceeded: true,
      });
    }

    if (result.status === "error" || !result.content) {
      return NextResponse.json({
        content: "I'm having a moment. Try again shortly.",
        welfare_flagged: isWelfare,
      });
    }

    try {
      await supabase.rpc("increment_ephemeral_message_count", {
        p_user_id: user.id,
      });
    } catch {
      // RPC may not exist yet — non-fatal
    }

    return NextResponse.json({
      content: result.content,
      welfare_flagged: isWelfare,
      llm_log_id: result.llmLogId,
    });
  } catch (error) {
    console.error("Clio ephemeral error:", error);
    return NextResponse.json({
      content: "Something went wrong. Try again in a moment.",
    });
  }
}
