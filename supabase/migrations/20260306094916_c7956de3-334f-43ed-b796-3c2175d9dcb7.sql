
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public AS
SELECT id, name, age, bio, city, country, gender, looking_for, avatar_url, images, 
       latitude, longitude, available_tonight, voice_intro_url, 
       created_at, hidden_until, is_active, is_banned
FROM public.profiles;
