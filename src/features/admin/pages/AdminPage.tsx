import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Shield, Users, DollarSign, Ban, RefreshCw, Search,
  TrendingUp, Heart, Star, Zap, Eye, MessageSquare, UserCheck,
  Activity, Calendar, Globe, BarChart2, BadgeCheck, AlertTriangle,
  AlertCircle, CheckCircle2, Bell, WifiOff, CreditCard, Image,
  MapPin, Settings, ChevronUp, ChevronDown, Download,
} from "lucide-react";
import { Input } from "@/shared/components/input";
import { Badge } from "@/shared/components/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WhatsAppCountryList } from "../components/WhatsAppCountryList";
import { AdminProfile, Payment, Tab, UserFilter } from "../types";
import { startOf, rev, fmtRev, isOnlineNow, isNewToday } from "../utils";
import BarChart from "../components/BarChart";
import UserDrawer from "../components/UserDrawer";
import VerifyTab from "../components/VerifyTab";
import SetupTab from "../components/SetupTab";
import AlertsTab from "../components/AlertsTab";
import { AlertItem } from "../components/AlertsTab";
import AdCreatorTab from "../components/AdCreatorTab";

// ── Main component ────────────────────────────────────────────────────────────
const AdminPage = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  // DEBUG: Verify latest code is loading
  console.log('🚀 AdminPage loaded with World Map button -', new Date().toISOString());
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [likesCount, setLikesCount] = useState(0);
  const [superLikesCount, setSuperLikesCount] = useState(0);
  const [whatsappLeadsCount, setWhatsappLeadsCount] = useState(0);
  const [reportsCount, setReportsCount] = useState(0);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [userFilter, setUserFilter] = useState<UserFilter>("all");
  const [sortField, setSortField] = useState<"name" | "created_at" | "last_seen_at">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Dev bypass — skip role check but still require Supabase session for writes
      if (import.meta.env.DEV) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) setNeedsLogin(true);
        setIsAdmin(true);
        try { await loadData(); } catch (_) { }
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/"); return; }

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

  const handleAdminLogin = async () => {
    setLoginLoading(true);
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) {
      setLoginError(error.message);
    } else {
      setNeedsLogin(false);
      toast.success("Signed in — saves will now work ✓");
    }
    setLoginLoading(false);
  };

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [profilesRes, paymentsRes, likesRes, leadsRes, reportsRes] = await Promise.all([
        supabase.from("profiles")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10000),
        supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(1000),
        supabase.from("likes").select("id, is_rose", { count: "exact" }),
        (supabase.from as any)("whatsapp_leads").select("id", { count: "exact", head: true }),
        supabase.from("reports").select("id", { count: "exact", head: true }),
      ]);
      if (profilesRes.data) { setProfiles(profilesRes.data as unknown as AdminProfile[]); setDbConnected(true); }
      if (paymentsRes.data) setPayments(paymentsRes.data as Payment[]);
      if (likesRes.data) {
        setLikesCount(likesRes.data.length);
        setSuperLikesCount(likesRes.data.filter((l: any) => l.is_rose).length);
      }
      if (leadsRes.count !== null) setWhatsappLeadsCount(leadsRes.count);
      if (reportsRes.count !== null) setReportsCount(reportsRes.count);
    } catch (_) {
      setDbConnected(false);
    }
    setRefreshing(false);
  };

  // Auto-refresh overview every 60 seconds
  useEffect(() => {
    const id = setInterval(() => { if (!refreshing) loadData(); }, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing]);

  // ── Revenue calcs ────────────────────────────────────────────────
  const revTotal = rev(payments);
  const revToday = rev(payments, startOf("day"));
  const revWeek = rev(payments, startOf("week"));
  const revMonth = rev(payments, startOf("month"));

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
  const featureRev = payments.filter(p => p.status === "paid" && !p.target_user_id).reduce((s, p) => s + p.amount_cents, 0) / 100;

  // ── User stats ───────────────────────────────────────────────────
  const activeCount = profiles.filter(p => p.is_active && !p.is_banned).length;
  const bannedCount = profiles.filter(p => p.is_banned).length;
  const hiddenCount = profiles.filter(p => p.hidden_until && new Date(p.hidden_until) > new Date()).length;
  const spotlightCount = profiles.filter(p => p.is_spotlight).length;
  const onlineNow = profiles.filter(p => isOnlineNow(p.last_seen_at)).length;
  const newToday = profiles.filter(p => isNewToday(p.created_at)).length;
  const verifiedCount = profiles.filter(p => (p as any).is_verified).length;
  const pendingVerifyCount2 = profiles.filter((p: any) => p.verification_status === "pending").length;

  // Feature revenue breakdown
  const featureRevByType = useMemo(() => {
    const map: Record<string, number> = {};
    payments.filter(p => p.status === "paid" && !p.target_user_id).forEach(p => {
      const key = (p as any).feature_id || "other";
      map[key] = (map[key] || 0) + p.amount_cents / 100;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [payments]);

  // Per-package revenue + purchase count breakdown
  const packageBreakdown = useMemo(() => {
    const meta: Record<string, { label: string; colorBar: string; colorText: string; emoji: string }> = {
      vip: { label: "VIP Monthly", colorBar: "bg-amber-400", colorText: "text-amber-400", emoji: "👑" },
      boost: { label: "Profile Boost", colorBar: "bg-pink-400", colorText: "text-pink-400", emoji: "🚀" },
      superlike: { label: "Super Like", colorBar: "bg-rose-400", colorText: "text-rose-400", emoji: "⭐" },
      verified: { label: "Verification", colorBar: "bg-sky-400", colorText: "text-sky-400", emoji: "✅" },
      incognito: { label: "Incognito", colorBar: "bg-slate-400", colorText: "text-slate-400", emoji: "👁️" },
      spotlight: { label: "Spotlight", colorBar: "bg-yellow-400", colorText: "text-yellow-400", emoji: "🔦" },
      plusone: { label: "Plus One", colorBar: "bg-emerald-400", colorText: "text-emerald-400", emoji: "👫" },
      whatsapp: { label: "WhatsApp Unlock", colorBar: "bg-green-400", colorText: "text-green-400", emoji: "💬" },
      other: { label: "Other", colorBar: "bg-white/30", colorText: "text-white/50", emoji: "📦" },
    };
    const map: Record<string, { revenue: number; count: number } & typeof meta[string]> = {};
    payments.filter(p => p.status === "paid").forEach(p => {
      const key = p.target_user_id ? "whatsapp" : ((p as any).feature_id || "other");
      if (!map[key]) map[key] = { ...(meta[key] ?? { label: key, colorBar: "bg-white/30", colorText: "text-white/50", emoji: "📦" }), revenue: 0, count: 0 };
      map[key].revenue += p.amount_cents / 100;
      map[key].count += 1;
    });
    return Object.entries(map).map(([id, d]) => ({ id, ...d })).sort((a, b) => b.revenue - a.revenue);
  }, [payments]);

  // Failed / pending Stripe payments with customer details
  const failedPayments = useMemo(() => {
    const stageMap: Record<string, string> = {
      pending: "Checkout opened — not completed",
      failed: "Card declined / payment failed",
      expired: "Session expired (cart abandoned)",
      canceled: "User canceled at checkout",
    };
    return payments
      .filter(p => p.status !== "paid")
      .map(p => {
        const profile = profiles.find(u => u.id === p.user_id);
        return {
          ...p,
          customerName: profile?.name ?? "Unknown User",
          customerWhatsApp: profile?.whatsapp ?? "—",
          customerCountry: profile?.country ?? "—",
          stage: stageMap[p.status] ?? `Status: ${p.status}`,
          packageLabel: p.target_user_id ? "WhatsApp Unlock" : ((p as any).feature_id ?? "Premium Feature"),
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [payments, profiles]);

  // Country breakdown (all countries, with online count per country)
  const countryBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    const online: Record<string, number> = {};
    profiles.forEach(p => {
      const c = p.country || "Unknown";
      totals[c] = (totals[c] || 0) + 1;
      if (isOnlineNow(p.last_seen_at)) online[c] = (online[c] || 0) + 1;
    });
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([country, count]) => ({ country, count, onlineNow: online[country] || 0 }));
  }, [profiles]);

  // ── Filtered + sorted users ──────────────────────────────────────
  const filteredProfiles = useMemo(() => {
    let list = profiles.filter(p => {
      const q = search.toLowerCase();
      if (q && !p.name.toLowerCase().includes(q) && !(p.country ?? "").toLowerCase().includes(q) && !p.whatsapp.includes(q) && !(p.city ?? "").toLowerCase().includes(q) && !(p.bio ?? "").toLowerCase().includes(q)) return false;
      if (userFilter === "active") return p.is_active && !p.is_banned;
      if (userFilter === "banned") return p.is_banned;
      if (userFilter === "hidden") return !!(p.hidden_until && new Date(p.hidden_until) > new Date());
      if (userFilter === "spotlight") return p.is_spotlight;
      if (userFilter === "mock") return !!p.is_mock;
      if (userFilter === "verified") return !!(p as any).is_verified;
      return true;
    });
    list = [...list].sort((a, b) => {
      const va = (a as any)[sortField] ?? "";
      const vb = (b as any)[sortField] ?? "";
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [profiles, search, userFilter, sortField, sortDir]);

  const mockCount = useMemo(() => profiles.filter(p => p.is_mock).length, [profiles]);

  const filterCounts = useMemo(() => ({
    all: profiles.length,
    active: profiles.filter(p => p.is_active && !p.is_banned).length,
    banned: profiles.filter(p => p.is_banned).length,
    hidden: profiles.filter(p => !!(p.hidden_until && new Date(p.hidden_until) > new Date())).length,
    spotlight: profiles.filter(p => p.is_spotlight).length,
    mock: profiles.filter(p => !!p.is_mock).length,
    verified: profiles.filter(p => !!(p as any).is_verified).length,
  }), [profiles]);

  // ── App Alerts computation ───────────────────────────────────────
  const appAlerts = useMemo((): AlertItem[] => {
    const list: AlertItem[] = [];
    if (!dbConnected) list.push({ id: "db", level: "critical", title: "Database Offline", detail: "Supabase is not responding. All data fetching and saving is broken.", icon: <WifiOff className="w-4 h-4" />, action: "Add real credentials to .env.local and restart dev server" });
    if (reportsCount > 0) list.push({ id: "reports", level: "critical", title: `${reportsCount} User Reports Pending`, detail: "Users have reported content or accounts that need review.", icon: <AlertCircle className="w-4 h-4" />, action: "Review reports in Supabase dashboard" });
    const pendingVerify = profiles.filter((p: any) => p.verification_status === "pending").length;
    if (pendingVerify > 0) list.push({ id: "verify", level: "warning", title: `${pendingVerify} ID Verifications Pending`, detail: "Users are waiting for identity verification approval.", icon: <UserCheck className="w-4 h-4" />, action: "Go to Verify tab to approve or reject" });
    const countryOverridePending = profiles.filter(p => p.country_override_requested && !p.country_override_approved).length;
    if (countryOverridePending > 0) list.push({ id: "country_override", level: "warning", title: `${countryOverridePending} Country Override Request${countryOverridePending > 1 ? "s" : ""} Pending`, detail: "Users want to list their profile in a country different from their phone prefix. Review in Users tab.", icon: <MapPin className="w-4 h-4" />, action: "Open user → Actions → Approve Country Override" });
    const failedPaymentsCount = payments.filter(p => p.status !== "paid").length;
    if (failedPaymentsCount > 0) list.push({ id: "payments", level: "warning", title: `${failedPaymentsCount} Failed / Pending Payments`, detail: "Some payment transactions did not complete successfully.", icon: <CreditCard className="w-4 h-4" />, action: "Check Income tab for customer details" });
    const noAvatarCount = profiles.filter(p => !p.avatar_url).length;
    if (noAvatarCount > 5) list.push({ id: "avatars", level: "warning", title: `${noAvatarCount} Profiles Without Photos`, detail: "These users have no profile image and will not appear attractive to matches.", icon: <Image className="w-4 h-4" />, action: "Upload images via Users tab or contact users" });
    const bannedCount2 = profiles.filter(p => p.is_banned).length;
    if (bannedCount2 > 10) list.push({ id: "bans", level: "warning", title: `High Ban Rate: ${bannedCount2} Banned Users`, detail: "A large number of users are currently banned.", icon: <Ban className="w-4 h-4" />, action: "Review ban reasons and ensure policies are clear" });
    if (profiles.length > 0 && dbConnected) list.push({ id: "health", level: "info", title: `${profiles.length} Total Users in Database`, detail: `${profiles.filter(p => p.is_active && !p.is_banned).length} active · ${profiles.filter(p => isOnlineNow(p.last_seen_at)).length} online now`, icon: <Activity className="w-4 h-4" /> });
    if (payments.filter(p => p.status === "paid").length > 0) list.push({ id: "revenue", level: "info", title: "Stripe Payments Active", detail: `${payments.filter(p => p.status === "paid").length} successful transactions totalling ${fmtRev(rev(payments))}`, icon: <CreditCard className="w-4 h-4" /> });
    return list;
  }, [dbConnected, reportsCount, profiles, payments]);

  const alertsBadge = appAlerts.filter(a => a.level === "critical" || a.level === "warning").length;

  // ── Actions ──────────────────────────────────────────────────────
  const rlsErr = (err: { message?: string; code?: string }) => {
    const isRls = err.message?.toLowerCase().includes("policy") ||
      err.message?.toLowerCase().includes("violates") ||
      err.code === "42501";
    toast.error(
      isRls
        ? "RLS blocked this action. Go to Admin \u2192 Setup tab and run all 4 SQL steps in Supabase."
        : err.message ?? "Unknown error",
      { duration: isRls ? 7000 : 4000 }
    );
  };

  const handleBan = async (userId: string, ban: boolean) => {
    setActionLoading(userId);
    const { error } = await supabase.from("profiles").update({ is_banned: ban }).eq("id", userId);
    if (error) rlsErr(error);
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
    if (error) { rlsErr(error); setActionLoading(null); return; }
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
    if (error) rlsErr(error);
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
    if (error) rlsErr(error);
    else {
      toast.success("Profile reactivated");
      setProfiles(p => p.map(u => u.id === userId ? { ...u, hidden_until: null, is_active: true } : u));
    }
    setActionLoading(null);
  };

  const handleMock = async (userId: string, mock: boolean) => {
    setActionLoading(userId);
    const { error } = await (supabase.from("profiles").update as any)({ is_mock: mock }).eq("id", userId);
    if (error) rlsErr(error);
    else {
      toast.success(mock ? "Marked as mock profile" : "Removed mock flag");
      setProfiles(p => p.map(u => u.id === userId ? { ...u, is_mock: mock } : u));
      if (selectedUser?.id === userId) setSelectedUser(u => u ? { ...u, is_mock: mock } : u);
    }
    setActionLoading(null);
  };

  const handleVerify = async (userId: string, verify: boolean) => {
    setActionLoading(`verify-${userId}`);
    const { error } = await (supabase.from("profiles").update as any)({
      is_verified: verify,
      verification_status: verify ? "approved" : null,
    }).eq("id", userId);
    if (error) rlsErr(error);
    else {
      toast.success(verify ? "✅ User verified" : "Verification removed");
      setProfiles(p => p.map(u => u.id === userId ? { ...u, is_verified: verify, verification_status: verify ? "approved" : null } : u));
      if (selectedUser?.id === userId) setSelectedUser(u => u ? { ...u, is_verified: verify } : u);
    }
    setActionLoading(null);
  };

  const handleApproveCountryOverride = async (userId: string) => {
    const { error } = await (supabase.from("profiles").update as any)({
      country_override_approved: true,
      country_override_requested: false,
    }).eq("id", userId);
    if (error) rlsErr(error);
    else {
      toast.success("Country override approved ✓");
      setProfiles(p => p.map(u => u.id === userId ? { ...u, country_override_approved: true, country_override_requested: false } : u));
      setSelectedUser(u => u && u.id === userId ? { ...u, country_override_approved: true, country_override_requested: false } : u);
    }
  };

  const handleEditProfile = async (userId: string, updates: Partial<AdminProfile>) => {
    const { data, error } = await (supabase.from("profiles").update as any)(updates).eq("id", userId).select("id");
    if (error) {
      rlsErr(error);
    } else if (!data || data.length === 0) {
      toast.error("Save blocked by database policy — please log in as admin first, then retry.");
    } else {
      toast.success("Profile updated ✓");
      setProfiles(p => p.map(u => u.id === userId ? { ...u, ...updates } : u));
      setSelectedUser(u => u && u.id === userId ? { ...u, ...updates } : u);
    }
  };

  const handleUploadImages = async (userId: string, files: File[]) => {
    setActionLoading(`upload-images:${userId}`);
    try {
      if (files.length !== 2) throw new Error("Please select exactly 2 images");

      const toPayload = async (file: File) => {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.onload = () => {
            const res = String(reader.result || "");
            const comma = res.indexOf(",");
            resolve(comma >= 0 ? res.slice(comma + 1) : res);
          };
          reader.readAsDataURL(file);
        });

        const extFromName = file.name.split(".").pop()?.toLowerCase();
        const ext = extFromName && /^[a-z0-9]+$/.test(extFromName) ? extFromName : "png";
        return { base64, contentType: file.type || "image/png", ext };
      };

      const images = await Promise.all(files.map(toPayload));
      const { data, error } = await supabase.functions.invoke("admin-upload-profile-images", {
        body: { targetUserId: userId, images },
      });

      if (error) throw error;
      if (!data?.success) throw new Error("Upload failed");

      toast.success("Images uploaded");
      setProfiles((p) => p.map((u) => (u.id === userId ? { ...u, avatar_url: data.avatar_url } : u)));
      setSelectedUser((u) => (u && u.id === userId ? { ...u, avatar_url: data.avatar_url } : u));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setActionLoading(null);
    }
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
    const a = document.createElement("a"); a.href = url; a.download = "2DateMe_users.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredProfiles.length} users`);
  };

  const sortToggle = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  // ── Loading ──────────────────────────────────────────────────────
  if (loading || !isAdmin) return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
        <Shield className="w-6 h-6 text-white animate-pulse" />
      </div>
      <p className="text-white/40 text-sm font-medium">Loading Admin Dashboard…</p>
    </div>
  );

  // ── Login overlay (no session) ───────────────────────────────────
  if (needsLogin) return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 px-6">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
        <Shield className="w-6 h-6 text-white" />
      </div>
      <p className="text-white font-bold text-lg">Admin Login Required</p>
      <p className="text-white/50 text-sm text-center">Sign in with your admin account to enable saves</p>
      <div className="w-full max-w-sm space-y-3">
        <input
          type="email" placeholder="Admin email" value={loginEmail}
          onChange={e => setLoginEmail(e.target.value)}
          className="w-full h-12 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 px-4 text-sm outline-none focus:border-pink-500"
        />
        <input
          type="password" placeholder="Password" value={loginPassword}
          onChange={e => setLoginPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdminLogin()}
          className="w-full h-12 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 px-4 text-sm outline-none focus:border-pink-500"
        />
        {loginError && <p className="text-red-400 text-xs px-1">{loginError}</p>}
        <button
          onClick={handleAdminLogin} disabled={loginLoading || !loginEmail || !loginPassword}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm disabled:opacity-50"
        >
          {loginLoading ? "Signing in…" : "Sign In"}
        </button>
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────
  const pendingVerifyCount = profiles.filter((p: any) => (p as any).verification_status === "pending").length;

  const TABS: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: "users", label: `Users`, icon: <Users className="w-3.5 h-3.5" />, badge: profiles.length },
    { id: "income", label: "Income", icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: "alerts", label: "Alerts", icon: <Bell className="w-3.5 h-3.5" />, badge: alertsBadge || undefined },
    { id: "verify", label: "Verify", icon: <UserCheck className="w-3.5 h-3.5" />, badge: pendingVerifyCount || undefined },
    { id: "setup", label: "Setup", icon: <Settings className="w-3.5 h-3.5" /> },
    { id: "ads", label: "Ads", icon: <Image className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-[#0a0a0a]/95 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">Admin Dashboard</span>
          </div>
          {alertsBadge > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{alertsBadge}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/admin/whatsapp-leads")}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 border border-green-500 rounded-lg hover:bg-green-700 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-bold">WhatsApp Leads</span>
          </button>
          <button
            onClick={() => navigate("/admin/world-map")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 border border-blue-500 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Globe className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-bold">World Map</span>
          </button>
          <button
            onClick={() => navigate("/test")}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 border border-purple-500 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <span className="text-white text-sm font-bold">Test</span>
          </button>
          <span className={`w-2 h-2 rounded-full ${dbConnected ? "bg-green-400" : "bg-red-400"}`} />
          <span className="text-[10px] text-white/40 font-medium">{dbConnected ? "Live" : "Offline"}</span>
          <button
            onClick={loadData}
            className={`w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-colors ${refreshing ? "animate-spin" : ""}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex px-3 pt-3 gap-1 flex-shrink-0 bg-[#0a0a0a] border-b border-white/8 pb-3">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 transition-all relative ${tab === t.id
              ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
              : "bg-white/8 text-white/50 hover:bg-white/12 hover:text-white/70"
              }`}
          >
            {t.icon}{t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span className={`absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full text-[8px] font-bold flex items-center justify-center px-0.5 ${tab === t.id ? "bg-white text-pink-600" : "bg-pink-500 text-white"}`}>
                {t.badge > 99 ? "99+" : t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ══ OVERVIEW TAB ══════════════════════════════════════════ */}
        {tab === "overview" && (
          <>
            {/* Alerts banner if issues */}
            {alertsBadge > 0 && (
              <button onClick={() => setTab("alerts")} className="w-full flex items-center gap-3 p-3 bg-red-500/15 border border-red-500/30 rounded-2xl text-left">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-400 font-semibold text-sm">{alertsBadge} issue{alertsBadge > 1 ? "s" : ""} need attention</p>
                  <p className="text-red-400/70 text-xs">Tap to view alerts →</p>
                </div>
              </button>
            )}

            {/* Revenue cards */}
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">💰 Revenue</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Today", value: fmtRev(revToday), sub: `${payments.filter(p => p.status === "paid" && new Date(p.created_at) >= startOf("day")).length} txns`, bg: "bg-green-500/15 border-green-500/30", val: "text-green-400" },
                  { label: "This Week", value: fmtRev(revWeek), sub: "since Monday", bg: "bg-emerald-500/15 border-emerald-500/30", val: "text-emerald-400" },
                  { label: "This Month", value: fmtRev(revMonth), sub: "since 1st", bg: "bg-teal-500/15 border-teal-500/30", val: "text-teal-400" },
                  { label: "All Time", value: fmtRev(revTotal), sub: `${payments.filter(p => p.status === "paid").length} payments`, bg: "bg-pink-500/15 border-pink-500/30", val: "text-pink-400" },
                ].map(({ label, value, sub, bg, val }) => (
                  <div key={label} className={`border rounded-2xl p-3 shadow-sm ${bg}`}>
                    <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider">{label}</p>
                    <p className={`font-bold text-2xl mt-0.5 ${val}`}>{value}</p>
                    <p className="text-white/30 text-[9px] mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Geographic Lead Organizer */}
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">🗺️ Geographic Lead Organizer</p>
              <WhatsAppCountryList />
            </div>

            {/* Revenue by product */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-3">Revenue by Product</p>
              <div className="flex gap-3">
                <div className="flex-1 text-center bg-green-500/15 border border-green-500/25 rounded-xl p-3">
                  <MessageSquare className="w-5 h-5 text-green-400 mx-auto mb-1" />
                  <p className="text-green-400 font-bold text-lg">{fmtRev(whatsappRev)}</p>
                  <p className="text-white/30 text-[9px]">WhatsApp Unlocks</p>
                </div>
                <div className="flex-1 text-center bg-amber-500/15 border border-amber-500/25 rounded-xl p-3">
                  <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <p className="text-amber-400 font-bold text-lg">{fmtRev(featureRev)}</p>
                  <p className="text-white/30 text-[9px]">Premium Features</p>
                </div>
              </div>
            </div>

            {/* Feature revenue breakdown */}
            {featureRevByType.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-3">Revenue by Feature</p>
                <div className="space-y-2.5">
                  {featureRevByType.map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-white/60 text-xs capitalize flex-1">{key.replace(/_/g, " ")}</span>
                      <div className="w-24 bg-white/10 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-pink-400 to-rose-400 rounded-full" style={{ width: `${(val / (featureRevByType[0]?.[1] || 1)) * 100}%` }} />
                      </div>
                      <span className="text-pink-400 text-xs font-bold w-14 text-right">${val.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7-day revenue chart */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-2">Revenue — Last 7 Days</p>
              <BarChart data={last7Days} color="hsl(330,80%,60%)" />
            </div>

            {/* User stats grid */}
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">👥 Users</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Online Now", value: onlineNow, bg: "bg-green-500/15 border-green-500/25", val: "text-green-400", icon: <Activity className="w-4 h-4" /> },
                  { label: "New Today", value: newToday, bg: "bg-blue-500/15 border-blue-500/25", val: "text-blue-400", icon: <Calendar className="w-4 h-4" /> },
                  { label: "Active", value: activeCount, bg: "bg-pink-500/15 border-pink-500/25", val: "text-pink-400", icon: <Users className="w-4 h-4" /> },
                  { label: "Verified", value: verifiedCount, bg: "bg-sky-500/15 border-sky-500/25", val: "text-sky-400", icon: <BadgeCheck className="w-4 h-4" /> },
                  { label: "ID Pending", value: pendingVerifyCount2, bg: "bg-orange-500/15 border-orange-500/25", val: "text-orange-400", icon: <UserCheck className="w-4 h-4" /> },
                  { label: "WA Leads", value: whatsappLeadsCount, bg: "bg-emerald-500/15 border-emerald-500/25", val: "text-emerald-400", icon: <MessageSquare className="w-4 h-4" /> },
                  { label: "Banned", value: bannedCount, bg: "bg-red-500/15 border-red-500/25", val: "text-red-400", icon: <Ban className="w-4 h-4" /> },
                  { label: "Spotlight", value: spotlightCount, bg: "bg-amber-500/15 border-amber-500/25", val: "text-amber-400", icon: <Star className="w-4 h-4" /> },
                  { label: "Reports", value: reportsCount, bg: reportsCount > 0 ? "bg-red-500/15 border-red-500/30" : "bg-white/5 border-white/10", val: reportsCount > 0 ? "text-red-400" : "text-white/40", icon: <AlertTriangle className="w-4 h-4" /> },
                  { label: "Mock Profiles", value: mockCount, bg: mockCount > 0 ? "bg-purple-500/15 border-purple-500/25" : "bg-white/5 border-white/10", val: mockCount > 0 ? "text-purple-400" : "text-white/40", icon: <Eye className="w-4 h-4" /> },
                ].map(({ label, value, bg, val, icon }) => (
                  <div key={label} className={`border rounded-2xl p-3 text-center ${bg}`}>
                    <span className={`flex justify-center ${val}`}>{icon}</span>
                    <p className={`font-bold text-xl mt-1 ${val}`}>{value}</p>
                    <p className="text-white/30 text-[9px] mt-0.5 font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-pink-500/10 border border-pink-500/25 rounded-2xl p-4 text-center">
                <Heart className="w-5 h-5 text-pink-400 mx-auto mb-1" fill="currentColor" />
                <p className="text-pink-400 font-bold text-2xl">{likesCount.toLocaleString()}</p>
                <p className="text-white/30 text-[9px] font-medium mt-0.5">Total Likes</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 text-center">
                <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" fill="currentColor" />
                <p className="text-amber-400 font-bold text-2xl">{superLikesCount.toLocaleString()}</p>
                <p className="text-white/30 text-[9px] font-medium mt-0.5">Super Likes</p>
              </div>
            </div>

            {/* Signups chart */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-2">New Signups — Last 7 Days</p>
              <BarChart data={last7Signups} color="hsl(174,72%,40%)" />
            </div>

            {/* Top countries */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-3">
                <Globe className="w-3.5 h-3.5 inline mr-1" />Top Countries
              </p>
              <div className="space-y-2.5">
                {countryBreakdown.slice(0, 10).map(({ country, count, onlineNow: cOnline }) => (
                  <div key={country} className="flex items-center gap-2">
                    <span className="text-white/70 text-xs w-24 truncate font-medium">{country}</span>
                    <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-pink-400 to-rose-400 rounded-full" style={{ width: `${(count / profiles.length) * 100}%` }} />
                    </div>
                    <span className="text-white/40 text-[10px] w-6 text-right font-medium">{count}</span>
                    {cOnline > 0 && <span className="text-green-400 text-[10px] w-10 text-right font-bold">●{cOnline}</span>}
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Name, country, WhatsApp..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl h-9 text-sm"
                />
              </div>
              <button onClick={exportCSV} className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-medium">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>

            {/* Filter chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {(["all", "active", "banned", "hidden", "spotlight", "mock", "verified"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setUserFilter(f)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all capitalize flex items-center gap-1 ${userFilter === f
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                    : "bg-white/5 border border-white/10 text-white/50 hover:border-white/25"
                    }`}
                >
                  {f}
                  <span className={`rounded-full px-1 min-w-[16px] text-center text-[9px] font-black ${userFilter === f ? "bg-white/25 text-white" : "bg-white/8 text-white/40"
                    }`}>{filterCounts[f]}</span>
                </button>
              ))}
            </div>

            {/* Sort bar */}
            <div className="flex gap-2 text-[10px] text-white/40 items-center">
              <span className="font-medium">Sort:</span>
              {(["name", "created_at", "last_seen_at"] as const).map(f => (
                <button key={f} onClick={() => sortToggle(f)}
                  className={`flex items-center gap-0.5 font-semibold ${sortField === f ? "text-pink-400" : "hover:text-white/60"}`}>
                  {f === "name" ? "Name" : f === "created_at" ? "Joined" : "Last Seen"}
                  {sortField === f && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </button>
              ))}
              <span className="ml-auto text-white/25 font-medium">{filteredProfiles.length} shown</span>
            </div>

            {/* User rows */}
            {filteredProfiles.map((profile, i) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.015, 0.3) }}
                onClick={() => setSelectedUser(profile)}
                className="bg-white/5 border border-white/8 rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:bg-white/8 hover:border-white/15 transition-all active:scale-[0.99]"
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0 ring-2 ring-white/10" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-white/40" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-white font-semibold text-sm truncate">{profile.name}, {profile.age}</p>
                    {(profile as any).is_verified && <BadgeCheck className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />}
                    {profile.is_banned && <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5">Ban</Badge>}
                    {profile.is_spotlight && <Badge className="text-[8px] px-1 py-0 h-3.5 bg-amber-500 border-0 text-white">⭐</Badge>}
                    {profile.is_mock && <Badge className="text-[8px] px-1 py-0 h-3.5 bg-purple-500 border-0 text-white">Mock</Badge>}
                    {isOnlineNow(profile.last_seen_at) && <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />}
                  </div>
                  <p className="text-white/40 text-[10px] truncate">{profile.gender} · {profile.country || "Unknown"} · {profile.whatsapp}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleVerify(profile.id, !(profile as any).is_verified); }}
                  disabled={actionLoading === `verify-${profile.id}`}
                  className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold transition-all border ${(profile as any).is_verified ? "bg-sky-500/15 border-sky-500/40 text-sky-400 hover:bg-sky-500/25" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70"}`}
                >
                  <BadgeCheck className="w-3 h-3" />
                  {(profile as any).is_verified ? "Verified" : "Verify"}
                </button>
                <ChevronDown className="w-4 h-4 text-white/20 flex-shrink-0 -rotate-90" />
              </motion.div>
            ))}

            {filteredProfiles.length === 0 && (
              <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                <Users className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-white/40 text-sm">No users match this filter</p>
              </div>
            )}
          </>
        )}

        {/* ══ INCOME TAB ════════════════════════════════════════════ */}
        {tab === "income" && (
          <>
            {/* All-time hero card */}
            <div className="bg-gradient-to-br from-green-600/80 to-emerald-700/80 border border-green-500/30 rounded-2xl p-5 text-center text-white">
              <TrendingUp className="w-6 h-6 mx-auto mb-1 opacity-80" />
              <p className="text-green-100 text-xs font-medium">All-Time Revenue</p>
              <p className="font-bold text-4xl mt-1">{fmtRev(revTotal)}</p>
              <p className="text-green-200 text-[10px] mt-2">{payments.filter(p => p.status === "paid").length} completed · {payments.filter(p => p.status !== "paid").length} pending/failed</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Today", value: fmtRev(revToday), bg: "bg-blue-500/15 border-blue-500/30", val: "text-blue-400" },
                { label: "This Month", value: fmtRev(revMonth), bg: "bg-violet-500/15 border-violet-500/30", val: "text-violet-400" },
              ].map(({ label, value, bg, val }) => (
                <div key={label} className={`border rounded-2xl p-4 text-center ${bg}`}>
                  <p className="text-white/40 text-[9px] font-bold uppercase">{label}</p>
                  <p className={`font-bold text-2xl mt-1 ${val}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* 7-day chart */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-2">Daily Revenue (7d)</p>
              <BarChart data={last7Days} color="hsl(142,71%,45%)" />
            </div>

            {/* ── Package popularity breakdown ─────────────────── */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Package Revenue &amp; Popularity</p>
                <span className="text-white/25 text-[10px]">{packageBreakdown.reduce((s, p) => s + p.count, 0)} sales</span>
              </div>
              {packageBreakdown.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-4">No paid transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {packageBreakdown.map((pkg, i) => {
                    const maxRev = packageBreakdown[0].revenue;
                    const maxCount = Math.max(...packageBreakdown.map(p => p.count));
                    return (
                      <div key={pkg.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base leading-none">{pkg.emoji}</span>
                            <span className={`font-semibold text-xs ${pkg.colorText}`}>{pkg.label}</span>
                            {i === 0 && <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full px-1.5 py-0.5 font-bold">TOP</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white/40 text-[10px]">{pkg.count}×</span>
                            <span className={`font-bold text-sm ${pkg.colorText}`}>{fmtRev(pkg.revenue)}</span>
                          </div>
                        </div>
                        {/* Revenue bar */}
                        <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${pkg.colorBar} rounded-full transition-all duration-700`}
                            style={{ width: `${(pkg.revenue / maxRev) * 100}%` }}
                          />
                        </div>
                        {/* Purchase count bar */}
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${pkg.colorBar} opacity-40 rounded-full transition-all duration-700`}
                            style={{ width: `${(pkg.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Split legend */}
              {revTotal > 0 && (
                <div className="pt-2 border-t border-white/8 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full overflow-hidden flex">
                    <div className="bg-green-400" style={{ width: `${(whatsappRev / revTotal) * 100}%` }} />
                    <div className="bg-amber-400 flex-1" />
                  </div>
                  <span className="text-green-400 text-[10px] font-semibold whitespace-nowrap">💬 {fmtRev(whatsappRev)}</span>
                  <span className="text-amber-400 text-[10px] font-semibold whitespace-nowrap">⚡ {fmtRev(featureRev)}</span>
                </div>
              )}
            </div>

            {/* ── Failed / incomplete payments ─────────────────── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Failed &amp; Incomplete Payments
                </p>
                {failedPayments.length > 0 && (
                  <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5 font-bold">
                    {failedPayments.length} issues
                  </span>
                )}
              </div>
              {failedPayments.length === 0 ? (
                <div className="text-center py-8 bg-green-500/8 border border-green-500/15 rounded-2xl">
                  <CheckCircle2 className="w-7 h-7 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 text-sm font-semibold">All payments successful</p>
                  <p className="text-white/30 text-[11px] mt-0.5">No failed or abandoned checkouts</p>
                </div>
              ) : (
                failedPayments.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.4) }}
                    className="bg-red-500/8 border border-red-500/20 rounded-2xl p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{p.customerName}</p>
                          <p className="text-white/50 text-[10px]">{p.customerCountry}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-red-400 font-bold text-sm">${(p.amount_cents / 100).toFixed(2)}</p>
                        <p className="text-white/30 text-[9px]">{new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <div className="bg-white/5 rounded-xl p-2">
                        <p className="text-white/30 mb-0.5">Package</p>
                        <p className="text-white/80 font-semibold">{p.packageLabel}</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2">
                        <p className="text-white/30 mb-0.5">WhatsApp</p>
                        <p className="text-white/80 font-semibold">{p.customerWhatsApp}</p>
                      </div>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/15 rounded-xl px-3 py-2 flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-red-300/80 text-[10px] leading-snug">{p.stage}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* ── All transactions (compact) ───────────────────── */}
            <div className="space-y-2">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">All Transactions</p>
              {payments.map((payment, i) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.012, 0.3) }}
                  className="bg-white/5 border border-white/8 rounded-2xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${payment.status === "paid" ? (payment.target_user_id ? "bg-green-500/20" : "bg-amber-500/20") : "bg-red-500/15"}`}>
                      {payment.status !== "paid"
                        ? <AlertCircle className="w-4 h-4 text-red-400" />
                        : payment.target_user_id
                          ? <MessageSquare className="w-4 h-4 text-green-400" />
                          : <Zap className="w-4 h-4 text-amber-400" />
                      }
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">${(payment.amount_cents / 100).toFixed(2)} <span className="text-white/30 text-[10px] font-normal">{payment.currency.toUpperCase()}</span></p>
                      <p className="text-white/40 text-[10px]">
                        {payment.target_user_id ? "WhatsApp Unlock" : ((payment as any).feature_id ?? "Feature")} · {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${payment.status === "paid" ? "bg-green-500/15 text-green-400" : payment.status === "pending" ? "bg-yellow-500/15 text-yellow-400" : "bg-red-500/15 text-red-400"}`}>
                    {payment.status}
                  </span>
                </motion.div>
              ))}
              {payments.length === 0 && (
                <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                  <DollarSign className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-white/40 text-sm">No payments yet</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ ALERTS TAB ════════════════════════════════════════════ */}
        {tab === "alerts" && (
          <AlertsTab alerts={appAlerts} dbConnected={dbConnected} />
        )}

        {/* ══ SETUP TAB ═════════════════════════════════════════════ */}
        {tab === "setup" && (
          <SetupTab />
        )}

        {/* ══ VERIFY TAB ════════════════════════════════════════════ */}
        {/* ══ ADS TAB ════════════════════════════════════════════════════ */}
        {tab === "ads" && (
          <AdCreatorTab profiles={profiles} />
        )}

        {tab === "verify" && (
          <VerifyTab profiles={profiles} onApprove={async (id) => {
            await supabase.from("profiles").update({ is_verified: true, verification_status: "approved" } as any).eq("id", id);
            toast.success("Profile verified ✓");
            await loadData();
          }} onReject={async (id) => {
            await supabase.from("profiles").update({ is_verified: false, verification_status: "rejected" } as any).eq("id", id);
            toast.success("Verification rejected");
            await loadData();
          }} />
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
            onMock={handleMock}
            onEditProfile={handleEditProfile}
            onUploadImages={handleUploadImages}
            onApproveCountryOverride={handleApproveCountryOverride}
            actionLoading={actionLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPage;
