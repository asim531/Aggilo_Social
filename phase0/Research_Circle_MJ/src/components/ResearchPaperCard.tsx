"use client";

/**
 * ResearchPaperCard — renders inside PostCard when an attachment
 * is classified as a research paper with white_paper_tools_enabled.
 *
 * Shows: analysis header, decomposition, diagrams, discussion threads,
 * and a download-as-HTML button.
 */

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { CLUSTER_ID } from "@/lib/cluster";
import { withBasePath } from "@/lib/path";
import PaperDecomposition from "./PaperDecomposition";
import PaperDiagramViewer from "./PaperDiagramViewer";
import PaperTagThreads from "./PaperTagThreads";
import PaperMetadataCard from "./PaperMetadataCard";
import PaperCitationLinks from "./PaperCitationLinks";
import type { PostAttachment } from "@/lib/types";

type TabKey = "analysis" | "diagrams" | "citations" | "discuss";

interface ResearchPaperCardProps {
  attachment: PostAttachment;
  userId: string;
}

export default function ResearchPaperCard({ attachment, userId }: ResearchPaperCardProps) {
  const prog = attachment.analysis_progress;
  const isAnalyzing = prog ? prog.completed < prog.total : false;
  const [activeTab, setActiveTab] = useState<TabKey>("analysis");
  const [decompositions, setDecompositions] = useState<any[]>([]);
  const [diagrams, setDiagrams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [readingStatus, setReadingStatus] = useState<string>("unread");
  const [paperStatus, setPaperStatus] = useState(attachment.paper_status || "uploaded");
  const [showHelp, setShowHelp] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [showVersions, setShowVersions] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [{ data: decompRows }, { data: diagramRows }, { data: versionRows }, { data: readingRow }] = await Promise.all([
        supabase
          .from("paper_decompositions")
          .select("pass_type, result_json")
          .eq("attachment_id", attachment.id)
          .eq("cluster_id", CLUSTER_ID),
        supabase
          .from("paper_diagrams")
          .select("type, title, svg_data, caption")
          .eq("attachment_id", attachment.id)
          .eq("cluster_id", CLUSTER_ID),
        supabase
          .from("paper_versions")
          .select("id, parent_version_id, version_number, notes, created_at")
          .eq("attachment_id", attachment.id)
          .order("version_number", { ascending: false }),
        supabase
          .from("paper_reading_status")
          .select("status")
          .eq("attachment_id", attachment.id)
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      if (!cancelled) {
        setDecompositions((decompRows ?? []) as any[]);
        setDiagrams((diagramRows ?? []) as any[]);
        setVersions(versionRows ?? []);
        if (readingRow?.status) setReadingStatus(readingRow.status);
        setLoading(false);
      }
    }

    load();

    // Poll for up to 3 minutes (analysis can take 60-90s)
    let pollCount = 0;
    const pollInterval = setInterval(() => {
      pollCount++;
      if (pollCount > 36) {
        clearInterval(pollInterval);
        return;
      }
      // Only keep polling if we still have no data
      setDecompositions((prev) => {
        if (prev.length === 0) load();
        return prev;
      });
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [attachment.id, userId]);

  async function handleDownload() {
    setDownloading(true);
    try {
      // Fetch all data needed for export
      const [{ data: decompRows }, { data: diagramRows }, { data: tagRows }] = await Promise.all([
        supabase
          .from("paper_decompositions")
          .select("pass_type, result_json")
          .eq("attachment_id", attachment.id)
          .eq("cluster_id", CLUSTER_ID),
        supabase
          .from("paper_diagrams")
          .select("type, title, svg_data, caption")
          .eq("attachment_id", attachment.id)
          .eq("cluster_id", CLUSTER_ID),
        supabase
          .from("paper_tags")
          .select("id, name, color")
          .eq("attachment_id", attachment.id)
          .eq("cluster_id", CLUSTER_ID),
      ]);

      const tags = (tagRows ?? []) as any[];
      const tagIds = tags.map((t) => t.id);

      let commentsByTag: Record<string, any[]> = {};
      if (tagIds.length > 0) {
        const { data: commentRows } = await supabase
          .from("paper_comments")
          .select("id, tag_id, author_id, body, created_at, profiles(nickname)")
          .in("tag_id", tagIds)
          .order("created_at", { ascending: true });

        for (const c of (commentRows ?? []) as any[]) {
          commentsByTag[c.tag_id] = commentsByTag[c.tag_id] || [];
          commentsByTag[c.tag_id].push({
            author: c.profiles?.nickname || "member",
            body: c.body,
            created_at: c.created_at,
          });
        }
      }

      // Dynamically import the HTML export generator (client-side)
      const { generateAnalysisHtml } = await import("@/lib/white-paper-html-export");
      const html = generateAnalysisHtml({
        attachment,
        decompositions: (decompRows ?? []) as any[],
        diagrams: (diagramRows ?? []) as any[],
        tags: tags.map((t) => ({
          name: t.name,
          color: t.color,
          comments: commentsByTag[t.id] || [],
        })),
      });

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(attachment.doc_title ?? attachment.file_name).replace(/[^a-zA-Z0-9]/g, "_")}_analysis.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("[ResearchPaperCard] download failed:", err);
    } finally {
      setDownloading(false);
    }
  }

  function exportMarkdown() {
    setShowExportMenu(false);
    const lines: string[] = [
      `# ${attachment.doc_title || attachment.file_name}`,
      "",
      `**Authors:** ${attachment.authors?.join(", ") || "N/A"}`,
      `**Venue:** ${attachment.venue || "N/A"}`,
      `**Year:** ${attachment.year || "N/A"}`,
      `**DOI:** ${attachment.doi || "N/A"}`,
      "",
      "## Analysis",
      ...decompositions.map((d) => `### ${d.result_json.title || d.pass_type}\n\n${d.result_json.content}`),
      "",
      "## Keywords",
      attachment.keywords?.join(", ") || "N/A",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(attachment.doc_title || attachment.file_name).replace(/[^a-z0-9]/gi, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportBibTeX() {
    setShowExportMenu(false);
    const key = (attachment.doc_title || attachment.file_name).replace(/[^a-z0-9]/gi, "").slice(0, 20);
    const bib = `@article{${key},\n  title={${attachment.doc_title || attachment.file_name}},\n  author={${attachment.authors?.join(" and ") || "Unknown"}},\n  journal={${attachment.venue || "N/A"}},\n  year={${attachment.year || "N/A"}},\n  doi={${attachment.doi || ""}},\n}`;
    const blob = new Blob([bib], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${key}.bib`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportAPA() {
    setShowExportMenu(false);
    const authors = attachment.authors?.join(", ") || "Unknown";
    const year = attachment.year || "n.d.";
    const title = attachment.doc_title || attachment.file_name;
    const venue = attachment.venue || "";
    const doi = attachment.doi ? `https://doi.org/${attachment.doi}` : "";
    const apa = `${authors} (${year}). ${title}. ${venue}. ${doi}`;
    navigator.clipboard.writeText(apa).catch(() => {});
    alert("APA citation copied to clipboard");
  }

  function exportJSON() {
    setShowExportMenu(false);
    const payload = {
      paper: {
        title: attachment.doc_title || attachment.file_name,
        authors: attachment.authors,
        venue: attachment.venue,
        year: attachment.year,
        doi: attachment.doi,
        abstract: attachment.abstract,
        keywords: attachment.keywords,
      },
      analysis: decompositions.map((d) => ({
        pass: d.pass_type,
        title: d.result_json.title,
        content: d.result_json.content,
        key_points: d.result_json.key_points,
      })),
      diagrams: diagrams.map((d: any) => ({
        type: d.type,
        title: d.title,
        caption: d.caption,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(attachment.doc_title || attachment.file_name).replace(/[^a-z0-9]/gi, "_")}_analysis.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "analysis", label: "📄 Analysis", count: decompositions.length },
    { key: "diagrams", label: "📊 Diagrams", count: diagrams.length },
    { key: "citations", label: "📚 Citations" },
    { key: "discuss", label: "💬 Discuss" },
  ];


  return (
    <div data-attachment-id={attachment.id} className="mt-2 border border-stone-200 rounded-lg bg-husl-sageSoft/10 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-stone-200/60 bg-white/60">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-husl-clio/10 text-husl-clio text-[10px] font-semibold">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Research Paper
          </span>
          {attachment.doc_title && (
            <span className="text-xs text-husl-ink font-medium truncate max-w-[200px]">
              {attachment.doc_title}
            </span>
          )}
          {versions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowVersions((v) => !v)}
              className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium hover:bg-amber-100 transition-colors"
              title="Version history"
            >
              v{versions.length + 1}
            </button>
          )}
          {/* Paper lifecycle status badge */}
          {paperStatus && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              paperStatus === "ready"
                ? "bg-emerald-50 text-emerald-700"
                : paperStatus === "analyzing"
                ? "bg-amber-50 text-amber-700"
                : paperStatus === "reviewed"
                ? "bg-blue-50 text-blue-700"
                : paperStatus === "archived"
                ? "bg-stone-100 text-stone-500"
                : "bg-stone-50 text-stone-500"
            }`}>
              {paperStatus}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Reading status */}
          <select
            value={readingStatus}
            onChange={(e) => {
              const next = e.target.value;
              setReadingStatus(next);
              void supabase.from("paper_reading_status").upsert({
                attachment_id: attachment.id,
                user_id: userId,
                status: next,
              }, { onConflict: "attachment_id,user_id" }).then(() => {});
            }}
            className="text-[10px] px-1.5 py-1 rounded border border-stone-200 bg-white text-stone-600 focus:outline-none focus:ring-1 focus:ring-husl-clio"
            title="Reading status"
          >
            <option value="unread">Unread</option>
            <option value="reading">Reading</option>
            <option value="read">Read</option>
          </select>

          {/* Paper status lifecycle — hidden until admin/owner controls are added */}
          {/* <select value={paperStatus} ... ></select> */}

          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="text-[10px] font-medium px-1.5 py-1 rounded text-stone-500 hover:bg-stone-100 transition-colors"
            title="Help"
          >
            ?
          </button>

          {/* Export dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu((v) => !v)}
              className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
            >
              Export
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-stone-200 rounded shadow-lg z-20 min-w-[120px]">
                <button type="button" onClick={() => exportMarkdown()} className="block w-full text-left text-[10px] px-3 py-1.5 hover:bg-stone-50">Markdown</button>
                <button type="button" onClick={() => exportBibTeX()} className="block w-full text-left text-[10px] px-3 py-1.5 hover:bg-stone-50">BibTeX</button>
                <button type="button" onClick={() => exportAPA()} className="block w-full text-left text-[10px] px-3 py-1.5 hover:bg-stone-50">APA</button>
                <button type="button" onClick={() => exportJSON()} className="block w-full text-left text-[10px] px-3 py-1.5 hover:bg-stone-50">JSON</button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-40 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {downloading ? "..." : "Download"}
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="px-3 py-2 border-b border-stone-200/60 bg-amber-50/50 text-xs text-stone-700 space-y-1">
          <p className="font-medium text-husl-ink">About this analysis:</p>
          <ul className="list-disc list-inside space-y-0.5 text-stone-600">
            <li><b>Analysis</b> — Sage breaks the paper into 7 passes, including Problem Statement, Structure Map, Core Argument, Terminology, Evidence & Gaps, <b>Results & Reproducibility</b>, and Compression. Notes you add can be <b>private</b> (only you see them) or <b>public</b> (all cluster members see them)</li>
            <li><b>Diagrams</b> — Visual summaries. Scroll to zoom, drag to pan, click Reset to restore view</li>
            <li><b>Citations</b> — See papers this work cites and papers that cite it (auto-linked by title mentions)</li>
            <li><b>Discuss</b> — Create Discussion Threads (e.g., #methodology) to discuss specific aspects with other members</li>
            <li><b>Export</b> — Download as Markdown, BibTeX, APA, or structured JSON (for importing into reference managers and spreadsheets)</li>
            <li><b>Reading status</b> (Unread / Reading / Read) is personal — only you see your own tracking</li>
            <li>Mention <b>@sage</b> in any reply to ask for deeper analysis or help</li>
            <li>Document names must be unique in this cluster</li>
          </ul>
        </div>
      )}

      {showVersions && versions.length > 0 && (
        <div className="px-3 py-2 border-b border-stone-200/60 dark:border-stone-700/60 bg-amber-50/30 dark:bg-amber-900/20 text-xs space-y-1">
          <p className="font-medium text-stone-700 dark:text-stone-300">Version history</p>
          <ul className="space-y-1">
            {versions.map((v) => (
              <li key={v.id} className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                <span className="text-[10px] font-semibold px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                  v{v.version_number}
                </span>
                <span className="truncate">{v.notes || "Updated version"}</span>
                <span className="text-stone-400 dark:text-stone-500 shrink-0">{new Date(v.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-stone-200/60 dark:border-stone-700/60 bg-white/40 dark:bg-[#1a1d22]/40 px-2 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.key}
            data-tab={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`text-[11px] font-medium px-2.5 py-1.5 transition-colors relative min-w-[72px] whitespace-nowrap ${
              activeTab === t.key
                ? "text-husl-ink dark:text-stone-200"
                : "text-husl-muted dark:text-stone-400 hover:text-husl-ink dark:hover:text-stone-200"
            }`}
          >
            {t.label}
            {typeof t.count === "number" && t.count > 0 && (
              <span className="ml-1 text-[10px] text-husl-clio">{t.count}</span>
            )}
            {activeTab === t.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-husl-clio" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-3 py-2">
        {loading ? (
          <div className="animate-pulse space-y-3 py-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-stone-200 shrink-0" />
              <div className="h-3 w-24 bg-stone-200 rounded" />
            </div>
            <div className="space-y-2 pl-6">
              <div className="h-4 w-full bg-stone-200 rounded" />
              <div className="h-4 w-5/6 bg-stone-200 rounded" />
              <div className="h-4 w-4/5 bg-stone-200 rounded" />
              <div className="h-4 w-3/4 bg-stone-200 rounded" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <div className="w-4 h-4 rounded-full bg-stone-200 shrink-0" />
              <div className="h-3 w-20 bg-stone-200 rounded" />
            </div>
            <div className="space-y-2 pl-6">
              <div className="h-32 w-full bg-stone-200 rounded-lg" />
            </div>
          </div>
        ) : (
          <>
            {activeTab === "analysis" && (
              <div className="space-y-2">
                <PaperMetadataCard attachment={attachment} />
                <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-husl-sageSoft/20">
                  <div className="relative w-4 h-4 rounded-full overflow-hidden bg-white/60 shrink-0">
                    <img
                      src={withBasePath("/characters/sage.png")}
                      alt="Sage"
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <span className="text-[10px] font-medium text-husl-sage uppercase tracking-wider">
                    Sage · Analysis
                  </span>
                </div>
                {decompositions.length === 0 ? (
                  <div className="flex items-center gap-2 px-2 py-3 rounded-lg border border-amber-200 bg-amber-50/50 text-xs text-stone-600">
                    <svg className="w-3 h-3 text-amber-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Analysis is being generated — check back in about a minute.
                  </div>
                ) : (
                  <PaperDecomposition items={decompositions} userId={userId} attachmentId={attachment.id} />
                )}
              </div>
            )}
            {activeTab === "diagrams" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-husl-sageSoft/20">
                  <div className="relative w-4 h-4 rounded-full overflow-hidden bg-white/60 shrink-0">
                    <img
                      src={withBasePath("/characters/sage.png")}
                      alt="Sage"
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <span className="text-[10px] font-medium text-husl-sage uppercase tracking-wider">
                    Sage · Diagrams
                  </span>
                </div>
                <PaperDiagramViewer diagrams={diagrams} isAnalyzing={isAnalyzing} extractedText={attachment.extracted_text ?? ""} />
              </div>
            )}
            {activeTab === "citations" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-husl-sageSoft/20">
                  <div className="relative w-4 h-4 rounded-full overflow-hidden bg-white/60 shrink-0">
                    <img
                      src={withBasePath("/characters/sage.png")}
                      alt="Sage"
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <span className="text-[10px] font-medium text-husl-sage uppercase tracking-wider">
                    Sage · Citations
                  </span>
                </div>
                <PaperCitationLinks attachmentId={attachment.id} isAnalyzing={isAnalyzing} />
              </div>
            )}
            {activeTab === "discuss" && (
              <PaperTagThreads attachmentId={attachment.id} userId={userId} isAnalyzing={isAnalyzing} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
