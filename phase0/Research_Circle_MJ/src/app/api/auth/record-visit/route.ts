import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/record-visit
 *
 * Stamps `last_seen_at` on the caller's profile so the notification
 * engine knows when they were last in the room. Called once per session
 * from ClusterShell on mount — lightweight, fire-and-forget.
 *
 * Uses the admin client for the UPDATE so this succeeds even when
 * the profile RLS policy is restrictive (the same pattern used by
 * the clio-tip worker and mark-onboarded route).
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", user.id)
    .eq("cluster_id", CLUSTER_ID);

  if (error) {
    console.warn("[record-visit] update failed:", error.message);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
