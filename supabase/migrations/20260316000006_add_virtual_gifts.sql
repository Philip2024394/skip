-- Add virtual gifts tables
CREATE TABLE IF NOT EXISTS virtual_gifts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  emoji text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 1.99,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table to track user's preferred gifts (up to 5)
CREATE TABLE IF NOT EXISTS user_preferred_gifts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  gift_id uuid REFERENCES virtual_gifts(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position >= 1 AND position <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, position)
);

-- Table to track sent gifts
CREATE TABLE IF NOT EXISTS sent_gifts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  gift_id uuid REFERENCES virtual_gifts(id) ON DELETE CASCADE,
  message text,
  is_displayed boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert some default virtual gifts
INSERT INTO virtual_gifts (name, emoji, description, price) VALUES
('Rose', '🌹', 'A classic romantic gesture', 1.99),
('Heart', '❤️', 'Show your love and affection', 1.99),
('Diamond', '💎', 'Luxury and elegance', 2.99),
('Chocolate', '🍫', 'Sweet treat for someone sweet', 1.99),
('Teddy Bear', '🧸', 'Cute and cuddly companion', 2.49),
('Perfume', '👃', 'Fragrant and sophisticated', 3.99),
('Jewelry Box', '📦', 'A special surprise inside', 4.99),
('Champagne', '🍾', 'Celebrate special moments', 3.99),
('Love Letter', '💌', 'Words from the heart', 1.99),
('Star', '⭐', 'You''re my shining star', 1.99)
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_preferred_gifts_user_id ON user_preferred_gifts(user_id);
CREATE INDEX IF NOT EXISTS idx_sent_gifts_receiver_id ON sent_gifts(receiver_id);
CREATE INDEX IF NOT EXISTS idx_sent_gifts_created_at ON sent_gifts(created_at DESC);

-- Enable RLS
ALTER TABLE virtual_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferred_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_gifts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active virtual gifts" ON virtual_gifts FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage their preferred gifts" ON user_preferred_gifts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view sent gifts to them" ON sent_gifts FOR SELECT USING (auth.uid() = receiver_id);
CREATE POLICY "Users can view their sent gifts" ON sent_gifts FOR SELECT USING (auth.uid() = sender_id);
CREATE POLICY "Users can send gifts" ON sent_gifts FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update display status of received gifts" ON sent_gifts FOR UPDATE USING (auth.uid() = receiver_id);

-- Updated trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_virtual_gifts_updated_at BEFORE UPDATE ON virtual_gifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferred_gifts_updated_at BEFORE UPDATE ON user_preferred_gifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sent_gifts_updated_at BEFORE UPDATE ON sent_gifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
