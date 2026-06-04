/**
 * POST /api/admin/clusters/[slug]/pulses
 *
 * Pulse-row admin actions:
 *   { action: "go_live",            pulse_id }
 *   { action: "retract",            pulse_id }
 *   { action: "override_approve",   pulse_id }
 *   { action: "toggle_public_safe", pulse_id, is_public_safe: boolean }
 *
 * `go_live` also creates a Sage-attributed Timeline post for members.
 * `retract` flips status to 'retracted'; the public preview falls back
 * to the previous live Pulse (or hides the section entirely).
 */

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { fetchClusterConfig, logAdminAction } from "@/lib/admin-cluster";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

const ADMIN_ROLES = new Set(["founder", "manager", "platform_admin"]);

interface Body {
  action: string;
  pulse_id: string;
  is_public_safe?: boolean;
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

  const cluster = await fetchClusterConfig(supabase, slug);
  if (!cluster) return NextResponse.json({ error: "Cluster not found" }, { status: 404 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { data: pulse } = await supabase
    .from("atlas_pulses")
    .select("*")
    .eq("id", body.pulse_id)
    .eq("cluster_id", cluster.cluster_id)
    .maybeSingle();
  if (!pulse) return NextResponse.json({ error: "Pulse not found" }, { status: 404 });

  let action_type: string;
  let update: Record<string, unknown> = {};
  let extraEffect: { revalidate?: boolean } = {};

  switch (body.action) {
    case "go_live": {
      if (pulse.sage_verdict !== "approved") {
        return NextResponse.json(
          { error: "Pulse must be Sage-approved before going live." },
          { status: 400 }
        );
      }
      // Create the Timeline post (Sage-attributed) so members see the Pulse card
      const witness = pulse.sage_witness_line ?? "";
      const composed = [
        witness,
        "",
        `${pulse.source_title}${pulse.source_publisher ? ` — ${pulse.source_publisher}` : ""}`,
        pulse.source_url,
      ]
        .filter((line) => line !== undefined)
        .join("\n");

      const { data: post } = await supabase
        .from("posts")
        .insert({
          author_id: null,
          content: composed,
          parent_id: null,
          is_sage: true,
          post_subtype: "atlas_pulse",
        })
        .select("id")
        .single();

      update = {
        status: "live",
        surfaced_at: new Date().toISOString(),
        related_post_id: post?.id ?? null,
      };
      action_type = "pulse_went_live";
      extraEffect = { revalidate: true };
      break;
    }

    case "retract": {
      if (pulse.status !== "live") {
        return NextResponse.json({ error: "Only live Pulses can be retracted." }, { status: 400 });
      }
      update = { status: "retracted" };
      action_type = "pulse_retracted";
      // Soft-delete the Timeline post (mark as deleted by Sage). Since posts
      // table doesn't have a deleted flag we use a content replacement.
      if (pulse.related_post_id) {
        await supabase
          .from("posts")
          .update({ content: "[Sage retracted this Pulse.]" })
          .eq("id", pulse.related_post_id);
      }
      extraEffect = { revalidate: true };
      break;
    }

    case "override_approve": {
      update = { sage_verdict: "approved", sage_rationale: "Admin override." };
      action_type = "pulse_overridden";
      break;
    }

    case "toggle_public_safe": {
      update = { is_public_safe: Boolean(body.is_public_safe) };
      action_type = body.is_public_safe ? "pulse_public_safe_on" : "pulse_public_safe_off";
      // If this Pulse is currently the live one, the public preview surface
      // changes. Revalidate the preview.
      if (pulse.status === "live") extraEffect = { revalidate: true };
      break;
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("atlas_pulses")
    .update(update)
    .eq("id", pulse.id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await logAdminAction(supabase, {
    cluster_id: cluster.cluster_id,
    actor_id: user.id,
    actor_role: profile.role as string,
    action_type,
    before_state: pulse,
    after_state: { ...pulse, ...update },
  });

  if (extraEffect.revalidate && cluster.public_slug) {
    revalidatePath(`/c/${cluster.public_slug}`);
  }

  return NextResponse.json({ ok: true });
}
