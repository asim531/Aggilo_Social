// ── Orchestrator types ──────────────────────────────────────────────────────
//
// These types back the cluster orchestrator board (Phase 0).
// A `Cluster` row is the provisioning record — it tracks lifecycle state,
// type, and health. It is separate from `cluster_config` (which tracks
// agent settings) and from the prompt registry (which tracks prompt modules).
//
// Lifecycle: create → active → drain → destroy
//   create  — row inserted, cluster not yet serving traffic
//   active  — cluster is live and serving members
//   drain   — cluster is winding down; no new members, existing members can still post
//   destroy — cluster is permanently shut down; row kept for audit
//
// The transition rules are enforced in cluster-orchestrator.ts and tested
// in src/lib/__tests__/cluster-orchestrator.test.ts.

export type ClusterStatus = "creating" | "active" | "draining" | "destroyed";

export type ClusterType = "generic" | "premium";

export interface Cluster {
  id: string;
  /** Stable snake_case identifier — matches cluster_id in posts, cluster_config, etc. */
  cluster_id: string;
  display_name: string;
  cluster_type: ClusterType;
  status: ClusterStatus;
  /** ISO 639-1 primary language code. */
  primary_language: string;
  /** Free-text notes for the platform admin. Never shown to members. */
  admin_notes: string | null;
  /**
   * Health signal — last time the cluster was confirmed reachable/active.
   * Null until the cluster first transitions to 'active'.
   * Phase 0: updated manually or by the admin board. Phase 1: automated health checks.
   *
   * TODO(product): Define the health check interval and SLA thresholds for
   * generic vs premium clusters before Phase 1 ships.
   */
  last_health_check_at: string | null;
  /**
   * Whether the cluster is currently healthy.
   * Null = not yet checked. True = healthy. False = degraded.
   *
   * TODO(product): Define what "degraded" means per cluster type
   * (e.g. LLM error rate > X%, welfare queue > Y unresolved).
   */
  is_healthy: boolean | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  /** Timestamp when the cluster transitioned to 'active'. */
  activated_at: string | null;
  /** Timestamp when the cluster transitioned to 'draining'. */
  drain_started_at: string | null;
  /** Timestamp when the cluster was destroyed. */
  destroyed_at: string | null;
}

export interface ClusterCreateInput {
  cluster_id: string;
  display_name: string;
  cluster_type: ClusterType;
  primary_language?: string;
  admin_notes?: string;
}

export interface ClusterTransitionInput {
  /** The target lifecycle status. */
  to_status: ClusterStatus;
  /** Optional reason for the transition — written to cluster_admin_actions. */
  reason?: string;
}

// ── End orchestrator types ───────────────────────────────────────────────────

export interface Profile {
  id: string;
  nickname: string;
  gender: string;
  country: string | null;
  avatar_url: string | null;
  onboarded: boolean;
  role: "member" | "manager" | "founder";
  created_at: string;
}

export type PostSubtype =
  | null
  | "host_content"
  | "arc_milestone"
  | "first_post_ack"
  | "reengagement"
  | "skill_dialogue"
  | "skill_dialogue_response"
  | "skill_activation"
  | "dialogue_transition"
  | "welcome";

export interface Post {
  id: string;
  author_id: string | null;
  parent_id: string | null;
  content: string;
  is_sage: boolean;
  is_sage_question: boolean;
  thread_state: "unattended" | "attended" | "welfare_flagged";
  post_subtype: PostSubtype;
  /** Timestamp Sage delegated private follow-up to Clio (soft handoff) */
  sage_handoff_to_clio_at: string | null;
  /** Why Sage handed off — drives the cluster-visible inline note */
  sage_handoff_reason: "welfare" | "personal_disclosure" | "fiqh_with_distress" | null;
  /** First URL found in the post content */
  link_url: string | null;
  /** Sage's alignment verdict for the linked content */
  link_alignment: "aligned" | "misaligned" | "evaluating" | null;
  /** Fetched metadata for the link preview card */
  link_meta: { title?: string; description?: string; thumbnail?: string; site_name?: string } | null;
  created_at: string;
}

export interface PostWithAuthor extends Post {
  profiles: Profile | null;
}

export interface PostWithReplies extends PostWithAuthor {
  replies: PostWithAuthor[];
}

export interface DuaVaultEntry {
  id: string;
  arabic_text: string;
  arabic_with_tajweed: string | null;
  transliteration: string;
  translation: string;
  source_type: "quran" | "hadith";
  source_collection: string;
  source_book_number: number | null;
  source_hadith_number: number | null;
  source_chapter_verse: string | null;
  source_page_hisnul: number | null;
  hadith_grade: "sahih" | "hasan" | "hasan_sahih" | null;
  occasion: string[];
  thematic_tags: string[];
  is_quranic: boolean;
  length_classification: "short" | "medium" | "long";
  verified_by_founder: boolean;
  notes: string | null;
  title: string | null;
  date_added: string;
}

export interface SageRequest {
  message: string;
  post_id: string;
}

export interface SageResponse {
  success: boolean;
  reply_id?: string;
  content?: string;
  error?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export type SageStatus = "idle" | "thinking" | "error";

// ── Sage → Clio soft handoff ────────────────────────────────────────────
//
// When Sage chooses silence on a tender disclosure but private follow-up
// would serve the member, Clio greets them in their private "Just between
// us" tab. Member chooses whether to engage. See:
//   - clio/CLIO_UNIFIED_CLUSTER_PRESENCE.md §6
//   - sage/AGENTS.md §4.5 "Private handoff"

export interface ClioHandoffGreeting {
  id: string;
  triggering_post_id: string;
  user_id: string;
  handoff_reason: "welfare" | "personal_disclosure" | "fiqh_with_distress";
  greeting_text: string;
  greeting_seen_at: string | null;
  greeting_responded_at: string | null;
  greeting_dismissed_at: string | null;
  created_at: string;
}
