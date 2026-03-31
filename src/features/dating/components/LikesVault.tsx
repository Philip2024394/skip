import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, Heart, Zap } from "lucide-react";
import { useLikesVault, VaultEntry } from "@/shared/hooks/useLikesVault";
import { useCoinBalance } from "@/shared/hooks/useCoinBalance";
import { toast } from "sonner";

// ── Blurred avatar ─────────────────────────────────────────────────────────────
const BlurredCard = ({ entry, onReveal, revealing }: {
  entry: VaultEntry;
  onReveal: (id: string) => void;
  revealing: boolean;
}) => {
  const img = entry.avatar_url ??
    (Array.isArray(entry.images) && entry.images.length > 0 ? entry.images[0] : undefined) ??
    "/placeholder.svg";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ position: "relative", borderRadius: 14, overflow: "hidden", aspectRatio: "3/4", background: "#111", flexShrink: 0, cursor: "pointer" }}
      onClick={() => onReveal(entry.id)}
    >
      {/* Blurred image */}
      <img
        src={img}
        alt="Someone liked you"
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(18px) brightness(0.6) saturate(0.4)", transform: "scale(1.08)" }}
      />
      {/* Lock overlay */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(0,0,0,0.25)" }}>
        <motion.div
          animate={revealing ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : {}}
          transition={{ repeat: Infinity, duration: 0.6 }}
          style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(251,191,36,0.2)", border: "2px solid rgba(251,191,36,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {revealing ? <Zap size={20} color="#fbbf24" fill="#fbbf24" /> : <Lock size={18} color="#fbbf24" />}
        </motion.div>
        <div style={{ textAlign: "center", padding: "0 8px" }}>
          <p style={{ color: "white", fontSize: 11, fontWeight: 800, margin: 0 }}>Someone liked you!</p>
          <p style={{ color: "rgba(251,191,36,0.9)", fontSize: 9, fontWeight: 700, margin: "2px 0 0" }}>
            {revealing ? "Revealing…" : "Tap — 10 coins"}
          </p>
        </div>
      </div>
      {/* Heart badge top-right */}
      <div style={{ position: "absolute", top: 7, right: 7, width: 22, height: 22, borderRadius: "50%", background: "rgba(239,68,68,0.85)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 10px rgba(239,68,68,0.6)" }}>
        <Heart size={11} color="#fff" fill="#fff" />
      </div>
    </motion.div>
  );
};

// ── Revealed card ──────────────────────────────────────────────────────────────
const RevealedCard = ({ entry, onSelect }: { entry: VaultEntry; onSelect: (e: VaultEntry) => void }) => {
  const img = entry.avatar_url ??
    (Array.isArray(entry.images) && entry.images.length > 0 ? entry.images[0] : undefined) ??
    "/placeholder.svg";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      style={{ position: "relative", borderRadius: 14, overflow: "hidden", aspectRatio: "3/4", background: "#111", flexShrink: 0, cursor: "pointer", border: "2px solid rgba(239,68,68,0.7)", boxShadow: "0 0 14px rgba(239,68,68,0.35)" }}
      onClick={() => onSelect(entry)}
    >
      <img src={img} alt={entry.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0%" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)", padding: "24px 8px 8px" }}>
        <p style={{ color: "white", fontWeight: 800, fontSize: 11, margin: 0 }}>{(entry.name || "").split(" ")[0]}, {entry.age}</p>
        {entry.city && <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, margin: "1px 0 0" }}>{entry.city}</p>}
      </div>
      {entry.is_verified && (
        <div style={{ position: "absolute", top: 7, left: 7, width: 18, height: 18, borderRadius: "50%", background: "rgba(250,204,21,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 9 }}>✓</span>
        </div>
      )}
      <div style={{ position: "absolute", top: 7, right: 7, width: 22, height: 22, borderRadius: "50%", background: "rgba(239,68,68,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Heart size={11} color="#fff" fill="#fff" />
      </div>
    </motion.div>
  );
};

// ── Main LikesVault ────────────────────────────────────────────────────────────
interface Props {
  userId: string;
  likedMeProfiles: any[];
  onSelectProfile: (profile: any) => void;
  onBuyCoins: () => void;
}

export default function LikesVault({ userId, likedMeProfiles, onSelectProfile, onBuyCoins }: Props) {
  const { vault, hiddenCount, totalCount, revealOne, revealAll, revealing } = useLikesVault(userId, likedMeProfiles);
  const { balance } = useCoinBalance(userId);
  const [revealingAll, setRevealingAll] = useState(false);

  if (totalCount === 0) return null;

  const bulkCost = Math.round(hiddenCount * 8);
  const canAffordOne = balance >= 10;
  const canAffordAll = balance >= bulkCost;

  const handleRevealOne = async (id: string) => {
    if (!canAffordOne) { onBuyCoins(); return; }
    const result = await revealOne(id);
    if (result.success) {
      toast.success("Profile revealed! 🔥", { description: "10 coins spent" });
    } else if (result.reason === "insufficient_coins") {
      onBuyCoins();
    } else {
      toast.error("Could not reveal — try again");
    }
  };

  const handleRevealAll = async () => {
    if (!canAffordAll) { onBuyCoins(); return; }
    setRevealingAll(true);
    const result = await revealAll();
    setRevealingAll(false);
    if (result.success) {
      toast.success(`All ${totalCount} profiles revealed! 🎉`, { description: `${result.total_cost} coins spent` });
    } else {
      onBuyCoins();
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(239,68,68,0.2)", border: "1.5px solid rgba(239,68,68,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Heart size={13} color="#ef4444" fill="#ef4444" />
          </div>
          <div>
            <p style={{ margin: 0, color: "white", fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>
              {totalCount} {totalCount === 1 ? "person" : "people"} liked you
            </p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 10 }}>
              {hiddenCount > 0 ? `${hiddenCount} hidden — tap to reveal` : "All revealed ✓"}
            </p>
          </div>
        </div>

        {/* Reveal All button */}
        {hiddenCount > 1 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRevealAll}
            disabled={revealingAll}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "6px 12px", borderRadius: 20,
              background: canAffordAll ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.06)",
              border: `1.5px solid ${canAffordAll ? "rgba(251,191,36,0.55)" : "rgba(255,255,255,0.12)"}`,
              color: canAffordAll ? "#fbbf24" : "rgba(255,255,255,0.3)",
              fontSize: 10, fontWeight: 800, cursor: "pointer",
            }}
          >
            <Eye size={11} />
            {revealingAll ? "Revealing…" : `Reveal all · ${bulkCost}🪙`}
          </motion.button>
        )}
      </div>

      {/* Coin balance indicator */}
      {hiddenCount > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, padding: "6px 10px", borderRadius: 10, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.15)" }}>
          <span style={{ fontSize: 13 }}>🪙</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
            You have <strong style={{ color: "#fbbf24" }}>{balance} coins</strong>
            {" "}{balance < 10 ? "— buy more to reveal" : `— can reveal ${Math.floor(balance / 10)} profile${Math.floor(balance / 10) !== 1 ? "s" : ""}`}
          </span>
          {balance < 10 && (
            <button onClick={onBuyCoins} style={{ marginLeft: "auto", padding: "3px 10px", borderRadius: 12, background: "rgba(251,191,36,0.25)", border: "1px solid rgba(251,191,36,0.5)", color: "#fbbf24", fontSize: 10, fontWeight: 800, cursor: "pointer" }}>
              Get Coins
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
        <AnimatePresence>
          {vault.map((entry) =>
            entry.revealed ? (
              <RevealedCard key={entry.id} entry={entry} onSelect={onSelectProfile} />
            ) : (
              <BlurredCard key={entry.id} entry={entry} onReveal={handleRevealOne} revealing={revealing === entry.id} />
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
