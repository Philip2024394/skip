import { motion } from "framer-motion";
import { X, ShoppingCart } from "lucide-react";

interface TreatDetailPanelProps {
  treatKey: string;
  onClose: () => void;
}

const TREAT_DATA: Record<string, {
  emoji: string;
  title: string;
  subtitle: string;
  image: string;
  locations: string;
  items: { icon: string; name: string; duration: string; price: string }[];
  additional: string;
}> = {
  massage: {
    emoji: "💆",
    title: "Massage Service",
    subtitle: "Professional home visit massage",
    image: "https://ik.imagekit.io/7grri5v7d/massage%20therapist.png?updatedAt=1773333035061",
    locations: "Home  ·  Villa  ·  Hotel",
    items: [
      { icon: "✈️", name: "Travel Relax", duration: "60 min", price: "Rp 80.000" },
      { icon: "💼", name: "Office Massage", duration: "90 min", price: "Rp 130.000" },
      { icon: "🏃", name: "Sports Recovery", duration: "120 min", price: "Rp 180.000" },
      { icon: "🪨", name: "Hot Stone Bliss", duration: "60 min", price: "Rp 100.000" },
      { icon: "🌿", name: "Javanese Traditional", duration: "90 min", price: "Rp 155.000" },
      { icon: "👑", name: "Royal Spa Full Body", duration: "120 min", price: "Rp 200.000" },
    ],
    additional: "Additional Services On Request",
  },
  beautician: {
    emoji: "💅",
    title: "Beautician Service",
    subtitle: "Professional beauty treatment",
    image: "https://ik.imagekit.io/7grri5v7d/beautician%20picture.png?updatedAt=1773336675160",
    locations: "Home  ·  Villa  ·  Hotel",
    items: [
      { icon: "💅", name: "Manicure & Pedicure", duration: "60 min", price: "Rp 85.000" },
      { icon: "💇", name: "Hair Styling", duration: "90 min", price: "Rp 120.000" },
      { icon: "🧖", name: "Facial Treatment", duration: "60 min", price: "Rp 150.000" },
      { icon: "✨", name: "Full Glam Makeup", duration: "90 min", price: "Rp 200.000" },
      { icon: "🌸", name: "Lash & Brow", duration: "45 min", price: "Rp 95.000" },
      { icon: "💎", name: "Bridal Package", duration: "180 min", price: "Rp 500.000" },
    ],
    additional: "Additional Services On Request",
  },
  flowers: {
    emoji: "🌸",
    title: "Florist Service",
    subtitle: "Fresh flower bouquet delivery",
    image: "https://ik.imagekit.io/7grri5v7d/flowerist.png?updatedAt=1773335238478",
    locations: "Home  ·  Hotel  ·  Villa",
    items: [
      { icon: "🌹", name: "Classic Rose Bouquet", duration: "12 stems", price: "Rp 150.000" },
      { icon: "🌷", name: "Mixed Tulips", duration: "10 stems", price: "Rp 180.000" },
      { icon: "🌻", name: "Sunflower Joy", duration: "8 stems", price: "Rp 120.000" },
      { icon: "💐", name: "Premium Arrangement", duration: "20 stems", price: "Rp 350.000" },
      { icon: "🌺", name: "Tropical Orchid Box", duration: "6 stems", price: "Rp 250.000" },
      { icon: "🎀", name: "Luxury Gift Basket", duration: "Full set", price: "Rp 500.000" },
    ],
    additional: "Additional Bouquets On Request",
  },
  jewelry: {
    emoji: "💎",
    title: "Jewelry Services",
    subtitle: "Sparkling gifts delivered",
    image: "https://ik.imagekit.io/7grri5v7d/jewerly.png?updatedAt=1773337086683",
    locations: "Home  ·  Hotel  ·  Villa",
    items: [
      { icon: "💍", name: "Silver Ring", duration: "Sterling", price: "Rp 250.000" },
      { icon: "📿", name: "Pearl Necklace", duration: "Freshwater", price: "Rp 350.000" },
      { icon: "✨", name: "Crystal Bracelet", duration: "Swarovski", price: "Rp 200.000" },
      { icon: "💎", name: "Gold Pendant", duration: "18K plated", price: "Rp 450.000" },
      { icon: "👑", name: "Diamond Earrings", duration: "CZ stones", price: "Rp 380.000" },
      { icon: "🎁", name: "Gift Set Box", duration: "Full set", price: "Rp 750.000" },
    ],
    additional: "Additional Jewelry On Request",
  },
};

export default function TreatDetailPanel({ treatKey, onClose }: TreatDetailPanelProps) {
  const data = TREAT_DATA[treatKey] || TREAT_DATA.massage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      className="relative rounded-2xl overflow-hidden min-h-0 flex flex-col bg-black/70 backdrop-blur-xl border-2 border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] ring-1 ring-white/5"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 10, right: 10, zIndex: 10,
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "rgba(255,255,255,0.8)",
        }}
        aria-label="Close"
      >
        <X size={14} />
      </button>

      {/* Hero image */}
      <div style={{ position: "relative", height: 160, flexShrink: 0 }}>
        <img
          src={data.image}
          alt={data.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.85))",
        }} />
        <div style={{ position: "absolute", bottom: 12, left: 16, zIndex: 2 }}>
          <p style={{ color: "white", fontSize: 16, fontWeight: 800, margin: 0 }}>
            {data.emoji} {data.title}
          </p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, margin: "2px 0 0", fontWeight: 600 }}>
            {data.subtitle}
          </p>
        </div>
      </div>

      {/* Location pill */}
      <div style={{
        padding: "8px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <p style={{
          color: "rgba(236,72,153,0.8)", fontSize: 10, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.1em", margin: 0,
        }}>
          {data.locations}
        </p>
      </div>

      {/* Scrollable menu items */}
      <div
        className="scrollbar-pink"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 16px 16px",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(236,72,153,0.4) transparent",
        }}
      >
        {data.items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 0",
              borderBottom: i < data.items.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
            }}
          >
            <span style={{ fontSize: 18, width: 28, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "white", fontSize: 12, fontWeight: 700, margin: 0 }}>{item.name}</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 600, margin: "1px 0 0" }}>{item.duration}</p>
            </div>
            <div style={{
              background: "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(168,85,247,0.1))",
              border: "1px solid rgba(236,72,153,0.3)",
              borderRadius: 8,
              padding: "4px 10px",
              flexShrink: 0,
            }}>
              <p style={{ color: "rgba(236,72,153,0.95)", fontSize: 11, fontWeight: 800, margin: 0 }}>{item.price}</p>
            </div>
          </div>
        ))}

        {/* Additional text */}
        <p style={{
          color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600,
          textAlign: "center", marginTop: 12, fontStyle: "italic",
        }}>
          {data.additional}
        </p>

        {/* Order button */}
        <button
          style={{
            width: "100%", marginTop: 12, padding: "12px 0",
            borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, rgba(236,72,153,0.9), rgba(168,85,247,0.9))",
            color: "white", fontSize: 13, fontWeight: 800,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: "0 4px 16px rgba(236,72,153,0.3)",
          }}
        >
          <ShoppingCart size={16} />
          Order Now
        </button>
      </div>
    </motion.div>
  );
}
