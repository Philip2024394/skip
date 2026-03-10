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
