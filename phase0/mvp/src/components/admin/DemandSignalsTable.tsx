"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

interface Props {
  signals: DemandSignalRow[];
}

const STATUS_OPTIONS = ["open", "contacted", "matched", "archived"] as const;

export default function DemandSignalsTable({ signals }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      filter === "all" ? signals : signals.filter((s) => s.status === filter),
    [filter, signals]
  );

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    try {
      await fetch(`/api/admin/demand/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  function exportCsv() {
    const header = [
      "created_at",
      "status",
      "source_slug",
      "email",
      "country",
      "gender",
      "year_of_birth",
      "languages",
      "interests",
      "note",
    ];
    const rows = filtered.map((s) => [
      s.created_at,
      s.status,
      s.source_slug ?? "",
      s.email ?? "",
      s.visitor_country ?? "",
      s.visitor_gender ?? "",
      s.visitor_year_of_birth ?? "",
      (s.visitor_languages ?? []).join("|"),
      (s.visitor_interests ?? []).join("|"),
      (s.free_text_note ?? "").replace(/"/g, '""'),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((c) => `"${String(c)}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aggilo-demand-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-xs border border-gray-300 rounded px-2 py-1.5"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={exportCsv}
          className="text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Arrived</th>
              <th className="px-3 py-2 text-left font-medium">Cluster</th>
              <th className="px-3 py-2 text-left font-medium">Visitor</th>
              <th className="px-3 py-2 text-left font-medium">Email</th>
              <th className="px-3 py-2 text-left font-medium">Note</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                  No demand signals yet.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id}>
                  <td className="px-3 py-2 text-gray-500 align-top whitespace-nowrap">
                    {new Date(s.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-gray-700 align-top">
                    {s.source_slug ?? s.source_cluster_id ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-700 align-top">
                    {[s.visitor_gender, s.visitor_country, s.visitor_year_of_birth]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-700 align-top">{s.email ?? "—"}</td>
                  <td className="px-3 py-2 text-gray-700 align-top max-w-md">
                    {s.free_text_note ?? "—"}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <select
                      value={s.status}
                      onChange={(e) => setStatus(s.id, e.target.value)}
                      disabled={busyId === s.id}
                      className="text-xs border border-gray-300 rounded px-1.5 py-0.5"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
