"use client";

/**
 * PinnedAnchor — Sage's founding statement for the room.
 *
 * Visual language (V3.2 — hierarchy-first):
 *   - Ultra-minimal when collapsed: a thin line with "Room anchor · tap to read"
 *     Takes almost no vertical space. Never competes with the timeline.
 *   - Warm but quiet when expanded: soft emerald tint, lighter border,
 *     smaller avatar. The content is what matters, not the chrome.
 *
 * Position: above the timeline (it's the room's identity, not an agent artefact).
 * But its visual weight is deliberately lower than member posts — it's a
 * founding statement, not a headline.
 */

import Image from "next/image";
import { PostWithAuthor } from "@/lib/types";
import SagePostContentStandalone from "./SagePostContentStandalone";

interface PinnedAnchorProps {
  post: PostWithAuthor;
  collapsed: boolean;
  onToggle: () => void;
}

export default function PinnedAnchor({
  post,
  collapsed,
  onToggle,
}: PinnedAnchorProps) {
  if (collapsed) {
    return (
      // Collapsed: ultra-minimal — just a thin line. Names the source
      // (Sage · Anchor) so members who scroll past don't have to
      // wonder what the strip represents.
      <div className="border-b border-gray-100 bg-white">
        <button
          type="button"
          onClick={onToggle}
          className="w-full max-w-4xl mx-auto px-4 py-1.5 flex items-center gap-2 hover:bg-gray-50/60 transition-colors text-left"
          aria-label="Expand the room's founding statement"
        >
          <div className="w-0.5 h-3 rounded-full bg-emerald-400/60 shrink-0" aria-hidden="true" />
          <span className="text-[11px] text-gray-500 flex-1 truncate">
            <span className="font-medium text-emerald-700">From Sage · Anchor</span>
            <span className="text-gray-400 italic"> — tap to expand</span>
          </span>
          <svg
            className="w-3 h-3 text-gray-300 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    // Expanded: warm emerald card — this is content, the room's founding statement
    <div className="border-b border-emerald-100 bg-emerald-50/40">
      <div className="max-w-4xl mx-auto">
        {/* Header row */}
        <div className="px-4 pt-3 pb-0 flex items-center gap-2.5">
          <div className="w-0.5 self-stretch rounded-full bg-emerald-400/60 shrink-0" />
          <Image
            src="/characters/sage.png"
            alt="Sage"
            width={18}
            height={18}
            className="rounded-full object-cover shrink-0 opacity-80"
          />
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-medium text-emerald-800">Room anchor</span>
            <span className="text-[10px] text-emerald-600/60 ml-2">Sage</span>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="text-[11px] text-emerald-600/70 hover:text-emerald-800 font-medium flex items-center gap-1 shrink-0"
            aria-label="Collapse anchor"
          >
            Collapse
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-3 pl-8">
          <SagePostContentStandalone content={post.content} postId={post.id} />
        </div>
      </div>
    </div>
  );
}
