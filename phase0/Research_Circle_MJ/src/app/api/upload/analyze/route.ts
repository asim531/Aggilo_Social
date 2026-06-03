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
import { llmCall, llmEmbedding } from "@/lib/llm";
import { buildCimMessages } from "@/lib/prompts/content-intelligence";
import { buildDiagramPrompt } from "@/lib/prompts/white-paper/diagram-prompt";
import {
  buildDecompositionPrompt,
  type DecompositionPass,
} from "@/lib/prompts/white-paper/decompose-prompts";
import { buildMetadataExtractPrompt } from "@/lib/prompts/white-paper/metadata-extract";
import { buildCitationExtractPrompt } from "@/lib/prompts/white-paper/citation-extract";
import type { PostAttachment } from "@/lib/types";

const DECOMPOSITION_PASSES: DecompositionPass[] = [
  "problem",
  "structure",
  "argument",
  "terminology",
  "gaps",
  "results",
  "compression",
];

const DIAGRAM_TYPES: Array<"concept_map" | "process_flow" | "architecture" | "argument_tree"> = [
  "concept_map",
  "process_flow",
  "architecture",
  "argument_tree",
];

const DEFAULT_TAGS = [
  { name: "#summary", color: "#2d6a4f" },
  { name: "#methodology", color: "#1d4ed8" },
  { name: "#limitations", color: "#b45309" },
  { name: "#discussion", color: "#7c3aed" },
];

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

    // ── 6. Generate embedding for semantic search ────────────────
    try {
      const embedding = await llmEmbedding(extractedText);
      await admin.from("paper_embeddings").insert({
        attachment_id,
        embedding: JSON.stringify(embedding),
      });
    } catch (err) {
      console.warn("[analyze] embedding generation failed:", err instanceof Error ? err.message : String(err));
    }

    // ── 7. Extract citations and link to existing papers ─────────
    try {
      const citeMessages = buildCitationExtractPrompt(extractedText);
      const citeLLM = await llmCall({
        messages: citeMessages,
        operationKey: "citation_extract",
        temperature: 0.3,
        maxTokens: 800,
        responseFormat: { type: "json_object" },
      });
      const citations = JSON.parse(citeLLM.content) as Array<{ title: string; context: string }>;
      if (citations.length > 0) {
        // Fetch all existing doc_titles and file_names in cluster
        const { data: existingDocs } = await admin
          .from("post_attachments")
          .select("id, doc_title, file_name")
          .eq("cluster_id", CLUSTER_ID)
          .neq("id", attachment_id);

        for (const cite of citations) {
          const cited = (existingDocs ?? []).find((d) => {
            const target = (d.doc_title || d.file_name || "").toLowerCase();
            return target.includes(cite.title.toLowerCase()) || cite.title.toLowerCase().includes(target);
          });
          if (cited) {
            await admin.from("paper_citations").insert({
              citing_attachment_id: attachment_id,
              cited_attachment_id: cited.id,
              mention_context: cite.context,
            });
          }
        }
      }
    } catch (err) {
      console.warn("[analyze] citation extraction failed:", err instanceof Error ? err.message : String(err));
    }

    // ── 8. Create default discussion tags ────────────────────────
    for (const tag of DEFAULT_TAGS) {
      await admin.from("paper_tags").insert({
        attachment_id,
        cluster_id: CLUSTER_ID,
        name: tag.name,
        color: tag.color,
      });
    }

    // ── 9. Generate diagrams (fire-and-forget, best-effort) ──────
    for (const diagramType of DIAGRAM_TYPES) {
      console.log("[analyze] generating diagram:", diagramType);
      try {
        const messages = buildDiagramPrompt({
          type: diagramType,
          extractedText,
          docTitle: docTitle,
        });
        const llmRes = await llmCall({
          messages,
          operationKey: `diagram_${diagramType}`,
          temperature: 0.4,
          maxTokens: 2500,
        });
        let svgData = llmRes.content;
        let caption: string | null = null;

        // Strip markdown code fences if present
        const fenceStripped = svgData
          .replace(/^```(?:json)?\s*/, "")
          .replace(/\s*```\s*$/, "");

        // If content starts with <svg, treat as raw SVG
        if (fenceStripped.trim().startsWith("<svg")) {
          svgData = fenceStripped.trim();
        } else {
          // Try to extract JSON object from the text
          const jsonMatch = fenceStripped.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]) as { svg?: string; caption?: string };
              if (parsed.svg) svgData = parsed.svg;
              if (parsed.caption) caption = parsed.caption;
            } catch {
              // Leave as raw content — will likely fail SVG render
            }
          }
        }

        // Skip storing if no valid SVG was produced
        if (!svgData.trim().startsWith("<svg")) {
          console.warn(`[analyze] diagram ${diagramType} returned non-SVG content, skipping`);
          continue;
        }
        await admin.from("paper_diagrams").insert({
          attachment_id,
          cluster_id: CLUSTER_ID,
          type: diagramType,
          title: `${docTitle ?? "Paper"} — ${diagramType.replace("_", " ")}`,
          svg_data: svgData,
          caption,
        });
      } catch (err) {
        console.warn(`[analyze] diagram ${diagramType} failed:`, err instanceof Error ? err.message : String(err));
      }
    }

    // ── 10. Run all 6 decomposition passes (cumulative context) ──
    const accumulatedPasses: Array<{ pass_type: string; title: string; content: string; key_points: string[] }> = [];
    for (const pass of DECOMPOSITION_PASSES) {
      console.log("[analyze] running decomposition pass:", pass);
      try {
        const messages = buildDecompositionPrompt(pass, extractedText, docTitle, accumulatedPasses);
        const llmRes = await llmCall({
          messages,
          operationKey: `decompose_${pass}`,
          temperature: 0.3,
          maxTokens: 1200,
          responseFormat: { type: "json_object" },
        });
        const result = JSON.parse(llmRes.content);
        await admin.from("paper_decompositions").insert({
          attachment_id,
          cluster_id: CLUSTER_ID,
          pass_type: pass,
          result_json: result,
        });
        // Accumulate for subsequent passes
        accumulatedPasses.push({
          pass_type: pass,
          title: result.title ?? pass,
          content: result.content ?? "",
          key_points: result.key_points ?? [],
        });
      } catch (err) {
        console.warn(`[analyze] decomposition ${pass} failed:`, err instanceof Error ? err.message : String(err));
      }
    }

    // ── 11. Sage notification removed ────────────────────────────
    // The welcome banner in PostCard handles this UX more cleanly.
    // A separate Sage reply saying "below" was confusing because the
    // analysis cards actually render above the reply thread.

    console.log("[analyze] complete — research_paper, attachment:", attachment_id);
    return NextResponse.json({ outcome: "analyzed", doc_type: "research_paper" });
  } catch (err) {
    console.warn(
      "[analyze] unexpected error:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json({ outcome: "error" }, { status: 500 });
  }
}
