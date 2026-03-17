import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Users, Activity } from "lucide-react";
import { Button } from "@/shared/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface OnlineUser {
  id: string;
  name: string;
  country: string;
  city: string;
  last_seen_at: string;
  avatar_url?: string;
  age?: number;
  gender?: string;
  is_active: boolean;
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

const WorldMapDashboard = () => {
  console.log('🗺️ WorldMapDashboard component loading...');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
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
          last_seen_at,
          avatar_url,
          age,
          gender,
          is_active,
          created_at
        `)
        .gte("last_seen_at", fiveMinutesAgo.toISOString())
        .eq("is_active", true)
        .order("last_seen_at", { ascending: false });

      if (error) throw error;

      const usersWithSession = (data || []).map(user => ({
        ...user,
        session_start: user.created_at,
        current_page: 'home'
      }));

      setOnlineUsers(usersWithSession);
    } catch (error) {
      console.error("Error fetching online users:", error);
      toast.error("Failed to load online users");
    } finally {
      setLoading(false);
    }
  };

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(fetchOnlineUsers, 30000);
    fetchOnlineUsers();

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  // Group users by country
  const countryStats = onlineUsers.reduce((acc, user) => {
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
  }, {} as Record<string, any>);

  const totalUsers = onlineUsers.length;
  const totalCountries = Object.keys(countryStats).length;
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
          {/* Map Placeholder */}
          <div className="lg:col-span-2">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Interactive World Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] w-full rounded-lg bg-gradient-to-br from-blue-900/20 to-green-900/20 border-2 border-dashed border-white/20 flex items-center justify-center">
                  <div className="text-center">
                    <Globe className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">World Map Coming Soon</h3>
                    <p className="text-white/70 mb-4">
                      Interactive map with real-time user locations will be displayed here
                    </p>
                    <div className="text-sm text-white/50">
                      Currently showing {totalUsers} users from {totalCountries} countries
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
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
                  {Object.values(countryStats)
                    .sort((a: any, b: any) => b.count - a.count)
                    .slice(0, 8)
                    .map((stat: any, index: number) => (
                      <motion.div
                        key={stat.country}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
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
