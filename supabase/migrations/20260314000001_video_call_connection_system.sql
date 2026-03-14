-- ============================================================
-- Video Call & Connection System
-- Adds contact preference, video rooms, and contact unlocks
-- ============================================================

-- 1. Add contact_preference column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_preference TEXT NOT NULL DEFAULT 'whatsapp';

-- 2. Video rooms table for Daily.co video calls
CREATE TABLE IF NOT EXISTS video_rooms (
  room_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  daily_room_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE video_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own video rooms"
  ON video_rooms FOR SELECT
  USING (auth.uid() IN (user1_id, user2_id));

CREATE POLICY "Service role can manage video rooms"
  ON video_rooms FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. Contact unlocks table
CREATE TABLE IF NOT EXISTS contact_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT,
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL CHECK (connection_type IN ('whatsapp', 'video', 'both')),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  amount INTEGER NOT NULL
);

ALTER TABLE contact_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contact unlocks"
  ON contact_unlocks FOR SELECT
  USING (auth.uid() IN (user1_id, user2_id));

CREATE POLICY "Service role can manage contact unlocks"
  ON contact_unlocks FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_video_rooms_users ON video_rooms(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_video_rooms_active ON video_rooms(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_contact_unlocks_users ON contact_unlocks(user1_id, user2_id);
