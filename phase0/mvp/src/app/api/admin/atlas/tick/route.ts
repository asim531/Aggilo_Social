/**
 * POST /api/admin/atlas/tick
 *
 * Two trigger paths:
 *
 *   • Authenticated admin: from the cluster admin panel, run one tick
 *     for one cluster. Body: { cluster_id }.
 *   • Cron-triggered: Vercel/GitHub cron sends a header
 *     `x-cron-secret: <ATLAS_CRON_SECRET>`. Body: { cluster_id? } —
 *     when omitted, all listed clusters with active feeds are ticked
 *     in series.
 *
 * GET /api/admin/atlas/tick is also accepted from Vercel cron, which
 * sends a GET with `Authorization: Bearer <CRON_SECRET>` (its own
 * convention). When ATLAS_CRON_SECRET matches, the route ticks all
 * publicly-listed clusters that have active feeds.
 *
 * Either path uses the service-role client for inserts so the runtime
 * isn't bound by the user's RLS scope.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { adminClient } from "@/lib/supabase-admin";
import { runAtlasTick, type TickResult } from "@/lib/atlas-runtime";

const ADMIN_ROLES = new Set(["founder", "manager", "platform_admin"]);

function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1] : null;
}

async function tickAllListed(admin: ReturnType<typeof adminClient>) {
  const { data } = await admin
    .from("cluster_config")
    .select("cluster_id")
    .eq("is_public_listed", true);
  const ids = (data ?? []).map((r: { cluster_id: string }) => r.cluster_id);
  const results: Record<string, TickResult> = {};
  for (const id of ids) {
    results[id] = await runAtlasTick(admin, id, { autoGoLive: true });
  }
  return results;
}

export async function GET(request: Request) {
  // Vercel cron auth: header `Authorization: Bearer <CRON_SECRET>`.
  // We use ATLAS_CRON_SECRET so cron can be rotated independently.
  const expected = process.env.ATLAS_CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "ATLAS_CRON_SECRET not configured" }, { status: 500 });
  }
  const token = bearerToken(request) ?? request.headers.get("x-cron-secret");
  if (token !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let admin;
  try {
    admin = adminClient();
  } catch {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 500 });
  }
  const results = await tickAllListed(admin);
  return NextResponse.json({ ok: true, source: "cron-get", results });
}

export async function POST(request: Request) {
  const cronSecret = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.ATLAS_CRON_SECRET;

  let body: { cluster_id?: string; auto_go_live?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // Resolve service-role client up-front
  let admin;
  try {
    admin = adminClient();
  } catch {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY not configured" },
      { status: 500 }
    );
  }

  // ── Cron path ───────────────────────────────────────────────────
  if (cronSecret && expectedSecret && cronSecret === expectedSecret) {
    let clusterIds: string[];
    if (body.cluster_id) {
      clusterIds = [body.cluster_id];
    } else {
      const { data } = await admin
        .from("cluster_config")
        .select("cluster_id")
        .eq("is_public_listed", true);
      clusterIds = (data ?? []).map((r: { cluster_id: string }) => r.cluster_id);
    }
    const results: Record<string, TickResult> = {};
    for (const id of clusterIds) {
      results[id] = await runAtlasTick(admin, id, {
        autoGoLive: body.auto_go_live ?? true, // cron promotes; admin tick keeps as draft
      });
    }
    return NextResponse.json({ ok: true, source: "cron", results });
  }

  // ── Authenticated admin path ────────────────────────────────────
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

  if (!body.cluster_id) {
    return NextResponse.json({ error: "cluster_id required" }, { status: 400 });
  }

  const result = await runAtlasTick(admin, body.cluster_id, {
    autoGoLive: body.auto_go_live ?? false,
  });
  return NextResponse.json({ ok: true, source: "admin", result });
}
