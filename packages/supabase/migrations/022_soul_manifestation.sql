-- Migration 022: Soul Manifestation Profile + Cluster Persona Overrides
-- Adds cluster-level agent voice calibration without modifying invariant Soul prohibitions.
-- Applied: After 021_observer_stewardship.sql
-- Dependencies: clusters, cluster_config, sage_personas, observer_prompt_updates

-- =============================================================================
-- 1. EXTEND EXISTING TABLES
-- =============================================================================

-- 1.1 sage_personas: add manifestation guidance notes
ALTER TABLE sage_personas
  ADD COLUMN IF NOT EXISTS soul_manifestation_notes TEXT DEFAULT NULL;
COMMENT ON COLUMN sage_personas.soul_manifestation_notes IS
  'Contextual notes on how the Soul manifests for this persona (e.g., inquiry register: use questions over statements).';

-- 1.2 clio_conversations: snapshot active manifestation for audit
ALTER TABLE clio_conversations
  ADD COLUMN IF NOT EXISTS manifestation_profile_snapshot JSONB DEFAULT NULL;
COMMENT ON COLUMN clio_conversations.manifestation_profile_snapshot IS
  'The active soul_manifestation_profile at conversation start, stored for reproducibility.';

-- 1.3 cluster_config: link persona override and store local profile
ALTER TABLE cluster_config
  ADD COLUMN IF NOT EXISTS persona_override_id UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS soul_manifestation_profile JSONB DEFAULT NULL;
COMMENT ON COLUMN cluster_config.persona_override_id IS
  'Reference to active cluster_persona_overrides row, if any.';
COMMENT ON COLUMN cluster_config.soul_manifestation_profile IS
  'Cached cluster-level Soul manifestation profile (denormalised from cluster_specs for fast prompt builder lookup).';

-- 1.4 observer_prompt_updates: expand update_type enum domain
-- We use VARCHAR(64) so no enum ALTER is required; application layer envalues.
ALTER TABLE observer_prompt_updates
  ALTER COLUMN update_type TYPE VARCHAR(64);
COMMENT ON COLUMN observer_prompt_updates.update_type IS
  'Extended to include: soul_manifestation_shift, persona_override_activation, cultural_resonance_update.';

-- =============================================================================
-- 2. NEW TABLES
-- =============================================================================

-- 2.1 cluster_persona_overrides
-- Cluster-level persona modifiers that layer on top of (or replace) global personas.
-- No persona override may contradict L1 Soul prohibitions (enforced at application layer).
CREATE TABLE IF NOT EXISTS cluster_persona_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,

  override_type VARCHAR(32) NOT NULL
    CHECK (override_type IN ('full_replacement', 'layered_modifier')),

  persona_content JSONB NOT NULL
    DEFAULT '{
      "recurring_phrases": [],
      "words_never_used": [],
      "emoji_rules": null,
      "humour_style": null,
      "greeting_template": null
    }'::jsonb,

  status VARCHAR(32) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'review', 'approved', 'active')),

  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cluster_persona_overrides_cluster
  ON cluster_persona_overrides(cluster_id, status);

CREATE INDEX IF NOT EXISTS idx_cluster_persona_overrides_status
  ON cluster_persona_overrides(status, created_at DESC)
  WHERE status = 'approved';

COMMENT ON TABLE cluster_persona_overrides IS
  'Cluster-level persona overrides that merge into Layer 2 of the 4-layer prompt contract.';

-- 2.2 soul_manifestation_audit
-- Immutable audit trail of every soul_manifestation_profile change per cluster.
CREATE TABLE IF NOT EXISTS soul_manifestation_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,

  profile JSONB NOT NULL
    DEFAULT '{
      "primary_register": null,
      "scripture_usage": null,
      "silence_expectation": null,
      "vulnerability_surface": null,
      "conflict_mode": null,
      "celebration_mode": null
    }'::jsonb,

  changed_by VARCHAR(32) NOT NULL,
    -- 'genesis_engine' | 'observer' | 'admin' | 'founder' | 'system'

  reason TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_soul_manifestation_audit_cluster
  ON soul_manifestation_audit(cluster_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_soul_manifestation_audit_changed_by
  ON soul_manifestation_audit(changed_by, created_at DESC);

COMMENT ON TABLE soul_manifestation_audit IS
  'Immutable log of soul_manifestation_profile changes for accountability and rollback.';

-- =============================================================================
-- 3. RLS POLICIES
-- =============================================================================

-- 3.1 cluster_persona_overrides

-- Admin: full access
CREATE POLICY "admin_all_persona_overrides"
  ON cluster_persona_overrides FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Founder: read own cluster overrides
CREATE POLICY "founder_read_own_persona_overrides"
  ON cluster_persona_overrides FOR SELECT
  USING (cluster_id IN (
    SELECT cluster_id FROM cluster_members
    WHERE user_id = auth.uid() AND is_founder = true
  ));

-- 3.2 soul_manifestation_audit

-- Admin: full access
CREATE POLICY "admin_all_manifestation_audit"
  ON soul_manifestation_audit FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Founder: read own cluster audit
CREATE POLICY "founder_read_own_manifestation_audit"
  ON soul_manifestation_audit FOR SELECT
  USING (cluster_id IN (
    SELECT cluster_id FROM cluster_members
    WHERE user_id = auth.uid() AND is_founder = true
  ));

-- =============================================================================
-- 4. VALIDATION FUNCTION (Optional but Recommended)
-- =============================================================================

-- Ensures soul_manifestation_profile JSONB conforms to expected schema.
-- Called by application layer before INSERT/UPDATE on cluster_config or cluster_specs.
CREATE OR REPLACE FUNCTION validate_soul_manifestation_profile(profile JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  valid_registers TEXT[] := ARRAY[
    'warmth', 'rigor', 'curiosity', 'playfulness', 'reverence',
    'inquiry', 'admonition', 'exhortation', 'silence', 'celebration'
  ];
  valid_scripture TEXT[] := ARRAY['frequent', 'occasional', 'rare', 'none'];
  valid_silence TEXT[] := ARRAY['high', 'medium', 'low'];
  valid_surface TEXT[] := ARRAY['sacred', 'honoured', 'guarded', 'closed'];
  valid_conflict TEXT[] := ARRAY['reconciliation', 'truth_telling', 'forgiveness', 'accountability'];
  valid_celebration TEXT[] := ARRAY['earned', 'gratitude', 'milestone', 'quiet'];
BEGIN
  RETURN (
    profile->>'primary_register' IS NULL OR
    profile->>'primary_register' = ANY(valid_registers)
  ) AND (
    profile->>'scripture_usage' IS NULL OR
    profile->>'scripture_usage' = ANY(valid_scripture)
  ) AND (
    profile->>'silence_expectation' IS NULL OR
    profile->>'silence_expectation' = ANY(valid_silence)
  ) AND (
    profile->>'vulnerability_surface' IS NULL OR
    profile->>'vulnerability_surface' = ANY(valid_surface)
  ) AND (
    profile->>'conflict_mode' IS NULL OR
    profile->>'conflict_mode' = ANY(valid_conflict)
  ) AND (
    profile->>'celebration_mode' IS NULL OR
    profile->>'celebration_mode' = ANY(valid_celebration)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_soul_manifestation_profile IS
  'Validates that a soul_manifestation_profile JSONB contains only allowed enum values.';

-- =============================================================================
-- 5. TRIGGER: Auto-populate soul_manifestation_audit on cluster_config change
-- =============================================================================

-- Whenever cluster_config.soul_manifestation_profile is updated, log to audit table.
CREATE OR REPLACE FUNCTION log_soul_manifestation_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.soul_manifestation_profile IS DISTINCT FROM NEW.soul_manifestation_profile THEN
    INSERT INTO soul_manifestation_audit (
      cluster_id,
      profile,
      changed_by,
      reason
    ) VALUES (
      NEW.cluster_id,
      NEW.soul_manifestation_profile,
      COALESCE(NEW.updated_by, 'system'),
      COALESCE(NEW.change_reason, 'Automatic audit log on cluster_config update')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: trigger creation requires cluster_config to have updated_by and change_reason columns.
-- If those columns do not exist, comment out this block and handle audit logging at application layer.
-- CREATE TRIGGER trg_log_soul_manifestation_change
--   AFTER UPDATE ON cluster_config
--   FOR EACH ROW
--   WHEN (OLD.soul_manifestation_profile IS DISTINCT FROM NEW.soul_manifestation_profile)
--   EXECUTE FUNCTION log_soul_manifestation_change();

-- =============================================================================
-- 6. SEED: Default soul_manifestation_profile for existing clusters (optional)
-- =============================================================================

-- For clusters created before this migration, set a default inferred profile.
-- This is a one-time backfill; remove if not desired.
-- UPDATE cluster_config
-- SET soul_manifestation_profile = '{
--   "primary_register": "warmth",
--   "scripture_usage": "occasional",
--   "silence_expectation": "medium",
--   "vulnerability_surface": "guarded",
--   "conflict_mode": "reconciliation",
--   "celebration_mode": "gratitude"
-- }'::jsonb
-- WHERE soul_manifestation_profile IS NULL;

-- =============================================================================
-- END MIGRATION 022
-- =============================================================================
