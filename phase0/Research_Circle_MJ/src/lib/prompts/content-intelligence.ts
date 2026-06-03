/**
 * Content Intelligence Module (CIM) prompts.
 *
 * Used by the upload analyze worker to classify uploaded documents
 * and extract metadata (title, summary, document type).
 */

export interface CimResult {
  doc_type: "research_paper" | "document" | "image" | "video" | "unknown";
  doc_title: string | null;
  doc_summary: string | null;
  confidence: number; // 0-1
  reasoning: string;
}

export function buildCimMessages(extractedText: string, fileName: string) {
  const truncatedText = extractedText.slice(0, 8000);
  const hasText = truncatedText.trim().length > 50;

  return [
    {
      role: "system" as const,
      content:
        "You are a document classification engine. Determine if the uploaded file is a research paper (academic, technical, or scientific). If the extracted text is empty or too short, use the filename to decide. Respond ONLY in valid JSON with no markdown formatting.",
    },
    {
      role: "user" as const,
      content: `File name: ${fileName}\n\n${hasText ? `Extracted text (first 8000 chars):\n${truncatedText}` : "Extracted text: (empty — use filename to classify)"}\n\nRespond with JSON matching this schema:\n{\n  "doc_type": "research_paper" | "document" | "unknown",\n  "doc_title": "inferred title or null if unclear",\n  "doc_summary": "1-2 sentence summary or null",\n  "confidence": 0.0 to 1.0,\n  "reasoning": "brief explanation of classification"\n}\n\nRules:\n- Classify as research_paper if ANY of the following apply:\n  1. Filename contains: paper, research, study, thesis, dissertation, journal, arxiv, survey, review, analysis, report, findings, methodology, proceedings, conference, workshop, preprint, working_paper, white_paper, technical_report, discussion, position_paper, pedagogical, library, information_literacy, educational_research, teaching_practice, case_study, best_practices\n  2. Text contains: abstract, introduction, methodology, literature review, references, bibliography, citations, findings, results, conclusion, keywords, figures, tables, doi\n  3. Text appears to be from an academic journal, conference, university, or scholarly source\n  4. Text discusses educational theory, practice, or scholarly work even if not experimental\n- If none of the above → classify as document with confidence 0.9+.\n- For academic articles about teaching, learning, libraries, or pedagogy → classify as research_paper (these are legitimate scholarly works).`,
    },
  ];
}
