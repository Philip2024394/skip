-- ── Inbox RPC ─────────────────────────────────────────────────────────────────
-- Returns all active conversations for a user with last message + unread count

CREATE OR REPLACE FUNCTION get_conversations(p_user_id UUID)
RETURNS TABLE (
  partner_id       UUID,
  partner_name     TEXT,
  partner_avatar   TEXT,
  partner_age      INTEGER,
  partner_city     TEXT,
  last_message     TEXT,
  last_message_at  TIMESTAMPTZ,
  unread_count     BIGINT,
  is_sender        BOOLEAN
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    partner.id                  AS partner_id,
    partner.name                AS partner_name,
    partner.avatar_url          AS partner_avatar,
    partner.age                 AS partner_age,
    partner.city                AS partner_city,
    latest.content              AS last_message,
    latest.created_at           AS last_message_at,
    COALESCE(unread.cnt, 0)     AS unread_count,
    (latest.sender_id = p_user_id) AS is_sender
  FROM (
    -- Distinct conversation partners
    SELECT DISTINCT
      CASE
        WHEN sender_id = p_user_id THEN recipient_id
        ELSE sender_id
      END AS partner_id
    FROM messages
    WHERE sender_id = p_user_id OR recipient_id = p_user_id
  ) conv
  JOIN profiles partner ON partner.id = conv.partner_id
  JOIN LATERAL (
    -- Latest message per conversation
    SELECT content, created_at, sender_id
    FROM messages
    WHERE (sender_id = p_user_id AND recipient_id = conv.partner_id)
       OR (sender_id = conv.partner_id AND recipient_id = p_user_id)
    ORDER BY created_at DESC
    LIMIT 1
  ) latest ON true
  LEFT JOIN LATERAL (
    -- Unread count per conversation
    SELECT COUNT(*) AS cnt
    FROM messages
    WHERE sender_id = conv.partner_id
      AND recipient_id = p_user_id
      AND read_at IS NULL
  ) unread ON true
  ORDER BY latest.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_conversations(UUID) TO authenticated;

-- ── get_received_blind_date_questions ─────────────────────────────────────────
-- Questions other users sent to me after passing my blind date quiz

CREATE OR REPLACE FUNCTION get_received_blind_date_questions(p_user_id UUID)
RETURNS TABLE (
  question_id  UUID,
  asker_id     UUID,
  asker_name   TEXT,
  asker_avatar TEXT,
  asker_age    INTEGER,
  asker_city   TEXT,
  question     TEXT,
  answer       TEXT,
  answered_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    q.id          AS question_id,
    p.id          AS asker_id,
    p.name        AS asker_name,
    p.avatar_url  AS asker_avatar,
    p.age         AS asker_age,
    p.city        AS asker_city,
    q.question,
    q.answer,
    q.answered_at,
    q.created_at
  FROM blind_date_questions q
  JOIN profiles p ON p.id = q.asker_id
  WHERE q.target_id = p_user_id
  ORDER BY q.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_received_blind_date_questions(UUID) TO authenticated;

-- ── answer_blind_date_question RPC ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION answer_blind_date_question(
  p_question_id UUID,
  p_answer      TEXT,
  p_user_id     UUID
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE blind_date_questions
  SET answer = p_answer, answered_at = NOW()
  WHERE id = p_question_id AND target_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION answer_blind_date_question(UUID, TEXT, UUID) TO authenticated;

-- ── get_received_likes ────────────────────────────────────────────────────────
-- Likes I've received that haven't expired

CREATE OR REPLACE FUNCTION get_received_likes(p_user_id UUID)
RETURNS TABLE (
  like_id      UUID,
  liker_id     UUID,
  liker_name   TEXT,
  liker_avatar TEXT,
  liker_age    INTEGER,
  liker_city   TEXT,
  is_rose      BOOLEAN,
  created_at   TIMESTAMPTZ,
  is_mutual    BOOLEAN
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    l.id          AS like_id,
    p.id          AS liker_id,
    p.name        AS liker_name,
    p.avatar_url  AS liker_avatar,
    p.age         AS liker_age,
    p.city        AS liker_city,
    l.is_rose,
    l.created_at,
    EXISTS (
      SELECT 1 FROM likes back
      WHERE back.liker_id = p_user_id
        AND back.liked_id = l.liker_id
        AND (back.expires_at IS NULL OR back.expires_at > NOW())
    ) AS is_mutual
  FROM likes l
  JOIN profiles p ON p.id = l.liker_id
  WHERE l.liked_id = p_user_id
    AND (l.expires_at IS NULL OR l.expires_at > NOW())
  ORDER BY l.is_rose DESC, l.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_received_likes(UUID) TO authenticated;
