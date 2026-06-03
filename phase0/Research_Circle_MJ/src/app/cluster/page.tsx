import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { CLUSTER_ID } from "@/lib/cluster";
import ClusterShell from "@/components/ClusterShell";
import { StillJoining } from "./StillJoining";
import type { PostWithAuthor, Profile } from "@/lib/types";

/**
 * /cluster — the room.
 *
 * Server-rendered first paint. The middleware has already redirected
 * unauthenticated users to /. Here we:
 *   1. Fetch the user's Research Circle MJ profile (cluster-scoped).
 *   2. Fetch initial posts (cluster-scoped, oldest first).
 *   3. Hand them to ClusterShell which sets up realtime + composer.
 *
 * The Sage seed post is NOT auto-inserted server-side anymore (the MVP
 * does this for empty rooms; we want Research Circle MJ to start clean
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
    return <StillJoining userId={user.id} email={user.email} metadata={user.user_metadata} />;
  }

  const profile = profileRow as Profile;

  // Initial posts — top-level + their replies up to a depth of 1.
  // Threading is shallow (one level) so a single SELECT covers the
  // whole feed. Includes posts from Sage (author_id = null) and from
  // members.
  //
  // Two-step fetch (posts then profiles in bulk) instead of a
  // PostgREST embed, because posts.author_id has two FKs after the
  // cluster-scope migration (auth.users + composite profiles), which
  // makes embed disambiguation fragile. The two-step approach is
  // robust to either FK shape and adds one extra small query.
  const { data: rawPosts, error: postsError } = await supabase
    .from("posts")
    .select("*")
    .eq("cluster_id", CLUSTER_ID)
    .order("created_at", { ascending: true })
    .limit(200);

  if (postsError) {
    console.warn("[cluster/page] posts fetch failed:", postsError.message);
  }

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
    />
  );
}
