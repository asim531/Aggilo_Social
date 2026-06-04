/**
 * Admin-side helpers for the cluster identity / Atlas / pulse panel.
 *
 * Distinct from `lib/public-cluster.ts` (anon-only, hardened against
 * accidental member-content leaks). This file uses the *user-scoped*
 * Supabase client and reads any column it likes — admin RLS is the
 * boundary, not the projection.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type AgentInvolvement = "min" | "medium" | "high";

export interface ClusterConfigRow {
  cluster_id: string;
  agent_involvement: AgentInvolvement;
  agent_disabled: boolean;
  free_text_guidance: string | null;
  parsed_directives: Record<string, unknown>;
  enabled_skills: string[];
  custom_skill_requests: unknown[];
  is_public_listed: boolean;
  public_slug: string | null;
  public_meta: Record<string, unknown>;
  atlas_rss_feeds: AtlasRssFeed[];
  updated_at: string;
  updated_by: string | null;
}

export interface AtlasRssFeed {
  id: string;
  url: string;
  label: string;
  active: boolean;
  added_at: string;
  added_by: string | null;
  last_fetched_at?: string | null;
  last_fetch_status?: string | null;
}

export interface ClusterPublicMeta {
  display_name: string;
  tagline: string;
  description: string;
  demographic_chips: { icon: string; label: string }[];
  accent_from: string;
  accent_to: string;
  capabilities_copy: string[];
  vault_public_opt_in: boolean;
  anchor_seed_post_id: string | null;
}

const DEFAULT_PUBLIC_META: ClusterPublicMeta = {
  display_name: "",
  tagline: "",
  description: "",
  demographic_chips: [],
  accent_from: "#0b3a2c",
  accent_to: "#1a6f4a",
  capabilities_copy: [],
  vault_public_opt_in: false,
  anchor_seed_post_id: null,
};

export function readPublicMeta(raw: unknown): ClusterPublicMeta {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PUBLIC_META };
  const m = raw as Record<string, unknown>;
  const chips = Array.isArray(m.demographic_chips)
    ? (m.demographic_chips as Array<Record<string, unknown>>).map((c) => ({
        icon: String(c.icon ?? ""),
        label: String(c.label ?? ""),
      }))
    : [];
  const caps = Array.isArray(m.capabilities_copy)
    ? (m.capabilities_copy as unknown[]).map(String)
    : [];
  return {
    display_name: String(m.display_name ?? ""),
    tagline: String(m.tagline ?? ""),
    description: String(m.description ?? ""),
    demographic_chips: chips,
    accent_from: String(m.accent_from ?? DEFAULT_PUBLIC_META.accent_from),
    accent_to: String(m.accent_to ?? DEFAULT_PUBLIC_META.accent_to),
    capabilities_copy: caps,
    vault_public_opt_in: Boolean(m.vault_public_opt_in ?? false),
    anchor_seed_post_id:
      typeof m.anchor_seed_post_id === "string" && m.anchor_seed_post_id.length > 0
        ? m.anchor_seed_post_id
        : null,
  };
}

/**
 * Look up the cluster_config row by either cluster_id or public_slug.
 * The admin URL uses the slug (e.g. /admin/clusters/sisters-in-dua), so
 * we accept either form to avoid forcing the caller to know which one
 * they have.
 */
export async function fetchClusterConfig(
  supabase: SupabaseClient,
  slugOrId: string
): Promise<ClusterConfigRow | null> {
  const { data } = await supabase
    .from("cluster_config")
    .select("*")
    .or(`public_slug.eq.${slugOrId},cluster_id.eq.${slugOrId}`)
    .maybeSingle<ClusterConfigRow>();
  return data ?? null;
}

/**
 * Append-only audit row helper. Every admin write goes through this.
 * Returns void on success — the caller doesn't need to do anything with
 * the row, only that it landed.
 */
export async function logAdminAction(
  supabase: SupabaseClient,
  args: {
    cluster_id: string;
    actor_id: string;
    actor_role: string;
    action_type: string;
    before_state?: unknown;
    after_state?: unknown;
    rationale?: string;
  }
): Promise<void> {
  await supabase.from("cluster_admin_actions").insert({
    cluster_id: args.cluster_id,
    actor_id: args.actor_id,
    actor_role: args.actor_role,
    action_type: args.action_type,
    before_state: args.before_state ?? null,
    after_state: args.after_state ?? null,
    rationale: args.rationale ?? null,
  });
}

/**
 * Slug validator — same shape as the public preview expects.
 * Lowercase, kebab-case, 3..64 chars, starts/ends with alphanumeric.
 */
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,62}[a-z0-9])?$/;

export function validateSlug(s: string): { ok: boolean; reason?: string } {
  if (!s) return { ok: false, reason: "Slug is required when public listing is on." };
  if (s.length < 3) return { ok: false, reason: "Slug must be at least 3 characters." };
  if (s.length > 64) return { ok: false, reason: "Slug must be at most 64 characters." };
  if (!SLUG_RE.test(s)) {
    return {
      ok: false,
      reason: "Slug must be lowercase, alphanumeric, and may use hyphens (no leading or trailing).",
    };
  }
  return { ok: true };
}

/**
 * Cheap URL validator for RSS feeds. We don't fetch here; the admin API
 * route does a HEAD check on save.
 */
export function looksLikeUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Stable RSS-feed id generator for newly-added rows. Doesn't need to be
 * cryptographically random — admin writes are server-side and gated.
 */
export function newFeedId(): string {
  return `rss_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
