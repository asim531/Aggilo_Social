/**
 * PATCH /api/admin/clusters/[slug]/identity
 *
 * Updates a cluster's public listing controls and public meta. The
 * `slug` path param can be either the current public_slug or the raw
 * cluster_id — we resolve in fetchClusterConfig().
 *
 * Writes a row to cluster_admin_actions describing the change.
 *
 * Revalidates `/c/<new_slug>` so the preview reflects the change
 * immediately, and `/c/<old_slug>` if the slug itself moved.
 */

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import {
  fetchClusterConfig,
  logAdminAction,
  readPublicMeta,
  validateSlug,
  type ClusterPublicMeta,
} from "@/lib/admin-cluster";

interface PatchBody {
  is_public_listed?: boolean;
  public_slug?: string | null;
  public_meta?: Partial<ClusterPublicMeta>;
}

interface RouteContext {
  params: Promise<{ slug: string }>;
}

const ADMIN_ROLES = new Set(["founder", "manager", "platform_admin"]);

export async function PATCH(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || !ADMIN_ROLES.has(profile.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const before = await fetchClusterConfig(supabase, slug);
  if (!before) {
    return NextResponse.json({ error: "Cluster not found" }, { status: 404 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const willBeListed = body.is_public_listed ?? before.is_public_listed;
  const nextSlug =
    body.public_slug !== undefined
      ? body.public_slug?.trim().toLowerCase() ?? null
      : before.public_slug;

  if (willBeListed) {
    if (!nextSlug) {
      return NextResponse.json(
        { error: "public_slug is required when is_public_listed is true" },
        { status: 400 }
      );
    }
    const v = validateSlug(nextSlug);
    if (!v.ok) {
      return NextResponse.json({ error: v.reason }, { status: 400 });
    }
    // Uniqueness — handled by the DB unique index, but a friendly check first
    if (nextSlug !== before.public_slug) {
      const { data: existing } = await supabase
        .from("cluster_config")
        .select("cluster_id")
        .eq("public_slug", nextSlug)
        .maybeSingle();
      if (existing && existing.cluster_id !== before.cluster_id) {
        return NextResponse.json(
          { error: `Slug "${nextSlug}" is already taken by another cluster.` },
          { status: 409 }
        );
      }
    }
  }

  // Merge public_meta — caller may send a partial. We re-parse via the
  // canonical reader so the stored shape is always consistent.
  const mergedMeta: ClusterPublicMeta = body.public_meta
    ? readPublicMeta({ ...before.public_meta, ...body.public_meta })
    : readPublicMeta(before.public_meta);

  const update = {
    is_public_listed: willBeListed,
    public_slug: nextSlug,
    public_meta: mergedMeta,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };

  const { error: updateError } = await supabase
    .from("cluster_config")
    .update(update)
    .eq("cluster_id", before.cluster_id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Decide which action_type best describes the change. A toggle of the
  // listing flag dominates; otherwise it's a meta-only update.
  const action_type =
    body.is_public_listed !== undefined && body.is_public_listed !== before.is_public_listed
      ? "public_listing_toggled"
      : nextSlug !== before.public_slug
        ? "public_slug_changed"
        : "public_meta_updated";

  await logAdminAction(supabase, {
    cluster_id: before.cluster_id,
    actor_id: user.id,
    actor_role: profile.role as string,
    action_type,
    before_state: {
      is_public_listed: before.is_public_listed,
      public_slug: before.public_slug,
      public_meta: before.public_meta,
    },
    after_state: update,
  });

  // Cache invalidation — both old and new slugs in case slug moved.
  if (before.public_slug) revalidatePath(`/c/${before.public_slug}`);
  if (nextSlug && nextSlug !== before.public_slug) revalidatePath(`/c/${nextSlug}`);
  revalidatePath("/sitemap.xml");

  return NextResponse.json({
    ok: true,
    cluster_id: before.cluster_id,
    public_slug: nextSlug,
    is_public_listed: willBeListed,
  });
}
