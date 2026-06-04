"use client";

/**
 * TypingIndicator
 *
 * Anonymised "a sister is writing…" surface. Reads from the shared
 * presence context. No nicknames are exposed — readers see only that
 * SOMEONE in the room is composing, never who. This matches the
 * platform's privacy posture: presence is collective, not surveilled.
 *
 * Layout: the indicator strip is a fixed-height slot (24px). When no
 * one is typing, the slot stays in place but visually empty so the
 * compose bar below does not shift vertically when typing starts /
 * stops. Without this the textarea would jump on every typing edge,
 * which on iOS can move focus mid-keystroke. The slot is hidden from
 * assistive tech when empty so it doesn't read as a blank live region.
 */

import { usePresence } from "@/lib/presence-context";

const SLOT_HEIGHT = "h-6"; // 24px — matches the height of the inner row.

export default function TypingIndicator() {
  const { typingCount } = usePresence();

  const hasTyping = typingCount > 0;
  const label = !hasTyping
    ? ""
    : typingCount === 1
      ? "a sister is writing…"
      : `${typingCount} sisters are writing…`;

  return (
    <div
      className={`${SLOT_HEIGHT} bg-white border-b border-gray-100 px-4 flex items-center`}
      aria-hidden={!hasTyping}
    >
      {hasTyping && (
        <div
          className="max-w-4xl mx-auto w-full flex items-center gap-2 text-xs text-gray-500"
          role="status"
          aria-live="polite"
        >
          <span className="flex gap-0.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </span>
          <span className="italic">{label}</span>
        </div>
      )}
    </div>
  );
}
