// Ad Performance Tracking System
// Comprehensive metrics capture with analytics integration and reporting

interface AdClickEvent {
  id: string;
  adId: string;
  trackingId: string;
  adType: 'image' | 'video';
  platform: string;
  country: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  sessionId?: string;
  userId?: string;
  conversion: boolean;
  conversionTime?: Date;
}

interface AdMetrics {
  totalClicks: number;
  imageClicks: number;
  videoClicks: number;
  conversionRate: number;
  topCountries: Array<{
    country: string;
    clicks: number;
    percentage: number;
  }>;
  topPlatforms: Array<{
    platform: string;
    clicks: number;
    percentage: number;
  }>;
  timeframe: {
    daily: Array<{
      date: string;
      clicks: number;
      conversions: number;
    }>;
    weekly: Array<{
      week: string;
      clicks: number;
      conversions: number;
    }>;
    monthly: Array<{
      month: string;
      clicks: number;
      conversions: number;
    }>;
  };
}

interface TrackingLink {
  id: string;
  adId: string;
  trackingId: string;
  url: string;
  adType: 'image' | 'video';
  platform: string;
  country: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  clickCount: number;
  conversionCount: number;
}

interface PerformanceReport {
  id: string;
  reportType: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  metrics: AdMetrics;
  generatedAt: Date;
  filters?: {
    countries?: string[];
    platforms?: string[];
    adTypes?: ('image' | 'video')[];
  };
}

class AdPerformanceTracker {
  private static instance: AdPerformanceTracker;
  private trackingLinks: Map<string, TrackingLink> = new Map();
  private clickEvents: AdClickEvent[] = [];
  private readonly baseUrl = 'https://2DateMe.com';
  private readonly trackingPath = '/ad';
  
  // Platform configurations for tracking
  private static readonly PLATFORM_CONFIGS = {
    instagram: { name: 'Instagram', utmSource: 'instagram' },
    facebook: { name: 'Facebook', utmSource: 'facebook' },
    tiktok: { name: 'TikTok', utmSource: 'tiktok' },
    linkedin: { name: 'LinkedIn', utmSource: 'linkedin' },
    twitter: { name: 'Twitter', utmSource: 'twitter' },
    youtube: { name: 'YouTube', utmSource: 'youtube' }
  };

  // Country code mapping
  private static readonly COUNTRY_MAPPING = {
    'ID': 'Indonesia',
    'US': 'United States',
    'IN': 'India',
    'BR': 'Brazil',
    'JP': 'Japan',
    'KR': 'South Korea',
    'GB': 'United Kingdom',
    'DE': 'Germany',
    'FR': 'France',
    'MX': 'Mexico',
    'TH': 'Thailand',
    'VN': 'Vietnam'
  };

  public static getInstance(): AdPerformanceTracker {
    if (!AdPerformanceTracker.instance) {
      AdPerformanceTracker.instance = new AdPerformanceTracker();
    }
    return AdPerformanceTracker.instance;
  }

  // Generate tracking link for ad
  public generateTrackingLink(adId: string, adType: 'image' | 'video', platform: string, country: string): TrackingLink {
    const trackingId = this.generateTrackingId();
    const url = `${this.baseUrl}${this.trackingPath}?id=${trackingId}`;
    
    const trackingLink: TrackingLink = {
      id: this.generateLinkId(),
      adId,
      trackingId,
      url,
      adType,
      platform,
      country,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      isActive: true,
      clickCount: 0,
      conversionCount: 0
    };

    this.trackingLinks.set(trackingId, trackingLink);
    return trackingLink;
  }

  // Track ad click
  public async trackClick(trackingId: string, eventData: Partial<AdClickEvent>): Promise<AdClickEvent | null> {
    const trackingLink = this.trackingLinks.get(trackingId);
    if (!trackingLink || !trackingLink.isActive) {
      return null;
    }

    // Get country from IP or use tracking link country
    const country = eventData.country || trackingLink.country;
    
    const clickEvent: AdClickEvent = {
      id: this.generateClickId(),
      adId: trackingLink.adId,
      trackingId,
      adType: trackingLink.adType,
      platform: trackingLink.platform,
      country,
      ipAddress: eventData.ipAddress || 'unknown',
      userAgent: eventData.userAgent || 'unknown',
      timestamp: new Date(),
      referrer: eventData.referrer,
      utmSource: eventData.utmSource,
      utmMedium: eventData.utmMedium,
      utmCampaign: eventData.utmCampaign,
      sessionId: eventData.sessionId,
      userId: eventData.userId,
      conversion: false
    };

    // Update tracking link click count
    trackingLink.clickCount++;

    // Store click event
    this.clickEvents.push(clickEvent);

    // Store in database (in production, this would save to Supabase)
    await this.saveClickEvent(clickEvent);
    await this.updateTrackingLink(trackingLink);

    return clickEvent;
  }

  // Track conversion
  public async trackConversion(trackingId: string, conversionData: {
    sessionId?: string;
    userId?: string;
    conversionType: 'signup' | 'purchase' | 'engagement';
  }): Promise<boolean> {
    const trackingLink = this.trackingLinks.get(trackingId);
    if (!trackingLink) {
      return false;
    }

    // Find the click event for this tracking ID
    const clickEvent = this.clickEvents.find(event => 
      event.trackingId === trackingId && !event.conversion
    );

    if (!clickEvent) {
      return false;
    }

    // Update click event with conversion
    clickEvent.conversion = true;
    clickEvent.conversionTime = new Date();
    if (conversionData.sessionId) clickEvent.sessionId = conversionData.sessionId;
    if (conversionData.userId) clickEvent.userId = conversionData.userId;

    // Update tracking link conversion count
    trackingLink.conversionCount++;

    // Save updates to database
    await this.updateClickEvent(clickEvent);
    await this.updateTrackingLink(trackingLink);

    return true;
  }

  // Get comprehensive metrics
  public getMetrics(filters?: {
    startDate?: Date;
    endDate?: Date;
    countries?: string[];
    platforms?: string[];
    adTypes?: ('image' | 'video')[];
  }): AdMetrics {
    let filteredEvents = [...this.clickEvents];

    // Apply filters
    if (filters?.startDate) {
      filteredEvents = filteredEvents.filter(event => event.timestamp >= filters.startDate!);
    }
    if (filters?.endDate) {
      filteredEvents = filteredEvents.filter(event => event.timestamp <= filters.endDate!);
    }
    if (filters?.countries) {
      filteredEvents = filteredEvents.filter(event => filters.countries!.includes(event.country));
    }
    if (filters?.platforms) {
      filteredEvents = filteredEvents.filter(event => filters.platforms!.includes(event.platform));
    }
    if (filters?.adTypes) {
      filteredEvents = filteredEvents.filter(event => filters.adTypes!.includes(event.adType));
    }

    // Calculate metrics
    const totalClicks = filteredEvents.length;
    const imageClicks = filteredEvents.filter(event => event.adType === 'image').length;
    const videoClicks = filteredEvents.filter(event => event.adType === 'video').length;
    const conversions = filteredEvents.filter(event => event.conversion).length;
    const conversionRate = totalClicks > 0 ? (conversions / totalClicks) * 100 : 0;

    // Country breakdown
    const countryBreakdown = this.calculateCountryBreakdown(filteredEvents);
    
    // Platform breakdown
    const platformBreakdown = this.calculatePlatformBreakdown(filteredEvents);

    // Timeframe data
    const timeframe = this.calculateTimeframeData(filteredEvents);

    return {
      totalClicks,
      imageClicks,
      videoClicks,
      conversionRate,
      topCountries: countryBreakdown.slice(0, 3),
      topPlatforms: platformBreakdown.slice(0, 3),
      timeframe
    };
  }

  // Generate performance report
  public generateReport(reportType: 'daily' | 'weekly' | 'monthly', filters?: {
    countries?: string[];
    platforms?: string[];
    adTypes?: ('image' | 'video')[];
  }): PerformanceReport {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (reportType) {
      case 'daily':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const metrics = this.getMetrics({
      startDate,
      endDate,
      ...filters
    });

    return {
      id: this.generateReportId(),
      reportType,
      startDate,
      endDate,
      metrics,
      generatedAt: new Date(),
      filters
    };
  }

  // Export report data
  public exportReport(report: PerformanceReport, format: 'csv' | 'excel'): string {
    const headers = [
      'Date',
      'Ad ID',
      'Tracking ID',
      'Ad Type',
      'Platform',
      'Country',
      'IP Address',
      'User Agent',
      'Conversion',
      'UTM Source',
      'UTM Medium',
      'UTM Campaign'
    ];

    const rows = this.clickEvents
      .filter(event => event.timestamp >= report.startDate && event.timestamp <= report.endDate)
      .map(event => [
        event.timestamp.toISOString(),
        event.adId,
        event.trackingId,
        event.adType,
        event.platform,
        event.country,
        event.ipAddress,
        event.userAgent,
        event.conversion ? 'Yes' : 'No',
        event.utmSource || '',
        event.utmMedium || '',
        event.utmCampaign || ''
      ]);

    if (format === 'csv') {
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    } else {
      // For Excel, return CSV format (in production, use a library like xlsx)
      return [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
    }
  }

  // Get tracking link by ID
  public getTrackingLink(trackingId: string): TrackingLink | null {
    return this.trackingLinks.get(trackingId) || null;
  }

  // Get all tracking links
  public getAllTrackingLinks(): TrackingLink[] {
    return Array.from(this.trackingLinks.values());
  }

  // Clean up expired tracking links
  public cleanupExpiredLinks(): void {
    const now = new Date();
    for (const [trackingId, link] of this.trackingLinks.entries()) {
      if (link.expiresAt < now) {
        link.isActive = false;
      }
    }
  }

  // Private helper methods
  private calculateCountryBreakdown(events: AdClickEvent[]): Array<{
    country: string;
    clicks: number;
    percentage: number;
  }> {
    const countryCounts: Record<string, number> = {};
    
    events.forEach(event => {
      countryCounts[event.country] = (countryCounts[event.country] || 0) + 1;
    });

    const total = events.length;
    return Object.entries(countryCounts)
      .map(([country, clicks]) => ({
        country: AdPerformanceTracker.COUNTRY_MAPPING[country as keyof typeof AdPerformanceTracker.COUNTRY_MAPPING] || country,
        clicks,
        percentage: total > 0 ? (clicks / total) * 100 : 0
      }))
      .sort((a, b) => b.clicks - a.clicks);
  }

  private calculatePlatformBreakdown(events: AdClickEvent[]): Array<{
    platform: string;
    clicks: number;
    percentage: number;
  }> {
    const platformCounts: Record<string, number> = {};
    
    events.forEach(event => {
      platformCounts[event.platform] = (platformCounts[event.platform] || 0) + 1;
    });

    const total = events.length;
    return Object.entries(platformCounts)
      .map(([platform, clicks]) => ({
        platform: AdPerformanceTracker.PLATFORM_CONFIGS[platform as keyof typeof AdPerformanceTracker.PLATFORM_CONFIGS]?.name || platform,
        clicks,
        percentage: total > 0 ? (clicks / total) * 100 : 0
      }))
      .sort((a, b) => b.clicks - a.clicks);
  }

  private calculateTimeframeData(events: AdClickEvent[]): {
    daily: Array<{ date: string; clicks: number; conversions: number }>;
    weekly: Array<{ week: string; clicks: number; conversions: number }>;
    monthly: Array<{ month: string; clicks: number; conversions: number }>;
  } {
    const daily: Record<string, { clicks: number; conversions: number }> = {};
    const weekly: Record<string, { clicks: number; conversions: number }> = {};
    const monthly: Record<string, { clicks: number; conversions: number }> = {};

    events.forEach(event => {
      const date = event.timestamp.toISOString().split('T')[0];
      const week = this.getWeekKey(event.timestamp);
      const month = event.timestamp.toISOString().slice(0, 7);

      // Daily
      if (!daily[date]) {
        daily[date] = { clicks: 0, conversions: 0 };
      }
      daily[date].clicks++;
      if (event.conversion) daily[date].conversions++;

      // Weekly
      if (!weekly[week]) {
        weekly[week] = { clicks: 0, conversions: 0 };
      }
      weekly[week].clicks++;
      if (event.conversion) weekly[week].conversions++;

      // Monthly
      if (!monthly[month]) {
        monthly[month] = { clicks: 0, conversions: 0 };
      }
      monthly[month].clicks++;
      if (event.conversion) monthly[month].conversions++;
    });

    return {
      daily: Object.entries(daily)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      weekly: Object.entries(weekly)
        .map(([week, data]) => ({ week, ...data }))
        .sort((a, b) => a.week.localeCompare(b.week)),
      monthly: Object.entries(monthly)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month))
    };
  }

  private getWeekKey(date: Date): string {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  // Database operations (in production, these would use Supabase)
  private async saveClickEvent(event: AdClickEvent): Promise<void> {
    // In production, save to Supabase
    console.log('Saving click event:', event.id);
  }

  private async updateClickEvent(event: AdClickEvent): Promise<void> {
    // In production, update in Supabase
    console.log('Updating click event:', event.id);
  }

  private async updateTrackingLink(link: TrackingLink): Promise<void> {
    // In production, update in Supabase
    console.log('Updating tracking link:', link.id);
  }

  // Utility methods
  private generateTrackingId(): string {
    return `trk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateLinkId(): string {
    return `lnk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateClickId(): string {
    return `clk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get country from IP address (simplified)
  public getCountryFromIP(ipAddress: string): string {
    // In production, use a proper IP geolocation service
    // For now, return a default or use IP ranges
    if (ipAddress.startsWith('203.')) return 'ID'; // Indonesia
    if (ipAddress.startsWith('192.168.') || ipAddress.startsWith('127.')) return 'US'; // Local/US
    return 'US'; // Default to US
  }

  // Get platform from user agent
  public getPlatformFromUserAgent(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('instagram')) return 'instagram';
    if (ua.includes('facebook')) return 'facebook';
    if (ua.includes('tiktok')) return 'tiktok';
    if (ua.includes('linkedin')) return 'linkedin';
    if (ua.includes('twitter')) return 'twitter';
    if (ua.includes('youtube')) return 'youtube';
    
    return 'unknown';
  }

  // Get performance comparison between video and image ads
  public getPerformanceComparison(filters?: {
    startDate?: Date;
    endDate?: Date;
    countries?: string[];
    platforms?: string[];
  }): {
    image: {
      clicks: number;
      conversions: number;
      conversionRate: number;
      avgClicksPerAd: number;
    };
    video: {
      clicks: number;
      conversions: number;
      conversionRate: number;
      avgClicksPerAd: number;
    };
    winner: 'image' | 'video' | 'tie';
    improvement: number; // percentage improvement of winner over loser
  } {
    const imageMetrics = this.getMetrics({ ...filters, adTypes: ['image'] });
    const videoMetrics = this.getMetrics({ ...filters, adTypes: ['video'] });

    const imageConversionRate = imageMetrics.totalClicks > 0 ? 
      (imageMetrics.imageClicks / imageMetrics.totalClicks) * 100 : 0;
    const videoConversionRate = videoMetrics.totalClicks > 0 ? 
      (videoMetrics.videoClicks / videoMetrics.totalClicks) * 100 : 0;

    const imageResult = {
      clicks: imageMetrics.imageClicks,
      conversions: imageMetrics.imageClicks * (imageConversionRate / 100),
      conversionRate: imageConversionRate,
      avgClicksPerAd: imageMetrics.totalClicks > 0 ? imageMetrics.imageClicks / imageMetrics.totalClicks : 0
    };

    const videoResult = {
      clicks: videoMetrics.videoClicks,
      conversions: videoMetrics.videoClicks * (videoConversionRate / 100),
      conversionRate: videoConversionRate,
      avgClicksPerAd: videoMetrics.totalClicks > 0 ? videoMetrics.videoClicks / videoMetrics.totalClicks : 0
    };

    let winner: 'image' | 'video' | 'tie' = 'tie';
    let improvement = 0;

    if (imageResult.clicks > videoResult.clicks) {
      winner = 'image';
      improvement = videoResult.clicks > 0 ? 
        ((imageResult.clicks - videoResult.clicks) / videoResult.clicks) * 100 : 0;
    } else if (videoResult.clicks > imageResult.clicks) {
      winner = 'video';
      improvement = imageResult.clicks > 0 ? 
        ((videoResult.clicks - imageResult.clicks) / imageResult.clicks) * 100 : 0;
    }

    return {
      image: imageResult,
      video: videoResult,
      winner,
      improvement
    };
  }
}

// Export singleton instance
export default AdPerformanceTracker.getInstance();
