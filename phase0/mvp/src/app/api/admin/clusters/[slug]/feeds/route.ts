/**
 * POST /api/admin/clusters/[slug]/feeds
 *
 * One endpoint, three actions:
 *   { action: "add",    url, label }
 *   { action: "toggle", id, active }
 *   { action: "remove", id }
 *
 * Validates URL on `add` with a HEAD request. We don't store the HEAD
 * result yet (Atlas runtime does the real fetch on tick) but the check
 * blocks obviously-broken URLs at config time.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import {
  fetchClusterConfig,
  logAdminAction,
  looksLikeUrl,
  newFeedId,
  type AtlasRssFeed,
} from "@/lib/admin-cluster";

interface AddBody {
  action: "add";
  url: string;
  label: string;
}
interface ToggleBody {
  action: "toggle";
  id: string;
  active: boolean;
}
interface RemoveBody {
  action: "remove";
  id: string;
}
type Body = AddBody | ToggleBody | RemoveBody;

interface RouteContext {
  params: Promise<{ slug: string }>;
}

const ADMIN_ROLES = new Set(["founder", "manager", "platform_admin"]);

async function urlReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) return true;
    // Some feed hosts reject HEAD; fall back to a tiny GET
    if (res.status === 405 || res.status === 403) {
      const r2 = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(4000),
        headers: { Range: "bytes=0-1024" },
      });
      return r2.ok || r2.status === 206;
    }
    return false;
  } catch {
    return false;
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
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

  const before = await fetchClusterConfig(supabase, slug);
  if (!before) return NextResponse.json({ error: "Cluster not found" }, { status: 404 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const feeds: AtlasRssFeed[] = Array.isArray(before.atlas_rss_feeds)
    ? [...before.atlas_rss_feeds]
    : [];

  let nextFeeds: AtlasRssFeed[];
  let action_type: string;

  if (body.action === "add") {
    if (!looksLikeUrl(body.url)) {
      return NextResponse.json({ error: "URL must start with http(s)://" }, { status: 400 });
    }
    if (!body.label?.trim()) {
      return NextResponse.json({ error: "Label is required" }, { status: 400 });
    }
    const reachable = await urlReachable(body.url);
    if (!reachable) {
      return NextResponse.json(
        { error: "URL did not respond to HEAD or GET. Check the address." },
        { status: 400 }
      );
    }
    if (feeds.some((f) => f.url === body.url)) {
      return NextResponse.json(
        { error: "This feed URL is already configured." },
        { status: 409 }
      );
    }
    nextFeeds = [
      ...feeds,
      {
        id: newFeedId(),
        url: body.url.trim(),
        label: body.label.trim(),
        active: true,
        added_at: new Date().toISOString(),
        added_by: user.id,
        last_fetched_at: null,
        last_fetch_status: null,
      },
    ];
    action_type = "atlas_feed_added";
  } else if (body.action === "toggle") {
    nextFeeds = feeds.map((f) =>
      f.id === body.id ? { ...f, active: Boolean(body.active) } : f
    );
    action_type = body.active ? "atlas_feed_enabled" : "atlas_feed_disabled";
  } else if (body.action === "remove") {
    nextFeeds = feeds.filter((f) => f.id !== body.id);
    action_type = "atlas_feed_removed";
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("cluster_config")
    .update({
      atlas_rss_feeds: nextFeeds,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("cluster_id", before.cluster_id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await logAdminAction(supabase, {
    cluster_id: before.cluster_id,
    actor_id: user.id,
    actor_role: profile.role as string,
    action_type,
    before_state: { atlas_rss_feeds: feeds },
    after_state: { atlas_rss_feeds: nextFeeds },
  });

  return NextResponse.json({ ok: true, atlas_rss_feeds: nextFeeds });
}
