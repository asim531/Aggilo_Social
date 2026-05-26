"use client";

/**
 * Progressive reveal of a dua post
 *
 * Spec (per earlier prompt instructions):
 *   - Arabic appears first (reverently — gives the moment its weight)
 *   - Transliteration fades in next
 *   - Translation reveals last
 *   - Source citation appears at the end
 *
 * Each stage stays visible after revealing. The cadence is intentional:
 * fast enough to feel responsive, slow enough that the eye lands on each
 * line before the next arrives.
 */

import { useEffect, useState } from "react";

interface DuaProgressiveRevealProps {
  contextLine: string;
  arabic: string;
  transliteration: string;
  translation: string;
  source: string;
  witnessLine?: string;
  /** When false, all stages render immediately (e.g. on rerender from realtime) */
  animate?: boolean;
}

const STAGE_DELAYS_MS = {
  context: 0,
  arabic: 600,
  transliteration: 1800,
  translation: 3200,
  source: 4400,
  witness: 5200,
};

export default function DuaProgressiveReveal({
  contextLine,
  arabic,
  transliteration,
  translation,
  source,
  witnessLine,
  animate = true,
}: DuaProgressiveRevealProps) {
  const [stage, setStage] = useState<number>(animate ? 0 : 6);

  useEffect(() => {
    if (!animate) {
      setStage(6);
      return;
    }
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    timeouts.push(setTimeout(() => setStage(1), STAGE_DELAYS_MS.arabic));
    timeouts.push(setTimeout(() => setStage(2), STAGE_DELAYS_MS.transliteration));
    timeouts.push(setTimeout(() => setStage(3), STAGE_DELAYS_MS.translation));
    timeouts.push(setTimeout(() => setStage(4), STAGE_DELAYS_MS.source));
    if (witnessLine) {
      timeouts.push(setTimeout(() => setStage(5), STAGE_DELAYS_MS.witness));
    } else {
      timeouts.push(setTimeout(() => setStage(5), STAGE_DELAYS_MS.source + 200));
    }
    timeouts.push(setTimeout(() => setStage(6), STAGE_DELAYS_MS.witness + 600));
    return () => timeouts.forEach(clearTimeout);
  }, [animate, witnessLine]);

  return (
    <div className="text-sm leading-relaxed">
      {/* Context line — Sage's framing */}
      {contextLine && (
        <p className="text-gray-700 italic mb-3 transition-opacity duration-500">
          {contextLine}
        </p>
      )}

      {/* The dua block — emerald-tinted card */}
      <div className="dua-reference my-3 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/50">
        {/* Stage 1: Arabic */}
        {stage >= 1 && (
          <div
            className="arabic-text text-right leading-[2.4] mb-3 animate-in fade-in slide-in-from-top-1 duration-500"
            dir="rtl"
          >
            {arabic}
          </div>
        )}

        {/* Stage 2: Transliteration */}
        {stage >= 2 && (
          <div className="text-sm text-gray-600 italic leading-relaxed mb-3 animate-in fade-in duration-500">
            {transliteration}
          </div>
        )}

        {/* Stage 3: Translation */}
        {stage >= 3 && (
          <div className="text-sm text-gray-700 leading-relaxed mb-3 animate-in fade-in duration-500">
            {translation}
          </div>
        )}

        {/* Stage 4: Source citation */}
        {stage >= 4 && (
          <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-emerald-200/50 animate-in fade-in duration-500">
            {source}
          </div>
        )}

        {/* Stage 5: Witness line — Sage's quiet seal on the moment */}
        {stage >= 5 && witnessLine && (
          <div className="text-xs text-gray-400 italic mt-1 animate-in fade-in duration-500">
            {witnessLine}
          </div>
        )}
      </div>

      {/* Progress indicator while animating */}
      {animate && stage < 6 && (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-600/70 mt-2">
          <span className="flex gap-0.5">
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  stage >= i ? "bg-emerald-500" : "bg-emerald-200"
                }`}
              />
            ))}
          </span>
          <span className="italic">Revealing…</span>
        </div>
      )}
    </div>
  );
}

// ── Parser for Sage's dua post format ────────────────────────────────────
//
// A Sage dua post has this structure:
//   <context line>
//   (blank)
//   [DUA_VAULT_ID:<uuid>]
//   <arabic>
//   <transliteration>
//   Source: <citation>
//   (blank)
//   <witness line>          ← optional
//
export interface ParsedDuaPost {
  contextLine: string;
  vaultId: string;
  arabic: string;
  transliteration: string;
  source: string;
  witnessLine?: string;
  translation: string; // populated separately by caller from dua_vault
}

const DUA_MARKER_RE = /^\[DUA_VAULT_ID:([0-9a-f-]+)\]$/i;

export function parseDuaPost(content: string): ParsedDuaPost | null {
  const lines = content.split("\n");
  let markerIdx = -1;
  let vaultId = "";

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].trim().match(DUA_MARKER_RE);
    if (m) {
      markerIdx = i;
      vaultId = m[1];
      break;
    }
  }
  if (markerIdx === -1) return null;

  const contextLine = lines.slice(0, markerIdx).join("\n").trim();
  const after = lines.slice(markerIdx + 1).map((l) => l.trim()).filter(Boolean);

  // Find source line
  const sourceIdx = after.findIndex((l) => /^Source:/i.test(l));
  if (sourceIdx === -1) return null;

  const arabic = after[0] || "";
  const transliteration = after.slice(1, sourceIdx).join(" ").trim();
  const source = after[sourceIdx].replace(/^Source:\s*/i, "").trim();
  const witnessLine = after.slice(sourceIdx + 1).join(" ").trim() || undefined;

  return {
    contextLine,
    vaultId,
    arabic,
    transliteration,
    source,
    witnessLine,
    translation: "", // caller fills this from dua_vault lookup
  };
}
