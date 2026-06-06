-- Broader search to find the Rawls post
-- Try each of these queries one at a time:

-- 1. Search ALL posts mentioning Rawls (no nickname filter)
SELECT p.id, LEFT(p.content, 120) AS snippet, p.author_id, pr.nickname, p.created_at
FROM posts p
LEFT JOIN profiles pr ON p.author_id = pr.id
WHERE p.content ILIKE '%rawls%'
ORDER BY p.created_at DESC;

-- 2. Search ALL posts mentioning "veil of ignorance"
SELECT p.id, LEFT(p.content, 120) AS snippet, p.author_id, pr.nickname, p.created_at
FROM posts p
LEFT JOIN profiles pr ON p.author_id = pr.id
WHERE p.content ILIKE '%veil of ignorance%'
ORDER BY p.created_at DESC;

-- 3. List ALL posts with their author nicknames (last 20 posts)
SELECT p.id, LEFT(p.content, 120) AS snippet, pr.nickname, p.created_at
FROM posts p
LEFT JOIN profiles pr ON p.author_id = pr.id
ORDER BY p.created_at DESC
LIMIT 20;

-- 4. Check what nicknames exist that might be close to "ace"
SELECT DISTINCT nickname FROM profiles WHERE nickname ILIKE '%ace%' OR nickname ILIKE '%a_ce%';

-- 5. Search by email domain or full name if nickname is different
SELECT p.id, LEFT(p.content, 120) AS snippet, pr.nickname, pr.full_name, pr.email, p.created_at
FROM posts p
LEFT JOIN profiles pr ON p.author_id = pr.id
WHERE p.content ILIKE '%rawls%'
   OR p.content ILIKE '%justice as fairness%'
   OR p.content ILIKE '%veil of ignorance%'
   OR p.content ILIKE '%Kahneman%'
ORDER BY p.created_at DESC;
