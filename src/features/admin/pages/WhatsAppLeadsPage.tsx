import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Globe, Calendar, Search, Filter, Download } from "lucide-react";
import { Button } from "@/shared/components/button";
import { Input } from "@/shared/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/card";
import { Badge } from "@/shared/components/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface WhatsAppLead {
  id: string;
  whatsapp_e164: string;
  country_prefix: string;
  national_number: string;
  source: string;
  last_seen_at: string;
  created_at: string;
}

const COUNTRY_FLAGS: Record<string, string> = {
  '+1': '🇺🇸',
  '+44': '🇬🇧',
  '+91': '🇮🇳',
  '+62': '🇮🇩',
  '+61': '🇦🇺',
  '+81': '🇯🇵',
  '+86': '🇨🇳',
  '+49': '🇩🇪',
  '+33': '🇫🇷',
  '+39': '🇮🇹',
  '+7': '🇷🇺',
  '+55': '🇧🇷',
  '+52': '🇲🇽',
  '+27': '🇿🇦',
  '+82': '🇰🇷',
  '+94': '🇱🇰',
  '+66': '🇹🇭',
  '+65': '🇸🇬',
  '+60': '🇲🇾',
  '+234': '🇳🇬',
};

const getCountryFlag = (prefix: string) => {
  return COUNTRY_FLAGS[prefix] || '🌍';
};

const formatWhatsAppNumber = (e164: string) => {
  // Format: +1 234-567-8901
  if (e164.startsWith('+1')) {
    const digits = e164.substring(2);
    return `+1 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  }
  // For other countries, just return the E164 format
  return e164;
};

export default function WhatsAppLeadsPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<WhatsAppLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_leads")
        .select("*")
        .order("first_seen_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error fetching WhatsApp leads:", error);
      toast.error("Failed to load WhatsApp leads");
    } finally {
      setLoading(false);
    }
  };

  // Group leads by country
  const leadsByCountry = leads.reduce((acc, lead) => {
    const country = lead.country_prefix;
    if (!acc[country]) {
      acc[country] = [];
    }
    acc[country].push(lead);
    return acc;
  }, {} as Record<string, WhatsAppLead[]>);

  // Filter leads based on search and filters
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchTerm === "" ||
      lead.whatsapp_e164.includes(searchTerm) ||
      lead.national_number.includes(searchTerm);

    const matchesCountry = selectedCountry === "all" || lead.country_prefix === selectedCountry;
    const matchesSource = selectedSource === "all" || lead.source === selectedSource;

    return matchesSearch && matchesCountry && matchesSource;
  });

  // Get unique countries for filter
  const uniqueCountries = Array.from(new Set(leads.map(lead => lead.country_prefix)));
  const uniqueSources = Array.from(new Set(leads.map(lead => lead.source)));

  const exportToCSV = () => {
    const csv = [
      ['WhatsApp Number', 'Country', 'National Number', 'Source', 'Last Seen', 'Created At'],
      ...filteredLeads.map(lead => [
        lead.whatsapp_e164,
        lead.country_prefix,
        lead.national_number,
        lead.source,
        lead.last_seen_at,
        lead.created_at
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp_leads_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading WhatsApp leads...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/admin")}
              className="text-white/70 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Users className="w-8 h-8 text-green-500" />
                WhatsApp Leads
              </h1>
              <p className="text-white/70 mt-1">Users who signed up with WhatsApp by country</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-green-500">{leads.length}</div>
              <div className="text-white/70 text-sm">Total Leads</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-500">{uniqueCountries.length}</div>
              <div className="text-white/70 text-sm">Countries</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                  <Input
                    placeholder="Search WhatsApp number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/5 border-white/10 text-white pl-10"
                  />
                </div>
              </div>

              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white w-[150px]">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/20">
                  <SelectItem value="all">All Countries</SelectItem>
                  {uniqueCountries.map(country => (
                    <SelectItem key={country} value={country}>
                      {getCountryFlag(country)} {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white w-[150px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/20">
                  <SelectItem value="all">All Sources</SelectItem>
                  {uniqueSources.map(source => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Leads by Country */}
        <div className="space-y-6">
          {Object.entries(leadsByCountry)
            .filter(([country]) => selectedCountry === "all" || country === selectedCountry)
            .map(([country, countryLeads]) => (
              <Card key={country} className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getCountryFlag(country)}</span>
                      <span>{country}</span>
                      <Badge variant="secondary" className="bg-white/10 text-white">
                        {countryLeads.length} leads
                      </Badge>
                    </div>
                    <div className="text-white/70 text-sm">
                      Last seen: {formatDistanceToNow(new Date(Math.max(...countryLeads.map(l => new Date(l.last_seen_at).getTime()))), { addSuffix: true })}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {countryLeads
                      .filter(lead =>
                        searchTerm === "" ||
                        lead.whatsapp_e164.includes(searchTerm) ||
                        lead.national_number.includes(searchTerm)
                      )
                      .filter(lead => selectedSource === "all" || lead.source === selectedSource)
                      .map(lead => (
                        <motion.div
                          key={lead.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                              <span className="text-green-500 text-xs">📱</span>
                            </div>
                            <div>
                              <div className="font-medium">{formatWhatsAppNumber(lead.whatsapp_e164)}</div>
                              <div className="text-white/50 text-sm">
                                National: {lead.national_number} • Source: {lead.source}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white/70 text-sm">
                              {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                            </div>
                            <div className="text-white/50 text-xs">
                              {formatDistanceToNow(new Date(lead.last_seen_at), { addSuffix: true })}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <div className="text-white/50">No WhatsApp leads found matching your filters</div>
          </div>
        )}
      </div>
    </div>
  );
}
