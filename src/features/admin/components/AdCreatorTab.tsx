import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Copy, Download, Plus, Trash2, CheckCircle2, Search,
  RefreshCw, X, Users, Zap, Image, ChevronDown,
  Shuffle, ClipboardCopy, Eye, RotateCcw, Video, Link,
  TrendingUp, BarChart2, Play,
} from "lucide-react";
import { toast } from "sonner";
import type { AdminProfile } from "../types";
import logoHeart from "@/assets/images/logo-heart.png";

// ── Platform presets ────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: "ig_square",   label: "Instagram Square",   icon: "📸", w: 1080, h: 1080,  ratio: 1 },
  { id: "ig_portrait", label: "Instagram Portrait",  icon: "📸", w: 1080, h: 1350,  ratio: 1080/1350 },
  { id: "ig_story",    label: "Instagram Story",     icon: "📱", w: 1080, h: 1920,  ratio: 1080/1920 },
  { id: "tiktok",      label: "TikTok",              icon: "🎵", w: 1080, h: 1920,  ratio: 1080/1920 },
  { id: "twitter",     label: "Twitter / X",         icon: "🐦", w: 1200, h: 675,   ratio: 1200/675 },
  { id: "facebook",    label: "Facebook Feed",       icon: "📘", w: 1200, h: 630,   ratio: 1200/630 },
  { id: "fb_story",    label: "Facebook Story",      icon: "📘", w: 1080, h: 1920,  ratio: 1080/1920 },
  { id: "linkedin",    label: "LinkedIn",            icon: "💼", w: 1200, h: 627,   ratio: 1200/627 },
  { id: "youtube",     label: "YouTube Thumb",       icon: "▶️",  w: 1280, h: 720,   ratio: 1280/720 },
  { id: "pinterest",   label: "Pinterest",           icon: "📌", w: 1000, h: 1500,  ratio: 1000/1500 },
  { id: "snapchat",    label: "Snapchat",            icon: "👻", w: 1080, h: 1920,  ratio: 1080/1920 },
  { id: "custom",      label: "Custom Size",         icon: "✏️",  w: 1080, h: 1080,  ratio: 1 },
];

// ── Country / language hashtag packs ───────────────────────────────────────
const COUNTRY_PACKS: Record<string, {
  label: string; flag: string; lang: string;
  hashtags: string[];
  captions: string[];
  cta: string;
}> = {
  indonesia: {
    label: "Indonesia", flag: "🇮🇩", lang: "Bahasa Indonesia",
    hashtags: ["#jodoh","#caripacar","#kenalan","#singlejanda","#singleduda","#temanteman","#jakarta","#surabaya","#bandung","#indonesia","#cariteman","#2dateme","#aplikasikencan","#cariserius","#pasanganhidup","#kencandaring","#jomblo","#mencintai","#hubunganserius","#indonesiangirl","#indonesianboy","#loveindonesia","#datingapp","#findlove","#meetpeople","#singlelife","#relationshipgoals","#indonesiandating","#kenalanserius","#carijijodoh"],
    captions: [
      "Siap menemukan pasangan hidupmu? Join 2DateMe sekarang! 💕",
      "Cari teman serius yang bisa jadi lebih? 2DateMe hadir untuk kamu 🌟",
      "Sudah lelah single? Temukan cinta sejatimu di 2DateMe ❤️",
      "Ribuan single Indonesia menunggu di 2DateMe. Daftar gratis! 🎉",
    ],
    cta: "Link di bio 👆 Daftar gratis!",
  },
  france: {
    label: "France", flag: "🇫🇷", lang: "French",
    hashtags: ["#rencontres","#amour","#célibataire","#paris","#france","#sortirensemble","#cherche","#rencontresfrançaises","#2dateme","#applicationrencontres","#trouverlamour","#relationserieuse","#cœurà prendre","#singlelife","#loveparis","#rencontresserieuses","#rencontresfrance","#datingapp","#frenchdating","#soulmatch","#findlove","#meetpeople","#relationshipgoals","#romantique","#cœurlibre","#frenchwomen","#frenchmen","#datingfrance","#singleenfranche","#rencontrelocale"],
    captions: [
      "Trouvez l'amour près de chez vous avec 2DateMe 💕",
      "Des milliers de célibataires vous attendent sur 2DateMe 🌟",
      "Prêt(e) pour une belle rencontre? 2DateMe est fait pour vous ❤️",
      "L'amour est à portée de clic sur 2DateMe. Inscription gratuite! 🎉",
    ],
    cta: "Lien en bio 👆 Inscription gratuite!",
  },
  germany: {
    label: "Germany", flag: "🇩🇪", lang: "German",
    hashtags: ["#beziehung","#singleleben","#liebe","#berlin","#deutschland","#partnersuche","#kennenlernen","#2dateme","#datingapp","#ernstesinteresse","#singlesdeutschland","#liebesuchen","#deutschlanddating","#deutschesingle","#herzsucher","#beziehungssuche","#partnerschaftsuche","#datingdeutschland","#singleberlin","#liebefindet","#findlove","#meetpeople","#relationshipgoals","#germandating","#lovegermany","#germansingles","#deutscheliebe","#herzfrei","#neubeziehung","#lebenspartner"],
    captions: [
      "Finde deine perfekte Verbindung auf 2DateMe 💕",
      "Tausende Singles warten auf dich bei 2DateMe 🌟",
      "Bereit für echte Liebe? 2DateMe macht es möglich ❤️",
      "Dein nächstes Date ist nur einen Klick entfernt — 2DateMe! 🎉",
    ],
    cta: "Link in Bio 👆 Kostenlos registrieren!",
  },
  uae: {
    label: "UAE / Dubai", flag: "🇦🇪", lang: "English + Arabic",
    hashtags: ["#dubai","#uae","#datingdubai","#singlesdubai","#loveinuae","#dubailife","#2dateme","#datingapp","#findlove","#dubaiexpats","#uaelife","#meetindubai","#dubaisocial","#expatlife","#dubaidating","#uaedating","#singleindubai","#lovindubai","#emiratesdating","#meetme","#relationshipgoals","#dubaigirl","#dubaimen","#dubaiwomen","#luxurydubai","#dubaiconnect","#meetdubai","#singlelife","#heartdubai","#arabdating"],
    captions: [
      "Find your perfect match in Dubai with 2DateMe 💕",
      "Thousands of singles in UAE are on 2DateMe 🌟",
      "Dubai's premium dating app is here — Join 2DateMe ❤️",
      "Meet quality singles in the UAE today — 2DateMe! 🎉",
    ],
    cta: "Link in bio 👆 Free to join!",
  },
  uk: {
    label: "United Kingdom", flag: "🇬🇧", lang: "English (UK)",
    hashtags: ["#dating","#london","#uk","#findlove","#singlelife","#datinguk","#2dateme","#ukdating","#londondating","#britishdating","#singlesinlondon","#loveinlondon","#uksingles","#londonsingles","#datenight","#meetme","#relationshipgoals","#britishgirl","#britishmen","#uklife","#datingapp","#lovematch","#soulmate","#heartfelt","#ukcouple","#londonlife","#meetpeople","#britishcouple","#genuineconnection","#findyourmatch"],
    captions: [
      "Find genuine connections across the UK with 2DateMe 💕",
      "Thousands of UK singles are waiting for you on 2DateMe 🌟",
      "Ready to meet someone special? Join 2DateMe today ❤️",
      "Dating done right — join 2DateMe for free! 🎉",
    ],
    cta: "Link in bio 👆 Free to join!",
  },
  usa: {
    label: "United States", flag: "🇺🇸", lang: "English (US)",
    hashtags: ["#dating","#findlove","#singlelife","#usa","#american","#2dateme","#datingapp","#usadating","#americandating","#singlesinamerica","#loveinamerica","#usdating","#nydating","#ladating","#chicagodating","#meetme","#relationshipgoals","#americangirl","#americanmen","#datenight","#lovematch","#soulmate","#heartfelt","#uscouple","#americanlife","#meetpeople","#genuineconnection","#findyourmatch","#loveapp","#datingusa"],
    captions: [
      "Find your perfect match across the USA with 2DateMe 💕",
      "Millions of American singles are on 2DateMe 🌟",
      "Ready to meet someone real? Join 2DateMe for free ❤️",
      "America's hottest dating app is here — 2DateMe! 🎉",
    ],
    cta: "Link in bio 👆 Join free!",
  },
  australia: {
    label: "Australia", flag: "🇦🇺", lang: "English (AU)",
    hashtags: ["#dating","#australia","#sydney","#melbourne","#findlove","#singlelife","#2dateme","#australiandating","#aussiesdating","#sydneydating","#melbournedating","#aussiesingles","#australiasingles","#loveinaustralia","#aussielife","#meetme","#relationshipgoals","#aussiegirl","#aussiemen","#datenight","#lovematch","#soulmate","#australiacouple","#aussiecouple","#meetpeople","#genuineconnection","#findyourmatch","#aussieheart","#downunderdating","#loveaustralia"],
    captions: [
      "Find your perfect Aussie match with 2DateMe 💕",
      "Thousands of Australian singles on 2DateMe 🌟",
      "Ready to meet someone real down under? Join 2DateMe ❤️",
      "Australia's favourite dating app — 2DateMe! 🎉",
    ],
    cta: "Link in bio 👆 Free to join!",
  },
  malaysia: {
    label: "Malaysia", flag: "🇲🇾", lang: "Bahasa Malaysia",
    hashtags: ["#cintamalaysia","#jodoh","#kenalan","#kl","#malaysia","#2dateme","#cariteman","#hubunganserius","#kenalanserius","#malaysiandating","#kualalumpur","#johorsingles","#penangsingles","#singlebujang","#cariijodoh","#pasanganhidup","#malaysiancouple","#singlemalaysia","#loveinmalaysia","#cintadua","#aplikasikencan","#teman","#datingmalaysia","#findlove","#meetpeople","#malaysianheart","#jiwaberjiwa","#kasih","#romantis","#hatisuci"],
    captions: [
      "Cari jodoh yang serius? Cuba 2DateMe sekarang! 💕",
      "Ribuan single Malaysia menanti di 2DateMe 🌟",
      "Jumpa cinta sejati anda dengan 2DateMe ❤️",
      "Aplikasi kencan terbaik Malaysia — 2DateMe! 🎉",
    ],
    cta: "Link di bio 👆 Daftar percuma!",
  },
  singapore: {
    label: "Singapore", flag: "🇸🇬", lang: "English (SG)",
    hashtags: ["#singapore","#sg","#singledating","#sgdating","#2dateme","#singaporedating","#sgsingles","#lovesg","#findlovesg","#sglife","#singaporecouple","#sgcouple","#meetinsg","#dateinsg","#singaporeheart","#sgconnect","#findmatch","#soulmateSG","#relationshipgoals","#sgromance","#singaporeromance","#sgexpat","#expatsingapore","#datingapp","#meetpeople","#loveinsingapore","#heartsg","#truloveSG","#sgdate","#singaporelove"],
    captions: [
      "Find your Singapore soulmate with 2DateMe 💕",
      "Singapore's fastest growing dating app — 2DateMe! 🌟",
      "Ready to meet quality singles in SG? Join 2DateMe ❤️",
      "Love is just one tap away in Singapore — 2DateMe 🎉",
    ],
    cta: "Link in bio 👆 Free to join!",
  },
  india: {
    label: "India", flag: "🇮🇳", lang: "English (IN)",
    hashtags: ["#india","#mumbai","#delhi","#dating","#findlove","#indiandating","#2dateme","#singlesindia","#indiansingles","#loveindia","#indiancouple","#datingindia","#mumbaising","#delhidating","#bangaloredating","#indianheart","#meetme","#soulmate","#relationshipgoals","#indiangirl","#indianmen","#datenight","#lovematch","#genuineconnection","#findyourmatch","#indianlife","#meetpeople","#heartfelt","#loveapp","#indiadating"],
    captions: [
      "Find your perfect match across India with 2DateMe 💕",
      "Thousands of Indian singles are on 2DateMe 🌟",
      "Ready for a genuine connection? Join 2DateMe today ❤️",
      "India's premium dating experience — 2DateMe! 🎉",
    ],
    cta: "Link in bio 👆 Join free!",
  },
  brazil: {
    label: "Brazil", flag: "🇧🇷", lang: "Portuguese",
    hashtags: ["#relacionamento","#amor","#solteiro","#brasil","#saopaulo","#2dateme","#encontros","#datingbrasil","#brasileiradating","#solteirosdobrasil","#amorreal","#conhecerpessoas","#aplicativodeencontros","#buscandoamor","#encontrarjodoh","#relacionamentoserio","#brasileiros","#namorar","#ficante","#amor","#coração","#amorverdadeiro","#solteirão","#solteirona","#namoro","#vidadesolterio","#casamento","#buscandoparceiro","#queroencontrar","#brasilnamorando"],
    captions: [
      "Encontre seu par perfeito com o 2DateMe 💕",
      "Milhares de solteiros no Brasil te esperam no 2DateMe 🌟",
      "Pronto(a) para encontrar o amor verdadeiro? 2DateMe ❤️",
      "O app de encontros que o Brasil estava esperando — 2DateMe! 🎉",
    ],
    cta: "Link na bio 👆 Cadastro grátis!",
  },
  netherlands: {
    label: "Netherlands", flag: "🇳🇱", lang: "Dutch",
    hashtags: ["#daten","#liefde","#single","#amsterdam","#nederland","#2dateme","#nederlandsedating","#singlesinamsterdam","#liefdezoeken","#nederlandseliefde","#datingapp","#datennl","#amsterdamdating","#vind liefde","#soulmate","#relatie","#hartje","#datepartner","#nederlandsecouple","#hollanddating","#dutchdating","#dutchsingles","#dutchlove","#vindjeeenwording","#serieuzerelatie","#ontmoetmensen","#liefdebrug","#datingnederland","#nieuwliefde","#nederlandheart"],
    captions: [
      "Vind jouw perfecte match met 2DateMe 💕",
      "Duizenden singles in Nederland wachten op jou bij 2DateMe 🌟",
      "Klaar om echte liefde te vinden? Join 2DateMe ❤️",
      "Dating op zijn best — join 2DateMe gratis! 🎉",
    ],
    cta: "Link in bio 👆 Gratis aanmelden!",
  },
};

// ── Ad item type ────────────────────────────────────────────────────────────
type AdType = "image" | "video";
type OverlayPos = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface AdItem {
  id: string;
  adType: AdType;
  profileId?: string;
  profileName?: string;
  profileAge?: number;
  profileCity?: string;
  profileAvatar?: string;
  imageUrl: string;
  videoUrl?: string;
  caption: string;
  hashtags: string[];
  country: string;
  platform: string;
  customW?: number;
  customH?: number;
  status: "queued" | "used";
  createdAt: string;
  copiedAt?: string;
  cropX: number;
  cropY: number;
  cropZoom: number;
  overlayEnabled: boolean;
  overlayPosition: OverlayPos;
  overlayOpacity: number;
}

const AD_QUEUE_KEY = "2dateme_ad_queue";
const AD_TRACK_PREFIX = "2dateme_adv_";
const genId = () => Math.random().toString(36).slice(2, 10);

function loadQueue(): AdItem[] {
  try { return JSON.parse(localStorage.getItem(AD_QUEUE_KEY) || "[]"); } catch { return []; }
}
function saveQueue(q: AdItem[]) {
  try { localStorage.setItem(AD_QUEUE_KEY, JSON.stringify(q)); } catch {}
}
export function trackAdView(adId: string): void {
  try {
    const k = AD_TRACK_PREFIX + adId;
    localStorage.setItem(k, String((parseInt(localStorage.getItem(k) || "0")) + 1));
  } catch {}
}
function getAdViews(adId: string): number {
  try { return parseInt(localStorage.getItem(AD_TRACK_PREFIX + adId) || "0"); } catch { return 0; }
}
function getAllAdViews(): Record<string, number> {
  const out: Record<string, number> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(AD_TRACK_PREFIX)) {
        out[k.slice(AD_TRACK_PREFIX.length)] = parseInt(localStorage.getItem(k) || "0");
      }
    }
  } catch {}
  return out;
}

// ── Image Cropper ───────────────────────────────────────────────────────────
interface CropperProps {
  src: string;
  ratio: number; // w/h
  cropX: number; cropY: number; cropZoom: number;
  onChange: (x: number, y: number, zoom: number) => void;
}
function ImageCropper({ src, ratio, cropX, cropY, cropZoom, onChange }: CropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const BOX_W = 260;
  const BOX_H = Math.round(BOX_W / ratio);

  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: cropX, origY: cropY };
    e.preventDefault();
  };
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = (e.clientX - dragRef.current.startX) / (BOX_W * cropZoom);
      const dy = (e.clientY - dragRef.current.startY) / (BOX_H * cropZoom);
      const nx = Math.max(-0.5, Math.min(0.5, dragRef.current.origX + dx));
      const ny = Math.max(-0.5, Math.min(0.5, dragRef.current.origY + dy));
      onChange(nx, ny, cropZoom);
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [cropZoom, onChange]);

  const translate = `translate(${cropX * BOX_W * cropZoom}px, ${cropY * BOX_H * cropZoom}px)`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
      {/* Preview box */}
      <div
        ref={containerRef}
        style={{
          width: BOX_W, height: BOX_H,
          overflow: "hidden", borderRadius: 12,
          border: "1.5px solid rgba(236,72,153,0.5)",
          cursor: "grab", userSelect: "none", position: "relative",
          background: "#111",
        }}
        onMouseDown={onMouseDown}
      >
        <img
          src={src}
          draggable={false}
          style={{
            position: "absolute",
            width: `${100 * cropZoom}%`,
            height: `${100 * cropZoom}%`,
            objectFit: "cover",
            transform: translate,
            top: 0, left: 0,
            pointerEvents: "none",
            transformOrigin: "top left",
          }}
          alt="crop preview"
        />
        {/* Grid overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(255,255,255,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.07) 1px,transparent 1px)",
          backgroundSize: `${BOX_W/3}px ${BOX_H/3}px`,
        }} />
      </div>
      {/* Zoom slider */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>Zoom</span>
        <input
          type="range" min={1} max={3} step={0.05}
          value={cropZoom}
          onChange={e => onChange(cropX, cropY, parseFloat(e.target.value))}
          style={{ flex: 1, accentColor: "#ec4899" }}
        />
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", width: 30, textAlign: "right" }}>
          {cropZoom.toFixed(1)}x
        </span>
      </div>
      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>Drag to reposition</p>
    </div>
  );
}

// ── Canvas export helper ────────────────────────────────────────────────────
async function exportCroppedImage(
  imgSrc: string, cropX: number, cropY: number, cropZoom: number,
  outW: number, outH: number,
  overlayEnabled?: boolean, overlayPosition?: OverlayPos, overlayOpacity?: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = outW; canvas.height = outH;
      const ctx = canvas.getContext("2d")!;
      const srcAspect = img.naturalWidth / img.naturalHeight;
      const outAspect = outW / outH;
      let sw = img.naturalWidth, sh = img.naturalHeight;
      let sx = 0, sy = 0;
      if (srcAspect > outAspect) { sw = sh * outAspect; sx = (img.naturalWidth - sw) / 2; }
      else { sh = sw / outAspect; sy = (img.naturalHeight - sh) / 2; }
      const zSW = sw / cropZoom, zSH = sh / cropZoom;
      const zSX = sx + (sw - zSW) / 2 - cropX * zSW;
      const zSY = sy + (sh - zSH) / 2 - cropY * zSH;
      ctx.drawImage(img, zSX, zSY, zSW, zSH, 0, 0, outW, outH);

      // Brand overlay
      if (overlayEnabled) {
        const op = overlayOpacity ?? 0.9;
        const pillH = Math.round(outH * 0.055);
        const pillW = Math.round(outW * 0.38);
        const pad = Math.round(outW * 0.025);
        let px = pad, py = pad;
        if (overlayPosition === "top-right")    { px = outW - pillW - pad; py = pad; }
        if (overlayPosition === "bottom-left")  { px = pad; py = outH - pillH - pad; }
        if (overlayPosition === "bottom-right") { px = outW - pillW - pad; py = outH - pillH - pad; }
        ctx.globalAlpha = op;
        ctx.fillStyle = "rgba(0,0,0,0.62)";
        ctx.beginPath();
        if ((ctx as any).roundRect) (ctx as any).roundRect(px, py, pillW, pillH, pillH / 2);
        else ctx.rect(px, py, pillW, pillH);
        ctx.fill();
        // Heart icon placeholder (pink circle)
        const iconR = pillH * 0.32;
        ctx.fillStyle = "#ec4899";
        ctx.beginPath();
        ctx.arc(px + pillH * 0.5, py + pillH / 2, iconR, 0, Math.PI * 2);
        ctx.fill();
        // Text
        const fs = Math.round(pillH * 0.42);
        ctx.fillStyle = "#fff";
        ctx.font = `900 ${fs}px system-ui, sans-serif`;
        ctx.textBaseline = "middle";
        ctx.fillText("2DateMe", px + pillH + 6, py + pillH / 2);
        ctx.globalAlpha = 1;
      }
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = reject;
    img.src = imgSrc;
  });
}

// ── Main AdCreatorTab ───────────────────────────────────────────────────────
interface Props { profiles: AdminProfile[]; }

export default function AdCreatorTab({ profiles }: Props) {
  const [section, setSection] = useState<"create" | "queue" | "batch" | "analytics">("create");

  // Create form state
  const [adType, setAdType] = useState<AdType>("image");
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS[0]);
  const [customW, setCustomW] = useState(1080);
  const [customH, setCustomH] = useState(1080);
  const [selectedCountry, setSelectedCountry] = useState("indonesia");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropZoom, setCropZoom] = useState(1);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [profileSearch, setProfileSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<AdminProfile | null>(null);
  const [showProfileSearch, setShowProfileSearch] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showPlatformPicker, setShowPlatformPicker] = useState(false);
  const [captionTemplate, setCaptionTemplate] = useState(0);
  // Overlay state
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [overlayPosition, setOverlayPosition] = useState<OverlayPos>("bottom-right");
  const [overlayOpacity, setOverlayOpacity] = useState(0.9);

  // Queue state
  const [queue, setQueue] = useState<AdItem[]>(loadQueue);
  const [queueFilter, setQueueFilter] = useState<"all" | "queued" | "used">("queued");
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());
  const [linkCopiedIds, setLinkCopiedIds] = useState<Set<string>>(new Set());
  const [adViews, setAdViews] = useState<Record<string, number>>({});

  // Batch state
  const [batchIds, setBatchIds] = useState("");
  const [batchCountry, setBatchCountry] = useState("indonesia");
  const [batchPlatform, setBatchPlatform] = useState(PLATFORMS[0]);
  const [batchGenerating, setBatchGenerating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load view counts on mount and refresh
  useEffect(() => { setAdViews(getAllAdViews()); }, [queue.length]);

  const pack = COUNTRY_PACKS[selectedCountry] || COUNTRY_PACKS.indonesia;
  const platform = selectedPlatform.id === "custom"
    ? { ...selectedPlatform, w: customW, h: customH, ratio: customW / customH }
    : selectedPlatform;

  // Auto-populate hashtags when country changes
  useEffect(() => {
    setHashtags(pack.hashtags.slice(0, 30));
  }, [selectedCountry]);

  // Auto-generate caption from profile
  useEffect(() => {
    if (!selectedProfile) return;
    const p = selectedProfile;
    const name = p.name?.split(" ")[0] || "Someone";
    const age = p.age ? `, ${p.age}` : "";
    const city = p.city || p.country || "";
    const lf = p.looking_for || "";
    const templates = [
      `Meet ${name}${age}${city ? ` from ${city}` : ""}. ${lf ? `Looking for: ${lf}. ` : ""}Join 2DateMe today! 💕`,
      `${name}${age} is on 2DateMe${city ? ` — based in ${city}` : ""}. ${pack.cta}`,
      `${name} is waiting for you on 2DateMe 💕 ${city ? `📍${city} ` : ""}${pack.cta}`,
      `Find someone like ${name}${age} on 2DateMe. Real profiles, real connections. ${pack.cta}`,
    ];
    setCaption(templates[captionTemplate % templates.length]);
  }, [selectedProfile, selectedCountry, captionTemplate]);

  // Load image from profile
  useEffect(() => {
    if (selectedProfile?.avatar_url) {
      setImageUrl(selectedProfile.avatar_url);
      setImageFile(null);
      setCropX(0); setCropY(0); setCropZoom(1);
    }
  }, [selectedProfile]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setImageFile(ev.target?.result as string);
      setImageUrl("");
      setCropX(0); setCropY(0); setCropZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoFile(url);
  };

  const handleCaptureFrame = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1080;
    canvas.height = video.videoHeight || 1920;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setImageFile(dataUrl);
    setAdType("image");
    toast.success("Frame captured! Now crop and save.");
  };

  const activeImageSrc = imageFile || imageUrl;

  const handleCopyTrackingUrl = async (ad: AdItem) => {
    const url = `${window.location.origin}/?ref=ad_${ad.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopiedIds(s => new Set(s).add(ad.id));
      toast.success("Tracking link copied! Use this as your bio link.");
      setTimeout(() => setLinkCopiedIds(s => { const n = new Set(s); n.delete(ad.id); return n; }), 2500);
    } catch { toast.error("Copy failed"); }
  };

  const handleSaveToQueue = () => {
    if (adType === "image" && !activeImageSrc) { toast.error("Add an image first"); return; }
    if (adType === "video" && !videoFile) { toast.error("Upload a video first"); return; }
    if (!caption.trim()) { toast.error("Add a caption"); return; }
    const ad: AdItem = {
      id: genId(),
      adType,
      profileId: selectedProfile?.id,
      profileName: selectedProfile?.name,
      profileAge: selectedProfile?.age,
      profileCity: selectedProfile?.city || undefined,
      profileAvatar: selectedProfile?.avatar_url || undefined,
      imageUrl: activeImageSrc || "",
      videoUrl: adType === "video" ? videoFile || undefined : undefined,
      caption: caption.trim(),
      hashtags: [...hashtags],
      country: selectedCountry,
      platform: platform.id,
      customW: platform.id === "custom" ? customW : undefined,
      customH: platform.id === "custom" ? customH : undefined,
      status: "queued",
      createdAt: new Date().toISOString(),
      cropX, cropY, cropZoom,
      overlayEnabled, overlayPosition, overlayOpacity,
    };
    const newQueue = [ad, ...queue];
    setQueue(newQueue);
    saveQueue(newQueue);
    toast.success("Ad saved to queue!");
    // Reset image for next ad
    setImageFile(null);
    setImageUrl(selectedProfile?.avatar_url || "");
    setCropX(0); setCropY(0); setCropZoom(1);
    setCaptionTemplate(t => t + 1);
  };

  const handleCopyAd = async (ad: AdItem) => {
    const text = `${ad.caption}\n\n${ad.hashtags.join(" ")}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIds(s => new Set(s).add(ad.id));
      const updated = queue.map(a =>
        a.id === ad.id ? { ...a, status: "used" as const, copiedAt: new Date().toISOString() } : a
      );
      setQueue(updated);
      saveQueue(updated);
      toast.success("Caption copied! Ad marked as used.");
      setTimeout(() => setCopiedIds(s => { const n = new Set(s); n.delete(ad.id); return n; }), 2000);
    } catch {
      toast.error("Copy failed — check clipboard permissions");
    }
  };

  const handleDownloadImage = async (ad: AdItem) => {
    const pw = PLATFORMS.find(p => p.id === ad.platform);
    const outW = ad.customW || pw?.w || 1080;
    const outH = ad.customH || pw?.h || 1080;
    try {
      toast.loading("Preparing image...");
      const dataUrl = await exportCroppedImage(
        ad.imageUrl, ad.cropX, ad.cropY, ad.cropZoom, outW, outH,
        ad.overlayEnabled, ad.overlayPosition, ad.overlayOpacity,
      );
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `2dateme_ad_${ad.id}.jpg`;
      a.click();
      toast.dismiss();
      toast.success("Image downloaded with brand overlay!");
    } catch {
      toast.dismiss();
      toast.error("Download failed — image may be cross-origin");
    }
  };

  const handleDeleteAd = (id: string) => {
    const updated = queue.filter(a => a.id !== id);
    setQueue(updated);
    saveQueue(updated);
    toast.success("Ad deleted");
  };

  const handleClearUsed = () => {
    const updated = queue.filter(a => a.status !== "used");
    setQueue(updated);
    saveQueue(updated);
    toast.success("Cleared used ads");
  };

  const handleBatchGenerate = () => {
    const ids = batchIds.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) { toast.error("Enter at least one profile ID"); return; }
    setBatchGenerating(true);
    const bPack = COUNTRY_PACKS[batchCountry] || COUNTRY_PACKS.indonesia;
    const bPlat = batchPlatform;
    const newAds: AdItem[] = [];
    ids.forEach((pid, i) => {
      const profile = profiles.find(p => p.id === pid);
      const name = profile ? profile.name?.split(" ")[0] : `Profile ${pid}`;
      const age = profile?.age;
      const city = profile?.city || profile?.country || "";
      const lf = profile?.looking_for || "";
      const captionIdx = i % bPack.captions.length;
      const cap = profile
        ? `Meet ${name}${age ? `, ${age}` : ""}${city ? ` from ${city}` : ""}. ${lf ? `Looking for: ${lf}. ` : ""}${bPack.cta}`
        : bPack.captions[captionIdx];
      newAds.push({
        id: genId(),
        profileId: pid,
        profileName: profile?.name,
        profileAge: profile?.age,
        profileCity: profile?.city || undefined,
        profileAvatar: profile?.avatar_url || undefined,
        imageUrl: profile?.avatar_url || "",
        caption: cap,
        hashtags: bPack.hashtags.slice(0, 30),
        country: batchCountry,
        platform: bPlat.id,
        status: "queued",
        createdAt: new Date().toISOString(),
        cropX: 0, cropY: 0, cropZoom: 1,
      });
    });
    const updated = [...newAds, ...queue];
    setQueue(updated);
    saveQueue(updated);
    setBatchGenerating(false);
    setBatchIds("");
    toast.success(`Generated ${newAds.length} ads!`);
    setSection("queue");
  };

  const handleCopyAll = async (ads: AdItem[]) => {
    const queued = ads.filter(a => a.status === "queued");
    if (queued.length === 0) { toast.error("No queued ads"); return; }
    const allText = queued.map(a => `${a.caption}\n\n${a.hashtags.join(" ")}`).join("\n\n---\n\n");
    try {
      await navigator.clipboard.writeText(allText);
      const updated = queue.map(a =>
        queued.find(q => q.id === a.id)
          ? { ...a, status: "used" as const, copiedAt: new Date().toISOString() }
          : a
      );
      setQueue(updated);
      saveQueue(updated);
      toast.success(`Copied ${queued.length} captions to clipboard!`);
    } catch {
      toast.error("Copy failed");
    }
  };

  const filteredQueue = queue.filter(a =>
    queueFilter === "all" ? true : a.status === queueFilter
  );
  const queuedCount = queue.filter(a => a.status === "queued").length;
  const usedCount = queue.filter(a => a.status === "used").length;

  const filteredProfiles = profileSearch.length > 1
    ? profiles.filter(p =>
        p.name?.toLowerCase().includes(profileSearch.toLowerCase()) ||
        p.id?.toLowerCase().includes(profileSearch.toLowerCase())
      ).slice(0, 6)
    : [];

  const S = {
    sectionBtn: (active: boolean): React.CSSProperties => ({
      flex: 1, padding: "10px 0", borderRadius: 14, fontSize: 12, fontWeight: 700,
      border: "none", cursor: "pointer",
      background: active ? "linear-gradient(135deg, #ec4899, #f472b6)" : "rgba(255,255,255,0.07)",
      color: active ? "#fff" : "rgba(255,255,255,0.5)",
      boxShadow: active ? "0 4px 18px rgba(236,72,153,0.35)" : "none",
      transition: "all 0.2s",
    }),
    card: {
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16, padding: "14px 16px",
    } as React.CSSProperties,
    label: { fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 600, marginBottom: 6, display: "block" } as React.CSSProperties,
    input: {
      width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 13,
      outline: "none", boxSizing: "border-box",
    } as React.CSSProperties,
    btn: (color: string): React.CSSProperties => ({
      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      padding: "10px 16px", borderRadius: 12, border: "none",
      background: color, color: "#fff", fontWeight: 700, fontSize: 12,
      cursor: "pointer",
    }),
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 40 }}>

      {/* Section switcher */}
      <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", padding: 5, borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)", flexWrap: "wrap" }}>
        {[
          { id: "create",    label: "Create",          icon: "✏️" },
          { id: "queue",     label: `Queue (${queuedCount})`, icon: "📋" },
          { id: "batch",     label: "Batch",           icon: "⚡" },
          { id: "analytics", label: `Stats (${Object.values(adViews).reduce((a,b)=>a+b,0)})`, icon: "📊" },
        ].map(s => (
          <button key={s.id} onClick={() => setSection(s.id as any)} style={S.sectionBtn(section === s.id)}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* ══ CREATE AD ══════════════════════════════════════════════════════ */}
      {section === "create" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Row 1: Platform + Country */}
          <div style={{ display: "flex", gap: 10 }}>
            {/* Platform selector */}
            <div style={{ flex: 1, position: "relative" }}>
              <label style={S.label}>Platform</label>
              <button
                onClick={() => setShowPlatformPicker(v => !v)}
                style={{ ...S.input, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
              >
                <span>{selectedPlatform.icon} {selectedPlatform.label}</span>
                <ChevronDown size={13} style={{ color: "rgba(255,255,255,0.4)" }} />
              </button>
              {showPlatformPicker && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, zIndex: 50, marginTop: 4,
                  background: "rgba(14,14,18,0.98)", border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 14, padding: 8, minWidth: 220,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
                  maxHeight: 280, overflowY: "auto",
                }}>
                  {PLATFORMS.map(p => (
                    <button key={p.id} onClick={() => { setSelectedPlatform(p); setShowPlatformPicker(false); }} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", padding: "8px 12px", borderRadius: 10, border: "none",
                      background: selectedPlatform.id === p.id ? "rgba(236,72,153,0.2)" : "transparent",
                      color: "#fff", cursor: "pointer", fontSize: 12,
                    }}>
                      <span>{p.icon} {p.label}</span>
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{p.w}×{p.h}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Country selector */}
            <div style={{ flex: 1, position: "relative" }}>
              <label style={S.label}>Country / Language</label>
              <button
                onClick={() => setShowCountryPicker(v => !v)}
                style={{ ...S.input, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
              >
                <span>{pack.flag} {pack.label}</span>
                <ChevronDown size={13} style={{ color: "rgba(255,255,255,0.4)" }} />
              </button>
              {showCountryPicker && (
                <div style={{
                  position: "absolute", top: "100%", right: 0, zIndex: 50, marginTop: 4,
                  background: "rgba(14,14,18,0.98)", border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 14, padding: 8, minWidth: 200,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
                  maxHeight: 280, overflowY: "auto",
                }}>
                  {Object.entries(COUNTRY_PACKS).map(([key, cp]) => (
                    <button key={key} onClick={() => { setSelectedCountry(key); setShowCountryPicker(false); }} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      width: "100%", padding: "8px 12px", borderRadius: 10, border: "none",
                      background: selectedCountry === key ? "rgba(236,72,153,0.2)" : "transparent",
                      color: "#fff", cursor: "pointer", fontSize: 12,
                    }}>
                      <span>{cp.flag}</span>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 700 }}>{cp.label}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{cp.lang}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Custom size row */}
          {selectedPlatform.id === "custom" && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Width (px)</label>
                <input type="number" value={customW} onChange={e => setCustomW(Number(e.target.value))} style={S.input} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Height (px)</label>
                <input type="number" value={customH} onChange={e => setCustomH(Number(e.target.value))} style={S.input} />
              </div>
            </div>
          )}

          {/* Profile picker */}
          <div style={S.card}>
            <label style={S.label}>Use Profile (optional)</label>
            <div style={{ position: "relative" }}>
              <input
                value={profileSearch}
                onChange={e => { setProfileSearch(e.target.value); setShowProfileSearch(true); }}
                onFocus={() => setShowProfileSearch(true)}
                placeholder="Search by name or ID..."
                style={{ ...S.input, paddingLeft: 36 }}
              />
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
              {showProfileSearch && filteredProfiles.length > 0 && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, marginTop: 4,
                  background: "rgba(14,14,18,0.98)", border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 14, padding: 6, boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
                }}>
                  {filteredProfiles.map(p => (
                    <button key={p.id} onClick={() => {
                      setSelectedProfile(p);
                      setProfileSearch(p.name || p.id);
                      setShowProfileSearch(false);
                    }} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", padding: "8px 10px", borderRadius: 10, border: "none",
                      background: "transparent", color: "#fff", cursor: "pointer", textAlign: "left",
                    }}>
                      {p.avatar_url && <img src={p.avatar_url} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{p.age} · {p.city} · {p.id}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedProfile && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, padding: "8px 10px", background: "rgba(236,72,153,0.08)", borderRadius: 12, border: "1px solid rgba(236,72,153,0.2)" }}>
                {selectedProfile.avatar_url && <img src={selectedProfile.avatar_url} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{selectedProfile.name}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{selectedProfile.age} · {selectedProfile.city} · {selectedProfile.looking_for}</div>
                </div>
                <button onClick={() => { setSelectedProfile(null); setProfileSearch(""); setImageUrl(""); setImageFile(null); }}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Image / Video toggle */}
          <div style={{ display: "flex", gap: 6 }}>
            {(["image","video"] as AdType[]).map(t => (
              <button key={t} onClick={() => setAdType(t)} style={{
                flex: 1, padding: "9px 0", borderRadius: 12, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
                background: adType === t ? "linear-gradient(135deg,#ec4899,#f472b6)" : "rgba(255,255,255,0.08)",
                color: adType === t ? "#fff" : "rgba(255,255,255,0.5)",
              }}>
                {t === "image" ? <><Image size={12} style={{display:"inline",marginRight:5}}/>Image Ad</> : <><Video size={12} style={{display:"inline",marginRight:5}}/>Video Ad</>}
              </button>
            ))}
          </div>

          {/* Image upload + crop */}
          {adType === "image" && (
            <div style={S.card}>
              <label style={S.label}>Image</label>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <button onClick={() => fileInputRef.current?.click()} style={S.btn("rgba(255,255,255,0.1)")}>
                  <Image size={13} /> Upload
                </button>
                <input
                  value={imageUrl}
                  onChange={e => { setImageUrl(e.target.value); setImageFile(null); }}
                  placeholder="...or paste image URL"
                  style={{ ...S.input, flex: 1 }}
                />
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />
              </div>
              {activeImageSrc && (
                <ImageCropper
                  src={activeImageSrc}
                  ratio={platform.ratio}
                  cropX={cropX} cropY={cropY} cropZoom={cropZoom}
                  onChange={(x, y, z) => { setCropX(x); setCropY(y); setCropZoom(z); }}
                />
              )}
              {!activeImageSrc && (
                <div style={{ height: 140, borderRadius: 12, border: "1.5px dashed rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
                  Upload or paste an image URL above
                </div>
              )}
            </div>
          )}

          {/* Video upload */}
          {adType === "video" && (
            <div style={S.card}>
              <label style={S.label}>Video</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button onClick={() => videoInputRef.current?.click()} style={S.btn("rgba(255,255,255,0.1)")}>
                  <Video size={13} /> Upload Video
                </button>
                <input ref={videoInputRef} type="file" accept="video/*" style={{ display: "none" }} onChange={handleVideoUpload} />
                {videoFile && (
                  <button onClick={handleCaptureFrame} style={S.btn("rgba(236,72,153,0.2)")}>
                    <Play size={13} /> Capture Frame
                  </button>
                )}
              </div>
              {videoFile ? (
                <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: "#000" }}>
                  <video
                    ref={videoRef}
                    src={videoFile}
                    controls
                    style={{ width: "100%", maxHeight: 240, display: "block" }}
                  />
                  {/* Brand overlay on video preview */}
                  {overlayEnabled && (
                    <div style={{
                      position: "absolute",
                      ...(overlayPosition === "top-left"     ? { top: 10, left: 10 } : {}),
                      ...(overlayPosition === "top-right"    ? { top: 10, right: 10 } : {}),
                      ...(overlayPosition === "bottom-left"  ? { bottom: 10, left: 10 } : {}),
                      ...(overlayPosition === "bottom-right" ? { bottom: 10, right: 10 } : {}),
                      background: "rgba(0,0,0,0.65)",
                      borderRadius: 20, padding: "5px 12px 5px 8px",
                      display: "flex", alignItems: "center", gap: 6,
                      opacity: overlayOpacity,
                    }}>
                      <img src={logoHeart} style={{ width: 18, height: 18, objectFit: "contain" }} />
                      <span style={{ color: "#fff", fontWeight: 900, fontSize: 11 }}>2DateMe</span>
                    </div>
                  )}
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "6px 0 0", textAlign: "center" }}>
                    Press Capture Frame to extract a still image for the ad
                  </p>
                </div>
              ) : (
                <div style={{ height: 140, borderRadius: 12, border: "1.5px dashed rgba(255,255,255,0.15)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
                  <Video size={28} style={{ color: "rgba(255,255,255,0.15)" }} />
                  Upload your video above
                </div>
              )}
            </div>
          )}

          {/* Brand Overlay Controls */}
          <div style={S.card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <label style={{ ...S.label, marginBottom: 0 }}>Brand Overlay</label>
              <button onClick={() => setOverlayEnabled(v => !v)} style={{
                padding: "4px 12px", borderRadius: 8, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer",
                background: overlayEnabled ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)",
                color: overlayEnabled ? "#22c55e" : "rgba(255,255,255,0.4)",
              }}>
                {overlayEnabled ? "ON" : "OFF"}
              </button>
            </div>
            {overlayEnabled && (
              <>
                {/* Logo preview */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "rgba(0,0,0,0.4)", borderRadius: 20, width: "fit-content", marginBottom: 10 }}>
                  <img src={logoHeart} style={{ width: 20, height: 20, objectFit: "contain" }} />
                  <span style={{ color: "#fff", fontWeight: 900, fontSize: 12 }}>2DateMe</span>
                </div>
                {/* Position */}
                <label style={S.label}>Position</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {(["top-left","top-right","bottom-left","bottom-right"] as OverlayPos[]).map(pos => (
                    <button key={pos} onClick={() => setOverlayPosition(pos)} style={{
                      padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer",
                      background: overlayPosition === pos ? "rgba(236,72,153,0.25)" : "rgba(255,255,255,0.07)",
                      color: overlayPosition === pos ? "#ec4899" : "rgba(255,255,255,0.5)",
                    }}>
                      {pos === "top-left" ? "↖ Top Left" : pos === "top-right" ? "↗ Top Right" : pos === "bottom-left" ? "↙ Bottom Left" : "↘ Bottom Right"}
                    </button>
                  ))}
                </div>
                {/* Opacity */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>Opacity</span>
                  <input type="range" min={0.3} max={1} step={0.05} value={overlayOpacity}
                    onChange={e => setOverlayOpacity(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: "#ec4899" }} />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", width: 30 }}>{Math.round(overlayOpacity*100)}%</span>
                </div>
              </>
            )}
          </div>

          {/* Caption */}
          <div style={S.card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <label style={{ ...S.label, marginBottom: 0 }}>Caption</label>
              <div style={{ display: "flex", gap: 6 }}>
                {selectedProfile && (
                  <button onClick={() => setCaptionTemplate(t => t + 1)} style={{ ...S.btn("rgba(236,72,153,0.2)"), padding: "5px 10px", fontSize: 10 }}>
                    <Shuffle size={11} /> Regenerate
                  </button>
                )}
                {pack.captions.map((c, i) => (
                  <button key={i} onClick={() => setCaption(c)} style={{ ...S.btn("rgba(255,255,255,0.08)"), padding: "5px 8px", fontSize: 10 }}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={4}
              style={{ ...S.input, resize: "vertical", lineHeight: 1.6 }}
            />
            <div style={{ marginTop: 6, fontSize: 10, color: "rgba(255,255,255,0.35)", textAlign: "right" }}>
              {caption.length} chars
            </div>
          </div>

          {/* Hashtags */}
          <div style={S.card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <label style={{ ...S.label, marginBottom: 0 }}>Hashtags ({hashtags.length})</label>
              <button onClick={() => setHashtags(pack.hashtags.slice(0, 30))} style={{ ...S.btn("rgba(255,255,255,0.08)"), padding: "5px 10px", fontSize: 10 }}>
                <RotateCcw size={11} /> Reset
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
              {hashtags.map((tag, i) => (
                <span key={i} style={{
                  background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.25)",
                  borderRadius: 8, padding: "3px 8px", fontSize: 10, color: "rgba(236,72,153,0.9)",
                  display: "flex", alignItems: "center", gap: 4, cursor: "pointer",
                }} onClick={() => setHashtags(hashtags.filter((_, j) => j !== i))}>
                  {tag} <X size={9} />
                </span>
              ))}
            </div>
            <input
              placeholder="Add custom hashtag and press Enter..."
              style={{ ...S.input, fontSize: 11 }}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  const val = (e.currentTarget.value.startsWith("#") ? e.currentTarget.value : "#" + e.currentTarget.value).trim();
                  if (val.length > 1 && !hashtags.includes(val)) {
                    setHashtags([...hashtags, val]);
                    e.currentTarget.value = "";
                  }
                }
              }}
            />
          </div>

          {/* Preview + Save */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Full preview */}
            {activeImageSrc && (
              <div style={S.card}>
                <label style={S.label}>Final Preview</label>
                <div style={{
                  width: "100%", aspectRatio: `${platform.ratio}`,
                  overflow: "hidden", borderRadius: 12, position: "relative",
                  background: "#111", maxHeight: 280,
                }}>
                  <img src={activeImageSrc} style={{
                    position: "absolute", width: `${100 * cropZoom}%`, height: `${100 * cropZoom}%`,
                    objectFit: "cover",
                    transform: `translate(${cropX * 100 * cropZoom}%, ${cropY * 100 * cropZoom}%)`,
                    top: 0, left: 0,
                  }} alt="preview" />
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
                    padding: "20px 14px 12px",
                  }}>
                    <p style={{ color: "#fff", fontSize: 11, margin: 0, lineHeight: 1.5, fontWeight: 600 }}>{caption}</p>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, margin: "4px 0 0", lineHeight: 1.4 }}>
                      {hashtags.slice(0, 8).join(" ")}...
                    </p>
                  </div>
                  <div style={{
                    position: "absolute", top: 8, right: 8,
                    background: "rgba(0,0,0,0.6)", borderRadius: 6, padding: "2px 6px",
                    fontSize: 9, color: "#fff", fontWeight: 700,
                  }}>
                    {platform.w}×{platform.h}
                  </div>
                </div>
              </div>
            )}
            <button onClick={handleSaveToQueue} style={{
              ...S.btn("linear-gradient(135deg, #ec4899, #f472b6)"),
              padding: "14px", fontSize: 14, fontWeight: 800,
              boxShadow: "0 4px 20px rgba(236,72,153,0.45)",
            }}>
              <Plus size={16} /> Save to Queue
            </button>
          </div>
        </div>
      )}

      {/* ══ QUEUE ═══════════════════════════════════════════════════════════ */}
      {section === "queue" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Stats + actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, ...S.card, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#ec4899" }}>{queuedCount}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Queued</div>
            </div>
            <div style={{ flex: 1, ...S.card, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#22c55e" }}>{usedCount}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Used</div>
            </div>
            <div style={{ flex: 1, ...S.card, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{queue.length}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Total</div>
            </div>
          </div>

          {/* Filter + batch copy */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {(["all", "queued", "used"] as const).map(f => (
              <button key={f} onClick={() => setQueueFilter(f)} style={{
                padding: "6px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700, border: "none",
                background: queueFilter === f ? "rgba(236,72,153,0.25)" : "rgba(255,255,255,0.06)",
                color: queueFilter === f ? "#ec4899" : "rgba(255,255,255,0.4)",
                cursor: "pointer", textTransform: "capitalize",
              }}>
                {f}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button onClick={() => handleCopyAll(filteredQueue)} style={S.btn("rgba(236,72,153,0.2)")}>
              <ClipboardCopy size={13} /> Copy All Queued
            </button>
            {usedCount > 0 && (
              <button onClick={handleClearUsed} style={S.btn("rgba(255,255,255,0.08)")}>
                <Trash2 size={13} /> Clear Used
              </button>
            )}
          </div>

          {/* Ad cards */}
          {filteredQueue.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
              No ads in this view. Create some ads first!
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredQueue.map(ad => {
              const pl = PLATFORMS.find(p => p.id === ad.platform);
              const cp = COUNTRY_PACKS[ad.country];
              const isCopied = copiedIds.has(ad.id);
              return (
                <motion.div
                  key={ad.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: ad.status === "used" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${ad.status === "used" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 16, overflow: "hidden",
                    opacity: ad.status === "used" ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: "flex", gap: 0 }}>
                    {/* Image thumbnail */}
                    {ad.imageUrl && (
                      <div style={{ width: 80, flexShrink: 0, position: "relative", overflow: "hidden" }}>
                        <img src={ad.imageUrl} style={{
                          width: "100%", height: "100%", objectFit: "cover",
                          transform: `scale(${ad.cropZoom}) translate(${ad.cropX * 100}%, ${ad.cropY * 100}%)`,
                          transformOrigin: "center",
                        }} alt="" />
                        {ad.status === "used" && (
                          <div style={{
                            position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <CheckCircle2 size={18} style={{ color: "#22c55e" }} />
                          </div>
                        )}
                      </div>
                    )}
                    {/* Content */}
                    <div style={{ flex: 1, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
                          {pl?.icon} {pl?.label}
                        </span>
                        <span style={{ fontSize: 9, background: "rgba(255,255,255,0.08)", borderRadius: 6, padding: "2px 6px", color: "rgba(255,255,255,0.4)" }}>
                          {cp?.flag} {cp?.label}
                        </span>
                        {ad.profileName && (
                          <span style={{ fontSize: 9, background: "rgba(236,72,153,0.12)", borderRadius: 6, padding: "2px 6px", color: "rgba(236,72,153,0.8)" }}>
                            👤 {ad.profileName}
                          </span>
                        )}
                        <span style={{ marginLeft: "auto", fontSize: 9, color: ad.status === "used" ? "#22c55e" : "rgba(255,255,255,0.3)" }}>
                          {ad.status === "used" ? "✓ Used" : "Queued"}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", margin: 0, lineHeight: 1.5,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {ad.caption}
                      </p>
                      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: 0, lineHeight: 1.4,
                        display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {ad.hashtags.slice(0, 10).join(" ")}
                      </p>
                      {/* View count badge */}
                      {(adViews[ad.id] || 0) > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Eye size={10} style={{ color: "#22c55e" }} />
                          <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 700 }}>
                            {adViews[ad.id]} link open{adViews[ad.id] !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                      {/* Action buttons */}
                      <div style={{ display: "flex", gap: 5, marginTop: 2, flexWrap: "wrap" }}>
                        <button onClick={() => handleCopyAd(ad)} style={{
                          ...S.btn(isCopied ? "#22c55e" : "linear-gradient(135deg,#ec4899,#f472b6)"),
                          flex: 2, padding: "7px 8px", fontSize: 10,
                        }}>
                          {isCopied ? <CheckCircle2 size={11} /> : <Copy size={11} />}
                          {isCopied ? "Copied!" : "Copy Caption"}
                        </button>
                        <button onClick={() => handleCopyTrackingUrl(ad)} style={{
                          ...S.btn(linkCopiedIds.has(ad.id) ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.1)"),
                          flex: 2, padding: "7px 8px", fontSize: 10,
                          color: linkCopiedIds.has(ad.id) ? "#22c55e" : "#fff",
                        }}>
                          <Link size={11} />
                          {linkCopiedIds.has(ad.id) ? "Link Copied!" : "Track Link"}
                        </button>
                        {ad.imageUrl && (
                          <button onClick={() => handleDownloadImage(ad)} style={{ ...S.btn("rgba(255,255,255,0.08)"), padding: "7px 9px" }}>
                            <Download size={11} />
                          </button>
                        )}
                        <button onClick={() => handleDeleteAd(ad.id)} style={{ ...S.btn("rgba(239,68,68,0.15)"), padding: "7px 9px" }}>
                          <Trash2 size={11} style={{ color: "#ef4444" }} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ BATCH GENERATE ══════════════════════════════════════════════════ */}
      {section === "batch" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ ...S.card, borderColor: "rgba(236,72,153,0.2)", background: "rgba(236,72,153,0.06)" }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.6 }}>
              ⚡ Generate 100s of ads at once. Enter profile IDs one per line or comma-separated.
              Each profile gets an auto-generated caption in the selected language + country hashtags.
            </p>
          </div>

          {/* Batch country */}
          <div>
            <label style={S.label}>Country / Language</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Object.entries(COUNTRY_PACKS).map(([key, cp]) => (
                <button key={key} onClick={() => setBatchCountry(key)} style={{
                  padding: "6px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700, border: "none",
                  background: batchCountry === key ? "rgba(236,72,153,0.25)" : "rgba(255,255,255,0.07)",
                  color: batchCountry === key ? "#ec4899" : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                }}>
                  {cp.flag} {cp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Batch platform */}
          <div>
            <label style={S.label}>Platform</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {PLATFORMS.filter(p => p.id !== "custom").map(p => (
                <button key={p.id} onClick={() => setBatchPlatform(p)} style={{
                  padding: "6px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700, border: "none",
                  background: batchPlatform.id === p.id ? "rgba(236,72,153,0.25)" : "rgba(255,255,255,0.07)",
                  color: batchPlatform.id === p.id ? "#ec4899" : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                }}>
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Profile IDs */}
          <div>
            <label style={S.label}>Profile IDs (one per line or comma-separated)</label>
            <textarea
              value={batchIds}
              onChange={e => setBatchIds(e.target.value)}
              rows={8}
              placeholder={`indo-f-1\nindo-f-2\nindo-f-5\nindo-m-1\n\nor: indo-f-1, indo-f-2, indo-f-5`}
              style={{ ...S.input, resize: "vertical", lineHeight: 1.8, fontFamily: "monospace", fontSize: 11 }}
            />
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>
              {batchIds.split(/[\n,]+/).filter(s => s.trim()).length} IDs entered
            </p>
          </div>

          {/* Quick-add from loaded profiles */}
          <div style={S.card}>
            <label style={S.label}>Quick Add from Loaded Profiles</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, maxHeight: 160, overflowY: "auto" }}>
              {profiles.slice(0, 40).map(p => (
                <button key={p.id} onClick={() => {
                  const existing = batchIds.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
                  if (!existing.includes(p.id)) setBatchIds(prev => prev ? prev + "\n" + p.id : p.id);
                }} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "4px 8px", borderRadius: 8, border: "none",
                  background: batchIds.includes(p.id) ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)",
                  color: batchIds.includes(p.id) ? "#22c55e" : "rgba(255,255,255,0.6)",
                  cursor: "pointer", fontSize: 10, fontWeight: 600,
                }}>
                  {batchIds.includes(p.id) && <CheckCircle2 size={9} />}
                  {p.name?.split(" ")[0]} {p.age}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={() => {
                const allIds = profiles.map(p => p.id).join("\n");
                setBatchIds(allIds);
              }} style={{ ...S.btn("rgba(255,255,255,0.08)"), flex: 1, padding: "7px", fontSize: 11 }}>
                <Users size={12} /> Add All ({profiles.length})
              </button>
              <button onClick={() => setBatchIds("")} style={{ ...S.btn("rgba(239,68,68,0.12)"), padding: "7px 14px", fontSize: 11 }}>
                <X size={12} style={{ color: "#ef4444" }} /> Clear
              </button>
            </div>
          </div>

          <button
            onClick={handleBatchGenerate}
            disabled={batchGenerating}
            style={{
              ...S.btn("linear-gradient(135deg, #ec4899, #f472b6)"),
              padding: "15px", fontSize: 14, fontWeight: 900,
              boxShadow: "0 4px 24px rgba(236,72,153,0.5)",
              opacity: batchGenerating ? 0.7 : 1,
            }}
          >

            {batchGenerating
              ? <><RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} /> Generating...</>
              : <><Zap size={15} /> Generate All Ads</>
            }
          </button>

          {/* Caption preview for selected country */}
          <div style={S.card}>
            <label style={S.label}>Auto-generated captions preview ({COUNTRY_PACKS[batchCountry]?.label})</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {COUNTRY_PACKS[batchCountry]?.captions.map((c, i) => (
                <div key={i} style={{
                  padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 10,
                  fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.5,
                }}>
                  {i + 1}. {c}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ ...S.label, marginBottom: 4 }}>Hashtags preview</label>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, margin: 0 }}>
                {COUNTRY_PACKS[batchCountry]?.hashtags.slice(0, 20).join(" ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══ ANALYTICS ═══════════════════════════════════════════════════════ */}
      {section === "analytics" && (() => {
        const totalViews = Object.values(adViews).reduce((a, b) => a + b, 0);
        const adsWithViews = queue
          .map(a => ({ ...a, views: adViews[a.id] || 0 }))
          .filter(a => a.views > 0)
          .sort((a, b) => b.views - a.views);
        const countryViews: Record<string, number> = {};
        adsWithViews.forEach(a => { countryViews[a.country] = (countryViews[a.country] || 0) + a.views; });
        const topCountries = Object.entries(countryViews).sort((a, b) => b[1] - a[1]);
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Summary cards */}
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, ...S.card, textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#22c55e" }}>{totalViews}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Total Link Opens</div>
              </div>
              <div style={{ flex: 1, ...S.card, textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#f472b6" }}>{adsWithViews.length}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Ads with Views</div>
              </div>
              <div style={{ flex: 1, ...S.card, textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#facc15" }}>
                  {adsWithViews.length > 0 ? Math.round(totalViews / adsWithViews.length) : 0}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Avg per Ad</div>
              </div>
            </div>

            {/* How tracking works */}
            <div style={{ ...S.card, borderColor: "rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.05)" }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.7 }}>
                📊 <strong>How it works:</strong> Each ad has a unique <strong>Track Link</strong> (copy from queue).
                Put this as your Instagram/TikTok bio link. Every click is counted here automatically.
                Change the bio link for each new ad to track which content performs best.
              </p>
            </div>

            {/* Country breakdown */}
            {topCountries.length > 0 && (
              <div style={S.card}>
                <label style={S.label}>Views by Country</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {topCountries.map(([country, views]) => {
                    const cp = COUNTRY_PACKS[country];
                    const pct = Math.round((views / totalViews) * 100);
                    return (
                      <div key={country} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14 }}>{cp?.flag || "🌍"}</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", flex: 1 }}>{cp?.label || country}</span>
                        <div style={{ width: 80, height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#ec4899,#f472b6)", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, color: "#f472b6", fontWeight: 700, minWidth: 28, textAlign: "right" }}>{views}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Top performing ads */}
            {adsWithViews.length > 0 ? (
              <div style={S.card}>
                <label style={S.label}>Best Performing Ads</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {adsWithViews.slice(0, 10).map((ad, i) => {
                    const pl = PLATFORMS.find(p => p.id === ad.platform);
                    const cp = COUNTRY_PACKS[ad.country];
                    return (
                      <div key={ad.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: i === 0 ? "rgba(250,204,21,0.08)" : "rgba(255,255,255,0.03)", borderRadius: 12, border: `1px solid ${i === 0 ? "rgba(250,204,21,0.2)" : "rgba(255,255,255,0.06)"}` }}>
                        {i === 0 && <span style={{ fontSize: 16 }}>🥇</span>}
                        {i === 1 && <span style={{ fontSize: 16 }}>🥈</span>}
                        {i === 2 && <span style={{ fontSize: 16 }}>🥉</span>}
                        {i > 2 && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", minWidth: 18 }}>#{i+1}</span>}
                        {ad.imageUrl && <img src={ad.imageUrl} style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {ad.caption.slice(0, 50)}...
                          </p>
                          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>
                            {cp?.flag} {cp?.label} · {pl?.icon} {pl?.label}
                            {ad.profileName ? ` · 👤 ${ad.profileName}` : ""}
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                          <TrendingUp size={12} style={{ color: "#22c55e" }} />
                          <span style={{ fontSize: 14, fontWeight: 900, color: "#22c55e" }}>{ad.views}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                <BarChart2 size={32} style={{ margin: "0 auto 10px", color: "rgba(255,255,255,0.1)" }} />
                No views yet. Copy a tracking link from the Queue tab and use it as your bio link.
              </div>
            )}

            <button onClick={() => setAdViews(getAllAdViews())} style={{ ...S.btn("rgba(255,255,255,0.08)"), padding: "10px" }}>
              <RefreshCw size={13} /> Refresh Stats
            </button>
          </div>
        );
      })()}
    </div>
  );
}
