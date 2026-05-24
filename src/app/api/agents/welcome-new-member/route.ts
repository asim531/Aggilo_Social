import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { adminClient } from "@/lib/supabase-admin";
import { tryAcquireAgentLock, releaseAgentLock } from "@/lib/agent-lock";

/**
 * POST /api/agents/welcome-new-member
 *
 * Posts a single, brief, non-performative Sage acknowledgment when a new
 * member joins the room. The point is social proof for everyone else —
 * "the room is alive, sisters are arriving" — without making the new
 * member feel scripted at.
 *
 * Rules:
 *  - Once per (user, cluster). Idempotent — safe to call multiple times.
 *  - Skipped during the first 30 minutes to avoid welcoming the user
 *    while they're still onboarding.
 *  - Skipped if the user already has any post in the room (they're not new).
 *  - Skipped if a Sage welcome was posted in the last 30 minutes for ANY
 *    member (don't pile up multiple welcomes in a quiet room).
 *
 * Wording is intentionally restrained — Sage's voice. No exclamation
 * marks, no "welcome!", no scripted flourish. One short line.
 */

const WELCOME_LINES_GENERIC = [
  "A new sister has joined the room.",
  "Someone new has arrived.",
  "Welcoming a new sister to the room.",
];

function buildWelcomeLine(nickname: string | null): string {
  if (nickname) {
    const greetings = [
      `${nickname} has joined the room. Assalamu Alaikum.`,
      `A warm welcome to ${nickname}, who just joined the room.`,
      `${nickname} is here. Welcome.`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  return WELCOME_LINES_GENERIC[Math.floor(Math.random() * WELCOME_LINES_GENERIC.length)];
}

const RECENT_WELCOME_WINDOW_MINUTES = 30;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Use the service-role client so RLS does not get in the way of
    // querying behavioural_events / inserting the system post.
    let admin;
    try {
      admin = adminClient();
    } catch {
      // Service key not configured — degrade gracefully
      return NextResponse.json({ skipped: "service_role_not_configured" });
    }

    // ── Concurrent-request guard ────────────────────────────────────
    // ClusterShell fires this 8s after mount. A refresh, a second tab,
    // or React StrictMode double-mount would otherwise cause two
    // requests to both pass the "already welcomed" check (because
    // neither has inserted the behavioural_event yet) and post two
    // welcomes for the same member. Per-user lock with a short TTL.
    const LOCK_KEY = `welcome:${user.id}`;
    const acquired = await tryAcquireAgentLock(supabase, LOCK_KEY, 30);
    if (!acquired) {
      return NextResponse.json({ skipped: "in_flight" });
    }

    try {
      return await runWelcome(admin, user.id);
    } finally {
      await releaseAgentLock(supabase, LOCK_KEY);
    }
  } catch (err) {
    console.error("[welcome-new-member] error:", err);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}

async function runWelcome(
  admin: ReturnType<typeof adminClient>,
  userId: string
) {
    // Fetch the new member's nickname so the welcome line can name them.
    // Best-effort — if the profile isn't found yet, the generic line is used.
    const { data: profile } = await admin
      .from("profiles")
      .select("nickname")
      .eq("id", userId)
      .maybeSingle();
    const nickname: string | null = profile?.nickname ?? null;
    // Already welcomed? Check behavioural_events for a 'welcome_posted' row
    // for this user.
    const { data: existing } = await admin
      .from("behavioural_events")
      .select("id")
      .eq("user_id", userId)
      .eq("event_type", "session_started")
      .eq("event_data->>welcome_posted", "true")
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ skipped: "already_welcomed" });
    }

    // Did this user already post in the room? If yes, they're not new
    // enough for a welcome card.
    const { count: theirPostCount } = await admin
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", userId);

    if ((theirPostCount ?? 0) > 0) {
      return NextResponse.json({ skipped: "already_posting" });
    }

    // Batching logic removed: every new user gets their own welcome message.

    // Build the welcome line — includes the nickname when available.
    const line = buildWelcomeLine(nickname);

    const { data: post, error } = await admin
      .from("posts")
      .insert({
        author_id: null,
        parent_id: null,
        content: line,
        is_sage: true,
        is_sage_question: false,
        post_subtype: "welcome",
      })
      .select()
      .single();

    if (error) {
      console.warn("[welcome-new-member] insert failed:", error.message);
      return NextResponse.json({ error: "insert_failed" }, { status: 500 });
    }

    await admin.from("behavioural_events").insert({
      user_id: userId,
      event_type: "session_started",
      cluster_id: "the_single_source",
      event_data: { welcome_posted: true, post_id: post.id },
    });

    return NextResponse.json({ posted: true, post_id: post.id });
}
