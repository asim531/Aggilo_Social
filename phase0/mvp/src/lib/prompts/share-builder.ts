/**
 * Share-line builders — cluster card share + member invite line.
 *
 * Both inherit:
 *   1. AGGILO_SUPER_PROMPT_LITERAL    (platform/super-prompt.ts)
 *   2. SHARE_MODE_RULES                (platform/share-mode.ts)
 * and add per-share-mode hard limits + the cluster's identity copy
 * (display name, tagline, description, audience chips).
 *
 * Cluster identity is read from PublicCluster (DB) rather than from the
 * registry — share lines run for clusters that may not yet be in the
 * code registry (e.g. when admin spins up a new cluster via the UI).
 */

import type { ChatMessage } from "../types";
import type { PublicCluster } from "../public-cluster";
import { AGGILO_SUPER_PROMPT_LITERAL } from "./platform/super-prompt";
import { SHARE_MODE_RULES } from "./platform/share-mode";

export interface ShareContext {
  cluster: PublicCluster;
  /** Anonymised topic snippets, not full posts */
  recentTopicSamples?: string[];
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

  return [
    { role: "system", content: AGGILO_SUPER_PROMPT_LITERAL },
    { role: "system", content: system },
    { role: "user", content: "Draft the share line." },
  ];
}

export function buildClusterInvitePrompt(
  ctx: ShareContext & { invitingNickname?: string; clusterUrl: string }
): ChatMessage[] {
  const { cluster, invitingNickname = "a member", clusterUrl } = ctx;
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

  return [
    { role: "system", content: AGGILO_SUPER_PROMPT_LITERAL },
    { role: "system", content: system },
    { role: "user", content: "Draft the invite line." },
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
