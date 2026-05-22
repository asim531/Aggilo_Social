"use client";

/**
 * Clio Tour — anchored guided overlay.
 *
 * When a member clicks a topic in Clio's "What's on this page?" help
 * section (or hits "Start tour"), the page scrolls to that surface and
 * a small Clio-attributed popover appears anchored to it. The popover
 * carries a brief description, a close button, and Prev/Next controls
 * so the member can step through the room one surface at a time.
 *
 * Architectural choices:
 * - Deterministic copy. The descriptions are hand-written, not LLM-
 *   generated. This is in line with PROMPT_AUDIT_RESULTS.md #6 and #10:
 *   high-stakes member-facing first-impression copy belongs in
 *   templates, not in the model.
 * - Portal-rendered to <body> so the popover sits above the FAB panel,
 *   the sticky compose bar, and any dialogs.
 * - Position recalculated on scroll/resize so the popover tracks its
 *   target surface as the page moves.
 * - The popover never references "tour", "tutorial", or "onboarding"
 *   in member-visible copy. It says what's there, named once.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

export interface TourStep {
  /** Short label shown in the help list and as the popover heading */
  label: string;
  /** CSS selector for the surface to anchor to */
  selector: string;
  /** One- or two-sentence description; deterministic copy */
  description: string;
}

interface ClioTourProps {
  steps: TourStep[];
  activeIndex: number | null;
  onChange: (next: number | null) => void;
}

const HIGHLIGHT_COLOR = "rgb(16 185 129 / 0.55)";

interface PopoverPos {
  top: number;
  left: number;
  side: "above" | "below";
  arrowLeft: number;
}

const POPOVER_WIDTH = 288; // tailwind w-72
const POPOVER_GAP = 12;

export default function ClioTour({ steps, activeIndex, onChange }: ClioTourProps) {
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<PopoverPos | null>(null);
  const targetRef = useRef<HTMLElement | null>(null);
  const previousBoxShadowRef = useRef<string | null>(null);
  const previousTransitionRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const active =
    activeIndex !== null && activeIndex >= 0 && activeIndex < steps.length
      ? steps[activeIndex]
      : null;

  // Resolve target element + scroll into view + apply a brief highlight ring.
  useLayoutEffect(() => {
    if (!active || typeof document === "undefined") {
      targetRef.current = null;
      setPos(null);
      return;
    }

    const el = document.querySelector(active.selector) as HTMLElement | null;
    if (!el) {
      // Target not in the DOM — close the tour rather than show a floating popover.
      onChange(null);
      return;
    }

    targetRef.current = el;

    // Apply a held highlight on the target — released on step change / close.
    previousBoxShadowRef.current = el.style.boxShadow;
    previousTransitionRef.current = el.style.transition;
    el.style.transition = "box-shadow 200ms ease";
    el.style.boxShadow = `0 0 0 3px ${HIGHLIGHT_COLOR}`;

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Position recalculation. We compute on RAF so the smooth scroll has
    // a beat to settle before we anchor; then we update on scroll/resize.
    let cancelled = false;

    const compute = () => {
      if (cancelled) return;
      const target = targetRef.current;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Prefer below; flip above when the surface is in the bottom third.
      const side: "above" | "below" = rect.top > vh * 0.6 ? "above" : "below";

      const desiredLeft = rect.left + rect.width / 2 - POPOVER_WIDTH / 2;
      const left = Math.max(8, Math.min(vw - POPOVER_WIDTH - 8, desiredLeft));
      const arrowLeft = Math.max(
        16,
        Math.min(POPOVER_WIDTH - 16, rect.left + rect.width / 2 - left)
      );

      const top =
        side === "below"
          ? Math.min(vh - 16, rect.bottom + POPOVER_GAP)
          : Math.max(8, rect.top - POPOVER_GAP);

      setPos({ top, left, side, arrowLeft });
    };

    // First pass after the smooth-scroll has had a chance to land.
    const initial = window.setTimeout(compute, 280);
    const onScrollOrResize = () => compute();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      cancelled = true;
      window.clearTimeout(initial);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      // Release the highlight when the active step changes or the tour closes.
      if (el) {
        el.style.boxShadow = previousBoxShadowRef.current ?? "";
        // Restore transition on the next tick so the fade plays.
        const restoreTransition = previousTransitionRef.current ?? "";
        window.setTimeout(() => {
          el.style.transition = restoreTransition;
        }, 220);
      }
    };
  }, [active, onChange]);

  // Keyboard support: Esc closes; ←/→ steps.
  useEffect(() => {
    if (active === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onChange(null);
      } else if (e.key === "ArrowRight" && activeIndex !== null && activeIndex < steps.length - 1) {
        onChange(activeIndex + 1);
      } else if (e.key === "ArrowLeft" && activeIndex !== null && activeIndex > 0) {
        onChange(activeIndex - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, activeIndex, steps.length, onChange]);

  if (!mounted || !active || pos === null) return null;
  if (typeof document === "undefined") return null;

  const idx = activeIndex as number;
  const isFirst = idx === 0;
  const isLast = idx === steps.length - 1;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] pointer-events-none"
      role="dialog"
      aria-modal="false"
      aria-label={`Tour step: ${active.label}`}
    >
      {/* Anchored popover */}
      <div
        className="absolute pointer-events-auto"
        style={{
          top: pos.side === "below" ? pos.top : undefined,
          bottom:
            pos.side === "above"
              ? `calc(100vh - ${pos.top}px)`
              : undefined,
          left: pos.left,
          width: POPOVER_WIDTH,
        }}
      >
        <div className="bg-white rounded-xl shadow-2xl border border-emerald-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-start gap-2 px-3 py-2 bg-emerald-50 border-b border-emerald-100">
            <Image
              src="/characters/clio.png"
              alt="Clio"
              width={28}
              height={28}
              className="rounded-full object-cover shrink-0 mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide font-semibold text-emerald-700 leading-tight">
                Clio · this is here
              </div>
              <div className="text-sm font-semibold text-gray-800 leading-snug truncate">
                {active.label}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1 shrink-0"
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          {/* Body */}
          <div className="px-3 py-2.5 text-[13px] text-gray-700 leading-relaxed">
            {active.description}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-gray-100 bg-gray-50">
            <span className="text-[11px] text-gray-500">
              {idx + 1} of {steps.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onChange(idx - 1)}
                disabled={isFirst}
                className="px-2 py-1 text-xs rounded-md text-emerald-800 hover:bg-emerald-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                Back
              </button>
              {isLast ? (
                <button
                  type="button"
                  onClick={() => onChange(null)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  Done
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onChange(idx + 1)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div
          className="absolute"
          style={{
            left: pos.arrowLeft - 6,
            top: pos.side === "below" ? -6 : undefined,
            bottom: pos.side === "above" ? -6 : undefined,
          }}
          aria-hidden
        >
          <div
            className={`w-3 h-3 rotate-45 bg-white border-emerald-200 ${
              pos.side === "below" ? "border-t border-l" : "border-b border-r"
            }`}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
