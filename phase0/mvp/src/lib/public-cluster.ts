/**
 * Public-cluster surface — the *only* layer strangers (and bots) read.
 *
 * Contract:
 *   - Reads ONLY from public.public_cluster_view (anon-readable view).
 *   - Never returns member content, replies, agent thoughts, welfare
 *     flags, vault gap requests, or anything that could leak member
 *     activity.
 *   - Member counts are returned as brackets ('0-9', '10-49', '50-249',
 *     '250+'). Exact counts only surface inside the cluster after
 *     sign-in.
 *
 * The shape is deliberately lean. If you find yourself adding a field
 * that names individual members or quotes their posts, stop — it
 * doesn't belong here.
 */

import { createServerClient } from "@supabase/ssr";

export interface PublicClusterDemographicChip {
  icon: string;
  label: string;
}

export interface PublicClusterMeta {
  display_name: string;
  tagline: string;
  description: string;
  demographic_chips: PublicClusterDemographicChip[];
  accent_from: string;
  accent_to: string;
  capabilities_copy: string[];
  vault_public_opt_in: boolean;
  anchor_seed_post_id: string | null;
}

export interface PublicClusterPulse {
  id: string;
  source_title: string;
  source_publisher: string | null;
  source_url: string;
  sage_witness_line: string | null;
  surfaced_at: string;
}

export interface PublicCluster {
  cluster_id: string;
  public_slug: string;
  meta: PublicClusterMeta;
  member_count_bracket: "0-9" | "10-49" | "50-249" | "250+";
  joined_this_week: number | null;
  anchor_seed_text: string | null;
  anchor_seed_at: string | null;
  latest_pulse: PublicClusterPulse | null;
  updated_at: string;
}

const DEFAULT_META: PublicClusterMeta = {
  display_name: "Aggilo cluster",
  tagline: "",
  description: "",
  demographic_chips: [],
  accent_from: "#0b3a2c",
  accent_to: "#1a6f4a",
  capabilities_copy: [],
  vault_public_opt_in: false,
  anchor_seed_post_id: null,
};

function normaliseMeta(raw: unknown): PublicClusterMeta {
  if (!raw || typeof raw !== "object") return DEFAULT_META;
  const m = raw as Record<string, unknown>;
  const chips = Array.isArray(m.demographic_chips)
    ? (m.demographic_chips as Array<Record<string, unknown>>).map((c) => ({
        icon: String(c.icon ?? ""),
        label: String(c.label ?? ""),
      }))
    : [];
  const capabilities = Array.isArray(m.capabilities_copy)
    ? (m.capabilities_copy as unknown[]).map(String)
    : [];
  return {
    display_name: String(m.display_name ?? DEFAULT_META.display_name),
    tagline: String(m.tagline ?? ""),
    description: String(m.description ?? ""),
    demographic_chips: chips,
    accent_from: String(m.accent_from ?? DEFAULT_META.accent_from),
    accent_to: String(m.accent_to ?? DEFAULT_META.accent_to),
    capabilities_copy: capabilities,
    vault_public_opt_in: Boolean(m.vault_public_opt_in ?? false),
    anchor_seed_post_id:
      typeof m.anchor_seed_post_id === "string" && m.anchor_seed_post_id.length > 0
        ? m.anchor_seed_post_id
        : null,
  };
}

interface PublicClusterRow {
  cluster_id: string;
  public_slug: string;
  public_meta: unknown;
  member_count_bracket: PublicCluster["member_count_bracket"];
  joined_this_week: number | null;
  anchor_seed_text: string | null;
  anchor_seed_at: string | null;
  latest_pulse_id: string | null;
  latest_pulse_title: string | null;
  latest_pulse_publisher: string | null;
  latest_pulse_url: string | null;
  latest_pulse_witness_line: string | null;
  latest_pulse_at: string | null;
  updated_at: string;
}

/**
 * Anonymous Supabase client. Does NOT read auth cookies — by design.
 * Strangers reach the public preview without signing in, and we want
 * RLS to enforce the public_cluster_view boundary even when this code
 * is called server-side from a request with no cookies.
 */
function createAnonClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          /* no-op — no session, no cookies to write */
        },
      },
    }
  );
}

function rowToPublicCluster(row: PublicClusterRow): PublicCluster {
  const pulse: PublicClusterPulse | null =
    row.latest_pulse_id && row.latest_pulse_title && row.latest_pulse_url && row.latest_pulse_at
      ? {
          id: row.latest_pulse_id,
          source_title: row.latest_pulse_title,
          source_publisher: row.latest_pulse_publisher,
          source_url: row.latest_pulse_url,
          sage_witness_line: row.latest_pulse_witness_line,
          surfaced_at: row.latest_pulse_at,
        }
      : null;
  return {
    cluster_id: row.cluster_id,
    public_slug: row.public_slug,
    meta: normaliseMeta(row.public_meta),
    member_count_bracket: row.member_count_bracket,
    joined_this_week: row.joined_this_week,
    anchor_seed_text: row.anchor_seed_text,
    anchor_seed_at: row.anchor_seed_at,
    latest_pulse: pulse,
    updated_at: row.updated_at,
  };
}

/**
 * Look up a publicly listed cluster by its slug. Returns null if the
 * slug doesn't exist or the cluster's admin has not opted in to public
 * listing. Either way, the response is the same — strangers cannot
 * tell from the response whether a private cluster of that name exists.
 */
export async function getPublicClusterBySlug(slug: string): Promise<PublicCluster | null> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("public_cluster_view")
    .select(
      "cluster_id, public_slug, public_meta, member_count_bracket, joined_this_week, anchor_seed_text, anchor_seed_at, latest_pulse_id, latest_pulse_title, latest_pulse_publisher, latest_pulse_url, latest_pulse_witness_line, latest_pulse_at, updated_at"
    )
    .eq("public_slug", slug)
    .maybeSingle<PublicClusterRow>();
  if (error || !data) return null;
  return rowToPublicCluster(data);
}

/**
 * List every publicly listed cluster. Used by the sitemap.
 */
export async function listPublicClusters(): Promise<PublicCluster[]> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("public_cluster_view")
    .select(
      "cluster_id, public_slug, public_meta, member_count_bracket, joined_this_week, anchor_seed_text, anchor_seed_at, latest_pulse_id, latest_pulse_title, latest_pulse_publisher, latest_pulse_url, latest_pulse_witness_line, latest_pulse_at, updated_at"
    )
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return (data as PublicClusterRow[]).map(rowToPublicCluster);
}

/**
 * Bracket → human-readable string used on the preview page.
 * The bracket itself never reveals an exact count.
 */
export function formatMemberBracket(bracket: PublicCluster["member_count_bracket"]): string {
  switch (bracket) {
    case "0-9":
      return "A small founding circle";
    case "10-49":
      return "Tens of sisters";
    case "50-249":
      return "A growing room";
    case "250+":
      return "Hundreds of sisters";
  }
}

/**
 * Site URL helper. Defaults to mvp.aggilo.in but can be overridden via
 * env (e.g. for staging or for a future cutover to aggilo.in/c/).
 */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mvp.aggilo.in";
  return raw.replace(/\/+$/, "");
}

export function publicClusterUrl(slug: string): string {
  return `${siteUrl()}/c/${slug}`;
}
