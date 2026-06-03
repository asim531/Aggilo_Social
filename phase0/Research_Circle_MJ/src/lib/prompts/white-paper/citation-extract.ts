/**
 * Citation Extraction Prompt.
 *
 * Given extracted paper text, find explicit mentions of other papers.
 */

export interface CitationMention {
  title: string;
  context: string;
}

export function buildCitationExtractPrompt(extractedText: string) {
  const truncated = extractedText.slice(0, 8000);

  return [
    {
      role: "system" as const,
      content:
        "You are a citation extraction engine. Given a research paper's text, identify all explicit mentions of other papers or works. For each mention, provide the cited work's title and the surrounding sentence as context. Respond ONLY in valid JSON array with no markdown.",
    },
    {
      role: "user" as const,
      content: `Extracted text:\n${truncated}\n\nRespond with JSON array of objects:\n[\n  {\n    "title": "Exact title of the cited work as it appears in the text",\n    "context": "The full sentence containing the citation"\n  }\n]\n\nRules:\n- Only include citations where the title of the cited work is explicitly mentioned in the text.\n- Do NOT guess or invent titles.\n- If the text says "as shown by Smith et al. (2023)" without a title, SKIP it.\n- If no explicit title mentions are found, return an empty array [].`,
    },
  ];
}
