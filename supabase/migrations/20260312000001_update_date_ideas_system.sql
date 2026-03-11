-- Update Date Ideas System - Support 3 Selected Date Ideas
-- This migration updates the profiles table to support 3 selected date ideas
-- and creates a date ideas images table with free internet images

-- Add new columns for 3 selected date ideas
ALTER TABLE public.profiles 
ADD COLUMN selected_date_ideas JSONB DEFAULT NULL,
ADD COLUMN date_ideas_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create date ideas images table
CREATE TABLE IF NOT EXISTS public.date_ideas_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_alt TEXT,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_date_ideas_images_idea_name ON public.date_ideas_images(idea_name);
CREATE INDEX IF NOT EXISTS idx_date_ideas_images_category ON public.date_ideas_images(category);
CREATE INDEX IF NOT EXISTS idx_date_ideas_images_active ON public.date_ideas_images(is_active);

-- Enable RLS on date ideas images table
ALTER TABLE public.date_ideas_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for date ideas images
CREATE POLICY "Anyone can view date ideas images" ON public.date_ideas_images
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage date ideas images" ON public.date_ideas_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Insert free internet images for popular date ideas
INSERT INTO public.date_ideas_images (idea_name, image_url, image_alt, category) VALUES
-- Café & Drinks
('Coffee At A Cozy Café ☕', 'https://images.unsplash.com/photo-1521017432519-fb92c3d8a750?w=400&h=300&fit=crop', 'Cozy coffee shop with warm lighting', 'Café & Drinks'),
('Coffee And Deep Conversation ☕', 'https://images.unsplash.com/photo-1511927031161-6a1e083488d7?w=400&h=300&fit=crop', 'People talking over coffee', 'Café & Drinks'),
('Morning Coffee Date ☀️', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop', 'Morning coffee with sunlight', 'Café & Drinks'),
('Tea House Date 🍵', 'https://images.unsplash.com/photo-1576092768247-dc3b6b5f3df8?w=400&h=300&fit=crop', 'Traditional tea house setting', 'Café & Drinks'),
('Rooftop Café Sunset Drinks 🌇', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop', 'Rooftop bar at sunset', 'Café & Drinks'),

-- Food & Dining
('Dinner At A Nice Restaurant 🍝', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop', 'Elegant restaurant dining', 'Food & Dining'),
('Street Food Adventure 🌮', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop', 'Colorful street food market', 'Food & Dining'),
('Sushi Night Together 🍣', 'https://images.unsplash.com/photo-1579584425555-c3ce17f4e1c2?w=400&h=300&fit=crop', 'Fresh sushi platter', 'Food & Dining'),
('Pizza And A Movie Night 🍕', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop', 'Homemade pizza', 'Food & Dining'),
('Brunch On A Lazy Weekend 🥐', 'https://images.unsplash.com/photo-1528207776546-365bb2b0e7df?w=400&h=300&fit=crop', 'Weekend brunch spread', 'Food & Dining'),
('Trying Indonesian Local Food 🍜', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop', 'Indonesian street food', 'Food & Dining'),

-- Outdoors & Nature
('Walk In The Park 🌳', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', 'Peaceful park pathway', 'Outdoors & Nature'),
('Picnic In The Park 🧺', 'https://images.unsplash.com/photo-1490885578174-acda8905c2c6?w=400&h=300&fit=crop', 'Romantic picnic setup', 'Outdoors & Nature'),
('Beach Sunset Walk 🌅', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop', 'Couple walking on beach at sunset', 'Outdoors & Nature'),
('Hiking A Scenic Trail 🏔️', 'https://images.unsplash.com/photo-1551632811-a561941f2f0b?w=400&h=300&fit=crop', 'Mountain hiking trail', 'Outdoors & Nature'),
('Botanical Garden Visit 🌺', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop', 'Beautiful botanical garden', 'Outdoors & Nature'),

-- Entertainment & Culture
('Night At The Cinema 🎬', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop', 'Movie theater interior', 'Entertainment & Culture'),
('Live Music Night 🎵', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop', 'Live music performance', 'Entertainment & Culture'),
('Art Gallery Visit 🎨', 'https://images.unsplash.com/photo-1536924940846-74eb68a68174?w=400&h=300&fit=crop', 'Art gallery exhibition', 'Entertainment & Culture'),
('Karaoke Night 🎤', 'https://images.unsplash.com/photo-1578899086245-3593e5c7b3f6?w=400&h=300&fit=crop', 'Karaoke microphone setup', 'Entertainment & Culture'),

-- Active & Fun
('Bowling Night Together 🎳', 'https://images.unsplash.com/photo-1515378791036-06481081e33a?w=400&h=300&fit=crop', 'Bowling alley with pins', 'Active & Fun'),
('Mini Golf Or Arcade Fun 🎯', 'https://images.unsplash.com/photo-1599456979030-bbed04c9ecb1?w=400&h=300&fit=crop', 'Mini golf course', 'Active & Fun'),
('Escape Room Challenge 🔐', 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop', 'Escape room puzzle', 'Active & Fun'),
('Amusement Park Adventure 🎢', 'https://images.unsplash.com/photo-1568616549629-a17d885cd5a3?w=400&h=300&fit=crop', 'Amusement park rides', 'Active & Fun'),

-- Romantic & Relaxed
('Watching The Stars Together ⭐', 'https://images.unsplash.com/photo-1444703686981-a3abbcba0815?w=400&h=300&fit=crop', 'Starry night sky', 'Romantic & Relaxed'),
('Firepit And Good Conversation 🔥', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&h=300&fit=crop', 'Cozy firepit setting', 'Romantic & Relaxed'),
('Long Drive With Music 🎶', 'https://images.unsplash.com/photo-1542362567-b07e5e586c97?w=400&h=300&fit=crop', 'Scenic road trip', 'Romantic & Relaxed'),
('Cozy Movie Night At Home 🛋️', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=300&fit=crop', 'Cozy home movie setup', 'Romantic & Relaxed'),

-- Cute & Playful
('Pet Café Visit 🐶', 'https://images.unsplash.com/photo-1583337133045-5e2b0b893130?w=400&h=300&fit=crop', 'Cute dogs in café', 'Cute & Playful'),
('Cat Café Date 🐱', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop', 'Relaxing cat café', 'Cute & Playful'),
('Board Game Café 🎲', 'https://images.unsplash.com/photo-1526409080401-5613a6c4b4f5?w=400&h=300&fit=crop', 'Board games and coffee', 'Cute & Playful'),
('Baking Cookies Together 🍪', 'https://images.unsplash.com/photo-1506448751786-3aefb19abf8b?w=400&h=300&fit=crop', 'Fresh baked cookies', 'Cute & Playful');

-- Create a function to auto-assign 3 random date ideas for new users
CREATE OR REPLACE FUNCTION auto_assign_date_ideas()
RETURNS TRIGGER AS $$
BEGIN
  -- If user has no selected date ideas, assign 3 random ones
  IF NEW.selected_date_ideas IS NULL OR jsonb_array_length(NEW.selected_date_ideas) = 0 THEN
    NEW.selected_date_ideas = (
      SELECT jsonb_agg(idea_name ORDER BY RANDOM()) 
      FROM (
        SELECT idea_name 
        FROM public.date_ideas_images 
        WHERE is_active = true 
        LIMIT 3
      ) random_ideas
    );
    NEW.date_ideas_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign date ideas for new profiles
CREATE TRIGGER trigger_auto_assign_date_ideas
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_date_ideas();

-- Create a function to update date ideas selection
CREATE OR REPLACE FUNCTION update_selected_date_ideas(
  user_id UUID,
  new_ideas JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    selected_date_ideas = new_ideas,
    date_ideas_updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_selected_date_ideas TO authenticated;
GRANT SELECT ON public.date_ideas_images TO anon, authenticated;
