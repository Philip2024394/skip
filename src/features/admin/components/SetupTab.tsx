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
  {
    step: 6,
    title: "Key & Safe system",
    desc: "Adds key_fragments + keys_balance to profiles, creates key_transactions table, and 3 RPCs: convert_coins_to_key (500 coins → 1 key), award_key_fragment (activity rewards), unlock_with_key (spend key + reveal contact bypassing RLS).",
    sql: `-- Add key columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS key_fragments INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS keys_balance  INTEGER NOT NULL DEFAULT 0;

-- Key transaction log
CREATE TABLE IF NOT EXISTS public.key_transactions (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text        NOT NULL CHECK (type IN ('earn_fragment','combine','purchase','spend','convert_coins')),
  amount     integer     NOT NULL DEFAULT 1,
  reason     text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.key_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own key_transactions"
  ON public.key_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own key_transactions"
  ON public.key_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RPC: 500 coins → 1 key (returns new keys_balance, -1 if insufficient coins)
CREATE OR REPLACE FUNCTION public.convert_coins_to_key(p_user_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_keys integer;
BEGIN
  UPDATE public.profiles
  SET coins_balance = coins_balance - 500,
      keys_balance  = keys_balance  + 1
  WHERE id = p_user_id AND coins_balance >= 500
  RETURNING keys_balance INTO v_keys;
  IF v_keys IS NULL THEN RETURN -1; END IF;
  INSERT INTO public.key_transactions (user_id, type, amount, reason)
  VALUES (p_user_id, 'convert_coins', 1, '500_coins');
  RETURN v_keys;
END; $$;

-- RPC: award 1 fragment, auto-combine when 3 collected
CREATE OR REPLACE FUNCTION public.award_key_fragment(p_user_id uuid, p_reason text DEFAULT 'activity')
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_frags integer; v_keys integer; v_combined boolean := false;
BEGIN
  UPDATE public.profiles
  SET key_fragments = CASE WHEN key_fragments >= 2 THEN 0             ELSE key_fragments + 1 END,
      keys_balance  = CASE WHEN key_fragments >= 2 THEN keys_balance+1 ELSE keys_balance     END
  WHERE id = p_user_id
  RETURNING key_fragments, keys_balance INTO v_frags, v_keys;
  v_combined := (v_frags = 0);
  IF v_combined THEN
    INSERT INTO public.key_transactions (user_id, type, amount, reason)
    VALUES (p_user_id, 'combine', 1, '3_fragments_combined');
  END IF;
  INSERT INTO public.key_transactions (user_id, type, amount, reason)
  VALUES (p_user_id, 'earn_fragment', 1, p_reason);
  RETURN json_build_object('fragments', v_frags, 'keys', v_keys, 'combined', v_combined);
END; $$;

-- RPC: spend 1 key, return contact info (SECURITY DEFINER bypasses RLS on whatsapp_leads)
CREATE OR REPLACE FUNCTION public.unlock_with_key(p_user_id uuid, p_target_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_whatsapp text; v_name text; v_keys integer;
BEGIN
  UPDATE public.profiles
  SET keys_balance = keys_balance - 1
  WHERE id = p_user_id AND keys_balance > 0
  RETURNING keys_balance INTO v_keys;
  IF v_keys IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No keys available');
  END IF;
  INSERT INTO public.key_transactions (user_id, type, amount, reason)
  VALUES (p_user_id, 'spend', 1, 'unlock_' || p_target_id);
  SELECT phone INTO v_whatsapp FROM public.whatsapp_leads WHERE user_id = p_target_id LIMIT 1;
  SELECT name  INTO v_name     FROM public.profiles        WHERE id      = p_target_id;
  INSERT INTO public.connections (user_a, user_b)
  VALUES (p_user_id, p_target_id) ON CONFLICT DO NOTHING;
  RETURN json_build_object(
    'success',   true,
    'whatsapp',  COALESCE(v_whatsapp, ''),
    'name',      COALESCE(v_name, 'Your Match')
  );
END; $$;`,
  },
  {
    step: 7,
    title: "Contact provider + chat-first columns",
    desc: "Adds contact_provider (WhatsApp / Telegram / Instagram / etc.) and chat_first flag to profiles. Used to display provider icons on swipe cards and gate the contact-reveal flow.",
    sql: `-- Add contact provider columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS contact_provider TEXT,
  ADD COLUMN IF NOT EXISTS chat_first       BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.contact_provider IS 'Platform the user prefers for off-app contact: whatsapp | telegram | instagram | tiktok | snapchat | phone | line | wechat | signal | facebook';
COMMENT ON COLUMN public.profiles.chat_first       IS 'When true the user wants to chat in-app before their contact is purchased';`,
  },
  {
    step: 8,
    title: "Teddy Room invite system",
    desc: "Creates teddy_room_invites (invite tracking + Stripe session) and teddy_room_media (shared photos/videos per room pair) tables, with RLS policies so only the two matched users can access each room.",
    sql: `-- Teddy Room invites
CREATE TABLE IF NOT EXISTS public.teddy_room_invites (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_owner_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_user_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status            text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','accepted','declined','expired')),
  stripe_session_id text,
  subscription_id   text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  accepted_at       timestamptz,
  expires_at        timestamptz,
  UNIQUE (room_owner_id, invited_user_id)
);
ALTER TABLE public.teddy_room_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage own invites"
  ON public.teddy_room_invites FOR ALL
  USING (auth.uid() = room_owner_id OR auth.uid() = invited_user_id);
CREATE POLICY "Admin full access invites"
  ON public.teddy_room_invites FOR ALL USING (public.is_admin());

-- Teddy Room shared media
CREATE TABLE IF NOT EXISTS public.teddy_room_media (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_owner_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  uploaded_by     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url       text NOT NULL,
  media_type      text NOT NULL CHECK (media_type IN ('photo','video')),
  caption         text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS teddy_media_room_idx
  ON public.teddy_room_media (room_owner_id, invited_user_id, created_at DESC);
ALTER TABLE public.teddy_room_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Room members can manage media"
  ON public.teddy_room_media FOR ALL
  USING (auth.uid() = room_owner_id OR auth.uid() = invited_user_id);
CREATE POLICY "Admin full access media"
  ON public.teddy_room_media FOR ALL USING (public.is_admin());`,
  },
  {
    step: 9,
    title: "Analytics — page_events table",
    desc: "Stores anonymous page-view events for traffic and engagement stats in the Stats tab.",
    sql: `CREATE TABLE IF NOT EXISTS public.page_events (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text        NOT NULL,
  page       text        NOT NULL,
  country    text,
  device     text,
  user_id    uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS page_events_created_idx ON public.page_events (created_at DESC);
CREATE INDEX IF NOT EXISTS page_events_session_idx ON public.page_events (session_id);
ALTER TABLE public.page_events ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can insert events
CREATE POLICY "Anyone can insert page events"
  ON public.page_events FOR INSERT WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admin can read page events"
  ON public.page_events FOR SELECT USING (public.is_admin());

-- Auto-delete events older than 60 days to keep storage low
CREATE OR REPLACE FUNCTION public.cleanup_old_page_events()
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  DELETE FROM public.page_events
  WHERE created_at < now() - interval '60 days';
$$;`,
  },
  {
    step: 10,
    title: "Analytics — admin_audit_log table",
    desc: "Records every admin action (ban, delete, verify, etc.) with timestamp for accountability.",
    sql: `CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action         text        NOT NULL,
  target_user_id uuid,
  details        jsonb,
  created_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON public.admin_audit_log (created_at DESC);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read or insert
CREATE POLICY "Admin can manage audit log"
  ON public.admin_audit_log FOR ALL USING (public.is_admin());`,
  },
  {
    step: 11,
    title: "Analytics — ad_impressions table",
    desc: "Persists ad view counts to the database so analytics survive page refreshes.",
    sql: `CREATE TABLE IF NOT EXISTS public.ad_impressions (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id      text        NOT NULL,
  country    text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ad_impressions_ad_id_idx ON public.ad_impressions (ad_id, created_at DESC);
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert an impression (ad views fire client-side)
CREATE POLICY "Anyone can insert ad impression"
  ON public.ad_impressions FOR INSERT WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admin can read ad impressions"
  ON public.ad_impressions FOR SELECT USING (public.is_admin());`,
  },
  {
    step: 5,
    title: "Create connect4_games table",
    desc: "Stores Connect 4 game results, bets, and win/loss records. Required for the Games tab in admin.",
    sql: `CREATE TABLE IF NOT EXISTS public.connect4_games (
  id            uuid primary key default gen_random_uuid(),
  player1_id    uuid references public.profiles(id) on delete set null,
  player2_id    uuid references public.profiles(id) on delete set null,
  mode          text not null check (mode in ('vs-bot', 'vs-guest')),
  winner_player smallint check (winner_player in (1, 2)),
  is_draw       boolean not null default false,
  bet_amount    integer not null default 0,
  created_at    timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS connect4_games_player1_idx ON public.connect4_games (player1_id);
CREATE INDEX IF NOT EXISTS connect4_games_player2_idx ON public.connect4_games (player2_id);
CREATE INDEX IF NOT EXISTS connect4_games_created_idx ON public.connect4_games (created_at desc);
ALTER TABLE public.connect4_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can insert own games" ON public.connect4_games FOR INSERT WITH CHECK (auth.uid() = player1_id);
CREATE POLICY "Players can read own games" ON public.connect4_games FOR SELECT USING (auth.uid() = player1_id OR auth.uid() = player2_id);
CREATE POLICY "Admins can read all games" ON public.connect4_games FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can delete games" ON public.connect4_games FOR DELETE USING (public.is_admin());`,
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
