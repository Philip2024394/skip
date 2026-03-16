-- Ad & Commercial Generation System Database Schema
-- Tables for multi-platform ad generation with queue management and localization

-- Ad templates table
CREATE TABLE IF NOT EXISTS ad_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'linkedin', 'twitter', 'youtube')),
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  name TEXT NOT NULL,
  templates JSONB NOT NULL, -- Multilingual content
  image_prompts JSONB, -- AI generation prompts per language
  video_prompts JSONB, -- AI generation prompts per language
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated ads table
CREATE TABLE IF NOT EXISTS generated_ads (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'linkedin', 'twitter', 'youtube')),
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  call_to_action TEXT NOT NULL,
  link TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  language TEXT NOT NULL,
  country TEXT NOT NULL,
  template_id UUID REFERENCES ad_templates(id),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  is_used BOOLEAN DEFAULT false,
  admin_id UUID REFERENCES auth.users(id),
  security_filtered BOOLEAN DEFAULT false,
  security_violations JSONB DEFAULT '[]'
);

-- Ad queue management table
CREATE TABLE IF NOT EXISTS ad_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id TEXT REFERENCES generated_ads(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  language TEXT NOT NULL,
  type TEXT NOT NULL,
  position INTEGER NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad performance tracking table
CREATE TABLE IF NOT EXISTS ad_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id TEXT REFERENCES generated_ads(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  language TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0,
  engagement_rate DECIMAL(5,4) DEFAULT 0,
  tracking_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad media assets table
CREATE TABLE IF NOT EXISTS ad_media_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id TEXT REFERENCES generated_ads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_hash TEXT NOT NULL, -- SHA-256 hash
  mime_type TEXT NOT NULL,
  dimensions JSONB, -- {width, height} for images, {width, height, duration} for videos
  cdn_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad localization table
CREATE TABLE IF NOT EXISTS ad_localizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id TEXT REFERENCES generated_ads(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  country TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  call_to_action TEXT NOT NULL,
  cultural_notes JSONB, -- Cultural adaptation notes
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad generation settings table
CREATE TABLE IF NOT EXISTS ad_generation_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id),
  platform TEXT NOT NULL,
  language TEXT NOT NULL,
  type TEXT NOT NULL,
  queue_size INTEGER DEFAULT 50,
  auto_regenerate BOOLEAN DEFAULT false,
  regeneration_interval INTEGER DEFAULT 3600, -- seconds
  security_filtering BOOLEAN DEFAULT true,
  brand_consistency BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}', -- Additional platform-specific settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad analytics summary table
CREATE TABLE IF NOT EXISTS ad_analytics_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  platform TEXT NOT NULL,
  language TEXT NOT NULL,
  total_ads INTEGER DEFAULT 0,
  active_ads INTEGER DEFAULT 0,
  used_ads INTEGER DEFAULT 0,
  generated_ads INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  avg_engagement_rate DECIMAL(5,4) DEFAULT 0,
  avg_conversion_rate DECIMAL(5,4) DEFAULT 0,
  top_performing_ad TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_templates_platform ON ad_templates(platform);
CREATE INDEX IF NOT EXISTS idx_ad_templates_type ON ad_templates(type);
CREATE INDEX IF NOT EXISTS idx_ad_templates_active ON ad_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_generated_ads_platform ON generated_ads(platform);
CREATE INDEX IF NOT EXISTS idx_generated_ads_language ON generated_ads(language);
CREATE INDEX IF NOT EXISTS idx_generated_ads_used ON generated_ads(is_used);
CREATE INDEX IF NOT EXISTS idx_generated_ads_generated_at ON generated_ads(generated_at);
CREATE INDEX IF NOT EXISTS idx_generated_ads_template_id ON generated_ads(template_id);

CREATE INDEX IF NOT EXISTS idx_ad_queue_platform ON ad_queue(platform);
CREATE INDEX IF NOT EXISTS idx_ad_queue_language ON ad_queue(language);
CREATE INDEX IF NOT EXISTS idx_ad_queue_position ON ad_queue(position);
CREATE INDEX IF NOT EXISTS idx_ad_queue_available ON ad_queue(is_available);

CREATE INDEX IF NOT EXISTS idx_ad_performance_ad_id ON ad_performance(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_performance_platform ON ad_performance(platform);
CREATE INDEX IF NOT EXISTS idx_ad_performance_date ON ad_performance(tracking_date);
CREATE INDEX IF NOT EXISTS idx_ad_performance_language ON ad_performance(language);

CREATE INDEX IF NOT EXISTS idx_ad_media_assets_ad_id ON ad_media_assets(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_media_assets_type ON ad_media_assets(type);
CREATE INDEX IF NOT EXISTS idx_ad_media_assets_hash ON ad_media_assets(file_hash);
CREATE INDEX IF NOT EXISTS idx_ad_media_assets_active ON ad_media_assets(is_active);

CREATE INDEX IF NOT EXISTS idx_ad_localizations_ad_id ON ad_localizations(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_localizations_language ON ad_localizations(language);
CREATE INDEX IF NOT EXISTS idx_ad_localizations_country ON ad_localizations(country);
CREATE INDEX IF NOT EXISTS idx_ad_localizations_active ON ad_localizations(is_active);

CREATE INDEX IF NOT EXISTS idx_ad_generation_settings_admin ON ad_generation_settings(admin_id);
CREATE INDEX IF NOT EXISTS idx_ad_generation_settings_platform ON ad_generation_settings(platform);
CREATE INDEX IF NOT EXISTS idx_ad_generation_settings_language ON ad_generation_settings(language);

CREATE INDEX IF NOT EXISTS idx_ad_analytics_summary_date ON ad_analytics_summary(date);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_summary_platform ON ad_analytics_summary(platform);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_summary_language ON ad_analytics_summary(language);

-- Enable Row Level Security
ALTER TABLE ad_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_localizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_generation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_analytics_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage ad templates" ON ad_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage generated ads" ON generated_ads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage ad queue" ON ad_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can view ad performance" ON ad_performance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin', 'moderator')
    )
  );

CREATE POLICY "Admins can manage media assets" ON ad_media_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage localizations" ON ad_localizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage settings" ON ad_generation_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can view analytics" ON ad_analytics_summary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin', 'moderator')
    )
  );

-- Functions for automated queue management
CREATE OR REPLACE FUNCTION maintain_ad_queue_size()
RETURNS void AS $$
DECLARE
    target_size INTEGER := 50;
    platform_count INTEGER;
    lang_count INTEGER;
    type_count INTEGER;
BEGIN
    -- Get current queue status
    SELECT COUNT(DISTINCT platform), COUNT(DISTINCT language), COUNT(DISTINCT type)
    INTO platform_count, lang_count, type_count
    FROM ad_queue WHERE is_available = true;
    
    -- Generate new ads if queue is below target size
    IF (SELECT COUNT(*) FROM ad_queue WHERE is_available = true) < target_size THEN
        -- This would trigger ad generation in the application
        -- For now, just log the need for generation
        RAISE NOTICE 'Ad queue needs regeneration. Current size: %, Target: %', 
                    (SELECT COUNT(*) FROM ad_queue WHERE is_available = true), target_size;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update ad analytics
CREATE OR REPLACE FUNCTION update_ad_analytics()
RETURNS void AS $$
BEGIN
    -- Update daily analytics summary
    INSERT INTO ad_analytics_summary (
        date, platform, language, total_ads, active_ads, used_ads, 
        total_impressions, total_clicks, total_conversions,
        avg_engagement_rate, avg_conversion_rate
    )
    SELECT 
        CURRENT_DATE,
        platform,
        language,
        COUNT(*) as total_ads,
        COUNT(*) FILTER (WHERE is_used = false) as active_ads,
        COUNT(*) FILTER (WHERE is_used = true) as used_ads,
        COALESCE(SUM(impressions), 0) as total_impressions,
        COALESCE(SUM(clicks), 0) as total_clicks,
        COALESCE(SUM(clicks * conversion_rate), 0) as total_conversions,
        COALESCE(AVG(engagement_rate), 0) as avg_engagement_rate,
        COALESCE(AVG(conversion_rate), 0) as avg_conversion_rate
    FROM generated_ads ga
    LEFT JOIN ad_performance ap ON ga.id = ap.ad_id AND ap.tracking_date = CURRENT_DATE
    WHERE DATE(ga.generated_at) = CURRENT_DATE
    GROUP BY platform, language
    ON CONFLICT (date, platform, language) DO UPDATE SET
        total_ads = EXCLUDED.total_ads,
        active_ads = EXCLUDED.active_ads,
        used_ads = EXCLUDED.used_ads,
        total_impressions = EXCLUDED.total_impressions,
        total_clicks = EXCLUDED.total_clicks,
        total_conversions = EXCLUDED.total_conversions,
        avg_engagement_rate = EXCLUDED.avg_engagement_rate,
        avg_conversion_rate = EXCLUDED.avg_conversion_rate,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old ads
CREATE OR REPLACE FUNCTION cleanup_old_ads()
RETURNS void AS $$
BEGIN
    -- Delete ads older than 90 days
    DELETE FROM generated_ads 
    WHERE generated_at < NOW() - INTERVAL '90 days' 
    AND is_used = true;
    
    -- Delete performance data older than 1 year
    DELETE FROM ad_performance 
    WHERE tracking_date < CURRENT_DATE - INTERVAL '1 year';
    
    -- Delete old media assets for deleted ads
    DELETE FROM ad_media_assets 
    WHERE ad_id NOT IN (SELECT id FROM generated_ads);
END;
$$ LANGUAGE plpgsql;

-- Views for dashboard
CREATE OR REPLACE VIEW ad_queue_status AS
SELECT 
    COUNT(*) as total_ads,
    COUNT(*) FILTER (WHERE is_available = true) as available_ads,
    COUNT(*) FILTER (WHERE is_available = false) as used_ads,
    COUNT(DISTINCT platform) as platforms,
    COUNT(DISTINCT language) as languages,
    COUNT(DISTINCT type) as types,
    ROUND(
        (COUNT(*) FILTER (WHERE is_available = true)::float / NULLIF(COUNT(*), 0)) * 100, 2
    ) as availability_percentage
FROM ad_queue;

CREATE OR REPLACE VIEW ad_performance_summary AS
SELECT 
    platform,
    language,
    COUNT(*) as total_ads,
    SUM(impressions) as total_impressions,
    SUM(clicks) as total_clicks,
    SUM(shares) as total_shares,
    SUM(likes) as total_likes,
    SUM(comments) as total_comments,
    ROUND(AVG(engagement_rate) * 100, 2) as avg_engagement_rate,
    ROUND(AVG(conversion_rate) * 100, 2) as avg_conversion_rate,
    tracking_date
FROM ad_performance
WHERE tracking_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY platform, language, tracking_date
ORDER BY tracking_date DESC, total_clicks DESC;

CREATE OR REPLACE VIEW top_performing_ads AS
SELECT 
    ga.id,
    ga.platform,
    ga.language,
    ga.title,
    ap.impressions,
    ap.clicks,
    ap.shares,
    ap.likes,
    ap.comments,
    ap.engagement_rate,
    ap.conversion_rate,
    ap.tracking_date,
    -- Calculate performance score
    (ap.clicks::float / NULLIF(ap.impressions, 0) * 0.4 + 
     ap.engagement_rate * 0.3 + 
     ap.conversion_rate * 0.3) as performance_score
FROM generated_ads ga
JOIN ad_performance ap ON ga.id = ap.ad_id
WHERE ap.tracking_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY performance_score DESC
LIMIT 50;

-- Comments for documentation
COMMENT ON TABLE ad_templates IS 'Templates for multi-platform ad generation with multilingual support';
COMMENT ON TABLE generated_ads IS 'Generated ads with security filtering and metadata';
COMMENT ON TABLE ad_queue IS 'Queue management for ad generation and availability';
COMMENT ON TABLE ad_performance IS 'Performance tracking metrics for generated ads';
COMMENT ON TABLE ad_media_assets IS 'Media assets (images/videos) for ads with CDN integration';
COMMENT ON TABLE ad_localizations IS 'Localized versions of ads with cultural adaptations';
COMMENT ON TABLE ad_generation_settings IS 'Admin settings for ad generation preferences';
COMMENT ON TABLE ad_analytics_summary IS 'Daily analytics summary for dashboard reporting';

COMMENT ON VIEW ad_queue_status IS 'Real-time queue status for dashboard';
COMMENT ON VIEW ad_performance_summary IS 'Performance metrics by platform and language';
COMMENT ON VIEW top_performing_ads IS 'Top performing ads based on engagement and conversion';

-- Insert initial ad templates (sample data)
INSERT INTO ad_templates (platform, type, name, templates, is_active) VALUES
('instagram', 'image', 'Romantic Discovery', '{
    "title": {
        "en": "Ready to Find Your Perfect Match? 💕",
        "id": "Siap Temukan Jodohmu? 💕",
        "es": "¿Lista para Encontrar a tu Alma Gemela? 💕"
    },
    "description": {
        "en": "Tired of swiping endlessly? 2DateMe uses advanced AI to connect you with people who truly match your personality and values.",
        "id": "Bosan swipe tanpa henti? 2DateMe menggunakan AI canggih untuk menghubungkan Anda dengan orang yang benar-benar sesuai dengan kepribadian dan nilai-nilai Anda.",
        "es": "¿Cansada de deslizar sin fin? 2DateMe usa IA avanzada para conectarte con personas que realmente coinciden con tu personalidad y valores."
    },
    "hashtags": {
        "en": ["DatingApp", "Love", "Relationships", "OnlineDating", "FindLove", "2DateMe"],
        "id": ["AplikasiKencan", "Cinta", "Hubungan", "KencanOnline", "TemukanCinta", "2DateMe"],
        "es": ["AppDeCitas", "Amor", "Relaciones", "CitasOnline", "EncontrarAmor", "2DateMe"]
    },
    "callToAction": {
        "en": "Download 2DateMe now and find your perfect match! 💕",
        "id": "Unduh 2DateMe sekarang dan temukan jodohmu! 💕",
        "es": "¡Descarga 2DateMe ahora y encuentra a tu alma gemela! 💕"
    }
}', true),
('facebook', 'image', 'Professional Dating', '{
    "title": {
        "en": "Revolutionary Dating App with AI-Powered Matching",
        "id": "Aplikasi Kencan Revolusioner dengan Pencocokan Berbasis AI",
        "es": "App de Citas Revolucionaria con Matching Impulsado por IA"
    },
    "description": {
        "en": "Discover why thousands of singles are choosing 2DateMe for meaningful connections. Our advanced AI algorithm analyzes your personality, interests, and values to suggest compatible matches.",
        "id": "Temukan mengapa ribuan lajang memilih 2DateMe untuk koneksi yang bermakna. Algoritma AI canggih kami menganalisis kepribadian, minat, dan nilai-nilai Anda untuk menyarankan kecocokan yang kompatibel.",
        "es": "Descubre por qué miles de solteros están eligiendo 2DateMe para conexiones significativas. Nuestro avanzado algoritmo de IA analiza tu personalidad, intereses y valores para sugerir coincidencias compatibles."
    },
    "hashtags": {
        "en": ["OnlineDating", "DatingApp", "AI", "Love", "Relationships", "Technology", "MatchMaking"],
        "id": ["KencanOnline", "AplikasiKencan", "AI", "Cinta", "Hubungan", "Teknologi", "Pencocokan"],
        "es": ["CitasOnline", "AppDeCitas", "IA", "Amor", "Relaciones", "Tecnología", "MatchMaking"]
    },
    "callToAction": {
        "en": "Experience the future of online dating. Download 2DateMe today! 🚀",
        "id": "Rasakan masa depan kencan online. Unduh 2DateMe hari ini! 🚀",
        "es": "¡Experimenta el futuro de las citas online. ¡Descarga 2DateMe hoy! 🚀"
    }
}', true),
('tiktok', 'video', 'Trending Love', '{
    "title": {
        "en": "POV: You finally found your perfect match 💕",
        "id": "POV: Akhirnya kamu menemukan jodohmu 💕",
        "es": "POV: Finalmente encontraste a tu alma gemela 💕"
    },
    "description": {
        "en": "Stop swiping, start matching! 🎯 2DateMe AI finds your perfect match based on personality, not just looks. Download now!",
        "id": "Berhenti swipe, mulai pencocokan! 🎯 AI 2DateMe menemukan jodohmu berdasarkan kepribadian, bukan hanya penampilan. Unduh sekarang!",
        "es": "¡Deja de swipar, empieza a hacer match! 🎯 La IA de 2DateMe encuentra tu alma gemela basada en personalidad, no solo en apariencia. ¡Descarga ahora!"
    },
    "hashtags": {
        "en": ["dating", "love", "perfectmatch", "2DateMe", "AI", "relationships", "soulmate"],
        "id": ["kencan", "cinta", "jodoh", "2DateMe", "AI", "hubungan", "jodoh"],
        "es": ["citas", "amor", "almaGemela", "2DateMe", "IA", "relaciones", "pareja"]
    },
    "callToAction": {
        "en": "Download 2DateMe and find your soulmate! 💕",
        "id": "Unduh 2DateMe dan temukan jodohmu! 💕",
        "es": "¡Descarga 2DateMe y encuentra a tu alma gemela! 💕"
    }
}', true)
ON CONFLICT DO NOTHING;
