/**
 * Clio prompt builder — Long Conversation.
 *
 * Two modes:
 *   - Cluster mode: Clio inside a cluster, with timeline_state context.
 *   - Ephemeral mode: Clio in a private FAB session, no cluster context.
 *
 * Both modes inherit super-prompt + Clio character. Cluster mode adds
 * the cluster context fragment. Ephemeral mode adds the ephemeral
 * frame.
 */

import type { ChatMessage } from "../llm-types";
import { buildSystemMessages } from "./platform/super-prompt";
import {
  CLIO_CHARACTER_PROMPT,
  CLIO_WELFARE_RESPONSE_SHAPE,
  CLIO_EPHEMERAL_FRAME,
} from "./platform/clio-character";
import { CLIO_FOUNDING_FEEDBACK_FRAME } from "./platform/clio-founding-feedback";
import { CLIO_LONG_CONVERSATION_CONTEXT } from "./cluster/clio";

export interface ClioClusterSignals {
  /** The user's incoming message. */
  userMessage: string;
  /** Conversation history within this FAB session. */
  history: Array<{ role: "user" | "assistant"; content: string }>;
  /**
   * Timeline state — the last few public posts. Used by Clio to inform
   * her private FAB nudges and to answer "what's happening in here?"
   * questions. This is what makes the private tip mechanic possible:
   * Clio reads public posts and gives private nudges.
   */
  timelineState?: Array<{
    is_sage: boolean;
    content: string;
    nickname: string | null;
  }>;
}

export interface ClioEphemeralSignals {
  userMessage: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface ClioFoundingFeedbackSignals {
  userMessage: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  /**
   * Display name for the founding member. Used for analytics-style
   * context, not surfaced to Clio's prose. Optional.
   */
  founderNickname?: string | null;
}

/**
 * Build messages for cluster-mode Clio (inside the room, FAB chat).
 */
export function buildClioClusterMessages(
  signals: ClioClusterSignals
): ChatMessage[] {
  const messages: ChatMessage[] = buildSystemMessages(
    CLIO_CHARACTER_PROMPT,
    CLIO_LONG_CONVERSATION_CONTEXT
  );

  // Welfare response shape applies in cluster mode too.
  messages.push({ role: "system", content: CLIO_WELFARE_RESPONSE_SHAPE });

  // Inject timeline state if present.
  if (signals.timelineState && signals.timelineState.length > 0) {
    const lines = signals.timelineState.slice(-8).map((p) => {
      const author = p.is_sage ? "Sage" : p.nickname ?? "member";
      const truncated = p.content.length > 240 ? p.content.slice(0, 240) + "…" : p.content;
      return `- ${author}: ${truncated}`;
    });
    messages.push({
      role: "system",
      content: `## Recent public Timeline (read-only context for your private nudges)\n${lines.join(
        "\n"
      )}`,
    });
  }

  // Conversation history.
  for (const turn of signals.history) {
    messages.push({ role: turn.role, content: turn.content });
  }

  // Current user message.
  messages.push({ role: "user", content: signals.userMessage });

  return messages;
}

/**
 * Build messages for ephemeral-mode Clio (private channel, no cluster
 * surveillance, 12h TTL on client).
 */
export function buildClioEphemeralMessages(
  signals: ClioEphemeralSignals
): ChatMessage[] {
  const messages: ChatMessage[] = buildSystemMessages(
    CLIO_CHARACTER_PROMPT,
    CLIO_LONG_CONVERSATION_CONTEXT
  );

  messages.push({ role: "system", content: CLIO_EPHEMERAL_FRAME });
  messages.push({ role: "system", content: CLIO_WELFARE_RESPONSE_SHAPE });

  for (const turn of signals.history) {
    messages.push({ role: turn.role, content: turn.content });
  }

  messages.push({ role: "user", content: signals.userMessage });

  return messages;
}

/**
 * Build messages for founding-feedback-mode Clio.
 *
 * Used by /api/clio/founding-feedback. Single-shot session: one open
 * prompt from Clio, one response cycle, then close. Welfare detection
 * still applies — the API route runs the regex pre-filter before
 * building this stack.
 */
export function buildClioFoundingFeedbackMessages(
  signals: ClioFoundingFeedbackSignals
): ChatMessage[] {
  const messages: ChatMessage[] = buildSystemMessages(
    CLIO_CHARACTER_PROMPT,
    CLIO_LONG_CONVERSATION_CONTEXT
  );

  messages.push({ role: "system", content: CLIO_FOUNDING_FEEDBACK_FRAME });
  messages.push({ role: "system", content: CLIO_WELFARE_RESPONSE_SHAPE });

  // History is normally empty (this is a one-shot session) but we
  // pass it through so the prompt is robust to a multi-turn close
  // (e.g. member replies to acknowledgement — Clio should still
  // step back gracefully).
  for (const turn of signals.history) {
    messages.push({ role: turn.role, content: turn.content });
  }

  messages.push({ role: "user", content: signals.userMessage });

  return messages;
}
