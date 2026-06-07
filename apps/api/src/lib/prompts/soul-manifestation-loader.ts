import { SupabaseClient } from '@supabase/supabase-js';
import {
  SoulManifestationProfile,
  formatSoulManifestationBlock,
  compressSoulManifestationProfile,
  isValidSoulManifestationProfile,
  ClusterConfigExtension,
} from '../../../../../packages/supabase/types/database';

interface LoadOptions {
  compressed?: boolean;
  maxTokens?: number;
}

const DEFAULT_MAX_TOKENS = 120;
const APPROX_CHARS_PER_TOKEN = 4;

/**
 * Loads the Soul manifestation profile for a cluster.
 *
 * Resolution order (first match wins):
 *   1. cluster_config.soul_manifestation_profile (cached, fastest)
 *   2. cluster_specs.spec->soul_manifestation_profile (source of truth)
 *   3. null (fallback to inference from cluster_vibe at builder level)
 *
 * @param clusterId  The cluster UUID
 * @param supabase   Supabase client (service role)
 * @returns          SoulManifestationProfile or null if not configured
 */
export async function loadSoulManifestationProfile(
  clusterId: string,
  supabase: SupabaseClient
): Promise<SoulManifestationProfile | null> {
  // Fast path: cached profile in cluster_config
  const { data: configRow, error: configErr } = await supabase
    .from('cluster_config')
    .select('soul_manifestation_profile')
    .eq('cluster_id', clusterId)
    .maybeSingle();

  if (configErr) {
    console.warn('[soul-manifestation-loader] cluster_config read failed:', configErr.message);
  }

  const cached = (configRow as ClusterConfigExtension | null)?.soul_manifestation_profile;
  if (cached && isValidSoulManifestationProfile(cached)) {
    return cached as SoulManifestationProfile;
  }

  // Fallback: read from cluster_specs
  const { data: specRow, error: specErr } = await supabase
    .from('cluster_specs')
    .select('spec')
    .eq('cluster_id', clusterId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (specErr) {
    console.warn('[soul-manifestation-loader] cluster_specs read failed:', specErr.message);
    return null;
  }

  const profile = specRow?.spec?.soul_manifestation_profile;
  if (profile && isValidSoulManifestationProfile(profile)) {
    // Cache it back to cluster_config for next lookup (fire-and-forget)
    supabase
      .from('cluster_config')
      .update({ soul_manifestation_profile: profile })
      .eq('cluster_id', clusterId)
      .then(() => {})
      .catch((e) => console.warn('[soul-manifestation-loader] cache write failed:', e.message));

    return profile as SoulManifestationProfile;
  }

  return null;
}

/**
 * Formats a SoulManifestationProfile for prompt injection.
 *
 * If the formatted block exceeds maxTokens (default 120), it is automatically
 * compressed to a single-line summary.
 *
 * @param profile  The loaded profile (may be null)
 * @param opts     { compressed?: boolean; maxTokens?: number }
 * @returns        Structured block string or empty string
 */
export function formatProfileForPrompt(
  profile: SoulManifestationProfile | null,
  opts: LoadOptions = {}
): string {
  if (!profile) return '';

  const { compressed = false, maxTokens = DEFAULT_MAX_TOKENS } = opts;

  if (compressed) {
    return compressSoulManifestationProfile(profile);
  }

  const block = formatSoulManifestationBlock(profile);
  const estimatedTokens = Math.ceil(block.length / APPROX_CHARS_PER_TOKEN);

  if (estimatedTokens > maxTokens) {
    return compressSoulManifestationProfile(profile);
  }

  return block;
}

/**
 * Returns a default SoulManifestationProfile inferred from cluster metadata.
 * Used as a graceful fallback when no explicit profile is configured.
 *
 * @param purpose   Cluster purpose text
 * @param tags      Cluster tags array
 * @returns         Inferred profile (all fields populated)
 */
export function inferSoulManifestationProfile(
  purpose: string,
  tags: string[] = []
): SoulManifestationProfile {
  const purposeLower = purpose.toLowerCase();
  const tagSet = new Set(tags.map((t) => t.toLowerCase()));

  // Educational clusters
  if (
    purposeLower.includes('teach') ||
    purposeLower.includes('learn') ||
    purposeLower.includes('study') ||
    purposeLower.includes('fractions') ||
    tagSet.has('education') ||
    tagSet.has('learning')
  ) {
    return {
      primary_register: 'inquiry',
      scripture_usage: 'rare',
      silence_expectation: 'medium',
      vulnerability_surface: 'guarded',
      conflict_mode: 'truth_telling',
      celebration_mode: 'earned',
    };
  }

  // Professional / career clusters
  if (
    purposeLower.includes('career') ||
    purposeLower.includes('work') ||
    purposeLower.includes('startup') ||
    purposeLower.includes('professional') ||
    tagSet.has('career') ||
    tagSet.has('professional')
  ) {
    return {
      primary_register: 'rigor',
      scripture_usage: 'none',
      silence_expectation: 'low',
      vulnerability_surface: 'closed',
      conflict_mode: 'accountability',
      celebration_mode: 'milestone',
    };
  }

  // Parenting / family clusters
  if (
    purposeLower.includes('parent') ||
    purposeLower.includes('family') ||
    purposeLower.includes('child') ||
    tagSet.has('parenting')
  ) {
    return {
      primary_register: 'warmth',
      scripture_usage: 'occasional',
      silence_expectation: 'medium',
      vulnerability_surface: 'honoured',
      conflict_mode: 'reconciliation',
      celebration_mode: 'gratitude',
    };
  }

  // Faith / spiritual clusters
  if (
    purposeLower.includes('faith') ||
    purposeLower.includes('spiritual') ||
    purposeLower.includes('quran') ||
    purposeLower.includes('dua') ||
    tagSet.has('faith') ||
    tagSet.has('spirituality')
  ) {
    return {
      primary_register: 'reverence',
      scripture_usage: 'frequent',
      silence_expectation: 'high',
      vulnerability_surface: 'sacred',
      conflict_mode: 'forgiveness',
      celebration_mode: 'gratitude',
    };
  }

  // Creative / artistic clusters
  if (
    purposeLower.includes('art') ||
    purposeLower.includes('creative') ||
    purposeLower.includes('write') ||
    purposeLower.includes('music') ||
    tagSet.has('creative') ||
    tagSet.has('art')
  ) {
    return {
      primary_register: 'playfulness',
      scripture_usage: 'rare',
      silence_expectation: 'low',
      vulnerability_surface: 'honoured',
      conflict_mode: 'truth_telling',
      celebration_mode: 'earned',
    };
  }

  // Default: generic community cluster
  return {
    primary_register: 'warmth',
    scripture_usage: 'occasional',
    silence_expectation: 'medium',
    vulnerability_surface: 'guarded',
    conflict_mode: 'reconciliation',
    celebration_mode: 'gratitude',
  };
}
