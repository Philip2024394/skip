import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Lock } from "lucide-react";

interface TreatOverlayProps {
  showTreatPage: any;
  onClose: () => void;
  currentUser: any;
}

// ── Fingerprint SVG ───────────────────────────────────────────────────────────
const FingerprintIcon = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M17.81 4.47c-.08 0-.16-.02-.23-.06C15.66 3.42 14 3 12.01 3c-1.98 0-3.86.47-5.57 1.41-.24.13-.54.04-.68-.2-.13-.24-.04-.55.2-.68C7.82 2.52 9.86 2 12.01 2c2.13 0 3.99.47 6.03 1.52.25.13.34.43.21.67-.09.18-.26.28-.44.28zM3.5 9.72c-.1 0-.2-.03-.29-.09-.23-.16-.28-.47-.12-.7.37-.52.8-1 1.28-1.44C6.22 6.1 9.05 5 12 5c2.96 0 5.79 1.1 7.63 2.49.5.41.95.87 1.31 1.38.16.23.1.54-.13.7-.23.16-.54.1-.7-.13-.32-.45-.73-.87-1.18-1.24C17.29 7.01 14.7 6 12 6c-2.71 0-5.29 1.01-7.12 2.2-.48.36-.87.76-1.18 1.21-.09.13-.24.2-.39.21h-.01zm12.94 8.53c-.07 0-.14-.01-.2-.05-.24-.14-.34-.44-.21-.69.22-.45.34-.93.34-1.44 0-.49-.13-.98-.36-1.44l-.01-.02c-.48-.96-1.41-1.61-2.49-1.61-.55 0-1.05.15-1.51.48l-.04.03c-.37.29-.65.66-.83 1.09-.19.44-.28.9-.28 1.47 0 .29-.23.52-.52.52-.29 0-.52-.23-.52-.52 0-.68.12-1.33.36-1.9.25-.6.64-1.12 1.12-1.52.57-.43 1.25-.65 1.99-.65.97 0 1.88.39 2.58 1.09.37.37.65.83.82 1.34.17.51.24 1.02.24 1.57 0 .66-.15 1.31-.44 1.9-.1.18-.28.3-.48.3h-.01zm-7.94-.46c-.11 0-.22-.04-.31-.11-.21-.17-.25-.49-.08-.7.62-.77.93-1.66.93-2.64 0-1.36-.55-2.59-1.56-3.47-.35-.3-.34-.83.02-1.12.35-.28.86-.23 1.14.11 1.24 1.1 1.95 2.65 1.95 4.48 0 1.23-.38 2.38-1.13 3.34-.09.11-.23.16-.36.16zm3.96.27c-.09 0-.18-.02-.26-.08-.22-.15-.27-.46-.13-.69l.01-.01c.65-1.1 1-2.33 1-3.62 0-.49-.06-.97-.16-1.4-.07-.3.1-.59.39-.67.3-.07.59.1.67.39.13.5.2 1.05.2 1.6 0 1.47-.39 2.88-1.14 4.13-.1.21-.31.35-.58.35zm-7.89-.85c-.16 0-.31-.07-.41-.21-.62-.86-.94-1.87-.94-2.92C4.01 11.88 7.86 9 12 9c4.14 0 7.99 2.88 7.99 6.48 0 .99-.29 1.93-.87 2.8-.16.24-.5.3-.73.14-.23-.16-.3-.49-.14-.73.44-.67.69-1.41.69-2.2 0-2.93-3.24-5.43-6.94-5.43-3.7 0-6.94 2.5-6.94 5.43 0 .82.26 1.59.73 2.27.15.23.09.54-.14.7-.08.06-.17.09-.26.09z" />
  </svg>
);

// ── Per-category background images ────────────────────────────────────────────
const BG_IMAGES: Record<string, string> = {
  massage:    "https://ik.imagekit.io/7grri5v7d/massage%20therapist.png?updatedAt=1773333035061",
  jewelry:    "https://ik.imagekit.io/7grri5v7d/jewerly.png?updatedAt=1773337086683",
  beautician: "https://ik.imagekit.io/7grri5v7d/beautician%20picture.png?updatedAt=1773336675160",
  flowers:    "https://ik.imagekit.io/7grri5v7d/flowerist.png?updatedAt=1773335238478",
};

// ── Massage service menu per provider (text back) ─────────────────────────────
type MassageService = { icon: string; name: string; duration: string; price: string };
type MassageMenu = MassageService[];

const MASSAGE_MENUS: MassageMenu[] = [
  [
    { icon: "✈️", name: "Travel Relax",        duration: "60 MIN",  price: "Rp 80.000" },
    { icon: "💼", name: "Office Massage",       duration: "90 MIN",  price: "Rp 130.000" },
    { icon: "🏃", name: "Sports Recovery",      duration: "120 MIN", price: "Rp 180.000" },
  ],
  [
    { icon: "⚡", name: "Power Relief",          duration: "60 MIN",  price: "Rp 90.000" },
    { icon: "🧘", name: "Deep Tissue Therapy",  duration: "90 MIN",  price: "Rp 145.000" },
    { icon: "🏆", name: "Athletic Recovery",    duration: "120 MIN", price: "Rp 200.000" },
  ],
  [
    { icon: "🪨", name: "Hot Stone Bliss",       duration: "60 MIN",  price: "Rp 100.000" },
    { icon: "🌿", name: "Javanese Traditional", duration: "90 MIN",  price: "Rp 155.000" },
    { icon: "👑", name: "Royal Spa Full Body",  duration: "120 MIN", price: "Rp 200.000" },
  ],
  [
    { icon: "🌸", name: "Relax & Unwind",        duration: "60 MIN",  price: "Rp 80.000" },
    { icon: "🕯️", name: "Aromatherapy Dream",   duration: "90 MIN",  price: "Rp 130.000" },
    { icon: "💆", name: "Total Body Reset",      duration: "120 MIN", price: "Rp 175.000" },
  ],
  [
    { icon: "🚗", name: "Mobile Home Visit",     duration: "60 MIN",  price: "Rp 85.000" },
    { icon: "🦶", name: "Reflexology & Back",   duration: "90 MIN",  price: "Rp 135.000" },
    { icon: "🌙", name: "Night Relax Special",  duration: "120 MIN", price: "Rp 190.000" },
  ],
];

// ── Product images per card (flip back for non-massage) ───────────────────────
const PRODUCT_IMAGES: Record<string, string[][]> = {
  beautician: [
    [
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560066984-138daaa22279?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=200&q=75&auto=format&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1527515637462-cff94ebb84ce?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=200&q=75&auto=format&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1591343395082-e120087004b4?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=200&q=75&auto=format&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560066984-138daaa22279?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1527515637462-cff94ebb84ce?w=200&q=75&auto=format&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1591343395082-e120087004b4?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&q=75&auto=format&fit=crop",
    ],
  ],
  flowers: [
    [
      "https://images.unsplash.com/photo-1548198471-89014d55f8d0?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1487530811015-780f7e3d5c2b?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1490750967-23b94de16e3e?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1566305977571-5666677c6e98?w=200&q=75&auto=format&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1548198471-89014d55f8d0?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1487530811015-780f7e3d5c2b?w=200&q=75&auto=format&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1490750967-23b94de16e3e?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1566305977571-5666677c6e98?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=200&q=75&auto=format&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1548198471-89014d55f8d0?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1490750967-23b94de16e3e?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1566305977571-5666677c6e98?w=200&q=75&auto=format&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1487530811015-780f7e3d5c2b?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1566305977571-5666677c6e98?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1490750967-23b94de16e3e?w=200&q=75&auto=format&fit=crop",
    ],
  ],
  jewelry: [
    [
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=200&q=75&auto=format&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&q=75&auto=format&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=200&q=75&auto=format&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&q=75&auto=format&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200&q=75&auto=format&fit=crop",
    ],
  ],
};

// ── Provider profiles per category ───────────────────────────────────────────
type Provider = { name: string; bio: string; avatar: string };

const PROVIDERS: Record<string, Provider[]> = {
  massage: [
    { name: "Sari Dewi",     bio: "Swedish & aromatherapy · 6 yrs exp",     avatar: "https://i.pravatar.cc/80?img=47" },
    { name: "Budi Santoso",  bio: "Deep tissue & sports certified",          avatar: "https://i.pravatar.cc/80?img=12" },
    { name: "Ayu Lestari",   bio: "Hot stone & Javanese traditional",        avatar: "https://i.pravatar.cc/80?img=48" },
    { name: "Rini Pratiwi",  bio: "Relaxation & aromatherapy expert",        avatar: "https://i.pravatar.cc/80?img=49" },
    { name: "Hendra Kusuma", bio: "Mobile service · reflexology & back",     avatar: "https://i.pravatar.cc/80?img=15" },
  ],
  beautician: [
    { name: "Maya Putri",    bio: "Nail art & gel specialist · Korean skincare",  avatar: "https://i.pravatar.cc/80?img=44" },
    { name: "Lia Rahma",     bio: "Hair colourist & stylist · 8 yrs salon exp",  avatar: "https://i.pravatar.cc/80?img=45" },
    { name: "Nanda Sari",    bio: "Bridal & event makeup artist",                avatar: "https://i.pravatar.cc/80?img=46" },
    { name: "Citra Ayu",     bio: "Lash & brow lifting specialist",              avatar: "https://i.pravatar.cc/80?img=41" },
    { name: "Dian Cahya",    bio: "Facial treatments & skin rejuvenation",       avatar: "https://i.pravatar.cc/80?img=43" },
  ],
  flowers: [
    { name: "Toko Indah",    bio: "Fresh daily bouquets · roses & mixed",         avatar: "https://i.pravatar.cc/80?img=33" },
    { name: "Rosa Florist",  bio: "Wedding & event florals · same day delivery",  avatar: "https://i.pravatar.cc/80?img=34" },
    { name: "Bunga Segar",   bio: "Tropical blooms & exotic orchid arrangements", avatar: "https://i.pravatar.cc/80?img=35" },
    { name: "Melati Garden", bio: "Sustainable local flowers · seasonal variety", avatar: "https://i.pravatar.cc/80?img=36" },
    { name: "Anggrek Shop",  bio: "Rare orchid specialist · potted & cut stems",  avatar: "https://i.pravatar.cc/80?img=37" },
  ],
  jewelry: [
    { name: "Toko Emas Bali", bio: "Gold & silver handcrafted jewelry",           avatar: "https://i.pravatar.cc/80?img=25" },
    { name: "Permata Shop",   bio: "Gemstone rings & custom pendants",            avatar: "https://i.pravatar.cc/80?img=26" },
    { name: "Silver Studio",  bio: "Artisan silver pieces · local craftsmanship", avatar: "https://i.pravatar.cc/80?img=27" },
    { name: "Diamond Dreams", bio: "Diamond & precious stone specialist",         avatar: "https://i.pravatar.cc/80?img=28" },
    { name: "Artisan Gold",   bio: "Custom jewelry design & engraving",           avatar: "https://i.pravatar.cc/80?img=29" },
  ],
};

// ── Per-category card theme ───────────────────────────────────────────────────
type CardTheme = {
  cardBg: string; cardBorder: string; accent: string; accentText: string;
  headerBg: string; flipBg: string; flipBorder: string; numColor: string;
};

const CARD_THEMES: Record<string, CardTheme> = {
  massage: {
    cardBg: "rgba(20,10,0,0.82)", cardBorder: "rgba(212,168,83,0.45)",
    accent: "linear-gradient(135deg,#D4A853,#B8860B)", accentText: "#D4A853",
    headerBg: "rgba(10,5,0,0.76)", flipBg: "rgba(25,12,0,0.93)",
    flipBorder: "rgba(212,168,83,0.55)", numColor: "#D4A853",
  },
  beautician: {
    cardBg: "rgba(20,0,25,0.82)", cardBorder: "rgba(255,105,180,0.45)",
    accent: "linear-gradient(135deg,#FF69B4,#C71585)", accentText: "#FF69B4",
    headerBg: "rgba(12,0,16,0.76)", flipBg: "rgba(30,0,38,0.93)",
    flipBorder: "rgba(255,105,180,0.6)", numColor: "#FF69B4",
  },
  flowers: {
    cardBg: "rgba(0,20,5,0.82)", cardBorder: "rgba(100,200,120,0.45)",
    accent: "linear-gradient(135deg,#5DBB7A,#2E7D3E)", accentText: "#72D68A",
    headerBg: "rgba(0,12,3,0.76)", flipBg: "rgba(0,28,8,0.93)",
    flipBorder: "rgba(100,200,120,0.6)", numColor: "#72D68A",
  },
  jewelry: {
    cardBg: "rgba(5,5,15,0.86)", cardBorder: "rgba(255,215,0,0.4)",
    accent: "linear-gradient(135deg,#FFD700,#B8860B)", accentText: "#FFD700",
    headerBg: "rgba(2,2,8,0.80)", flipBg: "rgba(8,8,22,0.95)",
    flipBorder: "rgba(255,215,0,0.55)", numColor: "#FFD700",
  },
};

const TITLES: Record<string, { emoji: string; title: string }> = {
  massage:    { emoji: "💆", title: "Massage" },
  beautician: { emoji: "💅", title: "Beautician" },
  flowers:    { emoji: "🌸", title: "Florist" },
  jewelry:    { emoji: "💎", title: "Jewelry" },
};

// ── Massage card (text back with service menu) ────────────────────────────────
function MassageProviderCard({
  provider, index, theme, menu,
}: {
  provider: Provider; index: number; theme: CardTheme; menu: MassageMenu;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.07 }}
      style={{ perspective: 1000 }}
    >
      <AnimatePresence mode="wait">
        {!flipped ? (
          /* ── FRONT ── */
          <motion.div
            key="front"
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 14,
              background: theme.cardBg,
              border: `1.5px solid ${theme.cardBorder}`,
              backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
            }}
          >
            {/* Avatar + fingerprint flip button */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0 }}>
              <img
                src={provider.avatar} alt={provider.name}
                style={{
                  width: 50, height: 50, borderRadius: "50%", objectFit: "cover",
                  border: `2px solid ${theme.cardBorder}`,
                }}
              />
              <button
                onClick={() => setFlipped(true)}
                title="View services"
                style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: "rgba(212,168,83,0.15)",
                  border: `1.5px solid ${theme.cardBorder}`,
                  color: theme.accentText, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: 0,
                }}
              >
                <FingerprintIcon size={14} color={theme.accentText} />
              </button>
            </div>

            {/* Text info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 13, margin: 0, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {provider.name}
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, margin: "0 0 4px", lineHeight: 1.4 }}>
                {provider.bio}
              </p>
              <p style={{ color: theme.accentText, fontSize: 9, fontWeight: 700, margin: 0, letterSpacing: "0.04em" }}>
                Accepts: Males
              </p>
            </div>

            {/* Unlock button */}
            <button
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "7px 10px", borderRadius: 20,
                background: "linear-gradient(135deg, rgba(212,168,83,0.25), rgba(184,134,11,0.2))",
                border: `1.5px solid ${theme.cardBorder}`,
                color: theme.accentText, fontSize: 10, fontWeight: 800,
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              }}
              onClick={() => {}}
            >
              <Lock size={9} strokeWidth={2.5} />
              <span>Unlock</span>
            </button>
          </motion.div>
        ) : (
          /* ── BACK: service menu ── */
          <motion.div
            key="back"
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              padding: "12px 14px", borderRadius: 14,
              background: theme.flipBg,
              border: `1.5px solid ${theme.flipBorder}`,
              backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
            }}
          >
            {/* Back header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <img src={provider.avatar} alt={provider.name}
                  style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover", border: `1px solid ${theme.flipBorder}` }} />
                <p style={{ color: theme.accentText, fontWeight: 800, fontSize: 11, margin: 0 }}>
                  {provider.name}
                </p>
              </div>
              <button
                onClick={() => setFlipped(false)}
                style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  color: "white", fontSize: 11, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >✕</button>
            </div>

            {/* Service rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {menu.map((svc, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 10px", borderRadius: 10,
                    background: i === 1
                      ? "rgba(212,168,83,0.12)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${i === 1 ? "rgba(212,168,83,0.3)" : "rgba(255,255,255,0.07)"}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{svc.icon}</span>
                    <div>
                      <p style={{ color: "#fff", fontWeight: 700, fontSize: 11, margin: 0, lineHeight: 1.2 }}>{svc.name}</p>
                      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 9, margin: 0, fontWeight: 600, letterSpacing: "0.05em" }}>{svc.duration}</p>
                    </div>
                  </div>
                  <p style={{ color: theme.accentText, fontWeight: 900, fontSize: 11, margin: 0, whiteSpace: "nowrap" }}>
                    {svc.price}
                  </p>
                </div>
              ))}
            </div>

            {/* "Accepts Males" tag on back too */}
            <p style={{ color: "rgba(212,168,83,0.6)", fontSize: 9, fontWeight: 700, margin: "8px 0 0", textAlign: "center", letterSpacing: "0.04em" }}>
              ✓ Accepts Male Clients
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Generic provider card (image back, for other categories) ─────────────────
function ProviderCard({
  provider, index, theme, productImages,
}: {
  provider: Provider; index: number; theme: CardTheme; productImages: string[];
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.07 }}
      style={{ perspective: 1000 }}
    >
      <AnimatePresence mode="wait">
        {!flipped ? (
          <motion.div
            key="front"
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 14,
              background: theme.cardBg,
              border: `1.5px solid ${theme.cardBorder}`,
              backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
            }}
          >
            {/* Avatar + fingerprint */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0 }}>
              <img src={provider.avatar} alt={provider.name}
                style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover", border: `2px solid ${theme.cardBorder}` }} />
              <button
                onClick={() => setFlipped(true)}
                title="View gallery"
                style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                  border: `1.5px solid ${theme.cardBorder}`,
                  color: theme.accentText, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                }}
              >
                <FingerprintIcon size={14} color={theme.accentText} />
              </button>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 13, margin: 0, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{provider.name}</p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, margin: 0, lineHeight: 1.4 }}>{provider.bio}</p>
            </div>

            {/* Unlock */}
            <button
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "7px 10px", borderRadius: 20,
                background: "rgba(255,255,255,0.07)",
                border: `1.5px solid ${theme.cardBorder}`,
                color: theme.accentText, fontSize: 10, fontWeight: 800,
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              }}
              onClick={() => {}}
            >
              <Lock size={9} strokeWidth={2.5} />
              <span>Unlock</span>
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="back"
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              padding: "10px 12px", borderRadius: 14,
              background: theme.flipBg,
              border: `1.5px solid ${theme.flipBorder}`,
              backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <img src={provider.avatar} alt={provider.name}
                  style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", border: `1px solid ${theme.flipBorder}` }} />
                <p style={{ color: theme.accentText, fontWeight: 800, fontSize: 11, margin: 0 }}>{provider.name} · Gallery</p>
              </div>
              <button onClick={() => setFlipped(false)}
                style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.22)",
                  color: "white", fontSize: 11, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {productImages.map((url, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <div style={{ width: "100%", aspectRatio: "4/3", borderRadius: 8, overflow: "hidden", border: `1px solid ${theme.flipBorder}` }}>
                    <img src={url} alt={`#${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                  </div>
                  <p style={{ color: theme.numColor, fontSize: 9, fontWeight: 800, margin: 0 }}>#{i + 1}</p>
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
  if (!showTreatPage) return null;

  const bgImage   = BG_IMAGES[showTreatPage];
  const theme     = CARD_THEMES[showTreatPage] ?? CARD_THEMES.massage;
  const providers = PROVIDERS[showTreatPage] ?? [];
  const allImages = PRODUCT_IMAGES[showTreatPage] ?? [];
  const titleData = TITLES[showTreatPage] ?? { emoji: "🎁", title: showTreatPage };
  const isMassage = showTreatPage === "massage";

  if (!bgImage) return null;

  return (
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
            border: "1px solid rgba(255,255,255,0.3)",
            color: "white", fontSize: 18, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(8px)",
          }}
        >←</button>

        {/* Content anchored to bottom */}
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          {/* Header */}
          <div style={{
            margin: "0 12px 10px", padding: "14px 16px", borderRadius: 18,
            background: theme.headerBg,
            border: `1px solid ${theme.cardBorder}`,
            backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 32, lineHeight: 1 }}>{titleData.emoji}</span>
              <div>
                <h1 style={{ color: theme.accentText, fontWeight: 900, fontSize: 20, margin: 0, lineHeight: 1.1 }}>
                  Yogyakarta {titleData.title}
                </h1>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, margin: "3px 0 0", lineHeight: 1.4 }}>
                  Connect with 5 service providers for{" "}
                  <strong style={{ color: theme.accentText }}>$1.99</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Provider cards */}
          <div style={{ margin: "0 12px 32px", display: "flex", flexDirection: "column", gap: 8 }}>
            {providers.map((provider, idx) =>
              isMassage ? (
                <MassageProviderCard
                  key={provider.name}
                  provider={provider}
                  index={idx}
                  theme={theme}
                  menu={MASSAGE_MENUS[idx] ?? MASSAGE_MENUS[0]}
                />
              ) : (
                <ProviderCard
                  key={provider.name}
                  provider={provider}
                  index={idx}
                  theme={theme}
                  productImages={allImages[idx] ?? allImages[0] ?? []}
                />
              )
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
