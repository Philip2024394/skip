-- Virtual Gifts for Profile Pages
-- This script adds virtual gifts that users can buy ($1 each) and send to profiles

-- First, ensure virtual gifts table exists and has the basic gifts
INSERT INTO virtual_gifts (id, name, emoji, price, is_active) VALUES
  (gen_random_uuid(), 'Rose', '🌹', 1.00, true),
  (gen_random_uuid(), 'Heart', '❤️', 1.00, true),
  (gen_random_uuid(), 'Diamond', '💎', 1.00, true),
  (gen_random_uuid(), 'Chocolate', '🍫', 1.00, true),
  (gen_random_uuid(), 'Teddy Bear', '🧸', 1.00, true)
ON CONFLICT DO NOTHING;

-- Add some premium gifts (optional, for future use)
INSERT INTO virtual_gifts (id, name, emoji, price, is_active) VALUES
  (gen_random_uuid(), 'Perfume', '👑', 5.00, false),
  (gen_random_uuid(), 'Jewelry', '💍', 10.00, false),
  (gen_random_uuid(), 'Flowers', '💐', 3.00, false)
ON CONFLICT DO NOTHING;

-- Add some sample sent gifts to show how the system works
-- These will appear in the top-right area of profiles after name/location
INSERT INTO sent_gifts (sender_id, receiver_id, gift_id, message) 
SELECT 
  -- Use existing users as senders (you can replace these with real user IDs)
  (SELECT id FROM auth.users LIMIT 1 OFFSET 0) as sender_id,
  p.id as receiver_id,
  vg.id as gift_id,
  CASE vg.name
    WHEN 'Rose' THEN 'You are absolutely stunning! 🌹'
    WHEN 'Heart' THEN 'My heart skipped a beat when I saw your profile ❤️'
    WHEN 'Diamond' THEN 'You shine brighter than any diamond! 💎✨'
    WHEN 'Chocolate' THEN 'Sweet as chocolate! Would love to get to know you 🍫'
    WHEN 'Teddy Bear' THEN 'You seem so cuddly and warm! 🧸 Let''s chat?'
    ELSE 'Amazing profile! Let''s connect! 💕'
  END as message
FROM profiles p
CROSS JOIN virtual_gifts vg
WHERE p.is_mock = true  -- Only for mock profiles to start
AND vg.is_active = true
AND vg.name IN ('Rose', 'Heart', 'Diamond', 'Chocolate', 'Teddy Bear')
AND (
  -- Add 1-3 gifts per profile randomly
  (CAST(SUBSTRING(p.id, 1, 2) AS int) % 3) >= 1
)
AND vg.name = (
  CASE vg.name
    WHEN 'Rose' THEN 'Rose'
    WHEN 'Heart' THEN 'Heart' 
    WHEN 'Diamond' THEN 'Diamond'
    WHEN 'Chocolate' THEN 'Chocolate'
    WHEN 'Teddy Bear' THEN 'Teddy Bear'
    ELSE 'Rose'
  END
)
LIMIT 50;

-- Add some user preferred gifts (what users like to receive)
-- This will show in user profiles when they set their preferences
INSERT INTO user_preferred_gifts (user_id, gift_id, position)
SELECT 
  p.id as user_id,
  vg.id as gift_id,
  ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY vg.price ASC) as position
FROM profiles p
CROSS JOIN virtual_gifts vg
WHERE p.is_mock = true
AND vg.is_active = true
AND vg.name IN ('Rose', 'Heart', 'Diamond', 'Chocolate', 'Teddy Bear')
AND (
  -- Add 2-3 preferred gifts per user randomly
  (CAST(SUBSTRING(p.id, 2, 2) AS int) % 3) + 1
) >= 1
AND ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY vg.price ASC) <= (
  (CAST(SUBSTRING(p.id, 2, 2) AS int) % 2) + 2
)
ON CONFLICT (user_id, position) DO UPDATE SET
  gift_id = EXCLUDED.gift_id;

-- Verify the data was added
SELECT 
  'Virtual Gifts' as table_name,
  COUNT(*) as count
FROM virtual_gifts 
WHERE is_active = true

UNION ALL

SELECT 
  'Sent Gifts' as table_name,
  COUNT(*) as count
FROM sent_gifts

UNION ALL

SELECT 
  'User Preferred Gifts' as table_name,
  COUNT(*) as count
FROM user_preferred_gifts;

-- Show sample of what users will see
SELECT 
  p.name,
  p.city,
  sg.message,
  vg.emoji as gift_emoji,
  vg.name as gift_name,
  sg.created_at
FROM sent_gifts sg
JOIN profiles p ON sg.recipient_id = p.id
JOIN virtual_gifts vg ON sg.gift_id = vg.id
WHERE p.is_mock = true
ORDER BY sg.created_at DESC
LIMIT 10;

COMMIT;
