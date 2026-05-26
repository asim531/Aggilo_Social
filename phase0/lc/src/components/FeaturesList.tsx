"use client";

/**
 * Workshop list — Long Conversation.
 *
 * Renders both tracks of the two-track capability model:
 *
 *   1. Agent Tools (kind: 'agent_tool')
 *      Things Sage/Clio run for the room. Members never click; they
 *      receive output. No upvote UI; show invocation count and build
 *      status. "Already running" or "We'll build this".
 *
 *   2. Member Features (kind: 'member_feature')
 *      UI surfaces members touch. Vote-gated; show upvote button +
 *      comment count. "Open for feedback" / "In development" /
 *      "Now live".
 *
 * Visual register on LC:
 *   tools use teal (lc-sage) — agents' work
 *   features use amber (lc-clio) — member-driven
 */

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
  kind?: "agent_tool" | "member_feature" | null;
  build_status?:
    | "deployable_now"
    | "needs_building"
    | "building"
    | "live"
    | "paused"
    | "retired"
    | null;
  invocation_count?: number | null;
  last_invoked_at?: string | null;
}

interface Props {
  features: FeatureRow[];
  /**
   * "active" — voting is open
   * "placeholder" — proposals exist but voting is closed (cluster too small)
   * "hidden" — proposals are hidden (Phase 0 feature gate)
   */
  tier: "hidden" | "placeholder" | "active";
  userId: string;
}

const FEATURE_STATUS_CHIP: Record<string, { label: string; tone: string }> = {
  proposed_in_thoughts: {
    label: "Being considered",
    tone: "bg-stone-100 text-stone-600",
  },
  in_features_tab: {
    label: "Open for feedback",
    tone: "bg-amber-50 text-lc-clio border border-amber-200",
  },
  members_engaged: {
    label: "Members weighing in",
    tone: "bg-amber-50 text-lc-clio border border-amber-200",
  },
  admin_approved: {
    label: "Approved",
    tone: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  in_development: {
    label: "In development",
    tone: "bg-sky-50 text-sky-700 border border-sky-200",
  },
  live: {
    label: "Now live",
    tone: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
};

const TOOL_STATUS_CHIP: Record<string, { label: string; tone: string }> = {
  deployable_now: {
    label: "Already running",
    tone: "bg-teal-50 text-lc-sage border border-teal-200",
  },
  needs_building: {
    label: "We'll build this",
    tone: "bg-teal-50 text-lc-sage border border-teal-200",
  },
  building: {
    label: "Being built",
    tone: "bg-sky-50 text-sky-700 border border-sky-200",
  },
  live: {
    label: "Live",
    tone: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  paused: { label: "Paused", tone: "bg-stone-100 text-stone-500" },
  retired: { label: "Retired", tone: "bg-stone-100 text-stone-400" },
};

export default function FeaturesList({ features, tier, userId }: Props) {
  const [rows, setRows] = useState<FeatureRow[]>(features);
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
  const [working, setWorking] = useState<Set<string>>(new Set());

  const tools = rows.filter((r) => r.kind === "agent_tool");
  const memberFeatures = rows.filter((r) => r.kind !== "agent_tool");

  async function handleUpvote(feature: FeatureRow) {
    if (tier !== "active") return;
    if (working.has(feature.id)) return;

    setWorking((p) => new Set(p).add(feature.id));
    const wasUpvoted = upvoted.has(feature.id);

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
      } else {
        await supabase.from("cluster_feature_upvotes").insert({
          feature_id: feature.id,
          user_id: userId,
        });
        track("feature_upvoted", { feature_id: feature.id });
      }
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
    <div className="space-y-8">
      {/* ── Agent Tools ───────────────────────────────────────── */}
      {tools.length > 0 && (
        <section>
          <header className="mb-3">
            <h3 className="text-sm font-semibold text-lc-ink flex items-center gap-2">
              <span className="text-lc-sage">🛠️</span>
              Tools we run for this room
            </h3>
            <p className="text-xs text-lc-muted mt-0.5">
              These run in the background. You receive the output, no clicks
              needed.
            </p>
          </header>
          <ul className="space-y-3">
            {tools.map((tool) => {
              const chip =
                TOOL_STATUS_CHIP[tool.build_status ?? "needs_building"] ??
                TOOL_STATUS_CHIP.needs_building;
              return (
                <li
                  key={tool.id}
                  className="bg-lc-card rounded-xl border border-teal-100 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-lc-ink mb-1">
                        {tool.display_name}
                      </h4>
                      <p className="text-sm text-lc-muted leading-relaxed">
                        {tool.display_description}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded shrink-0 ${chip.tone}`}
                    >
                      {chip.label}
                    </span>
                  </div>

                  {tool.rationale && (
                    <p className="text-xs text-lc-muted italic border-l-2 border-teal-200 pl-2 mb-2">
                      {tool.rationale}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-lc-muted">
                    <span>
                      {tool.invocation_count && tool.invocation_count > 0
                        ? `Run ${tool.invocation_count} ${tool.invocation_count === 1 ? "time" : "times"} in this room`
                        : tool.build_status === "deployable_now"
                          ? "Ready to run"
                          : "Pending build"}
                    </span>
                    <span>Run by Sage &amp; Clio</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ── Member Features ───────────────────────────────────── */}
      {memberFeatures.length > 0 && (
        <section>
          <header className="mb-3">
            <h3 className="text-sm font-semibold text-lc-ink flex items-center gap-2">
              <span className="text-lc-clio">✦</span>
              Features for the room — vote on what helps
            </h3>
            <p className="text-xs text-lc-muted mt-0.5">
              These need your feedback. Your upvote tells the agents and admin
              what to prioritise.
            </p>
          </header>
          <ul className="space-y-3">
            {memberFeatures.map((f) => {
              const chip =
                FEATURE_STATUS_CHIP[f.status] ??
                FEATURE_STATUS_CHIP.in_features_tab;
              const isUpvoted = upvoted.has(f.id);
              return (
                <li
                  key={f.id}
                  className="bg-lc-card rounded-xl border border-stone-200 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-lc-ink mb-1">
                        {f.display_name}
                      </h4>
                      <p className="text-sm text-lc-muted leading-relaxed">
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
                    <p className="text-xs text-lc-muted italic border-l-2 border-amber-200 pl-2 mb-3">
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
                          : "Voting opens at 5 members"
                      }
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
                        isUpvoted
                          ? "bg-amber-50 border-amber-300 text-lc-clio"
                          : "border-stone-200 text-lc-muted hover:border-amber-300 hover:text-lc-clio"
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
                      <span className="text-stone-400">
                        Proposed by Sage &amp; Clio
                      </span>
                    ) : f.proposed_by === "member" ? (
                      <span className="text-stone-400">
                        Proposed by a member
                      </span>
                    ) : (
                      <span className="text-stone-400">
                        Proposed by {f.proposed_by}
                      </span>
                    )}
                  </div>

                  {tier !== "active" && (
                    <p className="text-[11px] text-stone-400 mt-2">
                      Voting and comments open when the room has 5 members.
                      Your presence shapes what gets built.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {tools.length === 0 && memberFeatures.length === 0 && (
        <div className="bg-lc-card border border-dashed border-stone-300 rounded-lg p-8 text-center">
          <p className="text-sm text-lc-muted">
            Nothing yet. The Workshop strip above the timeline will fill up
            as Sage and Clio decide what this room could gain.
          </p>
        </div>
      )}
    </div>
  );
}
