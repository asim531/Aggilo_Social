/**
 * LLM type definitions used by the prompt builders.
 * Kept minimal — only what's needed for the OpenAI-compatible chat
 * completions API.
 */

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}
