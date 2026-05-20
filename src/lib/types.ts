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
