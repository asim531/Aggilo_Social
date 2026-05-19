/**
 * Resilient LLM fetch with exponential backoff.
 *
 * NVIDIA NIM free tier: 40 RPM, but burst limits can cause 429s when
 * multiple endpoints fire simultaneously on cluster mount. This wrapper
 * retries up to 3 times with jittered backoff before giving up.
 *
 * Used by all Clio endpoints (chat, ephemeral). Sage endpoints are
 * fire-and-forget so they handle their own errors silently.
 */

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1500; // 1.5s base — stays well under 40 RPM

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

      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);

      // 429 rate-limited — wait and retry
      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        const waitMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500;
        console.warn(`[llmFetch] 429 rate-limited, waiting ${Math.round(waitMs)}ms (attempt ${attempt + 1})`);
        await sleep(waitMs);
        continue;
      }

      // 5xx server error — retry with backoff (except on last attempt)
      if (res.status >= 500 && attempt < MAX_RETRIES - 1) {
        console.warn(`[llmFetch] ${res.status} server error, retrying (attempt ${attempt + 1})`);
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 300);
        continue;
      }

      // Log non-200 responses for debugging
      if (!res.ok) {
        console.warn(`[llmFetch] Non-OK response: ${res.status} (attempt ${attempt + 1})`);
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
