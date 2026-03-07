import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Users, DollarSign, Ban, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminProfile {
  id: string;
  name: string;
  age: number;
  country: string;
  city: string | null;
  gender: string;
  whatsapp: string;
  is_active: boolean;
  is_banned: boolean;
  hidden_until: string | null;
  created_at: string;
  last_seen_at: string | null;
}

const AdminPage = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"users" | "income">("users");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const hasAdmin = roles?.some((r) => r.role === "admin");
      if (!hasAdmin) {
        toast.error("Access denied — admin only");
        navigate("/");
        return;
      }
      setIsAdmin(true);
      await loadData();
      setLoading(false);
    };
    checkAdmin();
  }, [navigate]);

  const loadData = async () => {
    const [profilesRes, paymentsRes] = await Promise.all([
      supabase.from("profiles").select("id, name, age, country, city, gender, whatsapp, is_active, is_banned, hidden_until, created_at, last_seen_at").limit(500),
      supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data as AdminProfile[]);
    if (paymentsRes.data) setPayments(paymentsRes.data);
  };

  const handleBan = async (userId: string, ban: boolean) => {
    setActionLoading(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: ban })
      .eq("id", userId);
    if (error) toast.error(error.message);
    else {
      toast.success(ban ? "User banned" : "User unbanned");
      setProfiles((p) => p.map((u) => u.id === userId ? { ...u, is_banned: ban } : u));
    }
    setActionLoading(null);
  };

  const handleReactivate = async (userId: string) => {
    setActionLoading(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ hidden_until: null, is_active: true })
      .eq("id", userId);
    if (error) toast.error(error.message);
    else {
      toast.success("Profile reactivated");
      setProfiles((p) => p.map((u) => u.id === userId ? { ...u, hidden_until: null, is_active: true } : u));
    }
    setActionLoading(null);
  };

  if (loading || !isAdmin) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Shield className="w-8 h-8 animate-pulse text-primary" />
      </div>
    );
  }

  const filteredProfiles = profiles.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.country.toLowerCase().includes(search.toLowerCase()) ||
    p.whatsapp.includes(search)
  );

  const totalIncome = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (p.amount_cents || 0), 0);
  const activeMembers = profiles.filter((p) => p.is_active && !p.is_banned).length;
  const bannedCount = profiles.filter((p) => p.is_banned).length;
  const hiddenCount = profiles.filter((p) => p.hidden_until && new Date(p.hidden_until) > new Date()).length;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-display font-bold text-foreground text-sm">Admin Dashboard</span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="text-xs">
          <RefreshCw className="w-3 h-3 mr-1" /> Refresh
        </Button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 px-4 py-3">
        {[
          { label: "Revenue", value: `$${(totalIncome / 100).toFixed(2)}`, icon: DollarSign, color: "text-green-500" },
          { label: "Active", value: activeMembers, icon: Users, color: "text-primary" },
          { label: "Banned", value: bannedCount, icon: Ban, color: "text-destructive" },
          { label: "Hidden", value: hiddenCount, icon: Shield, color: "text-muted-foreground" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
            <Icon className={`w-4 h-4 mx-auto ${color}`} />
            <p className="text-foreground font-bold text-sm mt-1">{value}</p>
            <p className="text-muted-foreground text-[10px]">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="px-4">
        <div className="flex gap-1 p-0.5 bg-muted rounded-xl">
          <button onClick={() => setTab("users")} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${tab === "users" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            <Users className="w-3.5 h-3.5 inline mr-1" /> Users ({profiles.length})
          </button>
          <button onClick={() => setTab("income")} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${tab === "income" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            <DollarSign className="w-3.5 h-3.5 inline mr-1" /> Payments ({payments.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {tab === "users" ? (
          <>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, country, or WhatsApp..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted/30 border-border/50 rounded-xl h-9 text-sm"
              />
            </div>
            {filteredProfiles.map((profile, i) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="bg-card border border-border rounded-xl p-3 flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-foreground font-semibold text-sm truncate">{profile.name}, {profile.age}</p>
                    {profile.is_banned && <Badge variant="destructive" className="text-[9px] px-1.5 py-0">Banned</Badge>}
                    {profile.hidden_until && new Date(profile.hidden_until) > new Date() && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Hidden</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-[11px]">{profile.country} · {profile.gender} · {profile.whatsapp}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {profile.hidden_until && new Date(profile.hidden_until) > new Date() && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReactivate(profile.id)}
                      disabled={actionLoading === profile.id}
                      className="h-7 text-[10px] px-2"
                    >
                      Reactivate
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={profile.is_banned ? "outline" : "destructive"}
                    onClick={() => handleBan(profile.id, !profile.is_banned)}
                    disabled={actionLoading === profile.id}
                    className="h-7 text-[10px] px-2"
                  >
                    {profile.is_banned ? "Unban" : "Ban"}
                  </Button>
                </div>
              </motion.div>
            ))}
          </>
        ) : (
          <>
            <div className="bg-card border border-border rounded-xl p-4 mb-3 text-center">
              <p className="text-muted-foreground text-xs">Total Revenue</p>
              <p className="text-foreground font-display font-bold text-2xl">${(totalIncome / 100).toFixed(2)}</p>
              <p className="text-muted-foreground text-[10px] mt-1">{payments.filter(p => p.status === "paid").length} completed payments</p>
            </div>
            {payments.map((payment, i) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="bg-card border border-border rounded-xl p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-foreground font-medium text-sm">${(payment.amount_cents / 100).toFixed(2)} {payment.currency.toUpperCase()}</p>
                  <p className="text-muted-foreground text-[10px]">{new Date(payment.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant={payment.status === "paid" ? "default" : "secondary"} className="text-[10px]">
                  {payment.status}
                </Badge>
              </motion.div>
            ))}
            {payments.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-8">No payments yet</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
