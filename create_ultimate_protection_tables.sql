-- Ultimate Protection Layers Database Schema
-- Tables for enhanced security, rate limiting, bot detection, and admin security

-- Enhanced admin users table with 2FA support
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator', 'support')),
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT, -- TOTP secret
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE
);

-- Admin sessions table with enhanced tracking
CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  two_factor_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin API keys table
CREATE TABLE IF NOT EXISTS admin_api_keys (
  id TEXT PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Enhanced admin audit logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id TEXT PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details JSONB,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN NOT NULL,
  session_id TEXT,
  api_key_id TEXT
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- user_id, IP address, or API key
  action TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bot detection table
CREATE TABLE IF NOT EXISTS bot_detections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  bot_score DECIMAL(5,2) NOT NULL,
  confidence DECIMAL(5,2) NOT NULL,
  reasons JSONB NOT NULL DEFAULT '[]',
  detection_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_blocked BOOLEAN DEFAULT false,
  block_until TIMESTAMP WITH TIME ZONE
);

-- Behavioral analysis table
CREATE TABLE IF NOT EXISTS behavioral_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  is_suspicious BOOLEAN DEFAULT false,
  suspicion_score DECIMAL(5,2) DEFAULT 0,
  analysis_data JSONB
);

-- File upload security table
CREATE TABLE IF NOT EXISTS file_security_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  file_hash TEXT NOT NULL, -- SHA-256 hash
  scan_result JSONB NOT NULL,
  threats JSONB NOT NULL DEFAULT '[]',
  is_clean BOOLEAN NOT NULL,
  confidence DECIMAL(5,2) NOT NULL,
  scan_duration INTEGER, -- milliseconds
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API request security table
CREATE TABLE IF NOT EXISTS api_security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  method TEXT NOT NULL,
  url TEXT NOT NULL,
  headers JSONB,
  body_hash TEXT, -- SHA-256 hash of request body
  validation_result JSONB NOT NULL,
  threats JSONB NOT NULL DEFAULT '[]',
  is_allowed BOOLEAN NOT NULL,
  response_status INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration INTEGER -- milliseconds
);

-- Security incidents table
CREATE TABLE IF NOT EXISTS security_incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  affected_users JSONB DEFAULT '[]',
  affected_systems JSONB DEFAULT '[]',
  detection_data JSONB,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  assigned_to UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Security metrics table
CREATE TABLE IF NOT EXISTS security_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_date DATE NOT NULL,
  total_requests INTEGER DEFAULT 0,
  blocked_requests INTEGER DEFAULT 0,
  bot_detections INTEGER DEFAULT 0,
  security_incidents INTEGER DEFAULT 0,
  file_scans INTEGER DEFAULT 0,
  malware_detections INTEGER DEFAULT 0,
  admin_logins INTEGER DEFAULT 0,
  failed_admin_logins INTEGER DEFAULT 0,
  security_score DECIMAL(5,2) DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_api_keys_admin_id ON admin_api_keys(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_api_keys_api_key ON admin_api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_timestamp ON admin_audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON rate_limits(identifier, action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end ON rate_limits(window_end);
CREATE INDEX IF NOT EXISTS idx_bot_detections_user_id ON bot_detections(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_detections_ip_address ON bot_detections(ip_address);
CREATE INDEX IF NOT EXISTS idx_bot_detections_timestamp ON bot_detections(timestamp);
CREATE INDEX IF NOT EXISTS idx_behavioral_analysis_user_id ON behavioral_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_analysis_timestamp ON behavioral_analysis(timestamp);
CREATE INDEX IF NOT EXISTS idx_file_security_scans_user_id ON file_security_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_file_security_scans_file_hash ON file_security_scans(file_hash);
CREATE INDEX IF NOT EXISTS idx_api_security_logs_user_id ON api_security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_security_logs_timestamp ON api_security_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_metrics_metric_date ON security_metrics(metric_date);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_security_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin tables
CREATE POLICY "Admins can view all admin users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() 
      AND au.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update admin users" ON admin_users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() 
      AND au.role = 'super_admin'
    )
  );

CREATE POLICY "Admins can view their own sessions" ON admin_sessions
  FOR SELECT USING (admin_id = auth.uid());

CREATE POLICY "Super admins can view all sessions" ON admin_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() 
      AND au.role = 'super_admin'
    )
  );

CREATE POLICY "Admins can view audit logs" ON admin_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() 
      AND au.role IN ('super_admin', 'admin', 'moderator')
    )
  );

-- RLS Policies for security tables
CREATE POLICY "System can insert rate limits" ON rate_limits
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view security logs" ON bot_detections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() 
      AND au.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "System can insert bot detections" ON bot_detections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert behavioral analysis" ON behavioral_analysis
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view behavioral analysis" ON behavioral_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() 
      AND au.role IN ('super_admin', 'admin')
    )
  );

-- Functions for automated cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE window_end < NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_security_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM api_security_logs WHERE timestamp < NOW() - INTERVAL '30 days';
  DELETE FROM bot_detections WHERE timestamp < NOW() - INTERVAL '30 days';
  DELETE FROM behavioral_analysis WHERE timestamp < NOW() - INTERVAL '30 days';
  DELETE FROM file_security_scans WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to update security metrics
CREATE OR REPLACE FUNCTION update_security_metrics()
RETURNS void AS $$
DECLARE
  today DATE := CURRENT_DATE;
  request_count INTEGER;
  blocked_count INTEGER;
  bot_count INTEGER;
  incident_count INTEGER;
  scan_count INTEGER;
  malware_count INTEGER;
  admin_login_count INTEGER;
  failed_login_count INTEGER;
BEGIN
  -- Get today's metrics
  SELECT COUNT(*) INTO request_count
  FROM api_security_logs
  WHERE DATE(timestamp) = today;
  
  SELECT COUNT(*) INTO blocked_count
  FROM api_security_logs
  WHERE DATE(timestamp) = today AND is_allowed = false;
  
  SELECT COUNT(*) INTO bot_count
  FROM bot_detections
  WHERE DATE(timestamp) = today;
  
  SELECT COUNT(*) INTO incident_count
  FROM security_incidents
  WHERE DATE(created_at) = today;
  
  SELECT COUNT(*) INTO scan_count
  FROM file_security_scans
  WHERE DATE(timestamp) = today;
  
  SELECT COUNT(*) INTO malware_count
  FROM file_security_scans
  WHERE DATE(timestamp) = today AND is_clean = false;
  
  SELECT COUNT(*) INTO admin_login_count
  FROM admin_audit_logs
  WHERE DATE(timestamp) = today AND action = 'admin_login_success';
  
  SELECT COUNT(*) INTO failed_login_count
  FROM admin_audit_logs
  WHERE DATE(timestamp) = today AND action = 'admin_login_failed';
  
  -- Insert or update metrics
  INSERT INTO security_metrics (
    metric_date,
    total_requests,
    blocked_requests,
    bot_detections,
    security_incidents,
    file_scans,
    malware_detections,
    admin_logins,
    failed_admin_logins,
    security_score
  ) VALUES (
    today,
    request_count,
    blocked_count,
    bot_count,
    incident_count,
    scan_count,
    malware_count,
    admin_login_count,
    failed_login_count,
    GREATEST(0, 100 - (blocked_count::float / NULLIF(request_count, 0) * 100) - (failed_login_count::float / NULLIF(admin_login_count + failed_login_count, 0) * 50))
  )
  ON CONFLICT (metric_date)
  DO UPDATE SET
    total_requests = EXCLUDED.total_requests,
    blocked_requests = EXCLUDED.blocked_requests,
    bot_detections = EXCLUDED.bot_detections,
    security_incidents = EXCLUDED.security_incidents,
    file_scans = EXCLUDED.file_scans,
    malware_detections = EXCLUDED.malware_detections,
    admin_logins = EXCLUDED.admin_logins,
    failed_admin_logins = EXCLUDED.failed_admin_logins,
    security_score = EXCLUDED.security_score,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Views for admin dashboard
CREATE OR REPLACE VIEW security_dashboard AS
SELECT 
  (SELECT COUNT(*) FROM admin_users WHERE is_active = true) as active_admins,
  (SELECT COUNT(*) FROM admin_sessions WHERE expires_at > NOW()) as active_sessions,
  (SELECT COUNT(*) FROM api_security_logs WHERE DATE(timestamp) = CURRENT_DATE) as today_requests,
  (SELECT COUNT(*) FROM api_security_logs WHERE DATE(timestamp) = CURRENT_DATE AND is_allowed = false) as today_blocked,
  (SELECT COUNT(*) FROM bot_detections WHERE DATE(timestamp) = CURRENT_DATE) as today_bots,
  (SELECT COUNT(*) FROM security_incidents WHERE status = 'open') as open_incidents,
  (SELECT security_score FROM security_metrics WHERE metric_date = CURRENT_DATE) as current_score;

CREATE OR REPLACE VIEW recent_security_incidents AS
SELECT 
  id,
  incident_type,
  severity,
  title,
  description,
  status,
  created_at
FROM security_incidents
ORDER BY created_at DESC
LIMIT 50;

-- Comments for documentation
COMMENT ON TABLE admin_users IS 'Enhanced admin users with 2FA support and role-based access';
COMMENT ON TABLE admin_sessions IS 'Admin session tracking with enhanced security features';
COMMENT ON TABLE admin_api_keys IS 'API key management for admin access';
COMMENT ON TABLE admin_audit_logs IS 'Comprehensive audit logging for admin actions';
COMMENT ON TABLE rate_limits IS 'Rate limiting for API endpoints and user actions';
COMMENT ON TABLE bot_detections IS 'Bot detection and behavioral analysis';
COMMENT ON TABLE behavioral_analysis IS 'User behavior tracking for security monitoring';
COMMENT ON TABLE file_security_scans IS 'File upload security scanning and malware detection';
COMMENT ON TABLE api_security_logs IS 'API request security validation and logging';
COMMENT ON TABLE security_incidents IS 'Security incident tracking and management';
COMMENT ON TABLE security_metrics IS 'Daily security metrics and KPIs';
COMMENT ON VIEW security_dashboard IS 'Real-time security dashboard metrics';
COMMENT ON VIEW recent_security_incidents IS 'Recent security incidents for admin review';

-- Initial admin user (for demo - change password in production)
INSERT INTO admin_users (id, email, password_hash, role, two_factor_enabled)
VALUES (
  gen_random_uuid(),
  'admin@2dateme.com',
  '12345', -- Change this in production!
  'super_admin',
  false
) ON CONFLICT (email) DO NOTHING;
