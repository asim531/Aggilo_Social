import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";
import { llmCall } from "@/lib/llm";
import { buildClioEphemeralMessages } from "@/lib/prompts/clio-builder";
import { detectWelfareSignal } from "@/lib/welfare";

/**
 * POST /api/clio/ephemeral
 *
 * Private ephemeral Clio chat. Content lives in browser sessionStorage
 * (12h TTL, never persisted server-side). The server stores only
 * session metadata in `clio_ephemeral_sessions`.
 *
 * Welfare detection runs on every message. If it fires, the response
 * is deterministic and a welfare_notification row is written.
 *
 * Body:
 *   { message: string, history: { role, content }[], session_id?: string }
 *
 * Returns:
 *   { reply: string, session_id: string }
 *
 * The session_id is created on first call and returned to the client
 * for subsequent calls. The client stores it in sessionStorage alongside
 * the conversation content.
 */
export async function POST(request: Request) {
  try {
    const { message, history = [], session_id } = await request.json();
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

    const admin = createAdminClient();

    // ── Session management ────────────────────────────────────────
    let activeSessionId: string = session_id ?? "";

    if (!activeSessionId) {
      // Create a new ephemeral session record.
      const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
      const { data: newSession } = await admin
        .from("clio_ephemeral_sessions")
        .insert({
          cluster_id: CLUSTER_ID,
          user_id: user.id,
          expires_at: expiresAt,
          message_count: 0,
          welfare_flagged: false,
        })
        .select("session_id")
        .single();
      activeSessionId = newSession?.session_id ?? crypto.randomUUID();
    }

    // Increment message count (best-effort, non-blocking).
    Promise.resolve(
      admin.rpc("increment_ephemeral_message_count", {
        p_session_id: activeSessionId,
      })
    ).catch(() => {});

    // ── Welfare pre-filter ────────────────────────────────────────
    if (detectWelfareSignal(message)) {
      await admin
        .from("clio_ephemeral_sessions")
        .update({ welfare_flagged: true, welfare_escalated_at: new Date().toISOString() })
        .eq("session_id", activeSessionId);

      await admin.from("welfare_notifications").insert({
        cluster_id: CLUSTER_ID,
        user_id: user.id,
        trigger_content: message.slice(0, 500),
        source: "clio_ephemeral",
        resolved: false,
      });

      return NextResponse.json({
        reply:
          "What you're carrying is real, and it matters. Someone from this community will reach out to you.",
        session_id: activeSessionId,
      });
    }

    // ── LLM call ──────────────────────────────────────────────────
    const messages = buildClioEphemeralMessages({
      userMessage: message,
      history: history as { role: "user" | "assistant"; content: string }[],
    });

    const result = await llmCall({
      messages,
      operationKey: "clio_ephemeral",
      temperature: 0.7,
      maxTokens: 300,
    });

    return NextResponse.json({
      reply: result.content.trim(),
      session_id: activeSessionId,
    });
  } catch (err) {
    console.warn(
      "[clio/ephemeral] error:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json(
      { reply: "I'm having trouble right now. Try again in a moment." },
      { status: 500 }
    );
  }
}
