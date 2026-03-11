import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { getTarotCardById } from "@/data/tarotCards";
import logoHeart from "@/assets/logo-heart.png";

interface UseDailyTarotProps {
  user: any;
  iLiked: any[];
  likedMe: any[];
  daysSinceLastActive: number;
  locale: string;
  sessionStatsRef: any;
}

export const useDailyTarot = (props: UseDailyTarotProps) => {
  const DAILY_CARD_KEY_BASE = "dailyTarotCard";
  const DAILY_TAROT_HISTORY_KEY_BASE = "dailyTarotHistory";
  const SESSION_BEHAVIOR_KEY_BASE = "dailyTarotBehavior";
  const [dailyCard, setDailyCard] = useState<{ cardId: number; date: string; shown: boolean } | null>(null);
  const [showTarotPopup, setShowTarotPopup] = useState(false);
  const [tarotPhase, setTarotPhase] = useState<"back" | "flip" | "revealed">("back");

  const getTodayKey = () => new Date().toDateString();

  const getTarotIdentityKey = useCallback(() => {
    if (props.user?.id) return `user:${props.user.id}`;
    try {
      const e164 = localStorage.getItem("landing_whatsapp_e164");
      if (e164) return `wa:${e164}`;
    } catch {
      // ignore
    }
    return "anon";
  }, [props.user?.id]);

  const getDailyCardStorageKey = useCallback(() => {
    const identity = getTarotIdentityKey();
    return `${DAILY_CARD_KEY_BASE}:${identity}`;
  }, [getTarotIdentityKey]);

  const getBehaviorStorageKey = useCallback(() => {
    const identity = getTarotIdentityKey();
    return `${SESSION_BEHAVIOR_KEY_BASE}:${identity}`;
  }, [getTarotIdentityKey]);

  const getHistoryStorageKey = useCallback(() => {
    const identity = getTarotIdentityKey();
    return `${DAILY_TAROT_HISTORY_KEY_BASE}:${identity}`;
  }, [getTarotIdentityKey]);

  const readUsedTarotCards = useCallback((): number[] => {
    try {
      const raw = localStorage.getItem(getHistoryStorageKey());
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      const arr = Array.isArray(parsed) ? parsed : (parsed as any)?.used;
      if (!Array.isArray(arr)) return [];
      return arr
        .map((n) => (typeof n === "number" ? n : parseInt(String(n), 10)))
        .filter((n) => Number.isFinite(n) && n >= 1 && n <= 22);
    } catch {
      return [];
    }
  }, [getHistoryStorageKey]);

  const writeUsedTarotCards = useCallback((used: number[]) => {
    try {
      localStorage.setItem(getHistoryStorageKey(), JSON.stringify({ used }));
    } catch {
      // ignore
    }
  }, [getHistoryStorageKey]);

  const loadOrCreateDailyCard = useCallback(() => {
    const today = getTodayKey();
    try {
      const raw = localStorage.getItem(getDailyCardStorageKey());
      if (raw) {
        const parsed = JSON.parse(raw) as { cardId: number; date: string; shown: boolean };
        if (parsed?.date === today && typeof parsed.cardId === "number") {
          setDailyCard(parsed);
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    const used = readUsedTarotCards();
    const all = Array.from({ length: 22 }, (_, i) => i + 1);
    const available = all.filter((id) => !used.includes(id));
    const pool = available.length > 0 ? available : all;
    const cardId = pool[Math.floor(Math.random() * pool.length)];

    const next = { cardId, date: today, shown: false };
    try {
      localStorage.setItem(getDailyCardStorageKey(), JSON.stringify(next));
    } catch {
      // ignore
    }

    // advance history only when we successfully created a new daily card
    const nextUsed = available.length > 0 ? [...used, cardId] : [cardId];
    writeUsedTarotCards(nextUsed);

    setDailyCard(next);
    return next;
  }, [getDailyCardStorageKey, readUsedTarotCards, writeUsedTarotCards]);

  const markDailyCardShown = useCallback(() => {
    const current = dailyCard || loadOrCreateDailyCard();
    if (!current || current.shown) return;
    const next = { ...current, shown: true };
    try {
      localStorage.setItem(getDailyCardStorageKey(), JSON.stringify(next));
    } catch {
      // ignore
    }
    setDailyCard(next);
  }, [dailyCard, getDailyCardStorageKey, loadOrCreateDailyCard]);

  const computeTarotContext = useCallback(() => {
    const s = props.sessionStatsRef.current;
    const hasMutual = props.iLiked.some((p) => props.likedMe.some((l) => l.id === p.id));
    if (hasMutual) return "mutual" as const;
    if (s.focusedOnOne) return "focusedOnOne" as const;

    try {
      const visited = localStorage.getItem("hasVisitedHome");
      if (!visited) return "newUser" as const;
    } catch {
      // ignore
    }

    if (props.daysSinceLastActive >= 3) return "returning" as const;

    if (s.viewed >= 8) {
      const passRate = s.passed / Math.max(1, s.viewed);
      const likeRate = s.liked / Math.max(1, s.viewed);
      if (passRate >= 0.75 && likeRate <= 0.1) return "beingPicky" as const;
      if (likeRate >= 0.35) return "openHearted" as const;
    }

    // default: lean open-hearted if user is liking
    if (s.liked >= 3) return "openHearted" as const;
    return "beingPicky" as const;
  }, [props.daysSinceLastActive, props.iLiked, props.likedMe]);

  const dailyTarot = useMemo(() => {
    const dc = dailyCard || loadOrCreateDailyCard();
    if (!dc) return null;
    const card = getTarotCardById(dc.cardId);
    const context = computeTarotContext();
    const reading = card.contextReadings[context];
    const localized = props.locale === "en" ? reading.en : reading.id;
    return {
      card,
      context,
      reading: localized,
      shown: dc.shown,
    };
  }, [computeTarotContext, dailyCard, loadOrCreateDailyCard, props.locale]);

  const exportTarotShareImage = useCallback(async () => {
    if (!dailyTarot) return;
    const W = 1080;
    const H = 1920;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#120018");
    grad.addColorStop(0.5, "#1b0630");
    grad.addColorStop(1, "#050006");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = Math.random() * 2.2;
      ctx.fillStyle = `rgba(255,215,100,${0.12 + Math.random() * 0.35})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Card frame
    const pad = 90;
    const cardX = pad;
    const cardY = 360;
    const cardW = W - pad * 2;
    const cardH = 980;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.strokeStyle = "rgba(255,215,100,0.55)";
    ctx.lineWidth = 6;
    const r = 48;
    ctx.beginPath();
    ctx.moveTo(cardX + r, cardY);
    ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + cardH, r);
    ctx.arcTo(cardX + cardW, cardY + cardH, cardX, cardY + cardH, r);
    ctx.arcTo(cardX, cardY + cardH, cardX, cardY, r);
    ctx.arcTo(cardX, cardY, cardX + cardW, cardY, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Title
    ctx.fillStyle = "rgba(255,215,130,0.95)";
    ctx.font = "bold 60px serif";
    ctx.textAlign = "center";
    ctx.fillText(dailyTarot.card.name, W / 2, 170);

    // Logo
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error("logo load failed"));
        i.src = logoHeart;
      });
      const size = 92;
      ctx.globalAlpha = 0.95;
      ctx.drawImage(img, W / 2 - size / 2, 220, size, size);
      ctx.globalAlpha = 1;
    } catch {
      // ignore
    }

    // Emoji art
    ctx.font = "120px serif";
    ctx.fillText(dailyTarot.card.emoji, W / 2, 520);

    // Reading label
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "bold 34px system-ui";
    ctx.fillText(props.locale === "en" ? "Your Reading Today:" : "Ramalan Cintamu Hari Ini:", W / 2, 650);

    // Reading paragraph
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.font = "32px system-ui";
    ctx.textAlign = "left";
    const text = dailyTarot.reading;
    const maxWidth = cardW - 90;
    const words = text.split(/\s+/);
    let line = "";
    let y = 740;
    const lineHeight = 46;
    const left = cardX + 45;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth) {
        ctx.fillText(line, left, y);
        line = w;
        y += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, left, y);

    // Watermark + CTA
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "26px system-ui";
    ctx.fillText("2DateMe Daily Love Reading", W / 2, 1500);
    ctx.fillStyle = "rgba(255,215,130,0.85)";
    ctx.font = "bold 30px system-ui";
    ctx.fillText(
      props.locale === "en" ? "Get your free daily love reading at 2dateme.com" : "Dapatkan ramalan cinta harian gratis di 2dateme.com",
      W / 2,
      1570
    );

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
    if (!blob) return;

    const file = new File([blob], "2dateme-daily-love-reading.png", { type: "image/png" });
    const canShareFiles = typeof navigator !== "undefined" && (navigator as any).canShare?.({ files: [file] });
    if (typeof navigator !== "undefined" && (navigator as any).share && canShareFiles) {
      await (navigator as any).share({
        title: "2DateMe Daily Love Reading",
        text: props.locale === "en" ? "My daily love reading on 2DateMe" : "Ramalan cinta harian aku di 2DateMe",
        files: [file],
      });
      return;
    }

    // Fallback: download + WhatsApp text
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "2dateme-daily-love-reading.png";
    a.click();
    URL.revokeObjectURL(url);
    const msg = props.locale === "en"
      ? `My 2DateMe Daily Love Reading: ${dailyTarot.card.name} ${dailyTarot.card.emoji}\n\n${dailyTarot.reading}\n\nGet your free daily love reading at https://2dateme.com`
      : `Ramalan Cinta Harian 2DateMe: ${dailyTarot.card.name} ${dailyTarot.card.emoji}\n\n${dailyTarot.reading}\n\nDapatkan ramalan cinta harian gratis di https://2dateme.com`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  }, [dailyTarot, props.locale]);

  // Ensure daily card exists on mount
  useEffect(() => {
    loadOrCreateDailyCard();
  }, [loadOrCreateDailyCard]);

  // Trigger popup after 3 minutes if daily card not shown
  useEffect(() => {
    const dc = dailyCard || loadOrCreateDailyCard();
    if (!dc || dc.shown) return;
    const id = window.setTimeout(() => {
      const latest = (() => {
        try {
          const raw = localStorage.getItem(getDailyCardStorageKey());
          return raw ? (JSON.parse(raw) as { cardId: number; date: string; shown: boolean }) : null;
        } catch {
          return null;
        }
      })();
      if (!latest || latest.shown) return;
      setShowTarotPopup(true);
    }, 3 * 60 * 1000);
    return () => window.clearTimeout(id);
  }, [dailyCard, loadOrCreateDailyCard, getDailyCardStorageKey]);

  // Popup phase choreography
  useEffect(() => {
    if (!showTarotPopup) return;
    setTarotPhase("back");
    const t1 = window.setTimeout(() => setTarotPhase("flip"), 2000);
    const t2 = window.setTimeout(() => setTarotPhase("revealed"), 2800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [showTarotPopup]);

  // Daily reset at midnight
  useEffect(() => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    const ms = next.getTime() - now.getTime();
    const id = window.setTimeout(() => {
      try {
        localStorage.removeItem(getDailyCardStorageKey());
      } catch {
        // ignore
      }
      setDailyCard(null);
      loadOrCreateDailyCard();
    }, ms);
    return () => window.clearTimeout(id);
  }, [loadOrCreateDailyCard, getDailyCardStorageKey]);

  return {
    dailyTarot,
    showTarotPopup,
    setShowTarotPopup,
    tarotPhase,
    setTarotPhase,
    loadOrCreateDailyCard,
    markDailyCardShown,
    exportTarotShareImage,
    getBehaviorStorageKey,
  };
};
