-- Add analysis_progress JSONB column to track chunked deep-analysis state
ALTER TABLE post_attachments
ADD COLUMN IF NOT EXISTS analysis_progress jsonb DEFAULT '{}';

-- Add a GIN index for fast JSONB lookups if needed later
CREATE INDEX IF NOT EXISTS idx_post_attachments_analysis_progress
ON post_attachments USING GIN(analysis_progress);
