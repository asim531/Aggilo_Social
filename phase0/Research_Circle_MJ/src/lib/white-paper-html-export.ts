/**
 * HTML export generator for white paper analysis.
 *
 * Given an attachment and its associated analysis data, produces a
 * complete, self-contained HTML file that can be downloaded.
 */

import type { PostAttachment } from "./types";

export interface ExportData {
  attachment: PostAttachment;
  decompositions: {
    pass_type: string;
    result_json: { title: string; content: string; key_points: string[] };
  }[];
  diagrams: {
    type: string;
    title: string;
    svg_data: string;
  }[];
  tags: {
    name: string;
    color: string;
    comments: { author: string; body: string; created_at: string }[];
  }[];
}

export function generateAnalysisHtml(data: ExportData): string {
  const { attachment, decompositions, diagrams, tags } = data;

  const decompositionCards = decompositions
    .map(
      (d) => `
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px;background:#fff;">
      <h3 style="margin:0 0 8px 0;font-size:16px;color:#1e293b;">${escapeHtml(d.result_json.title)}</h3>
      <p style="margin:0 0 12px 0;font-size:14px;color:#334155;line-height:1.6;">${escapeHtml(d.result_json.content)}</p>
      ${d.result_json.key_points.length > 0 ? `<ul style="margin:0;padding-left:20px;">${d.result_json.key_points.map((kp) => `<li style="font-size:13px;color:#475569;margin-bottom:4px;">${escapeHtml(kp)}</li>`).join("")}</ul>` : ""}
    </div>`
    )
    .join("");

  const diagramTabs = diagrams
    .map(
      (dg, i) => `
    <div style="display:${i === 0 ? "block" : "none"};border:1px solid #e5e7eb;border-radius:8px;padding:12px;background:#fff;">
      <h4 style="margin:0 0 8px 0;font-size:14px;color:#1e293b;">${escapeHtml(dg.title)}</h4>
      ${dg.svg_data}
    </div>`
    )
    .join("");

  const tagSections = tags
    .map(
      (t) => `
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:12px;background:#fff;">
      <h4 style="margin:0 0 8px 0;font-size:14px;color:${t.color};">${escapeHtml(t.name)}</h4>
      ${t.comments.length === 0 ? "<p style=\"font-size:13px;color:#94a3b8;\">No comments yet.</p>" : t.comments.map((c) => `<div style="border-bottom:1px solid #f1f5f9;padding:8px 0;"><span style="font-size:12px;font-weight:600;color:#1e293b;">${escapeHtml(c.author)}</span><span style="font-size:11px;color:#94a3b8;margin-left:8px;">${new Date(c.created_at).toLocaleString()}</span><p style="margin:4px 0 0 0;font-size:13px;color:#334155;">${escapeHtml(c.body)}</p></div>`).join("")}
    </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(attachment.doc_title ?? attachment.file_name)} — Analysis Report</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px;color:#1e293b;}
  .container{max-width:900px;margin:0 auto;}
  h1{font-size:22px;margin:0 0 4px 0;}
  .meta{font-size:12px;color:#64748b;margin-bottom:24px;}
  h2{font-size:18px;border-bottom:2px solid #e2e8f0;padding-bottom:6px;margin-top:28px;}
  svg{max-width:100%;height:auto;}
</style>
</head>
<body>
<div class="container">
  <h1>${escapeHtml(attachment.doc_title ?? attachment.file_name)}</h1>
  <p class="meta">Document Analysis Report · Generated ${new Date().toLocaleString()}</p>

  ${attachment.doc_summary ? `<p style="font-size:14px;color:#334155;line-height:1.6;margin-bottom:24px;">${escapeHtml(attachment.doc_summary)}</p>` : ""}

  <h2>Decomposition Analysis</h2>
  ${decompositionCards || "<p style=\"color:#94a3b8;\">No analysis available.</p>"}

  <h2>Diagrams</h2>
  ${diagramTabs || "<p style=\"color:#94a3b8;\">No diagrams generated.</p>"}

  <h2>Discussion Threads</h2>
  ${tagSections || "<p style=\"color:#94a3b8;\">No discussions yet.</p>"}
</div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
