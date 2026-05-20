import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  proposed_in_thoughts: "Proposed in Agent Thoughts",
  in_features_tab: "In Features tab — collecting feedback",
  members_engaged: "Members engaged",
  admin_approved: "Admin approved",
  in_development: "In development",
  live: "Live",
  deferred: "Deferred",
  rejected: "Rejected",
};

interface FeatureRow {
  id: string;
  display_name: string;
  display_description: string;
  category: string | null;
  status: string;
  proposed_by: string;
  rationale: string | null;
  upvote_count: number;
  comment_count: number;
  scheduled_eta: string | null;
  created_at: string;
}

export default async function FeaturesPage() {
  const supabase = await createClient();
  const { data: features } = await supabase
    .from("cluster_features")
    .select("*")
    .eq("cluster_id", "the_single_source")
    .order("upvote_count", { ascending: false })
    .limit(50);

  const list = (features ?? []) as FeatureRow[];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">Features pipeline</h1>
        <p className="text-sm text-gray-500 mt-1">
          What the agents have proposed, what members have voted for, what
          you&apos;ve approved for development. Members see only entries past the
          &quot;in_features_tab&quot; status.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Member-facing Features tab:{" "}
          <Link href="/cluster/features" className="text-aggilo-deep underline">
            /cluster/features
          </Link>
        </p>
      </header>

      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Feature</th>
                <th className="px-3 py-2 text-left font-medium">Proposed by</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Upvotes</th>
                <th className="px-3 py-2 text-right font-medium">Comments</th>
                <th className="px-3 py-2 text-left font-medium">ETA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                    No features proposed yet.
                  </td>
                </tr>
              ) : (
                list.map((f) => (
                  <tr key={f.id}>
                    <td className="px-3 py-2 align-top">
                      <p className="font-medium text-gray-900">{f.display_name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                        {f.display_description}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-gray-700 align-top">{f.proposed_by}</td>
                    <td className="px-3 py-2 text-gray-700 align-top">
                      {STATUS_LABELS[f.status] ?? f.status}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-900 font-medium align-top">
                      {f.upvote_count}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700 align-top">
                      {f.comment_count}
                    </td>
                    <td className="px-3 py-2 text-gray-500 align-top">
                      {f.scheduled_eta ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">How features flow</h2>
        <ol className="text-xs text-gray-600 space-y-1.5 leading-relaxed list-decimal list-inside">
          <li>Sage and Clio discuss in Agent Thoughts. If they agree on a feature, they add it here at status <code className="px-1 rounded bg-gray-100">proposed_in_thoughts</code>.</li>
          <li>Once Clio approves it for member visibility, status moves to <code className="px-1 rounded bg-gray-100">in_features_tab</code> and members see it in the Features tab.</li>
          <li>Members upvote and comment. Their feedback IS the signal that it matters.</li>
          <li>You review, approve for development, schedule, or defer. Decision is logged.</li>
          <li>When live, members see &quot;Now live&quot; in the Features tab.</li>
        </ol>
      </section>
    </div>
  );
}
