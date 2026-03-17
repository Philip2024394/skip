// Library Folder Priority Ad Generation System
// Country-specific banner libraries with CDN storage and priority rules

interface LibraryBanner {
  id: string;
  country: string;
  type: 'image' | 'video';
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  cdnUrl: string;
  storagePath: string;
  uploadedAt: Date;
  isActive: boolean;
  priority: number; // 1 = highest priority
  metadata: {
    dimensions?: { width: number; height: number };
    duration?: number; // for videos in seconds
    format: string;
    quality: 'high' | 'medium' | 'low';
  };
  tags: string[]; // for categorization
  usageCount: number;
  lastUsed?: Date;
}

interface CountryLibrary {
  country: string;
  banners: LibraryBanner[];
  totalBanners: number;
  lastUpdated: Date;
  autoGenerateEnabled: boolean;
  priorityRule: 'library_first' | 'mixed' | 'auto_only';
}

interface LibraryAdContent {
  id: string;
  platform: string;
  type: 'image' | 'video';
  country: string;
  banner: LibraryBanner;
  title: string;
  description: string;
  hashtags: string[];
  seoKeywords: string[];
  callToAction: string;
  appLink: string;
  brandingSlogan: string;
  generatedAt: Date;
  isUsed: boolean;
  seoScore: number;
  trendingScore: number;
  source: 'library' | 'auto_generated';
}

interface GoogleImageResult {
  url: string;
  title: string;
  thumbnail: string;
  size: string;
  type: string;
  relevanceScore: number;
}

class LibraryAdGenerator {
  private static instance: LibraryAdGenerator;
  private libraries: Map<string, CountryLibrary> = new Map();
  private queue: LibraryAdContent[] = [];
  private readonly queueSize = 50;
  private readonly appUrl = 'https://2DateMe.com';
  private readonly brandSlogan = 'Find Your Perfect Match';
  
  // Country configurations with library paths
  private static readonly COUNTRY_CONFIGS = {
    'ID': { name: 'Indonesia', language: 'id', prefix: '+62', libraryPath: 'banners/indonesia/' },
    'US': { name: 'United States', language: 'en', prefix: '+1', libraryPath: 'banners/usa/' },
    'IN': { name: 'India', language: 'hi', prefix: '+91', libraryPath: 'banners/india/' },
    'BR': { name: 'Brazil', language: 'pt', prefix: '+55', libraryPath: 'banners/brazil/' },
    'JP': { name: 'Japan', language: 'ja', prefix: '+81', libraryPath: 'banners/japan/' },
    'KR': { name: 'South Korea', language: 'ko', prefix: '+82', libraryPath: 'banners/korea/' },
    'GB': { name: 'United Kingdom', language: 'en', prefix: '+44', libraryPath: 'banners/uk/' },
    'DE': { name: 'Germany', language: 'de', prefix: '+49', libraryPath: 'banners/germany/' },
    'FR': { name: 'France', language: 'fr', prefix: '+33', libraryPath: 'banners/france/' },
    'MX': { name: 'Mexico', language: 'es', prefix: '+52', libraryPath: 'banners/mexico/' },
    'TH': { name: 'Thailand', language: 'th', prefix: '+66', libraryPath: 'banners/thailand/' },
    'VN': { name: 'Vietnam', language: 'vi', prefix: '+84', libraryPath: 'banners/vietnam/' }
  };

  public static getInstance(): LibraryAdGenerator {
    if (!LibraryAdGenerator.instance) {
      LibraryAdGenerator.instance = new LibraryAdGenerator();
    }
    return LibraryAdGenerator.instance;
  }

  constructor() {
    this.initializeLibraries();
  }

  // Initialize country libraries
  private initializeLibraries(): void {
    Object.keys(LibraryAdGenerator.COUNTRY_CONFIGS).forEach(country => {
      this.libraries.set(country, {
        country,
        banners: [],
        totalBanners: 0,
        lastUpdated: new Date(),
        autoGenerateEnabled: true,
        priorityRule: 'library_first'
      });
    });
  }

  // Upload banner to country library
  public async uploadBanner(
    country: string,
    file: File,
    metadata: Partial<LibraryBanner['metadata']> = {},
    tags: string[] = []
  ): Promise<LibraryBanner> {
    const library = this.libraries.get(country);
    if (!library) {
      throw new Error(`Library for country ${country} not found`);
    }

    // Validate file
    this.validateBannerFile(file);

    // Upload to CDN/Supabase storage
    const storagePath = `${LibraryAdGenerator.COUNTRY_CONFIGS[country as keyof typeof LibraryAdGenerator.COUNTRY_CONFIGS].libraryPath}${Date.now()}_${file.name}`;
    const cdnUrl = await this.uploadToStorage(file, storagePath);

    // Create banner object
    const banner: LibraryBanner = {
      id: this.generateBannerId(),
      country,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      fileName: file.name,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      cdnUrl,
      storagePath,
      uploadedAt: new Date(),
      isActive: true,
      priority: library.banners.length + 1, // New banners get higher priority
      metadata: {
        format: file.type.split('/')[1] || 'unknown',
        quality: 'high',
        ...metadata
      },
      tags,
      usageCount: 0
    };

    // Add to library
    library.banners.push(banner);
    library.totalBanners = library.banners.length;
    library.lastUpdated = new Date();

    // Sort by priority
    library.banners.sort((a, b) => a.priority - b.priority);

    return banner;
  }

  // Get country library
  public getCountryLibrary(country: string): CountryLibrary | null {
    return this.libraries.get(country) || null;
  }

  // Get available banners for country
  public getAvailableBanners(country: string, type?: 'image' | 'video'): LibraryBanner[] {
    const library = this.libraries.get(country);
    if (!library) return [];

    let banners = library.banners.filter(banner => banner.isActive);
    
    if (type) {
      banners = banners.filter(banner => banner.type === type);
    }

    return banners.sort((a, b) => {
      // Sort by priority (lower number = higher priority)
      if (a.priority !== b.priority) return a.priority - b.priority;
      // Then by usage count (lower usage = higher priority)
      return a.usageCount - b.usageCount;
    });
  }

  // Delete banner from library
  public deleteBanner(country: string, bannerId: string): boolean {
    const library = this.libraries.get(country);
    if (!library) return false;

    const bannerIndex = library.banners.findIndex(b => b.id === bannerId);
    if (bannerIndex === -1) return false;

    const banner = library.banners[bannerIndex];
    
    // Delete from storage
    this.deleteFromStorage(banner.storagePath);

    // Remove from library
    library.banners.splice(bannerIndex, 1);
    library.totalBanners = library.banners.length;
    library.lastUpdated = new Date();

    // Reorder priorities
    library.banners.forEach((b, index) => {
      b.priority = index + 1;
    });

    return true;
  }

  // Replace banner in library
  public async replaceBanner(
    country: string,
    bannerId: string,
    newFile: File,
    metadata?: Partial<LibraryBanner['metadata']>,
    tags?: string[]
  ): Promise<LibraryBanner> {
    const library = this.libraries.get(country);
    if (!library) {
      throw new Error(`Library for country ${country} not found`);
    }

    const bannerIndex = library.banners.findIndex(b => b.id === bannerId);
    if (bannerIndex === -1) {
      throw new Error(`Banner ${bannerId} not found in library`);
    }

    const oldBanner = library.banners[bannerIndex];

    // Delete old file
    await this.deleteFromStorage(oldBanner.storagePath);

    // Upload new file
    const storagePath = `${LibraryAdGenerator.COUNTRY_CONFIGS[country as keyof typeof LibraryAdGenerator.COUNTRY_CONFIGS].libraryPath}${Date.now()}_${newFile.name}`;
    const cdnUrl = await this.uploadToStorage(newFile, storagePath);

    // Update banner
    const updatedBanner: LibraryBanner = {
      ...oldBanner,
      type: newFile.type.startsWith('video/') ? 'video' : 'image',
      fileName: newFile.name,
      originalName: newFile.name,
      fileSize: newFile.size,
      mimeType: newFile.type,
      cdnUrl,
      storagePath,
      uploadedAt: new Date(),
      metadata: {
        format: newFile.type.split('/')[1] || 'unknown',
        quality: 'high',
        ...metadata
      },
      tags: tags || oldBanner.tags
    };

    library.banners[bannerIndex] = updatedBanner;
    library.lastUpdated = new Date();

    return updatedBanner;
  }

  // Generate ad with library priority
  public async generateAdWithLibraryPriority(
    platform: string,
    type: 'image' | 'video',
    country: string
  ): Promise<LibraryAdContent | null> {
    const library = this.libraries.get(country);
    if (!library) {
      throw new Error(`Library for country ${country} not found`);
    }

    // Check library priority rule
    if (library.priorityRule === 'library_first' || library.priorityRule === 'mixed') {
      const availableBanners = this.getAvailableBanners(country, type);
      
      if (availableBanners.length > 0 && (library.priorityRule === 'library_first' || Math.random() > 0.5)) {
        // Use library banner
        return this.generateAdFromLibraryBanner(platform, availableBanners[0], country);
      }
    }

    // Auto-generate ad
    return this.generateAutoAd(platform, type, country);
  }

  // Generate ad from library banner
  private async generateAdFromLibraryBanner(
    platform: string,
    banner: LibraryBanner,
    country: string
  ): Promise<LibraryAdContent> {
    const config = LibraryAdGenerator.COUNTRY_CONFIGS[country as keyof typeof LibraryAdGenerator.COUNTRY_CONFIGS];
    
    // Generate localized content
    const title = this.generateLocalizedTitle(country, platform);
    const description = this.generateLocalizedDescription(country, platform);
    const hashtags = await this.fetchLocalizedHashtags(country, platform);
    const seoKeywords = this.generateLocalizedSEOKeywords(country, platform);
    const callToAction = this.generateLocalizedCTA(country, platform);

    // Apply security filtering
    const content = `${title} ${description} ${callToAction} ${hashtags.join(' ')}`;
    if (!this.isContentSecure(content)) {
      console.warn('Ad content failed security filtering');
      throw new Error('Content failed security filtering');
    }

    // Update banner usage
    banner.usageCount++;
    banner.lastUsed = new Date();

    // Calculate scores
    const seoScore = this.calculateSEOScore(content, seoKeywords);
    const trendingScore = this.calculateTrendingScore(hashtags);

    return {
      id: this.generateAdId(),
      platform,
      type: banner.type,
      country,
      banner,
      title,
      description,
      hashtags,
      seoKeywords,
      callToAction,
      appLink: this.appUrl,
      brandingSlogan: this.brandSlogan,
      generatedAt: new Date(),
      isUsed: false,
      seoScore,
      trendingScore,
      source: 'library'
    };
  }

  // Auto-generate ad with Google Images
  private async generateAutoAd(
    platform: string,
    type: 'image' | 'video',
    country: string
  ): Promise<LibraryAdContent> {
    const config = LibraryAdGenerator.COUNTRY_CONFIGS[country as keyof typeof LibraryAdGenerator.COUNTRY_CONFIGS];
    
    // Search for free images from Google
    const imageResults = await this.searchGoogleImages(country, type);
    const selectedImage = imageResults[0]; // Use most relevant

    // Generate localized content
    const title = this.generateLocalizedTitle(country, platform);
    const description = this.generateLocalizedDescription(country, platform);
    const hashtags = await this.fetchLocalizedHashtags(country, platform);
    const seoKeywords = this.generateLocalizedSEOKeywords(country, platform);
    const callToAction = this.generateLocalizedCTA(country, platform);

    // Apply security filtering
    const content = `${title} ${description} ${callToAction} ${hashtags.join(' ')}`;
    if (!this.isContentSecure(content)) {
      console.warn('Ad content failed security filtering');
      throw new Error('Content failed security filtering');
    }

    // Create a temporary banner object for auto-generated content
    const autoBanner: LibraryBanner = {
      id: this.generateBannerId(),
      country,
      type,
      fileName: 'auto-generated',
      originalName: 'Auto-generated banner',
      fileSize: 0,
      mimeType: type === 'image' ? 'image/jpeg' : 'video/mp4',
      cdnUrl: selectedImage?.url || '',
      storagePath: 'auto-generated',
      uploadedAt: new Date(),
      isActive: true,
      priority: 999, // Lowest priority for auto-generated
      metadata: {
        format: type === 'image' ? 'jpeg' : 'mp4',
        quality: 'medium',
        dimensions: type === 'image' ? { width: 1080, height: 1080 } : undefined,
        duration: type === 'video' ? 30 : undefined
      },
      tags: ['auto-generated'],
      usageCount: 0
    };

    // Calculate scores
    const seoScore = this.calculateSEOScore(content, seoKeywords);
    const trendingScore = this.calculateTrendingScore(hashtags);

    return {
      id: this.generateAdId(),
      platform,
      type,
      country,
      banner: autoBanner,
      title,
      description,
      hashtags,
      seoKeywords,
      callToAction,
      appLink: this.appUrl,
      brandingSlogan: this.brandSlogan,
      generatedAt: new Date(),
      isUsed: false,
      seoScore,
      trendingScore,
      source: 'auto_generated'
    };
  }

  // Search Google Images for free dating-related images
  private async searchGoogleImages(country: string, type: 'image' | 'video'): Promise<GoogleImageResult[]> {
    // In production, this would call Google Custom Search API or Unsplash API
    // For now, return mock results
    const countryQueries = {
      'ID': ['dating indonesia', 'cinta jodoh', 'pacaran indonesia', 'relationship goals'],
      'US': ['dating couple', 'love relationship', 'modern dating', 'online dating'],
      'IN': ['dating india', 'love couple indian', 'relationship goals', 'modern dating'],
      'BR': ['namoro brasil', 'casal brasil', 'relacionamento', 'amor'],
      'JP': ['デート カップル', '恋愛', 'モダンなデート', '関係'],
      'KR': ['데이트 커플', '사랑', '모던 데이팅', '관계'],
      'GB': ['dating uk', 'british couple', 'modern dating', 'relationship'],
      'DE': ['dating germany', 'beziehung', 'modern dating', 'liebe'],
      'FR': ['dating france', 'couple français', 'relation', 'amour'],
      'MX': ['citas méxico', 'pareja', 'relación', 'amor'],
      'TH': ['dating thailand', 'ความรัก', 'คู่รัก', 'คบหา'],
      'VN': ['hẹn hò vietnam', 'tình yêu', 'cặp đôi', 'quan hệ']
    };

    const queries = countryQueries[country as keyof typeof countryQueries] || countryQueries['US'];
    const mockResults: GoogleImageResult[] = [];

    queries.forEach((query, index) => {
      mockResults.push({
        url: `https://picsum.photos/seed/${query}-${index}/1080/1080.jpg`,
        title: `${query} - Free stock image`,
        thumbnail: `https://picsum.photos/seed/${query}-${index}/200/200.jpg`,
        size: '1080x1080',
        type: 'image',
        relevanceScore: Math.random() * 100
      });
    });

    return mockResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // Get next ad from queue
  public getNextAd(platform?: string, country?: string): LibraryAdContent | null {
    let availableAds = this.queue.filter(ad => !ad.isUsed);
    
    if (platform) {
      availableAds = availableAds.filter(ad => ad.platform === platform);
    }
    
    if (country) {
      availableAds = availableAds.filter(ad => ad.country === country);
    }
    
    if (availableAds.length === 0) {
      // Generate new ad if none available
      const selectedPlatform = platform || 'instagram';
      const selectedCountry = country || 'ID'; // Default to Indonesia
      const type = Math.random() > 0.5 ? 'image' : 'video';
      
      return this.generateAdWithLibraryPriority(selectedPlatform, type, selectedCountry);
    }
    
    // Mark as used and return
    const ad = availableAds[0];
    ad.isUsed = true;
    
    // Generate replacement ad
    this.maintainQueueSize();
    
    return ad;
  }

  // Maintain queue size
  private maintainQueueSize(): void {
    while (this.queue.filter(ad => !ad.isUsed).length < this.queueSize) {
      const countries = Object.keys(LibraryAdGenerator.COUNTRY_CONFIGS);
      const platforms = ['instagram', 'facebook', 'tiktok', 'linkedin', 'twitter', 'youtube'];
      const types: ('image' | 'video')[] = ['image', 'video'];
      
      const country = countries[Math.floor(Math.random() * countries.length)];
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      
      this.generateAdWithLibraryPriority(platform, type, country).then(ad => {
        if (ad) this.queue.push(ad);
      }).catch(error => {
        console.error('Failed to generate ad:', error);
      });
    }
  }

  // Content generation methods
  private generateLocalizedTitle(country: string, platform: string): string {
    const titles = {
      'ID': ['Temukan Jodohmu di 2DateMe 💕', 'Cinta Sejati Menanti Anda', 'Aplikasi Kencan Terbaik'],
      'US': ['Find Your Perfect Match 💕', 'Revolutionary Dating App', 'Love Awaits You'],
      'IN': ['अपना उत्तम मिलान खोजें 💕', 'प्यार की नई दुनिया', 'डेटिंग ऐप'],
      'BR': ['Encontre seu Parceiro Perfeito 💕', 'App de Namoro Revolucionário', 'Amor te Espera'],
      'JP': ['完璧な相手を見つけよう 💕', '革命的なデートアプリ', '愛が待っています'],
      'KR': ['완벽한 짝을 찾으세요 💕', '혁신적인 데이팅 앱', '사랑이 당신을 기다립니다'],
      'GB': ['Find Your Perfect Match 💕', 'Revolutionary Dating App', 'Love Awaits You'],
      'DE': ['Finde deinen perfekten Partner 💕', 'Revolutionäre Dating-App', 'Liebe wartet'],
      'FR': ['Trouvez votre Partenaire Parfait 💕', 'App de Rencontre Révolutionnaire', 'L\'Amour vous Attend'],
      'MX': ['Encuentra tu Pareja Perfecta 💕', 'App de Citas Revolucionaria', 'El Amor te Espera'],
      'TH': ['หาคู่ที่ใช่ของคุณ 💕', 'แอปหาคู่ปฏิวัติ', 'ความรักรอคุณ'],
      'VN': ['Tìm kiếm Nửa Còn lại của Bạn 💕', 'Ứng dụng Hẹn hò Cách mạng', 'Tình yêu đang chờ bạn']
    };

    const countryTitles = titles[country as keyof typeof titles] || titles['US'];
    return countryTitles[Math.floor(Math.random() * countryTitles.length)];
  }

  private generateLocalizedDescription(country: string, platform: string): string {
    const descriptions = {
      'ID': `Tired of swiping endlessly? 2DateMe menggunakan AI canggih untuk menghubungkan Anda dengan orang yang benar-benar sesuai. Download sekarang!`,
      'US': `Discover why thousands are choosing 2DateMe for meaningful connections. Our AI analyzes personality for perfect matches. Download now!`,
      'IN': `अपने उत्तम मिलान खोजने के लिए 2DateMe क्यों चुन रहे हैं। हमारा AI व्यक्तित्व का विश्लेषण करता है। अभी डाउनलोड करें!`,
      'BR': `Descubra por que milhares estão escolhendo 2DateMe para conexões significativas. Nosso IA analisa personalidade para combinações perfeitas. Baixe agora!`,
      'JP': `なぜ何千人もの人々が2DateMeを選ぶのかを発見してください。私たちのAIは性格を分析して完璧な相手を見つけます。今すぐダウンロード！`,
      'KR': `왜 수천 명이 2DateMe를 선택하는지 알아보세요. 우리의 AI가 성격을 분석하여 완벽한 짝을 찾아줍니다. 지금 다운로드하세요!`,
      'GB': `Discover why thousands are choosing 2DateMe for meaningful connections. Our AI analyzes personality for perfect matches. Download now!`,
      'DE': `Entdecken Sie, warum Tausende 2DateMe für bedeutungsvolle Verbindungen wählen. Unsere KI analysiert Persönlichkeit für perfekte Übereinstimmungen. Jetzt herunterladen!`,
      'FR': `Découvrez pourquoi des milliers choisissent 2DateMe pour des connexions significatives. Notre IA analyse la personnalité pour des correspondances parfaites. Téléchargez maintenant!`,
      'MX': `Descubre por qué miles están eligiendo 2DateMe para conexiones significativas. Nuestra IA analiza personalidad para coincidencias perfectas. ¡Descarga ahora!`,
      'TH': `ค้นพบว่าทำไมหลายคนเลือก 2DateMe สำหรับการเชื่อมต่อที่มีความหมาย AI ของเราวิเคราะห์บุคลิกเพื่อการจับคู่ที่สมบูรณ์ ดาวน์โหลดตอนนี้!`,
      'VN': `Khám phá lý do hàng ngàn người chọn 2DateMe để kết nối ý nghĩa. AI của chúng tôi phân tích tính cách để tìm kiếm sự phù hợp hoàn hảo. Tải xuống ngay!`
    };

    return descriptions[country as keyof typeof descriptions] || descriptions['US'];
  }

  private async fetchLocalizedHashtags(country: string, platform: string): Promise<string[]> {
    // In production, this would fetch from Google Trends API
    const hashtags = {
      'ID': ['kencanonline', 'cintasejati', 'jodoh', 'caripacar', 'relationshipgoals', 'datingindonesia', 'asmara', 'pacaran'],
      'US': ['dating', 'love', 'relationships', 'onlinedating', 'datingapp', 'findlove', 'relationshipgoals', 'datingadvice'],
      'IN': ['डेटिंग', 'प्यार', 'रिलेशनशिप', 'ऑनलाइनडेटिंग', 'जोड़ी', 'मैचमेकिंग', 'लव', 'शादी'],
      'BR': ['namoro', 'amor', 'relacionamento', 'encontros', 'dating', 'paixao', 'casamento', 'romance'],
      'JP': ['恋愛', '出会い', 'マッチング', '結婚', 'デート', '恋人', '関係', '片思い'],
      'KR': ['소개팅', '연애', '만남', '결혼', '데이팅앱', '연인', '관계', '짝사랑'],
      'GB': ['dating', 'love', 'relationships', 'onlinedating', 'datingapp', 'findlove', 'relationshipgoals', 'ukdating'],
      'DE': ['dating', 'liebe', 'beziehung', 'onlinedating', 'datingapp', 'findeliebe', 'partnersuche', 'romantik'],
      'FR': ['rencontre', 'amour', 'relation', 'dating', 'site', 'coeur', 'couple', 'romance'],
      'MX': ['citas', 'amor', 'relacion', 'enamorate', 'dating', 'corazon', 'pareja', 'novios'],
      'TH': ['หาคู่', 'ความรัก', 'คบหา', 'เดท', 'dating', 'โสด', 'แฟน', 'คู่รัก'],
      'VN': ['hẹn hò', 'tình yêu', 'quan hệ', 'dating', 'tìm bạn', 'cặp đôi', 'yêu', 'crush']
    };

    return hashtags[country as keyof typeof hashtags] || hashtags['US'];
  }

  private generateLocalizedSEOKeywords(country: string, platform: string): string[] {
    const keywords = {
      'ID': ['aplikasi kencan', 'temukan jodoh', 'kencan online', 'cari pacar', 'dating app indonesia'],
      'US': ['dating app', 'online dating', 'find love', 'relationship', 'dating site', 'matchmaking'],
      'IN': ['डेटिंग ऐप', 'ऑनलाइन डेटिंग', 'प्यार', 'रिश्ता', 'जोड़ी बनाना', 'शादी'],
      'BR': ['app de namoro', 'encontros online', 'encontrar amor', 'relacionamento sério', 'casar', 'namoro'],
      'JP': ['恋愛アプリ', 'マッチングアプリ', '出会い系', '結婚相談', 'デート', '恋人探し'],
      'KR': ['소개팅 앱', '연애 앱', '만남', '결혼', '데이팅', '연인찾기'],
      'GB': ['dating app uk', 'online dating', 'find love', 'relationship', 'dating site', 'matchmaking'],
      'DE': ['dating app', 'online dating', 'partnersuche', 'beziehung', 'liebe finden', 'single'],
      'FR': ['site de rencontre', 'amour', 'relation', 'dating', 'coeur', 'couple', 'romance'],
      'MX': ['app de citas', 'encontrar amor', 'relacion', 'pareja', 'novios', 'corazon', 'romance'],
      'TH': ['แอปหาคู่', 'ความรัก', 'คบหา', 'เดท', 'โสด', 'แฟน', 'คู่รัก'],
      'VN': ['app hẹn hò', 'tình yêu', 'quan hệ', 'dating', 'tìm bạn', 'cặp đôi', 'yêu']
    };

    return keywords[country as keyof typeof keywords] || keywords['US'];
  }

  private generateLocalizedCTA(country: string, platform: string): string {
    const ctas = {
      'ID': 'Unduh 2DateMe sekarang dan temukan jodohmu! 💕',
      'US': 'Download 2DateMe now and find your perfect match! 💕',
      'IN': 'अभी 2DateMe डाउनलोड करें और अपना उत्तम मिलान खोजें! 💕',
      'BR': 'Baixe 2DateMe agora e encontre sua alma gêmea! 💕',
      'JP': '今すぐ2DateMeをダウンロードして完璧な相手を見つけましょう！💕',
      'KR': '지금 2DateMe를 다운로드하고 완벽한 짝을 찾으세요! 💕',
      'GB': 'Download 2DateMe now and find your perfect match! 💕',
      'DE': 'Lade 2DateMe jetzt herunter und finde deine perfekte Übereinstimmung! 💕',
      'FR': 'Téléchargez 2DateMe maintenant et trouvez votre âme sœur! 💕',
      'MX': '¡Descarga 2DateMe ahora y encuentra a tu alma gemela! 💕',
      'TH': 'ดาวน์โหลด 2DateMe ตอนนี้และหาคู่ที่ใช่ของคุณ! 💕',
      'VN': 'Tải xuống 2DateMe ngay bây giờ và tìm thấy nửa còn lại của bạn! 💕'
    };

    return ctas[country as keyof typeof ctas] || ctas['US'];
  }

  // Helper methods
  private validateBannerFile(file: File): void {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed`);
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error(`File size ${file.size} exceeds maximum ${maxSize}`);
    }
  }

  private async uploadToStorage(file: File, path: string): Promise<string> {
    // In production, this would upload to Supabase Storage or CDN
    // For now, return a mock CDN URL
    return `https://cdn.2dateme.com/${path}`;
  }

  private async deleteFromStorage(path: string): Promise<void> {
    // In production, this would delete from Supabase Storage or CDN
    console.log(`Deleting file: ${path}`);
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

  private generateBannerId(): string {
    return `banner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAdId(): string {
    return `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Queue management
  public getQueueStatus(): {
    total: number;
    used: number;
    available: number;
    bySource: { library: number; auto_generated: number };
    byCountry: Record<string, number>;
    avgSeoScore: number;
    avgTrendingScore: number;
  } {
    const total = this.queue.length;
    const used = this.queue.filter(ad => ad.isUsed).length;
    const available = total - used;
    
    const bySource = {
      library: this.queue.filter(ad => ad.source === 'library').length,
      auto_generated: this.queue.filter(ad => ad.source === 'auto_generated').length
    };
    
    const byCountry: Record<string, number> = {};
    let totalSeoScore = 0;
    let totalTrendingScore = 0;
    
    this.queue.forEach(ad => {
      byCountry[ad.country] = (byCountry[ad.country] || 0) + 1;
      totalSeoScore += ad.seoScore;
      totalTrendingScore += ad.trendingScore;
    });
    
    return {
      total,
      used,
      available,
      bySource,
      byCountry,
      avgSeoScore: total > 0 ? totalSeoScore / total : 0,
      avgTrendingScore: total > 0 ? totalTrendingScore / total : 0
    };
  }

  // Copy ad to clipboard
  public async copyAdToClipboard(ad: LibraryAdContent, platform: string): Promise<boolean> {
    try {
      const hashtags = ad.hashtags.map(tag => `#${tag}`).join(' ');
      const fullText = `${ad.title}\n\n${ad.description}\n\n${hashtags}\n\n${ad.callToAction}\n\n${ad.appLink}`;
      
      await navigator.clipboard.writeText(fullText);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  // Get library statistics
  public getLibraryStats(): {
    totalCountries: number;
    totalBanners: number;
    byCountry: Record<string, number>;
    byType: { image: number; video: number };
    avgUsageCount: number;
  } {
    const totalCountries = this.libraries.size;
    let totalBanners = 0;
    const byCountry: Record<string, number> = {};
    const byType = { image: 0, video: 0 };
    let totalUsage = 0;

    this.libraries.forEach((library, country) => {
      byCountry[country] = library.banners.length;
      totalBanners += library.banners.length;
      
      library.banners.forEach(banner => {
        byType[banner.type]++;
        totalUsage += banner.usageCount;
      });
    });

    return {
      totalCountries,
      totalBanners,
      byCountry,
      byType,
      avgUsageCount: totalBanners > 0 ? totalUsage / totalBanners : 0
    };
  }
}

// Export singleton instance
export default LibraryAdGenerator.getInstance();
