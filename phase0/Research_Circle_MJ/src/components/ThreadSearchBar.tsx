"use client";

/**
 * ThreadSearchBar — cluster-wide search for Discussion Threads and posts.
 * Replaces the old TopicBar.
 */

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { CLUSTER_ID } from "@/lib/cluster";
import { semanticPaperSearch } from "@/lib/paper-search";

interface SearchResult {
  id: string;
  type: "thread" | "post" | "paper" | "reply";
  name: string;
  paperTitle?: string;
  postId?: string;
  parentId?: string;
  attachmentId?: string;
  source?: "semantic" | "text";
}

export default function ThreadSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSearch(raw: string) {
    const q = raw.trim();
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    setOpen(true);

    // Search paper tags (threads)
    const { data: tagRows } = await supabase
      .from("paper_tags")
      .select("id, name, attachment_id, post_attachments(doc_title, file_name, post_id)")
      .eq("cluster_id", CLUSTER_ID)
      .ilike("name", `%${q}%`);

    const tagResults: SearchResult[] = (tagRows ?? []).map((t: any) => ({
      id: t.id,
      type: "thread",
      name: t.name,
      paperTitle: t.post_attachments?.doc_title || t.post_attachments?.file_name,
      postId: t.post_attachments?.post_id,
      attachmentId: t.attachment_id,
    }));

    // Search top-level posts
    const { data: postRows } = await supabase
      .from("posts")
      .select("id, content")
      .eq("cluster_id", CLUSTER_ID)
      .is("parent_id", null)
      .ilike("content", `%${q}%`)
      .limit(10);

    const postResults: SearchResult[] = (postRows ?? []).map((p: any) => ({
      id: p.id,
      type: "post",
      name: p.content.slice(0, 60) + (p.content.length > 60 ? "…" : ""),
      postId: p.id,
    }));

    // Search replies
    const { data: replyRows } = await supabase
      .from("posts")
      .select("id, content, parent_id")
      .eq("cluster_id", CLUSTER_ID)
      .not("parent_id", "is", null)
      .ilike("content", `%${q}%`)
      .limit(10);

    const replyResults: SearchResult[] = (replyRows ?? []).map((r: any) => ({
      id: r.id,
      type: "reply",
      name: r.content.slice(0, 60) + (r.content.length > 60 ? "…" : ""),
      postId: r.id,
      parentId: r.parent_id,
    }));

    // Search papers via hybrid semantic + text search
    const paperRows = await semanticPaperSearch(CLUSTER_ID, q, 5);

    const paperResults: SearchResult[] = paperRows.map((p) => ({
      id: p.id,
      type: "paper" as const,
      name: p.doc_title || p.file_name,
      attachmentId: p.id,
      source: p.source,
    }));

    const all = [...paperResults, ...tagResults, ...postResults, ...replyResults];
    setResults(all);
    setSelectedIndex(all.length > 0 ? 0 : -1);
    setLoading(false);
  }

  function handleSelect(r: SearchResult) {
    setOpen(false);
    setQuery("");

    if ((r.type === "post" || r.type === "reply") && r.postId) {
      // For replies, scroll to the parent post since replies render inline
      const targetId = r.type === "reply" && r.parentId ? r.parentId : r.postId;
      const el = document.getElementById(`post-${targetId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-husl-clio", "ring-offset-2", "rounded-lg");
        setTimeout(() => el.classList.remove("ring-2", "ring-husl-clio", "ring-offset-2", "rounded-lg"), 3000);
      }
    } else if (r.type === "thread" && r.attachmentId) {
      // Find the ResearchPaperCard for this attachment
      const card = document.querySelector(`[data-attachment-id="${r.attachmentId}"]`);
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.classList.add("ring-2", "ring-husl-clio", "ring-offset-2");
        setTimeout(() => card.classList.remove("ring-2", "ring-husl-clio", "ring-offset-2"), 3000);

        // Try to activate the Discuss tab
        const discussBtn = card.querySelector('[data-tab="discuss"]') as HTMLElement;
        if (discussBtn) discussBtn.click();

        // Try to activate the matching thread
        const threadBtn = card.querySelector(`[data-thread-id="${r.id}"]`) as HTMLElement;
        if (threadBtn) {
          threadBtn.classList.add("animate-pulse", "ring-2", "ring-husl-clio");
          setTimeout(() => threadBtn.classList.remove("animate-pulse", "ring-2", "ring-husl-clio"), 3000);
          threadBtn.click();
        }
      }
    } else if (r.type === "paper" && r.attachmentId) {
      const card = document.querySelector(`[data-attachment-id="${r.attachmentId}"]`);
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.classList.add("ring-2", "ring-husl-clio", "ring-offset-2");
        setTimeout(() => card.classList.remove("ring-2", "ring-husl-clio", "ring-offset-2"), 3000);
      }
    }
  }

  return (
    <div ref={containerRef} className="relative max-w-3xl mx-auto px-4 py-2">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            setSelectedIndex(-1);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (val.trim().length < 2) {
              setResults([]);
              setOpen(false);
              return;
            }
            debounceRef.current = setTimeout(() => {
              void handleSearch(val);
            }, 300);
          }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          onKeyDown={(e) => {
            if (!open || results.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelectedIndex((i) => (i + 1) % results.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelectedIndex((i) => (i - 1 + results.length) % results.length);
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (selectedIndex >= 0 && selectedIndex < results.length) {
                handleSelect(results[selectedIndex]);
              }
            } else if (e.key === "Escape") {
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          placeholder="Search papers, threads, and posts…"
          className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1a1d22] text-husl-ink dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-husl-clio focus:border-husl-clio transition-colors"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-stone-200 border-t-husl-clio rounded-full animate-spin" />
        )}
      </div>

      {open && (
        <div className="absolute top-full left-4 right-4 mt-1 bg-white dark:bg-[#1a1d22] border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto transition-colors">
          {results.length === 0 ? (
            <div className="px-3 py-3 text-xs text-stone-500 dark:text-stone-400">
              <p className="font-medium">No results found.</p>
              <p className="mt-1 text-stone-400 dark:text-stone-500">
                Try searching for authors, paper titles, methods, or keywords.
              </p>
            </div>
          ) : (
            <ul>
              {results.map((r, idx) => (
                <li key={`${r.type}-${r.id}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(r)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-3 py-2 transition-colors ${
                      idx === selectedIndex
                        ? "bg-stone-50 dark:bg-stone-800"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                        r.type === "thread"
                          ? "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
                          : r.type === "paper"
                          ? "bg-husl-sageSoft/40 dark:bg-[#1a2c2b]/40 text-husl-sage dark:text-emerald-400"
                          : r.type === "reply"
                          ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                          : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
                      }`}>
                        {r.type === "thread" ? "Thread" : r.type === "paper" ? "Paper" : r.type === "reply" ? "Reply" : "Post"}
                      </span>
                      <span className="text-sm text-husl-ink dark:text-white truncate">{r.name}</span>
                      {r.type === "paper" && r.source === "semantic" && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-medium">
                          semantic
                        </span>
                      )}
                    </div>
                    {r.paperTitle && (
                      <p className="text-[10px] text-stone-400 dark:text-stone-500 ml-14 truncate">
                        in {r.paperTitle}
                      </p>
                    )}
                    {r.type === "reply" && r.parentId && (
                      <p className="text-[10px] text-stone-400 dark:text-stone-500 ml-14 truncate">
                        in thread
                      </p>
                    )}
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
