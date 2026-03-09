-- Migration: personality reviews for profiles

CREATE TABLE IF NOT EXISTS public.personality_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (char_length(text) <= 240),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.personality_reviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'personality_reviews'
      AND policyname = 'Anyone can read personality reviews'
  ) THEN
    CREATE POLICY "Anyone can read personality reviews"
      ON public.personality_reviews
      FOR SELECT
      USING (true);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'personality_reviews'
      AND policyname = 'Users can create personality reviews'
  ) THEN
    CREATE POLICY "Users can create personality reviews"
      ON public.personality_reviews
      FOR INSERT
      WITH CHECK (
        auth.uid() = reviewer_id
        AND reviewer_id <> profile_id
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'personality_reviews'
      AND policyname = 'Users can delete own personality reviews'
  ) THEN
    CREATE POLICY "Users can delete own personality reviews"
      ON public.personality_reviews
      FOR DELETE
      USING (auth.uid() = reviewer_id);
  END IF;
END$$;
