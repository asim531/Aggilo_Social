"use client";

/**
 * FirstVisitHint — a tiny, dismissible banner above the Timeline.
 *
 * Surfaces only when profile.onboarded === false. Points to the
 * HelpMenu in the navbar without blocking the room. One sentence,
 * one CTA, one dismiss. Doesn't compete with the Timeline.
 *
 * Replaces the previous auto-firing welcome modal. The room is
 * visible immediately; the hint is optional.
 */

interface Props {
  nickname: string;
  onShowWelcome: () => void;
  onDismiss: () => void;
}

export default function FirstVisitHint({
  nickname,
  onShowWelcome,
  onDismiss,
}: Props) {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-3">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-center gap-3">
        <span className="text-base shrink-0" aria-hidden="true">
          ✦
        </span>
        <p className="text-sm text-lc-ink flex-1 leading-snug">
          <span className="font-medium">First time, {nickname}?</span>{" "}
          <button
            type="button"
            onClick={onShowWelcome}
            className="underline text-lc-clio hover:text-amber-700 transition-colors"
          >
            Take a minute
          </button>{" "}
          to see how this room works.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="text-stone-400 hover:text-lc-ink text-sm shrink-0"
          aria-label="Dismiss"
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
