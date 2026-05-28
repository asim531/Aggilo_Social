import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";

/**
 * PUT /api/posts/[id]
 *
 * Edit an existing post. Only the original author can edit.
 * Updates the content and sets edited_at. Replies cannot be edited
 * (parent_id must be null).
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { content } = (await request.json()) as { content?: string };

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify the post exists, belongs to this user, is top-level, and is in this cluster.
    const { data: post, error: fetchError } = await admin
      .from("posts")
      .select("id, author_id, parent_id, cluster_id")
      .eq("id", id)
      .eq("cluster_id", CLUSTER_ID)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: "post not found" }, { status: 404 });
    }

    if (post.author_id !== user.id) {
      return NextResponse.json(
        { error: "you can only edit your own posts" },
        { status: 403 }
      );
    }

    if (post.parent_id !== null) {
      return NextResponse.json(
        { error: "replies cannot be edited" },
        { status: 400 }
      );
    }

    const trimmed = content.trim();
    const { data: updated, error: updateError } = await admin
      .from("posts")
      .update({ content: trimmed, edited_at: new Date().toISOString() })
      .eq("id", id)
      .eq("cluster_id", CLUSTER_ID)
      .select("*")
      .single();

    if (updateError || !updated) {
      console.warn("[posts/edit] update failed:", updateError);
      return NextResponse.json(
        { error: "failed to update post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ post: updated });
  } catch (err) {
    console.warn("[posts/edit] error:", err);
    return NextResponse.json(
      { error: "something went wrong" },
      { status: 500 }
    );
  }
}
