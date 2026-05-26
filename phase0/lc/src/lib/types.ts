/**
 * Shared types for Long Conversation.
 *
 * Mirrors the MVP types but trimmed to what this cluster actually uses
 * (no dua_vault, no Arabic-specific types, no premium Manager structure).
 */

export interface Profile {
  id: string;
  cluster_id: string;
  nickname: string;
  /**
   * Self-declared gender at signup. Single-value: "male" | "female" |
   * "non_binary". Stored in the legacy `gender` text column.
   *
   * Note: cluster creation (when we build it) uses a separate `genders`
   * text[] column on the cluster config — that column allows multi-
   * select because a founder may want a cluster open to multiple
   * genders. User identity at signup is single-select; cluster
   * audience filter is multi-select. Different purposes, different
   * fields.
   */
  gender: "male" | "female" | "non_binary" | "";
  /** Country at signup. India-primary but not gated. */
  country: string | null;
  /** Birth year — used for AGGIL fit signal. */
  birth_year: number | null;
  avatar_url: string | null;
  onboarded: boolean;
  /** "member" | "admin" for this cluster (LC uses simpler role vocab). */
  role: "member" | "admin";
  /**
   * True for the member whose request produced this cluster (Source A
   * in the intake taxonomy — see
   * docs/AMA_CLUSTER_CREATION_AND_FOUNDING_FEEDBACK.md). Triggers the
   * founding-feedback prompt on first session. For LC, this is Tas.
   */
  is_founding_member: boolean;
  /**
   * When the founding-member feedback prompt was closed. NULL = not
   * yet shown. Once stamped, the prompt never fires again.
   */
  founding_feedback_at: string | null;
  /**
   * Why the prompt closed. NULL when prompt never fired.
   */
  founding_feedback_close_reason:
    | "accepted"
    | "changes_applied"
    | "changes_queued"
    | "silent_close"
    | null;
  /**
   * Whether the founding member has opted in to showing the Founder
   * badge next to their nickname. Offered by Clio after the founding-
   * feedback interaction closes.
   */
  founding_badge_shown: boolean;
  created_at: string;
}

export interface Post {
  id: string;
  cluster_id: string;
  author_id: string | null;
  parent_id: string | null;
  content: string;
  is_sage: boolean;
  is_sage_question: boolean;
  /** "unattended" | "attended" | "welfare_flagged" */
  thread_state: string;
  created_at: string;
}

export interface PostWithAuthor extends Post {
  profiles: Profile | null;
}

/**
 * Trigger types for the private tip mechanic. See
 * `clio/CLIO_CLUSTER_HOST_CONTEXT.md` §11.3 (canonical spec).
 */
export type ClioTipTrigger =
  | "guarded_intellectual"
  | "hedged_vulnerability"
  | "question_reveals_want"
  | "interested_but_guarded"
  | "no_post_48h"
  | "complementary_a"
  | "complementary_b";

export type ClioTipSuppressionReason =
  | "dependency_prevention"
  | "cluster_repetition_limit"
  | "welfare_flagged"
  | "frequency_limit_24h"
  | "pattern_repetition_14d";

export interface ClioTipLogRow {
  id: string;
  cluster_id: string;
  user_id: string;
  trigger_type: ClioTipTrigger;
  source_post_id: string | null;
  tip_content: string;
  tip_delivered_at: string;
  member_acted: boolean | null;
  suppression_reason: ClioTipSuppressionReason | null;
  created_at: string;
}
