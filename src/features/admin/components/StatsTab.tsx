import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity, Globe, Monitor, Smartphone, Tablet,
  TrendingUp, Users, Eye, Clock, BarChart2,
  ShieldCheck, Trash2, Ban, BadgeCheck, Star, Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────
interface PageEvent {
  id: string;
  session_id: string;
  page: string;
  country: string | null;
  device: string | null;
  user_id: string | null;
  created_at: string;
}

interface AuditEntry {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
}

interface Props {
  profiles: { created_at: string; last_seen_at: string | null }[];
  payments: { status: string; created_at: string; amount_cents: number }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const dayKey = (iso: string) => iso.slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const ACTION_ICON: Record<string, React.ReactNode> = {
  ban:      <Ban className="w-3 h-3 text-red-400" />,
  unban:    <ShieldCheck className="w-3 h-3 text-green-400" />,
  delete:   <Trash2 className="w-3 h-3 text-rose-400" />,
  verify:   <BadgeCheck className="w-3 h-3 text-sky-400" />,
  unverify: <BadgeCheck className="w-3 h-3 text-white/30" />,
  spotlight:<Star className="w-3 h-3 text-yellow-400" />,
  mock:     <Zap className="w-3 h-3 text-purple-400" />,
};

// ── Mini bar chart ─────────────────────────────────────────────────────────────
const MiniBar = ({ data, color = "#ec4899" }: { data: number[]; color?: string }) => {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-10">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm min-h-[2px] transition-all"
          style={{ height: `${Math.round((v / max) * 100)}%`, background: color, opacity: 0.7 + 0.3 * (i / data.length) }}
        />
      ))}
    </div>
  );
};

// ── Stat card ──────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color = "pink" }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) => {
  const bg = color === "pink" ? "rgba(236,72,153,0.08)" : color === "blue" ? "rgba(59,130,246,0.08)" : color === "green" ? "rgba(34,197,94,0.08)" : "rgba(168,85,247,0.08)";
  const border = color === "pink" ? "rgba(236,72,153,0.2)" : color === "blue" ? "rgba(59,130,246,0.2)" : color === "green" ? "rgba(34,197,94,0.2)" : "rgba(168,85,247,0.2)";
  return (
    <div className="rounded-2xl p-3 flex flex-col gap-1" style={{ background: bg, border: `1px solid ${border}` }}>
      <div className="flex items-center gap-2 text-white/50 text-[10px] font-semibold uppercase tracking-wider">
        {icon}{label}
      </div>
      <p className="text-white font-black text-xl leading-none">{value}</p>
      {sub && <p className="text-white/35 text-[10px]">{sub}</p>}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
export default function StatsTab({ profiles, payments }: Props) {
  const [events, setEvents] = useState<PageEvent[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<7 | 30>(7);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const since = daysAgo(30);
      const [eventsRes, auditRes] = await Promise.all([
        (supabase.from as any)("page_events")
          .select("*")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(5000),
        (supabase.from as any)("admin_audit_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      if (eventsRes.data) setEvents(eventsRes.data);
      if (auditRes.data) setAudit(auditRes.data);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(
    () => events.filter(e => e.created_at >= daysAgo(range)),
    [events, range]
  );

  // ── Traffic metrics ──────────────────────────────────────────────────────────
  const totalViews = filtered.length;
  const uniqueSessions = new Set(filtered.map(e => e.session_id)).size;
  const uniqueUsers = new Set(filtered.filter(e => e.user_id).map(e => e.user_id)).size;
  const avgPagesPerSession = uniqueSessions > 0 ? (totalViews / uniqueSessions).toFixed(1) : "0";

  // Daily views chart (last N days)
  const dailyViews = useMemo(() => {
    const counts: Record<string, number> = {};
    const days = Array.from({ length: range }, (_, i) => {
      const d = new Date(Date.now() - i * 86_400_000);
      return d.toISOString().slice(0, 10);
    }).reverse();
    days.forEach(d => (counts[d] = 0));
    filtered.forEach(e => {
      const k = dayKey(e.created_at);
      if (k in counts) counts[k]++;
    });
    return days.map(d => counts[d]);
  }, [filtered, range]);

  // Top pages
  const topPages = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(e => (counts[e.page] = (counts[e.page] ?? 0) + 1));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [filtered]);

  // Country breakdown
  const topCountries = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(e => {
      const c = e.country ?? "Unknown";
      counts[c] = (counts[c] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [filtered]);

  // Device breakdown
  const deviceCounts = useMemo(() => {
    const counts = { mobile: 0, tablet: 0, desktop: 0 };
    filtered.forEach(e => {
      const d = (e.device ?? "desktop") as keyof typeof counts;
      if (d in counts) counts[d]++;
    });
    return counts;
  }, [filtered]);

  // Signups last N days
  const signupsInRange = profiles.filter(p => p.created_at >= daysAgo(range)).length;
  const activeInRange = profiles.filter(p => p.last_seen_at && p.last_seen_at >= daysAgo(range)).length;
  const paidInRange = payments.filter(p => p.status === "paid" && p.created_at >= daysAgo(range));
  const revenueInRange = paidInRange.reduce((s, p) => s + p.amount_cents, 0) / 100;

  // Daily signups chart
  const dailySignups = useMemo(() => {
    const counts: Record<string, number> = {};
    const days = Array.from({ length: range }, (_, i) =>
      new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10)
    ).reverse();
    days.forEach(d => (counts[d] = 0));
    profiles.forEach(p => {
      const k = dayKey(p.created_at);
      if (k in counts) counts[k]++;
    });
    return days.map(d => counts[d]);
  }, [profiles, range]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 gap-3 text-white/40">
        <Activity className="w-4 h-4 animate-pulse" />
        <span className="text-sm">Loading analytics…</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">

      {/* ── Range selector ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-pink-400" /> Platform Analytics
        </h3>
        <div className="flex gap-1 p-0.5 bg-white/8 rounded-xl border border-white/10">
          {([7, 30] as const).map(n => (
            <button
              key={n}
              onClick={() => setRange(n)}
              className={`px-3 py-1 rounded-[10px] text-[11px] font-bold transition-all ${range === n ? "bg-pink-500/80 text-white" : "text-white/40 hover:text-white/70"}`}
            >
              {n}d
            </button>
          ))}
        </div>
      </div>

      {/* ── Traffic KPIs ──────────────────────────────────────────── */}
      <section>
        <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-2">Traffic — Last {range} days</p>
        <div className="grid grid-cols-2 gap-2">
          <StatCard icon={<Eye className="w-3 h-3" />} label="Page Views" value={totalViews.toLocaleString()} color="pink" />
          <StatCard icon={<Users className="w-3 h-3" />} label="Sessions" value={uniqueSessions.toLocaleString()} color="blue" />
          <StatCard icon={<Activity className="w-3 h-3" />} label="Logged-in Users" value={uniqueUsers.toLocaleString()} sub="with account" color="purple" />
          <StatCard icon={<TrendingUp className="w-3 h-3" />} label="Pages / Session" value={avgPagesPerSession} color="green" />
        </div>
      </section>

      {/* ── Daily views chart ─────────────────────────────────────── */}
      <section className="bg-white/4 border border-white/8 rounded-2xl p-4">
        <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Eye className="w-3 h-3" /> Daily Page Views
        </p>
        <MiniBar data={dailyViews} color="#ec4899" />
        <div className="flex justify-between mt-1 text-[9px] text-white/25">
          <span>{range}d ago</span><span>Today</span>
        </div>
      </section>

      {/* ── Engagement KPIs ───────────────────────────────────────── */}
      <section>
        <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-2">Engagement — Last {range} days</p>
        <div className="grid grid-cols-3 gap-2">
          <StatCard icon={<Users className="w-3 h-3" />} label="Signups" value={signupsInRange} color="green" />
          <StatCard icon={<Activity className="w-3 h-3" />} label="Active" value={activeInRange} sub="seen in range" color="blue" />
          <StatCard icon={<TrendingUp className="w-3 h-3" />} label="Revenue" value={`$${revenueInRange.toFixed(0)}`} color="pink" />
        </div>
      </section>

      {/* ── Daily signups chart ──────────────────────────────────────*/}
      <section className="bg-white/4 border border-white/8 rounded-2xl p-4">
        <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Users className="w-3 h-3" /> Daily Signups
        </p>
        <MiniBar data={dailySignups} color="#22c55e" />
        <div className="flex justify-between mt-1 text-[9px] text-white/25">
          <span>{range}d ago</span><span>Today</span>
        </div>
      </section>

      {/* ── Device breakdown ─────────────────────────────────────── */}
      <section className="bg-white/4 border border-white/8 rounded-2xl p-4">
        <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-3">Device Breakdown</p>
        <div className="flex gap-3">
          {[
            { key: "mobile", icon: <Smartphone className="w-4 h-4 text-pink-400" />, label: "Mobile", color: "#ec4899" },
            { key: "desktop", icon: <Monitor className="w-4 h-4 text-blue-400" />, label: "Desktop", color: "#3b82f6" },
            { key: "tablet", icon: <Tablet className="w-4 h-4 text-purple-400" />, label: "Tablet", color: "#a855f7" },
          ].map(({ key, icon, label, color }) => {
            const count = deviceCounts[key as keyof typeof deviceCounts];
            const pct = totalViews > 0 ? Math.round((count / totalViews) * 100) : 0;
            return (
              <div key={key} className="flex-1 flex flex-col items-center gap-1.5">
                {icon}
                <div className="w-full bg-white/8 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                </div>
                <p className="text-white font-bold text-sm">{pct}%</p>
                <p className="text-white/40 text-[9px]">{label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Top pages ────────────────────────────────────────────── */}
      <section className="bg-white/4 border border-white/8 rounded-2xl p-4">
        <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Globe className="w-3 h-3" /> Top Pages
        </p>
        <div className="space-y-2">
          {topPages.length === 0 && <p className="text-white/25 text-xs text-center py-2">No data yet</p>}
          {topPages.map(([page, count]) => (
            <div key={page} className="flex items-center gap-2">
              <span className="text-white/60 text-[11px] font-mono flex-1 truncate">{page}</span>
              <div className="w-20 bg-white/8 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-pink-500/70"
                  style={{ width: `${totalViews > 0 ? Math.round((count / Math.max(...topPages.map(x => x[1]))) * 100) : 0}%` }}
                />
              </div>
              <span className="text-white/50 text-[10px] w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Country breakdown ────────────────────────────────────── */}
      <section className="bg-white/4 border border-white/8 rounded-2xl p-4">
        <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Globe className="w-3 h-3" /> Traffic by Country
        </p>
        <div className="space-y-2">
          {topCountries.length === 0 && <p className="text-white/25 text-xs text-center py-2">No data yet</p>}
          {topCountries.map(([country, count]) => (
            <div key={country} className="flex items-center gap-2">
              <span className="text-white/70 text-[11px] flex-1 truncate">{country}</span>
              <div className="w-20 bg-white/8 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-blue-400/70"
                  style={{ width: `${totalViews > 0 ? Math.round((count / Math.max(...topCountries.map(x => x[1]))) * 100) : 0}%` }}
                />
              </div>
              <span className="text-white/50 text-[10px] w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Admin Audit Log ──────────────────────────────────────── */}
      <section>
        <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3" /> Admin Action Log
        </p>
        <div className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden">
          {audit.length === 0 ? (
            <p className="text-white/25 text-xs text-center py-6">No admin actions recorded yet</p>
          ) : (
            <div className="divide-y divide-white/5">
              {audit.slice(0, 50).map(entry => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 px-4 py-2.5"
                >
                  <div className="flex-shrink-0">
                    {ACTION_ICON[entry.action] ?? <Activity className="w-3 h-3 text-white/30" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-[11px] font-semibold capitalize">{entry.action.replace(/_/g, " ")}</p>
                    {entry.target_user_id && (
                      <p className="text-white/30 text-[9px] font-mono truncate">{entry.target_user_id}</p>
                    )}
                  </div>
                  <p className="text-white/25 text-[9px] flex-shrink-0">{fmtDate(entry.created_at)}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
