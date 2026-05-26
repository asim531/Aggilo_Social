import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

/**
 * /api/feedback
 *
 * Closed-loops principle: members rate Sage Timeline cards and Clio
 * bubbles. Signals feed Clio's prompt-improvisation loop. One signal
 * per (user, post, signal_type) — toggle by re-posting the same signal.
 *
 * GET   /api/feedback?post_id=<uuid>      → returns this user's signal on the post (or null)
 * POST  /api/feedback                     → upsert/toggle a signal
 *   body: { agent: 'sage'|'clio', related_post_id, signal: 'helpful'|'unhelpful'|'inappropriate'|'inaccurate', note?, llm_log_id? }
 * DELETE /api/feedback?id=<uuid>          → remove a signal
 */

const ALLOWED_SIGNALS = new Set(["helpful", "unhelpful", "inappropriate", "inaccurate"]);
const ALLOWED_AGENTS = new Set(["sage", "clio"]);

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("post_id");
    if (!postId) {
      return NextResponse.json({ error: "Missing post_id" }, { status: 400 });
    }

    const { data } = await supabase
      .from("agent_feedback")
      .select("id, signal, note")
      .eq("user_id", user.id)
      .eq("related_post_id", postId);

    return NextResponse.json({ signals: data ?? [] });
  } catch (err) {
    console.error("[feedback GET] unexpected:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body: {
      agent?: string;
      related_post_id?: string;
      signal?: string;
      note?: string;
      llm_log_id?: string;
    } = await request.json();

    if (
      !body.agent ||
      !ALLOWED_AGENTS.has(body.agent) ||
      !body.signal ||
      !ALLOWED_SIGNALS.has(body.signal) ||
      !body.related_post_id
    ) {
      return NextResponse.json(
        { error: "Missing or invalid fields (agent, related_post_id, signal)" },
        { status: 400 }
      );
    }

    // Toggle behaviour: if the same (user, post, signal) already exists, delete it
    const { data: existing } = await supabase
      .from("agent_feedback")
      .select("id")
      .eq("user_id", user.id)
      .eq("related_post_id", body.related_post_id)
      .eq("signal", body.signal)
      .maybeSingle();

    if (existing) {
      await supabase.from("agent_feedback").delete().eq("id", existing.id);
      return NextResponse.json({ toggled: "removed", signal: body.signal });
    }

    // Otherwise insert (and remove any other signal this user had on the same post —
    // each user has at most one signal per post)
    await supabase
      .from("agent_feedback")
      .delete()
      .eq("user_id", user.id)
      .eq("related_post_id", body.related_post_id);

    const { error } = await supabase.from("agent_feedback").insert({
      user_id: user.id,
      agent: body.agent,
      related_post_id: body.related_post_id,
      llm_log_id: body.llm_log_id ?? null,
      signal: body.signal,
      note: body.note ?? null,
    });

    if (error) {
      console.warn("[feedback POST] insert failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ toggled: "added", signal: body.signal });
  } catch (err) {
    console.error("[feedback POST] unexpected:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
