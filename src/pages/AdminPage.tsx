import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Shield, Users, DollarSign, Ban, RefreshCw, Search,
  TrendingUp, Heart, Star, Zap, Eye, Trash2, CheckCircle, AlertTriangle,
  Download, ChevronUp, ChevronDown, X, MessageSquare, UserCheck,
  Activity, Calendar, Globe, BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
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
  is_spotlight: boolean;
  hidden_until: string | null;
  created_at: string;
  last_seen_at: string | null;
  avatar_url: string | null;
  looking_for: string;
  bio: string | null;
}

interface Payment {
  id: string;
  user_id: string;
  target_user_id: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
  stripe_session_id: string;
}

type Tab = "overview" | "users" | "income";

// ── Helpers ────────────────────────────────────────────────────────────────────
const startOf = (unit: "day" | "week" | "month") => {
  const d = new Date();
  if (unit === "day")   { d.setHours(0,0,0,0); }
  if (unit === "week")  { d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); }
  if (unit === "month") { d.setDate(1); d.setHours(0,0,0,0); }
  return d;
};
const rev = (payments: Payment[], since?: Date) =>
  payments
    .filter(p => p.status === "paid" && (!since || new Date(p.created_at) >= since))
    .reduce((s, p) => s + p.amount_cents, 0) / 100;

const fmtRev = (v: number) =>
  v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(2)}`;

const isOnlineNow = (last_seen_at: string | null) => {
  if (!last_seen_at) return false;
  return Date.now() - new Date(last_seen_at).getTime() < 5 * 60 * 1000;
};

const isNewToday = (created_at: string) =>
  new Date(created_at) >= startOf("day");

// ── Mini bar-chart component ─────────────────────────────────────────────────
const BarChart = ({ data, color = "hsl(320,50%,50%)" }: { data: { label: string; value: number }[]; color?: string }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className="w-full rounded-t-sm transition-all duration-500"
            style={{ height: `${Math.max((d.value / max) * 52, d.value > 0 ? 4 : 0)}px`, background: color, opacity: 0.85 }}
          />
          <span className="text-[7px] text-white/30 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

// ── User detail drawer ────────────────────────────────────────────────────────
const UserDrawer = ({
  profile,
  onClose,
  onBan,
  onDelete,
  onSpotlight,
  onReactivate,
  actionLoading,
}: {
  profile: AdminProfile;
  onClose: () => void;
  onBan: (id: string, ban: boolean) => void;
  onDelete: (id: string) => void;
  onSpotlight: (id: string, on: boolean) => void;
  onReactivate: (id: string) => void;
  actionLoading: string | null;
}) => (
  <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={onClose} />
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 320 }}
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-8 pt-2"
    >
      <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
      <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden">
        <div className="h-1 w-full gradient-love" />
        <div className="p-5 space-y-4">
          {/* Profile header */}
          <div className="flex items-center gap-3">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-white/10 flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-white/40" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white font-bold text-lg">{profile.name}, {profile.age}</p>
                {profile.is_banned && <Badge variant="destructive" className="text-[9px]">Banned</Badge>}
                {profile.is_spotlight && <Badge className="text-[9px] bg-amber-500 border-0">Spotlight</Badge>}
                {isOnlineNow(profile.last_seen_at) && <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />}
              </div>
              <p className="text-white/50 text-xs">{profile.gender} · {profile.looking_for} · {profile.city}, {profile.country}</p>
              <p className="text-white/30 text-[10px] mt-0.5">{profile.whatsapp}</p>
            </div>
            <button onClick={onClose} className="ml-auto w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {profile.bio && (
            <p className="text-white/50 text-xs bg-white/5 rounded-xl p-3">{profile.bio}</p>
          )}

          <p className="text-white/30 text-[10px]">
            Joined {new Date(profile.created_at).toLocaleDateString()} ·
            Last seen {profile.last_seen_at ? new Date(profile.last_seen_at).toLocaleString() : "never"}
          </p>

          {/* Actions grid */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onBan(profile.id, !profile.is_banned)}
              disabled={actionLoading === profile.id}
              className={`h-11 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                profile.is_banned
                  ? "bg-green-500/20 border border-green-400/50 text-green-400"
                  : "bg-red-500/20 border border-red-400/50 text-red-400"
              }`}
            >
              <Ban className="w-4 h-4" />
              {profile.is_banned ? "Unban User" : "Ban User"}
            </button>

            <button
              onClick={() => onSpotlight(profile.id, !profile.is_spotlight)}
              disabled={actionLoading === profile.id}
              className={`h-11 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                profile.is_spotlight
                  ? "bg-white/10 border border-white/10 text-white/50"
                  : "bg-amber-400/20 border border-amber-400/50 text-amber-400"
              }`}
            >
              <Star className="w-4 h-4" fill={profile.is_spotlight ? "none" : "currentColor"} />
              {profile.is_spotlight ? "Remove Spotlight" : "Set Spotlight"}
            </button>

            {profile.hidden_until && new Date(profile.hidden_until) > new Date() && (
              <button
                onClick={() => onReactivate(profile.id)}
                disabled={actionLoading === profile.id}
                className="h-11 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 bg-blue-500/20 border border-blue-400/50 text-blue-400 transition-all active:scale-95"
              >
                <CheckCircle className="w-4 h-4" /> Reactivate
              </button>
            )}

            <button
              onClick={() => {
                if (confirm(`Permanently delete ${profile.name}? This cannot be undone.`)) {
                  onDelete(profile.id);
                  onClose();
                }
              }}
              disabled={actionLoading === profile.id}
              className="h-11 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 bg-red-900/30 border border-red-800/50 text-red-500 transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4" /> Delete Account
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  </>
);

// ── Main component ────────────────────────────────────────────────────────────
const AdminPage = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [likesCount, setLikesCount] = useState(0);
  const [superLikesCount, setSuperLikesCount] = useState(0);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [userFilter, setUserFilter] = useState<"all" | "active" | "banned" | "hidden" | "spotlight">("all");
  const [sortField, setSortField] = useState<"name" | "created_at" | "last_seen_at">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      if (!roles?.some((r: any) => r.role === "admin")) {
        toast.error("Access denied — admin only");
        navigate("/");
        return;
      }
      setIsAdmin(true);
      await loadData();
      setLoading(false);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setRefreshing(true);
    const [profilesRes, paymentsRes, likesRes] = await Promise.all([
      supabase.from("profiles")
        .select("id,name,age,country,city,gender,whatsapp,is_active,is_banned,is_spotlight,hidden_until,created_at,last_seen_at,avatar_url,looking_for,bio")
        .limit(1000),
      supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("likes").select("id, is_rose", { count: "exact" }),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data as AdminProfile[]);
    if (paymentsRes.data) setPayments(paymentsRes.data as Payment[]);
    if (likesRes.data) {
      setLikesCount(likesRes.data.length);
      setSuperLikesCount(likesRes.data.filter((l: any) => l.is_rose).length);
    }
    setRefreshing(false);
  };

  // ── Revenue calcs ────────────────────────────────────────────────
  const revTotal  = rev(payments);
  const revToday  = rev(payments, startOf("day"));
  const revWeek   = rev(payments, startOf("week"));
  const revMonth  = rev(payments, startOf("month"));

  // Last 7 days chart data
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d); nextDay.setDate(d.getDate() + 1);
      const dayRev = payments
        .filter(p => p.status === "paid" && new Date(p.created_at) >= d && new Date(p.created_at) < nextDay)
        .reduce((s, p) => s + p.amount_cents, 0) / 100;
      const label = d.toLocaleDateString("en", { weekday: "short" }).slice(0, 2);
      return { label, value: dayRev };
    });
  }, [payments]);

  const last7Signups = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d); nextDay.setDate(d.getDate() + 1);
      const count = profiles.filter(p => new Date(p.created_at) >= d && new Date(p.created_at) < nextDay).length;
      const label = d.toLocaleDateString("en", { weekday: "short" }).slice(0, 2);
      return { label, value: count };
    });
  }, [profiles]);

  // Revenue by product type (WhatsApp unlock = has target_user_id, features = no target_user_id)
  const whatsappRev = payments.filter(p => p.status === "paid" && p.target_user_id).reduce((s, p) => s + p.amount_cents, 0) / 100;
  const featureRev  = payments.filter(p => p.status === "paid" && !p.target_user_id).reduce((s, p) => s + p.amount_cents, 0) / 100;

  // ── User stats ───────────────────────────────────────────────────
  const activeCount    = profiles.filter(p => p.is_active && !p.is_banned).length;
  const bannedCount    = profiles.filter(p => p.is_banned).length;
  const hiddenCount    = profiles.filter(p => p.hidden_until && new Date(p.hidden_until) > new Date()).length;
  const spotlightCount = profiles.filter(p => p.is_spotlight).length;
  const onlineNow      = profiles.filter(p => isOnlineNow(p.last_seen_at)).length;
  const newToday       = profiles.filter(p => isNewToday(p.created_at)).length;

  // Country breakdown (top 5)
  const countryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    profiles.forEach(p => { map[p.country] = (map[p.country] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [profiles]);

  // ── Filtered + sorted users ──────────────────────────────────────
  const filteredProfiles = useMemo(() => {
    let list = profiles.filter(p => {
      const q = search.toLowerCase();
      if (q && !p.name.toLowerCase().includes(q) && !p.country.toLowerCase().includes(q) && !p.whatsapp.includes(q)) return false;
      if (userFilter === "active")    return p.is_active && !p.is_banned;
      if (userFilter === "banned")    return p.is_banned;
      if (userFilter === "hidden")    return !!(p.hidden_until && new Date(p.hidden_until) > new Date());
      if (userFilter === "spotlight") return p.is_spotlight;
      return true;
    });
    list = [...list].sort((a, b) => {
      const va = (a as any)[sortField] ?? "";
      const vb = (b as any)[sortField] ?? "";
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [profiles, search, userFilter, sortField, sortDir]);

  // ── Actions ──────────────────────────────────────────────────────
  const handleBan = async (userId: string, ban: boolean) => {
    setActionLoading(userId);
    const { error } = await supabase.from("profiles").update({ is_banned: ban }).eq("id", userId);
    if (error) toast.error(error.message);
    else {
      toast.success(ban ? `User banned` : `User unbanned`);
      setProfiles(p => p.map(u => u.id === userId ? { ...u, is_banned: ban } : u));
      if (selectedUser?.id === userId) setSelectedUser(u => u ? { ...u, is_banned: ban } : u);
    }
    setActionLoading(null);
  };

  const handleDelete = async (userId: string) => {
    setActionLoading(userId);
    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    if (error) toast.error(error.message);
    else {
      toast.success("Account deleted");
      setProfiles(p => p.filter(u => u.id !== userId));
    }
    setActionLoading(null);
  };

  const handleSpotlight = async (userId: string, on: boolean) => {
    setActionLoading(userId);
    const spotlight_until = on ? new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() : null;
    const { error } = await (supabase.from("profiles").update as any)({ is_spotlight: on, spotlight_until }).eq("id", userId);
    if (error) toast.error(error.message);
    else {
      toast.success(on ? "Spotlight activated (7 days)" : "Spotlight removed");
      setProfiles(p => p.map(u => u.id === userId ? { ...u, is_spotlight: on } : u));
      if (selectedUser?.id === userId) setSelectedUser(u => u ? { ...u, is_spotlight: on } : u);
    }
    setActionLoading(null);
  };

  const handleReactivate = async (userId: string) => {
    setActionLoading(userId);
    const { error } = await supabase.from("profiles").update({ hidden_until: null, is_active: true }).eq("id", userId);
    if (error) toast.error(error.message);
    else {
      toast.success("Profile reactivated");
      setProfiles(p => p.map(u => u.id === userId ? { ...u, hidden_until: null, is_active: true } : u));
    }
    setActionLoading(null);
  };

  // ── CSV Export ───────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ["ID", "Name", "Age", "Gender", "Country", "City", "WhatsApp", "Looking For", "Active", "Banned", "Spotlight", "Joined", "Last Seen"];
    const rows = filteredProfiles.map(p => [
      p.id, p.name, p.age, p.gender, p.country, p.city || "", p.whatsapp, p.looking_for,
      p.is_active, p.is_banned, p.is_spotlight,
      new Date(p.created_at).toLocaleDateString(),
      p.last_seen_at ? new Date(p.last_seen_at).toLocaleDateString() : "",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "skiptheapp_users.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredProfiles.length} users`);
  };

  const sortToggle = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  // ── Loading ──────────────────────────────────────────────────────
  if (loading || !isAdmin) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <Shield className="w-8 h-8 animate-pulse text-primary" />
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────
  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: "users",    label: `Users (${profiles.length})`, icon: <Users className="w-3.5 h-3.5" /> },
    { id: "income",   label: `Income`, icon: <DollarSign className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/80 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-display font-bold text-white text-sm">Admin Dashboard</span>
          </div>
        </div>
        <button
          onClick={loadData}
          className={`w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors ${refreshing ? "animate-spin" : ""}`}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      {/* Tab bar */}
      <div className="flex px-4 pt-3 gap-1 flex-shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 transition-all ${
              tab === t.id ? "gradient-love text-white shadow-[0_0_12px_rgba(180,80,150,0.3)]" : "bg-white/5 text-white/40 hover:text-white/70"
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ══ OVERVIEW TAB ══════════════════════════════════════════ */}
        {tab === "overview" && (
          <>
            {/* Revenue cards */}
            <div>
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2">Revenue</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Today",      value: fmtRev(revToday),  sub: `${payments.filter(p => p.status === "paid" && new Date(p.created_at) >= startOf("day")).length} txns`, color: "text-green-400" },
                  { label: "This Week",  value: fmtRev(revWeek),   sub: `since Monday`,       color: "text-emerald-400" },
                  { label: "This Month", value: fmtRev(revMonth),  sub: `since 1st`,          color: "text-teal-400" },
                  { label: "All Time",   value: fmtRev(revTotal),  sub: `${payments.filter(p => p.status === "paid").length} payments`, color: "text-primary" },
                ].map(({ label, value, sub, color }) => (
                  <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-3">
                    <p className="text-white/40 text-[9px] uppercase tracking-wider">{label}</p>
                    <p className={`font-display font-bold text-xl mt-0.5 ${color}`}>{value}</p>
                    <p className="text-white/30 text-[9px] mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue by product */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2">Revenue by Product</p>
              <div className="flex gap-3">
                <div className="flex-1 text-center bg-green-500/10 border border-green-500/20 rounded-xl p-2">
                  <MessageSquare className="w-4 h-4 text-green-400 mx-auto mb-1" />
                  <p className="text-green-400 font-bold text-base">{fmtRev(whatsappRev)}</p>
                  <p className="text-white/30 text-[9px]">WhatsApp Unlocks</p>
                </div>
                <div className="flex-1 text-center bg-amber-500/10 border border-amber-500/20 rounded-xl p-2">
                  <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <p className="text-amber-400 font-bold text-base">{fmtRev(featureRev)}</p>
                  <p className="text-white/30 text-[9px]">Premium Features</p>
                </div>
              </div>
            </div>

            {/* 7-day revenue chart */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2">Revenue — Last 7 Days</p>
              <BarChart data={last7Days} color="hsl(320,50%,50%)" />
            </div>

            {/* User stats */}
            <div>
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2">Users</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Online Now",  value: onlineNow,      icon: <Activity className="w-3.5 h-3.5" />,     color: "text-green-400" },
                  { label: "New Today",   value: newToday,       icon: <Calendar className="w-3.5 h-3.5" />,     color: "text-blue-400" },
                  { label: "Active",      value: activeCount,    icon: <Users className="w-3.5 h-3.5" />,        color: "text-primary" },
                  { label: "Banned",      value: bannedCount,    icon: <Ban className="w-3.5 h-3.5" />,          color: "text-red-400" },
                  { label: "Spotlight",   value: spotlightCount, icon: <Star className="w-3.5 h-3.5" />,         color: "text-amber-400" },
                  { label: "Hidden",      value: hiddenCount,    icon: <Eye className="w-3.5 h-3.5" />,          color: "text-white/40" },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                    <span className={`${color} flex justify-center`}>{icon}</span>
                    <p className={`font-bold text-lg mt-0.5 ${color}`}>{value}</p>
                    <p className="text-white/30 text-[9px]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <Heart className="w-4 h-4 text-primary mx-auto mb-1" fill="currentColor" />
                <p className="text-primary font-bold text-xl">{likesCount.toLocaleString()}</p>
                <p className="text-white/30 text-[9px]">Total Likes</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <Star className="w-4 h-4 text-amber-400 mx-auto mb-1" fill="currentColor" />
                <p className="text-amber-400 font-bold text-xl">{superLikesCount.toLocaleString()}</p>
                <p className="text-white/30 text-[9px]">Super Likes</p>
              </div>
            </div>

            {/* Signups chart */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2">New Signups — Last 7 Days</p>
              <BarChart data={last7Signups} color="hsl(174,72%,56%)" />
            </div>

            {/* Top countries */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2">
                <Globe className="w-3 h-3 inline mr-1" />Top Countries
              </p>
              <div className="space-y-2">
                {countryBreakdown.map(([country, count]) => (
                  <div key={country} className="flex items-center gap-2">
                    <span className="text-white/70 text-xs flex-1">{country}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full gradient-love rounded-full" style={{ width: `${(count / profiles.length) * 100}%` }} />
                    </div>
                    <span className="text-white/40 text-[10px] w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ══ USERS TAB ═════════════════════════════════════════════ */}
        {tab === "users" && (
          <>
            {/* Search + export */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  placeholder="Name, country, WhatsApp..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl h-9 text-sm"
                />
              </div>
              <button onClick={exportCSV} className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors flex items-center gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>

            {/* Filter chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {(["all", "active", "banned", "hidden", "spotlight"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setUserFilter(f)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-semibold transition-all capitalize ${
                    userFilter === f ? "gradient-love text-white" : "bg-white/5 border border-white/10 text-white/40"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Sort bar */}
            <div className="flex gap-2 text-[10px] text-white/30">
              <span>Sort:</span>
              {(["name", "created_at", "last_seen_at"] as const).map(f => (
                <button key={f} onClick={() => sortToggle(f)}
                  className={`flex items-center gap-0.5 ${sortField === f ? "text-primary" : "hover:text-white/60"}`}>
                  {f === "name" ? "Name" : f === "created_at" ? "Joined" : "Last Seen"}
                  {sortField === f && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </button>
              ))}
              <span className="ml-auto text-white/20">{filteredProfiles.length} shown</span>
            </div>

            {/* User rows */}
            {filteredProfiles.map((profile, i) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.015, 0.3) }}
                onClick={() => setSelectedUser(profile)}
                className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-white/8 transition-colors active:scale-[0.99]"
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-1 ring-white/10" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-white/30" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-white font-semibold text-sm truncate">{profile.name}, {profile.age}</p>
                    {profile.is_banned && <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5">Ban</Badge>}
                    {profile.is_spotlight && <Badge className="text-[8px] px-1 py-0 h-3.5 bg-amber-500 border-0">⭐</Badge>}
                    {isOnlineNow(profile.last_seen_at) && <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />}
                  </div>
                  <p className="text-white/40 text-[10px] truncate">{profile.gender} · {profile.country} · {profile.whatsapp}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-white/20 flex-shrink-0 -rotate-90" />
              </motion.div>
            ))}

            {filteredProfiles.length === 0 && (
              <p className="text-white/30 text-sm text-center py-10">No users match this filter</p>
            )}
          </>
        )}

        {/* ══ INCOME TAB ════════════════════════════════════════════ */}
        {tab === "income" && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 col-span-2 text-center">
                <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <p className="text-white/40 text-xs">All-Time Revenue</p>
                <p className="text-green-400 font-display font-bold text-3xl mt-0.5">{fmtRev(revTotal)}</p>
                <p className="text-white/30 text-[10px] mt-1">{payments.filter(p => p.status === "paid").length} completed · {payments.filter(p => p.status !== "paid").length} pending/failed</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-white/30 text-[9px]">Today</p>
                <p className="text-white font-bold text-lg">{fmtRev(revToday)}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-white/30 text-[9px]">This Month</p>
                <p className="text-white font-bold text-lg">{fmtRev(revMonth)}</p>
              </div>
            </div>

            {/* 7-day chart */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2">Daily Revenue (7d)</p>
              <BarChart data={last7Days} color="hsl(142,71%,45%)" />
            </div>

            {/* Product split */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-3">Product Breakdown</p>
              {revTotal > 0 && (
                <div className="flex h-3 rounded-full overflow-hidden mb-2">
                  <div className="bg-green-400 transition-all" style={{ width: `${(whatsappRev / revTotal) * 100}%` }} />
                  <div className="bg-amber-400 flex-1" />
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-green-400 flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-400 inline-block" /> WhatsApp {fmtRev(whatsappRev)}</span>
                <span className="text-amber-400 flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" /> Features {fmtRev(featureRev)}</span>
              </div>
            </div>

            {/* Transaction list */}
            <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">All Transactions</p>
            {payments.map((payment, i) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.015, 0.3) }}
                className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${payment.target_user_id ? "bg-green-500/20" : "bg-amber-500/20"}`}>
                    {payment.target_user_id
                      ? <MessageSquare className="w-4 h-4 text-green-400" />
                      : <Zap className="w-4 h-4 text-amber-400" />
                    }
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">${(payment.amount_cents / 100).toFixed(2)} {payment.currency.toUpperCase()}</p>
                    <p className="text-white/30 text-[10px]">
                      {payment.target_user_id ? "WhatsApp Unlock" : "Premium Feature"} · {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge
                  className={`text-[9px] ${payment.status === "paid" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-white/10 text-white/40 border-white/10"}`}
                >
                  {payment.status}
                </Badge>
              </motion.div>
            ))}
            {payments.length === 0 && (
              <p className="text-white/30 text-sm text-center py-10">No payments yet</p>
            )}
          </>
        )}
      </div>

      {/* User detail drawer */}
      <AnimatePresence>
        {selectedUser && (
          <UserDrawer
            profile={selectedUser}
            onClose={() => setSelectedUser(null)}
            onBan={handleBan}
            onDelete={handleDelete}
            onSpotlight={handleSpotlight}
            onReactivate={handleReactivate}
            actionLoading={actionLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPage;
