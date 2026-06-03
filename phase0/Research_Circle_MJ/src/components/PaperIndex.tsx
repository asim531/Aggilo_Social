"use client";

/**
 * PaperIndex — subtle document index near the search bar.
 * Shows all uploaded papers/docs with discussion counts.
 */

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { CLUSTER_ID } from "@/lib/cluster";

interface DocItem {
  id: string;
  title: string;
  fileName: string;
  threadCount: number;
}

export default function PaperIndex() {
  const [open, setOpen] = useState(false);
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    async function load() {
      // Fetch attachments with titles
      const { data: attRows } = await supabase
        .from("post_attachments")
        .select("id, doc_title, file_name, post_id")
        .eq("cluster_id", CLUSTER_ID)
        .order("created_at", { ascending: false });

      const attachments = (attRows ?? []).filter((a) => a.post_id);
      if (attachments.length === 0) {
        setDocs([]);
        setLoading(false);
        return;
      }

      const attIds = attachments.map((a) => a.id);

      // Batch-fetch all paper_tags for these attachments
      const { data: tagRows } = await supabase
        .from("paper_tags")
        .select("attachment_id")
        .in("attachment_id", attIds);

      const threadCounts = new Map<string, number>();
      for (const t of tagRows ?? []) {
        threadCounts.set(t.attachment_id, (threadCounts.get(t.attachment_id) ?? 0) + 1);
      }

      const items: DocItem[] = attachments.map((att) => ({
        id: att.id,
        title: att.doc_title || att.file_name,
        fileName: att.file_name,
        threadCount: threadCounts.get(att.id) ?? 0,
      }));

      setDocs(items);
      setLoading(false);
    }

    load();
  }, [open]);

  function handleSelect(docId: string) {
    setOpen(false);
    const card = document.querySelector(`[data-attachment-id="${docId}"]`);
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.classList.add("ring-2", "ring-husl-clio", "ring-offset-2");
      setTimeout(() => card.classList.remove("ring-2", "ring-husl-clio", "ring-offset-2"), 3000);
    }
  }

  const totalDocs = docs.length;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[10px] text-stone-500 dark:text-stone-400 hover:text-husl-clio dark:hover:text-amber-400 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
        title="Browse uploaded documents"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Docs
        {totalDocs > 0 && <span className="text-stone-400 dark:text-stone-500">({totalDocs})</span>}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-72 bg-white dark:bg-[#14161a] border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto transition-colors">
          {loading ? (
            <div className="p-4 text-center">
              <span className="w-4 h-4 border-2 border-stone-200 dark:border-stone-700 border-t-husl-clio rounded-full animate-spin inline-block" />
            </div>
          ) : docs.length === 0 ? (
            <p className="px-3 py-2 text-xs text-stone-500 dark:text-stone-400">No documents uploaded yet.</p>
          ) : (
            <ul className="py-1">
              {docs.map((doc) => (
                <li key={doc.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(doc.id)}
                    className="w-full text-left px-3 py-2 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                  >
                    <p className="text-xs text-husl-ink dark:text-stone-200 truncate font-medium">{doc.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 truncate">{doc.fileName}</span>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500">
                        {doc.threadCount > 0 ? `${doc.threadCount} thread${doc.threadCount === 1 ? "" : "s"}` : "No threads"}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
