-- ── Update Sisters in Dua public_meta to Hyderabad scope ─────────────
--
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query → Run).
--
-- What this changes:
--   - demographic_chips: 🇮🇳 India → 📍 Hyderabad
--   - tagline: adds "— in Hyderabad"
--   - description: "women-only community for Muslim women" →
--     "community for Muslim women in Hyderabad"
--
-- The APPLY_NOW.sql seed has been updated to match, so future
-- idempotent runs will also produce the correct values.

UPDATE public.cluster_config
   SET public_meta = public_meta
     || jsonb_build_object(
          'tagline',
            'Faith lived, discussed, and held together — in Hyderabad.',
          'description',
            'A community for Muslim women in Hyderabad navigating faith in real life. Not a classroom. Not a fatwa service. A space where sisters talk honestly about what it means to stay close to Allah — through doubt, difficulty, routine, and everything in between. Grounded in Quran and authentic Sunnah.',
          'demographic_chips', jsonb_build_array(
            jsonb_build_object('icon', '📍', 'label', 'Hyderabad'),
            jsonb_build_object('icon', '♀',  'label', 'Women'),
            jsonb_build_object('icon', '🤲', 'label', 'Faith')
          )
        )
 WHERE cluster_id = 'the_single_source';

-- Verify
SELECT
  public_meta->>'tagline'          AS tagline,
  public_meta->'demographic_chips' AS chips
FROM public.cluster_config
WHERE cluster_id = 'the_single_source';
