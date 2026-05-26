import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";

/**
 * POST /api/admin/welfare/[id]/resolve
 *
 * Marks a welfare notification as resolved. Caller must be an admin
 * of this cluster. The action is auditable — `resolved_by` and
 * `resolved_at` are stamped from the auth user, not optional.
 *
 * Welfare items are NEVER auto-resolved. Every row in this table
 * required explicit admin attention. The row stays in the resolved
 * state forever (no un-resolve action) so the audit log is monotonic.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Authorise: caller must be an admin of this cluster.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .eq("cluster_id", CLUSTER_ID)
      .maybeSingle();

    const role = (profile as { role?: string } | null)?.role ?? "member";
    if (!["admin", "founder", "manager"].includes(role)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Use service role to update — the RLS policy on
    // welfare_notifications grants SELECT to admins but not UPDATE
    // (preventing any chance of accidental member-side modification).
    const admin = createAdminClient();
    const { error: updateErr } = await admin
      .from("welfare_notifications")
      .update({
        resolved: true,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("cluster_id", CLUSTER_ID)
      .eq("resolved", false);

    if (updateErr) {
      return NextResponse.json(
        { error: "update_failed", detail: updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.warn(
      "[admin/welfare/resolve] error:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
