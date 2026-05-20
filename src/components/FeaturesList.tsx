"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { track } from "@/lib/track";

interface FeatureRow {
  id: string;
  display_name: string;
  display_description: string;
  category: string | null;
  status: string;
  proposed_by: string;
  rationale: string | null;
  upvote_count: number;
  comment_count: number;
  scheduled_eta: string | null;
  created_at: string;
}

interface Props {
  features: FeatureRow[];
  tier: "hidden" | "placeholder" | "active";
  userId: string;
}

const STATUS_CHIP: Record<string, { label: string; tone: string }> = {
  proposed_in_thoughts: { label: "Being considered", tone: "bg-gray-100 text-gray-600" },
  in_features_tab: { label: "Open for feedback", tone: "bg-amber-50 text-amber-700" },
  members_engaged: { label: "Members weighing in", tone: "bg-amber-50 text-amber-700" },
  admin_approved: { label: "Approved", tone: "bg-emerald-50 text-emerald-700" },
  in_development: { label: "In development", tone: "bg-sky-50 text-sky-700" },
  live: { label: "Now live", tone: "bg-emerald-100 text-emerald-800" },
};

export default function FeaturesList({ features, tier, userId }: Props) {
  const [rows, setRows] = useState<FeatureRow[]>(features);
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
  const [working, setWorking] = useState<Set<string>>(new Set());

  // We don't pre-fetch which features the user has upvoted — keeps the
  // page server-component friendly. The toggle is optimistic; if the
  // server says it was already upvoted, we just trust the toggle.
  async function handleUpvote(feature: FeatureRow) {
    if (tier !== "active") return; // votes only count when polling is open
    if (working.has(feature.id)) return;

    setWorking((p) => new Set(p).add(feature.id));
    const wasUpvoted = upvoted.has(feature.id);

    // Optimistic UI
    setUpvoted((p) => {
      const next = new Set(p);
      if (wasUpvoted) next.delete(feature.id);
      else next.add(feature.id);
      return next;
    });
    setRows((prev) =>
      prev.map((r) =>
        r.id === feature.id
          ? { ...r, upvote_count: r.upvote_count + (wasUpvoted ? -1 : 1) }
          : r
      )
    );

    try {
      const supabase = createClient();
      if (wasUpvoted) {
        await supabase
          .from("cluster_feature_upvotes")
          .delete()
          .eq("feature_id", feature.id)
          .eq("user_id", userId);
        await supabase.rpc("decrement_feature_upvote", { feature_id: feature.id }).then(
          () => null,
          () => null
        );
      } else {
        await supabase.from("cluster_feature_upvotes").insert({
          feature_id: feature.id,
          user_id: userId,
        });
        track("feature_upvoted", { feature_id: feature.id });
      }
      // Sync the count from server (denormalized counter is best-effort)
      const { data: refreshed } = await supabase
        .from("cluster_features")
        .select("upvote_count")
        .eq("id", feature.id)
        .single();
      if (refreshed) {
        setRows((prev) =>
          prev.map((r) =>
            r.id === feature.id
              ? { ...r, upvote_count: refreshed.upvote_count ?? r.upvote_count }
              : r
          )
        );
      }
    } finally {
      setWorking((p) => {
        const next = new Set(p);
        next.delete(feature.id);
        return next;
      });
    }
  }

  return (
    <ul className="space-y-3">
      {rows.map((f) => {
        const chip = STATUS_CHIP[f.status] ?? STATUS_CHIP.in_features_tab;
        const isUpvoted = upvoted.has(f.id);
        return (
          <li
            key={f.id}
            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {f.display_name}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {f.display_description}
                </p>
              </div>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded shrink-0 ${chip.tone}`}
              >
                {chip.label}
              </span>
            </div>

            {f.rationale && (
              <p className="text-xs text-gray-500 italic border-l-2 border-gray-200 pl-2 mb-3">
                {f.rationale}
              </p>
            )}

            <div className="flex items-center justify-between text-xs">
              <button
                onClick={() => handleUpvote(f)}
                disabled={working.has(f.id) || tier !== "active"}
                title={
                  tier === "active"
                    ? isUpvoted
                      ? "Remove your upvote"
                      : "Upvote this feature"
                    : "Voting opens at 15 members"
                }
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
                  isUpvoted
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                    : "border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700"
                } ${tier !== "active" ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill={isUpvoted ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
                <span className="font-medium">{f.upvote_count}</span>
              </button>

              {f.proposed_by === "agents_joint" ? (
                <span className="text-gray-400">Proposed by Sage &amp; Clio</span>
              ) : f.proposed_by === "member" ? (
                <span className="text-gray-400">Proposed by a sister</span>
              ) : (
                <span className="text-gray-400">Proposed by {f.proposed_by}</span>
              )}
            </div>

            {tier !== "active" && (
              <p className="text-[11px] text-gray-400 mt-2">
                Voting and comments open when the room has 15 sisters. Your
                presence shapes what gets built.
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
