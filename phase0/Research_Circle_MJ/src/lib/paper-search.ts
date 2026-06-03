/**
 * paper-search.ts — hybrid semantic + text search for research papers.
 * Calls the server-side /api/search/papers endpoint which handles
 * embedding generation and pgvector cosine similarity, falling back
 * to text search when embeddings are unavailable.
 */

export interface PaperSearchResult {
  id: string;
  file_name: string;
  doc_title: string | null;
  doc_summary: string | null;
  similarity: number;
  source?: "semantic" | "text";
}

/**
 * Search papers using hybrid semantic + text search.
 * The server generates a query embedding and tries pgvector first,
 * falling back to text-based search if no embeddings match.
 */
export async function semanticPaperSearch(
  clusterId: string,
  query: string,
  limit = 10
): Promise<PaperSearchResult[]> {
  try {
    const res = await fetch("/api/search/papers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit }),
    });
    if (!res.ok) {
      console.warn("[semanticPaperSearch] API error:", res.status);
      return [];
    }
    const json = (await res.json()) as { results?: PaperSearchResult[] };
    return json.results ?? [];
  } catch (err) {
    console.warn("[semanticPaperSearch] failed:", err instanceof Error ? err.message : String(err));
    return [];
  }
}
