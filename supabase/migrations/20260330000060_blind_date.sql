-- ── Blind Date Feature ─────────────────────────────────────────────────────
-- Auto-enrolls every new profile for 7 days, no manual setup required.

-- 1. Add columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS blind_date_active      BOOLEAN      DEFAULT true,
  ADD COLUMN IF NOT EXISTS blind_date_expires_at  TIMESTAMPTZ  DEFAULT (NOW() + INTERVAL '7 days');

-- 2. Attempts ledger
CREATE TABLE IF NOT EXISTS blind_date_attempts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  guesser_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score       INTEGER     NOT NULL DEFAULT 0,  -- 0-3
  passed      BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (guesser_id, target_id)
);

ALTER TABLE blind_date_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own attempts"
  ON blind_date_attempts FOR ALL
  USING (auth.uid() = guesser_id)
  WITH CHECK (auth.uid() = guesser_id);

-- 3. Auto-enroll trigger: every new profile gets 7-day blind-date window
CREATE OR REPLACE FUNCTION trg_auto_enroll_blind_date()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.blind_date_active     := true;
  NEW.blind_date_expires_at := NOW() + INTERVAL '7 days';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_enroll_blind_date ON profiles;
CREATE TRIGGER auto_enroll_blind_date
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION trg_auto_enroll_blind_date();

-- 4. RPC: fetch active blind-date profiles for a given user
--    Excludes: self, already-passed, expired
CREATE OR REPLACE FUNCTION get_blind_date_profiles(p_user_id UUID)
RETURNS TABLE (
  id               UUID,
  name             TEXT,
  age              INTEGER,
  city             TEXT,
  country          TEXT,
  gender           TEXT,
  looking_for      TEXT,
  bio              TEXT,
  avatar_url       TEXT,
  created_at       TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    p.id, p.name, p.age, p.city, p.country,
    p.gender, p.looking_for, p.bio, p.avatar_url, p.created_at
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
  ORDER BY p.created_at DESC
  LIMIT 60;
$$;

-- 5. RPC: submit a blind-date Q&A attempt
--    Returns true if passed (score >= 2), false otherwise
CREATE OR REPLACE FUNCTION submit_blind_date_attempt(
  p_guesser_id UUID,
  p_target_id  UUID,
  p_score      INTEGER
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_passed BOOLEAN := p_score >= 2;
BEGIN
  INSERT INTO blind_date_attempts (guesser_id, target_id, score, passed)
  VALUES (p_guesser_id, p_target_id, p_score, v_passed)
  ON CONFLICT (guesser_id, target_id)
    DO UPDATE SET score = EXCLUDED.score, passed = EXCLUDED.passed, created_at = NOW();
  RETURN v_passed;
END;
$$;

GRANT EXECUTE ON FUNCTION get_blind_date_profiles(UUID)                        TO authenticated;
GRANT EXECUTE ON FUNCTION submit_blind_date_attempt(UUID, UUID, INTEGER)       TO authenticated;
