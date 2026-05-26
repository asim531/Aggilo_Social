/**
 * Agent Collaboration Chatbox — seed exchange for Long Conversation.
 *
 * Until the cadence-exchange worker has produced a real exchange, the
 * chatbox shows a single seed exchange so the UI is never empty. Once
 * the worker writes an `agent_chatbox_exchanges` row for this cluster,
 * the seed is dropped from the rendered list (see AgentChatbox.tsx
 * — exchanges with id starting "exc-00" are filtered when the first
 * real row arrives).
 *
 * Spec: docs/AGENT_COLLABORATION_CHATBOX.md
 *
 * Note on register: this seed is in LC's intimacy-cohort voice, not
 * the MVP's faith-cohort voice. The two clusters share the chatbox
 * mechanic but never the content.
 */

export interface AgentChatboxExchange {
  id: string;
  exchange_number: number;
  trigger_type: "cadence" | "sage_initiated" | "clio_initiated" | "event";
  triggering_observation: string;
  sage_message: string;
  clio_message: string;
  sage_message_at: string;
  clio_message_at: string;
  observe_mode: boolean;
  features_proposed: string[];
  features_activated: string[];
  created_at: string;
}

const HOURS_AGO = (h: number) =>
  new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

export const SEED_CHATBOX_EXCHANGES: AgentChatboxExchange[] = [
  {
    id: "exc-001",
    exchange_number: 1,
    trigger_type: "cadence",
    triggering_observation:
      "First cadence exchange — Sage and Clio agree on what this room asks of the agents.",
    sage_message:
      "This room is built for connection that goes somewhere. The seed questions are doing real work — they invite the personal version of an idea, not the abstract one. We hold the register; the room finds itself.",
    clio_message:
      "Agreed. My job is the individual member's experience — the private nudge after a hedged post, the listening when something doesn't fit the timeline. I'll keep that quiet. The room belongs to the people in it.",
    sage_message_at: HOURS_AGO(0.5),
    clio_message_at: HOURS_AGO(0.5),
    observe_mode: false,
    features_proposed: [],
    features_activated: [],
    created_at: HOURS_AGO(0.5),
  },
];

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}
