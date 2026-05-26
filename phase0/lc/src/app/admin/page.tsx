import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { CLUSTER_ID } from "@/lib/cluster";

/**
 * /admin — index page.
 *
 * Light landing for the admin surface. Currently surfaces the
 * Welfare queue with its unresolved count, plus links into cluster
 * tools as they ship. Phase 0 admin surface is intentionally minimal
 * — the Welfare queue is the only critical surface today.
 */
export default async function AdminIndexPage() {
  const supabase = await createClient();

  const { count: unresolvedWelfare } = await supabase
    .from("welfare_notifications")
    .select("id", { count: "exact", head: true })
    .eq("cluster_id", CLUSTER_ID)
    .eq("resolved", false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-lc-ink">Admin</h1>
        <p className="text-sm text-lc-muted mt-1">
          Cluster operations for Long Conversation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/welfare"
          className="block bg-lc-card border border-stone-200 rounded-lg p-5 hover:border-lc-clio transition-colors"
        >
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-base font-semibold text-lc-ink">
              Welfare queue
            </h2>
            <span
              className={`text-sm font-semibold ${
                (unresolvedWelfare ?? 0) > 0 ? "text-rose-600" : "text-lc-muted"
              }`}
            >
              {unresolvedWelfare ?? 0} open
            </span>
          </div>
          <p className="text-sm text-lc-muted">
            Welfare-flagged posts and FAB conversations awaiting admin
            response. The platform safety floor routes here when Sage or
            Clio detect signals beyond the cluster's normal subject
            matter.
          </p>
        </Link>
      </div>
    </div>
  );
}
