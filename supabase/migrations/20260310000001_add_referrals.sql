-- Add WhatsApp friend referrals + Super Likes rewards

-- 1) Profile fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_code text,
ADD COLUMN IF NOT EXISTS referred_by text,
ADD COLUMN IF NOT EXISTS super_likes_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_rewards_claimed boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_referral_code_unique'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_referral_code_unique UNIQUE (referral_code);
  END IF;
END$$;

-- 2) Referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  referred_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  whatsapp_shared boolean NOT NULL DEFAULT false,
  reward_given boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Prevent multiple referral rewards per referred user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.referrals'::regclass
      AND conname = 'referrals_referred_id_unique'
  ) THEN
    ALTER TABLE public.referrals
      ADD CONSTRAINT referrals_referred_id_unique UNIQUE (referred_id);
  END IF;
END$$;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Basic RLS:
-- - Referrers can read their own referral rows
-- - Referred users can read their own referral row
CREATE POLICY IF NOT EXISTS "Referrers can view their referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

-- Inserts/updates are handled via SECURITY DEFINER RPC below

-- 3) Referral code generator
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_a int;
  v_b int;
  v_c int;
BEGIN
  LOOP
    v_a := 1 + floor(random() * length(v_chars))::int;
    v_b := 1 + floor(random() * length(v_chars))::int;
    v_c := 1 + floor(random() * length(v_chars))::int;
    v_code := '2DM-' || substr(v_chars, v_a, 1) || substr(v_chars, v_b, 1) || substr(v_chars, v_c, 1);

    IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.referral_code = v_code) THEN
      RETURN v_code;
    END IF;
  END LOOP;
END;
$$;

-- 4) Ensure new users get a referral_code (extend handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    name,
    age,
    gender,
    looking_for,
    country,
    city,
    whatsapp,
    latitude,
    longitude,
    first_date_idea,
    referral_code
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
    NEW.raw_user_meta_data->>'first_date_idea',
    public.generate_referral_code()
  );
  RETURN NEW;
END;
$$;

-- 5) RPC: process a pending referral after referred user signs up
-- Idempotent:
-- - only the referred user can call it for themselves
-- - only one referral row per referred_id
-- - credits referrer +10 super_likes_count once
CREATE OR REPLACE FUNCTION public.process_referral(_referral_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referred_id uuid;
  v_referrer_id uuid;
  v_exists uuid;
  v_new_balance int;
BEGIN
  v_referred_id := auth.uid();
  IF v_referred_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _referral_code IS NULL OR length(trim(_referral_code)) < 4 THEN
    RETURN json_build_object('ok', false, 'reason', 'missing_code');
  END IF;

  SELECT p.id INTO v_referrer_id
  FROM public.profiles p
  WHERE p.referral_code = trim(_referral_code)
  LIMIT 1;

  IF v_referrer_id IS NULL THEN
    RETURN json_build_object('ok', false, 'reason', 'code_not_found');
  END IF;

  IF v_referrer_id = v_referred_id THEN
    RETURN json_build_object('ok', false, 'reason', 'self_referral');
  END IF;

  SELECT r.id INTO v_exists
  FROM public.referrals r
  WHERE r.referred_id = v_referred_id
  LIMIT 1;

  IF v_exists IS NOT NULL THEN
    RETURN json_build_object('ok', true, 'already_processed', true);
  END IF;

  INSERT INTO public.referrals (referrer_id, referred_id, whatsapp_shared, reward_given)
  VALUES (v_referrer_id, v_referred_id, true, false);

  UPDATE public.profiles
  SET referred_by = trim(_referral_code)
  WHERE id = v_referred_id;

  UPDATE public.profiles
  SET super_likes_count = coalesce(super_likes_count, 0) + 10,
      referral_rewards_claimed = true
  WHERE id = v_referrer_id
  RETURNING super_likes_count INTO v_new_balance;

  UPDATE public.referrals
  SET reward_given = true
  WHERE referred_id = v_referred_id;

  RETURN json_build_object('ok', true, 'referrer_id', v_referrer_id, 'new_balance', v_new_balance);
END;
$$;

REVOKE ALL ON FUNCTION public.process_referral(text) FROM public;
GRANT EXECUTE ON FUNCTION public.process_referral(text) TO authenticated;
