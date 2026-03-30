-- ── Blind Date Questions ──────────────────────────────────────────────────────
-- Sent after a user passes the Q&A quiz. Notifies the target that someone
-- completed their quiz and has a personal question for them.

CREATE TABLE IF NOT EXISTS blind_date_questions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  asker_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question    TEXT        NOT NULL CHECK (char_length(question) <= 120),
  answer      TEXT,
  answered_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one question per asker→target pair (re-sending replaces it)
CREATE UNIQUE INDEX IF NOT EXISTS blind_date_questions_pair
  ON blind_date_questions (asker_id, target_id);

-- Target can read questions addressed to them; asker can read their own
ALTER TABLE blind_date_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "target reads own questions"
  ON blind_date_questions FOR SELECT
  USING (target_id = auth.uid() OR asker_id = auth.uid());

CREATE POLICY "asker inserts"
  ON blind_date_questions FOR INSERT
  WITH CHECK (asker_id = auth.uid());

CREATE POLICY "target answers"
  ON blind_date_questions FOR UPDATE
  USING (target_id = auth.uid());

-- ── send_blind_date_question RPC ──────────────────────────────────────────────
-- Upserts the question and returns the target's push_token so the client
-- (or an edge function) can fire the push notification.

CREATE OR REPLACE FUNCTION send_blind_date_question(
  p_asker_id  UUID,
  p_target_id UUID,
  p_question  TEXT
) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_push_token TEXT;
BEGIN
  -- Upsert so re-sending replaces the old question
  INSERT INTO blind_date_questions (asker_id, target_id, question)
  VALUES (p_asker_id, p_target_id, p_question)
  ON CONFLICT (asker_id, target_id)
  DO UPDATE SET question = EXCLUDED.question, answer = NULL, answered_at = NULL, created_at = NOW();

  -- Return target's push token so client can trigger web-push
  SELECT push_token INTO v_push_token
  FROM profiles WHERE id = p_target_id;

  RETURN v_push_token;
END;
$$;

GRANT EXECUTE ON FUNCTION send_blind_date_question(UUID, UUID, TEXT) TO authenticated;
