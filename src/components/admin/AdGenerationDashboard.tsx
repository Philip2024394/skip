import { useState, useEffect } from "react";
import { 
  Copy, Download, RefreshCw, Settings, Globe, Image, Video, 
  Instagram, Facebook, TikTok, Linkedin, Twitter, Youtube,
  CheckCircle, AlertCircle, Eye, Edit, Trash2, Plus, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import adGenerator from "@/lib/adGenerator";
import securityFilter from "@/lib/securityFilter";

interface AdContent {
  id: string;
  platform: string;
  type: 'image' | 'video';
  title: string;
  description: string;
  hashtags: string[];
  callToAction: string;
  link: string;
  imageUrl?: string;
  videoUrl?: string;
  language: string;
  country: string;
  generatedAt: Date;
  isUsed: boolean;
}

interface QueueStatus {
  total: number;
  used: number;
  available: number;
  byPlatform: Record<string, number>;
  byLanguage: Record<string, number>;
}

export default function AdGenerationDashboard() {
  const [currentAd, setCurrentAd] = useState<AdContent | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [selectedType, setSelectedType] = useState<'image' | 'video'>('image');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    callToAction: '',
    hashtags: ''
  });

  useEffect(() => {
    loadNextAd();
    updateQueueStatus();
  }, [selectedPlatform, selectedLanguage, selectedType]);

  const loadNextAd = () => {
    const ad = adGenerator.getNextAd(
      selectedPlatform as any,
      selectedLanguage
    );
    setCurrentAd(ad);
    setEditMode(false);
  };

  const updateQueueStatus = () => {
    const status = adGenerator.getQueueStatus();
    setQueueStatus(status);
  };

  const handleCopyAd = async () => {
    if (!currentAd) return;
    
    const success = await adGenerator.copyAdToClipboard(currentAd);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleRegenerateAd = () => {
    loadNextAd();
    updateQueueStatus();
  };

  const handleRegenerateQueue = () => {
    setIsGenerating(true);
    adGenerator.regenerateAds({
      platforms: [selectedPlatform],
      languages: [selectedLanguage],
      types: [selectedType]
    });
    
    setTimeout(() => {
      loadNextAd();
      updateQueueStatus();
      setIsGenerating(false);
    }, 1000);
  };

  const handleEditAd = () => {
    if (!currentAd) return;
    
    setEditForm({
      title: currentAd.title,
      description: currentAd.description,
      callToAction: currentAd.callToAction,
      hashtags: currentAd.hashtags.join(', ')
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
    
    // Update current ad (in production, this would save to database)
    setCurrentAd({
      ...currentAd,
      title: editForm.title,
      description: editForm.description,
      callToAction: editForm.callToAction,
      hashtags: editForm.hashtags.split(',').map(h => h.trim()).filter(h => h)
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

  const getLanguageName = (code: string) => {
    const languages = adGenerator.getLanguages();
    const lang = languages.find(l => l.code === code);
    return lang ? lang.name : code;
  };

  const getFormattedAd = () => {
    if (!currentAd) return null;
    return adGenerator.getFormattedAd(currentAd);
  };

  const getPlatformConfig = () => {
    if (!currentAd) return null;
    return adGenerator.getPlatformConfig(currentAd.platform as any);
  };

  const platforms = adGenerator.getPlatforms();
  const languages = adGenerator.getLanguages();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-pink-500" />
            Ad & Commercial Generation
          </h1>
          <p className="text-white/70">Multi-platform ad generation with queue management</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
            <Label className="text-white/70 text-sm block mb-2">Language</Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/20">
                {languages.map(lang => (
                  <SelectItem key={lang.code} value={lang.code} className="text-white">
                    {lang.name} ({lang.prefix})
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
              onClick={handleRegenerateQueue}
              disabled={isGenerating}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate Queue
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

        {/* Queue Status */}
        {queueStatus && (
          <Card className="mb-8 bg-gradient-to-br from-pink-900/20 to-purple-900/20 border-pink-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-pink-500" />
                Queue Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{queueStatus.total}</div>
                  <div className="text-white/60 text-sm">Total Ads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{queueStatus.available}</div>
                  <div className="text-white/60 text-sm">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{queueStatus.used}</div>
                  <div className="text-white/60 text-sm">Used</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-400">{Math.round((queueStatus.available / queueStatus.total) * 100)}%</div>
                  <div className="text-white/60 text-sm">Ready Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Ad Preview */}
        {currentAd && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ad Preview */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(currentAd.platform)}
                    <span className="capitalize">{currentAd.platform} Ad</span>
                    <Badge variant="outline" className="border-pink-500/30 text-pink-400">
                      {currentAd.type}
                    </Badge>
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
                        maxLength={getPlatformConfig()?.maxTitleLength}
                      />
                    </div>
                    <div>
                      <Label className="text-white/70 text-sm block mb-2">Description</Label>
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        className="bg-white/10 border-white/20 text-white resize-none"
                        rows={4}
                        maxLength={getPlatformConfig()?.maxDescriptionLength}
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
                      <Label className="text-white/70 text-sm block mb-2">Hashtags (comma-separated)</Label>
                      <Input
                        value={editForm.hashtags}
                        onChange={(e) => setEditForm({...editForm, hashtags: e.target.value})}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="hashtag1, hashtag2, hashtag3"
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
                    {/* Media Preview */}
                    <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                      {currentAd.type === 'image' ? (
                        <div className="aspect-square bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <Image className="w-12 h-12 mx-auto mb-2 text-pink-400" />
                            <div className="text-white/60">Image Preview</div>
                            <div className="text-white/40 text-sm mt-1">
                              {getPlatformConfig()?.imageDimensions.width}x{getPlatformConfig()?.imageDimensions.height}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <Video className="w-12 h-12 mx-auto mb-2 text-pink-400" />
                            <div className="text-white/60">Video Preview</div>
                            <div className="text-white/40 text-sm mt-1">
                              {getPlatformConfig()?.videoDuration.min}-{getPlatformConfig()?.videoDuration.max}s
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ad Content */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">{currentAd.title}</h3>
                        <p className="text-white/80 whitespace-pre-wrap">{currentAd.description}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {currentAd.hashtags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="bg-pink-500/20 text-pink-300 border-pink-500/30">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="pt-2 border-t border-white/10">
                        <p className="text-pink-400 font-medium">{currentAd.callToAction}</p>
                        <p className="text-white/60 text-sm mt-1">{currentAd.link}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t border-white/10">
                      <Button
                        onClick={handleCopyAd}
                        className={`flex-1 ${copySuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-pink-600 hover:bg-pink-700'}`}
                      >
                        {copySuccess ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Ad
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDownloadMedia}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ad Details & Analytics */}
            <div className="space-y-6">
              {/* Character Count */}
              {getFormattedAd() && (
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Content Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Title Characters</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white">{getFormattedAd()!.characterCount.title}</span>
                          <span className="text-white/40">/ {getPlatformConfig()?.maxTitleLength}</span>
                          <div className={`w-2 h-2 rounded-full ${
                            getFormattedAd()!.characterCount.title <= getPlatformConfig()!.maxTitleLength 
                              ? 'bg-green-400' 
                              : 'bg-red-400'
                          }`} />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Description Characters</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white">{getFormattedAd()!.characterCount.description}</span>
                          <span className="text-white/40">/ {getPlatformConfig()?.maxDescriptionLength}</span>
                          <div className={`w-2 h-2 rounded-full ${
                            getFormattedAd()!.characterCount.description <= getPlatformConfig()!.maxDescriptionLength 
                              ? 'bg-green-400' 
                              : 'bg-red-400'
                          }`} />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Hashtags</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white">{currentAd.hashtags.length}</span>
                          <span className="text-white/40">/ {getPlatformConfig()?.maxHashtags}</span>
                          <div className={`w-2 h-2 rounded-full ${
                            currentAd.hashtags.length <= getPlatformConfig()!.maxHashtags 
                              ? 'bg-green-400' 
                              : 'bg-red-400'
                          }`} />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Platform Limits</span>
                        <div className={`px-2 py-1 rounded text-xs ${
                          getFormattedAd()!.withinLimits 
                            ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>
                          {getFormattedAd()!.withinLimits ? 'Within Limits' : 'Exceeds Limits'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Ad Metadata */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-lg">Ad Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/70">Platform</span>
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(currentAd.platform)}
                        <span className="capitalize text-white">{currentAd.platform}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Type</span>
                      <Badge variant="outline" className="border-pink-500/30 text-pink-400">
                        {currentAd.type}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Language</span>
                      <span className="text-white">{getLanguageName(currentAd.language)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Country</span>
                      <span className="text-white">{currentAd.country}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Generated</span>
                      <span className="text-white">{new Date(currentAd.generatedAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Status</span>
                      <Badge className={currentAd.isUsed ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}>
                        {currentAd.isUsed ? 'Used' : 'Available'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Full Text Preview */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-lg">Full Text Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={getFormattedAd()?.fullText || ''}
                    readOnly
                    className="bg-black/30 border-white/20 text-white resize-none"
                    rows={8}
                  />
                  <div className="mt-2 flex justify-between">
                    <span className="text-white/40 text-sm">
                      {getFormattedAd()?.characterCount.total} total characters
                    </span>
                    <Button
                      size="sm"
                      onClick={handleCopyAd}
                      className={`text-xs ${copySuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-pink-600 hover:bg-pink-700'}`}
                    >
                      {copySuccess ? 'Copied!' : 'Copy All'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
