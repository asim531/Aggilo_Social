import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";

/**
 * POST /api/auth/check-nickname
 *
 * Checks whether a nickname is already taken in THIS cluster's profile
 * rows. Case-insensitive. Scoped by cluster_id — the same nickname can
 * exist in Sisters in Dua (different cluster), but never twice within
 * Research Circle MJ.
 *
 * Returns: { available: boolean }
 *
 * Fail-open behaviour: any error (network, missing service key,
 * unreachable DB) returns available:true so sign-up isn't blocked. The
 * INSERT-time UNIQUE constraint on (cluster_id, lower(nickname)) is
 * the actual safety net; this check is just for nice UX feedback.
 */
export async function POST(request: Request) {
  try {
    const { nickname } = await request.json();
    if (!nickname || typeof nickname !== "string" || nickname.trim().length < 2) {
      return NextResponse.json({ available: false, reason: "invalid" });
    }

    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return NextResponse.json({ available: true });
    }

    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("cluster_id", CLUSTER_ID)
      .ilike("nickname", nickname.trim());

    const available = (count ?? 0) === 0;
    return NextResponse.json({ available });
  } catch {
    return NextResponse.json({ available: true });
  }
}
