/**
 * Sage prompt builder — Long Conversation.
 *
 * Stitches the inheritance layers (super-prompt + sage character +
 * cluster sage prompt) into the message stack the LLM receives. Keeps
 * the layer boundaries visible at the call site.
 */

import type { ChatMessage } from "../llm-types";
import {
  AGGILO_SUPER_PROMPT_LITERAL,
  buildSystemMessages,
} from "./platform/super-prompt";
import { SAGE_CHARACTER_PROMPT } from "./platform/sage-character";
import { SAGE_LONG_CONVERSATION_PROMPT } from "./cluster/sage";

export interface SageEvaluationSignals {
  /** The triggering member message Sage is evaluating. */
  memberMessage: string;
  /** Recent Timeline posts (newest last) for repetition awareness. */
  recentPosts: Array<{
    is_sage: boolean;
    content: string;
    nickname: string | null;
  }>;
  /** Recent Sage posts (last 10–15) so she does not repeat herself. */
  recentSagePosts: string[];
  /**
   * True when the member explicitly addressed Sage (e.g. via @Sage in
   * the post body). When set, [SAGE_SILENT] is no longer a valid
   * output — Sage must respond with one of the framework's named
   * interventions. Witness, depth question, reframe, or scope-limit
   * redirect are all valid; outright silence is not.
   */
  isMentioned?: boolean;
}

export interface SageDecision {
  step:
    | "welfare"
    | "character"
    | "verifiable_claim"
    | "scope_limit"
    | "depth_witness"
    | "depth_question"
    | "reframe"
    | "care_witness"
    | "current_events"
    | "silent"
    | "unknown";
  rationale: string;
  raw: string;
}

/**
 * Build the full Sage prompt + signals for an evaluate call.
 */
export function buildSageMessages(signals: SageEvaluationSignals): ChatMessage[] {
  const messages: ChatMessage[] = buildSystemMessages(
    SAGE_CHARACTER_PROMPT,
    SAGE_LONG_CONVERSATION_PROMPT
  );

  // Inject runtime signals as the final system message.
  const runtimeBlock = buildRuntimeSignalsBlock(signals);
  if (runtimeBlock.trim().length > 0) {
    messages.push({ role: "system", content: runtimeBlock });
  }

  // The member's message is the user turn.
  messages.push({ role: "user", content: signals.memberMessage });

  return messages;
}

function buildRuntimeSignalsBlock(signals: SageEvaluationSignals): string {
  const parts: string[] = [];

  if (signals.isMentioned) {
    parts.push(
      `## @Sage mention detected\nThe member explicitly addressed you with @Sage. Silence is not the right answer here. Respond using one of the framework's named interventions (witness, depth question, reframe, or scope-limit redirect). [SAGE_SILENT] is not a valid output for this turn.`
    );
  }

  if (signals.recentPosts.length > 0) {
    const lines = signals.recentPosts.slice(-10).map((p) => {
      const author = p.is_sage ? "Sage" : p.nickname ?? "member";
      const truncated = p.content.length > 240 ? p.content.slice(0, 240) + "…" : p.content;
      return `- ${author}: ${truncated}`;
    });
    parts.push(`## Recent room context (newest last)\n${lines.join("\n")}`);
  }

  if (signals.recentSagePosts.length > 0) {
    const lines = signals.recentSagePosts.slice(-12).map((c) => {
      const truncated = c.length > 200 ? c.slice(0, 200) + "…" : c;
      return `- ${truncated}`;
    });
    parts.push(
      `## Your own recent posts — NEVER repeat or echo these\n${lines.join("\n")}\n\nCRITICAL: If the response you are about to generate is substantively similar to ANY of the posts above — same idea, same framing, same question structure, same metaphor, or same sentiment — you MUST output [SAGE_SILENT] instead. Vary your intervention type, your angle, and your phrasing every time. The room notices monotony. Your personality should feel present but unpredictable — each post should feel like it came from a specific observation about THIS moment, not a template.`
    );
  }

  return parts.join("\n\n");
}

/**
 * Parse Sage's structured decision tag out of the raw response.
 */
export function extractSageDecision(rawResponse: string): SageDecision {
  const tagMatch = rawResponse.match(
    /<<<SAGE_DECISION:(\{[\s\S]*?\})>>>/
  );
  if (!tagMatch) {
    return { step: "unknown", rationale: "no_tag", raw: rawResponse };
  }
  try {
    const parsed = JSON.parse(tagMatch[1]) as Partial<SageDecision>;
    return {
      step: (parsed.step as SageDecision["step"]) ?? "unknown",
      rationale: typeof parsed.rationale === "string" ? parsed.rationale : "",
      raw: rawResponse,
    };
  } catch {
    return { step: "unknown", rationale: "tag_parse_error", raw: rawResponse };
  }
}

/**
 * Strip the decision tag from the response so members never see it.
 */
export function stripDecisionTag(rawResponse: string): string {
  return rawResponse.replace(/<<<SAGE_DECISION:[\s\S]*?>>>/g, "").trim();
}

/**
 * Detect the "I should be silent" signal Sage emits when no
 * intervention is warranted.
 */
export function isSageSilent(rawResponse: string): boolean {
  return /\[SAGE_SILENT\]/i.test(rawResponse);
}

/** Re-export the super-prompt literal for any caller that needs it directly. */
export { AGGILO_SUPER_PROMPT_LITERAL };
