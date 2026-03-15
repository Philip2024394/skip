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

-- Note: Sample sent gifts will be added later when we have real users
-- For now, the virtual gifts catalog is ready for users to send

-- Note: User preferred gifts will be set by users themselves in their profile
-- For now, the virtual gifts catalog is ready for users to send

-- Verify the data was added
SELECT 
  'Virtual Gifts' as table_name,
  COUNT(*) as count,
  'Available for users to send' as description
FROM virtual_gifts 
WHERE is_active = true

UNION ALL

SELECT 
  'Sent Gifts' as table_name,
  COUNT(*) as count,
  'Gifts sent between users' as description
FROM sent_gifts

UNION ALL

SELECT 
  'User Preferred Gifts' as table_name,
  COUNT(*) as count,
  'Gift preferences set by users' as description
FROM user_preferred_gifts;

-- Show available gifts
SELECT 
  name,
  emoji,
  price,
  CASE WHEN is_active THEN 'Available' ELSE 'Inactive' END as status
FROM virtual_gifts 
ORDER BY price ASC;

COMMIT;
