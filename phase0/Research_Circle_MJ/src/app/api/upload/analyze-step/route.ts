/**
 * POST /api/upload/analyze-step
 *
 * Processes ONE step of deep analysis for a research paper.
 * Chained from /api/upload/analyze — each step gets its own 10s Vercel budget.
 *
 * Steps: embedding → citations → diagrams (x4) → decomposition (x6) → tags → finalize
 * After each step completes, it triggers the next step until all are done.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";
import { llmCall, llmEmbedding } from "@/lib/llm";
import { buildDiagramPrompt } from "@/lib/prompts/white-paper/diagram-prompt";
import { buildDecompositionPrompt } from "@/lib/prompts/white-paper/decompose-prompts";
import { buildCitationExtractPrompt } from "@/lib/prompts/white-paper/citation-extract";
import { resolvePublicUrl } from "@/lib/path";

const STEPS = [
  "embedding",
  "citations",
  "diagram_concept_map",
  "diagram_process_flow",
  "diagram_architecture",
  "diagram_argument_tree",
  "decompose_problem",
  "decompose_structure",
  "decompose_argument",
  "decompose_terminology",
  "decompose_gaps",
  "decompose_results",
  "decompose_compression",
  "tags_and_finalize",
];

const DIAGRAM_TYPES: Array<"concept_map" | "process_flow" | "architecture" | "argument_tree"> = [
  "concept_map",
  "process_flow",
  "architecture",
  "argument_tree",
];

const DECOMPOSITION_PASSES = [
  "problem",
  "structure",
  "argument",
  "terminology",
  "gaps",
  "results",
  "compression",
];

const DEFAULT_TAGS = [
  { name: "#summary", color: "#2d6a4f" },
  { name: "#methodology", color: "#1d4ed8" },
  { name: "#limitations", color: "#b45309" },
  { name: "#discussion", color: "#7c3aed" },
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { attachment_id?: string; step?: string };
    const attachment_id = body.attachment_id;
    const currentStep = body.step ?? STEPS[0];

    if (!attachment_id) {
      return NextResponse.json({ error: "attachment_id required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Fetch attachment
    const { data: rawAtt, error: attErr } = await admin
      .from("post_attachments")
      .select("*")
      .eq("id", attachment_id)
      .eq("cluster_id", CLUSTER_ID)
      .single();

    if (attErr || !rawAtt) {
      console.warn("[analyze-step] attachment not found:", attErr?.message);
      return NextResponse.json({ error: "attachment not found" }, { status: 404 });
    }

    const att = rawAtt as any;
    const extractedText: string = att.extracted_text ?? "";
    const docTitle: string | null = att.doc_title ?? null;
    const fileName: string = att.file_name ?? "";

    const progress = (att.analysis_progress as any) ?? {};
    const steps: Record<string, boolean> = progress.steps ?? {};
    const stepIdx = STEPS.indexOf(currentStep);
    if (stepIdx === -1) {
      return NextResponse.json({ error: "invalid_step" }, { status: 400 });
    }

    // ── Execute current step ─────────────────────────────────────
    switch (currentStep) {
      case "embedding": {
        try {
          const embedding = await llmEmbedding(extractedText);
          await admin.from("paper_embeddings").insert({
            attachment_id,
            embedding: JSON.stringify(embedding),
          });
        } catch (err) {
          console.warn("[analyze-step] embedding failed:", err instanceof Error ? err.message : String(err));
        }
        break;
      }

      case "citations": {
        try {
          const messages = buildCitationExtractPrompt(extractedText);
          const citeLLM = await llmCall({
            messages,
            operationKey: "citation_extract",
            temperature: 0.3,
            maxTokens: 800,
            responseFormat: { type: "json_object" },
          });
          const citations = JSON.parse(citeLLM.content) as Array<{ title: string; context: string }>;
          if (citations.length > 0) {
            const { data: existingDocs } = await admin
              .from("post_attachments")
              .select("id, doc_title, file_name")
              .eq("cluster_id", CLUSTER_ID)
              .neq("id", attachment_id);
            for (const cite of citations) {
              const cited = (existingDocs ?? []).find((d: any) => {
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
          console.warn("[analyze-step] citation extraction failed:", err instanceof Error ? err.message : String(err));
        }
        break;
      }

      case "diagram_concept_map":
      case "diagram_process_flow":
      case "diagram_architecture":
      case "diagram_argument_tree": {
        const dType = currentStep.replace("diagram_", "") as typeof DIAGRAM_TYPES[number];
        try {
          const messages = buildDiagramPrompt({ type: dType, extractedText, docTitle });
          const llmRes = await llmCall({
            messages,
            operationKey: `diagram_${dType}`,
            temperature: 0.4,
            maxTokens: 2500,
          });
          let svgData = llmRes.content;
          let caption: string | null = null;
          const fenceStripped = svgData.replace(/^```(?:json)?\s*/, "").replace(/\s*```\s*$/, "");
          if (fenceStripped.trim().startsWith("<svg")) {
            svgData = fenceStripped.trim();
          } else {
            const jsonMatch = fenceStripped.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                const parsed = JSON.parse(jsonMatch[0]) as { svg?: string; caption?: string };
                if (parsed.svg) svgData = parsed.svg;
                if (parsed.caption) caption = parsed.caption;
              } catch {}
            }
          }
          if (svgData.trim().startsWith("<svg")) {
            await admin.from("paper_diagrams").insert({
              attachment_id,
              cluster_id: CLUSTER_ID,
              type: dType,
              title: `${docTitle ?? fileName} — ${dType.replace("_", " ")}`,
              svg_data: svgData,
              caption,
            });
          }
        } catch (err) {
          console.warn(`[analyze-step] diagram ${dType} failed:`, err instanceof Error ? err.message : String(err));
        }
        break;
      }

      case "decompose_problem":
      case "decompose_structure":
      case "decompose_argument":
      case "decompose_terminology":
      case "decompose_gaps":
      case "decompose_results":
      case "decompose_compression": {
        const pass = currentStep.replace("decompose_", "");
        try {
          // Fetch prior passes for cumulative context
          const { data: priorRows } = await admin
            .from("paper_decompositions")
            .select("pass_type, result_json")
            .eq("attachment_id", attachment_id)
            .order("created_at", { ascending: true });
          const accumulated = (priorRows ?? []).map((r: any) => ({
            pass_type: r.pass_type,
            title: r.result_json?.title ?? r.pass_type,
            content: r.result_json?.content ?? "",
            key_points: r.result_json?.key_points ?? [],
          }));
          const messages = buildDecompositionPrompt(pass as any, extractedText, docTitle, accumulated);
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
        } catch (err) {
          console.warn(`[analyze-step] decomposition ${pass} failed:`, err instanceof Error ? err.message : String(err));
        }
        break;
      }

      case "tags_and_finalize": {
        for (const tag of DEFAULT_TAGS) {
          await admin.from("paper_tags").insert({
            attachment_id,
            cluster_id: CLUSTER_ID,
            name: tag.name,
            color: tag.color,
          });
        }
        await admin
          .from("post_attachments")
          .update({
            doc_type: "research_paper",
            white_paper_tools_enabled: true,
            analysis_progress: {
              steps: { ...steps, [currentStep]: true },
              done: true,
              completed: STEPS.length,
              total: STEPS.length,
              completed_at: new Date().toISOString(),
            },
          })
          .eq("id", attachment_id);
        console.log("[analyze-step] finalize complete — attachment:", attachment_id);
        return NextResponse.json({ outcome: "complete", step: currentStep });
      }
    }

    // Mark step done and update progress
    steps[currentStep] = true;
    const completedCount = Object.keys(steps).filter((k) => steps[k]).length;
    await admin
      .from("post_attachments")
      .update({
        analysis_progress: {
          steps,
          current_step: currentStep,
          completed: completedCount,
          total: STEPS.length,
        },
      })
      .eq("id", attachment_id);

    // ── Trigger next step ────────────────────────────────────────
    const nextStep = STEPS[stepIdx + 1];
    if (nextStep) {
      void fetch(resolvePublicUrl(request, "/api/upload/analyze-step"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachment_id, step: nextStep }),
      }).catch(() => {});
    }

    return NextResponse.json({ outcome: "step_complete", step: currentStep, next: nextStep ?? null });
  } catch (err) {
    console.warn("[analyze-step] error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
