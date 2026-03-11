-- Apply RLS policy for WhatsApp leads
-- Run this in Supabase Dashboard SQL Editor

-- Allow landing page WhatsApp lead capture to use upsert()
-- upsert requires UPDATE permission when the row already exists

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'whatsapp_leads'
      AND policyname = 'Anyone can update whatsapp leads'
  ) THEN
    CREATE POLICY "Anyone can update whatsapp leads"
      ON public.whatsapp_leads
      FOR UPDATE
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END$$;

-- Also ensure INSERT policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'whatsapp_leads'
      AND policyname = 'Anyone can insert whatsapp leads'
  ) THEN
    CREATE POLICY "Anyone can insert whatsapp leads"
      ON public.whatsapp_leads
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END$$;

-- Enable RLS on the table if not already enabled
ALTER TABLE public.whatsapp_leads ENABLE ROW LEVEL SECURITY;
