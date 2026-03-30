import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useCoinBalance } from "@/shared/hooks/useCoinBalance";

// ── Coin packs — IDR primary pricing ──────────────────────────────────────────

interface CoinPack {
  id: string;
  coins: number;
  priceIdr: number;
  priceUsd: number;
  label: string;
  tag?: string;
  emoji: string;
  gradient: string;
  accentColor: string;
  saving?: string;
}

const COIN_PACKS: CoinPack[] = [
  {
    id: "starter",
    coins: 50,
    priceIdr: 19_000,
    priceUsd: 1.18,
    label: "Starter",
    emoji: "⭐",
    gradient: "linear-gradient(135deg,rgba(236,72,153,0.18),rgba(168,85,247,0.12))",
    accentColor: "#ec4899",
  },
  {
    id: "popular",
    coins: 150,
    priceIdr: 49_000,
    priceUsd: 3.04,
    label: "Popular",
    tag: "BEST VALUE",
    emoji: "⚡",
    gradient: "linear-gradient(135deg,rgba(194,24,91,0.22),rgba(236,72,153,0.14))",
    accentColor: "#c2185b",
  },
  {
    id: "value",
    coins: 400,
    priceIdr: 99_000,
    priceUsd: 6.15,
    label: "Value",
    saving: "Save 37%",
    emoji: "✨",
    gradient: "linear-gradient(135deg,rgba(59,130,246,0.18),rgba(99,102,241,0.12))",
    accentColor: "#3b82f6",
  },
  {
    id: "diamond",
    coins: 1_000,
    priceIdr: 199_000,
    priceUsd: 12.35,
    label: "Diamond",
    saving: "Save 48%",
    emoji: "💎",
    gradient: "linear-gradient(135deg,rgba(245,158,11,0.22),rgba(249,115,22,0.14))",
    accentColor: "#f59e0b",
  },
];

const COIN_USES = [
  { emoji: "💘", label: "Blind date instant unlock", cost: 30 },
  { emoji: "🔓", label: "Share WhatsApp / contact",  cost: 20 },
  { emoji: "🚀", label: "Boost blind date profile 24h", cost: 40 },
  { emoji: "💔", label: "Unlock after failed quiz",  cost: 50 },
];

function formatIdr(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

// ── CoinShop ──────────────────────────────────────────────────────────────────

interface CoinShopProps {
  userId: string;
  onClose: () => void;
}

export default function CoinShop({ userId, onClose }: CoinShopProps) {
  const { balance, refetch } = useCoinBalance(userId);
  const [selected, setSelected]   = useState<CoinPack | null>(null);
  const [buying, setBuying]       = useState(false);
  const [justBought, setJustBought] = useState<CoinPack | null>(null);

  const handleBuy = async (pack: CoinPack) => {
    if (buying) return;
    setBuying(true);
    try {
      const { data, error } = await supabase.rpc("purchase_coins" as any, {
        p_user_id:    userId,
        p_coins:      pack.coins,
        p_price_idr:  pack.priceIdr,
        p_pack_label: pack.label,
      });
      if (error) throw error;
      await refetch();
      setJustBought(pack);
      setSelected(null);
      // Reset celebration after 3s
      setTimeout(() => setJustBought(null), 3000);
    } catch (err) {
      console.error("purchase_coins error:", err);
    } finally {
      setBuying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9800,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "flex-end",
        padding: `0 0 max(20px,env(safe-area-inset-bottom,20px))`,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        style={{
          width: "100%", maxWidth: 480,
          background: "rgba(8,8,16,0.99)",
          border: "1.5px solid rgba(245,158,11,0.2)",
          borderRadius: "28px 28px 20px 20px",
          overflow: "hidden",
          boxShadow: "0 0 60px rgba(245,158,11,0.1), 0 -24px 48px rgba(0,0,0,0.6)",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        {/* ── Hero header ──────────────────────────────────────────────── */}
        <div style={{
          padding: "24px 20px 16px",
          background: "linear-gradient(180deg,rgba(245,158,11,0.08) 0%,transparent 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          position: "relative",
        }}>
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 20, right: 20,
              width: 30, height: 30, borderRadius: "50%",
              background: "rgba(255,255,255,0.07)", border: "none",
              color: "rgba(255,255,255,0.4)", fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >×</button>

          <div style={{ fontSize: 32, marginBottom: 6 }}>🪙</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "white", letterSpacing: "-0.01em" }}>
            Top Up Coins
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
            Earn coins free by being active — or top up instantly
          </div>

          {/* Balance pill */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            marginTop: 12,
            background: "rgba(245,158,11,0.12)",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 20, padding: "6px 14px",
          }}>
            <span style={{ fontSize: 16 }}>🪙</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#f59e0b" }}>
              {balance} coins
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>current balance</span>
          </div>
        </div>

        {/* ── Celebration overlay ───────────────────────────────────────── */}
        <AnimatePresence>
          {justBought && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                margin: "16px 20px 0",
                background: "linear-gradient(135deg,rgba(34,197,94,0.15),rgba(16,185,129,0.1))",
                border: "1.5px solid rgba(34,197,94,0.4)",
                borderRadius: 16, padding: "14px 18px",
                display: "flex", alignItems: "center", gap: 12,
              }}
            >
              <span style={{ fontSize: 28 }}>🎉</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#4ade80" }}>
                  +{justBought.coins} coins added!
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                  {justBought.label} pack · {formatIdr(justBought.priceIdr)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Packs grid ───────────────────────────────────────────────── */}
        <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {COIN_PACKS.map(pack => (
            <motion.button
              key={pack.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelected(pack)}
              style={{
                background: selected?.id === pack.id ? pack.gradient.replace(/0\.\d\d\)/g, "0.35)") : pack.gradient,
                border: `1.5px solid ${selected?.id === pack.id ? pack.accentColor + "88" : pack.accentColor + "33"}`,
                borderRadius: 18, padding: "16px 14px",
                cursor: "pointer", textAlign: "left", position: "relative",
                transition: "all 0.18s",
                boxShadow: selected?.id === pack.id ? `0 0 20px ${pack.accentColor}22` : "none",
              }}
            >
              {/* Tag badge */}
              {pack.tag && (
                <div style={{
                  position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
                  background: pack.accentColor, color: "white",
                  fontSize: 9, fontWeight: 800, letterSpacing: "0.06em",
                  padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap",
                }}>
                  {pack.tag}
                </div>
              )}
              {pack.saving && (
                <div style={{
                  position: "absolute", top: 8, right: 8,
                  background: "rgba(34,197,94,0.2)", color: "#4ade80",
                  fontSize: 9, fontWeight: 700,
                  padding: "2px 6px", borderRadius: 10,
                }}>
                  {pack.saving}
                </div>
              )}

              <div style={{ fontSize: 22, marginBottom: 6 }}>{pack.emoji}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "white", lineHeight: 1 }}>
                {pack.coins.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2, marginBottom: 10 }}>
                coins
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: pack.accentColor }}>
                {formatIdr(pack.priceIdr)}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>
                ~${pack.priceUsd.toFixed(2)} USD
              </div>
            </motion.button>
          ))}
        </div>

        {/* ── Confirm button (appears when pack selected) ───────────────── */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              style={{ padding: "0 20px 8px" }}
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => handleBuy(selected)}
                disabled={buying}
                style={{
                  width: "100%", padding: "15px", borderRadius: 50, border: "none",
                  background: `linear-gradient(135deg,${selected.accentColor},${selected.accentColor}cc)`,
                  color: "white", fontSize: 16, fontWeight: 800,
                  cursor: buying ? "not-allowed" : "pointer", opacity: buying ? 0.7 : 1,
                  boxShadow: `0 6px 28px ${selected.accentColor}44`,
                  letterSpacing: "-0.01em",
                }}
              >
                {buying
                  ? "Processing…"
                  : `Buy ${selected.coins.toLocaleString()} coins · ${formatIdr(selected.priceIdr)}`}
              </motion.button>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", margin: "8px 0 0" }}>
                Coins are added instantly · No subscription
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── What coins unlock ─────────────────────────────────────────── */}
        <div style={{
          margin: "8px 20px 20px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: "14px 16px",
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10,
          }}>
            What coins unlock
          </div>
          {COIN_USES.map(use => (
            <div key={use.label} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "7px 0",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{use.emoji}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{use.label}</span>
              </div>
              <div style={{
                fontSize: 11, fontWeight: 800, color: "#f59e0b",
                background: "rgba(245,158,11,0.1)", borderRadius: 20,
                padding: "2px 8px", border: "1px solid rgba(245,158,11,0.2)",
              }}>
                {use.cost} 🪙
              </div>
            </div>
          ))}
          {/* Free earn reminder */}
          <div style={{
            marginTop: 12, padding: "10px 12px",
            background: "rgba(34,197,94,0.07)", borderRadius: 10,
            border: "1px solid rgba(34,197,94,0.15)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 14 }}>🎁</span>
            <span style={{ fontSize: 11, color: "rgba(134,239,172,0.8)", lineHeight: 1.4 }}>
              Earn free coins daily — +2 per like, +5 per match, up to 20/day
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
