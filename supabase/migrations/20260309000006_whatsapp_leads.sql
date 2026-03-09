-- Collect WhatsApp numbers from landing screen (no verification)

CREATE TABLE IF NOT EXISTS public.whatsapp_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_e164 text NOT NULL,
  country_prefix text NOT NULL,
  national_number text NOT NULL,
  source text NOT NULL DEFAULT 'landing',
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_leads_whatsapp_e164_key
  ON public.whatsapp_leads (whatsapp_e164);

ALTER TABLE public.whatsapp_leads ENABLE ROW LEVEL SECURITY;

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'whatsapp_leads'
      AND policyname = 'Admins can read whatsapp leads'
  ) THEN
    CREATE POLICY "Admins can read whatsapp leads"
      ON public.whatsapp_leads
      FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END$$;
