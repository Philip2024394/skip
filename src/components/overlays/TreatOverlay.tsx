import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Lock, RefreshCw } from "lucide-react";

interface TreatOverlayProps {
  showTreatPage: any;
  onClose: () => void;
  currentUser: any;
}

// ── Per-category background images (full height, no overlay) ──────────────────
const BG_IMAGES: Record<string, string> = {
  massage:    "https://ik.imagekit.io/7grri5v7d/massage%20therapist.png?updatedAt=1773333035061",
  jewelry:    "https://ik.imagekit.io/7grri5v7d/jewerly.png?updatedAt=1773337086683",
  beautician: "https://ik.imagekit.io/7grri5v7d/beautician%20picture.png?updatedAt=1773336675160",
  flowers:    "https://ik.imagekit.io/7grri5v7d/flowerist.png?updatedAt=1773335238478",
};

// ── Product images per card (flip back) ──────────────────────────────────────
const PRODUCT_IMAGES: Record<string, string[][]> = {
  massage: [
    [
      "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&q=75&auto=format&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=200&q=75&auto=format&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1591343395082-e120087004b4?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&q=75&auto=format&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1527515637462-cff94ebb84ce?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200&q=75&auto=format&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=200&q=75&auto=format&fit=crop",
    ],
  ],
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
      "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1527515637462-cff94ebb84ce?w=200&q=75&auto=format&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1591343395082-e120087004b4?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&q=75&auto=format&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560066984-138daaa22279?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=200&q=75&auto=format&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1527515637462-cff94ebb84ce?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1591343395082-e120087004b4?w=200&q=75&auto=format&fit=crop",
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
      "https://images.unsplash.com/photo-1487530811015-780f7e3d5c2b?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1548198471-89014d55f8d0?w=200&q=75&auto=format&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1490750967-23b94de16e3e?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1566305977571-5666677c6e98?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=200&q=75&auto=format&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1487530811015-780f7e3d5c2b?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1548198471-89014d55f8d0?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1490750967-23b94de16e3e?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=200&q=75&auto=format&fit=crop",
    ],
    [
      "https://images.unsplash.com/photo-1566305977571-5666677c6e98?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1548198471-89014d55f8d0?w=200&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1487530811015-780f7e3d5c2b?w=200&q=75&auto=format&fit=crop",
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
    { name: "Sari Dewi",     bio: "Swedish & aromatherapy specialist · 6 yrs exp",  avatar: "https://i.pravatar.cc/80?img=47" },
    { name: "Budi Santoso",  bio: "Deep tissue & sports massage certified",          avatar: "https://i.pravatar.cc/80?img=12" },
    { name: "Ayu Lestari",   bio: "Hot stone & traditional Javanese techniques",    avatar: "https://i.pravatar.cc/80?img=48" },
    { name: "Rini Pratiwi",  bio: "Relaxation & prenatal massage expert",           avatar: "https://i.pravatar.cc/80?img=49" },
    { name: "Hendra Kusuma", bio: "Full-body & reflexology, mobile service",        avatar: "https://i.pravatar.cc/80?img=15" },
  ],
  beautician: [
    { name: "Maya Putri",    bio: "Nail art & gel specialist · Korean skincare",    avatar: "https://i.pravatar.cc/80?img=44" },
    { name: "Lia Rahma",     bio: "Hair colourist & stylist · 8 yrs salon exp",    avatar: "https://i.pravatar.cc/80?img=45" },
    { name: "Nanda Sari",    bio: "Bridal & event makeup artist",                  avatar: "https://i.pravatar.cc/80?img=46" },
    { name: "Citra Ayu",     bio: "Lash & brow lifting specialist",                avatar: "https://i.pravatar.cc/80?img=41" },
    { name: "Dian Cahya",    bio: "Facial treatments & skin rejuvenation",         avatar: "https://i.pravatar.cc/80?img=43" },
  ],
  flowers: [
    { name: "Toko Indah",    bio: "Fresh daily bouquets · roses & mixed",          avatar: "https://i.pravatar.cc/80?img=33" },
    { name: "Rosa Florist",  bio: "Wedding & event florals · delivery same day",   avatar: "https://i.pravatar.cc/80?img=34" },
    { name: "Bunga Segar",   bio: "Tropical blooms & exotic orchid arrangements",  avatar: "https://i.pravatar.cc/80?img=35" },
    { name: "Melati Garden", bio: "Sustainable local flowers · seasonal variety",  avatar: "https://i.pravatar.cc/80?img=36" },
    { name: "Anggrek Shop",  bio: "Rare orchid specialist · potted & cut stems",   avatar: "https://i.pravatar.cc/80?img=37" },
  ],
  jewelry: [
    { name: "Toko Emas Bali", bio: "Gold & silver handcrafted jewelry",            avatar: "https://i.pravatar.cc/80?img=25" },
    { name: "Permata Shop",   bio: "Gemstone rings & custom pendants",             avatar: "https://i.pravatar.cc/80?img=26" },
    { name: "Silver Studio",  bio: "Artisan silver pieces · local craftsmanship",  avatar: "https://i.pravatar.cc/80?img=27" },
    { name: "Diamond Dreams", bio: "Diamond & precious stone specialist",          avatar: "https://i.pravatar.cc/80?img=28" },
    { name: "Artisan Gold",   bio: "Custom jewelry design & engraving service",    avatar: "https://i.pravatar.cc/80?img=29" },
  ],
};

// ── Per-category card theme ───────────────────────────────────────────────────
type CardTheme = {
  cardBg: string;
  cardBorder: string;
  accent: string;
  accentText: string;
  headerBg: string;
  flipBg: string;
  flipBorder: string;
  numColor: string;
};

const CARD_THEMES: Record<string, CardTheme> = {
  massage: {
    cardBg:      "rgba(20,10,0,0.78)",
    cardBorder:  "rgba(212,168,83,0.45)",
    accent:      "linear-gradient(135deg, #D4A853, #B8860B)",
    accentText:  "#D4A853",
    headerBg:    "rgba(10,5,0,0.72)",
    flipBg:      "rgba(30,15,0,0.9)",
    flipBorder:  "rgba(212,168,83,0.6)",
    numColor:    "#D4A853",
  },
  beautician: {
    cardBg:      "rgba(20,0,25,0.78)",
    cardBorder:  "rgba(255,105,180,0.45)",
    accent:      "linear-gradient(135deg, #FF69B4, #C71585)",
    accentText:  "#FF69B4",
    headerBg:    "rgba(12,0,16,0.72)",
    flipBg:      "rgba(30,0,38,0.9)",
    flipBorder:  "rgba(255,105,180,0.6)",
    numColor:    "#FF69B4",
  },
  flowers: {
    cardBg:      "rgba(0,20,5,0.78)",
    cardBorder:  "rgba(100,200,120,0.45)",
    accent:      "linear-gradient(135deg, #5DBB7A, #2E7D3E)",
    accentText:  "#72D68A",
    headerBg:    "rgba(0,12,3,0.72)",
    flipBg:      "rgba(0,28,8,0.9)",
    flipBorder:  "rgba(100,200,120,0.6)",
    numColor:    "#72D68A",
  },
  jewelry: {
    cardBg:      "rgba(5,5,15,0.82)",
    cardBorder:  "rgba(255,215,0,0.4)",
    accent:      "linear-gradient(135deg, #FFD700, #B8860B)",
    accentText:  "#FFD700",
    headerBg:    "rgba(2,2,8,0.76)",
    flipBg:      "rgba(8,8,22,0.93)",
    flipBorder:  "rgba(255,215,0,0.55)",
    numColor:    "#FFD700",
  },
};

const TITLES: Record<string, { emoji: string; title: string }> = {
  massage:    { emoji: "💆", title: "Massage" },
  beautician: { emoji: "💅", title: "Beautician" },
  flowers:    { emoji: "🌸", title: "Florist" },
  jewelry:    { emoji: "💎", title: "Jewelry" },
};

// ── Profile Card (landscape, flippable) ──────────────────────────────────────
function ProviderCard({
  provider,
  index,
  theme,
  productImages,
}: {
  provider: Provider;
  index: number;
  theme: CardTheme;
  productImages: string[];
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
          /* ── FRONT: profile card ─────────────────────────────────── */
          <motion.div
            key="front"
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 14,
              background: theme.cardBg,
              border: `1.5px solid ${theme.cardBorder}`,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            {/* Avatar */}
            <img
              src={provider.avatar}
              alt={provider.name}
              style={{
                width: 48, height: 48, borderRadius: "50%",
                objectFit: "cover", flexShrink: 0,
                border: `2px solid ${theme.cardBorder}`,
              }}
            />

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 13, margin: 0, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {provider.name}
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, margin: 0, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {provider.bio}
              </p>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
              {/* WhatsApp locked button */}
              <button
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "5px 8px", borderRadius: 20,
                  background: "rgba(37,211,102,0.15)",
                  border: "1px solid rgba(37,211,102,0.4)",
                  color: "#25D366", fontSize: 10, fontWeight: 700,
                  cursor: "pointer", whiteSpace: "nowrap",
                }}
                onClick={() => {}}
              >
                <Lock size={9} strokeWidth={2.5} />
                <span>WhatsApp</span>
              </button>

              {/* Flip button */}
              <button
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                  padding: "5px 8px", borderRadius: 20,
                  background: theme.cardBg,
                  border: `1px solid ${theme.cardBorder}`,
                  color: theme.accentText, fontSize: 10, fontWeight: 700,
                  cursor: "pointer",
                }}
                onClick={() => setFlipped(true)}
              >
                <RefreshCw size={9} strokeWidth={2.5} />
                <span>Gallery</span>
              </button>
            </div>
          </motion.div>
        ) : (
          /* ── BACK: product image grid ──────────────────────────────── */
          <motion.div
            key="back"
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              padding: "10px 12px",
              borderRadius: 14,
              background: theme.flipBg,
              border: `1.5px solid ${theme.flipBorder}`,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            {/* Back header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <p style={{ color: theme.accentText, fontWeight: 800, fontSize: 11, margin: 0 }}>
                {provider.name} · Gallery
              </p>
              <button
                onClick={() => setFlipped(false)}
                style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "white", fontSize: 11, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            {/* 2×2 image grid with numbers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {productImages.map((url, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <div style={{
                    width: "100%", aspectRatio: "4/3",
                    borderRadius: 8, overflow: "hidden",
                    border: `1px solid ${theme.flipBorder}`,
                  }}>
                    <img
                      src={url}
                      alt={`#${i + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      loading="lazy"
                    />
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
            background: "rgba(0,0,0,0.45)",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "white", fontSize: 18, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(8px)",
          }}
        >
          ←
        </button>

        {/* ── Scrollable content sits at the bottom half ── */}
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          {/* Header card */}
          <div style={{
            margin: "0 12px 10px",
            padding: "14px 16px",
            borderRadius: 18,
            background: theme.headerBg,
            border: `1px solid ${theme.cardBorder}`,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 32, lineHeight: 1 }}>{titleData.emoji}</span>
              <div>
                <h1 style={{ color: theme.accentText, fontWeight: 900, fontSize: 20, margin: 0, lineHeight: 1.1 }}>
                  Yogyakarta {titleData.title}
                </h1>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, margin: "3px 0 0", lineHeight: 1.4 }}>
                  Connect with 5 service providers for <strong style={{ color: theme.accentText }}>$1.99</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Provider cards list */}
          <div style={{
            margin: "0 12px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}>
            {providers.map((provider, idx) => (
              <ProviderCard
                key={provider.name}
                provider={provider}
                index={idx}
                theme={theme}
                productImages={allImages[idx] ?? allImages[0] ?? []}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
