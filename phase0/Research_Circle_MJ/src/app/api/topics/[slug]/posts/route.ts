import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { CLUSTER_ID } from "@/lib/cluster";
import type { PostWithAuthor, Profile, Topic } from "@/lib/types";

interface Params {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/topics/:slug/posts
 *
 * Returns all posts (top-level + replies) linked to the given topic,
 * hydrated with author profiles. Requires auth + cluster membership.
 */
export async function GET(request: Request, { params }: Params) {
  try {
    const { slug } = await params;
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

    // Find the topic
    const { data: topicRow } = await supabase
      .from("topics")
      .select("*")
      .eq("cluster_id", CLUSTER_ID)
      .eq("slug", slug)
      .maybeSingle();

    if (!topicRow) {
      return NextResponse.json({ error: "topic_not_found" }, { status: 404 });
    }
    const topic = topicRow as Topic;

    // Fetch posts linked to this topic via post_topics junction
    const { data: postTopicRows, error: ptErr } = await supabase
      .from("post_topics")
      .select("post_id")
      .eq("topic_id", topic.id);

    if (ptErr) {
      console.warn("[topics/:slug/posts] post_topics fetch failed:", ptErr.message);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    const postIds = (postTopicRows ?? []).map((r) => r.post_id as string);
    if (postIds.length === 0) {
      return NextResponse.json({ topic, posts: [] });
    }

    // Fetch the actual posts
    const { data: rawPosts, error: postsErr } = await supabase
      .from("posts")
      .select("*")
      .in("id", postIds)
      .eq("cluster_id", CLUSTER_ID)
      .order("created_at", { ascending: true });

    if (postsErr) {
      console.warn("[topics/:slug/posts] posts fetch failed:", postsErr.message);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    // Hydrate author profiles
    const authorIds = Array.from(
      new Set(
        (rawPosts ?? [])
          .map((p) => p.author_id)
          .filter((id): id is string => Boolean(id))
      )
    );
    const { data: profileRows } = authorIds.length
      ? await supabase
          .from("profiles")
          .select(
            "id, cluster_id, nickname, role, is_founding_member, founding_badge_shown, gender, birth_year, country"
          )
          .eq("cluster_id", CLUSTER_ID)
          .in("id", authorIds)
      : { data: [] };

    const profilesById = new Map<string, Profile>(
      ((profileRows ?? []) as Profile[]).map((p) => [p.id, p])
    );

    const posts: PostWithAuthor[] = (rawPosts ?? []).map((p) => ({
      ...(p as PostWithAuthor),
      profiles: p.author_id ? profilesById.get(p.author_id) ?? null : null,
    }));

    return NextResponse.json({ topic, posts });
  } catch (err) {
    console.warn(
      "[topics/:slug/posts] error:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
