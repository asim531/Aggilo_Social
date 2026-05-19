"use client";

/**
 * PinnedAnchor — Sage's anchor / pinned reference, rendered above the
 * agent chatbox. Collapsible per-device.
 *
 * Visual language:
 *   - Warm emerald palette — this is Sage's voice, room content, grounded
 *   - Solid 4px left border in emerald-500 (heavier than the chatbox's 2px)
 *   - Sage avatar visible even in collapsed state
 *   - Clearly labelled "Room anchor" so members understand its role
 *
 * Contrast with AgentChatbox:
 *   - Chatbox uses cool cyan/sky palette — meta-layer, agents working on the room
 *   - Chatbox has a 2px cyan border — lighter, more "system UI"
 *   - Chatbox header uses 🔵 icon — distinct from 📌 anchor
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
      // Collapsed: warm emerald strip with Sage avatar — clearly different
      // from the cool-blue chatbox below it
      <div className="border-b border-emerald-200 bg-emerald-50">
        <button
          type="button"
          onClick={onToggle}
          className="w-full max-w-4xl mx-auto px-4 py-2.5 flex items-center gap-2.5 hover:bg-emerald-100/60 transition-colors text-left"
        >
          {/* 4px solid emerald left accent — heavier than chatbox */}
          <div className="w-1 h-5 rounded-full bg-emerald-500 shrink-0" />
          <Image
            src="/characters/sage.png"
            alt="Sage"
            width={20}
            height={20}
            className="rounded-full object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-emerald-900">
              Room anchor
            </span>
            <span className="text-[11px] text-emerald-700/70 ml-2">
              Sage · tap to read
            </span>
          </div>
          <svg
            className="w-3.5 h-3.5 text-emerald-500 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    // Expanded: warm emerald card with 4px left border
    // Visually heavier and warmer than the chatbox — this is content, not meta
    <div className="border-b border-emerald-200 bg-emerald-50">
      <div className="max-w-4xl mx-auto">
        {/* Header row */}
        <div className="px-4 pt-3 pb-0 flex items-center gap-2.5">
          <div className="w-1 self-stretch rounded-full bg-emerald-500 shrink-0" />
          <Image
            src="/characters/sage.png"
            alt="Sage"
            width={22}
            height={22}
            className="rounded-full object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-emerald-900">Room anchor</span>
            <span className="text-[10px] text-emerald-700/60 ml-2 uppercase tracking-wide">Sage</span>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="text-[11px] text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1 shrink-0"
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
