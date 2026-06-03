"use client";

import { useEffect, useState } from "react";
import { createAuthClient } from "@/lib/supabase-auth";
import { withBasePath } from "@/lib/path";

interface StillJoiningProps {
  userId: string;
  email?: string | null;
  metadata?: Record<string, unknown>;
}

export function StillJoining({ userId, email, metadata }: StillJoiningProps) {
  const [status, setStatus] = useState<"trying" | "failed" | "retrying">("trying");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function tryCreate() {
      console.log("[StillJoining] trying profile-upsert for:", userId);

      const res = await fetch(withBasePath("/api/auth/profile-upsert"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          email,
          metadata,
        }),
      }).catch((err) => {
        console.error("[StillJoining] fetch failed:", err);
        return null;
      });

      if (!res) {
        setStatus("failed");
        setError("Network error. Try refreshing.");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("[StillJoining] profile-upsert returned", res.status, body);
        setStatus("failed");
        setError(body.error || `Server error ${res.status}`);
        return;
      }

      console.log("[StillJoining] profile-upsert success, refreshing page");
      setStatus("retrying");
      window.location.reload();
    }

    tryCreate();
  }, [userId, email, metadata]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-husl-surface px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold text-husl-ink mb-2">
          {status === "failed" ? "Join failed" : "Still joining…"}
        </h1>
        {status === "failed" ? (
          <>
            <p className="text-sm text-rose-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-husl-clio text-white rounded-md text-sm hover:bg-amber-700 transition-colors"
            >
              Refresh
            </button>
          </>
        ) : (
          <div className="flex items-center justify-center gap-2 text-sm text-husl-muted">
            <svg className="w-4 h-4 animate-spin text-husl-clio" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {status === "retrying"
              ? "Success! Refreshing..."
              : "Your account is connecting to the room."}
          </div>
        )}
      </div>
    </main>
  );
}
