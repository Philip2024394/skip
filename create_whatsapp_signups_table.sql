-- Create WhatsApp signups table for early bird registrations
CREATE TABLE IF NOT EXISTS whatsapp_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp_number TEXT NOT NULL,
  country TEXT NOT NULL,
  name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_signups_country ON whatsapp_signups(country);
CREATE INDEX IF NOT EXISTS idx_whatsapp_signups_created_at ON whatsapp_signups(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_signups_number ON whatsapp_signups(whatsapp_number);

-- Enable RLS
ALTER TABLE whatsapp_signups ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only allow reading/writing for authenticated users or service role
CREATE POLICY "Allow authenticated users to read whatsapp_signups" ON whatsapp_signups
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow authenticated users to insert whatsapp_signups" ON whatsapp_signups
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow service role to update whatsapp_signups" ON whatsapp_signups
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role to delete whatsapp_signups" ON whatsapp_signups
  FOR DELETE USING (auth.role() = 'service_role');
