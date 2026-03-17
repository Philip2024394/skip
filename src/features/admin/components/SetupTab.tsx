import React from "react";
import {
  RefreshCw, Zap, Activity, Terminal, ExternalLink, Shield, CheckCircle2, Copy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ── Setup Tab ─────────────────────────────────────────────────────────────────
const SQL_STEPS = [
  {
    step: 1,
    title: "Create user_roles table",
    desc: "Stores which users have the admin role.",
    sql: `CREATE TABLE IF NOT EXISTS public.user_roles (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text        NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);`,
  },
  {
    step: 2,
    title: "Create is_admin() helper function",
    desc: "A secure function that checks if the current user is an admin. Used by all RLS policies.",
    sql: `CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role    = 'admin'
  );
$$;`,
  },
  {
    step: 3,
    title: "Add admin RLS bypass policies",
    desc: "Allows admin to SELECT, UPDATE and DELETE all rows in profiles, payments, likes, reports and whatsapp_leads — bypassing filters that hide inactive, banned or foreign-country profiles.",
    sql: `-- profiles
DROP POLICY IF EXISTS "Admin can select all profiles" ON public.profiles;
CREATE POLICY "Admin can select all profiles"
  ON public.profiles FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;
CREATE POLICY "Admin can update any profile"
  ON public.profiles FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can delete any profile" ON public.profiles;
CREATE POLICY "Admin can delete any profile"
  ON public.profiles FOR DELETE USING (public.is_admin());

-- payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can select all payments" ON public.payments;
CREATE POLICY "Admin can select all payments"
  ON public.payments FOR SELECT USING (public.is_admin());

-- likes
DROP POLICY IF EXISTS "Admin can select all likes" ON public.likes;
CREATE POLICY "Admin can select all likes"
  ON public.likes FOR SELECT USING (public.is_admin());

-- reports
DROP POLICY IF EXISTS "Admin can select all reports" ON public.reports;
CREATE POLICY "Admin can select all reports"
  ON public.reports FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can update reports" ON public.reports;
CREATE POLICY "Admin can update reports"
  ON public.reports FOR UPDATE USING (public.is_admin());

-- whatsapp_leads
DROP POLICY IF EXISTS "Admin can select all whatsapp_leads" ON public.whatsapp_leads;
CREATE POLICY "Admin can select all whatsapp_leads"
  ON public.whatsapp_leads FOR SELECT USING (public.is_admin());`,
  },
  {
    step: 4,
    title: "Grant yourself the admin role",
    desc: "Find your user UUID in: Supabase Dashboard → Authentication → Users → copy the UUID column. Replace the placeholder below.",
    sql: `-- ⚠️ Replace the UUID with YOUR actual Supabase auth user ID
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR-USER-UUID-HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;`,
    warn: true,
  },
];

const SetupTab = () => {
  const [copied, setCopied] = React.useState<number | null>(null);
  const [seeding, setSeeding] = React.useState(false);
  const [refreshing2, setRefreshing2] = React.useState(false);
  const [seedResult, setSeedResult] = React.useState<{ success: boolean; total?: number; created?: number; updated?: number; failed?: number; error?: string } | null>(null);
  const [refreshResult, setRefreshResult] = React.useState<{ success: boolean; updated?: number; total?: number; error?: string } | null>(null);

  const copy = (sql: string, step: number) => {
    navigator.clipboard.writeText(sql).then(() => {
      setCopied(step);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleSeedMockProfiles = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("seed-mock-profiles", { body: {} });
      if (error) throw error;
      setSeedResult(data);
    } catch (err: unknown) {
      setSeedResult({ success: false, error: err instanceof Error ? err.message : String(err) });
    } finally {
      setSeeding(false);
    }
  };

  const handleRefreshOnlineStatus = async () => {
    setRefreshing2(true);
    setRefreshResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("refresh-mock-online-status", { body: {} });
      if (error) throw error;
      setRefreshResult(data);
    } catch (err: unknown) {
      setRefreshResult({ success: false, error: err instanceof Error ? err.message : String(err) });
    } finally {
      setRefreshing2(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Mock Profiles Section ─────────────────────────────── */}
      <div className="bg-purple-500/8 border border-purple-500/20 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <p className="text-purple-300 font-bold text-sm">Mock Profiles</p>
        </div>
        <p className="text-white/50 text-xs leading-relaxed">
          Seed 90 realistic Indonesian mock profiles into Supabase (creates auth users + full profile rows with <strong className="text-white/70">basic info, lifestyle, relationship goals</strong> and Unsplash images). Safe to run multiple times — existing profiles are updated, not duplicated. After seeding, use the <strong className="text-white/70">Users → Mock</strong> filter to view and edit them.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {/* Seed button */}
          <button
            onClick={handleSeedMockProfiles}
            disabled={seeding}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 hover:border-purple-500/50 transition-all font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {seeding ? (
              <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Seeding…</>
            ) : (
              <><Zap className="w-3.5 h-3.5" /> Seed Mock Profiles</>
            )}
          </button>

          {/* Refresh online status button */}
          <button
            onClick={handleRefreshOnlineStatus}
            disabled={refreshing2}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-green-500/15 border border-green-500/25 text-green-400 hover:bg-green-500/25 hover:border-green-500/40 transition-all font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {refreshing2 ? (
              <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating…</>
            ) : (
              <><Activity className="w-3.5 h-3.5" /> Refresh Online Status</>
            )}
          </button>
        </div>

        {/* Seed result */}
        {seedResult && (
          <div className={`rounded-xl px-3 py-2 text-xs font-medium border ${seedResult.success ? "bg-green-500/10 border-green-500/20 text-green-300" : "bg-red-500/10 border-red-500/20 text-red-300"}`}>
            {seedResult.success
              ? `✅ Done — ${seedResult.created} created, ${seedResult.updated} updated, ${seedResult.failed} failed (total ${seedResult.total})`
              : `❌ Error: ${seedResult.error}`}
          </div>
        )}

        {/* Refresh result */}
        {refreshResult && (
          <div className={`rounded-xl px-3 py-2 text-xs font-medium border ${refreshResult.success ? "bg-green-500/10 border-green-500/20 text-green-300" : "bg-red-500/10 border-red-500/20 text-red-300"}`}>
            {refreshResult.success
              ? `✅ Updated last_seen_at for ${refreshResult.updated}/${refreshResult.total} mock profiles`
              : `❌ Error: ${refreshResult.error}`}
          </div>
        )}

        <p className="text-white/30 text-[10px]">
          ⚠️ Requires the edge functions to be deployed. Run: <code className="bg-white/8 px-1 rounded text-purple-300/80">supabase functions deploy seed-mock-profiles</code> and <code className="bg-white/8 px-1 rounded text-purple-300/80">supabase functions deploy refresh-mock-online-status</code>
        </p>
      </div>

      {/* Header */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-pink-400" />
          <p className="text-white font-bold text-sm">Supabase Admin RLS Setup</p>
        </div>
        <p className="text-white/55 text-xs leading-relaxed">
          Run these SQL blocks <strong className="text-white/80">in order</strong> in your{" "}
          <strong className="text-white/80">Supabase Dashboard → SQL Editor</strong>.
          This gives the admin account full read/write access to all profiles from every country,
          bypassing RLS filters that hide inactive or banned users.
        </p>
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 transition-colors font-semibold"
        >
          <ExternalLink className="w-3 h-3" /> Open Supabase Dashboard
        </a>
      </div>

      {/* SQL Steps */}
      {SQL_STEPS.map(({ step, title, desc, sql, warn }) => (
        <div
          key={step}
          className={`border rounded-2xl overflow-hidden ${warn ? "border-amber-500/30 bg-amber-500/5" : "border-white/10 bg-white/5"}`}
        >
          {/* Step header */}
          <div className="flex items-start justify-between gap-3 p-4 pb-2">
            <div className="flex items-start gap-3">
              <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${warn ? "bg-amber-500/25 text-amber-400" : "bg-pink-500/20 text-pink-400"}`}>
                {step}
              </span>
              <div>
                <p className={`font-bold text-sm ${warn ? "text-amber-400" : "text-white"}`}>{title}</p>
                <p className="text-white/45 text-[11px] mt-0.5 leading-snug">{desc}</p>
              </div>
            </div>
            <button
              onClick={() => copy(sql, step)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${copied === step
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white/8 text-white/60 hover:text-white hover:bg-white/15 border border-white/10"
                }`}
            >
              {copied === step ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied === step ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* SQL block */}
          <div className="mx-4 mb-4 bg-[#0d0d0d] border border-white/8 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5 bg-white/3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500/60" />
                <span className="w-2 h-2 rounded-full bg-yellow-500/60" />
                <span className="w-2 h-2 rounded-full bg-green-500/60" />
              </div>
              <span className="text-white/20 text-[10px] font-mono">SQL Editor</span>
            </div>
            <pre className="px-3 py-3 text-[10px] text-green-300/80 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-words">
              {sql}
            </pre>
          </div>
        </div>
      ))}

      {/* How to find user ID */}
      <div className="bg-sky-500/8 border border-sky-500/20 rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-sky-400" />
          <p className="text-sky-400 font-bold text-sm">How to find your User UUID</p>
        </div>
        <ol className="space-y-1.5 text-xs text-white/55 leading-relaxed">
          <li className="flex gap-2"><span className="text-sky-400 font-bold flex-shrink-0">1.</span> Go to <strong className="text-white/70">Supabase Dashboard</strong></li>
          <li className="flex gap-2"><span className="text-sky-400 font-bold flex-shrink-0">2.</span> Click <strong className="text-white/70">Authentication</strong> in the left sidebar</li>
          <li className="flex gap-2"><span className="text-sky-400 font-bold flex-shrink-0">3.</span> Click <strong className="text-white/70">Users</strong></li>
          <li className="flex gap-2"><span className="text-sky-400 font-bold flex-shrink-0">4.</span> Find your email and copy the <strong className="text-white/70">UUID</strong> from the first column</li>
          <li className="flex gap-2"><span className="text-sky-400 font-bold flex-shrink-0">5.</span> Paste it into Step 4's SQL replacing <code className="bg-white/10 px-1 rounded text-sky-300">YOUR-USER-UUID-HERE</code></li>
        </ol>
      </div>

      {/* Verification note */}
      <div className="bg-green-500/8 border border-green-500/15 rounded-2xl p-4">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-green-400 font-bold text-sm">After running all 4 steps</p>
            <p className="text-white/45 text-xs leading-relaxed">
              Sign out and sign back in, then reload this admin page.
              The Users tab will now show <strong className="text-white/70">all profiles from every country</strong> including banned and inactive ones.
              All profile edits, bans and deletions will also work correctly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupTab;
