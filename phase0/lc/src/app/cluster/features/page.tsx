import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { CLUSTER_ID } from "@/lib/cluster";
import FeaturesList from "@/components/FeaturesList";

/**
 * /cluster/features — Workshop tab.
 *
 * Surfaces the two-track capability model: agent_tools (run for the
 * room, no voting) and member_features (vote-gated). Both come from
 * the cluster_features table populated by /api/agents/cadence-exchange.
 *
 * Tier gating:
 *   - Voting is "active" when the cluster has at least 5 members.
 *   - Below 5: rows render but the upvote button is disabled with a
 *     friendly note. The Workshop is still a window into the agents'
 *     thinking — empty rooms are not punished.
 */
export default async function FeaturesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // Member count drives the active tier gate.
  const { count: memberCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("cluster_id", CLUSTER_ID);

  const { data: features } = await supabase
    .from("cluster_features")
    .select("*")
    .eq("cluster_id", CLUSTER_ID)
    .neq("status", "proposed_in_thoughts")
    .order("upvote_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  const tier: "active" | "placeholder" | "hidden" =
    (memberCount ?? 0) >= 5 ? "active" : "placeholder";

  return (
    <div className="min-h-screen bg-lc-surface">
      <header className="bg-lc-card border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-lc-muted">
              Aggilo · Long Conversation
            </p>
            <h1 className="text-base font-semibold text-lc-ink">
              Room Workshop
            </h1>
          </div>
          <Link
            href="/cluster"
            className="text-xs text-lc-muted hover:text-lc-ink transition-colors px-2 py-1 rounded hover:bg-stone-100"
          >
            ← Cluster
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <p className="text-sm text-lc-muted mb-6">
          What Clio and Sage are working on for this room. Tools they run for
          you, features for you to vote on.
        </p>
        <FeaturesList
          features={(features ?? []) as Parameters<typeof FeaturesList>[0]["features"]}
          tier={tier}
          userId={user.id}
        />
      </main>
    </div>
  );
}
