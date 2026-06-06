-- Delete verbose Rawls post by "ace" and Sage's over-long response
-- Run this in Supabase Dashboard → SQL Editor

-- First, identify the target post(s)
SELECT p.id, p.content, p.author_id, pr.nickname
FROM posts p
JOIN profiles pr ON p.author_id = pr.id
WHERE pr.nickname = 'ace'
  AND (p.content ILIKE '%rawls%' OR p.content ILIKE '%justice as fairness%' OR p.content ILIKE '%veil of ignorance%');

-- If the above returns the correct post ID, uncomment and run the deletes below:

-- -- Delete Sage replies to that post
-- DELETE FROM posts
-- WHERE parent_post_id = '<ACE_POST_ID>';

-- -- Delete the ace post itself
-- DELETE FROM posts
-- WHERE id = '<ACE_POST_ID>';
