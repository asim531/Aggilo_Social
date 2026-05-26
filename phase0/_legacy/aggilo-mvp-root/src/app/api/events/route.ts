import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { adminClient } from "@/lib/supabase-admin";

/**
 * POST /api/events
 *
 * Behavioural event ingestion. Closed-loops principle: every meaningful
 * action becomes queryable data the AI can learn from.
 *
 * Authenticated members POST a small JSON payload; the server stamps
 * user_id, country, gender from the profile (denormalized for AGGIL
 * segment analysis) and writes the row.
 *
 * Allowed event_type whitelist enforces shape — clients can't write
 * arbitrary types.
 */

const ALLOWED_EVENT_TYPES = new Set([
  "session_started",
  "cluster_landed",
  "post_created",
  "post_replied",
  "post_liked",
  "reply_opened",
  "clio_message_sent",
  "clio_tab_switched",
  "clio_panel_opened",
  "clio_panel_closed",
  "dua_translation_revealed",
  "dua_pointer_followed",
  "agent_thoughts_opened",
  "agent_thoughts_minimized",
  "handoff_greeting_seen",
  "handoff_greeting_responded",
  "handoff_greeting_dismissed",
  "link_card_opened",
  "feature_upvoted",
  "feature_commented",
  "feature_viewed",
  "sage_feedback_given",
  "clio_feedback_given",
]);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body: {
      event_type?: string;
      cluster_id?: string;
      event_data?: Record<string, unknown>;
    } = await request.json();

    const eventType = body.event_type;
    if (!eventType || !ALLOWED_EVENT_TYPES.has(eventType)) {
      return NextResponse.json(
        { error: `Unsupported event_type: ${eventType ?? "missing"}` },
        { status: 400 }
      );
    }

    // Denormalize AGGIL snapshot at event time
    const { data: profile } = await supabase
      .from("profiles")
      .select("country, gender")
      .eq("id", user.id)
      .single();

    // Use service role to bypass RLS — INSERT-only, safe.
    let insertClient = supabase;
    try {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        insertClient = adminClient();
      }
    } catch {
      // adminClient throws if env not set — fall back to user client; the
      // 'system can insert' policy will accept the insert anyway.
    }

    const { error } = await insertClient.from("behavioural_events").insert({
      user_id: user.id,
      event_type: eventType,
      cluster_id: body.cluster_id ?? "the_single_source",
      event_data: body.event_data ?? {},
      country: profile?.country ?? null,
      gender: profile?.gender ?? null,
    });

    if (error) {
      console.warn("[events] insert failed:", error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[events] unexpected:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
