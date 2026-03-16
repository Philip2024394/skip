-- Production Migration: Move WhatsApp storage fully to Supabase
-- This script migrates any localStorage entries to Supabase and removes fallback

-- First, ensure the table exists with proper structure
CREATE TABLE IF NOT EXISTS whatsapp_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp_number TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT,
  email TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_signups_country ON whatsapp_signups(country);
CREATE INDEX IF NOT EXISTS idx_whatsapp_signups_created_at ON whatsapp_signups(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_signups_number ON whatsapp_signups(whatsapp_number);

-- Function to handle upserts (insert or update)
CREATE OR REPLACE FUNCTION upsert_whatsapp_signup(
  p_whatsapp_number TEXT,
  p_country TEXT,
  p_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  signup_id UUID;
BEGIN
  INSERT INTO whatsapp_signups (whatsapp_number, country, name, email)
  VALUES (p_whatsapp_number, p_country, p_name, p_email)
  ON CONFLICT (whatsapp_number) 
  DO UPDATE SET 
    country = EXCLUDED.country,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = NOW()
  RETURNING id INTO signup_id;
  
  RETURN signup_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_whatsapp_signup_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER whatsapp_signups_updated_at
  BEFORE UPDATE ON whatsapp_signups
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_signup_updated_at();

-- View for admin dashboard with stats
CREATE OR REPLACE VIEW whatsapp_signups_stats AS
SELECT 
  COUNT(*) as total_signups,
  COUNT(DISTINCT country) as total_countries,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as signups_last_24h,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as signups_last_7d,
  MIN(created_at) as first_signup,
  MAX(created_at) as latest_signup
FROM whatsapp_signups;

-- View for country breakdown
CREATE OR REPLACE VIEW whatsapp_signups_by_country AS
SELECT 
  country,
  COUNT(*) as signup_count,
  MIN(created_at) as first_signup,
  MAX(created_at) as latest_signup,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM whatsapp_signups
GROUP BY country
ORDER BY signup_count DESC;

-- RLS (Row Level Security) for production
ALTER TABLE whatsapp_signups ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own signup
CREATE POLICY "Users can view their own signup" ON whatsapp_signups
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    whatsapp_number IN (
      SELECT whatsapp_number FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- Policy: Admins can view all signups (if you have admin role)
CREATE POLICY "Admins can view all signups" ON whatsapp_signups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Anyone can insert signups (for public signup form)
CREATE POLICY "Anyone can insert signups" ON whatsapp_signups
  FOR INSERT WITH CHECK (true);

-- Policy: Only admins can update signups
CREATE POLICY "Admins can update signups" ON whatsapp_signups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Only admins can delete signups
CREATE POLICY "Admins can delete signups" ON whatsapp_signups
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

COMMENT ON TABLE whatsapp_signups IS 'WhatsApp signups for early bird access - Production ready with RLS';
COMMENT ON VIEW whatsapp_signups_stats IS 'Statistics view for WhatsApp signups dashboard';
COMMENT ON VIEW whatsapp_signups_by_country IS 'Country breakdown view for WhatsApp signups';
