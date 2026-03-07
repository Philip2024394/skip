
-- Add first_date_places jsonb column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_date_places jsonb DEFAULT '[]'::jsonb;

-- Drop and recreate view with same column order + new column
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public AS
SELECT
  id, name, age, gender, bio, looking_for, country, city,
  avatar_url, images, latitude, longitude,
  available_tonight, voice_intro_url,
  is_active, is_banned, hidden_until,
  created_at, last_seen_at, first_date_idea,
  first_date_places
FROM public.profiles;
