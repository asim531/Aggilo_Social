import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/notification-preferences
 *
 * Toggles email notification preferences for the authenticated user.
 *
 * Body: { enabled: boolean }
 *
 * Called from ClusterShell when:
 *   1. The user lands with ?unsubscribe=1 in the URL (one-click from email)
 *   2. Future: a toggle in the room UI
 *
 * There is intentionally no re-subscribe flow in the email — if they
 * want notifications back, they can ask Clio or revisit the room.
 * Respecting the opt-out is more important than re-engagement.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { enabled?: boolean };
  const enabled = body.enabled !== false;

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ notif_email_enabled: enabled })
    .eq("id", user.id)
    .eq("cluster_id", CLUSTER_ID);

  if (error) {
    console.warn("[notification-preferences] update failed:", error.message);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, notif_email_enabled: enabled });
}
