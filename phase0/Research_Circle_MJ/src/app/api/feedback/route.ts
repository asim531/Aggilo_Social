import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";

/**
 * POST /api/feedback
 *
 * Anonymous member feedback. No auth required — the cluster is already
 * invite-gated and membership-scoped. Stores:
 *   - cluster_id (always CLUSTER_ID)
 *   - category: 'bug' | 'feature_request' | 'general' | 'content_issue'
 *   - message: free text
 *
 * Returns { ok: true } on success.
 */

const VALID_CATEGORIES = ["bug", "feature_request", "general", "content_issue"];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      category?: string;
      message?: string;
    };

    const category = String(body.category ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    if (!message || message.length < 1) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (message.length > 4000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("member_feedback").insert({
      cluster_id: CLUSTER_ID,
      category,
      message: message.slice(0, 4000),
    });

    if (error) {
      console.warn("[api/feedback] insert error:", error.message);
      return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.warn("[api/feedback] exception:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
