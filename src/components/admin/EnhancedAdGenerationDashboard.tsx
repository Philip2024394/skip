import { useState, useEffect } from "react";
import { 
  Copy, Download, RefreshCw, Settings, Globe, Image, Video, 
  Instagram, Facebook, TikTok, Linkedin, Twitter, Youtube,
  CheckCircle, AlertCircle, Eye, Edit, Trash2, Plus, BarChart3,
  TrendingUp, Search, Target, Zap, Languages, MapPin, Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import enhancedAdGenerator from "@/lib/enhancedAdGenerator";
import securityFilter from "@/lib/securityFilter";

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

export default function EnhancedAdGenerationDashboard() {
  const [currentAd, setCurrentAd] = useState<EnhancedAdContent | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryConfig | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram');
  const [selectedType, setSelectedType] = useState<'image' | 'video'>('image');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    callToAction: '',
    hashtags: '',
    seoKeywords: ''
  });

  const [countries] = useState<CountryConfig[]>(enhancedAdGenerator.getCountries());
  const [platforms] = useState<string[]>(['instagram', 'facebook', 'tiktok', 'linkedin', 'twitter', 'youtube']);

  useEffect(() => {
    // Set default country to Indonesia
    const defaultCountry = enhancedAdGenerator.getCountryByCode('ID');
    setSelectedCountry(defaultCountry);
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      loadNextAd();
    }
  }, [selectedCountry, selectedPlatform, selectedType]);

  const loadNextAd = async () => {
    if (!selectedCountry) return;
    
    setIsGenerating(true);
    const ad = enhancedAdGenerator.getNextAd(selectedPlatform, selectedCountry);
    setCurrentAd(ad);
    setEditMode(false);
    setIsGenerating(false);
  };

  const handleCopyAd = async (platform: string) => {
    if (!currentAd) return;
    
    const success = await enhancedAdGenerator.copyAdToClipboard(currentAd, platform);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleRegenerateAd = () => {
    loadNextAd();
  };

  const handleEditAd = () => {
    if (!currentAd) return;
    
    setEditForm({
      title: currentAd.title,
      description: currentAd.description,
      callToAction: currentAd.callToAction,
      hashtags: currentAd.hashtags.join(', '),
      seoKeywords: currentAd.seoKeywords.join(', ')
    });
    setEditMode(true);
  };

  const handleSaveEdit = () => {
    if (!currentAd) return;
    
    // Apply security filter
    const content = `${editForm.title} ${editForm.description} ${editForm.callToAction}`;
    const securityResult = securityFilter.filterText(content, 'ad_content');
    
    if (!securityResult.isAllowed) {
      alert('Content contains restricted elements. Please remove links, phone numbers, or platform references.');
      return;
    }
    
    // Update current ad
    setCurrentAd({
      ...currentAd,
      title: editForm.title,
      description: editForm.description,
      callToAction: editForm.callToAction,
      hashtags: editForm.hashtags.split(',').map(h => h.trim()).filter(h => h),
      seoKeywords: editForm.seoKeywords.split(',').map(k => k.trim()).filter(k => k)
    });
    
    setEditMode(false);
  };

  const handleDownloadMedia = () => {
    if (!currentAd) return;
    
    const url = currentAd.type === 'image' ? currentAd.imageUrl : currentAd.videoUrl;
    if (url) {
      window.open(url, '_blank');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="w-5 h-5" />;
      case 'facebook': return <Facebook className="w-5 h-5" />;
      case 'tiktok': return <TikTok className="w-5 h-5" />;
      case 'linkedin': return <Linkedin className="w-5 h-5" />;
      case 'twitter': return <Twitter className="w-5 h-5" />;
      case 'youtube': return <Youtube className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  const getPlatformConfig = (platform: string): PlatformPreview | null => {
    return enhancedAdGenerator.getPlatformConfig(platform);
  };

  const getFormattedAd = (platform: string) => {
    if (!currentAd) return null;
    return enhancedAdGenerator.formatAdForPlatform(currentAd, platform);
  };

  const renderPlatformPreview = (platform: string) => {
    const config = getPlatformConfig(platform);
    const formattedAd = getFormattedAd(platform);
    
    if (!config || !formattedAd) return null;

    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {getPlatformIcon(platform)}
            <span>{config.displayName}</span>
            <Badge variant="outline" className="border-pink-500/30 text-pink-400">
              {formattedAd.characterCount.title}/{config.characterLimits.title}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Media Preview */}
            <div className="bg-black/30 rounded-lg p-4 border border-white/10">
              {currentAd.type === 'image' ? (
                <div 
                  className="aspect-square bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-lg flex items-center justify-center"
                  style={{ aspectRatio: `${config.dimensions.image.width}/${config.dimensions.image.height}` }}
                >
                  <div className="text-center">
                    <Image className="w-12 h-12 mx-auto mb-2 text-pink-400" />
                    <div className="text-white/60 text-sm">
                      {config.dimensions.image.width}x{config.dimensions.image.height}
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-lg flex items-center justify-center"
                  style={{ aspectRatio: `${config.dimensions.video.width}/${config.dimensions.video.height}` }}
                >
                  <div className="text-center">
                    <Video className="w-12 h-12 mx-auto mb-2 text-pink-400" />
                    <div className="text-white/60 text-sm">
                      {config.dimensions.video.duration.min}-{config.dimensions.video.duration.max}s
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Content Preview */}
            <div className="space-y-2">
              <h3 className="text-white font-semibold text-sm">{formattedAd.title}</h3>
              <p className="text-white/70 text-xs line-clamp-3">{formattedAd.description}</p>
              <div className="flex flex-wrap gap-1">
                {currentAd.hashtags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="bg-pink-500/20 text-pink-300 border-pink-500/30 text-xs">
                    #{tag}
                  </Badge>
                ))}
                {currentAd.hashtags.length > 3 && (
                  <Badge variant="secondary" className="bg-pink-500/20 text-pink-300 border-pink-500/30 text-xs">
                    +{currentAd.hashtags.length - 3}
                  </Badge>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleCopyAd(platform)}
                className={`flex-1 text-xs ${copySuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-pink-600 hover:bg-pink-700'}`}
              >
                {copySuccess ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadMedia}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!selectedCountry) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-pulse">Loading countries...</div>
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
            Enhanced Ad Generation System
          </h1>
          <p className="text-white/70">Country-based localization with trending hashtags and SEO optimization</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div>
            <Label className="text-white/70 text-sm block mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Country
            </Label>
            <Select value={selectedCountry.code} onValueChange={(code) => {
              const country = enhancedAdGenerator.getCountryByCode(code);
              setSelectedCountry(country);
            }}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/20">
                {countries.map(country => (
                  <SelectItem key={country.code} value={country.code} className="text-white">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{country.name} ({country.dialingPrefix})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white/70 text-sm block mb-2">Platform</Label>
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/20">
                {platforms.map(platform => (
                  <SelectItem key={platform} value={platform} className="text-white">
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(platform)}
                      <span className="capitalize">{platform}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white/70 text-sm block mb-2">Format</Label>
            <Select value={selectedType} onValueChange={(value: 'image' | 'video') => setSelectedType(value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/20">
                <SelectItem value="image" className="text-white">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    <span>Image Post</span>
                  </div>
                </SelectItem>
                <SelectItem value="video" className="text-white">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    <span>Video Post</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <Button
              onClick={handleRegenerateAd}
              disabled={isGenerating}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Country Information */}
        <Card className="mb-8 bg-gradient-to-br from-pink-900/20 to-purple-900/20 border-pink-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-pink-500" />
              {selectedCountry.name} ({selectedCountry.dialingPrefix})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-white/60 text-sm mb-1">Language</div>
                <div className="text-white font-medium capitalize">{selectedCountry.language}</div>
              </div>
              <div>
                <div className="text-white/60 text-sm mb-1">Market</div>
                <Badge className={selectedCountry.market === 'developed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}>
                  {selectedCountry.market}
                </Badge>
              </div>
              <div>
                <div className="text-white/60 text-sm mb-1">Primary Platform</div>
                <div className="flex items-center gap-2">
                  {getPlatformIcon(selectedCountry.primaryPlatform)}
                  <span className="capitalize">{selectedCountry.primaryPlatform}</span>
                </div>
              </div>
              <div>
                <div className="text-white/60 text-sm mb-1">Timezone</div>
                <div className="text-white font-medium">{selectedCountry.timezone}</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-white/60 text-sm mb-1">Cultural Notes</div>
              <div className="text-white/80 text-sm">{selectedCountry.culturalNotes}</div>
            </div>
          </CardContent>
        </Card>

        {/* Current Ad Content */}
        {currentAd && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Ad Editor */}
            <div className="lg:col-span-1">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Edit className="w-5 h-5 text-pink-500" />
                      Ad Content
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditAd}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegenerateAd}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editMode ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white/70 text-sm block mb-2">Title</Label>
                        <Input
                          value={editForm.title}
                          onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white/70 text-sm block mb-2">Description</Label>
                        <Textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                          className="bg-white/10 border-white/20 text-white resize-none"
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label className="text-white/70 text-sm block mb-2">Call to Action</Label>
                        <Input
                          value={editForm.callToAction}
                          onChange={(e) => setEditForm({...editForm, callToAction: e.target.value})}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white/70 text-sm block mb-2">Hashtags</Label>
                        <Input
                          value={editForm.hashtags}
                          onChange={(e) => setEditForm({...editForm, hashtags: e.target.value})}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="hashtag1, hashtag2, hashtag3"
                        />
                      </div>
                      <div>
                        <Label className="text-white/70 text-sm block mb-2">SEO Keywords</Label>
                        <Input
                          value={editForm.seoKeywords}
                          onChange={(e) => setEditForm({...editForm, seoKeywords: e.target.value})}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="keyword1, keyword2, keyword3"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveEdit} className="bg-pink-600 hover:bg-pink-700">
                          Save Changes
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditMode(false)}
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white/70 text-sm block mb-2">Title</Label>
                        <div className="text-white">{currentAd.title}</div>
                      </div>
                      <div>
                        <Label className="text-white/70 text-sm block mb-2">Description</Label>
                        <div className="text-white/80 text-sm whitespace-pre-wrap">{currentAd.description}</div>
                      </div>
                      <div>
                        <Label className="text-white/70 text-sm block mb-2">Call to Action</Label>
                        <div className="text-pink-400 font-medium">{currentAd.callToAction}</div>
                      </div>
                      <div>
                        <Label className="text-white/70 text-sm block mb-2">Hashtags</Label>
                        <div className="flex flex-wrap gap-1">
                          {currentAd.hashtags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="bg-pink-500/20 text-pink-300 border-pink-500/30">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-white/70 text-sm block mb-2">SEO Keywords</Label>
                        <div className="flex flex-wrap gap-1">
                          {currentAd.seoKeywords.map((keyword, index) => (
                            <Badge key={index} variant="outline" className="border-blue-500/30 text-blue-400 text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-white/10">
                        <div className="text-white/60 text-sm">{currentAd.appLink}</div>
                        <div className="text-pink-400 font-medium">{currentAd.brandingSlogan}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 mt-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-500" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">SEO Score</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-white/20 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${currentAd.seoScore}%` }}
                          />
                        </div>
                        <span className="text-green-400 text-sm">{currentAd.seoScore}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Trending Score</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-white/20 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${currentAd.trendingScore}%` }}
                          />
                        </div>
                        <span className="text-blue-400 text-sm">{currentAd.trendingScore}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Hashtags</span>
                      <span className="text-white text-sm">{currentAd.hashtags.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">SEO Keywords</span>
                      <span className="text-white text-sm">{currentAd.seoKeywords.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Platform Previews */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {platforms.map(platform => renderPlatformPreview(platform))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
