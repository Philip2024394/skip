-- ============================================================
-- WebRTC Video Call System (Pure WebRTC, No Third Party)
-- Replaces Daily.co with browser native WebRTC + Supabase Realtime
-- ============================================================

-- Drop old Daily.co video_rooms table
DROP TABLE IF EXISTS video_rooms CASCADE;

-- Create new video_calls table for WebRTC calls
CREATE TABLE IF NOT EXISTS video_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL,
  caller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, ended, declined, missed
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE video_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own video calls"
  ON video_calls FOR SELECT
  USING (auth.uid() IN (caller_id, receiver_id));

CREATE POLICY "Users can insert their own video calls"
  ON video_calls FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update their own video calls"
  ON video_calls FOR UPDATE
  USING (auth.uid() IN (caller_id, receiver_id));

-- Update contact_preference column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'contact_preference'
  ) THEN
    ALTER TABLE profiles ADD COLUMN contact_preference TEXT NOT NULL DEFAULT 'whatsapp';
  END IF;
END $$;

-- Add check constraint for contact_preference values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_contact_preference_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_contact_preference_check 
      CHECK (contact_preference IN ('whatsapp', 'video', 'both'));
  END IF;
END $$;

-- Create index for faster video call lookups
CREATE INDEX IF NOT EXISTS idx_video_calls_match_id ON video_calls(match_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_caller_id ON video_calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_receiver_id ON video_calls(receiver_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_status ON video_calls(status);
