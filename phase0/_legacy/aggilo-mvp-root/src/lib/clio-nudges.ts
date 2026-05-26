/**
 * Cluster-level passive motivation lines.
 *
 * These are NOT clickable starter prompts. They sit above the composer as a
 * rotating, passive nudge — a quiet line that names a real reason a sister
 * might want to share. The member writes their own post; the nudge is just
 * a door, not a script.
 *
 * Senior UX read on this:
 *   - Members lurking in a quiet room need permission to speak.
 *   - The cold-open question ("What's on your heart?") is too generic and
 *     reads like a bot prompt.
 *   - A specific, lived motivation gives the member language for a feeling
 *     they may not have named yet — and lets them decide whether to share.
 *   - The nudge rotates so it doesn't feel scripted. Same nudge twice in a
 *     row would lose its weight.
 *
 * Voice rules (per Clio's SOUL):
 *   - Concrete, lived, specific — not generic comfort
 *   - No exclamation marks, no manufactured warmth
 *   - Names something a sister might actually be carrying
 *   - Optional always — the nudge is a door, not a turnstile
 */

export interface ClusterNudge {
  id: string;
  text: string;
}

export const SISTERS_IN_DUA_NUDGES: ClusterNudge[] = [
  {
    id: "salah-rhythm",
    text: "Your salah rhythm — steady, slipping, or somewhere in between this week?",
  },
  {
    id: "carrying",
    text: "Whatever you're carrying right now, this room is here. Sage will surface a verified dua if one fits.",
  },
  {
    id: "first-post",
    text: "Your first post sets the tone. No need to be polished — just real.",
  },
  {
    id: "doubt",
    text: "Doubt and faith live in the same room. Talk about either.",
  },
  {
    id: "small-thing",
    text: "One small thing in your day where you felt close to Allah — share it.",
  },
  {
    id: "ramadan",
    text: "Thinking about the next Ramadan already, or not yet? Either is honest.",
  },
  {
    id: "scholar",
    text: "A fiqh question you've been turning over? The Admin and Managers hold guidance — start here.",
  },
  {
    id: "sister-ahead",
    text: "Someone here is one step ahead of where you are. Ask.",
  },
  {
    id: "sister-behind",
    text: "Someone here is one step behind where you are. Share what helped you.",
  },
  {
    id: "honest-day",
    text: "What kind of day are you actually having? Not the answer you'd give in salaam.",
  },
  {
    id: "nightprayer",
    text: "Tahajjud, witr, fajr — the night carries weight. Anything from the last few nights worth saying out loud?",
  },
  {
    id: "quran-line",
    text: "An ayah that's been sitting with you lately — share it, with what it's stirred.",
  },
];

/**
 * Pick today's nudge for this user, deterministically.
 *
 * Same user + same day → same nudge (so it doesn't flicker between mounts).
 * Next day → different nudge (so it doesn't grow stale).
 *
 * The rotation cycle is the full pool length in days.
 */
export function pickClusterNudge(userId: string): ClusterNudge {
  // Day index since epoch (UTC) — stable across timezones-of-the-same-day
  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000));

  // Per-user offset so two members don't see the same nudge on the same day
  let userHash = 0;
  for (let i = 0; i < userId.length; i++) {
    userHash = (userHash * 31 + userId.charCodeAt(i)) >>> 0;
  }

  const idx = (dayIndex + userHash) % SISTERS_IN_DUA_NUDGES.length;
  return SISTERS_IN_DUA_NUDGES[idx];
}
