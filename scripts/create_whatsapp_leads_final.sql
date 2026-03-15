-- Create WhatsApp leads table with working column names
-- This table captures WhatsApp numbers before the app launch

CREATE TABLE IF NOT EXISTS whatsapp_leads (
  id TEXT PRIMARY KEY DEFAULT (md5(random()::text || clock_timestamp()::text)),
  whatsapp_e164 TEXT NOT NULL UNIQUE,
  country_prefix TEXT NOT NULL,
  national_number TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'landing',
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  signup_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  modified_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_country_prefix ON whatsapp_leads(country_prefix);
CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_source ON whatsapp_leads(source);
CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_signup_time ON whatsapp_leads(signup_time DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_last_seen_at ON whatsapp_leads(last_seen_at DESC);

-- Add comments for documentation
COMMENT ON TABLE whatsapp_leads IS 'Stores WhatsApp leads from user sign-ups before app launch';
COMMENT ON COLUMN whatsapp_leads.whatsapp_e164 IS 'Full WhatsApp number in E164 format (e.g., +1234567890)';
COMMENT ON COLUMN whatsapp_leads.country_prefix IS 'Country code with + (e.g., +1, +44, +62)';
COMMENT ON COLUMN whatsapp_leads.national_number IS 'National number without country code (e.g., 234567890)';
COMMENT ON COLUMN whatsapp_leads.source IS 'Source of the lead: landing, registration, etc.';
COMMENT ON COLUMN whatsapp_leads.last_seen_at IS 'Last time this lead was active/seen';
COMMENT ON COLUMN whatsapp_leads.signup_time IS 'When the lead was first captured';
COMMENT ON COLUMN whatsapp_leads.modified_time IS 'Last time the lead was updated';
