import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import AdminNavbar from "@/components/admin/AdminNavbar";

/**
 * Admin layout — guards the entire /admin tree.
 *
 * RLS already restricts admin tables to founder/manager roles, but the
 * UI layer enforces it too so unauthorized users see a clean redirect
 * instead of empty data.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, nickname")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "founder" && profile.role !== "manager" && profile.role !== "platform_admin")) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white rounded-2xl shadow-md p-8 border border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Admin only</h1>
          <p className="text-sm text-gray-600 mb-6">
            This area is for the cluster Admin and Managers. If this is wrong, ask the
            Admin to add your email to the allowlist.
          </p>
          <Link
            href="/cluster"
            className="inline-block px-4 py-2 rounded-lg bg-aggilo-deep text-white text-sm hover:bg-aggilo-mid transition-colors"
          >
            Back to the cluster
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar nickname={profile.nickname} role={profile.role} />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
