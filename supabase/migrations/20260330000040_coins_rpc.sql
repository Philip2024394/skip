-- Atomic coin award: inserts ledger row + increments balance in one transaction.
-- Prevents race conditions from concurrent updates.
CREATE OR REPLACE FUNCTION award_coins(
  p_user_id UUID,
  p_amount   INTEGER,
  p_reason   TEXT
)
RETURNS INTEGER          -- returns new balance
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Insert ledger entry
  INSERT INTO coin_transactions (user_id, amount, reason)
  VALUES (p_user_id, p_amount, p_reason);

  -- Increment balance
  UPDATE profiles
  SET coins_balance = coins_balance + p_amount
  WHERE id = p_user_id
  RETURNING coins_balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$;

-- Atomic coin spend: deducts balance only if sufficient funds.
CREATE OR REPLACE FUNCTION spend_coins(
  p_user_id UUID,
  p_amount   INTEGER,
  p_reason   TEXT
)
RETURNS INTEGER          -- returns new balance, or -1 if insufficient
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current  INTEGER;
  v_new_balance INTEGER;
BEGIN
  SELECT coins_balance INTO v_current
  FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF v_current < p_amount THEN
    RETURN -1;            -- insufficient funds
  END IF;

  INSERT INTO coin_transactions (user_id, amount, reason)
  VALUES (p_user_id, -p_amount, p_reason);

  UPDATE profiles
  SET coins_balance = coins_balance - p_amount
  WHERE id = p_user_id
  RETURNING coins_balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$;

-- Grant execute to authenticated users (RLS on underlying tables still applies)
GRANT EXECUTE ON FUNCTION award_coins(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION spend_coins(UUID, INTEGER, TEXT) TO authenticated;
