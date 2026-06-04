/**
 * Sage message builder + runtime helpers.
 *
 * The builder stitches:
 *   1. AGGILO_SUPER_PROMPT_LITERAL   (platform/super-prompt.ts)
 *   2. SAGE_CHARACTER_PROMPT          (platform/sage-character.ts)
 *   3. cluster-specific Sage prompt   (clusters/<cluster_id>/sage.ts)
 *   4. Per-call platform signals (welfare, character, @Sage)
 *   5. Repetition guard with recent Sage posts
 *   6. Vault context
 *   7. Recent cluster posts as user-message context
 *   8. The current user question
 *
 * Runtime helpers (decision-tag parsing, character-concern regex,
 * Jaccard similarity / repetition detector) live next to the builder
 * because they are used together — every Sage call ends with
 * extractSageDecision and may use isSagePostRepetitive.
 */

import type { ChatMessage, PostWithAuthor, DuaVaultEntry } from "../types";
import { AGGILO_SUPER_PROMPT_LITERAL } from "./platform/super-prompt";
import { SAGE_CHARACTER_PROMPT } from "./platform/sage-character";
import { requireClusterModule, DEFAULT_CLUSTER_ID } from "./registry";

export interface SageEvaluationSignals {
  /** Member used @Sage — Sage MUST respond per protocol */
  mentionsSage?: boolean;
  /** Platform-side welfare regex matched — Sage MUST treat this as Step 0 hit */
  isWelfare?: boolean;
  /** Platform-side character regex matched — Sage SHOULD treat this as Step 0.5 hit */
  isCharacterConcern?: boolean;
  /** Sage's last N posts in this room — used to prevent repetition */
  recentSagePosts?: string[];
}

/**
 * Build the full Sage system message stack for a single LLM call.
 *
 * @param userQuestion - the post or message Sage is evaluating
 * @param recentPosts - up to ~20 recent cluster posts for context
 * @param vaultContext - verified vault entries Sage may surface
 * @param signals - platform-detected signals (welfare, character, @Sage)
 * @param clusterId - which cluster Sage is operating inside (defaults
 *                    to the Phase 0 cluster for backward compatibility)
 */
export function buildSageMessages(
  userQuestion: string,
  recentPosts: PostWithAuthor[] = [],
  vaultContext: DuaVaultEntry[] = [],
  signals: SageEvaluationSignals = {},
  clusterId: string = DEFAULT_CLUSTER_ID
): ChatMessage[] {
  const cluster = requireClusterModule(clusterId);

  const messages: ChatMessage[] = [
    // 1. Platform soul + safety floor
    { role: "system", content: AGGILO_SUPER_PROMPT_LITERAL },
    // 2. Sage's generic character + decision framework
    { role: "system", content: SAGE_CHARACTER_PROMPT },
    // 3. Cluster identity / vocabulary
    { role: "system", content: cluster.sagePrompt },
  ];

  // 4. Platform signal overrides
  const signalNotes: string[] = [];
  if (signals.mentionsSage) {
    signalNotes.push(
      "PLATFORM SIGNAL: This message contains an @Sage mention. The @Sage Mention Protocol applies: respond unless a higher-priority safety protocol (Step 0 welfare, Step 0.5 character) explicitly authorises a different response shape. When welfare or character takes over, the protocol's response shape — including the option of public [SAGE_SILENT] with private Clio handoff — supersedes the default 'always respond' rule. Address what the member asked when the safety floor is clear."
    );
  }
  if (signals.isWelfare) {
    signalNotes.push(
      "PLATFORM SIGNAL: Welfare patterns detected in this message. Step 0 of your decision framework applies. Respond with exactly two sentences — witness without diagnosing, then state someone from this community will reach out. Then silence. If you judge that public silence is more appropriate (the disclosure is too tender for a public reply), output [SAGE_SILENT] — Clio will reach out privately on your behalf. Welfare precedence overrides the @Sage 'always respond' rule when both fire."
    );
  }
  if (signals.isCharacterConcern) {
    signalNotes.push(
      "PLATFORM SIGNAL: Possible good-character / anti-monotheism pattern detected. Step 0.5 of your decision framework applies. If on closer reading the message is genuinely doubt or honest difficulty (not hostility), treat as ordinary content. If it is hostility, mockery, or coercion: respond with two-to-three sentences witnessing the position without attacking the member, name what good character looks like, optionally route to the Admin. Never argue. Never escalate. Step 0.5 precedence overrides the @Sage 'always respond' rule when both fire."
    );
  }
  if (signalNotes.length > 0) {
    messages.push({ role: "system", content: signalNotes.join("\n\n") });
  }

  // 5. Repetition guard
  if (signals.recentSagePosts && signals.recentSagePosts.length > 0) {
    const recentList = signals.recentSagePosts
      .slice(0, 10)
      .map((p, i) => `[${i + 1}] ${p.substring(0, 250)}`)
      .join("\n");
    messages.push({
      role: "system",
      content: `## Your recent posts in this room — DO NOT REPEAT
You have already said the things below recently. If your next response would be substantively similar to any of these — same idea, same framing, same reference — output [SAGE_SILENT] instead. Repetition erodes trust faster than silence.

${recentList}`,
    });
  }

  // 6. Vault context
  if (vaultContext.length > 0) {
    const vaultSummary = vaultContext
      .map((entry) => {
        const parts = [
          `Title: ${entry.title || "Untitled"}`,
          `Vault ID: ${entry.id}`,
          `Arabic: ${entry.arabic_text}`,
          `Transliteration: ${entry.transliteration}`,
          `Translation: ${entry.translation}`,
          `Source: ${entry.source_collection}${entry.source_hadith_number ? ` #${entry.source_hadith_number}` : ""}${entry.source_chapter_verse ? ` ${entry.source_chapter_verse}` : ""}`,
          entry.hadith_grade ? `Grade: ${entry.hadith_grade}` : null,
          `Tags: ${entry.thematic_tags.join(", ")}`,
        ].filter(Boolean);
        return parts.join("\n");
      })
      .join("\n---\n");

    messages.push({
      role: "system",
      content: `## Vault References Available\nThese are verified references from the dua vault. Use ONLY these when surfacing references. Do not generate or modify Arabic text. When you surface a reference, you may include its Vault ID in the SAGE_DECISION tag's "vault_id_used" field.\n\n${vaultSummary}`,
    });
  }

  // 7. Recent cluster posts as conversational context. The label uses
  // the cluster's display name + member noun so the prompt reads
  // naturally regardless of which cluster Sage is anchoring.
  if (recentPosts.length > 0) {
    const memberNoun = `A ${cluster.identity.memberNoun}`;
    const contextSummary = recentPosts
      .map((post) => {
        const author = post.is_sage ? "Sage" : post.profiles?.nickname || memberNoun;
        return `${author}: ${post.content}`;
      })
      .join("\n");

    messages.push({
      role: "user",
      content: `Here is the recent conversation in ${cluster.identity.displayName} for context:\n\n${contextSummary}\n\n---\n\n${memberNoun} posts the following message. Respond as Sage, or output [SAGE_SILENT] if silence is correct. Append the SAGE_DECISION tag on a final line.`,
    });
  }

  // 8. The user question itself.
  messages.push({ role: "user", content: userQuestion });

  return messages;
}

// ── Sage decision tag parsing ────────────────────────────────────────
//
// Sage emits a JSON tag on its own line at the end of every response.
// We parse it server-side, log to sage_decision_logs, and strip it from
// the visible content.

export interface SageDecision {
  step:
    | "welfare"
    | "character"
    | "citation"
    | "authority_redirect"
    | "reference_surface"
    | "care_witness"
    | "witness_participation"
    | "current_events_fallback"
    | "silent"
    | "unknown";
  rationale: string;
  vaultIdUsed: string | null;
}

const DECISION_TAG_RE = /<<<SAGE_DECISION:(\{[\s\S]*?\})>>>/;

export function extractSageDecision(rawContent: string): {
  visible: string;
  decision: SageDecision;
} {
  const match = rawContent.match(DECISION_TAG_RE);
  if (!match) {
    return {
      visible: rawContent.trim(),
      decision: { step: "unknown", rationale: "tag missing", vaultIdUsed: null },
    };
  }

  const visible = rawContent.replace(DECISION_TAG_RE, "").trim();
  let decision: SageDecision = {
    step: "unknown",
    rationale: "tag present but unparseable",
    vaultIdUsed: null,
  };
  try {
    const parsed = JSON.parse(match[1]) as {
      step?: string;
      rationale?: string;
      vault_id_used?: string | null;
    };
    decision = {
      step: (parsed.step as SageDecision["step"]) ?? "unknown",
      rationale: parsed.rationale ?? "",
      vaultIdUsed: parsed.vault_id_used ?? null,
    };
  } catch {
    // already set to unknown
  }
  return { visible, decision };
}

// ── Character concern regex (P0 monotheism guardrail) ──────────────
//
// Belt-and-braces detection at the application layer. The LLM also runs
// Step 0.5 in the prompt, but the regex catches obvious cases even when
// the LLM is unavailable. False positives are intentional — Sage's
// in-prompt judgment is the final filter.

export const CHARACTER_CONCERN_PATTERNS: Array<{ type: string; re: RegExp }> = [
  { type: "rejecting_monotheism", re: /\bthere\s+is\s+no\s+(allah|god)\b/i },
  { type: "rejecting_monotheism", re: /\b(allah|god)\s+(is|are)\s+(fake|imaginary|not\s+real|a\s+lie)\b/i },
  { type: "mocking_faith", re: /\b(stupid|useless|pointless|waste)\s+(to\s+)?(pray|believe|fast)/i },
  { type: "dismissing_dua", re: /\bdua\s+(is\s+)?(useless|pointless|fake|nothing|a\s+joke)\b/i },
  { type: "dismissing_dua", re: /\bstop\s+(wasting|making)\s+(your\s+time\s+)?dua\b/i },
  { type: "promoting_bad_character", re: /\b(everyone|all)\s+(here\s+)?(should|deserves?\s+to)\s+(suffer|burn|die)\b/i },
  { type: "promoting_bad_character", re: /\b(hate|despise)\s+(all\s+)?(women|sisters|muslims)\b/i },
  { type: "coercion_against_practice", re: /\byou\s+(must|have\s+to)\s+(stop|leave)\s+(praying|fasting|wearing|covering)\b/i },
];

export interface CharacterConcernMatch {
  matched: boolean;
  signalType: string | null;
  excerpt: string;
}

export function detectCharacterConcern(text: string): CharacterConcernMatch {
  for (const { type, re } of CHARACTER_CONCERN_PATTERNS) {
    if (re.test(text)) {
      return {
        matched: true,
        signalType: type,
        excerpt: text.substring(0, 500),
      };
    }
  }
  return { matched: false, signalType: null, excerpt: "" };
}

// ── Lightweight repetition detector ──────────────────────────────────
//
// A Jaccard-style word-set similarity between two short texts. Returns
// 0..1. Cheap, deterministic, no embeddings required. Good enough to
// catch "Sage said almost exactly the same thing yesterday" without
// the cost or latency of a real embedding model.

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4)
  );
}

export function shallowSimilarity(a: string, b: string): number {
  const sa = tokenize(a);
  const sb = tokenize(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let intersect = 0;
  for (const w of sa) if (sb.has(w)) intersect++;
  const union = sa.size + sb.size - intersect;
  return union === 0 ? 0 : intersect / union;
}

/**
 * True if `candidate` is too similar to any of `priorPosts`.
 * Threshold ~0.55 catches "rephrased version of the same point" without
 * blocking legitimate follow-ups that share a theme.
 */
export function isSagePostRepetitive(
  candidate: string,
  priorPosts: string[],
  threshold = 0.55
): boolean {
  for (const prior of priorPosts) {
    if (shallowSimilarity(candidate, prior) >= threshold) return true;
  }
  return false;
}
