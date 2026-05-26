import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

interface EventRow {
  id: string;
  user_id: string | null;
  event_type: string;
  cluster_id: string | null;
  event_data: Record<string, unknown>;
  country: string | null;
  gender: string | null;
  created_at: string;
}

function fmtRelative(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default async function EventsPage() {
  const supabase = await createClient();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [{ data: recent }, { data: today }] = await Promise.all([
    supabase
      .from("behavioural_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("behavioural_events")
      .select("event_type")
      .gte("created_at", since24h.toISOString()),
  ]);

  const counts: Record<string, number> = {};
  ((today ?? []) as Array<{ event_type: string }>).forEach((r) => {
    counts[r.event_type] = (counts[r.event_type] ?? 0) + 1;
  });
  const sortedCounts = Object.entries(counts).sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">Behavioural events</h1>
        <p className="text-sm text-gray-500 mt-1">
          Every meaningful action members take. The closed-loop substrate that
          lets the AI improve over time.
        </p>
      </header>

      <section className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Last 24h by type</h2>
        {sortedCounts.length === 0 ? (
          <p className="text-xs text-gray-500">No events in the last 24h.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {sortedCounts.map(([type, count]) => (
              <div key={type} className="border border-gray-100 rounded-lg p-2">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">
                  {type.replace(/_/g, " ")}
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-0.5">{count}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Last 100 events</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium">When</th>
                <th className="px-3 py-2 text-left font-medium">Type</th>
                <th className="px-3 py-2 text-left font-medium">Country</th>
                <th className="px-3 py-2 text-left font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {((recent ?? []) as EventRow[]).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                    No events recorded yet.
                  </td>
                </tr>
              ) : (
                ((recent ?? []) as EventRow[]).map((e) => (
                  <tr key={e.id}>
                    <td className="px-3 py-2 text-gray-500">{fmtRelative(e.created_at)}</td>
                    <td className="px-3 py-2 text-gray-700 font-medium">
                      {e.event_type.replace(/_/g, " ")}
                    </td>
                    <td className="px-3 py-2 text-gray-500">{e.country ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-500 font-mono text-[10px] line-clamp-1">
                      {Object.keys(e.event_data).length > 0
                        ? JSON.stringify(e.event_data)
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
