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
-- First, let's add a few sample gifts manually
INSERT INTO sent_gifts (sender_id, receiver_id, gift_id, message) VALUES
  (gen_random_uuid(), gen_random_uuid(), (SELECT id FROM virtual_gifts WHERE name = 'Rose' LIMIT 1), 'You are absolutely stunning! 🌹'),
  (gen_random_uuid(), gen_random_uuid(), (SELECT id FROM virtual_gifts WHERE name = 'Heart' LIMIT 1), 'My heart skipped a beat when I saw your profile ❤️'),
  (gen_random_uuid(), gen_random_uuid(), (SELECT id FROM virtual_gifts WHERE name = 'Diamond' LIMIT 1), 'You shine brighter than any diamond! 💎✨'),
  (gen_random_uuid(), gen_random_uuid(), (SELECT id FROM virtual_gifts WHERE name = 'Chocolate' LIMIT 1), 'Sweet as chocolate! Would love to get to know you 🍫'),
  (gen_random_uuid(), gen_random_uuid(), (SELECT id FROM virtual_gifts WHERE name = 'Teddy Bear' LIMIT 1), 'You seem so cuddly and warm! 🧸 Let''s chat?')
ON CONFLICT DO NOTHING;

-- Add some user preferred gifts (what users like to receive)
-- This will show in user profiles when they set their preferences
-- For now, let's add some sample preferences
INSERT INTO user_preferred_gifts (user_id, gift_id, position)
SELECT 
  p.id as user_id,
  vg.id as gift_id,
  ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY vg.price ASC) as position
FROM profiles p
CROSS JOIN virtual_gifts vg
WHERE p.is_mock = true
AND vg.is_active = true
AND vg.name IN ('Rose', 'Heart', 'Diamond')
AND ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY vg.price ASC) <= 2
LIMIT 20
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
