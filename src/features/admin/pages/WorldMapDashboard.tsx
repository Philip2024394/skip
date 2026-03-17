import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Users, MapPin, Activity, Eye, Filter, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/shared/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/card";
import { Badge } from "@/shared/components/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

// Import Leaflet for map
import L from "leaflet";
import "leaflet/dist/leaflet.css?inline";

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface OnlineUser {
  id: string;
  name: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  last_seen_at: string;
  avatar_url?: string;
  age?: number;
  gender?: string;
  is_active: boolean;
  session_start?: string;
  current_page?: string;
}

interface CountryStats {
  country: string;
  count: number;
  cities: string[];
  users: OnlineUser[];
}

const COUNTRY_FLAGS: Record<string, string> = {
  'United States': '🇺🇸',
  'United Kingdom': '🇬🇧',
  'India': '🇮🇳',
  'Indonesia': '🇮🇩',
  'Australia': '🇦🇺',
  'Japan': '🇯🇵',
  'China': '🇨🇳',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'Italy': '🇮🇹',
  'Russia': '🇷🇺',
  'Brazil': '🇧🇷',
  'Mexico': '🇲🇽',
  'South Africa': '🇿🇦',
  'South Korea': '🇰🇷',
  'Sri Lanka': '🇱🇰',
  'Thailand': '🇹🇭',
  'Singapore': '🇸🇬',
  'Malaysia': '🇲🇾',
  'Nigeria': '🇳🇬',
  'Canada': '🇨🇦',
  'Spain': '🇪🇸',
  'Netherlands': '🇳🇱',
  'Turkey': '🇹🇷',
  'Saudi Arabia': '🇸🇦',
  'Egypt': '🇪🇬',
  'Kenya': '🇰🇪',
  'Argentina': '🇦🇷',
  'Chile': '🇨🇱',
  'Peru': '🇵🇪',
  'Colombia': '🇨🇴',
  'Venezuela': '🇻🇪',
  'Philippines': '🇵🇭',
  'Vietnam': '🇻🇳',
  'Pakistan': '🇵🇰',
  'Bangladesh': '🇧🇩',
  'Poland': '🇵🇱',
  'Ukraine': '🇺🇦',
  'Romania': '🇷🇴',
  'Czech Republic': '🇨🇿',
  'Hungary': '🇭🇺',
  'Greece': '🇬🇷',
  'Portugal': '🇵🇹',
  'Sweden': '🇸🇪',
  'Norway': '🇳🇴',
  'Denmark': '🇩🇰',
  'Finland': '🇫🇮',
  'Austria': '🇦🇹',
  'Switzerland': '🇨🇭',
  'Belgium': '🇧🇪',
  'Ireland': '🇮🇪',
  'New Zealand': '🇳🇿',
  'Israel': '🇮🇱',
  'UAE': '🇦🇪',
  'Qatar': '🇶🇦',
  'Kuwait': '🇰🇼',
  'Morocco': '🇲🇦',
  'Tunisia': '🇹🇳',
  'Ghana': '🇬🇭',
  'Uganda': '🇺🇬',
  'Tanzania': '🇹🇿',
  'Zambia': '🇿🇲',
  'Zimbabwe': '🇿🇼',
  'Botswana': '🇧🇼',
  'Namibia': '🇳🇦',
  'Mozambique': '🇲🇿',
  'Angola': '🇦🇴',
  'Ethiopia': '🇪🇹',
  'Rwanda': '🇷🇼',
  'Burundi': '🇧🇮',
  'Mali': '🇲🇱',
  'Senegal': '🇸🇳',
  'Ivory Coast': '🇨🇮',
  'Cameroon': '🇨🇲',
  'Gabon': '🇬🇦',
  'Congo': '🇨🇬',
  'DRC': '🇨🇩',
  'Somalia': '🇸🇴',
  'Sudan': '🇸🇩',
  'Libya': '🇱🇾',
  'Algeria': '🇩🇿',
  'Jordan': '🇯🇴',
  'Lebanon': '🇱🇧',
  'Syria': '🇸🇾',
  'Iraq': '🇮🇶',
  'Iran': '🇮🇷',
  'Afghanistan': '🇦🇫',
  'Nepal': '🇳🇵',
  'Bhutan': '🇧🇹',
  'Myanmar': '🇲🇲',
  'Laos': '🇱🇦',
  'Cambodia': '🇰🇭',
  'Mongolia': '🇲🇳',
  'Kazakhstan': '🇰🇿',
  'Uzbekistan': '🇺🇿',
  'Turkmenistan': '🇹🇲',
  'Kyrgyzstan': '🇰🇬',
  'Tajikistan': '🇹🇯',
  'Sri Lanka': '🇱🇰',
  'Maldives': '🇲🇻',
  'Fiji': '🇫🇯',
  'Papua New Guinea': '🇵🇬',
  'Solomon Islands': '🇸🇧',
  'Vanuatu': '🇻🇺',
  'Samoa': '🇼🇸',
  'Tonga': '🇹🇴',
  'Kiribati': '🇰🇮',
  'Tuvalu': '🇹🇻',
  'Nauru': '🇳🇷',
  'Palau': '🇵🇼',
  'Marshall Islands': '🇲🇭',
  'Micronesia': '🇫🇲',
};

const getCountryFlag = (country: string) => {
  return COUNTRY_FLAGS[country] || '🌍';
};

const createCustomIcon = (user: OnlineUser) => {
  const genderColor = user.gender === 'male' ? '#3B82F6' : user.gender === 'female' ? '#EC4899' : '#10B981';
  const isActive = user.is_active;

  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 24px;
          height: 24px;
          background: ${genderColor};
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: white;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ${isActive ? 'animation: pulse 2s infinite;' : ''}
        ">
          ${user.gender === 'male' ? '👨' : user.gender === 'female' ? '👩' : '👤'}
        </div>
        ${isActive ? `
          <div style="
            position: absolute;
            top: 0;
            right: 0;
            width: 8px;
            height: 8px;
            background: #10B981;
            border: 2px solid white;
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>
        ` : ''}
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      </style>
    `,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const WorldMapDashboard = () => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<OnlineUser | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [markers, setMarkers] = useState<L.Marker[]>([]);
  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  // Fetch online users
  const fetchOnlineUsers = async () => {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          country,
          city,
          latitude,
          longitude,
          last_seen_at,
          avatar_url,
          age,
          gender,
          is_active,
          created_at
        `)
        .gte("last_seen_at", fiveMinutesAgo.toISOString())
        .eq("is_active", true)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("last_seen_at", { ascending: false });

      if (error) throw error;

      const usersWithSession = (data || []).map(user => ({
        ...user,
        session_start: user.created_at,
        current_page: 'home' // This would come from real session tracking
      }));

      setOnlineUsers(usersWithSession);
    } catch (error) {
      console.error("Error fetching online users:", error);
      toast.error("Failed to load online users");
    } finally {
      setLoading(false);
    }
  };

  // Initialize map
  useEffect(() => {
    if (mapContainer && !map) {
      const leafletMap = L.map(mapContainer).setView([20, 0], 2);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(leafletMap);

      setMap(leafletMap);
    }
  }, [mapContainer]);

  // Update markers when users change
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    setMarkers([]);

    // Add new markers
    const newMarkers = onlineUsers
      .filter(user => selectedCountry === "all" || user.country === selectedCountry)
      .map(user => {
        const marker = L.marker([user.latitude, user.longitude], {
          icon: createCustomIcon(user)
        }).addTo(map);

        // Create popup content
        const popupContent = `
          <div style="
            min-width: 200px;
            padding: 8px;
            font-family: system-ui;
          ">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <img src="${user.avatar_url || '/default-avatar.png'}" 
                   style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" 
                   alt="${user.name}" />
              <div>
                <div style="font-weight: bold; color: #333;">${user.name}</div>
                <div style="font-size: 12px; color: #666;">${user.age} • ${user.gender}</div>
              </div>
            </div>
            <div style="margin-bottom: 4px;">
              <strong>📍 ${user.city}, ${user.country}</strong>
            </div>
            <div style="font-size: 11px; color: #666;">
              🟢 Active ${formatDistanceToNow(new Date(user.last_seen_at), { addSuffix: true })}
            </div>
            <div style="font-size: 11px; color: #666;">
              🌐 Currently on ${user.current_page}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);

        // Add click event
        marker.on('click', () => {
          setSelectedUser(user);
        });

        return marker;
      });

    setMarkers(newMarkers);

    // Fit map to show all markers
    if (newMarkers.length > 0) {
      const group = new L.FeatureGroup(newMarkers);
      map.fitBounds(group.getBounds().pad(0.1));
    }

  }, [map, onlineUsers, selectedCountry]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(fetchOnlineUsers, 30000); // Update every 30 seconds
    fetchOnlineUsers(); // Initial fetch

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  // Group users by country
  const countryStats = useMemo(() => {
    const stats = onlineUsers.reduce((acc, user) => {
      if (!acc[user.country]) {
        acc[user.country] = {
          country: user.country,
          count: 0,
          cities: [],
          users: []
        };
      }
      acc[user.country].count++;
      if (!acc[user.country].cities.includes(user.city)) {
        acc[user.country].cities.push(user.city);
      }
      acc[user.country].users.push(user);
      return acc;
    }, {} as Record<string, CountryStats>);

    return Object.values(stats).sort((a, b) => b.count - a.count);
  }, [onlineUsers]);

  const totalUsers = onlineUsers.length;
  const totalCountries = countryStats.length;
  const totalCities = new Set(onlineUsers.map(u => u.city)).size;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading world map...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="text-white/70 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Globe className="w-8 h-8 text-blue-500" />
                World Map - Live Users
              </h1>
              <p className="text-white/70 mt-1">Real-time visualization of online users worldwide</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">{totalUsers}</div>
              <div className="text-white/70 text-sm">Online Now</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{totalCountries}</div>
              <div className="text-white/70 text-sm">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{totalCities}</div>
              <div className="text-white/70 text-sm">Cities</div>
            </div>
            <Button
              onClick={() => setRealTimeEnabled(!realTimeEnabled)}
              variant={realTimeEnabled ? "default" : "outline"}
              className={realTimeEnabled ? "bg-green-600 hover:bg-green-700" : "bg-white/10 hover:bg-white/20"}
            >
              <Activity className="w-4 h-4 mr-2" />
              {realTimeEnabled ? "Live" : "Paused"}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Interactive World Map</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white w-[150px]">
                        <SelectValue placeholder="Filter by country" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-white/20">
                        <SelectItem value="all">All Countries</SelectItem>
                        {countryStats.map(stat => (
                          <SelectItem key={stat.country} value={stat.country}>
                            {getCountryFlag(stat.country)} {stat.country} ({stat.count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => map?.invalidateSize()}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div
                  ref={setMapContainer}
                  className="h-[500px] w-full rounded-b-lg"
                  style={{ minHeight: '500px' }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Selected User Details */}
            {selectedUser && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-500" />
                    Selected User
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedUser.avatar_url || '/default-avatar.png'}
                        alt={selectedUser.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-semibold">{selectedUser.name}</div>
                        <div className="text-white/70 text-sm">
                          {selectedUser.age} • {selectedUser.gender}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span className="text-sm">
                          {selectedUser.city}, {selectedUser.country}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-green-500" />
                        <span className="text-sm">
                          Active {formatDistanceToNow(new Date(selectedUser.last_seen_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">
                          {selectedUser.latitude.toFixed(4)}, {selectedUser.longitude.toFixed(4)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10">
                      <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                        🟢 Currently Online
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Country Statistics */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  Top Countries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {countryStats.slice(0, 8).map((stat, index) => (
                    <motion.div
                      key={stat.country}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => setSelectedCountry(stat.country)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCountryFlag(stat.country)}</span>
                        <div>
                          <div className="font-medium text-sm">{stat.country}</div>
                          <div className="text-white/50 text-xs">
                            {stat.cities.length} cities
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-400">{stat.count}</div>
                        <div className="text-white/50 text-xs">users</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Live Activity Feed */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {onlineUsers.slice(0, 5).map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-2 p-2 bg-white/5 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{user.name}</div>
                        <div className="text-white/50 text-xs">
                          {user.city} • {formatDistanceToNow(new Date(user.last_seen_at), { addSuffix: true })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldMapDashboard;
