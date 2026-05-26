"use client";

/**
 * DuaReference — for inline Arabic references in any Sage post that
 * doesn't use the [DUA_VAULT_ID:...] marker format.
 *
 * V3.1: Progressive reveal applied here too. The earlier static behavior
 * (Arabic + transliteration + click-to-show-translation) created
 * inconsistency — Sage replies showed Arabic in serif but stripped of
 * progressive disclosure. Now any Sage reference reveals stage-by-stage
 * on first appearance, matching the dua_vault_id path.
 */

import { useEffect, useState } from "react";
import DuaProgressiveReveal from "./DuaProgressiveReveal";

interface DuaReferenceProps {
  arabic: string;
  transliteration: string;
  translation: string;
  source: string;
  witnessLine?: string;
  /** Stable id used to skip animation on rerender after first reveal */
  postId?: string;
}

export default function DuaReference({
  arabic,
  transliteration,
  translation,
  source,
  witnessLine,
  postId,
}: DuaReferenceProps) {
  // Animate only on first appearance per (post + arabic-hash). The
  // sessionStorage write happens in useEffect — never during render —
  // so React strict-mode double renders don't toggle the flag, and a
  // throw from a quota-full storage can't crash the component tree.
  const [animate, setAnimate] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined" || !postId) return;
    const animKey = `dua_inline_animated_${postId}_${arabic.length}`;
    try {
      if (sessionStorage.getItem(animKey) === "1") {
        setAnimate(false);
      } else {
        sessionStorage.setItem(animKey, "1");
      }
    } catch {
      // sessionStorage unavailable (private mode, quota) — fine, just animate
    }
  }, [postId, arabic.length]);

  return (
    <DuaProgressiveReveal
      contextLine=""
      arabic={arabic}
      transliteration={transliteration}
      translation={translation || ""}
      source={source}
      witnessLine={witnessLine}
      animate={animate}
    />
  );
}
