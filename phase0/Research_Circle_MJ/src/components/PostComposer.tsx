"use client";

/**
 * PostComposer — Research Circle MJ.
 *
 * Sticky bottom compose bar. Two operations on submit:
 *   1. Insert the post into Supabase (writes the row, RLS authorises by
 *      auth.uid() = author_id; Realtime fires INSERT to the cluster channel).
 *   2. Fire-and-forget POST to /api/sage/evaluate so Sage can decide
 *      whether to respond. The user never waits for Sage.
 *
 * Optimistic UX: the post appears in the feed immediately on submit,
 * before the Supabase write returns. If the server rejects, we roll
 * back. The realtime channel's later INSERT for the same row is
 * deduplicated by id in useRealtimePosts.
 *
 * The placeholder rotates through cluster-specific prompts. None of
 * them are scripts — they are invitations. They follow the rule from
 * the cluster spec: "Nobody's set the tone yet" / "What's the version
 * of this you've actually lived?" — present tense, specific,
 * non-prescriptive.
 */

import { useState, useCallback, useEffect, useRef, type FormEvent, type ChangeEvent } from "react";
import { createClient } from "@/lib/supabase-browser";
import { CLUSTER_ID } from "@/lib/cluster";
import { withBasePath } from "@/lib/path";
import { track } from "@/lib/track";
import type { PostWithAuthor, Profile, Topic } from "@/lib/types";

interface PostComposerProps {
  userId: string;
  profile: Profile;
  onOptimisticPost: (post: PostWithAuthor) => void;
  onConfirmPost: (tempId: string, confirmed: PostWithAuthor) => void;
  onSageInvoked?: (threadRootId: string) => void;
  onTopicsAssigned?: (postId: string, topics: Topic[]) => void;
  activeTopic?: Topic | null;
}

const PLACEHOLDERS = [
  "Share a draft, a question, or a finding…",
  "What are you working on right now?",
  "Nobody's set the tone yet.",
  "What's the paper or idea you keep coming back to?",
  "Drop a document or link — Sage will tag it.",
];

function pickPlaceholder(): string {
  return PLACEHOLDERS[0];
}

export default function PostComposer({
  userId,
  profile,
  onOptimisticPost,
  onConfirmPost,
  onSageInvoked,
  onTopicsAssigned,
  activeTopic,
}: PostComposerProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestingTip, setRequestingTip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(
    activeTopic ? [activeTopic.id] : []
  );
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [topicSearch, setTopicSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [creatingTopic, setCreatingTopic] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const placeholder = pickPlaceholder();

  // Load available topics for the dropdown
  useEffect(() => {
    let cancelled = false;
    fetch(withBasePath("/api/topics"))
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setAvailableTopics((d.topics ?? []) as Topic[]);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);


  // Close dropdown on outside click
  useEffect(() => {
    if (!showTopicDropdown) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTopicDropdown(false);
        setShowCreateForm(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showTopicDropdown]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const trimmed = content.trim();
      if (!trimmed || submitting) return;

      setSubmitting(true);
      setError(null);
      setShowTopicDropdown(false);
      setShowCreateForm(false);

      // ── Optimistic insert ──────────────────────────────────────
      const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const now = new Date().toISOString();
      const optimisticPost: PostWithAuthor = {
        id: tempId,
        cluster_id: CLUSTER_ID,
        author_id: userId,
        parent_id: null,
        content: trimmed,
        is_sage: false,
        is_sage_question: false,
        thread_state: "unattended",
        created_at: now,
        profiles: profile,
      };
      onOptimisticPost(optimisticPost);
      track("post_composed", { length: trimmed.length });
      setContent("");

      // ── Server insert ──────────────────────────────────────────
      // Two-step approach (resilient to embed ambiguity):
      //   1. INSERT and return the basic row (no embed)
      //   2. attach the current user's profile in memory
      // This avoids depending on the FK-disambiguation hint at insert
      // time and gives a clean error path when only the insert fails.
      const supabase = createClient();
      const { data: inserted, error: insertError } = await supabase
        .from("posts")
        .insert({
          cluster_id: CLUSTER_ID,
          author_id: userId,
          content: trimmed,
          is_sage: false,
          is_sage_question: false,
          thread_state: "unattended",
        })
        .select("*")
        .single();

      if (insertError || !inserted) {
        // Roll back the optimistic insert by surfacing an error and
        // re-populating the textarea so the user can retry.
        const detail = insertError?.message ?? "unknown error";
        // Console-log the actual error so devs can debug — the inline
        // message stays generic for the user.
        console.warn("[PostComposer] insert failed:", detail, insertError);
        setError(`Couldn't post that. ${detail}`);
        setContent(trimmed);
        track("post_compose_failed", { reason: detail });
        setSubmitting(false);
        return;
      }

      // Attach the current user's profile. The realtime UPDATE/INSERT
      // events that other clients receive use a separate hydration
      // path (see useRealtimePosts), so this attachment is local to
      // the optimistic→confirmed swap on this client only.
      const confirmed: PostWithAuthor = {
        ...(inserted as PostWithAuthor),
        profiles: profile,
      };

      onConfirmPost(tempId, confirmed);
      track("post_compose_confirmed");

      // Scroll to the newly confirmed post
      setTimeout(() => {
        const el = document.getElementById(`post-${inserted.id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-husl-clio", "ring-offset-2", "rounded-lg");
          setTimeout(() => el.classList.remove("ring-2", "ring-husl-clio", "ring-offset-2", "rounded-lg"), 3000);
        }
      }, 100);

      // ── Assign topics ───────────────────────────────────────────
      if (selectedTopicIds.length > 0) {
        void fetch(withBasePath(`/api/posts/${inserted.id}/topics`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic_ids: selectedTopicIds }),
        }).then(() => {
          if (onTopicsAssigned) {
            const assignedTopics = availableTopics.filter((t) => selectedTopicIds.includes(t.id));
            onTopicsAssigned(inserted.id, assignedTopics);
          }
        }).catch(() => {});
      }

      // ── Upload file if selected ────────────────────────────────
      if (selectedFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("post_id", inserted.id);
        fetch(withBasePath("/api/upload"), {
          method: "POST",
          body: formData,
        })
          .then(() => {
            setSelectedFile(null);
          })
          .catch(() => {})
          .finally(() => setUploading(false));
      }

      // ── Fire-and-forget Sage evaluation ─────────────────────────
      const mentionsSage = /@sage\b/i.test(trimmed);
      if (mentionsSage && onSageInvoked) {
        onSageInvoked(inserted.id);
      }
      void fetch(withBasePath("/api/sage/evaluate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: inserted.id }),
      }).catch(() => {});

      setSubmitting(false);
    },
    [content, submitting, userId, profile, onOptimisticPost, onConfirmPost, onSageInvoked, onTopicsAssigned, selectedTopicIds, selectedFile, availableTopics]
  );

  async function handleCreateTopic() {
    const name = newTopicName.trim();
    if (!name || creatingTopic) return;
    setCreatingTopic(true);
    try {
      const res = await fetch(withBasePath("/api/topics"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as { topic?: Topic; error?: string };
      if (data.topic) {
        setAvailableTopics((prev) => [...prev, data.topic!]);
        setSelectedTopicIds((prev) => [...prev, data.topic!.id]);
        setNewTopicName("");
        setShowCreateForm(false);
        setTopicSearch("");
        track("topic_created_from_composer", { name: data.topic!.name });
      } else {
        setError(data.error ?? "Couldn't create topic.");
      }
    } catch {
      setError("Network error creating topic.");
    } finally {
      setCreatingTopic(false);
    }
  }

  const filteredTopics = topicSearch.trim()
    ? availableTopics.filter((t) => t.name.toLowerCase().includes(topicSearch.toLowerCase()))
    : availableTopics;

  const handleTipMe = useCallback(async () => {
    if (requestingTip) return;
    setRequestingTip(true);
    setError(null);
    try {
      const res = await fetch(withBasePath("/api/agents/clio-tips/manual"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, nickname: profile.nickname }),
      });
      if (res.ok) {
        window.dispatchEvent(new Event("clio-tip-inserted"));
      } else {
        const body = await res.json().catch(() => ({}));
        console.error("Tip request failed:", body);
        setError("Clio couldn't generate a tip right now. Try again later.");
      }
    } catch (err) {
      console.error("Failed to request tip:", err);
      setError("Couldn't reach Clio. Check your connection.");
    } finally {
      setRequestingTip(false);
    }
  }, [userId, profile.nickname, requestingTip]);

  return (
    <div id="husl-post-composer" className="sticky bottom-0 z-30 bg-husl-card/95 dark:bg-[#14161a]/95 backdrop-blur border-t border-stone-200 dark:border-stone-800 transition-colors pb-[env(safe-area-inset-bottom)]">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-3">
        {/* File preview + CIM status */}
        {selectedFile && (
          <div className={`mb-2 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors ${uploading ? 'bg-amber-50/50 border-amber-200 text-amber-700' : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-husl-ink dark:text-stone-200'}`}>
            {uploading ? (
              <svg className="w-4 h-4 text-amber-500 animate-spin shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-husl-clio shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            )}
            <span className="truncate flex-1">{uploading ? `Uploading ${selectedFile.name}…` : selectedFile.name}</span>
            {!uploading && (
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-husl-muted dark:text-stone-400 hover:text-rose-600 dark:hover:text-rose-400"
              >
                Remove
              </button>
            )}
          </div>
        )}

        {/* Selected topic chips */}
        {selectedTopicIds.length > 0 && (
          <div className="mb-2 flex items-center gap-1.5 flex-wrap">
            {selectedTopicIds.map((tid) => {
              const t = availableTopics.find((x) => x.id === tid);
              if (!t) return null;
              return (
                <span
                  key={tid}
                  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                >
                  {t.name}
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedTopicIds((prev) => prev.filter((id) => id !== tid))
                    }
                    className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}

        <div className="flex gap-2 items-end">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={1}
            maxLength={2000}
            className="flex-1 resize-none px-3 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-husl-card dark:bg-[#1a1d22] focus:outline-none focus:ring-2 focus:ring-husl-clio focus:border-transparent text-sm text-husl-ink dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-600 min-h-[44px] max-h-32 transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void handleSubmit(e as unknown as FormEvent);
              }
            }}
          />
          <button
            type="submit"
            disabled={!content.trim() || submitting || uploading}
            className="px-4 py-2.5 rounded-lg font-medium text-white bg-husl-clio hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {uploading ? "Uploading…" : submitting ? "…" : "Post"}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-xs text-rose-600">{error}</p>
        )}
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* File upload */}
            <label className="cursor-pointer text-[11px] text-husl-muted dark:text-stone-400 hover:text-husl-clio dark:hover:text-amber-400 transition-colors flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Attach
              <input
                type="file"
                className="hidden"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const f = e.target.files?.[0] ?? null;
                  setSelectedFile(f);
                }}
                accept=".pdf,.doc,.docx,.txt,image/*,video/*"
              />
            </label>

            {/* Topic selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowTopicDropdown((v) => !v);
                  setShowCreateForm(false);
                  setTopicSearch("");
                }}
                className="text-[11px] text-husl-muted dark:text-stone-400 hover:text-husl-clio dark:hover:text-amber-400 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Topics
              </button>
              {showTopicDropdown && (
                <div className="absolute bottom-full left-0 mb-1 w-56 max-h-52 overflow-y-auto rounded-lg border border-stone-200 dark:border-stone-700 bg-husl-card dark:bg-[#14161a] shadow-lg z-50 p-1">
                  {/* Search/filter */}
                  {!showCreateForm && (
                    <div className="px-1.5 pb-1 space-y-1">
                      <input
                        type="text"
                        value={topicSearch}
                        onChange={(e) => setTopicSearch(e.target.value)}
                        placeholder="Filter topics…"
                        className="w-full px-2 py-1 text-xs rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-husl-ink dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-husl-clio"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <p className="text-[10px] text-husl-muted dark:text-stone-500">
                        Topics help others find this post by theme.
                      </p>
                    </div>
                  )}

                  {/* Topic list */}
                  {!showCreateForm && (
                    <>
                      {filteredTopics.length === 0 ? (
                        <p className="px-2 py-1.5 text-[11px] text-husl-muted dark:text-stone-500">
                          {topicSearch ? "No matching topics." : "No topics yet."}
                        </p>
                      ) : (
                        filteredTopics.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setSelectedTopicIds((prev) =>
                                prev.includes(t.id)
                                  ? prev.filter((id) => id !== t.id)
                                  : [...prev, t.id]
                              );
                            }}
                            className={`w-full text-left px-2 py-1.5 text-xs rounded hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors ${
                              selectedTopicIds.includes(t.id) ? "text-husl-clio dark:text-amber-400 font-medium" : "text-husl-ink dark:text-stone-200"
                            }`}
                          >
                            {selectedTopicIds.includes(t.id) ? "✓ " : ""}
                            {t.name}
                          </button>
                        ))
                      )}
                      <div className="border-t border-stone-100 dark:border-stone-800 mt-1 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateForm(true);
                            setNewTopicName(topicSearch);
                          }}
                          className="w-full text-left px-2 py-1.5 text-xs text-husl-clio dark:text-amber-400 hover:bg-stone-50 dark:hover:bg-stone-800 rounded transition-colors flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          {topicSearch ? `Create "${topicSearch}"` : "Create new topic"}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Inline create form */}
                  {showCreateForm && (
                    <div className="px-1.5 py-1 space-y-2">
                      <p className="text-[10px] text-husl-muted dark:text-stone-500">Name your topic</p>
                      <input
                        type="text"
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        placeholder="e.g., Machine Learning"
                        className="w-full px-2 py-1 text-xs rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-husl-ink dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-husl-clio"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void handleCreateTopic();
                          }
                        }}
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateForm(false);
                            setNewTopicName("");
                          }}
                          className="text-[10px] text-husl-muted dark:text-stone-400 hover:text-husl-ink px-2 py-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleCreateTopic()}
                          disabled={!newTopicName.trim() || creatingTopic}
                          className="text-[10px] px-2 py-1 rounded bg-husl-clio text-white disabled:opacity-40 hover:bg-amber-700 transition-colors"
                        >
                          {creatingTopic ? "Creating…" : "Create"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="text-[11px] text-husl-muted dark:text-stone-400">
              Cmd/Ctrl + Enter to send.
            </p>
          </div>
          <button
            type="button"
            onClick={handleTipMe}
            disabled={requestingTip}
            className="text-[11px] text-husl-clio dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {requestingTip ? "Asking Clio..." : "Tip me, Clio"}
          </button>
        </div>
      </form>
    </div>
  );
}
