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
}

export default function PaperCitationLinks({ attachmentId }: PaperCitationLinksProps) {
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
    return (
      <p className="text-[10px] text-stone-400 py-1">
        No citation links found yet. Links are created when papers explicitly mention each other.
      </p>
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
