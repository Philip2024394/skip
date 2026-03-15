-- Add mock gift data for testing
-- Replace these UUIDs with actual user UUIDs from your auth.users table

-- First, let's add some preferred gifts for a test user
INSERT INTO user_preferred_gifts (user_id, gift_id, position) 
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid, -- Replace with actual user UUID
  id,
  ROW_NUMBER() OVER (ORDER BY price ASC)
FROM virtual_gifts 
WHERE name IN ('Rose', 'Heart', 'Diamond', 'Chocolate', 'Teddy Bear')
LIMIT 5
ON CONFLICT (user_id, position) DO UPDATE SET
  gift_id = EXCLUDED.gift_id,
  updated_at = now();

-- Add some sent gifts from different senders
INSERT INTO sent_gifts (sender_id, receiver_id, gift_id, message, is_displayed) VALUES
  -- Recent gift (will appear at top-right, larger)
  ('00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM virtual_gifts WHERE name = 'Rose'), 'You are absolutely stunning! 🌹', true),
  
  -- Older gift (will appear at bottom-right, smaller)
  ('00000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM virtual_gifts WHERE name = 'Chocolate'), 'Sweet treat for a sweet person 🍫', true),
  
  -- Another gift for variety
  ('00000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM virtual_gifts WHERE name = 'Heart'), 'My heart skips a beat when I see your profile ❤️', true)

ON CONFLICT DO NOTHING;

-- Let's also add some gifts for other profiles to test the system
INSERT INTO user_preferred_gifts (user_id, gift_id, position) 
SELECT 
  '00000000-0000-0000-0000-000000000005'::uuid, -- Another profile
  id,
  ROW_NUMBER() OVER (ORDER BY price ASC)
FROM virtual_gifts 
WHERE name IN ('Perfume', 'Jewelry Box', 'Champagne', 'Love Letter', 'Star')
LIMIT 5
ON CONFLICT (user_id, position) DO UPDATE SET
  gift_id = EXCLUDED.gift_id,
  updated_at = now();

-- Add some sent gifts to second profile
INSERT INTO sent_gifts (sender_id, receiver_id, gift_id, message, is_displayed) VALUES
  ('00000000-0000-0000-0000-000000000006'::uuid, '00000000-0000-0000-0000-000000000005'::uuid, (SELECT id FROM virtual_gifts WHERE name = 'Perfume'), 'You smell amazing even through the screen! 👃', true),
  ('00000000-0000-0000-0000-000000000007'::uuid, '00000000-0000-0000-0000-000000000005'::uuid, (SELECT id FROM virtual_gifts WHERE name = 'Jewelry Box'), 'A special gift for someone special 💎', true)
ON CONFLICT DO NOTHING;

-- Verify the data was inserted correctly
SELECT 
  'Virtual Gifts' as table_name,
  COUNT(*) as count
FROM virtual_gifts
UNION ALL
SELECT 
  'Lestari Preferred Gifts' as table_name,
  COUNT(*) as count
FROM user_preferred_gifts 
WHERE user_id = '25'::uuid
UNION ALL
SELECT 
  'Lestari Received Gifts' as table_name,
  COUNT(*) as count
FROM sent_gifts 
WHERE receiver_id = '25'::uuid AND is_displayed = true;
