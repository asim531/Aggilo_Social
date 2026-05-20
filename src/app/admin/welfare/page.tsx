import { createClient } from "@/lib/supabase-server";
import WelfareList from "@/components/admin/WelfareList";

export const dynamic = "force-dynamic";

export default async function WelfarePage() {
  const supabase = await createClient();

  const { data: open } = await supabase
    .from("welfare_notifications")
    .select("*, posts(content, created_at), profiles!welfare_notifications_user_id_fkey(nickname, country)")
    .eq("resolved", false)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: resolved } = await supabase
    .from("welfare_notifications")
    .select("*, posts(content, created_at), profiles!welfare_notifications_user_id_fkey(nickname, country)")
    .eq("resolved", true)
    .order("resolved_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">Welfare queue</h1>
        <p className="text-sm text-gray-500 mt-1">
          Posts where Sage detected a welfare signal. Each one needs a real
          human response — not a formula. Mark resolved once you have followed
          up with the member privately.
        </p>
      </header>

      <WelfareList open={open ?? []} resolved={resolved ?? []} />
    </div>
  );
}
