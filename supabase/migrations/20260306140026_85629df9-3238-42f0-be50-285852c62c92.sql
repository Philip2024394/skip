
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
SELECT 
  id, name, age, gender, bio, city, country, looking_for,
  avatar_url, images, latitude, longitude, available_tonight,
  voice_intro_url, is_active, is_banned, hidden_until, created_at,
  last_seen_at
FROM public.profiles;
