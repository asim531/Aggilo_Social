/**
 * Metadata Extraction Prompt.
 *
 * Given extracted paper text, extract structured bibliographic metadata.
 */

export interface MetadataResult {
  authors: string[] | null;
  venue: string | null;
  year: string | null;
  doi: string | null;
  abstract: string | null;
  keywords: string[] | null;
}

export function buildMetadataExtractPrompt(extractedText: string, fileName: string) {
  const truncated = extractedText.slice(0, 6000);

  return [
    {
      role: "system" as const,
      content:
        "You are a bibliographic metadata extraction engine. Given the text of a research paper, extract structured metadata. Respond ONLY in valid JSON with no markdown formatting.",
    },
    {
      role: "user" as const,
      content: `File name: ${fileName}\n\nExtracted text (first 6000 chars):\n${truncated}\n\nRespond with JSON matching this schema:\n{\n  "authors": ["Author 1", "Author 2"] or null,\n  "venue": "Journal or Conference Name" or null,\n  "year": "2024" or null,\n  "doi": "10.xxxx/xxxx" or null,\n  "abstract": "The paper's abstract or first paragraph summarizing the work" or null,\n  "keywords": ["keyword1", "keyword2", "keyword3"] or null\n}\n\nRules:\n- If the text has a clear Abstract section, use it.\n- If no Abstract section, synthesize a 2-3 sentence summary from the introduction.\n- Authors: extract full names if available; return null if unclear.\n- Venue: journal name, conference name, or preprint server (arXiv, SSRN, etc.).\n- Keywords: 3-8 terms that capture the paper's domain, method, and subject.`,
    },
  ];
}
