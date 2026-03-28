import { motion, AnimatePresence } from "framer-motion";
import { Globe, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { PREMIUM_FEATURES } from "@/data/premiumFeatures";

interface GlobalDatingUpsellProps {
  open: boolean;
  targetName?: string;
  targetCountry?: string;
  onClose: () => void;
}

const GLOBAL_FEATURE = PREMIUM_FEATURES.find(f => f.id === "global_dating")!;

export default function GlobalDatingUpsell({ open, targetName, targetCountry, onClose }: GlobalDatingUpsellProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sign in to subscribe"); setLoading(false); return; }

      const res = await supabase.functions.invoke("purchase-subscription", {
        body: { priceId: GLOBAL_FEATURE.priceId, featureId: "global_dating" },
      });

      if (res.error) throw new Error(res.error.message);
      const url = res.data?.url;
      if (url) window.location.href = url;
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99998] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-x-4 bottom-8 z-[99999] max-w-sm mx-auto"
          >
            <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ background: "rgba(8,8,16,0.97)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {/* Top gradient bar */}
              <div style={{ height: 3, background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)" }} />

              <div className="p-6">
                {/* Close */}
                <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors">
                  <X className="w-5 h-5" />
                </button>

                {/* Globe icon */}
                <div className="flex flex-col items-center text-center mb-5">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                    style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))", border: "1.5px solid rgba(139,92,246,0.4)" }}
                  >
                    <Globe className="w-8 h-8 text-violet-400" />
                  </div>

                  <h2 className="text-white font-bold text-xl leading-tight">
                    {targetName
                      ? <>Like {targetName.split(" ")[0]} from {targetCountry} 🌍</>
                      : <>Connect Worldwide 🌍</>
                    }
                  </h2>
                  <p className="text-white/50 text-sm mt-2 leading-relaxed">
                    {targetName
                      ? `${targetName.split(" ")[0]} is from ${targetCountry}. Upgrade to like and match with anyone worldwide.`
                      : "Like and match with people from any country — just like they're next door."
                    }
                  </p>
                </div>

                {/* Perks */}
                <div
                  className="rounded-2xl p-4 mb-5 space-y-2"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <p className="text-white/60 text-[11px] font-bold uppercase tracking-wider mb-3">What you get</p>
                  {[
                    "🌍 Like & match with users from any country",
                    "💬 Unlock contacts worldwide, not just locally",
                    "✈️ Perfect for travel, expats & international love",
                    "🔄 Cancel anytime — month-to-month",
                    "📍 Your local feed still works as normal",
                  ].map((perk, i) => (
                    <p key={i} className="text-white/75 text-[12px]">{perk}</p>
                  ))}
                </div>

                {/* Subscribe CTA */}
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl font-black text-white text-[15px] transition-opacity disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)" }}
                >
                  {loading ? "Redirecting…" : "Unlock Global Dating — $6.99/mo"}
                </button>

                <p className="text-white/25 text-[10px] text-center mt-3">
                  Billed monthly · Cancel anytime in Settings
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
