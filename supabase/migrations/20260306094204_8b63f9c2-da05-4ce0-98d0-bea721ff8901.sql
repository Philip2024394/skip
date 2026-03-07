
-- Add voice intro URL to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS voice_intro_url text DEFAULT NULL;

-- Create storage bucket for voice intros
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-intros', 'voice-intros', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for voice intros
CREATE POLICY "Users can upload own voice intros"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'voice-intros' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own voice intros"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'voice-intros' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own voice intros"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'voice-intros' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can listen to voice intros"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'voice-intros');

-- Recreate view with voice_intro_url
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public WITH (security_invoker = on) AS
SELECT
  id, name, age, gender, looking_for, country, city, bio, avatar_url,
  is_active, is_banned, hidden_until, created_at, latitude, longitude,
  images, available_tonight, voice_intro_url
FROM public.profiles
WHERE is_active = true AND is_banned = false AND (hidden_until IS NULL OR hidden_until < now());
