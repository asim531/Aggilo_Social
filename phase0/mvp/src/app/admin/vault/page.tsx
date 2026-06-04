import { createClient } from "@/lib/supabase-server";
import VaultGapsList from "@/components/admin/VaultGapsList";

export const dynamic = "force-dynamic";

interface VaultRow {
  id: string;
  title: string | null;
  source_collection: string;
  hadith_grade: string | null;
  is_quranic: boolean;
  thematic_tags: string[];
  verified_by_founder: boolean;
  date_added: string;
}

export default async function VaultPage() {
  const supabase = await createClient();

  const [{ data: vaultEntries }, { data: gaps }, { data: sources }] =
    await Promise.all([
      supabase
        .from("dua_vault")
        .select("id, title, source_collection, hadith_grade, is_quranic, thematic_tags, verified_by_founder, date_added")
        .order("date_added", { ascending: false }),
      supabase
        .from("vault_gap_requests")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("vault_sources")
        .select("*")
        .eq("active", true)
        .order("source_name"),
    ]);

  const allEntries = (vaultEntries ?? []) as VaultRow[];
  const verifiedCount = allEntries.filter((e) => e.verified_by_founder).length;

  // Compute usage map (most-surfaced duas) — derived from sage_decision_logs
  const { data: usage } = await supabase
    .from("sage_decision_logs")
    .select("vault_id_used")
    .not("vault_id_used", "is", null)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const usageMap = new Map<string, number>();
  ((usage ?? []) as Array<{ vault_id_used: string }>).forEach((u) => {
    if (u.vault_id_used) {
      usageMap.set(u.vault_id_used, (usageMap.get(u.vault_id_used) ?? 0) + 1);
    }
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">Vault</h1>
        <p className="text-sm text-gray-500 mt-1">
          Verified references this room can surface. Sage and Clio read the
          vault — they never invent or modify entries.
        </p>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Total entries" value={allEntries.length.toString()} />
        <Stat
          label="Verified"
          value={verifiedCount.toString()}
          hint={
            verifiedCount === allEntries.length
              ? "All entries verified"
              : `${allEntries.length - verifiedCount} pending`
          }
        />
        <Stat
          label="Gaps Sage flagged"
          value={(gaps ?? []).length.toString()}
          hint="Member asked for something we don't have"
          alert={(gaps ?? []).length > 0}
        />
      </section>

      <VaultGapsList gaps={gaps ?? []} />

      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">All entries</h2>
          <p className="text-[11px] text-gray-500">
            Add and edit entries directly via Supabase SQL editor for now.
            Curator UI is on the roadmap.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Title</th>
                <th className="px-3 py-2 text-left font-medium">Source</th>
                <th className="px-3 py-2 text-left font-medium">Grade</th>
                <th className="px-3 py-2 text-left font-medium">Tags</th>
                <th className="px-3 py-2 text-left font-medium">Verified</th>
                <th className="px-3 py-2 text-right font-medium">Times surfaced</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                    No vault entries.
                  </td>
                </tr>
              ) : (
                allEntries.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2 text-gray-700">{row.title ?? "Untitled"}</td>
                    <td className="px-3 py-2 text-gray-700">{row.source_collection}</td>
                    <td className="px-3 py-2 text-gray-700">
                      {row.is_quranic ? "Quran" : row.hadith_grade ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-gray-500 text-[11px]">
                      {row.thematic_tags.slice(0, 3).join(", ")}
                      {row.thematic_tags.length > 3 ? "…" : ""}
                    </td>
                    <td className="px-3 py-2">
                      {row.verified_by_founder ? (
                        <span className="text-emerald-700 font-medium">Yes</span>
                      ) : (
                        <span className="text-amber-700">Pending</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700">
                      {usageMap.get(row.id) ?? 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Approved sources</h2>
        <p className="text-xs text-gray-500 mb-3">
          Sources Sage may pull from when expanding the vault. Manage from
          Supabase SQL editor for now.
        </p>
        {((sources ?? []).length === 0) ? (
          <p className="text-xs text-gray-500">
            No sources configured. Add rows to the <code>vault_sources</code> table.
          </p>
        ) : (
          <ul className="space-y-1 text-xs">
            {(sources ?? []).map((s: { id: string; source_name: string; source_type: string; base_url: string | null }) => (
              <li key={s.id} className="text-gray-700">
                <span className="font-medium">{s.source_name}</span>
                <span className="text-gray-400"> · {s.source_type}</span>
                {s.base_url && <span className="text-gray-400"> · {s.base_url}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, hint, alert }: { label: string; value: string; hint?: string; alert?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${alert ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-white"}`}>
      <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">{label}</p>
      <p className={`text-lg font-semibold mt-0.5 ${alert ? "text-amber-700" : "text-gray-900"}`}>{value}</p>
      {hint && <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p>}
    </div>
  );
}
