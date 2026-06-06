"use client";

/**
 * PaperDecomposition — renders the 6-pass analysis cards
 * for a research paper attachment.
 */

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

interface DecompositionItem {
  pass_type: string;
  result_json: {
    title: string;
    content: string;
    key_points: string[];
  };
}

interface PaperDecompositionProps {
  items: DecompositionItem[];
  userId?: string;
  attachmentId?: string;
}

const passOrder = ["problem", "structure", "argument", "terminology", "gaps", "results", "compression"];
const passLabels: Record<string, string> = {
  problem: "Problem Statement",
  structure: "Structure Map",
  argument: "Core Argument",
  terminology: "Terminology",
  gaps: "Evidence & Gaps",
  results: "Results & Reproducibility",
  compression: "Compression",
};

const GENERIC_TITLES = ["research_paper", "document", "analysis", "paper", "untitled"];

function isGenericTitle(title: string): boolean {
  const lower = title.toLowerCase().trim();
  return GENERIC_TITLES.some((g) => lower === g || lower.includes(g));
}

export default function PaperDecomposition({ items, userId, attachmentId }: PaperDecompositionProps) {
  const [openPass, setOpenPass] = useState<string | null>("structure");
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [annoText, setAnnoText] = useState<Record<string, string>>({});
  const [annoVis, setAnnoVis] = useState<Record<string, "public" | "private">>({});
  const [submittingAnno, setSubmittingAnno] = useState<Record<string, boolean>>({});
  const [passAnnotations, setPassAnnotations] = useState<Record<string, Array<{ id: string; body: string; visibility: string; author_id: string; created_at: string }>>>({});

  const supabase = createClient();

  async function submitAnnotation(passType: string) {
    if (!userId || !attachmentId) return;
    const body = annoText[passType]?.trim();
    if (!body) return;
    setSubmittingAnno((p) => ({ ...p, [passType]: true }));
    await supabase.from("paper_annotations").insert({
      attachment_id: attachmentId,
      author_id: userId,
      body,
      visibility: annoVis[passType] || "private",
      pass_type: passType,
    });
    setAnnoText((p) => ({ ...p, [passType]: "" }));
    setSubmittingAnno((p) => ({ ...p, [passType]: false }));
    // Refresh annotations after submit
    void fetchAnnotations(passType);
  }

  async function fetchAnnotations(passType: string) {
    if (!attachmentId) return;
    const { data } = await supabase
      .from("paper_annotations")
      .select("id, body, visibility, author_id, created_at")
      .eq("attachment_id", attachmentId)
      .eq("pass_type", passType)
      .order("created_at", { ascending: true });
    setPassAnnotations((p) => ({ ...p, [passType]: data ?? [] }));
  }

  const itemMap = new Map(items.map((i) => [i.pass_type, i]));
  const presentPasses = items.map((i) => i.pass_type);

  // Progressive reveal: stagger each present card by 200ms
  useEffect(() => {
    presentPasses.forEach((passType, i) => {
      const timer = setTimeout(() => {
        setRevealed((prev) => new Set(prev).add(passType));
      }, i * 200);
      return () => clearTimeout(timer);
    });
  }, [presentPasses.join(",")]);

  // Fetch annotations for the open pass
  useEffect(() => {
    if (openPass) {
      void fetchAnnotations(openPass);
    }
  }, [openPass]);

  return (
    <div className="space-y-2">
      {passOrder.map((passType) => {
        const item = itemMap.get(passType);
        const isOpen = openPass === passType;
        const isRevealed = revealed.has(passType) || !item;
        const passIndex = passOrder.indexOf(passType);
        const passNumber = passIndex >= 0 ? passIndex + 1 : "?";
        const passLabel = `${passNumber}. ${passLabels[passType] || passType}`;

        if (!item) {
          return (
            <div
              key={passType}
              className="border border-stone-200 rounded-lg bg-stone-50/40 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenPass(isOpen ? null : passType)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-stone-50/60 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">
                    {passLabel}
                  </span>
                  <span className="text-xs font-medium text-stone-400 truncate">
                    Coming soon
                  </span>
                  <span className="shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-600">
                    Analyzing…
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 text-stone-300 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <div className="px-3 pb-3">
                  <p className="text-xs text-stone-400 py-2">
                    Sage is still analyzing this section. It will appear shortly.
                  </p>
                </div>
              )}
            </div>
          );
        }

        const result = item.result_json;
        const displayTitle = result.title && !isGenericTitle(result.title)
          ? result.title
          : passLabel;
        return (
          <div
            key={passType}
            className={`border border-stone-200 rounded-lg bg-white overflow-hidden transition-all duration-500 ${
              isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenPass(isOpen ? null : passType)}
              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">
                  {passLabel}
                </span>
                <span className="text-sm font-medium text-husl-ink truncate">
                  {displayTitle}
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-husl-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isOpen && (
              <div className="px-3 pb-3">
                {/* Content as bullet points */}
                {result.content && (
                  <ul className="space-y-1 mb-3">
                    {result.content
                      .split(/[.!?]\s+/)
                      .map((s) => s.trim())
                      .filter((s) => s.length > 10)
                      .map((sent, i) => (
                        <li key={`c-${i}`} className="text-xs text-stone-700 leading-snug flex items-start gap-2">
                          <span className="text-husl-clio mt-0.5 shrink-0">•</span>
                          <span>{sent.length > 150 ? sent.slice(0, 150).trim() + "…" : sent}</span>
                        </li>
                      ))}
                  </ul>
                )}
                {result.key_points && result.key_points.length > 0 && (
                  <ul className="space-y-1 mb-3">
                    {result.key_points.map((kp, i) => (
                      <li key={i} className="text-xs text-husl-muted flex items-start gap-2">
                        <span className="text-husl-clio mt-0.5">•</span>
                        <span>{kp}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {/* Existing annotations for this pass */}
                {passAnnotations[passType] && passAnnotations[passType].length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {passAnnotations[passType].map((anno) => (
                      <div
                        key={anno.id}
                        className={`text-[11px] px-2 py-1.5 rounded border ${
                          anno.visibility === "private"
                            ? "border-amber-200 bg-amber-50/40"
                            : "border-stone-200 bg-stone-50"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[9px] font-medium uppercase tracking-wider px-1 py-0 rounded ${
                            anno.visibility === "private"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-stone-200 text-stone-600"
                          }`}>
                            {anno.visibility}
                          </span>
                          <span className="text-stone-400">
                            {new Date(anno.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-stone-700 leading-snug">{anno.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                {userId && attachmentId && (
                  <div className="border-t border-stone-100 pt-2 mt-1">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={annoText[passType] || ""}
                        onChange={(e) => setAnnoText((p) => ({ ...p, [passType]: e.target.value }))}
                        placeholder="Add a note on this section…"
                        className="flex-1 text-[11px] px-2 py-1 rounded border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-husl-clio"
                        onKeyDown={(e) => { if (e.key === "Enter") void submitAnnotation(passType); }}
                      />
                      <select
                        value={annoVis[passType] || "private"}
                        onChange={(e) => setAnnoVis((p) => ({ ...p, [passType]: e.target.value as "public" | "private" }))}
                        className="text-[10px] px-1.5 py-1 rounded border border-stone-200 bg-white"
                        title="Visibility"
                      >
                        <option value="private">Private</option>
                        <option value="public">Public</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => void submitAnnotation(passType)}
                        disabled={!annoText[passType]?.trim() || submittingAnno[passType]}
                        className="text-[10px] px-2 py-1 rounded bg-husl-clio text-white disabled:opacity-40"
                      >
                        {submittingAnno[passType] ? "…" : "Add"}
                      </button>
                    </div>
                    <p className="text-[9px] text-stone-400 mt-1">
                      Private notes are visible only to you. Public notes are visible to all cluster members.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
