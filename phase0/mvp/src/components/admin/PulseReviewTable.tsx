"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PulseRow {
  id: string;
  cluster_id: string;
  source_url: string;
  source_title: string;
  source_publisher: string | null;
  source_published_at: string | null;
  atlas_relevance_score: number | null;
  atlas_reasoning: string | null;
  sage_verdict: string;
  sage_rationale: string | null;
  sage_witness_line: string | null;
  status: string;
  is_public_safe: boolean;
  related_post_id: string | null;
  surfaced_at: string | null;
  created_at: string;
}

interface Props {
  clusterId: string;
  slug: string;
  pulses: PulseRow[];
}

const VERDICTS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected_off_topic", label: "Off topic" },
  { value: "rejected_dignity", label: "Dignity" },
  { value: "rejected_duplicate", label: "Duplicate" },
];

export default function PulseReviewTable({ clusterId, slug, pulses }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filtered =
    filter === "all" ? pulses : pulses.filter((p) => p.sage_verdict === filter);

  async function act(pulseId: string, action: string, extra?: Record<string, unknown>) {
    setBusyId(pulseId);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/clusters/${slug}/pulses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, pulse_id: pulseId, ...(extra ?? {}) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(body.error ?? `Action failed (${res.status})`);
        return;
      }
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Atlas Pulse review queue</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Every candidate Atlas considered. Approved Pulses are visible to members and on the public preview (when public-safe).
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-xs border border-gray-300 rounded px-2 py-1.5"
        >
          {VERDICTS.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-gray-500 italic py-2">
          {filter === "all"
            ? "No Pulses yet. Add a feed above and run a tick to populate this queue."
            : "No Pulses with this verdict."}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
          {filtered.map((p) => (
            <li key={p.id} className="px-3 py-3">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <a
                  href={p.source_url}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="text-sm font-medium text-gray-900 hover:text-aggilo-deep flex-1 min-w-0 truncate"
                >
                  {p.source_title}
                </a>
                <VerdictBadge verdict={p.sage_verdict} status={p.status} />
              </div>
              <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-2">
                {p.source_publisher && <span>{p.source_publisher}</span>}
                {p.atlas_relevance_score !== null && (
                  <span>Atlas {p.atlas_relevance_score.toFixed(2)}</span>
                )}
                <span>{new Date(p.created_at).toLocaleString()}</span>
                {!p.is_public_safe && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                    member-only
                  </span>
                )}
              </div>
              {p.sage_witness_line && (
                <p className="text-xs italic text-gray-700 mb-1.5">
                  &ldquo;{p.sage_witness_line}&rdquo;
                </p>
              )}
              {p.atlas_reasoning && (
                <p className="text-[11px] text-gray-500 mb-1">
                  <span className="font-medium">Atlas:</span> {p.atlas_reasoning}
                </p>
              )}
              {p.sage_rationale && (
                <p className="text-[11px] text-gray-500">
                  <span className="font-medium">Sage:</span> {p.sage_rationale}
                </p>
              )}

              {/* ── Action row ──────────────────────────────────── */}
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {p.status === "live" ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Retract this Pulse? Members and the public preview will lose it immediately.")) {
                        act(p.id, "retract");
                      }
                    }}
                    disabled={busyId === p.id}
                    className="px-2 py-1 rounded border border-rose-300 text-rose-700 text-[11px] hover:bg-rose-50 disabled:opacity-50"
                  >
                    Retract
                  </button>
                ) : (
                  <>
                    {p.sage_verdict !== "approved" && (
                      <button
                        type="button"
                        onClick={() => act(p.id, "override_approve")}
                        disabled={busyId === p.id}
                        className="px-2 py-1 rounded border border-emerald-300 text-emerald-700 text-[11px] hover:bg-emerald-50 disabled:opacity-50"
                      >
                        Override → Approve
                      </button>
                    )}
                    {p.sage_verdict === "approved" && p.status === "draft" && (
                      <button
                        type="button"
                        onClick={() => act(p.id, "go_live")}
                        disabled={busyId === p.id}
                        className="px-2 py-1 rounded bg-aggilo-deep text-white text-[11px] hover:bg-aggilo-mid disabled:opacity-50"
                      >
                        Go live
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        act(p.id, "toggle_public_safe", { is_public_safe: !p.is_public_safe })
                      }
                      disabled={busyId === p.id}
                      className="px-2 py-1 rounded border border-gray-300 text-gray-700 text-[11px] hover:bg-gray-50 disabled:opacity-50"
                    >
                      {p.is_public_safe ? "Mark member-only" : "Mark public-safe"}
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {errorMsg && <p className="text-xs text-rose-600">{errorMsg}</p>}
      <p className="text-[11px] text-gray-400 mt-1">
        Cluster: <code className="px-1 rounded bg-gray-100">{clusterId}</code>
      </p>
    </section>
  );
}

function VerdictBadge({ verdict, status }: { verdict: string; status: string }) {
  const tone =
    status === "live"
      ? "bg-emerald-100 text-emerald-700"
      : status === "retracted"
        ? "bg-rose-50 text-rose-700"
        : verdict === "approved"
          ? "bg-emerald-50 text-emerald-700"
          : verdict.startsWith("rejected")
            ? "bg-gray-100 text-gray-600"
            : "bg-amber-50 text-amber-700";
  const label =
    status === "live"
      ? "Live"
      : status === "retracted"
        ? "Retracted"
        : verdict.replace("rejected_", "").replace("_", " ");
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${tone}`}>
      {label}
    </span>
  );
}
