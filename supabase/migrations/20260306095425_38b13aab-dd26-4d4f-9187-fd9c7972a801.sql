
ALTER TABLE public.profiles ADD COLUMN is_incognito BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN incognito_until TIMESTAMP WITH TIME ZONE DEFAULT NULL;

DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public WITH (security_invoker = on) AS
SELECT id, name, age, bio, city, country, gender, looking_for, avatar_url, images, 
       latitude, longitude, available_tonight, voice_intro_url, 
       created_at, hidden_until, is_active, is_banned
FROM public.profiles
WHERE is_incognito = false OR incognito_until < now();
