import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Heart, Mail, Lock, User, MapPin, Calendar, ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

// Lazy load heavy components to reduce initial bundle size
const SecureTextarea = lazy(() => import("@/components/ui/SecureTextarea").then(mod => ({ default: mod.SecureTextarea })));
const AppLogo = lazy(() => import("@/components/AppLogo").then(mod => ({ default: mod.default })));
const LaunchBanner = lazy(() => import("@/components/ui/LaunchBanner").then(mod => ({ default: mod.default })));

// Lazy load data
const FIRST_DATE_IDEAS = lazy(() => import("@/data/firstDateIdeas").then(mod => ({ default: mod.FIRST_DATE_IDEAS })));
const COUNTRIES_WITH_CODES = lazy(() => import("@/data/countries").then(mod => ({ default: mod.COUNTRIES_WITH_CODES })));
const ALL_COUNTRIES = lazy(() => import("@/data/countries").then(mod => ({ default: mod.ALL_COUNTRIES })));

const COUNTRY_CODES = []; // Will be loaded when needed
const COUNTRIES = []; // Will be loaded when needed

// Test account for local development
const TEST_EMAIL = import.meta.env.VITE_TEST_EMAIL || "test@2dateme.demo";
const TEST_PASSWORD = import.meta.env.VITE_TEST_PASSWORD || "TestPass123";

const LANDING_BG_URL = (import.meta.env.VITE_LANDING_BG_URL as string | undefined) || "https://ik.imagekit.io/7grri5v7d/uytg.png";
const LANDING_BG_URL_VERSION = (import.meta.env.VITE_LANDING_BG_URL_VERSION as string | undefined) || "v2";

const isoToFlag = (iso: string) =>
  iso.toUpperCase().replace(/./g, (c) =>
    String.fromCharCode(0x1f1e6 + (c.charCodeAt(0) - 65))
  );

const AuthPageOptimized = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    gender: "",
    country: "",
    countryPrefix: "+62",
    phone: "",
    bio: "",
    interests: [] as string[],
    dateIdeas: [] as string[],
    whatsapp_number: "",
    agreeToTerms: false,
    agreeToPrivacy: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("signup");
  const [currentStep, setCurrentStep] = useState(1);
  const [showDailyMatch, setShowDailyMatch] = useState(false);
  const [selectedDateIdea, setSelectedDateIdea] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationMethod, setVerificationMethod] = useState<"email" | "whatsapp">("email");

  const location = useLocation();
  const navigate = useNavigate();

  // Load countries data when needed
  const [countriesData, setCountriesData] = useState<any>({});
  
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const countriesModule = await import("@/data/countries");
        setCountriesData({
          COUNTRIES_WITH_CODES: countriesModule.COUNTRIES_WITH_CODES,
          ALL_COUNTRIES: countriesModule.ALL_COUNTRIES
        });
      } catch (error) {
        console.error('Failed to load countries data:', error);
      }
    };
    loadCountries();
  }, []);

  // Simplified WhatsApp collection
  const handleWhatsAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.whatsapp_number) {
      alert('Please fill in your name and WhatsApp number');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create WhatsApp lead
      const leadData = {
        name: formData.name,
        phone: formData.phone || formData.whatsapp_number,
        whatsapp_number: formData.whatsapp_number,
        email: formData.email,
        location: formData.country,
        bio: formData.bio,
        interests: formData.interests,
        language: 'en',
        age_range: formData.age,
        gender: formData.gender,
        source: 'app_signup',
        profile_completion: 75,
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

      alert('WhatsApp number submitted successfully!');
      
    } catch (error) {
      console.error('Error submitting WhatsApp number:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | string[] | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCountryChange = (country: string) => {
    const prefix = countriesData.COUNTRIES_WITH_CODES?.find((c: any) => c.name === country)?.phoneCode || "+62";
    setFormData(prev => ({
      ...prev,
      country,
      countryPrefix: prefix
    }));
  };

  const handleDateIdeaSelect = (idea: string) => {
    if (formData.dateIdeas.includes(idea)) {
      handleInputChange("dateIdeas", formData.dateIdeas.filter(i => i !== idea));
    } else if (formData.dateIdeas.length < 3) {
      handleInputChange("dateIdeas", [...formData.dateIdeas, idea]);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;
      navigate("/home");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            age: formData.age,
            gender: formData.gender,
            country: formData.country,
            phone: formData.phone,
            bio: formData.bio,
            interests: formData.interests,
            dateIdeas: formData.dateIdeas,
          },
        },
      });
      if (error) throw error;
      alert("Account created! Please check your email to verify.");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${LANDING_BG_URL}?${LANDING_BG_URL_VERSION})` }}
      />
      
      {/* Launch Banner */}
      <Suspense fallback={<div />}>
        <LaunchBanner />
      </Suspense>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Suspense fallback={<div className="text-2xl font-bold text-pink-600">2DateMe</div>}>
                <AppLogo />
              </Suspense>
              <nav className="hidden md:flex space-x-8">
                <a href="#features" className="text-gray-700 hover:text-pink-600 font-medium">Features</a>
                <a href="#how-it-works" className="text-gray-700 hover:text-pink-600 font-medium">How It Works</a>
                <a href="#success-stories" className="text-gray-700 hover:text-pink-600 font-medium">Success Stories</a>
                <a href="#pricing" className="text-gray-700 hover:text-pink-600 font-medium">Pricing</a>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Find Your Perfect Match with <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">WhatsApp</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Join thousands of singles in Indonesia who found love through our secure WhatsApp dating platform. 
                No fake profiles, just real connections.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-8 py-3"
                  onClick={() => setActiveTab("signup")}
                >
                  Start Dating Now
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-pink-600 text-pink-600 hover:bg-pink-50 px-8 py-3"
                  onClick={() => setActiveTab("login")}
                >
                  Login
                </Button>
              </div>
            </div>

            {/* WhatsApp Collection Form */}
            <div className="max-w-md mx-auto">
              <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect on WhatsApp</h2>
                  <p className="text-gray-600">Share your WhatsApp number to start matching</p>
                </div>

                <form onSubmit={handleWhatsAppSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country" className="text-sm font-medium text-gray-700">Country</Label>
                      <Select value={formData.country} onValueChange={handleCountryChange}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countriesData.ALL_COUNTRIES?.map((country: any) => (
                            <SelectItem key={country.code} value={country.name}>
                              <div className="flex items-center">
                                <span className="mr-2">{isoToFlag(country.code)}</span>
                                {country.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="whatsapp_number" className="text-sm font-medium text-gray-700">WhatsApp Number *</Label>
                      <div className="flex mt-1">
                        <div className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                          <span className="text-gray-500 text-sm">{formData.countryPrefix}</span>
                        </div>
                        <Input
                          id="whatsapp_number"
                          type="tel"
                          placeholder="812-3456-7890"
                          value={formData.whatsapp_number}
                          onChange={(e) => handleInputChange("whatsapp_number", e.target.value)}
                          className="rounded-l-none"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio" className="text-sm font-medium text-gray-700">About You (Optional)</Label>
                    <Suspense fallback={<textarea className="mt-1 w-full p-2 border border-gray-300 rounded-md" />}>
                      <SecureTextarea
                        id="bio"
                        placeholder="Tell us about yourself..."
                        value={formData.bio}
                        onChange={(e) => handleInputChange("bio", e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </Suspense>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Interests (Optional)</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {["Dating", "Friendship", "Serious Relationship", "Casual Chat"].map((interest) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => handleInputChange("interests", 
                            formData.interests.includes(interest) 
                              ? formData.interests.filter(i => i !== interest)
                              : [...formData.interests, interest]
                          )}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            formData.interests.includes(interest)
                              ? "bg-pink-600 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={formData.agreeToTerms}
                      onChange={(e) => handleInputChange("agreeToTerms", e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="terms" className="text-sm text-gray-600">
                      I agree to the terms and conditions
                    </Label>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Connect on WhatsApp"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthPageOptimized;
