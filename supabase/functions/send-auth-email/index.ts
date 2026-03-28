import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// ─── Config ──────────────────────────────────────────────────────────────────
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const HOOK_SECRET   = Deno.env.get("SEND_EMAIL_HOOK_SECRET") ?? "";
const FROM_EMAIL    = `2DateMe <noreply@2dateme.com>`;

// ─── Signature verification ───────────────────────────────────────────────────
// Supabase signs the raw request body with HMAC-SHA256.
// Header: x-supabase-signature: v1=<hex-digest>
// Secret: v1,whsec_<base64-encoded-key>
async function verifyHookSignature(rawBody: string, signatureHeader: string): Promise<boolean> {
  try {
    const base64Key = HOOK_SECRET.split("whsec_")[1];
    if (!base64Key) return false;

    const keyBytes = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      "raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );

    const bodyBytes = new TextEncoder().encode(rawBody);
    const sigBuffer = await crypto.subtle.sign("HMAC", cryptoKey, bodyBytes);
    const computed  = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const received = signatureHeader.replace(/^v\d+=/, "");
    return computed === received;
  } catch {
    return false;
  }
}

// Countries where Indonesian is the right default
const INDONESIAN_COUNTRIES = new Set(["ID", "MY"]);

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  en: {
    subject: "Confirm your 2DateMe account 💕",
    pre: "You're one tap away from your next great connection.",
    greeting: "Welcome to 2DateMe! 🎉",
    headline: "Your match is waiting",
    body: "Thousands of real singles across Indonesia are swiping right now. One tap and you're in — confirm your email to get started.",
    cta: "✓  Confirm My Account",
    feature1: "Swipe & match real singles near you",
    feature2: "Unlock WhatsApp, WeChat & more — from $1.99",
    feature3: "Connect Monthly — unlimited unlocks for $4.99/mo",
    feature4: "Women always free — forever",
    tagline: "Indonesia's Dating App",
    expire: "This link expires in 24 hours.",
    ignore: "Didn't create an account? Simply ignore this email.",
    footer: "From all of us at 2DateMe — we can't wait to help you find your person. 💕",
    copy: "© 2DateMe.com · Indonesia's Dating App",
  },
  id: {
    subject: "Konfirmasi akun 2DateMe kamu 💕",
    pre: "Kamu selangkah lagi dari koneksi luar biasa berikutnya.",
    greeting: "Selamat datang di 2DateMe! 🎉",
    headline: "Jodohmu sedang menunggu",
    body: "Ribuan single nyata di seluruh Indonesia sedang swipe sekarang. Satu ketukan dan kamu masuk — konfirmasi emailmu untuk memulai.",
    cta: "✓  Konfirmasi Akun Saya",
    feature1: "Swipe & cocok dengan single nyata di dekatmu",
    feature2: "Buka WhatsApp, WeChat & lainnya — mulai $1.99",
    feature3: "Connect Monthly — buka kontak tak terbatas $4.99/bln",
    feature4: "Wanita selalu gratis — selamanya",
    tagline: "Aplikasi Kencan Indonesia",
    expire: "Link ini berlaku selama 24 jam.",
    ignore: "Tidak membuat akun? Abaikan email ini.",
    footer: "Dari semua kami di 2DateMe — kami tidak sabar membantumu menemukan pasangan. 💕",
    copy: "© 2DateMe.com · Aplikasi Kencan Indonesia",
  },
};

// ─── Email HTML builder ───────────────────────────────────────────────────────
function buildEmail(lang: "en" | "id", confirmUrl: string, country: string): string {
  const t = T[lang] ?? T.en;
  const countryLine = country && country !== "Unknown"
    ? `<p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.25);text-align:center;">📍 ${country}</p>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${t.subject}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <!-- Preview text -->
  <div style="display:none;max-height:0;overflow:hidden;">${t.pre}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:#111111;border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.07);">

        <!-- Top gradient bar -->
        <tr><td style="height:4px;background:linear-gradient(90deg,#e91e8c,#9c27b0,#e91e8c);"></td></tr>

        <!-- Brand -->
        <tr>
          <td align="center" style="padding:40px 32px 16px;">
            <p style="margin:0 0 8px;font-size:38px;">💕</p>
            <p style="margin:0;font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">2DateMe</p>
            <p style="margin:5px 0 0;font-size:10px;font-weight:800;color:#f59e0b;letter-spacing:3px;text-transform:uppercase;">${t.tagline}</p>
            ${countryLine}
          </td>
        </tr>

        <!-- Headline + body -->
        <tr>
          <td style="padding:8px 36px 28px;" align="center">
            <h1 style="margin:0 0 14px;font-size:26px;font-weight:900;color:#ffffff;line-height:1.25;">${t.headline} 🎉</h1>
            <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.5);line-height:1.75;">${t.body}</p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td align="center" style="padding:0 36px 36px;">
            <a href="${confirmUrl}"
               style="display:inline-block;padding:18px 44px;background:linear-gradient(135deg,#e91e8c,#9c27b0);color:#ffffff;font-size:17px;font-weight:900;text-decoration:none;border-radius:16px;letter-spacing:0.2px;box-shadow:0 0 28px rgba(233,30,140,0.35);">
              ${t.cta}
            </a>
            <p style="margin:14px 0 0;font-size:11px;color:rgba(255,255,255,0.2);">${t.expire}</p>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 36px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>

        <!-- Features -->
        <tr>
          <td style="padding:24px 36px 8px;">
            <p style="margin:0 0 14px;font-size:10px;font-weight:800;color:rgba(255,255,255,0.22);text-transform:uppercase;letter-spacing:2.5px;text-align:center;">What's waiting for you</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:rgba(255,255,255,0.6);">
                <span style="margin-right:10px;">💬</span>${t.feature1}
              </td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:rgba(255,255,255,0.6);">
                <span style="margin-right:10px;">⚡</span>${t.feature2}
              </td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:rgba(255,255,255,0.6);">
                <span style="margin-right:10px;">🚀</span>${t.feature3}
              </td></tr>
              <tr><td style="padding:8px 0;font-size:13px;color:rgba(255,255,255,0.6);">
                <span style="margin-right:10px;">♀️</span>${t.feature4}
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:20px 36px 0;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding:20px 36px 32px;">
            <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.4);line-height:1.6;">
              ${t.footer}
            </p>
            <p style="margin:0 0 4px;font-size:10px;color:rgba(255,255,255,0.15);">${t.ignore}</p>
            <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.12);">${t.copy}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  try {
    // Read raw body once so we can verify signature AND parse JSON
    const rawBody = await req.text();

    // Reject requests that don't come from Supabase
    const signature = req.headers.get("x-supabase-signature") ?? "";
    if (HOOK_SECRET && !(await verifyHookSignature(rawBody, signature))) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    const userEmail: string = payload?.user?.email ?? "";
    const userMeta = payload?.user?.user_metadata ?? {};
    const confirmUrl: string = payload?.email_data?.confirmation_url
      ?? payload?.email_data?.token_hash
      ?? "";

    // ── Detect country from IP ────────────────────────────────────────────
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip")
      ?? "";

    let countryCode = "US";
    let countryName = "Unknown";

    if (ip && ip !== "127.0.0.1" && ip !== "::1") {
      try {
        const geo = await fetch(`https://ipapi.co/${ip}/json/`, {
          headers: { "User-Agent": "2DateMe/1.0" },
          signal: AbortSignal.timeout(2500),
        }).then((r) => r.json());
        countryCode = geo?.country_code ?? "US";
        countryName = geo?.country_name ?? "Unknown";
      } catch { /* use defaults */ }
    }

    // ── Determine language ────────────────────────────────────────────────
    // Priority: user selected in app → country IP → fallback English
    let lang: "en" | "id" = "en";
    if (userMeta.preferred_language === "id") {
      lang = "id";
    } else if (userMeta.preferred_language === "en") {
      lang = "en";
    } else if (INDONESIAN_COUNTRIES.has(countryCode)) {
      lang = "id";
    }

    const t = T[lang];
    const html = buildEmail(lang, confirmUrl, countryName);

    // ── Send via Resend ───────────────────────────────────────────────────
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: userEmail,
        subject: t.subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return new Response(JSON.stringify({ error: err }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("send-auth-email error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
