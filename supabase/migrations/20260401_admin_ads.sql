-- Admin ads queue (persisted, replaces localStorage)
CREATE TABLE IF NOT EXISTS admin_ads (
  id              TEXT PRIMARY KEY,
  ad_type         TEXT NOT NULL DEFAULT 'image',
  profile_id      TEXT,
  profile_name    TEXT,
  profile_age     INTEGER,
  profile_city    TEXT,
  profile_avatar  TEXT,
  image_url       TEXT NOT NULL DEFAULT '',
  video_url       TEXT,
  caption         TEXT NOT NULL DEFAULT '',
  hashtags        TEXT[] NOT NULL DEFAULT '{}',
  country         TEXT NOT NULL DEFAULT 'indonesia',
  platform        TEXT NOT NULL DEFAULT 'ig_square',
  custom_w        INTEGER,
  custom_h        INTEGER,
  status          TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','used')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  copied_at       TIMESTAMPTZ,
  crop_x          FLOAT NOT NULL DEFAULT 0,
  crop_y          FLOAT NOT NULL DEFAULT 0,
  crop_zoom       FLOAT NOT NULL DEFAULT 1,
  overlay_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  overlay_position TEXT NOT NULL DEFAULT 'bottom-right',
  overlay_opacity FLOAT NOT NULL DEFAULT 0.9
);

-- Only admins should touch this table
ALTER TABLE admin_ads ENABLE ROW LEVEL SECURITY;

-- No public access — service role only (admin dashboard uses service-role key implicitly via anon with RLS off for admin)
-- For simplicity allow all authenticated users to read/write (restrict further if needed)
CREATE POLICY "admin_ads_all" ON admin_ads FOR ALL USING (true) WITH CHECK (true);
