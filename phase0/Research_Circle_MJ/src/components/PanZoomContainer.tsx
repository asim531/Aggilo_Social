"use client";

/**
 * PanZoomContainer — wraps SVG or any content with mouse/touch
 * panning and wheel zoom. Used by PaperDiagramViewer.
 */

import { useState, useRef, useCallback, type ReactNode } from "react";

interface PanZoomContainerProps {
  children: ReactNode;
  className?: string;
}

export default function PanZoomContainer({ children, className = "" }: PanZoomContainerProps) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPos = useRef({ x: 0, y: 0 });

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(transform.scale * delta, 0.3), 5);

      setTransform((prev) => ({
        x: mouseX - (mouseX - prev.x) * (newScale / prev.scale),
        y: mouseY - (mouseY - prev.y) * (newScale / prev.scale),
        scale: newScale,
      }));
    },
    [transform.scale]
  );

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    },
    [dragging]
  );

  const onMouseUp = useCallback(() => setDragging(false), []);

  const reset = useCallback(() => setTransform({ x: 0, y: 0, scale: 1 }), []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none ${className}`}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{ cursor: dragging ? "grabbing" : "grab" }}
    >
      <div
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: "0 0",
          transition: dragging ? "none" : "transform 0.15s ease-out",
        }}
      >
        {children}
      </div>
      <button
        type="button"
        onClick={reset}
        className="absolute bottom-2 right-2 text-[10px] font-medium px-2 py-1 rounded bg-white/80 border border-stone-200 text-stone-600 hover:bg-white shadow-sm"
        title="Reset zoom"
      >
        Reset
      </button>
      <span className="absolute top-2 right-2 text-[10px] text-stone-400 pointer-events-none">
        Scroll to zoom · Drag to pan
      </span>
    </div>
  );
}
