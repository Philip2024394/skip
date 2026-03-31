import { useRef, useState } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X, Check, Crown, Zap, Star, Globe, Ticket, Rocket, ShieldCheck, EyeOff, Sparkles, Heart } from "lucide-react";
import { PREMIUM_FEATURES, PremiumFeature, getFeaturePriceCents } from "@/data/premiumFeatures";
import { useUserCurrency, getUserCountry } from "@/shared/hooks/useUserCurrency";
import { getRegionForCountry } from "@/shared/utils/regionalPricing";

interface PaymentSheetProps {
  open: boolean;
  onClose: () => void;
  /** Pre-selected feature to highlight. Null = show all equally */
  selectedFeature?: PremiumFeature | null;
  onPurchase: (feature: PremiumFeature, region?: string) => void;
  loading?: boolean;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  crown:   <Crown  className="w-5 h-5" />,
  rocket:  <Rocket className="w-5 h-5" />,
  star:    <Star   className="w-5 h-5" />,
  shield:  <ShieldCheck className="w-5 h-5" />,
  "eye-off": <EyeOff  className="w-5 h-5" />,
  calendar: <Ticket  className="w-5 h-5" />,
  globe:   <Globe  className="w-5 h-5" />,
  sparkles: <Sparkles className="w-5 h-5" />,
  heart:   <Heart  className="w-5 h-5" />,
};

const GRADIENT_MAP: Record<string, string> = {
  love:    "linear-gradient(135deg,#ec4899,#f43f5e)",
  gold:    "linear-gradient(135deg,#f59e0b,#fbbf24)",
  fresh:   "linear-gradient(135deg,#10b981,#34d399)",
  stealth: "linear-gradient(135deg,#6366f1,#818cf8)",
  vip:     "linear-gradient(135deg,#a855f7,#ec4899)",
  sky:     "linear-gradient(135deg,#0ea5e9,#38bdf8)",
  teddy:   "linear-gradient(135deg,#ec4899,#a855f7)",
};

const BADGE: Record<string, { label: string; color: string }> = {
  vip:          { label: "Best Value",    color: "#ec4899" },
  global_dating: { label: "Most Popular", color: "#a855f7" },
  teddy_room:   { label: "New",           color: "#f59e0b" },
};

const SUBSCRIPTIONS = ["vip", "global_dating", "teddy_room"];

export default function PaymentSheet({
  open, onClose, selectedFeature, onPurchase, loading,
}: PaymentSheetProps) {
  const { fmt } = useUserCurrency();
  const [active, setActive] = useState<PremiumFeature | null>(selectedFeature ?? null);
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Keep active in sync when prop changes
  const syncedActive = active ?? selectedFeature ?? null;

  const subs = PREMIUM_FEATURES.filter(f => SUBSCRIPTIONS.includes(f.id));
  const oneTime = PREMIUM_FEATURES.filter(f => !SUBSCRIPTIONS.includes(f.id));

  // Derive user's region once for consistent display
  const userCountry = getUserCountry();
  const userRegion  = getRegionForCountry(userCountry);

  /** Returns the regional price in cents for a feature */
  const regionalCents = (f: PremiumFeature) => getFeaturePriceCents(f.id, userCountry);

  function handleSelect(f: PremiumFeature) {
    setActive(f);
  }

  function handleBuy() {
    if (!syncedActive) return;
    onPurchase(syncedActive, userRegion);
  }

  const priceLabel = syncedActive
    ? fmt(regionalCents(syncedActive), syncedActive.isSubscription ? "/mo" : "")
    : null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim */}
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 9800,
              background: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            ref={sheetRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => { if (info.offset.y > 120) onClose(); }}
            style={{
              position: "fixed", left: 0, right: 0, bottom: 0,
              zIndex: 9801,
              maxHeight: "92dvh",
              borderRadius: "28px 28px 0 0",
              background: "#0c0c14",
              border: "1px solid rgba(255,255,255,0.09)",
              borderBottom: "none",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Accent bar */}
            <div style={{ height: 3, background: "linear-gradient(90deg,#ec4899,#a855f7,#ec4899)", flexShrink: 0 }} />

            {/* Drag handle — touch starts drag */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              style={{ flexShrink: 0, padding: "10px 0 2px", display: "flex", justifyContent: "center", cursor: "grab" }}
            >
              <div style={{ width: 40, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.15)" }} />
            </div>

            {/* Header */}
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", padding: "8px 20px 12px" }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: "white", fontWeight: 900, fontSize: 18, margin: 0, lineHeight: 1.2 }}>
                  Unlock Premium ✨
                </p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "3px 0 0", fontWeight: 500 }}>
                  Choose a plan — cancel anytime
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X style={{ width: 16, height: 16, color: "rgba(255,255,255,0.6)" }} />
              </button>
            </div>

            {/* Scrollable plan list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 8px" }}>
              {/* Subscriptions */}
              <SectionLabel>Monthly Plans</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                {subs.map(f => (
                  <PlanCard
                    key={f.id}
                    feature={f}
                    selected={syncedActive?.id === f.id}
                    badge={BADGE[f.id]}
                    gradient={GRADIENT_MAP[f.color] ?? GRADIENT_MAP.vip}
                    icon={ICON_MAP[f.icon] ?? ICON_MAP.crown}
                    priceLabel={fmt(regionalCents(f), "/mo")}
                    onSelect={() => handleSelect(f)}
                  />
                ))}
              </div>

              {/* One-time */}
              <SectionLabel>One-Time Boosts</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {oneTime.map(f => (
                  <PlanCard
                    key={f.id}
                    feature={f}
                    selected={syncedActive?.id === f.id}
                    badge={BADGE[f.id]}
                    gradient={GRADIENT_MAP[f.color] ?? GRADIENT_MAP.love}
                    icon={ICON_MAP[f.icon] ?? ICON_MAP.rocket}
                    priceLabel={fmt(regionalCents(f))}
                    onSelect={() => handleSelect(f)}
                  />
                ))}
              </div>
            </div>

            {/* Sticky CTA */}
            <div style={{
              flexShrink: 0,
              padding: "12px 16px 32px",
              background: "linear-gradient(to top, #0c0c14 60%, transparent)",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}>
              <button
                onClick={handleBuy}
                disabled={!syncedActive || !!loading}
                style={{
                  width: "100%", height: 52, borderRadius: 16, border: "none",
                  background: syncedActive
                    ? (GRADIENT_MAP[syncedActive.color] ?? GRADIENT_MAP.vip)
                    : "rgba(255,255,255,0.08)",
                  color: "white", fontWeight: 900, fontSize: 16,
                  cursor: syncedActive && !loading ? "pointer" : "default",
                  boxShadow: syncedActive ? "0 4px 20px rgba(236,72,153,0.38)" : "none",
                  transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {loading ? (
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%",
                    border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "white",
                    animation: "spin 0.7s linear infinite", display: "inline-block",
                  }} />
                ) : syncedActive ? (
                  <>
                    <Zap style={{ width: 18, height: 18 }} />
                    {`Get ${syncedActive.name} — ${priceLabel}`}
                  </>
                ) : (
                  "Select a plan above"
                )}
              </button>
              <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.22)", marginTop: 8 }}>
                🔒 Secure payment via Stripe · Cancel anytime
              </p>
            </div>
          </motion.div>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </AnimatePresence>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 800,
      letterSpacing: "0.12em", textTransform: "uppercase",
      margin: "0 0 8px 4px",
    }}>
      {children}
    </p>
  );
}

interface PlanCardProps {
  feature: PremiumFeature;
  selected: boolean;
  badge?: { label: string; color: string };
  gradient: string;
  icon: React.ReactNode;
  priceLabel: string;
  onSelect: () => void;
}

function PlanCard({ feature, selected, badge, gradient, icon, priceLabel, onSelect }: PlanCardProps) {
  const perks = feature.perks ?? [];

  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      style={{
        width: "100%", textAlign: "left", border: "none", cursor: "pointer",
        borderRadius: 18, padding: "14px 16px",
        background: selected ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
        outline: selected ? `2px solid rgba(236,72,153,0.55)` : "2px solid rgba(255,255,255,0.07)",
        outlineOffset: 0,
        transition: "all 0.18s",
        position: "relative",
      }}
    >
      {/* Badge */}
      {badge && (
        <span style={{
          position: "absolute", top: -1, right: 14,
          background: badge.color, color: "white",
          fontSize: 9, fontWeight: 900, letterSpacing: "0.06em",
          padding: "2px 8px", borderRadius: "0 0 8px 8px",
          textTransform: "uppercase",
        }}>
          {badge.label}
        </span>
      )}

      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Icon bubble */}
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: gradient,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white",
          boxShadow: selected ? `0 2px 14px rgba(236,72,153,0.3)` : "none",
        }}>
          {icon}
        </div>

        {/* Name + desc */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "white", fontWeight: 800, fontSize: 14, margin: 0, lineHeight: 1.2 }}>
            {feature.emoji} {feature.name}
          </p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "2px 0 0", lineHeight: 1.3 }}>
            {feature.description.slice(0, 60)}{feature.description.length > 60 ? "…" : ""}
          </p>
        </div>

        {/* Price + check */}
        <div style={{ flexShrink: 0, textAlign: "right" }}>
          <p style={{ color: "white", fontWeight: 900, fontSize: 15, margin: 0 }}>
            {priceLabel}
          </p>
          {selected && (
            <div style={{
              width: 20, height: 20, borderRadius: "50%",
              background: "linear-gradient(135deg,#ec4899,#a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginLeft: "auto", marginTop: 4,
            }}>
              <Check style={{ width: 11, height: 11, color: "white" }} />
            </div>
          )}
        </div>
      </div>

      {/* Perks — only show when selected */}
      <AnimatePresence>
        {selected && perks.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              marginTop: 12, paddingTop: 12,
              borderTop: "1px solid rgba(255,255,255,0.07)",
              display: "flex", flexDirection: "column", gap: 5,
            }}>
              {perks.map((p, i) => (
                <p key={i} style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, margin: 0, lineHeight: 1.4 }}>
                  {p}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
