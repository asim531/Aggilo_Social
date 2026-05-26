"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

interface GapRow {
  id: string;
  member_text: string;
  sage_search_attempted: string | null;
  suggested_thematic_tags: string[];
  status: string;
  created_at: string;
  related_post_id: string | null;
}

function fmtRelative(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function VaultGapsList({ gaps: gapsInitial }: { gaps: GapRow[] }) {
  const [gaps, setGaps] = useState<GapRow[]>(gapsInitial);
  const [working, setWorking] = useState<Set<string>>(new Set());

  if (gaps.length === 0) return null;

  async function dismiss(id: string) {
    setWorking((p) => new Set(p).add(id));
    try {
      const supabase = createClient();
      await supabase
        .from("vault_gap_requests")
        .update({ status: "dismissed", resolved_at: new Date().toISOString() })
        .eq("id", id);
      setGaps((prev) => prev.filter((g) => g.id !== id));
    } finally {
      setWorking((p) => {
        const next = new Set(p);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <section className="bg-white rounded-xl border border-amber-200 p-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">
        Gaps Sage flagged ({gaps.length})
      </h2>
      <p className="text-xs text-gray-500 mb-3">
        Cases where a member asked for a reference Sage couldn&apos;t verify.
        Adding the right entry to the vault closes the loop.
      </p>
      <div className="space-y-2">
        {gaps.map((g) => (
          <div key={g.id} className="border border-amber-100 rounded-lg p-3 bg-amber-50/50">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-xs text-gray-500">{fmtRelative(g.created_at)}</p>
              <button
                onClick={() => dismiss(g.id)}
                disabled={working.has(g.id)}
                className="text-[11px] text-gray-500 hover:text-gray-800 underline disabled:opacity-50"
              >
                Dismiss
              </button>
            </div>
            <p className="text-sm text-gray-800 mb-1">{g.member_text}</p>
            {g.sage_search_attempted && (
              <p className="text-[11px] text-gray-500 italic">
                Sage looked for: {g.sage_search_attempted}
              </p>
            )}
            {g.suggested_thematic_tags.length > 0 && (
              <p className="text-[11px] text-amber-700 mt-1">
                Suggested tags: {g.suggested_thematic_tags.join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
