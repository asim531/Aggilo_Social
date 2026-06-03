"use client";

/**
 * PaperMetadataCard — compact bibliographic info displayed in
 * ResearchPaperCard header. Shows authors, venue, year, DOI,
 * abstract, and keywords. Expandable.
 */

import { useState } from "react";
import type { PostAttachment } from "@/lib/types";

interface PaperMetadataCardProps {
  attachment: PostAttachment;
}

export default function PaperMetadataCard({ attachment }: PaperMetadataCardProps) {
  const [expanded, setExpanded] = useState(false);

  const hasMeta = attachment.authors || attachment.venue || attachment.year || attachment.doi || attachment.abstract || attachment.keywords;
  if (!hasMeta) return null;

  return (
    <div className="px-3 py-2 border-b border-stone-200/60 bg-white/40">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 w-full text-left"
      >
        <svg className={`w-3.5 h-3.5 text-stone-400 transition-transform ${expanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
          Bibliography
        </span>
        {attachment.year && (
          <span className="text-[10px] text-stone-400">· {attachment.year}</span>
        )}
        {attachment.venue && (
          <span className="text-[10px] text-stone-400 truncate max-w-[200px]">· {attachment.venue}</span>
        )}
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5 text-xs text-stone-700">
          {attachment.authors && attachment.authors.length > 0 && (
            <p><span className="font-medium text-stone-500">Authors:</span> {attachment.authors.join(", ")}</p>
          )}
          {attachment.venue && (
            <p><span className="font-medium text-stone-500">Venue:</span> {attachment.venue}</p>
          )}
          {attachment.year && (
            <p><span className="font-medium text-stone-500">Year:</span> {attachment.year}</p>
          )}
          {attachment.doi && (
            <p>
              <span className="font-medium text-stone-500">DOI:</span>{" "}
              <a href={`https://doi.org/${attachment.doi}`} target="_blank" rel="noopener noreferrer" className="text-husl-clio hover:underline">
                {attachment.doi}
              </a>
            </p>
          )}
          {attachment.keywords && attachment.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {attachment.keywords.map((kw) => (
                <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                  {kw}
                </span>
              ))}
            </div>
          )}
          {attachment.abstract && (
            <p className="text-stone-600 leading-relaxed pt-1 border-t border-stone-100">
              {attachment.abstract}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
