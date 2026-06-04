import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";
import type { Topic } from "@/lib/types";

/**
 * GET /api/topics
 *
 * List all topics for the current cluster, ordered by post_count desc.
 * Requires authentication + cluster membership.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { data: topics, error } = await supabase
      .from("topics")
      .select("*")
      .eq("cluster_id", CLUSTER_ID)
      .order("post_count", { ascending: false });

    if (error) {
      console.warn("[topics] list failed:", error.message);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    return NextResponse.json(
      { topics: (topics ?? []) as Topic[] },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err) {
    console.warn("[topics] GET error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/**
 * POST /api/topics
 *
 * Create a new topic for the cluster.
 * Body: { name: string, description?: string, color?: string }
 * Slug is auto-generated from name (lowercase, hyphenated, unique).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Verify cluster membership
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .eq("cluster_id", CLUSTER_ID)
      .maybeSingle();
    if (!profile) {
      return NextResponse.json({ error: "not_in_cluster" }, { status: 403 });
    }

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    if (!name || name.length < 2 || name.length > 60) {
      return NextResponse.json({ error: "invalid_name" }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!slug || slug.length < 2) {
      return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
    }

    const description = body.description ? String(body.description).trim() : null;
    const color = body.color ? String(body.color) : "stone";

    const admin = createAdminClient();
    const { data: topic, error } = await admin
      .from("topics")
      .insert({
        cluster_id: CLUSTER_ID,
        slug,
        name,
        description,
        color,
        created_by: user.id,
      })
      .select("*")
      .single();

    if (error) {
      if (error.message?.includes("unique")) {
        return NextResponse.json({ error: "slug_exists" }, { status: 409 });
      }
      console.warn("[topics] create failed:", error.message);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    return NextResponse.json({ topic: topic as Topic }, { status: 201 });
  } catch (err) {
    console.warn("[topics] POST error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
