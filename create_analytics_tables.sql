-- Create analytics tables for production monitoring
-- These tables track gift interactions and live calls for edge case detection

-- Gift interaction logs table
CREATE TABLE IF NOT EXISTS gift_interaction_logs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('gift_sent', 'gift_received', 'gift_accepted', 'gift_refused', 'gift_purchase')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  gift_id UUID,
  gift_name TEXT,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token_amount INTEGER,
  is_free_gift BOOLEAN DEFAULT false,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  session_id TEXT,
  error TEXT
);

-- Call interaction logs table
CREATE TABLE IF NOT EXISTS call_interaction_logs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('call_started', 'call_ended', 'call_failed', 'call_extended')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  call_id TEXT NOT NULL,
  duration INTEGER, -- in seconds
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  session_id TEXT,
  error TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gift_logs_user_id ON gift_interaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_logs_timestamp ON gift_interaction_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_gift_logs_type ON gift_interaction_logs(type);
CREATE INDEX IF NOT EXISTS idx_gift_logs_session_id ON gift_interaction_logs(session_id);

CREATE INDEX IF NOT EXISTS idx_call_logs_user_id ON call_interaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_timestamp ON call_interaction_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_call_logs_type ON call_interaction_logs(type);
CREATE INDEX IF NOT EXISTS idx_call_logs_match_id ON call_interaction_logs(match_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_session_id ON call_interaction_logs(session_id);

-- Create views for analytics dashboard
CREATE OR REPLACE VIEW gift_analytics_summary AS
SELECT 
  type,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions,
  DATE(timestamp) as date
FROM gift_interaction_logs
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY type, DATE(timestamp)
ORDER BY date DESC, type;

CREATE OR REPLACE VIEW call_analytics_summary AS
SELECT 
  type,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions,
  AVG(duration) as avg_duration_seconds,
  DATE(timestamp) as date
FROM call_interaction_logs
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY type, DATE(timestamp)
ORDER BY date DESC, type;

-- Recent errors view for monitoring
CREATE OR REPLACE VIEW recent_errors AS
SELECT 
  'gift' as category,
  id,
  user_id,
  error,
  timestamp,
  session_id
FROM gift_interaction_logs
WHERE error IS NOT NULL
  AND timestamp >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'call' as category,
  id,
  user_id,
  error,
  timestamp,
  session_id
FROM call_interaction_logs
WHERE error IS NOT NULL
  AND timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Enable Row Level Security
ALTER TABLE gift_interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_interaction_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for gift logs
CREATE POLICY "Users can view their own gift logs" ON gift_interaction_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all gift logs" ON gift_interaction_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Service can insert gift logs" ON gift_interaction_logs
  FOR INSERT WITH CHECK (true);

-- RLS policies for call logs
CREATE POLICY "Users can view their own call logs" ON call_interaction_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all call logs" ON call_interaction_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Service can insert call logs" ON call_interaction_logs
  FOR INSERT WITH CHECK (true);

-- Function to clean up old logs (run via cron job)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  -- Delete logs older than 90 days
  DELETE FROM gift_interaction_logs WHERE timestamp < NOW() - INTERVAL '90 days';
  DELETE FROM call_interaction_logs WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE gift_interaction_logs IS 'Analytics logs for gift interactions - tracks sends, receives, accepts, refuses, and purchases';
COMMENT ON TABLE call_interaction_logs IS 'Analytics logs for video call interactions - tracks starts, ends, failures, and extensions';
COMMENT ON VIEW gift_analytics_summary IS 'Daily summary of gift interactions for the last 30 days';
COMMENT ON VIEW call_analytics_summary IS 'Daily summary of call interactions for the last 30 days';
COMMENT ON VIEW recent_errors IS 'Recent errors from gift and call interactions in the last 24 hours';
COMMENT ON FUNCTION cleanup_old_logs IS 'Cleans up analytics logs older than 90 days - should be run weekly';
