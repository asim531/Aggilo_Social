-- Migration: add edited_at to posts table
-- Enables the edit-post feature for Phase 0.

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

COMMENT ON COLUMN posts.edited_at IS 'Timestamp when the post was last edited. NULL means never edited.';
