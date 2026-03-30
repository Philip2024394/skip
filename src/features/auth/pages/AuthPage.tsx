import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/button";
import { Input } from "@/shared/components/input";
import { AppLogo } from "@/shared/components";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";


// Cached so we don't re-fetch on every render
let _cachedOnlineCount: number | null = null;
const getDailyOnlineCount = () => _cachedOnlineCount ?? 1_247;

// ── Geo-aware translations ───────────────────────────────────────────────────
type LandingTx = {
  tagline: [string, string, string]; // line1, line2 (yellow), line3
  ctaTitle: string; ctaSub: string; ctaButton: string; ctaHint: string;
  emailPh: string; passPh: string; newMembers: string;
};
const TX: Record<string, LandingTx> = {
  en: { tagline:["{c}'s","Fastest Way to","Meet Singles"], ctaTitle:"Get Started Free", ctaSub:"{n} Online · ♀ Women Always Free", ctaButton:"Continue →", ctaHint:"New here? We'll create your account automatically.", emailPh:"Email address", passPh:"Password", newMembers:"New Members Today" },
  id: { tagline:["Cara Tercepat di","{c}","Temukan Jodoh"], ctaTitle:"Daftar Gratis", ctaSub:"{n} Online · ♀ Wanita Selalu Gratis", ctaButton:"Lanjutkan →", ctaHint:"Baru? Akun akan dibuat otomatis.", emailPh:"Alamat email", passPh:"Kata sandi", newMembers:"Member Baru Hari Ini" },
  ms: { tagline:["Cara Terpantas di","{c}","Cari Pasangan"], ctaTitle:"Mulakan Percuma", ctaSub:"{n} Dalam Talian · ♀ Wanita Sentiasa Percuma", ctaButton:"Teruskan →", ctaHint:"Baru? Akaun anda akan dicipta secara automatik.", emailPh:"Alamat emel", passPh:"Kata laluan", newMembers:"Ahli Baru Hari Ini" },
  zh: { tagline:["{c}","最快速的","交友方式"], ctaTitle:"免费开始", ctaSub:"{n} 在线 · ♀ 女性永久免费", ctaButton:"继续 →", ctaHint:"新用户？我们将自动为您创建账号。", emailPh:"电子邮件", passPh:"密码", newMembers:"今日新成员" },
  ar: { tagline:["أسرع طريقة في","{c}","للقاء العزاب"], ctaTitle:"ابدأ مجاناً", ctaSub:"{n} متصل · ♀ المرأة دائماً مجاناً", ctaButton:"متابعة →", ctaHint:"جديد؟ سيتم إنشاء حسابك تلقائياً.", emailPh:"البريد الإلكتروني", passPh:"كلمة المرور", newMembers:"أعضاء جدد اليوم" },
  es: { tagline:["La Forma Más Rápida en","{c}","de Conocer Solteros"], ctaTitle:"Empieza Gratis", ctaSub:"{n} en línea · ♀ Mujeres Siempre Gratis", ctaButton:"Continuar →", ctaHint:"¿Nuevo aquí? Crearemos tu cuenta automáticamente.", emailPh:"Correo electrónico", passPh:"Contraseña", newMembers:"Nuevos Miembros Hoy" },
  pt: { tagline:["A Forma Mais Rápida em","{c}","de Conhecer Solteiros"], ctaTitle:"Comece Grátis", ctaSub:"{n} Online · ♀ Mulheres Sempre Grátis", ctaButton:"Continuar →", ctaHint:"Novo aqui? Criaremos sua conta automaticamente.", emailPh:"Endereço de email", passPh:"Senha", newMembers:"Novos Membros Hoje" },
  fr: { tagline:["Le Moyen le Plus Rapide en","{c}","de Rencontrer des Célibataires"], ctaTitle:"Commencer Gratuitement", ctaSub:"{n} en ligne · ♀ Femmes Toujours Gratuites", ctaButton:"Continuer →", ctaHint:"Nouveau ? Votre compte sera créé automatiquement.", emailPh:"Adresse e-mail", passPh:"Mot de passe", newMembers:"Nouveaux Membres Aujourd'hui" },
  de: { tagline:["Der Schnellste Weg in","{c}","Singles zu Treffen"], ctaTitle:"Kostenlos Starten", ctaSub:"{n} Online · ♀ Frauen Immer Kostenlos", ctaButton:"Weiter →", ctaHint:"Neu hier? Wir erstellen Ihr Konto automatisch.", emailPh:"E-Mail-Adresse", passPh:"Passwort", newMembers:"Neue Mitglieder Heute" },
  hi: { tagline:["{c} में","सबसे तेज़ तरीका","सिंगल्स से मिलने का"], ctaTitle:"मुफ्त में शुरू करें", ctaSub:"{n} ऑनलाइन · ♀ महिलाएं हमेशा मुफ्त", ctaButton:"जारी रखें →", ctaHint:"नए हैं? आपका अकाउंट अपने आप बन जाएगा।", emailPh:"ईमेल पता", passPh:"पासवर्ड", newMembers:"आज के नए सदस्य" },
  th: { tagline:["วิธีที่เร็วที่สุดใน","{c}","เพื่อพบคนโสด"], ctaTitle:"เริ่มต้นฟรี", ctaSub:"{n} ออนไลน์ · ♀ ผู้หญิงฟรีตลอด", ctaButton:"ดำเนินการต่อ →", ctaHint:"ใหม่? เราจะสร้างบัญชีให้อัตโนมัติ", emailPh:"อีเมล", passPh:"รหัสผ่าน", newMembers:"สมาชิกใหม่วันนี้" },
  vi: { tagline:["Cách Nhanh Nhất tại","{c}","Gặp Gỡ Người Độc Thân"], ctaTitle:"Bắt Đầu Miễn Phí", ctaSub:"{n} Trực tuyến · ♀ Phụ nữ Luôn Miễn phí", ctaButton:"Tiếp tục →", ctaHint:"Mới ở đây? Chúng tôi sẽ tự động tạo tài khoản.", emailPh:"Địa chỉ email", passPh:"Mật khẩu", newMembers:"Thành Viên Mới Hôm Nay" },
  ko: { tagline:["{c}에서","가장 빠른 방법으로","싱글 만나기"], ctaTitle:"무료로 시작하기", ctaSub:"{n} 온라인 · ♀ 여성 항상 무료", ctaButton:"계속하기 →", ctaHint:"처음이신가요? 계정이 자동으로 생성됩니다.", emailPh:"이메일 주소", passPh:"비밀번호", newMembers:"오늘의 신규 회원" },
  ja: { tagline:["{c}で","最速の方法で","シングルに出会う"], ctaTitle:"無料で始める", ctaSub:"{n} オンライン · ♀ 女性はずっと無料", ctaButton:"続ける →", ctaHint:"初めての方？アカウントは自動的に作成されます。", emailPh:"メールアドレス", passPh:"パスワード", newMembers:"今日の新メンバー" },
  ru: { tagline:["Самый Быстрый Способ в","{c}","Познакомиться с Одиночками"], ctaTitle:"Начать Бесплатно", ctaSub:"{n} онлайн · ♀ Для женщин всегда бесплатно", ctaButton:"Продолжить →", ctaHint:"Новый пользователь? Аккаунт создастся автоматически.", emailPh:"Электронная почта", passPh:"Пароль", newMembers:"Новые участники сегодня" },
  tr: { tagline:["{c}'de","En Hızlı Yol","Bekarlarla Tanışmak"], ctaTitle:"Ücretsiz Başla", ctaSub:"{n} Çevrimiçi · ♀ Kadınlar Her Zaman Ücretsiz", ctaButton:"Devam Et →", ctaHint:"Yeni misiniz? Hesabınız otomatik oluşturulacak.", emailPh:"E-posta adresi", passPh:"Şifre", newMembers:"Bugünkü Yeni Üyeler" },
  nl: { tagline:["De Snelste Manier in","{c}","om Singles te Ontmoeten"], ctaTitle:"Gratis Beginnen", ctaSub:"{n} Online · ♀ Vrouwen Altijd Gratis", ctaButton:"Doorgaan →", ctaHint:"Nieuw hier? We maken automatisch een account aan.", emailPh:"E-mailadres", passPh:"Wachtwoord", newMembers:"Nieuwe Leden Vandaag" },
  pl: { tagline:["Najszybszy Sposób w","{c}","na Poznanie Singli"], ctaTitle:"Zacznij Za Darmo", ctaSub:"{n} Online · ♀ Kobiety Zawsze Za Darmo", ctaButton:"Kontynuuj →", ctaHint:"Nowy tutaj? Konto zostanie utworzone automatycznie.", emailPh:"Adres e-mail", passPh:"Hasło", newMembers:"Nowi Członkowie Dzisiaj" },
  it: { tagline:["Il Modo Più Veloce in","{c}","per Incontrare Single"], ctaTitle:"Inizia Gratis", ctaSub:"{n} Online · ♀ Donne Sempre Gratis", ctaButton:"Continua →", ctaHint:"Nuovo qui? Creeremo il tuo account automaticamente.", emailPh:"Indirizzo email", passPh:"Password", newMembers:"Nuovi Membri Oggi" },
  sv: { tagline:["Det Snabbaste Sättet i","{c}","att Träffa Singlar"], ctaTitle:"Börja Gratis", ctaSub:"{n} Online · ♀ Kvinnor Alltid Gratis", ctaButton:"Fortsätt →", ctaHint:"Ny här? Vi skapar ditt konto automatiskt.", emailPh:"E-postadress", passPh:"Lösenord", newMembers:"Nya Medlemmar Idag" },
};

// Module-level geo cache — one fetch per page load
let _geo: { country: string; lang: string } | null = null;
const fetchGeo = (): Promise<{ country: string; lang: string }> => {
  if (_geo) return Promise.resolve(_geo);
  return fetch("https://ipapi.co/json/")
    .then((r) => r.json())
    .then((d) => {
      const lang = (d?.languages as string ?? "en").split(",")[0].split("-")[0];
      _geo = { country: d?.country_name ?? "Indonesia", lang };
      return _geo;
    })
    .catch(() => { _geo = { country: "Indonesia", lang: "en" }; return _geo!; });
};

const useGeoLocale = () => {
  const [geo, setGeo] = useState<{ country: string; lang: string }>(_geo ?? { country: "Indonesia", lang: "en" });
  useEffect(() => { fetchGeo().then(setGeo); }, []);
  const tx = TX[geo.lang] ?? TX.en;
  return { country: geo.country, tx };
};

// ── New Members Strip ────────────────────────────────────────────────────────
const MOCK_MEMBERS = [
  { id: "m1", name: "Sari",  avatar_url: "https://i.pravatar.cc/150?img=47" },
  { id: "m2", name: "Ayu",   avatar_url: "https://i.pravatar.cc/150?img=44" },
  { id: "m3", name: "Dewi",  avatar_url: "https://i.pravatar.cc/150?img=56" },
  { id: "m4", name: "Rina",  avatar_url: "https://i.pravatar.cc/150?img=48" },
  { id: "m5", name: "Budi",  avatar_url: "https://i.pravatar.cc/150?img=12" },
  { id: "m6", name: "Citra", avatar_url: "https://i.pravatar.cc/150?img=49" },
  { id: "m7", name: "Tari",  avatar_url: "https://i.pravatar.cc/150?img=53" },
  { id: "m8", name: "Farah", avatar_url: "https://i.pravatar.cc/150?img=45" },
  { id: "m9", name: "Nadia", avatar_url: "https://i.pravatar.cc/150?img=57" },
];

const NewMembersStrip = ({ country, label }: { country: string; label: string }) => {
  const [members, setMembers] = useState(MOCK_MEMBERS);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .eq("country", country)
      .eq("is_active", true)
      .eq("is_banned", false)
      .not("avatar_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(9)
      .then(({ data }) => {
        if (data && data.length >= 3) setMembers(data as typeof MOCK_MEMBERS);
      });
  }, [country]);

  return (
    <div className="relative z-20 px-4 pb-3">
      {/* Overlapping avatars with label on top */}
      <div className="relative inline-flex flex-col gap-1.5">
        {/* Label sits above the circles */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"
            style={{ boxShadow: "0 0 8px rgba(74,222,128,1)" }} />
          <p className="text-white text-[13px] font-black drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
            {label}
          </p>
        </div>

        {/* Overlapping circles */}
        <div className="flex items-center">
          {members.slice(0, 9).map((m, i) => (
            <div
              key={m.id}
              className="relative flex-shrink-0"
              style={{ marginLeft: i === 0 ? 0 : -10, zIndex: members.length - i }}
            >
              <div style={{
                width: 32, height: 32,
                borderRadius: "50%",
                border: "2.5px solid rgba(255,255,255,0.9)",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
                background: "#333",
              }}>
                <img
                  src={m.avatar_url ?? ""}
                  alt={m.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  loading="lazy"
                />
              </div>
            </div>
          ))}

          {/* +more badge */}
          <div style={{
            marginLeft: -10,
            width: 32, height: 32, borderRadius: "50%",
            border: "2.5px solid rgba(255,255,255,0.9)",
            background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
            zIndex: 0, flexShrink: 0,
          }}>
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 800 }}>+2.4k</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthPage = () => {
  const { country, tx } = useGeoLocale();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [onlineCount, setOnlineCount] = useState(getDailyOnlineCount());

  // Preload the welcome video so it plays instantly after login
  useEffect(() => {
    const v = document.createElement("video");
    v.src = "https://ik.imagekit.io/dateme/ted%20running%20office.mp4";
    v.preload = "auto";
    v.muted = true;
    v.load();
  }, []);

  // Fetch real online user count from Supabase (last 5 min)
  useEffect(() => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("is_banned", false)
      .gte("last_seen_at", fiveMinAgo)
      .then(({ count }) => {
        if (count !== null && count > 0) {
          _cachedOnlineCount = count;
          setOnlineCount(count);
        }
      });
  }, []);

  // If a session already exists (user navigated here while already logged in)
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", session.user.id),
        supabase.from("profiles").select("name").eq("id", session.user.id).maybeSingle(),
      ]);
      const isAdmin = roles?.some((r: any) => r.role === "admin");
      if (isAdmin || !profile?.name) {
        navigate("/welcome", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    });
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      try {
        localStorage.setItem("pending_referral_code", ref);
      } catch {
        // ignore
      }
    }
  }, []);

  const processPendingReferral = useCallback(async () => {
    let code: string | null = null;
    try {
      code = localStorage.getItem("pending_referral_code");
    } catch {
      code = null;
    }
    if (!code) return;
    try {
      const { data } = await (supabase as any).rpc("process_referral", { _referral_code: code });
      if (data?.ok) {
        try { localStorage.removeItem("pending_referral_code"); } catch { /* ignore */ }
      }
    } catch {
      // ignore
    }
  }, []);

  const [form, setForm] = useState({ email: "", password: "" });

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const getLoginErrorMessage = (error: { message: string }): string => {
    const msg = error.message.toLowerCase();
    if (msg.includes("invalid login") || msg.includes("invalid credentials")) return "Invalid email or password.";
    if (msg.includes("email not confirmed") || msg.includes("confirm your email")) return "Please confirm your email first.";
    return error.message;
  };

  const handleAuth = async () => {
    if (!form.email || !form.password) { toast.error("Please fill in all fields."); return; }
    setLoading(true);

    // Try sign-in first — avoids triggering confirmation emails on every attempt
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (!error && data.session) {
      // Existing user signed in
      toast.success("Welcome back!");
      await processPendingReferral();
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", data.session.user.id),
        (supabase.from("profiles").select("name, avatar_url, photo_flagged, flag_reason") as any).eq("id", data.session.user.id).maybeSingle(),
      ]);
      setLoading(false);
      const isAdmin = roles?.some((r: any) => r.role === "admin");
      // Flagged profile — show re-verification gate
      if (profile?.photo_flagged) {
        navigate("/photo-gate", { replace: true });
        return;
      }
      // Brand-new users (no name set) always go through onboarding
      if (isAdmin || !profile?.name) {
        navigate("/welcome", { replace: true });
        return;
      }
      // Existing users — always send to /home regardless of photo.
      // The app enforces preview mode (browse-only) inside /home when no avatar.
      navigate("/home", { replace: true });
      return;
    }

    // If error is NOT "invalid credentials" (i.e. user doesn't exist yet), try sign-up
    const isNewUser = error?.message?.toLowerCase().includes("invalid login") ||
      error?.message?.toLowerCase().includes("invalid credentials") ||
      error?.message?.toLowerCase().includes("user not found") ||
      error?.message?.toLowerCase().includes("no user found");

    if (isNewUser) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            preferred_language: _geo?.lang ?? "en",
          },
        },
      });
      setLoading(false);
      if (signUpError) { toast.error(signUpError.message); return; }
      if (signUpData.session) {
        toast.success("Welcome to 2DateMe! 🎉");
        await processPendingReferral();
        navigate("/welcome", { replace: true });
        return;
      }
      // Email confirmation required
      toast.success("Check your email to confirm your account!");
      return;
    }

    // Other errors (email not confirmed, rate limit, etc.)
    setLoading(false);
    toast.error(getLoginErrorMessage(error!));
  };


  // Landing screen
  return (
      <>
        <div className="flex flex-col" style={{
          position: "fixed", inset: 0,
          height: "100dvh",
          overflow: "hidden",
          background: "#000",
        }}>

          {/* ── Background video — fixed full screen, no scroll ── */}
          <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0,
            bottom: -60,
            zIndex: 0,
            overflow: "hidden",
          }}>
            <video
              autoPlay
              muted
              playsInline
              style={{
                position: "absolute",
                top: 0, left: 0,
                width: "100%",
                height: "calc(100% + 60px)",
                objectFit: "cover",
                objectPosition: "calc(50% - 230px) top",
              }}
            >
              <source src="https://ik.imagekit.io/dateme/video%20landing%20page%20date%202%20me%20com.mp4?tr=q-100" type="video/mp4" />
              {/* Fallback image if video fails */}
              <img
                src="https://ik.imagekit.io/7grri5v7d/uytg.png"
                alt=""
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
            </video>
          </div>

          {/* Gradient overlay */}
          <div style={{
            position: "fixed", inset: 0, zIndex: 1,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 40%, rgba(0,0,0,0.7) 100%)",
            pointerEvents: "none",
          }} />


          {/* ── Top bar ─────────────────────────────────────────── */}
          <div className="relative z-20 flex items-center justify-between px-4 pt-safe"
            style={{ paddingTop: `max(1rem, env(safe-area-inset-top, 1rem))` }}>
            <AppLogo className="w-28 h-28 object-contain flex-shrink-0" />

            {/* ── DEV ONLY: quick entry buttons — stripped in prod build ── */}
            {import.meta.env.DEV && (
              <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
                <button
                  onClick={() => navigate("/home")}
                  style={{
                    padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 800,
                    background: "rgba(232,72,199,0.85)", color: "white", border: "none",
                    cursor: "pointer", letterSpacing: "0.04em", backdropFilter: "blur(8px)",
                    boxShadow: "0 2px 10px rgba(232,72,199,0.5)",
                  }}
                >
                  DEV → Home
                </button>
                <button
                  onClick={() => navigate("/welcome")}
                  style={{
                    padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 800,
                    background: "rgba(168,85,247,0.85)", color: "white", border: "none",
                    cursor: "pointer", letterSpacing: "0.04em", backdropFilter: "blur(8px)",
                    boxShadow: "0 2px 10px rgba(168,85,247,0.5)",
                  }}
                >
                  DEV → Welcome
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  style={{
                    padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 800,
                    background: "rgba(245,158,11,0.85)", color: "white", border: "none",
                    cursor: "pointer", letterSpacing: "0.04em", backdropFilter: "blur(8px)",
                    boxShadow: "0 2px 10px rgba(245,158,11,0.5)",
                  }}
                >
                  DEV → Dashboard
                </button>
                <button
                  onClick={() => navigate("/dates")}
                  style={{
                    padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 800,
                    background: "rgba(236,72,153,0.85)", color: "white", border: "none",
                    cursor: "pointer", letterSpacing: "0.04em", backdropFilter: "blur(8px)",
                    boxShadow: "0 2px 10px rgba(236,72,153,0.5)",
                  }}
                >
                  DEV → Dates
                </button>
              </div>
            )}
          </div>

          {/* ── Tagline under logo ──────────────────────────────── */}
          <div className="relative z-20 px-5 mt-3 text-left">
            <p className="text-white text-[28px] font-black leading-snug drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
              {tx.tagline[0].replace("{c}", country)}<br />
              <span className="text-yellow-300">{tx.tagline[1].replace("{c}", country)}</span><br />
              {tx.tagline[2].replace("{c}", country)}
            </p>
          </div>

          {/* Spacer — background image visible here */}
          <div className="flex-1" />

          {/* ── New Members Today — sits just above the CTA ──────── */}
          <NewMembersStrip country={country} label={tx.newMembers} />

          {/* ── CTA card — pinned to bottom ─────────────────────── */}
          <div className="relative z-20 px-4 pb-safe"
            style={{ paddingBottom: `max(1.25rem, env(safe-area-inset-bottom, 1.25rem))` }}>
            <div className="rounded-3xl bg-yellow-400 p-4 shadow-[0_0_40px_rgba(250,204,21,0.3)] border border-yellow-300/60">
              <p className="text-black text-[17px] font-black text-center leading-tight">{tx.ctaTitle}</p>
              <p className="text-black/65 text-[11px] font-semibold text-center mt-0.5">
                🔥 {tx.ctaSub.replace("{n}", onlineCount.toLocaleString())}
              </p>

              <div className="mt-3 space-y-2">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder={tx.emailPh}
                  className="bg-white border-white/70 text-black placeholder:text-black/40 rounded-xl h-11"
                  autoComplete="email"
                />
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder={tx.passPh}
                  className="bg-white border-white/70 text-black placeholder:text-black/40 rounded-xl h-11"
                  autoComplete="current-password"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAuth(); }}
                />
                <Button
                  onClick={handleAuth}
                  disabled={loading}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700 font-black text-[15px] disabled:opacity-50"
                >
                  {loading ? "..." : tx.ctaButton}
                </Button>
                <p className="text-black/45 text-[10px] text-center">{tx.ctaHint}</p>
              </div>
            </div>

          </div>
        </div>
      </>
    );
};

export default AuthPage;
