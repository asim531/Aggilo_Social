/**
 * Text chunking utility for large-document analysis.
 * Splits on paragraph boundaries when possible, falls back to
 * sentence boundaries, then fixed-length split as last resort.
 *
 * Default maxChars = 8000 (~2000 tokens, safe for most LLMs).
 */

export function chunkText(text: string, maxChars = 8000): string[] {
  if (!text || text.length === 0) return [];
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  let remaining = text;

  // Strategy 1: split on double-newline (paragraph) boundaries
  while (remaining.length > maxChars) {
    let splitIndex = findBestSplitIndex(remaining, maxChars);

    if (splitIndex <= 0) {
      // No good boundary found — force split at maxChars
      splitIndex = maxChars;
    }

    chunks.push(remaining.slice(0, splitIndex).trim());
    remaining = remaining.slice(splitIndex).trimStart();
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks;
}

function findBestSplitIndex(text: string, maxChars: number): number {
  // Look backwards from maxChars for paragraph boundary
  const searchStart = Math.min(maxChars, text.length);
  let idx = text.lastIndexOf("\n\n", searchStart);
  if (idx > maxChars * 0.5) return idx;

  // Fallback: single newline
  idx = text.lastIndexOf("\n", searchStart);
  if (idx > maxChars * 0.5) return idx;

  // Fallback: sentence boundary (. ? ! followed by space)
  const sentenceRegex = /[.!?] +/g;
  let best = -1;
  let match;
  while ((match = sentenceRegex.exec(text)) !== null) {
    if (match.index + match[0].length > maxChars) break;
    best = match.index + match[0].length;
  }
  if (best > maxChars * 0.5) return best;

  // Fallback: word boundary
  idx = text.lastIndexOf(" ", searchStart);
  if (idx > maxChars * 0.5) return idx;

  return -1;
}
