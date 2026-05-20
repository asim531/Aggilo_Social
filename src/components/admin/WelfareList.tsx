"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

interface WelfareRow {
  id: string;
  post_id: string | null;
  user_id: string | null;
  trigger_content: string;
  sage_response: string | null;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
  posts?: { content: string; created_at: string } | null;
  profiles?: { nickname: string; country: string | null } | null;
}

interface Props {
  open: WelfareRow[];
  resolved: WelfareRow[];
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

export default function WelfareList({ open: openInitial, resolved }: Props) {
  const [openRows, setOpenRows] = useState<WelfareRow[]>(openInitial);
  const [resolving, setResolving] = useState<Set<string>>(new Set());

  // Realtime: new welfare flags arrive without refresh
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("welfare-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "welfare_notifications" },
        async (payload: { new: WelfareRow }) => {
          // Hydrate the related post and profile
          const { data: hydrated } = await supabase
            .from("welfare_notifications")
            .select("*, posts(content, created_at), profiles!welfare_notifications_user_id_fkey(nickname, country)")
            .eq("id", payload.new.id)
            .single();
          if (hydrated && !hydrated.resolved) {
            setOpenRows((prev) => {
              if (prev.some((r) => r.id === hydrated.id)) return prev;
              return [hydrated as WelfareRow, ...prev];
            });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleResolve(id: string) {
    setResolving((prev) => new Set(prev).add(id));
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id, action: "resolve" }),
      });
      if (res.ok) {
        setOpenRows((prev) => prev.filter((r) => r.id !== id));
      }
    } finally {
      setResolving((prev) => {
        const next = new Set(prev);
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
            <p className="text-sm text-emerald-700 font-medium">All clear right now.</p>
            <p className="text-xs text-gray-500 mt-1">
              Sage hasn&apos;t flagged anything outstanding.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {openRows.map((row) => (
              <div
                key={row.id}
                className="bg-white rounded-xl border border-rose-200 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">
                      <span className="font-medium text-gray-700">
                        {row.profiles?.nickname ?? "Unknown member"}
                      </span>
                      {row.profiles?.country && (
                        <span> · {row.profiles.country}</span>
                      )}
                      <span> · {formatRelative(row.created_at)}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleResolve(row.id)}
                    disabled={resolving.has(row.id)}
                    className="px-3 py-1 text-xs font-medium rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shrink-0"
                  >
                    {resolving.has(row.id) ? "..." : "Mark resolved"}
                  </button>
                </div>

                <div className="text-sm text-gray-800 leading-relaxed bg-rose-50 border border-rose-100 rounded p-3 mb-2">
                  {row.posts?.content ?? row.trigger_content}
                </div>

                {row.sage_response && (
                  <div className="text-xs text-gray-600 italic border-l-2 border-emerald-200 pl-2">
                    Sage said: {row.sage_response}
                  </div>
                )}

                <p className="text-[11px] text-gray-400 mt-2">
                  Reach out to the member privately. Resolve only after you
                  have made contact.
                </p>
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
                <span> · resolved {formatRelative(row.resolved_at!)}</span>
                <span className="block text-gray-400 line-clamp-1 mt-0.5">
                  {row.posts?.content ?? row.trigger_content}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
