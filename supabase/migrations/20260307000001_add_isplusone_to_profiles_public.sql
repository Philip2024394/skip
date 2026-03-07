-- Add is_plusone to profiles_public view so badge shows for real users

CREATE OR REPLACE VIEW public.profiles_public AS
  SELECT
    id, name, age, gender, looking_for, country, city, bio,
    avatar_url, images, latitude, longitude,
    available_tonight, is_plusone, voice_intro_url,
    first_date_idea, first_date_places, languages,
    last_seen_at, hidden_until,
    is_active, is_banned,
    created_at
  FROM public.profiles
  WHERE is_banned = false AND is_active = true;
