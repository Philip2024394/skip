import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const AuthPageMinimal = () => {
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
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string | string[] | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim() || !formData.whatsapp_number.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (!formData.agreeToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);

    try {
      // Calculate profile completion
      const completionFields = [
        formData.name, formData.phone, formData.whatsapp_number,
        formData.email, formData.location, formData.bio,
        formData.interests.length > 0, formData.age_range, formData.gender
      ];
      const completionScore = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

      // Create WhatsApp lead
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
        source: 'app_signup',
        profile_completion: completionScore,
        verified: false,
        whatsapp_verified: false,
        status: 'pending'
      };

      const { data, error } = await (supabase as any)
        .from('whatsapp_leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;

      setSubmitted(true);
      
      // Log analytics event
      await (supabase as any)
        .from('whatsapp_analytics')
        .insert([{
          event_type: 'whatsapp_number_collected',
          user_id: data.id,
          metadata: {
            source: leadData.source,
            profile_completion: completionScore,
            interests_count: formData.interests.length
          },
          timestamp: new Date().toISOString()
        }]);

    } catch (error) {
      console.error('Error submitting WhatsApp number:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h1>
          <p className="text-gray-600 mb-6">Your WhatsApp number has been submitted successfully. We'll verify it shortly.</p>
          <Button onClick={() => navigate('/')} className="w-full">
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Connect on WhatsApp</h1>
            <p className="text-gray-600">Share your WhatsApp number to connect with others</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
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

            <div>
              <Label htmlFor="bio">Bio (Optional)</Label>
              <textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={formData.agreeToTerms}
                onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="terms" className="text-sm">
                I agree to the terms and conditions and allow other verified users to contact me via WhatsApp
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                'Connect on WhatsApp'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPageMinimal;
