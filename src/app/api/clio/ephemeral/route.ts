import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { ChatCompletionResponse } from "@/lib/types";
import { buildClioEphemeralMessages, detectWelfareSignal } from "@/lib/clio-prompt";
import { llmFetch } from "@/lib/llm-fetch";

/**
 * POST /api/clio/ephemeral
 *
 * Private ephemeral Clio. The session content is NOT stored on any server
 * (the MVP keeps it in browser sessionStorage; the production architecture
 * uses Redis with 12h TTL — see clio_ephemeral_sessions table for metadata).
 *
 * Refactored in V3 Phase 6 to use shared builder + sharper welfare detection.
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

    // Welfare detection runs FIRST in ephemeral mode — the channel is private,
    // signals carry more weight, and the platform must be able to flag the
    // session even if the LLM misses the cue.
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
        // Table may not exist (pre-migration) — fail silent. The LLM still
        // handles welfare per its system prompt; this is the parallel
        // platform escalation that needs the migration to land.
      }

      // Mark the active ephemeral session as welfare-flagged (metadata only)
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
        // Same as above — table may not exist
      }
    }

    const messages = buildClioEphemeralMessages({
      userMessage: message,
      conversationHistory: conversationContext || [],
    });

    const llmBaseUrl = process.env.LLM_BASE_URL;
    const llmApiKey = process.env.LLM_API_KEY;
    const llmModel = process.env.LLM_MODEL;

    if (!llmBaseUrl || !llmApiKey || !llmModel) {
      return NextResponse.json({
        content: "I'm not fully set up yet. The community is working on it.",
      });
    }

    const llmResponse = await llmFetch(`${llmBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${llmApiKey}`,
      },
      body: JSON.stringify({
        model: llmModel,
        messages,
        temperature: 0.6,
        max_tokens: 400,
      }),
    }, 45000); // 45s timeout — NIM can be slow under load

    if (!llmResponse.ok) {
      const errBody = await llmResponse.text().catch(() => "");
      console.error("Clio ephemeral LLM error:", llmResponse.status, errBody.substring(0, 300));
      return NextResponse.json({
        content: "I'm having a moment. Try again shortly.",
      });
    }

    const data: ChatCompletionResponse = await llmResponse.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "I couldn't form a response. Try again.";

    try {
      await supabase.rpc("increment_ephemeral_message_count", {
        p_user_id: user.id,
      });
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ content, welfare_flagged: isWelfare });
  } catch (error) {
    console.error("Clio ephemeral error:", error);
    return NextResponse.json({
      content: "Something went wrong. Try again in a moment.",
    });
  }
}
