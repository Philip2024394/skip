import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Lock, Flag, ShoppingCart } from "lucide-react";

interface TreatOverlayProps {
  showTreatPage: any;
  onClose: () => void;
  currentUser: any;
}

// ── Fingerprint SVG (pink) ────────────────────────────────────────────────────
const FingerprintIcon = ({ size = 14, color = "#e848c7" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M17.81 4.47c-.08 0-.16-.02-.23-.06C15.66 3.42 14 3 12.01 3c-1.98 0-3.86.47-5.57 1.41-.24.13-.54.04-.68-.2-.13-.24-.04-.55.2-.68C7.82 2.52 9.86 2 12.01 2c2.13 0 3.99.47 6.03 1.52.25.13.34.43.21.67-.09.18-.26.28-.44.28zM3.5 9.72c-.1 0-.2-.03-.29-.09-.23-.16-.28-.47-.12-.7.37-.52.8-1 1.28-1.44C6.22 6.1 9.05 5 12 5c2.96 0 5.79 1.1 7.63 2.49.5.41.95.87 1.31 1.38.16.23.1.54-.13.7-.23.16-.54.1-.7-.13-.32-.45-.73-.87-1.18-1.24C17.29 7.01 14.7 6 12 6c-2.71 0-5.29 1.01-7.12 2.2-.48.36-.87.76-1.18 1.21-.09.13-.24.2-.39.21h-.01zm12.94 8.53c-.07 0-.14-.01-.2-.05-.24-.14-.34-.44-.21-.69.22-.45.34-.93.34-1.44 0-.49-.13-.98-.36-1.44l-.01-.02c-.48-.96-1.41-1.61-2.49-1.61-.55 0-1.05.15-1.51.48l-.04.03c-.37.29-.65.66-.83 1.09-.19.44-.28.9-.28 1.47 0 .29-.23.52-.52.52-.29 0-.52-.23-.52-.52 0-.68.12-1.33.36-1.9.25-.6.64-1.12 1.12-1.52.57-.43 1.25-.65 1.99-.65.97 0 1.88.39 2.58 1.09.37.37.65.83.82 1.34.17.51.24 1.02.24 1.57 0 .66-.15 1.31-.44 1.9-.1.18-.28.3-.48.3h-.01zm-7.94-.46c-.11 0-.22-.04-.31-.11-.21-.17-.25-.49-.08-.7.62-.77.93-1.66.93-2.64 0-1.36-.55-2.59-1.56-3.47-.35-.3-.34-.83.02-1.12.35-.28.86-.23 1.14.11 1.24 1.1 1.95 2.65 1.95 4.48 0 1.23-.38 2.38-1.13 3.34-.09.11-.23.16-.36.16zm3.96.27c-.09 0-.18-.02-.26-.08-.22-.15-.27-.46-.13-.69l.01-.01c.65-1.1 1-2.33 1-3.62 0-.49-.06-.97-.16-1.4-.07-.3.1-.59.39-.67.3-.07.59.1.67.39.13.5.2 1.05.2 1.6 0 1.47-.39 2.88-1.14 4.13-.1.21-.31.35-.58.35zm-7.89-.85c-.16 0-.31-.07-.41-.21-.62-.86-.94-1.87-.94-2.92C4.01 11.88 7.86 9 12 9c4.14 0 7.99 2.88 7.99 6.48 0 .99-.29 1.93-.87 2.8-.16.24-.5.3-.73.14-.23-.16-.3-.49-.14-.73.44-.67.69-1.41.69-2.2 0-2.93-3.24-5.43-6.94-5.43-3.7 0-6.94 2.5-6.94 5.43 0 .82.26 1.59.73 2.27.15.23.09.54-.14.7-.08.06-.17.09-.26.09z" />
  </svg>
);

// ── Constants ─────────────────────────────────────────────────────────────────
const BG_IMAGES: Record<string, string> = {
  massage:    "https://ik.imagekit.io/7grri5v7d/massage%20therapist.png?updatedAt=1773333035061",
  jewelry:    "https://ik.imagekit.io/7grri5v7d/jewerly.png?updatedAt=1773337086683",
  beautician: "https://ik.imagekit.io/7grri5v7d/beautician%20picture.png?updatedAt=1773336675160",
  flowers:    "https://ik.imagekit.io/7grri5v7d/flowerist.png?updatedAt=1773335238478",
};

const HERO_TEXT: Record<string, { main: string; sub: string; locations: string }> = {
  massage:    { main: "Yogyakarta", sub: "Massage Service",    locations: "Home  ·  Villa  ·  Hotel" },
  beautician: { main: "Yogyakarta", sub: "Beautician Service", locations: "Home  ·  Villa  ·  Hotel" },
  flowers:    { main: "Yogyakarta", sub: "Florist Service",    locations: "Home  ·  Hotel  ·  Villa" },
  jewelry:    { main: "Yogyakarta", sub: "Jewelry Services",   locations: "Home  ·  Hotel  ·  Villa" },
};

const PAGE_EMOJI: Record<string, string> = {
  massage: "💆", beautician: "💅", flowers: "🌸", jewelry: "💎",
};

const ADDITIONAL_TEXT: Record<string, string> = {
  massage:    "Additional Services On Request",
  beautician: "Additional Services On Request",
  flowers:    "Additional Bouquets On Request",
  jewelry:    "Additional Jewelry On Request",
};

// ── Glass styles ──────────────────────────────────────────────────────────────
const GLASS_BG   = "rgba(0,0,0,0.80)";
const GLASS_RIM  = "rgba(195,60,255,0.45)";
const GLASS_RIM2 = "rgba(232,72,199,0.50)";
const GLASS_BLUR = "blur(20px)";
const FLIP_BG    = "rgba(0,0,0,0.93)";
const PINK_FP    = "#e848c7";
const PINK_FP_DIM = "rgba(232,72,199,0.35)";

// ── Data ──────────────────────────────────────────────────────────────────────
type MassageService = { icon: string; name: string; duration: string; price: string };

const MASSAGE_MENUS: MassageService[][] = [
  [{ icon: "✈️", name: "Travel Relax",       duration: "60 MIN",  price: "Rp 80.000"  }, { icon: "💼", name: "Office Massage",      duration: "90 MIN",  price: "Rp 130.000" }, { icon: "🏃", name: "Sports Recovery",     duration: "120 MIN", price: "Rp 180.000" }],
  [{ icon: "⚡", name: "Power Relief",         duration: "60 MIN",  price: "Rp 90.000"  }, { icon: "🧘", name: "Deep Tissue Therapy", duration: "90 MIN",  price: "Rp 145.000" }, { icon: "🏆", name: "Athletic Recovery",   duration: "120 MIN", price: "Rp 200.000" }],
  [{ icon: "🪨", name: "Hot Stone Bliss",      duration: "60 MIN",  price: "Rp 100.000" }, { icon: "🌿", name: "Javanese Traditional",duration: "90 MIN",  price: "Rp 155.000" }, { icon: "👑", name: "Royal Spa Full Body", duration: "120 MIN", price: "Rp 200.000" }],
  [{ icon: "🌸", name: "Relax & Unwind",       duration: "60 MIN",  price: "Rp 80.000"  }, { icon: "🕯️", name: "Aromatherapy Dream", duration: "90 MIN",  price: "Rp 130.000" }, { icon: "💆", name: "Total Body Reset",    duration: "120 MIN", price: "Rp 175.000" }],
  [{ icon: "🚗", name: "Mobile Home Visit",    duration: "60 MIN",  price: "Rp 85.000"  }, { icon: "🦶", name: "Reflexology & Back",  duration: "90 MIN",  price: "Rp 135.000" }, { icon: "🌙", name: "Night Relax Special", duration: "120 MIN", price: "Rp 190.000" }],
];

const PRODUCT_IMAGES: Record<string, string[][]> = {
  beautician: [
    ["https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1560066984-138daaa22279?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=200&q=75&auto=format&fit=crop"],
    ["https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1527515637462-cff94ebb84ce?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=200&q=75&auto=format&fit=crop"],
    ["https://images.unsplash.com/photo-1591343395082-e120087004b4?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=200&q=75&auto=format&fit=crop"],
    ["https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1560066984-138daaa22279?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1527515637462-cff94ebb84ce?w=200&q=75&auto=format&fit=crop"],
    ["https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1591343395082-e120087004b4?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&q=75&auto=format&fit=crop"],
  ],
  flowers: [
    ["https://images.unsplash.com/photo-1548198471-89014d55f8d0?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1487530811015-780f7e3d5c2b?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1490750967-23b94de16e3e?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1566305977571-5666677c6e98?w=200&q=75&auto=format&fit=crop"],
    ["https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1548198471-89014d55f8d0?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1487530811015-780f7e3d5c2b?w=200&q=75&auto=format&fit=crop"],
    ["https://images.unsplash.com/photo-1490750967-23b94de16e3e?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1566305977571-5666677c6e98?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=200&q=75&auto=format&fit=crop"],
    ["https://images.unsplash.com/photo-1548198471-89014d55f8d0?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1490750967-23b94de16e3e?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1566305977571-5666677c6e98?w=200&q=75&auto=format&fit=crop"],
    ["https://images.unsplash.com/photo-1487530811015-780f7e3d5c2b?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1566305977571-5666677c6e98?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1490750967-23b94de16e3e?w=200&q=75&auto=format&fit=crop"],
  ],
  jewelry: [
    ["https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=200&q=75&auto=format&fit=crop"],
    ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&q=75&auto=format&fit=crop"],
    ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=200&q=75&auto=format&fit=crop"],
    ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&q=75&auto=format&fit=crop"],
    ["https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&q=75&auto=format&fit=crop","https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200&q=75&auto=format&fit=crop"],
  ],
};

type Provider = { name: string; bio: string; avatar: string };
const PROVIDERS: Record<string, Provider[]> = {
  massage:    [{ name: "Sari Dewi",     bio: "Swedish & aromatherapy · 6 yrs exp",   avatar: "https://i.pravatar.cc/80?img=47" }, { name: "Budi Santoso",  bio: "Deep tissue & sports certified",        avatar: "https://i.pravatar.cc/80?img=12" }, { name: "Ayu Lestari",   bio: "Hot stone & Javanese traditional",      avatar: "https://i.pravatar.cc/80?img=48" }, { name: "Rini Pratiwi",  bio: "Relaxation & aromatherapy expert",      avatar: "https://i.pravatar.cc/80?img=49" }, { name: "Hendra Kusuma", bio: "Mobile service · reflexology & back",   avatar: "https://i.pravatar.cc/80?img=15" }],
  beautician: [{ name: "Maya Putri",    bio: "Nail art & gel · Korean skincare",     avatar: "https://i.pravatar.cc/80?img=44" }, { name: "Lia Rahma",     bio: "Hair colourist & stylist · 8 yrs",     avatar: "https://i.pravatar.cc/80?img=45" }, { name: "Nanda Sari",    bio: "Bridal & event makeup artist",         avatar: "https://i.pravatar.cc/80?img=46" }, { name: "Citra Ayu",     bio: "Lash & brow lifting specialist",       avatar: "https://i.pravatar.cc/80?img=41" }, { name: "Dian Cahya",    bio: "Facial & skin rejuvenation",           avatar: "https://i.pravatar.cc/80?img=43" }],
  flowers:    [{ name: "Toko Indah",    bio: "Fresh daily bouquets · roses & mixed", avatar: "https://i.pravatar.cc/80?img=33" }, { name: "Rosa Florist",  bio: "Wedding & event florals · same day",   avatar: "https://i.pravatar.cc/80?img=34" }, { name: "Bunga Segar",   bio: "Tropical blooms & exotic orchids",     avatar: "https://i.pravatar.cc/80?img=35" }, { name: "Melati Garden", bio: "Sustainable local · seasonal variety", avatar: "https://i.pravatar.cc/80?img=36" }, { name: "Anggrek Shop",  bio: "Rare orchid specialist · potted & cut",avatar: "https://i.pravatar.cc/80?img=37" }],
  jewelry:    [{ name: "Toko Emas Bali",bio: "Gold & silver handcrafted jewelry",    avatar: "https://i.pravatar.cc/80?img=25" }, { name: "Permata Shop",  bio: "Gemstone rings & custom pendants",     avatar: "https://i.pravatar.cc/80?img=26" }, { name: "Silver Studio", bio: "Artisan silver · local craftsmanship",  avatar: "https://i.pravatar.cc/80?img=27" }, { name: "Diamond Dreams",bio: "Diamond & precious stone specialist",  avatar: "https://i.pravatar.cc/80?img=28" }, { name: "Artisan Gold",  bio: "Custom jewelry design & engraving",    avatar: "https://i.pravatar.cc/80?img=29" }],
};

// ── Report popup (red theme + user info) ──────────────────────────────────────
const REPORT_ISSUES = ["Poor Quality Service", "No Service Provided", "Inappropriate Behaviour", "Late / No Show", "Other Issue"];

function ReportPopup({ providerName, category, currentUser, onClose }: {
  providerName: string; category: string; currentUser: any; onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails]   = useState("");
  const userName  = currentUser?.name || currentUser?.user_metadata?.name || currentUser?.email || "User";
  const userPhone = currentUser?.phone || currentUser?.user_metadata?.phone || "Not provided";

  const handleSend = () => {
    const cat = category.charAt(0).toUpperCase() + category.slice(1);
    const msg = encodeURIComponent(
      `🚩 SERVICE REPORT — ${cat}\n\nReported by: ${userName}\nContact: ${userPhone}\n\nProvider: ${providerName}\nIssue: ${selected}${details.trim() ? `\nDetails: ${details.trim()}` : ""}\n\nSent via 2DateMe.com`
    );
    window.open(`https://wa.me/6281392000050?text=${msg}`, "_blank");
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9999999, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(18,0,0,0.98)", border: "1.5px solid rgba(220,40,40,0.5)", borderBottom: "none", borderRadius: "22px 22px 0 0", padding: "18px 16px 36px", backdropFilter: GLASS_BLUR }}>
        <div style={{ width: 36, height: 4, background: "rgba(220,40,40,0.4)", borderRadius: 2, margin: "0 auto 14px" }} />
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(220,40,40,0.15)", border: "1px solid rgba(220,40,40,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Flag size={13} color="#dc2828" strokeWidth={2} />
            </div>
            <p style={{ color: "#fff", fontWeight: 800, fontSize: 15, margin: 0 }}>Report Provider</p>
          </div>
          <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        {/* Provider + user info */}
        <div style={{ background: "rgba(220,40,40,0.08)", border: "1px solid rgba(220,40,40,0.22)", borderRadius: 10, padding: "9px 12px", marginBottom: 12 }}>
          <p style={{ color: "rgba(255,100,100,0.9)", fontSize: 11, fontWeight: 700, margin: "0 0 4px" }}>Reporting: {providerName}</p>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, margin: 0 }}>Your name: <span style={{ color: "rgba(255,255,255,0.7)" }}>{userName}</span></p>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, margin: "2px 0 0" }}>Your contact: <span style={{ color: "rgba(255,255,255,0.7)" }}>{userPhone}</span></p>
        </div>
        {/* Customer message */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "9px 12px", marginBottom: 12 }}>
          <p style={{ color: "rgba(255,255,255,0.48)", fontSize: 10, lineHeight: 1.6, margin: 0 }}>
            If a service provider in our Treats section has not delivered the experience you deserve, we genuinely want to know. Your feedback matters — every report is reviewed and acted upon as a priority.
          </p>
        </div>
        {/* Issue select */}
        <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Select Issue</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
          {REPORT_ISSUES.map((issue) => (
            <button key={issue} onClick={() => setSelected(issue)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, cursor: "pointer", background: selected === issue ? "rgba(220,40,40,0.18)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${selected === issue ? "rgba(220,40,40,0.55)" : "rgba(255,255,255,0.07)"}`, color: selected === issue ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: selected === issue ? 700 : 500, transition: "all 0.15s" }}>
              <div style={{ width: 13, height: 13, borderRadius: "50%", border: `2px solid ${selected === issue ? "#dc2828" : "rgba(255,255,255,0.2)"}`, background: selected === issue ? "#dc2828" : "transparent", flexShrink: 0 }} />
              {issue}
            </button>
          ))}
        </div>
        <textarea placeholder="Additional details (optional)..." value={details} onChange={(e) => setDetails(e.target.value)} rows={2}
          style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(220,40,40,0.2)", color: "rgba(255,255,255,0.7)", fontSize: 11, resize: "none", outline: "none", marginBottom: 12, boxSizing: "border-box" }} />
        <button onClick={handleSend} disabled={!selected}
          style={{ width: "100%", height: 46, borderRadius: 14, background: selected ? "linear-gradient(135deg, #dc2828, #b91c1c)" : "rgba(255,255,255,0.06)", border: `1px solid ${selected ? "rgba(220,40,40,0.5)" : "rgba(255,255,255,0.08)"}`, color: selected ? "#fff" : "rgba(255,255,255,0.25)", fontWeight: 800, fontSize: 13, cursor: selected ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <Flag size={13} strokeWidth={2} /> Send Report via WhatsApp
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Shared flip back wrapper ───────────────────────────────────────────────────
function FlipBack({ provider, additionalText, accentColor, children, onClose }: {
  provider: Provider; additionalText: string; accentColor: string; children: React.ReactNode; onClose: () => void;
}) {
  return (
    <div style={{ borderRadius: 16, background: FLIP_BG, border: `1.5px solid ${GLASS_RIM}`, backdropFilter: GLASS_BLUR, WebkitBackdropFilter: GLASS_BLUR, overflow: "hidden" }}>
      <div style={{ background: "linear-gradient(90deg, rgba(232,72,199,0.12), rgba(195,60,255,0.08))", borderBottom: `1px solid ${GLASS_RIM}`, padding: "7px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <img src={provider.avatar} alt={provider.name} style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", border: `1px solid ${GLASS_RIM}` }} />
          <p style={{ color: accentColor, fontWeight: 800, fontSize: 11, margin: 0 }}>{provider.name}</p>
        </div>
        <button onClick={onClose} style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      </div>
      <div style={{ padding: "10px 12px 8px" }}>{children}</div>
      <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 8, fontWeight: 700, textAlign: "center", letterSpacing: "0.07em", textTransform: "uppercase", padding: "0 12px 9px", margin: 0 }}>
        {additionalText}
      </p>
    </div>
  );
}

// ── Image grid (back of non-massage cards) ────────────────────────────────────
function ImageGrid({ images, accentColor }: { images: string[]; accentColor: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
      {images.map((url, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div style={{ width: "100%", aspectRatio: "4/3", borderRadius: 8, overflow: "hidden", border: `1px solid rgba(195,60,255,0.3)` }}>
            <img src={url} alt={`#${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
          </div>
          <p style={{ color: accentColor, fontSize: 9, fontWeight: 800, margin: 0 }}>#{i + 1}</p>
        </div>
      ))}
    </div>
  );
}

// ── Front card shared layout ──────────────────────────────────────────────────
function CardFront({
  provider, accentColor, borderColor, avatarBorder, extraStyle, onFlip, onReport, children,
}: {
  provider: Provider; accentColor: string; borderColor: string; avatarBorder: string;
  extraStyle?: React.CSSProperties; onFlip: () => void; onReport: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 16, background: GLASS_BG, border: `1.5px solid ${borderColor}`, backdropFilter: GLASS_BLUR, WebkitBackdropFilter: GLASS_BLUR, ...extraStyle }}>
      {/* Avatar + pink fingerprint */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0 }}>
        <img src={provider.avatar} alt={provider.name} style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover", border: `2px solid ${avatarBorder}` }} />
        <button onClick={onFlip} title="View details"
          style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(232,72,199,0.12)", border: `1.5px solid ${PINK_FP_DIM}`, color: PINK_FP, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
          <FingerprintIcon size={13} color={PINK_FP} />
        </button>
      </div>
      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: "#fff", fontWeight: 700, fontSize: 13, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{provider.name}</p>
        <p style={{ color: "rgba(255,255,255,0.47)", fontSize: 10, margin: "2px 0 0", lineHeight: 1.4 }}>{provider.bio}</p>
        {children}
      </div>
      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
        <button onClick={onReport} title="Report"
          style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,40,40,0.07)", border: "1px solid rgba(255,40,40,0.22)", color: "rgba(255,90,90,0.65)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
          <Flag size={10} strokeWidth={2} />
        </button>
        <button onClick={() => {}}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 20, background: `rgba(232,72,199,0.12)`, border: `1.5px solid ${GLASS_RIM2}`, color: PINK_FP, fontSize: 10, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>
          <Lock size={9} strokeWidth={2.5} />Unlock
        </button>
      </div>
    </div>
  );
}

// ── Massage Card ──────────────────────────────────────────────────────────────
function MassageCard({ provider, index, menu, onReport }: {
  provider: Provider; index: number; menu: MassageService[]; onReport: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const accent = "#D4A853";
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 + index * 0.07 }} style={{ perspective: 1000 }}>
      <AnimatePresence mode="wait">
        {!flipped ? (
          <motion.div key="front" initial={{ rotateY: -90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
            <CardFront provider={provider} accentColor={accent} borderColor={GLASS_RIM} avatarBorder="rgba(212,168,83,0.4)"
              extraStyle={{ boxShadow: "inset 3px 0 0 rgba(212,168,83,0.3)" }} onFlip={() => setFlipped(true)} onReport={onReport}>
              <p style={{ color: "rgba(212,168,83,0.75)", fontSize: 8, fontWeight: 700, margin: "4px 0 0", letterSpacing: "0.04em" }}>♂ ACCEPTS MALES</p>
            </CardFront>
          </motion.div>
        ) : (
          <motion.div key="back" initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
            <FlipBack provider={provider} additionalText={ADDITIONAL_TEXT.massage} accentColor={accent} onClose={() => setFlipped(false)}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {menu.map((svc, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 10, background: i === 1 ? "rgba(212,168,83,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${i === 1 ? "rgba(212,168,83,0.28)" : "rgba(255,255,255,0.06)"}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15 }}>{svc.icon}</span>
                      <div>
                        <p style={{ color: "#fff", fontWeight: 700, fontSize: 11, margin: 0 }}>{svc.name}</p>
                        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, margin: 0, letterSpacing: "0.05em" }}>{svc.duration}</p>
                      </div>
                    </div>
                    <p style={{ color: accent, fontWeight: 900, fontSize: 11, margin: 0, whiteSpace: "nowrap" }}>{svc.price}</p>
                  </div>
                ))}
              </div>
            </FlipBack>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Generic image-back card ───────────────────────────────────────────────────
function GenericCard({ provider, index, productImages, category, accentColor, onReport }: {
  provider: Provider; index: number; productImages: string[];
  category: string; accentColor: string; onReport: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 + index * 0.07 }} style={{ perspective: 1000 }}>
      <AnimatePresence mode="wait">
        {!flipped ? (
          <motion.div key="front" initial={{ rotateY: -90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
            <CardFront provider={provider} accentColor={accentColor} borderColor={GLASS_RIM} avatarBorder={GLASS_RIM} onFlip={() => setFlipped(true)} onReport={onReport} />
          </motion.div>
        ) : (
          <motion.div key="back" initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
            <FlipBack provider={provider} additionalText={ADDITIONAL_TEXT[category] ?? "Additional Services On Request"} accentColor={accentColor} onClose={() => setFlipped(false)}>
              <ImageGrid images={productImages} accentColor={accentColor} />
            </FlipBack>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Terms footer ──────────────────────────────────────────────────────────────
function TreatFooter({ category }: { category: string }) {
  const [expanded, setExpanded] = useState(false);

  const tips: { icon: string; text: string }[] = [
    { icon: "💬", text: "All conversations must be recorded in WhatsApp chat — keep a text record of every agreement for your reference and the provider's." },
    { icon: "📞", text: "Feel free to call the provider, but ensure all order details, pricing, and agreements are confirmed in WhatsApp text format." },
    ...(category === "massage"  ? [{ icon: "⏱️", text: "Massage: Confirm the number of minutes, massage type, and arrival time before booking." }] : []),
    ...(category === "flowers"  ? [{ icon: "📸", text: "Florist: Request a photo of the final product before or at time of delivery." }] : []),
    ...(category === "jewelry"  ? [{ icon: "📜", text: "Jewelry: Request certification of gold, diamonds, or gemstones before purchase." }] : []),
    ...(category === "beautician" ? [{ icon: "💆", text: "Beautician: Confirm the treatment time, procedure, and any products to be used beforehand." }] : []),
    { icon: "🕐", text: "Set a clear arrival time or estimated delivery time. Delivery to hotels, villas, or homes in certain areas may require additional time due to city location." },
    { icon: "💳", text: "Service providers expect full payment for products or services before delivery. Most providers use local courier services for orders under a certain value." },
    { icon: "🚗", text: "An additional delivery charge (approx. Rp 100.000 or less) may apply if the recipient is not available at the time of delivery." },
    { icon: "🌸", text: "Please note: product photo colours may vary and natural flowers may differ slightly in shade. The experience and sentiment remain our highest priority." },
  ];

  return (
    <div style={{ margin: "8px 12px 0", borderRadius: 18, background: GLASS_BG, border: `1.5px solid ${GLASS_RIM}`, backdropFilter: GLASS_BLUR, WebkitBackdropFilter: GLASS_BLUR, overflow: "hidden" }}>
      {/* Terms header */}
      <button onClick={() => setExpanded(!expanded)}
        style={{ width: "100%", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent", border: "none", cursor: "pointer" }}>
        <p style={{ color: "rgba(232,72,199,0.8)", fontWeight: 800, fontSize: 11, margin: 0, letterSpacing: "0.04em" }}>⚖️ Terms of Service &amp; Service Guide</p>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div style={{ padding: "0 14px 16px", borderTop: `1px solid ${GLASS_RIM}` }}>
          {/* Legal disclaimer */}
          <div style={{ background: "rgba(232,72,199,0.06)", border: "1px solid rgba(232,72,199,0.18)", borderRadius: 10, padding: "10px 12px", margin: "12px 0 14px" }}>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 9.5, lineHeight: 1.7, margin: 0 }}>
              <strong style={{ color: "rgba(232,72,199,0.9)" }}>2DateMe.com Terms of Service — Treat Section.</strong> Service providers listed in this section have been screened and interviewed before listing. 2DateMe.com acts solely as a directory platform and is not a party to any transaction between users and service providers.
            </p>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 9.5, lineHeight: 1.7, margin: "8px 0 0" }}>
              If a transaction has been completed and no service was delivered, <strong style={{ color: "#fff" }}>contact us immediately for a full refund review.</strong> We take the conduct of our service providers very seriously and uphold strict standards. In the event of a dispute directly between you and a service provider, 2DateMe.com is unfortunately unable to intervene, however all reports are reviewed and providers may be removed from the platform.
            </p>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 9.5, lineHeight: 1.7, margin: "8px 0 0" }}>
              For any issue outside of a dispute, please reach out to us directly. We are here to help.
            </p>
          </div>

          {/* How-to guide */}
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 8px" }}>How to Work with Your Service Provider</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {tips.map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{tip.icon}</span>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 9.5, lineHeight: 1.65, margin: 0 }}>{tip.text}</p>
              </div>
            ))}
          </div>

          {/* Warm closing */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 12px", marginTop: 14 }}>
            <p style={{ color: "rgba(232,72,199,0.7)", fontSize: 9.5, lineHeight: 1.7, margin: 0, fontStyle: "italic", textAlign: "center" }}>
              From all the team at 2DateMe.com — we wish you every success in finding that special person. We will continue to grow and update our services to help you create moments that matter. 💖
            </p>
          </div>

          {/* Footer links */}
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 14 }}>
            {["Terms of Service", "Privacy Policy", "Contact Us"].map((link) => (
              <span key={link} style={{ color: "rgba(232,72,199,0.55)", fontSize: 9, fontWeight: 700, textDecoration: "underline", cursor: "pointer", letterSpacing: "0.03em" }}>{link}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Overlay ──────────────────────────────────────────────────────────────
export default function TreatOverlay({ showTreatPage, onClose, currentUser }: TreatOverlayProps) {
  const [reportingProvider, setReportingProvider] = useState<string | null>(null);

  if (!showTreatPage) return null;

  const bgImage   = BG_IMAGES[showTreatPage];
  const providers = PROVIDERS[showTreatPage] ?? [];
  const allImages = PRODUCT_IMAGES[showTreatPage] ?? [];
  const hero      = HERO_TEXT[showTreatPage] ?? { main: "Yogyakarta", sub: "Service", locations: "Home · Villa · Hotel" };
  const emoji     = PAGE_EMOJI[showTreatPage] ?? "🎁";

  if (!bgImage) return null;

  const renderCard = (p: Provider, i: number) => {
    const common = { provider: p, index: i, onReport: () => setReportingProvider(p.name) };
    if (showTreatPage === "massage")
      return <MassageCard key={p.name} {...common} menu={MASSAGE_MENUS[i] ?? MASSAGE_MENUS[0]} />;
    const accentMap: Record<string, string> = { beautician: "#FF69B4", flowers: "#72D68A", jewelry: "#FFD700" };
    return <GenericCard key={p.name} {...common} productImages={allImages[i] ?? []} category={showTreatPage} accentColor={accentMap[showTreatPage] ?? PINK_FP} />;
  };

  return (
    <>
      <AnimatePresence>
        <motion.div key={showTreatPage} initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ position: "fixed", inset: 0, zIndex: 999999, overflowY: "auto", backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center top", backgroundRepeat: "no-repeat", backgroundAttachment: "local" }}>

          {/* Back button */}
          <button onClick={onClose}
            style={{ position: "fixed", top: 16, left: 16, zIndex: 10, width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.28)", color: "white", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>←</button>

          {/* Hero area — background image visible here */}
          <div style={{ height: "46vh", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 16px 20px", background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.55) 100%)" }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <p style={{ color: "rgba(255,255,255,0.9)", fontWeight: 900, fontSize: 30, margin: 0, lineHeight: 1, textShadow: "0 2px 16px rgba(0,0,0,0.7)", letterSpacing: "-0.5px" }}>
                {hero.main}
              </p>
              <p style={{ color: "rgba(255,255,255,0.82)", fontWeight: 700, fontSize: 15, margin: "3px 0 5px", textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}>
                {emoji} {hero.sub}
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: 0, letterSpacing: "0.08em", fontWeight: 600, textShadow: "0 1px 6px rgba(0,0,0,0.7)" }}>
                {hero.locations}
              </p>
            </motion.div>
          </div>

          {/* Package header card with Order Now */}
          <div style={{ margin: "0 12px 10px", padding: "13px 14px", borderRadius: 18, background: GLASS_BG, border: `1.5px solid ${GLASS_RIM}`, backdropFilter: GLASS_BLUR, WebkitBackdropFilter: GLASS_BLUR }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div>
                <p style={{ background: "linear-gradient(135deg, #e070ff, #ff70c8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 900, fontSize: 14, margin: 0 }}>
                  Connect with 5 providers
                </p>
                <p style={{ color: "rgba(255,255,255,0.48)", fontSize: 10, margin: "3px 0 0" }}>
                  Unlock all 5 WhatsApp contacts
                </p>
              </div>
              <button onClick={() => {}}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "9px 14px", borderRadius: 22, background: "linear-gradient(135deg, rgba(232,72,199,0.85), rgba(195,60,255,0.85))", border: "none", color: "#fff", fontWeight: 900, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 0 16px rgba(195,60,255,0.35)", flexShrink: 0 }}>
                <ShoppingCart size={12} strokeWidth={2.5} />Order Now · $1.99
              </button>
            </div>
          </div>

          {/* Provider cards */}
          <div style={{ margin: "0 12px", display: "flex", flexDirection: "column", gap: 8 }}>
            {providers.map((p, i) => renderCard(p, i))}
          </div>

          {/* Terms footer */}
          <TreatFooter category={showTreatPage} />

          {/* Bottom padding */}
          <div style={{ height: 40 }} />
        </motion.div>
      </AnimatePresence>

      {/* Report popup */}
      <AnimatePresence>
        {reportingProvider && (
          <ReportPopup providerName={reportingProvider} category={showTreatPage} currentUser={currentUser} onClose={() => setReportingProvider(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
