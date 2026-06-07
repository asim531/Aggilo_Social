/**
 * Analyze step worker — core logic extracted from /api/upload/analyze-step
 * so the first step can be called directly from analysis-worker.ts without
 * a fragile HTTP hop.
 */

import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";
import { llmCall, llmEmbedding } from "@/lib/llm";
import { buildDiagramPrompt } from "@/lib/prompts/white-paper/diagram-prompt";
import { buildDecompositionPrompt } from "@/lib/prompts/white-paper/decompose-prompts";
import { buildCitationExtractPrompt } from "@/lib/prompts/white-paper/citation-extract";
import { withBasePath } from "@/lib/path";
import { chunkText } from "@/lib/chunking";

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

const DEFAULT_TAGS = [
  { name: "#summary", color: "#2d6a4f" },
  { name: "#methodology", color: "#1d4ed8" },
  { name: "#limitations", color: "#b45309" },
  { name: "#discussion", color: "#7c3aed" },
];

/** Update live progress including chunk-level info. */
async function writeProgress(
  admin: ReturnType<typeof createAdminClient>,
  attachment_id: string,
  steps: Record<string, boolean>,
  currentStep: string,
  currentChunk?: number,
  totalChunks?: number
) {
  const completedCount = Object.keys(steps).filter((k) => steps[k]).length;
  await admin
    .from("post_attachments")
    .update({
      analysis_progress: {
        steps,
        current_step: currentStep,
        current_chunk: currentChunk,
        total_chunks: totalChunks,
        completed: completedCount,
        total: STEPS.length,
      },
    })
    .eq("id", attachment_id);
}

/** Summarize all chunks into one short narrative for diagram generation. */
async function synthesizeForDiagrams(
  chunks: string[],
  docTitle: string | null
): Promise<string> {
  if (chunks.length <= 1) return chunks[0] ?? "";
  const excerpts = chunks
    .map((c, i) => `--- SECTION ${i + 1} ---\n${c.slice(0, 1200)}`)
    .join("\n\n");
  const messages = [
    {
      role: "system" as const,
      content: `You are a research paper summarizer. Given excerpts from different sections of a paper, produce a concise 250-word summary covering the key concepts, methods, findings, and structure. This summary will be used to generate a visual diagram. Be factual and dense.`,
    },
    {
      role: "user" as const,
      content: `Paper title: ${docTitle ?? "Untitled"}\n\nExcerpts:\n${excerpts}\n\nWrite the summary now.`,
    },
  ];
  const res = await llmCall({
    messages,
    operationKey: "diagram_synthesis",
    temperature: 0.3,
    maxTokens: 600,
  });
  return res.content.trim();
}

/** Attempt to parse LLM response into {svg, caption}. Retry once on failure. */
async function tryParseDiagramResponse(
  raw: string,
  type: string,
  docTitle: string | null
): Promise<{ svg: string; caption: string | null } | null> {
  const attempt = (text: string): { svg: string; caption: string | null } | null => {
    const fenceStripped = text.replace(/^```(?:json)?\s*/, "").replace(/\s*```\s*$/, "");
    if (fenceStripped.trim().startsWith("<svg")) {
      return { svg: fenceStripped.trim(), caption: null };
    }
    const jsonMatch = fenceStripped.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as { svg?: string; caption?: string };
        if (parsed.svg && parsed.svg.trim().startsWith("<svg")) {
          return { svg: parsed.svg.trim(), caption: parsed.caption ?? null };
        }
      } catch {}
    }
    const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/);
    if (svgMatch) {
      return { svg: svgMatch[0], caption: null };
    }
    return null;
  };

  const first = attempt(raw);
  if (first) return first;

  console.warn(`[analyze-step] diagram ${type} parse failed, retrying...`);
  const retryMessages = [
    {
      role: "system" as const,
      content: `You are a diagram repair engine. The previous response could not be parsed. Re-emit the exact same diagram SVG and caption, but wrapped in a clean JSON object with keys "svg" and "caption". No markdown fences.`,
    },
    {
      role: "user" as const,
      content: `Paper: ${docTitle ?? "Untitled"}\n\nPrevious response:\n${raw.slice(0, 3000)}\n\nRe-emit as clean JSON now.`,
    },
  ];
  try {
    const retryLLM = await llmCall({
      messages: retryMessages,
      operationKey: `diagram_${type}_retry`,
      temperature: 0.3,
      maxTokens: 2500,
    });
    const second = attempt(retryLLM.content);
    if (second) return second;
  } catch {
    // swallow
  }
  return null;
}

/** Build a synthesis prompt that merges partial decomposition results. */
function buildSynthesisPrompt(
  pass: string,
  docTitle: string | null,
  partials: Array<{ title: string; content: string; key_points: string[] }>
) {
  return [
    {
      role: "system" as const,
      content: `You are a document analysis engine. You have received partial analyses of different sections of the same paper. Synthesize them into ONE concise, unified analysis for the "${pass}" pass.

RULES:
- Remove redundancies, resolve contradictions, preserve unique insights.
- content: 3–5 bullet points, each ≤15 words. No long paragraphs. No filler phrases (e.g. "It is important to note that").
- key_points: 3–5 standalone takeaway phrases, each ≤10 words.
- title: 2–4 words max.
- Respond in valid JSON with keys: title (string), content (string with bullets separated by "\n- "), key_points (string array).`,
    },
    {
      role: "user" as const,
      content: `Paper: ${docTitle ?? "Untitled"}\n\nPartial analyses:\n${partials
        .map(
          (p, i) =>
            `--- PART ${i + 1} ---\nTitle: ${p.title}\nContent: ${p.content.slice(0, 300)}\nKey points: ${p.key_points.join("; ")}`
        )
        .join("\n\n")}\n\nSynthesize into a single unified result now.`,
    },
  ];
}

export interface AnalyzeStepResult {
  outcome: "step_complete" | "complete" | "error";
  step: string;
  next?: string | null;
  error?: string;
}

export async function runAnalyzeStep(
  params: {
    attachment_id: string;
    step?: string;
    triggerUrl?: string;
  }
): Promise<AnalyzeStepResult> {
  const { attachment_id, step: currentStepInput, triggerUrl } = params;
  const currentStep = currentStepInput ?? STEPS[0];

  if (!attachment_id) {
    return { outcome: "error", step: currentStep, error: "attachment_id required" };
  }

  const admin = createAdminClient();

  const { data: rawAtt, error: attErr } = await admin
    .from("post_attachments")
    .select("*")
    .eq("id", attachment_id)
    .eq("cluster_id", CLUSTER_ID)
    .single();

  if (attErr || !rawAtt) {
    console.warn("[analyze-step] attachment not found:", attErr?.message);
    return { outcome: "error", step: currentStep, error: "attachment not found" };
  }

  const att = rawAtt as any;
  const extractedText: string = att.extracted_text ?? "";
  const docTitle: string | null = att.doc_title ?? null;
  const fileName: string = att.file_name ?? "";

  const progress = (att.analysis_progress as any) ?? {};
  const steps: Record<string, boolean> = progress.steps ?? {};
  const stepIdx = STEPS.indexOf(currentStep);
  if (stepIdx === -1) {
    return { outcome: "error", step: currentStep, error: "invalid_step" };
  }

  // ── Execute current step ─────────────────────────────────────
  switch (currentStep) {
    case "embedding": {
      try {
        const chunks = chunkText(extractedText, 8000);
        const embeddings = await Promise.all(
          chunks.map((chunk) => llmEmbedding(chunk))
        );
        for (const emb of embeddings) {
          await admin.from("paper_embeddings").insert({
            attachment_id,
            embedding: JSON.stringify(emb),
          });
        }
      } catch (err) {
        console.warn("[analyze-step] embedding failed:", err instanceof Error ? err.message : String(err));
      }
      break;
    }

    case "citations": {
      try {
        const chunks = chunkText(extractedText, 8000);
        const allCitations: Array<{ title: string; context: string }> = [];

        for (let i = 0; i < chunks.length; i++) {
          await writeProgress(admin, attachment_id, steps, currentStep, i + 1, chunks.length);
          const messages = buildCitationExtractPrompt(chunks[i]);
          const citeLLM = await llmCall({
            messages,
            operationKey: "citation_extract",
            temperature: 0.3,
            maxTokens: 800,
            responseFormat: { type: "json_object" },
          });
          const citations = JSON.parse(citeLLM.content) as Array<{ title: string; context: string }>;
          for (const c of citations) {
            if (!allCitations.some((existing) => existing.title.toLowerCase() === c.title.toLowerCase())) {
              allCitations.push(c);
            }
          }
        }

        if (allCitations.length > 0) {
          const { data: existingDocs } = await admin
            .from("post_attachments")
            .select("id, doc_title, file_name")
            .eq("cluster_id", CLUSTER_ID)
            .neq("id", attachment_id);
          for (const cite of allCitations) {
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
        const chunks = chunkText(extractedText, 8000);
        const summary = await synthesizeForDiagrams(chunks, docTitle);

        const messages = buildDiagramPrompt({ type: dType, extractedText: summary, docTitle });
        const llmRes = await llmCall({
          messages,
          operationKey: `diagram_${dType}`,
          temperature: 0.4,
          maxTokens: 2500,
        });

        const parsed = await tryParseDiagramResponse(llmRes.content, dType, docTitle);
        if (parsed) {
          await admin.from("paper_diagrams").insert({
            attachment_id,
            cluster_id: CLUSTER_ID,
            type: dType,
            title: `${docTitle ?? fileName} — ${dType.replace("_", " ")}`,
            svg_data: parsed.svg,
            caption: parsed.caption,
          });
        } else {
          console.warn(`[analyze-step] diagram ${dType} parse failed after retry — skipping`);
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

        const chunks = chunkText(extractedText, 8000);
        const partials: Array<{ title: string; content: string; key_points: string[] }> = [];

        for (let i = 0; i < chunks.length; i++) {
          await writeProgress(admin, attachment_id, steps, currentStep, i + 1, chunks.length);
          const messages = buildDecompositionPrompt(pass as any, chunks[i], docTitle, accumulated);
          const llmRes = await llmCall({
            messages,
            operationKey: `decompose_${pass}`,
            temperature: 0.3,
            maxTokens: 1200,
            responseFormat: { type: "json_object" },
          });
          const result = JSON.parse(llmRes.content);
          partials.push({
            title: result.title ?? pass,
            content: result.content ?? "",
            key_points: result.key_points ?? [],
          });
        }

        let finalResult: { title: string; content: string; key_points: string[] };
        if (partials.length === 1) {
          finalResult = partials[0];
        } else {
          const synthMessages = buildSynthesisPrompt(pass, docTitle, partials);
          const synthLLM = await llmCall({
            messages: synthMessages,
            operationKey: `decompose_${pass}_synth`,
            temperature: 0.3,
            maxTokens: 1200,
            responseFormat: { type: "json_object" },
          });
          finalResult = JSON.parse(synthLLM.content);
        }

        await admin.from("paper_decompositions").insert({
          attachment_id,
          cluster_id: CLUSTER_ID,
          pass_type: pass,
          result_json: finalResult,
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
      return { outcome: "complete", step: currentStep };
    }
  }

  // Mark step done and update progress
  steps[currentStep] = true;
  await writeProgress(admin, attachment_id, steps, currentStep);

  // ── Trigger next step ────────────────────────────────────────
  const nextStep = STEPS[stepIdx + 1];
  if (nextStep && triggerUrl) {
    console.log("[analyze-step] triggering next step:", nextStep, "at", triggerUrl);
    void fetch(triggerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attachment_id, step: nextStep }),
    }).catch((err) => {
      console.error("[analyze-step] next-step trigger failed:", err);
    });
  }

  return { outcome: "step_complete", step: currentStep, next: nextStep ?? null };
}
