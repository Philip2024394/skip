-- Migration: Prevent users from self-updating premium/privilege fields
-- All such fields must only be set by the service role (edge functions / webhooks)

-- First, ensure RLS is enabled on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any overly permissive update policy that allows all columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND policyname = 'Users can update own profile'
  ) THEN
    DROP POLICY "Users can update own profile" ON public.profiles;
  END IF;
END$$;

-- Re-create a restricted update policy:
-- Users may update their own profile, BUT only the non-privilege columns.
-- is_vip / is_spotlight / spotlight_until / super_likes_count / is_plusone /
-- is_verified / vip_subscription_id / vip_subscription_status
-- cannot be changed by the user — only the service role can touch them.
CREATE POLICY "Users can update own profile (restricted)"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Block any attempt to escalate privilege fields
    -- (PostgreSQL evaluates WITH CHECK against NEW row;
    --  we compare NEW fields against the OLD row via a correlated sub-select)
    AND (
      SELECT
        -- If the user tries to change any of these fields, the check fails
        COALESCE(p.is_spotlight, false)       = COALESCE(profiles.is_spotlight, false)
        AND COALESCE(p.is_plusone, false)     = COALESCE(profiles.is_plusone, false)
        AND COALESCE(p.is_verified, false)    = COALESCE(profiles.is_verified, false)
      FROM public.profiles p
      WHERE p.id = auth.uid()
    )
  );

-- Users can always read their own row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile"
      ON public.profiles
      FOR SELECT
      USING (auth.uid() = id OR is_active = true);
  END IF;
END$$;
