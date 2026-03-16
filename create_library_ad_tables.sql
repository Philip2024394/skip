-- Library Ad Generation System Database Schema
-- Tables for country-specific banner libraries with CDN storage and priority rules

-- Country library banners table
CREATE TABLE IF NOT EXISTS country_library_banners (
  id TEXT PRIMARY KEY,
  country TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  file_name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  cdn_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE,
  admin_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Country library configurations
CREATE TABLE IF NOT EXISTS country_libraries (
  country TEXT PRIMARY KEY,
  total_banners INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  auto_generate_enabled BOOLEAN DEFAULT true,
  priority_rule TEXT NOT NULL DEFAULT 'library_first' CHECK (priority_rule IN ('library_first', 'mixed', 'auto_only')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated ads with library priority
CREATE TABLE IF NOT EXISTS library_generated_ads (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'linkedin', 'twitter', 'youtube')),
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  country TEXT NOT NULL,
  banner_id TEXT REFERENCES country_library_banners(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  seo_keywords TEXT[] DEFAULT '{}',
  call_to_action TEXT NOT NULL,
  app_link TEXT NOT NULL,
  branding_slogan TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_used BOOLEAN DEFAULT false,
  seo_score DECIMAL(5,2) DEFAULT 0,
  trending_score DECIMAL(5,2) DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'auto_generated' CHECK (source IN ('library', 'auto_generated')),
  admin_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Library queue management
CREATE TABLE IF NOT EXISTS library_ad_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id TEXT REFERENCES library_generated_ads(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  country TEXT NOT NULL,
  type TEXT NOT NULL,
  position INTEGER NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Banner usage tracking
CREATE TABLE IF NOT EXISTS banner_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  banner_id TEXT REFERENCES country_library_banners(id) ON DELETE CASCADE,
  ad_id TEXT REFERENCES library_generated_ads(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  country TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  admin_id UUID REFERENCES auth.users(id)
);

-- Google Images search cache
CREATE TABLE IF NOT EXISTS google_images_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country TEXT NOT NULL,
  type TEXT NOT NULL,
  search_query TEXT NOT NULL,
  image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  size TEXT NOT NULL,
  relevance_score DECIMAL(5,2) NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Library performance metrics
CREATE TABLE IF NOT EXISTS library_performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country TEXT NOT NULL,
  platform TEXT NOT NULL,
  date DATE NOT NULL,
  total_ads_generated INTEGER DEFAULT 0,
  library_ads_used INTEGER DEFAULT 0,
  auto_generated_ads_used INTEGER DEFAULT 0,
  avg_seo_score DECIMAL(5,2) DEFAULT 0,
  avg_trending_score DECIMAL(5,2) DEFAULT 0,
  total_banner_usage INTEGER DEFAULT 0,
  unique_banners_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CDN storage metadata
CREATE TABLE IF NOT EXISTS cdn_storage_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  cdn_url TEXT NOT NULL,
  storage_bucket TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_country_library_banners_country ON country_library_banners(country);
CREATE INDEX IF NOT EXISTS idx_country_library_banners_type ON country_library_banners(type);
CREATE INDEX IF NOT EXISTS idx_country_library_banners_active ON country_library_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_country_library_banners_priority ON country_library_banners(priority);
CREATE INDEX IF NOT EXISTS idx_country_library_banners_usage_count ON country_library_banners(usage_count);
CREATE INDEX IF NOT EXISTS idx_country_library_banners_last_used ON country_library_banners(last_used);
CREATE INDEX IF NOT EXISTS idx_country_library_banners_storage_path ON country_library_banners(storage_path);

CREATE INDEX IF NOT EXISTS idx_library_generated_ads_platform ON library_generated_ads(platform);
CREATE INDEX IF NOT EXISTS idx_library_generated_ads_country ON library_generated_ads(country);
CREATE INDEX IF NOT EXISTS idx_library_generated_ads_type ON library_generated_ads(type);
CREATE INDEX IF NOT EXISTS idx_library_generated_ads_used ON library_generated_ads(is_used);
CREATE INDEX IF NOT EXISTS idx_library_generated_ads_source ON library_generated_ads(source);
CREATE INDEX IF NOT EXISTS idx_library_generated_ads_banner_id ON library_generated_ads(banner_id);
CREATE INDEX IF NOT EXISTS idx_library_generated_ads_seo_score ON library_generated_ads(seo_score);
CREATE INDEX IF NOT EXISTS idx_library_generated_ads_trending_score ON library_generated_ads(trending_score);

CREATE INDEX IF NOT EXISTS idx_library_ad_queue_platform ON library_ad_queue(platform);
CREATE INDEX IF NOT EXISTS idx_library_ad_queue_country ON library_ad_queue(country);
CREATE INDEX IF NOT EXISTS idx_library_ad_queue_position ON library_ad_queue(position);
CREATE INDEX IF NOT EXISTS idx_library_ad_queue_available ON library_ad_queue(is_available);

CREATE INDEX IF NOT EXISTS idx_banner_usage_logs_banner_id ON banner_usage_logs(banner_id);
CREATE INDEX IF NOT EXISTS idx_banner_usage_logs_platform ON banner_usage_logs(platform);
CREATE INDEX IF NOT EXISTS idx_banner_usage_logs_country ON banner_usage_logs(country);
CREATE INDEX IF NOT EXISTS idx_banner_usage_logs_used_at ON banner_usage_logs(used_at);

CREATE INDEX IF NOT EXISTS idx_google_images_cache_country ON google_images_cache(country);
CREATE INDEX IF NOT EXISTS idx_google_images_cache_type ON google_images_cache(type);
CREATE INDEX IF NOT EXISTS idx_google_images_cache_query ON google_images_cache(search_query);
CREATE INDEX IF NOT EXISTS idx_google_images_cache_expires_at ON google_images_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_google_images_cache_relevance_score ON google_images_cache(relevance_score);

CREATE INDEX IF NOT EXISTS idx_library_performance_metrics_country ON library_performance_metrics(country);
CREATE INDEX IF NOT EXISTS idx_library_performance_metrics_platform ON library_performance_metrics(platform);
CREATE INDEX IF NOT EXISTS idx_library_performance_metrics_date ON library_performance_metrics(date);

CREATE INDEX IF NOT EXISTS idx_cdn_storage_metadata_file_path ON cdn_storage_metadata(file_path);
CREATE INDEX IF NOT EXISTS idx_cdn_storage_metadata_file_hash ON cdn_storage_metadata(file_hash);
CREATE INDEX IF NOT EXISTS idx_cdn_storage_metadata_bucket ON cdn_storage_metadata(storage_bucket);
CREATE INDEX IF NOT EXISTS idx_cdn_storage_metadata_last_accessed ON cdn_storage_metadata(last_accessed);

-- Enable Row Level Security
ALTER TABLE country_library_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_libraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_generated_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_ad_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_images_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cdn_storage_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage library banners" ON country_library_banners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage country libraries" ON country_libraries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage generated ads" ON library_generated_ads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage queue" ON library_ad_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can view usage logs" ON banner_usage_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin', 'moderator')
    )
  );

CREATE POLICY "System can manage cache" ON google_images_cache
  FOR ALL WITH CHECK (true);

CREATE POLICY "Admins can view performance metrics" ON library_performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin', 'moderator')
    )
  );

CREATE POLICY "Admins can manage CDN metadata" ON cdn_storage_metadata
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Functions for library management
CREATE OR REPLACE FUNCTION maintain_library_queue_size()
RETURNS void AS $$
DECLARE
    target_size INTEGER := 50;
    country_count INTEGER;
BEGIN
    -- Get current queue status
    SELECT COUNT(DISTINCT country)
    INTO country_count
    FROM library_ad_queue WHERE is_available = true;
    
    -- Generate new ads if queue is below target size
    IF (SELECT COUNT(*) FROM library_ad_queue WHERE is_available = true) < target_size THEN
        -- This would trigger ad generation in the application
        RAISE NOTICE 'Library queue needs regeneration. Current size: %, Target: %', 
                    (SELECT COUNT(*) FROM library_ad_queue WHERE is_available = true), target_size;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update library statistics
CREATE OR REPLACE FUNCTION update_library_stats()
RETURNS void AS $$
BEGIN
    -- Update country library statistics
    INSERT INTO country_libraries (country, total_banners, last_updated)
    SELECT 
        country,
        COUNT(*) as total_banners,
        NOW() as last_updated
    FROM country_library_banners
    WHERE is_active = true
    GROUP BY country
    ON CONFLICT (country) DO UPDATE SET
        total_banners = EXCLUDED.total_banners,
        last_updated = EXCLUDED.last_updated,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update banner usage statistics
CREATE OR REPLACE FUNCTION update_banner_usage_stats()
RETURNS void AS $$
BEGIN
    -- Update banner usage counts
    UPDATE country_library_banners clb
    SET 
        usage_count = COALESCE((
            SELECT COUNT(*) 
            FROM banner_usage_logs bul 
            WHERE bul.banner_id = clb.id
        ), 0),
        last_used = (
            SELECT MAX(used_at) 
            FROM banner_usage_logs bul 
            WHERE bul.banner_id = clb.id
        ),
        updated_at = NOW()
    WHERE clb.id IN (
        SELECT DISTINCT banner_id 
        FROM banner_usage_logs 
        WHERE used_at >= CURRENT_DATE - INTERVAL '7 days'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired cache
CREATE OR REPLACE FUNCTION cleanup_google_images_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM google_images_cache 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update library performance metrics
CREATE OR REPLACE FUNCTION update_library_performance_metrics()
RETURNS void AS $$
BEGIN
    INSERT INTO library_performance_metrics (
        country, platform, date, total_ads_generated, library_ads_used, 
    auto_generated_ads_used, avg_seo_score, avg_trending_score, total_banner_usage, unique_banners_used
    )
    SELECT 
        country,
        platform,
        CURRENT_DATE as date,
        COUNT(*) as total_ads_generated,
        COUNT(*) FILTER (WHERE source = 'library') as library_ads_used,
        COUNT(*) FILTER (WHERE source = 'auto_generated') as auto_generated_ads_used,
        ROUND(AVG(seo_score), 2) as avg_seo_score,
        ROUND(AVG(trending_score), 2) as avg_trending_score,
        COALESCE(SUM(b.usage_count), 0) as total_banner_usage,
        COUNT(DISTINCT banner_id) as unique_banners_used
    FROM library_generated_ads lga
    LEFT JOIN country_library_banners clb ON lga.banner_id = clb.id
    WHERE DATE(lga.generated_at) = CURRENT_DATE
    GROUP BY country, platform
    ON CONFLICT (country, platform, date) DO UPDATE SET
        total_ads_generated = EXCLUDED.total_ads_generated,
        library_ads_used = EXCLUDED.library_ads_used,
        auto_generated_ads_used = EXCLUDED.auto_generated_ads_used,
        avg_seo_score = EXCLUDED.avg_seo_score,
        avg_trending_score = EXCLUDED.avg_trending_score,
        total_banner_usage = EXCLUDED.total_banner_usage,
        unique_banners_used = EXCLUDED.unique_banners_used,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Views for dashboard
CREATE OR REPLACE VIEW library_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM country_libraries) as total_countries,
    (SELECT COUNT(*) FROM country_library_banners WHERE is_active = true) as total_banners,
    (SELECT COUNT(*) FILTER (WHERE type = 'image') FROM country_library_banners WHERE is_active = true) as image_banners,
    (SELECT COUNT(*) FILTER (WHERE type = 'video') FROM country_library_banners WHERE is_active = true) as video_banners,
    (SELECT AVG(usage_count) FROM country_library_banners WHERE is_active = true) as avg_usage_count,
    (SELECT COUNT(*) FROM library_generated_ads WHERE is_used = false) as available_ads,
    (SELECT COUNT(*) FROM library_generated_ads WHERE source = 'library') as library_ads,
    (SELECT COUNT(*) FROM library_generated_ads WHERE source = 'auto_generated') as auto_generated_ads;

CREATE OR REPLACE VIEW library_country_stats AS
SELECT 
    cl.country,
    cl.total_banners,
    COUNT(*) FILTER (WHERE clb.type = 'image') as image_count,
    COUNT(*) FILTER (WHERE clb.type = 'video') as video_count,
    COALESCE(SUM(clb.usage_count), 0) as total_usage,
    COALESCE(AVG(clb.usage_count), 0) as avg_usage,
    cl.last_updated,
    cl.auto_generate_enabled,
    cl.priority_rule
FROM country_libraries cl
LEFT JOIN country_library_banners clb ON cl.country = clb.country AND clb.is_active = true
GROUP BY cl.country, cl.total_banners, cl.last_updated, cl.auto_generate_enabled, cl.priority_rule
ORDER BY cl.total_banners DESC;

CREATE OR REPLACE VIEW library_performance_summary AS
SELECT 
    country,
    platform,
    date,
    total_ads_generated,
    library_ads_used,
    auto_generated_ads_used,
    ROUND((library_ads_used::float / NULLIF(total_ads_generated, 0)) * 100, 2) as library_usage_percentage,
    avg_seo_score,
    avg_trending_score,
    total_banner_usage,
    unique_banners_used
FROM library_performance_metrics
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC, total_ads_generated DESC;

CREATE OR REPLACE VIEW top_performing_banners AS
SELECT 
    clb.id,
    clb.country,
    clb.type,
    clb.file_name,
    clb.usage_count,
    clb.last_used,
    clb.uploaded_at,
    clb.priority,
    clb.tags,
    COUNT(*) as ad_generations,
    AVG(lga.seo_score) as avg_seo_score,
    AVG(lga.trending_score) as avg_trending_score,
    -- Calculate performance score
    (clb.usage_count::float * 0.4 + 
     AVG(lga.seo_score) * 0.3 + 
     AVG(lga.trending_score) * 0.3) as performance_score
FROM country_library_banners clb
LEFT JOIN library_generated_ads lga ON clb.id = lga.banner_id
WHERE clb.is_active = true
GROUP BY clb.id, clb.country, clb.type, clb.file_name, clb.usage_count, clb.last_used, clb.uploaded_at, clb.priority, clb.tags
ORDER BY performance_score DESC
LIMIT 50;

-- Comments for documentation
COMMENT ON TABLE country_library_banners IS 'Country-specific banner library with CDN storage and priority rules';
COMMENT ON TABLE country_libraries IS 'Country library configurations and settings';
COMMENT ON TABLE library_generated_ads IS 'Generated ads with library priority and source tracking';
COMMENT ON TABLE library_ad_queue IS 'Queue management for library-generated ads';
COMMENT ON TABLE banner_usage_logs IS 'Banner usage tracking and analytics';
COMMENT ON TABLE google_images_cache IS 'Cache for Google Images search results';
COMMENT ON TABLE library_performance_metrics IS 'Performance metrics for library system';
COMMENT ON TABLE cdn_storage_metadata IS 'CDN storage metadata and access tracking';

COMMENT ON VIEW library_dashboard_stats IS 'Overall library statistics for dashboard';
COMMENT ON VIEW library_country_stats IS 'Country-specific library statistics';
COMMENT ON VIEW library_performance_summary IS 'Performance metrics summary';
COMMENT ON VIEW top_performing_banners IS 'Top performing banners based on usage and ad performance';

-- Initialize country libraries
INSERT INTO country_libraries (country, total_banners, auto_generate_enabled, priority_rule)
VALUES 
('ID', 0, true, 'library_first'),
('US', 0, true, 'library_first'),
('IN', 0, true, 'library_first'),
('BR', 0, true, 'library_first'),
('JP', 0, true, 'library_first'),
('KR', 0, true, 'library_first'),
('GB', 0, true, 'library_first'),
('DE', 0, true, 'library_first'),
('FR', 0, true, 'library_first'),
('MX', 0, true, 'library_first'),
('TH', 0, true, 'library_first'),
('VN', 0, true, 'library_first')
ON CONFLICT (country) DO NOTHING;
