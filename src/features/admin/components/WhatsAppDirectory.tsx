import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Users, Globe, Phone, Calendar, MessageCircle } from "lucide-react";

const openWhatsApp = (number: string) => {
  const cleaned = number.replace(/\D/g, "");
  window.open(`https://wa.me/${cleaned}`, "_blank");
};

interface WhatsAppEntry {
  id: string;
  whatsapp_number: string;
  country: string;
  created_at: string;
  name?: string;
  email?: string;
}

export default function WhatsAppDirectory() {
  const [entries, setEntries] = useState<WhatsAppEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      // Try database first
      const { data, error } = await (supabase as any)
        .from('whatsapp_signups')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setEntries(data as WhatsAppEntry[]);
      } else {
        throw error;
      }
    } catch (error) {
      console.log('Database error, using localStorage fallback');
      // Fallback to localStorage
      const localEntries = JSON.parse(localStorage.getItem('whatsapp_signups') || '[]');
      setEntries(localEntries);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.whatsapp_number.includes(searchTerm) ||
      (entry.name && entry.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.email && entry.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCountry = selectedCountry === "all" || entry.country === selectedCountry;
    return matchesSearch && matchesCountry;
  });

  const countries = [...new Set(entries.map(entry => entry.country))].sort();

  const entriesByCountry = countries.reduce((acc, country) => {
    acc[country] = filteredEntries.filter(entry => entry.country === country);
    return acc;
  }, {} as Record<string, WhatsAppEntry[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          {/* Loading Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-green-400/20 rounded-lg animate-pulse" />
              <div className="h-10 w-48 bg-white/10 rounded-lg animate-pulse" />
            </div>
            <div className="h-4 w-64 bg-white/5 rounded-lg animate-pulse" />
          </div>

          {/* Loading Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 bg-white/20 rounded-lg animate-pulse" />
                  <div className="h-5 w-24 bg-white/10 rounded-lg animate-pulse" />
                </div>
                <div className="h-8 w-16 bg-white/20 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>

          {/* Loading Countries */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
              <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-white/70">Loading WhatsApp directory...</span>
            </div>
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
            <Phone className="w-8 h-8 text-green-400" />
            WhatsApp Directory
          </h1>
          <p className="text-white/70">Early bird signups organized by country</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-semibold">Total Signups</h3>
            </div>
            <p className="text-3xl font-bold text-white">{entries.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-semibold">Countries</h3>
            </div>
            <p className="text-3xl font-bold text-white">{countries.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-purple-400" />
              <h3 className="text-xl font-semibold">Today</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {entries.filter(entry => {
                const today = new Date().toDateString();
                return new Date(entry.created_at).toDateString() === today;
              }).length}
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by number, name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/30 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-blue-400/50"
                />
              </div>
            </div>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-400/50"
            >
              <option value="all">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Directory by Country */}
        <div className="space-y-8">
          {Object.entries(entriesByCountry).map(([country, countryEntries]) => (
            <div key={country} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Globe className="w-6 h-6 text-green-400" />
                {country} ({countryEntries.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {countryEntries.map(entry => (
                  <div
                    key={entry.id}
                    onClick={() => openWhatsApp(entry.whatsapp_number)}
                    className="bg-black/30 rounded-lg p-4 border border-white/10 cursor-pointer hover:border-green-400/50 hover:bg-green-900/20 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-green-400 group-hover:text-green-300 transition-colors">
                            {entry.whatsapp_number}
                          </p>
                          <MessageCircle className="w-3.5 h-3.5 text-green-400/50 group-hover:text-green-300 transition-colors" />
                        </div>
                        {entry.name && (
                          <p className="text-white/70 text-sm">{entry.name}</p>
                        )}
                        {entry.email && (
                          <p className="text-white/50 text-xs">{entry.email}</p>
                        )}
                        <p className="text-white/40 text-xs mt-1">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/50">No entries found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};
