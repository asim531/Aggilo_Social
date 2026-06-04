/**
 * POST /api/clusters/[slug]/share
 *
 * Admin-only: generate a Sage-voiced share line for a publicly listed
 * cluster. Two modes:
 *
 *   { kind: "card_share" }    → ≤180-char outbound social line
 *   { kind: "member_invite" } → ≤120-char member-to-member invite line,
 *                                 includes the cluster URL.
 *
 * Returns: { line: string, llm_log_id: string | null }
 *
 * Phase 0: admin reviews before posting. No autonomous posting.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { llmCall } from "@/lib/llm-fetch";
import {
  getPublicClusterBySlug,
  publicClusterUrl,
} from "@/lib/public-cluster";
import {
  buildClusterCardSharePrompt,
  buildClusterInvitePrompt,
  tidyShareLine,
} from "@/lib/share-prompts";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Admin gate — only founder/manager/platform_admin can generate share copy.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, nickname")
    .eq("id", user.id)
    .single();
  if (
    !profile ||
    !["founder", "manager", "platform_admin"].includes(profile.role as string)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cluster = await getPublicClusterBySlug(slug);
  if (!cluster) {
    return NextResponse.json(
      { error: "Cluster not found or not publicly listed" },
      { status: 404 }
    );
  }

  const body: {
    kind?: "card_share" | "member_invite";
    recent_topic_samples?: string[];
  } = await request.json().catch(() => ({}));

  const kind = body.kind ?? "card_share";
  const samples = Array.isArray(body.recent_topic_samples)
    ? body.recent_topic_samples.map(String).slice(0, 5)
    : [];

  const clusterUrl = publicClusterUrl(cluster.public_slug);
  const messages =
    kind === "member_invite"
      ? buildClusterInvitePrompt({
          cluster,
          recentTopicSamples: samples,
          invitingNickname: (profile.nickname as string) || "a sister",
          clusterUrl,
        })
      : buildClusterCardSharePrompt({ cluster, recentTopicSamples: samples });

  const result = await llmCall(
    {
      agent: "sage",
      operationKey: kind === "member_invite" ? "share_invite" : "share_card",
      userId: user.id,
      clusterId: cluster.cluster_id,
    },
    {
      messages,
      temperature: 0.6,
      maxTokens: 200,
    },
    supabase
  );

  if (result.status !== "ok" || !result.content) {
    return NextResponse.json(
      {
        error: "Generation failed",
        detail: result.errorMessage ?? "no content",
      },
      { status: 502 }
    );
  }

  const maxChars = kind === "member_invite" ? 120 : 180;
  let line = tidyShareLine(result.content, maxChars);

  // Defensive: for member invites the URL must always be present at the
  // end. The model usually obeys, but if it strips the URL we re-attach
  // it on a leading space.
  if (kind === "member_invite" && !line.includes(clusterUrl)) {
    line = `${tidyShareLine(line, Math.max(0, maxChars - clusterUrl.length - 1))} ${clusterUrl}`.trim();
  }

  return NextResponse.json({
    line,
    llm_log_id: result.llmLogId,
    cluster_url: clusterUrl,
    kind,
  });
}
