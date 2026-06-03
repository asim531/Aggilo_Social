/**
 * Diagram Engine prompts.
 *
 * Given extracted white paper text, generate an SVG diagram
 * representing the paper's structure, flow, or argument.
 */

export interface DiagramRequest {
  type: "concept_map" | "process_flow" | "architecture" | "argument_tree";
  extractedText: string;
  docTitle: string | null;
}

export function buildDiagramPrompt(req: DiagramRequest) {
  const truncated = req.extractedText.slice(0, 6000);

  const typeDescriptions: Record<string, string> = {
    concept_map:
      "A concept map showing key concepts and their relationships (nodes + labeled edges).",
    process_flow:
      "A process flow diagram showing steps, decisions, and outcomes in sequence.",
    architecture:
      "An architecture diagram showing system components, layers, and data flow.",
    argument_tree:
      "An argument tree showing the paper's thesis, supporting claims, and evidence.",
  };

  const svgRules = `
SVG REQUIREMENTS — follow exactly:
1. Use proper SVG elements: <rect> for boxes, <circle> for nodes, <path> for arrows/connections.
2. Include arrowhead markers: <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b"/></marker>
3. Color palette (use these hex values exactly):
   - Primary nodes: fill="#0d9488" stroke="#0f766e" (teal)
   - Secondary nodes: fill="#f59e0b" stroke="#d97706" (amber)
   - Accent nodes: fill="#e11d48" stroke="#be123c" (rose)
   - Background: fill="#f8fafc"
   - Text: fill="#1e293b" (slate-800), use font-family="system-ui, sans-serif"
   - Lines: stroke="#64748b" stroke-width="2"
4. Every node must have a visible <text> label centered inside it.
5. Use viewBox="0 0 900 520" and width="100%" height="100%".
6. Add a light gray background rect covering the full viewBox.
7. Group related nodes with <g> elements.
8. Ensure text is readable (font-size >= 12px, contrast against fill color).
9. NO plain text outside SVG elements. NO markdown. NO code fences inside the svg field.
`;

  return [
    {
      role: "system" as const,
      content: `You are a professional diagram generation engine. Given a research paper's text, produce a complete, visually rich SVG diagram and a separate human-readable caption. ${typeDescriptions[req.type]}\n\n${svgRules}\n\nRespond ONLY with a JSON object containing two fields:\n{\n  "svg": "the complete SVG string",\n  "caption": "1-2 sentences explaining what conclusion this diagram reveals about the paper — what the reader should take away from it."\n}\nNo markdown code fences. No extra text.`,
    },
    {
      role: "user" as const,
      content: `Paper title: ${req.docTitle ?? "Untitled"}\n\nExtracted text:\n${truncated}\n\nGenerate the diagram and caption now.`,
    },
  ];
}
