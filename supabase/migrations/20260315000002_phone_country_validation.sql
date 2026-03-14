-- Phone-based country validation
-- Adds columns to track detected country from phone prefix and override requests

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_country_code       text,
  ADD COLUMN IF NOT EXISTS country_override_requested  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS country_override_approved   boolean NOT NULL DEFAULT false;

-- Index for admin dashboard query (pending override requests)
CREATE INDEX IF NOT EXISTS idx_profiles_country_override_pending
  ON public.profiles (country_override_requested, country_override_approved)
  WHERE country_override_requested = true AND country_override_approved = false;
