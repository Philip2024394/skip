-- ─────────────────────────────────────────────────────────────────────────────
-- Fix sent_gifts schema
-- The original table used receiver_id + gift_id (FK).
-- App code expects denormalised columns: recipient_id, sender_name,
-- gift_name, gift_emoji, gift_image_url, status.
-- Add these as optional columns so old and new code both work.
-- ─────────────────────────────────────────────────────────────────────────────

-- recipient_id alias (app uses this name; original column is receiver_id)
ALTER TABLE public.sent_gifts
  ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Keep recipient_id in sync with receiver_id via trigger
CREATE OR REPLACE FUNCTION public.sync_sent_gifts_recipient()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- When receiver_id is set, mirror to recipient_id
  IF NEW.receiver_id IS NOT NULL AND NEW.recipient_id IS NULL THEN
    NEW.recipient_id := NEW.receiver_id;
  END IF;
  -- When recipient_id is set, mirror to receiver_id
  IF NEW.recipient_id IS NOT NULL AND NEW.receiver_id IS NULL THEN
    NEW.receiver_id := NEW.recipient_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sent_gifts_sync_recipient ON public.sent_gifts;
CREATE TRIGGER sent_gifts_sync_recipient
  BEFORE INSERT OR UPDATE ON public.sent_gifts
  FOR EACH ROW EXECUTE FUNCTION public.sync_sent_gifts_recipient();

-- Backfill existing rows
UPDATE public.sent_gifts SET recipient_id = receiver_id WHERE recipient_id IS NULL AND receiver_id IS NOT NULL;

-- Denormalised gift columns (populated by app on insert)
ALTER TABLE public.sent_gifts
  ADD COLUMN IF NOT EXISTS sender_name   TEXT,
  ADD COLUMN IF NOT EXISTS gift_name     TEXT,
  ADD COLUMN IF NOT EXISTS gift_emoji    TEXT,
  ADD COLUMN IF NOT EXISTS gift_image_url TEXT,
  ADD COLUMN IF NOT EXISTS status        TEXT NOT NULL DEFAULT 'pending';

-- Index for inbox query
CREATE INDEX IF NOT EXISTS idx_sent_gifts_recipient_id ON public.sent_gifts (recipient_id, created_at DESC);

-- RLS: allow recipient_id-based reads too
DROP POLICY IF EXISTS "Users can view sent gifts to them by recipient_id" ON public.sent_gifts;
CREATE POLICY "Users can view sent gifts to them by recipient_id"
  ON public.sent_gifts FOR SELECT
  USING (auth.uid() = recipient_id);
