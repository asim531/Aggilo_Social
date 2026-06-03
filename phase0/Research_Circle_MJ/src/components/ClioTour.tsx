"use client";

/**
 * ClioTour — Research Circle MJ contextual spotlight tour.
 *
 * Five-stop tour that fires after the welcome modal is dismissed on
 * the member's first session. Each stop spotlights a specific UI
 * element with a Clio tooltip. The background is dimmed; the target
 * element is highlighted with a ring.
 *
 * Stops:
 *   1. Timeline — "This is where the conversation lives."
 *   2. Compose bar — "Your words are your entire presence here."
 *   3. Clio FAB — "I'm here when you want me. Private mode too."
 *   4. Workshop strip — "Sage and I work on the room here."
 *   5. Cluster chips — "Who this room is for."
 *
 * Implementation:
 *   - Each stop has a CSS selector for the target element.
 *   - On mount, the component measures the target's bounding rect
 *     and positions the spotlight + tooltip accordingly.
 *   - On window resize, positions are recalculated.
 *   - Skippable at any stop.
 *   - Persisted via localStorage so it never fires twice.
 *
 * Privacy: data-clarity-mask="true" on the tooltip.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { withBasePath } from "@/lib/path";

interface TourStop {
  id: string;
  selector: string;
  title: string;
  body: string;
  /** Where to anchor the tooltip relative to the target. */
  placement: "top" | "bottom" | "left" | "right";
}

const TOUR_STOPS: TourStop[] = [
  {
    id: "timeline",
    selector: "#husl-cluster-timeline",
    title: "The Timeline",
    body: "This is where the research lives. Every post is public — your words, documents, and links are all topic-tagged so they stay findable.",
    placement: "bottom",
  },
  {
    id: "compose",
    selector: "#husl-post-composer",
    title: "Your voice",
    body: "Share the work you're actually doing. Nobody's set the tone yet — the room belongs to whoever posts first.",
    placement: "top",
  },
  {
    id: "clio-fab",
    selector: ".clio-fab-cluster",
    title: "Clio — bottom right",
    body: "I'm here when you want me. Two modes: the Clio tab for cluster questions and navigation help, and the Private tab for conversations that stay just between us.",
    placement: "top",
  },
  {
    id: "workshop",
    selector: "#husl-room-workshop-panel, button[aria-controls='husl-room-workshop-panel']",
    title: "Room Workshop",
    body: "Sage and I check in here about what this room could gain — tools we run, features for you to vote on. Collapsed by default; open it when you're curious.",
    placement: "top",
  },
  {
    id: "identity",
    selector: "#husl-cluster-identity",
    title: "Who this room is for",
    body: "Research Circle MJ — faculty and researchers at MJ College. Documents, images, videos, and links are all topic-linkable. The room belongs to whoever shares first.",
    placement: "bottom",
  },
];

const TOUR_DONE_KEY = "lc:tour_done";

interface Rect {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top: number;
  left: number;
  maxWidth: number;
}

function computeTooltipPosition(
  rect: Rect,
  preferredPlacement: TourStop["placement"],
  tooltipWidth: number,
  tooltipHeight: number
): TooltipPosition {
  const GAP = 12;
  const MARGIN = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  function tryPlacement(p: TourStop["placement"]): {
    top: number;
    left: number;
    fits: boolean;
  } {
    let top = 0;
    let left = 0;

    switch (p) {
      case "bottom":
        top = rect.bottom + GAP;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "top":
        top = rect.top - tooltipHeight - GAP;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - GAP;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + GAP;
        break;
    }

    const fitsHoriz = left >= MARGIN && left + tooltipWidth <= vw - MARGIN;
    const fitsVert = top >= MARGIN && top + tooltipHeight <= vh - MARGIN;
    return { top, left, fits: fitsHoriz && fitsVert };
  }

  // Try preferred placement first, then flip opposites, then any that fits.
  const opposites: Record<TourStop["placement"], TourStop["placement"]> = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left",
  };
  const order: TourStop["placement"][] = [
    preferredPlacement,
    opposites[preferredPlacement],
    "bottom",
    "top",
    "right",
    "left",
  ];

  for (const p of order) {
    const attempt = tryPlacement(p);
    if (attempt.fits) {
      return {
        top: attempt.top,
        left: attempt.left,
        maxWidth: Math.min(tooltipWidth, vw - MARGIN * 2),
      };
    }
  }

  // Fallback: clamp preferred placement to viewport.
  const attempt = tryPlacement(preferredPlacement);
  const top = Math.max(MARGIN, Math.min(attempt.top, vh - tooltipHeight - MARGIN));
  const left = Math.max(MARGIN, Math.min(attempt.left, vw - tooltipWidth - MARGIN));
  return { top, left, maxWidth: Math.min(tooltipWidth, vw - MARGIN * 2) };
}

interface Props {
  onDone: () => void;
}

export default function ClioTour({ onDone }: Props) {
  const [stopIndex, setStopIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const TOOLTIP_WIDTH = 280;
  const TOOLTIP_HEIGHT = 160; // estimated; recalculated after render

  const currentStop = TOUR_STOPS[stopIndex];
  const isLast = stopIndex === TOUR_STOPS.length - 1;

  const measureTarget = useCallback((skipMissing = false) => {
    const selectors = currentStop.selector.split(",").map((s) => s.trim());
    let el: Element | null = null;
    for (const sel of selectors) {
      el = document.querySelector(sel);
      if (el) break;
    }
    if (!el) {
      if (skipMissing) {
        // Target not found — skip this stop after a brief delay.
        setTimeout(() => handleNext(), 200);
      }
      setTargetRect(null);
      setTooltipPos(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    const r: Rect = {
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right,
      width: rect.width,
      height: rect.height,
    };
    setTargetRect(r);

    // Measure tooltip height after render, then compute position.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const th = tooltipRef.current?.offsetHeight ?? TOOLTIP_HEIGHT;
        setTooltipPos(
          computeTooltipPosition(r, currentStop.placement, TOOLTIP_WIDTH, th)
        );
      });
    });
  }, [currentStop]);

  useEffect(() => {
    measureTarget(true);
    const onResizeOrScroll = () => measureTarget();
    window.addEventListener("resize", onResizeOrScroll);
    window.addEventListener("scroll", onResizeOrScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", onResizeOrScroll);
      window.removeEventListener("scroll", onResizeOrScroll);
    };
  }, [measureTarget]);

  // Recalculate tooltip position after it renders (height may differ).
  useEffect(() => {
    if (!targetRect || !tooltipRef.current) return;
    const th = tooltipRef.current.offsetHeight;
    setTooltipPos(
      computeTooltipPosition(targetRect, currentStop.placement, TOOLTIP_WIDTH, th)
    );
  }, [targetRect, currentStop.placement]);

  function handleNext() {
    if (isLast) {
      handleDone();
    } else {
      setStopIndex((i) => i + 1);
    }
  }

  function handleDone() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOUR_DONE_KEY, "1");
    }
    onDone();
  }

  // Scroll target into view on each stop, then measure after scroll settles.
  useEffect(() => {
    const selectors = currentStop.selector.split(",").map((s) => s.trim());
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Wait for smooth scroll to finish before measuring.
        const timer = setTimeout(() => measureTarget(), 450);
        return () => clearTimeout(timer);
      }
    }
  }, [currentStop.selector, measureTarget]);

  return (
    <>
      {/* Spotlight ring around target — the box-shadow creates the dimming effect */}
      {targetRect && (
        <div
          className="fixed z-[71] rounded-lg ring-2 ring-husl-clio ring-offset-2 ring-offset-transparent"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
          }}
        />
      )}

      {/* Tooltip */}
      {tooltipPos && (
        <div
          ref={tooltipRef}
          className="fixed z-[72] bg-husl-card rounded-xl shadow-2xl border border-stone-200 p-4"
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            width: tooltipPos.maxWidth,
          }}
          data-clarity-mask="true"
          role="dialog"
          aria-label={`Tour step ${stopIndex + 1} of ${TOUR_STOPS.length}: ${currentStop.title}`}
        >
          {/* Clio avatar + label */}
          <div className="flex items-center gap-2 mb-2">
            <div className="relative w-7 h-7 shrink-0">
              <img
                src={withBasePath("/characters/clio.png")}
                alt="Clio"
                className="object-contain w-full h-full"
              />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-husl-clio font-semibold">
              Clio · {stopIndex + 1}/{TOUR_STOPS.length}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-husl-ink mb-1">
            {currentStop.title}
          </h3>
          <p className="text-xs text-husl-muted leading-relaxed mb-3">
            {currentStop.body}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1" aria-hidden="true">
              {TOUR_STOPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === stopIndex
                      ? "w-3 bg-husl-clio"
                      : i < stopIndex
                        ? "w-1.5 bg-husl-clio/40"
                        : "w-1.5 bg-stone-200"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDone}
                className="text-xs text-husl-muted hover:text-husl-ink transition-colors"
              >
                Skip tour
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-3 py-1.5 bg-husl-clio text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors"
              >
                {isLast ? "Done" : "Next →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Check whether the tour has been completed on this device. */
export function isTourDone(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(TOUR_DONE_KEY) === "1";
}
