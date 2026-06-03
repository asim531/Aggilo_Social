/**
 * Welfare signal detection — Research Circle MJ.
 *
 * Application-layer regex pre-filter that runs BEFORE the LLM. Belt-
 * and-braces: even if the LLM misreads the prompt, this layer fires.
 *
 * The patterns are tuned for Research Circle MJ's research cohort:
 * academic pressure, impostor syndrome, and the frustration of
 * lost work are common here, but they are the cluster's SUBJECT
 * MATTER, not welfare signals. Welfare fires only when language
 * crosses into inability, hopelessness with finality, isolation
 * as a permanent condition, coercion, or self-harm indicators.
 *
 * Mirrored from MVP welfare logic, with calibration adjustments noted
 * in CLUSTER_TOOLS.md "Welfare sensitivity note".
 */

const WELFARE_PATTERNS: RegExp[] = [
  // Inability around basic functioning
  /\bcan('?t|not)\s+(get\s+out\s+of\s+bed|sleep|eat|function|cope|breathe)\b/i,
  /\bhaven'?t\s+(been\s+able\s+to\s+)?(sleep|eat|function|leave\s+the\s+house)\b/i,

  // Hopelessness with finality
  /\b(no\s+point|nothing\s+matters|don'?t\s+see\s+the\s+point|what'?s\s+the\s+point)\b/i,
  /\b(nothing\s+(will\s+)?change|things\s+won'?t\s+get\s+better|never\s+(going\s+to\s+)?get\s+better)\b/i,

  // Isolation expressed as final / permanent
  /\b(completely\s+alone|nobody\s+(I\s+)?can\s+talk\s+to|no\s+one\s+understands)\b/i,
  /\b(nobody\s+(in\s+my\s+life\s+)?would\s+understand|no\s+one\s+would\s+understand)\b/i,

  // Self-harm or "wishing I weren't here" framing
  /\b(harm\s+myself|hurting\s+myself|don'?t\s+want\s+to\s+be\s+(here|alive))\b/i,
  /\b(wish\s+I\s+(wasn'?t|weren'?t|didn'?t)\s+(here|alive|exist))\b/i,
  /\b(everyone\s+would\s+be\s+better\s+off\s+without\s+me|burden\s+to\s+everyone)\b/i,
  /\b(end\s+(it|my\s+life)|kill\s+myself|suicide)\b/i,

  // Coercion / safety
  /\b(forcing\s+me|won'?t\s+let\s+me\s+leave|trapped|not\s+safe)\b/i,
  /\b(threatened\s+to\s+(hurt|kill)|afraid\s+(he|she|they)\s+will\s+(hurt|kill))\b/i,
];

/**
 * Returns true if the message contains a welfare signal pattern.
 * False positives are acceptable here — the cost of missing a true
 * positive is much higher than the cost of one extra Admin notification.
 */
export function detectWelfareSignal(message: string): boolean {
  if (!message || typeof message !== "string") return false;
  return WELFARE_PATTERNS.some((re) => re.test(message));
}

/**
 * Returns the first matching pattern's index for diagnostic logging.
 * Used by the welfare_notifications row to record which pattern fired.
 * Members never see this — it's for admin dashboard review only.
 */
export function describeWelfareMatch(message: string): {
  matched: boolean;
  pattern_index: number | null;
} {
  for (let i = 0; i < WELFARE_PATTERNS.length; i++) {
    if (WELFARE_PATTERNS[i].test(message)) {
      return { matched: true, pattern_index: i };
    }
  }
  return { matched: false, pattern_index: null };
}
