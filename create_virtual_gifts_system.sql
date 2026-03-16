-- Create virtual gifts table
CREATE TABLE IF NOT EXISTS virtual_gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_name TEXT NOT NULL,
  token_price INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user tokens table
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens_balance INTEGER DEFAULT 0,
  free_gifts_used INTEGER DEFAULT 0,
  total_gifts_sent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create sent gifts table
CREATE TABLE IF NOT EXISTS sent_gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  gift_id UUID REFERENCES virtual_gifts(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'refused')),
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create token purchases table
CREATE TABLE IF NOT EXISTS token_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens_purchased INTEGER NOT NULL,
  price_paid DECIMAL(10,2) NOT NULL,
  stripe_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert virtual gifts with token prices
INSERT INTO virtual_gifts (name, image_url, image_name, token_price) VALUES
('Premium Rose', 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview.png?updatedAt=1773598754691', 'premium_rose', 3),
('Diamond Ring', 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-1.png?updatedAt=1773598754691', 'diamond_ring', 5),
('Love Heart', 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-2.png?updatedAt=1773598754691', 'love_heart', 2),
('Teddy Bear', 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-3.png?updatedAt=1773598754691', 'teddy_bear', 4),
('Chocolate Box', 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-4.png?updatedAt=1773598754691', 'chocolate_box', 3),
('Perfume', 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-5.png?updatedAt=1773598754691', 'perfume', 6),
('Jewelry Box', 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-6.png?updatedAt=1773598754691', 'jewelry_box', 8),
('Flower Bouquet', 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-7.png?updatedAt=1773598754691', 'flower_bouquet', 4),
('Wine Bottle', 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-8.png?updatedAt=1773598754691', 'wine_bottle', 7),
('Watch', 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-9.png?updatedAt=1773598754691', 'watch', 10),
('Necklace', 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-10.png?updatedAt=1773598754691', 'necklace', 9),
('Bracelet', 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-11.png?updatedAt=1773598754691', 'bracelet', 6),
('Earrings', 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-12.png?updatedAt=1773598754691', 'earrings', 5),
('Handbag', 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-13.png?updatedAt=1773598754691', 'handbag', 11),
('Shoes', 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-14.png?updatedAt=1773598754691', 'shoes', 8),
('Makeup Kit', 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-15.png?updatedAt=1773598754691', 'makeup_kit', 4),
('Spa Voucher', 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-16.png?updatedAt=1773598754691', 'spa_voucher', 12),
('Romantic Dinner', 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-17.png?updatedAt=1773598754691', 'romantic_dinner', 15),
('Weekend Trip', 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-18.png?updatedAt=1773598754691', 'weekend_trip', 20),
('Luxury Car', 'https://ik.imagekit.io/7grri5v7d/UntitledasdASDasdADS-removebg-preview-19.png?updatedAt=1773598754691', 'luxury_car', 25),
('Special Gift 1', 'https://ik.imagekit.io/7grri5v7d/dsfgsdfgsdfgds-removebg-preview.png?updatedAt=1773600046900', 'special_gift_1', 3),
('Special Gift 2', 'https://ik.imagekit.io/7grri5v7d/dsfgsdfgsdfgdgsfgsdfg-removebg-preview.png?updatedAt=1773600149048', 'special_gift_2', 4),
('Special Gift 3', 'https://ik.imagekit.io/7grri5v7d/dgafsgsdfgsdfgsdfgd-removebg-preview.png?updatedAt=1773600246313', 'special_gift_3', 5),
('Special Gift 4', 'https://ik.imagekit.io/7grri5v7d/sdfasdfasdfasdfasdf-removebg-preview.png?updatedAt=1773601143240', 'special_gift_4', 6),
('Special Gift 5', 'https://ik.imagekit.io/7grri5v7d/sdfasdfasdfaasdfasdf-removebg-preview.png?updatedAt=1773601223203', 'special_gift_5', 7),
('Special Gift 6', 'https://ik.imagekit.io/7grri5v7d/dfsgdfgsdfgd-removebg-preview.png?updatedAt=1773601367483', 'special_gift_6', 8)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_sent_gifts_sender_id ON sent_gifts(sender_id);
CREATE INDEX IF NOT EXISTS idx_sent_gifts_recipient_id ON sent_gifts(recipient_id);
CREATE INDEX IF NOT EXISTS idx_sent_gifts_status ON sent_gifts(status);
CREATE INDEX IF NOT EXISTS idx_token_purchases_user_id ON token_purchases(user_id);

-- Create function to initialize user tokens
CREATE OR REPLACE FUNCTION initialize_user_tokens()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_tokens (user_id, tokens_balance, free_gifts_used)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to initialize tokens for new users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION initialize_user_tokens();

-- Enable RLS
ALTER TABLE virtual_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view virtual gifts" ON virtual_gifts
  FOR SELECT USING (true);

CREATE POLICY "Users can view own tokens" ON user_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON user_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view sent gifts" ON sent_gifts
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert sent gifts" ON sent_gifts
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update sent gifts" ON sent_gifts
  FOR UPDATE USING (auth.uid() = recipient_id);

CREATE POLICY "Users can view own purchases" ON token_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert purchases" ON token_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);
