-- Migration: restrict personality reviews to paid WhatsApp connections (5-day window)

-- Track latest payment time on connections so we can reopen the review window on repurchase
ALTER TABLE public.connections
ADD COLUMN IF NOT EXISTS last_paid_at timestamptz NOT NULL DEFAULT now();

UPDATE public.connections
SET last_paid_at = COALESCE(last_paid_at, created_at)
WHERE last_paid_at IS NULL;

-- Extend personality_reviews with connection reference and whatsapp confirmation (store last 4 digits only)
ALTER TABLE public.personality_reviews
ADD COLUMN IF NOT EXISTS connection_id uuid REFERENCES public.connections(id) ON DELETE SET NULL;

ALTER TABLE public.personality_reviews
ADD COLUMN IF NOT EXISTS reviewer_whatsapp_last4 text;

-- Increase allowed review length
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.personality_reviews'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%char_length%text%<=%240%'
  LOOP
    EXECUTE format('ALTER TABLE public.personality_reviews DROP CONSTRAINT %I', c.conname);
  END LOOP;
END$$;

ALTER TABLE public.personality_reviews
  ADD CONSTRAINT personality_reviews_text_length CHECK (char_length(text) <= 350);

-- Ensure one review per connection window/payment
CREATE UNIQUE INDEX IF NOT EXISTS personality_reviews_unique_per_connection
  ON public.personality_reviews (profile_id, reviewer_id, connection_id);

-- Replace insert policy with RPC-only inserts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'personality_reviews'
      AND policyname = 'Users can create personality reviews'
  ) THEN
    DROP POLICY "Users can create personality reviews" ON public.personality_reviews;
  END IF;
END$$;

-- Keep read + delete policies (created in previous migration)

-- RPC for creating reviews with eligibility checks
CREATE OR REPLACE FUNCTION public.create_personality_review(
  _profile_id uuid,
  _text text,
  _whatsapp text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_digits_input text;
  v_digits_profile text;
  v_connection_id uuid;
  v_last4 text;
  v_new_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _profile_id IS NULL THEN
    RAISE EXCEPTION 'profile_id is required';
  END IF;

  IF v_user_id = _profile_id THEN
    RAISE EXCEPTION 'Cannot review yourself';
  END IF;

  IF _text IS NULL OR length(trim(_text)) = 0 THEN
    RAISE EXCEPTION 'Review text is required';
  END IF;

  IF char_length(_text) > 350 THEN
    RAISE EXCEPTION 'Review too long';
  END IF;

  SELECT regexp_replace(coalesce(_whatsapp, ''), '\\D', '', 'g') INTO v_digits_input;
  SELECT regexp_replace(coalesce(p.whatsapp, ''), '\\D', '', 'g')
    INTO v_digits_profile
  FROM public.profiles p
  WHERE p.id = v_user_id;

  IF v_digits_profile IS NULL OR v_digits_profile = '' THEN
    RAISE EXCEPTION 'Your WhatsApp number is not set on your profile';
  END IF;

  IF v_digits_input IS NULL OR v_digits_input = '' THEN
    RAISE EXCEPTION 'WhatsApp number is required';
  END IF;

  IF v_digits_input <> v_digits_profile THEN
    RAISE EXCEPTION 'WhatsApp number does not match your profile';
  END IF;

  -- Most recent paid connection between these users, within 5 days
  SELECT c.id
    INTO v_connection_id
  FROM public.connections c
  WHERE (
      (c.user_a = v_user_id AND c.user_b = _profile_id)
      OR
      (c.user_a = _profile_id AND c.user_b = v_user_id)
    )
    AND c.last_paid_at >= now() - interval '5 days'
  ORDER BY c.last_paid_at DESC
  LIMIT 1;

  IF v_connection_id IS NULL THEN
    RAISE EXCEPTION 'No active WhatsApp connection window (5 days) for this profile';
  END IF;

  v_last4 := right(v_digits_profile, 4);

  INSERT INTO public.personality_reviews (profile_id, reviewer_id, connection_id, reviewer_whatsapp_last4, text)
  VALUES (_profile_id, v_user_id, v_connection_id, v_last4, _text)
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_personality_review(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_personality_review(uuid, text, text) TO authenticated;
