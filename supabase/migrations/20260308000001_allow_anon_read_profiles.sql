-- Fix: Allow anonymous (guest) users to read active profiles
-- This is required so the swipe screen shows profiles before login

-- 1. Allow anon role to SELECT from profiles table (active, non-banned only)
CREATE POLICY "Anyone can view active profiles" ON public.profiles
  FOR SELECT TO anon
  USING (
    is_active = true
    AND is_banned = false
    AND (hidden_until IS NULL OR hidden_until < now())
    AND (is_incognito = false OR incognito_until < now())
  );

-- 2. Recreate profiles_public view WITHOUT security_invoker
--    so it uses the definer's permissions (postgres/service role)
--    and anon users can read it without needing row-level permissions
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
SELECT
  id, name, age, gender, looking_for, country, city, bio,
  avatar_url, images, latitude, longitude,
  available_tonight, is_plusone, is_verified, is_spotlight, spotlight_until,
  voice_intro_url, first_date_idea, first_date_places, languages,
  last_seen_at, hidden_until, is_active, is_banned, created_at
FROM public.profiles
WHERE
  is_banned = false
  AND is_active = true
  AND (hidden_until IS NULL OR hidden_until < now())
  AND (is_incognito = false OR incognito_until < now());

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.profiles_public TO anon;
GRANT SELECT ON public.profiles_public TO authenticated;
