import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/posts/:id/topics
 *
 * Assign one or more topics to a post.
 * Body: { topic_ids: string[] }
 * Only the post author or admin can assign topics.
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const { id: postId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Fetch post to check ownership + cluster scope
    const { data: post } = await supabase
      .from("posts")
      .select("author_id, cluster_id")
      .eq("id", postId)
      .eq("cluster_id", CLUSTER_ID)
      .maybeSingle();

    if (!post) {
      return NextResponse.json({ error: "post_not_found" }, { status: 404 });
    }

    // Must be author or admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .eq("cluster_id", CLUSTER_ID)
      .maybeSingle();

    const isAdmin = profile?.role === "admin";
    const isAuthor = post.author_id === user.id;
    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const topicIds: string[] = Array.isArray(body.topic_ids) ? body.topic_ids : [];
    if (topicIds.length === 0) {
      return NextResponse.json({ error: "topic_ids required" }, { status: 400 });
    }

    // Verify all topic_ids belong to this cluster
    const { data: validTopics } = await supabase
      .from("topics")
      .select("id")
      .eq("cluster_id", CLUSTER_ID)
      .in("id", topicIds);

    const validIds = new Set((validTopics ?? []).map((t) => t.id as string));
    const toInsert = topicIds.filter((tid) => validIds.has(tid));

    if (toInsert.length === 0) {
      return NextResponse.json({ error: "no_valid_topic_ids" }, { status: 400 });
    }

    const admin = createAdminClient();
    const rows = toInsert.map((topicId) => ({
      post_id: postId,
      topic_id: topicId,
      added_by: isAdmin && !isAuthor ? ("sage" as const) : ("member" as const),
    }));

    const { error } = await admin.from("post_topics").insert(rows);
    if (error) {
      // Ignore unique-violation (topic already assigned)
      if (!error.message?.includes("duplicate") && !error.code?.includes("23505")) {
        console.warn("[posts/:id/topics] insert failed:", error.message);
        return NextResponse.json({ error: "db_error" }, { status: 500 });
      }
    }

    return NextResponse.json({ assigned: toInsert.length });
  } catch (err) {
    console.warn(
      "[posts/:id/topics] POST error:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/**
 * DELETE /api/posts/:id/topics
 *
 * Unassign topics from a post.
 * Body: { topic_ids: string[] }
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id: postId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { data: post } = await supabase
      .from("posts")
      .select("author_id, cluster_id")
      .eq("id", postId)
      .eq("cluster_id", CLUSTER_ID)
      .maybeSingle();

    if (!post) {
      return NextResponse.json({ error: "post_not_found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .eq("cluster_id", CLUSTER_ID)
      .maybeSingle();

    const isAdmin = profile?.role === "admin";
    const isAuthor = post.author_id === user.id;
    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const topicIds: string[] = Array.isArray(body.topic_ids) ? body.topic_ids : [];
    if (topicIds.length === 0) {
      return NextResponse.json({ error: "topic_ids required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("post_topics")
      .delete()
      .eq("post_id", postId)
      .in("topic_id", topicIds);

    if (error) {
      console.warn("[posts/:id/topics] delete failed:", error.message);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    return NextResponse.json({ removed: topicIds.length });
  } catch (err) {
    console.warn(
      "[posts/:id/topics] DELETE error:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
