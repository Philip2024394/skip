-- ============================================================
-- SkipTheApp — Complete Production Schema
-- Generated: 2026-03-08
-- Target: https://grxaajpzwsmtpuewquag.supabase.co
--
-- Paste this entire file into:
-- https://supabase.com/dashboard/project/grxaajpzwsmtpuewquag/sql/new
-- then click Run.
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── ENUM types ────────────────────────────────────────────────────────────────
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- ── profiles ─────────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id                     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  age                    INTEGER NOT NULL,
  gender                 TEXT NOT NULL,
  looking_for            TEXT NOT NULL DEFAULT 'Everyone',
  country                TEXT NOT NULL,
  city                   TEXT,
  bio                    TEXT,
  whatsapp               TEXT NOT NULL DEFAULT '',
  avatar_url             TEXT,
  images                 TEXT[]              DEFAULT '{}',
  latitude               DOUBLE PRECISION,
  longitude              DOUBLE PRECISION,
  available_tonight      BOOLEAN             NOT NULL DEFAULT false,
  voice_intro_url        TEXT,
  main_image_pos         TEXT                DEFAULT '50% 50%',
  image_positions        JSONB               DEFAULT '[]'::jsonb,
  first_date_idea        TEXT,
  first_date_places      JSONB               DEFAULT '[]'::jsonb,
  languages              JSONB               DEFAULT '[]'::jsonb,
  is_active              BOOLEAN             NOT NULL DEFAULT true,
  is_banned              BOOLEAN             NOT NULL DEFAULT false,
  is_incognito           BOOLEAN             NOT NULL DEFAULT false,
  incognito_until        TIMESTAMPTZ,
  is_spotlight           BOOLEAN             NOT NULL DEFAULT false,
  spotlight_until        TIMESTAMPTZ,
  is_plusone             BOOLEAN             NOT NULL DEFAULT false,
  is_verified            BOOLEAN             NOT NULL DEFAULT false,
  vip_subscription_id    TEXT,
  vip_subscription_status TEXT,
  hidden_until           TIMESTAMPTZ,
  last_seen_at           TIMESTAMPTZ         DEFAULT now(),
  last_rose_at           TIMESTAMPTZ,
  terms_accepted_at      TIMESTAMPTZ,
  created_at             TIMESTAMPTZ         NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ         NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (is_active = true AND is_banned = false AND (hidden_until IS NULL OR hidden_until < now()));

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Restricted update policy — privilege fields (is_spotlight, is_plusone, is_verified)
-- can only be changed by service role (edge functions / webhooks), not by users directly
CREATE POLICY "Users can update own profile (restricted)" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      SELECT
        COALESCE(p.is_spotlight, false) = COALESCE(profiles.is_spotlight, false)
        AND COALESCE(p.is_plusone, false) = COALESCE(profiles.is_plusone, false)
        AND COALESCE(p.is_verified, false) = COALESCE(profiles.is_verified, false)
      FROM public.profiles p
      WHERE p.id = auth.uid()
    )
  );

-- ── likes ─────────────────────────────────────────────────────────────────────
CREATE TABLE public.likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id   UUID NOT NULL,
  liked_id   UUID NOT NULL,
  is_rose    BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '48 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(liker_id, liked_id),
  CONSTRAINT likes_liker_id_fkey FOREIGN KEY (liker_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT likes_liked_id_fkey FOREIGN KEY (liked_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own likes" ON public.likes
  FOR SELECT TO authenticated
  USING (liker_id = auth.uid() OR liked_id = auth.uid());

CREATE POLICY "Users can insert own likes" ON public.likes
  FOR INSERT TO authenticated
  WITH CHECK (liker_id = auth.uid());

CREATE POLICY "Users can update own likes" ON public.likes
  FOR UPDATE TO authenticated
  USING (liker_id = auth.uid());

CREATE POLICY "Users can delete own likes" ON public.likes
  FOR DELETE TO authenticated
  USING (liker_id = auth.uid());

-- ── connections ───────────────────────────────────────────────────────────────
CREATE TABLE public.connections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a            UUID NOT NULL,
  user_b            UUID NOT NULL,
  stripe_session_id TEXT,
  amount_cents      INTEGER NOT NULL DEFAULT 199,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_a, user_b),
  CONSTRAINT connections_user_a_fkey FOREIGN KEY (user_a) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT connections_user_b_fkey FOREIGN KEY (user_b) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own connections" ON public.connections
  FOR SELECT TO authenticated
  USING (user_a = auth.uid() OR user_b = auth.uid());

-- ── payments ──────────────────────────────────────────────────────────────────
CREATE TABLE public.payments (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL,
  stripe_session_id      TEXT NOT NULL,
  stripe_payment_intent  TEXT,
  amount_cents           INTEGER NOT NULL,
  currency               TEXT NOT NULL DEFAULT 'usd',
  status                 TEXT NOT NULL DEFAULT 'pending',
  feature_id             TEXT,
  connection_id          UUID REFERENCES public.connections(id),
  target_user_id         UUID,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ── reports ───────────────────────────────────────────────────────────────────
CREATE TABLE public.reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL,
  reported_id UUID NOT NULL,
  reason      TEXT NOT NULL,
  details     TEXT,
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(reporter_id, reported_id),
  CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT reports_reported_id_fkey FOREIGN KEY (reported_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own reports" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

-- ── blocked_users ─────────────────────────────────────────────────────────────
CREATE TABLE public.blocked_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CONSTRAINT blocked_users_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT blocked_users_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own blocks" ON public.blocked_users
  FOR INSERT TO authenticated
  WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can view own blocks" ON public.blocked_users
  FOR SELECT TO authenticated
  USING (blocker_id = auth.uid());

CREATE POLICY "Users can delete own blocks" ON public.blocked_users
  FOR DELETE TO authenticated
  USING (blocker_id = auth.uid());

-- ── user_roles ────────────────────────────────────────────────────────────────
CREATE TABLE public.user_roles (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role    app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- ── profiles_public VIEW ──────────────────────────────────────────────────────
-- Exposes safe fields only (no whatsapp) — used by the app for browsing
CREATE OR REPLACE VIEW public.profiles_public WITH (security_invoker = on) AS
SELECT
  id, name, age, gender, looking_for, country, city, bio,
  avatar_url, images, latitude, longitude,
  available_tonight, is_plusone, is_verified, is_spotlight, spotlight_until,
  voice_intro_url, first_date_idea, first_date_places, languages,
  last_seen_at, hidden_until, is_active, is_banned, created_at
FROM public.profiles
WHERE is_banned = false AND is_active = true;

-- ── handle_new_user trigger ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, name, age, gender, looking_for, country, city,
    whatsapp, latitude, longitude, first_date_idea
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'age')::INTEGER, 25),
    COALESCE(NEW.raw_user_meta_data->>'gender', 'Other'),
    COALESCE(NEW.raw_user_meta_data->>'looking_for', 'Everyone'),
    COALESCE(NEW.raw_user_meta_data->>'country', 'Unknown'),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''),
    (NEW.raw_user_meta_data->>'latitude')::DOUBLE PRECISION,
    (NEW.raw_user_meta_data->>'longitude')::DOUBLE PRECISION,
    NEW.raw_user_meta_data->>'first_date_idea'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── updated_at auto-update trigger ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Storage buckets ───────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars',       'avatars',       true),
  ('profile-images','profile-images',true),
  ('voice-intros',  'voice-intros',  true)
ON CONFLICT (id) DO NOTHING;

-- avatars bucket policies
CREATE POLICY "Users can upload own avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- profile-images bucket policies
CREATE POLICY "Users can upload own profile images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own profile images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own profile images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view profile images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'profile-images');

-- voice-intros bucket policies
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

-- ── Done ──────────────────────────────────────────────────────────────────────
-- After running this SQL:
-- 1. Enable Email auth under Authentication > Providers
-- 2. Set Site URL to your Vercel domain under Authentication > URL Configuration
-- 3. Add your Vercel domain to Allowed Redirect URLs
-- 4. Deploy your Supabase Edge Functions with:
--    supabase functions deploy --project-ref grxaajpzwsmtpuewquag
