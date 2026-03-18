import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/card';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { Label } from '@/shared/components/label';
import { Textarea } from '@/shared/components/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/select';
import { Checkbox } from '@/shared/components/checkbox';
import { Badge } from '@/shared/components/badge';
import {
  Phone,
  MessageSquare,
  CheckCircle,
  Clock,
  User,
  MapPin,
  Globe,
  Heart,
  Star,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppCollectionProps {
  userId?: string;
  onWhatsAppCollected?: (whatsappNumber: string) => void;
  showInProfile?: boolean;
}

const WhatsAppNumberCollection: React.FC<WhatsAppCollectionProps> = ({
  userId,
  onWhatsAppCollected,
  showInProfile = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp_number: '',
    email: '',
    location: '',
    bio: '',
    interests: [] as string[],
    language: 'en',
    age_range: '',
    gender: '',
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed'>('pending');

  const interestOptions = [
    'Dating', 'Friendship', 'Serious Relationship', 'Casual Chat',
    'Travel', 'Food', 'Music', 'Movies', 'Sports', 'Technology',
    'Photography', 'Art', 'Reading', 'Gaming', 'Fitness'
  ];

  const ageRanges = [
    '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'zh', name: 'Chinese' },
    { code: 'es', name: 'Spanish' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' }
  ];

  useEffect(() => {
    if (userId) {
      loadExistingData();
    }
  }, [userId]);

  const loadExistingData = async () => {
    try {
      const { data: userData } = await (supabase as any)
        .from('profiles')
        .select('name, email, location, bio, interests, language, age_range, gender')
        .eq('id', userId)
        .single();

      if (userData) {
        setFormData(prev => ({
          ...prev,
          name: userData.name || '',
          email: userData.email || '',
          location: userData.location || '',
          bio: userData.bio || '',
          interests: userData.interests || [],
          language: userData.language || 'en',
          age_range: userData.age_range || '',
          gender: userData.gender || ''
        }));
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
    }
  };

  const handleInputChange = (field: string, value: string | string[] | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!formData.whatsapp_number.trim()) {
      setError('WhatsApp number is required');
      return false;
    }
    if (!formData.agreeToTerms) {
      setError('You must agree to the terms and conditions');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // Calculate profile completion
      const completionFields = [
        formData.name, formData.phone, formData.whatsapp_number,
        formData.email, formData.location, formData.bio,
        formData.interests.length > 0, formData.age_range, formData.gender
      ];
      const completionScore = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

      // Upsert WhatsApp lead — conflict on whatsapp_number prevents duplicates
      // from the same number being submitted multiple times (e.g. re-login).
      const leadData = {
        name: formData.name,
        phone: formData.phone,
        whatsapp_number: formData.whatsapp_number,
        email: formData.email || null,
        location: formData.location || null,
        bio: formData.bio || null,
        interests: formData.interests,
        language: formData.language,
        age_range: formData.age_range || null,
        gender: formData.gender || null,
        source: userId ? 'profile_update' : 'app_signup',
        profile_completion: completionScore,
        verified: false,
        whatsapp_verified: false,
        status: 'pending',
        ...(userId ? { user_id: userId } : {}),
        last_seen_at: new Date().toISOString(),
      };

      const { data, error } = await (supabase as any)
        .from('whatsapp_leads')
        .upsert([leadData], { onConflict: 'whatsapp_number', ignoreDuplicates: false })
        .select()
        .single();

      if (error) throw error;

      setSubmitted(true);
      setVerificationStatus('pending');

      // Call callback if provided
      if (onWhatsAppCollected) {
        onWhatsAppCollected(formData.whatsapp_number);
      }

      // Log analytics only on genuinely new leads (upsert inserts, not updates)
      if (data) {
        await (supabase as any)
          .from('whatsapp_analytics')
          .upsert([{
            event_type: 'whatsapp_number_collected',
            user_id: userId || data.id,
            metadata: {
              source: leadData.source,
              profile_completion: completionScore,
              interests_count: formData.interests.length,
            },
            timestamp: new Date().toISOString(),
          }], { onConflict: 'user_id,event_type', ignoreDuplicates: true });
      }

    } catch (error) {
      console.error('Error submitting WhatsApp number:', error);
      setError('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-600">WhatsApp Number Submitted!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Thank you for providing your WhatsApp number. We'll verify it shortly.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Verification status: {verificationStatus}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={showInProfile ? '' : 'max-w-md mx-auto'}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>Connect on WhatsApp</span>
        </CardTitle>
        <CardDescription>
          Share your WhatsApp number to connect with other users directly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+62 812-3456-7890"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="whatsapp_number">WhatsApp Number *</Label>
                <Input
                  id="whatsapp_number"
                  type="tel"
                  placeholder="+62 812-3456-7890"
                  value={formData.whatsapp_number}
                  onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                type="text"
                placeholder="Jakarta, Indonesia"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="bio">Bio (Optional)</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="age_range">Age Range</Label>
                <Select value={formData.age_range} onValueChange={(value) => handleInputChange('age_range', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select age range" />
                  </SelectTrigger>
                  <SelectContent>
                    {ageRanges.map(range => (
                      <SelectItem key={range} value={range}>{range}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="language">Preferred Language</Label>
              <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Interests */}
          <div>
            <Label>Interests (Select all that apply)</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {interestOptions.map(interest => (
                <Badge
                  key={interest}
                  variant={formData.interests.includes(interest) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleInterestToggle(interest)}
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I agree to the terms and conditions and allow other verified users to contact me via WhatsApp
              </Label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Connect on WhatsApp</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default WhatsAppNumberCollection;
