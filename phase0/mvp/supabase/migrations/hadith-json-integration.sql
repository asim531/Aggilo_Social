-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  HADITH-JSON INTEGRATION SCHEMA                                 ║
-- ║  Creates tables for offline hadith storage and grading          ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  TABLE: hadith_source                                            │
-- │  Raw scraped dataset. Sage DOES NOT query this directly.         │
-- │  Admin curates from this table into dua_vault.                   │
-- └──────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.hadith_source (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- The original integer ID from the JSON for deduplication
  source_id INT NOT NULL,
  
  -- E.g., 'bukhari', 'muslim', 'tirmidhi'
  collection_id VARCHAR(64) NOT NULL,
  
  -- Book and Hadith number
  book_number INT,
  hadith_number INT NOT NULL,
  
  -- Text fields
  arabic_text TEXT NOT NULL,
  english_narrator TEXT,
  english_text TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(collection_id, hadith_number)
);

CREATE INDEX IF NOT EXISTS idx_hadith_source_collection 
  ON public.hadith_source(collection_id);

CREATE INDEX IF NOT EXISTS idx_hadith_source_number 
  ON public.hadith_source(hadith_number);

-- RLS: Only accessible by service role or admins
ALTER TABLE public.hadith_source ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view hadith_source" ON public.hadith_source;
CREATE POLICY "Admins can view hadith_source"
  ON public.hadith_source FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('founder', 'manager')
    )
  );

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  TABLE: hadith_grades                                            │
-- │  Lookup table for hadith grades (sahih, hasan, etc.)             │
-- └──────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.hadith_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key references collection + number
  collection_id VARCHAR(64) NOT NULL,
  hadith_number INT NOT NULL,
  
  -- Grade mapping
  grade VARCHAR(32) NOT NULL,
  
  -- Optional note on who graded it or where the grade comes from
  grader TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(collection_id, hadith_number)
);

CREATE INDEX IF NOT EXISTS idx_hadith_grades_lookup 
  ON public.hadith_grades(collection_id, hadith_number);

-- RLS
ALTER TABLE public.hadith_grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view hadith_grades" ON public.hadith_grades;
CREATE POLICY "Admins can view hadith_grades"
  ON public.hadith_grades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('founder', 'manager')
    )
  );

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
