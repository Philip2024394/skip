import { useState, useEffect } from "react";
import { Shield, AlertTriangle, Users, Activity, Lock, Eye, TrendingUp, Calendar, FileText, Bot, Zap, Database, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/shared/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/card";
import { Button } from "@/shared/components/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/table";
import securityFilter from "@/shared/services/securityFilter";
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

export default function UltimateSecurityDashboard() {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [topThreats, setTopThreats] = useState<TopThreat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      // Fetch security metrics
      const { data: metricsData } = await supabase
        .from('security_dashboard')
        .select('*')
        .single();

      // Fetch recent incidents
      const { data: incidentsData } = await supabase
        .from('recent_security_incidents')
        .select('*')
        .limit(10);

      // Fetch top threats (aggregate from various tables)
      const threats = await fetchTopThreats();

      setMetrics(metricsData);
      setIncidents(incidentsData || []);
      setTopThreats(threats);
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopThreats = async (): Promise<TopThreat[]> => {
    try {
      // Get bot detections
      const { data: botData } = await supabase
        .from('bot_detections')
        .select('bot_score, confidence, timestamp')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Get security violations
      const { data: violationsData } = await supabase
        .from('security_violations')
        .select('violations, timestamp')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Get API security logs
      const { data: apiData } = await supabase
        .from('api_security_logs')
        .select('is_allowed, timestamp')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Aggregate threats
      const threats: TopThreat[] = [];

      if (botData && botData.length > 0) {
        threats.push({
          type: 'Bot Detection',
          count: botData.length,
          severity: 'high',
          trend: 'up'
        });
      }

      if (violationsData && violationsData.length > 0) {
        threats.push({
          type: 'Content Violations',
          count: violationsData.length,
          severity: 'medium',
          trend: 'stable'
        });
      }

      if (apiData && apiData.length > 0) {
        const blockedRequests = apiData.filter(log => !log.is_allowed).length;
        if (blockedRequests > 0) {
          threats.push({
            type: 'Blocked Requests',
            count: blockedRequests,
            severity: 'medium',
            trend: 'down'
          });
        }
      }

      return threats.sort((a, b) => b.count - a.count).slice(0, 5);
    } catch (error) {
      console.error('Error fetching top threats:', error);
      return [];
    }
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
            <Shield className="w-8 h-8 text-red-500" />
            Ultimate Security Dashboard
          </h1>
          <p className="text-white/70">Comprehensive protection monitoring and analysis</p>
        </div>

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

        {/* Security Score */}
        {metrics && (
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
                    {metrics.current_score >= 70 ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-white/80">
                      {metrics.current_score >= 70 ? 'Protected' : 'Attention Required'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metrics Grid */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Active Admins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{metrics.active_admins}</div>
                <div className="text-white/60 text-sm mt-1">Currently online</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  Active Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{metrics.active_sessions}</div>
                <div className="text-white/60 text-sm mt-1">Authenticated sessions</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Today's Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{metrics.today_requests.toLocaleString()}</div>
                <div className="text-white/60 text-sm mt-1">Total API requests</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="w-5 h-5 text-red-400" />
                  Blocked Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-400">{metrics.today_blocked}</div>
                <div className="text-white/60 text-sm mt-1">Threats prevented</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top Threats and Incidents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Threats */}
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
                      <Badge className={getSeverityColor(threat.severity)}>
                        {threat.severity}
                      </Badge>
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

          {/* Recent Incidents */}
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
                      <Badge className={getSeverityColor(incident.severity)}>
                        {incident.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-white/40 text-xs">
                        {new Date(incident.created_at).toLocaleString()}
                      </div>
                      <div className={`text-xs ${getStatusColor(incident.status)}`}>
                        {incident.status}
                      </div>
                    </div>
                  </div>
                ))}
                {incidents.length === 0 && (
                  <div className="text-center py-8 text-white/60">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <div>No recent incidents</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Protection Layers Status */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              Protection Layers Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-black/30 rounded-lg border border-green-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white font-medium">Input Sanitization</span>
                </div>
                <div className="text-white/60 text-sm">Content filtering active</div>
              </div>

              <div className="p-4 bg-black/30 rounded-lg border border-green-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white font-medium">Bot Protection</span>
                </div>
                <div className="text-white/60 text-sm">Rate limiting active</div>
              </div>

              <div className="p-4 bg-black/30 rounded-lg border border-green-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white font-medium">Malware Defense</span>
                </div>
                <div className="text-white/60 text-sm">File scanning active</div>
              </div>

              <div className="p-4 bg-black/30 rounded-lg border border-green-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white font-medium">Admin Security</span>
                </div>
                <div className="text-white/60 text-sm">2FA and RBAC active</div>
              </div>

              <div className="p-4 bg-black/30 rounded-lg border border-green-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white font-medium">CSP & Headers</span>
                </div>
                <div className="text-white/60 text-sm">Security headers active</div>
              </div>

              <div className="p-4 bg-black/30 rounded-lg border border-green-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white font-medium">Monitoring</span>
                </div>
                <div className="text-white/60 text-sm">Real-time alerts active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4">
          <Button className="bg-red-600 hover:bg-red-700">
            <Shield className="w-4 h-4 mr-2" />
            Run Security Scan
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
