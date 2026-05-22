/**
 * Sage-voiced share-line prompts.
 *
 * Two surfaces:
 *
 *   buildClusterCardSharePrompt — for outbound social posts (Twitter,
 *     LinkedIn, etc). Spoken to outsiders. ≤180 chars, no hype.
 *
 *   buildClusterInvitePrompt — for member-to-member invites (WhatsApp,
 *     Telegram, DMs). Sounds like a friend recommending a place. ≤120
 *     chars, includes the cluster URL.
 *
 * Both are routed through llmCall() so they're observable, fall back
 * cleanly, and never blow the daily budget. Admin reviews the output
 * before posting in Phase 0; automated posting is a Phase 1 decision.
 *
 * V3.11: Inherits the platform-level rules from `super-prompt.ts`.
 * Voice/forbidden/empowered live in the super-prompt; this file carries
 * only the share-mode-specific rules (length, audience, no-CTA, etc.).
 * See docs/PROMPT_AUDIT_RESULTS.md #11 and #12.
 */

import type { ChatMessage } from "./types";
import type { PublicCluster } from "./public-cluster";
import { AGGILO_SUPER_PROMPT_LITERAL } from "./super-prompt";

// Share-specific rules only — voice baseline + forbidden hype words live
// in the super-prompt and don't need restating here.
const SHARE_MODE_RULES = `
Share-mode rules:
- Speak to the reader as a stranger who deserves to be told the truth about what this room is.
- Promise nothing the room cannot deliver.
- If the cluster has demographic restrictions, say who it's for in a way that respects people who aren't in the audience — they shouldn't feel rejected, just informed.
- Never say "join us" or "sign up" — the platform handles the call to action.

Bad examples — do not produce these:
- "Join an exclusive community of…" — manufactured urgency + hype.
- "Transform your faith journey…" — marketing voice.
- "Don't miss out on…" — urgency tactic.
- "Connect with like-minded sisters who share your passion for…" — generic, hyped, audience-flattering.
`;

interface ShareContext {
  cluster: PublicCluster;
  recentTopicSamples?: string[]; // anonymised topic snippets, not full posts
}

export function buildClusterCardSharePrompt(ctx: ShareContext): ChatMessage[] {
  const { cluster, recentTopicSamples = [] } = ctx;
  const m = cluster.meta;

  const chipsLine = m.demographic_chips
    .map((c) => c.label)
    .filter(Boolean)
    .join(" · ");

  const sampleBlock =
    recentTopicSamples.length > 0
      ? `\nRecent topic tone (anonymised, do NOT quote any of these directly — they are background only):\n${recentTopicSamples
          .slice(0, 5)
          .map((s) => `- ${s.slice(0, 200)}`)
          .join("\n")}`
      : "";

  const system = `You are Sage. You are drafting ONE short shareable line about a cluster on Aggilo, suitable for posting to Twitter or LinkedIn.

The reader is a stranger. You are not their host yet. You are telling them what this room is, who it serves, and what makes it specific — in one breath.

${SHARE_MODE_RULES}

Hard limits:
- ≤180 characters total.
- One sentence.
- Output the line ONLY. No quotes around it. No explanation. No commentary.

Cluster:
- Name: ${m.display_name}
- Tagline: ${m.tagline}
- Description: ${m.description}
- Audience: ${chipsLine || "general"}${sampleBlock}`;

  const user = `Draft the share line.`;

  return [
    { role: "system", content: AGGILO_SUPER_PROMPT_LITERAL },
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export function buildClusterInvitePrompt(
  ctx: ShareContext & { invitingNickname?: string; clusterUrl: string }
): ChatMessage[] {
  const { cluster, invitingNickname = "a sister", clusterUrl } = ctx;
  const m = cluster.meta;

  const system = `You are Sage. You are drafting ONE short invite line a member could paste into WhatsApp or Telegram to invite a friend to this room.

The voice is a friend recommending a place — not a marketing message. The line ends with the cluster URL. If the cluster has a primary language other than English, output the line in that language — the friend the inviter is messaging is more likely to share it.

${SHARE_MODE_RULES}

Hard limits:
- ≤120 characters BEFORE the URL is appended.
- One sentence (or one short clause + the URL).
- Output the line ONLY. No quotes. No explanation.
- The line must end with the URL: ${clusterUrl}

Cluster:
- Name: ${m.display_name}
- Tagline: ${m.tagline}
- Description: ${m.description}
- The inviter's nickname (for context only — do not name them in the line): ${invitingNickname}`;

  const user = `Draft the invite line.`;

  return [
    { role: "system", content: AGGILO_SUPER_PROMPT_LITERAL },
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/**
 * Strip quotes, trailing periods that look like decoration, and clamp
 * to a max length without breaking words mid-letter.
 */
export function tidyShareLine(raw: string, maxChars: number): string {
  let line = raw.trim();
  // Strip surrounding quote marks the model sometimes adds.
  line = line.replace(/^["'""]+|["'""]+$/g, "");
  // Collapse internal whitespace runs.
  line = line.replace(/\s+/g, " ");
  if (line.length <= maxChars) return line;
  // Clamp at last whitespace before the cap.
  const clamped = line.slice(0, maxChars);
  const lastSpace = clamped.lastIndexOf(" ");
  return (lastSpace > 0 ? clamped.slice(0, lastSpace) : clamped).trim();
}
