-- Add cached public canceled dates count per profile

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS date_canceled_count integer NOT NULL DEFAULT 0;

-- Update profiles_public view to expose the count
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
SELECT
  id, name, age, gender, looking_for, country, city, bio,
  avatar_url, images, latitude, longitude,
  available_tonight, is_plusone, generous_lifestyle, weekend_plans, late_night_chat, no_drama,
  whatsapp_connections_count,
  date_canceled_count,
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
