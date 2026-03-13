import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Lock, Flag } from "lucide-react";

interface TreatOverlayProps {
  showTreatPage: any;
  onClose: () => void;
  currentUser: any;
}

// ── Fingerprint SVG ───────────────────────────────────────────────────────────
const FingerprintIcon = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M17.81 4.47c-.08 0-.16-.02-.23-.06C15.66 3.42 14 3 12.01 3c-1.98 0-3.86.47-5.57 1.41-.24.13-.54.04-.68-.2-.13-.24-.04-.55.2-.68C7.82 2.52 9.86 2 12.01 2c2.13 0 3.99.47 6.03 1.52.25.13.34.43.21.67-.09.18-.26.28-.44.28zM3.5 9.72c-.1 0-.2-.03-.29-.09-.23-.16-.28-.47-.12-.7.37-.52.8-1 1.28-1.44C6.22 6.1 9.05 5 12 5c2.96 0 5.79 1.1 7.63 2.49.5.41.95.87 1.31 1.38.16.23.1.54-.13.7-.23.16-.54.1-.7-.13-.32-.45-.73-.87-1.18-1.24C17.29 7.01 14.7 6 12 6c-2.71 0-5.29 1.01-7.12 2.2-.48.36-.87.76-1.18 1.21-.09.13-.24.2-.39.21h-.01zm12.94 8.53c-.07 0-.14-.01-.2-.05-.24-.14-.34-.44-.21-.69.22-.45.34-.93.34-1.44 0-.49-.13-.98-.36-1.44l-.01-.02c-.48-.96-1.41-1.61-2.49-1.61-.55 0-1.05.15-1.51.48l-.04.03c-.37.29-.65.66-.83 1.09-.19.44-.28.9-.28 1.47 0 .29-.23.52-.52.52-.29 0-.52-.23-.52-.52 0-.68.12-1.33.36-1.9.25-.6.64-1.12 1.12-1.52.57-.43 1.25-.65 1.99-.65.97 0 1.88.39 2.58 1.09.37.37.65.83.82 1.34.17.51.24 1.02.24 1.57 0 .66-.15 1.31-.44 1.9-.1.18-.28.3-.48.3h-.01zm-7.94-.46c-.11 0-.22-.04-.31-.11-.21-.17-.25-.49-.08-.7.62-.77.93-1.66.93-2.64 0-1.36-.55-2.59-1.56-3.47-.35-.3-.34-.83.02-1.12.35-.28.86-.23 1.14.11 1.24 1.1 1.95 2.65 1.95 4.48 0 1.23-.38 2.38-1.13 3.34-.09.11-.23.16-.36.16zm3.96.27c-.09 0-.18-.02-.26-.08-.22-.15-.27-.46-.13-.69l.01-.01c.65-1.1 1-2.33 1-3.62 0-.49-.06-.97-.16-1.4-.07-.3.1-.59.39-.67.3-.07.59.1.67.39.13.5.2 1.05.2 1.6 0 1.47-.39 2.88-1.14 4.13-.1.21-.31.35-.58.35zm-7.89-.85c-.16 0-.31-.07-.41-.21-.62-.86-.94-1.87-.94-2.92C4.01 11.88 7.86 9 12 9c4.14 0 7.99 2.88 7.99 6.48 0 .99-.29 1.93-.87 2.8-.16.24-.5.3-.73.14-.23-.16-.3-.49-.14-.73.44-.67.69-1.41.69-2.2 0-2.93-3.24-5.43-6.94-5.43-3.7 0-6.94 2.5-6.94 5.43 0 .82.26 1.59.73 2.27.15.23.09.54-.14.7-.08.06-.17.09-.26.09z" />
  </svg>
);

// ── Background images ──────────────────────────────────────────────────────────
const BG_IMAGES: Record<string, string> = {
  massage:    "https://ik.imagekit.io/7grri5v7d/massage%20therapist.png?updatedAt=1773333035061",
  jewelry:    "https://ik.imagekit.io/7grri5v7d/jewerly.png?updatedAt=1773337086683",
  beautician: "https://ik.imagekit.io/7grri5v7d/beautician%20picture.png?updatedAt=1773336675160",
  flowers:    "https://ik.imagekit.io/7grri5v7d/flowerist.png?updatedAt=1773335238478",
};

const TITLES: Record<string, { emoji: string; title: string; badge: string; badgeIcon: string }> = {
  massage:    { emoji: "💆", title: "Massage",    badge: "Home Service",  badgeIcon: "🏠" },
  beautician: { emoji: "💅", title: "Beautician", badge: "Home Service",  badgeIcon: "🏠" },
  flowers:    { emoji: "🌸", title: "Florist",    badge: "Home Delivery", badgeIcon: "🚚" },
  jewelry:    { emoji: "💎", title: "Jewelry",    badge: "Home Delivery", badgeIcon: "🚚" },
};

// ── Shared glass card rim ──────────────────────────────────────────────────────
const GLASS_BG   = "rgba(0,0,0,0.78)";
const GLASS_RIM  = "rgba(195,60,255,0.42)";       // pink-purple
const GLASS_RIM2 = "rgba(232,72,199,0.50)";        // hot pink variant
const GLASS_BLUR = "blur(18px)";

// ── Massage service menus ─────────────────────────────────────────────────────
type MassageService = { icon: string; name: string; duration: string; price: string };

const MASSAGE_MENUS: MassageService[][] = [
  [
    { icon: "✈️", name: "Travel Relax",       duration: "60 MIN",  price: "Rp 80.000"  },
    { icon: "💼", name: "Office Massage",      duration: "90 MIN",  price: "Rp 130.000" },
    { icon: "🏃", name: "Sports Recovery",     duration: "120 MIN", price: "Rp 180.000" },
  ],
  [
    { icon: "⚡", name: "Power Relief",         duration: "60 MIN",  price: "Rp 90.000"  },
    { icon: "🧘", name: "Deep Tissue Therapy", duration: "90 MIN",  price: "Rp 145.000" },
    { icon: "🏆", name: "Athletic Recovery",   duration: "120 MIN", price: "Rp 200.000" },
  ],
  [
    { icon: "🪨", name: "Hot Stone Bliss",      duration: "60 MIN",  price: "Rp 100.000" },
    { icon: "🌿", name: "Javanese Traditional",duration: "90 MIN",  price: "Rp 155.000" },
    { icon: "👑", name: "Royal Spa Full Body", duration: "120 MIN", price: "Rp 200.000" },
  ],
  [
    { icon: "🌸", name: "Relax & Unwind",       duration: "60 MIN",  price: "Rp 80.000"  },
    { icon: "🕯️", name: "Aromatherapy Dream",  duration: "90 MIN",  price: "Rp 130.000" },
    { icon: "💆", name: "Total Body Reset",     duration: "120 MIN", price: "Rp 175.000" },
  ],
  [
    { icon: "🚗", name: "Mobile Home Visit",    duration: "60 MIN",  price: "Rp 85.000"  },
    { icon: "🦶", name: "Reflexology & Back",  duration: "90 MIN",  price: "Rp 135.000" },
    { icon: "🌙", name: "Night Relax Special", duration: "120 MIN", price: "Rp 190.000" },
  ],
];

// ── Product images (non-massage flip back) ────────────────────────────────────
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

// ── Providers ─────────────────────────────────────────────────────────────────
type Provider = { name: string; bio: string; avatar: string };

const PROVIDERS: Record<string, Provider[]> = {
  massage: [
    { name: "Sari Dewi",     bio: "Swedish & aromatherapy · 6 yrs exp",    avatar: "https://i.pravatar.cc/80?img=47" },
    { name: "Budi Santoso",  bio: "Deep tissue & sports certified",         avatar: "https://i.pravatar.cc/80?img=12" },
    { name: "Ayu Lestari",   bio: "Hot stone & Javanese traditional",       avatar: "https://i.pravatar.cc/80?img=48" },
    { name: "Rini Pratiwi",  bio: "Relaxation & aromatherapy expert",       avatar: "https://i.pravatar.cc/80?img=49" },
    { name: "Hendra Kusuma", bio: "Mobile service · reflexology & back",    avatar: "https://i.pravatar.cc/80?img=15" },
  ],
  beautician: [
    { name: "Maya Putri",    bio: "Nail art & gel · Korean skincare",       avatar: "https://i.pravatar.cc/80?img=44" },
    { name: "Lia Rahma",     bio: "Hair colourist & stylist · 8 yrs exp",   avatar: "https://i.pravatar.cc/80?img=45" },
    { name: "Nanda Sari",    bio: "Bridal & event makeup artist",           avatar: "https://i.pravatar.cc/80?img=46" },
    { name: "Citra Ayu",     bio: "Lash & brow lifting specialist",         avatar: "https://i.pravatar.cc/80?img=41" },
    { name: "Dian Cahya",    bio: "Facial & skin rejuvenation",             avatar: "https://i.pravatar.cc/80?img=43" },
  ],
  flowers: [
    { name: "Toko Indah",    bio: "Fresh daily bouquets · roses & mixed",   avatar: "https://i.pravatar.cc/80?img=33" },
    { name: "Rosa Florist",  bio: "Wedding & event florals · same day",     avatar: "https://i.pravatar.cc/80?img=34" },
    { name: "Bunga Segar",   bio: "Tropical blooms & exotic orchids",       avatar: "https://i.pravatar.cc/80?img=35" },
    { name: "Melati Garden", bio: "Sustainable local · seasonal variety",   avatar: "https://i.pravatar.cc/80?img=36" },
    { name: "Anggrek Shop",  bio: "Rare orchid specialist · potted & cut",  avatar: "https://i.pravatar.cc/80?img=37" },
  ],
  jewelry: [
    { name: "Toko Emas Bali", bio: "Gold & silver handcrafted jewelry",     avatar: "https://i.pravatar.cc/80?img=25" },
    { name: "Permata Shop",   bio: "Gemstone rings & custom pendants",      avatar: "https://i.pravatar.cc/80?img=26" },
    { name: "Silver Studio",  bio: "Artisan silver · local craftsmanship",  avatar: "https://i.pravatar.cc/80?img=27" },
    { name: "Diamond Dreams", bio: "Diamond & precious stone specialist",   avatar: "https://i.pravatar.cc/80?img=28" },
    { name: "Artisan Gold",   bio: "Custom jewelry design & engraving",     avatar: "https://i.pravatar.cc/80?img=29" },
  ],
};

// ── Report Popup ──────────────────────────────────────────────────────────────
const REPORT_ISSUES = [
  "Poor Quality Service",
  "No Service Provided",
  "Inappropriate Behaviour",
  "Late / No Show",
  "Other Issue",
];

function ReportPopup({
  providerName,
  category,
  onClose,
}: {
  providerName: string;
  category: string;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails]   = useState("");

  const handleSend = () => {
    const issue   = selected ?? "General Complaint";
    const cat     = category.charAt(0).toUpperCase() + category.slice(1);
    const message = encodeURIComponent(
      `🚩 Service Report — ${cat}\n\nProvider: ${providerName}\nIssue: ${issue}${details.trim() ? `\nDetails: ${details.trim()}` : ""}\n\nSent via 2DateMe`
    );
    window.open(`https://wa.me/6281392000050?text=${message}`, "_blank");
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999999,
        background: "rgba(0,0,0,0.72)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        paddingBottom: 0,
      }}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "rgba(8,0,16,0.97)",
          border: `1.5px solid ${GLASS_RIM}`,
          borderBottom: "none",
          borderRadius: "22px 22px 0 0",
          padding: "20px 18px 36px",
          backdropFilter: GLASS_BLUR,
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: "rgba(195,60,255,0.35)", borderRadius: 2, margin: "0 auto 16px" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(195,60,255,0.15)", border: `1px solid ${GLASS_RIM}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Flag size={13} color="#c33cff" strokeWidth={2} />
            </div>
            <p style={{ color: "#fff", fontWeight: 800, fontSize: 15, margin: 0 }}>Report Provider</p>
          </div>
          <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* Provider name */}
        <p style={{ color: "rgba(195,60,255,0.85)", fontSize: 12, fontWeight: 700, marginBottom: 14 }}>{providerName}</p>

        {/* Customer message */}
        <div style={{ background: "rgba(195,60,255,0.07)", border: `1px solid rgba(195,60,255,0.2)`, borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, lineHeight: 1.6, margin: 0 }}>
            If a service provider in our Treats section has not delivered the experience you deserve, we genuinely want to know. Your feedback matters — every report is reviewed and acted upon as a priority. Thank you for helping us maintain the highest standards.
          </p>
        </div>

        {/* Issue options */}
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", margin: "0 0 8px", textTransform: "uppercase" }}>Select Issue</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          {REPORT_ISSUES.map((issue) => (
            <button
              key={issue}
              onClick={() => setSelected(issue)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 10, cursor: "pointer",
                background: selected === issue ? "rgba(195,60,255,0.18)" : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${selected === issue ? "rgba(195,60,255,0.6)" : "rgba(255,255,255,0.08)"}`,
                color: selected === issue ? "#fff" : "rgba(255,255,255,0.55)",
                fontSize: 12, fontWeight: selected === issue ? 700 : 500,
                transition: "all 0.15s",
              }}
            >
              <div style={{
                width: 14, height: 14, borderRadius: "50%",
                border: `2px solid ${selected === issue ? "#c33cff" : "rgba(255,255,255,0.25)"}`,
                background: selected === issue ? "#c33cff" : "transparent",
                flexShrink: 0,
              }} />
              {issue}
            </button>
          ))}
        </div>

        {/* Optional details */}
        <textarea
          placeholder="Additional details (optional)..."
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={2}
          style={{
            width: "100%", padding: "9px 12px", borderRadius: 10,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid rgba(195,60,255,0.2)`,
            color: "rgba(255,255,255,0.75)", fontSize: 11,
            resize: "none", outline: "none", marginBottom: 14,
            boxSizing: "border-box",
          }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!selected}
          style={{
            width: "100%", height: 46, borderRadius: 14,
            background: selected
              ? "linear-gradient(135deg, rgba(195,60,255,0.85), rgba(232,72,199,0.85))"
              : "rgba(255,255,255,0.08)",
            border: `1px solid ${selected ? "rgba(195,60,255,0.5)" : "rgba(255,255,255,0.1)"}`,
            color: selected ? "#fff" : "rgba(255,255,255,0.3)",
            fontWeight: 800, fontSize: 13, cursor: selected ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          }}
        >
          <Flag size={13} strokeWidth={2} />
          Send Report via WhatsApp
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Massage Card (text back — service menu) ───────────────────────────────────
function MassageCard({
  provider, index, menu, badgeIcon, badge, onReport,
}: {
  provider: Provider; index: number; menu: MassageService[];
  badgeIcon: string; badge: string; onReport: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  // Amber accent for massage
  const accent = "#D4A853";
  const accentDim = "rgba(212,168,83,0.4)";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + index * 0.07 }} style={{ perspective: 1000 }}>
      <AnimatePresence mode="wait">
        {!flipped ? (
          <motion.div key="front" initial={{ rotateY: -90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: 90, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{
              borderRadius: 16, background: GLASS_BG,
              border: `1.5px solid ${GLASS_RIM}`,
              backdropFilter: GLASS_BLUR, WebkitBackdropFilter: GLASS_BLUR,
              overflow: "hidden",
              // left accent bar
              boxShadow: `inset 3px 0 0 ${accentDim}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px" }}>
              {/* Avatar + fingerprint */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0 }}>
                <img src={provider.avatar} alt={provider.name} style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover", border: `2px solid ${accentDim}` }} />
                <button onClick={() => setFlipped(true)} title="View services"
                  style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(212,168,83,0.12)", border: `1.5px solid ${accentDim}`, color: accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                  <FingerprintIcon size={13} color={accent} />
                </button>
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 13, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{provider.name}</p>
                <p style={{ color: "rgba(255,255,255,0.48)", fontSize: 10, margin: "2px 0 5px", lineHeight: 1.4 }}>{provider.bio}</p>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <span style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 20, letterSpacing: "0.04em" }}>
                    {badgeIcon} {badge}
                  </span>
                  <span style={{ background: "rgba(212,168,83,0.1)", border: `1px solid ${accentDim}`, color: accent, fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 20, letterSpacing: "0.04em" }}>
                    ♂ Accepts Males
                  </span>
                </div>
              </div>
              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
                <button onClick={onReport} title="Report provider"
                  style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,60,60,0.2)", color: "rgba(255,100,100,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                  <Flag size={10} strokeWidth={2} />
                </button>
                <button onClick={() => {}}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 20, background: "rgba(212,168,83,0.14)", border: `1.5px solid ${accentDim}`, color: accent, fontSize: 10, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>
                  <Lock size={9} strokeWidth={2.5} />Unlock
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="back" initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: -90, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ borderRadius: 16, background: "rgba(0,0,0,0.9)", border: `1.5px solid ${GLASS_RIM}`, backdropFilter: GLASS_BLUR, WebkitBackdropFilter: GLASS_BLUR, padding: "12px 14px", boxShadow: `inset 3px 0 0 ${accentDim}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <img src={provider.avatar} alt={provider.name} style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover", border: `1px solid ${accentDim}` }} />
                <p style={{ color: accent, fontWeight: 800, fontSize: 11, margin: 0 }}>{provider.name} · Services</p>
              </div>
              <button onClick={() => setFlipped(false)} style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "white", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {menu.map((svc, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 10, background: i === 1 ? "rgba(212,168,83,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${i === 1 ? "rgba(212,168,83,0.28)" : "rgba(255,255,255,0.06)"}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15 }}>{svc.icon}</span>
                    <div>
                      <p style={{ color: "#fff", fontWeight: 700, fontSize: 11, margin: 0 }}>{svc.name}</p>
                      <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 9, margin: 0, letterSpacing: "0.06em" }}>{svc.duration}</p>
                    </div>
                  </div>
                  <p style={{ color: accent, fontWeight: 900, fontSize: 11, margin: 0, whiteSpace: "nowrap" }}>{svc.price}</p>
                </div>
              ))}
            </div>
            <p style={{ color: "rgba(212,168,83,0.45)", fontSize: 8, fontWeight: 700, margin: "8px 0 0", textAlign: "center", letterSpacing: "0.05em" }}>✓ ACCEPTS MALE CLIENTS</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Beautician Card (top banner strip style) ──────────────────────────────────
function BeauticianCard({
  provider, index, productImages, badgeIcon, badge, onReport,
}: {
  provider: Provider; index: number; productImages: string[];
  badgeIcon: string; badge: string; onReport: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const accent = "#FF69B4";
  const accentDim = "rgba(255,105,180,0.4)";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + index * 0.07 }} style={{ perspective: 1000 }}>
      <AnimatePresence mode="wait">
        {!flipped ? (
          <motion.div key="front" initial={{ rotateY: -90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: 90, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ borderRadius: 16, background: GLASS_BG, border: `1.5px solid ${GLASS_RIM2}`, backdropFilter: GLASS_BLUR, WebkitBackdropFilter: GLASS_BLUR, overflow: "hidden" }}>
            {/* Top banner */}
            <div style={{ background: "linear-gradient(90deg, rgba(255,105,180,0.18), rgba(195,60,255,0.12))", borderBottom: `1px solid ${GLASS_RIM2}`, padding: "7px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <img src={provider.avatar} alt={provider.name} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: `1.5px solid ${accentDim}` }} />
              <p style={{ color: "#fff", fontWeight: 800, fontSize: 12, margin: 0, flex: 1 }}>{provider.name}</p>
              <button onClick={onReport} title="Report" style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,60,60,0.2)", color: "rgba(255,100,100,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                <Flag size={9} strokeWidth={2} />
              </button>
            </div>
            {/* Body */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, margin: "0 0 5px", lineHeight: 1.4 }}>{provider.bio}</p>
                <span style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>
                  {badgeIcon} {badge}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0 }}>
                <button onClick={() => setFlipped(true)} title="Gallery" style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,105,180,0.1)", border: `1.5px solid ${accentDim}`, color: accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                  <FingerprintIcon size={13} color={accent} />
                </button>
                <button onClick={() => {}} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 20, background: "rgba(255,105,180,0.12)", border: `1.5px solid ${accentDim}`, color: accent, fontSize: 10, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>
                  <Lock size={9} strokeWidth={2.5} />Unlock
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="back" initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: -90, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ borderRadius: 16, background: "rgba(0,0,0,0.9)", border: `1.5px solid ${GLASS_RIM2}`, backdropFilter: GLASS_BLUR, WebkitBackdropFilter: GLASS_BLUR, overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(90deg, rgba(255,105,180,0.18), rgba(195,60,255,0.12))", borderBottom: `1px solid ${GLASS_RIM2}`, padding: "7px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <img src={provider.avatar} alt={provider.name} style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", border: `1px solid ${accentDim}` }} />
                <p style={{ color: accent, fontWeight: 800, fontSize: 11, margin: 0 }}>{provider.name} · Gallery</p>
              </div>
              <button onClick={() => setFlipped(false)} style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "white", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <div style={{ padding: "10px 12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {productImages.map((url, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <div style={{ width: "100%", aspectRatio: "4/3", borderRadius: 8, overflow: "hidden", border: `1px solid ${accentDim}` }}>
                      <img src={url} alt={`#${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                    </div>
                    <p style={{ color: accent, fontSize: 9, fontWeight: 800, margin: 0 }}>#{i + 1}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Flowers Card (reversed layout — avatar on right) ──────────────────────────
function FlowersCard({
  provider, index, productImages, badgeIcon, badge, onReport,
}: {
  provider: Provider; index: number; productImages: string[];
  badgeIcon: string; badge: string; onReport: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const accent = "#72D68A";
  const accentDim = "rgba(100,200,120,0.4)";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + index * 0.07 }} style={{ perspective: 1000 }}>
      <AnimatePresence mode="wait">
        {!flipped ? (
          <motion.div key="front" initial={{ rotateY: -90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: 90, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ borderRadius: 16, background: GLASS_BG, border: `1.5px solid ${GLASS_RIM}`, backdropFilter: GLASS_BLUR, WebkitBackdropFilter: GLASS_BLUR, overflow: "hidden", boxShadow: `inset -3px 0 0 ${accentDim}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px" }}>
              {/* Info left */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 13, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{provider.name}</p>
                <p style={{ color: "rgba(255,255,255,0.48)", fontSize: 10, margin: "2px 0 5px", lineHeight: 1.4 }}>{provider.bio}</p>
                <span style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>
                  {badgeIcon} {badge}
                </span>
              </div>
              {/* Avatar + actions right */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0 }}>
                <div style={{ position: "relative" }}>
                  <img src={provider.avatar} alt={provider.name} style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover", border: `2px solid ${accentDim}` }} />
                  <button onClick={onReport} title="Report" style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: "50%", background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,60,60,0.3)", color: "rgba(255,100,100,0.7)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                    <Flag size={8} strokeWidth={2} />
                  </button>
                </div>
                <button onClick={() => setFlipped(true)} title="Gallery" style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(100,200,120,0.1)", border: `1.5px solid ${accentDim}`, color: accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                  <FingerprintIcon size={13} color={accent} />
                </button>
                <button onClick={() => {}} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 20, background: "rgba(100,200,120,0.1)", border: `1.5px solid ${accentDim}`, color: accent, fontSize: 10, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>
                  <Lock size={9} strokeWidth={2.5} />Unlock
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="back" initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: -90, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ borderRadius: 16, background: "rgba(0,0,0,0.9)", border: `1.5px solid ${GLASS_RIM}`, backdropFilter: GLASS_BLUR, WebkitBackdropFilter: GLASS_BLUR, padding: "10px 12px", boxShadow: `inset -3px 0 0 ${accentDim}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <img src={provider.avatar} alt={provider.name} style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", border: `1px solid ${accentDim}` }} />
                <p style={{ color: accent, fontWeight: 800, fontSize: 11, margin: 0 }}>{provider.name} · Gallery</p>
              </div>
              <button onClick={() => setFlipped(false)} style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "white", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {productImages.map((url, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <div style={{ width: "100%", aspectRatio: "4/3", borderRadius: 8, overflow: "hidden", border: `1px solid ${accentDim}` }}>
                    <img src={url} alt={`#${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                  </div>
                  <p style={{ color: accent, fontSize: 9, fontWeight: 800, margin: 0 }}>#{i + 1}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Jewelry Card (larger avatar, premium vertical feel) ───────────────────────
function JewelryCard({
  provider, index, productImages, badgeIcon, badge, onReport,
}: {
  provider: Provider; index: number; productImages: string[];
  badgeIcon: string; badge: string; onReport: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const accent = "#FFD700";
  const accentDim = "rgba(255,215,0,0.38)";
  const goldBorder = "rgba(255,200,0,0.45)";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + index * 0.07 }} style={{ perspective: 1000 }}>
      <AnimatePresence mode="wait">
        {!flipped ? (
          <motion.div key="front" initial={{ rotateY: -90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: 90, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ borderRadius: 16, background: "rgba(4,3,14,0.86)", border: `1.5px solid ${goldBorder}`, backdropFilter: GLASS_BLUR, WebkitBackdropFilter: GLASS_BLUR, boxShadow: `0 0 18px rgba(255,200,0,0.08)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
              {/* Large avatar */}
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div style={{ width: 58, height: 58, borderRadius: "50%", padding: 2, background: `linear-gradient(135deg, #FFD700, rgba(255,215,0,0.3))` }}>
                  <img src={provider.avatar} alt={provider.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                </div>
                <button onClick={() => setFlipped(true)} title="Gallery" style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,215,0,0.1)", border: `1.5px solid ${accentDim}`, color: accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                  <FingerprintIcon size={13} color={accent} />
                </button>
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: accent, fontWeight: 800, fontSize: 13, margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{provider.name}</p>
                <p style={{ color: "rgba(255,255,255,0.48)", fontSize: 10, margin: "0 0 5px", lineHeight: 1.4 }}>{provider.bio}</p>
                <span style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>
                  {badgeIcon} {badge}
                </span>
              </div>
              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
                <button onClick={onReport} title="Report" style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,60,60,0.07)", border: "1px solid rgba(255,60,60,0.2)", color: "rgba(255,100,100,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                  <Flag size={10} strokeWidth={2} />
                </button>
                <button onClick={() => {}} style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 11px", borderRadius: 20, background: "rgba(255,215,0,0.1)", border: `1.5px solid ${accentDim}`, color: accent, fontSize: 10, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>
                  <Lock size={9} strokeWidth={2.5} />Unlock
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="back" initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: -90, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ borderRadius: 16, background: "rgba(4,3,14,0.95)", border: `1.5px solid ${goldBorder}`, backdropFilter: GLASS_BLUR, WebkitBackdropFilter: GLASS_BLUR, padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", padding: 1.5, background: `linear-gradient(135deg, #FFD700, rgba(255,215,0,0.3))` }}>
                  <img src={provider.avatar} alt={provider.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                </div>
                <p style={{ color: accent, fontWeight: 800, fontSize: 11, margin: 0 }}>{provider.name} · Gallery</p>
              </div>
              <button onClick={() => setFlipped(false)} style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "white", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {productImages.map((url, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <div style={{ width: "100%", aspectRatio: "4/3", borderRadius: 8, overflow: "hidden", border: `1px solid ${accentDim}` }}>
                    <img src={url} alt={`#${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                  </div>
                  <p style={{ color: accent, fontSize: 9, fontWeight: 800, margin: 0 }}>#{i + 1}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Overlay ──────────────────────────────────────────────────────────────
export default function TreatOverlay({ showTreatPage, onClose }: TreatOverlayProps) {
  const [reportingProvider, setReportingProvider] = useState<string | null>(null);

  if (!showTreatPage) return null;

  const bgImage   = BG_IMAGES[showTreatPage];
  const providers = PROVIDERS[showTreatPage] ?? [];
  const allImages = PRODUCT_IMAGES[showTreatPage] ?? [];
  const titleData = TITLES[showTreatPage] ?? { emoji: "🎁", title: showTreatPage, badge: "Service", badgeIcon: "🏠" };

  if (!bgImage) return null;

  const renderCard = (provider: Provider, idx: number) => {
    const common = {
      provider, index: idx,
      badgeIcon: titleData.badgeIcon,
      badge: titleData.badge,
      onReport: () => setReportingProvider(provider.name),
    };
    if (showTreatPage === "massage")
      return <MassageCard key={provider.name} {...common} menu={MASSAGE_MENUS[idx] ?? MASSAGE_MENUS[0]} />;
    if (showTreatPage === "beautician")
      return <BeauticianCard key={provider.name} {...common} productImages={allImages[idx] ?? []} />;
    if (showTreatPage === "flowers")
      return <FlowersCard key={provider.name} {...common} productImages={allImages[idx] ?? []} />;
    return <JewelryCard key={provider.name} {...common} productImages={allImages[idx] ?? []} />;
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          key={showTreatPage}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            position: "fixed", inset: 0, zIndex: 999999,
            overflowY: "auto",
            backgroundImage: `url(${bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "local",
          }}
        >
          {/* Back button */}
          <button
            onClick={onClose}
            style={{
              position: "fixed", top: 16, left: 16, zIndex: 10,
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.28)",
              color: "white", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(8px)",
            }}
          >←</button>

          {/* Hero spacer — lets the background photo show above cards */}
          <div style={{ height: "48vh" }} />

          {/* Header glass card */}
          <div style={{
            margin: "0 12px 10px", padding: "14px 16px", borderRadius: 18,
            background: GLASS_BG,
            border: `1.5px solid ${GLASS_RIM}`,
            backdropFilter: GLASS_BLUR, WebkitBackdropFilter: GLASS_BLUR,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 30, lineHeight: 1 }}>{titleData.emoji}</span>
              <div>
                <h1 style={{
                  background: "linear-gradient(135deg, #e070ff, #ff70c8)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  fontWeight: 900, fontSize: 20, margin: 0, lineHeight: 1.1,
                }}>
                  Yogyakarta {titleData.title}
                </h1>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, margin: "3px 0 0" }}>
                  Connect with 5 service providers for{" "}
                  <strong style={{ color: "#e070ff" }}>$1.99</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Provider cards */}
          <div style={{ margin: "0 12px 32px", display: "flex", flexDirection: "column", gap: 8 }}>
            {providers.map((p, i) => renderCard(p, i))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Report popup */}
      <AnimatePresence>
        {reportingProvider && (
          <ReportPopup
            providerName={reportingProvider}
            category={showTreatPage}
            onClose={() => setReportingProvider(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
