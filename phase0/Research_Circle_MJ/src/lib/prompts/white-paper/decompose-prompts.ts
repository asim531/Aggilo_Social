/**
 * Document Decomposition Protocol prompts.
 *
 * 7-pass analysis of a research paper.
 */

export type DecompositionPass =
  | "problem"
  | "structure"
  | "argument"
  | "terminology"
  | "gaps"
  | "results"
  | "compression";

export interface DecompositionResult {
  pass_type: DecompositionPass;
  title: string;
  content: string;
  key_points: string[];
}

const passDescriptions: Record<DecompositionPass, { title: string; instruction: string }> = {
  problem: {
    title: "Problem Statement",
    instruction:
      "Identify the concrete problem this paper solves. Who feels the pain? What is the baseline or current state? How severe is the gap? Be specific — avoid vague language like 'improves performance' without stating the baseline metric.",
  },
  structure: {
    title: "Structure Map",
    instruction:
      "Map the paper's structure: sections, headings, and how they flow. Identify the introduction, methods, results, discussion, conclusion, and references. Output a clear hierarchical outline.",
  },
  argument: {
    title: "Core Argument",
    instruction:
      "Identify the paper's central thesis, main supporting claims, key evidence, and counter-arguments addressed. Summarize the argument in 3-5 sentences.",
  },
  terminology: {
    title: "Terminology & Definitions",
    instruction:
      "Extract key technical terms, acronyms, and definitions. For each term, provide: (1) the term, (2) the definition as used in the paper, (3) domain context.",
  },
  gaps: {
    title: "Evidence & Gaps",
    instruction:
      "Identify what evidence the paper presents (data, experiments, citations) and what gaps or limitations exist. For every claimed improvement, extract: (1) the exact baseline metric, (2) the claimed improvement value, (3) whether the evidence actually supports the claim. Note: missing data, weak generalizations, unaddressed confounders, and vague language like 'improves performance' without numbers.",
  },
  results: {
    title: "Results & Reproducibility",
    instruction:
      "Extract structured evidence from the paper's results section. For each dataset: name, size, source, and availability. For each metric: the baseline value, the claimed value, and the unit. Note any statistical tests (p-values, confidence intervals). Identify whether code and data are publicly available. Assess reproducibility: high (full code + data + clear methods), medium (partial), or low (opaque). Output as a structured summary with specific numbers — never vague.",
  },
  compression: {
    title: "Compression Summary",
    instruction:
      "Provide a 1-paragraph executive summary that a non-expert could understand. Capture: what was done, why it matters, and what was found.",
  },
};

export function buildDecompositionPrompt(
  pass: DecompositionPass,
  extractedText: string,
  docTitle: string | null,
  previousPasses?: Array<{ pass_type: string; title: string; content: string; key_points: string[] }>
) {
  const desc = passDescriptions[pass];
  const truncated = extractedText.slice(0, 7000);

  let previousContext = "";
  if (previousPasses && previousPasses.length > 0) {
    previousContext = `\n\nCONTEXT FROM PREVIOUS PASSES — use this to maintain consistency and avoid contradictions:\n${previousPasses
      .map(
        (p) =>
          `--- ${p.pass_type.toUpperCase()} ---\nTitle: ${p.title}\n${p.content.slice(0, 300)}${p.content.length > 300 ? "..." : ""}`
      )
      .join("\n\n")}`;
  }

  return [
    {
      role: "system" as const,
      content: `You are a document analysis engine performing Pass ${pass.toUpperCase()} of a 6-pass decomposition. ${desc.instruction} \n\nCRITICAL: The "title" field must be a meaningful, descriptive title reflecting the actual content of this pass (e.g., "Paper Structure: Introduction → Methods → Results → Discussion", "Thesis: Climate Policy Requires Both Tech and Behavior Change", "Key Terms: Carbon Pricing, Subsidy, Nudge Theory"). NEVER use generic placeholders like "research_paper", "document", "analysis", or the paper's filename as the title.\n\nRespond in valid JSON with keys: title (descriptive string), content (string), key_points (string array).`,
    },
    {
      role: "user" as const,
      content: `Paper: ${docTitle ?? "Untitled"}${previousContext}\n\nText:\n${truncated}`,
    },
  ];
}

export function passMeta(pass: DecompositionPass) {
  return passDescriptions[pass];
}
