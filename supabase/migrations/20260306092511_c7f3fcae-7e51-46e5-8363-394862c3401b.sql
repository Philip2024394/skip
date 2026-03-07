
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
SELECT
  id, name, age, gender, looking_for, country, city, bio, avatar_url,
  is_active, is_banned, hidden_until, created_at, latitude, longitude, images
FROM public.profiles
WHERE is_active = true AND is_banned = false AND (hidden_until IS NULL OR hidden_until < now());
