/**
 * Analysis worker — core logic extracted from /api/upload/analyze
 * so the upload route can call it directly without an HTTP hop.
 * Deploy trigger: 2026-06-08
 *
 * This eliminates a whole class of Vercel serverless failures:
 * - the /api/upload route timing out while waiting for a child HTTP call
 * - the child HTTP call 404-ing because of missing basePath
 * - cold-start latency doubling function time
 */

import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import { llmCall } from "@/lib/llm";
import { buildCimMessages } from "@/lib/prompts/content-intelligence";
import { buildMetadataExtractPrompt } from "@/lib/prompts/white-paper/metadata-extract";
import { withBasePath } from "@/lib/path";
import { runAnalyzeStep } from "@/lib/analyze-step-worker";
import type { PostAttachment } from "@/lib/types";

// Build the public URL for triggering the next step in the chain.
// Vercel rewrites from mvp.aggilo.in, so we hardcode the public origin.
function getAnalyzeStepUrl(): string {
  const origin = process.env.VERCEL_URL
    ? `https://mvp.aggilo.in`
    : "http://localhost:3002";
  return `${origin}${withBasePath("/api/upload/analyze-step")}`;
}

export async function runAnalysis(
  attachmentId: string
): Promise<{ outcome: string; doc_type?: string }> {
  console.log("[analysis-worker] starting for attachment:", attachmentId);

  const admin = createAdminClient();

  // ── 1. Fetch attachment ──────────────────────────────────────
  const { data: rawAtt, error: attErr } = await admin
    .from("post_attachments")
    .select("*")
    .eq("id", attachmentId)
    .eq("cluster_id", CLUSTER_ID)
    .single();

  if (attErr || !rawAtt) {
    console.warn("[analysis-worker] attachment not found:", attErr?.message);
    throw new Error("attachment not found");
  }

  const attachment = rawAtt as PostAttachment;

  // Only analyze PDFs for now
  if (attachment.file_type !== "application/pdf") {
    await admin
      .from("post_attachments")
      .update({ doc_type: "document", extracted_at: new Date().toISOString() })
      .eq("id", attachmentId);
    return { outcome: "skipped_non_pdf" };
  }

  // ── 2. Extract text ─────────────────────────────────────────
  let extractedText: string;
  try {
    extractedText = await extractTextFromPdf(attachment.storage_path);
    console.log("[analysis-worker] extracted", extractedText.length, "chars from PDF");
  } catch (err) {
    console.warn(
      "[analysis-worker] PDF extraction failed:",
      err instanceof Error ? err.message : String(err)
    );
    await admin
      .from("post_attachments")
      .update({ doc_type: "unknown", extracted_at: new Date().toISOString() })
      .eq("id", attachmentId);
    return { outcome: "extraction_failed" };
  }

  // Mark as extracted immediately so the UI doesn't stay stuck
  await admin
    .from("post_attachments")
    .update({
      extracted_text: extractedText,
      extracted_at: new Date().toISOString(),
      doc_type: "processing",
    })
    .eq("id", attachmentId);

  // ── 3. CIM classification ─────────────────────────────────────
  let docType: string;
  let docTitle: string | null;

  try {
    console.time("[analysis-worker] cim_classify");
    const messages = buildCimMessages(extractedText, attachment.file_name);
    const llmRes = await llmCall({
      messages,
      operationKey: "cim_classify",
      temperature: 0.3,
      maxTokens: 400,
      responseFormat: { type: "json_object" },
    });
    console.timeEnd("[analysis-worker] cim_classify");

    const cimResult = JSON.parse(llmRes.content) as {
      doc_type: string;
      doc_title: string | null;
      confidence: number;
    };

    if (cimResult.doc_type !== "unknown" && (cimResult.confidence ?? 0) >= 0.5) {
      docType = cimResult.doc_type;
      docTitle = cimResult.doc_title ?? null;
      console.log(
        "[analysis-worker] LLM classified:",
        docType,
        "confidence:",
        cimResult.confidence
      );
    } else {
      throw new Error("llm_uncertain");
    }
  } catch (err) {
    console.warn(
      "[analysis-worker] CIM LLM failed, using filename heuristics:",
      err instanceof Error ? err.message : String(err)
    );
    const name = attachment.file_name.toLowerCase();
    const researchKeywords = [
      "paper", "research", "study", "thesis", "dissertation", "journal",
      "arxiv", "survey", "review", "analysis", "report", "findings", "methodology",
    ];
    const isResearch = researchKeywords.some((kw) => name.includes(kw));
    docType = isResearch ? "research_paper" : "document";
    docTitle = attachment.file_name.replace(/\.[^.]+$/, ""); // strip extension
  }

  const isResearchPaper = docType === "research_paper";

  // ── 4. Extract bibliographic metadata (best-effort) ─────────
  let metaResult: {
    authors?: string[] | null;
    venue?: string | null;
    year?: string | null;
    doi?: string | null;
    abstract?: string | null;
    keywords?: string[] | null;
  } = {};
  try {
    console.time("[analysis-worker] metadata_extract");
    const metaMessages = buildMetadataExtractPrompt(extractedText, attachment.file_name);
    const metaLLM = await llmCall({
      messages: metaMessages,
      operationKey: "metadata_extract",
      temperature: 0.3,
      maxTokens: 800,
      responseFormat: { type: "json_object" },
    });
    console.timeEnd("[analysis-worker] metadata_extract");
    metaResult = JSON.parse(metaLLM.content);
    console.log("[analysis-worker] metadata extracted:", metaResult);
  } catch (err) {
    console.warn(
      "[analysis-worker] metadata extraction failed:",
      err instanceof Error ? err.message : String(err)
    );
  }

  // ── 5. Update attachment metadata ────────────────────────────
  console.log(
    "[analysis-worker] updating attachment:",
    attachmentId,
    "isResearchPaper:",
    isResearchPaper
  );
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
    .eq("id", attachmentId);

  if (updateErr) {
    console.error("[analysis-worker] attachment update FAILED:", updateErr.message);
  } else {
    console.log("[analysis-worker] attachment updated OK");
  }

  if (!isResearchPaper) {
    console.log("[analysis-worker] classified as non-research:", docType, "— skipping tools");
    return { outcome: "classified_non_research", doc_type: docType };
  }

  // ── 6. Start chunked deep analysis ───────────────────────────
  await admin
    .from("post_attachments")
    .update({
      doc_type: "processing",
      white_paper_tools_enabled: false,
      analysis_progress: { steps: {}, current_step: "embedding", completed: 0, total: 14 },
    })
    .eq("id", attachmentId);

  console.log("[analysis-worker] awaiting embedding step inline...");
  const analyzeStepUrl = getAnalyzeStepUrl();
  try {
    const stepResult = await runAnalyzeStep({
      attachment_id: attachmentId,
      step: "embedding",
      triggerUrl: analyzeStepUrl,
    });
    console.log("[analysis-worker] embedding step done:", stepResult);
  } catch (err) {
    console.error("[analysis-worker] embedding step failed:", err);
  }

  return { outcome: "chunked_analysis_started", doc_type: "processing" };
}
