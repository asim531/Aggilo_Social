import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { CLUSTER_ID } from "@/lib/cluster";

/**
 * Admin layout — Research Circle MJ.
 *
 * Gates every /admin/* route by role. Non-admins are redirected to
 * the cluster. The middleware already redirects unauthenticated
 * users; this layer is the authorisation gate.
 *
 * The role check looks at the user's LC profile (cluster-scoped).
 * Roles 'admin', 'founder', and 'manager' all gain access — the LC
 * cluster only uses 'admin' but the trio is permitted for forward
 * compatibility with premium-cluster vocabulary.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .eq("cluster_id", CLUSTER_ID)
    .maybeSingle();

  const role = (profile as { role?: string } | null)?.role ?? "member";
  if (!["admin", "founder", "manager"].includes(role)) {
    redirect("/cluster");
  }

  return (
    <div className="min-h-screen bg-husl-surface">
      <header className="bg-husl-card border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-[0.18em] text-husl-muted">
              Aggilo · Research Circle MJ
            </span>
            <span className="text-sm font-semibold text-husl-ink">Admin</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/admin/welfare"
              className="text-husl-ink hover:text-husl-clio transition-colors"
            >
              Welfare
            </Link>
            <Link
              href="/cluster"
              className="text-husl-muted hover:text-husl-ink transition-colors"
            >
              ← Cluster
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
