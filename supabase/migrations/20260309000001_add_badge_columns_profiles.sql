-- Add badge columns to profiles (Weekend Plans, Late Night Chat, No Drama)
-- and generous_lifestyle if missing. Safe to run multiple times.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS generous_lifestyle boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekend_plans boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS late_night_chat boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS no_drama boolean NOT NULL DEFAULT false;

-- Update profiles_public view to expose new columns for listing/swipe
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
SELECT
  id, name, age, gender, looking_for, country, city, bio,
  avatar_url, images, latitude, longitude,
  available_tonight, is_plusone, generous_lifestyle, weekend_plans, late_night_chat, no_drama,
  is_verified, is_spotlight, spotlight_until,
  voice_intro_url, first_date_idea, first_date_places, languages,
  last_seen_at, hidden_until, is_active, is_banned, created_at
FROM public.profiles
WHERE
  is_banned = false
  AND is_active = true
  AND (hidden_until IS NULL OR hidden_until < now())
  AND (is_incognito = false OR incognito_until < now());

GRANT SELECT ON public.profiles_public TO anon;
GRANT SELECT ON public.profiles_public TO authenticated;
