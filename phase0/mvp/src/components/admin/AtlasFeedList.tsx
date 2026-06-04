"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { looksLikeUrl, type AtlasRssFeed } from "@/lib/admin-cluster";

interface Props {
  clusterId: string;
  slug: string;
  feeds: AtlasRssFeed[];
}

export default function AtlasFeedList({ clusterId, slug, feeds }: Props) {
  const router = useRouter();
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function call(action: string, payload: Record<string, unknown>) {
    setBusy(action);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/clusters/${slug}/feeds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
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
      setBusy(null);
    }
  }

  async function handleAdd() {
    if (!looksLikeUrl(newUrl)) {
      setErrorMsg("Feed URL must start with http(s)://");
      return;
    }
    if (!newLabel.trim()) {
      setErrorMsg("Feed needs a label.");
      return;
    }
    await call("add", { url: newUrl.trim(), label: newLabel.trim() });
    setNewUrl("");
    setNewLabel("");
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Atlas RSS feeds</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Atlas reads only what you put here. Per platform rules, RSS only — no scraping.
          Atlas stays silent until at least one active feed exists.
        </p>
      </div>

      {/* ── Existing feeds ────────────────────────────────────────── */}
      {feeds.length === 0 ? (
        <p className="text-xs text-gray-500 italic py-2">
          No feeds curated yet. Add one below to wake Atlas up for this cluster.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
          {feeds.map((feed) => (
            <li key={feed.id} className="flex items-center gap-3 px-3 py-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  call("toggle", { id: feed.id, active: !feed.active })
                }
                disabled={busy !== null}
                className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                  feed.active ? "bg-emerald-600" : "bg-gray-300"
                }`}
                aria-label={feed.active ? "Disable feed" : "Enable feed"}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform ${
                    feed.active ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{feed.label}</p>
                <a
                  href={feed.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-gray-500 hover:text-gray-800 truncate block"
                >
                  {feed.url}
                </a>
                {feed.last_fetched_at && (
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Last fetched {new Date(feed.last_fetched_at).toLocaleString()}
                    {feed.last_fetch_status ? ` · ${feed.last_fetch_status}` : ""}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Remove feed "${feed.label}"?`)) {
                    call("remove", { id: feed.id });
                  }
                }}
                disabled={busy !== null}
                className="text-rose-600 hover:text-rose-700 px-2"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ── Add feed ─────────────────────────────────────────────── */}
      <div className="border-t border-gray-100 pt-4 space-y-2">
        <p className="text-xs font-medium text-gray-700">Add a feed</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Label (e.g. Al Jazeera Women)"
            className="w-48 px-2 py-1.5 rounded border border-gray-300 text-xs"
          />
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://example.com/feed.xml"
            className="flex-1 px-2 py-1.5 rounded border border-gray-300 text-xs font-mono"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={busy !== null || !newUrl || !newLabel}
            className="px-3 py-1.5 rounded bg-aggilo-deep text-white text-xs font-medium hover:bg-aggilo-mid disabled:opacity-50"
          >
            {busy === "add" ? "Adding…" : "Add"}
          </button>
        </div>
      </div>

      {/* ── Manual Atlas tick ────────────────────────────────────── */}
      <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-700">Manual Atlas tick</p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Run Atlas + Sage once for this cluster now. Useful for testing without waiting for cron.
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            setBusy("tick");
            setErrorMsg(null);
            try {
              const res = await fetch(`/api/admin/atlas/tick`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cluster_id: clusterId }),
              });
              const body = await res.json().catch(() => ({}));
              if (!res.ok) {
                setErrorMsg(body.error ?? `Tick failed (${res.status})`);
              } else {
                router.refresh();
              }
            } catch (err) {
              setErrorMsg(err instanceof Error ? err.message : "Network error");
            } finally {
              setBusy(null);
            }
          }}
          disabled={busy !== null || feeds.filter((f) => f.active).length === 0}
          className="px-3 py-1.5 rounded border border-aggilo-deep text-aggilo-deep text-xs font-medium hover:bg-aggilo-deep hover:text-white transition-colors disabled:opacity-40"
        >
          {busy === "tick" ? "Running…" : "Tick now"}
        </button>
      </div>

      {errorMsg && <p className="text-xs text-rose-600">{errorMsg}</p>}
    </section>
  );
}
