-- Add cached public WhatsApp connections count per profile (for profile pages)

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS whatsapp_connections_count integer NOT NULL DEFAULT 0;

-- Recompute helper
CREATE OR REPLACE FUNCTION public.recompute_whatsapp_connections_count(_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles p
  SET whatsapp_connections_count = (
    SELECT count(*)
    FROM public.connections c
    WHERE c.user_a = _profile_id OR c.user_b = _profile_id
  )
  WHERE p.id = _profile_id;
END;
$$;

-- Trigger handler
CREATE OR REPLACE FUNCTION public.on_connections_change_recompute_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a uuid;
  b uuid;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    a := OLD.user_a;
    b := OLD.user_b;
  ELSE
    a := NEW.user_a;
    b := NEW.user_b;
  END IF;

  PERFORM public.recompute_whatsapp_connections_count(a);
  PERFORM public.recompute_whatsapp_connections_count(b);

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_connections_recompute_counts ON public.connections;
CREATE TRIGGER trg_connections_recompute_counts
AFTER INSERT OR UPDATE OR DELETE ON public.connections
FOR EACH ROW
EXECUTE FUNCTION public.on_connections_change_recompute_counts();

-- Backfill existing profiles
UPDATE public.profiles p
SET whatsapp_connections_count = (
  SELECT count(*)
  FROM public.connections c
  WHERE c.user_a = p.id OR c.user_b = p.id
);

-- Update profiles_public view to expose the count
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
SELECT
  id, name, age, gender, looking_for, country, city, bio,
  avatar_url, images, latitude, longitude,
  available_tonight, is_plusone, generous_lifestyle, weekend_plans, late_night_chat, no_drama,
  whatsapp_connections_count,
  is_verified, is_spotlight, spotlight_until,
  voice_intro_url, first_date_idea, first_date_places, languages,
  last_seen_at, hidden_until, is_active, is_banned, created_at
FROM public.profiles
WHERE
  is_banned = false
  AND is_active = true
  AND (hidden_until IS NULL OR hidden_until < now())
  AND (is_incognito = false OR incognito_until < now());

GRANT SELECT ON public.profiles_public TO anon;
GRANT SELECT ON public.profiles_public TO authenticated;
