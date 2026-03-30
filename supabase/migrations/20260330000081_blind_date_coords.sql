-- Add latitude/longitude to get_blind_date_profiles so clients can show distance

DROP FUNCTION IF EXISTS get_blind_date_profiles(UUID);

CREATE OR REPLACE FUNCTION get_blind_date_profiles(p_user_id UUID)
RETURNS TABLE (
  id                        UUID,
  name                      TEXT,
  age                       INTEGER,
  city                      TEXT,
  country                   TEXT,
  gender                    TEXT,
  looking_for               TEXT,
  bio                       TEXT,
  avatar_url                TEXT,
  created_at                TIMESTAMPTZ,
  blind_date_story_age      TEXT,
  blind_date_story_location TEXT,
  blind_date_story_intent   TEXT,
  is_boosted                BOOLEAN,
  latitude                  DOUBLE PRECISION,
  longitude                 DOUBLE PRECISION
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    p.id, p.name, p.age, p.city, p.country,
    p.gender, p.looking_for, p.bio, p.avatar_url, p.created_at,
    p.blind_date_story_age, p.blind_date_story_location, p.blind_date_story_intent,
    (p.blind_date_boosted_until IS NOT NULL AND p.blind_date_boosted_until > NOW()) AS is_boosted,
    p.latitude,
    p.longitude
  FROM profiles p
  WHERE p.blind_date_active = true
    AND p.blind_date_expires_at > NOW()
    AND p.id <> p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM blind_date_attempts a
      WHERE a.guesser_id = p_user_id
        AND a.target_id  = p.id
        AND a.passed     = true
    )
  ORDER BY
    (p.blind_date_boosted_until IS NOT NULL AND p.blind_date_boosted_until > NOW()) DESC,
    p.created_at DESC
  LIMIT 60;
$$;

GRANT EXECUTE ON FUNCTION get_blind_date_profiles(UUID) TO authenticated;
