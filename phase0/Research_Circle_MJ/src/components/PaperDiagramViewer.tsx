"use client";

/**
 * PaperDiagramViewer — renders SVG diagrams with tab switching,
 * pan/zoom, progressive element reveal, and interactive node popups.
 */

import { useState, useEffect, useRef } from "react";
import PanZoomContainer from "./PanZoomContainer";

interface DiagramItem {
  type: string;
  title: string;
  svg_data: string;
  caption?: string | null;
}

interface PaperDiagramViewerProps {
  diagrams: DiagramItem[];
  isAnalyzing?: boolean;
  extractedText?: string;
}

const ALL_TYPES = ["concept_map", "process_flow", "architecture", "argument_tree"] as const;

const typeLabels: Record<string, string> = {
  concept_map: "Concept Map",
  process_flow: "Process Flow",
  architecture: "Architecture",
  argument_tree: "Argument Tree",
};

const PROGRESSIVE_CSS = `
<style>
  .diagram-reveal rect, .diagram-reveal circle, .diagram-reveal ellipse, .diagram-reveal path, .diagram-reveal line, .diagram-reveal polyline, .diagram-reveal polygon {
    opacity: 0;
    animation: diagramFadeIn 0.5s ease forwards;
  }
  .diagram-reveal text, .diagram-reveal foreignObject {
    opacity: 0;
    animation: diagramFadeIn 0.4s ease forwards;
  }
  .diagram-reveal rect:nth-of-type(1), .diagram-reveal circle:nth-of-type(1) { animation-delay: 0.05s; }
  .diagram-reveal rect:nth-of-type(2), .diagram-reveal circle:nth-of-type(2) { animation-delay: 0.10s; }
  .diagram-reveal rect:nth-of-type(3), .diagram-reveal circle:nth-of-type(3) { animation-delay: 0.15s; }
  .diagram-reveal rect:nth-of-type(4), .diagram-reveal circle:nth-of-type(4) { animation-delay: 0.20s; }
  .diagram-reveal rect:nth-of-type(5), .diagram-reveal circle:nth-of-type(5) { animation-delay: 0.25s; }
  .diagram-reveal rect:nth-of-type(6), .diagram-reveal circle:nth-of-type(6) { animation-delay: 0.30s; }
  .diagram-reveal rect:nth-of-type(7), .diagram-reveal circle:nth-of-type(7) { animation-delay: 0.35s; }
  .diagram-reveal rect:nth-of-type(8), .diagram-reveal circle:nth-of-type(8) { animation-delay: 0.40s; }
  .diagram-reveal rect:nth-of-type(9), .diagram-reveal circle:nth-of-type(9) { animation-delay: 0.45s; }
  .diagram-reveal rect:nth-of-type(10), .diagram-reveal circle:nth-of-type(10) { animation-delay: 0.50s; }
  .diagram-reveal rect:nth-of-type(n+11), .diagram-reveal circle:nth-of-type(n+11) { animation-delay: 0.55s; }
  .diagram-reveal text { animation-delay: 0.35s; }
  .diagram-reveal foreignObject { animation-delay: 0.35s; }
  .diagram-reveal path { animation-delay: 0.50s; }
  @keyframes diagramFadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>
`;

/** Extract node label text from an SVG element or its sibling text. */
function getNodeLabel(el: Element): string {
  if (el.tagName === "text") return el.textContent?.trim() ?? "";
  const parent = el.closest("g");
  if (parent) {
    const textEl = parent.querySelector("text");
    if (textEl?.textContent) return textEl.textContent.trim();
  }
  const childText = el.querySelector("text");
  if (childText?.textContent) return childText.textContent.trim();
  const fo = el.querySelector("foreignObject");
  if (fo?.textContent) return fo.textContent.trim();
  return el.textContent?.trim() ?? "";
}

/** Search extracted paper text for sentences matching node keywords. */
function findRelevantSentences(label: string, text: string, maxResults = 3): string[] {
  if (!label || !text) return [];
  const keywords = label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  if (keywords.length === 0) return [];

  const sentences = text
    .replace(/([.!?])\s+/g, "$1\n")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const scored = sentences.map((sent) => {
    const lower = sent.toLowerCase();
    let matches = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) matches++;
    }
    return { sent, score: matches };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored
    .filter((s) => s.score > 0)
    .slice(0, maxResults)
    .map((s) => (s.sent.length > 120 ? s.sent.slice(0, 120).trim() + "…" : s.sent));
}

export default function PaperDiagramViewer({ diagrams, isAnalyzing, extractedText = "" }: PaperDiagramViewerProps) {
  const [activeType, setActiveType] = useState<string>(diagrams[0]?.type ?? ALL_TYPES[0]);
  const [visible, setVisible] = useState(false);
  const svgWrapRef = useRef<HTMLDivElement>(null);

  const [popup, setPopup] = useState<{
    open: boolean;
    loading: boolean;
    title: string;
    bullets: string[];
    x: number;
    y: number;
  }>({ open: false, loading: false, title: "", bullets: [], x: 0, y: 0 });

  const [showHint, setShowHint] = useState(true);
  const popupRef = useRef<HTMLDivElement>(null);
  const activeDiagram = diagrams.find((d) => d.type === activeType);

  // Auto-dismiss hint
  useEffect(() => {
    if (!showHint) return;
    const t = setTimeout(() => setShowHint(false), 12000);
    return () => clearTimeout(t);
  }, [showHint]);

  // Animate in on tab switch or new diagram
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, [activeType]);

  // Inject progressive reveal CSS into SVG
  useEffect(() => {
    if (!svgWrapRef.current || !visible) return;
    const svg = svgWrapRef.current.querySelector("svg");
    if (!svg) return;

    if (!svg.classList.contains("diagram-reveal")) {
      svg.classList.add("diagram-reveal");
      if (!svg.querySelector("style[data-diagram-reveal]")) {
        const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
        style.setAttribute("data-diagram-reveal", "true");
        style.textContent = PROGRESSIVE_CSS.replace(/<style>|<\/style>/g, "").trim();
        svg.prepend(style);
      }
    }

    // Add cursor:pointer via CSS so nodes feel clickable
    if (!svg.querySelector("style[data-diagram-cursor]")) {
      const cursorStyle = document.createElementNS("http://www.w3.org/2000/svg", "style");
      cursorStyle.setAttribute("data-diagram-cursor", "true");
      cursorStyle.textContent = "rect,circle,ellipse,polygon,text,foreignObject{cursor:pointer}";
      svg.appendChild(cursorStyle);
    }
  }, [visible, activeDiagram?.svg_data]);

  // Click outside to dismiss popup (use 'click' not 'mousedown' to avoid race)
  useEffect(() => {
    if (!popup.open) return;
    const onClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopup((p) => ({ ...p, open: false }));
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [popup.open]);

  // Close popup on tab switch
  useEffect(() => {
    setPopup((p) => ({ ...p, open: false }));
  }, [activeType]);

  // Single delegated click handler — survives SVG re-renders
  const handleSvgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as Element).closest("rect, circle, ellipse, polygon, text, foreignObject");
    if (!target) return;
    e.stopPropagation(); // keep document outside-click listener from firing

    const label = getNodeLabel(target);
    if (!label) return;

    const rect = target.getBoundingClientRect();
    const containerRect = svgWrapRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
    setPopup({
      open: true,
      loading: true,
      title: label,
      bullets: [],
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top,
    });

    setTimeout(() => {
      const bullets = findRelevantSentences(label, extractedText);
      setPopup((prev) => ({
        ...prev,
        loading: false,
        bullets: bullets.length > 0 ? bullets : ["No matching sentences found in the paper for this node."],
      }));
    }, 200);
  };

  const hasDiagrams = diagrams.length > 0;
  const remainingCount = ALL_TYPES.length - diagrams.length;

  return (
    <div className="relative">
      {/* Tab bar — always show all 4 types with fixed widths */}
      <div className="flex items-center gap-1.5 mb-2 overflow-x-auto scrollbar-hide">
        {ALL_TYPES.map((t) => {
          const loaded = diagrams.some((d) => d.type === t);
          const isActive = activeType === t;
          return (
            <button
              key={t}
              type="button"
              disabled={!loaded}
              onClick={() => loaded && setActiveType(t)}
              className={`shrink-0 text-[10px] font-medium px-2 py-1 rounded transition-colors flex items-center justify-center gap-1 min-w-[96px] ${
                isActive
                  ? "bg-husl-clio/10 text-husl-clio"
                  : loaded
                    ? "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    : "bg-stone-50 text-stone-400 cursor-not-allowed"
              }`}
            >
              {typeLabels[t]}
              {!loaded && isAnalyzing && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="Generating…" />
              )}
              {!loaded && !isAnalyzing && (
                <span className="text-[8px] text-stone-300">soon</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Diagram area */}
      {hasDiagrams && activeDiagram ? (
        <PanZoomContainer className="border border-stone-200 rounded-lg bg-white h-80 relative">
          <div
            ref={svgWrapRef}
            onClick={handleSvgClick}
            className={`w-full h-full transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}
            dangerouslySetInnerHTML={{ __html: activeDiagram.svg_data }}
          />
          {/* Node detail popup */}
          {popup.open && (
            <div
              ref={popupRef}
              className="absolute z-20 bg-white rounded-lg shadow-lg border border-stone-200 p-3 w-72 max-w-sm break-words"
              style={{
                left: Math.min(popup.x, 260),
                top: Math.max(popup.y - 10, 0),
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-xs font-semibold text-husl-ink leading-tight truncate">{popup.title}</p>
                <button
                  type="button"
                  onClick={() => setPopup((p) => ({ ...p, open: false }))}
                  className="text-stone-400 hover:text-stone-600 shrink-0"
                  aria-label="Close"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {popup.loading ? (
                <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                  <svg className="w-3 h-3 text-amber-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Searching paper text…
                </div>
              ) : (
                <ul className="space-y-1">
                  {popup.bullets.map((b, i) => (
                    <li key={i} className="text-[11px] text-stone-600 leading-snug list-disc list-outside pl-3.5">
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </PanZoomContainer>
      ) : (
        /* Skeleton / empty state */
        <div className="border border-stone-200 rounded-lg bg-white h-80 flex flex-col items-center justify-center gap-3">
          {isAnalyzing ? (
            <>
              <svg className="w-6 h-6 text-amber-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs text-stone-500">Diagrams are being generated…</span>
            </>
          ) : (
            <p className="text-xs text-husl-muted">No diagrams generated yet.</p>
          )}
        </div>
      )}

      {/* Caption + hint + status */}
      <div className="mt-2 space-y-1">
        {activeDiagram?.caption && (
          <p className="text-[11px] text-stone-500 leading-relaxed italic">{activeDiagram.caption}</p>
        )}
        {showHint && hasDiagrams && (
          <div className="flex items-center gap-1.5 text-[10px] text-stone-500 bg-stone-50 rounded px-2 py-1">
            <span>💡</span>
            <span>Click any shape in the diagram to see related text from the paper.</span>
            <button
              type="button"
              onClick={() => setShowHint(false)}
              className="text-stone-400 hover:text-stone-600 ml-auto"
              aria-label="Dismiss hint"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {isAnalyzing && remainingCount > 0 && (
          <p className="text-[10px] text-amber-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {remainingCount} more diagram{remainingCount === 1 ? "" : "s"} generating…
          </p>
        )}
      </div>
    </div>
  );
}
