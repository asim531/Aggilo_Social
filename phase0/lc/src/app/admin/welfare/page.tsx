import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { CLUSTER_ID } from "@/lib/cluster";
import WelfareItemActions from "@/components/admin/WelfareItemActions";

/**
 * /admin/welfare — welfare queue.
 *
 * Lists unresolved welfare notifications for this cluster, ordered by
 * most recent first. Resolved items are accessible via the toggle.
 * Each row shows:
 *   - Source (sage_post, clio_fab, clio_ephemeral)
 *   - Triggering content (truncated)
 *   - Member nickname (if available)
 *   - Sage's response (if any)
 *   - Resolve action
 *
 * The platform safety floor routes here when Sage or Clio detect
 * signals beyond the cluster's normal subject matter. Welfare is
 * never auto-resolved — admin must explicitly mark each item.
 */

interface WelfareRow {
  id: string;
  cluster_id: string;
  user_id: string | null;
  post_id: string | null;
  trigger_content: string | null;
  source: "sage_post" | "clio_fab" | "clio_ephemeral";
  sage_response: string | null;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

interface ProfileLite {
  id: string;
  nickname: string;
}

interface PostLite {
  id: string;
  content: string;
  thread_state: string;
}

const SOURCE_LABELS: Record<WelfareRow["source"], string> = {
  sage_post: "Public post (Sage flagged)",
  clio_fab: "Clio chat (cluster mode)",
  clio_ephemeral: "Clio chat (private mode)",
};

export default async function WelfarePage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const params = await searchParams;
  const showResolved = params.show === "resolved";

  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("welfare_notifications")
    .select("*")
    .eq("cluster_id", CLUSTER_ID)
    .eq("resolved", showResolved)
    .order("created_at", { ascending: false })
    .limit(100);

  const items = (rows ?? []) as WelfareRow[];

  // Bulk-fetch profiles and posts referenced by the rows so we can
  // render nicknames and post context without N+1 queries.
  const userIds = Array.from(
    new Set(items.map((i) => i.user_id).filter((id): id is string => Boolean(id)))
  );
  const postIds = Array.from(
    new Set(items.map((i) => i.post_id).filter((id): id is string => Boolean(id)))
  );

  const [profilesRes, postsRes] = await Promise.all([
    userIds.length
      ? supabase
          .from("profiles")
          .select("id, nickname")
          .in("id", userIds)
          .eq("cluster_id", CLUSTER_ID)
      : Promise.resolve({ data: [] as ProfileLite[] }),
    postIds.length
      ? supabase
          .from("posts")
          .select("id, content, thread_state")
          .in("id", postIds)
          .eq("cluster_id", CLUSTER_ID)
      : Promise.resolve({ data: [] as PostLite[] }),
  ]);

  const profilesById = new Map<string, ProfileLite>(
    ((profilesRes.data ?? []) as ProfileLite[]).map((p) => [p.id, p])
  );
  const postsById = new Map<string, PostLite>(
    ((postsRes.data ?? []) as PostLite[]).map((p) => [p.id, p])
  );

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-lc-ink">Welfare queue</h1>
          <p className="text-sm text-lc-muted mt-1">
            {showResolved
              ? "Resolved welfare notifications. Read-only."
              : "Unresolved welfare notifications. Each item must be resolved explicitly."}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/admin/welfare"
            className={`px-2 py-1 rounded ${
              !showResolved
                ? "bg-lc-clio text-white"
                : "text-lc-muted hover:text-lc-ink"
            }`}
          >
            Open
          </Link>
          <Link
            href="/admin/welfare?show=resolved"
            className={`px-2 py-1 rounded ${
              showResolved
                ? "bg-lc-clio text-white"
                : "text-lc-muted hover:text-lc-ink"
            }`}
          >
            Resolved
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-lc-card border border-dashed border-stone-300 rounded-lg p-8 text-center">
          <p className="text-sm text-lc-muted">
            {showResolved
              ? "No resolved items yet."
              : "Nothing in the queue. The room is quiet."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const profile = item.user_id
              ? profilesById.get(item.user_id)
              : undefined;
            const post = item.post_id ? postsById.get(item.post_id) : undefined;
            const created = new Date(item.created_at);
            const created_human = created.toLocaleString();

            return (
              <li
                key={item.id}
                className="bg-lc-card border border-stone-200 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-wider text-rose-600 font-semibold">
                      {SOURCE_LABELS[item.source]}
                    </p>
                    <p className="text-sm text-lc-muted mt-0.5">
                      {profile ? (
                        <>
                          <span className="text-lc-ink font-medium">
                            {profile.nickname}
                          </span>{" "}
                          · {created_human}
                        </>
                      ) : (
                        <>Unknown member · {created_human}</>
                      )}
                    </p>
                  </div>
                  {!showResolved && <WelfareItemActions itemId={item.id} />}
                </div>

                {item.trigger_content && (
                  <blockquote className="text-sm text-lc-ink leading-relaxed border-l-2 border-rose-300 pl-3 py-1 bg-rose-50/40 rounded-r">
                    {item.trigger_content}
                  </blockquote>
                )}

                {post && (
                  <div className="text-xs text-lc-muted">
                    Linked post is currently flagged as{" "}
                    <code className="px-1 py-0.5 bg-stone-100 rounded">
                      {post.thread_state}
                    </code>
                  </div>
                )}

                {item.sage_response && (
                  <div className="text-xs text-lc-muted border-t border-stone-100 pt-2">
                    <span className="font-semibold text-lc-sage">Sage:</span>{" "}
                    {item.sage_response}
                  </div>
                )}

                {item.resolved && item.resolved_at && (
                  <p className="text-xs text-lc-muted">
                    Resolved {new Date(item.resolved_at).toLocaleString()}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
