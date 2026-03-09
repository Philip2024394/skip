-- Enforce single active badge per profile (or none)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_single_badge'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_single_badge;
  END IF;
END$$;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_single_badge
CHECK (
  (
    (CASE WHEN coalesce(available_tonight, false) THEN 1 ELSE 0 END) +
    (CASE WHEN coalesce(is_plusone, false) THEN 1 ELSE 0 END) +
    (CASE WHEN coalesce(generous_lifestyle, false) THEN 1 ELSE 0 END) +
    (CASE WHEN coalesce(weekend_plans, false) THEN 1 ELSE 0 END) +
    (CASE WHEN coalesce(late_night_chat, false) THEN 1 ELSE 0 END) +
    (CASE WHEN coalesce(no_drama, false) THEN 1 ELSE 0 END)
  ) <= 1
);
