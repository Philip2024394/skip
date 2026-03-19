// /c/Users/Victus/skip-1/src/features/gifts/components/DiamondConnectionFlow.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Video, ChevronRight, X, Shield, Heart, Check, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DiamondConnectionFlowProps {
  matchedProfileId: string;
  matchedProfileName: string;
  matchedContactPref?: "whatsapp" | "video" | "both";
  onClose: () => void;
}

const WHATSAPP_PACKAGES = [
  { id: "wa_single", label: "Single Connect", price: "$2.99", desc: "1 WhatsApp connection", icon: "📱" },
  { id: "wa_pack3", label: "3 Connections", price: "$6.99", desc: "Connect with 3 profiles", icon: "📲", popular: true },
  { id: "wa_pack10", label: "10 Connections", price: "$16.99", desc: "Best value package", icon: "🚀" },
];

const VIDEO_PACKAGES = [
  { id: "vid_single", label: "Single Call", price: "$3.99", desc: "1 video call session", icon: "📹" },
  { id: "vid_pack3", label: "3 Video Calls", price: "$8.99", desc: "3 video call sessions", icon: "🎥", popular: true },
  { id: "vid_pack10", label: "10 Video Calls", price: "$19.99", desc: "Unlimited feel package", icon: "🌟" },
];

function SafetyAdvicePopup({ profileName, onClose }: { profileName: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 flex items-center justify-center z-[70] p-4"
      style={{ background: "rgba(0,0,0,0.52)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="max-w-sm w-full p-6 overflow-hidden"
        style={{ background: "rgba(12,12,18,0.72)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", borderRadius: 28, border: "1px solid rgba(255,255,255,0.10)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-yellow-400" />
          <h3 className="text-white font-bold text-lg">Safety Reminder</h3>
        </div>
        <div className="space-y-3 mb-5">
          {[
            "Get to know each other through the app first before sharing contact details",
            "Never share your home address, workplace, or financial information early on",
            "Trust your instincts — if something feels off, it probably is",
            "Report any suspicious behaviour to our support team",
            "Meet in public places for your first in-person date",
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              <p className="text-white/70 text-sm">{tip}</p>
            </div>
          ))}
        </div>
        <Button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-yellow-500/80 to-amber-500/80 hover:from-yellow-500 hover:to-amber-500 text-black font-bold h-11"
        >
          I Understand — Let's Connect!
        </Button>
      </motion.div>
    </motion.div>
  );
}

function ConnectionGrantedNotice({ profileName, type, onClose }: { profileName: string; type: "whatsapp" | "video"; onClose: () => void }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.8, repeat: 2 }}
        className="text-6xl mb-4"
      >
        {type === "whatsapp" ? "📱" : "📹"}
      </motion.div>
      <h3 className="text-white text-2xl font-black mb-2">Connection Granted!</h3>
      <p className="text-white/70 text-sm mb-1">
        <span className="text-pink-300 font-semibold">{profileName}</span> will be notified
      </p>
      <p className="text-white/50 text-xs mb-6">
        Once they confirm, your {type === "whatsapp" ? "WhatsApp" : "video call"} details will be shared
      </p>
      <Button onClick={onClose} className="w-full text-white font-bold h-11 border-0" style={{ background: "linear-gradient(135deg, #ec4899, #f472b6)" }}>
        <Heart className="w-4 h-4 mr-2" /> Done
      </Button>
    </motion.div>
  );
}

export default function DiamondConnectionFlow({
  matchedProfileId,
  matchedProfileName,
  matchedContactPref = "whatsapp",
  onClose,
}: DiamondConnectionFlowProps) {
  const [selectedType, setSelectedType] = useState<"whatsapp" | "video" | null>(
    matchedContactPref === "video" ? "video" : matchedContactPref === "both" ? null : "whatsapp"
  );
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [purchaseType, setPurchaseType] = useState<"whatsapp" | "video">("whatsapp");

  const packages = selectedType === "video" ? VIDEO_PACKAGES : WHATSAPP_PACKAGES;

  const handlePurchase = async () => {
    if (!selectedPackage || !selectedType) return;
    setIsPurchasing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please sign in"); return; }

      // Record connection purchase
      await (supabase as any).from("connections").insert({
        requester_id: user.id,
        requested_id: matchedProfileId,
        connection_type: selectedType,
        package_id: selectedPackage,
        status: "pending",
        created_at: new Date().toISOString(),
      }).then(() => {});

      setPurchaseType(selectedType);
      setPurchased(true);

      // Show safety advice for WhatsApp connections
      if (selectedType === "whatsapp") {
        setTimeout(() => setShowSafety(true), 1800);
      }
    } catch (e) {
      // Proceed with optimistic UX
      setPurchaseType(selectedType);
      setPurchased(true);
      if (selectedType === "whatsapp") setTimeout(() => setShowSafety(true), 1800);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 flex items-center justify-center z-[60] p-4"
        style={{ background: "rgba(0,0,0,0.52)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        <motion.div
          initial={{ scale: 0.92, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          className="max-w-sm w-full overflow-hidden"
          style={{ background: "rgba(12,12,18,0.72)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", borderRadius: 28, border: "1px solid rgba(255,255,255,0.10)" }}
        >
          <div style={{ height: 4, background: "linear-gradient(90deg, #ec4899, #f472b6, #ec4899)" }} />

          <div className="p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-black text-xl">💎 Connect</h3>
                <p className="text-white/50 text-xs">with {matchedProfileName}</p>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {purchased ? (
                <motion.div key="granted" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <ConnectionGrantedNotice profileName={matchedProfileName} type={purchaseType} onClose={onClose} />
                </motion.div>
              ) : (
                <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {/* Connection type selector — show only if "both" preference */}
                  {matchedContactPref === "both" && (
                    <div className="flex gap-2">
                      {(["whatsapp", "video"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => { setSelectedType(t); setSelectedPackage(null); }}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                            selectedType === t
                              ? "bg-pink-500/20 border-pink-400/50 text-white"
                              : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                          }`}
                        >
                          {t === "whatsapp" ? <MessageCircle className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                          {t === "whatsapp" ? "WhatsApp" : "Video"}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Single type label when not "both" */}
                  {matchedContactPref !== "both" && (
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                      {selectedType === "video" ? (
                        <Video className="w-4 h-4 text-pink-400" />
                      ) : (
                        <MessageCircle className="w-4 h-4 text-green-400" />
                      )}
                      <span className="text-white/70 text-sm">
                        {matchedProfileName} prefers{" "}
                        <span className="text-white font-medium">
                          {selectedType === "video" ? "Video Call" : "WhatsApp"}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Packages */}
                  <div className="space-y-2">
                    {packages.map((pkg) => (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg.id)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all ${
                          selectedPackage === pkg.id
                            ? "bg-pink-500/20 border-pink-400/50"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <span className="text-2xl">{pkg.icon}</span>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm font-semibold">{pkg.label}</span>
                            {pkg.popular && (
                              <span className="px-1.5 py-0.5 bg-pink-500/30 border border-pink-400/40 rounded text-[9px] text-pink-300 font-bold uppercase tracking-wider">Popular</span>
                            )}
                          </div>
                          <span className="text-white/50 text-xs">{pkg.desc}</span>
                        </div>
                        <span className="text-white font-bold text-sm">{pkg.price}</span>
                        <ChevronRight className={`w-4 h-4 transition-colors ${selectedPackage === pkg.id ? "text-pink-400" : "text-white/20"}`} />
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={handlePurchase}
                    disabled={!selectedPackage || isPurchasing}
                    className="w-full text-white font-bold h-12 disabled:opacity-40 border-0"
                    style={{ background: "linear-gradient(135deg, #ec4899, #f472b6)", boxShadow: "0 4px 20px rgba(236,72,153,0.4)" }}
                  >
                    {isPurchasing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                    ) : (
                      <>💎 Purchase & Connect</>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {showSafety && (
        <SafetyAdvicePopup
          profileName={matchedProfileName}
          onClose={() => { setShowSafety(false); onClose(); }}
        />
      )}
    </>
  );
}
