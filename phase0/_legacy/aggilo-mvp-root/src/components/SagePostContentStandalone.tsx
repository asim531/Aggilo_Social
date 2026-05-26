"use client";

/**
 * SagePostContentStandalone — renders Sage post content without the
 * PostCard chrome (avatar, timestamp, reply button, etc.).
 *
 * Used by PinnedAnchor so the anchor can be embedded in a custom
 * layout without inheriting PostCard's padding and width assumptions.
 */

import { useEffect, useMemo, useState } from "react";
import DuaReference from "./DuaReference";
import DuaProgressiveReveal, { parseDuaPost } from "./DuaProgressiveReveal";
import { createClient } from "@/lib/supabase-browser";

// Arabic Unicode blocks
const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

interface ParsedDuaRef {
  arabic: string;
  transliteration: string;
  translation: string;
  source: string;
  witnessLine?: string;
}

function parseDuaReferences(content: string): { segments: (string | ParsedDuaRef)[] } {
  const sourcePattern = /^Source:\s*.+/m;
  if (!sourcePattern.test(content)) return { segments: [content] };

  const lines = content.split("\n");
  const segments: (string | ParsedDuaRef)[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const arabicMatch = ARABIC_RE.test(line);
    const hasSource = lines.slice(i, i + 6).some((l) => /^Source:\s*.+/.test(l));

    if (arabicMatch && hasSource) {
      const arabic = line.trim();
      let transliteration = "", translation = "", source = "";
      let witnessLine: string | undefined;
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === "") j++;
      if (j < lines.length && !/^Source:/i.test(lines[j]) && !ARABIC_RE.test(lines[j])) { transliteration = lines[j].trim(); j++; }
      while (j < lines.length && lines[j].trim() === "") j++;
      if (j < lines.length && !/^Source:/i.test(lines[j]) && !ARABIC_RE.test(lines[j])) { translation = lines[j].trim(); j++; }
      while (j < lines.length && lines[j].trim() === "") j++;
      if (j < lines.length && /^Source:\s*.+/i.test(lines[j])) { source = lines[j].replace(/^Source:\s*/i, "").trim(); j++; }
      while (j < lines.length && lines[j].trim() === "") j++;
      if (j < lines.length && lines[j].trim() && !ARABIC_RE.test(lines[j]) && !lines[j].startsWith("Source:")) {
        const c = lines[j].trim();
        if (c.length < 80) { witnessLine = c; j++; }
      }
      segments.push({ arabic, transliteration, translation, source, witnessLine });
      i = j;
    } else {
      const textLines: string[] = [];
      while (i < lines.length) {
        if (ARABIC_RE.test(lines[i]) && lines.slice(i, i + 6).some((l) => /^Source:\s*.+/.test(l))) break;
        textLines.push(lines[i]);
        i++;
      }
      const text = textLines.join("\n").trim();
      if (text) segments.push(text);
    }
  }
  return { segments };
}

interface Props {
  content: string;
  postId: string;
}

export default function SagePostContentStandalone({ content, postId }: Props) {
  const parsedDua = useMemo(() => parseDuaPost(content), [content]);
  const [translation, setTranslation] = useState("");
  const [translationLoaded, setTranslationLoaded] = useState(false);

  useEffect(() => {
    if (!parsedDua?.vaultId) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("dua_vault")
        .select("translation")
        .eq("id", parsedDua.vaultId)
        .single();
      if (!cancelled) { setTranslation(data?.translation || ""); setTranslationLoaded(true); }
    })();
    return () => { cancelled = true; };
  }, [parsedDua?.vaultId]);

  useEffect(() => {
    if (!parsedDua) return;
    try { sessionStorage.setItem(`dua_animated_${postId}`, "1"); } catch { /* quota */ }
  }, [parsedDua, postId]);

  if (parsedDua) {
    const alreadyAnimated = typeof window !== "undefined"
      ? (() => { try { return sessionStorage.getItem(`dua_animated_${postId}`) === "1"; } catch { return false; } })()
      : false;
    if (!translationLoaded) return <div className="text-sm text-gray-500 italic py-2">Loading reference…</div>;
    return (
      <DuaProgressiveReveal
        contextLine={parsedDua.contextLine}
        arabic={parsedDua.arabic}
        transliteration={parsedDua.transliteration}
        translation={translation}
        source={parsedDua.source}
        witnessLine={parsedDua.witnessLine}
        animate={!alreadyAnimated}
      />
    );
  }

  const { segments } = parseDuaReferences(content);
  return (
    <div className="text-gray-700 text-sm leading-relaxed">
      {segments.map((seg, idx) => {
        if (typeof seg === "string") return <p key={idx} className="whitespace-pre-wrap">{seg}</p>;
        return (
          <DuaReference
            key={idx}
            arabic={seg.arabic}
            transliteration={seg.transliteration}
            translation={seg.translation}
            source={seg.source}
            witnessLine={seg.witnessLine}
            postId={`${postId}-${idx}`}
          />
        );
      })}
    </div>
  );
}
