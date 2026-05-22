"use client";

import Link from "next/link";

interface DemandSignalRow {
  id: string;
  source_slug: string | null;
  email: string | null;
  visitor_country: string | null;
  visitor_gender: string | null;
  free_text_note: string | null;
  status: string;
  created_at: string;
}

interface Props {
  clusterId: string;
  signals: DemandSignalRow[];
}

export default function DemandSignalsPreview({ signals }: Props) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Recent demand signals</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Visitors who arrived at the public preview but didn&apos;t fit the AGGIL filter (e.g. wrong gender or country). Passive signal — no outreach in Phase 0.
          </p>
        </div>
        <Link
          href="/admin/demand"
          className="text-xs text-aggilo-deep hover:underline"
        >
          See all →
        </Link>
      </div>

      {signals.length === 0 ? (
        <p className="text-xs text-gray-500 italic py-2">
          No demand signals yet. They appear when a non-fit visitor passes through the AGGIL gate.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg text-xs">
          {signals.slice(0, 10).map((s) => (
            <li key={s.id} className="px-3 py-2 flex items-center gap-3">
              <span className="text-[10px] text-gray-400 font-mono w-32 truncate flex-shrink-0">
                {new Date(s.created_at).toLocaleDateString()}{" "}
                {new Date(s.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="flex-1 min-w-0 truncate">
                {[
                  s.visitor_gender,
                  s.visitor_country,
                  s.email,
                  s.free_text_note,
                ]
                  .filter(Boolean)
                  .join(" · ") || "(no details shared)"}
              </span>
              <span
                className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
                  s.status === "open"
                    ? "bg-amber-50 text-amber-700"
                    : s.status === "matched"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {s.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
