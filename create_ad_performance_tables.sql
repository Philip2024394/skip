-- Ad Performance Tracking System Database Schema
-- Tables for comprehensive metrics capture, analytics integration, and reporting

-- Ad click events table
CREATE TABLE IF NOT EXISTS ad_click_events (
  id TEXT PRIMARY KEY,
  ad_id TEXT NOT NULL,
  tracking_id TEXT NOT NULL,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('image', 'video')),
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'linkedin', 'twitter', 'youtube')),
  country TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  conversion BOOLEAN DEFAULT false,
  conversion_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracking links table
CREATE TABLE IF NOT EXISTS ad_tracking_links (
  id TEXT PRIMARY KEY,
  ad_id TEXT NOT NULL,
  tracking_id TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('image', 'video')),
  platform TEXT NOT NULL,
  country TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  admin_id UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance reports table
CREATE TABLE IF NOT EXISTS performance_reports (
  id TEXT PRIMARY KEY,
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  metrics JSONB NOT NULL,
  filters JSONB DEFAULT '{}',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_id UUID REFERENCES auth.users(id),
  file_path TEXT, -- Path to exported file
  file_format TEXT CHECK (file_format IN ('csv', 'excel')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Country performance metrics
CREATE TABLE IF NOT EXISTS country_performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country TEXT NOT NULL,
  date DATE NOT NULL,
  total_clicks INTEGER DEFAULT 0,
  image_clicks INTEGER DEFAULT 0,
  video_clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  top_platform TEXT,
  avg_session_duration INTEGER, -- in seconds
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform performance metrics
CREATE TABLE IF NOT EXISTS platform_performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  date DATE NOT NULL,
  total_clicks INTEGER DEFAULT 0,
  image_clicks INTEGER DEFAULT 0,
  video_clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  top_country TEXT,
  avg_session_duration INTEGER,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad type performance comparison
CREATE TABLE IF NOT EXISTS ad_type_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('image', 'video')),
  date DATE NOT NULL,
  total_clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  avg_clicks_per_ad DECIMAL(5,2) DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0, -- Click-through rate
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  cost_per_click DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session tracking for better analytics
CREATE TABLE IF NOT EXISTS ad_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  tracking_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  country TEXT NOT NULL,
  platform TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in seconds
  page_views INTEGER DEFAULT 1,
  conversions BOOLEAN DEFAULT false,
  conversion_type TEXT, -- 'signup', 'purchase', 'engagement'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversion tracking
CREATE TABLE IF NOT EXISTS ad_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_id TEXT NOT NULL,
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  conversion_type TEXT NOT NULL CHECK (conversion_type IN ('signup', 'purchase', 'engagement')),
  conversion_value DECIMAL(10,2) DEFAULT 0,
  conversion_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ad_type TEXT NOT NULL CHECK (ad_type IN ('image', 'video')),
  platform TEXT NOT NULL,
  country TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance alerts and notifications
CREATE TABLE IF NOT EXISTS performance_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_ctr', 'high_bounce', 'conversion_drop', 'traffic_spike')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  metrics JSONB NOT NULL,
  threshold_value DECIMAL(10,2),
  actual_value DECIMAL(10,2),
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_click_events_tracking_id ON ad_click_events(tracking_id);
CREATE INDEX IF NOT EXISTS idx_ad_click_events_ad_id ON ad_click_events(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_click_events_platform ON ad_click_events(platform);
CREATE INDEX IF NOT EXISTS idx_ad_click_events_country ON ad_click_events(country);
CREATE INDEX IF NOT EXISTS idx_ad_click_events_timestamp ON ad_click_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_ad_click_events_conversion ON ad_click_events(conversion);
CREATE INDEX IF NOT EXISTS idx_ad_click_events_session_id ON ad_click_events(session_id);
CREATE INDEX IF NOT EXISTS idx_ad_click_events_user_id ON ad_click_events(user_id);

CREATE INDEX IF NOT EXISTS idx_ad_tracking_links_tracking_id ON ad_tracking_links(tracking_id);
CREATE INDEX IF NOT EXISTS idx_ad_tracking_links_ad_id ON ad_tracking_links(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_tracking_links_platform ON ad_tracking_links(platform);
CREATE INDEX IF NOT EXISTS idx_ad_tracking_links_country ON ad_tracking_links(country);
CREATE INDEX IF NOT EXISTS idx_ad_tracking_links_active ON ad_tracking_links(is_active);
CREATE INDEX IF NOT EXISTS idx_ad_tracking_links_expires_at ON ad_tracking_links(expires_at);

CREATE INDEX IF NOT EXISTS idx_performance_reports_type ON performance_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_performance_reports_date_range ON performance_reports(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_performance_reports_generated_at ON performance_reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_performance_reports_admin_id ON performance_reports(admin_id);

CREATE INDEX IF NOT EXISTS idx_country_performance_metrics_country ON country_performance_metrics(country);
CREATE INDEX IF NOT EXISTS idx_country_performance_metrics_date ON country_performance_metrics(date);
CREATE INDEX IF NOT EXISTS idx_country_performance_metrics_clicks ON country_performance_metrics(total_clicks);

CREATE INDEX IF NOT EXISTS idx_platform_performance_metrics_platform ON platform_performance_metrics(platform);
CREATE INDEX IF NOT EXISTS idx_platform_performance_metrics_date ON platform_performance_metrics(date);
CREATE INDEX IF NOT EXISTS idx_platform_performance_metrics_clicks ON platform_performance_metrics(total_clicks);

CREATE INDEX IF NOT EXISTS idx_ad_type_performance_type ON ad_type_performance(ad_type);
CREATE INDEX IF NOT EXISTS idx_ad_type_performance_date ON ad_type_performance(date);
CREATE INDEX IF NOT EXISTS idx_ad_type_performance_clicks ON ad_type_performance(total_clicks);

CREATE INDEX IF NOT EXISTS idx_ad_sessions_session_id ON ad_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_ad_sessions_tracking_id ON ad_sessions(tracking_id);
CREATE INDEX IF NOT EXISTS idx_ad_sessions_user_id ON ad_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_sessions_started_at ON ad_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_ad_sessions_conversions ON ad_sessions(conversions);

CREATE INDEX IF NOT EXISTS idx_ad_conversions_tracking_id ON ad_conversions(tracking_id);
CREATE INDEX IF NOT EXISTS idx_ad_conversions_session_id ON ad_conversions(session_id);
CREATE INDEX IF NOT EXISTS idx_ad_conversions_user_id ON ad_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_conversions_type ON ad_conversions(conversion_type);
CREATE INDEX IF NOT EXISTS idx_ad_conversions_time ON ad_conversions(conversion_time);

CREATE INDEX IF NOT EXISTS idx_performance_alerts_type ON performance_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_severity ON performance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_resolved ON performance_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_created_at ON performance_alerts(created_at);

-- Enable Row Level Security
ALTER TABLE ad_click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_tracking_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_type_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage click events" ON ad_click_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin', 'moderator')
    )
  );

CREATE POLICY "Admins can manage tracking links" ON ad_tracking_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage reports" ON performance_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can view metrics" ON country_performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin', 'moderator')
    )
  );

CREATE POLICY "Admins can view metrics" ON platform_performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin', 'moderator')
    )
  );

CREATE POLICY "Admins can view metrics" ON ad_type_performance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin', 'moderator')
    )
  );

CREATE POLICY "Admins can manage sessions" ON ad_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage conversions" ON ad_conversions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage alerts" ON performance_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Functions for automated metrics calculation
CREATE OR REPLACE FUNCTION update_country_performance_metrics()
RETURNS void AS $$
BEGIN
  INSERT INTO country_performance_metrics (
    country, date, total_clicks, image_clicks, video_clicks, conversions, conversion_rate, top_platform
  )
  SELECT 
    country,
    DATE(timestamp) as date,
    COUNT(*) as total_clicks,
    COUNT(*) FILTER (WHERE ad_type = 'image') as image_clicks,
    COUNT(*) FILTER (WHERE ad_type = 'video') as video_clicks,
    COUNT(*) FILTER (WHERE conversion = true) as conversions,
    ROUND(
      (COUNT(*) FILTER (WHERE conversion = true)::float / NULLIF(COUNT(*), 0)) * 100, 2
    ) as conversion_rate,
    platform as top_platform
  FROM ad_click_events
  WHERE DATE(timestamp) = CURRENT_DATE
  GROUP BY country, platform
  ORDER BY COUNT(*) DESC
  ON CONFLICT (country, date) DO UPDATE SET
    total_clicks = EXCLUDED.total_clicks,
    image_clicks = EXCLUDED.image_clicks,
    video_clicks = EXCLUDED.video_clicks,
    conversions = EXCLUDED.conversions,
    conversion_rate = EXCLUDED.conversion_rate,
    top_platform = EXCLUDED.top_platform,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_platform_performance_metrics()
RETURNS void AS $$
BEGIN
  INSERT INTO platform_performance_metrics (
    platform, date, total_clicks, image_clicks, video_clicks, conversions, conversion_rate, top_country
  )
  SELECT 
    platform,
    DATE(timestamp) as date,
    COUNT(*) as total_clicks,
    COUNT(*) FILTER (WHERE ad_type = 'image') as image_clicks,
    COUNT(*) FILTER (WHERE ad_type = 'video') as video_clicks,
    COUNT(*) FILTER (WHERE conversion = true) as conversions,
    ROUND(
      (COUNT(*) FILTER (WHERE conversion = true)::float / NULLIF(COUNT(*), 0)) * 100, 2
    ) as conversion_rate,
    country as top_country
  FROM ad_click_events
  WHERE DATE(timestamp) = CURRENT_DATE
  GROUP BY platform, country
  ORDER BY COUNT(*) DESC
  ON CONFLICT (platform, date) DO UPDATE SET
    total_clicks = EXCLUDED.total_clicks,
    image_clicks = EXCLUDED.image_clicks,
    video_clicks = EXCLUDED.video_clicks,
    conversions = EXCLUDED.conversions,
    conversion_rate = EXCLUDED.conversion_rate,
    top_country = EXCLUDED.top_country,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_ad_type_performance()
RETURNS void AS $$
BEGIN
  INSERT INTO ad_type_performance (
    ad_type, date, total_clicks, unique_clicks, conversions, conversion_rate, avg_clicks_per_ad
  )
  SELECT 
    ad_type,
    DATE(timestamp) as date,
    COUNT(*) as total_clicks,
    COUNT(DISTINCT tracking_id) as unique_clicks,
    COUNT(*) FILTER (WHERE conversion = true) as conversions,
    ROUND(
      (COUNT(*) FILTER (WHERE conversion = true)::float / NULLIF(COUNT(*), 0)) * 100, 2
    ) as conversion_rate,
    ROUND(
      COUNT(*)::float / NULLIF(COUNT(DISTINCT tracking_id), 0), 2
    ) as avg_clicks_per_ad
  FROM ad_click_events
  WHERE DATE(timestamp) = CURRENT_DATE
  GROUP BY ad_type
  ON CONFLICT (ad_type, date) DO UPDATE SET
    total_clicks = EXCLUDED.total_clicks,
    unique_clicks = EXCLUDED.unique_clicks,
    conversions = EXCLUDED.conversions,
    conversion_rate = EXCLUDED.conversion_rate,
    avg_clicks_per_ad = EXCLUDED.avg_clicks_per_ad,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_expired_tracking_links()
RETURNS void AS $$
BEGIN
  -- Deactivate expired links
  UPDATE ad_tracking_links 
  SET is_active = false, updated_at = NOW()
  WHERE expires_at < NOW() AND is_active = true;
  
  -- Delete links older than 90 days
  DELETE FROM ad_tracking_links 
  WHERE expires_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_performance_alerts()
RETURNS void AS $$
DECLARE
    low_ctr_threshold DECIMAL := 1.0; -- 1% CTR threshold
    high_bounce_threshold DECIMAL := 70.0; -- 70% bounce rate threshold
BEGIN
  -- Check for low CTR alerts
  INSERT INTO performance_alerts (alert_type, severity, title, description, metrics, threshold_value, actual_value)
  SELECT 
    'low_ctr',
    CASE WHEN avg_ctr < 0.5 THEN 'critical' WHEN avg_ctr < 1.0 THEN 'high' ELSE 'medium' END,
    'Low Click-Through Rate Detected',
    'CTR below acceptable threshold',
    jsonb_build_object('platform', platform, 'ctr', avg_ctr),
    low_ctr_threshold,
    avg_ctr
  FROM (
    SELECT 
      platform,
      ROUND(
        (COUNT(*)::float / NULLIF((SELECT COUNT(*) FROM ad_tracking_links WHERE platform = atl.platform AND is_active = true), 0)) * 100, 2
      ) as avg_ctr
    FROM ad_click_events ace
    JOIN ad_tracking_links atl ON ace.tracking_id = atl.tracking_id
    WHERE DATE(ace.timestamp) = CURRENT_DATE
    GROUP BY platform
  ) low_ctr_data
  WHERE avg_ctr < low_ctr_threshold
  ON CONFLICT DO NOTHING;
  
  -- Check for high bounce rate alerts
  INSERT INTO performance_alerts (alert_type, severity, title, description, metrics, threshold_value, actual_value)
  SELECT 
    'high_bounce',
    CASE WHEN avg_bounce_rate > 85 THEN 'critical' WHEN avg_bounce_rate > 70 THEN 'high' ELSE 'medium' END,
    'High Bounce Rate Detected',
    'Bounce rate above acceptable threshold',
    jsonb_build_object('platform', platform, 'bounce_rate', avg_bounce_rate),
    high_bounce_threshold,
    avg_bounce_rate
  FROM (
    SELECT 
      platform,
      ROUND(
        (COUNT(*) FILTER (WHERE duration < 30)::float / NULLIF(COUNT(*), 0)) * 100, 2
      ) as avg_bounce_rate
    FROM ad_sessions
    WHERE DATE(started_at) = CURRENT_DATE
    GROUP BY platform
  ) high_bounce_data
  WHERE avg_bounce_rate > high_bounce_threshold
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Views for dashboard
CREATE OR REPLACE VIEW performance_summary AS
SELECT 
  (SELECT COUNT(*) FROM ad_click_events WHERE DATE(timestamp) = CURRENT_DATE) as today_clicks,
  (SELECT COUNT(*) FILTER (WHERE ad_type = 'image') FROM ad_click_events WHERE DATE(timestamp) = CURRENT_DATE) as today_image_clicks,
  (SELECT COUNT(*) FILTER (WHERE ad_type = 'video') FROM ad_click_events WHERE DATE(timestamp) = CURRENT_DATE) as today_video_clicks,
  (SELECT COUNT(*) FILTER (WHERE conversion = true) FROM ad_click_events WHERE DATE(timestamp) = CURRENT_DATE) as today_conversions,
  (SELECT COUNT(*) FROM ad_tracking_links WHERE is_active = true) as active_tracking_links,
  (SELECT COUNT(DISTINCT country) FROM ad_click_events WHERE DATE(timestamp) = CURRENT_DATE) as active_countries,
  (SELECT COUNT(DISTINCT platform) FROM ad_click_events WHERE DATE(timestamp) = CURRENT_DATE) as active_platforms,
  (SELECT ROUND(AVG(duration) FROM ad_sessions WHERE DATE(started_at) = CURRENT_DATE AND duration IS NOT NULL) as avg_session_duration;

CREATE OR REPLACE VIEW top_performing_countries AS
SELECT 
  country,
  COUNT(*) as total_clicks,
  COUNT(*) FILTER (WHERE ad_type = 'image') as image_clicks,
  COUNT(*) FILTER (WHERE ad_type = 'video') as video_clicks,
  COUNT(*) FILTER (WHERE conversion = true) as conversions,
  ROUND(
    (COUNT(*) FILTER (WHERE conversion = true)::float / NULLIF(COUNT(*), 0)) * 100, 2
  ) as conversion_rate,
  DATE(timestamp) as date
FROM ad_click_events
WHERE DATE(timestamp) >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY country, DATE(timestamp)
ORDER BY total_clicks DESC, DATE(timestamp) DESC;

CREATE OR REPLACE VIEW top_performing_platforms AS
SELECT 
  platform,
  COUNT(*) as total_clicks,
  COUNT(*) FILTER (WHERE ad_type = 'image') as image_clicks,
  COUNT(*) FILTER (WHERE ad_type = 'video') as video_clicks,
  COUNT(*) FILTER (WHERE conversion = true) as conversions,
  ROUND(
    (COUNT(*) FILTER (WHERE conversion = true)::float / NULLIF(COUNT(*), 0)) * 100, 2
  ) as conversion_rate,
  DATE(timestamp) as date
FROM ad_click_events
WHERE DATE(timestamp) >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY platform, DATE(timestamp)
ORDER BY total_clicks DESC, DATE(timestamp) DESC;

CREATE OR REPLACE VIEW ad_type_comparison AS
SELECT 
  ad_type,
  COUNT(*) as total_clicks,
  COUNT(DISTINCT tracking_id) as unique_clicks,
  COUNT(*) FILTER (WHERE conversion = true) as conversions,
  ROUND(
    (COUNT(*) FILTER (WHERE conversion = true)::float / NULLIF(COUNT(*), 0)) * 100, 2
  ) as conversion_rate,
  ROUND(
    COUNT(*)::float / NULLIF(COUNT(DISTINCT tracking_id), 0), 2
  ) as avg_clicks_per_ad,
  DATE(timestamp) as date
FROM ad_click_events
WHERE DATE(timestamp) >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ad_type, DATE(timestamp)
ORDER BY DATE(timestamp) DESC;

-- Comments for documentation
COMMENT ON TABLE ad_click_events IS 'Individual ad click events with tracking and conversion data';
COMMENT ON TABLE ad_tracking_links IS 'Generated tracking links for ad performance measurement';
COMMENT ON TABLE performance_reports IS 'Generated performance reports with filters and metrics';
COMMENT ON TABLE country_performance_metrics IS 'Country-specific performance metrics aggregated daily';
COMMENT ON TABLE platform_performance_metrics IS 'Platform-specific performance metrics aggregated daily';
COMMENT ON TABLE ad_type_performance IS 'Ad type performance comparison metrics';
COMMENT ON TABLE ad_sessions IS 'Session tracking for better user behavior analytics';
COMMENT ON TABLE ad_conversions IS 'Conversion tracking with value and type classification';
COMMENT ON TABLE performance_alerts IS 'Automated performance alerts and notifications';

COMMENT ON VIEW performance_summary IS 'Real-time performance summary for dashboard';
COMMENT ON VIEW top_performing_countries IS 'Top performing countries by clicks and conversions';
COMMENT ON VIEW top_performing_platforms IS 'Top performing platforms by clicks and conversions';
COMMENT ON VIEW ad_type_comparison IS 'Comparison between image and video ad performance';

-- Create scheduled jobs (in production, use pg_cron or external scheduler)
-- These would be run daily/weekly/monthly
-- SELECT cron.schedule('update-metrics', '0 2 * * *', 'SELECT update_country_performance_metrics();');
-- SELECT cron.schedule('update-metrics', '0 2 * * *', 'SELECT update_platform_performance_metrics();');
-- SELECT cron.schedule('update-metrics', '0 2 * * *', 'SELECT update_ad_type_performance();');
-- SELECT cron.schedule('cleanup-links', '0 3 * * *', 'SELECT cleanup_expired_tracking_links();');
-- SELECT cron.schedule('generate-alerts', '0 * * * *', 'SELECT generate_performance_alerts();');
