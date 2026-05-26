import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { CLUSTER_ID } from "@/lib/cluster";
import ClusterShell from "@/components/ClusterShell";
import type { PostWithAuthor, Profile } from "@/lib/types";

/**
 * /cluster — the room.
 *
 * Server-rendered first paint. The middleware has already redirected
 * unauthenticated users to /. Here we:
 *   1. Fetch the user's Long Conversation profile (cluster-scoped).
 *   2. Fetch initial posts (cluster-scoped, oldest first).
 *   3. Hand them to ClusterShell which sets up realtime + composer.
 *
 * The Sage seed post is NOT auto-inserted server-side anymore (the MVP
 * does this for empty rooms; we want Long Conversation to start clean
 * — Sage's seed question is rendered by the empty-state UI, and her
 * actual posts arrive only when she has something to say).
 */
export default async function ClusterPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Profile read — must exist for the user to be in the cluster.
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .eq("cluster_id", CLUSTER_ID)
    .maybeSingle();

  if (!profileRow) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-lc-surface px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-lc-ink mb-2">
            Still joining…
          </h1>
          <p className="text-sm text-lc-muted">
            Your account is connecting to the room. Refresh once. If this
            persists, sign out and request a new link.
          </p>
        </div>
      </main>
    );
  }

  const profile = profileRow as Profile;

  // Initial posts — top-level only on first paint. Replies are folded
  // into the same query when threading ships in a later batch.
  const { data: postRows } = await supabase
    .from("posts")
    .select("*, profiles(*)")
    .eq("cluster_id", CLUSTER_ID)
    .order("created_at", { ascending: true })
    .limit(50);

  const initialPosts: PostWithAuthor[] = (postRows as PostWithAuthor[]) ?? [];

  return (
    <ClusterShell
      userId={user.id}
      profile={profile}
      initialPosts={initialPosts}
    />
  );
}
