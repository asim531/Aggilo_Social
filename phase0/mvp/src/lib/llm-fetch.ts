/**
 * Resilient LLM client with observability.
 *
 * Two surfaces:
 *
 *   llmFetch(url, options)  — low-level retry wrapper. Used by code that
 *     wants raw control over headers / streaming. Same signature as the
 *     pre-V3 helper.
 *
 *   llmCall({...})          — high-level call. Handles primary→fallback
 *     routing, parses tokens/cost, persists a row to llm_response_logs,
 *     and returns parsed JSON. Used by every Sage/Clio endpoint.
 *
 * Why this matters (Principle 7 + 2):
 *  - Token-max requires measurement. Every call writes its tokens, latency,
 *    cost estimate, and decision summary to llm_response_logs.
 *  - Closed loops require feedback. Each row links back to user_id and
 *    related_post_id when known, so the admin dashboard can correlate
 *    spend with outcomes.
 *  - Fallback is a P0 reliability requirement. NVIDIA NIM's 40 RPM ceiling
 *    is a single point of failure. On 429 / 5xx / timeout the request
 *    falls back to LLM_FALLBACK_* env vars if configured, and the row
 *    is stamped with fallback_used=true.
 *
 * Daily soft budget cap (LLM_DAILY_BUDGET_USD) prevents runaway loops.
 * When exceeded, llmCall returns a graceful "stepping back" placeholder
 * instead of hitting the LLM. Logged as decision_summary='budget_exceeded'.
 */

import { createHash } from "crypto";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1500;

// ── Cost estimation table (USD per 1M tokens, OpenAI-compatible models)
// These are conservative defaults. Replace with provider-published rates
// as you settle on production routing. NVIDIA NIM free tier is $0 but we
// still record the equivalent cost so the dashboard shows real value.
const COST_PER_1M_TOKENS: Record<string, { input: number; output: number }> = {
  // Kimi K2.5 via NVIDIA NIM (free tier — equivalent cost)
  "moonshotai/kimi-k2-5": { input: 0.6, output: 2.5 },
  "moonshot/kimi-k2-5": { input: 0.6, output: 2.5 },
  // DeepSeek
  "deepseek-ai/deepseek-r1": { input: 0.55, output: 2.19 },
  "deepseek-chat": { input: 0.27, output: 1.1 },
  // Llama 3 on Groq
  "llama3-8b-8192": { input: 0.05, output: 0.08 },
  "meta/llama-3.3-70b-instruct": { input: 0.59, output: 0.79 },
  // Default fallback if model not in table
  default: { input: 0.5, output: 1.5 },
};

function estimateCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const rates = COST_PER_1M_TOKENS[model] ?? COST_PER_1M_TOKENS.default;
  return (
    (promptTokens * rates.input) / 1_000_000 +
    (completionTokens * rates.output) / 1_000_000
  );
}

// ── Low-level retry wrapper ─────────────────────────────────────────
export async function llmFetch(
  url: string,
  options: RequestInit,
  timeoutMs = 45000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);

      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        const waitMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500;
        console.warn(`[llmFetch] 429 rate-limited, waiting ${Math.round(waitMs)}ms (attempt ${attempt + 1})`);
        await sleep(waitMs);
        continue;
      }

      if (res.status >= 500 && attempt < MAX_RETRIES - 1) {
        console.warn(`[llmFetch] ${res.status}, retrying (attempt ${attempt + 1})`);
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 300);
        continue;
      }

      if (!res.ok) {
        console.warn(`[llmFetch] Non-OK: ${res.status} (attempt ${attempt + 1})`);
      }

      return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[llmFetch] Fetch error (attempt ${attempt + 1}):`, lastError.message);
      if (attempt < MAX_RETRIES - 1) {
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt));
      }
    }
  }

  throw lastError ?? new Error("LLM fetch failed after retries");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── High-level call with observability + fallback ───────────────────

export interface LlmCallContext {
  agent: string;                 // 'sage' | 'clio' | 'cadence' | 'sage_dua_select' | etc.
  operationKey: string;          // 'sage_evaluate' | 'clio_chat' | etc.
  userId?: string | null;
  relatedPostId?: string | null;
  clusterId?: string | null;
}

export interface LlmCallOptions {
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" } | undefined;
  timeoutMs?: number;
}

export interface LlmCallResult {
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  model: string;
  fallbackUsed: boolean;
  costEstimateUsd: number;
  llmLogId: string | null;       // returned so the caller can link feedback
  status: "ok" | "error" | "budget_exceeded";
  errorMessage?: string;
}

interface LogPayload {
  agent: string;
  operation_key: string;
  model: string;
  base_url: string;
  fallback_used: boolean;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  http_status: number | null;
  decision_summary: string;
  error_message: string | null;
  user_id: string | null;
  related_post_id: string | null;
  cluster_id: string | null;
  cost_estimate_usd: number;
  prompt_hash: string;
}

async function persistLog(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  payload: LogPayload
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("llm_response_logs")
      .insert(payload)
      .select("id")
      .single();
    if (error) {
      console.warn("[llmCall] log insert failed:", error.message);
      return null;
    }
    return data?.id ?? null;
  } catch (err) {
    console.warn("[llmCall] log insert exception:", (err as Error).message);
    return null;
  }
}

async function checkDailyBudget(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<{ exceeded: boolean; spentUsd: number; budgetUsd: number }> {
  const budgetUsd = parseFloat(process.env.LLM_DAILY_BUDGET_USD ?? "5");
  const sinceUtc = new Date();
  sinceUtc.setUTCHours(0, 0, 0, 0);
  try {
    const { data } = await supabase
      .from("llm_response_logs")
      .select("cost_estimate_usd")
      .gte("created_at", sinceUtc.toISOString());
    const spentUsd = (data ?? []).reduce(
      (sum: number, row: { cost_estimate_usd: number }) =>
        sum + (Number(row.cost_estimate_usd) || 0),
      0
    );
    return { exceeded: spentUsd >= budgetUsd, spentUsd, budgetUsd };
  } catch {
    return { exceeded: false, spentUsd: 0, budgetUsd };
  }
}

interface CallAttempt {
  baseUrl: string;
  apiKey: string;
  model: string;
  isFallback: boolean;
}

function getProviders(): CallAttempt[] {
  const attempts: CallAttempt[] = [];
  if (process.env.LLM_BASE_URL && process.env.LLM_API_KEY && process.env.LLM_MODEL) {
    attempts.push({
      baseUrl: process.env.LLM_BASE_URL,
      apiKey: process.env.LLM_API_KEY,
      model: process.env.LLM_MODEL,
      isFallback: false,
    });
  }
  if (
    process.env.LLM_FALLBACK_BASE_URL &&
    process.env.LLM_FALLBACK_API_KEY &&
    process.env.LLM_FALLBACK_MODEL
  ) {
    attempts.push({
      baseUrl: process.env.LLM_FALLBACK_BASE_URL,
      apiKey: process.env.LLM_FALLBACK_API_KEY,
      model: process.env.LLM_FALLBACK_MODEL,
      isFallback: true,
    });
  }
  return attempts;
}

/**
 * The high-level LLM entry point. Use this for every Sage/Clio call.
 *
 * Pass a context (agent, operationKey, optional ids) and options (messages,
 * temperature, etc). Returns the model's content plus observability data,
 * including the llm_response_logs row id so the caller can link feedback.
 */
export async function llmCall(
  ctx: LlmCallContext,
  options: LlmCallOptions,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<LlmCallResult> {
  const startedAt = Date.now();
  const promptHash = createHash("sha256")
    .update(JSON.stringify(options.messages))
    .digest("hex")
    .substring(0, 64);

  // Budget guard — token-max with a floor
  const budget = await checkDailyBudget(supabase);
  if (budget.exceeded) {
    const logId = await persistLog(supabase, {
      agent: ctx.agent,
      operation_key: ctx.operationKey,
      model: process.env.LLM_MODEL ?? "unknown",
      base_url: process.env.LLM_BASE_URL ?? "unknown",
      fallback_used: false,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      latency_ms: Date.now() - startedAt,
      http_status: null,
      decision_summary: "budget_exceeded",
      error_message: `Daily LLM budget of $${budget.budgetUsd} reached (spent $${budget.spentUsd.toFixed(4)}).`,
      user_id: ctx.userId ?? null,
      related_post_id: ctx.relatedPostId ?? null,
      cluster_id: ctx.clusterId ?? null,
      cost_estimate_usd: 0,
      prompt_hash: promptHash,
    });
    return {
      content: "I'm stepping back for a little while — taking a moment to rest. Try again later.",
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      latencyMs: Date.now() - startedAt,
      model: process.env.LLM_MODEL ?? "unknown",
      fallbackUsed: false,
      costEstimateUsd: 0,
      llmLogId: logId,
      status: "budget_exceeded",
      errorMessage: "daily_budget_exceeded",
    };
  }

  const providers = getProviders();
  if (providers.length === 0) {
    const logId = await persistLog(supabase, {
      agent: ctx.agent,
      operation_key: ctx.operationKey,
      model: "unconfigured",
      base_url: "unconfigured",
      fallback_used: false,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      latency_ms: 0,
      http_status: null,
      decision_summary: "error",
      error_message: "LLM env vars not set",
      user_id: ctx.userId ?? null,
      related_post_id: ctx.relatedPostId ?? null,
      cluster_id: ctx.clusterId ?? null,
      cost_estimate_usd: 0,
      prompt_hash: promptHash,
    });
    return {
      content: "",
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      latencyMs: 0,
      model: "unconfigured",
      fallbackUsed: false,
      costEstimateUsd: 0,
      llmLogId: logId,
      status: "error",
      errorMessage: "llm_not_configured",
    };
  }

  let lastError: string | null = null;
  let lastStatus: number | null = null;

  for (const provider of providers) {
    const providerStart = Date.now();
    try {
      const body: Record<string, unknown> = {
        model: provider.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.5,
        max_tokens: options.maxTokens ?? 600,
      };
      if (options.responseFormat) body.response_format = options.responseFormat;

      const res = await llmFetch(
        `${provider.baseUrl}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${provider.apiKey}`,
          },
          body: JSON.stringify(body),
        },
        options.timeoutMs ?? 45000
      );

      if (!res.ok) {
        lastError = `LLM ${res.status}`;
        lastStatus = res.status;
        continue; // try next provider
      }

      const data: {
        choices?: Array<{ message: { content: string } }>;
        usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      } = await res.json();

      const content = data.choices?.[0]?.message?.content?.trim() ?? "";
      const promptTokens = data.usage?.prompt_tokens ?? 0;
      const completionTokens = data.usage?.completion_tokens ?? 0;
      const totalTokens = data.usage?.total_tokens ?? promptTokens + completionTokens;
      const latencyMs = Date.now() - providerStart;
      const costEstimateUsd = estimateCostUsd(provider.model, promptTokens, completionTokens);

      const logId = await persistLog(supabase, {
        agent: ctx.agent,
        operation_key: ctx.operationKey,
        model: provider.model,
        base_url: provider.baseUrl,
        fallback_used: provider.isFallback,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        latency_ms: latencyMs,
        http_status: res.status,
        decision_summary: content === "" ? "empty" : "responded",
        error_message: null,
        user_id: ctx.userId ?? null,
        related_post_id: ctx.relatedPostId ?? null,
        cluster_id: ctx.clusterId ?? null,
        cost_estimate_usd: costEstimateUsd,
        prompt_hash: promptHash,
      });

      return {
        content,
        promptTokens,
        completionTokens,
        totalTokens,
        latencyMs,
        model: provider.model,
        fallbackUsed: provider.isFallback,
        costEstimateUsd,
        llmLogId: logId,
        status: "ok",
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`[llmCall] provider ${provider.baseUrl} failed:`, lastError);
    }
  }

  // All providers failed
  const logId = await persistLog(supabase, {
    agent: ctx.agent,
    operation_key: ctx.operationKey,
    model: providers[providers.length - 1]?.model ?? "unknown",
    base_url: providers[providers.length - 1]?.baseUrl ?? "unknown",
    fallback_used: providers.length > 1,
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
    latency_ms: Date.now() - startedAt,
    http_status: lastStatus,
    decision_summary: "error",
    error_message: lastError ?? "all providers failed",
    user_id: ctx.userId ?? null,
    related_post_id: ctx.relatedPostId ?? null,
    cluster_id: ctx.clusterId ?? null,
    cost_estimate_usd: 0,
    prompt_hash: promptHash,
  });

  return {
    content: "",
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    latencyMs: Date.now() - startedAt,
    model: providers[providers.length - 1]?.model ?? "unknown",
    fallbackUsed: providers.length > 1,
    costEstimateUsd: 0,
    llmLogId: logId,
    status: "error",
    errorMessage: lastError ?? "all providers failed",
  };
}

/**
 * Update an existing log row's decision_summary after the caller has
 * decided what the model's output meant. Use sparingly — most calls
 * should set decision_summary at insert time. This is for cases where
 * the decision is computed downstream (e.g. "responded" → "silent" when
 * we detect [SAGE_SILENT] in the content).
 */
export async function updateLogDecision(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  llmLogId: string | null,
  decisionSummary: string
): Promise<void> {
  if (!llmLogId) return;
  try {
    await supabase
      .from("llm_response_logs")
      .update({ decision_summary: decisionSummary })
      .eq("id", llmLogId);
  } catch {
    // non-fatal
  }
}
