/**
 * Contextual "thinking" messages
 *
 * While the LLM is generating a response, members see rotating, context-aware
 * status lines instead of a generic spinner. These set tone, signal that real
 * work is happening, and keep the silence from feeling broken.
 *
 * Rotation cadence: 1.8s per phrase. The phrases are intentionally specific —
 * not "loading" — so the wait itself communicates Clio's character.
 */

// ── Clio in a normal cluster question ─────────────────────────────────────
export const CLIO_THINKING_CLUSTER: string[] = [
  "Reading the room…",
  "Considering what would actually help…",
  "Choosing my words carefully.",
];

// ── Clio in private ephemeral mode ────────────────────────────────────────
export const CLIO_THINKING_EPHEMERAL: string[] = [
  "Listening.",
  "Sitting with what you said…",
  "Choosing carefully.",
];

// ── Sage evaluating a post (after submission) ────────────────────────────
export const SAGE_THINKING: string[] = [
  "Sage is reading this…",
  "Cross-checking the vault…",
  "Considering whether silence is the right answer.",
  "Looking for a verified reference…",
];

// ── Clio reviewing a Sage-proposed dua before posting ────────────────────
export const CLIO_REVIEWING_DUA: string[] = [
  "Reading what Sage suggests…",
  "Verifying the source citation…",
  "Choosing the witness line.",
];

// ── Generic short fallback ────────────────────────────────────────────────
export const GENERIC_THINKING: string[] = [
  "Working on it…",
  "One moment.",
];

/**
 * Hook-style helper: returns the index that should be displayed at a given
 * elapsed time, rotating through the phrases array. Pure function — call it
 * inside a useEffect interval.
 */
export function indexAtElapsed(
  elapsedMs: number,
  cadenceMs = 1800
): number {
  return Math.floor(elapsedMs / cadenceMs);
}

/**
 * Returns the current phrase to display, with a "Taking a moment…" trailer
 * once we exceed the array length.
 */
export function currentPhrase(
  phrases: string[],
  elapsedMs: number,
  cadenceMs = 1800
): { text: string; takingMoment: boolean } {
  const idx = indexAtElapsed(elapsedMs, cadenceMs);
  if (idx < phrases.length) {
    return { text: phrases[idx], takingMoment: false };
  }
  // Cycle the last phrase + show "taking a moment" trailer after we run out
  return { text: phrases[phrases.length - 1], takingMoment: true };
}
