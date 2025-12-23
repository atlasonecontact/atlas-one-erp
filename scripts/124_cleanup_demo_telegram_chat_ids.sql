-- ====================================================
-- CLEANUP: Remove shared chat_id from demo users
-- ====================================================
-- Problem: All demo users have the same telegram_chat_id as the real user
-- This causes the bot to show kioscos from different owners
-- 
-- Run this in Supabase SQL Editor

BEGIN;

-- 1. Remove telegram_chat_id from demo profiles (they shouldn't have real chat IDs)
UPDATE profiles
SET telegram_chat_id = NULL, updated_at = NOW()
WHERE username LIKE 'demo.%';

-- 2. Remove telegram_chat_id from notification_configs of demo kioscos
UPDATE notification_configs
SET 
  telegram_chat_id = NULL,
  telegram_enabled = false,
  telegram_verified = false,
  updated_at = NOW()
WHERE kiosko_id IN (
  SELECT k.id 
  FROM kioscos k
  JOIN profiles p ON k.owner_id = p.id
  WHERE p.username LIKE 'demo.%'
);

-- 3. Verify the cleanup
SELECT 
  p.username,
  p.telegram_chat_id,
  k.name as kiosko_name,
  nc.telegram_chat_id as config_chat_id
FROM profiles p
LEFT JOIN kioscos k ON k.owner_id = p.id
LEFT JOIN notification_configs nc ON nc.kiosko_id = k.id
WHERE p.telegram_chat_id IS NOT NULL OR nc.telegram_chat_id IS NOT NULL
ORDER BY p.username;

COMMIT;
