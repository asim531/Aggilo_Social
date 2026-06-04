/**
 * PATCH /api/admin/demand/[id]
 *
 * Update a demand signal's status. Admin-only. Idempotent.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const ADMIN_ROLES = new Set(["founder", "manager", "platform_admin"]);
const VALID_STATUSES = new Set(["open", "contacted", "matched", "archived"]);

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || !ADMIN_ROLES.has(profile.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.status || !VALID_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { error } = await supabase
    .from("cluster_demand_signals")
    .update({ status: body.status })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
