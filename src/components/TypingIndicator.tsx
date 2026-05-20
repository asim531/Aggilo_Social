"use client";

/**
 * TypingIndicator
 *
 * Anonymised "a sister is writing…" surface. Reads from the shared
 * presence context. No nicknames are exposed — readers see only that
 * SOMEONE in the room is composing, never who. This matches the
 * platform's privacy posture: presence is collective, not surveilled.
 *
 * Renders nothing when no one (else) is typing.
 */

import { usePresence } from "@/lib/presence-context";

export default function TypingIndicator() {
  const { typingCount } = usePresence();

  if (typingCount <= 0) return null;

  const label =
    typingCount === 1
      ? "a sister is writing…"
      : `${typingCount} sisters are writing…`;

  return (
    <div className="px-4 py-1.5 bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-gray-500">
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
    </div>
  );
}
