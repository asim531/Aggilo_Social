"use client";

/**
 * PaperDiagramViewer — renders SVG diagrams with tab switching,
 * pan/zoom, and progressive fade-in.
 */

import { useState, useEffect } from "react";
import PanZoomContainer from "./PanZoomContainer";

interface DiagramItem {
  type: string;
  title: string;
  svg_data: string;
  caption?: string | null;
}

interface PaperDiagramViewerProps {
  diagrams: DiagramItem[];
}

const typeLabels: Record<string, string> = {
  concept_map: "Concept Map",
  process_flow: "Process Flow",
  architecture: "Architecture",
  argument_tree: "Argument Tree",
};

export default function PaperDiagramViewer({ diagrams }: PaperDiagramViewerProps) {
  const [activeType, setActiveType] = useState(diagrams[0]?.type ?? null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, [activeType]);

  if (diagrams.length === 0) {
    return <p className="text-xs text-husl-muted py-2">No diagrams generated yet.</p>;
  }

  const activeDiagram = diagrams.find((d) => d.type === activeType) ?? diagrams[0];

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 overflow-x-auto scrollbar-hide">
        {diagrams.map((d) => (
          <button
            key={d.type}
            type="button"
            onClick={() => setActiveType(d.type)}
            className={`shrink-0 text-[10px] font-medium px-2 py-1 rounded transition-colors ${
              d.type === activeType
                ? "bg-husl-clio/10 text-husl-clio"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {typeLabels[d.type] || d.type}
          </button>
        ))}
      </div>
      {activeDiagram && (
        <PanZoomContainer className="border border-stone-200 rounded-lg bg-white h-80">
          <div
            className={`transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
            dangerouslySetInnerHTML={{ __html: activeDiagram.svg_data }}
          />
        </PanZoomContainer>
      )}
      {activeDiagram?.caption && (
        <p className="text-[11px] text-stone-500 mt-2 leading-relaxed italic">
          {activeDiagram.caption}
        </p>
      )}
    </div>
  );
}
