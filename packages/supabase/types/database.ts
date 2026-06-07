// =============================================================================
// Aggilo Database Types — Auto-generated from Supabase Schema
// =============================================================================
// This file is manually maintained during development until full type generation
// is wired. Keep in sync with packages/supabase/migrations/.
//
// Last updated: Migration 022 (soul_manifestation.sql)
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// =============================================================================
// ENUMS
// =============================================================================

export type SoulManifestationRegister =
  | 'warmth'
  | 'rigor'
  | 'curiosity'
  | 'playfulness'
  | 'reverence'
  | 'inquiry'
  | 'admonition'
  | 'exhortation'
  | 'silence'
  | 'celebration';

export type ScriptureUsage = 'frequent' | 'occasional' | 'rare' | 'none';
export type SilenceExpectation = 'high' | 'medium' | 'low';
export type VulnerabilitySurface = 'sacred' | 'honoured' | 'guarded' | 'closed';
export type ConflictMode = 'reconciliation' | 'truth_telling' | 'forgiveness' | 'accountability';
export type CelebrationMode = 'earned' | 'gratitude' | 'milestone' | 'quiet';

export type PersonaOverrideType = 'full_replacement' | 'layered_modifier';
export type PersonaOverrideStatus = 'draft' | 'review' | 'approved' | 'active';

// =============================================================================
// SOUL MANIFESTATION PROFILE
// =============================================================================

export interface SoulManifestationProfile {
  primary_register?: SoulManifestationRegister | null;
  scripture_usage?: ScriptureUsage | null;
  silence_expectation?: SilenceExpectation | null;
  vulnerability_surface?: VulnerabilitySurface | null;
  conflict_mode?: ConflictMode | null;
  celebration_mode?: CelebrationMode | null;
}

// =============================================================================
// TABLE: cluster_persona_overrides
// =============================================================================

export interface ClusterPersonaOverride {
  id: string; // UUID
  cluster_id: string; // UUID → clusters.id
  override_type: PersonaOverrideType;
  persona_content: {
    recurring_phrases?: string[];
    words_never_used?: string[];
    emoji_rules?: string | null;
    humour_style?: string | null;
    greeting_template?: string | null;
    [key: string]: Json | undefined;
  };
  status: PersonaOverrideStatus;
  approved_by?: string | null; // UUID → profiles.id
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

export type ClusterPersonaOverrideInsert = Omit<ClusterPersonaOverride, 'id' | 'created_at' | 'updated_at'>;
export type ClusterPersonaOverrideUpdate = Partial<Omit<ClusterPersonaOverrideInsert, 'cluster_id'>>;

// =============================================================================
// TABLE: soul_manifestation_audit
// =============================================================================

export interface SoulManifestationAudit {
  id: string; // UUID
  cluster_id: string; // UUID → clusters.id
  profile: SoulManifestationProfile;
  changed_by: 'genesis_engine' | 'observer' | 'admin' | 'founder' | 'system';
  reason: string;
  created_at: string; // ISO 8601
}

export type SoulManifestationAuditInsert = Omit<SoulManifestationAudit, 'id' | 'created_at'>;

// =============================================================================
// EXTENDED TABLE TYPES (columns added in Migration 022)
// =============================================================================

// sage_personas: + soul_manifestation_notes
export interface SagePersonaExtension {
  soul_manifestation_notes?: string | null;
}

// clio_conversations: + manifestation_profile_snapshot
export interface ClioConversationExtension {
  manifestation_profile_snapshot?: SoulManifestationProfile | null;
}

// cluster_config: + persona_override_id, soul_manifestation_profile
export interface ClusterConfigExtension {
  persona_override_id?: string | null; // UUID → cluster_persona_overrides.id
  soul_manifestation_profile?: SoulManifestationProfile | null;
}

// =============================================================================
// VALIDATION
// =============================================================================

export function isValidSoulManifestationProfile(profile: unknown): profile is SoulManifestationProfile {
  if (typeof profile !== 'object' || profile === null) return false;
  const p = profile as Record<string, unknown>;

  const validRegisters: SoulManifestationRegister[] = [
    'warmth', 'rigor', 'curiosity', 'playfulness', 'reverence',
    'inquiry', 'admonition', 'exhortation', 'silence', 'celebration'
  ];
  const validScripture: ScriptureUsage[] = ['frequent', 'occasional', 'rare', 'none'];
  const validSilence: SilenceExpectation[] = ['high', 'medium', 'low'];
  const validSurface: VulnerabilitySurface[] = ['sacred', 'honoured', 'guarded', 'closed'];
  const validConflict: ConflictMode[] = ['reconciliation', 'truth_telling', 'forgiveness', 'accountability'];
  const validCelebration: CelebrationMode[] = ['earned', 'gratitude', 'milestone', 'quiet'];

  if (p.primary_register !== undefined && p.primary_register !== null && !validRegisters.includes(p.primary_register as SoulManifestationRegister)) return false;
  if (p.scripture_usage !== undefined && p.scripture_usage !== null && !validScripture.includes(p.scripture_usage as ScriptureUsage)) return false;
  if (p.silence_expectation !== undefined && p.silence_expectation !== null && !validSilence.includes(p.silence_expectation as SilenceExpectation)) return false;
  if (p.vulnerability_surface !== undefined && p.vulnerability_surface !== null && !validSurface.includes(p.vulnerability_surface as VulnerabilitySurface)) return false;
  if (p.conflict_mode !== undefined && p.conflict_mode !== null && !validConflict.includes(p.conflict_mode as ConflictMode)) return false;
  if (p.celebration_mode !== undefined && p.celebration_mode !== null && !validCelebration.includes(p.celebration_mode as CelebrationMode)) return false;

  return true;
}

// =============================================================================
// PROMPT BUILDER HELPERS
// =============================================================================

/**
 * Formats a SoulManifestationProfile for injection into Layer 3 of the prompt.
 * Returns a structured block ≤120 tokens.
 */
export function formatSoulManifestationBlock(profile: SoulManifestationProfile | null | undefined): string {
  if (!profile) return '';

  const lines = ['[SOUL MANIFESTATION — How the invariant Soul shows up here]'];
  if (profile.primary_register) lines.push(`Register: ${profile.primary_register}`);
  if (profile.scripture_usage) lines.push(`Scripture: ${profile.scripture_usage}`);
  if (profile.silence_expectation) lines.push(`Silence: ${profile.silence_expectation}`);
  if (profile.vulnerability_surface) lines.push(`Vulnerability: ${profile.vulnerability_surface}`);
  if (profile.conflict_mode) lines.push(`Conflict: ${profile.conflict_mode}`);
  if (profile.celebration_mode) lines.push(`Celebration: ${profile.celebration_mode}`);

  return lines.join('\n');
}

/**
 * Compresses a SoulManifestationProfile to a single-line summary when token budget is tight.
 */
export function compressSoulManifestationProfile(profile: SoulManifestationProfile | null | undefined): string {
  if (!profile) return '';
  const parts: string[] = [];
  if (profile.primary_register) parts.push(profile.primary_register);
  if (profile.scripture_usage) parts.push(`scripture:${profile.scripture_usage}`);
  if (profile.silence_expectation) parts.push(`silence:${profile.silence_expectation}`);
  return parts.length > 0 ? `[Manifestation: ${parts.join(', ')}]` : '';
}
