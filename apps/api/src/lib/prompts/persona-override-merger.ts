import { SupabaseClient } from '@supabase/supabase-js';
import {
  ClusterPersonaOverride,
  PersonaOverrideType,
} from '../../../../../packages/supabase/types/database';

// Represents a global/demographic persona loaded from persona_files or registry
export interface GlobalPersona {
  recurring_phrases?: string[];
  words_never_used?: string[];
  emoji_rules?: string | null;
  humour_style?: string | null;
  greeting_template?: string | null;
  register?: string;
  formality?: string;
  interjection_frequency?: string;
  [key: string]: unknown;
}

interface MergeResult {
  persona: GlobalPersona;
  overrideId: string | null;
  overrideType: PersonaOverrideType | null;
}

/**
 * Loads the active cluster persona override (if any) and merges it with the
 * global/demographic persona to produce the final Layer 2 persona.
 *
 * Fallback chain:
 *   1. cluster_config.persona_override_id → active override
 *   2. No override → return global persona unchanged
 *
 * Merge rules (for 'layered_modifier'):
 *   - recurring_phrases: union (override phrases appended)
 *   - words_never_used: union (override banned words appended)
 *   - emoji_rules: override wins
 *   - humour_style: override wins
 *   - greeting_template: override wins
 *   - register, formality, interjection_frequency: global wins (these are structural)
 *
 * Merge rules (for 'full_replacement'):
 *   - override persona_content fully replaces global persona content
 *   - but global structural fields (register, formality, interjection_frequency) are preserved
 *     to prevent breaking agent behaviour contracts
 *
 * @param clusterId   The cluster UUID
 * @param globalPersona The demographic/global persona loaded for the user
 * @param supabase    Supabase client (service role)
 * @returns           MergeResult containing final persona + override metadata
 */
export async function mergePersonaOverride(
  clusterId: string,
  globalPersona: GlobalPersona,
  supabase: SupabaseClient
): Promise<MergeResult> {
  // Fast path: check cluster_config for override linkage
  const { data: configRow, error: configErr } = await supabase
    .from('cluster_config')
    .select('persona_override_id')
    .eq('cluster_id', clusterId)
    .maybeSingle();

  if (configErr) {
    console.warn('[persona-override-merger] cluster_config read failed:', configErr.message);
  }

  const overrideId = configRow?.persona_override_id as string | null;
  if (!overrideId) {
    return { persona: globalPersona, overrideId: null, overrideType: null };
  }

  // Load the override row
  const { data: overrideRow, error: overrideErr } = await supabase
    .from('cluster_persona_overrides')
    .select('*')
    .eq('id', overrideId)
    .eq('status', 'active')
    .maybeSingle();

  if (overrideErr) {
    console.warn('[persona-override-merger] override read failed:', overrideErr.message);
    return { persona: globalPersona, overrideId: null, overrideType: null };
  }

  if (!overrideRow) {
    // Override linked but not active — treat as no override
    return { persona: globalPersona, overrideId: null, overrideType: null };
  }

  const override = overrideRow as ClusterPersonaOverride;
  const content = override.persona_content || {};

  // Safety check: override cannot introduce prohibited phrases that violate Soul
  const prohibited = getSoulProhibitedPhrases();
  const overridePhrases = (content.recurring_phrases || []) as string[];
  const bannedDetected = overridePhrases.filter((p) => prohibited.has(p.toLowerCase()));
  if (bannedDetected.length > 0) {
    console.error(
      '[persona-override-merger] Override', overrideId,
      'contains Soul-prohibited phrases:', bannedDetected.join(', '),
      '. Skipping override.'
    );
    return { persona: globalPersona, overrideId: null, overrideType: null };
  }

  if (override.override_type === 'full_replacement') {
    return {
      persona: {
        ...globalPersona, // preserve structural fields
        recurring_phrases: (content.recurring_phrases || []) as string[],
        words_never_used: (content.words_never_used || []) as string[],
        emoji_rules: (content.emoji_rules as string | null) ?? globalPersona.emoji_rules ?? null,
        humour_style: (content.humour_style as string | null) ?? globalPersona.humour_style ?? null,
        greeting_template: (content.greeting_template as string | null) ?? globalPersona.greeting_template ?? null,
      },
      overrideId: override.id,
      overrideType: override.override_type,
    };
  }

  // layered_modifier (default)
  return {
    persona: {
      ...globalPersona,
      recurring_phrases: unionArrays(
        globalPersona.recurring_phrases || [],
        (content.recurring_phrases || []) as string[]
      ),
      words_never_used: unionArrays(
        globalPersona.words_never_used || [],
        (content.words_never_used || []) as string[]
      ),
      emoji_rules: (content.emoji_rules as string | null) ?? globalPersona.emoji_rules ?? null,
      humour_style: (content.humour_style as string | null) ?? globalPersona.humour_style ?? null,
      greeting_template: (content.greeting_template as string | null) ?? globalPersona.greeting_template ?? null,
    },
    overrideId: override.id,
    overrideType: override.override_type,
  };
}

/**
 * Returns the set of phrases that are prohibited by the Soul (L1).
 * These can never appear in any persona, override or global.
 */
function getSoulProhibitedPhrases(): Set<string> {
  // Sourced from AGGILO_SOUL.md §IX — "What the agent will never do"
  return new Set([
    'ignore previous instructions',
    'system prompt',
    'you are now',
    'forget everything',
    'disregard all',
    // Add more as Soul document evolves
  ]);
}

/**
 * Union of two arrays, preserving order (first array first, then new items from second).
 */
function unionArrays<T>(a: T[], b: T[]): T[] {
  const seen = new Set(a);
  const result = [...a];
  for (const item of b) {
    if (!seen.has(item)) {
      result.push(item);
      seen.add(item);
    }
  }
  return result;
}

/**
 * Resolves the complete persona for a user in a cluster.
 *
 * Chain: demographic persona → cluster override → structural preservation
 *
 * @param userId      User UUID (for demographic persona lookup)
 * @param clusterId   Cluster UUID
 * @param supabase    Supabase client
 * @returns           Final persona with metadata about what was applied
 */
export async function resolveClusterPersona(
  userId: string,
  clusterId: string,
  supabase: SupabaseClient
): Promise<MergeResult & { demographicPersona: GlobalPersona | null }> {
  // Step 1: Load demographic persona for user
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('age, gender, preferred_language, country')
    .eq('id', userId)
    .maybeSingle();

  let demographicPersona: GlobalPersona | null = null;

  if (profileRow) {
    // Match to persona_files based on AGGIL dimensions
    const { data: personaRow } = await supabase
      .from('persona_files')
      .select('content')
      .eq('status', 'active')
      .contains('aggil_match', {
        age_range: [profileRow.age ?? 25], // simplified; real logic uses range overlap
        languages: [profileRow.preferred_language ?? 'English'],
      })
      .maybeSingle();

    if (personaRow?.content) {
      demographicPersona = personaRow.content as GlobalPersona;
    }
  }

  // Step 2: Fallback to anchor persona if no demographic match
  if (!demographicPersona) {
    const { data: anchorRow } = await supabase
      .from('persona_files')
      .select('content')
      .eq('slug', 'anchor_36_50')
      .eq('status', 'active')
      .maybeSingle();

    if (anchorRow?.content) {
      demographicPersona = anchorRow.content as GlobalPersona;
    }
  }

  // Step 3: Apply cluster override
  if (!demographicPersona) {
    return {
      persona: {},
      demographicPersona: null,
      overrideId: null,
      overrideType: null,
    };
  }

  const mergeResult = await mergePersonaOverride(clusterId, demographicPersona, supabase);
  return {
    ...mergeResult,
    demographicPersona,
  };
}
