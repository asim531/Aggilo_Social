"use client";

/**
 * TopicChip — clickable coloured pill for topic tags.
 *
 * Renders a topic as a small pill with its assigned colour.
 * Click navigates to the topic detail page.
 * Used inline under posts and in filter bars.
 */

import type { Topic } from "@/lib/types";

interface TopicChipProps {
  topic: Topic;
  onClick?: (topic: Topic) => void;
  active?: boolean;
  size?: "sm" | "md";
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; activeBg: string }> = {
  amber:    { bg: "bg-amber-50",    text: "text-amber-700",    border: "border-amber-200",    activeBg: "bg-amber-100" },
  teal:     { bg: "bg-teal-50",     text: "text-teal-700",     border: "border-teal-200",     activeBg: "bg-teal-100" },
  rose:     { bg: "bg-rose-50",     text: "text-rose-700",     border: "border-rose-200",     activeBg: "bg-rose-100" },
  violet:   { bg: "bg-violet-50",   text: "text-violet-700",   border: "border-violet-200",   activeBg: "bg-violet-100" },
  emerald:  { bg: "bg-emerald-50",  text: "text-emerald-700",  border: "border-emerald-200",  activeBg: "bg-emerald-100" },
  sky:      { bg: "bg-sky-50",      text: "text-sky-700",      border: "border-sky-200",      activeBg: "bg-sky-100" },
  orange:   { bg: "bg-orange-50",   text: "text-orange-700",   border: "border-orange-200",   activeBg: "bg-orange-100" },
  indigo:   { bg: "bg-indigo-50",   text: "text-indigo-700",   border: "border-indigo-200",   activeBg: "bg-indigo-100" },
  lime:     { bg: "bg-lime-50",     text: "text-lime-700",     border: "border-lime-200",     activeBg: "bg-lime-100" },
  fuchsia:  { bg: "bg-fuchsia-50",  text: "text-fuchsia-700",  border: "border-fuchsia-200",  activeBg: "bg-fuchsia-100" },
  stone:    { bg: "bg-stone-100",   text: "text-stone-700",    border: "border-stone-200",    activeBg: "bg-stone-200" },
};

export default function TopicChip({ topic, onClick, active, size = "sm" }: TopicChipProps) {
  const c = COLOR_MAP[topic.color] ?? COLOR_MAP.stone;
  const sizeClasses = size === "sm"
    ? "text-[10px] px-1.5 py-0.5 rounded"
    : "text-xs px-2.5 py-1 rounded-md";

  return (
    <button
      type="button"
      onClick={() => onClick?.(topic)}
      className={`
        inline-flex items-center gap-1 font-medium border transition-colors
        ${sizeClasses}
        ${active ? c.activeBg : c.bg}
        ${c.text}
        ${c.border}
        hover:${c.activeBg}
        focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-husl-clio/40
      `}
      title={topic.description ?? topic.name}
    >
      <span className="truncate max-w-[120px]">{topic.name}</span>
      {topic.post_count > 0 && (
        <span className="opacity-60">{topic.post_count}</span>
      )}
    </button>
  );
}
