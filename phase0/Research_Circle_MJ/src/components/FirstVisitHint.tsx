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
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2.5 flex items-center gap-3">
        <span className="text-base shrink-0" aria-hidden="true">
          ✦
        </span>
        <p className="text-sm text-husl-ink dark:text-stone-200 flex-1 leading-snug">
          <span className="font-medium">First time, {nickname}?</span>{" "}
          <button
            type="button"
            onClick={onShowWelcome}
            className="underline text-husl-clio dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
          >
            Take a minute
          </button>{" "}
          to see how this room works, and tag your posts with topics so they stay findable.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="text-stone-400 dark:text-stone-500 hover:text-husl-ink dark:hover:text-stone-200 text-sm shrink-0"
          aria-label="Dismiss"
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
