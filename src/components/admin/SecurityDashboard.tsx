import { useState, useEffect } from "react";
import { Shield, AlertTriangle, Users, Eye, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import securityFilter from "@/lib/securityFilter";

interface SecurityViolation {
  id: string;
  user_id: string;
  original_text: string;
  violations: Array<{
    type: string;
    content: string;
    severity: string;
  }>;
  context: string;
  timestamp: string;
  user_agent: string;
  session_id: string;
}

interface SecurityStats {
  total_violations: number;
  unique_users: number;
  contexts_affected: number;
  by_type: Record<string, number>;
  by_context: Record<string, number>;
  top_users: Array<{ user_id: string; violation_count: number }>;
}

export default function SecurityDashboard() {
  const [violations, setViolations] = useState<SecurityViolation[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchSecurityData();
  }, [timeframe]);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      // Fetch recent violations
      const timeFilter = timeframe === '24h' ? 
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() :
        timeframe === '7d' ? 
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() :
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: violationsData, error: violationsError } = await supabase
        .from('security_violations')
        .select('*')
        .gte('timestamp', timeFilter)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (violationsError) throw violationsError;

      // Fetch analytics
      const analyticsData = await securityFilter.getSecurityStats(timeframe);
      
      setViolations(violationsData || []);
      setStats(analyticsData);
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-orange-400';
      case 'low': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getViolationIcon = (type: string) => {
    switch (type) {
      case 'link': return '🔗';
      case 'phone': return '📞';
      case 'disguised_phone': return '🎭';
      case 'platform': return '📱';
      case 'creative_disguise': return '🧩';
      default: return '⚠️';
    }
  };

  const getViolationTypeLabel = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-pulse">Loading security dashboard...</div>
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
            <Shield className="w-8 h-8 text-red-400" />
            Security Dashboard
          </h1>
          <p className="text-white/70">Monitor content filtering violations and user safety</p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-2 mb-8">
          {(['24h', '7d', '30d'] as const).map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? "default" : "outline"}
              onClick={() => setTimeframe(tf)}
              className={timeframe === tf ? "bg-red-600 hover:bg-red-700" : "bg-white/10 border-white/20 text-white hover:bg-white/20"}
            >
              {tf === '24h' ? 'Last 24 Hours' : tf === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </Button>
          ))}
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <h3 className="text-xl font-semibold">Total Violations</h3>
              </div>
              <p className="text-3xl font-bold text-white">{stats.total_violations}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 text-orange-400" />
                <h3 className="text-xl font-semibold">Unique Users</h3>
              </div>
              <p className="text-3xl font-bold text-white">{stats.unique_users}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Eye className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-semibold">Contexts Affected</h3>
              </div>
              <p className="text-3xl font-bold text-white">{stats.contexts_affected}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-semibold">Avg per User</h3>
              </div>
              <p className="text-3xl font-bold text-white">
                {stats.unique_users > 0 ? (stats.total_violations / stats.unique_users).toFixed(1) : '0'}
              </p>
            </div>
          </div>
        )}

        {/* Violations by Type */}
        {stats?.by_type && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-4">Violations by Type</h3>
              <div className="space-y-3">
                {Object.entries(stats.by_type).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getViolationIcon(type)}</span>
                      <span className="text-white/80">{getViolationTypeLabel(type)}</span>
                    </div>
                    <span className="text-white font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Violations by Context */}
            {stats.by_context && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold mb-4">Violations by Context</h3>
                <div className="space-y-3">
                  {Object.entries(stats.by_context).map(([context, count]) => (
                    <div key={context} className="flex items-center justify-between">
                      <span className="text-white/80 capitalize">{context.replace('_', ' ')}</span>
                      <span className="text-white font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Violations */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Recent Violations</h3>
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {violations.map((violation) => (
              <div key={violation.id} className="bg-black/30 rounded-lg p-4 border border-white/10">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-white/60" />
                    <span className="text-white/60 text-sm">
                      {new Date(violation.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-white/60 text-xs capitalize bg-white/10 px-2 py-1 rounded">
                    {violation.context.replace('_', ' ')}
                  </span>
                </div>

                <div className="mb-2">
                  <p className="text-white/80 text-sm line-clamp-2">
                    {violation.original_text}
                  </p>
                </div>

                {showDetails && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {violation.violations.map((v, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getSeverityColor(v.severity)} bg-current/10`}
                        >
                          <span>{getViolationIcon(v.type)}</span>
                          <span>{getViolationTypeLabel(v.type)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-white/40 text-xs">
                      User ID: {violation.user_id.slice(0, 8)}... | Session: {violation.session_id.slice(0, 8)}...
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
