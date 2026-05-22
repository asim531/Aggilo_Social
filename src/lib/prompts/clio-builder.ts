/**
 * Clio message builder + runtime helpers.
 *
 * Builders for cluster-mode and ephemeral-mode prompts. Each stitches:
 *   1. AGGILO_SUPER_PROMPT_LITERAL    (platform/super-prompt.ts)
 *   2. CLIO_CHARACTER_PROMPT          (platform/clio-character.ts)
 *   3. cluster context (cluster mode) OR ephemeral frame (ephemeral)
 *   4. CLIO_WELFARE_RESPONSE_SHAPE    (platform/clio-character.ts)
 *   5. Per-call vault summary, recent room context, conversation history
 *   6. The current user message
 *
 * Welfare regex helper (`detectWelfareSignal`) is colocated because
 * every Clio call runs it as a belt-and-braces check before invoking
 * the LLM.
 */

import type { ChatMessage, PostWithAuthor, DuaVaultEntry } from "../types";
import { AGGILO_SUPER_PROMPT_LITERAL } from "./platform/super-prompt";
import {
  CLIO_CHARACTER_PROMPT,
  CLIO_WELFARE_RESPONSE_SHAPE,
  CLIO_EPHEMERAL_FRAME,
} from "./platform/clio-character";
import { requireClusterModule, DEFAULT_CLUSTER_ID } from "./registry";

export interface BuildClioContext {
  /** The user's message (most recent turn) */
  userMessage: string;
  /** Conversation history if available (oldest first) */
  conversationHistory?: ChatMessage[];
  /** Recent cluster posts for cluster-mode awareness; ignored in ephemeral mode */
  recentPosts?: PostWithAuthor[];
  /** Vault entries Clio MAY reference (read-only) when answering */
  vaultEntries?: DuaVaultEntry[];
  /** Member nickname for natural address */
  memberNickname?: string;
  /** Which cluster Clio is operating inside */
  clusterId?: string;
}

export function buildClioClusterMessages(ctx: BuildClioContext): ChatMessage[] {
  const cluster = requireClusterModule(ctx.clusterId ?? DEFAULT_CLUSTER_ID);

  const messages: ChatMessage[] = [
    { role: "system", content: AGGILO_SUPER_PROMPT_LITERAL },
    { role: "system", content: CLIO_CHARACTER_PROMPT },
    { role: "system", content: cluster.clioClusterContext },
    { role: "system", content: CLIO_WELFARE_RESPONSE_SHAPE },
  ];

  // Vault is read-only context — Clio does not author dua text, she may
  // reference existing entries by title when the member asks about them.
  if (ctx.vaultEntries && ctx.vaultEntries.length > 0) {
    const vaultSummary = ctx.vaultEntries
      .map(
        (e) =>
          `- ${e.title || "Untitled"} (${e.source_collection}${e.hadith_grade ? `, ${e.hadith_grade}` : ""})`
      )
      .join("\n");
    messages.push({
      role: "system",
      content: `## Vault references this room has access to (read-only — never quote Arabic from here):\n${vaultSummary}`,
    });
  }

  // Recent room context — last 10 posts, no PII beyond nickname
  if (ctx.recentPosts && ctx.recentPosts.length > 0) {
    const memberNoun = `A ${cluster.identity.memberNoun}`;
    const summary = ctx.recentPosts
      .slice(-10)
      .map((p) => {
        const who = p.is_sage ? "Sage" : p.profiles?.nickname || memberNoun;
        return `${who}: ${p.content.substring(0, 200)}`;
      })
      .join("\n");
    messages.push({
      role: "system",
      content: `## Recent in the room (for context only):\n${summary}`,
    });
  }

  // Replay conversation history if provided
  if (ctx.conversationHistory && ctx.conversationHistory.length > 0) {
    messages.push(...ctx.conversationHistory);
  }

  messages.push({ role: "user", content: ctx.userMessage });

  return messages;
}

export function buildClioEphemeralMessages(ctx: BuildClioContext): ChatMessage[] {
  // Ephemeral mode keeps the cluster's authority structure visible (the
  // safety floor still escalates to the cluster's care authority) but
  // never exposes cluster-mode skills or recent posts.
  const cluster = requireClusterModule(ctx.clusterId ?? DEFAULT_CLUSTER_ID);

  const messages: ChatMessage[] = [
    { role: "system", content: AGGILO_SUPER_PROMPT_LITERAL },
    { role: "system", content: CLIO_CHARACTER_PROMPT },
    {
      role: "system",
      content: `## Cluster identity (for routing only — you are in private mode)\nYou are talking to a member of "${cluster.identity.displayName}". The cluster's care authority is named ${cluster.identity.authorityNoun}. You never reference cluster context unless the member brings it up.`,
    },
    { role: "system", content: CLIO_EPHEMERAL_FRAME },
    { role: "system", content: CLIO_WELFARE_RESPONSE_SHAPE },
  ];

  if (ctx.conversationHistory && ctx.conversationHistory.length > 0) {
    // Cap at 20 most recent turns to keep ephemeral context small.
    // Filter out any assistant-only turns at the start — some models
    // reject conversations that begin with an assistant message.
    const history = ctx.conversationHistory.slice(-20);
    const firstUserIdx = history.findIndex((m) => m.role === "user");
    const trimmed = firstUserIdx > 0 ? history.slice(firstUserIdx) : history;
    if (trimmed.length > 0) {
      messages.push(...trimmed);
    }
  }

  messages.push({ role: "user", content: ctx.userMessage });

  return messages;
}

/**
 * Detect welfare signal patterns at the application layer.
 * The LLM also handles welfare per its system prompt; this is a belt-
 * and-braces check that runs FIRST so the platform can flag the session
 * even if the LLM misses the cue.
 */
export const WELFARE_PATTERNS: RegExp[] = [
  /can'?t\s+(make\s+myself\s+)?pray/i,
  /haven'?t\s+been\s+able\s+to\s+(pray|read\s+quran)/i,
  /don'?t\s+see\s+the\s+point/i,
  /allah\s+doesn'?t\s+hear/i,
  /nobody\s+i\s+can\s+talk\s+to/i,
  /completely\s+alone/i,
  /want\s+to\s+(die|end|disappear|give\s+up)/i,
  /self[- ]?harm/i,
  /hurt\s+myself/i,
  /can'?t\s+go\s+on/i,
  /no\s+way\s+out/i,
  /forced\s+(to|into)/i,
  /\b(suicidal|suicide|kill\s+myself)\b/i,
];

export function detectWelfareSignal(text: string): boolean {
  return WELFARE_PATTERNS.some((p) => p.test(text));
}
