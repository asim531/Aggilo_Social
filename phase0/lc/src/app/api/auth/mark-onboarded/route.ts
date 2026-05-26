import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { CLUSTER_ID } from "@/lib/cluster";

/**
 * POST /api/auth/mark-onboarded
 *
 * Stamps `profiles.onboarded = true` for the calling user in this
 * cluster. Used by ClusterShell when the member dismisses the
 * ClioWelcome modal — once dismissed, the modal never fires again
 * for that profile.
 *
 * The client also caches a localStorage flag so the modal doesn't
 * flash on refresh while the round-trip completes; the server-side
 * stamp is the canonical state.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ onboarded: true })
      .eq("id", user.id)
      .eq("cluster_id", CLUSTER_ID);

    if (error) {
      return NextResponse.json(
        { error: "update_failed", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.warn(
      "[auth/mark-onboarded] error:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
