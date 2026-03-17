// Enhanced Ad Generation System with Country-Based Localization
// Features: trending hashtags, SEO optimization, preview panels, and advanced queue management

interface CountryConfig {
  code: string;
  name: string;
  language: string;
  dialingPrefix: string;
  trendingHashtags: string[];
  seoKeywords: string[];
  culturalNotes: string;
  market: 'developing' | 'developed';
  primaryPlatform: string;
  timezone: string;
}

interface EnhancedAdContent {
  id: string;
  platform: string;
  type: 'image' | 'video';
  country: CountryConfig;
  title: string;
  description: string;
  hashtags: string[];
  seoKeywords: string[];
  callToAction: string;
  appLink: string;
  brandingSlogan: string;
  imageUrl?: string;
  videoUrl?: string;
  generatedAt: Date;
  isUsed: boolean;
  seoScore: number;
  trendingScore: number;
}

interface PlatformPreview {
  platform: string;
  displayName: string;
  icon: string;
  characterLimits: {
    title: number;
    description: number;
    hashtags: number;
  };
  dimensions: {
    image: { width: number; height: number };
    video: { width: number; height: number; duration: { min: number; max: number } };
  };
  formatting: {
    hashtagStyle: 'camelCase' | 'snake_case' | 'spaces';
    linkPlacement: 'top' | 'bottom' | 'inline';
    ctaStyle: 'formal' | 'casual' | 'urgent';
  };
}

class EnhancedAdGenerator {
  private static instance: EnhancedAdGenerator;
  private queue: EnhancedAdContent[] = [];
  private readonly queueSize = 50;
  private readonly appUrl = 'https://2DateMe.com';
  private readonly brandSlogan = 'Find Your Perfect Match';
  
  // Enhanced country configurations with market insights
  private static readonly COUNTRY_CONFIGS: Record<string, CountryConfig> = {
    'ID': {
      code: 'ID',
      name: 'Indonesia',
      language: 'id',
      dialingPrefix: '+62',
      trendingHashtags: ['kencanonline', 'cintasejati', 'jodoh', 'caripacar', 'relationshipgoals', 'datingindonesia', 'asmara', 'pacaran', 'cinta', 'relationship'],
      seoKeywords: ['aplikasi kencan', 'temukan jodoh', 'kencan online', 'cari pacar', 'dating app indonesia', 'hubungan serius', 'jodoh islam', 'kencan gratis'],
      culturalNotes: 'Family-oriented, religious considerations important, group dating common',
      market: 'developing',
      primaryPlatform: 'Instagram',
      timezone: 'Asia/Jakarta'
    },
    'US': {
      code: 'US',
      name: 'United States',
      language: 'en',
      dialingPrefix: '+1',
      trendingHashtags: ['dating', 'love', 'relationships', 'onlinedating', 'datingapp', 'findlove', 'relationshipgoals', 'datingadvice', 'soulmate', 'datinglife'],
      seoKeywords: ['dating app', 'online dating', 'find love', 'relationship', 'dating site', 'matchmaking', 'soulmate', 'dating advice', 'love connection'],
      culturalNotes: 'Individualistic, diverse dating preferences, tech-savvy',
      market: 'developed',
      primaryPlatform: 'TikTok',
      timezone: 'America/New_York'
    },
    'IN': {
      code: 'IN',
      name: 'India',
      language: 'hi',
      dialingPrefix: '+91',
      trendingHashtags: ['डेटिंग', 'प्यार', 'रिलेशनशिप', 'ऑनलाइनडेटिंग', 'जोड़ी', 'मैचमेकिंग', 'लव', 'शादी', 'रिश्ता', 'दिल'],
      seoKeywords: ['डेटिंग ऐप', 'ऑनलाइन डेटिंग', 'प्यार', 'रिश्ता', 'जोड़ी बनाना', 'शादी', 'मैचमेकिंग', 'लव कनेक्शन'],
      culturalNotes: 'Family involvement important, arranged marriage culture, regional diversity',
      market: 'developing',
      primaryPlatform: 'Instagram',
      timezone: 'Asia/Kolkata'
    },
    'BR': {
      code: 'BR',
      name: 'Brazil',
      language: 'pt',
      dialingPrefix: '+55',
      trendingHashtags: ['namoro', 'amor', 'relacionamento', 'encontros', 'dating', 'paixao', 'casamento', 'romance', 'flerte', 'conhecer'],
      seoKeywords: ['app de namoro', 'encontros online', 'encontrar amor', 'relacionamento sério', 'casar', 'namoro gratis', 'paixao', 'romance'],
      culturalNotes: 'Passionate, social, family-oriented, diverse cultural backgrounds',
      market: 'developing',
      primaryPlatform: 'Instagram',
      timezone: 'America/Sao_Paulo'
    },
    'JP': {
      code: 'JP',
      name: 'Japan',
      language: 'ja',
      dialingPrefix: '+81',
      trendingHashtags: ['恋愛', '出会い', 'マッチング', '結婚', 'デート', '恋人', '関係', '片思い', '告白', '恋愛相談'],
      seoKeywords: ['恋愛アプリ', 'マッチングアプリ', '出会い系', '結婚相談', 'デート', '恋人探し', '関係構築', '恋愛相談'],
      culturalNotes: 'Conservative, group dating common, marriage-focused, indirect communication',
      market: 'developed',
      primaryPlatform: 'Twitter',
      timezone: 'Asia/Tokyo'
    },
    'KR': {
      code: 'KR',
      name: 'South Korea',
      language: 'ko',
      dialingPrefix: '+82',
      trendingHashtags: ['소개팅', '연애', '만남', '결혼', '데이팅앱', '연인', '관계', '짝사랑', '고백', '연애상담'],
      seoKeywords: ['소개팅 앱', '연애 앱', '만남', '결혼', '데이팅', '연인찾기', '관계', '연애'],
      culturalNotes: 'Technology-driven, appearance important, group dating, marriage pressure',
      market: 'developed',
      primaryPlatform: 'Instagram',
      timezone: 'Asia/Seoul'
    },
    'GB': {
      code: 'GB',
      name: 'United Kingdom',
      language: 'en',
      dialingPrefix: '+44',
      trendingHashtags: ['dating', 'love', 'relationships', 'onlinedating', 'datingapp', 'findlove', 'relationshipgoals', 'datingadvice', 'soulmate', 'ukdating'],
      seoKeywords: ['dating app uk', 'online dating', 'find love', 'relationship', 'dating site', 'matchmaking', 'soulmate', 'british dating'],
      culturalNotes: 'Traditional yet modern, pub culture, humor important, direct communication',
      market: 'developed',
      primaryPlatform: 'TikTok',
      timezone: 'Europe/London'
    },
    'DE': {
      code: 'DE',
      name: 'Germany',
      language: 'de',
      dialingPrefix: '+49',
      trendingHashtags: ['dating', 'liebe', 'beziehung', 'onlinedating', 'datingapp', 'findeliebe', 'partnersuche', 'romantik', 'single', 'verlieben'],
      seoKeywords: ['dating app', 'online dating', 'partnersuche', 'beziehung', 'liebe finden', 'single', 'romantik', 'verlieben'],
      culturalNotes: 'Direct, practical, quality-focused, long-term relationships preferred',
      market: 'developed',
      primaryPlatform: 'Instagram',
      timezone: 'Europe/Berlin'
    },
    'FR': {
      code: 'FR',
      name: 'France',
      language: 'fr',
      dialingPrefix: '+33',
      trendingHashtags: ['rencontre', 'amour', 'relation', 'dating', 'site', 'coeur', 'couple', 'romance', 'seduction', 'flirt'],
      seoKeywords: ['site de rencontre', 'amour', 'relation', 'dating', 'coeur', 'couple', 'romance', 'séduction', 'flirter'],
      culturalNotes: 'Romantic, sophisticated, cultural appreciation, direct flirting',
      market: 'developed',
      primaryPlatform: 'Instagram',
      timezone: 'Europe/Paris'
    },
    'MX': {
      code: 'MX',
      name: 'Mexico',
      language: 'es',
      dialingPrefix: '+52',
      trendingHashtags: ['citas', 'amor', 'relacion', 'enamorate', 'dating', 'corazon', 'pareja', 'novios', 'romance', 'conocer'],
      seoKeywords: ['app de citas', 'encontrar amor', 'relacion', 'pareja', 'novios', 'corazon', 'romance', 'conocer gente'],
      culturalNotes: 'Family-oriented, traditional values yet modern, passionate',
      market: 'developing',
      primaryPlatform: 'Instagram',
      timezone: 'America/Mexico_City'
    },
    'TH': {
      code: 'TH',
      name: 'Thailand',
      language: 'th',
      dialingPrefix: '+66',
      trendingHashtags: ['หาคู่', 'ความรัก', 'คบหา', 'เดท', 'dating', 'โสด', 'แฟน', 'คู่รัก', 'จีบ', 'สาวสวย'],
      seoKeywords: ['แอปหาคู่', 'ความรัก', 'คบหา', 'เดท', 'โสด', 'แฟน', 'คู่รัก', 'จีบ'],
      culturalNotes: 'Respectful, family approval important, indirect communication, beauty standards',
      market: 'developing',
      primaryPlatform: 'Instagram',
      timezone: 'Asia/Bangkok'
    },
    'VN': {
      code: 'VN',
      name: 'Vietnam',
      language: 'vi',
      dialingPrefix: '+84',
      trendingHashtags: ['hẹn hò', 'tình yêu', 'quan hệ', 'dating', 'tìm bạn', 'cặp đôi', 'yêu', 'crush', 'tình', 'tim ban bon'],
      seoKeywords: ['app hẹn hò', 'tình yêu', 'quan hệ', 'dating', 'tìm bạn', 'cặp đôi', 'yêu', 'crush'],
      culturalNotes: 'Conservative, family-oriented, marriage-focused, respectful communication',
      market: 'developing',
      primaryPlatform: 'Facebook',
      timezone: 'Asia/Ho_Chi_Minh'
    }
  };

  // Enhanced platform configurations with preview styling
  private static readonly PLATFORM_CONFIGS: Record<string, PlatformPreview> = {
    instagram: {
      platform: 'instagram',
      displayName: 'Instagram',
      icon: '📷',
      characterLimits: { title: 125, description: 2200, hashtags: 30 },
      dimensions: {
        image: { width: 1080, height: 1080 },
        video: { width: 1080, height: 1920, duration: { min: 15, max: 60 } }
      },
      formatting: {
        hashtagStyle: 'camelCase',
        linkPlacement: 'bottom',
        ctaStyle: 'casual'
      }
    },
    facebook: {
      platform: 'facebook',
      displayName: 'Facebook',
      icon: '📘',
      characterLimits: { title: 100, description: 5000, hashtags: 20 },
      dimensions: {
        image: { width: 1200, height: 630 },
        video: { width: 1280, height: 720, duration: { min: 15, max: 120 } }
      },
      formatting: {
        hashtagStyle: 'spaces',
        linkPlacement: 'bottom',
        ctaStyle: 'formal'
      }
    },
    tiktok: {
      platform: 'tiktok',
      displayName: 'TikTok',
      icon: '🎵',
      characterLimits: { title: 100, description: 150, hashtags: 5 },
      dimensions: {
        image: { width: 1080, height: 1920 },
        video: { width: 1080, height: 1920, duration: { min: 15, max: 60 } }
      },
      formatting: {
        hashtagStyle: 'camelCase',
        linkPlacement: 'bottom',
        ctaStyle: 'urgent'
      }
    },
    linkedin: {
      platform: 'linkedin',
      displayName: 'LinkedIn',
      icon: '💼',
      characterLimits: { title: 200, description: 3000, hashtags: 15 },
      dimensions: {
        image: { width: 1200, height: 627 },
        video: { width: 1280, height: 720, duration: { min: 30, max: 180 } }
      },
      formatting: {
        hashtagStyle: 'spaces',
        linkPlacement: 'inline',
        ctaStyle: 'formal'
      }
    },
    twitter: {
      platform: 'twitter',
      displayName: 'Twitter',
      icon: '🐦',
      characterLimits: { title: 100, description: 280, hashtags: 10 },
      dimensions: {
        image: { width: 1200, height: 675 },
        video: { width: 1280, height: 720, duration: { min: 15, max: 140 } }
      },
      formatting: {
        hashtagStyle: 'camelCase',
        linkPlacement: 'bottom',
        ctaStyle: 'urgent'
      }
    },
    youtube: {
      platform: 'youtube',
      displayName: 'YouTube',
      icon: '🎥',
      characterLimits: { title: 100, description: 5000, hashtags: 15 },
      dimensions: {
        image: { width: 1280, height: 720 },
        video: { width: 1920, height: 1080, duration: { min: 30, max: 180 } }
      },
      formatting: {
        hashtagStyle: 'spaces',
        linkPlacement: 'bottom',
        ctaStyle: 'casual'
      }
    }
  };

  public static getInstance(): EnhancedAdGenerator {
    if (!EnhancedAdGenerator.instance) {
      EnhancedAdGenerator.instance = new EnhancedAdGenerator();
    }
    return EnhancedAdGenerator.instance;
  }

  constructor() {
    this.initializeQueue();
  }

  // Get available countries
  public getCountries(): CountryConfig[] {
    return Object.values(EnhancedAdGenerator.COUNTRY_CONFIGS);
  }

  // Get country by code
  public getCountryByCode(code: string): CountryConfig | null {
    return EnhancedAdGenerator.COUNTRY_CONFIGS[code] || null;
  }

  // Fetch trending hashtags from Google Trends (simulated)
  public async fetchTrendingHashtags(country: CountryConfig): Promise<string[]> {
    // In production, this would call Google Trends API
    // For now, return predefined trending hashtags
    return country.trendingHashtags;
  }

  // Generate SEO keywords based on country and platform
  public generateSEOKeywords(country: CountryConfig, platform: string): string[] {
    const baseKeywords = country.seoKeywords;
    const platformKeywords = this.getPlatformSpecificKeywords(platform);
    const locationKeywords = this.getLocationKeywords(country);
    
    // Combine and deduplicate
    const allKeywords = [...baseKeywords, ...platformKeywords, ...locationKeywords];
    return [...new Set(allKeywords)].slice(0, 10);
  }

  // Generate enhanced ad with all features
  public async generateEnhancedAd(
    platform: string,
    type: 'image' | 'video',
    country: CountryConfig
  ): Promise<EnhancedAdContent | null> {
    const config = EnhancedAdGenerator.PLATFORM_CONFIGS[platform];
    if (!config) return null;

    // Fetch trending hashtags
    const trendingHashtags = await this.fetchTrendingHashtags(country);
    
    // Generate SEO keywords
    const seoKeywords = this.generateSEOKeywords(country, platform);
    
    // Generate content
    const title = this.generateTitle(country, platform, type);
    const description = this.generateDescription(country, platform, type, seoKeywords);
    const hashtags = this.generateHashtags(country, platform, trendingHashtags);
    const callToAction = this.generateCallToAction(country, platform);
    
    // Apply security filtering
    const content = `${title} ${description} ${callToAction} ${hashtags.join(' ')}`;
    if (!this.isContentSecure(content)) {
      console.warn('Ad content failed security filtering');
      return null;
    }

    // Calculate scores
    const seoScore = this.calculateSEOScore(content, seoKeywords);
    const trendingScore = this.calculateTrendingScore(hashtags, trendingHashtags);

    // Generate media URLs
    const imageUrl = type === 'image' ? this.generateImageUrl(platform, country) : undefined;
    const videoUrl = type === 'video' ? this.generateVideoUrl(platform, country) : undefined;

    return {
      id: this.generateAdId(),
      platform,
      type,
      country,
      title: title.substring(0, config.characterLimits.title),
      description: description.substring(0, config.characterLimits.description),
      hashtags: hashtags.slice(0, config.characterLimits.hashtags),
      seoKeywords,
      callToAction,
      appLink: this.appUrl,
      brandingSlogan: this.brandSlogan,
      imageUrl,
      videoUrl,
      generatedAt: new Date(),
      isUsed: false,
      seoScore,
      trendingScore
    };
  }

  // Get next ad from queue
  public getNextAd(platform?: string, country?: CountryConfig): EnhancedAdContent | null {
    let availableAds = this.queue.filter(ad => !ad.isUsed);
    
    if (platform) {
      availableAds = availableAds.filter(ad => ad.platform === platform);
    }
    
    if (country) {
      availableAds = availableAds.filter(ad => ad.country.code === country.code);
    }
    
    if (availableAds.length === 0) {
      // Generate new ad if none available
      const selectedPlatform = platform || 'instagram';
      const selectedCountry = country || this.getCountries()[0];
      const type = Math.random() > 0.5 ? 'image' : 'video';
      
      return this.generateEnhancedAd(selectedPlatform, type, selectedCountry);
    }
    
    // Mark as used and return
    const ad = availableAds[0];
    ad.isUsed = true;
    
    // Generate replacement ad
    this.maintainQueueSize();
    
    return ad;
  }

  // Get queue status
  public getQueueStatus(): {
    total: number;
    used: number;
    available: number;
    byPlatform: Record<string, number>;
    byCountry: Record<string, number>;
    avgSeoScore: number;
    avgTrendingScore: number;
  } {
    const total = this.queue.length;
    const used = this.queue.filter(ad => ad.isUsed).length;
    const available = total - used;
    
    const byPlatform: Record<string, number> = {};
    const byCountry: Record<string, number> = {};
    let totalSeoScore = 0;
    let totalTrendingScore = 0;
    
    this.queue.forEach(ad => {
      byPlatform[ad.platform] = (byPlatform[ad.platform] || 0) + 1;
      byCountry[ad.country.code] = (byCountry[ad.country.code] || 0) + 1;
      totalSeoScore += ad.seoScore;
      totalTrendingScore += ad.trendingScore;
    });
    
    return {
      total,
      used,
      available,
      byPlatform,
      byCountry,
      avgSeoScore: total > 0 ? totalSeoScore / total : 0,
      avgTrendingScore: total > 0 ? totalTrendingScore / total : 0
    };
  }

  // Maintain queue size
  private maintainQueueSize(): void {
    while (this.queue.filter(ad => !ad.isUsed).length < this.queueSize) {
      const countries = this.getCountries();
      const platforms = Object.keys(EnhancedAdGenerator.PLATFORM_CONFIGS);
      const types: ('image' | 'video')[] = ['image', 'video'];
      
      const country = countries[Math.floor(Math.random() * countries.length)];
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      
      this.generateEnhancedAd(platform, type, country).then(ad => {
        if (ad) this.queue.push(ad);
      });
    }
  }

  // Initialize queue
  private initializeQueue(): void {
    this.maintainQueueSize();
  }

  // Content generation methods
  private generateTitle(country: CountryConfig, platform: string, type: 'image' | 'video'): string {
    const templates = {
      'ID': {
        image: ['Temukan Jodohmu di 2DateMe 💕', 'Cinta Sejati Menanti Anda', ' aplikasi Kencan Terbaik'],
        video: ['POV: Akhirnya Temukan Jodoh 💕', 'Transformasi Cinta Dimulai Di Sini', 'Kisah Cinta Modern']
      },
      'US': {
        image: ['Find Your Perfect Match 💕', 'Revolutionary Dating App', 'Love Awaits You'],
        video: ['POV: You Finally Found Your Soulmate 💕', 'Love Stories Start Here', 'Modern Dating Revolution']
      },
      'IN': {
        image: ['अपना उत्तम मिलान खोजें 💕', 'प्यार की नई दुनिया', 'डेटिंग ऐप'],
        video: ['POV: आपने आखिरकार प्यार पाया 💕', 'प्यार की कहानी', 'आधुनिक डेटिंग']
      }
    };

    const countryTemplates = templates[country.code as keyof typeof templates] || templates['US'];
    const typeTemplates = countryTemplates[type];
    return typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
  }

  private generateDescription(country: CountryConfig, platform: string, type: 'image' | 'video', seoKeywords: string[]): string {
    const baseDescriptions = {
      'ID': `Tired of swiping endlessly? 2DateMe menggunakan AI canggih untuk menghubungkan Anda dengan orang yang benar-benar sesuai. ${seoKeywords.join(' ')}`,
      'US': `Discover why thousands are choosing 2DateMe for meaningful connections. Our AI analyzes personality for perfect matches. ${seoKeywords.join(' ')}`,
      'IN': `अपने उत्तम मिलान खोजने के लिए 2DateMe क्यों चुन रहे हैं। हमारा AI व्यक्तित्व का विश्लेषण करता है। ${seoKeywords.join(' ')}`
    };

    return baseDescriptions[country.code as keyof typeof baseDescriptions] || baseDescriptions['US'];
  }

  private generateHashtags(country: CountryConfig, platform: string, trendingHashtags: string[]): string[] {
    const config = EnhancedAdGenerator.PLATFORM_CONFIGS[platform];
    const maxHashtags = config.characterLimits.hashtags;
    
    // Mix trending hashtags with platform-specific ones
    const platformHashtags = this.getPlatformHashtags(platform);
    const allHashtags = [...trendingHashtags.slice(0, 5), ...platformHashtags];
    
    return allHashtags.slice(0, maxHashtags);
  }

  private generateCallToAction(country: CountryConfig, platform: string): string {
    const ctas = {
      'ID': 'Unduh 2DateMe sekarang dan temukan jodohmu! 💕',
      'US': 'Download 2DateMe now and find your perfect match! 💕',
      'IN': 'अभी 2DateMe डाउनलोड करें और अपना उत्तम मिलान खोजें! 💕'
    };

    return ctas[country.code as keyof typeof ctas] || ctas['US'];
  }

  // Helper methods
  private getPlatformSpecificKeywords(platform: string): string[] {
    const keywords = {
      instagram: ['instagram dating', 'visual dating', 'photo dating'],
      facebook: ['facebook dating', 'social dating', 'community dating'],
      tiktok: ['tiktok dating', 'video dating', 'trend dating'],
      linkedin: ['professional dating', 'career dating', 'elite dating'],
      twitter: ['twitter dating', 'micro dating', 'quick dating'],
      youtube: ['video dating', 'youtube dating', 'content dating']
    };
    return keywords[platform as keyof typeof keywords] || [];
  }

  private getLocationKeywords(country: CountryConfig): string[] {
    return [
      `dating in ${country.name}`,
      `${country.name} dating app`,
      `find love in ${country.name}`,
      `${country.name} singles`
    ];
  }

  private getPlatformHashtags(platform: string): string[] {
    const hashtags = {
      instagram: ['2DateMe', 'DatingApp', 'Love', 'Relationships'],
      facebook: ['2DateMe', 'OnlineDating', 'FindLove', 'MatchMaking'],
      tiktok: ['2DateMe', 'Dating', 'Love', 'PerfectMatch'],
      linkedin: ['2DateMe', 'ProfessionalDating', 'CareerLove', 'EliteSingles'],
      twitter: ['2DateMe', 'Dating', 'Love', 'Relationships'],
      youtube: ['2DateMe', 'DatingApp', 'LoveStories', 'RelationshipAdvice']
    };
    return hashtags[platform as keyof typeof hashtags] || [];
  }

  private calculateSEOScore(content: string, keywords: string[]): number {
    let score = 0;
    const contentLower = content.toLowerCase();
    
    keywords.forEach(keyword => {
      if (contentLower.includes(keyword.toLowerCase())) {
        score += 10;
      }
    });
    
    return Math.min(100, score);
  }

  private calculateTrendingScore(hashtags: string[], trendingHashtags: string[]): number {
    let score = 0;
    
    hashtags.forEach(hashtag => {
      if (trendingHashtags.includes(hashtag)) {
        score += 20;
      }
    });
    
    return Math.min(100, score);
  }

  private isContentSecure(content: string): boolean {
    // Apply same security filter as user content
    const violations = [
      /https?:\/\//,
      /\d{7,}/,
      /instagram|facebook|twitter|tiktok|linkedin|whatsapp|telegram/i
    ];
    
    return !violations.some(pattern => pattern.test(content));
  }

  private generateImageUrl(platform: string, country: CountryConfig): string {
    return `https://cdn.2dateme.com/ads/${platform}/${country.code}/${Date.now()}.jpg`;
  }

  private generateVideoUrl(platform: string, country: CountryConfig): string {
    return `https://cdn.2dateme.com/ads/${platform}/${country.code}/${Date.now()}.mp4`;
  }

  private generateAdId(): string {
    return `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get platform configuration for preview
  public getPlatformConfig(platform: string): PlatformPreview | null {
    return EnhancedAdGenerator.PLATFORM_CONFIGS[platform] || null;
  }

  // Format ad for specific platform
  public formatAdForPlatform(ad: EnhancedAdContent, platform: string): {
    title: string;
    description: string;
    hashtags: string;
    fullText: string;
    characterCount: { title: number; description: number; hashtags: number; total: number };
    withinLimits: boolean;
  } {
    const config = EnhancedAdGenerator.PLATFORM_CONFIGS[platform];
    if (!config) {
      throw new Error(`Platform ${platform} not supported`);
    }

    const hashtags = ad.hashtags.map(tag => {
      switch (config.formatting.hashtagStyle) {
        case 'camelCase': return `#${tag.replace(/\s+/g, '')}`;
        case 'snake_case': return `#${tag.replace(/\s+/g, '_')}`;
        case 'spaces': return `#${tag}`;
        default: return `#${tag}`;
      }
    }).join(' ');

    const appLink = config.formatting.linkPlacement === 'top' 
      ? `${ad.appLink}\n\n` 
      : '';
    
    const appLinkBottom = config.formatting.linkPlacement === 'bottom' 
      ? `\n\n${ad.appLink}` 
      : '';
    
    const appLinkInline = config.formatting.linkPlacement === 'inline' 
      ? ` ${ad.appLink} ` 
      : '';

    const title = ad.title;
    const description = `${appLink}${ad.description}${appLinkInline}${appLinkBottom}`;
    const fullText = `${title}\n\n${description}\n\n${hashtags}\n\n${ad.brandingSlogan}`;

    const characterCount = {
      title: title.length,
      description: description.length,
      hashtags: hashtags.length,
      total: fullText.length
    };

    const withinLimits = 
      title.length <= config.characterLimits.title &&
      description.length <= config.characterLimits.description &&
      ad.hashtags.length <= config.characterLimits.hashtags;

    return {
      title,
      description,
      hashtags,
      fullText,
      characterCount,
      withinLimits
    };
  }

  // Copy ad to clipboard
  public async copyAdToClipboard(ad: EnhancedAdContent, platform: string): Promise<boolean> {
    try {
      const formatted = this.formatAdForPlatform(ad, platform);
      await navigator.clipboard.writeText(formatted.fullText);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }
}

// Export singleton instance
export default EnhancedAdGenerator.getInstance();
