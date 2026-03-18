import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Globe, User, Mail, CheckCircle } from "lucide-react";

export default function WhatsAppSignup() {
  const [formData, setFormData] = useState({
    whatsapp_number: "",
    country: "",
    name: "",
    email: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const countries = [
    "United States", "United Kingdom", "Canada", "Australia", "India",
    "Germany", "France", "Italy", "Spain", "Netherlands", "Brazil",
    "Mexico", "Argentina", "Japan", "South Korea", "China", "Singapore",
    "Malaysia", "Indonesia", "Thailand", "Philippines", "Vietnam",
    "South Africa", "Egypt", "Nigeria", "Kenya", "United Arab Emirates",
    "Saudi Arabia", "Israel", "Turkey", "Russia", "Poland", "Sweden",
    "Norway", "Denmark", "Finland", "Belgium", "Switzerland", "Austria"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Try database first, fallback to localStorage
      try {
        const { error } = await supabase
          .from('whatsapp_signups')
          .insert({
            whatsapp_number: formData.whatsapp_number,
            country: formData.country,
            name: formData.name || null,
            email: formData.email || null,
          });

        if (error) throw error;
      } catch (dbError) {
        console.log('Database error, using localStorage fallback');
        // Fallback to localStorage
        const signups = JSON.parse(localStorage.getItem('whatsapp_signups') || '[]');
        signups.push({
          id: `local_${Date.now()}`,
          whatsapp_number: formData.whatsapp_number,
          country: formData.country,
          name: formData.name || null,
          email: formData.email || null,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem('whatsapp_signups', JSON.stringify(signups));
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting WhatsApp signup:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === "name"
      ? e.target.value.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ]/g, "")
      : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-gradient-to-br from-green-900/90 via-black/90 to-emerald-900/90 rounded-3xl border-2 border-green-400/30 p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-4">You're on the list!</h2>
            <p className="text-white/80 mb-2">
              Thank you for your interest! We'll notify you as soon as we launch.
            </p>
            <p className="text-white/60 text-sm">
              Launch date: March 25th, 2026
            </p>
            <div className="mt-6 p-4 bg-white/5 rounded-xl">
              <p className="text-green-400 text-sm">
                🎁 Early access benefits and exclusive features await!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gradient-to-br from-purple-900/90 via-black/90 to-pink-900/90 rounded-3xl border-2 border-purple-400/30 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Get Early Access</h1>
            <p className="text-white/70">
              Be the first to experience the most advanced dating app ever
            </p>
            <div className="mt-4 p-3 bg-purple-500/20 rounded-xl border border-purple-400/30">
              <p className="text-purple-300 text-sm font-medium">
                🚀 Launching March 25th, 2026
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* WhatsApp Number (Required) */}
            <div>
              <label className="flex items-center gap-2 text-white/70 text-sm mb-2">
                <Phone className="w-4 h-4" />
                WhatsApp Number *
              </label>
              <input
                type="tel"
                name="whatsapp_number"
                value={formData.whatsapp_number}
                onChange={handleChange}
                placeholder="+1234567890"
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-purple-400/50"
              />
            </div>

            {/* Country (Required) */}
            <div>
              <label className="flex items-center gap-2 text-white/70 text-sm mb-2">
                <Globe className="w-4 h-4" />
                Country *
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-400/50"
              >
                <option value="">Select your country</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            {/* Name (Optional) */}
            <div>
              <label className="flex items-center gap-2 text-white/70 text-sm mb-2">
                <User className="w-4 h-4" />
                Name (Optional)
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="First name only"
                maxLength={30}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-purple-400/50"
              />
            </div>

            {/* Email (Optional) */}
            <div>
              <label className="flex items-center gap-2 text-white/70 text-sm mb-2">
                <Mail className="w-4 h-4" />
                Email (Optional)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-purple-400/50"
              />
            </div>

            {/* Privacy Notice */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-white/60 text-xs text-center">
                By signing up, you agree to be notified about our launch. Your information will be kept secure and will never be shared with third parties.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? "Submitting..." : "Get Early Access"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
