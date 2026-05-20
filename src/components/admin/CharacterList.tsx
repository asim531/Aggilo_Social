"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

interface CharacterRow {
  id: string;
  post_id: string | null;
  user_id: string | null;
  signal_type: string;
  signal_excerpt: string;
  agent_response_text: string | null;
  admin_notified_at: string;
  admin_response: string | null;
  admin_responded_by: string | null;
  resolved_at: string | null;
  created_at: string;
  posts?: { content: string; created_at?: string } | null;
  profiles?: { nickname: string; country?: string | null } | null;
}

const SIGNAL_LABELS: Record<string, string> = {
  rejecting_monotheism: "Rejecting monotheism",
  mocking_faith: "Mocking faith",
  promoting_bad_character: "Promoting bad character",
  coercion_against_practice: "Coercion against practice",
  dismissing_dua: "Dismissing dua",
  other: "Other",
};

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

interface Props {
  open: CharacterRow[];
  resolved: CharacterRow[];
}

export default function CharacterList({ open: openInitial, resolved }: Props) {
  const [openRows, setOpenRows] = useState<CharacterRow[]>(openInitial);
  const [working, setWorking] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("character-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "character_concerns" },
        async (payload: { new: CharacterRow }) => {
          const { data } = await supabase
            .from("character_concerns")
            .select("*, posts(content), profiles!character_concerns_user_id_fkey(nickname, country)")
            .eq("id", payload.new.id)
            .single();
          if (data && !data.resolved_at) {
            setOpenRows((prev) => {
              if (prev.some((r) => r.id === data.id)) return prev;
              return [data as CharacterRow, ...prev];
            });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function resolveConcern(id: string, withNote: boolean) {
    setWorking((p) => new Set(p).add(id));
    try {
      const supabase = createClient();
      const note = withNote ? draft[id]?.trim() : null;
      await supabase
        .from("character_concerns")
        .update({
          resolved_at: new Date().toISOString(),
          admin_response: note ?? null,
        })
        .eq("id", id);
      setOpenRows((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setWorking((p) => {
        const next = new Set(p);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <>
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          Open ({openRows.length})
        </h2>
        {openRows.length === 0 ? (
          <div className="bg-white rounded-xl border border-emerald-100 p-6 text-center">
            <p className="text-sm text-emerald-700 font-medium">All clear.</p>
            <p className="text-xs text-gray-500 mt-1">
              No character concerns open right now.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {openRows.map((row) => (
              <div
                key={row.id}
                className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">
                      <span className="font-medium text-gray-700">
                        {row.profiles?.nickname ?? "Unknown member"}
                      </span>
                      {row.profiles?.country && <span> · {row.profiles.country}</span>}
                      <span> · {formatRelative(row.created_at)}</span>
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-amber-700 font-semibold">
                      {SIGNAL_LABELS[row.signal_type] ?? row.signal_type}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-gray-800 leading-relaxed bg-amber-50 border border-amber-100 rounded p-3 mb-2">
                  {row.posts?.content ?? row.signal_excerpt}
                </div>

                {row.agent_response_text && (
                  <div className="text-xs text-gray-600 italic border-l-2 border-emerald-200 pl-2 mb-3">
                    Sage said: {row.agent_response_text}
                  </div>
                )}

                <div className="space-y-2">
                  <textarea
                    value={draft[row.id] ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, [row.id]: e.target.value }))
                    }
                    placeholder="Optional admin note (visible to other admins only)..."
                    rows={2}
                    className="w-full text-xs px-2 py-1.5 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-aggilo-deep/30"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => resolveConcern(row.id, true)}
                      disabled={working.has(row.id)}
                      className="px-3 py-1 text-xs font-medium rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Mark resolved
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {resolved.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-2 mt-8">
            Recently resolved ({resolved.length})
          </h2>
          <div className="space-y-2">
            {resolved.map((row) => (
              <div
                key={row.id}
                className="bg-white rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500"
              >
                <span className="font-medium text-gray-700">
                  {row.profiles?.nickname ?? "Unknown"}
                </span>
                <span> · {SIGNAL_LABELS[row.signal_type] ?? row.signal_type}</span>
                <span> · resolved {formatRelative(row.resolved_at!)}</span>
                {row.admin_response && (
                  <span className="block text-gray-400 italic mt-0.5 line-clamp-1">
                    Note: {row.admin_response}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
