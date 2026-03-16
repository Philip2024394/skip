import { useState, useEffect, useRef } from "react";
import { 
  Copy, Download, RefreshCw, Settings, Globe, Image, Video, 
  Instagram, Facebook, TikTok, Linkedin, Twitter, Youtube,
  CheckCircle, AlertCircle, Eye, Edit, Trash2, Plus, BarChart3,
  TrendingUp, Search, Target, Zap, Languages, MapPin, Phone,
  Upload, FolderOpen, X, ArrowUp, ArrowDown, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import libraryAdGenerator from "@/lib/libraryAdGenerator";
import securityFilter from "@/lib/securityFilter";

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
  priority: number;
  metadata: {
    dimensions?: { width: number; height: number };
    duration?: number;
    format: string;
    quality: 'high' | 'medium' | 'low';
  };
  tags: string[];
  usageCount: number;
  lastUsed?: Date;
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

interface CountryLibrary {
  country: string;
  banners: LibraryBanner[];
  totalBanners: number;
  lastUpdated: Date;
  autoGenerateEnabled: boolean;
  priorityRule: 'library_first' | 'mixed' | 'auto_only';
}

export default function LibraryAdGenerationDashboard() {
  const [currentAd, setCurrentAd] = useState<LibraryAdContent | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('ID');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram');
  const [selectedType, setSelectedType] = useState<'image' | 'video'>('image');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    callToAction: '',
    hashtags: '',
    seoKeywords: ''
  });

  const [countries] = useState([
    { code: 'ID', name: 'Indonesia', prefix: '+62' },
    { code: 'US', name: 'United States', prefix: '+1' },
    { code: 'IN', name: 'India', prefix: '+91' },
    { code: 'BR', name: 'Brazil', prefix: '+55' },
    { code: 'JP', name: 'Japan', prefix: '+81' },
    { code: 'KR', name: 'South Korea', prefix: '+82' },
    { code: 'GB', name: 'United Kingdom', prefix: '+44' },
    { code: 'DE', name: 'Germany', prefix: '+49' },
    { code: 'FR', name: 'France', prefix: '+33' },
    { code: 'MX', name: 'Mexico', prefix: '+52' },
    { code: 'TH', name: 'Thailand', prefix: '+66' },
    { code: 'VN', name: 'Vietnam', prefix: '+84' }
  ]);

  const [platforms] = useState(['instagram', 'facebook', 'tiktok', 'linkedin', 'twitter', 'youtube']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentLibrary, setCurrentLibrary] = useState<CountryLibrary | null>(null);
  const [libraryStats, setLibraryStats] = useState<any>(null);

  useEffect(() => {
    loadLibraryData();
    loadNextAd();
  }, [selectedCountry, selectedPlatform, selectedType]);

  const loadLibraryData = () => {
    const library = libraryAdGenerator.getCountryLibrary(selectedCountry);
    setCurrentLibrary(library);
    
    const stats = libraryAdGenerator.getLibraryStats();
    setLibraryStats(stats);
  };

  const loadNextAd = async () => {
    setIsGenerating(true);
    try {
      const ad = libraryAdGenerator.getNextAd(selectedPlatform, selectedCountry);
      setCurrentAd(ad);
      setEditMode(false);
    } catch (error) {
      console.error('Failed to load next ad:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAd = async (platform: string) => {
    if (!currentAd) return;
    
    const success = await libraryAdGenerator.copyAdToClipboard(currentAd, platform);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      
      // Load next ad after successful copy
      setTimeout(() => {
        loadNextAd();
        loadLibraryData();
      }, 1000);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsGenerating(true);
      const banner = await libraryAdGenerator.uploadBanner(selectedCountry, file);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Close modal and refresh library
      setUploadModal(false);
      loadLibraryData();
      
      // Show success message
      alert(`Banner uploaded successfully to ${selectedCountry} library`);
    } catch (error) {
      console.error('Failed to upload banner:', error);
      alert(`Failed to upload banner: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    
    try {
      const success = libraryAdGenerator.deleteBanner(selectedCountry, bannerId);
      if (success) {
        loadLibraryData();
        alert('Banner deleted successfully');
      } else {
        alert('Failed to delete banner');
      }
    } catch (error) {
      console.error('Failed to delete banner:', error);
      alert('Failed to delete banner');
    }
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString();
  };

  const getSourceBadge = (source: string) => {
    if (source === 'library') {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Library</Badge>;
    } else {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Auto-Generated</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-pink-500" />
            Library Ad Generation System
          </h1>
          <p className="text-white/70">Country-specific banner libraries with priority rules and CDN storage</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div>
            <Label className="text-white/70 text-sm block mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Country
            </Label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/20">
                {countries.map(country => (
                  <SelectItem key={country.code} value={country.code} className="text-white">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{country.name} ({country.prefix})</span>
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
                    <span>Image Banner</span>
                  </div>
                </SelectItem>
                <SelectItem value="video" className="text-white">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    <span>Video Banner</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <Button
              onClick={loadNextAd}
              disabled={isGenerating}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Generate Ad
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowLibrary(!showLibrary)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Library
            </Button>
          </div>
        </div>

        {/* Library Statistics */}
        {libraryStats && (
          <Card className="mb-8 bg-gradient-to-br from-pink-900/20 to-purple-900/20 border-pink-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-pink-500" />
                Library Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{libraryStats.totalCountries}</div>
                  <div className="text-white/60 text-sm">Countries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{libraryStats.totalBanners}</div>
                  <div className="text-white/60 text-sm">Total Banners</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{libraryStats.byType.image}</div>
                  <div className="text-white/60 text-sm">Images</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{libraryStats.byType.video}</div>
                  <div className="text-white/60 text-sm">Videos</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Ad */}
          <div className="lg:col-span-2">
            {currentAd && (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(selectedPlatform)}
                      <span className="capitalize">{selectedPlatform} Ad</span>
                      {getSourceBadge(currentAd.source)}
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
                        onClick={loadNextAd}
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
                      {/* Banner Preview */}
                      <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                        <div className="aspect-video bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            {currentAd.type === 'image' ? (
                              <>
                                <Image className="w-12 h-12 mx-auto mb-2 text-pink-400" />
                                <div className="text-white/60 text-sm">Image Banner</div>
                              </>
                            ) : (
                              <>
                                <Video className="w-12 h-12 mx-auto mb-2 text-pink-400" />
                                <div className="text-white/60 text-sm">Video Banner</div>
                              </>
                            )}
                            <div className="text-white/40 text-xs mt-1">
                              Source: {currentAd.source === 'library' ? 'Library' : 'Auto-Generated'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ad Content */}
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{currentAd.title}</h3>
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
                          <p className="text-white/60 text-sm mt-1">{currentAd.appLink}</p>
                          <p className="text-pink-400 font-medium mt-2">{currentAd.brandingSlogan}</p>
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                        <div className="text-center">
                          <div className="text-green-400 text-lg font-semibold">{currentAd.seoScore}%</div>
                          <div className="text-white/60 text-sm">SEO Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-blue-400 text-lg font-semibold">{currentAd.trendingScore}%</div>
                          <div className="text-white/60 text-sm">Trending Score</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t border-white/10">
                        <Button
                          onClick={() => handleCopyAd(selectedPlatform)}
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
            )}
          </div>

          {/* Library Management */}
          <div className="lg:col-span-1">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-pink-500" />
                    {countries.find(c => c.code === selectedCountry)?.name} Library
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setUploadModal(true)}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {currentLibrary && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Total Banners</span>
                      <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30">
                        {currentLibrary.totalBanners}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Priority Rule</span>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        {currentLibrary.priorityRule.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Auto Generate</span>
                      <div className={`w-2 h-2 rounded-full ${currentLibrary.autoGenerateEnabled ? 'bg-green-400' : 'bg-red-400'}`} />
                    </div>
                  </div>
                )}

                {/* Banner List */}
                <div className="mt-6 space-y-3 max-h-96 overflow-y-auto">
                  {currentLibrary?.banners.map((banner) => (
                    <div key={banner.id} className="bg-black/30 rounded-lg p-3 border border-white/10">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {banner.type === 'image' ? (
                            <Image className="w-4 h-4 text-pink-400" />
                          ) : (
                            <Video className="w-4 h-4 text-blue-400" />
                          )}
                          <div>
                            <div className="text-white text-sm font-medium truncate">
                              {banner.originalName}
                            </div>
                            <div className="text-white/60 text-xs">
                              {formatFileSize(banner.fileSize)}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBanner(banner.id)}
                            className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40">
                          Priority: {banner.priority}
                        </span>
                        <span className="text-white/40">
                          Used: {banner.usageCount}x
                        </span>
                      </div>
                      {banner.lastUsed && (
                        <div className="text-white/40 text-xs mt-1">
                          Last used: {formatDate(banner.lastUsed)}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {currentLibrary?.banners.length === 0 && (
                    <div className="text-center py-8 text-white/60">
                      <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <div>No banners in library</div>
                      <div className="text-white/40 text-sm mt-1">Upload banners to get started</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Upload Modal */}
        {uploadModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-pink-900/95 via-black/95 to-purple-900/95 rounded-3xl border-2 border-pink-400/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Upload Banner</h3>
                <button
                  onClick={() => setUploadModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-white/70 text-sm block mb-2">Country</Label>
                  <div className="text-white">
                    {countries.find(c => c.code === selectedCountry)?.name}
                  </div>
                </div>

                <div>
                  <Label className="text-white/70 text-sm block mb-2">File</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="w-full bg-white/10 border-white/20 text-white rounded-lg p-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-500 file:text-white hover:file:bg-pink-600 cursor-pointer"
                  />
                </div>

                <div className="text-white/60 text-sm">
                  <p>Supported formats:</p>
                  <p>• Images: JPEG, PNG, GIF, WebP</p>
                  <p>• Videos: MP4, WebM, OGG</p>
                  <p>• Maximum size: 50MB</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setUploadModal(false)}
                    variant="outline"
                    className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating}
                    className="flex-1 bg-pink-600 hover:bg-pink-700"
                  >
                    {isGenerating ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
