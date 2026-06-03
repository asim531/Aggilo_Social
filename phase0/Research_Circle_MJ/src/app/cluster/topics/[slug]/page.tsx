import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { CLUSTER_ID } from "@/lib/cluster";
import type { PostWithAuthor, Profile, Topic } from "@/lib/types";
import ClusterShell from "@/components/ClusterShell";

/**
 * /cluster/topics/:slug — Topic detail page.
 *
 * Server-rendered first paint. Shows all posts linked to a specific topic.
 * Falls back to notFound() if the topic doesn't exist in this cluster.
 */
export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-husl-surface">
        <p className="text-sm text-husl-muted">Sign in to view this topic.</p>
      </main>
    );
  }

  // Verify cluster membership
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .eq("cluster_id", CLUSTER_ID)
    .maybeSingle();

  if (!profileRow) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-husl-surface px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-husl-ink mb-2">Still joining…</h1>
          <p className="text-sm text-husl-muted">
            Your account is connecting to the room. Refresh once.
          </p>
        </div>
      </main>
    );
  }

  const profile = profileRow as Profile;

  // Fetch the topic
  const { data: topicRow } = await supabase
    .from("topics")
    .select("*")
    .eq("cluster_id", CLUSTER_ID)
    .eq("slug", slug)
    .maybeSingle();

  if (!topicRow) {
    notFound();
  }
  const topic = topicRow as Topic;

  // Fetch posts linked to this topic
  const { data: postTopicRows } = await supabase
    .from("post_topics")
    .select("post_id")
    .eq("topic_id", topic.id);

  const postIds = (postTopicRows ?? []).map((r) => r.post_id as string);
  if (postIds.length === 0) {
    return (
      <ClusterShell
        userId={user.id}
        profile={profile}
        initialPosts={[]}
        activeTopic={topic}
      />
    );
  }

  const { data: rawPosts } = await supabase
    .from("posts")
    .select("*")
    .in("id", postIds)
    .eq("cluster_id", CLUSTER_ID)
    .order("created_at", { ascending: true });

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

  const initialPosts: PostWithAuthor[] = (rawPosts ?? []).map((p) => ({
    ...(p as PostWithAuthor),
    profiles: p.author_id ? profilesById.get(p.author_id) ?? null : null,
  }));

  return (
    <ClusterShell
      userId={user.id}
      profile={profile}
      initialPosts={initialPosts}
      activeTopic={topic}
    />
  );
}
