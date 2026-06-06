"use client";

/**
 * PaperCitationLinks — shows papers cited by this paper,
 * and papers that cite this paper. Bidirectional links.
 */

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

interface CitationLink {
  id: string;
  doc_title: string | null;
  file_name: string;
  context?: string;
}

interface PaperCitationLinksProps {
  attachmentId: string;
  isAnalyzing?: boolean;
}

export default function PaperCitationLinks({ attachmentId, isAnalyzing }: PaperCitationLinksProps) {
  const [cites, setCites] = useState<CitationLink[]>([]);
  const [citedBy, setCitedBy] = useState<CitationLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"cites" | "citedBy">("cites");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      setLoading(true);
      // Papers this paper cites
      const { data: citesRows } = await supabase
        .from("paper_citations")
        .select("cited_attachment_id, mention_context, post_attachments(id, doc_title, file_name)")
        .eq("citing_attachment_id", attachmentId);

      const citesList: CitationLink[] = (citesRows ?? []).map((r: any) => ({
        id: r.cited_attachment_id,
        doc_title: r.post_attachments?.doc_title ?? null,
        file_name: r.post_attachments?.file_name ?? "Unknown",
        context: r.mention_context,
      }));

      // Papers that cite this paper
      const { data: citedByRows } = await supabase
        .from("paper_citations")
        .select("citing_attachment_id, mention_context, post_attachments(id, doc_title, file_name)")
        .eq("cited_attachment_id", attachmentId);

      const citedByList: CitationLink[] = (citedByRows ?? []).map((r: any) => ({
        id: r.citing_attachment_id,
        doc_title: r.post_attachments?.doc_title ?? null,
        file_name: r.post_attachments?.file_name ?? "Unknown",
        context: r.mention_context,
      }));

      setCites(citesList);
      setCitedBy(citedByList);
      setLoading(false);
    }
    load();
  }, [attachmentId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-1 py-2">
        <div className="h-3 w-20 bg-stone-200 rounded" />
        <div className="h-3 w-full bg-stone-200 rounded" />
      </div>
    );
  }

  if (cites.length === 0 && citedBy.length === 0) {
    if (isAnalyzing) {
      return (
        <div className="flex items-center gap-2 px-2 py-3 rounded-lg border border-amber-200 bg-amber-50/50 text-xs text-stone-600">
          <svg className="w-3 h-3 text-amber-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Citations are being extracted — check back as the analysis progresses.
        </div>
      );
    }
    return (
      <div className="px-3 py-4 rounded-lg border border-stone-200 bg-stone-50/50 text-center">
        <svg className="w-5 h-5 text-stone-300 mx-auto mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <p className="text-xs text-stone-500 font-medium">No citation links found</p>
        <p className="text-[10px] text-stone-400 mt-0.5">
          Links are created when papers explicitly mention each other in the system.
        </p>
      </div>
    );
  }

  const activeList = activeTab === "cites" ? cites : citedBy;

  return (
    <div className="py-1">
      <div className="flex items-center gap-2 mb-1.5">
        <button
          type="button"
          onClick={() => setActiveTab("cites")}
          className={`text-[10px] font-medium px-2 py-0.5 rounded transition-colors ${
            activeTab === "cites" ? "bg-teal-50 text-teal-700" : "text-stone-500 hover:bg-stone-100"
          }`}
        >
          Cites ({cites.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("citedBy")}
          className={`text-[10px] font-medium px-2 py-0.5 rounded transition-colors ${
            activeTab === "citedBy" ? "bg-teal-50 text-teal-700" : "text-stone-500 hover:bg-stone-100"
          }`}
        >
          Cited by ({citedBy.length})
        </button>
      </div>
      <ul className="space-y-1">
        {activeList.map((link) => (
          <li key={link.id} className="text-xs">
            <span className="text-husl-ink font-medium">
              {link.doc_title || link.file_name}
            </span>
            {link.context && (
              <span className="text-stone-400 ml-1 truncate block">
                “{link.context.slice(0, 80)}{link.context.length > 80 ? "…" : ""}”
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
