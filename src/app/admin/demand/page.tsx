import { createClient } from "@/lib/supabase-server";
import DemandSignalsTable from "@/components/admin/DemandSignalsTable";

export const dynamic = "force-dynamic";

interface DemandSignalRow {
  id: string;
  source_slug: string | null;
  source_cluster_id: string | null;
  email: string | null;
  visitor_country: string | null;
  visitor_year_of_birth: number | null;
  visitor_gender: string | null;
  visitor_languages: string[] | null;
  visitor_interests: string[] | null;
  free_text_note: string | null;
  status: string;
  created_at: string;
}

export default async function DemandPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cluster_demand_signals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">Demand signals</h1>
        <p className="text-sm text-gray-500 mt-1">
          People who arrived at a public preview but didn&apos;t fit the AGGIL filter — wrong gender, wrong country, etc. Passive signal: no outreach in Phase 0. The point is to see what audiences keep knocking.
        </p>
      </header>
      <DemandSignalsTable signals={(data ?? []) as DemandSignalRow[]} />
    </div>
  );
}
