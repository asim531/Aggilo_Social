import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import FeaturesList from "@/components/FeaturesList";

export const dynamic = "force-dynamic";

const PLACEHOLDER_THRESHOLD = 5;
const POLLING_THRESHOLD = 15;

export default async function ClusterFeaturesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ count: memberCount }, { data: features }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("cluster_features")
      .select("*")
      .eq("cluster_id", "the_single_source")
      .order("upvote_count", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const total = memberCount ?? 0;
  const tier =
    total < PLACEHOLDER_THRESHOLD
      ? "hidden"
      : total < POLLING_THRESHOLD
        ? "placeholder"
        : "active";

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/cluster"
              className="text-gray-500 hover:text-gray-800 text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to room
            </Link>
          </div>
          <h1 className="text-base font-semibold text-aggilo-deep">Workshop</h1>
          <div className="w-20" /> {/* spacer */}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            What we&apos;re building for this room
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Tools the agents run for the room run automatically. Features that change how members
            interact need your votes. Both surface here as Clio and Sage figure out what would genuinely help.
          </p>
        </div>

        {tier === "hidden" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-sm text-gray-700 font-medium mb-1">
              Coming soon
            </p>
            <p className="text-xs text-gray-500">
              The room is still finding its rhythm. Once a few more members are
              here, you&apos;ll see what the agents are building.
            </p>
          </div>
        )}

        {tier === "placeholder" && (features ?? []).length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-sm text-gray-700 font-medium mb-1">
              The agents are working
            </p>
            <p className="text-xs text-gray-500">
              Nothing has shipped yet. Sage and Clio meet periodically to figure out
              what tools to run and what features to propose. When something is ready,
              you&apos;ll see it here first.
            </p>
          </div>
        )}

        {(features ?? []).length > 0 && (
          <FeaturesList
            features={features as []}
            tier={tier}
            userId={user.id}
          />
        )}

        <div className="mt-8 text-xs text-gray-500 leading-relaxed border-t border-gray-200 pt-4">
          <p>
            Members: <span className="font-semibold text-gray-700">{total}</span>
            {tier === "active" ? (
              <span> · polling and comments are open</span>
            ) : tier === "placeholder" ? (
              <span> · ideas are being collected, voting opens at {POLLING_THRESHOLD} members</span>
            ) : (
              <span> · features tab opens at {PLACEHOLDER_THRESHOLD} members</span>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}
