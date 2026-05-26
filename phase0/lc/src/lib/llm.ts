/**
 * LLM client — OpenAI-compatible chat completions.
 *
 * Used by Sage and Clio API routes. Supports a primary provider with
 * an optional fallback. Returns the raw assistant content; callers
 * are responsible for parsing structured tags or stripping markers.
 */

import type { ChatMessage } from "./llm-types";

interface LLMCallOptions {
  messages: ChatMessage[];
  /** Model override. Defaults to LLM_MODEL env var. */
  model?: string;
  /** Temperature. Defaults to 0.6 for Sage, set lower for deterministic. */
  temperature?: number;
  /** Max tokens to generate. Defaults to 400. */
  maxTokens?: number;
  /** Caller identifier for logging (e.g. "sage_review", "clio_chat"). */
  operationKey?: string;
}

export interface LLMCallResult {
  content: string;
  provider: "primary" | "fallback";
  model: string;
  durationMs: number;
}

const PRIMARY = {
  baseUrl: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY,
  model: process.env.LLM_MODEL,
};

const FALLBACK = {
  baseUrl: process.env.LLM_FALLBACK_BASE_URL,
  apiKey: process.env.LLM_FALLBACK_API_KEY,
  model: process.env.LLM_FALLBACK_MODEL,
};

async function callProvider(
  baseUrl: string,
  apiKey: string,
  model: string,
  options: LLMCallOptions
): Promise<{ content: string; durationMs: number }> {
  const start = Date.now();
  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.6,
      max_tokens: options.maxTokens ?? 400,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`LLM HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content ?? "";
  return { content, durationMs: Date.now() - start };
}

/**
 * Call the primary LLM, falling back to the secondary on failure if
 * configured.
 */
export async function llmCall(options: LLMCallOptions): Promise<LLMCallResult> {
  if (!PRIMARY.baseUrl || !PRIMARY.apiKey || !PRIMARY.model) {
    throw new Error(
      "Primary LLM is not configured. Set LLM_BASE_URL, LLM_API_KEY, LLM_MODEL."
    );
  }

  try {
    const result = await callProvider(
      PRIMARY.baseUrl,
      PRIMARY.apiKey,
      options.model ?? PRIMARY.model,
      options
    );
    return {
      content: result.content,
      provider: "primary",
      model: options.model ?? PRIMARY.model,
      durationMs: result.durationMs,
    };
  } catch (primaryError) {
    if (FALLBACK.baseUrl && FALLBACK.apiKey && FALLBACK.model) {
      try {
        const result = await callProvider(
          FALLBACK.baseUrl,
          FALLBACK.apiKey,
          FALLBACK.model,
          options
        );
        return {
          content: result.content,
          provider: "fallback",
          model: FALLBACK.model,
          durationMs: result.durationMs,
        };
      } catch (fallbackError) {
        throw new Error(
          `LLM primary and fallback both failed. Primary: ${
            primaryError instanceof Error ? primaryError.message : String(primaryError)
          }. Fallback: ${
            fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
          }`
        );
      }
    }
    throw primaryError;
  }
}
