/**
 * POST /api/upload/analyze
 *
 * Background worker triggered after a file upload completes.
 * Fire-and-forget from /api/upload/route.ts.
 *
 * Flow:
 *   1. Fetch the attachment row from post_attachments.
 *   2. If it's a PDF, extract text using pdfjs-dist.
 *   3. Call LLM (CIM) to classify doc_type + infer title + summary.
 *   4. If classified as research_paper:
 *        - set white_paper_tools_enabled = true
 *        - create default discussion tags (#summary, #methodology, #limitations)
 *        - generate diagrams (4 types)
 *        - run all 5 decomposition passes
 *        - post a Sage reply announcing the tools
 *   5. Update the attachment row with extracted metadata.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import { llmCall } from "@/lib/llm";
import { buildCimMessages } from "@/lib/prompts/content-intelligence";
import { buildMetadataExtractPrompt } from "@/lib/prompts/white-paper/metadata-extract";
import type { PostAttachment } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { attachment_id } = (await request.json()) as { attachment_id?: string };
    if (!attachment_id) {
      return NextResponse.json({ error: "attachment_id required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // ── 1. Fetch attachment ──────────────────────────────────────
    const { data: rawAtt, error: attErr } = await admin
      .from("post_attachments")
      .select("*")
      .eq("id", attachment_id)
      .eq("cluster_id", CLUSTER_ID)
      .single();

    if (attErr || !rawAtt) {
      console.warn("[analyze] attachment not found:", attErr?.message);
      return NextResponse.json({ error: "attachment not found" }, { status: 404 });
    }

    const attachment = rawAtt as PostAttachment;

    // Only analyze PDFs for now
    if (attachment.file_type !== "application/pdf") {
      await admin
        .from("post_attachments")
        .update({ doc_type: "document", extracted_at: new Date().toISOString() })
        .eq("id", attachment_id);
      return NextResponse.json({ outcome: "skipped_non_pdf" });
    }

    // ── 2. Extract text ─────────────────────────────────────────
    let extractedText: string;
    try {
      extractedText = await extractTextFromPdf(attachment.storage_path);
      console.log("[analyze] extracted", extractedText.length, "chars from PDF");
    } catch (err) {
      console.warn("[analyze] PDF extraction failed:", err instanceof Error ? err.message : String(err));
      await admin
        .from("post_attachments")
        .update({ doc_type: "unknown", extracted_at: new Date().toISOString() })
        .eq("id", attachment_id);
      return NextResponse.json({ outcome: "extraction_failed" });
    }

    // CRITICAL: mark as extracted immediately so the UI doesn't stay stuck
    // on "Analyzing" if later LLM calls time out on Vercel Hobby (10s limit)
    await admin
      .from("post_attachments")
      .update({ extracted_text: extractedText, extracted_at: new Date().toISOString(), doc_type: "processing" })
      .eq("id", attachment_id);

    // ── 3. CIM classification ─────────────────────────────────────
    // Try LLM first, fall back to filename heuristics (handles LLM 404)
    let docType: string;
    let docTitle: string | null;

    try {
      const messages = buildCimMessages(extractedText, attachment.file_name);
      const llmRes = await llmCall({
        messages,
        operationKey: "cim_classify",
        temperature: 0.3,
        maxTokens: 400,
        responseFormat: { type: "json_object" },
      });
      const cimResult = JSON.parse(llmRes.content) as {
        doc_type: string;
        doc_title: string | null;
        confidence: number;
      };
      // Accept LLM result only if confident and not unknown
      if (cimResult.doc_type !== "unknown" && (cimResult.confidence ?? 0) >= 0.5) {
        docType = cimResult.doc_type;
        docTitle = cimResult.doc_title ?? null;
        console.log("[analyze] LLM classified:", docType, "confidence:", cimResult.confidence, "title:", docTitle);
      } else {
        console.warn("[analyze] LLM uncertain:", cimResult.doc_type, "confidence:", cimResult.confidence, "— using filename heuristics");
        throw new Error("llm_uncertain");
      }
    } catch (err) {
      console.warn("[analyze] CIM LLM failed, using filename heuristics:", err instanceof Error ? err.message : String(err));
      // Fallback: keyword-based classification from filename
      const name = attachment.file_name.toLowerCase();
      const researchKeywords = ["paper", "research", "study", "thesis", "dissertation", "journal", "arxiv", "survey", "review", "analysis", "report", "findings", "methodology"];
      const isResearch = researchKeywords.some((kw) => name.includes(kw));
      docType = isResearch ? "research_paper" : "document";
      docTitle = attachment.file_name.replace(/\.[^.]+$/, ""); // strip extension
    }

    const isResearchPaper = docType === "research_paper";

    // ── 4. Extract bibliographic metadata (best-effort) ─────────
    let metaResult: { authors?: string[] | null; venue?: string | null; year?: string | null; doi?: string | null; abstract?: string | null; keywords?: string[] | null } = {};
    try {
      const metaMessages = buildMetadataExtractPrompt(extractedText, attachment.file_name);
      const metaLLM = await llmCall({
        messages: metaMessages,
        operationKey: "metadata_extract",
        temperature: 0.3,
        maxTokens: 800,
        responseFormat: { type: "json_object" },
      });
      metaResult = JSON.parse(metaLLM.content);
      console.log("[analyze] metadata extracted:", metaResult);
    } catch (err) {
      console.warn("[analyze] metadata extraction failed:", err instanceof Error ? err.message : String(err));
    }

    // ── 5. Update attachment metadata ────────────────────────────
    console.log("[analyze] updating attachment:", attachment_id, "isResearchPaper:", isResearchPaper, "docType:", docType);
    const { error: updateErr } = await admin
      .from("post_attachments")
      .update({
        extracted_text: extractedText,
        doc_type: docType,
        doc_title: docTitle,
        doc_summary: metaResult.abstract ?? null,
        authors: metaResult.authors ?? null,
        venue: metaResult.venue ?? null,
        year: metaResult.year ?? null,
        doi: metaResult.doi ?? null,
        abstract: metaResult.abstract ?? null,
        keywords: metaResult.keywords ?? null,
        white_paper_tools_enabled: isResearchPaper,
        extracted_at: new Date().toISOString(),
      })
      .eq("id", attachment_id);

    if (updateErr) {
      console.error("[analyze] attachment update FAILED:", updateErr.message, updateErr.details);
    } else {
      console.log("[analyze] attachment updated OK — white_paper_tools_enabled:", isResearchPaper);
    }

    if (!isResearchPaper) {
      console.log("[analyze] classified as non-research:", docType, "— skipping analysis tools");
      return NextResponse.json({ outcome: "classified_non_research", doc_type: docType });
    }

    // ── 6. Start chunked deep analysis ───────────────────────────
    // Vercel Hobby = 10s function limit. Long papers blow past that.
    // Solution: chain multiple analyze-step calls, each with its own 10s budget.
    const origin = new URL(request.url).origin;
    await admin
      .from("post_attachments")
      .update({
        doc_type: "processing",
        white_paper_tools_enabled: false,
        analysis_progress: { current_step: "embedding", completed: 0, total: 14 },
      })
      .eq("id", attachment_id);

    void fetch(`${origin}/api/upload/analyze-step`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attachment_id, step: "embedding" }),
    }).catch(() => {});

    console.log("[analyze] kicked off chunked deep analysis for attachment:", attachment_id);
    return NextResponse.json({ outcome: "chunked_analysis_started", doc_type: "processing" });
  } catch (err) {
    console.warn(
      "[analyze] unexpected error:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json({ outcome: "error" }, { status: 500 });
  }
}
