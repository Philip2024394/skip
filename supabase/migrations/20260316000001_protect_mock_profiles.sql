-- Step 1: Add all potentially-missing columns (safe to re-run)

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS generous_lifestyle boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekend_plans boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS late_night_chat boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS no_drama boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_connections_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_canceled_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height_cm integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS drinking text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS smoking text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fitness text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pets text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests text[];

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_mock boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mock_online_hours numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mock_offline_days integer[];

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS basic_info jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lifestyle_info jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS relationship_goals jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS orientation text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS image_positions jsonb DEFAULT '[]'::jsonb;

-- Step 2: Index for fast mock-profile lookups

CREATE INDEX IF NOT EXISTS idx_profiles_is_mock ON public.profiles (is_mock) WHERE is_mock = true;

-- Step 3: Trigger to prevent regular users from deleting mock profiles

CREATE OR REPLACE FUNCTION public.guard_mock_profile_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.is_mock = true
     AND current_setting('role', true) NOT IN ('service_role', 'postgres', 'supabase_admin')
     AND NOT public.is_admin()
  THEN
    RAISE EXCEPTION 'Cannot delete a mock profile. Only admins may delete mock profiles.';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_mock_delete ON public.profiles;
CREATE TRIGGER trg_guard_mock_delete
  BEFORE DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_mock_profile_delete();

-- Step 4: Trigger to prevent is_mock from being cleared by non-admins

CREATE OR REPLACE FUNCTION public.guard_mock_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.is_mock = true
     AND NEW.is_mock = false
     AND current_setting('role', true) NOT IN ('service_role', 'postgres', 'supabase_admin')
     AND NOT public.is_admin()
  THEN
    RAISE EXCEPTION 'Cannot remove is_mock flag. Only admins can change mock status.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_mock_update ON public.profiles;
CREATE TRIGGER trg_guard_mock_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_mock_profile_update();

-- Step 5: Recreate profiles_public view to expose mock schedule fields

DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
SELECT
  id, name, age, gender, looking_for, country, city, bio,
  avatar_url, images, image_positions, latitude, longitude,
  available_tonight, is_plusone, generous_lifestyle, weekend_plans,
  late_night_chat, no_drama,
  whatsapp_connections_count, date_canceled_count,
  height_cm, drinking, smoking, fitness, pets, interests,
  is_verified, is_spotlight, spotlight_until,
  voice_intro_url, first_date_idea, first_date_places, languages,
  last_seen_at, hidden_until, is_active, is_banned, created_at,
  is_mock, mock_online_hours, mock_offline_days,
  basic_info, lifestyle_info, relationship_goals, orientation
FROM public.profiles
WHERE
  is_banned = false
  AND is_active = true
  AND (hidden_until IS NULL OR hidden_until < now())
  AND (is_incognito = false OR incognito_until < now());

GRANT SELECT ON public.profiles_public TO anon;
GRANT SELECT ON public.profiles_public TO authenticated;
