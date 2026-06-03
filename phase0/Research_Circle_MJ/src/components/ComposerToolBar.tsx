"use client";

/**
 * ComposerToolBar — shown in PostComposer when a PDF is attached.
 * Shows CIM classification status and tool activation toggles.
 */

import type { PostAttachment } from "@/lib/types";

interface ComposerToolBarProps {
  attachment: PostAttachment | null;
}

export default function ComposerToolBar({ attachment }: ComposerToolBarProps) {
  if (!attachment) return null;
  const isPdf = attachment.file_type === "application/pdf";
  if (!isPdf) return null;

  const hasExtracted = attachment.extracted_at !== null;
  const isResearch = attachment.white_paper_tools_enabled;
  const isClassifying = !hasExtracted;

  if (isClassifying) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-husl-sageSoft/20 border border-husl-sage/20 rounded text-xs text-husl-sage">
        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Analyzing document...
      </div>
    );
  }

  if (isResearch) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-husl-clio/10 border border-amber-200/60 rounded">
        <svg className="w-3.5 h-3.5 text-husl-clio" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs text-husl-clio font-medium">
          Research paper detected — analysis tools activated
        </span>
        {attachment.doc_title && (
          <span className="text-[10px] text-husl-muted truncate max-w-[180px]">
            {attachment.doc_title}
          </span>
        )}
      </div>
    );
  }

  // Classified as non-research
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded">
      <svg className="w-3.5 h-3.5 text-husl-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-xs text-husl-muted">
        Document classified as {attachment.doc_type || "document"} — no research tools activated
      </span>
    </div>
  );
}
