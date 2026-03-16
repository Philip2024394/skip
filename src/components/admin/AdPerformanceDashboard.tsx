import { useState, useEffect } from "react";
import { 
  BarChart3, TrendingUp, Download, Filter, Calendar, Globe, 
  Image, Video, Users, MousePointer, Target, PieChart, LineChart,
  BarChart, FileText, X, CheckCircle, AlertCircle, ArrowUp, ArrowDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import adPerformanceTracker from "@/lib/adPerformanceTracker";

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

interface PerformanceComparison {
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
  improvement: number;
}

export default function AdPerformanceDashboard() {
  const [metrics, setMetrics] = useState<AdMetrics | null>(null);
  const [comparison, setComparison] = useState<PerformanceComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedAdTypes, setSelectedAdTypes] = useState<('image' | 'video')[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');

  const countries = [
    { code: 'ID', name: 'Indonesia' },
    { code: 'US', name: 'United States' },
    { code: 'IN', name: 'India' },
    { code: 'BR', name: 'Brazil' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'MX', name: 'Mexico' },
    { code: 'TH', name: 'Thailand' },
    { code: 'VN', name: 'Vietnam' }
  ];

  const platforms = [
    { code: 'instagram', name: 'Instagram' },
    { code: 'facebook', name: 'Facebook' },
    { code: 'tiktok', name: 'TikTok' },
    { code: 'linkedin', name: 'LinkedIn' },
    { code: 'twitter', name: 'Twitter' },
    { code: 'youtube', name: 'YouTube' }
  ];

  const adTypes = [
    { code: 'image', name: 'Image Ads' },
    { code: 'video', name: 'Video Ads' }
  ];

  useEffect(() => {
    loadMetrics();
    loadComparison();
  }, [selectedTimeframe, selectedCountries, selectedPlatforms, selectedAdTypes]);

  const loadMetrics = () => {
    setLoading(true);
    
    const filters: any = {};
    if (selectedCountries.length > 0) filters.countries = selectedCountries;
    if (selectedPlatforms.length > 0) filters.platforms = selectedPlatforms;
    if (selectedAdTypes.length > 0) filters.adTypes = selectedAdTypes;

    // Add timeframe filter
    const now = new Date();
    switch (selectedTimeframe) {
      case 'daily':
        filters.startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        break;
      case 'weekly':
        filters.startDate = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000); // Last 4 weeks
        break;
      case 'monthly':
        filters.startDate = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000); // Last 6 months
        break;
    }

    const data = adPerformanceTracker.getMetrics(filters);
    setMetrics(data);
    setLoading(false);
  };

  const loadComparison = () => {
    const filters: any = {};
    if (selectedCountries.length > 0) filters.countries = selectedCountries;
    if (selectedPlatforms.length > 0) filters.platforms = selectedPlatforms;

    const data = adPerformanceTracker.getPerformanceComparison(filters);
    setComparison(data);
  };

  const handleExport = () => {
    if (!metrics) return;

    const report = adPerformanceTracker.generateReport(selectedTimeframe, {
      countries: selectedCountries.length > 0 ? selectedCountries : undefined,
      platforms: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
      adTypes: selectedAdTypes.length > 0 ? selectedAdTypes : undefined
    });

    const exportData = adPerformanceTracker.exportReport(report, exportFormat);
    
    // Create download link
    const blob = new Blob([exportData], { 
      type: exportFormat === 'csv' ? 'text/csv' : 'application/vnd.ms-excel' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ad_performance_${selectedTimeframe}_report.${exportFormat}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleCountry = (countryCode: string) => {
    setSelectedCountries(prev => 
      prev.includes(countryCode) 
        ? prev.filter(c => c !== countryCode)
        : [...prev, countryCode]
    );
  };

  const togglePlatform = (platformCode: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformCode) 
        ? prev.filter(p => p !== platformCode)
        : [...prev, platformCode]
    );
  };

  const toggleAdType = (adType: 'image' | 'video') => {
    setSelectedAdTypes(prev => 
      prev.includes(adType) 
        ? prev.filter(t => t !== adType)
        : [...prev, adType]
    );
  };

  const clearFilters = () => {
    setSelectedCountries([]);
    setSelectedPlatforms([]);
    setSelectedAdTypes([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-pulse">Loading performance data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-pink-500" />
            Ad Performance Tracking
          </h1>
          <p className="text-white/70">Comprehensive metrics and analytics for ad performance</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div>
            <Label className="text-white/70 text-sm block mb-2">Timeframe</Label>
            <Select value={selectedTimeframe} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setSelectedTimeframe(value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/20">
                <SelectItem value="daily" className="text-white">Last 7 Days</SelectItem>
                <SelectItem value="weekly" className="text-white">Last 4 Weeks</SelectItem>
                <SelectItem value="monthly" className="text-white">Last 6 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white/70 text-sm block mb-2">Export Format</Label>
            <Select value={exportFormat} onValueChange={(value: 'csv' | 'excel') => setExportFormat(value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/20">
                <SelectItem value="csv" className="text-white">CSV</SelectItem>
                <SelectItem value="excel" className="text-white">Excel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button
              onClick={handleExport}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="mb-8 bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-pink-500" />
                  Filters
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Clear All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Countries */}
                <div>
                  <Label className="text-white/70 text-sm block mb-3">Countries</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {countries.map(country => (
                      <div key={country.code} className="flex items-center space-x-2">
                        <Checkbox
                          id={`country-${country.code}`}
                          checked={selectedCountries.includes(country.code)}
                          onCheckedChange={() => toggleCountry(country.code)}
                        />
                        <Label htmlFor={`country-${country.code}`} className="text-white text-sm">
                          {country.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Platforms */}
                <div>
                  <Label className="text-white/70 text-sm block mb-3">Platforms</Label>
                  <div className="space-y-2">
                    {platforms.map(platform => (
                      <div key={platform.code} className="flex items-center space-x-2">
                        <Checkbox
                          id={`platform-${platform.code}`}
                          checked={selectedPlatforms.includes(platform.code)}
                          onCheckedChange={() => togglePlatform(platform.code)}
                        />
                        <Label htmlFor={`platform-${platform.code}`} className="text-white text-sm">
                          {platform.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ad Types */}
                <div>
                  <Label className="text-white/70 text-sm block mb-3">Ad Types</Label>
                  <div className="space-y-2">
                    {adTypes.map(adType => (
                      <div key={adType.code} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${adType.code}`}
                          checked={selectedAdTypes.includes(adType.code as 'image' | 'video')}
                          onCheckedChange={() => toggleAdType(adType.code as 'image' | 'video')}
                        />
                        <Label htmlFor={`type-${adType.code}`} className="text-white text-sm">
                          {adType.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Bar */}
        {metrics && (
          <Card className="mb-8 bg-gradient-to-br from-pink-900/20 to-purple-900/20 border-pink-500/30">
            <CardHeader>
              <CardTitle className="text-lg">Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{metrics.totalClicks.toLocaleString()}</div>
                  <div className="text-white/60 text-sm">Total Clicks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{metrics.imageClicks.toLocaleString()}</div>
                  <div className="text-white/60 text-sm">Image Ads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{metrics.videoClicks.toLocaleString()}</div>
                  <div className="text-white/60 text-sm">Video Ads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-400">{metrics.conversionRate.toFixed(1)}%</div>
                  <div className="text-white/60 text-sm">Conversion Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {metrics.topCountries[0]?.country || 'N/A'}
                  </div>
                  <div className="text-white/60 text-sm">Top Country</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Comparison */}
        {comparison && (
          <Card className="mb-8 bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-pink-500" />
                Image vs Video Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image className="w-5 h-5 text-green-400" />
                      <span className="text-white">Image Ads</span>
                    </div>
                    {comparison.winner === 'image' && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Winner
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/70">Clicks:</span>
                      <span className="text-white">{comparison.image.clicks.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Conversions:</span>
                      <span className="text-white">{comparison.image.conversions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Conversion Rate:</span>
                      <span className="text-white">{comparison.image.conversionRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-blue-400" />
                      <span className="text-white">Video Ads</span>
                    </div>
                    {comparison.winner === 'video' && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        Winner
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/70">Clicks:</span>
                      <span className="text-white">{comparison.video.clicks.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Conversions:</span>
                      <span className="text-white">{comparison.video.conversions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Conversion Rate:</span>
                      <span className="text-white">{comparison.video.conversionRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {comparison.winner !== 'tie' && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Performance Improvement:</span>
                    <div className="flex items-center gap-2">
                      {comparison.winner === 'image' ? (
                        <Image className="w-4 h-4 text-green-400" />
                      ) : (
                        <Video className="w-4 h-4 text-blue-400" />
                      )}
                      <span className="text-green-400 font-semibold">
                        +{comparison.improvement.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Top Countries & Platforms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Top Countries */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-pink-500" />
                Top Countries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.topCountries.map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center text-pink-400 text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-white font-medium">{country.country}</div>
                        <div className="text-white/60 text-sm">{country.clicks.toLocaleString()} clicks</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">{country.percentage.toFixed(1)}%</div>
                      <div className="text-white/60 text-sm">share</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Platforms */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-pink-500" />
                Top Platforms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.topPlatforms.map((platform, index) => (
                  <div key={platform.platform} className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-white font-medium">{platform.platform}</div>
                        <div className="text-white/60 text-sm">{platform.clicks.toLocaleString()} clicks</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">{platform.percentage.toFixed(1)}%</div>
                      <div className="text-white/60 text-sm">share</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time-based Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Daily Chart */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5 text-pink-500" />
                Daily Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.timeframe.daily.slice(-7).map((day, index) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <span className="text-white/70 text-sm">{new Date(day.date).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm">{day.clicks}</span>
                      {day.conversions > 0 && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          {day.conversions}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Chart */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="w-5 h-5 text-pink-500" />
                Weekly Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.timeframe.weekly.slice(-4).map((week, index) => (
                  <div key={week.week} className="flex items-center justify-between">
                    <span className="text-white/70 text-sm">{week.week}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm">{week.clicks}</span>
                      {week.conversions > 0 && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          {week.conversions}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Chart */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-pink-500" />
                Monthly Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.timeframe.monthly.slice(-6).map((month, index) => (
                  <div key={month.month} className="flex items-center justify-between">
                    <span className="text-white/70 text-sm">{new Date(month.month + '-01').toLocaleDateString('en', { month: 'short', year: 'numeric' })}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm">{month.clicks}</span>
                      {month.conversions > 0 && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          {month.conversions}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
