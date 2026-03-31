-- ── Free Tonight: mobile_carrier + tonight_requests ─────────────────────────

-- 1. Add mobile carrier field to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mobile_carrier text DEFAULT NULL;

COMMENT ON COLUMN public.profiles.mobile_carrier IS
  'Indonesian mobile carrier: Telkomsel, XL, Indosat, Smartfren, Tri, Axis, By.U';

-- 2. Create tonight_requests table
CREATE TABLE IF NOT EXISTS public.tonight_requests (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gift_id         text        NOT NULL,
  gift_label      text        NOT NULL,
  gift_cost_coins integer     NOT NULL DEFAULT 0,
  coins_spent     integer     NOT NULL DEFAULT 3,  -- base 3 + gift cost
  message         text        NOT NULL,
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','accepted','declined','expired')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL  -- 1am local (stored as UTC)
);

-- 3. Index for fast lookups
CREATE INDEX IF NOT EXISTS tonight_requests_receiver_idx
  ON public.tonight_requests (receiver_id, status);

CREATE INDEX IF NOT EXISTS tonight_requests_sender_idx
  ON public.tonight_requests (sender_id);

-- 4. RLS
ALTER TABLE public.tonight_requests ENABLE ROW LEVEL SECURITY;

-- Sender can insert their own requests
CREATE POLICY "tonight_requests_insert" ON public.tonight_requests
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Both sender and receiver can read their own requests
CREATE POLICY "tonight_requests_select" ON public.tonight_requests
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- Only receiver can update status (accept/decline)
CREATE POLICY "tonight_requests_update" ON public.tonight_requests
  FOR UPDATE USING (auth.uid() = receiver_id);

-- 5. Auto-expire: mark pending requests as expired past expires_at
-- (Called periodically or on fetch — handled in app logic)
