-- Security violations table for admin monitoring
-- Tracks all blocked content attempts across the app

CREATE TABLE IF NOT EXISTS security_violations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  violations JSONB NOT NULL, -- Array of violation objects
  context TEXT NOT NULL, -- Where the violation occurred (gift_message, bio, chat, etc.)
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  session_id TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_violations_user_id ON security_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_security_violations_timestamp ON security_violations(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_violations_context ON security_violations(context);
CREATE INDEX IF NOT EXISTS idx_security_violations_session_id ON security_violations(session_id);

-- Create GIN index for JSONB violations array
CREATE INDEX IF NOT EXISTS idx_security_violations_violations ON security_violations USING GIN(violations);

-- Views for admin dashboard
CREATE OR REPLACE VIEW security_violations_summary AS
SELECT 
  COUNT(*) as total_violations,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT context) as contexts_affected,
  DATE(timestamp) as violation_date
FROM security_violations
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY violation_date DESC;

CREATE OR REPLACE VIEW security_violations_by_type AS
SELECT 
  (jsonb_array_elements(violations)->>'type') as violation_type,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(jsonb_array_elements(violations)->>'severity') as avg_severity,
  DATE(timestamp) as violation_date
FROM security_violations
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY 
  (jsonb_array_elements(violations)->>'type'),
  DATE(timestamp)
ORDER BY violation_date DESC, count DESC;

CREATE OR REPLACE VIEW security_violations_by_context AS
SELECT 
  context,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users,
  DATE(timestamp) as violation_date
FROM security_violations
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY context, DATE(timestamp)
ORDER BY violation_date DESC, count DESC;

CREATE OR REPLACE VIEW top_violating_users AS
SELECT 
  user_id,
  COUNT(*) as violation_count,
  COUNT(DISTINCT context) as contexts_affected,
  MIN(timestamp) as first_violation,
  MAX(timestamp) as last_violation,
  DATE(timestamp) as violation_date
FROM security_violations
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY user_id, DATE(timestamp)
HAVING COUNT(*) >= 3 -- Users with 3+ violations
ORDER BY violation_count DESC, violation_date DESC;

-- Recent violations view for real-time monitoring
CREATE OR REPLACE VIEW recent_security_violations AS
SELECT 
  id,
  user_id,
  original_text,
  violations,
  context,
  timestamp,
  user_agent,
  session_id
FROM security_violations
WHERE timestamp >= NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;

-- Enable Row Level Security
ALTER TABLE security_violations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can view all security violations" ON security_violations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Service can insert security violations" ON security_violations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update security violations" ON security_violations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can delete security violations" ON security_violations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Function to clean up old violations (run via cron job)
CREATE OR REPLACE FUNCTION cleanup_old_security_violations()
RETURNS void AS $$
BEGIN
  -- Delete violations older than 90 days
  DELETE FROM security_violations WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function to get security analytics for admin dashboard
CREATE OR REPLACE FUNCTION get_security_analytics(
  timeframe TEXT DEFAULT '24h'
) RETURNS JSONB AS $$
DECLARE
  time_filter TIMESTAMP;
  result JSONB;
BEGIN
  -- Set time filter based on timeframe
  IF timeframe = '24h' THEN
    time_filter := NOW() - INTERVAL '24 hours';
  ELSIF timeframe = '7d' THEN
    time_filter := NOW() - INTERVAL '7 days';
  ELSIF timeframe = '30d' THEN
    time_filter := NOW() - INTERVAL '30 days';
  ELSE
    time_filter := NOW() - INTERVAL '24 hours';
  END IF;

  -- Build analytics result
  SELECT jsonb_build_object(
    'total_violations', COUNT(*),
    'unique_users', COUNT(DISTINCT user_id),
    'contexts_affected', COUNT(DISTINCT context),
    'by_type', (
      SELECT jsonb_object_agg(
        violation_type, 
        violation_count
      ) FROM (
        SELECT 
          jsonb_array_elements(violations)->>'type' as violation_type,
          COUNT(*) as violation_count
        FROM security_violations
        WHERE timestamp >= time_filter
        GROUP BY jsonb_array_elements(violations)->>'type'
      ) type_stats
    ),
    'by_context', (
      SELECT jsonb_object_agg(
        context, 
        context_count
      ) FROM (
        SELECT 
          context,
          COUNT(*) as context_count
        FROM security_violations
        WHERE timestamp >= time_filter
        GROUP BY context
      ) context_stats
    ),
    'top_users', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'user_id', user_id,
          'violation_count', violation_count
        )
      ) FROM (
        SELECT 
          user_id,
          COUNT(*) as violation_count
        FROM security_violations
        WHERE timestamp >= time_filter
        GROUP BY user_id
        ORDER BY violation_count DESC
        LIMIT 10
      ) user_stats
    )
  ) INTO result
  FROM security_violations
  WHERE timestamp >= time_filter;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE security_violations IS 'Security violations tracking for content filtering - logs all blocked attempts';
COMMENT ON VIEW security_violations_summary IS 'Daily summary of security violations for the last 30 days';
COMMENT ON VIEW security_violations_by_type IS 'Violations grouped by type for the last 7 days';
COMMENT ON VIEW security_violations_by_context IS 'Violations grouped by context for the last 7 days';
COMMENT ON VIEW top_violating_users IS 'Users with 3+ violations in the last 24 hours';
COMMENT ON VIEW recent_security_violations IS 'Real-time security violations from the last hour';
COMMENT ON FUNCTION get_security_analytics IS 'Returns comprehensive security analytics for admin dashboard';
COMMENT ON FUNCTION cleanup_old_security_violations IS 'Cleans up security violations older than 90 days - should be run weekly';
