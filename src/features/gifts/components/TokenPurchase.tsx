import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/shared/components/button";
import { X, Coins, Sparkles, Zap, Crown, Star } from "lucide-react";

interface TokenPackage {
  tokens: number;
  price: number;
  priceId: string;
  label: string;
  desc: string;
  icon: "star" | "zap" | "sparkles" | "crown";
  popular?: boolean;
  gradient: string;
}

const TOKEN_PACKAGES: TokenPackage[] = [
  { tokens: 5, price: 1.25, priceId: "price_5_tokens", label: "Starter", desc: "Try it out", icon: "star", gradient: "from-pink-500/15 to-pink-700/5" },
  { tokens: 15, price: 3.25, priceId: "price_15_tokens", label: "Popular", desc: "Most chosen", icon: "zap", popular: true, gradient: "from-pink-500/20 to-pink-700/10" },
  { tokens: 35, price: 6.50, priceId: "price_35_tokens", label: "Value", desc: "Save 26%", icon: "sparkles", gradient: "from-blue-500/15 to-cyan-600/10" },
  { tokens: 75, price: 12.50, priceId: "price_75_tokens", label: "Diamond", desc: "Save 33%", icon: "crown", gradient: "from-amber-400/20 to-yellow-600/10" },
];

const ICON_MAP = { star: Star, zap: Zap, sparkles: Sparkles, crown: Crown };

interface TokenPurchaseProps {
  onClose: () => void;
  onPurchaseSuccess: () => void;
}

export default function TokenPurchase({ onClose, onPurchaseSuccess }: TokenPurchaseProps) {
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async (pkg: TokenPackage) => {
    setIsProcessing(true);
    setSelectedPackage(pkg);

    try {
      const { data, error } = await supabase.functions.invoke("purchase-tokens", {
        body: {
          tokens: pkg.tokens,
          priceId: pkg.priceId,
          price: pkg.price,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");

        const checkPayment = async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: tokens } = await (supabase as any)
              .from("user_wallets")
              .select("current_balance")
              .eq("user_id", user.id)
              .single();

            if (tokens && tokens.current_balance >= pkg.tokens) {
              onPurchaseSuccess();
              onClose();
            } else {
              setTimeout(checkPayment, 2000);
            }
          } catch (error) {
            console.error("Error checking payment:", error);
          }
        };

        setTimeout(checkPayment, 2000);
      }
    } catch (error) {
      console.error("Error initiating purchase:", error);
      setIsProcessing(false);
      setSelectedPackage(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.52)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        style={{
          background: "rgba(12,12,18,0.72)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          borderRadius: 28,
          border: "1px solid rgba(255,255,255,0.10)",
          maxWidth: 420, width: "100%",
          overflow: "hidden",
        }}
      >
        {/* Pink top bar */}
        <div style={{ height: 4, background: "linear-gradient(90deg, #ec4899, #f472b6, #ec4899)" }} />

        {/* Header */}
        <div className="relative px-6 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-[0_0_16px_rgba(250,204,21,0.3)]">
                <Coins className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="text-white text-lg font-bold">Refuel Coins</h3>
                <p className="text-white/40 text-[10px]">Coins never expire</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Package cards */}
        <div className="px-4 pb-4 space-y-2.5">
          {TOKEN_PACKAGES.map((pkg, i) => {
            const Icon = ICON_MAP[pkg.icon];
            const isSelected = selectedPackage?.tokens === pkg.tokens;

            return (
              <motion.div
                key={pkg.tokens}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`
                  relative bg-gradient-to-r ${pkg.gradient} border rounded-2xl p-3.5 cursor-pointer transition-all duration-200
                  ${isSelected ? "border-yellow-400/50 ring-1 ring-yellow-400/20" : "border-white/10 hover:border-white/25"}
                  ${isProcessing && !isSelected ? "opacity-50 pointer-events-none" : ""}
                `}
                onClick={() => !isProcessing && handlePurchase(pkg)}
              >
                {pkg.popular && (
                  <div className="absolute -top-2 right-4 px-2 py-0.5 bg-gradient-to-r from-pink-500 to-pink-400 rounded-full text-[9px] font-bold text-white shadow-lg">
                    POPULAR
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${pkg.icon === "crown" ? "text-yellow-400" : pkg.icon === "sparkles" ? "text-pink-300" : pkg.icon === "zap" ? "text-pink-400" : "text-pink-400"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-bold text-sm">{pkg.tokens}</span>
                        <Coins className="w-3.5 h-3.5 text-yellow-400" />
                      </div>
                      <span className="text-white/50 text-[10px]">{pkg.desc}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-white font-bold">${pkg.price.toFixed(2)}</p>
                    <p className="text-green-400/80 text-[10px] font-medium">
                      ${(pkg.price / pkg.tokens).toFixed(2)}/coin
                    </p>
                  </div>
                </div>

                {isProcessing && isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="mt-2 bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-3 py-1.5"
                  >
                    <p className="text-yellow-300 text-xs text-center animate-pulse">Opening payment...</p>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-1 text-center">
          <p className="text-white/30 text-[10px]">
            Secure payment via Stripe. Coins added instantly.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
