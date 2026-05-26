"use client";

/**
 * WelfareItemActions — admin row controls.
 *
 * Single button that posts to /api/admin/welfare/[id]/resolve and
 * refreshes the page. Kept minimal — Phase 0 admin only needs to
 * mark items resolved. Rich actions (assign, comment, escalate)
 * land later.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/path";
import { track } from "@/lib/track";

export default function WelfareItemActions({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResolve() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        withBasePath(`/api/admin/welfare/${itemId}/resolve`),
        { method: "POST" }
      );
      if (!res.ok) {
        setError("Couldn't mark resolved.");
        setBusy(false);
        return;
      }
      track("welfare_resolved");
      router.refresh();
    } catch {
      setError("Network error.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleResolve}
        disabled={busy}
        className="px-3 py-1 text-xs rounded bg-lc-clio text-white font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {busy ? "Resolving…" : "Mark resolved"}
      </button>
      {error && <span className="text-[11px] text-rose-600">{error}</span>}
    </div>
  );
}
