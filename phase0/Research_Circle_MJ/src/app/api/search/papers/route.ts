/**
 * POST /api/search/papers
 *
 * Hybrid paper search: semantic (pgvector) + text fallback.
 * Generates a query embedding server-side, runs semantic search,
 * and falls back to text-based search_papers if no embeddings match.
 *
 * Body: { query: string, limit?: number }
 * Response: { results: PaperSearchResult[] }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { llmEmbedding } from "@/lib/llm";
import { CLUSTER_ID } from "@/lib/cluster";

export interface PaperSearchResult {
  id: string;
  file_name: string;
  doc_title: string | null;
  doc_summary: string | null;
  similarity: number;
  source: "semantic" | "text";
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { query, limit = 10 } = (await request.json()) as {
      query: string;
      limit?: number;
    };

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    let results: PaperSearchResult[] = [];

    // ── 1. Try semantic search first ────────────────────────────
    try {
      const embedding = await llmEmbedding(query);
      const { data: semanticRows, error: semanticErr } = await supabase.rpc(
        "search_papers_semantic",
        {
          p_cluster_id: CLUSTER_ID,
          p_query_embedding: JSON.stringify(embedding),
          p_limit: limit,
          p_min_similarity: 0.5,
        }
      );

      if (!semanticErr && semanticRows && semanticRows.length > 0) {
        results = semanticRows.map((row: any) => ({
          id: row.id,
          file_name: row.file_name,
          doc_title: row.doc_title,
          doc_summary: row.doc_summary,
          similarity: row.similarity,
          source: "semantic" as const,
        }));
      }
    } catch (semanticError) {
      console.warn("[search/papers] semantic search failed:", semanticError instanceof Error ? semanticError.message : String(semanticError));
    }

    // ── 2. Fall back to text search if semantic returned nothing ──
    if (results.length === 0) {
      const { data: textRows, error: textErr } = await supabase.rpc(
        "search_papers",
        {
          p_cluster_id: CLUSTER_ID,
          p_query: query,
          p_limit: limit,
        }
      );

      if (!textErr && textRows) {
        results = textRows.map((row: any) => ({
          id: row.id,
          file_name: row.file_name,
          doc_title: row.doc_title,
          doc_summary: row.doc_summary,
          similarity: row.similarity,
          source: "text" as const,
        }));
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.warn("[search/papers] error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
