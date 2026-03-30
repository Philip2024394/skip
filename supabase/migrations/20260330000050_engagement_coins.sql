-- ─────────────────────────────────────────────────────────────────────────────
-- Engagement coins: +2 for sending a like, +5 each on a mutual match
-- Daily cap: 20 coins per user per day from engagement actions
-- Duplicate guard: can't earn twice for the same target profile
-- ─────────────────────────────────────────────────────────────────────────────

-- Helper: how many engagement coins has this user earned today?
CREATE OR REPLACE FUNCTION engagement_coins_today(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM coin_transactions
  WHERE user_id   = p_user_id
    AND reason    LIKE 'engagement_%'
    AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC');
$$;

-- ── award_like_coins ──────────────────────────────────────────────────────────
-- Called by the client after inserting a like on a real profile.
-- Awards +2 coins to the liker if:
--   1. Daily cap not reached (< 20 engagement coins today)
--   2. Not already awarded for this target today
-- Returns new balance, or -1 if capped/duplicate.
CREATE OR REPLACE FUNCTION award_like_coins(
  p_user_id   UUID,
  p_target_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_daily     INTEGER;
  v_duplicate INTEGER;
  v_balance   INTEGER;
BEGIN
  -- Daily cap check
  v_daily := engagement_coins_today(p_user_id);
  IF v_daily >= 20 THEN RETURN -1; END IF;

  -- Duplicate check (already earned a like coin for this target today)
  SELECT COUNT(*) INTO v_duplicate
  FROM coin_transactions
  WHERE user_id   = p_user_id
    AND reason    = 'engagement_like_' || p_target_id::text
    AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC');
  IF v_duplicate > 0 THEN RETURN -1; END IF;

  -- Award +2 coins
  INSERT INTO coin_transactions (user_id, amount, reason)
  VALUES (p_user_id, 2, 'engagement_like_' || p_target_id::text);

  UPDATE profiles
  SET coins_balance = coins_balance + 2
  WHERE id = p_user_id
  RETURNING coins_balance INTO v_balance;

  RETURN v_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION award_like_coins(UUID, UUID) TO authenticated;

-- ── award_match_coins (internal — called by trigger) ─────────────────────────
-- Awards +5 coins to a single user for a new match.
-- Same daily cap + duplicate guard.
CREATE OR REPLACE FUNCTION award_match_coins_to(
  p_user_id   UUID,
  p_target_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_daily     INTEGER;
  v_duplicate INTEGER;
BEGIN
  v_daily := engagement_coins_today(p_user_id);
  IF v_daily >= 20 THEN RETURN; END IF;

  SELECT COUNT(*) INTO v_duplicate
  FROM coin_transactions
  WHERE user_id   = p_user_id
    AND reason    = 'engagement_match_' || p_target_id::text
    AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC');
  IF v_duplicate > 0 THEN RETURN; END IF;

  INSERT INTO coin_transactions (user_id, amount, reason)
  VALUES (p_user_id, 5, 'engagement_match_' || p_target_id::text);

  UPDATE profiles
  SET coins_balance = coins_balance + 5
  WHERE id = p_user_id;
END;
$$;

-- ── Trigger: auto-award match coins on mutual like ───────────────────────────
CREATE OR REPLACE FUNCTION trg_award_match_coins()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check if the person being liked has already liked back (mutual like = match)
  IF EXISTS (
    SELECT 1 FROM likes
    WHERE liker_id = NEW.liked_id
      AND liked_id  = NEW.liker_id
  ) THEN
    -- Award +5 to the person who just liked (completes the match)
    PERFORM award_match_coins_to(NEW.liker_id, NEW.liked_id);
    -- Award +5 to the person who was already liked (they get the match too)
    PERFORM award_match_coins_to(NEW.liked_id, NEW.liker_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_like_inserted_award_coins ON likes;
CREATE TRIGGER on_like_inserted_award_coins
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION trg_award_match_coins();
