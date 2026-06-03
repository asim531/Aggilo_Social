import { NextResponse } from "next/server";
import { Resend } from "resend";
import { readFileSync } from "fs";
import { join } from "path";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications/reengagement
 *
 * Vercel Cron handler — runs daily at 08:30 IST (03:00 UTC).
 * Manually triggerable via POST for admin testing.
 *
 * Engagement logic (human-behaviour rationale):
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  WHO gets an email                                           │
 *   │  ─────────────────                                           │
 *   │  • last_seen_at is between 24h and 72h ago                   │
 *   │    — 24h minimum: they may just be sleeping; don't interrupt │
 *   │    — 72h maximum: past 3 days the moment is cold; don't spam │
 *   │  • notif_email_enabled = true                                │
 *   │  • no notification_log row within the last 3 days            │
 *   │    (hard cooldown — once per 3 days maximum per person)      │
 *   │  • at least 1 new post arrived AFTER their last_seen_at      │
 *   │    (never email about a room that hasn't changed)            │
 *   └──────────────────────────────────────────────────────────────┘
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  WHAT the email contains                                     │
 *   │  ─────────────────────────                                   │
 *   │  • Clio-voiced, personal tone                                │
 *   │  • A real snippet from the latest post (makes it relevant)   │
 *   │  • Subject lines that feel like a letter, not an alert       │
 *   │  • One-click unsubscribe — no confirmation screen            │
 *   └──────────────────────────────────────────────────────────────┘
 */

const INACTIVITY_MIN_H = 24;
const INACTIVITY_MAX_H = 72;
const COOLDOWN_DAYS = 3;

const SUBJECT_MEMBER = "The conversation continued while you were away.";
const SUBJECT_SAGE = "Sage asked something in the room.";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

async function run(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const now = new Date();

  const minLastSeen = new Date(now.getTime() - INACTIVITY_MIN_H * 3_600_000);
  const maxLastSeen = new Date(now.getTime() - INACTIVITY_MAX_H * 3_600_000);
  const cooldownCutoff = new Date(now.getTime() - COOLDOWN_DAYS * 86_400_000);

  // ── 1. Eligible profiles ─────────────────────────────────────────
  const { data: profiles, error: profilesErr } = await admin
    .from("profiles")
    .select("id, nickname, last_seen_at")
    .eq("cluster_id", CLUSTER_ID)
    .eq("notif_email_enabled", true)
    .lt("last_seen_at", minLastSeen.toISOString())
    .gt("last_seen_at", maxLastSeen.toISOString());

  if (profilesErr) {
    console.warn("[reengagement] profiles fetch failed:", profilesErr.message);
    return NextResponse.json({ error: "profiles_fetch_failed" }, { status: 500 });
  }

  if (!profiles?.length) {
    return NextResponse.json({ sent: 0, reason: "no_eligible_users" });
  }

  // ── 2. Strip users who are still in cooldown ──────────────────────
  const userIds = profiles.map((p) => p.id);
  const { data: recentNotifs } = await admin
    .from("notification_log")
    .select("user_id")
    .eq("cluster_id", CLUSTER_ID)
    .in("user_id", userIds)
    .gt("sent_at", cooldownCutoff.toISOString());

  const cooldownSet = new Set((recentNotifs ?? []).map((n) => n.user_id));
  const eligible = profiles.filter((p) => !cooldownSet.has(p.id));

  if (!eligible.length) {
    return NextResponse.json({ sent: 0, reason: "all_users_in_cooldown" });
  }

  // ── 3. Load email template ────────────────────────────────────────
  let baseHtml: string;
  try {
    baseHtml = readFileSync(
      join(process.cwd(), "emails/clio-return-email.html"),
      "utf-8"
    );
  } catch (err) {
    console.warn("[reengagement] email template missing:", err);
    return NextResponse.json({ error: "template_missing" }, { status: 500 });
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://mvp.aggilo.in";
  const roomUrl = `${appUrl}/c/research-circle-mj/cluster`;
  const results: Array<{ email: string; status: string; reason?: string }> = [];

  for (const profile of eligible) {
    const lastSeen = new Date(profile.last_seen_at as string);

    // ── 4. Check for new posts since the user's last visit ──────────
    const { count } = await admin
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("cluster_id", CLUSTER_ID)
      .gt("created_at", lastSeen.toISOString());

    if (!count || count === 0) {
      results.push({ email: profile.id, status: "skipped", reason: "no_new_posts" });
      continue;
    }

    // ── 5. Fetch the latest post for context ─────────────────────────
    const { data: latestPosts } = await admin
      .from("posts")
      .select("content, is_sage")
      .eq("cluster_id", CLUSTER_ID)
      .gt("created_at", lastSeen.toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    const latest = latestPosts?.[0];
    const isSage = Boolean(latest?.is_sage);
    const rawSnippet = (latest?.content ?? "").replace(/\s+/g, " ").trim();
    const snippet =
      rawSnippet.length > 160
        ? rawSnippet.slice(0, 157) + "…"
        : rawSnippet;

    // ── 6. Get the user's email from auth.users ───────────────────────
    const { data: authData } = await admin.auth.admin.getUserById(profile.id);
    const email = authData?.user?.email;
    if (!email) {
      results.push({ email: profile.id, status: "skipped", reason: "no_email" });
      continue;
    }

    // ── 7. Personalise and send ───────────────────────────────────────
    const unsubUrl = `${roomUrl}?unsubscribe=1`;
    const html = baseHtml
      .replace(/\{\{nickname\}\}/g, profile.nickname)
      .replace(/\{\{snippet\}\}/g, snippet || "Something new came through.")
      .replace(/\{\{room_url\}\}/g, roomUrl)
      .replace(/\{\{unsubscribe_url\}\}/g, unsubUrl);

    const subject = isSage ? SUBJECT_SAGE : SUBJECT_MEMBER;

    try {
      await resend.emails.send({
        from: "Clio <clio@aggilo.in>",
        to: email,
        replyTo: "clio@aggilo.in",
        subject,
        html,
      });

      await admin.from("notification_log").insert({
        cluster_id: CLUSTER_ID,
        user_id: profile.id,
        notification_type: "reengagement",
        post_snapshot: snippet,
      });

      results.push({ email, status: "sent" });
    } catch (err) {
      console.warn("[reengagement] send failed for", email, err);
      results.push({ email, status: "failed" });
    }
  }

  const sent = results.filter((r) => r.status === "sent").length;
  console.log(
    `[reengagement] done — sent:${sent} skipped:${results.filter((r) => r.status === "skipped").length} failed:${results.filter((r) => r.status === "failed").length}`
  );
  return NextResponse.json({ sent, results });
}

export const GET = run;
export const POST = run;
