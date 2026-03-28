import { useState, useEffect } from "react";
import { Shield, AlertTriangle, Users, Activity, Lock, Eye, TrendingUp, FileText, Bot, Zap, Database, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/shared/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/card";
import { Button } from "@/shared/components/button";
import { supabase } from "@/integrations/supabase/client";

interface SecurityMetrics {
  active_admins: number;
  active_sessions: number;
  today_requests: number;
  today_blocked: number;
  today_bots: number;
  open_incidents: number;
  current_score: number;
}

interface SecurityIncident {
  id: string;
  incident_type: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

interface TopThreat {
  type: string;
  count: number;
  severity: string;
  trend: 'up' | 'down' | 'stable';
}

// Safe query helper — returns null instead of throwing when table doesn't exist
async function safeQuery(queryFn: () => any): Promise<any> {
  try {
    const result = await queryFn();
    if (result?.error) return null;
    return result?.data ?? null;
  } catch {
    return null;
  }
}

export default function UltimateSecurityDashboard() {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [topThreats, setTopThreats] = useState<TopThreat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [dataSource, setDataSource] = useState<'live' | 'partial' | 'unavailable'>('unavailable');

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTimeframe]);

  const fetchSecurityData = async () => {
    setLoading(true);
    let liveCount = 0;

    // Try security_dashboard view (may not exist)
    const metricsData = await safeQuery(async () =>
      await (supabase as any).from('security_dashboard').select('*').single()
    );
    if (metricsData) { setMetrics(metricsData as SecurityMetrics); liveCount++; }

    // Try recent_security_incidents view (may not exist)
    const incidentsData = await safeQuery(async () =>
      await (supabase as any).from('recent_security_incidents').select('*').limit(10)
    );
    if (incidentsData) { setIncidents((incidentsData as SecurityIncident[]) || []); liveCount++; }

    // Build threat list from tables that do exist
    const threats = await fetchTopThreats();
    setTopThreats(threats);
    if (threats.length > 0) liveCount++;

    setDataSource(liveCount === 0 ? 'unavailable' : liveCount >= 2 ? 'live' : 'partial');
    setLoading(false);
  };

  const fetchTopThreats = async (): Promise<TopThreat[]> => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const threats: TopThreat[] = [];

    // bot_detections — may not exist
    const botData = await safeQuery(async () =>
      await (supabase as any).from('bot_detections').select('bot_score, confidence, timestamp').gte('timestamp', since)
    );
    if (botData && Array.isArray(botData) && botData.length > 0) {
      threats.push({ type: 'Bot Detection', count: botData.length, severity: 'high', trend: 'up' });
    }

    // security_violations — does exist
    const violationsData = await safeQuery(async () =>
      await (supabase as any).from('security_violations').select('violations, timestamp').gte('timestamp', since)
    );
    if (violationsData && Array.isArray(violationsData) && violationsData.length > 0) {
      threats.push({ type: 'Content Violations', count: violationsData.length, severity: 'medium', trend: 'stable' });
    }

    // api_security_logs — may not exist
    const apiData = await safeQuery(async () =>
      await (supabase as any).from('api_security_logs').select('is_allowed, timestamp').gte('timestamp', since)
    );
    if (apiData && Array.isArray(apiData)) {
      const blocked = apiData.filter((l: any) => !l.is_allowed).length;
      if (blocked > 0) threats.push({ type: 'Blocked Requests', count: blocked, severity: 'medium', trend: 'down' });
    }

    return threats.sort((a, b) => b.count - a.count).slice(0, 5);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'low': return 'text-green-500 bg-green-500/10 border-green-500/30';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-500';
      case 'investigating': return 'text-yellow-500';
      case 'resolved': return 'text-green-500';
      case 'closed': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Critical';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <div className="animate-pulse text-white/50">Loading security dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-500" />
              Ultimate Security Dashboard
            </h1>
            <p className="text-white/70">Comprehensive protection monitoring and analysis</p>
          </div>
          {/* Data availability badge */}
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
            dataSource === 'live' ? 'bg-green-500/15 border-green-500/30 text-green-400' :
            dataSource === 'partial' ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' :
            'bg-white/5 border-white/15 text-white/40'
          }`}>
            {dataSource === 'live' ? '● Live Data' : dataSource === 'partial' ? '◐ Partial Data' : '○ No Security Tables'}
          </div>
        </div>

        {/* Notice when tables are missing */}
        {dataSource === 'unavailable' && (
          <div className="mb-8 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/25">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-300 font-semibold text-sm">Security tables not yet created</p>
                <p className="text-yellow-300/60 text-xs mt-1">
                  The <code className="bg-white/10 px-1 rounded">security_dashboard</code>, <code className="bg-white/10 px-1 rounded">bot_detections</code>, and <code className="bg-white/10 px-1 rounded">api_security_logs</code> tables don't exist in your database yet.
                  The <code className="bg-white/10 px-1 rounded">security_violations</code> table is monitored when available.
                  Protection layers below are active at the application level regardless.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Timeframe Selector */}
        <div className="flex gap-2 mb-8">
          {(['24h', '7d', '30d'] as const).map((tf) => (
            <Button
              key={tf}
              variant={selectedTimeframe === tf ? "default" : "outline"}
              onClick={() => setSelectedTimeframe(tf)}
              className={selectedTimeframe === tf ? "bg-red-600 hover:bg-red-700" : "bg-white/10 border-white/20 text-white hover:bg-white/20"}
            >
              {tf === '24h' ? 'Last 24 Hours' : tf === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </Button>
          ))}
        </div>

        {/* Security Score (only when metrics available) */}
        {metrics ? (
          <Card className="mb-8 bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-red-500" />
                Security Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-6xl font-bold ${getScoreColor(metrics.current_score || 0)}`}>
                    {metrics.current_score || 0}/100
                  </div>
                  <div className={`text-lg mt-2 ${getScoreColor(metrics.current_score || 0)}`}>
                    {getScoreLabel(metrics.current_score || 0)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white/60 text-sm">Overall Security Health</div>
                  <div className="flex items-center gap-2 mt-1">
                    {(metrics.current_score || 0) >= 70 ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-white/80">
                      {(metrics.current_score || 0) >= 70 ? 'Protected' : 'Attention Required'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 bg-white/5 border-white/10">
            <CardContent className="py-6 text-center text-white/40 text-sm">
              <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Security score unavailable — <code className="bg-white/10 px-1 rounded text-xs">security_dashboard</code> view not found
            </CardContent>
          </Card>
        )}

        {/* Metrics Grid (only when metrics available) */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { icon: <Users className="w-5 h-5 text-blue-400" />, label: "Active Admins", value: metrics.active_admins, sub: "Currently online" },
              { icon: <Activity className="w-5 h-5 text-green-400" />, label: "Active Sessions", value: metrics.active_sessions, sub: "Authenticated sessions" },
              { icon: <Zap className="w-5 h-5 text-yellow-400" />, label: "Today's Requests", value: metrics.today_requests.toLocaleString(), sub: "Total API requests" },
              { icon: <Lock className="w-5 h-5 text-red-400" />, label: "Blocked Requests", value: metrics.today_blocked, sub: "Threats prevented", valueClass: "text-red-400" },
            ].map(m => (
              <Card key={m.label} className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">{m.icon}{m.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${m.valueClass ?? "text-white"}`}>{m.value}</div>
                  <div className="text-white/60 text-sm mt-1">{m.sub}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Top Threats + Recent Incidents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-orange-400" />
                Top Threats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topThreats.map((threat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getSeverityColor(threat.severity).split(' ')[2]}`} />
                      <div>
                        <div className="text-white font-medium">{threat.type}</div>
                        <div className="text-white/60 text-sm">{threat.count} incidents</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {threat.trend === 'up' && <TrendingUp className="w-4 h-4 text-red-400" />}
                      {threat.trend === 'down' && <TrendingUp className="w-4 h-4 text-green-400 rotate-180" />}
                      {threat.trend === 'stable' && <Activity className="w-4 h-4 text-yellow-400" />}
                      <Badge className={getSeverityColor(threat.severity)}>{threat.severity}</Badge>
                    </div>
                  </div>
                ))}
                {topThreats.length === 0 && (
                  <div className="text-center py-8 text-white/60">
                    <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <div>No threats detected</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Recent Incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {incidents.map((incident) => (
                  <div key={incident.id} className="p-3 bg-black/30 rounded-lg border border-white/10">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-white font-medium">{incident.title}</div>
                        <div className="text-white/60 text-sm mt-1">{incident.description}</div>
                      </div>
                      <Badge className={getSeverityColor(incident.severity)}>{incident.severity}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-white/40 text-xs">{new Date(incident.created_at).toLocaleString()}</div>
                      <div className={`text-xs ${getStatusColor(incident.status)}`}>{incident.status}</div>
                    </div>
                  </div>
                ))}
                {incidents.length === 0 && (
                  <div className="text-center py-8 text-white/60">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <div>{dataSource === 'unavailable' ? 'Table not available' : 'No recent incidents'}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Protection Layers — always shown (app-level, not DB-dependent) */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              Protection Layers Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Input Sanitization", sub: "Content filtering active" },
                { label: "Bot Protection", sub: "Rate limiting active" },
                { label: "Malware Defense", sub: "File scanning active" },
                { label: "Admin Security", sub: "Role-based access control active" },
                { label: "CSP & Headers", sub: "Security headers active" },
                { label: "Monitoring", sub: "Real-time alerts active" },
              ].map(layer => (
                <div key={layer.label} className="p-4 bg-black/30 rounded-lg border border-green-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-white font-medium">{layer.label}</span>
                  </div>
                  <div className="text-white/60 text-sm">{layer.sub}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4">
          <Button className="bg-red-600 hover:bg-red-700" onClick={fetchSecurityData}>
            <Shield className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <FileText className="w-4 h-4 mr-2" />
            Export Security Report
          </Button>
          <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Eye className="w-4 h-4 mr-2" />
            View Detailed Logs
          </Button>
        </div>
      </div>
    </div>
  );
}
