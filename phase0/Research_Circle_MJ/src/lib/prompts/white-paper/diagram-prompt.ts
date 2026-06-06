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

  const typeRules: Record<string, string> = {
    concept_map: `CONCEPT MAP RULES:
- Nodes: <rect width="140" height="60" rx="8"> for every concept. Fill primary (#0d9488) for core, secondary (#f59e0b) for related.
- Text inside each rect: <text x="70" y="35" text-anchor="middle" dominant-baseline="middle" font-size="13">. If label >20 chars, split into <tspan> lines with dy="1.2em".
- Relationships: <path> with marker-end="url(#arrow)". EVERY arrow MUST have a <text> label near its midpoint (e.g. x=midpointX, y=midpointY-6) describing the relationship ("leads to", "depends on", "influences").
- Layout: Horizontal flow, left-to-right. StartX=80, gap between rect edges = 60px. Keep within viewBox 0 0 1000 600.
- No overlapping nodes. If many concepts, use two rows with 40px vertical gap.`,

    architecture: `ARCHITECTURE RULES:
- Visualize the paper's core system or methodology as stacked horizontal layers.
- Use 2–4 <rect> tiers showing the major stages or components (e.g. Input, Processing, Output).
- Each layer: <rect> with width ≥160 and height ≥45, rx="4". Use fill="#0d9488" for primary, "#f59e0b" for secondary.
- Layer label: <text text-anchor="middle" dominant-baseline="middle"> centered inside each rect.
- Components inside layers: smaller rects or circles aligned left-to-right.
- Arrows: <line> or <path> with marker-end="url(#arrow)" connecting layers. Flow direction: top → bottom.
- Legend: Add a <g> with small colored squares + text explaining colors.
- Background: light gray rect. All elements inside viewBox 0 0 1000 600.`,

    process_flow: `PROCESS FLOW RULES:
- Steps: <rect width="160" height="50" rx="6"> arranged left-to-right or top-to-bottom with 50px gaps.
- Decisions: <polygon points="..."> diamond shape (rotate 45°). Width/height ~70px. Label centered inside.
- Arrows: <path> with marker-end="url(#arrow)" connecting step rect edges to decision diamond edges.
- Branch labels: <text> near arrow start showing "Yes" / "No" for decision branches.
- Start / End: Use <circle r="22"> with "Start" / "End" label. Fill="#0d9488" for start, "#e11d48" for end.
- Layout: Single main path. Keep within viewBox 0 0 1000 600.`,

    argument_tree: `ARGUMENT TREE RULES:
- Thesis: Single wide <rect width="280" height="50" rx="4"> at top center (y=40). Fill="#0d9488". Label: thesis text.
- Claims: 2–4 <rect width="200" height="45" rx="4"> below thesis, evenly spaced. Fill="#f59e0b". y≈140.
- Evidence: <circle r="16"> below each claim. Fill="#e11d48". y≈240.
- Connections: <path> or <line> with marker-end="url(#arrow)" from thesis bottom-center to each claim top-center. Then from each claim bottom-center to its evidence circles.
- Vertical tree only — no bidirectional edges. y-gaps: thesis→claims 60px, claims→evidence 60px.
- All text: font-size 12–13, centered, slate-800 fill. viewBox 0 0 1000 600.`,
  };

  const baseRules = `
SHARED SVG REQUIREMENTS:
1. Include arrowhead marker: <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b"/></marker>
2. Color palette (exact hex):
   - Primary: fill="#0d9488" stroke="#0f766e"
   - Secondary: fill="#f59e0b" stroke="#d97706"
   - Accent: fill="#e11d48" stroke="#be123c"
   - Background: fill="#f8fafc"
   - Text: fill="#1e293b" font-family="system-ui, sans-serif"
   - Lines: stroke="#64748b" stroke-width="2"
3. Every node must have a visible <text> label centered inside it.
4. Use viewBox="0 0 1000 600" width="100%" height="100%" preserveAspectRatio="xMidYMid meet".
5. Add a light gray background rect (#f1f5f9) covering full viewBox.
6. Group related elements with <g>.
7. Text readable (font-size >= 12px, good contrast).
8. Keep ALL node labels under 4 words. Use abbreviations. Never wrap labels onto more than 2 lines.
9. NO plain text outside SVG. NO markdown fences inside svg field.
`;

  return [
    {
      role: "system" as const,
      content: `You are a professional diagram generation engine. Given a research paper's text, produce a complete, visually rich SVG diagram and a separate human-readable caption. ${typeDescriptions[req.type]}\n\n${typeRules[req.type]}\n\n${baseRules}\n\nRespond ONLY with a JSON object containing two fields:\n{\n  "svg": "the complete SVG string",\n  "caption": "1-2 sentences explaining what conclusion this diagram reveals about the paper — what the reader should take away from it."\n}\nNo markdown code fences. No extra text.`,
    },
    {
      role: "user" as const,
      content: `Paper title: ${req.docTitle ?? "Untitled"}\n\nExtracted text:\n${truncated}\n\nGenerate the diagram and caption now.`,
    },
  ];
}
