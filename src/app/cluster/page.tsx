import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { PostWithAuthor } from "@/lib/types";
import { SAGE_SEED_POSTS } from "@/lib/sage-prompt";
import ClusterShell from "@/components/ClusterShell";

export default async function ClusterPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const displayName = profile?.nickname || "Sister";
  const isFirstVisit = !profile?.onboarded;

  // Fetch existing posts
  const { data: posts } = await supabase
    .from("posts")
    .select("*, profiles(*)")
    .order("created_at", { ascending: true });

  let initialPosts: PostWithAuthor[] = (posts as PostWithAuthor[]) || [];

  // If the feed is empty, seed it with Sage's opening provocation
  if (initialPosts.length === 0 && SAGE_SEED_POSTS.length > 0) {
    const seedRows = SAGE_SEED_POSTS.map((content) => ({
      author_id: null,
      content,
      parent_id: null,
      is_sage: true,
      is_sage_question: false,
    }));

    await supabase.from("posts").insert(seedRows);

    const { data: seeded } = await supabase
      .from("posts")
      .select("*, profiles(*)")
      .order("created_at", { ascending: true });

    initialPosts = (seeded as PostWithAuthor[]) || [];
  }

  return (
    <ClusterShell
      displayName={displayName}
      isFirstVisit={isFirstVisit}
      userId={user.id}
      initialPosts={initialPosts}
    />
  );
}
