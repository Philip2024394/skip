import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Check, MessageCircle, Gift, AlertCircle } from "lucide-react";
import { generateIndonesianProfiles } from "@/data/indonesianProfiles";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface GiftOrder {
  id: string;
  sender_id: string;
  sender_name: string;
  recipient_id: string;
  recipient_name: string;
  recipient_city: string;
  gift_type: string;
  gift_emoji: string;
  fee_usd: number;
  status: "pending_payment" | "confirmed" | "address_released" | "otw" | "delivered";
  created_at: string;
  delivery_eta?: string; // ISO string set by admin
  notes?: string;
}

const GIFT_OPTIONS = [
  { emoji: "💐", label: "Flowers & Bouquet", desc: "Fresh flowers delivered to her door" },
  { emoji: "💍", label: "Jewelry & Accessories", desc: "Earrings, necklace, bracelet — your choice" },
  { emoji: "💆", label: "Spa & Beauty Treatment", desc: "Book a beauty session at a local salon" },
  { emoji: "🧖", label: "Massage & Wellness", desc: "Relaxing massage at a local spa" },
  { emoji: "🍰", label: "Cake & Sweet Treats", desc: "Custom cake or dessert box" },
  { emoji: "🎁", label: "Surprise Gift Box", desc: "Curated Indonesian gift box sent to her" },
];

const ADMIN_WHATSAPP = "6281234567890"; // replace with real admin number

function generateOrderId() {
  return "ORD-" + Math.random().toString(36).toUpperCase().slice(2, 8);
}

// ── Component ─────────────────────────────────────────────────────────────────
export const RealGiftOrderFlow = ({
  onClose,
  currentUserId,
  currentUserName,
}: {
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedGift, setSelectedGift] = useState<typeof GIFT_OPTIONS[number] | null>(null);
  const [recipientIdInput, setRecipientIdInput] = useState("");
  const [recipientProfile, setRecipientProfile] = useState<{ id: string; name: string; city: string; image: string; gift_delivery_opted_in?: boolean } | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [orderId] = useState(generateOrderId);

  // Look up recipient by ID from available profiles (mock + real would check Supabase)
  const handleLookupRecipient = () => {
    setLookupError("");
    const trimmed = recipientIdInput.trim();
    if (!trimmed) { setLookupError("Please enter a profile ID."); return; }

    // Check mock profiles
    const allProfiles = generateIndonesianProfiles();
    const found = allProfiles.find(p => p.id === trimmed);
    if (found) {
      setRecipientProfile({
        id: found.id,
        name: found.name,
        city: found.city,
        image: found.image,
        gift_delivery_opted_in: (found as any).gift_delivery_opted_in ?? true,
      });
      return;
    }

    // Check localStorage for real user profiles
    try {
      const storedProfiles = JSON.parse(localStorage.getItem("app_profiles") || "[]");
      const realFound = storedProfiles.find((p: any) => p.id === trimmed);
      if (realFound) {
        setRecipientProfile({
          id: realFound.id,
          name: realFound.name,
          city: realFound.city,
          image: realFound.image || realFound.avatar_url || "",
          gift_delivery_opted_in: realFound.gift_delivery_opted_in ?? false,
        });
        return;
      }
    } catch { /* ignore */ }

    setLookupError("No profile found with that ID. Ask them to share their profile ID with you.");
  };

  const handleConfirmOrder = () => {
    if (!selectedGift || !recipientProfile) return;
    const order: GiftOrder = {
      id: orderId,
      sender_id: currentUserId,
      sender_name: currentUserName,
      recipient_id: recipientProfile.id,
      recipient_name: recipientProfile.name,
      recipient_city: recipientProfile.city,
      gift_type: selectedGift.label,
      gift_emoji: selectedGift.emoji,
      fee_usd: 9.99,
      status: "pending_payment",
      created_at: new Date().toISOString(),
    };
    // Store in localStorage for sender tracking
    try {
      const existing = JSON.parse(localStorage.getItem("my_gift_orders") || "[]");
      localStorage.setItem("my_gift_orders", JSON.stringify([order, ...existing]));
    } catch { /* ignore */ }
    setStep(4);
  };

  const whatsappMessage = encodeURIComponent(
    `🎁 REAL GIFT ORDER — ${orderId}\n\nSender: ${currentUserName} (ID: ${currentUserId})\nRecipient ID: ${recipientProfile?.id}\nRecipient: ${recipientProfile?.name} — ${recipientProfile?.city}\nGift: ${selectedGift?.emoji} ${selectedGift?.label}\nFee: $9.99 USD\n\nPlease confirm payment received and arrange delivery.`
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: "#0a0a0a" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          {step > 1 && step < 4 && (
            <button onClick={() => setStep((s) => (s - 1) as any)} className="text-white/40 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-white font-bold text-base">Send a Real Gift</h1>
            <p className="text-white/40 text-xs">
              {step === 1 && "Choose what to send"}
              {step === 2 && "Enter recipient profile ID"}
              {step === 3 && "Review your order"}
              {step === 4 && "Order submitted"}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Step indicator */}
      {step < 4 && (
        <div className="flex gap-1.5 px-4 py-3 flex-shrink-0">
          {[1, 2, 3].map(s => (
            <div key={s} className="h-1 flex-1 rounded-full transition-all"
              style={{ background: s <= step ? "#F59E0B" : "rgba(255,255,255,0.1)" }} />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <AnimatePresence mode="wait">

          {/* ─── Step 1: Gift Selection ─── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="pt-4 pb-3 p-3 rounded-2xl mb-4" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <p className="text-amber-300 text-xs leading-relaxed">
                  💡 We coordinate the delivery to protect her privacy. She never shares her address with you — our admin team handles it through verified local service providers.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {GIFT_OPTIONS.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => { setSelectedGift(opt); setStep(2); }}
                    className="rounded-2xl p-4 text-left transition-all active:scale-95"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <div className="text-3xl mb-2">{opt.emoji}</div>
                    <p className="text-white text-sm font-semibold leading-tight mb-1">{opt.label}</p>
                    <p className="text-white/40 text-xs leading-snug">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── Step 2: Recipient ID ─── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="pt-4">
                <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="text-3xl">{selectedGift?.emoji}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{selectedGift?.label}</p>
                    <p className="text-white/40 text-xs">{selectedGift?.desc}</p>
                  </div>
                </div>

                <p className="text-white/60 text-xs mb-2 font-semibold uppercase tracking-wider">Recipient Profile ID</p>
                <p className="text-white/40 text-xs mb-3 leading-relaxed">
                  Ask her to share her Profile ID from her profile settings. This keeps her address private — you never see it.
                </p>

                <div className="flex gap-2 mb-3">
                  <input
                    value={recipientIdInput}
                    onChange={e => { setRecipientIdInput(e.target.value); setLookupError(""); setRecipientProfile(null); }}
                    placeholder="e.g. usr_abc123xyz"
                    className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3 py-3 text-white text-sm placeholder-white/30"
                    onKeyDown={e => e.key === "Enter" && handleLookupRecipient()}
                  />
                  <button
                    onClick={handleLookupRecipient}
                    className="px-4 rounded-xl text-sm font-semibold text-black"
                    style={{ background: "#F59E0B" }}
                  >
                    Find
                  </button>
                </div>

                {lookupError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl mb-3" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-xs">{lookupError}</p>
                  </div>
                )}

                {recipientProfile && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="p-4 rounded-2xl mb-4" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                      <div className="flex items-center gap-3 mb-2">
                        {recipientProfile.image ? (
                          <img src={recipientProfile.image} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg">👤</div>
                        )}
                        <div>
                          <p className="text-white font-semibold text-sm">{recipientProfile.name}</p>
                          <p className="text-white/50 text-xs">{recipientProfile.city}</p>
                        </div>
                        <Check className="w-5 h-5 text-green-400 ml-auto" />
                      </div>
                      {!recipientProfile.gift_delivery_opted_in && (
                        <p className="text-amber-300 text-xs mt-2 leading-relaxed">
                          ⚠️ This profile has not opted in to receive physical gifts. No admin delivery service is available for them. You may still proceed but we cannot guarantee delivery.
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setStep(3)}
                      className="w-full py-3.5 rounded-2xl text-sm font-bold text-black flex items-center justify-center gap-2"
                      style={{ background: "#F59E0B" }}
                    >
                      Continue <ChevronRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── Step 3: Review Order ─── */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="pt-4 space-y-3">
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Order Summary</p>

                {/* Gift */}
                <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedGift?.emoji}</span>
                    <div>
                      <p className="text-white text-sm font-semibold">{selectedGift?.label}</p>
                      <p className="text-white/40 text-xs">Gift type</p>
                    </div>
                  </div>
                </div>

                {/* Recipient */}
                <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center gap-3">
                    {recipientProfile?.image ? (
                      <img src={recipientProfile.image} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">👤</div>
                    )}
                    <div>
                      <p className="text-white text-sm font-semibold">{recipientProfile?.name}</p>
                      <p className="text-white/40 text-xs">{recipientProfile?.city} · ID: {recipientProfile?.id}</p>
                    </div>
                  </div>
                </div>

                {/* Fee breakdown */}
                <div className="p-4 rounded-2xl space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Admin coordination fee</span>
                    <span className="text-white font-semibold">$9.99 USD</span>
                  </div>
                  <div className="flex justify-between text-xs text-white/40">
                    <span>Gift / service cost</span>
                    <span>Paid directly to provider</span>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex justify-between">
                    <span className="text-white/80 text-sm font-semibold">Due now</span>
                    <span className="text-amber-400 font-bold text-sm">$9.99 USD</span>
                  </div>
                </div>

                {/* What happens next */}
                <div className="p-4 rounded-2xl" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                  <p className="text-blue-300 text-xs font-semibold mb-2">What happens next</p>
                  <ol className="text-white/50 text-xs space-y-1.5 list-none">
                    <li>1. Message our admin on WhatsApp with your order reference</li>
                    <li>2. Pay the $9.99 coordination fee via the admin</li>
                    <li>3. Admin contacts the local service provider with her delivery details</li>
                    <li>4. She receives a notification when her gift is on its way</li>
                    <li>5. Her address is never shared with you at any time</li>
                  </ol>
                </div>

                <p className="text-white/20 text-xs text-center">Order ref: {orderId}</p>

                <button
                  onClick={handleConfirmOrder}
                  className="w-full py-4 rounded-2xl text-sm font-bold text-black"
                  style={{ background: "#F59E0B" }}
                >
                  Confirm & Message Admin →
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Step 4: Confirmation ─── */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="pt-8 text-center">
                <div className="text-6xl mb-4">{selectedGift?.emoji}</div>
                <h2 className="text-white font-bold text-xl mb-2">Order Created!</h2>
                <p className="text-white/50 text-sm mb-6 leading-relaxed">
                  Now message our admin on WhatsApp to confirm payment and start the delivery process.
                </p>

                <div className="p-4 rounded-2xl mb-5 text-left space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Order ref</span>
                    <span className="text-white font-mono font-bold">{orderId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Gift</span>
                    <span className="text-white">{selectedGift?.emoji} {selectedGift?.label}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">For</span>
                    <span className="text-white">{recipientProfile?.name} · {recipientProfile?.city}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Fee due</span>
                    <span className="text-amber-400 font-bold">$9.99 USD</span>
                  </div>
                </div>

                <a
                  href={`https://wa.me/${ADMIN_WHATSAPP}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 mb-3"
                  style={{ background: "#22c55e", color: "white", display: "flex", textDecoration: "none" }}
                >
                  <MessageCircle className="w-5 h-5" />
                  Message Admin on WhatsApp
                </a>

                <button onClick={onClose} className="w-full py-3 rounded-2xl text-sm text-white/50 border border-white/10">
                  Done
                </button>

                <p className="text-white/20 text-xs mt-4 leading-relaxed">
                  Her address is never shared with you. Our admin team manages the full coordination with the service provider.
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default RealGiftOrderFlow;
